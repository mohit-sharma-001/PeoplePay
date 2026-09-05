import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/auth';
import { mockUsers } from '../data/mockUsers';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default logged-in user is Admin as specified in Prompt
  const [user, setUser] = useState<User | null>(mockUsers[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const login = async (email: string, _pass: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 400));
    const found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) || mockUsers[0];
    setUser(found);
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (newRole: Role) => {
    const matchingUser = mockUsers.find((u) => u.role === newRole);
    if (matchingUser) {
      setUser(matchingUser);
    } else if (user) {
      setUser({ ...user, role: newRole });
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
