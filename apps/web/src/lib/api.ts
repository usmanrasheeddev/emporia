import type { ApiError } from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://nexastoreserver-production.up.railway.app/api/v1';

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

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private buildHeaders(hasBody: boolean): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const hasBody = body !== undefined;

    const response = await fetch(url, {
      method,
      headers: this.buildHeaders(hasBody),
      body: hasBody ? JSON.stringify(body) : undefined,
    });

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

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}

export const api = new ApiClient(BASE_URL);
