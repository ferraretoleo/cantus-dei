import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  perfilGlobal: 'USUARIO' | 'MASTER';
  ativo: boolean;
};

export default function MasterAdmin() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregar() {
    try {
      setUsuarios(await api('/master/usuarios'));
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao carregar usuários.'
      );
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function alterarPerfil(
    usuario: Usuario,
    perfilGlobal: 'USUARIO' | 'MASTER'
  ) {
    const acao =
      perfilGlobal === 'MASTER'
        ? 'tornar MASTER'
        : 'remover o perfil MASTER de';

    if (!window.confirm(`${acao} ${usuario.nome}?`)) {
      return;
    }

    setErro('');
    setMensagem('');

    try {
      await api(`/master/usuarios/${usuario.id}/perfil`, {
        method: 'PUT',
        body: JSON.stringify({ perfilGlobal })
      });

      setMensagem(
        perfilGlobal === 'MASTER'
          ? `${usuario.nome} agora é MASTER.`
          : `${usuario.nome} voltou ao perfil USUARIO.`
      );

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Erro ao alterar perfil.'
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">
              Cantus Dei
            </div>
            <h1 className="mt-1 text-2xl font-bold">
              Administração MASTER
            </h1>
          </div>

          <Link
            to="/dashboard"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold"
          >
            Voltar
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto p-6 sm:py-10">
        <h2 className="text-3xl font-bold text-slate-900">
          Usuários do sistema
        </h2>

        <p className="mt-2 text-slate-500">
          Usuários MASTER possuem administração global do Cantus Dei.
        </p>

        {erro && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-700">
            {mensagem}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Usuário</th>
                  <th className="px-5 py-4">Perfil global</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Ação</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {usuarios.map(usuario => (
                  <tr key={usuario.id}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">
                        {usuario.nome}
                        {usuario.id === user?.id && (
                          <span className="ml-2 text-xs font-bold text-violet-700">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {usuario.email}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {usuario.perfilGlobal}
                    </td>

                    <td className="px-5 py-4">
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {usuario.id === user?.id ? (
                        <span className="text-xs text-slate-400">
                          MASTER principal
                        </span>
                      ) : usuario.perfilGlobal === 'MASTER' ? (
                        <button
                          onClick={() =>
                            alterarPerfil(usuario, 'USUARIO')
                          }
                          className="text-sm font-semibold text-red-600"
                        >
                          Remover MASTER
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            alterarPerfil(usuario, 'MASTER')
                          }
                          className="text-sm font-semibold text-violet-700"
                        >
                          Tornar MASTER
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
