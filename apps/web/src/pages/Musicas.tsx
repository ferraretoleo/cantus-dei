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
      setErro(e instanceof Error ? e.message : 'Erro ao carregar músicas.');
    }
  }

  useEffect(() => { carregar(); }, []);

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
    const vinculados = await api(`/grupos/${grupoId}/musicas/${m.id}/momentos`);
    setMomentoIds(vinculados.map((x: any) => x.id));
    setMostrar(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();

    try {
      const payload = {
        titulo: form.titulo,
        autorCompositor: form.autorCompositor || null,
        tomOriginal: form.tomOriginal || null,
        andamentoBpm: form.andamentoBpm ? Number(form.andamentoBpm) : null,
        tempoCompasso: form.tempoCompasso || null,
        letra: form.letra || null,
        cifra: form.cifra || null,
        notacaoAbc: form.notacaoAbc || null,
        videoUrl: form.videoUrl || '',
        tags: form.tags.split(',').map(x => x.trim()).filter(Boolean),
        observacoes: form.observacoes || null,
        compartilhada: false
      };

      let musicaId = editId;

      if (editId) {
        await api(`/grupos/${grupoId}/musicas/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        const criada = await api(`/grupos/${grupoId}/musicas`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        musicaId = criada.id;
      }

      await api(`/grupos/${grupoId}/musicas/${musicaId}/momentos`, {
        method: 'PUT',
        body: JSON.stringify({ momentoIds })
      });

      setForm(vazio);
      setMomentoIds([]);
      setEditId(null);
      setMostrar(false);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta música?')) return;
    await api(`/grupos/${grupoId}/musicas/${id}`, { method: 'DELETE' });
    await carregar();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />
      <section className="max-w-7xl mx-auto p-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Músicas</h1>
            <p className="mt-2 text-slate-500">Letras, cifras, partitura e classificação litúrgica.</p>
          </div>
          {pode && (
            <button
              onClick={() => {
                setForm(vazio);
                setMomentoIds([]);
                setEditId(null);
                setMostrar(true);
              }}
              className="rounded-xl bg-violet-700 text-white px-5 py-3 font-semibold"
            >
              Nova música
            </button>
          )}
        </div>

        {mostrar && pode && (
          <form onSubmit={salvar} className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
            <div className="flex justify-between gap-3">
              <h2 className="text-xl font-bold">{editId ? 'Editar música' : 'Nova música'}</h2>
              <button type="button" onClick={() => setMostrar(false)} className="text-sm text-slate-500">Fechar</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-5">
              {[
                ['titulo', 'Título', 'text'],
                ['autorCompositor', 'Autor / Compositor', 'text'],
                ['tomOriginal', 'Tom original', 'text'],
                ['andamentoBpm', 'BPM', 'number'],
                ['tempoCompasso', 'Compasso', 'text'],
                ['videoUrl', 'Vídeo de referência', 'url']
              ].map(([key, label, type]) => (
                <label key={key}>
                  <span className="text-sm font-medium">{label}</span>
                  <input
                    required={key === 'titulo'}
                    type={type}
                    value={(form as Record<string,string>)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5">
              <div className="font-semibold">Momentos Litúrgicos</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {momentos.map(m => (
                  <label key={m.id} className={`rounded-xl border p-3 cursor-pointer ${momentoIds.includes(m.id) ? 'border-violet-500 bg-violet-50' : 'border-slate-200'}`}>
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
                    {m.nome}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mt-5">
              <label>
                <span className="text-sm font-medium">Letra</span>
                <textarea rows={10} value={form.letra} onChange={e => setForm({ ...form, letra: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
              </label>
              <label>
                <span className="text-sm font-medium">Cifra</span>
                <textarea rows={10} value={form.cifra} onChange={e => setForm({ ...form, cifra: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm" />
              </label>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Partitura ABC</span>
                <button type="button" onClick={() => setForm({ ...form, notacaoAbc: exemploAbc })} className="text-sm font-semibold text-violet-700">Carregar exemplo</button>
              </div>
              <textarea rows={8} value={form.notacaoAbc} onChange={e => setForm({ ...form, notacaoAbc: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm" />
              {form.notacaoAbc && (
                <div className="mt-4 border border-slate-200 rounded-2xl p-4">
                  <AbcScore abc={form.notacaoAbc} titulo={form.titulo || 'Partitura'} />
                </div>
              )}
            </div>

            <label className="block mt-5">
              <span className="text-sm font-medium">Tags</span>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-medium">Observações</span>
              <textarea rows={3} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
            </label>

            <button className="mt-5 rounded-xl bg-violet-700 text-white px-6 py-3 font-semibold">Salvar música</button>
          </form>
        )}

        {erro && <div className="mt-5 bg-red-50 text-red-700 p-4 rounded-xl">{erro}</div>}

        <form onSubmit={e => { e.preventDefault(); carregar(); }} className="flex gap-2 mt-6">
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar música..." className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3" />
          <button className="rounded-xl bg-slate-900 text-white px-5 font-semibold">Buscar</button>
        </form>

        <div className="grid lg:grid-cols-2 gap-4 mt-6">
          {lista.map(m => (
            <article key={m.id} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{m.titulo}</h2>
                  <p className="text-sm text-slate-500">{m.autorCompositor || 'Autor não informado'}</p>
                </div>
                {m.tomOriginal && <span className="h-fit bg-violet-50 text-violet-700 rounded-lg px-3 py-1 text-sm font-bold">{m.tomOriginal}</span>}
              </div>

              {(m.cifra || m.letra) && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-violet-700">Letra e cifra</summary>
                  {m.cifra && <pre className="mt-3 bg-slate-50 rounded-xl p-4 whitespace-pre-wrap font-mono text-sm">{m.cifra}</pre>}
                  {m.letra && <div className="mt-3 whitespace-pre-wrap text-sm leading-6">{m.letra}</div>}
                </details>
              )}

              {m.notacaoAbc && (
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold text-violet-700">Partitura</summary>
                  <div className="mt-3"><AbcScore abc={m.notacaoAbc} titulo={m.titulo} /></div>
                </details>
              )}

              {pode && (
                <div className="flex gap-4 mt-5">
                  <button onClick={() => editar(m)} className="font-semibold text-violet-700 text-sm">Editar</button>
                  <button onClick={() => excluir(m.id)} className="font-semibold text-red-600 text-sm">Excluir</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
