import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from 'react';

type User = {
  id: string;
  nome: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
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

  function login(newToken: string, newUser: User) {
    localStorage.setItem('cantus_token', newToken);
    localStorage.setItem('cantus_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('cantus_token');
    localStorage.removeItem('cantus_user');
    localStorage.removeItem('cantus_grupo_ativo');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
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
