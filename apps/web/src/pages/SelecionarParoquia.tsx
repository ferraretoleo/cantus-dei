import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth, type ParoquiaAtiva } from '../contexts/AuthContext';

export default function SelecionarParoquia() {
  const navigate = useNavigate();
  const { user, selecionarParoquia, logout } = useAuth();

  const [paroquias, setParoquias] = useState<ParoquiaAtiva[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/me/paroquias')
      .then(setParoquias)
      .catch(e => setErro(e.message));
  }, []);

  function entrar(paroquia: ParoquiaAtiva) {
    selecionarParoquia(paroquia);
    navigate('/dashboard', { replace: true });
  }

  return (
    <main className="cantus-page min-h-screen">
      <header className="border-b border-white/10 bg-[#0b0c0e]/90">
        <div className="cantus-shell h-20 flex items-center justify-between">
          <div>
            <div className="cantus-eyebrow">Cantus Dei</div>
            <div className="mt-1 text-sm cantus-muted">
              {user?.nome}
            </div>
          </div>

          <div className="flex gap-2">
            {user?.perfilGlobal === 'MASTER' && (
              <button
                onClick={() => navigate('/master')}
                className="cantus-secondary px-4 py-2 text-sm"
              >
                Administração global
              </button>
            )}

            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="cantus-nav-link"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="cantus-shell py-10 sm:py-14">
        <div className="cantus-eyebrow">
          Escolha o ambiente
        </div>

        <h1 className="cantus-display mt-4 text-5xl sm:text-6xl">
          Qual paróquia
          <span className="block cantus-gold">
            você quer acessar?
          </span>
        </h1>

        <p className="mt-5 max-w-2xl cantus-muted leading-7">
          Seus grupos, missas, repertórios e escalas serão exibidos
          somente para a paróquia selecionada.
        </p>

        {erro && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {erro}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {paroquias.map(p => (
            <button
              key={p.id}
              onClick={() => entrar(p)}
              className="cantus-card text-left p-6 group"
            >
              <div className="text-3xl cantus-gold">✦</div>
              <div className="cantus-display mt-5 text-2xl">
                {p.nome}
              </div>
              <div className="mt-2 text-sm cantus-muted">
                {p.cidade}
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="cantus-badge">
                  {p.papel === 'MASTER'
                    ? 'MASTER'
                    : p.papel === 'ADMIN_PAROQUIA'
                      ? 'ADMIN PARÓQUIA'
                      : 'MEMBRO'}
                </span>

                <span className="text-xl text-white/20 group-hover:text-[#d5ae62]">
                  →
                </span>
              </div>
            </button>
          ))}
        </div>

        {!paroquias.length && !erro && (
          <div className="cantus-card mt-8 p-8">
            <h2 className="cantus-display text-3xl">
              Nenhuma paróquia vinculada.
            </h2>

            <p className="mt-3 cantus-muted">
              Solicite ao administrador que associe seu usuário a uma paróquia.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
