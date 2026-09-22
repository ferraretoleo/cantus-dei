import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PsalmHighlight from '../components/PsalmHighlight';

type Grupo = {
  id:string;
  nome:string;
  slug:string;
  paroquia:string;
  cidade:string;
  paroquiaId:string;
  papel:string;
  corTema?:string;
};

type Paroquia = {
  id:string;
  nome:string;
  cidade:string;
  papel:'ADMIN_PAROQUIA'|'MEMBRO';
};

type AgendaItem = {
  missaId:string;
  dataHora:string;
  local:string;
  tipoCelebracao:string;
  status:string;
  grupoId:string;
  grupoNome:string;
  grupoSlug:string;
  paroquiaId:string;
  paroquiaNome:string;
  cidade:string;
  confirmacao:'PENDENTE'|'CONFIRMADO'|'AUSENTE'|null;
  instrumentoVoz:string|null;
};

function chaveMes(data:Date) {
  return `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}`;
}

function nomeMes(data:Date) {
  return new Intl.DateTimeFormat('pt-BR',{
    month:'long',
    year:'numeric'
  }).format(data);
}

export default function Dashboard() {
  const navigate=useNavigate();
  const {user,logout}=useAuth();

  const [grupos,setGrupos]=useState<Grupo[]>([]);
  const [paroquias,setParoquias]=useState<Paroquia[]>([]);
  const [agenda,setAgenda]=useState<AgendaItem[]>([]);
  const [mes,setMes]=useState(()=>{
    const d=new Date();
    return new Date(d.getFullYear(),d.getMonth(),1);
  });
  const [erro,setErro]=useState('');

  const podeCriarGrupo=useMemo(
    ()=>paroquias.some(p=>p.papel==='ADMIN_PAROQUIA'),
    [paroquias]
  );

  async function carregarBase() {
    try {
      const [g,p]=await Promise.all([
        api('/me/grupos'),
        api('/me/paroquias')
      ]);
      setGrupos(g);
      setParoquias(p);
    } catch (e) {
      setErro(e instanceof Error?e.message:'Erro ao carregar dashboard.');
    }
  }

  async function carregarAgenda(data:Date) {
    try {
      setAgenda(await api(`/me/agenda?mes=${chaveMes(data)}`));
    } catch (e) {
      setErro(e instanceof Error?e.message:'Erro ao carregar agenda.');
    }
  }

  useEffect(()=>{ carregarBase(); },[]);
  useEffect(()=>{ carregarAgenda(mes); },[mes]);

  function abrirGrupo(grupo:Grupo) {
    localStorage.setItem('cantus_grupo_ativo',JSON.stringify(grupo));
    navigate(`/g/${grupo.slug}`);
  }

  function abrirMissa(item:AgendaItem) {
    const grupo=grupos.find(g=>g.id===item.grupoId);
    if (!grupo) return;

    localStorage.setItem('cantus_grupo_ativo',JSON.stringify(grupo));
    navigate(`/g/${grupo.slug}/missas/${item.missaId}`);
  }

  function mudarMes(delta:number) {
    setMes(v=>new Date(v.getFullYear(),v.getMonth()+delta,1));
  }

  return (
    <main className="cantus-page">
      <header className="border-b border-white/10 bg-[#0b0c0e]/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="cantus-shell h-20 flex items-center justify-between gap-4">
          <div>
            <div className="cantus-eyebrow">Cantus Dei</div>
            <div className="mt-1 text-sm cantus-muted">
              {user?.nome}
              {user?.perfilGlobal==='MASTER' && (
                <span className="ml-2 text-[10px] font-extrabold tracking-wider cantus-gold">
                  MASTER
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.perfilGlobal==='MASTER' && (
              <Link to="/master" className="cantus-secondary px-4 py-2 text-sm">
                Administração
              </Link>
            )}

            <button
              onClick={()=>{ logout();navigate('/login'); }}
              className="cantus-nav-link"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="cantus-shell pt-8 sm:pt-11 pb-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="cantus-eyebrow">Agenda do músico</div>
            <h1 className="cantus-display mt-3 text-5xl sm:text-6xl leading-[.95]">
              Missas e
              <span className="cantus-gold"> escalas.</span>
            </h1>
            <p className="mt-4 cantus-muted">
              Tudo o que acontece nos grupos em que você participa,
              separado por paróquia.
            </p>
          </div>

          {podeCriarGrupo && (
            <Link to="/grupos/novo" className="cantus-primary px-6 py-3 self-start">
              + Novo grupo
            </Link>
          )}
        </div>

        {erro && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {erro}
          </div>
        )}

        <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-5 mt-7">
          <section className="cantus-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="cantus-eyebrow">Agenda mensal</div>
                <h2 className="cantus-display mt-2 text-3xl capitalize">
                  {nomeMes(mes)}
                </h2>
              </div>

              <div className="flex gap-2">
                <button onClick={()=>mudarMes(-1)} className="cantus-secondary px-4 py-2 text-sm">
                  ← Anterior
                </button>
                <button onClick={()=>mudarMes(1)} className="cantus-secondary px-4 py-2 text-sm">
                  Próximo →
                </button>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              {agenda.map(item=>{
                const dt=new Date(item.dataHora);

                return (
                  <button
                    key={item.missaId}
                    onClick={()=>abrirMissa(item)}
                    className="w-full text-left rounded-2xl border border-white/10 bg-white/[.025] p-4 hover:border-[#d5ae62]/40"
                  >
                    <div className="flex gap-4 items-start">
                      <div className="w-14 shrink-0 text-center">
                        <div className="text-xs uppercase cantus-gold">
                          {new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(dt)}
                        </div>
                        <div className="cantus-display text-3xl">
                          {dt.getDate()}
                        </div>
                        <div className="text-xs cantus-muted">
                          {new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(dt)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 border-l border-white/10 pl-4">
                        <div className="cantus-display text-xl">
                          {item.tipoCelebracao}
                        </div>
                        <div className="mt-1 text-sm cantus-muted">
                          {item.grupoNome} · {item.paroquiaNome}
                        </div>
                        <div className="mt-1 text-xs cantus-muted">
                          {item.local}
                          {item.instrumentoVoz ? ` · ${item.instrumentoVoz}` : ''}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.confirmacao && (
                            <span className="cantus-badge">
                              Escala: {item.confirmacao}
                            </span>
                          )}
                          <span className="cantus-badge opacity-70">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {!agenda.length && (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <div className="text-4xl cantus-gold">♪</div>
                  <div className="cantus-display mt-4 text-2xl">
                    Nenhuma celebração neste mês.
                  </div>
                  <p className="mt-2 text-sm cantus-muted">
                    Use as setas para consultar os próximos meses.
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside>
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <div className="cantus-eyebrow">Seus grupos</div>
                <h2 className="cantus-display mt-2 text-3xl">
                  Ministérios
                </h2>
              </div>
              <span className="text-sm cantus-muted">{grupos.length}</span>
            </div>

            <div className="space-y-3">
              {grupos.map((grupo,index)=>(
                <button
                  key={grupo.id}
                  onClick={()=>abrirGrupo(grupo)}
                  className="cantus-card w-full text-left p-5 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full border border-[#d5ae62]/25 bg-[#d5ae62]/10 grid place-items-center cantus-gold">
                      {index%2===0?'♫':'♪'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="cantus-display text-xl truncate">
                        {grupo.nome}
                      </div>
                      <div className="mt-1 text-xs cantus-muted truncate">
                        {grupo.paroquia} · {grupo.cidade}
                      </div>
                    </div>

                    <div className="text-lg text-white/20 group-hover:text-[#d5ae62]">→</div>
                  </div>
                </button>
              ))}

              {!grupos.length && (
                <div className="cantus-card p-6 text-center cantus-muted">
                  Você ainda não participa de grupos.
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mt-5">
          <PsalmHighlight />

          <div className="cantus-card p-6 sm:p-8">
            <div className="cantus-eyebrow">Atalho rápido</div>
            <h3 className="cantus-display mt-3 text-3xl">
              Entre no seu ministério
            </h3>
            <p className="mt-3 leading-7 cantus-muted">
              Abra um grupo para consultar repertório, calendário,
              integrantes, momentos litúrgicos e convites.
            </p>

            {grupos[0] && (
              <button
                onClick={()=>abrirGrupo(grupos[0])}
                className="cantus-secondary mt-6 px-5 py-2.5 text-sm"
              >
                Abrir {grupos[0].nome} →
              </button>
            )}

            {!!paroquias.length && (
              <div className="mt-7 border-t border-white/10 pt-5">
                <div className="cantus-eyebrow">Paróquias vinculadas</div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {paroquias.map(p=>(
                    <span key={p.id} className="cantus-badge">
                      {p.nome} · {p.papel}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
