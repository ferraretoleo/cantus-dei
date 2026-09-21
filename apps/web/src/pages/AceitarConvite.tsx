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
    if (token) api(`/convites/${token}`).then(setInfo).catch(e => setErro(e.message));
  }, [token]);

  async function aceitar() {
    try {
      await api(`/convites/${token}/aceitar`, { method: 'POST' });
      navigate('/dashboard');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao aceitar convite.');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-violet-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-violet-100 p-8">
        <div className="text-sm font-bold uppercase tracking-[.18em] text-violet-700">Cantus Dei</div>
        <h1 className="mt-3 text-3xl font-bold">Convite</h1>

        {erro && <div className="mt-5 bg-red-50 text-red-700 p-4 rounded-xl">{erro}</div>}

        {info && (
          <>
            <p className="mt-5 text-slate-600">
              Você foi convidado para participar do grupo <strong>{info.grupoNome}</strong>.
            </p>

            {authToken ? (
              <button onClick={aceitar} className="mt-6 w-full rounded-xl bg-violet-700 text-white py-3 font-semibold">
                Aceitar convite
              </button>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link to="/login" className="text-center rounded-xl bg-violet-700 text-white py-3 font-semibold">Entrar</Link>
                <Link to="/registrar" className="text-center rounded-xl border border-violet-300 text-violet-700 py-3 font-semibold">Criar conta</Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
