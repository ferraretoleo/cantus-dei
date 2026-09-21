import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

export default function Integrantes() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();
  const [membros, setMembros] = useState<any[]>([]);

  useEffect(() => {
    if (grupo) api(`/grupos/${grupo.id}/membros`).then(setMembros);
  }, []);

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />
      <section className="max-w-5xl mx-auto p-6 sm:py-10">
        <h1 className="text-3xl font-bold">Integrantes</h1>

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {membros.map(m => (
            <div key={m.userId} className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold">{m.nome}</div>
                <div className="text-sm text-slate-500">{m.email}</div>
                <div className="text-xs text-slate-400 mt-1">{[m.instrumento, m.voz].filter(Boolean).join(' · ')}</div>
              </div>
              <span className="rounded-full bg-violet-50 text-violet-700 px-3 py-1 text-xs font-bold">{m.papel}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
