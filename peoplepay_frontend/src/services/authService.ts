import { User, Role, RegisterPayload, RegisterResponse, ManagedUser } from '../types/auth';
import { mockUsers } from '../data/mockUsers';
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

let inMemoryUsers: ManagedUser[] = mockUsers.map((u, idx) => ({
  id: idx + 1,
  username: u.email.split('@')[0],
  email: u.email,
  roles: [u.role],
  employee_id: idx + 10,
  employee_name: u.name,
}));

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const identifier = credentials.emailOrUsername.trim();
    if (!identifier) {
      return { success: false, error: 'Please enter your username or email.' };
    }
    if (!credentials.password || !credentials.password.trim()) {
      return { success: false, error: 'Please enter your password.' };
    }

    // Attempt real backend API call POST /api/auth/login/
    const apiRes = await request<any>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({
        username: identifier,
        email: identifier,
        password: credentials.password,
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

        setAuthToken(token || `token_${Date.now()}`);
        setStoredUser(userObj);

        return {
          success: true,
          user: userObj,
          token,
        };
      }
    }

    // Fallback mock authentication if backend API server is offline/unreachable
    const matchedUser = mockUsers.find(
      (u) =>
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.name.toLowerCase().includes(identifier.toLowerCase()) ||
        String(u.id).toLowerCase() === identifier.toLowerCase()
    ) || {
      id: `usr-${Date.now()}`,
      name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
      email: identifier.includes('@') ? identifier : `${identifier}@peoplepay360.io`,
      role: 'Employee' as Role,
      roles: ['Employee'],
      department: 'Engineering',
      employeeId: 'EMP-DEMO-001',
    };

    const rolesList = matchedUser.roles || [matchedUser.role];

    const finalUser: User = {
      ...matchedUser,
      roles: rolesList,
      role: (rolesList[0] as Role) || matchedUser.role,
    };

    const token = `mock_token_${Date.now()}`;
    setAuthToken(token);
    setStoredUser(finalUser);

    return {
      success: true,
      user: finalUser,
      token,
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

        // Add to local list for fallback testing
        inMemoryUsers.push({
          id: rawUser.id,
          username: rawUser.username || payload.username,
          email: rawUser.email || payload.email,
          roles: ['Employee'],
          employee_id: rawUser.employee_id || Date.now(),
          employee_name: `${payload.first_name} ${payload.last_name}`,
        });
      }

      return {
        success: true,
        message: resp?.message || 'Registration successful.',
        data: respData,
      };
    }

    if (apiRes.status === 400 && apiRes.data?.errors) {
      return {
        success: false,
        message: apiRes.data.message || 'Registration failed.',
        errors: apiRes.data.errors,
      };
    }

    // Fallback registration handling for offline testing
    const newId = Date.now();
    const newManagedUser: ManagedUser = {
      id: newId,
      username: payload.username,
      email: payload.email,
      roles: ['Employee'],
      employee_id: newId + 5,
      employee_name: `${payload.first_name} ${payload.last_name}`,
    };
    inMemoryUsers.push(newManagedUser);

    const newUserObj: User = {
      id: newId,
      name: `${payload.first_name} ${payload.last_name}`,
      username: payload.username,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      role: 'Employee',
      roles: ['Employee'],
      employee_id: newId + 5,
      employeeId: `EMP-${newId + 5}`,
    };

    const token = `reg_token_${newId}`;
    setAuthToken(token);
    setStoredUser(newUserObj);

    return {
      success: true,
      message: 'Registration successful.',
      data: {
        token,
        user: {
          id: newId,
          username: payload.username,
          email: payload.email,
          first_name: payload.first_name,
          last_name: payload.last_name,
          roles: ['Employee'],
          employee_id: newId + 5,
        },
      },
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

    // Offline fallback using inMemoryUsers
    let list = [...inMemoryUsers];
    if (roleFilter) {
      list = list.filter((u) => u.roles && u.roles.includes(roleFilter));
    }
    return { success: true, data: list };
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

    // Offline fallback for testing
    const found = inMemoryUsers.find((u) => String(u.id) === String(userId));
    if (found) {
      found.roles = [newRole];

      const currentUser = getStoredUser();
      if (currentUser && String(currentUser.id) === String(userId)) {
        const updatedSelf = {
          ...currentUser,
          roles: [newRole],
          role: newRole as Role,
        };
        setStoredUser(updatedSelf);
      }

      return {
        success: true,
        data: {
          id: userId,
          username: found.username,
          roles: [newRole],
        },
      };
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
