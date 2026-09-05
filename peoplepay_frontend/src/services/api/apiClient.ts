const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export function getAuthToken(): string | null {
  return localStorage.getItem('peoplepay_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('peoplepay_token', token);
  } else {
    localStorage.removeItem('peoplepay_token');
  }
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem('peoplepay_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: any | null): void {
  if (user) {
    localStorage.setItem('peoplepay_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('peoplepay_user');
  }
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T; errorMsg?: string }> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Token ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const status = res.status;
    let data: any = null;

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : {};
    }

    return {
      ok: res.ok,
      status,
      data,
      errorMsg: !res.ok ? data?.message || data?.detail || 'Request failed' : undefined,
    };
  } catch (err: any) {
    console.warn(`API request error on ${endpoint}:`, err);
    return {
      ok: false,
      status: 0,
      data: null as any,
      errorMsg: err.message || 'Network Error',
    };
  }
}
