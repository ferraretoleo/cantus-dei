import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import AbcScore from '../components/AbcScore';
import { api } from '../lib/api';

const exemploAbc = `X:1
T:Exemplo
M:4/4
L:1/4
Q:1/4=90
K:C
C D E F | G A G2 | F E D C | C4 |`;

const vazio = {
  titulo: '',
  autorCompositor: '',
  tomOriginal: '',
  andamentoBpm: '',
  tempoCompasso: '',
  letra: '',
  cifra: '',
  notacaoAbc: '',
  videoUrl: '',
  tags: '',
  observacoes: ''
};

export default function Musicas() {
  const { slug } = useParams();
  const grupo = getGrupoAtivo();

  const [lista, setLista] = useState<any[]>([]);
  const [momentos, setMomentos] = useState<any[]>([]);
  const [momentoIds, setMomentoIds] = useState<string[]>([]);
  const [form, setForm] = useState(vazio);
  const [editId, setEditId] = useState<string | null>(null);
  const [mostrar, setMostrar] = useState(false);
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;
  const pode = grupo.papel !== 'MUSICO';

  async function carregar() {
    try {
      const [m, mo] = await Promise.all([
        api(`/grupos/${grupoId}/musicas${busca ? `?q=${encodeURIComponent(busca)}` : ''}`),
        api(`/grupos/${grupoId}/momentos`)
      ]);

      setLista(m);
      setMomentos(mo);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao carregar músicas.'
      );
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function editar(m: any) {
    setForm({
      titulo: m.titulo || '',
      autorCompositor: m.autorCompositor || '',
      tomOriginal: m.tomOriginal || '',
      andamentoBpm: m.andamentoBpm ? String(m.andamentoBpm) : '',
      tempoCompasso: m.tempoCompasso || '',
      letra: m.letra || '',
      cifra: m.cifra || '',
      notacaoAbc: m.notacaoAbc || '',
      videoUrl: m.videoUrl || '',
      tags: m.tags?.join(', ') || '',
      observacoes: m.observacoes || ''
    });

    setEditId(m.id);

    const vinculados = await api(
      `/grupos/${grupoId}/musicas/${m.id}/momentos`
    );

    setMomentoIds(
      vinculados.map((x: any) => x.id)
    );

    setMostrar(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro('');

    try {
      const payload = {
        titulo: form.titulo,
        autorCompositor: form.autorCompositor || null,
        tomOriginal: form.tomOriginal || null,
        andamentoBpm: form.andamentoBpm
          ? Number(form.andamentoBpm)
          : null,
        tempoCompasso: form.tempoCompasso || null,
        letra: form.letra || null,
        cifra: form.cifra || null,
        notacaoAbc: form.notacaoAbc || null,
        videoUrl: form.videoUrl || '',
        tags: form.tags
          .split(',')
          .map(x => x.trim())
          .filter(Boolean),
        observacoes: form.observacoes || null,
        compartilhada: false
      };

      let musicaId = editId;

      if (editId) {
        await api(
          `/grupos/${grupoId}/musicas/${editId}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );
      } else {
        const criada = await api(
          `/grupos/${grupoId}/musicas`,
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        musicaId = criada.id;
      }

      await api(
        `/grupos/${grupoId}/musicas/${musicaId}/momentos`,
        {
          method: 'PUT',
          body: JSON.stringify({ momentoIds })
        }
      );

      setForm(vazio);
      setMomentoIds([]);
      setEditId(null);
      setMostrar(false);

      await carregar();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao salvar.'
      );
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta música?')) return;

    await api(
      `/grupos/${grupoId}/musicas/${id}`,
      { method: 'DELETE' }
    );

    await carregar();
  }

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <div className="cantus-eyebrow">
              Repertório
            </div>

            <h1 className="cantus-section-title mt-3">
              Músicas do
              <span className="cantus-gold">
                {' '}ministério.
              </span>
            </h1>

            <p className="mt-3 cantus-muted">
              Letras, cifras, tom, vídeo e partitura no mesmo lugar.
            </p>
          </div>

          {pode && (
            <button
              onClick={() => {
                setForm(vazio);
                setMomentoIds([]);
                setEditId(null);
                setMostrar(true);
              }}
              className="cantus-primary px-6 py-3 self-start"
            >
              + Nova música
            </button>
          )}
        </div>

        {mostrar && pode && (
          <form
            onSubmit={salvar}
            className="cantus-card mt-7 p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="cantus-eyebrow">
                  {editId ? 'Editar repertório' : 'Adicionar ao repertório'}
                </div>

                <h2 className="cantus-display mt-3 text-3xl">
                  {editId ? 'Editar música' : 'Nova música'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMostrar(false)}
                className="cantus-secondary px-4 py-2 text-sm"
              >
                Fechar
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {[
                ['titulo', 'Título', 'text'],
                ['autorCompositor', 'Autor / Compositor', 'text'],
                ['tomOriginal', 'Tom original', 'text'],
                ['andamentoBpm', 'BPM', 'number'],
                ['tempoCompasso', 'Compasso', 'text'],
                ['videoUrl', 'Vídeo de referência', 'url']
              ].map(([key, label, type]) => (
                <label key={key}>
                  <span className="text-sm font-semibold text-[#d9d2c6]">
                    {label}
                  </span>

                  <input
                    required={key === 'titulo'}
                    type={type}
                    value={(form as Record<string, string>)[key]}
                    onChange={e =>
                      setForm({
                        ...form,
                        [key]: e.target.value
                      })
                    }
                    className="cantus-input mt-2"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6">
              <div className="cantus-eyebrow">
                Momentos litúrgicos
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                {momentos.map(m => (
                  <label
                    key={m.id}
                    className={`rounded-xl border p-3 cursor-pointer ${
                      momentoIds.includes(m.id)
                        ? 'border-[#d5ae62]/60 bg-[#d5ae62]/10'
                        : 'border-white/10 bg-white/[.025]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={momentoIds.includes(m.id)}
                      onChange={() =>
                        setMomentoIds(v =>
                          v.includes(m.id)
                            ? v.filter(x => x !== m.id)
                            : [...v, m.id]
                        )
                      }
                      className="mr-2"
                    />

                    <span className="text-sm">
                      {m.nome}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-6">
              <label>
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  Letra
                </span>

                <textarea
                  rows={10}
                  value={form.letra}
                  onChange={e =>
                    setForm({
                      ...form,
                      letra: e.target.value
                    })
                  }
                  className="cantus-input mt-2"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  Cifra
                </span>

                <textarea
                  rows={10}
                  value={form.cifra}
                  onChange={e =>
                    setForm({
                      ...form,
                      cifra: e.target.value
                    })
                  }
                  className="cantus-input mt-2 font-mono text-sm"
                />
              </label>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  Partitura ABC
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      notacaoAbc: exemploAbc
                    })
                  }
                  className="text-sm font-bold cantus-gold"
                >
                  Carregar exemplo
                </button>
              </div>

              <textarea
                rows={8}
                value={form.notacaoAbc}
                onChange={e =>
                  setForm({
                    ...form,
                    notacaoAbc: e.target.value
                  })
                }
                className="cantus-input mt-2 font-mono text-sm"
              />

              {form.notacaoAbc && (
                <div className="mt-4 rounded-2xl bg-white text-black p-4">
                  <AbcScore
                    abc={form.notacaoAbc}
                    titulo={form.titulo || 'Partitura'}
                  />
                </div>
              )}
            </div>

            <label className="block mt-5">
              <span className="text-sm font-semibold text-[#d9d2c6]">
                Tags
              </span>

              <input
                value={form.tags}
                onChange={e =>
                  setForm({
                    ...form,
                    tags: e.target.value
                  })
                }
                className="cantus-input mt-2"
                placeholder="comunhão, ofertório, advento..."
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold text-[#d9d2c6]">
                Observações
              </span>

              <textarea
                rows={3}
                value={form.observacoes}
                onChange={e =>
                  setForm({
                    ...form,
                    observacoes: e.target.value
                  })
                }
                className="cantus-input mt-2"
              />
            </label>

            <button className="cantus-primary mt-6 px-6 py-3">
              Salvar música
            </button>
          </form>
        )}

        {erro && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {erro}
          </div>
        )}

        <form
          onSubmit={e => {
            e.preventDefault();
            carregar();
          }}
          className="cantus-card mt-7 p-4 flex gap-3"
        >
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar no repertório..."
            className="cantus-input"
          />

          <button className="cantus-secondary px-5">
            Buscar
          </button>
        </form>

        <div className="grid lg:grid-cols-2 gap-4 mt-6">
          {lista.map(m => (
            <article
              key={m.id}
              className="cantus-card p-5 sm:p-6"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <div className="cantus-eyebrow">
                    Repertório
                  </div>

                  <h2 className="cantus-display mt-2 text-3xl">
                    {m.titulo}
                  </h2>

                  <p className="mt-1 text-sm cantus-muted">
                    {m.autorCompositor || 'Autor não informado'}
                  </p>
                </div>

                {m.tomOriginal && (
                  <span className="cantus-badge h-fit">
                    Tom {m.tomOriginal}
                  </span>
                )}
              </div>

              {(m.cifra || m.letra) && (
                <details className="mt-5">
                  <summary className="cursor-pointer font-bold cantus-gold">
                    Letra e cifra
                  </summary>

                  {m.cifra && (
                    <pre className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 whitespace-pre-wrap font-mono text-sm text-[#eee9df]">
                      {m.cifra}
                    </pre>
                  )}

                  {m.letra && (
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7 cantus-muted">
                      {m.letra}
                    </div>
                  )}
                </details>
              )}

              {m.notacaoAbc && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-bold cantus-gold">
                    Partitura
                  </summary>

                  <div className="mt-4 rounded-2xl bg-white text-black p-4">
                    <AbcScore
                      abc={m.notacaoAbc}
                      titulo={m.titulo}
                    />
                  </div>
                </details>
              )}

              {pode && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => editar(m)}
                    className="cantus-secondary px-4 py-2 text-sm"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => excluir(m.id)}
                    className="cantus-danger px-4 py-2 text-sm"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
