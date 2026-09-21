import { useState, type FormEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

export default function Convites() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();

  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [papelProposto, setPapel] = useState('MUSICO');
  const [link, setLink] = useState('');

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;
  const pode = grupo.papel === 'RESPONSAVEL';

  async function submit(e: FormEvent) {
    e.preventDefault();

    const data = await api(`/grupos/${grupoId}/convites`, {
      method: 'POST',
      body: JSON.stringify({
        email: email || undefined,
        telefone: telefone || undefined,
        papelProposto
      })
    });

    setLink(data.acceptUrl);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />

      <section className="max-w-3xl mx-auto p-6 sm:py-10">
        <h1 className="text-3xl font-bold">Convites</h1>

        {!pode ? (
          <div className="mt-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-5">
            Apenas o responsável pode gerar convites.
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-6 bg-white border border-slate-200 rounded-3xl p-6"
          >
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              placeholder="Telefone"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            <select
              value={papelProposto}
              onChange={e => setPapel(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
            >
              <option value="MUSICO">Músico</option>
              <option value="COORDENADOR">Coordenador</option>
              <option value="RESPONSAVEL">Responsável</option>
            </select>

            {link && (
              <div className="mt-4 bg-emerald-50 p-4 rounded-xl">
                <div className="break-all text-sm">{link}</div>

                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(link)}
                  className="mt-3 font-semibold text-violet-700 text-sm"
                >
                  Copiar link
                </button>
              </div>
            )}

            <button className="mt-6 w-full rounded-xl bg-violet-700 text-white py-3 font-semibold">
              Gerar convite
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
