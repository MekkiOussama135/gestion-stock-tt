import { useState } from 'react';
import { AuthContext } from './context';

/**
 * Fournit l'état d'authentification (jeton JWT, utilisateur, rôle, région)
 * à toute l'application via React Context. L'état est initialisé depuis
 * localStorage afin de rester connecté après un rechargement de page.
 */
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    // Restauration de la session depuis localStorage au chargement initial.
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const regionId = localStorage.getItem('regionId');
    const regionName = localStorage.getItem('regionName');
    return token ? { token, username, role, regionId, regionName } : null;
  });

  const login = (token, username, role, regionId, regionName) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    // regionId n'existe que pour un RESPONSABLE_REGION ; un ADMIN n'a pas
    // de région associée, donc on nettoie ces clés dans ce cas.
    if (regionId != null) {
      localStorage.setItem('regionId', regionId);
      localStorage.setItem('regionName', regionName);
    } else {
      localStorage.removeItem('regionId');
      localStorage.removeItem('regionName');
    }
    setAuth({ token, username, role, regionId, regionName });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('regionId');
    localStorage.removeItem('regionName');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}