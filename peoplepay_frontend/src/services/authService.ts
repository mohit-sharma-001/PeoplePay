import { User, Role, RegisterPayload, RegisterResponse, ManagedUser } from '../types/auth';
import { request, setAuthToken, setStoredUser, getStoredUser, getAuthToken } from './api/apiClient';

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

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const identifier = credentials.emailOrUsername.trim();
    const password = credentials.password?.trim() || '';

    if (!identifier) {
      return { success: false, error: 'Please enter your username or email.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Attempt real backend API call POST /api/auth/login/
    const apiRes = await request<any>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({
        username: identifier,
        password: password,
      }),
    });

    if (apiRes.ok && apiRes.data) {
      const respData = apiRes.data.data || apiRes.data;
      const token = respData.token || respData.access || respData.jwt;
      const rawUser = respData.user || respData;

      if (rawUser && rawUser.id) {
        const rolesList: string[] = rawUser.roles || (rawUser.role ? [rawUser.role] : ['Employee']);
        const primaryRole: Role = (rolesList[0] as Role) || 'Employee';

        const userObj: User = {
          id: rawUser.id,
          name: rawUser.first_name && rawUser.last_name
            ? `${rawUser.first_name} ${rawUser.last_name}`
            : rawUser.username || identifier,
          username: rawUser.username || identifier,
          email: rawUser.email || identifier,
          first_name: rawUser.first_name,
          last_name: rawUser.last_name,
          role: primaryRole,
          roles: rolesList,
          employeeId: rawUser.employee_id ? `EMP-${rawUser.employee_id}` : undefined,
          employee_id: rawUser.employee_id,
        };

        setAuthToken(token);
        setStoredUser(userObj);

        return {
          success: true,
          user: userObj,
          token,
        };
      }
    }

    return {
      success: false,
      error: apiRes.errorMsg || 'Invalid username or password.',
    };
  },

  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const apiRes = await request<any>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        username: payload.username,
        password: payload.password,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone || '',
        department: payload.department || '',
        job_position: payload.job_position || '',
      }),
    });

    if (apiRes.ok || apiRes.status === 201) {
      const resp = apiRes.data;
      const respData = resp?.data || resp;
      const token = respData?.token;
      const rawUser = respData?.user;

      if (token && rawUser) {
        const rolesList: string[] = rawUser.roles || ['Employee'];
        const primaryRole: Role = (rolesList[0] as Role) || 'Employee';

        const userObj: User = {
          id: rawUser.id,
          name: `${rawUser.first_name || payload.first_name} ${rawUser.last_name || payload.last_name}`,
          username: rawUser.username || payload.username,
          email: rawUser.email || payload.email,
          first_name: rawUser.first_name || payload.first_name,
          last_name: rawUser.last_name || payload.last_name,
          role: primaryRole,
          roles: rolesList,
          employee_id: rawUser.employee_id,
          employeeId: rawUser.employee_id ? `EMP-${rawUser.employee_id}` : undefined,
        };

        setAuthToken(token);
        setStoredUser(userObj);
      }

      return {
        success: true,
        message: resp?.message || 'Registration successful.',
        data: respData,
      };
    }

    return {
      success: false,
      message: apiRes.errorMsg || 'Registration failed.',
      errors: apiRes.data?.errors,
    };
  },

  getUsers: async (roleFilter?: string): Promise<{ success: boolean; data: ManagedUser[]; error?: string }> => {
    let endpoint = '/api/auth/users/';
    if (roleFilter) {
      endpoint += `?role=${encodeURIComponent(roleFilter)}`;
    }

    const apiRes = await request<any>(endpoint, { method: 'GET' });

    if (apiRes.ok && apiRes.data) {
      const list: ManagedUser[] = Array.isArray(apiRes.data)
        ? apiRes.data
        : apiRes.data.data && Array.isArray(apiRes.data.data)
        ? apiRes.data.data
        : [];
      return { success: true, data: list };
    }

    return { success: false, data: [], error: apiRes.errorMsg || 'Failed to fetch user list.' };
  },

  assignRole: async (userId: number | string, newRole: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    const apiRes = await request<any>(`/api/auth/users/${userId}/assign-role/`, {
      method: 'PATCH',
      body: JSON.stringify({ roles: [newRole] }),
    });

    if (apiRes.ok && apiRes.data) {
      const updated = apiRes.data.data || apiRes.data;

      // Also sync current stored user if updating self
      const currentUser = getStoredUser();
      if (currentUser && String(currentUser.id) === String(userId)) {
        const newRoles = updated.roles || [newRole];
        const updatedSelf = {
          ...currentUser,
          roles: newRoles,
          role: (newRoles[0] as Role) || newRole,
        };
        setStoredUser(updatedSelf);
      }

      return { success: true, data: updated };
    }

    return { success: false, error: apiRes.errorMsg || 'Failed to assign role.' };
  },

  logout: (): void => {
    setAuthToken(null);
    setStoredUser(null);
  },

  getCurrentUser: (): User | null => {
    return getStoredUser();
  },

  isAuthenticated: (): boolean => {
    return !!getStoredUser() && !!getAuthToken();
  },
};
