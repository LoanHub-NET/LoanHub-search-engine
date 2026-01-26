export interface SearchApiOffer {
  provider: string;
  providerOfferId: string;
  installment: number;
  apr: number;
  totalCost: number;
  validUntil: string;
}

export interface SearchApiSource {
  provider: string;
  status: string;
  durationMs: number;
  error?: string | null;
}

export interface SearchApiResponse {
  inquiryId: string;
  offers: SearchApiOffer[];
  sources: SearchApiSource[];
}

export interface QuickSearchPayload {
  amount: number;
  durationMonths: number;
}

export interface DetailedSearchPayload extends QuickSearchPayload {
  income: number;
  livingCosts: number;
  dependents: number;
}

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const request = async <T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const searchQuick = (payload: QuickSearchPayload, signal?: AbortSignal) =>
  request<SearchApiResponse>('/api/search/quick', payload, signal);

export const searchDetailed = (payload: DetailedSearchPayload, signal?: AbortSignal) =>
  request<SearchApiResponse>('/api/search/detailed', payload, signal);
