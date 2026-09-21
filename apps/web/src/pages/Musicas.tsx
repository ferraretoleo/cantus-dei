import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import AbcScore from '../components/AbcScore';
import { api } from '../lib/api';

type Musica = {
  id: string;
  titulo: string;
  autorCompositor?: string | null;
  tomOriginal?: string | null;
  andamentoBpm?: number | null;
  tempoCompasso?: string | null;
  letra?: string | null;
  cifra?: string | null;
  notacaoAbc?: string | null;
  videoUrl?: string | null;
  tags?: string[] | null;
  observacoes?: string | null;
  compartilhada: boolean;
};

const exemploAbc = `X:1
T:Exemplo de Partitura
M:4/4
L:1/4
Q:1/4=90
K:C
C D E F | G A G2 | F E D C | C4 |`;

const vazio = {
  titulo: '',
  autorCompositor: '',
  tomOriginal: '',
  andamentoBpm: '',
  tempoCompasso: '',
  letra: '',
  cifra: '',
  notacaoAbc: '',
  videoUrl: '',
  tags: '',
  observacoes: ''
};

export default function Musicas() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();

  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(vazio);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const podeEditar =
    grupo?.papel === 'RESPONSAVEL' || grupo?.papel === 'COORDENADOR';

  async function carregar() {
    if (!grupo) return;

    setCarregando(true);
    setErro('');

    try {
      const data = await api(
        `/grupos/${grupo.id}/musicas${busca.trim() ? `?q=${encodeURIComponent(busca.trim())}` : ''}`
      );
      setMusicas(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao carregar músicas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;

  function nova() {
    setForm(vazio);
    setEditandoId(null);
    setMensagem('');
    setErro('');
    setMostrarForm(true);
  }

  function editar(musica: Musica) {
    setForm({
      titulo: musica.titulo || '',
      autorCompositor: musica.autorCompositor || '',
      tomOriginal: musica.tomOriginal || '',
      andamentoBpm: musica.andamentoBpm ? String(musica.andamentoBpm) : '',
      tempoCompasso: musica.tempoCompasso || '',
      letra: musica.letra || '',
      cifra: musica.cifra || '',
      notacaoAbc: musica.notacaoAbc || '',
      videoUrl: musica.videoUrl || '',
      tags: musica.tags?.join(', ') || '',
      observacoes: musica.observacoes || ''
    });

    setEditandoId(musica.id);
    setMostrarForm(true);
    setMensagem('');
    setErro('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setMensagem('');

    const payload = {
      titulo: form.titulo.trim(),
      autorCompositor: form.autorCompositor.trim() || null,
      tomOriginal: form.tomOriginal.trim() || null,
      andamentoBpm: form.andamentoBpm ? Number(form.andamentoBpm) : null,
      tempoCompasso: form.tempoCompasso.trim() || null,
      letra: form.letra || null,
      cifra: form.cifra || null,
      notacaoAbc: form.notacaoAbc || null,
      videoUrl: form.videoUrl.trim() || '',
      tags: form.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
      observacoes: form.observacoes || null,
      compartilhada: false
    };

    try {
      if (editandoId) {
        await api(`/grupos/${grupoId}/musicas/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setMensagem('Música atualizada com sucesso.');
      } else {
        await api(`/grupos/${grupoId}/musicas`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setMensagem('Música cadastrada com sucesso.');
      }

      setMostrarForm(false);
      setEditandoId(null);
      setForm(vazio);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao salvar música.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(musica: Musica) {
    if (!window.confirm(`Excluir "${musica.titulo}" do acervo?`)) return;

    try {
      await api(`/grupos/${grupoId}/musicas/${musica.id}`, {
        method: 'DELETE'
      });
      setMensagem('Música removida do acervo.');
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao excluir música.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Músicas</h1>
            <p className="mt-2 text-slate-500">
              Letras, cifras e partituras renderizadas diretamente no Cantus Dei.
            </p>
          </div>

          {podeEditar && (
            <button
              onClick={nova}
              className="rounded-xl bg-violet-700 text-white px-5 py-3 font-semibold"
            >
              Nova música
            </button>
          )}
        </div>

        {mostrarForm && podeEditar && (
          <form
            onSubmit={salvar}
            className="bg-white rounded-3xl border border-slate-200 p-6 mb-7"
          >
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editandoId ? 'Editar música' : 'Nova música'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Cadastre letra, cifra e a partitura musical em ABC Notation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="text-sm text-slate-500"
              >
                Fechar
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium mb-2">Título *</span>
                <input
                  required
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">Autor / Compositor</span>
                <input
                  value={form.autorCompositor}
                  onChange={e => setForm({ ...form, autorCompositor: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">Tom original</span>
                <input
                  value={form.tomOriginal}
                  onChange={e => setForm({ ...form, tomOriginal: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Ex.: C, G, Dm"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">BPM</span>
                <input
                  type="number"
                  min="1"
                  max="400"
                  value={form.andamentoBpm}
                  onChange={e => setForm({ ...form, andamentoBpm: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">Compasso</span>
                <input
                  value={form.tempoCompasso}
                  onChange={e => setForm({ ...form, tempoCompasso: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="Ex.: 4/4"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">Vídeo de referência</span>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="https://..."
                />
              </label>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-4">
              <label className="block">
                <span className="block text-sm font-medium mb-2">Letra</span>
                <textarea
                  rows={10}
                  value={form.letra}
                  onChange={e => setForm({ ...form, letra: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium mb-2">Cifra</span>
                <textarea
                  rows={10}
                  value={form.cifra}
                  onChange={e => setForm({ ...form, cifra: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm"
                />
              </label>
            </div>

            <div className="mt-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <span className="text-sm font-medium">
                  Partitura em ABC Notation
                </span>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, notacaoAbc: exemploAbc })}
                  className="text-sm font-semibold text-violet-700"
                >
                  Carregar exemplo
                </button>
              </div>

              <textarea
                rows={12}
                value={form.notacaoAbc}
                onChange={e => setForm({ ...form, notacaoAbc: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm"
                placeholder={exemploAbc}
              />

              <p className="mt-2 text-xs text-slate-500">
                A partitura é salva como texto no Neon e renderizada automaticamente.
              </p>

              {form.notacaoAbc.trim() && (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">Pré-visualização</div>
                  <AbcScore
                    abc={form.notacaoAbc}
                    titulo={form.titulo || 'Partitura'}
                  />
                </div>
              )}
            </div>

            <label className="block mt-4">
              <span className="block text-sm font-medium mb-2">Tags</span>
              <input
                value={form.tags}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="entrada, comunhão, advento"
              />
            </label>

            <label className="block mt-4">
              <span className="block text-sm font-medium mb-2">Observações</span>
              <textarea
                rows={3}
                value={form.observacoes}
                onChange={e => setForm({ ...form, observacoes: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>

            <button
              disabled={salvando}
              className="mt-5 rounded-xl bg-violet-700 text-white px-6 py-3 font-semibold disabled:opacity-50"
            >
              {salvando
                ? 'Salvando...'
                : editandoId
                  ? 'Salvar alterações'
                  : 'Cadastrar música'}
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

        <form
          onSubmit={e => {
            e.preventDefault();
            carregar();
          }}
          className="flex gap-2 mb-6"
        >
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar pelo título..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3"
          />

          <button className="rounded-xl bg-slate-900 text-white px-5 font-semibold">
            Buscar
          </button>
        </form>

        {carregando ? (
          <div className="text-slate-500">Carregando músicas...</div>
        ) : musicas.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Nenhuma música cadastrada neste grupo.
          </div>
        ) : (
          <div className="space-y-5">
            {musicas.map(musica => (
              <article
                key={musica.id}
                className="bg-white rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {musica.titulo}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      {musica.autorCompositor || 'Autor não informado'}
                    </p>
                  </div>

                  {musica.tomOriginal && (
                    <span className="h-fit rounded-lg bg-violet-50 text-violet-700 px-3 py-1 text-sm font-bold">
                      {musica.tomOriginal}
                    </span>
                  )}
                </div>

                {(musica.letra || musica.cifra) && (
                  <details className="mt-5">
                    <summary className="cursor-pointer font-semibold text-violet-700">
                      Ver letra e cifra
                    </summary>

                    {musica.cifra && (
                      <pre className="mt-4 whitespace-pre-wrap font-mono text-sm leading-6 bg-slate-50 rounded-xl p-4 overflow-x-auto">
                        {musica.cifra}
                      </pre>
                    )}

                    {musica.letra && (
                      <div className="mt-4 whitespace-pre-wrap text-sm leading-6">
                        {musica.letra}
                      </div>
                    )}
                  </details>
                )}

                {musica.notacaoAbc && (
                  <details className="mt-5">
                    <summary className="cursor-pointer font-semibold text-violet-700">
                      Ver partitura
                    </summary>

                    <div className="mt-4">
                      <AbcScore abc={musica.notacaoAbc} titulo={musica.titulo} />
                    </div>
                  </details>
                )}

                {musica.videoUrl && (
                  <a
                    href={musica.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 text-sm font-semibold text-violet-700"
                  >
                    Abrir vídeo de referência
                  </a>
                )}

                {podeEditar && (
                  <div className="mt-5 flex gap-4">
                    <button
                      onClick={() => editar(musica)}
                      className="text-sm font-semibold text-violet-700"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluir(musica)}
                      className="text-sm font-semibold text-red-600"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
