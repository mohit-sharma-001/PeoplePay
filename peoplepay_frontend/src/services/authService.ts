import { User } from '../types/auth';
import { mockUsers } from '../data/mockUsers';

export interface LoginCredentials {
  emailOrUsername: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// In-memory mock session state for frontend demonstration.
// Does NOT permanently persist in localStorage so /login is ALWAYS directly accessible.
let currentSessionUser: User | null = null;
let currentSessionToken: string | null = null;

/**
 * Isolated authentication service abstraction.
 * Replace this mock implementation with real backend API calls (e.g., POST /api/v1/auth/login)
 * when backend authentication is ready.
 */
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    const identifier = credentials.emailOrUsername.trim().toLowerCase();

    if (!identifier) {
      return { success: false, error: 'Please enter your email or username.' };
    }

    if (!credentials.password || !credentials.password.trim()) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Match existing mock user or construct a fallback user for demonstration
    const matchedUser = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === identifier ||
        u.name.toLowerCase().includes(identifier) ||
        u.id.toLowerCase() === identifier
    ) || {
      id: 'usr-demo',
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      email: identifier.includes('@') ? identifier : `${identifier}@peoplepay360.io`,
      role: 'Admin' as const,
      department: 'Executive',
      employeeId: 'EMP-DEMO-001',
    };

    currentSessionToken = `mock_token_${Date.now()}`;
    currentSessionUser = matchedUser;

    return {
      success: true,
      user: matchedUser,
    };
  },

  logout: (): void => {
    currentSessionToken = null;
    currentSessionUser = null;
  },

  getCurrentUser: (): User | null => {
    return currentSessionUser;
  },

  isAuthenticated: (): boolean => {
    return !!currentSessionUser && !!currentSessionToken;
  },
};
