import {
  useEffect,
  useState,
  type FormEvent
} from 'react';
import {
  Link,
  useNavigate,
  useParams
} from 'react-router-dom';

import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type ConviteInfo = {
  token:string;
  status:string;
  expiraEm:string;
  papelProposto:string;
  email?:string|null;
  telefone?:string|null;
  grupoId:string;
  grupoNome:string;
  paroquiaId:string;
  paroquia:string;
  cidade:string;
};

export default function AceitarConvite() {
  const { token }=useParams();
  const navigate=useNavigate();

  const {
    token:authToken,
    login,
    selecionarParoquia
  }=useAuth();

  const [info,setInfo]=useState<ConviteInfo|null>(null);
  const [erro,setErro]=useState('');
  const [carregando,setCarregando]=useState(false);

  const [form,setForm]=useState({
    nome:'',
    email:'',
    telefone:'',
    senha:'',
    confirmarSenha:''
  });

  useEffect(()=>{
    if (!token) return;

    api(`/convites/${token}`)
      .then((data:ConviteInfo)=>{
        setInfo(data);

        setForm(v=>({
          ...v,
          email:data.email || '',
          telefone:data.telefone || ''
        }));
      })
      .catch(e=>setErro(e.message));
  },[token]);

  async function aceitarContaExistente() {
    if (!token) return;

    setCarregando(true);
    setErro('');

    try {
      const retorno=await api(
        `/convites/${token}/aceitar`,
        {
          method:'POST'
        }
      );

      if (info) {
        selecionarParoquia({
          id:info.paroquiaId,
          nome:info.paroquia,
          cidade:info.cidade,
          papel:'MEMBRO'
        });
      }

      localStorage.removeItem(
        'cantus_grupo_ativo'
      );

      navigate('/dashboard',{
        replace:true
      });
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao aceitar convite.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function criarContaEAceitar(
    e:FormEvent
  ) {
    e.preventDefault();

    if (!token) return;

    if (
      form.senha !==
      form.confirmarSenha
    ) {
      setErro(
        'As senhas não coincidem.'
      );
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const retorno=await api(
        `/convites/${token}/aceitar-novo`,
        {
          method:'POST',
          body:JSON.stringify({
            nome:form.nome,
            email:
              info?.email
                ? undefined
                : form.email,
            telefone:
              form.telefone || null,
            senha:form.senha
          })
        }
      );

      login(
        retorno.token,
        retorno.user
      );

      /*
       * login() limpa a paróquia ativa,
       * então selecionamos a paróquia
       * imediatamente depois.
       */
      selecionarParoquia(
        retorno.paroquia
      );

      localStorage.removeItem(
        'cantus_grupo_ativo'
      );

      navigate('/dashboard',{
        replace:true
      });
    } catch(e) {
      setErro(
        e instanceof Error
          ? e.message
          : 'Erro ao criar conta e aceitar convite.'
      );
    } finally {
      setCarregando(false);
    }
  }

  const expirado=
    info &&
    new Date(info.expiraEm).getTime()
      < Date.now();

  const conviteDisponivel=
    info &&
    info.status==='PENDENTE' &&
    !expirado;

  return (
    <main className="cantus-page min-h-screen grid place-items-center p-5">
      <div className="w-full max-w-3xl">
        <div className="cantus-card p-7 sm:p-10">
          <div className="text-center">
            <div className="text-5xl cantus-gold">
              ♫
            </div>

            <div className="cantus-eyebrow mt-6">
              Convite para servir
            </div>

            <h1 className="cantus-display mt-4 text-5xl">
              Você foi convidado.
            </h1>
          </div>

          {erro && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-950/30 p-4 text-red-200">
              {erro}
            </div>
          )}

          {info && (
            <>
              <div className="mt-7 rounded-2xl border border-white/10 bg-white/[.025] p-5 text-center">
                <div className="text-sm cantus-muted">
                  Ministério
                </div>

                <div className="cantus-display mt-2 text-3xl cantus-gold">
                  {info.grupoNome}
                </div>

                <p className="mt-3 text-sm cantus-muted">
                  {info.paroquia} · {info.cidade}
                </p>

                <div className="mt-4">
                  <span className="cantus-badge">
                    {info.papelProposto}
                  </span>
                </div>
              </div>

              {!conviteDisponivel && (
                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-amber-200 text-center">
                  Este convite já foi utilizado ou expirou.
                </div>
              )}

              {conviteDisponivel && authToken && (
                <div className="mt-7 text-center">
                  <p className="cantus-muted">
                    Você já está conectado ao Cantus Dei.
                  </p>

                  <button
                    disabled={carregando}
                    onClick={aceitarContaExistente}
                    className="cantus-primary mt-5 px-7 py-3 disabled:opacity-50"
                  >
                    {carregando
                      ? 'Aceitando...'
                      : 'Aceitar convite'}
                  </button>
                </div>
              )}

              {conviteDisponivel && !authToken && (
                <div className="mt-8 grid lg:grid-cols-[1.15fr_.85fr] gap-6 items-start">
                  <form
                    onSubmit={criarContaEAceitar}
                    className="rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6"
                  >
                    <div className="cantus-eyebrow">
                      Primeiro acesso
                    </div>

                    <h2 className="cantus-display mt-3 text-3xl">
                      Crie sua senha
                    </h2>

                    <p className="mt-2 text-sm cantus-muted leading-6">
                      Ao concluir, sua conta será criada e você já ficará associado à paróquia e ao ministério.
                    </p>

                    <label className="block mt-5">
                      <span className="text-sm font-semibold">
                        Seu nome
                      </span>

                      <input
                        required
                        value={form.nome}
                        onChange={e=>
                          setForm({
                            ...form,
                            nome:e.target.value
                          })
                        }
                        className="cantus-input mt-2"
                      />
                    </label>

                    <label className="block mt-4">
                      <span className="text-sm font-semibold">
                        E-mail
                      </span>

                      <input
                        required
                        type="email"
                        disabled={!!info.email}
                        value={form.email}
                        onChange={e=>
                          setForm({
                            ...form,
                            email:e.target.value
                          })
                        }
                        className="cantus-input mt-2 disabled:opacity-70"
                      />

                      {info.email && (
                        <div className="mt-2 text-xs cantus-muted">
                          Este convite foi emitido para este e-mail.
                        </div>
                      )}
                    </label>

                    <label className="block mt-4">
                      <span className="text-sm font-semibold">
                        Telefone
                      </span>

                      <input
                        value={form.telefone}
                        onChange={e=>
                          setForm({
                            ...form,
                            telefone:e.target.value
                          })
                        }
                        className="cantus-input mt-2"
                      />
                    </label>

                    <label className="block mt-4">
                      <span className="text-sm font-semibold">
                        Senha
                      </span>

                      <input
                        required
                        minLength={8}
                        type="password"
                        value={form.senha}
                        onChange={e=>
                          setForm({
                            ...form,
                            senha:e.target.value
                          })
                        }
                        className="cantus-input mt-2"
                      />
                    </label>

                    <label className="block mt-4">
                      <span className="text-sm font-semibold">
                        Confirmar senha
                      </span>

                      <input
                        required
                        minLength={8}
                        type="password"
                        value={form.confirmarSenha}
                        onChange={e=>
                          setForm({
                            ...form,
                            confirmarSenha:e.target.value
                          })
                        }
                        className="cantus-input mt-2"
                      />
                    </label>

                    <button
                      disabled={carregando}
                      className="cantus-primary mt-6 w-full py-3 disabled:opacity-50"
                    >
                      {carregando
                        ? 'Criando acesso...'
                        : 'Criar acesso e aceitar convite'}
                    </button>
                  </form>

                  <aside className="cantus-card p-5 sm:p-6">
                    <div className="cantus-eyebrow">
                      Já possui cadastro?
                    </div>

                    <h3 className="cantus-display mt-3 text-2xl">
                      Use sua conta atual.
                    </h3>

                    <p className="mt-3 text-sm cantus-muted leading-6">
                      Se este e-mail já está cadastrado no Cantus Dei, entre normalmente e depois abra novamente este convite para aceitá-lo.
                    </p>

                    <Link
                      to="/login"
                      className="cantus-secondary inline-block mt-5 px-5 py-2.5 text-sm"
                    >
                      Entrar com minha conta
                    </Link>
                  </aside>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
