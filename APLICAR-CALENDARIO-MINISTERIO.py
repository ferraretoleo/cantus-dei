from pathlib import Path

path = Path("apps/web/src/pages/Calendario.tsx")
text = path.read_text(encoding="utf-8")

old1 = """                              <div className="mt-0.5 truncate">
                                {evento.tipoCelebracao}
                              </div>"""

new1 = """                              <div className="mt-0.5 truncate">
                                {evento.tipoCelebracao}
                              </div>

                              <div className="mt-0.5 truncate text-[10px] opacity-75">
                                {grupoAtual.nome}
                              </div>"""

old2 = """                      <div className="cantus-display text-2xl">
                        {missa.tipoCelebracao}
                      </div>"""

new2 = """                      <div className="cantus-display text-2xl">
                        {missa.tipoCelebracao}
                      </div>

                      <div className="mt-1 text-sm font-semibold cantus-gold">
                        {grupoAtual.nome}
                      </div>"""

if old1 not in text:
    raise SystemExit("Trecho do calendário mensal não encontrado.")

if old2 not in text:
    raise SystemExit("Trecho da agenda detalhada não encontrado.")

text = text.replace(old1, new1, 1)
text = text.replace(old2, new2, 1)

path.write_text(text, encoding="utf-8")
print("Calendario.tsx atualizado com nome do ministério.")
