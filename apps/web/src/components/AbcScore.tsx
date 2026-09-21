import { useEffect, useRef } from 'react';
import ABCJS from 'abcjs';

export default function AbcScore({
  abc,
  titulo
}: {
  abc: string;
  titulo: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !abc.trim()) return;

    containerRef.current.innerHTML = '';

    ABCJS.renderAbc(containerRef.current, abc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 760
    });
  }, [abc]);

  function imprimir() {
    if (!containerRef.current) return;

    const conteudo = containerRef.current.innerHTML;
    const janela = window.open('', '_blank', 'width=900,height=700');

    if (!janela) return;

    janela.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${titulo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 30px;
              color: #111;
            }
            h1 {
              font-size: 22px;
              margin-bottom: 25px;
            }
            svg {
              max-width: 100%;
              height: auto;
            }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${titulo}</h1>
          ${conteudo}
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    janela.document.close();
  }

  if (!abc.trim()) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div ref={containerRef} className="overflow-x-auto" />

      <button
        type="button"
        onClick={imprimir}
        className="mt-4 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
      >
        Imprimir partitura
      </button>
    </div>
  );
}
