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
}

export interface ApplicationResponse {
  id: string;
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

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
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
    const message = await response.text();
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
    const message = await response.text();
    throw new ApiError(
      message || `Application request failed with status ${response.status}.`,
      response.status,
    );
  }

  return (await response.json()) as ApplicationResponse[];
};
