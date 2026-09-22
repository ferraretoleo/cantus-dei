from pathlib import Path

ROOT = Path.cwd()


def replace_once(path_str: str, old: str, new: str, label: str):
    path = ROOT / path_str
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Não foi possível aplicar '{label}' em {path_str}.")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"OK: {label}")


# ============================================================
# API SERVER
# ============================================================
replace_once(
    "apps/api/src/server.ts",
    "import { dashboardRoutes } from './routes/dashboard.js';",
    "import { dashboardRoutes } from './routes/dashboard.js';\nimport { parishBrandRoutes } from './routes/parish-brand.js';",
    "import parishBrandRoutes",
)

replace_once(
    "apps/api/src/server.ts",
    "await app.register(dashboardRoutes);",
    "await app.register(dashboardRoutes);\nawait app.register(parishBrandRoutes);",
    "registra parishBrandRoutes",
)


# ============================================================
# MASTER ADMIN
# ============================================================
master = ROOT / "apps/web/src/pages/MasterAdmin.tsx"
text = master.read_text(encoding="utf-8")

helper = r'''
async function prepararLogo(file:File):Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem.');
  }

  const original=await new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result));
    reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });

  const imagem=await new Promise<HTMLImageElement>((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error('Imagem inválida.'));
    img.src=original;
  });

  const max=420;
  const escala=Math.min(1,max/imagem.width,max/imagem.height);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(imagem.width*escala));
  canvas.height=Math.max(1,Math.round(imagem.height*escala));

  const ctx=canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível preparar a logo.');
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(imagem,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/webp',0.88);
}

'''

marker = "export default function MasterAdmin() {"
if helper.strip() not in text:
    if marker not in text:
        raise SystemExit("MasterAdmin: helper sem ponto de inserção.")
    text = text.replace(marker, helper + marker, 1)

old = "  const [mensagem,setMensagem]=useState('');"
new = """  const [mensagem,setMensagem]=useState('');

  const [logoNova,setLogoNova]=useState('');
  const [logoSelecionada,setLogoSelecionada]=useState('');
  const [salvandoLogo,setSalvandoLogo]=useState(false);"""
if old not in text:
    raise SystemExit("MasterAdmin: estado mensagem não encontrado.")
text = text.replace(old, new, 1)

old = '''  useEffect(()=>{
    carregarMembros(paroquiaSelecionada);
  },[paroquiaSelecionada]);'''
new = '''  useEffect(()=>{
    carregarMembros(paroquiaSelecionada);
  },[paroquiaSelecionada]);

  useEffect(()=>{
    if (!paroquiaSelecionada) {
      setLogoSelecionada('');
      return;
    }

    api(`/public/paroquias/${paroquiaSelecionada}/brand`)
      .then(data=>setLogoSelecionada(data.logoData || ''))
      .catch(()=>setLogoSelecionada(''));
  },[paroquiaSelecionada]);'''
if old not in text:
    raise SystemExit("MasterAdmin: useEffect membros não encontrado.")
text = text.replace(old, new, 1)

old = '''      setFormParoquia({
        nome:'',
        cidade:'',
        endereco:''
      });

      setMensagem(
        `Paróquia "${nova.nome}" criada.`
      );

      await carregarBase();
      setParoquiaSelecionada(nova.id);'''
new = '''      if (logoNova) {
        await api(`/master/paroquias/${nova.id}/logo`,{
          method:'PUT',
          body:JSON.stringify({
            logoData:logoNova
          })
        });
      }

      setFormParoquia({
        nome:'',
        cidade:'',
        endereco:''
      });
      setLogoNova('');

      setMensagem(
        `Paróquia "${nova.nome}" criada.`
      );

      await carregarBase();
      setParoquiaSelecionada(nova.id);'''
if old not in text:
    raise SystemExit("MasterAdmin: trecho criar paróquia não encontrado.")
text = text.replace(old, new, 1)

old = "  async function vincularUsuario(e:FormEvent) {"
new = r'''  async function salvarLogoParoquia() {
    if (!paroquiaSelecionada || !logoSelecionada) return;

    setSalvandoLogo(true);
    setErro('');
    setMensagem('');

    try {
      await api(`/master/paroquias/${paroquiaSelecionada}/logo`,{
        method:'PUT',
        body:JSON.stringify({
          logoData:logoSelecionada
        })
      });

      setMensagem('Logo da paróquia atualizada.');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar a logo.'
      );
    } finally {
      setSalvandoLogo(false);
    }
  }

  async function removerLogoParoquia() {
    if (!paroquiaSelecionada) return;
    if (!window.confirm('Remover a logo desta paróquia?')) return;

    try {
      await api(`/master/paroquias/${paroquiaSelecionada}/logo`,{
        method:'DELETE'
      });

      setLogoSelecionada('');
      setMensagem('Logo removida.');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao remover a logo.'
      );
    }
  }

  async function vincularUsuario(e:FormEvent) {'''
if old not in text:
    raise SystemExit("MasterAdmin: vincularUsuario não encontrado.")
text = text.replace(old, new, 1)

old = '''            <button className="cantus-primary mt-6 px-6 py-3">
              Criar paróquia
            </button>'''
new = r'''            <label className="block mt-4">
              <span className="text-sm font-semibold">
                Logo da paróquia
              </span>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={async e=>{
                  const file=e.target.files?.[0];
                  if (!file) return;

                  try {
                    setLogoNova(await prepararLogo(file));
                  } catch (error) {
                    setErro(
                      error instanceof Error
                        ? error.message
                        : 'Erro ao preparar a logo.'
                    );
                  }
                }}
                className="cantus-input mt-2"
              />
            </label>

            {logoNova && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <div className="cantus-eyebrow">
                  Prévia da logo
                </div>

                <div className="mt-3 w-28 h-28 rounded-xl bg-white p-2 grid place-items-center">
                  <img
                    src={logoNova}
                    alt="Prévia da logo"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}

            <button className="cantus-primary mt-6 px-6 py-3">
              Criar paróquia
            </button>'''
if old not in text:
    raise SystemExit("MasterAdmin: botão criar paróquia não encontrado.")
text = text.replace(old, new, 1)

old = '''                <p className="mt-2 cantus-muted">
                  {pAtual.cidade}
                  {pAtual.endereco
                    ? ` · ${pAtual.endereco}`
                    : ''}
                </p>'''
new = r'''                <p className="mt-2 cantus-muted">
                  {pAtual.cidade}
                  {pAtual.endereco
                    ? ` · ${pAtual.endereco}`
                    : ''}
                </p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-5">
                  <div className="cantus-eyebrow">
                    Identidade visual
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-32 h-32 rounded-2xl bg-white p-2 grid place-items-center border border-white/10">
                      {logoSelecionada ? (
                        <img
                          src={logoSelecionada}
                          alt={`Logo ${pAtual.nome}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-slate-400 text-sm text-center">
                          Sem logo
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block">
                        <span className="text-sm font-semibold">
                          Alterar logo
                        </span>

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={async e=>{
                            const file=e.target.files?.[0];
                            if (!file) return;

                            try {
                              setLogoSelecionada(await prepararLogo(file));
                            } catch (error) {
                              setErro(
                                error instanceof Error
                                  ? error.message
                                  : 'Erro ao preparar a logo.'
                              );
                            }
                          }}
                          className="cantus-input mt-2"
                        />
                      </label>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={!logoSelecionada || salvandoLogo}
                          onClick={salvarLogoParoquia}
                          className="cantus-primary px-4 py-2 text-sm disabled:opacity-40"
                        >
                          {salvandoLogo ? 'Salvando...' : 'Salvar logo'}
                        </button>

                        {logoSelecionada && (
                          <button
                            type="button"
                            onClick={removerLogoParoquia}
                            className="cantus-danger px-4 py-2 text-sm"
                          >
                            Remover logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>'''
if old not in text:
    raise SystemExit("MasterAdmin: bloco paróquia selecionada não encontrado.")
text = text.replace(old, new, 1)

master.write_text(text, encoding="utf-8")
print("OK: MasterAdmin com logo")


# ============================================================
# CALENDARIO: QR COM LOGO
# ============================================================
cal = ROOT / "apps/web/src/pages/Calendario.tsx"
text = cal.read_text(encoding="utf-8")

if "import QRCode from 'qrcode';" in text:
    text = text.replace(
        "import QRCode from 'qrcode';",
        "import { qrComLogo } from '../lib/qrWithLogo';",
        1,
    )
elif "qrComLogo" not in text:
    raise SystemExit("Calendario: import QRCode não encontrado.")

old = '''  const [qr,setQr]=
    useState('');'''
new = '''  const [qr,setQr]=
    useState('');

  const [logoParoquia,setLogoParoquia]=
    useState('');'''
if old not in text:
    raise SystemExit("Calendario: estado QR não encontrado.")
text = text.replace(old, new, 1)

old = '''  useEffect(()=>{
    carregar();
  },[]);'''
new = '''  useEffect(()=>{
    carregar();

    if (paroquiaAtiva?.id) {
      api(`/public/paroquias/${paroquiaAtiva.id}/brand`)
        .then(data=>setLogoParoquia(data.logoData || ''))
        .catch(()=>setLogoParoquia(''));
    }
  },[]);'''
if old not in text:
    raise SystemExit("Calendario: useEffect carregar não encontrado.")
text = text.replace(old, new, 1)

old = '''    QRCode
      .toDataURL(
        publicUrl
      )
      .then(setQr)
      .catch(()=>setQr(''));
  },[publicUrl]);'''
new = '''    qrComLogo(
      publicUrl,
      logoParoquia || null
    )
      .then(setQr)
      .catch(()=>setQr(''));
  },[publicUrl,logoParoquia]);'''
if old not in text:
    raise SystemExit("Calendario: geração QR antiga não encontrada.")
text = text.replace(old, new, 1)

cal.write_text(text, encoding="utf-8")
print("OK: Calendario QR com logo")

print("Patches V7 aplicados com sucesso.")
