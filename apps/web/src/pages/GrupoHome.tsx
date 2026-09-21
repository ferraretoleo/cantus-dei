import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import PsalmHighlight from '../components/PsalmHighlight';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const atalhos = [
  {
    titulo: 'Calendário',
    texto: 'Celebrações, repertório e escalas',
    simbolo: '◷',
    chave: 'calendario'
  },
  {
    titulo: 'Músicas',
    texto: 'Letras, cifras e partituras',
    simbolo: '♫',
    chave: 'musicas'
  },
  {
    titulo: 'Momentos',
    texto: 'Organização litúrgica',
    simbolo: '✦',
    chave: 'momentos'
  },
  {
    titulo: 'Integrantes',
    texto: 'Músicos e funções',
    simbolo: '♬',
    chave: 'integrantes'
  },
  {
    titulo: 'Convites',
    texto: 'Entrada de novos músicos',
    simbolo: '+',
    chave: 'convites'
  }
];

export default function GrupoHome() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const grupo = getGrupoAtivo();

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoAtual = grupo;

  const podeExcluir =
    grupoAtual.papel === 'RESPONSAVEL' ||
    user?.perfilGlobal === 'MASTER';

  async function excluirGrupo() {
    const digitado = window.prompt(
      `Esta ação é definitiva e apagará o grupo, repertórios, celebrações, convites e vínculos.\n\nDigite exatamente "${grupoAtual.nome}" para confirmar:`
    );

    if (digitado !== grupoAtual.nome) {
      if (digitado !== null) {
        window.alert('O nome digitado não confere. Exclusão cancelada.');
      }
      return;
    }

    try {
      await api(`/grupos/${grupoAtual.id}`, {
        method: 'DELETE'
      });

      localStorage.removeItem('cantus_grupo_ativo');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Erro ao excluir grupo.'
      );
    }
  }

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell pt-6 sm:pt-9 pb-14">
        <div className="cantus-card cantus-staff relative overflow-hidden p-7 sm:p-10 lg:p-12">
          <div className="relative z-10 max-w-4xl">
            <div className="cantus-eyebrow">
              Ministério de música
            </div>

            <h1 className="cantus-display mt-5 text-5xl sm:text-6xl leading-[.95]">
              {grupoAtual.nome}
            </h1>

            <p className="mt-4 text-lg cantus-muted">
              {grupoAtual.paroquia}
              <span className="mx-2 cantus-gold">·</span>
              {grupoAtual.cidade}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to={`/g/${slug}/calendario`}
                className="cantus-primary px-6 py-3"
              >
                Próximas celebrações
              </Link>

              <Link
                to={`/g/${slug}/musicas`}
                className="cantus-secondary px-6 py-3"
              >
                Abrir repertório
              </Link>
            </div>
          </div>

          <div className="absolute right-7 sm:right-12 top-8 text-[7rem] sm:text-[10rem] cantus-gold opacity-[.08] select-none">
            ♫
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-[1.25fr_.75fr] gap-5">
          <section>
            <div className="cantus-eyebrow">
              O que vamos preparar?
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {atalhos.map(item => (
                <Link
                  key={item.chave}
                  to={`/g/${slug}/${item.chave}`}
                  className="cantus-card p-5 sm:p-6 group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-11 h-11 rounded-full border border-[#d5ae62]/25 bg-[#d5ae62]/8 grid place-items-center cantus-gold text-xl">
                      {item.simbolo}
                    </div>

                    <div className="text-xl text-white/20 group-hover:text-[#d5ae62]">
                      ↗
                    </div>
                  </div>

                  <h2 className="cantus-display mt-6 text-2xl">
                    {item.titulo}
                  </h2>

                  <p className="mt-2 text-sm cantus-muted">
                    {item.texto}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <aside>
            <PsalmHighlight compact />

            <div className="cantus-card mt-5 p-6">
              <div className="cantus-eyebrow">
                Perfil no grupo
              </div>

              <div className="cantus-display mt-4 text-3xl">
                {grupoAtual.papel}
              </div>

              <p className="mt-3 text-sm leading-6 cantus-muted">
                Seu acesso e suas ações neste ministério são definidos
                por esse papel.
              </p>
            </div>

            {podeExcluir && (
              <div className="cantus-card mt-5 p-6 border-red-500/20">
                <div className="text-xs font-extrabold uppercase tracking-[.18em] text-red-300">
                  Zona de atenção
                </div>

                <h3 className="cantus-display mt-3 text-2xl">
                  Excluir grupo
                </h3>

                <p className="mt-3 text-sm leading-6 cantus-muted">
                  A exclusão é definitiva e remove os dados vinculados a este grupo.
                </p>

                <button
                  onClick={excluirGrupo}
                  className="cantus-danger mt-5 px-5 py-2.5 text-sm"
                >
                  Excluir este grupo
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
