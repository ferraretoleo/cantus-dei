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
    <main className="cantus-page">
      <header className="border-b border-white/10 bg-[#0b0c0e]/90">
        <div className="cantus-shell h-20 flex items-center justify-between">
          <div>
            <div className="cantus-eyebrow">
              Cantus Dei
            </div>
            <div className="cantus-display mt-1 text-lg">
              Administração MASTER
            </div>
          </div>

          <Link to="/dashboard" className="cantus-secondary px-4 py-2 text-sm">
            Voltar
          </Link>
        </div>
      </header>

      <section className="cantus-shell py-10">
        <div className="cantus-eyebrow">
          Administração global
        </div>

        <h1 className="cantus-section-title mt-3">
          Usuários do
          <span className="cantus-gold">
            {' '}Cantus Dei.
          </span>
        </h1>

        <p className="mt-3 cantus-muted">
          Promova ou remova perfis MASTER sem misturar com os papéis dos grupos.
        </p>

        {erro && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-emerald-200">
            {mensagem}
          </div>
        )}

        <div className="cantus-card mt-7 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="cantus-table w-full text-left">
              <thead>
                <tr>
                  <th className="px-5 py-4">Usuário</th>
                  <th className="px-5 py-4">Perfil global</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Ação</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map(usuario => (
                  <tr key={usuario.id}>
                    <td className="px-5 py-4">
                      <div className="cantus-display text-lg">
                        {usuario.nome}
                        {usuario.id === user?.id && (
                          <span className="ml-2 cantus-gold text-xs font-bold">
                            VOCÊ
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-sm cantus-muted">
                        {usuario.email}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="cantus-badge">
                        {usuario.perfilGlobal}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm cantus-muted">
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      {usuario.id === user?.id ? (
                        <span className="text-xs cantus-muted">
                          MASTER principal
                        </span>
                      ) : usuario.perfilGlobal === 'MASTER' ? (
                        <button
                          onClick={() =>
                            alterarPerfil(usuario, 'USUARIO')
                          }
                          className="cantus-danger px-4 py-2 text-sm"
                        >
                          Remover MASTER
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            alterarPerfil(usuario, 'MASTER')
                          }
                          className="cantus-secondary px-4 py-2 text-sm"
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
