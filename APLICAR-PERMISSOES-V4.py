from pathlib import Path

ROOT = Path(__file__).resolve().parent

def patch(rel, replacements):
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"Arquivo não encontrado: {path}")

    text = path.read_text(encoding="utf-8")

    for old, new, expected_min in replacements:
        count = text.count(old)

        if count < expected_min:
            raise SystemExit(
                f"Não foi possível aplicar ajuste em {rel}.\n"
                f"Trecho esperado não encontrado:\n{old[:180]}"
            )

        text = text.replace(old, new)

    path.write_text(text, encoding="utf-8")
    print(f"OK: {rel}")


# ============================================================
# MÚSICAS
# Todos os integrantes podem CADASTRAR música.
# Edição/exclusão continua para coordenação/responsável/admins.
# ============================================================

patch(
    "apps/web/src/pages/Musicas.tsx",
    [
        (
            "import { api } from '../lib/api';",
            "import { api } from '../lib/api';\nimport { useAuth } from '../contexts/AuthContext';",
            1
        ),
        (
            "  const grupo = getGrupoAtivo();\n",
            "  const grupo = getGrupoAtivo();\n  const { user, paroquiaAtiva } = useAuth();\n",
            1
        ),
        (
            "  const pode = grupo.papel !== 'MUSICO';",
            """  const podeCadastrar = true;

  const podeGerenciar =
    user?.perfilGlobal === 'MASTER' ||
    paroquiaAtiva?.papel === 'ADMIN_PAROQUIA' ||
    grupo.papel === 'RESPONSAVEL' ||
    grupo.papel === 'COORDENADOR';""",
            1
        ),
        (
            """          {pode && (
            <button
              onClick={() => {
                setForm(vazio);""",
            """          {podeCadastrar && (
            <button
              onClick={() => {
                setForm(vazio);""",
            1
        ),
        (
            "{mostrar && pode && (",
            "{mostrar && podeCadastrar && (",
            1
        ),
        (
            """              {pode && (
                <div className="flex gap-3 mt-6">""",
            """              {podeGerenciar && (
                <div className="flex gap-3 mt-6">""",
            1
        )
    ]
)

# ============================================================
# CELEBRAÇÕES
# MASTER + ADMIN_PAROQUIA + RESPONSAVEL DO MINISTÉRIO
# Momentos continuam exclusivos de MASTER/ADMIN_PAROQUIA.
# ============================================================

patch(
    "apps/web/src/pages/MissaEditor.tsx",
    [
        (
            "import { api } from '../lib/api';",
            "import { api } from '../lib/api';\nimport { useAuth } from '../contexts/AuthContext';",
            1
        ),
        (
            """  const grupo = getGrupoAtivo();
  const nova = missaId === 'nova';""",
            """  const grupo = getGrupoAtivo();
  const nova = missaId === 'nova';
  const { user, paroquiaAtiva } = useAuth();""",
            1
        ),
        (
            "  const podeEditar = grupoAtual.papel !== 'MUSICO';",
            """  const podeEditar =
    user?.perfilGlobal === 'MASTER' ||
    paroquiaAtiva?.papel === 'ADMIN_PAROQUIA' ||
    grupoAtual.papel === 'RESPONSAVEL';

  const podeCriarMomento =
    user?.perfilGlobal === 'MASTER' ||
    paroquiaAtiva?.papel === 'ADMIN_PAROQUIA';""",
            1
        ),
        (
            """                  {podeEditar && (
                    <form
                      onSubmit={cadastrarNovoMomento}""",
            """                  {podeCriarMomento && (
                    <form
                      onSubmit={cadastrarNovoMomento}""",
            1
        )
    ]
)

# ============================================================
# API DE CELEBRAÇÕES
# Remove COORDENADOR das ações administrativas da celebração.
# O group-guard já converte MASTER e ADMIN_PAROQUIA em RESP.
# ============================================================

missas = ROOT / "apps/api/src/routes/missas.ts"
if not missas.exists():
    raise SystemExit(f"Arquivo não encontrado: {missas}")

text = missas.read_text(encoding="utf-8")
old = "['RESPONSAVEL', 'COORDENADOR']"
count = text.count(old)

if count < 1:
    raise SystemExit(
        "Não encontrei as regras antigas de celebrações em missas.ts."
    )

text = text.replace(old, "['RESPONSAVEL']")
missas.write_text(text, encoding="utf-8")
print(f"OK: apps/api/src/routes/missas.ts ({count} regras ajustadas)")

print()
print("Permissões do ministério aplicadas com sucesso.")
