import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthState } from '../types';
import { api } from '../lib/axios';

interface AuthContextType extends AuthState {
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    return {
      user: null,
      isAuthenticated: false,
      isLoading: !!token,
    };
  });

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get<User>('/auth/me');
      setAuthState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Error fetching user', error);
      logout();
    }
  }, [logout]);

  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
    setAuthState(prev => ({ ...prev, isLoading: true }));
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUser();
    }
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
