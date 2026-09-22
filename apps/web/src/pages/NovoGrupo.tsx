import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

function slugify(texto:string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-|-$/g,'');
}

export default function NovoGrupo() {
  const navigate=useNavigate();
  const { user,paroquiaAtiva }=useAuth();

  const [nome,setNome]=useState('');
  const [corTema,setCorTema]=useState('#D5AE62');
  const [erro,setErro]=useState('');

  if (!paroquiaAtiva) {
    return <Navigate to="/paroquias" replace />;
  }

  const paroquiaAtual = paroquiaAtiva;

  const podeCriar=
    user?.perfilGlobal==='MASTER' ||
    paroquiaAtual.papel==='ADMIN_PAROQUIA';

  if (!podeCriar) {
    return <Navigate to="/dashboard" replace />;
  }

  async function submit(e:FormEvent) {
    e.preventDefault();
    setErro('');

    try {
      const grupo=await api('/grupos',{
        method:'POST',
        body:JSON.stringify({
          nome,
          paroquiaId:paroquiaAtual.id,
          corTema,
          slug:slugify(`${nome}-${Date.now().toString().slice(-6)}`)
        })
      });

      localStorage.setItem(
        'cantus_grupo_ativo',
        JSON.stringify(grupo)
      );

      navigate(`/g/${grupo.slug}`);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao criar grupo.'
      );
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

            <div className="cantus-eyebrow mt-7">
              Novo ministério
            </div>

            <h1 className="cantus-display mt-4 text-5xl sm:text-6xl leading-[.95]">
              Crie o grupo
              <span className="block cantus-gold">
                nesta paróquia.
              </span>
            </h1>

            <p className="mt-6 max-w-lg cantus-muted leading-7">
              {paroquiaAtual.nome} · {paroquiaAtual.cidade}
            </p>
          </aside>

          <form
            onSubmit={submit}
            className="cantus-card p-6 sm:p-8"
          >
            <div className="cantus-eyebrow">
              Dados do grupo
            </div>

            <h2 className="cantus-display mt-3 text-3xl">
              Criar novo grupo
            </h2>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[.025] p-4">
              <div className="text-xs uppercase tracking-[.14em] cantus-gold">
                Paróquia
              </div>

              <div className="mt-2 font-semibold">
                {paroquiaAtual.nome}
              </div>

              <div className="text-sm cantus-muted">
                {paroquiaAtual.cidade}
              </div>
            </div>

            <label className="block mt-5">
              <span className="text-sm font-semibold text-[#d9d2c6]">
                Nome do grupo
              </span>

              <input
                required
                value={nome}
                onChange={e=>setNome(e.target.value)}
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
                value={corTema}
                onChange={e=>setCorTema(e.target.value)}
                className="mt-2 w-14 h-12 rounded-xl bg-transparent border border-white/10 p-1"
              />
            </label>

            {erro && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
                {erro}
              </div>
            )}

            <div className="mt-7 flex gap-3">
              <button className="cantus-primary px-6 py-3">
                Criar grupo
              </button>

              <Link
                to="/dashboard"
                className="cantus-secondary px-6 py-3"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
