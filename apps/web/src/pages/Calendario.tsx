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
    api(`/grupos/${grupo.id}/missas`)
      .then(setMissas)
      .catch(e => setErro(e.message));
  }, []);

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <div className="cantus-eyebrow">
              Agenda do ministério
            </div>

            <h1 className="cantus-section-title mt-3">
              Próximas
              <span className="cantus-gold">
                {' '}celebrações.
              </span>
            </h1>

            <p className="mt-3 cantus-muted">
              Repertório, escala e preparação em um único lugar.
            </p>
          </div>

          {pode && (
            <Link
              to={`/g/${slug}/missas/nova`}
              className="cantus-primary px-6 py-3 self-start"
            >
              + Nova celebração
            </Link>
          )}
        </div>

        {erro && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {erro}
          </div>
        )}

        <div className="space-y-4 mt-7">
          {missas.map(m => (
            <Link
              key={m.id}
              to={`/g/${slug}/missas/${m.id}`}
              className="cantus-card block p-5 sm:p-6 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-16 h-16 rounded-full border border-[#d5ae62]/25 bg-[#d5ae62]/8 grid place-items-center shrink-0">
                  <span className="text-2xl cantus-gold">
                    ♫
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="cantus-eyebrow">
                    {formatar(m.dataHora)}
                  </div>

                  <h2 className="cantus-display mt-2 text-3xl">
                    {m.tipoCelebracao}
                  </h2>

                  <p className="mt-1 text-sm cantus-muted">
                    {m.local}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={
                      m.status === 'PUBLICADA'
                        ? 'cantus-badge'
                        : 'cantus-badge opacity-60'
                    }
                  >
                    {m.status}
                  </span>

                  <span className="text-2xl text-white/20 group-hover:text-[#d5ae62]">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {!missas.length && (
            <div className="cantus-card p-10 text-center">
              <div className="text-5xl cantus-gold">
                ♪
              </div>

              <h2 className="cantus-display mt-5 text-3xl">
                Nenhuma celebração cadastrada.
              </h2>

              <p className="mt-3 cantus-muted">
                Quando uma celebração for criada, ela aparecerá aqui.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
