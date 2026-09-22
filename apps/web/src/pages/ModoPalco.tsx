import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link,
  useParams
} from 'react-router-dom';

import AbcScore from '../components/AbcScore';
import { api } from '../lib/api';

type ModoPalcoTipo =
  | 'CIFRA'
  | 'LETRA'
  | 'PARTITURA';

type RepertorioItem = {
  id:string;
  ordem:number;
  momentoNome:string;
  titulo:string;
  autorCompositor?:string|null;
  tomOriginal?:string|null;
  tomDaExecucao?:string|null;
  observacao?:string|null;
  letra?:string|null;
  cifra?:string|null;
  notacaoAbc?:string|null;
};

type PaginaTexto = {
  linhas:string[];
};

function modosDisponiveis(
  item:RepertorioItem
):ModoPalcoTipo[] {
  const modos:ModoPalcoTipo[]=[];

  if (
    item.cifra?.trim()
  ) {
    modos.push('CIFRA');
  }

  if (
    item.letra?.trim()
  ) {
    modos.push('LETRA');
  }

  if (
    item.notacaoAbc?.trim()
  ) {
    modos.push(
      'PARTITURA'
    );
  }

  return modos;
}

function modoInicial(
  item:RepertorioItem
):ModoPalcoTipo {
  const preferido=
    localStorage.getItem(
      'cantus_modo_palco_tipo'
    ) as ModoPalcoTipo|null;

  const disponiveis=
    modosDisponiveis(item);

  if (
    preferido &&
    disponiveis.includes(
      preferido
    )
  ) {
    return preferido;
  }

  if (
    disponiveis.includes(
      'LETRA'
    )
  ) {
    return 'LETRA';
  }

  return (
    disponiveis[0] ||
    'CIFRA'
  );
}

function textoDoModo(
  item:RepertorioItem,
  modo:ModoPalcoTipo
) {
  if (
    modo==='CIFRA'
  ) {
    return item.cifra || '';
  }

  if (
    modo==='LETRA'
  ) {
    return item.letra || '';
  }

  return '';
}

function linhasPorPagina(
  modo:ModoPalcoTipo,
  altura:number,
  largura:number
) {
  const reservado=
    modo==='LETRA'
      ? 250
      : 285;

  const disponivel=
    Math.max(
      220,
      altura-reservado
    );

  let linha=42;

  if (
    modo==='LETRA'
  ) {
    if (
      largura>=1600
    ) {
      linha=72;
    } else if (
      largura>=1100
    ) {
      linha=62;
    } else if (
      largura>=700
    ) {
      linha=52;
    } else {
      linha=42;
    }
  } else {
    if (
      largura>=1500
    ) {
      linha=40;
    } else if (
      largura>=900
    ) {
      linha=35;
    } else {
      linha=29;
    }
  }

  return Math.max(
    modo==='LETRA'
      ? 3
      : 5,
    Math.floor(
      disponivel/linha
    )
  );
}

function quebrarEmPaginas(
  texto:string,
  limite:number
):PaginaTexto[] {
  const linhas=
    texto
      .replace(/\r\n/g,'\n')
      .split('\n');

  const paginas:PaginaTexto[]=[];

  for (
    let i=0;
    i<linhas.length;
    i+=limite
  ) {
    paginas.push({
      linhas:
        linhas.slice(
          i,
          i+limite
        )
    });
  }

  return (
    paginas.length
      ? paginas
      : [{linhas:[]}]
  );
}

export default function ModoPalco() {
  const { token }=
    useParams();

  const [data,setData]=
    useState<any>(null);

  const [erro,setErro]=
    useState('');

  const [indice,setIndice]=
    useState(0);

  const [pagina,setPagina]=
    useState(0);

  const [modo,setModo]=
    useState<ModoPalcoTipo>(
      'LETRA'
    );

  const [viewport,setViewport]=
    useState({
      width:
        typeof window!=='undefined'
          ? window.innerWidth
          : 1280,
      height:
        typeof window!=='undefined'
          ? window.innerHeight
          : 720
    });

  const [fullscreen,setFullscreen]=
    useState(
      typeof document!=='undefined'
        ? !!document.fullscreenElement
        : false
    );

  useEffect(()=>{
    api(
      `/public/missas/${token}`
    )
      .then(setData)
      .catch(
        e=>setErro(e.message)
      );
  },[token]);

  useEffect(()=>{
    function resize() {
      setViewport({
        width:window.innerWidth,
        height:window.innerHeight
      });
    }

    function full() {
      setFullscreen(
        !!document.fullscreenElement
      );
    }

    window.addEventListener(
      'resize',
      resize
    );

    document.addEventListener(
      'fullscreenchange',
      full
    );

    return ()=>{
      window.removeEventListener(
        'resize',
        resize
      );

      document.removeEventListener(
        'fullscreenchange',
        full
      );
    };
  },[]);

  useEffect(()=>{
    if (!data) return;

    if (
      !document.fullscreenElement &&
      document.documentElement
        .requestFullscreen
    ) {
      document
        .documentElement
        .requestFullscreen()
        .catch(()=>{});
    }
  },[data]);

  const itens:RepertorioItem[]=
    data?.repertorio || [];

  const item=
    itens[indice];

  const logo=
    data?.celebracao
      ?.paroquiaLogo || null;

  const paroquia=
    data?.celebracao
      ?.paroquia || '';

  const grupoNome=
    data?.celebracao
      ?.grupoNome || '';

  useEffect(()=>{
    if (!item) return;

    setModo(
      modoInicial(item)
    );

    setPagina(0);
  },[item?.id]);

  const disponiveis=
    useMemo(
      ()=>
        item
          ? modosDisponiveis(
              item
            )
          : [],
      [item]
    );

  useEffect(()=>{
    if (
      item &&
      disponiveis.length &&
      !disponiveis.includes(
        modo
      )
    ) {
      setModo(
        disponiveis[0]
      );

      setPagina(0);
    }
  },[
    item?.id,
    modo,
    disponiveis.join('|')
  ]);

  const paginas=
    useMemo(()=>{
      if (
        !item ||
        modo==='PARTITURA'
      ) {
        return [
          {
            linhas:[]
          }
        ];
      }

      return quebrarEmPaginas(
        textoDoModo(
          item,
          modo
        ),
        linhasPorPagina(
          modo,
          viewport.height,
          viewport.width
        )
      );
    },[
      item,
      modo,
      viewport.height,
      viewport.width
    ]);

  useEffect(()=>{
    if (
      pagina>
      paginas.length-1
    ) {
      setPagina(
        Math.max(
          0,
          paginas.length-1
        )
      );
    }
  },[paginas.length]);

  async function telaCheia() {
    try {
      if (
        !document.fullscreenElement
      ) {
        await document
          .documentElement
          .requestFullscreen();
      }
    } catch {}
  }

  async function sairTelaCheia() {
    try {
      if (
        document.fullscreenElement
      ) {
        await document
          .exitFullscreen();
      }
    } catch {}
  }

  function alterarModo(
    novo:ModoPalcoTipo
  ) {
    setModo(novo);
    setPagina(0);

    localStorage.setItem(
      'cantus_modo_palco_tipo',
      novo
    );
  }

  function anterior() {
    if (
      pagina>0
    ) {
      setPagina(
        p=>p-1
      );
      return;
    }

    if (
      indice>0
    ) {
      setIndice(
        i=>i-1
      );
      setPagina(0);
    }
  }

  function proxima() {
    if (
      pagina<
      paginas.length-1
    ) {
      setPagina(
        p=>p+1
      );
      return;
    }

    if (
      indice<
      itens.length-1
    ) {
      setIndice(
        i=>i+1
      );
      setPagina(0);
    }
  }

  if (erro) {
    return (
      <main className="h-[100dvh] bg-black text-white grid place-items-center p-6">
        <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-5 text-red-200">
          {erro}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="h-[100dvh] bg-black text-white grid place-items-center">
        Carregando...
      </main>
    );
  }

  if (!item) {
    return (
      <main className="h-[100dvh] bg-black text-white grid place-items-center">
        Sem repertório.
      </main>
    );
  }

  const paginaAtual=
    paginas[pagina] ||
    paginas[0];

  const continuacao=
    paginas.length>1 &&
    pagina>0;

  const temAnterior=
    indice>0 ||
    pagina>0;

  const temProxima=
    indice<
      itens.length-1 ||
    pagina<
      paginas.length-1;

  const tom=
    item.tomDaExecucao ||
    item.tomOriginal;

  const datashow=
    modo==='LETRA';

  return (
    <main
      className={
        datashow
          ? 'h-[100dvh] overflow-hidden text-white flex flex-col bg-[radial-gradient(circle_at_50%_38%,#27213c_0%,#10111b_44%,#050507_100%)]'
          : 'h-[100dvh] overflow-hidden bg-black text-white flex flex-col'
      }
    >
      <header
        className={
          datashow
            ? 'h-[112px] shrink-0 px-7 lg:px-12 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur'
            : 'h-[86px] shrink-0 border-b border-white/10 bg-black/95 px-4 sm:px-6 flex items-center justify-between gap-4'
        }
      >
        <div className="flex items-center gap-4 min-w-0">
          {logo ? (
            <div className={
              datashow
                ? 'w-20 h-20 rounded-2xl bg-white/95 p-2 grid place-items-center shadow-2xl'
                : 'w-12 h-12 rounded-xl bg-white p-1.5 grid place-items-center'
            }>
              <img
                src={logo}
                alt={`Logo ${paroquia}`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className={
              datashow
                ? 'w-20 h-20 rounded-2xl border border-white/15 grid place-items-center text-3xl'
                : 'w-12 h-12 rounded-xl border border-white/15 grid place-items-center text-xl'
            }>
              ♫
            </div>
          )}

          <div className="min-w-0">
            <div className={
              datashow
                ? 'text-sm uppercase tracking-[.2em] text-[#d9c48f]'
                : 'text-[10px] sm:text-xs uppercase tracking-[.17em] text-violet-300'
            }>
              {datashow
                ? paroquia
                : item.momentoNome}
            </div>

            <div className={
              datashow
                ? 'text-xl lg:text-2xl font-bold truncate'
                : 'text-base sm:text-xl font-bold truncate'
            }>
              {datashow
                ? item.titulo
                : grupoNome}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {disponiveis.map(
            opcao=>(
              <button
                key={opcao}
                type="button"
                onClick={()=>
                  alterarModo(opcao)
                }
                className={
                  opcao===modo
                    ? 'rounded-xl bg-violet-700 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold'
                    : 'rounded-xl border border-white/15 bg-black/20 px-3 sm:px-4 py-2 text-xs sm:text-sm text-slate-200'
                }
              >
                {opcao==='CIFRA'
                  ? 'Cifra'
                  : opcao==='LETRA'
                    ? 'Datashow'
                    : 'Partitura'}
              </button>
            )
          )}

          {!fullscreen && (
            <button
              type="button"
              onClick={
                telaCheia
              }
              className="rounded-xl border border-white/15 bg-black/20 px-3 sm:px-4 py-2 text-xs sm:text-sm"
            >
              Tela cheia
            </button>
          )}

          {fullscreen && (
            <button
              type="button"
              onClick={
                sairTelaCheia
              }
              className="hidden lg:inline-flex rounded-xl border border-white/15 bg-black/20 px-4 py-2 text-sm"
            >
              Sair da tela cheia
            </button>
          )}

          <Link
            to={`/celebracao/${token}`}
            className="text-xs sm:text-sm text-violet-200 px-2"
          >
            Sair
          </Link>
        </div>
      </header>

      {datashow ? (
        <section className="flex-1 min-h-0 relative overflow-hidden">
          {logo && (
            <img
              src={logo}
              aria-hidden="true"
              className="absolute right-[-5vw] bottom-[-9vh] w-[36vw] h-[36vw] max-w-[520px] max-h-[520px] object-contain opacity-[.035] pointer-events-none"
            />
          )}

          <div className="h-full max-w-[1500px] mx-auto px-10 lg:px-20 py-7 flex flex-col">
            <div className="text-center">
              <div className="text-sm lg:text-base uppercase tracking-[.22em] text-[#d9c48f] font-bold">
                {item.momentoNome}
                {continuacao &&
                  ` · continuação ${pagina+1}/${paginas.length}`}
              </div>
            </div>

            <div className="flex-1 min-h-0 grid place-items-center">
              <div
                className="w-full whitespace-pre-wrap text-center font-semibold tracking-[.01em] text-[clamp(2rem,4.1vw,4.8rem)] leading-[1.22] drop-shadow-[0_3px_14px_rgba(0,0,0,.75)]"
              >
                {paginaAtual
                  .linhas
                  .join('\n')}
              </div>
            </div>

            <div className="text-center text-xs lg:text-sm tracking-[.15em] uppercase text-white/45">
              {grupoNome}
            </div>
          </div>
        </section>
      ) : (
        <section className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full max-w-6xl mx-auto px-4 sm:px-7 py-3 sm:py-4 flex flex-col">
            <div className="h-[70px] shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
              <div>
                <div className="text-xs uppercase tracking-[.15em] text-violet-300">
                  {item.momentoNome}
                  {continuacao &&
                    ` · continuação ${pagina+1}/${paginas.length}`}
                </div>

                <div className="mt-1 text-xl font-bold">
                  {item.titulo}
                </div>
              </div>

              <div className="text-right">
                {tom && (
                  <div className="font-bold text-violet-300 text-base sm:text-lg">
                    Tom: {tom}
                  </div>
                )}

                {item.observacao && (
                  <div className="mt-1 text-xs sm:text-sm text-slate-400">
                    {item.observacao}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden pt-4">
              {modo==='CIFRA' && (
                <pre className="m-0 whitespace-pre font-mono text-[15px] sm:text-xl lg:text-2xl leading-7 sm:leading-[2.125rem] lg:leading-[2.375rem] overflow-hidden">
                  {paginaAtual
                    .linhas
                    .join('\n')}
                </pre>
              )}

              {modo==='PARTITURA' && (
                <div className="h-full overflow-y-auto overscroll-contain rounded-xl bg-white text-black px-2 sm:px-4 py-3">
                  <AbcScore
                    abc={
                      item.notacaoAbc ||
                      ''
                    }
                    titulo={
                      item.titulo
                    }
                    showPrint={
                      false
                    }
                    staffWidth={
                      Math.max(
                        620,
                        Math.min(
                          1080,
                          viewport.width-90
                        )
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <footer
        className={
          datashow
            ? 'h-[76px] shrink-0 border-t border-white/10 bg-black/30 px-6 backdrop-blur'
            : 'h-[88px] shrink-0 border-t border-white/10 bg-black/95 px-4 sm:px-6'
        }
      >
        <div className="h-full max-w-6xl mx-auto flex items-center justify-between gap-3">
          <button
            disabled={
              !temAnterior
            }
            onClick={
              anterior
            }
            className="rounded-xl border border-white/20 bg-black/20 px-4 sm:px-6 py-3 font-semibold disabled:opacity-25"
          >
            Anterior
          </button>

          <div className="text-center">
            <div className={
              datashow
                ? 'text-sm text-white/60'
                : 'text-xs sm:text-sm text-slate-400'
            }>
              {datashow
                ? `${item.titulo} · ${pagina+1}/${paginas.length}`
                : `Música ${indice+1} / ${itens.length}`}
            </div>
          </div>

          <button
            disabled={
              !temProxima
            }
            onClick={
              proxima
            }
            className="rounded-xl bg-violet-700 px-5 sm:px-7 py-3 font-semibold disabled:opacity-25"
          >
            Próxima
          </button>
        </div>
      </footer>
    </main>
  );
}
