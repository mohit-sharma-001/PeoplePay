import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RegisterPayload, RegisterResponse } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, pass: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => void;
  reloadUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const current = authService.getCurrentUser();
    if (current) {
      setUser(current);
    }
  }, []);

  const login = async (emailOrUsername: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authService.login({ emailOrUsername, password: pass });
      if (res.success && res.user) {
        setUser(res.user);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch {
      setIsLoading(false);
      return false;
    }
  };

  const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    setIsLoading(true);
    try {
      const res = await authService.register(payload);
      if (res.success) {
        const loggedInUser = authService.getCurrentUser();
        if (loggedInUser) {
          setUser(loggedInUser);
        }
      }
      setIsLoading(false);
      return res;
    } catch (err: any) {
      setIsLoading(false);
      return {
        success: false,
        message: err.message || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const reloadUser = () => {
    const current = authService.getCurrentUser();
    setUser(current);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
