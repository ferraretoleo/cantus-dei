import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

type Momento = {
  id: string;
  nome: string;
  slug: string;
  ordemLiturgica: number;
  grupoId?: string | null;
};

export default function MomentosLiturgicos() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();

  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;

  const podeEditar =
    grupo.papel === 'RESPONSAVEL' ||
    grupo.papel === 'COORDENADOR';

  async function carregar() {
    setCarregando(true);
    setErro('');

    try {
      const data = await api(`/grupos/${grupoId}/momentos`);
      setMomentos(data);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar momentos litúrgicos.'
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criar(e: FormEvent) {
    e.preventDefault();

    if (!nome.trim()) return;

    setSalvando(true);
    setErro('');
    setMensagem('');

    try {
      await api(`/grupos/${grupoId}/momentos`, {
        method: 'POST',
        body: JSON.stringify({
          nome: nome.trim()
        })
      });

      setNome('');
      setMensagem('Momento personalizado criado.');
      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao criar momento.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(momento: Momento) {
    if (!window.confirm(`Excluir o momento "${momento.nome}"?`)) {
      return;
    }

    try {
      await api(
        `/grupos/${grupoId}/momentos/${momento.id}`,
        { method: 'DELETE' }
      );

      setMensagem('Momento personalizado removido.');
      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao excluir momento.'
      );
    }
  }

  const globais = momentos.filter(item => !item.grupoId);
  const personalizados = momentos.filter(
    item => item.grupoId === grupoId
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-slate-900">
            Momentos Litúrgicos
          </h1>

          <p className="mt-2 text-slate-500">
            Organize o repertório de acordo com cada momento da celebração.
          </p>
        </div>

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

        {podeEditar && (
          <form
            onSubmit={criar}
            className="mb-7 bg-white border border-slate-200 rounded-2xl p-5"
          >
            <h2 className="text-lg font-bold text-slate-900">
              Momento personalizado
            </h2>

            <p className="mt-1 mb-4 text-sm text-slate-500">
              Use apenas quando o grupo precisar de uma categoria adicional.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex.: Adoração"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
              />

              <button
                disabled={salvando || !nome.trim()}
                className="rounded-xl bg-violet-700 text-white px-5 py-3 font-semibold disabled:opacity-50"
              >
                {salvando ? 'Criando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        )}

        {carregando ? (
          <div className="text-slate-500">
            Carregando momentos...
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Momentos padrão
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {globais.map(momento => (
                  <div
                    key={momento.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4"
                  >
                    <div className="text-xs font-bold text-violet-700">
                      {String(momento.ordemLiturgica).padStart(2, '0')}
                    </div>

                    <div className="mt-1 font-semibold text-slate-900">
                      {momento.nome}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Personalizados do grupo
              </h2>

              {personalizados.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
                  Nenhum momento personalizado criado.
                </div>
              ) : (
                <div className="space-y-3">
                  {personalizados.map(momento => (
                    <div
                      key={momento.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          {momento.nome}
                        </div>

                        <div className="text-xs text-slate-400 mt-1">
                          Exclusivo deste grupo
                        </div>
                      </div>

                      {podeEditar && (
                        <button
                          onClick={() => excluir(momento)}
                          className="text-sm font-semibold text-red-600"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
