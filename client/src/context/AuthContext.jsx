import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/http.js';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const value = {
    user,
    loading,
    async login(input, register = false) {
      const data = await api(`/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body: input,
      });
      setUser(data.user);
    },
    async logout() {
      await api('/auth/logout', { method: 'POST' });
      setUser(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
