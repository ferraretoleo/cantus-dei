from pathlib import Path

path = Path("apps/web/src/pages/MasterAdmin.tsx")
text = path.read_text(encoding="utf-8")

old_nova = r'''              <input
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
              />'''

new_nova = r'''              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="cantus-secondary px-5 py-3 cursor-pointer inline-flex items-center gap-2">
                  <span>🖼️</span>
                  <span>Selecionar logo</span>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
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
                  />
                </label>

                <span className="text-sm cantus-muted">
                  {logoNova
                    ? 'Logo selecionada'
                    : 'PNG, JPG ou WEBP'}
                </span>
              </div>'''

old_alterar = r'''                        <input
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
                        />'''

new_alterar = r'''                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <label className="cantus-secondary px-5 py-3 cursor-pointer inline-flex items-center gap-2">
                            <span>🖼️</span>
                            <span>Escolher nova logo</span>

                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
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
                            />
                          </label>

                          <span className="text-sm cantus-muted">
                            PNG, JPG ou WEBP
                          </span>
                        </div>'''

if old_nova not in text:
    raise SystemExit("Trecho do upload da nova paróquia não encontrado.")

if old_alterar not in text:
    raise SystemExit("Trecho do upload da logo existente não encontrado.")

text = text.replace(old_nova, new_nova, 1)
text = text.replace(old_alterar, new_alterar, 1)

path.write_text(text, encoding="utf-8")
print("MasterAdmin.tsx atualizado com botões de upload.")
