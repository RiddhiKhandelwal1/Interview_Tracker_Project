/**
 * Client-side API service - handles all HTTP calls to Next.js API routes.
 * Manages access token storage and automatic refresh.
 */

let accessToken: string | null = null;

export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      accessToken = data.data.accessToken;
      return true;
    }
    return false;
  } catch { return false; }
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  // Auto-refresh on 401
  if (res.status === 401 && url !== '/api/auth/refresh') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${accessToken}`);
      res = await fetch(url, { ...options, headers, credentials: 'include' });
    }
  }

  return res;
}

export async function apiGet<T = unknown>(url: string): Promise<T> {
  const res = await apiFetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data.data ?? data;
}

export async function apiPost<T = unknown>(url: string, body?: unknown): Promise<T> {
  const res = await apiFetch(url, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data.data ?? data;
}

export async function apiPatch<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await apiFetch(url, { method: 'PATCH', body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data.data ?? data;
}

export async function apiDelete(url: string): Promise<void> {
  const res = await apiFetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Request failed');
  }
}
