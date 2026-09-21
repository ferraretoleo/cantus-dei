import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function Registrar() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '', confirmar: '' });
  const [erro, setErro] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();

    if (form.senha !== form.confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    try {
      const data = await api('/auth/registrar', {
        method: 'POST',
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone || undefined,
          senha: form.senha
        })
      });

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar conta.');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <form onSubmit={submit} className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-8">
        <div className="text-sm font-extrabold uppercase tracking-[.18em] text-violet-700">Cantus Dei</div>
        <h1 className="mt-3 text-3xl font-bold">Criar conta</h1>

        {[
          ['nome', 'Nome', 'text'],
          ['email', 'E-mail', 'email'],
          ['telefone', 'Telefone', 'text'],
          ['senha', 'Senha', 'password'],
          ['confirmar', 'Confirmar senha', 'password']
        ].map(([key, label, type]) => (
          <label className="block mt-4" key={key}>
            <span className="text-sm font-medium">{label}</span>
            <input
              required={key !== 'telefone'}
              type={type}
              value={(form as Record<string,string>)[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>
        ))}

        {erro && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{erro}</div>}

        <button className="mt-6 w-full rounded-xl bg-violet-700 py-3 font-semibold text-white">Criar conta</button>

        <p className="mt-5 text-center text-sm text-slate-500">
          Já possui conta? <Link className="font-semibold text-violet-700" to="/login">Entrar</Link>
        </p>
      </form>
    </main>
  );
}
