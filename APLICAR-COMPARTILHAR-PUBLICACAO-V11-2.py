from pathlib import Path

# ============================================================
# API: envio manual de link publicado por e-mail
# ============================================================
p=Path("apps/api/src/routes/missas.ts")
t=p.read_text(encoding="utf-8")

if "import { z } from 'zod';" not in t:
    t=t.replace(
        "import { and, asc, eq, isNull } from 'drizzle-orm';",
        "import { and, asc, eq, isNull } from 'drizzle-orm';\nimport { z } from 'zod';",
        1
    )

if "const envioPublicacaoSchema" not in t:
    anchor="export async function missaRoutes(app: FastifyInstance) {\n"
    schema="""const envioPublicacaoSchema = z.object({
  email:z.string().email().max(255)
});

"""
    if anchor not in t:
        raise SystemExit("missas.ts: início das rotas não encontrado.")
    t=t.replace(anchor,schema+anchor,1)

if "'/grupos/:id/missas/:missaId/enviar-email'" not in t:
    anchor="""  app.post(
    '/grupos/:id/missas/:missaId/confirmar',
"""
    route=r"""  app.post(
    '/grupos/:id/missas/:missaId/enviar-email',
    {
      preHandler:(req,rep)=>
        app.requireGroupAccess(
          req,
          rep,
          ['RESPONSAVEL']
        )
    },
    async (request,reply)=>{
      if (!emailConfigurado()) {
        return reply.code(503).send({
          error:'SMTP_NOT_CONFIGURED',
          message:'O envio de e-mail não está configurado.'
        });
      }

      const {
        id:grupoId,
        missaId
      }=request.params as {
        id:string;
        missaId:string;
      };

      const parsed=
        envioPublicacaoSchema.safeParse(
          request.body
        );

      if (!parsed.success) {
        return reply.code(400).send({
          error:'VALIDATION_ERROR',
          message:'Informe um e-mail válido.'
        });
      }

      const [missa]=await db
        .select({
          id:missas.id,
          dataHora:missas.dataHora,
          local:missas.local,
          tipoCelebracao:missas.tipoCelebracao,
          status:missas.status,
          tokenPublico:missas.tokenPublico,
          grupoNome:grupos.nome,
          paroquiaNome:paroquias.nome
        })
        .from(missas)
        .innerJoin(
          grupos,
          eq(grupos.id,missas.grupoId)
        )
        .innerJoin(
          paroquias,
          eq(paroquias.id,grupos.paroquiaId)
        )
        .where(
          and(
            eq(missas.id,missaId),
            eq(missas.grupoId,grupoId),
            isNull(missas.deletedAt)
          )
        )
        .limit(1);

      if (!missa) {
        return reply.code(404).send({
          error:'NOT_FOUND',
          message:'Celebração não encontrada.'
        });
      }

      if (
        missa.status!=='PUBLICADA' ||
        !missa.tokenPublico
      ) {
        return reply.code(400).send({
          error:'NOT_PUBLISHED',
          message:'A celebração precisa estar publicada antes do envio.'
        });
      }

      const base=
        process.env.PUBLIC_BASE_URL ||
        'http://localhost:5173';

      const publicUrl=
        `${base}/celebracao/${missa.tokenPublico}`;

      const dataFormatada=
        new Intl.DateTimeFormat('pt-BR',{
          timeZone:'America/Sao_Paulo',
          dateStyle:'full',
          timeStyle:'short'
        }).format(missa.dataHora);

      const html=layoutEmail({
        titulo:'Celebração publicada',
        conteudo:`
          <p style="line-height:1.7;color:#d8d1c7">
            Uma celebração do Cantus Dei foi compartilhada com você.
          </p>

          <div style="margin-top:20px;padding:18px;border:1px solid #2c2d31;border-radius:14px;background:#0f1012">
            <div><strong>Paróquia:</strong> ${escaparHtml(missa.paroquiaNome)}</div>
            <div style="margin-top:8px"><strong>Ministério:</strong> ${escaparHtml(missa.grupoNome)}</div>
            <div style="margin-top:8px"><strong>Celebração:</strong> ${escaparHtml(missa.tipoCelebracao)}</div>
            <div style="margin-top:8px"><strong>Data:</strong> ${escaparHtml(dataFormatada)}</div>
            <div style="margin-top:8px"><strong>Local:</strong> ${escaparHtml(missa.local)}</div>
          </div>

          <div style="margin-top:24px">
            <a href="${publicUrl}"
               style="display:inline-block;background:#d5ae62;color:#111;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:700">
              Abrir celebração
            </a>
          </div>
        `
      });

      const texto=
        `Cantus Dei\n\n`+
        `${missa.tipoCelebracao}\n`+
        `${missa.paroquiaNome} · ${missa.grupoNome}\n`+
        `${dataFormatada}\n${missa.local}\n\n`+
        `Acesse: ${publicUrl}`;

      try {
        await enviarEmail({
          para:parsed.data.email,
          assunto:`Cantus Dei · ${missa.tipoCelebracao}`,
          html,
          texto
        });

        return {
          ok:true,
          email:parsed.data.email
        };
      } catch (error) {
        app.log.error({
          error,
          missaId,
          email:parsed.data.email
        },'Falha no envio manual da publicação');

        return reply.code(502).send({
          error:'EMAIL_SEND_FAILED',
          message:'Não foi possível enviar o e-mail. Verifique o SMTP no Render.'
        });
      }
    }
  );

"""
    if anchor not in t:
        raise SystemExit("missas.ts: rota confirmar não encontrada.")
    t=t.replace(anchor,route+anchor,1)

p.write_text(t,encoding="utf-8")
print("OK: API de envio manual adicionada.")


# ============================================================
# FRONTEND: painel da publicação na celebração já publicada
# ============================================================
p=Path("apps/web/src/pages/MissaEditor.tsx")
t=p.read_text(encoding="utf-8")

if "const [publicacao,setPublicacao]" not in t:
    anchor="""  const [publicando,setPublicando]=useState(false);

  const [novoMomento,setNovoMomento]=useState('');
"""
    states="""  const [publicando,setPublicando]=useState(false);
  const [publicacao,setPublicacao]=useState<{
    status:string;
    publicUrl:string;
  }|null>(null);
  const [emailCompartilhar,setEmailCompartilhar]=useState('');
  const [enviandoCompartilhamento,setEnviandoCompartilhamento]=useState(false);
  const [mensagemCompartilhamento,setMensagemCompartilhamento]=useState('');

  const [novoMomento,setNovoMomento]=useState('');
"""
    if anchor not in t:
        raise SystemExit("MissaEditor.tsx: estados principais não encontrados.")
    t=t.replace(anchor,states,1)

if "setPublicacao(" not in t:
    anchor="""          const missa=data.missa;

          setForm({
"""
    inject="""          const missa=data.missa;

          if (
            missa.status==='PUBLICADA' &&
            missa.tokenPublico
          ) {
            const base=
              window.location.origin;

            setPublicacao({
              status:missa.status,
              publicUrl:
                `${base}/celebracao/${missa.tokenPublico}`
            });
          } else {
            setPublicacao(null);
          }

          setForm({
"""
    if anchor not in t:
        raise SystemExit("MissaEditor.tsx: carregamento da missa não encontrado.")
    t=t.replace(anchor,inject,1)

if "async function copiarLinkPublicacao()" not in t:
    anchor="""  async function cadastrarNovoMomento(
"""
    funcs=r"""  async function copiarLinkPublicacao() {
    if (!publicacao?.publicUrl) return;

    try {
      await navigator.clipboard.writeText(
        publicacao.publicUrl
      );
      setMensagemCompartilhamento(
        'Link copiado.'
      );
    } catch {
      setMensagemCompartilhamento(
        'Não foi possível copiar o link.'
      );
    }
  }

  async function compartilharPublicacao() {
    if (!publicacao?.publicUrl) return;

    const texto=
      `${form.tipoCelebracao} · ${form.local}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title:'Cantus Dei',
          text:texto,
          url:publicacao.publicUrl
        });
        return;
      } catch {}
    }

    await copiarLinkPublicacao();
  }

  async function enviarPublicacaoEmail(
    e:FormEvent
  ) {
    e.preventDefault();

    if (
      !missaId ||
      nova ||
      !emailCompartilhar.trim()
    ) {
      return;
    }

    setEnviandoCompartilhamento(true);
    setMensagemCompartilhamento('');
    setErro('');

    try {
      await api(
        `/grupos/${grupoId}/missas/${missaId}/enviar-email`,
        {
          method:'POST',
          body:JSON.stringify({
            email:
              emailCompartilhar.trim()
          })
        }
      );

      setMensagemCompartilhamento(
        `E-mail enviado para ${emailCompartilhar.trim()}.`
      );
      setEmailCompartilhar('');
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao enviar a publicação por e-mail.'
      );
    } finally {
      setEnviandoCompartilhamento(false);
    }
  }

"""
    if anchor not in t:
        raise SystemExit("MissaEditor.tsx: cadastrarNovoMomento não encontrado.")
    t=t.replace(anchor,funcs+anchor,1)

# update publication state after successful publish
if "setPublicacao({" not in t[t.find("async function publicarTudo"):t.find("async function cadastrarNovoMomento")]:
    anchor="""      localStorage.setItem(
        'cantus_ultima_publicacao',
"""
    inject="""      setPublicacao({
        status:'PUBLICADA',
        publicUrl:data.publicUrl
      });

      localStorage.setItem(
        'cantus_ultima_publicacao',
"""
    if anchor not in t:
        raise SystemExit("MissaEditor.tsx: localStorage publicação não encontrado.")
    t=t.replace(anchor,inject,1)

# insert publication card before finalization section if present
if "Compartilhar publicação" not in t:
    anchor="""            <section className="cantus-card mt-6 p-6 sm:p-8">
              <div className="cantus-eyebrow">
                Finalização
"""
    card=r"""            {publicacao && (
              <section className="cantus-card mt-6 p-6 sm:p-8">
                <div className="cantus-eyebrow">
                  Celebração publicada
                </div>

                <h2 className="cantus-display mt-3 text-3xl">
                  Compartilhar publicação
                </h2>

                <p className="mt-2 text-sm cantus-muted">
                  Use o link público para compartilhar esta celebração.
                </p>

                <div className="mt-5 rounded-2xl border border-[#d5ae62]/20 bg-[#d5ae62]/[.05] p-4">
                  <div className="text-xs cantus-muted">
                    Link público
                  </div>

                  <div className="mt-2 break-all text-sm cantus-gold">
                    {publicacao.publicUrl}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={publicacao.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cantus-primary px-4 py-2.5 text-sm"
                  >
                    Abrir publicação
                  </a>

                  <button
                    type="button"
                    onClick={copiarLinkPublicacao}
                    className="cantus-secondary px-4 py-2.5 text-sm"
                  >
                    Copiar link
                  </button>

                  <button
                    type="button"
                    onClick={compartilharPublicacao}
                    className="cantus-secondary px-4 py-2.5 text-sm"
                  >
                    Compartilhar
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `${form.tipoCelebracao}\n${publicacao.publicUrl}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="cantus-secondary px-4 py-2.5 text-sm"
                  >
                    WhatsApp
                  </a>
                </div>

                <form
                  onSubmit={enviarPublicacaoEmail}
                  className="mt-6 border-t border-white/10 pt-5"
                >
                  <div className="cantus-eyebrow">
                    Enviar por e-mail
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-3">
                    <input
                      required
                      type="email"
                      value={emailCompartilhar}
                      onChange={e=>
                        setEmailCompartilhar(
                          e.target.value
                        )
                      }
                      placeholder="destinatario@email.com"
                      className="cantus-input flex-1"
                    />

                    <button
                      disabled={enviandoCompartilhamento}
                      className="cantus-primary px-5 py-3 disabled:opacity-50"
                    >
                      {enviandoCompartilhamento
                        ? 'Enviando...'
                        : 'Enviar por e-mail'}
                    </button>
                  </div>
                </form>

                {mensagemCompartilhamento && (
                  <div className="mt-4 text-sm cantus-gold">
                    {mensagemCompartilhamento}
                  </div>
                )}
              </section>
            )}

"""
    if anchor not in t:
        raise SystemExit("MissaEditor.tsx: seção Finalização não encontrada.")
    t=t.replace(anchor,card+anchor,1)

p.write_text(t,encoding="utf-8")
print("OK: painel de compartilhamento adicionado.")
print("V11.2 aplicada com sucesso.")
