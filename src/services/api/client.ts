// Standard response structure for API boundary
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  total?: number;
}

// Simulated network latency for realistic UX state testing
const SIMULATED_LATENCY_MS = 250;

export async function mockFetch<T>(data: T, delayMs = SIMULATED_LATENCY_MS): Promise<ApiResponse<T>> {
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
