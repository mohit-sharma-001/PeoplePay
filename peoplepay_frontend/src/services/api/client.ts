// Standard response structure for API boundary
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  total?: number;
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

    if (!res.ok) {
      if (fallbackData !== undefined) {
        return { data: fallbackData, status: res.status, message: res.statusText };
      }
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const responseData = await res.json();

    // Check if Django response uses envelope wrapper { status, data, message } or standard JSON array/dict
    if (responseData && typeof responseData === 'object' && 'data' in responseData && 'status' in responseData) {
      return {
        data: responseData.data as T,
        status: res.status,
        message: responseData.message || 'Success',
      };
    }

    return {
      data: responseData as T,
      status: res.status,
      message: 'Success',
    };
  } catch (error) {
    console.warn(`API call to ${url} failed, using fallback data if available:`, error);
    if (fallbackData !== undefined) {
      return { data: fallbackData, status: 200, message: 'Loaded fallback data' };
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
