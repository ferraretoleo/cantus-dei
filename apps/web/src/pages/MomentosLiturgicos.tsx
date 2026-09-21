import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

export default function MomentosLiturgicos() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();
  const [momentos, setMomentos] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;
  const pode = grupo.papel !== 'MUSICO';

  async function carregar() {
    try {
      setMomentos(await api(`/grupos/${grupoId}/momentos`));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro.');
    }
  }

  useEffect(() => { carregar(); }, []);

  async function criar(e: FormEvent) {
    e.preventDefault();
    await api(`/grupos/${grupoId}/momentos`, {
      method: 'POST',
      body: JSON.stringify({ nome })
    });
    setNome('');
    await carregar();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />
      <section className="max-w-5xl mx-auto p-6 sm:py-10">
        <h1 className="text-3xl font-bold">Momentos Litúrgicos</h1>
        <p className="mt-2 text-slate-500">Categorias utilizadas na montagem do repertório.</p>

        {pode && (
          <form onSubmit={criar} className="mt-6 flex gap-2 bg-white border border-slate-200 rounded-2xl p-4">
            <input
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Novo momento personalizado"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
            />
            <button className="rounded-xl bg-violet-700 text-white px-5 font-semibold">Adicionar</button>
          </form>
        )}

        {erro && <div className="mt-5 bg-red-50 text-red-700 p-4 rounded-xl">{erro}</div>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {momentos.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="text-xs font-bold text-violet-700">{String(m.ordemLiturgica).padStart(2, '0')}</div>
              <div className="mt-1 font-semibold">{m.nome}</div>
              {m.grupoId && <div className="text-xs text-slate-400 mt-1">Personalizado</div>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
