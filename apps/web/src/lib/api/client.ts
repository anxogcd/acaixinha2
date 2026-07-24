import type { ApiError } from "@acaixinha/shared";
import { useAuthStore } from "../../stores/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function getAccessToken(): Promise<string | null> {
  const auth = useAuthStore.getState();
  if (!auth.accessToken) return null;

  if (auth.expiresAt && Date.now() > auth.expiresAt) {
    try {
      await auth.refreshAuth();
    } catch {
      auth.logout();
      return null;
    }
  }

  return auth.accessToken;
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiError | null = null;
    try {
      errorData = await response.json();
    } catch {
      // noop
    }

    if (response.status === 401) {
      useAuthStore.getState().logout();
    }

    throw new ApiClientError(
      response.status,
      errorData?.code ?? "UNKNOWN",
      errorData?.message ?? response.statusText,
    );
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}