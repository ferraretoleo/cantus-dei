import { Link, Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';

export default function GrupoHome() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const cards = [
    ['Calendário', 'Celebrações, repertório e escalas', `/g/${slug}/calendario`],
    ['Músicas', 'Letras, cifras e partituras', `/g/${slug}/musicas`],
    ['Momentos', 'Organização litúrgica', `/g/${slug}/momentos`],
    ['Integrantes', 'Músicos e funções', `/g/${slug}/integrantes`],
    ['Convites', 'Entrada de novos músicos', `/g/${slug}/convites`]
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />
      <section className="max-w-7xl mx-auto p-6 sm:py-10">
        <div className="rounded-3xl bg-gradient-to-br from-violet-700 to-violet-950 p-8 text-white">
          <div className="text-sm font-bold uppercase tracking-[.16em] text-violet-200">Grupo ativo</div>
          <h1 className="mt-3 text-4xl font-bold">{grupo.nome}</h1>
          <p className="mt-2 text-violet-100">{grupo.paroquia} · {grupo.cidade}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {cards.map(([titulo, texto, to]) => (
            <Link key={titulo} to={to} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-violet-400 hover:shadow-sm">
              <h2 className="text-xl font-bold">{titulo}</h2>
              <p className="mt-2 text-sm text-slate-500">{texto}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
