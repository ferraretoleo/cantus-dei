import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

type Paroquia = {
  id: string;
  nome: string;
  cidade: string;
  papel: 'ADMIN_PAROQUIA' | 'MEMBRO';
};

function slugify(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'');
}

export default function NovoGrupo() {
  const navigate = useNavigate();
  const [paroquias,setParoquias] = useState<Paroquia[]>([]);
  const [form,setForm] = useState({
    nome:'',
    paroquiaId:'',
    corTema:'#D5AE62'
  });
  const [erro,setErro] = useState('');

  useEffect(() => {
    api('/me/paroquias')
      .then((data:Paroquia[]) => {
        const admins=data.filter(p=>p.papel==='ADMIN_PAROQUIA');
        setParoquias(admins);
        if (admins.length===1) {
          setForm(v=>({ ...v,paroquiaId:admins[0].id }));
        }
      })
      .catch(e=>setErro(e.message));
  },[]);

  async function submit(e:FormEvent) {
    e.preventDefault();
    setErro('');

    try {
      const grupo=await api('/grupos',{
        method:'POST',
        body:JSON.stringify({
          nome:form.nome,
          paroquiaId:form.paroquiaId,
          corTema:form.corTema,
          slug:slugify(`${form.nome}-${Date.now().toString().slice(-5)}`)
        })
      });

      localStorage.setItem('cantus_grupo_ativo',JSON.stringify(grupo));
      navigate(`/g/${grupo.slug}`);
    } catch (error) {
      setErro(error instanceof Error?error.message:'Erro ao criar grupo.');
    }
  }

  return (
    <main className="cantus-page">
      <header className="border-b border-white/10 bg-[#0b0c0e]/90">
        <div className="cantus-shell h-20 flex items-center">
          <Link to="/dashboard" className="cantus-eyebrow">
            ← Cantus Dei
          </Link>
        </div>
      </header>

      <section className="cantus-shell py-10 sm:py-14">
        <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-8 lg:gap-12 items-start">
          <aside className="pt-2">
            <div className="text-6xl cantus-gold">♫</div>
            <div className="cantus-eyebrow mt-7">Novo ministério</div>

            <h1 className="cantus-display mt-4 text-5xl sm:text-6xl leading-[.95]">
              Crie o grupo
              <span className="block cantus-gold">
                dentro da paróquia.
              </span>
            </h1>

            <p className="mt-6 max-w-lg cantus-muted leading-7">
              Somente administradores de paróquia podem criar grupos.
              Todos os dados do grupo ficarão vinculados à paróquia selecionada.
            </p>
          </aside>

          <form onSubmit={submit} className="cantus-card p-6 sm:p-8">
            <div className="cantus-eyebrow">Dados do grupo</div>
            <h2 className="cantus-display mt-3 text-3xl">
              Criar novo grupo
            </h2>

            <label className="block mt-5">
              <span className="text-sm font-semibold text-[#d9d2c6]">
                Paróquia
              </span>

              <select
                required
                value={form.paroquiaId}
                onChange={e=>setForm({ ...form,paroquiaId:e.target.value })}
                className="cantus-input mt-2"
              >
                <option value="">Selecione</option>
                {paroquias.map(p=>(
                  <option key={p.id} value={p.id}>
                    {p.nome} · {p.cidade}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mt-5">
              <span className="text-sm font-semibold text-[#d9d2c6]">
                Nome do grupo
              </span>

              <input
                required
                value={form.nome}
                onChange={e=>setForm({ ...form,nome:e.target.value })}
                placeholder="Ex.: Ministério São José"
                className="cantus-input mt-2"
              />
            </label>

            <label className="block mt-5">
              <span className="text-sm font-semibold text-[#d9d2c6]">
                Cor de identidade
              </span>

              <input
                type="color"
                value={form.corTema}
                onChange={e=>setForm({ ...form,corTema:e.target.value })}
                className="mt-2 w-14 h-12 rounded-xl bg-transparent border border-white/10 p-1"
              />
            </label>

            {!paroquias.length && (
              <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-amber-200">
                Você ainda não é administrador de nenhuma paróquia.
              </div>
            )}

            {erro && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
                {erro}
              </div>
            )}

            <div className="mt-7 flex gap-3">
              <button
                disabled={!paroquias.length}
                className="cantus-primary px-6 py-3 disabled:opacity-50"
              >
                Criar grupo
              </button>

              <Link to="/dashboard" className="cantus-secondary px-6 py-3">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
