import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('boardly_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('boardly_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('boardly_user', JSON.stringify(res.user));
          }
        } catch {
          // If token expired or server offline, fall back to stored user or clear
          console.warn('Could not verify existing session');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('boardly_token', data.token);
      localStorage.setItem('boardly_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authApi.register(name, email, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('boardly_token', data.token);
      localStorage.setItem('boardly_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    }
  };

  const demoLogin = async (role = 'alex') => {
    try {
      const data = await authApi.demo(role);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('boardly_token', data.token);
      localStorage.setItem('boardly_user', JSON.stringify(data.user));
      return { success: true };
    } catch {
      // Offline fallback
      const mockUser = {
        id: `usr_${role}`,
        name: role === 'sarah' ? 'Sarah Chen' : 'Alex Morgan',
        email: `${role}@boardly.app`,
        avatarColor: role === 'sarah' ? '#A63D57' : '#7F1D3F',
        role: role === 'sarah' ? 'Staff Designer' : 'Product Lead'
      };
      setUser(mockUser);
      setToken('mock_demo_token');
      localStorage.setItem('boardly_token', 'mock_demo_token');
      localStorage.setItem('boardly_user', JSON.stringify(mockUser));
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('boardly_token');
    localStorage.removeItem('boardly_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
