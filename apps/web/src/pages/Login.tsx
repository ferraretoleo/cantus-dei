import {
  useState,
  type FormEvent
} from 'react';

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setErro('');
    setCarregando(true);

    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          senha
        })
      });

      login(data.token, data.user);

      navigate('/dashboard');
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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="text-violet-700 font-bold text-sm uppercase tracking-[0.2em]">
            Cantus Dei
          </div>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Entrar
          </h1>

          <p className="mt-2 text-slate-500">
            Acesse seu grupo de música litúrgica
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8"
        >
          <label className="block mb-5">
            <span className="block text-sm font-medium mb-2">
              E-mail
            </span>

            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600"
            />
          </label>

          <label className="block mb-6">
            <span className="block text-sm font-medium mb-2">
              Senha
            </span>

            <input
              type="password"
              required
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-600"
            />
          </label>

          {erro && (
            <div className="mb-5 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {erro}
            </div>
          )}

          <button
            disabled={carregando}
            className="w-full rounded-xl bg-violet-700 text-white py-3 font-semibold hover:bg-violet-800 disabled:opacity-50"
          >
            {carregando
              ? 'Entrando...'
              : 'Entrar'}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Ainda não tem cadastro?{' '}
            <Link
              to="/registrar"
              className="font-semibold text-violet-700"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}