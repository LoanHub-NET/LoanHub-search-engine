import { ApiError, getApiBaseUrl, getAuthToken } from './apiConfig';

export interface AdminDocumentResponse {
  blobName: string;
  originalFileName: string;
  contentType: string;
  documentType: string;
  documentSide: string;
  sizeBytes: number;
  uploadedAt: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Admin document request failed with status ${response.status}.`, response.status);
  }
  return (await response.json()) as AdminDocumentResponse[];
};

const handleUrlResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Admin document request failed with status ${response.status}.`, response.status);
  }
  const data = (await response.json()) as { url: string; expiresAt: string };
  return data.url;
};

export const listApplicationDocuments = async (applicationId: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in as admin to view documents.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/applications/${applicationId}/documents`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
};

export const getApplicationDocumentUrl = async (applicationId: string, blobName: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in as admin to view documents.');
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/applications/${applicationId}/documents/url?blobName=${encodeURIComponent(blobName)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return handleUrlResponse(response);
};
