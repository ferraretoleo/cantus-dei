from pathlib import Path

# email.ts
p=Path("apps/api/src/services/email.ts")
t=p.read_text(encoding="utf-8")

old="""    auth:{
      user:required('SMTP_USER'),
      pass:required('SMTP_PASS')
    }
"""
new="""    auth:{
      user:required('SMTP_USER'),
      pass:required('SMTP_PASS')
    },
    connectionTimeout:10000,
    greetingTimeout:10000,
    socketTimeout:15000
"""
if old not in t:
    raise SystemExit("email.ts: bloco auth não encontrado")
t=t.replace(old,new,1)
p.write_text(t,encoding="utf-8")

# missas.ts
p=Path("apps/api/src/routes/missas.ts")
t=p.read_text(encoding="utf-8")

start=t.find("      let emailsEnviados=0;")
end_marker="""      return {
        token,
        publicUrl,
        missa,
        emails:{
          enviados:emailsEnviados,
          ignorados:emailsIgnorados,
          falhas:emailsFalharam
        }
      };
"""
end=t.find(end_marker)

if start==-1 or end==-1:
    raise SystemExit("missas.ts: bloco V11 de e-mail não encontrado")

block=t[start:end]
if "if (emailConfigurado()) {" not in block:
    raise SystemExit("missas.ts: bloco de envio não encontrado")

# extrai o conteúdo interno do if principal
if_pos=block.find("      if (emailConfigurado()) {")
inner=block[if_pos+len("      if (emailConfigurado()) {"):]
inner=inner.rstrip()
if not inner.endswith("}"):
    raise SystemExit("missas.ts: fechamento do bloco de e-mail não reconhecido")
inner=inner[:-1].rstrip()

# remove declarações de contadores e referências
inner=inner.replace("      let emailsEnviados=0;\n","")
inner=inner.replace("      let emailsIgnorados=0;\n","")
inner=inner.replace("      let emailsFalharam=0;\n","")
inner=inner.replace("            emailsIgnorados++;\n","")
inner=inner.replace("            emailsEnviados++;\n","")
inner=inner.replace("            emailsFalharam++;\n","")

replacement="""      if (emailConfigurado()) {
        void (async () => {
          try {
""" + "\n".join("            "+line for line in inner.splitlines()) + """
          } catch (error) {
            app.log.error({
              error,
              missaId
            },'Falha no processamento assíncrono de e-mail de escala');
          }
        })();
      }

      return {
        token,
        publicUrl,
        missa,
        emailStatus:
          emailConfigurado()
            ? 'PROCESSANDO'
            : 'DESATIVADO'
      };
"""

t=t[:start]+replacement+t[end+len(end_marker):]
p.write_text(t,encoding="utf-8")

print("V11.1 aplicada com sucesso.")
