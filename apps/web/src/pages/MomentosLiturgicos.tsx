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
      setErro(e instanceof Error ? e.message : 'Erro ao carregar momentos.');
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criar(e: FormEvent) {
    e.preventDefault();

    try {
      await api(`/grupos/${grupoId}/momentos`, {
        method: 'POST',
        body: JSON.stringify({ nome })
      });

      setNome('');
      await carregar();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao criar momento.'
      );
    }
  }

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <div className="grid lg:grid-cols-[.85fr_1.15fr] gap-7 items-start">
          <aside>
            <div className="cantus-eyebrow">
              Liturgia
            </div>

            <h1 className="cantus-section-title mt-3">
              Momentos
              <span className="block cantus-gold">
                da celebração.
              </span>
            </h1>

            <p className="mt-4 cantus-muted leading-7">
              Organize o repertório de acordo com cada parte da liturgia.
            </p>

            {pode && (
              <form
                onSubmit={criar}
                className="cantus-card mt-6 p-5"
              >
                <div className="cantus-eyebrow">
                  Personalizar
                </div>

                <label className="block mt-4">
                  <span className="text-sm font-semibold text-[#d9d2c6]">
                    Novo momento
                  </span>

                  <input
                    required
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Ex.: Adoração"
                    className="cantus-input mt-2"
                  />
                </label>

                <button className="cantus-primary mt-4 px-5 py-2.5 text-sm">
                  Adicionar momento
                </button>
              </form>
            )}
          </aside>

          <section>
            {erro && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
                {erro}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {momentos.map(m => (
                <article
                  key={m.id}
                  className="cantus-card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-3xl cantus-gold">
                      ♪
                    </div>

                    <div className="text-xs cantus-muted">
                      {String(m.ordemLiturgica).padStart(2, '0')}
                    </div>
                  </div>

                  <h2 className="cantus-display mt-5 text-2xl">
                    {m.nome}
                  </h2>

                  {m.grupoId && (
                    <div className="mt-3">
                      <span className="cantus-badge">
                        Personalizado
                      </span>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
