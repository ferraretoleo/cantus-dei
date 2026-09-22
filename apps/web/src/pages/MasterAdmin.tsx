import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type Usuario = {
  id:string;
  nome:string;
  email:string;
  telefone?:string|null;
  perfilGlobal:'USUARIO'|'MASTER';
  ativo:boolean;
};

type Paroquia = {
  id:string;
  nome:string;
  cidade:string;
  endereco?:string|null;
  ativo:boolean;
};

type MembroParoquia = {
  userId:string;
  nome:string;
  email:string;
  papel:'ADMIN_PAROQUIA'|'MEMBRO';
  ativo:boolean;
};

type GrupoAdmin = {
  id:string;
  nome:string;
  paroquia:string;
  cidade:string;
  slug:string;
  ativo:boolean;
};

export default function MasterAdmin() {
  const {user}=useAuth();

  const [usuarios,setUsuarios]=useState<Usuario[]>([]);
  const [paroquias,setParoquias]=useState<Paroquia[]>([]);
  const [grupos,setGrupos]=useState<GrupoAdmin[]>([]);
  const [paroquiaSelecionada,setParoquiaSelecionada]=useState('');
  const [membros,setMembros]=useState<MembroParoquia[]>([]);
  const [novoUsuarioId,setNovoUsuarioId]=useState('');
  const [novoPapel,setNovoPapel]=useState<'ADMIN_PAROQUIA'|'MEMBRO'>('MEMBRO');
  const [formParoquia,setFormParoquia]=useState({
    nome:'',
    cidade:'',
    endereco:''
  });
  const [erro,setErro]=useState('');
  const [mensagem,setMensagem]=useState('');

  const usuariosDisponiveis=useMemo(()=>{
    const vinculados=new Set(membros.map(m=>m.userId));
    return usuarios.filter(u=>!vinculados.has(u.id));
  },[usuarios,membros]);

  async function carregarBase() {
    try {
      const [u,p,g]=await Promise.all([
        api('/master/usuarios'),
        api('/master/paroquias'),
        api('/master/grupos')
      ]);

      setUsuarios(u);
      setParoquias(p);
      setGrupos(g);

      if (!paroquiaSelecionada && p.length) {
        setParoquiaSelecionada(p[0].id);
      }
    } catch (error) {
      setErro(error instanceof Error?error.message:'Erro ao carregar administração.');
    }
  }

  async function carregarMembros(id:string) {
    if (!id) {
      setMembros([]);
      return;
    }

    try {
      setMembros(await api(`/master/paroquias/${id}/membros`));
    } catch (error) {
      setErro(error instanceof Error?error.message:'Erro ao carregar membros.');
    }
  }

  useEffect(()=>{ carregarBase(); },[]);
  useEffect(()=>{ carregarMembros(paroquiaSelecionada); },[paroquiaSelecionada]);

  async function criarParoquia(e:FormEvent) {
    e.preventDefault();
    setErro('');
    setMensagem('');

    try {
      const nova=await api('/master/paroquias',{
        method:'POST',
        body:JSON.stringify({
          nome:formParoquia.nome,
          cidade:formParoquia.cidade,
          endereco:formParoquia.endereco||null
        })
      });

      setFormParoquia({ nome:'',cidade:'',endereco:'' });
      setMensagem(`Paróquia "${nova.nome}" criada.`);
      await carregarBase();
      setParoquiaSelecionada(nova.id);
    } catch (error) {
      setErro(error instanceof Error?error.message:'Erro ao criar paróquia.');
    }
  }

  async function vincularUsuario(e:FormEvent) {
    e.preventDefault();
    if (!paroquiaSelecionada || !novoUsuarioId) return;

    setErro('');
    setMensagem('');

    try {
      await api(`/master/paroquias/${paroquiaSelecionada}/membros`,{
        method:'POST',
        body:JSON.stringify({
          userId:novoUsuarioId,
          papel:novoPapel
        })
      });

      setMensagem('Usuário associado à paróquia.');
      setNovoUsuarioId('');
      setNovoPapel('MEMBRO');
      await carregarMembros(paroquiaSelecionada);
    } catch (error) {
      setErro(error instanceof Error?error.message:'Erro ao associar usuário.');
    }
  }

  async function alterarPapel(m:MembroParoquia) {
    const papel=m.papel==='ADMIN_PAROQUIA'?'MEMBRO':'ADMIN_PAROQUIA';

    await api(`/master/paroquias/${paroquiaSelecionada}/membros`,{
      method:'POST',
      body:JSON.stringify({
        userId:m.userId,
        papel
      })
    });

    await carregarMembros(paroquiaSelecionada);
  }

  async function removerVinculo(m:MembroParoquia) {
    if (!confirm(`Remover ${m.nome} desta paróquia?`)) return;

    await api(`/master/paroquias/${paroquiaSelecionada}/membros/${m.userId}`,{
      method:'DELETE'
    });

    await carregarMembros(paroquiaSelecionada);
  }

  async function alterarPerfilGlobal(
    usuario:Usuario,
    perfilGlobal:'USUARIO'|'MASTER'
  ) {
    if (!confirm(`Alterar perfil global de ${usuario.nome} para ${perfilGlobal}?`)) return;

    await api(`/master/usuarios/${usuario.id}/perfil`,{
      method:'PUT',
      body:JSON.stringify({ perfilGlobal })
    });

    await carregarBase();
  }


  async function excluirGrupo(grupo:GrupoAdmin) {
    const digitado=window.prompt(
      `A exclusão é definitiva.\n\nDigite exatamente "${grupo.nome}" para excluir o grupo:`
    );

    if (digitado!==grupo.nome) return;

    try {
      await api(`/grupos/${grupo.id}`,{ method:'DELETE' });
      setMensagem(`Grupo "${grupo.nome}" excluído.`);
      await carregarBase();
    } catch (error) {
      setErro(error instanceof Error?error.message:'Erro ao excluir grupo.');
    }
  }

  const pAtual=paroquias.find(p=>p.id===paroquiaSelecionada);

  return (
    <main className="cantus-page">
      <header className="border-b border-white/10 bg-[#0b0c0e]/90">
        <div className="cantus-shell h-20 flex items-center justify-between">
          <div>
            <div className="cantus-eyebrow">Cantus Dei</div>
            <div className="cantus-display mt-1 text-lg">
              Administração global
            </div>
          </div>

          <Link to="/dashboard" className="cantus-secondary px-4 py-2 text-sm">
            Voltar
          </Link>
        </div>
      </header>

      <section className="cantus-shell py-10">
        <div className="cantus-eyebrow">Estrutura multi-paróquia</div>
        <h1 className="cantus-section-title mt-3">
          Paróquias e
          <span className="cantus-gold"> acessos.</span>
        </h1>
        <p className="mt-3 cantus-muted max-w-3xl">
          O MASTER cria as paróquias e associa usuários. Cada paróquia
          mantém seus próprios grupos, missas, repertórios e escalas.
        </p>

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
          <form onSubmit={criarParoquia} className="cantus-card p-6">
            <div className="cantus-eyebrow">Nova paróquia</div>
            <h2 className="cantus-display mt-3 text-3xl">
              Cadastrar paróquia
            </h2>

            <label className="block mt-5">
              <span className="text-sm font-semibold">Nome</span>
              <input
                required
                value={formParoquia.nome}
                onChange={e=>setFormParoquia({ ...formParoquia,nome:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">Cidade</span>
              <input
                required
                value={formParoquia.cidade}
                onChange={e=>setFormParoquia({ ...formParoquia,cidade:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">Endereço</span>
              <input
                value={formParoquia.endereco}
                onChange={e=>setFormParoquia({ ...formParoquia,endereco:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <button className="cantus-primary mt-6 px-6 py-3">
              Criar paróquia
            </button>
          </form>

          <section className="cantus-card p-6">
            <div className="cantus-eyebrow">Paróquia selecionada</div>

            <select
              value={paroquiaSelecionada}
              onChange={e=>setParoquiaSelecionada(e.target.value)}
              className="cantus-input mt-4"
            >
              <option value="">Selecione uma paróquia</option>
              {paroquias.map(p=>(
                <option key={p.id} value={p.id}>
                  {p.nome} · {p.cidade}
                </option>
              ))}
            </select>

            {pAtual && (
              <>
                <h2 className="cantus-display mt-6 text-3xl">
                  {pAtual.nome}
                </h2>
                <p className="mt-2 cantus-muted">
                  {pAtual.cidade}
                  {pAtual.endereco?` · ${pAtual.endereco}`:''}
                </p>

                <form onSubmit={vincularUsuario} className="mt-6 grid md:grid-cols-[1fr_.65fr_auto] gap-3">
                  <select
                    value={novoUsuarioId}
                    onChange={e=>setNovoUsuarioId(e.target.value)}
                    className="cantus-input"
                  >
                    <option value="">Associar usuário...</option>
                    {usuariosDisponiveis.map(u=>(
                      <option key={u.id} value={u.id}>
                        {u.nome} · {u.email}
                      </option>
                    ))}
                  </select>

                  <select
                    value={novoPapel}
                    onChange={e=>setNovoPapel(e.target.value as 'ADMIN_PAROQUIA'|'MEMBRO')}
                    className="cantus-input"
                  >
                    <option value="MEMBRO">Membro</option>
                    <option value="ADMIN_PAROQUIA">Admin. Paróquia</option>
                  </select>

                  <button className="cantus-secondary px-5">
                    Associar
                  </button>
                </form>

                <div className="mt-6 space-y-2">
                  {membros.map(m=>(
                    <div key={m.userId} className="rounded-xl border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="font-semibold">{m.nome}</div>
                        <div className="text-sm cantus-muted">{m.email}</div>
                      </div>

                      <span className="cantus-badge">{m.papel}</span>

                      <div className="flex gap-2">
                        <button
                          onClick={()=>alterarPapel(m)}
                          className="cantus-secondary px-3 py-2 text-xs"
                        >
                          {m.papel==='ADMIN_PAROQUIA'?'Tornar membro':'Tornar admin'}
                        </button>

                        <button
                          onClick={()=>removerVinculo(m)}
                          className="cantus-danger px-3 py-2 text-xs"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>


        <section className="cantus-card mt-5 p-6">
          <div className="cantus-eyebrow">Grupos por paróquia</div>
          <h2 className="cantus-display mt-3 text-3xl">
            Grupos cadastrados
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="cantus-table w-full text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3">Grupo</th>
                  <th className="px-4 py-3">Paróquia</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map(g=>(
                  <tr key={g.id}>
                    <td className="px-4 py-4">
                      <div className="font-semibold">{g.nome}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{g.paroquia}</div>
                      <div className="text-sm cantus-muted">{g.cidade}</div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={()=>excluirGrupo(g)}
                        className="cantus-danger px-3 py-2 text-xs"
                      >
                        Excluir grupo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="cantus-card mt-5 p-6">
          <div className="cantus-eyebrow">Perfis globais</div>
          <h2 className="cantus-display mt-3 text-3xl">
            Usuários do Cantus Dei
          </h2>

          <div className="mt-5 overflow-x-auto">
            <table className="cantus-table w-full text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Global</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u=>(
                  <tr key={u.id}>
                    <td className="px-4 py-4">
                      <div className="font-semibold">
                        {u.nome}
                        {u.id===user?.id && <span className="ml-2 cantus-gold text-xs">VOCÊ</span>}
                      </div>
                      <div className="text-sm cantus-muted">{u.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="cantus-badge">{u.perfilGlobal}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {u.id!==user?.id && (
                        <button
                          onClick={()=>alterarPerfilGlobal(
                            u,
                            u.perfilGlobal==='MASTER'?'USUARIO':'MASTER'
                          )}
                          className="cantus-secondary px-3 py-2 text-xs"
                        >
                          {u.perfilGlobal==='MASTER'?'Remover MASTER':'Tornar MASTER'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
