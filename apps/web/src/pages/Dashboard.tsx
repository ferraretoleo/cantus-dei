import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PsalmHighlight from '../components/PsalmHighlight';

type Grupo = {
  id: string;
  nome: string;
  slug: string;
  paroquia: string;
  cidade: string;
  papel: string;
  corTema?: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/me/grupos')
      .then(setGrupos)
      .catch(e => setErro(e.message));
  }, []);

  return (
    <main className="cantus-page">
      <header className="border-b border-white/10 bg-[#0b0c0e]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="cantus-shell h-20 flex items-center justify-between gap-4">
          <div>
            <div className="cantus-eyebrow">
              Cantus Dei
            </div>

            <div className="mt-1 text-sm cantus-muted">
              {user?.nome}
              {user?.perfilGlobal === 'MASTER' && (
                <span className="ml-2 text-[10px] font-extrabold tracking-wider cantus-gold">
                  MASTER
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.perfilGlobal === 'MASTER' && (
              <Link
                to="/master"
                className="cantus-secondary px-4 py-2 text-sm"
              >
                Administração
              </Link>
            )}

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="cantus-nav-link"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="cantus-shell pt-8 sm:pt-12 pb-14">
        <div className="cantus-card cantus-staff relative overflow-hidden min-h-[390px] p-7 sm:p-10 lg:p-12 grid lg:grid-cols-[1.25fr_.75fr] gap-8 items-center">
          <div className="relative z-10 max-w-3xl">
            <div className="cantus-eyebrow">
              Seu espaço musical
            </div>

            <h1 className="cantus-display mt-5 text-5xl sm:text-6xl lg:text-7xl leading-[.92]">
              Repertório,
              <span className="block cantus-gold">
                fé e serviço.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base sm:text-lg leading-8 cantus-muted">
              Organize os grupos que você serve, prepare as próximas
              celebrações e mantenha o repertório sempre à mão.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/grupos/novo"
                className="cantus-primary px-6 py-3"
              >
                + Novo grupo
              </Link>

              {grupos[0] && (
                <button
                  onClick={() => {
                    localStorage.setItem(
                      'cantus_grupo_ativo',
                      JSON.stringify(grupos[0])
                    );
                    navigate(`/g/${grupos[0].slug}/calendario`);
                  }}
                  className="cantus-secondary px-6 py-3"
                >
                  Ver próximas celebrações
                </button>
              )}
            </div>
          </div>

          <div className="relative hidden lg:grid place-items-center">
            <div className="cantus-vinyl" />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_.85fr] gap-5 mt-5">
          <section>
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <div className="cantus-eyebrow">
                  Meus ministérios
                </div>

                <h2 className="cantus-section-title mt-3">
                  Grupos que você participa
                </h2>
              </div>

              <span className="text-sm cantus-muted">
                {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}
              </span>
            </div>

            {erro && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
                {erro}
              </div>
            )}

            <div className="space-y-3">
              {grupos.map((grupo, index) => (
                <button
                  key={grupo.id}
                  onClick={() => {
                    localStorage.setItem(
                      'cantus_grupo_ativo',
                      JSON.stringify(grupo)
                    );
                    navigate(`/g/${grupo.slug}`);
                  }}
                  className="cantus-card w-full text-left p-5 sm:p-6 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-full border border-[#d5ae62]/30 bg-[#d5ae62]/10 grid place-items-center cantus-gold text-xl">
                      {index % 2 === 0 ? '♫' : '♪'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="cantus-display text-2xl truncate">
                        {grupo.nome}
                      </div>

                      <div className="mt-1 text-sm cantus-muted truncate">
                        {grupo.paroquia} · {grupo.cidade}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-extrabold tracking-[.12em] uppercase cantus-gold">
                        {grupo.papel}
                      </div>

                      <div className="mt-2 text-xl text-white/25 group-hover:text-[#d5ae62]">
                        →
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {!grupos.length && (
                <div className="cantus-card p-8 text-center">
                  <div className="text-4xl">♩</div>
                  <h3 className="cantus-display mt-4 text-2xl">
                    Seu primeiro grupo começa aqui.
                  </h3>
                  <p className="mt-2 cantus-muted">
                    Crie um ministério ou aceite um convite para começar.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside>
            <PsalmHighlight />

            <div className="cantus-card mt-5 p-6">
              <div className="cantus-eyebrow">
                Atalho rápido
              </div>

              <h3 className="cantus-display mt-3 text-2xl">
                Prepare a próxima celebração
              </h3>

              <p className="mt-3 text-sm leading-6 cantus-muted">
                Entre em um grupo e abra o calendário para montar
                repertório, tom e escala dos músicos.
              </p>

              {grupos[0] && (
                <button
                  onClick={() => {
                    localStorage.setItem(
                      'cantus_grupo_ativo',
                      JSON.stringify(grupos[0])
                    );
                    navigate(`/g/${grupos[0].slug}/calendario`);
                  }}
                  className="cantus-secondary mt-5 px-5 py-2.5 text-sm"
                >
                  Abrir calendário →
                </button>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
