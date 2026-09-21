import { Link, Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import PsalmHighlight from '../components/PsalmHighlight';

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
  const grupo = getGrupoAtivo();

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
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
              {grupo.nome}
            </h1>

            <p className="mt-4 text-lg cantus-muted">
              {grupo.paroquia}
              <span className="mx-2 cantus-gold">·</span>
              {grupo.cidade}
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
                {grupo.papel}
              </div>

              <p className="mt-3 text-sm leading-6 cantus-muted">
                Seu acesso e suas ações neste ministério são definidos
                por esse papel.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
