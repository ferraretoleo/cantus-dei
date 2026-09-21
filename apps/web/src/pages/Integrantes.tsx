import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

type Membro = {
  grupoId: string;
  userId: string;
  papel: string;
  instrumento?: string | null;
  voz?: string | null;
  ativo: boolean;
  entrouEm?: string;
};

export default function Integrantes() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();

  const [membros, setMembros] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!grupo) return;

    api(`/grupos/${grupo.id}/membros`)
      .then(setMembros)
      .catch(error => {
        setErro(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar integrantes.'
        );
      })
      .finally(() => setCarregando(false));
  }, []);

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-slate-900">
            Integrantes
          </h1>

          <p className="mt-2 text-slate-500">
            Membros ativos do grupo {grupo.nome}
          </p>
        </div>

        {carregando && (
          <div className="text-slate-500">
            Carregando integrantes...
          </div>
        )}

        {erro && (
          <div className="rounded-xl bg-red-50 text-red-700 p-4">
            {erro}
          </div>
        )}

        {!carregando && !erro && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {membros.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                Nenhum integrante encontrado.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {membros.map(membro => (
                  <div
                    key={membro.userId}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        Usuário {membro.userId.slice(0, 8)}
                      </div>

                      <div className="text-sm text-slate-500 mt-1">
                        {membro.instrumento || 'Instrumento não informado'}
                        {membro.voz ? ` · ${membro.voz}` : ''}
                      </div>
                    </div>

                    <span className="self-start sm:self-auto text-xs font-bold rounded-full bg-violet-50 text-violet-700 px-3 py-1">
                      {membro.papel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
