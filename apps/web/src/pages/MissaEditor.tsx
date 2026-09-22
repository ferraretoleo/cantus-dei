import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import GroupHeader, { getGrupoAtivo } from '../components/GroupHeader';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type RepertorioItem = {
  momentoId: string;
  musicaId: string;
  tomDaExecucao: string;
  observacao: string;
};

export default function MissaEditor() {
  const { slug, missaId } = useParams();
  const navigate = useNavigate();
  const grupo = getGrupoAtivo();
  const nova = missaId === 'nova';
  const { user, paroquiaAtiva } = useAuth();

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
  const [repertorio, setRepertorio] = useState<RepertorioItem[]>([]);
  const [escala, setEscala] = useState<any[]>([]);
  const [publicUrl, setPublicUrl] = useState('');
  const [qr, setQr] = useState('');
  const [erro, setErro] = useState('');

  const [novoMomento, setNovoMomento] = useState('');
  const [criandoMomento, setCriandoMomento] = useState(false);

  if (!grupo || grupo.slug !== slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoAtual = grupo;
  const grupoId = grupoAtual.id;
  const podeEditar =
    user?.perfilGlobal === 'MASTER' ||
    paroquiaAtiva?.papel === 'ADMIN_PAROQUIA' ||
    grupoAtual.papel === 'RESPONSAVEL';

  const podeCriarMomento =
    user?.perfilGlobal === 'MASTER' ||
    paroquiaAtiva?.papel === 'ADMIN_PAROQUIA';

  async function carregarMomentos() {
    const lista = await api(`/grupos/${grupoId}/momentos`);
    setMomentos(lista);
    return lista;
  }

  useEffect(() => {
    Promise.all([
      api(`/grupos/${grupoId}/momentos`),
      api(`/grupos/${grupoId}/musicas`),
      api(`/grupos/${grupoId}/membros`)
    ])
      .then(([mo, mu, me]) => {
        setMomentos(mo);
        setMusicas(mu);
        setMembros(me);
      })
      .catch(e => setErro(e.message));

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
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao salvar celebração.'
      );
    }
  }

  async function cadastrarNovoMomento(e: FormEvent) {
    e.preventDefault();

    if (!novoMomento.trim()) return;

    setCriandoMomento(true);
    setErro('');

    try {
      const criado = await api(`/grupos/${grupoId}/momentos`, {
        method: 'POST',
        body: JSON.stringify({
          nome: novoMomento.trim()
        })
      });

      const lista = await carregarMomentos();
      setNovoMomento('');

      if (musicas.length) {
        setRepertorio(atual => [
          ...atual,
          {
            momentoId: criado.id,
            musicaId: musicas[0].id,
            tomDaExecucao: musicas[0].tomOriginal || '',
            observacao: ''
          }
        ]);
      }

      if (!lista.some((m: any) => m.id === criado.id)) {
        setMomentos(atual => [...atual, criado]);
      }
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao cadastrar novo momento.'
      );
    } finally {
      setCriandoMomento(false);
    }
  }

  function adicionarMusica(momentoId?: string) {
    const momento =
      momentos.find(m => m.id === momentoId) ||
      momentos[0];

    const primeiraMusica = musicas[0];

    if (!momento || !primeiraMusica) {
      alert(
        !primeiraMusica
          ? 'Cadastre pelo menos uma música antes de montar o repertório.'
          : 'Nenhum momento litúrgico disponível.'
      );
      return;
    }

    setRepertorio(atual => [
      ...atual,
      {
        momentoId: momento.id,
        musicaId: primeiraMusica.id,
        tomDaExecucao: primeiraMusica.tomOriginal || '',
        observacao: ''
      }
    ]);
  }

  function adicionarOutraNoMesmoMomento(index: number) {
    const itemBase = repertorio[index];
    const primeiraMusica = musicas[0];

    if (!itemBase || !primeiraMusica) return;

    const novoItem: RepertorioItem = {
      momentoId: itemBase.momentoId,
      musicaId: primeiraMusica.id,
      tomDaExecucao: primeiraMusica.tomOriginal || '',
      observacao: ''
    };

    setRepertorio(atual => {
      const copia = [...atual];
      copia.splice(index + 1, 0, novoItem);
      return copia;
    });
  }

  function moverItem(index: number, direcao: -1 | 1) {
    const destino = index + direcao;

    if (destino < 0 || destino >= repertorio.length) return;

    const copia = [...repertorio];
    const atual = copia[index];
    copia[index] = copia[destino];
    copia[destino] = atual;

    setRepertorio(copia);
  }

  async function salvarRepertorio() {
    try {
      await api(`/grupos/${grupoId}/missas/${missaId}/repertorio`, {
        method: 'PUT',
        body: JSON.stringify({
          itens: repertorio
        })
      });

      alert('Repertório salvo.');
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao salvar repertório.'
      );
    }
  }

  function toggleMembro(m: any) {
    const existe = escala.find(x => x.userId === m.userId);

    if (existe) {
      setEscala(
        escala.filter(x => x.userId !== m.userId)
      );
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
    const data = await api(
      `/grupos/${grupoId}/missas/${missaId}/publicar`,
      { method: 'POST' }
    );

    setPublicUrl(data.publicUrl);
    setQr(await QRCode.toDataURL(data.publicUrl));
  }

  async function confirmar(
    status: 'CONFIRMADO' | 'AUSENTE'
  ) {
    await api(
      `/grupos/${grupoId}/missas/${missaId}/confirmar`,
      {
        method: 'POST',
        body: JSON.stringify({
          confirmacao: status
        })
      }
    );

    alert('Resposta registrada.');
  }

  const meuUser = JSON.parse(
    localStorage.getItem('cantus_user') || 'null'
  );

  const estouEscalado = escala.some(
    x => x.userId === meuUser?.id
  );

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <Link
          to={`/g/${slug}/calendario`}
          className="cantus-eyebrow"
        >
          ← Voltar ao calendário
        </Link>

        <div className="mt-6 grid lg:grid-cols-[.8fr_1.2fr] gap-7 items-start">
          <aside>
            <div className="text-6xl cantus-gold">
              ✦
            </div>

            <div className="cantus-eyebrow mt-7">
              {nova ? 'Nova celebração' : 'Preparação litúrgica'}
            </div>

            <h1 className="cantus-display mt-4 text-5xl sm:text-6xl leading-[.95]">
              {nova ? (
                <>
                  Prepare a
                  <span className="block cantus-gold">
                    próxima celebração.
                  </span>
                </>
              ) : (
                <>
                  Organize cada
                  <span className="block cantus-gold">
                    detalhe da missa.
                  </span>
                </>
              )}
            </h1>

            <p className="mt-6 max-w-lg cantus-muted leading-7">
              A celebração pode ter quantos momentos forem necessários.
              Ritos especiais, salmos adicionais, ladainhas e músicas
              repetidas no mesmo momento são permitidos.
            </p>

            <div className="cantus-quote mt-8 max-w-lg">
              <div className="cantus-display text-2xl">
                “Aclamai o Senhor, terra inteira; exultai e cantai.”
              </div>

              <div className="mt-2 text-sm cantus-gold">
                Salmo 97(98),4
              </div>
            </div>
          </aside>

          <div>
            {erro && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
                {erro}
              </div>
            )}

            <form
              onSubmit={salvarBase}
              className="cantus-card p-6 sm:p-8"
            >
              <div className="cantus-eyebrow">
                Dados da celebração
              </div>

              <h2 className="cantus-display mt-3 text-3xl">
                {nova ? 'Criar celebração' : 'Informações principais'}
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <label>
                  <span className="text-sm font-semibold text-[#d9d2c6]">
                    Data e hora
                  </span>

                  <input
                    required
                    type="datetime-local"
                    value={form.dataHora}
                    onChange={e =>
                      setForm({
                        ...form,
                        dataHora: e.target.value
                      })
                    }
                    className="cantus-input mt-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-[#d9d2c6]">
                    Local
                  </span>

                  <input
                    required
                    value={form.local}
                    onChange={e =>
                      setForm({
                        ...form,
                        local: e.target.value
                      })
                    }
                    className="cantus-input mt-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-[#d9d2c6]">
                    Tipo de celebração
                  </span>

                  <input
                    required
                    value={form.tipoCelebracao}
                    onChange={e =>
                      setForm({
                        ...form,
                        tipoCelebracao: e.target.value
                      })
                    }
                    className="cantus-input mt-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-[#d9d2c6]">
                    Tempo litúrgico
                  </span>

                  <input
                    value={form.tempoLiturgico}
                    onChange={e =>
                      setForm({
                        ...form,
                        tempoLiturgico: e.target.value
                      })
                    }
                    placeholder="Advento, Quaresma, Tempo Comum..."
                    className="cantus-input mt-2"
                  />
                </label>
              </div>

              <label className="block mt-5">
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  Observações
                </span>

                <textarea
                  rows={4}
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

              {podeEditar && (
                <button className="cantus-primary mt-6 px-6 py-3">
                  {nova ? 'Criar celebração' : 'Salvar dados'}
                </button>
              )}
            </form>

            {!nova && (
              <>
                <section className="cantus-card mt-6 p-6 sm:p-8">
                  <div className="cantus-eyebrow">
                    Momentos especiais
                  </div>

                  <h2 className="cantus-display mt-3 text-3xl">
                    Personalize o rito
                  </h2>

                  <p className="mt-2 text-sm leading-6 cantus-muted">
                    Cadastre momentos adicionais como Ladainha, Salmo 1,
                    Salmo 2, Veneração da Cruz, Procissão ou qualquer
                    etapa especial da celebração.
                  </p>

                  {podeCriarMomento && (
                    <form
                      onSubmit={cadastrarNovoMomento}
                      className="mt-5 flex flex-col sm:flex-row gap-3"
                    >
                      <input
                        value={novoMomento}
                        onChange={e =>
                          setNovoMomento(e.target.value)
                        }
                        placeholder="Ex.: Ladainha ou Salmo 2"
                        className="cantus-input flex-1"
                      />

                      <button
                        disabled={criandoMomento}
                        className="cantus-secondary px-5 py-3 disabled:opacity-50"
                      >
                        {criandoMomento
                          ? 'Criando...'
                          : '+ Criar momento'}
                      </button>
                    </form>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    {momentos.map(m => (
                      <span
                        key={m.id}
                        className="cantus-badge"
                      >
                        {m.nome}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="cantus-card mt-6 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="cantus-eyebrow">
                        Repertório
                      </div>

                      <h2 className="cantus-display mt-3 text-3xl">
                        Músicas da celebração
                      </h2>

                      <p className="mt-2 text-sm leading-6 cantus-muted">
                        Você pode repetir o mesmo momento com várias músicas.
                        Exemplo: duas músicas na Comunhão ou sete músicas
                        diferentes para sete Salmos.
                      </p>
                    </div>

                    {podeEditar && (
                      <button
                        onClick={() => adicionarMusica()}
                        className="cantus-secondary px-5 py-2.5 text-sm self-start"
                      >
                        + Adicionar música
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 mt-6">
                    {repertorio.map((item, index) => (
                      <div
                        key={`${item.momentoId}-${item.musicaId}-${index}`}
                        className="rounded-2xl border border-white/10 bg-white/[.025] p-4"
                      >
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className="text-xs font-bold uppercase tracking-[.14em] cantus-gold">
                            Item {index + 1}
                          </div>

                          {podeEditar && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => moverItem(index, -1)}
                                className="cantus-secondary px-3 py-1.5 text-xs disabled:opacity-30"
                              >
                                ↑
                              </button>

                              <button
                                type="button"
                                disabled={index === repertorio.length - 1}
                                onClick={() => moverItem(index, 1)}
                                className="cantus-secondary px-3 py-1.5 text-xs disabled:opacity-30"
                              >
                                ↓
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-[1fr_1.5fr_.55fr] gap-3">
                          <label>
                            <span className="text-xs font-semibold cantus-muted">
                              Momento
                            </span>

                            <select
                              value={item.momentoId}
                              disabled={!podeEditar}
                              onChange={e => {
                                const x = [...repertorio];

                                x[index] = {
                                  ...x[index],
                                  momentoId: e.target.value
                                };

                                setRepertorio(x);
                              }}
                              className="cantus-input mt-1"
                            >
                              {momentos.map(m => (
                                <option
                                  key={m.id}
                                  value={m.id}
                                >
                                  {m.nome}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="text-xs font-semibold cantus-muted">
                              Música / Cifra
                            </span>

                            <select
                              value={item.musicaId}
                              disabled={!podeEditar}
                              onChange={e => {
                                const x = [...repertorio];

                                const m = musicas.find(
                                  mm => mm.id === e.target.value
                                );

                                x[index] = {
                                  ...x[index],
                                  musicaId: e.target.value,
                                  tomDaExecucao:
                                    m?.tomOriginal || ''
                                };

                                setRepertorio(x);
                              }}
                              className="cantus-input mt-1"
                            >
                              {musicas.map(m => (
                                <option
                                  key={m.id}
                                  value={m.id}
                                >
                                  {m.titulo}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label>
                            <span className="text-xs font-semibold cantus-muted">
                              Tom
                            </span>

                            <input
                              value={item.tomDaExecucao}
                              disabled={!podeEditar}
                              onChange={e => {
                                const x = [...repertorio];

                                x[index] = {
                                  ...x[index],
                                  tomDaExecucao: e.target.value
                                };

                                setRepertorio(x);
                              }}
                              className="cantus-input mt-1"
                            />
                          </label>
                        </div>

                        <label className="block mt-3">
                          <span className="text-xs font-semibold cantus-muted">
                            Observação deste item
                          </span>

                          <input
                            value={item.observacao}
                            disabled={!podeEditar}
                            onChange={e => {
                              const x = [...repertorio];

                              x[index] = {
                                ...x[index],
                                observacao: e.target.value
                              };

                              setRepertorio(x);
                            }}
                            placeholder="Ex.: somente refrão, repetir 2x..."
                            className="cantus-input mt-1"
                          />
                        </label>

                        {podeEditar && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                adicionarOutraNoMesmoMomento(index)
                              }
                              className="cantus-secondary px-4 py-2 text-sm"
                            >
                              + Outra música neste momento
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setRepertorio(
                                  repertorio.filter(
                                    (_, i) => i !== index
                                  )
                                )
                              }
                              className="cantus-danger px-4 py-2 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {!repertorio.length && (
                      <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                        <div className="text-4xl cantus-gold">
                          ♪
                        </div>

                        <div className="cantus-display mt-4 text-2xl">
                          Repertório ainda vazio
                        </div>

                        <p className="mt-2 text-sm cantus-muted">
                          Adicione quantas músicas e momentos forem necessários.
                        </p>
                      </div>
                    )}
                  </div>

                  {podeEditar && (
                    <button
                      onClick={salvarRepertorio}
                      className="cantus-primary mt-6 px-6 py-3"
                    >
                      Salvar repertório
                    </button>
                  )}
                </section>

                <section className="cantus-card mt-6 p-6 sm:p-8">
                  <div className="cantus-eyebrow">
                    Escala
                  </div>

                  <h2 className="cantus-display mt-3 text-3xl">
                    Quem vai servir?
                  </h2>

                  <p className="mt-2 text-sm cantus-muted">
                    Selecione os músicos escalados para esta celebração.
                  </p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                    {membros.map(m => {
                      const marcado = escala.some(
                        x => x.userId === m.userId
                      );

                      return (
                        <label
                          key={m.userId}
                          className={`rounded-2xl border p-4 cursor-pointer ${
                            marcado
                              ? 'border-[#d5ae62]/55 bg-[#d5ae62]/10'
                              : 'border-white/10 bg-white/[.025]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              disabled={!podeEditar}
                              checked={marcado}
                              onChange={() =>
                                toggleMembro(m)
                              }
                              className="mt-1"
                            />

                            <div>
                              <div className="cantus-display text-xl">
                                {m.nome}
                              </div>

                              <div className="mt-1 text-xs cantus-muted">
                                {[m.instrumento, m.voz]
                                  .filter(Boolean)
                                  .join(' · ') || m.papel}
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {podeEditar && (
                    <button
                      onClick={salvarEscala}
                      className="cantus-primary mt-6 px-6 py-3"
                    >
                      Salvar escala
                    </button>
                  )}

                  {estouEscalado && (
                    <div className="mt-7 border-t border-white/10 pt-6">
                      <div className="cantus-eyebrow">
                        Sua participação
                      </div>

                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() =>
                            confirmar('CONFIRMADO')
                          }
                          className="rounded-full border border-emerald-500/30 bg-emerald-900/20 px-5 py-2.5 text-sm font-bold text-emerald-200"
                        >
                          Confirmar presença
                        </button>

                        <button
                          onClick={() =>
                            confirmar('AUSENTE')
                          }
                          className="cantus-danger px-5 py-2.5 text-sm"
                        >
                          Não poderei participar
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                {podeEditar && (
                  <section className="cantus-card mt-6 p-6 sm:p-8">
                    <div className="cantus-eyebrow">
                      Compartilhar
                    </div>

                    <h2 className="cantus-display mt-3 text-3xl">
                      Publicar celebração
                    </h2>

                    <p className="mt-2 text-sm cantus-muted">
                      Gere link público, QR Code e acesso ao modo palco.
                    </p>

                    <button
                      onClick={publicar}
                      className="cantus-primary mt-6 px-6 py-3"
                    >
                      Publicar / gerar link
                    </button>

                    {publicUrl && (
                      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-5">
                        <div className="cantus-eyebrow">
                          Link público
                        </div>

                        <div className="mt-3 break-all text-sm cantus-muted">
                          {publicUrl}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-5">
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(publicUrl)
                            }
                            className="cantus-secondary px-4 py-2 text-sm"
                          >
                            Copiar link
                          </button>

                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `Repertório da celebração: ${publicUrl}`
                            )}`}
                            className="rounded-full border border-emerald-500/30 bg-emerald-900/20 px-4 py-2 text-sm font-bold text-emerald-200"
                          >
                            WhatsApp
                          </a>

                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={`${publicUrl}/palco`}
                            className="cantus-secondary px-4 py-2 text-sm"
                          >
                            Modo palco
                          </a>
                        </div>

                        {qr && (
                          <div className="mt-6 inline-block rounded-2xl bg-white p-3">
                            <img
                              src={qr}
                              alt="QR Code"
                              className="w-44 h-44"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
