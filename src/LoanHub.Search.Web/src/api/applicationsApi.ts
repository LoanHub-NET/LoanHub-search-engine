import { ApiError, getApiBaseUrl, getAuthToken } from './apiConfig';

export interface ApplicationRequestBase {
  provider: string;
  providerOfferId: string;
  installment: number;
  apr: number;
  totalCost: number;
  amount: number;
  durationMonths: number;
  validUntil: string;
}

export interface ApplicationRequest extends ApplicationRequestBase {
  applicantEmail: string;
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

export interface ApplicationResponse {
  id: string;
  bankId?: string | null;
  assignedAdminId?: string | null;
  applicantEmail: string;
  status: string | number;
  createdAt: string;
  offerSnapshot: {
    provider: string;
    providerOfferId: string;
    installment: number;
    apr: number;
    totalCost: number;
    amount: number;
    durationMonths: number;
    validUntil: string;
  };
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

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(
      message || `Application request failed with status ${response.status}.`,
      response.status,
    );
  }
  return (await response.json()) as ApplicationResponse;
};

export const createApplication = async (payload: ApplicationRequest) => {
  const response = await fetch(`${getApiBaseUrl()}/api/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const createApplicationForCurrentUser = async (payload: ApplicationRequestBase) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to submit this application.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/applications/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const listApplicationsForCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to view applications.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/applications/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(
      message || `Application request failed with status ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as ApplicationResponse[];
};

export const listApplicationsByEmail = async (email: string) => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/applications?applicantEmail=${encodeURIComponent(email)}`,
  );

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(
      message || `Application request failed with status ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as ApplicationResponse[];
};

export const cancelApplicationForCurrentUser = async (applicationId: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to cancel this application.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/applications/${applicationId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
};
