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

const ALTURA_CABECALHO = 82;
const ALTURA_RODAPE = 88;
const ALTURA_CONTROLES = 82;
const MARGEM_VERTICAL = 46;

function modosDisponiveis(
  item:RepertorioItem
):ModoPalcoTipo[] {
  const modos:ModoPalcoTipo[] = [];

  if (item.cifra?.trim()) {
    modos.push('CIFRA');
  }

  if (item.letra?.trim()) {
    modos.push('LETRA');
  }

  if (item.notacaoAbc?.trim()) {
    modos.push('PARTITURA');
  }

  return modos;
}

function modoInicial(
  item:RepertorioItem
):ModoPalcoTipo {
  const preferido =
    localStorage.getItem(
      'cantus_modo_palco_tipo'
    ) as ModoPalcoTipo | null;

  const disponiveis =
    modosDisponiveis(item);

  if (
    preferido &&
    disponiveis.includes(preferido)
  ) {
    return preferido;
  }

  return disponiveis[0] || 'CIFRA';
}

function textoDoModo(
  item:RepertorioItem,
  modo:ModoPalcoTipo
) {
  if (modo === 'CIFRA') {
    return item.cifra || '';
  }

  if (modo === 'LETRA') {
    return item.letra || '';
  }

  return '';
}

function alturaLinha(
  modo:ModoPalcoTipo,
  largura:number
) {
  if (modo === 'CIFRA') {
    if (largura < 640) return 28;
    if (largura < 1100) return 34;
    return 38;
  }

  if (largura < 640) return 31;
  if (largura < 1100) return 38;
  return 44;
}

function linhasPorPagina(
  modo:ModoPalcoTipo,
  altura:number,
  largura:number
) {
  const disponivel =
    altura -
    ALTURA_CABECALHO -
    ALTURA_RODAPE -
    ALTURA_CONTROLES -
    MARGEM_VERTICAL;

  const linha = alturaLinha(
    modo,
    largura
  );

  return Math.max(
    5,
    Math.floor(disponivel / linha)
  );
}

function quebrarEmPaginas(
  texto:string,
  limite:number
):PaginaTexto[] {
  const linhas =
    texto
      .replace(/\r\n/g, '\n')
      .split('\n');

  if (!linhas.length) {
    return [{ linhas:[] }];
  }

  const paginas:PaginaTexto[] = [];

  for (
    let inicio=0;
    inicio<linhas.length;
    inicio+=limite
  ) {
    paginas.push({
      linhas:linhas.slice(
        inicio,
        inicio+limite
      )
    });
  }

  return paginas.length
    ? paginas
    : [{ linhas:[] }];
}

export default function ModoPalco() {
  const { token }=useParams();

  const [data,setData]=useState<any>(null);
  const [erro,setErro]=useState('');
  const [indice,setIndice]=useState(0);
  const [pagina,setPagina]=useState(0);
  const [modo,setModo]=useState<ModoPalcoTipo>('CIFRA');

  const [viewport,setViewport]=useState({
    width:
      typeof window !== 'undefined'
        ? window.innerWidth
        : 1280,
    height:
      typeof window !== 'undefined'
        ? window.innerHeight
        : 720
  });

  const [fullscreen,setFullscreen]=
    useState(
      typeof document !== 'undefined'
        ? !!document.fullscreenElement
        : false
    );

  useEffect(()=>{
    api(`/public/missas/${token}`)
      .then(setData)
      .catch(e=>setErro(e.message));
  },[token]);

  useEffect(()=>{
    function atualizarViewport() {
      setViewport({
        width:window.innerWidth,
        height:window.innerHeight
      });
    }

    function atualizarFullscreen() {
      setFullscreen(
        !!document.fullscreenElement
      );
    }

    window.addEventListener(
      'resize',
      atualizarViewport
    );

    document.addEventListener(
      'fullscreenchange',
      atualizarFullscreen
    );

    return ()=>{
      window.removeEventListener(
        'resize',
        atualizarViewport
      );

      document.removeEventListener(
        'fullscreenchange',
        atualizarFullscreen
      );
    };
  },[]);

  /*
   * Alguns navegadores bloqueiam fullscreen
   * sem uma interação direta do usuário.
   * Tentamos automaticamente e, se o browser
   * bloquear, mantemos o botão "Tela cheia".
   */
  useEffect(()=>{
    if (!data) return;

    if (
      !document.fullscreenElement &&
      document.documentElement
        .requestFullscreen
    ) {
      document.documentElement
        .requestFullscreen()
        .catch(()=>{});
    }
  },[data]);

  const itens:RepertorioItem[] =
    data?.repertorio || [];

  const item=
    itens[indice];

  useEffect(()=>{
    if (!item) return;

    setModo(
      modoInicial(item)
    );

    setPagina(0);
  },[item?.id]);

  const disponiveis=
    useMemo(
      ()=>item
        ? modosDisponiveis(item)
        : [],
      [item]
    );

  useEffect(()=>{
    if (
      item &&
      !disponiveis.includes(modo) &&
      disponiveis.length
    ) {
      setModo(disponiveis[0]);
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

      const texto=
        textoDoModo(
          item,
          modo
        );

      const limite=
        linhasPorPagina(
          modo,
          viewport.height,
          viewport.width
        );

      return quebrarEmPaginas(
        texto,
        limite
      );
    },[
      item,
      modo,
      viewport.height,
      viewport.width
    ]);

  useEffect(()=>{
    if (
      pagina >
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

  async function entrarTelaCheia() {
    try {
      if (
        !document.fullscreenElement
      ) {
        await document.documentElement
          .requestFullscreen();
      }
    } catch {}
  }

  async function sairTelaCheia() {
    try {
      if (
        document.fullscreenElement
      ) {
        await document.exitFullscreen();
      }
    } catch {}
  }

  function alterarModo(
    novoModo:ModoPalcoTipo
  ) {
    setModo(novoModo);
    setPagina(0);

    localStorage.setItem(
      'cantus_modo_palco_tipo',
      novoModo
    );
  }

  function anterior() {
    if (pagina>0) {
      setPagina(p=>p-1);
      return;
    }

    if (indice>0) {
      const novoIndice=
        indice-1;

      const itemAnterior=
        itens[novoIndice];

      const modoAnterior=
        modoInicial(
          itemAnterior
        );

      setIndice(
        novoIndice
      );

      setModo(
        modoAnterior
      );

      /*
       * Ao voltar para a música anterior,
       * abrimos a última página dela.
       * O cálculo final ocorre depois
       * da troca do item.
       */
      setTimeout(()=>{
        const limite=
          linhasPorPagina(
            modoAnterior,
            window.innerHeight,
            window.innerWidth
          );

        if (
          modoAnterior==='PARTITURA'
        ) {
          setPagina(0);
          return;
        }

        const total=
          quebrarEmPaginas(
            textoDoModo(
              itemAnterior,
              modoAnterior
            ),
            limite
          ).length;

        setPagina(
          Math.max(
            0,
            total-1
          )
        );
      },0);
    }
  }

  function proxima() {
    if (
      pagina <
      paginas.length-1
    ) {
      setPagina(p=>p+1);
      return;
    }

    if (
      indice <
      itens.length-1
    ) {
      setIndice(i=>i+1);
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

  const temAnterior=
    indice>0 ||
    pagina>0;

  const temProxima=
    indice<itens.length-1 ||
    pagina<paginas.length-1;

  const paginaAtual=
    paginas[pagina] ||
    paginas[0];

  const continuacao=
    paginas.length>1 &&
    pagina>0;

  const tom=
    item.tomDaExecucao ||
    item.tomOriginal;

  return (
    <main className="h-[100dvh] overflow-hidden bg-black text-white flex flex-col">
      <header className="h-[82px] shrink-0 border-b border-white/10 bg-black/95 px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs uppercase tracking-[.17em] text-violet-300 truncate">
            {item.momentoNome}

            {continuacao && (
              <>
                {' · continuação '}
                {pagina+1}/{paginas.length}
              </>
            )}
          </div>

          <div className="text-base sm:text-xl font-bold truncate">
            {item.titulo}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!fullscreen && (
            <button
              type="button"
              onClick={entrarTelaCheia}
              className="rounded-xl border border-violet-400/30 px-3 sm:px-4 py-2 text-xs sm:text-sm text-violet-200"
            >
              Tela cheia
            </button>
          )}

          {fullscreen && (
            <button
              type="button"
              onClick={sairTelaCheia}
              className="hidden sm:inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-300"
            >
              Sair da tela cheia
            </button>
          )}

          <Link
            to={`/celebracao/${token}`}
            className="text-xs sm:text-sm text-violet-300 px-2"
          >
            Sair do palco
          </Link>
        </div>
      </header>

      <section className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-4 sm:px-7 py-3 sm:py-4 flex flex-col">
          <div className="h-[70px] shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-white/10">
            <div>
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

            {disponiveis.length>1 && (
              <div className="flex items-center gap-2">
                {disponiveis.map(opcao=>(
                  <button
                    key={opcao}
                    type="button"
                    onClick={()=>
                      alterarModo(opcao)
                    }
                    className={
                      opcao===modo
                        ? 'rounded-xl bg-violet-700 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold'
                        : 'rounded-xl border border-white/15 px-3 sm:px-4 py-2 text-xs sm:text-sm text-slate-300'
                    }
                  >
                    {opcao==='CIFRA'
                      ? 'Cifra'
                      : opcao==='LETRA'
                        ? 'Letra'
                        : 'Partitura'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-hidden pt-3 sm:pt-4">
            {modo==='CIFRA' && (
              <pre
                className="m-0 whitespace-pre font-mono text-[15px] sm:text-xl lg:text-2xl leading-7 sm:leading-[2.125rem] lg:leading-[2.375rem] overflow-hidden"
              >
                {paginaAtual.linhas.join('\n')}
              </pre>
            )}

            {modo==='LETRA' && (
              <div
                className="whitespace-pre-wrap text-lg sm:text-2xl lg:text-3xl leading-[1.7] sm:leading-[1.6] lg:leading-[1.47] overflow-hidden"
              >
                {paginaAtual.linhas.join('\n')}
              </div>
            )}

            {modo==='PARTITURA' && (
              <div className="h-full overflow-y-auto overscroll-contain rounded-xl bg-white text-black px-2 sm:px-4 py-3">
                <AbcScore
                  abc={
                    item.notacaoAbc || ''
                  }
                  titulo={item.titulo}
                  showPrint={false}
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

            {!textoDoModo(
              item,
              modo
            ).trim() &&
              modo!=='PARTITURA' && (
              <div className="h-full grid place-items-center text-slate-400">
                Sem conteúdo neste modo.
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="h-[88px] shrink-0 border-t border-white/10 bg-black/95 px-4 sm:px-6">
        <div className="h-full max-w-6xl mx-auto flex items-center justify-between gap-3">
          <button
            disabled={!temAnterior}
            onClick={anterior}
            className="rounded-xl border border-white/20 px-4 sm:px-6 py-3 font-semibold disabled:opacity-30"
          >
            Anterior
          </button>

          <div className="text-center">
            <div className="text-xs sm:text-sm text-slate-400">
              Música {indice+1} / {itens.length}
            </div>

            {modo!=='PARTITURA' &&
              paginas.length>1 && (
              <div className="mt-1 text-[10px] sm:text-xs text-violet-300">
                Tela {pagina+1} / {paginas.length}
              </div>
            )}
          </div>

          <button
            disabled={!temProxima}
            onClick={proxima}
            className="rounded-xl bg-violet-700 px-5 sm:px-7 py-3 font-semibold disabled:opacity-30"
          >
            Próxima
          </button>
        </div>
      </footer>
    </main>
  );
}
