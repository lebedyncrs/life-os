const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText;
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j.message) {
        message = j.message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
