import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function AceitarConvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { token: authToken } = useAuth();

  const [info, setInfo] = useState<any>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (token) {
      api(`/convites/${token}`)
        .then(setInfo)
        .catch(e => setErro(e.message));
    }
  }, [token]);

  async function aceitar() {
    try {
      await api(`/convites/${token}/aceitar`, {
        method: 'POST'
      });

      navigate('/dashboard');
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao aceitar convite.'
      );
    }
  }

  return (
    <main className="cantus-page min-h-screen grid place-items-center p-5">
      <div className="w-full max-w-2xl">
        <div className="cantus-card p-7 sm:p-10 text-center">
          <div className="text-5xl cantus-gold">
            ♫
          </div>

          <div className="cantus-eyebrow mt-6">
            Convite para servir
          </div>

          <h1 className="cantus-display mt-4 text-5xl">
            Você foi convidado.
          </h1>

          {erro && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
              {erro}
            </div>
          )}

          {info && (
            <>
              <p className="mt-5 text-lg cantus-muted">
                Para participar do grupo
              </p>

              <div className="cantus-display mt-2 text-3xl cantus-gold">
                {info.grupoNome}
              </div>

              <p className="mt-3 text-sm cantus-muted">
                {info.paroquia} · {info.cidade}
              </p>

              <div className="mt-4">
                <span className="cantus-badge">
                  {info.papelProposto}
                </span>
              </div>

              {authToken ? (
                <button
                  onClick={aceitar}
                  className="cantus-primary mt-7 px-7 py-3"
                >
                  Aceitar convite
                </button>
              ) : (
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/login"
                    className="cantus-primary px-7 py-3"
                  >
                    Entrar
                  </Link>

                  <Link
                    to="/registrar"
                    className="cantus-secondary px-7 py-3"
                  >
                    Criar conta
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
