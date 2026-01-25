/**
 * Loan search query parameters
 */
export interface LoanSearchQuery {
  amount: number;
  duration: number;
  monthlyIncome?: number;
  livingCosts?: number;
  dependents?: number;
}

/**
 * Quick search form data (anonymous search)
 */
export interface QuickSearchFormData {
  amount: string;
  duration: string;
}

/**
 * Extended search form data (with financial details)
 */
export interface ExtendedSearchFormData extends QuickSearchFormData {
  monthlyIncome: string;
  livingCosts: string;
  dependents: string;
}

/**
 * Loan offer from a provider
 */
export interface LoanOffer {
  id: string;
  providerId: string;
  providerName: string;
  providerLogo?: string;
  amount: number;
  duration: number;
  monthlyInstallment: number;
  interestRate: number;
  apr: number; // Annual Percentage Rate
  totalRepayment: number;
  isPersonalized: boolean;
  validUntil: Date;
  requirements?: string[];
}

/**
 * Loan provider information
 */
export interface LoanProvider {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  rating?: number;
}

/**
 * Search results response
 */
export interface SearchResultsResponse {
  query: LoanSearchQuery;
  offers: LoanOffer[];
  searchedAt: Date;
  providers: LoanProvider[];
  totalProviders: number;
  respondedProviders: number;
}

/**
 * Offer selection by user
 */
export interface OfferSelection {
  offerId: string;
  selectedAt: Date;
  status: OfferStatus;
}

/**
 * Possible statuses for an offer/application
 */
export type OfferStatus = 
  | 'new'
  | 'preliminarily_accepted'
  | 'accepted'
  | 'granted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

/**
 * Status display information
 */
export interface StatusInfo {
  label: string;
  color: string;
  description: string;
}

/**
 * Map of status to display info
 */
export const OFFER_STATUS_INFO: Record<OfferStatus, StatusInfo> = {
  new: {
    label: 'New',
    color: '#3b82f6',
    description: 'Your application has been submitted',
  },
  preliminarily_accepted: {
    label: 'Preliminarily Accepted',
    color: '#f59e0b',
    description: 'Initial review passed, awaiting final decision',
  },
  accepted: {
    label: 'Accepted',
    color: '#10b981',
    description: 'Your loan has been approved',
  },
  granted: {
    label: 'Granted',
    color: '#059669',
    description: 'Loan has been disbursed',
  },
  rejected: {
    label: 'Rejected',
    color: '#ef4444',
    description: 'Unfortunately, your application was not approved',
  },
  expired: {
    label: 'Expired',
    color: '#6b7280',
    description: 'This offer has expired',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6b7280',
    description: 'You cancelled this application',
  },
};
