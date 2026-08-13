import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Enveloppe une route qui exige d'être connecté. Redirige vers /login si
 * aucun utilisateur authentifié n'est présent dans le contexte.
 */
function ProtectedRoute({ children }) {
  const { auth } = useAuth();

  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;