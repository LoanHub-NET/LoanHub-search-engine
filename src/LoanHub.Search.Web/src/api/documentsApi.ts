import { ApiError, getApiBaseUrl, getAuthToken } from './apiConfig';

export interface DocumentUploadResponse {
  blobName: string;
  originalFileName: string;
  contentType: string;
  documentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Document request failed with status ${response.status}.`, response.status);
  }
  return (await response.json()) as DocumentUploadResponse;
};

export const uploadApplicationDocument = async (
  applicationId: string,
  file: File,
  documentType: string,
  side?: 'Front' | 'Back',
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  if (side) {
    formData.append('side', side);
  }

  const token = getAuthToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${getApiBaseUrl()}/api/applications/${applicationId}/documents`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleResponse(response);
};
