export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  total?: number;
  errors?: Record<string, any>;
  ok?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: any;
  errors?: Record<string, any>;

  constructor(status: number, message: string, data?: any, errors?: Record<string, any>) {
    super(message);
    this.status = status;
    this.data = data;
    this.errors = errors;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    let responseData: any = null;
    try {
      responseData = await res.json();
    } catch {
      responseData = null;
    }

    if (!res.ok) {
      const errMsg =
        responseData?.message ||
        responseData?.detail ||
        (typeof responseData === 'string' ? responseData : `HTTP Error: ${res.status}`);
      const errDict = responseData?.errors || (typeof responseData === 'object' ? responseData : undefined);

      // Do NOT swallow 400 validation or 403 permission errors with fallback data
      if (fallbackData !== undefined && res.status !== 400 && res.status !== 403 && res.status !== 404) {
        return { data: fallbackData, status: res.status, message: res.statusText };
      }
      throw new ApiError(res.status, errMsg, responseData, errDict);
    }

    // Check if Django response uses envelope wrapper { status, data, message } or standard JSON array/dict
    if (responseData && typeof responseData === 'object' && 'data' in responseData && 'status' in responseData) {
      return {
        data: responseData.data as T,
        status: res.status,
        message: responseData.message || 'Success',
        ok: true,
      };
    }

    return {
      data: responseData as T,
      status: res.status,
      message: 'Success',
      ok: true,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.warn(`API call to ${url} failed, using fallback data if available:`, error);
    if (fallbackData !== undefined) {
      return { data: fallbackData, status: 200, message: 'Loaded fallback data', ok: true };
    }
    throw error;
  }
}

// Simulated network latency helper for mock mode
export async function mockFetch<T>(data: T, delayMs = 150): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data,
        status: 200,
        message: 'Success',
      });
    }, delayMs);
  });
}
