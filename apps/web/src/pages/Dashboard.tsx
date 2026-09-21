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
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/me/grupos')
      .then(setGrupos)
      .catch(error => {
        setErro(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar grupos.'
        );
      })
      .finally(() => setCarregando(false));
  }, []);

  function sair() {
    logout();
    navigate('/login');
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="font-bold text-violet-700">
              Cantus Dei
            </div>

            <div className="text-sm text-slate-500">
              Olá, {user?.nome}
            </div>
          </div>

          <button
            onClick={sair}
            className="text-sm font-medium text-slate-600"
          >
            Sair
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Seus grupos
            </h1>

            <p className="text-slate-500 mt-2">
              Escolha um grupo para continuar
            </p>
          </div>

          <Link
            to="/grupos/novo"
            className="rounded-xl bg-violet-700 text-white px-5 py-3 font-semibold"
          >
            Novo grupo
          </Link>
        </div>

        {carregando && (
          <p className="text-slate-500">
            Carregando grupos...
          </p>
        )}

        {erro && (
          <div className="rounded-xl bg-red-50 text-red-700 p-4">
            {erro}
          </div>
        )}

        {!carregando && grupos.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-800">
              Você ainda não participa de nenhum grupo
            </h2>

            <p className="mt-2 text-slate-500">
              Crie seu primeiro grupo de música litúrgica.
            </p>

            <Link
              to="/grupos/novo"
              className="inline-block mt-6 rounded-xl bg-violet-700 text-white px-6 py-3 font-semibold"
            >
              Criar meu primeiro grupo
            </Link>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
              className="text-left bg-white border border-slate-200 rounded-2xl p-6 hover:border-violet-400 hover:shadow-md transition"
            >
              <h2 className="font-bold text-xl text-slate-900">
                {grupo.nome}
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                {grupo.paroquia}
              </p>

              <p className="text-sm text-slate-400">
                {grupo.cidade}
              </p>

              <div className="mt-4">
                <span className="text-xs rounded-full bg-violet-50 text-violet-700 px-3 py-1 font-semibold">
                  {grupo.papel}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}