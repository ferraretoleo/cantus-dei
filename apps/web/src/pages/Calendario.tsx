import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

function formatar(data: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(data));
}

export default function Calendario() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();
  const [missas, setMissas] = useState<any[]>([]);
  const [erro, setErro] = useState('');

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const pode = grupo.papel !== 'MUSICO';

  useEffect(() => {
    api(`/grupos/${grupo.id}/missas`).then(setMissas).catch(e => setErro(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />
      <section className="max-w-6xl mx-auto p-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Calendário</h1>
            <p className="mt-2 text-slate-500">Celebrações, repertórios e escalas.</p>
          </div>
          {pode && (
            <Link to={`/g/${slug}/missas/nova`} className="rounded-xl bg-violet-700 text-white px-5 py-3 font-semibold">
              Nova celebração
            </Link>
          )}
        </div>

        {erro && <div className="mt-5 bg-red-50 text-red-700 p-4 rounded-xl">{erro}</div>}

        <div className="space-y-3 mt-6">
          {missas.map(m => (
            <Link key={m.id} to={`/g/${slug}/missas/${m.id}`} className="block bg-white border border-slate-200 rounded-2xl p-5 hover:border-violet-400">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-violet-700">{formatar(m.dataHora)}</div>
                  <div className="mt-1 text-xl font-bold">{m.tipoCelebracao}</div>
                  <div className="text-sm text-slate-500">{m.local}</div>
                </div>
                <span className={`self-start sm:self-auto rounded-full px-3 py-1 text-xs font-bold ${m.status === 'PUBLICADA' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {m.status}
                </span>
              </div>
            </Link>
          ))}

          {!missas.length && (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center text-slate-500">
              Nenhuma celebração cadastrada.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
