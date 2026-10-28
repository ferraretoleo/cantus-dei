from pathlib import Path

ROOT = Path.cwd()
musicas_path = ROOT / 'apps/web/src/pages/Musicas.tsx'
palco_path = ROOT / 'apps/web/src/pages/ModoPalco.tsx'

def rep(text, old, new, label):
    if old not in text:
        raise SystemExit(f'[ERRO] Trecho não encontrado: {label}')
    return text.replace(old, new, 1)

# Musicas.tsx
text = musicas_path.read_text(encoding='utf-8')
text = rep(text,
    "import { useEffect, useState, type FormEvent } from 'react';",
    "import { useEffect, useRef, useState, type FormEvent } from 'react';",
    'Musicas import')
text = rep(text,
    "const exemploAbc = `X:1",
    "const MARCADOR_PALCO = '[[QUEBRA]]';\n\nconst exemploAbc = `X:1",
    'Musicas marcador')
text = rep(text,
    "  const [erro, setErro] = useState('');\n",
    "  const [erro, setErro] = useState('');\n  const letraRef = useRef<HTMLTextAreaElement>(null);\n  const cifraRef = useRef<HTMLTextAreaElement>(null);\n",
    'Musicas refs')

anchor = "  async function salvar(e: FormEvent) {\n"
insert = r'''  function inserirQuebraPalco(campo: 'letra' | 'cifra') {
    const textarea = campo === 'letra' ? letraRef.current : cifraRef.current;
    const valor = form[campo];
    const inicio = textarea?.selectionStart ?? valor.length;
    const fim = textarea?.selectionEnd ?? inicio;
    const antes = valor.slice(0, inicio);
    const depois = valor.slice(fim);
    const prefixo = antes.length > 0 && !antes.endsWith('\n') ? '\n' : '';
    const sufixo = depois.length > 0 && !depois.startsWith('\n') ? '\n' : '';
    const insercao = `${prefixo}${MARCADOR_PALCO}\n${sufixo}`;
    const novoValor = antes + insercao + depois;

    setForm({ ...form, [campo]: novoValor });

    requestAnimationFrame(() => {
      const alvo = campo === 'letra' ? letraRef.current : cifraRef.current;
      if (!alvo) return;
      const posicao = antes.length + insercao.length;
      alvo.focus();
      alvo.setSelectionRange(posicao, posicao);
    });
  }

'''
text = rep(text, anchor, insert + anchor, 'Musicas funcao inserir')

old = '''            <div className="grid lg:grid-cols-2 gap-4 mt-6">
              <label>
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  Letra
                </span>

                <textarea
                  rows={10}
                  value={form.letra}
                  onChange={e =>
                    setForm({
                      ...form,
                      letra: e.target.value
                    })
                  }
                  className="cantus-input mt-2"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  Cifra
                </span>

                <textarea
                  rows={10}
                  value={form.cifra}
                  onChange={e =>
                    setForm({
                      ...form,
                      cifra: e.target.value
                    })
                  }
                  className="cantus-input mt-2 font-mono text-sm"
                />
              </label>
            </div>
'''
new = '''            <div className="grid lg:grid-cols-2 gap-4 mt-6">
              <label>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[#d9d2c6]">Letra</span>
                  <button type="button" onClick={() => inserirQuebraPalco('letra')} className="cantus-secondary px-3 py-1.5 text-xs" title="Nova tela no Modo Palco">
                    + Quebra de palco
                  </button>
                </div>
                <textarea ref={letraRef} rows={10} value={form.letra} onChange={e => setForm({ ...form, letra: e.target.value })} className="cantus-input mt-2" placeholder={`Use ${MARCADOR_PALCO} para separar estrofes e refrões.`} />
                <div className="mt-2 text-xs cantus-muted">Posicione o cursor após a estrofe ou refrão e clique em <strong>Quebra de palco</strong>. O marcador <code>{MARCADOR_PALCO}</code> não aparece na apresentação.</div>
              </label>

              <label>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[#d9d2c6]">Cifra</span>
                  <button type="button" onClick={() => inserirQuebraPalco('cifra')} className="cantus-secondary px-3 py-1.5 text-xs" title="Nova tela no Modo Palco">
                    + Quebra de palco
                  </button>
                </div>
                <textarea ref={cifraRef} rows={10} value={form.cifra} onChange={e => setForm({ ...form, cifra: e.target.value })} className="cantus-input mt-2 font-mono text-sm" placeholder={`Use ${MARCADOR_PALCO} para separar os trechos.`} />
                <div className="mt-2 text-xs cantus-muted">Cada trecho entre marcadores vira uma tela independente no Modo Palco.</div>
              </label>
            </div>
'''
text = rep(text, old, new, 'Musicas editores')
musicas_path.write_text(text, encoding='utf-8')

# ModoPalco.tsx
text = palco_path.read_text(encoding='utf-8')
text = rep(text,
'''type PaginaTexto = {
  linhas:string[];
};
''',
'''type PaginaTexto = {
  linhas:string[];
  quebraManual?:boolean;
};

const MARCADOR_PALCO = /^\\s*\\[\\[QUEBRA\\]\\]\\s*$/gm;
''',
'ModoPalco marcador')

old = r'''function quebrarEmPaginas(
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
'''
new = r'''function quebrarEmPaginas(
  texto:string,
  limite:number
):PaginaTexto[] {
  const normalizado=texto.replace(/\r\n/g,'\n');
  const blocos=normalizado.split(MARCADOR_PALCO);

  if (blocos.length>1) {
    const paginasManuais=blocos
      .map(bloco=>bloco.replace(/^\n+|\n+$/g,''))
      .filter(bloco=>bloco.trim().length>0)
      .map(bloco=>({linhas:bloco.split('\n'),quebraManual:true}));

    return paginasManuais.length ? paginasManuais : [{linhas:[]}];
  }

  const linhas=normalizado.split('\n');
  const paginas:PaginaTexto[]=[];
  for (let i=0;i<linhas.length;i+=limite) {
    paginas.push({linhas:linhas.slice(i,i+limite)});
  }
  return paginas.length ? paginas : [{linhas:[]}];
}

function tamanhoFonteAutomatico(
  linhas:string[],
  modo:ModoPalcoTipo,
  altura:number,
  largura:number
) {
  const quantidadeLinhas=Math.max(1,linhas.length);
  const maiorLinha=Math.max(1,...linhas.map(linha=>linha.length));

  if (modo==='LETRA') {
    const alturaUtil=Math.max(180,altura-305);
    const larguraUtil=Math.max(280,Math.min(1500,largura-120));
    const porAltura=alturaUtil/(quantidadeLinhas*1.24);
    const porLargura=larguraUtil/(maiorLinha*0.56);
    return Math.max(18,Math.min(78,Math.floor(Math.min(porAltura,porLargura))));
  }

  const alturaUtil=Math.max(180,altura-285);
  const larguraUtil=Math.max(280,Math.min(1152,largura-70));
  const porAltura=alturaUtil/(quantidadeLinhas*1.42);
  const porLargura=larguraUtil/(maiorLinha*0.62);
  return Math.max(12,Math.min(34,Math.floor(Math.min(porAltura,porLargura))));
}
'''
text = rep(text, old, new, 'ModoPalco paginas')

anchor = '''  const paginaAtual=
    paginas[pagina] ||
    paginas[0];

'''
insert = '''  const fonteAutomatica=
    tamanhoFonteAutomatico(
      paginaAtual?.linhas || [],
      modo,
      viewport.height,
      viewport.width
    );

'''
text = rep(text, anchor, anchor + insert, 'ModoPalco fonte')

text = rep(text,
'''              <div
                className="w-full whitespace-pre-wrap text-center font-semibold tracking-[.01em] text-[clamp(2rem,4.1vw,4.8rem)] leading-[1.22] drop-shadow-[0_3px_14px_rgba(0,0,0,.75)]"
              >
''',
'''              <div
                className="w-full whitespace-pre-wrap text-center font-semibold tracking-[.01em] drop-shadow-[0_3px_14px_rgba(0,0,0,.75)]"
                style={{ fontSize:`${fonteAutomatica}px`, lineHeight:1.22 }}
              >
''',
'ModoPalco letra')

text = rep(text,
'''                <pre className="m-0 whitespace-pre font-mono text-[15px] sm:text-xl lg:text-2xl leading-7 sm:leading-[2.125rem] lg:leading-[2.375rem] overflow-hidden">
                  {paginaAtual
                    .linhas
                    .join('\\n')}
                </pre>
''',
'''                <pre
                  className="m-0 whitespace-pre font-mono overflow-hidden"
                  style={{ fontSize:`${fonteAutomatica}px`, lineHeight:1.42 }}
                >
                  {paginaAtual
                    .linhas
                    .join('\\n')}
                </pre>
''',
'ModoPalco cifra')

palco_path.write_text(text, encoding='utf-8')
print('[OK] Patch V12 aplicado.')
print('Execute: npm run build')
