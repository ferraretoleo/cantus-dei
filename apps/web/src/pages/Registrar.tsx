import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Registrar() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setErro('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setCarregando(true);

    try {
      const data = await api('/auth/registrar', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          email,
          senha,
          telefone: telefone || undefined
        })
      });

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao criar conta.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="text-violet-700 font-bold text-sm uppercase tracking-[0.2em]">
            Cantus Dei
          </div>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Criar conta
          </h1>

          <p className="mt-2 text-slate-500">
            Cadastre-se para organizar seu grupo de música litúrgica
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8"
        >
          <label className="block mb-4">
            <span className="block text-sm font-medium mb-2">
              Nome
            </span>

            <input
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium mb-2">
              E-mail
            </span>

            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium mb-2">
              Telefone
            </span>

            <input
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium mb-2">
              Senha
            </span>

            <input
              type="password"
              required
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="block mb-6">
            <span className="block text-sm font-medium mb-2">
              Confirmar senha
            </span>

            <input
              type="password"
              required
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          {erro && (
            <div className="mb-5 rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {erro}
            </div>
          )}

          <button
            disabled={carregando}
            className="w-full rounded-xl bg-violet-700 text-white py-3 font-semibold"
          >
            {carregando
              ? 'Criando conta...'
              : 'Criar conta'}
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Já tem conta?{' '}
            <Link
              to="/login"
              className="font-semibold text-violet-700"
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}