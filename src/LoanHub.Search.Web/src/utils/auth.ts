export interface StoredAuth {
  token: string;
  user: {
    id: string;
    email: string;
    role: number | string;
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
    jobTitle?: string | null;
    address?: string | null;
    idDocumentNumber?: string | null;
  };
}

const AUTH_STORAGE_KEY = 'loanhub-auth';

export const getStoredAuth = (): StoredAuth | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredAuth;
  } catch (error) {
    console.warn('Failed to parse stored auth data', error);
    return null;
  }
};

export const setStoredAuth = (auth: StoredAuth) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getRoleLabel = (role: number | string) => {
  if (typeof role === 'string') return role.toLowerCase();
  return role === 1 ? 'admin' : 'user';
};
