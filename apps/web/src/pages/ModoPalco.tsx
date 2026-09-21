import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AbcScore from '../components/AbcScore';
import { api } from '../lib/api';

export default function ModoPalco() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    api(`/public/missas/${token}`).then(setData);
  }, [token]);

  if (!data) {
    return <main className="min-h-screen bg-black text-white grid place-items-center">Carregando...</main>;
  }

  const itens = data.repertorio;
  const item = itens[indice];

  if (!item) {
    return <main className="min-h-screen bg-black text-white grid place-items-center">Sem repertório.</main>;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 bg-black/95 border-b border-white/10 p-4 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[.16em] text-violet-300">{item.momentoNome}</div>
          <div className="text-xl font-bold">{item.titulo}</div>
        </div>
        <Link to={`/celebracao/${token}`} className="text-sm text-violet-300">Sair do palco</Link>
      </header>

      <section className="max-w-5xl mx-auto p-5 sm:p-8 pb-28">
        {(item.tomDaExecucao || item.tomOriginal) && (
          <div className="text-lg font-bold text-violet-300 mb-5">
            Tom: {item.tomDaExecucao || item.tomOriginal}
          </div>
        )}

        {item.cifra ? (
          <pre className="whitespace-pre-wrap font-mono text-lg sm:text-2xl leading-9 sm:leading-10">{item.cifra}</pre>
        ) : item.letra ? (
          <div className="whitespace-pre-wrap text-xl sm:text-3xl leading-9 sm:leading-[1.5]">{item.letra}</div>
        ) : item.notacaoAbc ? (
          <div className="bg-white text-black rounded-2xl p-4">
            <AbcScore abc={item.notacaoAbc} titulo={item.titulo} />
          </div>
        ) : (
          <div className="text-slate-400">Sem conteúdo.</div>
        )}
      </section>

      <footer className="fixed bottom-0 inset-x-0 bg-black/95 border-t border-white/10 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button disabled={indice === 0} onClick={() => setIndice(i => Math.max(0, i - 1))} className="rounded-xl border border-white/20 px-5 py-3 font-semibold disabled:opacity-30">
            Anterior
          </button>

          <div className="text-sm text-slate-400">{indice + 1} / {itens.length}</div>

          <button disabled={indice >= itens.length - 1} onClick={() => setIndice(i => Math.min(itens.length - 1, i + 1))} className="rounded-xl bg-violet-700 px-5 py-3 font-semibold disabled:opacity-30">
            Próxima
          </button>
        </div>
      </footer>
    </main>
  );
}
