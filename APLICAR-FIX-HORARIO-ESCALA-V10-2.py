from pathlib import Path

# ============================================================
# 1) Corrige datetime-local para usar horário LOCAL ao editar
# ============================================================
p = Path("apps/web/src/pages/MissaEditor.tsx")
t = p.read_text(encoding="utf-8")

if "function paraDatetimeLocal(" not in t:
    anchor = """type RepertorioItem = {
  momentoId:string;
  musicaId:string;
  tomDaExecucao:string;
  observacao:string;
};
"""
    helper = anchor + """
function paraDatetimeLocal(valor:string) {
  const data=new Date(valor);

  const pad=(n:number)=>
    String(n).padStart(2,'0');

  return [
    data.getFullYear(),
    '-',
    pad(data.getMonth()+1),
    '-',
    pad(data.getDate()),
    'T',
    pad(data.getHours()),
    ':',
    pad(data.getMinutes())
  ].join('');
}
"""
    if anchor not in t:
        raise SystemExit("MissaEditor.tsx: tipo RepertorioItem não encontrado.")
    t = t.replace(anchor, helper, 1)

old = """            dataHora:
              new Date(
                missa.dataHora
              )
                .toISOString()
                .slice(0,16),
"""
new = """            dataHora:
              paraDatetimeLocal(
                missa.dataHora
              ),
"""
if old not in t:
    raise SystemExit("MissaEditor.tsx: conversão antiga de data/hora não encontrada.")
t = t.replace(old, new, 1)

p.write_text(t, encoding="utf-8")
print("OK: horário local corrigido em MissaEditor.tsx")


# ============================================================
# 2) Dashboard: PENDENTE significa pessoa já escalada
#    Não exibir a palavra 'pendente' como se a escala não
#    tivesse sido salva.
# ============================================================
p = Path("apps/web/src/pages/Dashboard.tsx")
t = p.read_text(encoding="utf-8")

old = """                          {item.confirmacao && (
                            <span className="cantus-badge">
                              Escala: {item.confirmacao}
                            </span>
                          )}
"""
new = """                          {item.confirmacao && (
                            <span className="cantus-badge">
                              {item.confirmacao==='PENDENTE'
                                ? 'ESCALADO'
                                : item.confirmacao==='CONFIRMADO'
                                  ? 'ESCALA: CONFIRMADO'
                                  : 'ESCALA: AUSENTE'}
                            </span>
                          )}
"""
if old not in t:
    raise SystemExit("Dashboard.tsx: badge antigo da escala não encontrado.")
t = t.replace(old, new, 1)

p.write_text(t, encoding="utf-8")
print("OK: status de escala ajustado em Dashboard.tsx")

print("V10.2 aplicada com sucesso.")
