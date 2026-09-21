import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AbcScore from '../components/AbcScore';
import { api } from '../lib/api';

export default function CelebracaoPublica() {
  const { token } = useParams();

  const [data, setData] = useState<any>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api(`/public/missas/${token}`)
      .then(setData)
      .catch(e => setErro(e.message));
  }, [token]);

  if (erro) {
    return (
      <main className="cantus-page min-h-screen grid place-items-center p-6">
        <div className="cantus-card p-6 text-red-200">
          {erro}
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="cantus-page min-h-screen grid place-items-center p-6">
        <div className="cantus-muted">
          Carregando celebração...
        </div>
      </main>
    );
  }

  const c = data.celebracao;

  return (
    <main className="cantus-page">
      <header className="cantus-staff border-b border-white/10">
        <div className="cantus-shell py-10 sm:py-14">
          <div className="cantus-eyebrow">
            Cantus Dei · Celebração
          </div>

          <h1 className="cantus-display mt-4 text-5xl sm:text-6xl">
            {c.tipoCelebracao}
          </h1>

          <p className="mt-4 text-lg cantus-muted">
            {new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'full',
              timeStyle: 'short'
            }).format(new Date(c.dataHora))}
          </p>

          <p className="mt-1 cantus-muted">
            {c.local}
          </p>

          <p className="mt-3 text-sm cantus-gold">
            {c.grupoNome} · {c.paroquia}
          </p>

          <Link
            to={`/celebracao/${token}/palco`}
            className="cantus-primary inline-block mt-7 px-6 py-3"
          >
            Abrir modo palco
          </Link>
        </div>
      </header>

      <section className="cantus-shell py-8 space-y-4">
        {data.repertorio.map((r: any) => (
          <article
            key={r.id}
            className="cantus-card p-5 sm:p-6"
          >
            <div className="cantus-eyebrow">
              {r.momentoNome}
            </div>

            <h2 className="cantus-display mt-2 text-3xl">
              {r.titulo}
            </h2>

            <div className="mt-1 text-sm cantus-muted">
              {r.autorCompositor || ''}
              {(r.tomDaExecucao || r.tomOriginal) &&
                ` · Tom ${r.tomDaExecucao || r.tomOriginal}`}
            </div>

            {r.cifra && (
              <details className="mt-5">
                <summary className="cursor-pointer font-bold cantus-gold">
                  Cifra
                </summary>

                <pre className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 whitespace-pre-wrap font-mono text-sm text-[#eee9df]">
                  {r.cifra}
                </pre>
              </details>
            )}

            {r.letra && (
              <details className="mt-4">
                <summary className="cursor-pointer font-bold cantus-gold">
                  Letra
                </summary>

                <div className="mt-4 whitespace-pre-wrap leading-7 cantus-muted">
                  {r.letra}
                </div>
              </details>
            )}

            {r.notacaoAbc && (
              <details className="mt-4">
                <summary className="cursor-pointer font-bold cantus-gold">
                  Partitura
                </summary>

                <div className="mt-4 rounded-2xl bg-white text-black p-4">
                  <AbcScore
                    abc={r.notacaoAbc}
                    titulo={r.titulo}
                  />
                </div>
              </details>
            )}
          </article>
        ))}

        {!!data.escala.length && (
          <section className="cantus-card p-6">
            <div className="cantus-eyebrow">
              Escala
            </div>

            <h2 className="cantus-display mt-3 text-3xl">
              Quem serve nesta celebração
            </h2>

            <div className="grid sm:grid-cols-2 gap-3 mt-5">
              {data.escala.map((m: any, i: number) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/10 bg-white/[.025] p-4"
                >
                  <strong>{m.nome}</strong>

                  {m.instrumentoVoz && (
                    <div className="mt-1 text-sm cantus-muted">
                      {m.instrumentoVoz}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
