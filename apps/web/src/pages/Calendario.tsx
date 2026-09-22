import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link,
  Navigate,
  useLocation,
  useParams,
  useSearchParams
} from 'react-router-dom';

import QRCode from 'qrcode';

import GroupHeader, {
  getGrupoAtivo
} from '../components/GroupHeader';

import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type Missa = {
  id:string;
  dataHora:string;
  local:string;
  tipoCelebracao:string;
  tempoLiturgico?:string|null;
  observacoes?:string|null;
  status:string;
  tokenPublico?:string|null;
  publicadoEm?:string|null;
};

function inicioMes(data:Date) {
  return new Date(
    data.getFullYear(),
    data.getMonth(),
    1
  );
}

function nomeMes(data:Date) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      month:'long',
      year:'numeric'
    }
  ).format(data);
}

function mesmoDia(
  a:Date,
  b:Date
) {
  return (
    a.getFullYear()===b.getFullYear() &&
    a.getMonth()===b.getMonth() &&
    a.getDate()===b.getDate()
  );
}

function diasCalendario(mes:Date) {
  const primeiro=
    new Date(
      mes.getFullYear(),
      mes.getMonth(),
      1
    );

  const ultimo=
    new Date(
      mes.getFullYear(),
      mes.getMonth()+1,
      0
    );

  const inicio=
    new Date(primeiro);

  inicio.setDate(
    primeiro.getDate()-
    primeiro.getDay()
  );

  const fim=
    new Date(ultimo);

  fim.setDate(
    ultimo.getDate()+
    (6-ultimo.getDay())
  );

  const dias:Date[]=[];
  const atual=
    new Date(inicio);

  while (atual<=fim) {
    dias.push(
      new Date(atual)
    );

    atual.setDate(
      atual.getDate()+1
    );
  }

  return dias;
}

function formatarHora(
  dataHora:string
) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      hour:'2-digit',
      minute:'2-digit'
    }
  ).format(
    new Date(dataHora)
  );
}

export default function Calendario() {
  const { slug }=useParams();
  const grupo=getGrupoAtivo();

  const {
    user,
    paroquiaAtiva
  }=useAuth();

  const location=
    useLocation();

  const [searchParams]=
    useSearchParams();

  const publicadaId=
    searchParams.get(
      'publicada'
    );

  const [missas,setMissas]=
    useState<Missa[]>([]);

  const [erro,setErro]=
    useState('');

  const [qr,setQr]=
    useState('');

  const [mes,setMes]=
    useState(
      inicioMes(
        new Date()
      )
    );

  if (
    !grupo ||
    grupo.slug!==slug
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  const grupoAtual=grupo;

  const podeCadastrarCelebracao=
    user?.perfilGlobal==='MASTER' ||
    paroquiaAtiva?.papel==='ADMIN_PAROQUIA' ||
    grupoAtual.papel==='RESPONSAVEL';

  async function carregar() {
    try {
      setMissas(
        await api(
          `/grupos/${grupoAtual.id}/missas`
        )
      );
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao carregar calendário.'
      );
    }
  }

  useEffect(()=>{
    carregar();
  },[]);

  const publicada=
    useMemo(
      ()=>
        publicadaId
          ? missas.find(
              m=>m.id===publicadaId
            )
          : undefined,
      [missas,publicadaId]
    );

  const publicUrl=
    (
      location.state as
      {
        publicUrl?:string
      } | null
    )?.publicUrl ||
    (
      publicada?.tokenPublico
        ? `${window.location.origin}/celebracao/${publicada.tokenPublico}`
        : ''
    );

  useEffect(()=>{
    if (!publicUrl) {
      setQr('');
      return;
    }

    QRCode
      .toDataURL(
        publicUrl
      )
      .then(setQr)
      .catch(()=>setQr(''));
  },[publicUrl]);

  useEffect(()=>{
    if (
      publicada?.dataHora
    ) {
      setMes(
        inicioMes(
          new Date(
            publicada.dataHora
          )
        )
      );
    }
  },[publicada?.id]);

  const dias=
    useMemo(
      ()=>diasCalendario(mes),
      [mes]
    );

  const missasDoMes=
    useMemo(
      ()=>missas.filter(
        missa=>{
          const dt=
            new Date(
              missa.dataHora
            );

          return (
            dt.getFullYear()===
              mes.getFullYear() &&
            dt.getMonth()===
              mes.getMonth()
          );
        }
      ),
      [missas,mes]
    );

  function mudarMes(
    delta:number
  ) {
    setMes(
      atual=>
        new Date(
          atual.getFullYear(),
          atual.getMonth()+delta,
          1
        )
    );
  }

  return (
    <main className="cantus-page">
      <GroupHeader />

      <section className="cantus-shell py-8 sm:py-11">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <div className="cantus-eyebrow">
              Agenda do ministério
            </div>

            <h1 className="cantus-section-title mt-3">
              Calendário de
              <span className="cantus-gold">
                {' '}celebrações.
              </span>
            </h1>

            <p className="mt-3 cantus-muted">
              Visual mensal no estilo agenda,
              com todas as celebrações do ministério.
            </p>
          </div>

          {podeCadastrarCelebracao && (
            <Link
              to={`/g/${slug}/missas/nova`}
              className="cantus-primary px-6 py-3 self-start"
            >
              + Nova celebração
            </Link>
          )}
        </div>

        {erro && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {erro}
          </div>
        )}

        {publicada &&
          publicUrl && (
          <section className="cantus-card mt-7 p-6 sm:p-8">
            <div className="cantus-eyebrow">
              Celebração publicada
            </div>

            <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start mt-4">
              <div>
                <h2 className="cantus-display text-3xl">
                  {publicada.tipoCelebracao}
                </h2>

                <p className="mt-2 cantus-muted">
                  {new Intl.DateTimeFormat(
                    'pt-BR',
                    {
                      dateStyle:'full',
                      timeStyle:'short'
                    }
                  ).format(
                    new Date(
                      publicada.dataHora
                    )
                  )}
                </p>

                <p className="mt-1 cantus-muted">
                  {publicada.local}
                </p>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[.025] p-4">
                  <div className="cantus-eyebrow">
                    Link público
                  </div>

                  <div className="mt-2 break-all text-sm cantus-muted">
                    {publicUrl}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={()=>
                        navigator.clipboard.writeText(
                          publicUrl
                        )
                      }
                      className="cantus-secondary px-4 py-2 text-sm"
                    >
                      Copiar link
                    </button>

                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Celebração: ${publicUrl}`
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
                </div>
              </div>

              {qr && (
                <div className="rounded-2xl bg-white p-3 justify-self-start">
                  <img
                    src={qr}
                    alt="QR Code"
                    className="w-40 h-40"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        <section className="cantus-card mt-7 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="cantus-eyebrow">
                Visão mensal
              </div>

              <h2 className="cantus-display mt-2 text-3xl capitalize">
                {nomeMes(mes)}
              </h2>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={()=>
                  mudarMes(-1)
                }
                className="cantus-secondary px-4 py-2 text-sm"
              >
                ← Anterior
              </button>

              <button
                type="button"
                onClick={()=>
                  setMes(
                    inicioMes(
                      new Date()
                    )
                  )
                }
                className="cantus-secondary px-4 py-2 text-sm"
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={()=>
                  mudarMes(1)
                }
                className="cantus-secondary px-4 py-2 text-sm"
              >
                Próximo →
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[840px]">
              <div className="grid grid-cols-7 border-l border-t border-white/10">
                {[
                  'Dom',
                  'Seg',
                  'Ter',
                  'Qua',
                  'Qui',
                  'Sex',
                  'Sáb'
                ].map(dia=>(
                  <div
                    key={dia}
                    className="border-r border-b border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[.12em] cantus-muted"
                  >
                    {dia}
                  </div>
                ))}

                {dias.map(dia=>{
                  const eventos=
                    missas.filter(
                      missa=>
                        mesmoDia(
                          new Date(
                            missa.dataHora
                          ),
                          dia
                        )
                    );

                  const foraDoMes=
                    dia.getMonth()!==
                    mes.getMonth();

                  const hoje=
                    mesmoDia(
                      dia,
                      new Date()
                    );

                  return (
                    <div
                      key={dia.toISOString()}
                      className={`min-h-[128px] border-r border-b border-white/10 p-2 ${
                        foraDoMes
                          ? 'bg-white/[.012] opacity-45'
                          : 'bg-white/[.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={
                            hoje
                              ? 'w-7 h-7 rounded-full bg-[#d5ae62] text-black grid place-items-center text-sm font-black'
                              : 'text-sm cantus-muted'
                          }
                        >
                          {dia.getDate()}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {eventos.map(
                          evento=>(
                            <Link
                              key={evento.id}
                              to={`/g/${slug}/missas/${evento.id}`}
                              className={`block rounded-lg border px-2 py-1.5 text-xs ${
                                evento.id===publicadaId
                                  ? 'border-[#d5ae62]/70 bg-[#d5ae62]/15 text-[#ead4a0]'
                                  : 'border-violet-400/20 bg-violet-900/20 text-violet-100'
                              }`}
                            >
                              <div className="font-bold">
                                {formatarHora(
                                  evento.dataHora
                                )}
                              </div>

                              <div className="mt-0.5 truncate">
                                {evento.tipoCelebracao}
                              </div>

                              <div className="mt-0.5 truncate text-[10px] opacity-75">
                                {grupoAtual.nome}
                              </div>
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="cantus-eyebrow">
                Celebrações do mês
              </div>

              <h2 className="cantus-display mt-2 text-3xl">
                Agenda detalhada
              </h2>
            </div>

            <span className="cantus-badge">
              {missasDoMes.length}
            </span>
          </div>

          <div className="space-y-3 mt-5">
            {missasDoMes.map(
              missa=>(
                <Link
                  key={missa.id}
                  to={`/g/${slug}/missas/${missa.id}`}
                  className={`cantus-card block p-5 group ${
                    missa.id===publicadaId
                      ? 'ring-1 ring-[#d5ae62]/60'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-16 text-center shrink-0">
                      <div className="cantus-display text-3xl">
                        {new Date(
                          missa.dataHora
                        ).getDate()}
                      </div>

                      <div className="text-xs uppercase cantus-gold">
                        {new Intl.DateTimeFormat(
                          'pt-BR',
                          {
                            month:'short'
                          }
                        ).format(
                          new Date(
                            missa.dataHora
                          )
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="cantus-display text-2xl">
                        {missa.tipoCelebracao}
                      </div>

                      <div className="mt-1 text-sm font-semibold cantus-gold">
                        {grupoAtual.nome}
                      </div>

                      <div className="mt-1 text-sm cantus-muted">
                        {formatarHora(
                          missa.dataHora
                        )}
                        {' · '}
                        {missa.local}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="cantus-badge">
                        {missa.status}
                      </span>

                      <span className="text-xl text-white/20 group-hover:text-[#d5ae62]">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            )}

            {!missasDoMes.length && (
              <div className="cantus-card p-10 text-center">
                <div className="text-4xl cantus-gold">
                  ♪
                </div>

                <div className="cantus-display mt-4 text-2xl">
                  Nenhuma celebração neste mês.
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
