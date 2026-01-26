export interface AuthSession {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  jobTitle?: string | null;
  monthlyIncome?: number | null;
  livingCosts?: number | null;
  dependents?: number | null;
  idDocumentNumber?: string | null;
  token: string;
}

export interface PendingProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  jobTitle?: string;
  monthlyIncome?: number;
  livingCosts?: number;
  dependents?: number;
  idDocumentNumber?: string;
}

const AUTH_STORAGE_KEY = 'loanhub_auth';
const PENDING_PROFILE_KEY = 'loanhub_pending_profile';

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

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const storePendingProfile = (profile: PendingProfile) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(profile));
};

export const getPendingProfile = (): PendingProfile | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(PENDING_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingProfile;
  } catch {
    return null;
  }
};

export const clearPendingProfile = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PENDING_PROFILE_KEY);
};
