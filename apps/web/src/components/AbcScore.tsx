import { useEffect, useRef } from 'react';
import ABCJS from 'abcjs';

export default function AbcScore({
  abc,
  titulo,
  showPrint = true,
  staffWidth = 760
}: {
  abc: string;
  titulo: string;
  showPrint?: boolean;
  staffWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !abc.trim()) return;

    ref.current.innerHTML = '';

    ABCJS.renderAbc(ref.current, abc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: staffWidth
    });
  }, [abc, staffWidth]);

  function imprimir() {
    if (!ref.current) return;

    const win = window.open(
      '',
      '_blank',
      'width=900,height=700'
    );

    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${titulo}</title>
          <style>
            body{
              font-family:Arial;
              margin:30px;
              color:#111
            }
            svg{
              max-width:100%;
              height:auto
            }
          </style>
        </head>
        <body>
          <h2>${titulo}</h2>
          ${ref.current.innerHTML}
          <script>
            window.onload=()=>window.print()
          </script>
        </body>
      </html>
    `);

    win.document.close();
  }

  return (
    <div>
      <div
        ref={ref}
        className="overflow-x-auto"
      />

      {showPrint && (
        <button
          type="button"
          onClick={imprimir}
          className="mt-3 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
        >
          Imprimir partitura
        </button>
      )}
    </div>
  );
}
