import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

type Partitura = {
  id: string;
  tipo: 'PDF' | 'IMAGEM' | 'MIDI' | 'MUSICXML';
  instrumento: string;
  tom?: string | null;
  versao?: string | null;
  tamanho?: number | null;
  mime?: string | null;
  createdAt: string;
};

export default function Partituras() {
  const { slug, musicaId } = useParams();
  const grupo = getGrupoAtivo();

  const [itens, setItens] = useState<Partitura[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [instrumento, setInstrumento] = useState('Geral');
  const [tom, setTom] = useState('');
  const [versao, setVersao] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const podeEditar =
    grupo?.papel === 'RESPONSAVEL' || grupo?.papel === 'COORDENADOR';

  if (!grupo || grupo.slug !== slug || !musicaId) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;

  function detectarTipo(file: File): Partitura['tipo'] {
    const nome = file.name.toLowerCase();

    if (file.type === 'application/pdf' || nome.endsWith('.pdf')) return 'PDF';
    if (file.type.startsWith('image/')) return 'IMAGEM';
    if (nome.endsWith('.mid') || nome.endsWith('.midi')) return 'MIDI';
    return 'MUSICXML';
  }

  async function carregar() {
    setCarregando(true);
    setErro('');

    try {
      const data = await api(
        `/grupos/${grupoId}/musicas/${musicaId}/partituras`
      );
      setItens(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar partituras.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function enviar(e: FormEvent) {
    e.preventDefault();

    if (!arquivo) {
      setErro('Selecione um arquivo.');
      return;
    }

    if (arquivo.size > 25 * 1024 * 1024) {
      setErro('O arquivo deve ter no máximo 25 MB.');
      return;
    }

    setEnviando(true);
    setErro('');
    setMensagem('');

    try {
      const tipo = detectarTipo(arquivo);
      const mime = arquivo.type || 'application/octet-stream';

      const presign = await api(
        `/grupos/${grupoId}/musicas/${musicaId}/partituras/presign`,
        {
          method: 'POST',
          body: JSON.stringify({
            nomeArquivo: arquivo.name,
            mime,
            tamanho: arquivo.size,
            tipo
          })
        }
      );

      const upload = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': mime
        },
        body: arquivo
      });

      if (!upload.ok) {
        throw new Error(
          `Falha ao enviar arquivo ao Cloudflare R2 (${upload.status}).`
        );
      }

      await api(
        `/grupos/${grupoId}/musicas/${musicaId}/partituras`,
        {
          method: 'POST',
          body: JSON.stringify({
            arquivoKey: presign.key,
            tipo,
            instrumento,
            tom: tom || null,
            versao: versao || null,
            tamanho: arquivo.size,
            mime
          })
        }
      );

      setArquivo(null);
      setInstrumento('Geral');
      setTom('');
      setVersao('');
      setMensagem('Partitura enviada com sucesso.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao enviar partitura.');
    } finally {
      setEnviando(false);
    }
  }

  async function abrir(item: Partitura) {
    try {
      const data = await api(
        `/grupos/${grupoId}/partituras/${item.id}/url`
      );

      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao abrir partitura.');
    }
  }

  async function excluir(item: Partitura) {
    if (!window.confirm('Excluir esta partitura?')) return;

    try {
      await api(
        `/grupos/${grupoId}/partituras/${item.id}`,
        { method: 'DELETE' }
      );

      setMensagem('Partitura excluída.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir partitura.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to={`/g/${grupo.slug}/musicas`}
          className="text-sm font-semibold text-violet-700"
        >
          Voltar para músicas
        </Link>

        <div className="mt-5 mb-7">
          <h1 className="text-3xl font-bold text-slate-900">
            Partituras e arquivos
          </h1>
          <p className="mt-2 text-slate-500">
            PDFs, imagens, MIDI e MusicXML ficam armazenados no Cloudflare R2.
          </p>
        </div>

        {podeEditar && (
          <form
            onSubmit={enviar}
            className="bg-white rounded-3xl border border-slate-200 p-6 mb-7"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block md:col-span-2">
                <span className="block text-sm font-medium mb-2">
                  Arquivo
                </span>
                <input
                  type="file"
                  accept=".pdf,image/*,.mid,.midi,.musicxml,.xml"
                  onChange={e => setArquivo(e.target.files?.[0] || null)}
                  className="block w-full text-sm"
                />
                <span className="block mt-2 text-xs text-slate-400">
                  Máximo de 25 MB por arquivo.
                </span>
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">
                  Instrumento / voz
                </span>
                <input
                  value={instrumento}
                  onChange={e => setInstrumento(e.target.value)}
                  placeholder="Geral, Violão, Teclado, Voz..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">
                  Tom
                </span>
                <input
                  value={tom}
                  onChange={e => setTom(e.target.value)}
                  placeholder="Ex.: G"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">
                  Versão
                </span>
                <input
                  value={versao}
                  onChange={e => setVersao(e.target.value)}
                  placeholder="Ex.: Banda completa"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>
            </div>

            <button
              disabled={enviando}
              className="mt-5 rounded-xl bg-violet-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
            >
              {enviando ? 'Enviando...' : 'Enviar partitura'}
            </button>
          </form>
        )}

        {erro && (
          <div className="mb-5 rounded-xl bg-red-50 text-red-700 p-4">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-5 rounded-xl bg-emerald-50 text-emerald-700 p-4">
            {mensagem}
          </div>
        )}

        {carregando ? (
          <div className="text-slate-500">Carregando arquivos...</div>
        ) : itens.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhuma partitura enviada para esta música.
          </div>
        ) : (
          <div className="space-y-3">
            {itens.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    {item.instrumento}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {item.tipo}
                    {item.tom ? ` · Tom ${item.tom}` : ''}
                    {item.versao ? ` · ${item.versao}` : ''}
                  </div>
                  {item.tamanho && (
                    <div className="text-xs text-slate-400 mt-1">
                      {(item.tamanho / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => abrir(item)}
                    className="text-sm font-semibold text-violet-700"
                  >
                    Abrir
                  </button>

                  {podeEditar && (
                    <button
                      onClick={() => excluir(item)}
                      className="text-sm font-semibold text-red-600"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
