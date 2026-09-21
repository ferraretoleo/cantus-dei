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

export function AuthProvider({
  children
}: {
  children: ReactNode;
}) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('cantus_token')
  );

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('cantus_user');

    return stored
      ? JSON.parse(stored)
      : null;
  });

  function login(token: string, user: User) {
    localStorage.setItem('cantus_token', token);
    localStorage.setItem(
      'cantus_user',
      JSON.stringify(user)
    );

    setToken(token);
    setUser(user);
  }

  function logout() {
    localStorage.removeItem('cantus_token');
    localStorage.removeItem('cantus_user');

    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
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
    throw new Error(
      'useAuth deve ser usado dentro de AuthProvider'
    );
  }

  return context;
}