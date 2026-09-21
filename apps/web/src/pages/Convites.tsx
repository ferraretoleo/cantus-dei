import { useState, type FormEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

export default function Convites() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();

  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [papelProposto, setPapelProposto] = useState('MUSICO');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [link, setLink] = useState('');
  const [carregando, setCarregando] = useState(false);

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;
  const grupoNome = grupo.nome;
  const podeConvidar = grupo.papel === 'RESPONSAVEL';

  async function enviar(e: FormEvent) {
    e.preventDefault();

    setErro('');
    setSucesso('');
    setLink('');

    if (!email && !telefone) {
      setErro('Informe o e-mail ou telefone do músico.');
      return;
    }

    setCarregando(true);

    try {
      const data = await api(`/grupos/${grupoId}/convites`, {
        method: 'POST',
        body: JSON.stringify({
          email: email || undefined,
          telefone: telefone || undefined,
          papelProposto
        })
      });

      setSucesso('Convite criado com sucesso.');
      setLink(data.acceptUrl || '');
      setEmail('');
      setTelefone('');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao gerar convite.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function copiarLink() {
    if (!link) return;

    await navigator.clipboard.writeText(link);
    setSucesso('Link copiado para a área de transferência.');
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-slate-900">
            Convites
          </h1>

          <p className="mt-2 text-slate-500">
            Adicione novos músicos ao grupo {grupoNome}
          </p>
        </div>

        {!podeConvidar ? (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 p-5">
            Apenas o responsável pelo grupo pode criar convites.
          </div>
        ) : (
          <form
            onSubmit={enviar}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8"
          >
            <label className="block mb-5">
              <span className="block text-sm font-medium mb-2">
                E-mail
              </span>

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="musico@email.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="block mb-5">
              <span className="block text-sm font-medium mb-2">
                Telefone
              </span>

              <input
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="43999999999"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="block mb-6">
              <span className="block text-sm font-medium mb-2">
                Papel no grupo
              </span>

              <select
                value={papelProposto}
                onChange={e => setPapelProposto(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 bg-white"
              >
                <option value="MUSICO">Músico</option>
                <option value="COORDENADOR">Coordenador</option>
                <option value="RESPONSAVEL">Responsável</option>
              </select>
            </label>

            {erro && (
              <div className="mb-5 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="mb-5 rounded-xl bg-emerald-50 text-emerald-700 p-3 text-sm">
                {sucesso}
              </div>
            )}

            {link && (
              <div className="mb-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Link do convite
                </div>

                <div className="mt-2 text-sm text-slate-700 break-all">
                  {link}
                </div>

                <button
                  type="button"
                  onClick={copiarLink}
                  className="mt-3 text-sm font-semibold text-violet-700"
                >
                  Copiar link
                </button>
              </div>
            )}

            <button
              disabled={carregando}
              className="w-full rounded-xl bg-violet-700 text-white py-3 font-semibold disabled:opacity-50"
            >
              {carregando
                ? 'Gerando convite...'
                : 'Gerar convite'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
