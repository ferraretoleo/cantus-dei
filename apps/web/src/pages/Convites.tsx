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
  const [erro, setErro] = useState('');

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;
  const pode = grupo.papel === 'RESPONSAVEL';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErro('');

    try {
      const data = await api(`/grupos/${grupoId}/convites`, {
        method: 'POST',
        body: JSON.stringify({
          email: email || undefined,
          telefone: telefone || undefined,
          papelProposto
        })
      });

      setLink(data.acceptUrl);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao gerar convite.'
      );
    }
  }

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-7 items-start">
          <aside>
            <div className="cantus-eyebrow">
              Convide para servir
            </div>

            <h1 className="cantus-section-title mt-3">
              Novos músicos,
              <span className="block cantus-gold">
                novas vozes.
              </span>
            </h1>

            <p className="mt-4 cantus-muted leading-7">
              Gere um convite para quem vai cantar, tocar ou coordenar
              junto com o grupo.
            </p>
          </aside>

          {!pode ? (
            <div className="cantus-card p-6">
              <div className="cantus-eyebrow">
                Acesso restrito
              </div>

              <p className="mt-4 cantus-muted">
                Apenas o responsável pelo grupo pode gerar convites.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="cantus-card p-6 sm:p-8"
            >
              <h2 className="cantus-display text-3xl">
                Criar convite
              </h2>

              <label className="block mt-5">
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  E-mail
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="cantus-input mt-2"
                  placeholder="musico@email.com"
                />
              </label>

              <label className="block mt-4">
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  Telefone
                </span>

                <input
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  className="cantus-input mt-2"
                  placeholder="(00) 00000-0000"
                />
              </label>

              <label className="block mt-4">
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  Papel no grupo
                </span>

                <select
                  value={papelProposto}
                  onChange={e => setPapel(e.target.value)}
                  className="cantus-input mt-2"
                >
                  <option value="MUSICO">Músico</option>
                  <option value="COORDENADOR">Coordenador</option>
                  <option value="RESPONSAVEL">Responsável</option>
                </select>
              </label>

              {erro && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
                  {erro}
                </div>
              )}

              {link && (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
                  <div className="text-xs uppercase tracking-[.16em] font-bold text-emerald-300">
                    Convite criado
                  </div>

                  <div className="mt-3 break-all text-sm text-emerald-100">
                    {link}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(link)
                    }
                    className="cantus-secondary mt-4 px-4 py-2 text-sm"
                  >
                    Copiar link
                  </button>
                </div>
              )}

              <button className="cantus-primary mt-6 px-6 py-3">
                Gerar convite
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
