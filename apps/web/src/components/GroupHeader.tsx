import {
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export type GrupoAtivo = {
  id:string;
  nome:string;
  slug:string;
  paroquia:string;
  cidade:string;
  papel:string;
  corTema?:string;
};

export function getGrupoAtivo():GrupoAtivo|null {
  const raw=
    localStorage.getItem('cantus_grupo_ativo');

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function GroupHeader() {
  const { slug }=useParams();
  const navigate=useNavigate();

  const {
    user,
    paroquiaAtiva,
    logout
  }=useAuth();

  const grupo=getGrupoAtivo();

  if (!grupo || grupo.slug!==slug) {
    return null;
  }

  const grupoAtual = grupo;

  const adminParoquiaOuMaster=
    user?.perfilGlobal==='MASTER' ||
    paroquiaAtiva?.papel==='ADMIN_PAROQUIA';

  const responsavelMinisterio=
    grupoAtual.papel==='RESPONSAVEL';

  const administraMinisterio=
    adminParoquiaOuMaster ||
    responsavelMinisterio;

  function sair() {
    logout();
    navigate('/login');
  }

  function rotuloPapel() {
    if (user?.perfilGlobal==='MASTER') {
      return 'MASTER GLOBAL';
    }

    if (
      paroquiaAtiva?.papel==='ADMIN_PAROQUIA'
    ) {
      return 'ADMIN PARÓQUIA';
    }

    if (grupoAtual.papel==='RESPONSAVEL') {
      return 'RESP. MINISTÉRIO';
    }

    if (grupoAtual.papel==='COORDENADOR') {
      return 'COORDENADOR';
    }

    return 'MÚSICO';
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0c0e]/90 backdrop-blur-xl">
      <div className="cantus-shell">
        <div className="h-20 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              to="/dashboard"
              className="cantus-eyebrow"
            >
              Cantus Dei
            </Link>

            <div className="cantus-display mt-1 text-lg truncate">
              {grupoAtual.nome}
            </div>
          </div>

          <nav className="hidden xl:flex items-center gap-1">
            <Link
              className="cantus-nav-link"
              to="/dashboard"
            >
              Dashboard
            </Link>

            <Link
              className="cantus-nav-link"
              to={`/g/${slug}`}
            >
              Início
            </Link>

            <Link
              className="cantus-nav-link"
              to={`/g/${slug}/calendario`}
            >
              Celebrações
            </Link>

            <Link
              className="cantus-nav-link"
              to={`/g/${slug}/musicas`}
            >
              Músicas
            </Link>

            <Link
              className="cantus-nav-link"
              to={`/g/${slug}/momentos`}
            >
              Momentos
            </Link>

            {administraMinisterio && (
              <>
                <Link
                  className="cantus-nav-link"
                  to={`/g/${slug}/integrantes`}
                >
                  Integrantes
                </Link>

                <Link
                  className="cantus-nav-link"
                  to={`/g/${slug}/convites`}
                >
                  Convites
                </Link>
              </>
            )}

            {adminParoquiaOuMaster && (
              <Link
                className="cantus-nav-link"
                to="/paroquia/admin"
              >
                Admin. Paróquia
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-[#e6dfd4]">
                {user?.nome}
              </div>

              <div className="mt-1 text-[10px] font-extrabold tracking-[.12em] uppercase cantus-gold">
                {rotuloPapel()}
              </div>
            </div>

            <Link
              to="/dashboard"
              className="cantus-secondary px-4 py-2 text-sm"
            >
              Dashboard
            </Link>

            <button
              onClick={sair}
              className="cantus-secondary px-4 py-2 text-sm"
            >
              Sair
            </button>
          </div>
        </div>

        <nav className="xl:hidden flex gap-1 overflow-x-auto pb-3">
          <Link
            className="cantus-nav-link"
            to="/dashboard"
          >
            Dashboard
          </Link>

          <Link
            className="cantus-nav-link"
            to={`/g/${slug}`}
          >
            Início
          </Link>

          <Link
            className="cantus-nav-link"
            to={`/g/${slug}/calendario`}
          >
            Celebrações
          </Link>

          <Link
            className="cantus-nav-link"
            to={`/g/${slug}/musicas`}
          >
            Músicas
          </Link>

          <Link
            className="cantus-nav-link"
            to={`/g/${slug}/momentos`}
          >
            Momentos
          </Link>

          {administraMinisterio && (
            <>
              <Link
                className="cantus-nav-link"
                to={`/g/${slug}/integrantes`}
              >
                Integrantes
              </Link>

              <Link
                className="cantus-nav-link"
                to={`/g/${slug}/convites`}
              >
                Convites
              </Link>
            </>
          )}

          {adminParoquiaOuMaster && (
            <Link
              className="cantus-nav-link"
              to="/paroquia/admin"
            >
              Admin. Paróquia
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
