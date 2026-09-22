from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str):
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Trecho não encontrado em {path}: {label}")
    text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print(f"OK: {label}")

# ============================================================
# 1. MISSA EDITOR
# Remove confirmação individual da escala e deixa apenas seleção.
# Também grava a última publicação para exibir o painel de links
# de forma robusta no calendário.
# ============================================================

p = Path("apps/web/src/pages/MissaEditor.tsx")

replace_once(
    p,
    """          setEscala(
            data.escala.map(
              (e:any)=>({
                userId:
                  e.userId,
                instrumentoVoz:
                  e.instrumentoVoz || '',
                confirmacao:
                  e.confirmacao
              })
            )
          );""",
    """          setEscala(
            data.escala.map(
              (e:any)=>({
                userId:
                  e.userId,
                instrumentoVoz:
                  e.instrumentoVoz || ''
              })
            )
          );""",
    "remove confirmacao ao carregar escala"
)

replace_once(
    p,
    """      const data=
        await api(
          `/grupos/${grupoId}/missas/${id}/publicar`,
          {
            method:'POST'
          }
        );

      navigate(
        `/g/${slug}/calendario?publicada=${id}`,
        {
          replace:true,
          state:{
            publicUrl:
              data.publicUrl
          }
        }
      );""",
    """      const data=
        await api(
          `/grupos/${grupoId}/missas/${id}/publicar`,
          {
            method:'POST'
          }
        );

      localStorage.setItem(
        'cantus_ultima_publicacao',
        JSON.stringify({
          missaId:id,
          publicUrl:data.publicUrl,
          token:data.token,
          grupoId,
          criadoEm:Date.now()
        })
      );

      navigate(
        `/g/${slug}/calendario?publicada=${id}`,
        {
          replace:true,
          state:{
            publicUrl:
              data.publicUrl
          }
        }
      );""",
    "persiste dados da publicacao antes do redirect"
)

replace_once(
    p,
    """        {
          userId:
            membro.userId,
          instrumentoVoz:
            membro.instrumento ||
            membro.voz ||
            '',
          confirmacao:
            'PENDENTE'
        }""",
    """        {
          userId:
            membro.userId,
          instrumentoVoz:
            membro.instrumento ||
            membro.voz ||
            ''
        }""",
    "remove confirmacao ao adicionar musico"
)

# Remove função confirmar
text = p.read_text(encoding="utf-8")
start = text.find("  async function confirmar(")
end_marker = "  const meuUser="
if start != -1:
    end = text.find(end_marker, start)
    if end == -1:
        raise SystemExit("Não foi possível localizar fim da função confirmar.")
    text = text[:start] + text[end:]

# Remove meuUser/estouEscalado block
start = text.find("  const meuUser=")
end_marker = "\n\n  return ("
if start != -1:
    end = text.find(end_marker, start)
    if end == -1:
        raise SystemExit("Não foi possível remover bloco estouEscalado.")
    text = text[:start] + text[end:]

# Remove bloco visual "Sua participação"
start = text.find("              {estouEscalado &&")
if start != -1:
    # find the next closing section boundary after this block
    end = text.find("            </section>", start)
    if end == -1:
        raise SystemExit("Não foi possível remover confirmação visual.")
    # Need preserve section closing itself
    text = text[:start] + text[end:]

p.write_text(text, encoding="utf-8")
print("OK: remove confirmacao visual da escala")

# ============================================================
# 2. CALENDARIO
# Recupera link publicado de três fontes:
# - state do navigate
# - registro persistido no localStorage
# - tokenPublico retornado pela listagem
# Assim o painel de compartilhamento sempre aparece.
# ============================================================

p = Path("apps/web/src/pages/Calendario.tsx")
text = p.read_text(encoding="utf-8")

old = """  const publicUrl=
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
    );"""

new = """  const ultimaPublicacao=useMemo(()=>{
    try {
      return JSON.parse(
        localStorage.getItem(
          'cantus_ultima_publicacao'
        ) || 'null'
      ) as {
        missaId?:string;
        publicUrl?:string;
        token?:string;
        grupoId?:string;
        criadoEm?:number;
      } | null;
    } catch {
      return null;
    }
  },[publicadaId]);

  const publicUrl=
    (
      location.state as
      {
        publicUrl?:string
      } | null
    )?.publicUrl ||
    (
      ultimaPublicacao?.missaId===publicadaId &&
      ultimaPublicacao?.publicUrl
        ? ultimaPublicacao.publicUrl
        : ''
    ) ||
    (
      publicada?.tokenPublico
        ? `${window.location.origin}/celebracao/${publicada.tokenPublico}`
        : ''
    );"""

if old not in text:
    raise SystemExit("Trecho publicUrl não encontrado no Calendario.tsx")

text = text.replace(old, new, 1)

# Scroll to top after successful publication so share panel is visible.
needle = """  useEffect(()=>{
    if (
      publicada?.dataHora
    ) {"""

insert = """  useEffect(()=>{
    if (
      publicadaId &&
      publicUrl
    ) {
      window.scrollTo({
        top:0,
        behavior:'smooth'
      });
    }
  },[publicadaId,publicUrl]);

  useEffect(()=>{
    if (
      publicada?.dataHora
    ) {"""

if needle not in text:
    raise SystemExit("Ponto de inserção do scroll não encontrado.")

text = text.replace(needle, insert, 1)

# Strengthen publication panel condition: if publication id exists and URL recovered,
# show even while the list is still loading, then use fallback text until missa arrives.
old = """        {publicada &&
          publicUrl && (
          <section className="cantus-card mt-7 p-6 sm:p-8">"""

new = """        {publicadaId &&
          publicUrl && (
          <section className="cantus-card mt-7 p-6 sm:p-8 ring-1 ring-[#d5ae62]/45">"""

if old not in text:
    raise SystemExit("Condição do painel de publicação não encontrada.")

text = text.replace(old, new, 1)

# Avoid references to publicada before loaded.
text = text.replace(
    "{publicada.tipoCelebracao}",
    "{publicada?.tipoCelebracao || 'Celebração publicada'}",
    1
)

old_date = """                  {new Intl.DateTimeFormat(
                    'pt-BR',
                    {
                      dateStyle:'full',
                      timeStyle:'short'
                    }
                  ).format(
                    new Date(
                      publicada.dataHora
                    )
                  )}"""

new_date = """                  {publicada?.dataHora
                    ? new Intl.DateTimeFormat(
                        'pt-BR',
                        {
                          dateStyle:'full',
                          timeStyle:'short'
                        }
                      ).format(
                        new Date(
                          publicada.dataHora
                        )
                      )
                    : 'Publicação concluída com sucesso'}"""

if old_date in text:
    text = text.replace(old_date, new_date, 1)

text = text.replace(
    "{publicada.local}",
    "{publicada?.local || grupoAtual.nome}",
    1
)

# Add a clearer heading to ensure user sees sharing actions.
text = text.replace(
    """            <div className="cantus-eyebrow">
              Celebração publicada
            </div>""",
    """            <div className="cantus-eyebrow">
              Celebração publicada com sucesso
            </div>

            <div className="mt-2 text-sm cantus-muted">
              Use os atalhos abaixo para compartilhar a celebração.
            </div>""",
    1
)

p.write_text(text, encoding="utf-8")
print("OK: painel de link robusto no calendario")

print()
print("Ajustes concluídos.")
