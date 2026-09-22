import {
  useEffect,
  useState,
  type FormEvent
} from 'react';

import {
  Link,
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';

import GroupHeader, {
  getGrupoAtivo
} from '../components/GroupHeader';

import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type RepertorioItem = {
  momentoId:string;
  musicaId:string;
  tomDaExecucao:string;
  observacao:string;
};

export default function MissaEditor() {
  const {
    slug,
    missaId
  }=useParams();

  const navigate=useNavigate();
  const grupo=getGrupoAtivo();
  const nova=missaId==='nova';

  const {
    user,
    paroquiaAtiva
  }=useAuth();

  const [form,setForm]=useState({
    dataHora:'',
    local:'',
    tipoCelebracao:'Santa Missa',
    tempoLiturgico:'',
    observacoes:''
  });

  const [momentos,setMomentos]=useState<any[]>([]);
  const [musicas,setMusicas]=useState<any[]>([]);
  const [membros,setMembros]=useState<any[]>([]);
  const [repertorio,setRepertorio]=useState<RepertorioItem[]>([]);
  const [escala,setEscala]=useState<any[]>([]);
  const [erro,setErro]=useState('');
  const [salvando,setSalvando]=useState(false);
  const [publicando,setPublicando]=useState(false);

  const [novoMomento,setNovoMomento]=useState('');
  const [criandoMomento,setCriandoMomento]=useState(false);

  if (!grupo || grupo.slug!==slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoAtual=grupo;
  const grupoId=grupoAtual.id;

  const podeEditar=
    user?.perfilGlobal==='MASTER' ||
    paroquiaAtiva?.papel==='ADMIN_PAROQUIA' ||
    grupoAtual.papel==='RESPONSAVEL';

  const podeCriarMomento=
    user?.perfilGlobal==='MASTER' ||
    paroquiaAtiva?.papel==='ADMIN_PAROQUIA';

  async function carregarMomentos() {
    const lista=
      await api(
        `/grupos/${grupoId}/momentos`
      );

    setMomentos(lista);
    return lista;
  }

  useEffect(()=>{
    Promise.all([
      api(`/grupos/${grupoId}/momentos`),
      api(`/grupos/${grupoId}/musicas`),
      api(`/grupos/${grupoId}/membros`)
    ])
      .then(([mo,mu,me])=>{
        setMomentos(mo);
        setMusicas(mu);
        setMembros(me);
      })
      .catch(e=>setErro(e.message));

    if (!nova && missaId) {
      api(
        `/grupos/${grupoId}/missas/${missaId}`
      )
        .then(data=>{
          const missa=data.missa;

          setForm({
            dataHora:
              new Date(
                missa.dataHora
              )
                .toISOString()
                .slice(0,16),
            local:
              missa.local,
            tipoCelebracao:
              missa.tipoCelebracao,
            tempoLiturgico:
              missa.tempoLiturgico || '',
            observacoes:
              missa.observacoes || ''
          });

          setRepertorio(
            data.repertorio.map(
              (r:any)=>({
                momentoId:
                  r.momentoId,
                musicaId:
                  r.musicaId,
                tomDaExecucao:
                  r.tomDaExecucao || '',
                observacao:
                  r.observacao || ''
              })
            )
          );

          setEscala(
            data.escala.map(
              (e:any)=>({
                userId:
                  e.userId,
                instrumentoVoz:
                  e.instrumentoVoz || '',
                confirmacao:
                  e.confirmacao
              })
            )
          );
        })
        .catch(
          e=>setErro(e.message)
        );
    }
  },[]);

  function validarBasico() {
    if (!form.dataHora) {
      return 'Informe a data e hora.';
    }

    if (!form.local.trim()) {
      return 'Informe o local.';
    }

    if (
      !form.tipoCelebracao.trim()
    ) {
      return 'Informe o tipo de celebração.';
    }

    return '';
  }

  function validarPublicacao() {
    const basico=
      validarBasico();

    if (basico) {
      return basico;
    }

    if (!repertorio.length) {
      return 'Adicione pelo menos uma música ao repertório.';
    }

    if (
      repertorio.some(
        item=>
          !item.momentoId ||
          !item.musicaId
      )
    ) {
      return 'Há itens do repertório sem momento ou música.';
    }

    if (!escala.length) {
      return 'Selecione pelo menos um músico para a escala.';
    }

    return '';
  }

  async function persistirTudo(
    navegarDepois:boolean
  ) {
    const basico=
      validarBasico();

    if (basico) {
      throw new Error(basico);
    }

    const payload={
      ...form,
      dataHora:
        new Date(
          form.dataHora
        ).toISOString(),
      tempoLiturgico:
        form.tempoLiturgico || null,
      observacoes:
        form.observacoes || null
    };

    let id=missaId;

    if (nova) {
      const criada=
        await api(
          `/grupos/${grupoId}/missas`,
          {
            method:'POST',
            body:
              JSON.stringify(payload)
          }
        );

      id=criada.id;
    } else {
      await api(
        `/grupos/${grupoId}/missas/${id}`,
        {
          method:'PUT',
          body:
            JSON.stringify(payload)
        }
      );
    }

    await api(
      `/grupos/${grupoId}/missas/${id}/repertorio`,
      {
        method:'PUT',
        body:
          JSON.stringify({
            itens:
              repertorio
          })
      }
    );

    await api(
      `/grupos/${grupoId}/missas/${id}/escala`,
      {
        method:'PUT',
        body:
          JSON.stringify({
            itens:
              escala.map(
                ({
                  userId,
                  instrumentoVoz
                })=>({
                  userId,
                  instrumentoVoz
                })
              )
          })
      }
    );

    if (
      nova &&
      id &&
      navegarDepois
    ) {
      navigate(
        `/g/${slug}/missas/${id}`,
        {
          replace:true
        }
      );
    }

    return id as string;
  }

  async function salvarTudo() {
    if (!podeEditar) return;

    setSalvando(true);
    setErro('');

    try {
      await persistirTudo(true);
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao salvar celebração.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function publicarTudo() {
    if (!podeEditar) return;

    const validacao=
      validarPublicacao();

    if (validacao) {
      setErro(validacao);
      return;
    }

    setPublicando(true);
    setErro('');

    try {
      const id=
        await persistirTudo(false);

      const data=
        await api(
          `/grupos/${grupoId}/missas/${id}/publicar`,
          {
            method:'POST'
          }
        );

      navigate(
        `/g/${slug}/calendario?publicada=${id}`,
        {
          replace:true,
          state:{
            publicUrl:
              data.publicUrl
          }
        }
      );
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao publicar celebração.'
      );
    } finally {
      setPublicando(false);
    }
  }

  async function cadastrarNovoMomento(
    e:FormEvent
  ) {
    e.preventDefault();

    if (!novoMomento.trim()) {
      return;
    }

    setCriandoMomento(true);
    setErro('');

    try {
      const criado=
        await api(
          `/grupos/${grupoId}/momentos`,
          {
            method:'POST',
            body:
              JSON.stringify({
                nome:
                  novoMomento.trim()
              })
          }
        );

      const lista=
        await carregarMomentos();

      setNovoMomento('');

      if (
        musicas.length
      ) {
        setRepertorio(
          atual=>[
            ...atual,
            {
              momentoId:
                criado.id,
              musicaId:
                musicas[0].id,
              tomDaExecucao:
                musicas[0].tomOriginal || '',
              observacao:''
            }
          ]
        );
      }

      if (
        !lista.some(
          (m:any)=>
            m.id===criado.id
        )
      ) {
        setMomentos(
          atual=>[
            ...atual,
            criado
          ]
        );
      }
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao cadastrar momento.'
      );
    } finally {
      setCriandoMomento(false);
    }
  }

  function adicionarMusica(
    momentoId?:string
  ) {
    const momento=
      momentos.find(
        m=>m.id===momentoId
      ) ||
      momentos[0];

    const primeiraMusica=
      musicas[0];

    if (
      !momento ||
      !primeiraMusica
    ) {
      alert(
        !primeiraMusica
          ? 'Cadastre pelo menos uma música antes de montar o repertório.'
          : 'Nenhum momento litúrgico disponível.'
      );
      return;
    }

    setRepertorio(
      atual=>[
        ...atual,
        {
          momentoId:
            momento.id,
          musicaId:
            primeiraMusica.id,
          tomDaExecucao:
            primeiraMusica.tomOriginal || '',
          observacao:''
        }
      ]
    );
  }

  function adicionarOutraNoMesmoMomento(
    index:number
  ) {
    const itemBase=
      repertorio[index];

    const primeiraMusica=
      musicas[0];

    if (
      !itemBase ||
      !primeiraMusica
    ) {
      return;
    }

    const novoItem:RepertorioItem={
      momentoId:
        itemBase.momentoId,
      musicaId:
        primeiraMusica.id,
      tomDaExecucao:
        primeiraMusica.tomOriginal || '',
      observacao:''
    };

    setRepertorio(
      atual=>{
        const copia=[
          ...atual
        ];

        copia.splice(
          index+1,
          0,
          novoItem
        );

        return copia;
      }
    );
  }

  function moverItem(
    index:number,
    direcao:-1|1
  ) {
    const destino=
      index+direcao;

    if (
      destino<0 ||
      destino>=repertorio.length
    ) {
      return;
    }

    const copia=[
      ...repertorio
    ];

    const atual=
      copia[index];

    copia[index]=
      copia[destino];

    copia[destino]=
      atual;

    setRepertorio(copia);
  }

  function toggleMembro(
    membro:any
  ) {
    const existe=
      escala.find(
        x=>
          x.userId===
          membro.userId
      );

    if (existe) {
      setEscala(
        escala.filter(
          x=>
            x.userId!==
            membro.userId
        )
      );
    } else {
      setEscala([
        ...escala,
        {
          userId:
            membro.userId,
          instrumentoVoz:
            membro.instrumento ||
            membro.voz ||
            '',
          confirmacao:
            'PENDENTE'
        }
      ]);
    }
  }

  async function excluirCelebracao() {
    if (
      nova ||
      !missaId
    ) {
      return;
    }

    const confirmar=
      window.confirm(
        'Excluir esta celebração? Essa ação removerá a celebração do calendário.'
      );

    if (!confirmar) {
      return;
    }

    setErro('');

    try {
      await api(
        `/grupos/${grupoId}/missas/${missaId}`,
        {
          method:'DELETE'
        }
      );

      navigate(
        `/g/${slug}/calendario`,
        {
          replace:true
        }
      );
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao excluir celebração.'
      );
    }
  }

  async function confirmar(
    status:
      'CONFIRMADO'|
      'AUSENTE'
  ) {
    if (
      nova ||
      !missaId
    ) {
      return;
    }

    await api(
      `/grupos/${grupoId}/missas/${missaId}/confirmar`,
      {
        method:'POST',
        body:
          JSON.stringify({
            confirmacao:
              status
          })
      }
    );

    alert(
      'Resposta registrada.'
    );
  }

  const meuUser=
    JSON.parse(
      localStorage.getItem(
        'cantus_user'
      ) || 'null'
    );

  const estouEscalado=
    escala.some(
      x=>
        x.userId===
        meuUser?.id
    );

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={`/g/${slug}/calendario`}
            className="cantus-eyebrow"
          >
            ← Voltar ao calendário
          </Link>

          {podeEditar &&
            !nova && (
            <button
              type="button"
              onClick={
                excluirCelebracao
              }
              className="cantus-danger px-4 py-2 text-sm"
            >
              Excluir celebração
            </button>
          )}
        </div>

        <div className="mt-6 grid lg:grid-cols-[.8fr_1.2fr] gap-7 items-start">
          <aside>
            <div className="text-6xl cantus-gold">
              ✦
            </div>

            <div className="cantus-eyebrow mt-7">
              {nova
                ? 'Nova celebração'
                : 'Preparação litúrgica'}
            </div>

            <h1 className="cantus-display mt-4 text-5xl sm:text-6xl leading-[.95]">
              Organize tudo
              <span className="block cantus-gold">
                antes de publicar.
              </span>
            </h1>

            <p className="mt-6 max-w-lg cantus-muted leading-7">
              Preencha os dados,
              organize o repertório,
              selecione os músicos e,
              ao final, salve ou publique.
            </p>
          </aside>

          <div>
            {erro && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
                {erro}
              </div>
            )}

            <section className="cantus-card p-6 sm:p-8">
              <div className="cantus-eyebrow">
                Dados da celebração
              </div>

              <h2 className="cantus-display mt-3 text-3xl">
                Informações principais
              </h2>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <label>
                  <span className="text-sm font-semibold">
                    Data e hora
                  </span>

                  <input
                    required
                    type="datetime-local"
                    disabled={!podeEditar}
                    value={form.dataHora}
                    onChange={
                      e=>
                        setForm({
                          ...form,
                          dataHora:
                            e.target.value
                        })
                    }
                    className="cantus-input mt-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Local
                  </span>

                  <input
                    required
                    disabled={!podeEditar}
                    value={form.local}
                    onChange={
                      e=>
                        setForm({
                          ...form,
                          local:
                            e.target.value
                        })
                    }
                    className="cantus-input mt-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Tipo de celebração
                  </span>

                  <input
                    required
                    disabled={!podeEditar}
                    value={
                      form.tipoCelebracao
                    }
                    onChange={
                      e=>
                        setForm({
                          ...form,
                          tipoCelebracao:
                            e.target.value
                        })
                    }
                    className="cantus-input mt-2"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold">
                    Tempo litúrgico
                  </span>

                  <input
                    disabled={!podeEditar}
                    value={
                      form.tempoLiturgico
                    }
                    onChange={
                      e=>
                        setForm({
                          ...form,
                          tempoLiturgico:
                            e.target.value
                        })
                    }
                    className="cantus-input mt-2"
                  />
                </label>
              </div>

              <label className="block mt-5">
                <span className="text-sm font-semibold">
                  Observações
                </span>

                <textarea
                  rows={4}
                  disabled={!podeEditar}
                  value={
                    form.observacoes
                  }
                  onChange={
                    e=>
                      setForm({
                        ...form,
                        observacoes:
                          e.target.value
                      })
                  }
                  className="cantus-input mt-2"
                />
              </label>
            </section>

            <section className="cantus-card mt-6 p-6 sm:p-8">
              <div className="cantus-eyebrow">
                Momentos
              </div>

              <h2 className="cantus-display mt-3 text-3xl">
                Rito da celebração
              </h2>

              <p className="mt-2 text-sm cantus-muted">
                Use os momentos existentes.
                O administrador da paróquia
                também pode criar momentos
                especiais.
              </p>

              {podeCriarMomento && (
                <form
                  onSubmit={
                    cadastrarNovoMomento
                  }
                  className="mt-5 flex flex-col sm:flex-row gap-3"
                >
                  <input
                    value={
                      novoMomento
                    }
                    onChange={
                      e=>
                        setNovoMomento(
                          e.target.value
                        )
                    }
                    placeholder="Ex.: Ladainha ou Salmo 2"
                    className="cantus-input flex-1"
                  />

                  <button
                    disabled={
                      criandoMomento
                    }
                    className="cantus-secondary px-5 py-3"
                  >
                    {criandoMomento
                      ? 'Criando...'
                      : '+ Criar momento'}
                  </button>
                </form>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {momentos.map(
                  momento=>(
                    <span
                      key={
                        momento.id
                      }
                      className="cantus-badge"
                    >
                      {momento.nome}
                    </span>
                  )
                )}
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
                </div>

                {podeEditar && (
                  <button
                    type="button"
                    onClick={()=>
                      adicionarMusica()
                    }
                    className="cantus-secondary px-5 py-2.5 text-sm self-start"
                  >
                    + Adicionar música
                  </button>
                )}
              </div>

              <div className="space-y-4 mt-6">
                {repertorio.map(
                  (item,index)=>(
                    <div
                      key={`${item.momentoId}-${item.musicaId}-${index}`}
                      className="rounded-2xl border border-white/10 bg-white/[.025] p-4"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="text-xs font-bold uppercase tracking-[.14em] cantus-gold">
                          Item {index+1}
                        </div>

                        {podeEditar && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={
                                index===0
                              }
                              onClick={()=>
                                moverItem(
                                  index,
                                  -1
                                )
                              }
                              className="cantus-secondary px-3 py-1.5 text-xs disabled:opacity-30"
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              disabled={
                                index===
                                repertorio.length-1
                              }
                              onClick={()=>
                                moverItem(
                                  index,
                                  1
                                )
                              }
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
                            disabled={
                              !podeEditar
                            }
                            value={
                              item.momentoId
                            }
                            onChange={
                              e=>{
                                const x=[
                                  ...repertorio
                                ];

                                x[index]={
                                  ...x[index],
                                  momentoId:
                                    e.target.value
                                };

                                setRepertorio(x);
                              }
                            }
                            className="cantus-input mt-1"
                          >
                            {momentos.map(
                              m=>(
                                <option
                                  key={m.id}
                                  value={m.id}
                                >
                                  {m.nome}
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label>
                          <span className="text-xs font-semibold cantus-muted">
                            Música
                          </span>

                          <select
                            disabled={
                              !podeEditar
                            }
                            value={
                              item.musicaId
                            }
                            onChange={
                              e=>{
                                const x=[
                                  ...repertorio
                                ];

                                const m=
                                  musicas.find(
                                    mm=>
                                      mm.id===
                                      e.target.value
                                  );

                                x[index]={
                                  ...x[index],
                                  musicaId:
                                    e.target.value,
                                  tomDaExecucao:
                                    m?.tomOriginal || ''
                                };

                                setRepertorio(x);
                              }
                            }
                            className="cantus-input mt-1"
                          >
                            {musicas.map(
                              m=>(
                                <option
                                  key={m.id}
                                  value={m.id}
                                >
                                  {m.titulo}
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label>
                          <span className="text-xs font-semibold cantus-muted">
                            Tom
                          </span>

                          <input
                            disabled={
                              !podeEditar
                            }
                            value={
                              item.tomDaExecucao
                            }
                            onChange={
                              e=>{
                                const x=[
                                  ...repertorio
                                ];

                                x[index]={
                                  ...x[index],
                                  tomDaExecucao:
                                    e.target.value
                                };

                                setRepertorio(x);
                              }
                            }
                            className="cantus-input mt-1"
                          />
                        </label>
                      </div>

                      <label className="block mt-3">
                        <span className="text-xs font-semibold cantus-muted">
                          Observação
                        </span>

                        <input
                          disabled={
                            !podeEditar
                          }
                          value={
                            item.observacao
                          }
                          onChange={
                            e=>{
                              const x=[
                                ...repertorio
                              ];

                              x[index]={
                                ...x[index],
                                observacao:
                                  e.target.value
                              };

                              setRepertorio(x);
                            }
                          }
                          className="cantus-input mt-1"
                        />
                      </label>

                      {podeEditar && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={()=>
                              adicionarOutraNoMesmoMomento(
                                index
                              )
                            }
                            className="cantus-secondary px-4 py-2 text-sm"
                          >
                            + Outra música neste momento
                          </button>

                          <button
                            type="button"
                            onClick={()=>
                              setRepertorio(
                                repertorio.filter(
                                  (_,i)=>
                                    i!==index
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
                  )
                )}

                {!repertorio.length && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                    <div className="text-4xl cantus-gold">
                      ♪
                    </div>

                    <div className="cantus-display mt-4 text-2xl">
                      Repertório ainda vazio
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="cantus-card mt-6 p-6 sm:p-8">
              <div className="cantus-eyebrow">
                Escala
              </div>

              <h2 className="cantus-display mt-3 text-3xl">
                Quem vai servir?
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                {membros.map(
                  membro=>{
                    const marcado=
                      escala.some(
                        x=>
                          x.userId===
                          membro.userId
                      );

                    return (
                      <label
                        key={
                          membro.userId
                        }
                        className={`rounded-2xl border p-4 cursor-pointer ${
                          marcado
                            ? 'border-[#d5ae62]/55 bg-[#d5ae62]/10'
                            : 'border-white/10 bg-white/[.025]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            disabled={
                              !podeEditar
                            }
                            checked={
                              marcado
                            }
                            onChange={()=>
                              toggleMembro(
                                membro
                              )
                            }
                            className="mt-1"
                          />

                          <div>
                            <div className="cantus-display text-xl">
                              {membro.nome}
                            </div>

                            <div className="mt-1 text-xs cantus-muted">
                              {[
                                membro.instrumento,
                                membro.voz
                              ]
                                .filter(Boolean)
                                .join(' · ') ||
                                membro.papel}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  }
                )}
              </div>

              {estouEscalado &&
                !nova && (
                <div className="mt-7 border-t border-white/10 pt-6">
                  <div className="cantus-eyebrow">
                    Sua participação
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={()=>
                        confirmar(
                          'CONFIRMADO'
                        )
                      }
                      className="rounded-full border border-emerald-500/30 bg-emerald-900/20 px-5 py-2.5 text-sm font-bold text-emerald-200"
                    >
                      Confirmar presença
                    </button>

                    <button
                      type="button"
                      onClick={()=>
                        confirmar(
                          'AUSENTE'
                        )
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
                  Finalização
                </div>

                <h2 className="cantus-display mt-3 text-3xl">
                  Salvar e publicar
                </h2>

                <p className="mt-2 text-sm cantus-muted leading-6">
                  O botão Salvar celebração grava de uma vez os dados,
                  repertório e escala. Publicar celebração valida se
                  está tudo completo antes de disponibilizar os links.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={
                      salvando ||
                      publicando
                    }
                    onClick={
                      salvarTudo
                    }
                    className="cantus-secondary px-6 py-3 disabled:opacity-50"
                  >
                    {salvando
                      ? 'Salvando...'
                      : 'Salvar celebração'}
                  </button>

                  <button
                    type="button"
                    disabled={
                      salvando ||
                      publicando
                    }
                    onClick={
                      publicarTudo
                    }
                    className="cantus-primary px-6 py-3 disabled:opacity-50"
                  >
                    {publicando
                      ? 'Publicando...'
                      : 'Publicar celebração'}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
