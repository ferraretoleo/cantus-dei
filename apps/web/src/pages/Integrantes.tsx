import {
  useEffect,
  useState,
  type FormEvent
} from 'react';

import {
  Link,
  Navigate,
  useParams
} from 'react-router-dom';

import GroupHeader, {
  getGrupoAtivo
} from '../components/GroupHeader';

import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type Membro={
  userId:string;
  nome:string;
  email:string;
  telefone?:string|null;
  papel:'RESPONSAVEL'|'COORDENADOR'|'MUSICO';
  instrumento?:string|null;
  voz?:string|null;
};

type Candidato={
  userId:string;
  nome:string;
  email:string;
  telefone?:string|null;
};

export default function Integrantes() {
  const { slug }=useParams();
  const grupo=getGrupoAtivo();
  const { user,paroquiaAtiva }=useAuth();

  const [membros,setMembros]=useState<Membro[]>([]);
  const [candidatos,setCandidatos]=useState<Candidato[]>([]);
  const [usuarioId,setUsuarioId]=useState('');
  const [papel,setPapel]=useState<'RESPONSAVEL'|'COORDENADOR'|'MUSICO'>('MUSICO');
  const [instrumento,setInstrumento]=useState('');
  const [voz,setVoz]=useState('');
  const [erro,setErro]=useState('');
  const [mensagem,setMensagem]=useState('');

  if (!grupo || grupo.slug!==slug) {
    return <Navigate to="/dashboard" replace />;
  }

  const grupoAtual=grupo;

  const podeAdministrar=
    user?.perfilGlobal==='MASTER' ||
    paroquiaAtiva?.papel==='ADMIN_PAROQUIA' ||
    grupoAtual.papel==='RESPONSAVEL';

  async function carregar() {
    try {
      const lista=await api(
        `/grupos/${grupoAtual.id}/membros`
      );

      setMembros(lista);

      if (podeAdministrar) {
        setCandidatos(
          await api(
            `/grupos/${grupoAtual.id}/candidatos`
          )
        );
      }
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao carregar integrantes.'
      );
    }
  }

  useEffect(()=>{
    carregar();
  },[]);

  async function adicionar(e:FormEvent) {
    e.preventDefault();

    if (!usuarioId) return;

    setErro('');
    setMensagem('');

    try {
      await api(
        `/grupos/${grupoAtual.id}/membros`,
        {
          method:'POST',
          body:JSON.stringify({
            userId:usuarioId,
            papel,
            instrumento:
              instrumento||null,
            voz:
              voz||null
          })
        }
      );

      setMensagem(
        'Integrante associado ao ministério.'
      );

      setUsuarioId('');
      setPapel('MUSICO');
      setInstrumento('');
      setVoz('');

      await carregar();
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao adicionar integrante.'
      );
    }
  }

  function rotuloPapel(papel:string) {
    if (papel==='RESPONSAVEL') {
      return 'RESPONSÁVEL DO MINISTÉRIO';
    }

    if (papel==='COORDENADOR') {
      return 'COORDENADOR';
    }

    return 'MÚSICO';
  }

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <div className="cantus-eyebrow">
              Ministério
            </div>

            <h1 className="cantus-section-title mt-3">
              Integrantes
            </h1>

            <p className="mt-3 cantus-muted">
              Quem serve com você neste ministério.
            </p>
          </div>

          {podeAdministrar && (
            <Link
              to={`/g/${slug}/convites`}
              className="cantus-secondary px-5 py-2.5 text-sm self-start"
            >
              Convidar novo músico
            </Link>
          )}
        </div>

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

        {podeAdministrar && (
          <form
            onSubmit={adicionar}
            className="cantus-card mt-7 p-6 sm:p-8"
          >
            <div className="cantus-eyebrow">
              Cadastrar integrante
            </div>

            <h2 className="cantus-display mt-3 text-3xl">
              Adicionar ao ministério
            </h2>

            <p className="mt-2 text-sm cantus-muted">
              Escolha uma pessoa já cadastrada nesta paróquia. Para alguém novo, use o convite.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <label>
                <span className="text-sm font-semibold">
                  Pessoa
                </span>

                <select
                  required
                  value={usuarioId}
                  onChange={e=>setUsuarioId(e.target.value)}
                  className="cantus-input mt-2"
                >
                  <option value="">
                    Selecione
                  </option>

                  {candidatos.map(c=>(
                    <option
                      key={c.userId}
                      value={c.userId}
                    >
                      {c.nome} · {c.email}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold">
                  Papel no ministério
                </span>

                <select
                  value={papel}
                  onChange={e=>
                    setPapel(
                      e.target.value as
                      'RESPONSAVEL'|
                      'COORDENADOR'|
                      'MUSICO'
                    )
                  }
                  className="cantus-input mt-2"
                >
                  <option value="MUSICO">
                    Músico
                  </option>

                  <option value="COORDENADOR">
                    Coordenador
                  </option>

                  <option value="RESPONSAVEL">
                    Responsável do Ministério
                  </option>
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold">
                  Instrumento
                </span>

                <input
                  value={instrumento}
                  onChange={e=>setInstrumento(e.target.value)}
                  placeholder="Violão, teclado, bateria..."
                  className="cantus-input mt-2"
                />
              </label>

              <label>
                <span className="text-sm font-semibold">
                  Voz
                </span>

                <input
                  value={voz}
                  onChange={e=>setVoz(e.target.value)}
                  placeholder="Soprano, contralto, tenor..."
                  className="cantus-input mt-2"
                />
              </label>
            </div>

            <button className="cantus-primary mt-6 px-6 py-3">
              Adicionar integrante
            </button>
          </form>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
          {membros.map((m,i)=>(
            <article
              key={m.userId}
              className="cantus-card p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border border-[#d5ae62]/25 bg-[#d5ae62]/10 grid place-items-center cantus-gold text-xl">
                  {i%2===0?'♫':'♪'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="cantus-display text-xl truncate">
                    {m.nome}
                  </div>

                  <div className="mt-1 text-sm cantus-muted">
                    {rotuloPapel(m.papel)}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <div className="cantus-eyebrow">
                  Contato
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <a
                    href={`mailto:${m.email}`}
                    className="flex items-center gap-2 text-[#e8e0d5] hover:text-[#d5ae62]"
                  >
                    <span>✉</span>
                    <span className="break-all">
                      {m.email}
                    </span>
                  </a>

                  {m.telefone ? (
                    <a
                      href={`tel:${m.telefone}`}
                      className="flex items-center gap-2 text-[#e8e0d5] hover:text-[#d5ae62]"
                    >
                      <span>☎</span>
                      <span>
                        {m.telefone}
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 cantus-muted">
                      <span>☎</span>
                      <span>
                        Telefone não informado
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="cantus-badge">
                  {rotuloPapel(m.papel)}
                </span>

                {m.instrumento && (
                  <span className="cantus-badge">
                    {m.instrumento}
                  </span>
                )}

                {m.voz && (
                  <span className="cantus-badge">
                    {m.voz}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
