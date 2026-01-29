import { ApiError, getApiBaseUrl, getAuthToken } from './apiConfig';

export interface UserDocumentResponse {
  blobName: string;
  originalFileName: string;
  contentType: string;
  documentType: string;
  documentSide: string;
  sizeBytes: number;
  uploadedAt: string;
}

const handleListResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `User document request failed with status ${response.status}.`, response.status);
  }
  return (await response.json()) as UserDocumentResponse[];
};

const handleUrlResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `User document request failed with status ${response.status}.`, response.status);
  }
  const data = (await response.json()) as { url: string; expiresAt: string };
  return data.url;
};

export const listUserApplicationDocuments = async (applicationId: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to view documents.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/applications/${applicationId}/documents/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleListResponse(response);
};

export const cloneUserApplicationDocuments = async (
  applicationId: string,
  blobNames: string[],
) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to reuse documents.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/applications/${applicationId}/documents/clone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ blobNames }),
  });

  return handleListResponse(response);
};

export const getUserApplicationDocumentUrl = async (applicationId: string, blobName: string) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be logged in to view documents.');
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/applications/${applicationId}/documents/user/url?blobName=${encodeURIComponent(blobName)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return handleUrlResponse(response);
};
