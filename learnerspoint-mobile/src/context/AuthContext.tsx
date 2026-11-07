import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken, setStoredSession, clearStoredSession, UserSession } from '../services/api';

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  login: (session: UserSession) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkLoginState = async () => {
    try {
      const token = await getStoredToken();
      setIsLoggedIn(!!token);
    } catch (e) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLoginState();
  }, []);

  const login = async (session: UserSession) => {
    await setStoredSession(session);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await clearStoredSession();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
