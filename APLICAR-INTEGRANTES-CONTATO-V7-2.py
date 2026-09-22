from pathlib import Path

path = Path("apps/web/src/pages/Integrantes.tsx")
text = path.read_text(encoding="utf-8")

old = r'''                <div className="min-w-0">
                  <div className="cantus-display text-xl truncate">
                    {m.nome}
                  </div>

                  <div className="mt-1 text-sm cantus-muted truncate">
                    {m.email}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">'''

new = r'''                <div className="min-w-0 flex-1">
                  <div className="cantus-display text-xl truncate">
                    {m.nome}
                  </div>

                  <div className="mt-1 text-sm cantus-muted">
                    {rotuloPapel(m.papel)}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.025] p-4">
                <div className="cantus-eyebrow">
                  Contato
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <a
                    href={`mailto:${m.email}`}
                    className="flex items-center gap-2 text-[#e8e0d5] hover:text-[#d5ae62]"
                  >
                    <span>✉</span>
                    <span className="break-all">
                      {m.email}
                    </span>
                  </a>

                  {m.telefone ? (
                    <a
                      href={`tel:${m.telefone}`}
                      className="flex items-center gap-2 text-[#e8e0d5] hover:text-[#d5ae62]"
                    >
                      <span>☎</span>
                      <span>
                        {m.telefone}
                      </span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 cantus-muted">
                      <span>☎</span>
                      <span>
                        Telefone não informado
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">'''

if old not in text:
    raise SystemExit("Trecho dos cards de integrantes não encontrado.")

text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8")

print("Integrantes.tsx atualizado com contatos visíveis.")
