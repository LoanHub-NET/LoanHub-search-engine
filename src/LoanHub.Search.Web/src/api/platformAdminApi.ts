import { ApiError, getApiBaseUrl, getAuthToken, storeAuthSession } from './apiConfig';

export interface BankApiKeyResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
  createdByUserId?: string | null;
}

export interface BankApiKeyCreatedResponse extends BankApiKeyResponse {
  apiKey: string;
}

interface PlatformAdminAuthResponse {
  id: string;
  email: string;
  role: string | number;
  firstName?: string | null;
  lastName?: string | null;
  token: string;
}

const handleAuthResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Auth request failed with status ${response.status}.`, response.status);
  }

  const data = (await response.json()) as PlatformAdminAuthResponse;
  storeAuthSession({
    id: data.id,
    email: data.email,
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    token: data.token,
  });
  return data;
};

export const loginPlatformAdmin = async (username: string, password: string) => {
  const response = await fetch(`${getApiBaseUrl()}/api/platform-admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  return handleAuthResponse(response);
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Request failed with status ${response.status}.`, response.status);
  }
  return (await response.json()) as T;
};

export const listBankApiKeys = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError('Not authenticated.', 401);
  }

  const response = await fetch(`${getApiBaseUrl()}/api/admin/bank-api-keys`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<BankApiKeyResponse[]>(response);
};

export const createBankApiKey = async (name: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError('Not authenticated.', 401);
  }

  const response = await fetch(`${getApiBaseUrl()}/api/admin/bank-api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  return handleResponse<BankApiKeyCreatedResponse>(response);
};

export const revokeBankApiKey = async (id: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new ApiError('Not authenticated.', 401);
  }

  const response = await fetch(`${getApiBaseUrl()}/api/admin/bank-api-keys/${id}/revoke`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<BankApiKeyResponse>(response);
};
