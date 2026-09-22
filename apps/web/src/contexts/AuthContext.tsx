import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from 'react';

export type User = {
  id: string;
  nome: string;
  email: string;
  perfilGlobal: 'USUARIO' | 'MASTER';
};

export type ParoquiaAtiva = {
  id: string;
  nome: string;
  cidade: string;
  endereco?: string | null;
  papel: 'MASTER' | 'ADMIN_PAROQUIA' | 'MEMBRO';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  paroquiaAtiva: ParoquiaAtiva | null;
  login: (token: string, user: User) => void;
  selecionarParoquia: (paroquia: ParoquiaAtiva) => void;
  limparParoquia: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('cantus_token')
  );

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('cantus_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [paroquiaAtiva, setParoquiaAtiva] = useState<ParoquiaAtiva | null>(() => {
    const stored = localStorage.getItem('cantus_paroquia_ativa');
    return stored ? JSON.parse(stored) : null;
  });

  function login(newToken: string, newUser: User) {
    localStorage.setItem('cantus_token', newToken);
    localStorage.setItem('cantus_user', JSON.stringify(newUser));
    localStorage.removeItem('cantus_paroquia_ativa');
    localStorage.removeItem('cantus_grupo_ativo');

    setToken(newToken);
    setUser(newUser);
    setParoquiaAtiva(null);
  }

  function selecionarParoquia(paroquia: ParoquiaAtiva) {
    localStorage.setItem(
      'cantus_paroquia_ativa',
      JSON.stringify(paroquia)
    );
    localStorage.removeItem('cantus_grupo_ativo');
    setParoquiaAtiva(paroquia);
  }

  function limparParoquia() {
    localStorage.removeItem('cantus_paroquia_ativa');
    localStorage.removeItem('cantus_grupo_ativo');
    setParoquiaAtiva(null);
  }

  function logout() {
    localStorage.removeItem('cantus_token');
    localStorage.removeItem('cantus_user');
    localStorage.removeItem('cantus_paroquia_ativa');
    localStorage.removeItem('cantus_grupo_ativo');

    setToken(null);
    setUser(null);
    setParoquiaAtiva(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        paroquiaAtiva,
        login,
        selecionarParoquia,
        limparParoquia,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
}
