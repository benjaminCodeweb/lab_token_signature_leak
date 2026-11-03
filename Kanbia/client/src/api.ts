// Cliente de la API de Drivia. El token se guarda en localStorage como
// `kb_token`; el servidor pone también una cookie del mismo nombre.
const TOKEN_KEY = 'kb_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface ApiError {
  status: number;
  body: any;
}

async function request(method: string, path: string, body?: any): Promise<any> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const init: RequestInit = { method, headers, credentials: 'include' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  const ct = res.headers.get('content-type') || '';
  const payload = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw { status: res.status, body: payload } as ApiError;
  return payload;
}

export const api = {
  get: (p: string) => request('GET', p),
  post: (p: string, body?: any) => request('POST', p, body),
  delete: (p: string) => request('DELETE', p),
};

// Sube un fichero (multipart) para el botón "Subir".
export async function uploadFile(file: File, name: string, parent?: number): Promise<any> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', name);
  if (parent != null) fd.append('parent', String(parent));
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch('/api/files', { method: 'POST', headers, credentials: 'include', body: fd });
  if (!res.ok) throw { status: res.status, body: await res.json().catch(() => ({})) } as ApiError;
  return res.json();
}
