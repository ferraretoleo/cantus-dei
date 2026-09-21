import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type GrupoAtivo = {
  id: string;
  nome: string;
  slug: string;
  paroquia: string;
  cidade: string;
  papel: string;
};

export function getGrupoAtivo(): GrupoAtivo | null {
  const raw = localStorage.getItem('cantus_grupo_ativo');

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function GroupHeader() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user, logout } = useAuth();
  const grupo = getGrupoAtivo();

  function sair() {
    logout();
    navigate('/login');
  }

  if (!grupo || grupo.slug !== slug) {
    return null;
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/dashboard"
              className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700"
            >
              Cantus Dei
            </Link>

            <div className="font-bold text-slate-900 truncate">
              {grupo.nome}
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <Link to={`/g/${grupo.slug}`} className="px-3 py-2 rounded-lg text-sm hover:bg-slate-100">
              Início
            </Link>

            <Link to={`/g/${grupo.slug}/musicas`} className="px-3 py-2 rounded-lg text-sm hover:bg-slate-100">
              Músicas
            </Link>

            <Link to={`/g/${grupo.slug}/integrantes`} className="px-3 py-2 rounded-lg text-sm hover:bg-slate-100">
              Integrantes
            </Link>

            <Link to={`/g/${grupo.slug}/convites`} className="px-3 py-2 rounded-lg text-sm hover:bg-slate-100">
              Convites
            </Link>

            <span className="px-3 py-2 rounded-lg text-sm text-slate-400">
              Calendário
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-slate-700">
                {user?.nome}
              </div>
              <div className="text-xs text-slate-400">
                {grupo.papel}
              </div>
            </div>

            <button
              onClick={sair}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Sair
            </button>
          </div>
        </div>

        <nav className="md:hidden flex gap-2 overflow-x-auto pb-3">
          <Link to={`/g/${grupo.slug}`} className="whitespace-nowrap px-3 py-2 rounded-lg text-sm bg-slate-100">
            Início
          </Link>
          <Link to={`/g/${grupo.slug}/musicas`} className="whitespace-nowrap px-3 py-2 rounded-lg text-sm bg-slate-100">
            Músicas
          </Link>
          <Link to={`/g/${grupo.slug}/integrantes`} className="whitespace-nowrap px-3 py-2 rounded-lg text-sm bg-slate-100">
            Integrantes
          </Link>
          <Link to={`/g/${grupo.slug}/convites`} className="whitespace-nowrap px-3 py-2 rounded-lg text-sm bg-slate-100">
            Convites
          </Link>
        </nav>
      </div>
    </header>
  );
}
