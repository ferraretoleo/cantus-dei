import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

export default function Integrantes() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();
  const [membros, setMembros] = useState<any[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (grupo) {
      api(`/grupos/${grupo.id}/membros`)
        .then(setMembros)
        .catch(e => setErro(e.message));
    }
  }, []);

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <div className="cantus-eyebrow">
          Ministério
        </div>

        <h1 className="cantus-section-title mt-3">
          Integrantes
        </h1>

        <p className="mt-3 cantus-muted">
          Quem serve com você neste grupo.
        </p>

        {erro && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {erro}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
          {membros.map((m, i) => (
            <article
              key={m.userId}
              className="cantus-card p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-[#d5ae62]/25 bg-[#d5ae62]/10 grid place-items-center cantus-gold text-xl">
                  {i % 2 === 0 ? '♫' : '♪'}
                </div>

                <div className="min-w-0">
                  <div className="cantus-display text-xl truncate">
                    {m.nome}
                  </div>
                  <div className="mt-1 text-sm cantus-muted truncate">
                    {m.email}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="cantus-badge">
                  {m.papel}
                </span>

                {m.instrumento && (
                  <span className="cantus-badge">
                    {m.instrumento}
                  </span>
                )}

                {m.voz && (
                  <span className="cantus-badge">
                    {m.voz}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
