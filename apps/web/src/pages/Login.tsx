import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });

      login(data.token, data.user);
      navigate('/paroquias', { replace: true });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao entrar.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="cantus-page min-h-screen grid lg:grid-cols-[1.2fr_.8fr]">
      <section className="hidden lg:flex cantus-staff relative min-h-screen items-end overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(213,174,98,.13),transparent_25rem),linear-gradient(155deg,#171014_0%,#0b0c0e_58%,#111214_100%)]" />
        <div className="absolute right-[8%] top-[13%] cantus-vinyl opacity-90" />

        <div className="relative z-10 p-12 xl:p-16 max-w-3xl">
          <div className="cantus-eyebrow">
            Música · Liturgia · Comunhão
          </div>

          <h1 className="cantus-display mt-6 text-6xl xl:text-7xl leading-[.92]">
            A música a serviço
            <span className="block cantus-gold">
              da celebração.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 cantus-muted">
            Entre e escolha a paróquia que deseja acessar.
          </p>
        </div>
      </section>

      <section className="min-h-screen flex items-center justify-center p-5 sm:p-8">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="lg:hidden cantus-eyebrow mb-8">
            Cantus Dei
          </div>

          <div className="text-4xl select-none mb-6">♫</div>

          <div className="cantus-eyebrow">
            Bem-vindo ao Cantus Dei
          </div>

          <h2 className="cantus-display mt-4 text-5xl">
            Entre no seu
            <span className="block cantus-gold">
              ministério.
            </span>
          </h2>

          <label className="block mt-8">
            <span className="text-sm font-semibold text-[#d9d2c6]">
              E-mail
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="cantus-input mt-2"
            />
          </label>

          <label className="block mt-4">
            <span className="text-sm font-semibold text-[#d9d2c6]">
              Senha
            </span>
            <input
              required
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="cantus-input mt-2"
            />
          </label>

          {erro && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-950/35 p-3 text-sm text-red-200">
              {erro}
            </div>
          )}

          <button
            disabled={carregando}
            className="cantus-primary mt-6 w-full py-3.5 disabled:opacity-50"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="mt-6 text-center text-sm cantus-muted">
            Ainda não participa?{' '}
            <Link className="font-bold cantus-gold" to="/registrar">
              Criar conta
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
