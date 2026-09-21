import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function criarSlug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function NovoGrupo() {
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [paroquia, setParoquia] = useState('');
  const [cidade, setCidade] = useState('');
  const [corTema, setCorTema] = useState('#7C3AED');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setErro('');
    setCarregando(true);

    try {
      const grupo = await api('/grupos', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          paroquia,
          cidade,
          slug: criarSlug(nome),
          corTema
        })
      });

      localStorage.setItem(
        'cantus_grupo_ativo',
        JSON.stringify(grupo)
      );

      navigate('/dashboard');
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao criar grupo.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto pt-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-slate-500 mb-6"
        >
          Voltar
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-8">
          <h1 className="text-3xl font-bold">
            Novo grupo
          </h1>

          <p className="text-slate-500 mt-2 mb-8">
            Cadastre seu grupo de música litúrgica
          </p>

          <form onSubmit={handleSubmit}>
            <label className="block mb-4">
              <span className="block text-sm font-medium mb-2">
                Nome do grupo
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
                Paróquia
              </span>

              <input
                required
                value={paroquia}
                onChange={e => setParoquia(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="block mb-4">
              <span className="block text-sm font-medium mb-2">
                Cidade
              </span>

              <input
                required
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>

            <label className="block mb-6">
              <span className="block text-sm font-medium mb-2">
                Cor do grupo
              </span>

              <input
                type="color"
                value={corTema}
                onChange={e => setCorTema(e.target.value)}
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
                ? 'Criando...'
                : 'Criar grupo'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}