import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type Paroquia = {
  id: string;
  nome: string;
  cidade: string;
};

export default function Registrar() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [paroquias, setParoquias] = useState<Paroquia[]>([]);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmar: '',
    paroquiaId: ''
  });
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/public/paroquias')
      .then((data: Paroquia[]) => {
        setParoquias(data);
        if (data.length === 1) {
          setForm(v => ({ ...v, paroquiaId: data[0].id }));
        }
      })
      .catch(e => setErro(e.message));
  }, []);

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
          senha: form.senha,
          paroquiaId: form.paroquiaId
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
    }
  }

  return (
    <main className="cantus-page min-h-screen py-10 px-5">
      <div className="cantus-shell max-w-4xl">
        <Link to="/login" className="cantus-eyebrow">
          ← Cantus Dei
        </Link>

        <div className="mt-12 grid md:grid-cols-[.75fr_1.25fr] gap-8 md:gap-12 items-start">
          <aside>
            <div className="text-5xl mb-6">♩</div>

            <div className="cantus-eyebrow">
              Faça parte
            </div>

            <h1 className="cantus-display mt-4 text-5xl">
              Sua música
              <span className="block cantus-gold">
                encontra lugar.
              </span>
            </h1>

            <p className="mt-5 cantus-muted leading-7">
              Escolha sua paróquia principal ao criar a conta.
              Depois você poderá ser associado a outras paróquias
              sem precisar criar outro login.
            </p>
          </aside>

          <form onSubmit={submit} className="cantus-card p-6 sm:p-8">
            <div className="cantus-eyebrow">
              Novo cadastro
            </div>

            <h2 className="cantus-display mt-3 text-3xl">
              Criar conta
            </h2>

            <label className="block mt-5">
              <span className="text-sm font-semibold text-[#d9d2c6]">
                Paróquia
              </span>

              <select
                required
                value={form.paroquiaId}
                onChange={e => setForm({ ...form, paroquiaId: e.target.value })}
                className="cantus-input mt-2"
              >
                <option value="">Selecione sua paróquia</option>
                {paroquias.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} · {p.cidade}
                  </option>
                ))}
              </select>

              {!paroquias.length && (
                <p className="mt-2 text-xs cantus-muted">
                  Ainda não há paróquias disponíveis. O administrador global
                  precisa cadastrá-las primeiro.
                </p>
              )}
            </label>

            {[
              ['nome','Nome','text'],
              ['email','E-mail','email'],
              ['telefone','Telefone','text'],
              ['senha','Senha','password'],
              ['confirmar','Confirmar senha','password']
            ].map(([key,label,type]) => (
              <label className="block mt-4" key={key}>
                <span className="text-sm font-semibold text-[#d9d2c6]">
                  {label}
                </span>

                <input
                  required={key !== 'telefone'}
                  type={type}
                  value={(form as Record<string,string>)[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="cantus-input mt-2"
                />
              </label>
            ))}

            {erro && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-950/35 p-3 text-sm text-red-200">
                {erro}
              </div>
            )}

            <button
              disabled={!paroquias.length}
              className="cantus-primary mt-6 w-full py-3.5 disabled:opacity-50"
            >
              Criar conta
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
