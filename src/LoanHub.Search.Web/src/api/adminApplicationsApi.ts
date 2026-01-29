import { ApiError, getApiBaseUrl, getAuthToken } from './apiConfig';

export interface AdminApplicantDetails {
  firstName: string;
  lastName: string;
  age: number;
  jobTitle: string;
  address: string;
  idDocumentNumber: string;
  monthlyIncome?: number | null;
  livingCosts?: number | null;
  dependents?: number | null;
  phone?: string | null;
  dateOfBirth?: string | null;
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
  status: number | string;
  changedAt: string;
  reason?: string | null;
}

export interface AdminApplicationResponse {
  id: string;
  userId?: string | null;
  bankId?: string | null;
  assignedAdminId?: string | null;
  applicantEmail: string;
  status: number | string;
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

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const readErrorMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
    try {
      const payload = (await response.json()) as { title?: string; detail?: string; message?: string };
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
    throw new ApiError(
      message || `Admin application request failed with status ${response.status}.`,
      response.status,
    );
  }
  return (await response.json()) as T;
};

export const listAdminApplications = async (pageSize = 200) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to view admin applications.');
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/admin/applications?page=1&pageSize=${pageSize}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return handleResponse<PagedResponse<AdminApplicationResponse>>(response);
};

export const preliminarilyAcceptApplication = async (applicationId: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to update applications.');
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/admin/applications/${applicationId}/preliminary-accept`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return handleResponse<AdminApplicationResponse>(response);
};

export const rejectAdminApplication = async (applicationId: string, reason: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to update applications.');
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/admin/applications/${applicationId}/reject`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    },
  );

  return handleResponse<AdminApplicationResponse>(response);
};
