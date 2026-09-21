import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AbcScore from '../components/AbcScore';
import { api } from '../lib/api';

export default function CelebracaoPublica() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api(`/public/missas/${token}`).then(setData).catch(e => setErro(e.message));
  }, [token]);

  if (erro) {
    return <main className="min-h-screen grid place-items-center p-6">{erro}</main>;
  }

  if (!data) {
    return <main className="min-h-screen grid place-items-center p-6">Carregando...</main>;
  }

  const c = data.celebracao;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-violet-800 text-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-sm font-bold uppercase tracking-[.16em] text-violet-200">Cantus Dei</div>
          <h1 className="mt-2 text-3xl font-bold">{c.tipoCelebracao}</h1>
          <p className="mt-2 text-violet-100">
            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(c.dataHora))}
          </p>
          <p className="text-violet-100">{c.local}</p>
          <p className="mt-1 text-sm text-violet-200">{c.grupoNome} · {c.paroquia}</p>

          <Link to={`/celebracao/${token}/palco`} className="inline-block mt-5 rounded-xl bg-white text-violet-800 px-4 py-2 font-semibold">
            Abrir modo palco
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto p-6 space-y-4">
        {data.repertorio.map((r: any) => (
          <article key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="text-sm font-bold text-violet-700">{r.momentoNome}</div>
            <h2 className="mt-1 text-2xl font-bold">{r.titulo}</h2>
            <div className="text-sm text-slate-500">
              {r.autorCompositor || ''}
              {(r.tomDaExecucao || r.tomOriginal) && ` · Tom ${r.tomDaExecucao || r.tomOriginal}`}
            </div>

            {r.cifra && (
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-violet-700">Cifra</summary>
                <pre className="mt-3 bg-slate-50 p-4 rounded-xl whitespace-pre-wrap font-mono text-sm">{r.cifra}</pre>
              </details>
            )}

            {r.letra && (
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-violet-700">Letra</summary>
                <div className="mt-3 whitespace-pre-wrap leading-7">{r.letra}</div>
              </details>
            )}

            {r.notacaoAbc && (
              <details className="mt-4">
                <summary className="cursor-pointer font-semibold text-violet-700">Partitura</summary>
                <div className="mt-3"><AbcScore abc={r.notacaoAbc} titulo={r.titulo} /></div>
              </details>
            )}
          </article>
        ))}

        {!!data.escala.length && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-xl font-bold">Escala</h2>
            <div className="mt-3 space-y-2">
              {data.escala.map((m: any, i: number) => (
                <div key={i} className="text-sm">
                  <strong>{m.nome}</strong>
                  {m.instrumentoVoz ? ` · ${m.instrumentoVoz}` : ''}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
