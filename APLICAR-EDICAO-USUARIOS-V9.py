from pathlib import Path

def patch(path_str, old, new, label):
    path = Path(path_str)
    text = path.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Não foi possível aplicar {label} em {path_str}.")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"OK: {label}")

# =========================
# API MASTER
# =========================
path = Path("apps/api/src/routes/master.ts")
text = path.read_text(encoding="utf-8")

if "import argon2 from 'argon2';" not in text:
    text = text.replace(
        "import { and, asc, eq } from 'drizzle-orm';",
        "import { and, asc, eq } from 'drizzle-orm';\nimport argon2 from 'argon2';",
        1
    )

if "const usuarioUpdateSchema" not in text:
    anchor = """const perfilSchema = z.object({
  perfilGlobal: z.enum(['USUARIO', 'MASTER'])
});
"""
    extra = """
const usuarioUpdateSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(255),
  telefone: z.string().max(30).optional().nullable(),
  senha: z.string().min(8).max(128).optional()
});
"""
    if anchor not in text:
        raise SystemExit("master.ts: perfilSchema não encontrado.")
    text = text.replace(anchor, anchor + extra, 1)

if "'/master/usuarios/:userId'," not in text:
    anchor = """  app.put(
    '/master/usuarios/:userId/perfil',
"""
    route = """  app.put(
    '/master/usuarios/:userId',
    { preHandler: requireMaster },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };

      const parsed = usuarioUpdateSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados do usuário inválidos.'
        });
      }

      const email = parsed.data.email.trim().toLowerCase();

      const [atual] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!atual) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Usuário não encontrado.'
        });
      }

      const [emailExistente] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (emailExistente && emailExistente.id !== userId) {
        return reply.code(409).send({
          error: 'EMAIL_IN_USE',
          message: 'Este e-mail já está cadastrado para outro usuário.'
        });
      }

      const alteracoes: {
        nome: string;
        email: string;
        telefone: string | null;
        updatedAt: Date;
        senhaHash?: string;
      } = {
        nome: parsed.data.nome.trim(),
        email,
        telefone: parsed.data.telefone?.trim() || null,
        updatedAt: new Date()
      };

      if (parsed.data.senha) {
        alteracoes.senhaHash = await argon2.hash(parsed.data.senha);
      }

      const [usuario] = await db
        .update(users)
        .set(alteracoes)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          nome: users.nome,
          email: users.email,
          telefone: users.telefone,
          perfilGlobal: users.perfilGlobal,
          ativo: users.ativo
        });

      return usuario;
    }
  );

"""
    if anchor not in text:
        raise SystemExit("master.ts: rota de perfil não encontrada.")
    text = text.replace(anchor, route + anchor, 1)

path.write_text(text, encoding="utf-8")
print("OK: master.ts")

# =========================
# API PAROQUIAS
# =========================
path = Path("apps/api/src/routes/paroquias.ts")
text = path.read_text(encoding="utf-8")

if "const usuarioUpdateSchema" not in text:
    anchor = """const membroGrupoSchema = z.object({
  userId: z.string().uuid(),
  papel: z.enum(['RESPONSAVEL', 'COORDENADOR', 'MUSICO']).default('MUSICO'),
  instrumento: z.string().max(80).optional().nullable(),
  voz: z.string().max(30).optional().nullable()
});
"""
    extra = """
const usuarioUpdateSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email().max(255),
  telefone: z.string().max(30).optional().nullable(),
  senha: z.string().min(8).max(128).optional()
});
"""
    if anchor not in text:
        raise SystemExit("paroquias.ts: membroGrupoSchema não encontrado.")
    text = text.replace(anchor, anchor + extra, 1)

segment_start = text.find("'/paroquias/:id/membros'")
segment_end = text.find("'/paroquias/:id/usuarios'")
segment = text[segment_start:segment_end]

if "perfilGlobal: users.perfilGlobal" not in segment:
    old = """          telefone: users.telefone,
          papel: paroquiaMembros.papel,
"""
    new = """          telefone: users.telefone,
          perfilGlobal: users.perfilGlobal,
          papel: paroquiaMembros.papel,
"""
    if old not in text:
        raise SystemExit("paroquias.ts: select de membros não encontrado.")
    text = text.replace(old, new, 1)

if "'/paroquias/:id/usuarios/:userId'" not in text:
    anchor = """  app.get(
    '/paroquias/:id/grupos',
"""
    route = """  app.put(
    '/paroquias/:id/usuarios/:userId',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id: paroquiaId, userId } = request.params as {
        id: string;
        userId: string;
      };

      if (!(await podeAdministrarParoquia(request, reply, paroquiaId))) {
        return;
      }

      const parsed = usuarioUpdateSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.code(400).send({
          error: 'VALIDATION_ERROR',
          message: 'Dados do usuário inválidos.'
        });
      }

      const [solicitante] = await db
        .select({ perfilGlobal: users.perfilGlobal })
        .from(users)
        .where(eq(users.id, request.user.sub))
        .limit(1);

      const [vinculo] = await db
        .select({
          userId: paroquiaMembros.userId,
          perfilGlobal: users.perfilGlobal
        })
        .from(paroquiaMembros)
        .innerJoin(users, eq(users.id, paroquiaMembros.userId))
        .where(
          and(
            eq(paroquiaMembros.paroquiaId, paroquiaId),
            eq(paroquiaMembros.userId, userId),
            eq(paroquiaMembros.ativo, true)
          )
        )
        .limit(1);

      if (!vinculo) {
        return reply.code(404).send({
          error: 'NOT_FOUND',
          message: 'Usuário não está vinculado a esta paróquia.'
        });
      }

      if (
        vinculo.perfilGlobal === 'MASTER' &&
        solicitante?.perfilGlobal !== 'MASTER'
      ) {
        return reply.code(403).send({
          error: 'FORBIDDEN',
          message: 'Administrador local não pode alterar um usuário MASTER.'
        });
      }

      const email = parsed.data.email.trim().toLowerCase();

      const [emailExistente] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (emailExistente && emailExistente.id !== userId) {
        return reply.code(409).send({
          error: 'EMAIL_IN_USE',
          message: 'Este e-mail já está cadastrado para outro usuário.'
        });
      }

      const alteracoes: {
        nome: string;
        email: string;
        telefone: string | null;
        updatedAt: Date;
        senhaHash?: string;
      } = {
        nome: parsed.data.nome.trim(),
        email,
        telefone: parsed.data.telefone?.trim() || null,
        updatedAt: new Date()
      };

      if (parsed.data.senha) {
        alteracoes.senhaHash = await argon2.hash(parsed.data.senha);
      }

      const [usuario] = await db
        .update(users)
        .set(alteracoes)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          nome: users.nome,
          email: users.email,
          telefone: users.telefone,
          perfilGlobal: users.perfilGlobal
        });

      return usuario;
    }
  );

"""
    if anchor not in text:
        raise SystemExit("paroquias.ts: ponto de inserção não encontrado.")
    text = text.replace(anchor, route + anchor, 1)

path.write_text(text, encoding="utf-8")
print("OK: paroquias.ts")

# =========================
# PAROQUIA ADMIN UI
# =========================
path = Path("apps/web/src/pages/ParoquiaAdmin.tsx")
text = path.read_text(encoding="utf-8")

if "perfilGlobal?:'USUARIO'|'MASTER';" not in text:
    old = """  telefone?:string|null;
  papel:'ADMIN_PAROQUIA'|'MEMBRO';
"""
    new = """  telefone?:string|null;
  perfilGlobal?:'USUARIO'|'MASTER';
  papel:'ADMIN_PAROQUIA'|'MEMBRO';
"""
    if old not in text:
        raise SystemExit("ParoquiaAdmin: tipo Membro não encontrado.")
    text = text.replace(old, new, 1)

if "const [editando,setEditando]" not in text:
    old = """  const [mensagem,setMensagem]=useState('');

  const [novo,setNovo]=useState({
"""
    new = """  const [mensagem,setMensagem]=useState('');

  const [editando,setEditando]=useState<Membro|null>(null);
  const [edicao,setEdicao]=useState({
    nome:'',
    email:'',
    telefone:'',
    senha:''
  });
  const [salvandoEdicao,setSalvandoEdicao]=useState(false);

  const [novo,setNovo]=useState({
"""
    if old not in text:
        raise SystemExit("ParoquiaAdmin: estados não encontrados.")
    text = text.replace(old, new, 1)

if "function abrirEdicao(membro:Membro)" not in text:
    anchor = """  async function associarMeuUsuario() {
"""
    funcs = """  function abrirEdicao(membro:Membro) {
    setEditando(membro);
    setEdicao({
      nome:membro.nome,
      email:membro.email,
      telefone:membro.telefone || '',
      senha:''
    });
    setErro('');
    setMensagem('');
  }

  async function salvarEdicaoUsuario(e:FormEvent) {
    e.preventDefault();
    if (!editando) return;

    setSalvandoEdicao(true);
    setErro('');
    setMensagem('');

    try {
      await api(
        `/paroquias/${paroquiaAtual.id}/usuarios/${editando.userId}`,
        {
          method:'PUT',
          body:JSON.stringify({
            nome:edicao.nome,
            email:edicao.email,
            telefone:edicao.telefone || null,
            senha:edicao.senha || undefined
          })
        }
      );

      setMensagem(`Dados de ${edicao.nome} atualizados.`);
      setEditando(null);
      setEdicao({ nome:'',email:'',telefone:'',senha:'' });
      await carregarBase();
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao atualizar usuário.'
      );
    } finally {
      setSalvandoEdicao(false);
    }
  }

"""
    if anchor not in text:
        raise SystemExit("ParoquiaAdmin: função associarMeuUsuario não encontrada.")
    text = text.replace(anchor, funcs + anchor, 1)

if "onClick={()=>abrirEdicao(m)}" not in text:
    old = """                  <div className="mt-3">
                    <span className="cantus-badge">
                      {m.papel}
                    </span>
                  </div>
"""
    new = """                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex gap-2 flex-wrap">
                      <span className="cantus-badge">
                        {m.papel}
                      </span>

                      {m.perfilGlobal==='MASTER' && (
                        <span className="cantus-badge">
                          MASTER GLOBAL
                        </span>
                      )}
                    </div>

                    {(user?.perfilGlobal==='MASTER' ||
                      m.perfilGlobal!=='MASTER') && (
                      <button
                        type="button"
                        onClick={()=>abrirEdicao(m)}
                        className="cantus-secondary px-3 py-2 text-xs"
                      >
                        Editar dados
                      </button>
                    )}
                  </div>
"""
    if old not in text:
        raise SystemExit("ParoquiaAdmin: card de membro não encontrado.")
    text = text.replace(old, new, 1)

if "{editando && (" not in text:
    anchor = """      </section>
    </main>
  );
}
"""
    modal = """      </section>

      {editando && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm p-4 grid place-items-center">
          <form
            onSubmit={salvarEdicaoUsuario}
            className="cantus-card w-full max-w-xl p-6 sm:p-8 max-h-[90vh] overflow-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="cantus-eyebrow">
                  Editar usuário
                </div>
                <h2 className="cantus-display mt-2 text-3xl">
                  Dados de acesso
                </h2>
              </div>

              <button
                type="button"
                onClick={()=>setEditando(null)}
                className="cantus-secondary px-3 py-2 text-sm"
              >
                Fechar
              </button>
            </div>

            <p className="mt-3 text-sm cantus-muted">
              Você pode corrigir nome, e-mail, telefone e, quando necessário, redefinir a senha.
            </p>

            <label className="block mt-6">
              <span className="text-sm font-semibold">Nome</span>
              <input
                required
                value={edicao.nome}
                onChange={e=>setEdicao({ ...edicao,nome:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">E-mail</span>
              <input
                required
                type="email"
                value={edicao.email}
                onChange={e=>setEdicao({ ...edicao,email:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">Telefone</span>
              <input
                value={edicao.telefone}
                onChange={e=>setEdicao({ ...edicao,telefone:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">Nova senha</span>
              <input
                type="password"
                minLength={8}
                value={edicao.senha}
                onChange={e=>setEdicao({ ...edicao,senha:e.target.value })}
                className="cantus-input mt-2"
                placeholder="Deixe vazio para manter a senha atual"
              />
              <div className="mt-2 text-xs cantus-muted">
                Mínimo de 8 caracteres quando preenchida.
              </div>
            </label>

            <button
              disabled={salvandoEdicao}
              className="cantus-primary mt-6 w-full px-6 py-3 disabled:opacity-50"
            >
              {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
"""
    if anchor not in text:
        raise SystemExit("ParoquiaAdmin: final do componente não encontrado.")
    text = text.replace(anchor, modal, 1)

path.write_text(text, encoding="utf-8")
print("OK: ParoquiaAdmin.tsx")

# =========================
# MASTER ADMIN UI
# =========================
path = Path("apps/web/src/pages/MasterAdmin.tsx")
text = path.read_text(encoding="utf-8")

if "const [editandoUsuario,setEditandoUsuario]" not in text:
    old = """  const [logoNova,setLogoNova]=useState('');
"""
    new = """  const [editandoUsuario,setEditandoUsuario]=useState<Usuario|null>(null);
  const [edicaoUsuario,setEdicaoUsuario]=useState({
    nome:'',
    email:'',
    telefone:'',
    senha:''
  });
  const [salvandoUsuario,setSalvandoUsuario]=useState(false);

  const [logoNova,setLogoNova]=useState('');
"""
    if old not in text:
        raise SystemExit("MasterAdmin: ponto de estados não encontrado.")
    text = text.replace(old, new, 1)

if "function abrirEdicaoUsuario(usuario:Usuario)" not in text:
    anchor = """  async function alterarPerfilGlobal(
"""
    funcs = """  function abrirEdicaoUsuario(usuario:Usuario) {
    setEditandoUsuario(usuario);
    setEdicaoUsuario({
      nome:usuario.nome,
      email:usuario.email,
      telefone:usuario.telefone || '',
      senha:''
    });
    setErro('');
    setMensagem('');
  }

  async function salvarUsuario(e:FormEvent) {
    e.preventDefault();
    if (!editandoUsuario) return;

    setSalvandoUsuario(true);
    setErro('');
    setMensagem('');

    try {
      await api(
        `/master/usuarios/${editandoUsuario.id}`,
        {
          method:'PUT',
          body:JSON.stringify({
            nome:edicaoUsuario.nome,
            email:edicaoUsuario.email,
            telefone:edicaoUsuario.telefone || null,
            senha:edicaoUsuario.senha || undefined
          })
        }
      );

      setMensagem(`Dados de ${edicaoUsuario.nome} atualizados.`);
      setEditandoUsuario(null);
      setEdicaoUsuario({ nome:'',email:'',telefone:'',senha:'' });
      await carregarBase();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar usuário.'
      );
    } finally {
      setSalvandoUsuario(false);
    }
  }

"""
    if anchor not in text:
        raise SystemExit("MasterAdmin: alterarPerfilGlobal não encontrado.")
    text = text.replace(anchor, funcs + anchor, 1)

if "onClick={()=>abrirEdicaoUsuario(u)}" not in text:
    old = """                      <div className="flex justify-end gap-2 flex-wrap">
                        {u.id!==user?.id && (
"""
    new = """                      <div className="flex justify-end gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={()=>abrirEdicaoUsuario(u)}
                          className="cantus-secondary px-3 py-2 text-xs"
                        >
                          Editar dados
                        </button>

                        {u.id!==user?.id && (
"""
    if old not in text:
        raise SystemExit("MasterAdmin: ações de usuário não encontradas.")
    text = text.replace(old, new, 1)

if "{editandoUsuario && (" not in text:
    anchor = """      </section>
    </main>
  );
}
"""
    modal = """      </section>

      {editandoUsuario && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm p-4 grid place-items-center">
          <form
            onSubmit={salvarUsuario}
            className="cantus-card w-full max-w-xl p-6 sm:p-8 max-h-[90vh] overflow-auto"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="cantus-eyebrow">
                  Administração global
                </div>
                <h2 className="cantus-display mt-2 text-3xl">
                  Editar usuário
                </h2>
              </div>

              <button
                type="button"
                onClick={()=>setEditandoUsuario(null)}
                className="cantus-secondary px-3 py-2 text-sm"
              >
                Fechar
              </button>
            </div>

            <p className="mt-3 text-sm cantus-muted">
              O MASTER GLOBAL pode corrigir nome, e-mail, telefone e redefinir a senha de qualquer usuário.
            </p>

            <label className="block mt-6">
              <span className="text-sm font-semibold">Nome</span>
              <input
                required
                value={edicaoUsuario.nome}
                onChange={e=>setEdicaoUsuario({ ...edicaoUsuario,nome:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">E-mail</span>
              <input
                required
                type="email"
                value={edicaoUsuario.email}
                onChange={e=>setEdicaoUsuario({ ...edicaoUsuario,email:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">Telefone</span>
              <input
                value={edicaoUsuario.telefone}
                onChange={e=>setEdicaoUsuario({ ...edicaoUsuario,telefone:e.target.value })}
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-4">
              <span className="text-sm font-semibold">Nova senha</span>
              <input
                type="password"
                minLength={8}
                value={edicaoUsuario.senha}
                onChange={e=>setEdicaoUsuario({ ...edicaoUsuario,senha:e.target.value })}
                className="cantus-input mt-2"
                placeholder="Deixe vazio para manter a senha atual"
              />
              <div className="mt-2 text-xs cantus-muted">
                A senha só será alterada se este campo for preenchido.
              </div>
            </label>

            <button
              disabled={salvandoUsuario}
              className="cantus-primary mt-6 w-full px-6 py-3 disabled:opacity-50"
            >
              {salvandoUsuario ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
"""
    if anchor not in text:
        raise SystemExit("MasterAdmin: final do componente não encontrado.")
    text = text.replace(anchor, modal, 1)

path.write_text(text, encoding="utf-8")
print("OK: MasterAdmin.tsx")
print("V9 aplicada com sucesso.")
