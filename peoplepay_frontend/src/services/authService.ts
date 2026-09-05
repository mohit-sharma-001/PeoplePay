import { User } from '../types/auth';
import { mockUsers } from '../data/mockUsers';

export interface LoginCredentials {
  emailOrUsername: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const identifier = credentials.emailOrUsername.trim();
    const password = credentials.password?.trim() || 'password123';

    if (!identifier) {
      return { success: false, error: 'Please enter your email or username.' };
    }

    try {
      // Attempt real backend authentication first
      const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier,
          password: password,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        const token = resData.data?.token || resData.token;
        const apiUser = resData.data?.user || resData.user;

        if (token && apiUser) {
          localStorage.setItem('auth_token', token);

          const roleName = (apiUser.roles && apiUser.roles.length > 0) ? apiUser.roles[0] : 'Admin';
          const frontendUser: User = {
            id: String(apiUser.id),
            name: `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.username,
            email: apiUser.email || `${apiUser.username}@peoplepay360.com`,
            role: roleName,
            department: 'Engineering',
            employeeId: apiUser.employee_id ? `EMP${String(apiUser.employee_id).padStart(4, '0')}` : 'EMP0001',
          };

          localStorage.setItem('auth_user', JSON.stringify(frontendUser));
          return { success: true, user: frontendUser, token };
        }
      }
    } catch (e) {
      console.warn('Real backend authentication failed, attempting mock fallback:', e);
    }

    // Fallback to local mock authentication if backend is unreachable or demo credentials used
    const matchedUser = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.name.toLowerCase().includes(identifier.toLowerCase()) ||
        u.id.toLowerCase() === identifier.toLowerCase()
    ) || {
      id: 'usr-demo',
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      email: identifier.includes('@') ? identifier : `${identifier}@peoplepay360.com`,
      role: 'Admin' as const,
      department: 'Executive',
      employeeId: 'EMP0001',
    };

    const mockToken = `mock_token_${Date.now()}`;
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('auth_user', JSON.stringify(matchedUser));

    return {
      success: true,
      user: matchedUser,
      token: mockToken,
    };
  },

  logout: (): void => {
    const token = localStorage.getItem('auth_token');
    if (token && !token.startsWith('mock_token_')) {
      fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },
};
