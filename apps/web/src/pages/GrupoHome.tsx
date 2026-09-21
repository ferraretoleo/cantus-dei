import { Link, Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';

export default function GrupoHome() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-violet-700 to-violet-900 text-white p-7 sm:p-10">
          <p className="text-violet-200 text-sm font-semibold uppercase tracking-[0.15em]">
            Grupo ativo
          </p>

          <h1 className="mt-3 text-3xl sm:text-4xl font-bold">
            {grupo.nome}
          </h1>

          <p className="mt-2 text-violet-100">
            {grupo.paroquia} · {grupo.cidade}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Link
            to={`/g/${grupo.slug}/integrantes`}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-violet-300 hover:shadow-sm transition"
          >
            <div className="text-sm font-semibold text-violet-700">
              Equipe
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Integrantes
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Consulte músicos, instrumentos e funções.
            </p>
          </Link>

          <Link
            to={`/g/${grupo.slug}/convites`}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-violet-300 hover:shadow-sm transition"
          >
            <div className="text-sm font-semibold text-violet-700">
              Acesso
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Convidar músico
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Gere um convite para novos integrantes.
            </p>
          </Link>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 opacity-70">
            <div className="text-sm font-semibold text-slate-400">
              Próxima fase
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-700">
              Músicas
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Cifras, partituras e repertório.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 opacity-70">
            <div className="text-sm font-semibold text-slate-400">
              Próxima fase
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-700">
              Calendário
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Missas, escalas e repertórios.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
