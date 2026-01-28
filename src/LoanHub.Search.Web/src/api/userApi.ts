import { ApiError, getApiBaseUrl, getAuthToken, storeAuthSession } from './apiConfig';

export interface AuthResponse {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  jobTitle?: string | null;
  address?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  monthlyIncome?: number | null;
  livingCosts?: number | null;
  dependents?: number | null;
  idDocumentNumber?: string | null;
  externalIdentities: Array<{ id: string; provider: string; subject: string }>;
  createdAt: string;
  updatedAt: string;
  token: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role?: 'user' | 'admin';
  bankName?: string | null;
  bankApiEndpoint?: string | null;
  bankApiKey?: string | null;
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
    jobTitle?: string | null;
    address?: string | null;
    phone?: string | null;
    dateOfBirth?: string | null;
    monthlyIncome?: number | null;
    livingCosts?: number | null;
    dependents?: number | null;
    idDocumentNumber?: string | null;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

const handleAuthResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Auth request failed with status ${response.status}.`, response.status);
  }
  const data = (await response.json()) as AuthResponse;
  storeAuthSession({
    id: data.id,
    email: data.email,
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    address: data.address,
    jobTitle: data.jobTitle,
    monthlyIncome: data.monthlyIncome,
    livingCosts: data.livingCosts,
    dependents: data.dependents,
    idDocumentNumber: data.idDocumentNumber,
    token: data.token,
  });
  return data;
};

export const registerUser = async (payload: RegisterPayload) => {
  const response = await fetch(`${getApiBaseUrl()}/api/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleAuthResponse(response);
};

export const loginUser = async (payload: LoginPayload) => {
  const response = await fetch(`${getApiBaseUrl()}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleAuthResponse(response);
};

export const updateUserProfile = async (
  userId: string,
  profile: RegisterPayload['profile'],
) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to update your profile.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Profile update failed with status ${response.status}.`, response.status);
  }

  const data = (await response.json()) as AuthResponse;
  storeAuthSession({
    id: data.id,
    email: data.email,
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    address: data.address,
    jobTitle: data.jobTitle,
    monthlyIncome: data.monthlyIncome,
    livingCosts: data.livingCosts,
    dependents: data.dependents,
    idDocumentNumber: data.idDocumentNumber,
    token: data.token,
  });
  return data;
};
