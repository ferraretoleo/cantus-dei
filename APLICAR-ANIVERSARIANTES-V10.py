from pathlib import Path


def save(path, text):
    Path(path).write_text(text, encoding='utf-8')

# ---------- schema ----------
p=Path('apps/api/src/db/schema.ts'); t=p.read_text(encoding='utf-8')
if 'boolean, date, index' not in t:
    t=t.replace('boolean, index, integer','boolean, date, index, integer',1)
if "dataNascimento: date('data_nascimento')" not in t:
    t=t.replace("  telefone: varchar('telefone', { length: 30 }),\n", "  telefone: varchar('telefone', { length: 30 }),\n  dataNascimento: date('data_nascimento'),\n",1)
save(p,t)

# ---------- paroquias API ----------
p=Path('apps/api/src/routes/paroquias.ts'); t=p.read_text(encoding='utf-8')
# novo usuário schema
needle="  telefone: z.string().max(30).optional().nullable(),\n  senha: z.string().min(8).max(128).optional(),\n"
if 'dataNascimento: z.string().regex' not in t and needle in t:
    t=t.replace(needle,"  telefone: z.string().max(30).optional().nullable(),\n  dataNascimento: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional().nullable(),\n  senha: z.string().min(8).max(128).optional(),\n",1)
# update schema V9
idx=t.find('const usuarioUpdateSchema')
if idx>=0:
    end=t.find('});',idx); block=t[idx:end]
    if 'dataNascimento' not in block:
        block=block.replace("  telefone: z.string().max(30).optional().nullable(),\n","  telefone: z.string().max(30).optional().nullable(),\n  dataNascimento: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional().nullable(),\n",1)
        t=t[:idx]+block+t[end:]
# members list
r1=t.find("'/paroquias/:id/membros'"); r2=t.find("'/paroquias/:id/usuarios'")
if r1>=0 and r2>r1:
    seg=t[r1:r2]
    if 'dataNascimento: users.dataNascimento' not in seg:
        seg=seg.replace('          telefone: users.telefone,\n','          telefone: users.telefone,\n          dataNascimento: users.dataNascimento,\n',1)
        t=t[:r1]+seg+t[r2:]
# create user
if 'dataNascimento: parsed.data.dataNascimento || null' not in t:
    t=t.replace('            telefone: parsed.data.telefone || null,\n            senhaHash,\n','            telefone: parsed.data.telefone || null,\n            dataNascimento: parsed.data.dataNascimento || null,\n            senhaHash,\n',1)
# V9 update route
r=t.find("'/paroquias/:id/usuarios/:userId'")
if r>=0:
    s=t[r:]
    if 'dataNascimento: string | null;' not in s:
        s=s.replace('        telefone: string | null;\n        updatedAt: Date;\n','        telefone: string | null;\n        dataNascimento: string | null;\n        updatedAt: Date;\n',1)
        s=s.replace('        telefone: parsed.data.telefone?.trim() || null,\n        updatedAt: new Date()\n','        telefone: parsed.data.telefone?.trim() || null,\n        dataNascimento: parsed.data.dataNascimento || null,\n        updatedAt: new Date()\n',1)
    t=t[:r]+s
save(p,t)

# ---------- master API ----------
p=Path('apps/api/src/routes/master.ts'); t=p.read_text(encoding='utf-8')
if 'dataNascimento: users.dataNascimento' not in t:
    t=t.replace('          telefone: users.telefone,\n          perfilGlobal: users.perfilGlobal,\n','          telefone: users.telefone,\n          dataNascimento: users.dataNascimento,\n          perfilGlobal: users.perfilGlobal,\n',1)
idx=t.find('const usuarioUpdateSchema')
if idx>=0:
    end=t.find('});',idx); block=t[idx:end]
    if 'dataNascimento' not in block:
        block=block.replace("  telefone: z.string().max(30).optional().nullable(),\n","  telefone: z.string().max(30).optional().nullable(),\n  dataNascimento: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/).optional().nullable(),\n",1)
        t=t[:idx]+block+t[end:]
r=t.find("'/master/usuarios/:userId'")
if r>=0:
    s=t[r:]
    if 'dataNascimento: string | null;' not in s:
        s=s.replace('        telefone: string | null;\n        updatedAt: Date;\n','        telefone: string | null;\n        dataNascimento: string | null;\n        updatedAt: Date;\n',1)
        s=s.replace('        telefone: parsed.data.telefone?.trim() || null,\n        updatedAt: new Date()\n','        telefone: parsed.data.telefone?.trim() || null,\n        dataNascimento: parsed.data.dataNascimento || null,\n        updatedAt: new Date()\n',1)
    t=t[:r]+s
save(p,t)

# ---------- dashboard API ----------
p=Path('apps/api/src/routes/dashboard.ts'); t=p.read_text(encoding='utf-8')
if "'/me/aniversariantes'" not in t:
    route='''\n  app.get('/me/aniversariantes', { preHandler: app.authenticate }, async (request, reply) => {\n    const { paroquiaId } = request.query as { paroquiaId?: string };\n    if (!paroquiaId) return [];\n\n    const [usuario] = await db.select({ perfilGlobal: users.perfilGlobal })\n      .from(users).where(eq(users.id, request.user.sub)).limit(1);\n\n    if (usuario?.perfilGlobal !== 'MASTER') {\n      const [vinculo] = await db.select({ userId: paroquiaMembros.userId })\n        .from(paroquiaMembros)\n        .where(and(eq(paroquiaMembros.paroquiaId, paroquiaId), eq(paroquiaMembros.userId, request.user.sub), eq(paroquiaMembros.ativo, true)))\n        .limit(1);\n      if (!vinculo) return reply.code(403).send({ error:'FORBIDDEN', message:'Você não possui acesso a esta paróquia.' });\n    }\n\n    const membros = await db.select({ userId:users.id, nome:users.nome, telefone:users.telefone, dataNascimento:users.dataNascimento })\n      .from(paroquiaMembros)\n      .innerJoin(users, eq(users.id, paroquiaMembros.userId))\n      .where(and(eq(paroquiaMembros.paroquiaId, paroquiaId), eq(paroquiaMembros.ativo, true), eq(users.ativo, true)))\n      .orderBy(asc(users.nome));\n\n    const hoje=new Date();\n    const delta=hoje.getDay()===0 ? -6 : 1-hoje.getDay();\n    const inicio=new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()+delta); inicio.setHours(0,0,0,0);\n    const fim=new Date(inicio); fim.setDate(fim.getDate()+6); fim.setHours(23,59,59,999);\n\n    function aniversario(valor:string) {\n      const [,mes,dia]=valor.split('-').map(Number);\n      return [new Date(inicio.getFullYear(),mes-1,dia), new Date(fim.getFullYear(),mes-1,dia)].find(d=>d>=inicio && d<=fim);\n    }\n\n    return membros.filter(m=>!!m.dataNascimento)\n      .map(m=>({...m, aniversario:aniversario(m.dataNascimento!)}))\n      .filter(m=>!!m.aniversario)\n      .sort((a,b)=>a.aniversario!.getTime()-b.aniversario!.getTime())\n      .map(m=>({ userId:m.userId, nome:m.nome, telefone:m.telefone, dataNascimento:m.dataNascimento, aniversario:m.aniversario!.toISOString() }));\n  });\n'''
    pos=t.rfind('\n}')
    t=t[:pos]+route+t[pos:]
save(p,t)

# ---------- ParoquiaAdmin UI ----------
p=Path('apps/web/src/pages/ParoquiaAdmin.tsx'); t=p.read_text(encoding='utf-8')
if 'dataNascimento?:string|null;' not in t:
    t=t.replace('  telefone?:string|null;\n','  telefone?:string|null;\n  dataNascimento?:string|null;\n',1)
start=t.find('const [novo,setNovo]')
if start>=0:
    end=t.find('});',start); block=t[start:end]
    if 'dataNascimento' not in block:
        block=block.replace("    telefone:'',\n    senha:'',\n","    telefone:'',\n    dataNascimento:'',\n    senha:'',\n",1); t=t[:start]+block+t[end:]
if 'dataNascimento:novo.dataNascimento' not in t:
    t=t.replace('            telefone:novo.telefone||null,\n            senha:novo.senha||undefined,\n','            telefone:novo.telefone||null,\n            dataNascimento:novo.dataNascimento||null,\n            senha:novo.senha||undefined,\n',1)
if 'value={novo.dataNascimento}' not in t:
    anchor='''            <label className="block mt-4">\n              <span className="text-sm font-semibold">\n                Senha inicial\n'''
    field='''            <label className="block mt-4">\n              <span className="text-sm font-semibold">Data de aniversário</span>\n              <input type="date" value={novo.dataNascimento} onChange={e=>setNovo({...novo,dataNascimento:e.target.value})} className="cantus-input mt-2" />\n              <div className="mt-2 text-xs cantus-muted">Usada no card de aniversariantes da semana.</div>\n            </label>\n\n'''
    t=t.replace(anchor,field+anchor,1)
# V9 edit if present
if 'const [edicao,setEdicao]' in t:
    s=t.find('const [edicao,setEdicao]'); e=t.find('});',s); b=t[s:e]
    if 'dataNascimento' not in b:
        b=b.replace("    telefone:'',\n    senha:''\n","    telefone:'',\n    dataNascimento:'',\n    senha:''\n",1); t=t[:s]+b+t[e:]
    t=t.replace("      telefone:membro.telefone || '',\n      senha:''\n","      telefone:membro.telefone || '',\n      dataNascimento:membro.dataNascimento || '',\n      senha:''\n",1)
    t=t.replace('            telefone:edicao.telefone || null,\n            senha:edicao.senha || undefined\n','            telefone:edicao.telefone || null,\n            dataNascimento:edicao.dataNascimento || null,\n            senha:edicao.senha || undefined\n',1)
    if 'value={edicao.dataNascimento}' not in t:
        anchor='''            <label className="block mt-4">\n              <span className="text-sm font-semibold">Nova senha</span>\n'''
        field='''            <label className="block mt-4">\n              <span className="text-sm font-semibold">Data de aniversário</span>\n              <input type="date" value={edicao.dataNascimento} onChange={e=>setEdicao({...edicao,dataNascimento:e.target.value})} className="cantus-input mt-2" />\n            </label>\n\n'''
        t=t.replace(anchor,field+anchor,1)
save(p,t)

# ---------- MasterAdmin UI ----------
p=Path('apps/web/src/pages/MasterAdmin.tsx'); t=p.read_text(encoding='utf-8')
if 'dataNascimento?:string|null;' not in t:
    t=t.replace('  telefone?:string|null;\n','  telefone?:string|null;\n  dataNascimento?:string|null;\n',1)
if 'const [edicaoUsuario,setEdicaoUsuario]' in t:
    s=t.find('const [edicaoUsuario,setEdicaoUsuario]'); e=t.find('});',s); b=t[s:e]
    if 'dataNascimento' not in b:
        b=b.replace("    telefone:'',\n    senha:''\n","    telefone:'',\n    dataNascimento:'',\n    senha:''\n",1); t=t[:s]+b+t[e:]
    t=t.replace("      telefone:usuario.telefone || '',\n      senha:''\n","      telefone:usuario.telefone || '',\n      dataNascimento:usuario.dataNascimento || '',\n      senha:''\n",1)
    t=t.replace('            telefone:edicaoUsuario.telefone || null,\n            senha:edicaoUsuario.senha || undefined\n','            telefone:edicaoUsuario.telefone || null,\n            dataNascimento:edicaoUsuario.dataNascimento || null,\n            senha:edicaoUsuario.senha || undefined\n',1)
    if 'value={edicaoUsuario.dataNascimento}' not in t:
        anchor='''            <label className="block mt-4">\n              <span className="text-sm font-semibold">Nova senha</span>\n'''
        field='''            <label className="block mt-4">\n              <span className="text-sm font-semibold">Data de aniversário</span>\n              <input type="date" value={edicaoUsuario.dataNascimento} onChange={e=>setEdicaoUsuario({...edicaoUsuario,dataNascimento:e.target.value})} className="cantus-input mt-2" />\n            </label>\n\n'''
        t=t.replace(anchor,field+anchor,1)
save(p,t)

# ---------- Dashboard UI ----------
p=Path('apps/web/src/pages/Dashboard.tsx'); t=p.read_text(encoding='utf-8')
if 'type Aniversariante' not in t:
    pos=t.find('function chaveMes')
    t=t[:pos]+'''type Aniversariante = {\n  userId:string;\n  nome:string;\n  telefone:string|null;\n  dataNascimento:string;\n  aniversario:string;\n};\n\n'''+t[pos:]
if 'const [aniversariantes,setAniversariantes]' not in t:
    t=t.replace('  const [agenda,setAgenda]=useState<AgendaItem[]>([]);\n','  const [agenda,setAgenda]=useState<AgendaItem[]>([]);\n  const [aniversariantes,setAniversariantes]=useState<Aniversariante[]>([]);\n',1)
if 'async function carregarAniversariantes()' not in t:
    anchor='  async function carregarAgenda(data:Date) {\n'
    fn='''  async function carregarAniversariantes() {\n    try {\n      setAniversariantes(await api(`/me/aniversariantes?paroquiaId=${encodeURIComponent(paroquiaAtual.id)}`));\n    } catch (e) {\n      setErro(e instanceof Error ? e.message : 'Erro ao carregar aniversariantes.');\n    }\n  }\n\n'''
    t=t.replace(anchor,fn+anchor,1)
if 'carregarAniversariantes();' not in t:
    t=t.replace('''  useEffect(()=>{\n    carregarGrupos();\n  },[paroquiaAtual.id]);\n''','''  useEffect(()=>{\n    carregarGrupos();\n    carregarAniversariantes();\n  },[paroquiaAtual.id]);\n''',1)
if 'Aniversariantes da semana' not in t:
    anchor='        <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-5 mt-7">\n'
    panel='''        <section className="cantus-card mt-7 p-5 sm:p-6">\n          <div className="flex items-center justify-between gap-4">\n            <div>\n              <div className="cantus-eyebrow">Comunidade</div>\n              <h2 className="cantus-display mt-2 text-3xl">Aniversariantes da semana</h2>\n              <p className="mt-2 text-sm cantus-muted">Somente membros vinculados a {paroquiaAtual.nome}.</p>\n            </div>\n            <div className="text-3xl">🎂</div>\n          </div>\n\n          {aniversariantes.length ? (\n            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">\n              {aniversariantes.map(a=>{\n                const aniversario=new Date(a.aniversario);\n                const ano=Number(a.dataNascimento.slice(0,4));\n                const idade=aniversario.getFullYear()-ano;\n                return (\n                  <div key={a.userId} className="rounded-2xl border border-[#d5ae62]/20 bg-[#d5ae62]/[.055] p-4">\n                    <div className="cantus-gold text-xs font-bold uppercase tracking-[.12em]">\n                      {new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'}).format(aniversario)}\n                    </div>\n                    <div className="cantus-display mt-2 text-2xl">{a.nome}</div>\n                    <div className="mt-1 text-sm cantus-muted">{idade} anos</div>\n                    {a.telefone && <a href={`tel:${a.telefone}`} className="inline-block mt-3 text-sm cantus-gold">☎ {a.telefone}</a>}\n                  </div>\n                );\n              })}\n            </div>\n          ) : (\n            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.02] p-5 cantus-muted">Nenhum aniversariante nesta semana.</div>\n          )}\n        </section>\n\n'''
    t=t.replace(anchor,panel+anchor,1)
save(p,t)

print('V10 aplicada com sucesso.')
