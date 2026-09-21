import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function slugify(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NovoGrupo() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    paroquia: '',
    cidade: '',
    corTema: '#D5AE62'
  });

  const [erro, setErro] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErro('');

    try {
      const grupo = await api('/grupos', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          slug: slugify(form.nome)
        })
      });

      localStorage.setItem(
        'cantus_grupo_ativo',
        JSON.stringify(grupo)
      );

      navigate(`/g/${grupo.slug}`);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao criar grupo.'
      );
    }
  }

  return (
    <main className="cantus-page">
      <header className="border-b border-white/10 bg-[#0b0c0e]/90">
        <div className="cantus-shell h-20 flex items-center justify-between">
          <Link to="/dashboard" className="cantus-eyebrow">
            ← Cantus Dei
          </Link>
        </div>
      </header>

      <section className="cantus-shell py-10 sm:py-14">
        <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-8 lg:gap-12 items-start">
          <aside className="pt-2">
            <div className="text-6xl cantus-gold">
              ♫
            </div>

            <div className="cantus-eyebrow mt-7">
              Novo ministério
            </div>

            <h1 className="cantus-display mt-4 text-5xl sm:text-6xl leading-[.95]">
              Dê identidade
              <span className="block cantus-gold">
                ao seu grupo.
              </span>
            </h1>

            <p className="mt-6 max-w-lg cantus-muted leading-7">
              Cadastre o ministério, a paróquia e a cidade. Depois você
              poderá convidar músicos, organizar repertórios e preparar
              as celebrações.
            </p>

            <div className="cantus-quote mt-8 max-w-lg">
              <div className="cantus-display text-2xl">
                “Tocai com arte e alegria.”
              </div>
              <div className="mt-2 text-sm cantus-gold">
                Salmo 32(33),3
              </div>
            </div>
          </aside>

          <form
            onSubmit={submit}
            className="cantus-card p-6 sm:p-8"
          >
            <div className="cantus-eyebrow">
              Dados do grupo
            </div>

            <h2 className="cantus-display mt-3 text-3xl">
              Criar novo grupo
            </h2>

            {[
              ['nome', 'Nome do grupo', 'Ex.: Ministério São José'],
              ['paroquia', 'Paróquia', 'Ex.: Paróquia São José'],
              ['cidade', 'Cidade', 'Ex.: Londrina - PR']
            ].map(([key, label, placeholder]) => (
              <label className="block mt-5" key={key}>
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  {label}
                </span>

                <input
                  required
                  value={(form as Record<string, string>)[key]}
                  onChange={e =>
                    setForm({
                      ...form,
                      [key]: e.target.value
                    })
                  }
                  placeholder={placeholder}
                  className="cantus-input mt-2"
                />
              </label>
            ))}

            <label className="block mt-5">
              <span className="text-sm font-semibold text-[#d9d2c6]">
                Cor de identidade
              </span>

              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={form.corTema}
                  onChange={e =>
                    setForm({
                      ...form,
                      corTema: e.target.value
                    })
                  }
                  className="w-14 h-12 rounded-xl bg-transparent border border-white/10 p-1"
                />

                <span className="text-sm cantus-muted">
                  Essa cor poderá representar o grupo em destaques visuais.
                </span>
              </div>
            </label>

            {erro && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
                {erro}
              </div>
            )}

            <div className="mt-7 flex flex-wrap gap-3">
              <button className="cantus-primary px-6 py-3">
                Criar grupo
              </button>

              <Link
                to="/dashboard"
                className="cantus-secondary px-6 py-3"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
