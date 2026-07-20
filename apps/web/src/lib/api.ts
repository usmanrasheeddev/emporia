import type { ApiError } from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://nexastoreserver-production.up.railway.app/api/v1';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export class ApiClientError extends Error {
  public status: number;
  public errors: Record<string, string[]> | undefined;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
  }
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshQueue: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }


  /** Attempt to silently refresh the access token using the stored refresh token */
  private async tryRefreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const newAccessToken = data?.data?.accessToken;
      const newRefreshToken = data?.data?.refreshToken;

      if (newAccessToken) {
        localStorage.setItem(TOKEN_KEY, newAccessToken);
        if (newRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        return newAccessToken;
      }
    } catch {
      // Refresh failed silently
    }
    return null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const hasBody = body !== undefined;

    const makeRequest = (token?: string | null) =>
      fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(hasBody && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: hasBody
          ? body instanceof FormData
            ? body
            : JSON.stringify(body)
          : undefined,
      });

    let response = await makeRequest(this.getAuthToken());

    // Auto-refresh on 401 Unauthorized
    if (response.status === 401 && !path.includes('/auth/')) {
      if (this.isRefreshing) {
        // Queue the request until refresh completes
        const newToken = await new Promise<string>((resolve) => {
          this.refreshQueue.push(resolve);
        });
        response = await makeRequest(newToken);
      } else {
        this.isRefreshing = true;
        const newToken = await this.tryRefreshToken();
        this.isRefreshing = false;

        if (newToken) {
          // Flush pending queue
          this.refreshQueue.forEach((resolve) => resolve(newToken));
          this.refreshQueue = [];
          response = await makeRequest(newToken);
        } else {
          // Refresh failed — clear storage and redirect to login
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          this.refreshQueue = [];
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new ApiClientError('Session expired. Please log in again.', 401);
        }
      }
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errors: Record<string, string[]> | undefined;

      try {
        const errorData = (await response.json()) as ApiError;
        errorMessage = errorData.message;
        errors = errorData.errors;
      } catch {
        // Response body was not valid JSON; use default message
      }

      throw new ApiClientError(errorMessage, response.status, errors);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const data = (await response.json()) as T;
    return data;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  /** Upload files using multipart/form-data */
  async upload<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>('POST', path, formData);
  }
}

export const api = new ApiClient(BASE_URL);
export { TOKEN_KEY, REFRESH_TOKEN_KEY };
