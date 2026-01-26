import { ApiError, getApiBaseUrl, getAuthToken } from './apiConfig';

export interface AdminApplicationSummary {
  id: string;
  applicantEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  provider: string;
  amount: number;
  rejectReason?: string | null;
}

export interface AdminApplicationsPage {
  items: AdminApplicationSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AdminApplicantDetails {
  firstName: string;
  lastName: string;
  age: number;
  jobTitle: string;
  address: string;
  idDocumentNumber: string;
}

export interface AdminOfferSnapshot {
  provider: string;
  providerOfferId: string;
  installment: number;
  apr: number;
  totalCost: number;
  amount: number;
  durationMonths: number;
  validUntil: string;
}

export interface AdminStatusHistoryEntry {
  status: string;
  changedAt: string;
  reason?: string | null;
}

export interface AdminApplicationResponse {
  id: string;
  userId?: string | null;
  applicantEmail: string;
  status: string;
  rejectReason?: string | null;
  contractReadyAt?: string | null;
  signedContractFileName?: string | null;
  signedContractBlobName?: string | null;
  signedContractContentType?: string | null;
  signedContractReceivedAt?: string | null;
  finalApprovedAt?: string | null;
  applicantDetails: AdminApplicantDetails;
  offerSnapshot: AdminOfferSnapshot;
  createdAt: string;
  updatedAt: string;
  statusHistory: AdminStatusHistoryEntry[];
}

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
    try {
      const payload = (await response.json()) as {
        title?: string;
        detail?: string;
        message?: string;
      };
      return payload.detail || payload.title || payload.message;
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
};

const handleResponse = async <T>(response: Response) => {
  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(message || `Request failed with status ${response.status}.`, response.status);
  }
  return (await response.json()) as T;
};

export interface AdminApplicationsQuery {
  applicantEmail?: string;
  status?: string;
  provider?: string;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  pageSize?: number;
}

const buildQueryString = (query?: AdminApplicationsQuery) => {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const listAdminApplications = async (query?: AdminApplicationsQuery) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in as an admin to view applications.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/admin/applications${buildQueryString(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<AdminApplicationsPage>(response);
};

export const getAdminApplication = async (id: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in as an admin to view applications.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/admin/applications/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<AdminApplicationResponse>(response);
};

export const preliminarilyAcceptApplication = async (id: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in as an admin to update applications.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/admin/applications/${id}/preliminary-accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<AdminApplicationResponse>(response);
};

export const rejectApplication = async (id: string, reason: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in as an admin to update applications.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/admin/applications/${id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  return handleResponse<AdminApplicationResponse>(response);
};
