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
      navigate('/dashboard');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-violet-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-3xl border border-violet-100 p-8 shadow-xl shadow-violet-950/5">
        <div className="text-sm font-extrabold uppercase tracking-[.18em] text-violet-700">Cantus Dei</div>
        <h1 className="mt-3 text-3xl font-bold">Entrar</h1>
        <p className="mt-2 text-slate-500">Liturgia, repertório e músicos no mesmo lugar.</p>

        <label className="block mt-7">
          <span className="text-sm font-medium">E-mail</span>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>

        <label className="block mt-4">
          <span className="text-sm font-medium">Senha</span>
          <input required type="password" value={senha} onChange={e => setSenha(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
        </label>

        {erro && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{erro}</div>}

        <button disabled={carregando} className="mt-6 w-full rounded-xl bg-violet-700 py-3 font-semibold text-white">
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Não tem conta? <Link className="font-semibold text-violet-700" to="/registrar">Criar conta</Link>
        </p>
      </form>
    </main>
  );
}
