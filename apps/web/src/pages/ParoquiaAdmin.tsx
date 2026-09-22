import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type Membro = {
  userId:string;
  nome:string;
  email:string;
  telefone?:string|null;
  papel:'ADMIN_PAROQUIA'|'MEMBRO';
  ativo:boolean;
};

type Grupo = {
  id:string;
  nome:string;
  slug:string;
  corTema:string;
  ativo:boolean;
};

type GrupoMembro = {
  userId:string;
  nome:string;
  email:string;
  papel:'RESPONSAVEL'|'COORDENADOR'|'MUSICO';
  instrumento?:string|null;
  voz?:string|null;
};

export default function ParoquiaAdmin() {
  const { user, paroquiaAtiva } = useAuth();

  const [membros,setMembros]=useState<Membro[]>([]);
  const [grupos,setGrupos]=useState<Grupo[]>([]);
  const [grupoId,setGrupoId]=useState('');
  const [grupoMembros,setGrupoMembros]=useState<GrupoMembro[]>([]);
  const [usuarioGrupoId,setUsuarioGrupoId]=useState('');
  const [papelGrupo,setPapelGrupo]=useState<'RESPONSAVEL'|'COORDENADOR'|'MUSICO'>('MUSICO');
  const [instrumento,setInstrumento]=useState('');
  const [voz,setVoz]=useState('');
  const [erro,setErro]=useState('');
  const [mensagem,setMensagem]=useState('');

  const [novo,setNovo]=useState({
    nome:'',
    email:'',
    telefone:'',
    senha:'',
    papel:'MEMBRO' as 'MEMBRO'|'ADMIN_PAROQUIA'
  });

  if (!paroquiaAtiva) {
    return <Navigate to="/paroquias" replace />;
  }

  const paroquiaAtual = paroquiaAtiva;

  const podeAdministrar=
    user?.perfilGlobal==='MASTER' ||
    paroquiaAtual.papel==='ADMIN_PAROQUIA';

  if (!podeAdministrar) {
    return <Navigate to="/dashboard" replace />;
  }

  async function carregarBase() {
    try {
      const [m,g]=await Promise.all([
        api(`/paroquias/${paroquiaAtual.id}/membros`),
        api(`/paroquias/${paroquiaAtual.id}/grupos`)
      ]);

      setMembros(m);
      setGrupos(g);

      if (!grupoId && g.length) {
        setGrupoId(g[0].id);
      }
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao carregar paróquia.'
      );
    }
  }

  async function carregarGrupo(id:string) {
    if (!id) {
      setGrupoMembros([]);
      return;
    }

    try {
      setGrupoMembros(
        await api(
          `/paroquias/${paroquiaAtual.id}/grupos/${id}/membros`
        )
      );
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao carregar integrantes.'
      );
    }
  }

  useEffect(()=>{
    carregarBase();
  },[paroquiaAtual.id]);

  useEffect(()=>{
    carregarGrupo(grupoId);
  },[grupoId,paroquiaAtual.id]);

  const membrosDisponiveis=useMemo(()=>{
    const associados=new Set(grupoMembros.map(m=>m.userId));
    return membros.filter(m=>!associados.has(m.userId));
  },[membros,grupoMembros]);

  async function cadastrarUsuario(e:FormEvent) {
    e.preventDefault();
    setErro('');
    setMensagem('');

    try {
      const retorno=await api(
        `/paroquias/${paroquiaAtual.id}/usuarios`,
        {
          method:'POST',
          body:JSON.stringify({
            nome:novo.nome,
            email:novo.email,
            telefone:novo.telefone||null,
            senha:novo.senha||undefined,
            papel:novo.papel
          })
        }
      );

      setMensagem(
        retorno.criado
          ? `Usuário ${retorno.nome} criado e associado à paróquia.`
          : `Usuário ${retorno.nome} já existia e foi associado à paróquia.`
      );

      setNovo({
        nome:'',
        email:'',
        telefone:'',
        senha:'',
        papel:'MEMBRO'
      });

      await carregarBase();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao cadastrar usuário.'
      );
    }
  }

  async function associarMeuUsuario() {
    if (!user) return;

    setErro('');
    setMensagem('');

    try {
      await api(
        `/paroquias/${paroquiaAtual.id}/usuarios`,
        {
          method:'POST',
          body:JSON.stringify({
            nome:user.nome,
            email:user.email,
            papel:'ADMIN_PAROQUIA'
          })
        }
      );

      setMensagem('Seu usuário foi associado a esta paróquia.');
      await carregarBase();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao associar seu usuário.'
      );
    }
  }

  async function associarAoGrupo(e:FormEvent) {
    e.preventDefault();

    if (!grupoId || !usuarioGrupoId) return;

    setErro('');
    setMensagem('');

    try {
      await api(
        `/paroquias/${paroquiaAtual.id}/grupos/${grupoId}/membros`,
        {
          method:'POST',
          body:JSON.stringify({
            userId:usuarioGrupoId,
            papel:papelGrupo,
            instrumento:instrumento||null,
            voz:voz||null
          })
        }
      );

      setMensagem('Integrante associado ao grupo.');
      setUsuarioGrupoId('');
      setPapelGrupo('MUSICO');
      setInstrumento('');
      setVoz('');

      await carregarGrupo(grupoId);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao associar integrante.'
      );
    }
  }

  async function removerDoGrupo(m:GrupoMembro) {
    if (!confirm(`Remover ${m.nome} deste grupo?`)) return;

    try {
      await api(
        `/paroquias/${paroquiaAtual.id}/grupos/${grupoId}/membros/${m.userId}`,
        { method:'DELETE' }
      );

      await carregarGrupo(grupoId);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao remover integrante.'
      );
    }
  }

  const grupoAtual=grupos.find(g=>g.id===grupoId);

  return (
    <main className="cantus-page">
      <header className="border-b border-white/10 bg-[#0b0c0e]/90">
        <div className="cantus-shell h-20 flex items-center justify-between">
          <div>
            <div className="cantus-eyebrow">
              Administração da paróquia
            </div>

            <div className="cantus-display mt-1 text-lg">
              {paroquiaAtual.nome}
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/grupos/novo"
              className="cantus-primary px-4 py-2 text-sm"
            >
              + Novo grupo
            </Link>

            <Link
              to="/dashboard"
              className="cantus-secondary px-4 py-2 text-sm"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="cantus-shell py-10">
        <div className="cantus-eyebrow">
          Pessoas e ministérios
        </div>

        <h1 className="cantus-section-title mt-3">
          Gestão da
          <span className="cantus-gold"> paróquia.</span>
        </h1>

        <p className="mt-3 cantus-muted">
          Cadastre músicos e associe cada pessoa aos grupos em que serve.
        </p>

        {user?.perfilGlobal==='MASTER' &&
          !membros.some(m=>m.userId===user.id) && (
          <button
            onClick={associarMeuUsuario}
            className="cantus-secondary mt-5 px-5 py-2.5 text-sm"
          >
            Associar meu usuário a esta paróquia
          </button>
        )}

        {erro && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-emerald-200">
            {mensagem}
          </div>
        )}

        <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-5 mt-8">
          <form
            onSubmit={cadastrarUsuario}
            className="cantus-card p-6"
          >
            <div className="cantus-eyebrow">
              Novo músico
            </div>

            <h2 className="cantus-display mt-3 text-3xl">
              Cadastrar usuário
            </h2>

            <p className="mt-2 text-sm cantus-muted">
              Se o e-mail já existir no Cantus Dei, ele será apenas
              associado a esta paróquia.
            </p>

            <label className="block mt-5">
              <span className="text-sm font-semibold">
                Nome
              </span>

              <input
                required
                value={novo.nome}
                onChange={e=>setNovo({ ...novo,nome:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">
                E-mail
              </span>

              <input
                required
                type="email"
                value={novo.email}
                onChange={e=>setNovo({ ...novo,email:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">
                Telefone
              </span>

              <input
                value={novo.telefone}
                onChange={e=>setNovo({ ...novo,telefone:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">
                Senha inicial
              </span>

              <input
                type="password"
                minLength={8}
                value={novo.senha}
                onChange={e=>setNovo({ ...novo,senha:e.target.value })}
                className="cantus-input mt-2"
                placeholder="Obrigatória somente se for um usuário novo"
              />

              <div className="mt-2 text-xs cantus-muted">
                Se o e-mail já existir, a senha não é necessária.
              </div>
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">
                Papel na paróquia
              </span>

              <select
                value={novo.papel}
                onChange={e=>setNovo({
                  ...novo,
                  papel:e.target.value as 'MEMBRO'|'ADMIN_PAROQUIA'
                })}
                className="cantus-input mt-2"
              >
                <option value="MEMBRO">Membro</option>
                <option value="ADMIN_PAROQUIA">
                  Administrador da paróquia
                </option>
              </select>
            </label>

            <button className="cantus-primary mt-6 px-6 py-3">
              Cadastrar músico
            </button>
          </form>

          <section className="cantus-card p-6">
            <div className="cantus-eyebrow">
              Pessoas da paróquia
            </div>

            <h2 className="cantus-display mt-3 text-3xl">
              Membros cadastrados
            </h2>

            <div className="space-y-2 mt-5 max-h-[600px] overflow-auto">
              {membros.map(m=>(
                <div
                  key={m.userId}
                  className="rounded-xl border border-white/10 p-4"
                >
                  <div className="font-semibold">
                    {m.nome}
                  </div>

                  <div className="mt-1 text-sm cantus-muted">
                    {m.email}
                  </div>

                  <div className="mt-3">
                    <span className="cantus-badge">
                      {m.papel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="cantus-card mt-5 p-6">
          <div className="cantus-eyebrow">
            Associação aos grupos
          </div>

          <h2 className="cantus-display mt-3 text-3xl">
            Monte os ministérios
          </h2>

          <div className="grid md:grid-cols-[1fr_1fr] gap-5 mt-6">
            <div>
              <label className="block">
                <span className="text-sm font-semibold">
                  Grupo
                </span>

                <select
                  value={grupoId}
                  onChange={e=>setGrupoId(e.target.value)}
                  className="cantus-input mt-2"
                >
                  <option value="">Selecione</option>

                  {grupos.map(g=>(
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </label>

              {grupoAtual && (
                <form
                  onSubmit={associarAoGrupo}
                  className="mt-5 space-y-4"
                >
                  <label className="block">
                    <span className="text-sm font-semibold">
                      Usuário
                    </span>

                    <select
                      required
                      value={usuarioGrupoId}
                      onChange={e=>setUsuarioGrupoId(e.target.value)}
                      className="cantus-input mt-2"
                    >
                      <option value="">Selecione um membro</option>

                      {membrosDisponiveis.map(m=>(
                        <option key={m.userId} value={m.userId}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold">
                      Papel no grupo
                    </span>

                    <select
                      value={papelGrupo}
                      onChange={e=>setPapelGrupo(
                        e.target.value as 'RESPONSAVEL'|'COORDENADOR'|'MUSICO'
                      )}
                      className="cantus-input mt-2"
                    >
                      <option value="MUSICO">Músico</option>
                      <option value="COORDENADOR">Coordenador</option>
                      <option value="RESPONSAVEL">Responsável</option>
                    </select>
                  </label>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <label>
                      <span className="text-sm font-semibold">
                        Instrumento
                      </span>

                      <input
                        value={instrumento}
                        onChange={e=>setInstrumento(e.target.value)}
                        className="cantus-input mt-2"
                        placeholder="Violão, teclado..."
                      />
                    </label>

                    <label>
                      <span className="text-sm font-semibold">
                        Voz
                      </span>

                      <input
                        value={voz}
                        onChange={e=>setVoz(e.target.value)}
                        className="cantus-input mt-2"
                        placeholder="Soprano, tenor..."
                      />
                    </label>
                  </div>

                  <button className="cantus-primary px-6 py-3">
                    Associar ao grupo
                  </button>
                </form>
              )}
            </div>

            <div>
              <div className="cantus-eyebrow">
                Integrantes atuais
              </div>

              <div className="space-y-2 mt-4">
                {grupoMembros.map(m=>(
                  <div
                    key={m.userId}
                    className="rounded-xl border border-white/10 p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">
                        {m.nome}
                      </div>

                      <div className="text-sm cantus-muted">
                        {m.papel}
                        {m.instrumento ? ` · ${m.instrumento}` : ''}
                        {m.voz ? ` · ${m.voz}` : ''}
                      </div>
                    </div>

                    <button
                      onClick={()=>removerDoGrupo(m)}
                      className="cantus-danger px-3 py-2 text-xs"
                    >
                      Remover
                    </button>
                  </div>
                ))}

                {grupoId && !grupoMembros.length && (
                  <div className="cantus-muted">
                    Nenhum integrante associado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
