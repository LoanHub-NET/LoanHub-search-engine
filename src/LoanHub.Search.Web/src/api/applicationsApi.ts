import { getApiBaseUrl, getAuthToken } from './apiConfig';

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
  status: string;
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
    throw new Error(message || `Application request failed with status ${response.status}.`);
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
