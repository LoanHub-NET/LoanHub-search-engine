import type { LoanSearchQuery } from '../types';

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

const DEFAULT_TIMEOUT_MS = 15000;

const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return baseUrl?.trim() ?? '';
};

export const fetchSearchResults = async (query: LoanSearchQuery): Promise<SearchApiResponse> => {
  const baseUrl = getApiBaseUrl();
  const hasFinancialDetails =
    query.monthlyIncome !== undefined ||
    query.livingCosts !== undefined ||
    query.dependents !== undefined;

  const endpoint = hasFinancialDetails ? '/api/search/detailed' : '/api/search/quick';
  const payload = hasFinancialDetails
    ? {
        amount: query.amount,
        durationMonths: query.duration,
        income: query.monthlyIncome,
        livingCosts: query.livingCosts,
        dependents: query.dependents,
      }
    : {
        amount: query.amount,
        durationMonths: query.duration,
      };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Search request failed with status ${response.status}.`);
    }

    return (await response.json()) as SearchApiResponse;
  } finally {
    clearTimeout(timeout);
  }
};
