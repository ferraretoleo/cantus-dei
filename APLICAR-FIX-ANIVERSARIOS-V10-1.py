from pathlib import Path

def patch(path_str, old, new, label):
    p=Path(path_str)
    t=p.read_text(encoding="utf-8")
    if old not in t:
        raise SystemExit(f"Trecho não encontrado para {label}: {path_str}")
    p.write_text(t.replace(old,new,1),encoding="utf-8")
    print("OK:",label)

patch(
    "apps/web/src/pages/MasterAdmin.tsx",
    "setEdicaoUsuario({ nome:'',email:'',telefone:'',senha:'' });",
    "setEdicaoUsuario({ nome:'',email:'',telefone:'',dataNascimento:'',senha:'' });",
    "reset edicaoUsuario com dataNascimento"
)

patch(
    "apps/web/src/pages/ParoquiaAdmin.tsx",
    """      setNovo({
        nome:'',
        email:'',
        telefone:'',
        senha:'',
        papel:'MEMBRO'
      });""",
    """      setNovo({
        nome:'',
        email:'',
        telefone:'',
        dataNascimento:'',
        senha:'',
        papel:'MEMBRO'
      });""",
    "reset novo usuario com dataNascimento"
)

patch(
    "apps/web/src/pages/ParoquiaAdmin.tsx",
    "setEdicao({ nome:'',email:'',telefone:'',senha:'' });",
    "setEdicao({ nome:'',email:'',telefone:'',dataNascimento:'',senha:'' });",
    "reset edicao local com dataNascimento"
)

print("Fix V10.1 aplicado com sucesso.")
