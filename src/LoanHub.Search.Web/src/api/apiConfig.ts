export interface AuthSession {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  token: string;
}

const AUTH_STORAGE_KEY = 'loanhub_auth';

export const getApiBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const apiPort = port === '8080' ? port : '8080';
      return `${protocol}//${hostname}:${apiPort}`;
    }
  }

  return '';
};

export const storeAuthSession = (session: AuthSession) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getAuthSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const getAuthToken = () => getAuthSession()?.token ?? null;
