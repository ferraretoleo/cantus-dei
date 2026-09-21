import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';

export default function MissaEditor() {
  const { slug, missaId } = useParams();
  const navigate = useNavigate();
  const grupo = getGrupoAtivo();
  const nova = missaId === 'nova';

  const [form, setForm] = useState({
    dataHora: '',
    local: '',
    tipoCelebracao: 'Santa Missa',
    tempoLiturgico: '',
    observacoes: ''
  });

  const [momentos, setMomentos] = useState<any[]>([]);
  const [musicas, setMusicas] = useState<any[]>([]);
  const [membros, setMembros] = useState<any[]>([]);
  const [repertorio, setRepertorio] = useState<any[]>([]);
  const [escala, setEscala] = useState<any[]>([]);
  const [publicUrl, setPublicUrl] = useState('');
  const [qr, setQr] = useState('');
  const [erro, setErro] = useState('');

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoId = grupo.id;
  const podeEditar = grupo.papel !== 'MUSICO';

  useEffect(() => {
    Promise.all([
      api(`/grupos/${grupoId}/momentos`),
      api(`/grupos/${grupoId}/musicas`),
      api(`/grupos/${grupoId}/membros`)
    ]).then(([mo, mu, me]) => {
      setMomentos(mo);
      setMusicas(mu);
      setMembros(me);
    });

    if (!nova && missaId) {
      api(`/grupos/${grupoId}/missas/${missaId}`)
        .then(data => {
          const m = data.missa;
          setForm({
            dataHora: new Date(m.dataHora).toISOString().slice(0, 16),
            local: m.local,
            tipoCelebracao: m.tipoCelebracao,
            tempoLiturgico: m.tempoLiturgico || '',
            observacoes: m.observacoes || ''
          });

          setRepertorio(
            data.repertorio.map((r: any) => ({
              momentoId: r.momentoId,
              musicaId: r.musicaId,
              tomDaExecucao: r.tomDaExecucao || '',
              observacao: r.observacao || ''
            }))
          );

          setEscala(
            data.escala.map((e: any) => ({
              userId: e.userId,
              instrumentoVoz: e.instrumentoVoz || '',
              confirmacao: e.confirmacao
            }))
          );
        })
        .catch(e => setErro(e.message));
    }
  }, []);

  async function salvarBase(e: FormEvent) {
    e.preventDefault();
    setErro('');

    try {
      const payload = {
        ...form,
        dataHora: new Date(form.dataHora).toISOString(),
        tempoLiturgico: form.tempoLiturgico || null,
        observacoes: form.observacoes || null
      };

      if (nova) {
        const m = await api(`/grupos/${grupoId}/missas`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        navigate(`/g/${slug}/missas/${m.id}`, { replace: true });
      } else {
        await api(`/grupos/${grupoId}/missas/${missaId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar celebração.');
    }
  }

  function adicionarMusica() {
    const primeiroMomento = momentos[0];
    const primeiraMusica = musicas[0];
    if (!primeiroMomento || !primeiraMusica) return;

    setRepertorio([
      ...repertorio,
      {
        momentoId: primeiroMomento.id,
        musicaId: primeiraMusica.id,
        tomDaExecucao: primeiraMusica.tomOriginal || '',
        observacao: ''
      }
    ]);
  }

  async function salvarRepertorio() {
    await api(`/grupos/${grupoId}/missas/${missaId}/repertorio`, {
      method: 'PUT',
      body: JSON.stringify({ itens: repertorio })
    });
    alert('Repertório salvo.');
  }

  function toggleMembro(m: any) {
    const existe = escala.find(x => x.userId === m.userId);

    if (existe) {
      setEscala(escala.filter(x => x.userId !== m.userId));
    } else {
      setEscala([
        ...escala,
        {
          userId: m.userId,
          instrumentoVoz: m.instrumento || m.voz || '',
          confirmacao: 'PENDENTE'
        }
      ]);
    }
  }

  async function salvarEscala() {
    await api(`/grupos/${grupoId}/missas/${missaId}/escala`, {
      method: 'PUT',
      body: JSON.stringify({
        itens: escala.map(({ userId, instrumentoVoz }) => ({
          userId,
          instrumentoVoz
        }))
      })
    });
    alert('Escala salva.');
  }

  async function publicar() {
    const data = await api(`/grupos/${grupoId}/missas/${missaId}/publicar`, {
      method: 'POST'
    });

    setPublicUrl(data.publicUrl);
    setQr(await QRCode.toDataURL(data.publicUrl));
  }

  async function confirmar(status: 'CONFIRMADO' | 'AUSENTE') {
    await api(`/grupos/${grupoId}/missas/${missaId}/confirmar`, {
      method: 'POST',
      body: JSON.stringify({ confirmacao: status })
    });
    alert('Resposta registrada.');
  }

  const meuUser = JSON.parse(localStorage.getItem('cantus_user') || 'null');
  const estouEscalado = escala.some(x => x.userId === meuUser?.id);

  return (
    <main className="min-h-screen bg-slate-50">
      <GroupHeader />
      <section className="max-w-6xl mx-auto p-6 sm:py-10">
        <Link to={`/g/${slug}/calendario`} className="text-sm font-semibold text-violet-700">
          Voltar ao calendário
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          {nova ? 'Nova celebração' : 'Celebração'}
        </h1>

        {erro && <div className="mt-5 bg-red-50 text-red-700 p-4 rounded-xl">{erro}</div>}

        <form onSubmit={salvarBase} className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
          <h2 className="text-xl font-bold">Dados da celebração</h2>

          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <label>
              <span className="text-sm font-medium">Data e hora</span>
              <input required type="datetime-local" value={form.dataHora} onChange={e => setForm({ ...form, dataHora: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
            </label>

            <label>
              <span className="text-sm font-medium">Local</span>
              <input required value={form.local} onChange={e => setForm({ ...form, local: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
            </label>

            <label>
              <span className="text-sm font-medium">Tipo de celebração</span>
              <input required value={form.tipoCelebracao} onChange={e => setForm({ ...form, tipoCelebracao: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
            </label>

            <label>
              <span className="text-sm font-medium">Tempo litúrgico</span>
              <input value={form.tempoLiturgico} onChange={e => setForm({ ...form, tempoLiturgico: e.target.value })} placeholder="Advento, Quaresma, Tempo Comum..." className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
            </label>
          </div>

          <label className="block mt-4">
            <span className="text-sm font-medium">Observações</span>
            <textarea rows={3} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
          </label>

          {podeEditar && (
            <button className="mt-5 rounded-xl bg-violet-700 text-white px-6 py-3 font-semibold">
              {nova ? 'Criar celebração' : 'Salvar dados'}
            </button>
          )}
        </form>

        {!nova && (
          <>
            <section className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Repertório</h2>
                  <p className="text-sm text-slate-500 mt-1">Escolha música e tom para cada momento.</p>
                </div>

                {podeEditar && (
                  <button onClick={adicionarMusica} className="rounded-xl border border-violet-300 text-violet-700 px-4 py-2 font-semibold">
                    Adicionar música
                  </button>
                )}
              </div>

              <div className="space-y-3 mt-5">
                {repertorio.map((item, index) => (
                  <div key={index} className="grid md:grid-cols-[1fr_1.5fr_.6fr_auto] gap-3 items-end border border-slate-200 rounded-2xl p-4">
                    <label>
                      <span className="text-xs font-medium">Momento</span>
                      <select
                        value={item.momentoId}
                        disabled={!podeEditar}
                        onChange={e => {
                          const x = [...repertorio];
                          x[index] = { ...x[index], momentoId: e.target.value };
                          setRepertorio(x);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                      >
                        {momentos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                      </select>
                    </label>

                    <label>
                      <span className="text-xs font-medium">Música</span>
                      <select
                        value={item.musicaId}
                        disabled={!podeEditar}
                        onChange={e => {
                          const x = [...repertorio];
                          const m = musicas.find(mm => mm.id === e.target.value);
                          x[index] = {
                            ...x[index],
                            musicaId: e.target.value,
                            tomDaExecucao: m?.tomOriginal || ''
                          };
                          setRepertorio(x);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
                      >
                        {musicas.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
                      </select>
                    </label>

                    <label>
                      <span className="text-xs font-medium">Tom</span>
                      <input
                        value={item.tomDaExecucao}
                        disabled={!podeEditar}
                        onChange={e => {
                          const x = [...repertorio];
                          x[index] = { ...x[index], tomDaExecucao: e.target.value };
                          setRepertorio(x);
                        }}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                      />
                    </label>

                    {podeEditar && (
                      <button
                        onClick={() => setRepertorio(repertorio.filter((_, i) => i !== index))}
                        className="text-sm font-semibold text-red-600 py-2"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {podeEditar && (
                <button onClick={salvarRepertorio} className="mt-5 rounded-xl bg-violet-700 text-white px-5 py-3 font-semibold">
                  Salvar repertório
                </button>
              )}
            </section>

            <section className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
              <h2 className="text-xl font-bold">Escala</h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
                {membros.map(m => {
                  const marcado = escala.some(x => x.userId === m.userId);

                  return (
                    <label key={m.userId} className={`rounded-xl border p-4 cursor-pointer ${marcado ? 'border-violet-500 bg-violet-50' : 'border-slate-200'}`}>
                      <input type="checkbox" disabled={!podeEditar} checked={marcado} onChange={() => toggleMembro(m)} className="mr-2" />
                      <strong>{m.nome}</strong>
                      <div className="text-xs text-slate-500 mt-1">
                        {[m.instrumento, m.voz].filter(Boolean).join(' · ') || m.papel}
                      </div>
                    </label>
                  );
                })}
              </div>

              {podeEditar && (
                <button onClick={salvarEscala} className="mt-5 rounded-xl bg-violet-700 text-white px-5 py-3 font-semibold">
                  Salvar escala
                </button>
              )}

              {estouEscalado && (
                <div className="mt-6 border-t border-slate-200 pt-5">
                  <div className="font-semibold">Confirmar participação</div>
                  <div className="flex gap-3 mt-3">
                    <button onClick={() => confirmar('CONFIRMADO')} className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold">Confirmar</button>
                    <button onClick={() => confirmar('AUSENTE')} className="rounded-xl bg-red-600 text-white px-4 py-2 font-semibold">Não poderei participar</button>
                  </div>
                </div>
              )}
            </section>

            {podeEditar && (
              <section className="mt-6 bg-white border border-slate-200 rounded-3xl p-6">
                <h2 className="text-xl font-bold">Publicar celebração</h2>
                <p className="mt-2 text-sm text-slate-500">Gera link público, WhatsApp, QR Code e modo palco.</p>

                <button onClick={publicar} className="mt-5 rounded-xl bg-slate-900 text-white px-5 py-3 font-semibold">
                  Publicar / gerar link
                </button>

                {publicUrl && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                    <div className="break-all text-sm">{publicUrl}</div>

                    <div className="flex flex-wrap gap-3 mt-4">
                      <button onClick={() => navigator.clipboard.writeText(publicUrl)} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-sm">
                        Copiar link
                      </button>

                      <a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`Repertório da celebração: ${publicUrl}`)}`} className="rounded-xl bg-emerald-600 text-white px-4 py-2 font-semibold text-sm">
                        WhatsApp
                      </a>

                      <a target="_blank" rel="noreferrer" href={`${publicUrl}/palco`} className="rounded-xl bg-violet-700 text-white px-4 py-2 font-semibold text-sm">
                        Modo palco
                      </a>
                    </div>

                    {qr && <img src={qr} alt="QR Code" className="mt-5 w-44 h-44" />}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}
