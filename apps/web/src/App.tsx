import {
  BrowserRouter,
  Navigate,
  Route,
  Routes
} from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Registrar from './pages/Registrar';
import Dashboard from './pages/Dashboard';
import NovoGrupo from './pages/NovoGrupo';
import GrupoHome from './pages/GrupoHome';
import Integrantes from './pages/Integrantes';
import Convites from './pages/Convites';
import AceitarConvite from './pages/AceitarConvite';
import Musicas from './pages/Musicas';
import MomentosLiturgicos from './pages/MomentosLiturgicos';
import Calendario from './pages/Calendario';
import MissaEditor from './pages/MissaEditor';
import CelebracaoPublica from './pages/CelebracaoPublica';
import ModoPalco from './pages/ModoPalco';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registrar" element={<Registrar />} />

          <Route path="/convites/:token" element={<AceitarConvite />} />

          <Route path="/celebracao/:token" element={<CelebracaoPublica />} />
          <Route path="/celebracao/:token/palco" element={<ModoPalco />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/grupos/novo" element={<ProtectedRoute><NovoGrupo /></ProtectedRoute>} />
          <Route path="/g/:slug" element={<ProtectedRoute><GrupoHome /></ProtectedRoute>} />
          <Route path="/g/:slug/calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
          <Route path="/g/:slug/missas/:missaId" element={<ProtectedRoute><MissaEditor /></ProtectedRoute>} />
          <Route path="/g/:slug/musicas" element={<ProtectedRoute><Musicas /></ProtectedRoute>} />
          <Route path="/g/:slug/momentos" element={<ProtectedRoute><MomentosLiturgicos /></ProtectedRoute>} />
          <Route path="/g/:slug/integrantes" element={<ProtectedRoute><Integrantes /></ProtectedRoute>} />
          <Route path="/g/:slug/convites" element={<ProtectedRoute><Convites /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
