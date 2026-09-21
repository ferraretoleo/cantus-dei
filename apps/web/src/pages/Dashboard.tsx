import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

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
    api('/me/grupos').then(setGrupos).catch(e => setErro(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="font-extrabold text-violet-700">
              Cantus Dei
            </div>

            <div className="text-sm text-slate-500">
              Olá, {user?.nome}
              {user?.perfilGlobal === 'MASTER' && (
                <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                  MASTER
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.perfilGlobal === 'MASTER' && (
              <Link
                to="/master"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Administração
              </Link>
            )}

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-sm text-slate-600"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto p-6 sm:py-10">
        <div className="flex items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-bold">Seus grupos</h1>
            <p className="mt-2 text-slate-500">
              Escolha o grupo de música litúrgica.
            </p>
          </div>

          <Link
            to="/grupos/novo"
            className="rounded-xl bg-violet-700 text-white px-5 py-3 font-semibold"
          >
            Novo grupo
          </Link>
        </div>

        {erro && (
          <div className="mb-5 bg-red-50 text-red-700 p-4 rounded-xl">
            {erro}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map(grupo => (
            <button
              key={grupo.id}
              onClick={() => {
                localStorage.setItem(
                  'cantus_grupo_ativo',
                  JSON.stringify(grupo)
                );
                navigate(`/g/${grupo.slug}`);
              }}
              className="text-left bg-white rounded-2xl border border-slate-200 p-6 hover:border-violet-400 hover:shadow-md"
            >
              <h2 className="text-xl font-bold">{grupo.nome}</h2>
              <p className="mt-2 text-sm text-slate-500">{grupo.paroquia}</p>
              <p className="text-sm text-slate-400">{grupo.cidade}</p>

              <span className="inline-block mt-4 rounded-full bg-violet-50 text-violet-700 px-3 py-1 text-xs font-bold">
                {grupo.papel}
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
