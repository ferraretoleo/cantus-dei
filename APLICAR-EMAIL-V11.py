from pathlib import Path
import json, shutil

def require(text,needle,label):
    if needle not in text:
        raise SystemExit(f"Não encontrei {label}")
    return text

# Create services/routes from package files.
base=Path(__file__).resolve().parent
targets={
  "email.ts":"apps/api/src/services/email.ts",
  "psalms.ts":"apps/api/src/services/psalms.ts",
  "jobs.ts":"apps/api/src/routes/jobs.ts"
}
for src,dst in targets.items():
    d=Path(dst)
    d.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(base/src,d)

# package.json
p=Path("apps/api/package.json")
data=json.loads(p.read_text(encoding="utf-8"))
data.setdefault("dependencies",{})["nodemailer"]="^7.0.6"
data.setdefault("devDependencies",{})["@types/nodemailer"]="^7.0.1"
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

# schema.ts
p=Path("apps/api/src/db/schema.ts")
t=p.read_text(encoding="utf-8")
if "export const emailEnvios" not in t:
    t += """
export const emailEnvios = pgTable('email_envios', {
  id: uuid('id').defaultRandom().primaryKey(),
  chave: varchar('chave', { length: 255 }).notNull().unique(),
  tipo: varchar('tipo', { length: 40 }).notNull(),
  destinatario: varchar('destinatario', { length: 255 }).notNull(),
  enviadoEm: timestamp('enviado_em', { withTimezone: true }).defaultNow().notNull()
}, t => [
  index('email_envios_tipo_idx').on(t.tipo)
]);
"""
p.write_text(t,encoding="utf-8")

# server.ts
p=Path("apps/api/src/server.ts")
t=p.read_text(encoding="utf-8")
if "jobRoutes" not in t:
    t=t.replace(
        "import { parishBrandRoutes } from './routes/parish-brand.js';",
        "import { parishBrandRoutes } from './routes/parish-brand.js';\nimport { jobRoutes } from './routes/jobs.js';",
        1
    )
    t=t.replace(
        "await app.register(masterRoutes);",
        "await app.register(masterRoutes);\nawait app.register(jobRoutes);",
        1
    )
p.write_text(t,encoding="utf-8")

# missas.ts imports
p=Path("apps/api/src/routes/missas.ts")
t=p.read_text(encoding="utf-8")

if "emailEnvios," not in t:
    t=t.replace(
        "import {\n  missaEscala,",
        "import {\n  emailEnvios,\n  grupos,\n  missaEscala,",
        1
    )
    t=t.replace(
        "  musicas,\n  users",
        "  musicas,\n  paroquias,\n  users",
        1
    )

if "../services/email.js" not in t:
    anchor="} from '../db/schema.js';\n"
    require(t,anchor,"fim do import de schema em missas.ts")
    t=t.replace(
        anchor,
        anchor+"""
import {
  emailConfigurado,
  enviarEmail,
  escaparHtml,
  layoutEmail
} from '../services/email.js';
""",
        1
    )

# Replace escalaAtual query in publicar to also load recipient data.
old="""      const escalaAtual =
        await db
          .select({
            userId: missaEscala.userId
          })
          .from(missaEscala)
          .where(
            eq(
              missaEscala.missaId,
              missaId
            )
          );
"""
new="""      const escalaAtual =
        await db
          .select({
            userId: missaEscala.userId,
            nome: users.nome,
            email: users.email,
            instrumentoVoz: missaEscala.instrumentoVoz
          })
          .from(missaEscala)
          .innerJoin(
            users,
            eq(users.id,missaEscala.userId)
          )
          .where(
            eq(
              missaEscala.missaId,
              missaId
            )
          );
"""
if old in t:
    t=t.replace(old,new,1)
elif "nome: users.nome" not in t[t.find("const escalaAtual"):t.find("const pendencias")]:
    raise SystemExit("Não encontrei escalaAtual para alterar em missas.ts")

# Inject email send after public URL is known, before return.
return_anchor="""      return {
        token,
        publicUrl:
          `${base}/celebracao/${token}`,
        missa
      };
"""
if return_anchor in t and "EMAIL_ESCALA" not in t:
    replacement="""      const publicUrl=
        `${base}/celebracao/${token}`;

      let emailsEnviados=0;
      let emailsIgnorados=0;
      let emailsFalharam=0;

      if (emailConfigurado()) {
        const [grupoInfo]=await db
          .select({
            grupoNome:grupos.nome,
            paroquiaNome:paroquias.nome
          })
          .from(grupos)
          .innerJoin(
            paroquias,
            eq(paroquias.id,grupos.paroquiaId)
          )
          .where(eq(grupos.id,grupoId))
          .limit(1);

        const dt=new Intl.DateTimeFormat('pt-BR',{
          timeZone:'America/Sao_Paulo',
          dateStyle:'full',
          timeStyle:'short'
        }).format(missa.dataHora);

        for (const musico of escalaAtual) {
          const chave=
            `escala:missa:${missaId}:user:${musico.userId}`;

          const [jaFoi]=await db
            .select({ id:emailEnvios.id })
            .from(emailEnvios)
            .where(eq(emailEnvios.chave,chave))
            .limit(1);

          if (jaFoi) {
            emailsIgnorados++;
            continue;
          }

          const html=layoutEmail({
            titulo:'Você foi escalado para uma celebração',
            conteudo:`
              <p style="line-height:1.7;color:#d8d1c7">
                Olá, <strong>${escaparHtml(musico.nome)}</strong>.
                Você foi escalado para servir em uma celebração do Cantus Dei.
              </p>

              <div style="margin-top:20px;padding:18px;border:1px solid #2c2d31;border-radius:14px;background:#0f1012">
                <div><strong>Paróquia:</strong> ${escaparHtml(grupoInfo?.paroquiaNome || '')}</div>
                <div style="margin-top:8px"><strong>Ministério:</strong> ${escaparHtml(grupoInfo?.grupoNome || '')}</div>
                <div style="margin-top:8px"><strong>Celebração:</strong> ${escaparHtml(missa.tipoCelebracao)}</div>
                <div style="margin-top:8px"><strong>Data:</strong> ${escaparHtml(dt)}</div>
                <div style="margin-top:8px"><strong>Local:</strong> ${escaparHtml(missa.local)}</div>
                ${musico.instrumentoVoz
                  ? `<div style="margin-top:8px"><strong>Serviço:</strong> ${escaparHtml(musico.instrumentoVoz)}</div>`
                  : ''}
              </div>

              <div style="margin-top:24px">
                <a href="${publicUrl}"
                   style="display:inline-block;background:#d5ae62;color:#111;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:700">
                  Abrir celebração publicada
                </a>
              </div>
            `
          });

          const texto=
            `Cantus Dei\\n\\nOlá, ${musico.nome}.\\n`+
            `Você foi escalado para ${missa.tipoCelebracao}.\\n`+
            `${dt}\\n${missa.local}\\n\\n`+
            `Acesse: ${publicUrl}`;

          try {
            await enviarEmail({
              para:musico.email,
              assunto:`Cantus Dei · Você foi escalado · ${missa.tipoCelebracao}`,
              html,
              texto
            });

            await db
              .insert(emailEnvios)
              .values({
                chave,
                tipo:'EMAIL_ESCALA',
                destinatario:musico.email
              })
              .onConflictDoNothing({
                target:emailEnvios.chave
              });

            emailsEnviados++;
          } catch (error) {
            emailsFalharam++;
            app.log.error({
              error,
              missaId,
              userId:musico.userId
            },'Falha ao enviar e-mail de escala');
          }
        }
      }

      return {
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
    t=t.replace(return_anchor,replacement,1)
elif "EMAIL_ESCALA" not in t:
    raise SystemExit("Não encontrei retorno da publicação em missas.ts")

p.write_text(t,encoding="utf-8")
print("V11 aplicada.")
