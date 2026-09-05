import React, { createContext, useContext, useState } from 'react';
import { User, Role } from '../types/auth';
import { authService } from '../services/authService';
import { mockUsers } from '../data/mockUsers';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const switchRole = (newRole: Role) => {
    const matchingUser = mockUsers.find((u) => u.role === newRole);
    const updatedUser = matchingUser || (user ? { ...user, role: newRole } : null);
    if (updatedUser) {
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
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
