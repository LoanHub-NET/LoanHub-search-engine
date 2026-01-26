const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export interface OfferDto {
  provider: string;
  providerOfferId: string;
  installment: number;
  apr: number;
  totalCost: number;
  validUntil: string;
}

export interface ProviderCallResult {
  provider: string;
  status: string;
  durationMs: number;
  error?: string | null;
}

export interface QuickSearchResponse {
  inquiryId: string;
  offers: OfferDto[];
  sources: ProviderCallResult[];
}

export interface DetailedSearchResponse extends QuickSearchResponse {}

export interface OfferSnapshot {
  provider: string;
  providerOfferId: string;
  installment: number;
  apr: number;
  totalCost: number;
  amount: number;
  durationMonths: number;
  validUntil: string;
}

export interface OfferSelectionResponse {
  id: string;
  inquiryId: string;
  selectedOffer: OfferSnapshot;
  recalculatedOffer?: OfferSnapshot | null;
  income?: number | null;
  livingCosts?: number | null;
  dependents?: number | null;
  applicationId?: string | null;
  appliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationResponse {
  id: string;
  userId?: string | null;
  applicantEmail: string;
  status: number | string;
  rejectReason?: string | null;
  contractReadyAt?: string | null;
  signedContractFileName?: string | null;
  signedContractBlobName?: string | null;
  signedContractContentType?: string | null;
  signedContractReceivedAt?: string | null;
  finalApprovedAt?: string | null;
  applicantDetails: {
    firstName: string;
    lastName: string;
    age: number;
    jobTitle: string;
    address: string;
    idDocumentNumber: string;
  };
  offerSnapshot: OfferSnapshot;
  createdAt: string;
  updatedAt: string;
  statusHistory: Array<{
    status: number | string;
    changedAt: string;
    reason?: string | null;
  }>;
}

export interface AuthResponse {
  id: string;
  email: string;
  role: number | string;
  firstName?: string | null;
  lastName?: string | null;
  age?: number | null;
  jobTitle?: string | null;
  address?: string | null;
  idDocumentNumber?: string | null;
  externalIdentities: Array<{ id: string; provider: string; subject: string }>;
  createdAt: string;
  updatedAt: string;
  token: string;
}

export interface AdminApplicationsResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const toJson = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || response.statusText);
  }
  return response.json() as Promise<T>;
};

const getHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : null),
});

export const searchQuick = async (payload: { amount: number; durationMonths: number }) => {
  const response = await fetch(`${API_BASE_URL}/api/search/quick`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return toJson<QuickSearchResponse>(response);
};

export const searchDetailed = async (payload: {
  amount: number;
  durationMonths: number;
  income: number;
  livingCosts: number;
  dependents: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/search/detailed`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return toJson<DetailedSearchResponse>(response);
};

export const createOfferSelection = async (payload: {
  inquiryId: string;
  provider: string;
  providerOfferId: string;
  installment: number;
  apr: number;
  totalCost: number;
  amount: number;
  durationMonths: number;
  validUntil: string;
  income?: number;
  livingCosts?: number;
  dependents?: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/api/offer-selections`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return toJson<OfferSelectionResponse>(response);
};

export const recalculateOffer = async (
  selectionId: string,
  payload: { income: number; livingCosts: number; dependents: number },
) => {
  const response = await fetch(`${API_BASE_URL}/api/offer-selections/${selectionId}/recalculate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return toJson<OfferSelectionResponse>(response);
};

export const applyOfferSelection = async (
  selectionId: string,
  payload: {
    applicantEmail: string;
    firstName: string;
    lastName: string;
    age: number;
    jobTitle: string;
    address: string;
    idDocumentNumber: string;
  },
) => {
  const response = await fetch(`${API_BASE_URL}/api/offer-selections/${selectionId}/apply`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return toJson<ApplicationResponse>(response);
};

export const loginUser = async (payload: { email: string; password: string }) => {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return toJson<AuthResponse>(response);
};

export const registerUser = async (payload: {
  email: string;
  password: string;
  profile: {
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
    jobTitle?: string | null;
    address?: string | null;
    idDocumentNumber?: string | null;
  };
}) => {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  return toJson<AuthResponse>(response);
};

export const listAdminApplications = async (
  token: string,
  params: {
    applicantEmail?: string;
    status?: string;
    provider?: string;
    createdFrom?: string;
    createdTo?: string;
    updatedFrom?: string;
    updatedTo?: string;
    page?: number;
    pageSize?: number;
  } = {},
) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });

  const response = await fetch(`${API_BASE_URL}/api/admin/applications?${search.toString()}`, {
    headers: getHeaders(token),
  });

  return toJson<AdminApplicationsResponse<{
    id: string;
    applicantEmail: string;
    status: number | string;
    createdAt: string;
    updatedAt: string;
    provider: string;
    amount: number;
    rejectReason?: string | null;
  }>>(response);
};

export const getAdminApplication = async (token: string, id: string) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/applications/${id}`, {
    headers: getHeaders(token),
  });

  return toJson<ApplicationResponse>(response);
};

export const acceptAdminApplication = async (token: string, id: string) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/applications/${id}/preliminary-accept`, {
    method: 'POST',
    headers: getHeaders(token),
  });

  return toJson<ApplicationResponse>(response);
};

export const rejectAdminApplication = async (token: string, id: string, reason: string) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/applications/${id}/reject`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ reason }),
  });

  return toJson<ApplicationResponse>(response);
};

export const listUserApplications = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/applications/me`, {
    headers: getHeaders(token),
  });

  return toJson<ApplicationResponse[]>(response);
};

export const getUserProfile = async (token: string, id: string) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    headers: getHeaders(token),
  });

  return toJson<AuthResponse>(response);
};

export const updateUserProfile = async (
  token: string,
  id: string,
  payload: {
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
    jobTitle?: string | null;
    address?: string | null;
    idDocumentNumber?: string | null;
  },
) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  return toJson<AuthResponse>(response);
};
