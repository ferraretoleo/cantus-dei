import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export type GrupoAtivo = {
  id: string;
  nome: string;
  slug: string;
  paroquia: string;
  cidade: string;
  papel: string;
  corTema?: string;
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
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const grupo = getGrupoAtivo();

  if (!grupo || grupo.slug !== slug) return null;

  const cls =
    'whitespace-nowrap px-3 py-2 rounded-lg text-sm hover:bg-violet-50 hover:text-violet-700';

  function sair() {
    logout();
    navigate('/login');
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/dashboard"
              className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-700"
            >
              Cantus Dei
            </Link>
            <div className="font-bold truncate">{grupo.nome}</div>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <Link className={cls} to={`/g/${slug}`}>Início</Link>
            <Link className={cls} to={`/g/${slug}/calendario`}>Calendário</Link>
            <Link className={cls} to={`/g/${slug}/musicas`}>Músicas</Link>
            <Link className={cls} to={`/g/${slug}/momentos`}>Momentos</Link>
            <Link className={cls} to={`/g/${slug}/integrantes`}>Integrantes</Link>
            <Link className={cls} to={`/g/${slug}/convites`}>Convites</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium">{user?.nome}</div>
              <div className="text-xs text-slate-400">{grupo.papel}</div>
            </div>
            <button
              onClick={sair}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              Sair
            </button>
          </div>
        </div>

        <nav className="lg:hidden flex gap-2 overflow-x-auto pb-3">
          <Link className={cls} to={`/g/${slug}`}>Início</Link>
          <Link className={cls} to={`/g/${slug}/calendario`}>Calendário</Link>
          <Link className={cls} to={`/g/${slug}/musicas`}>Músicas</Link>
          <Link className={cls} to={`/g/${slug}/momentos`}>Momentos</Link>
          <Link className={cls} to={`/g/${slug}/integrantes`}>Integrantes</Link>
          <Link className={cls} to={`/g/${slug}/convites`}>Convites</Link>
        </nav>
      </div>
    </header>
  );
}
