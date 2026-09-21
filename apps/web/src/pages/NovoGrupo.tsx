import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function slugify(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NovoGrupo() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', paroquia: '', cidade: '', corTema: '#7C3AED' });
  const [erro, setErro] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();

    try {
      const grupo = await api('/grupos', {
        method: 'POST',
        body: JSON.stringify({ ...form, slug: slugify(form.nome) })
      });

      localStorage.setItem('cantus_grupo_ativo', JSON.stringify(grupo));
      navigate(`/g/${grupo.slug}`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao criar grupo.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <form onSubmit={submit} className="max-w-xl mx-auto mt-8 bg-white border border-slate-200 rounded-3xl p-8">
        <button type="button" onClick={() => navigate('/dashboard')} className="text-sm text-violet-700 font-semibold">Voltar</button>
        <h1 className="mt-5 text-3xl font-bold">Novo grupo</h1>

        {[
          ['nome', 'Nome do grupo'],
          ['paroquia', 'Paróquia'],
          ['cidade', 'Cidade']
        ].map(([key, label]) => (
          <label className="block mt-5" key={key}>
            <span className="text-sm font-medium">{label}</span>
            <input
              required
              value={(form as Record<string,string>)[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>
        ))}

        <label className="block mt-5">
          <span className="text-sm font-medium">Cor do grupo</span>
          <input type="color" value={form.corTema} onChange={e => setForm({ ...form, corTema: e.target.value })} className="mt-2 block h-10" />
        </label>

        {erro && <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-xl">{erro}</div>}

        <button className="mt-6 w-full rounded-xl bg-violet-700 text-white py-3 font-semibold">Criar grupo</button>
      </form>
    </main>
  );
}
