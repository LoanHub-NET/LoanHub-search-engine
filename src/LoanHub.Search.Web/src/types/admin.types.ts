import type { OfferStatus } from './loan.types';

/**
 * Admin-specific application status (includes rejected)
 */
export type AdminApplicationStatus = OfferStatus;

/**
 * Status filter options for admin dashboard
 */
export type StatusFilter = AdminApplicationStatus | 'all';

/**
 * Loan application with full details for admin review
 */
export interface LoanApplication {
  id: string;
  referenceNumber: string;
  assignedAdminId?: string;
  
  // Applicant info
  applicant: ApplicantInfo;
  
  // Loan details
  offer: OfferSnapshot;
  provider: ProviderInfo;
  
  // Status & timeline
  status: AdminApplicationStatus;
  statusHistory: StatusHistoryEntry[];
  
  // Documents
  documents: ApplicationDocument[];
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  
  // Provider response
  providerResponse?: ProviderResponse;
  
  // Internal notes
  internalNotes: AdminNote[];
}

/**
 * Address information for admin view
 */
export interface AdminAddress {
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
}

/**
 * Employment information for admin view
 */
export interface AdminEmploymentInfo {
  status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
  employerName?: string;
  jobTitle?: string;
  startDate?: Date;
  contractType?: 'permanent' | 'temporary' | 'contract' | 'self_employed';
}

/**
 * Applicant information snapshot
 */
export interface ApplicantInfo {
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: AdminAddress;
  employment?: AdminEmploymentInfo;
  monthlyIncome?: number;
  livingCosts?: number;
  dependents?: number;
  isRegistered: boolean;
}

/**
 * Snapshot of the offer at time of application
 */
export interface OfferSnapshot {
  offerId: string;
  amount: number;
  duration: number;
  monthlyInstallment: number;
  interestRate: number;
  apr: number;
  totalRepayment: number;
}

/**
 * Provider information with contact details
 */
export interface ProviderInfo {
  id: string;
  name: string;
  logo?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

/**
 * Status history entry for audit trail
 */
export interface StatusHistoryEntry {
  id: string;
  previousStatus: AdminApplicationStatus | null;
  newStatus: AdminApplicationStatus;
  changedAt: Date;
  changedBy: string;
  reason?: string;
  notes?: string;
}

/**
 * Application document
 */
export interface ApplicationDocument {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  blobName?: string;
  side?: DocumentSide;
  uploadedAt: Date;
  uploadedBy: 'applicant' | 'admin' | 'provider';
  size: number;
  status: DocumentStatus;
}

export type DocumentType = 
  | 'id_document'
  | 'proof_of_income'
  | 'proof_of_address'
  | 'bank_statement'
  | 'employment_contract'
  | 'contract'
  | 'signed_contract'
  | 'other';

export type DocumentSide = 'front' | 'back' | 'unknown';

export type DocumentStatus = 
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

/**
 * Provider response to application
 */
export interface ProviderResponse {
  status: 'pending' | 'approved' | 'rejected' | 'needs_info';
  respondedAt?: Date;
  message?: string;
  conditions?: string[];
  finalOffer?: {
    interestRate: number;
    monthlyInstallment: number;
    totalRepayment: number;
  };
}

/**
 * Admin note for internal use
 */
export interface AdminNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * Decision payload for accept/reject
 */
export interface DecisionPayload {
  applicationId: string;
  decision: 'accept' | 'reject';
  reason: string;
  notes?: string;
  sendEmail: boolean;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  total: number;
  new: number;
  preliminarilyAccepted: number;
  accepted: number;
  granted: number;
  rejected: number;
  expired: number;
  avgProcessingTime: number; // in hours
  pendingReview: number;
}

/**
 * Filter options for applications list
 */
export interface ApplicationFilters {
  status: StatusFilter;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  providerId?: string;
  sortBy: 'date' | 'amount' | 'status';
  sortOrder: 'asc' | 'desc';
}

/**
 * SLA timer information
 */
export interface SlaInfo {
  timeSinceSubmission: number; // in hours
  timeToDecision?: number; // in hours (if decided)
  isOverdue: boolean;
  slaDeadline: Date;
  urgencyLevel: 'normal' | 'warning' | 'critical';
}

/**
 * Admin user role
 */
export type AdminRole = 'viewer' | 'reviewer' | 'approver' | 'super_admin';

/**
 * Admin user
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  lastLoginAt?: Date;
}

/**
 * Status display configuration for admin
 */
export const ADMIN_STATUS_CONFIG: Record<AdminApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  new: {
    label: 'New',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: '🆕',
  },
  preliminarily_accepted: {
    label: 'Preliminarily Accepted',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: '⏳',
  },
  accepted: {
    label: 'Accepted',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: '✅',
  },
  contract_ready: {
    label: 'Contract Ready',
    color: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.1)',
    icon: '📄',
  },
  signed_contract_received: {
    label: 'Signed Contract Received',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.1)',
    icon: '✍️',
  },
  final_approved: {
    label: 'Final Approved',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.1)',
    icon: '🏁',
  },
  granted: {
    label: 'Granted',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.1)',
    icon: '🎉',
  },
  rejected: {
    label: 'Rejected',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: '❌',
  },
  expired: {
    label: 'Expired',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    icon: '⏰',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    icon: '🚫',
  },
};

/**
 * Calculate SLA info for an application
 */
export function calculateSlaInfo(application: LoanApplication): SlaInfo {
  const now = new Date();
  const submissionTime = new Date(application.createdAt);
  const timeSinceSubmission = (now.getTime() - submissionTime.getTime()) / (1000 * 60 * 60);
  
  // SLA deadline is 48 hours from submission
  const slaDeadline = new Date(submissionTime.getTime() + 48 * 60 * 60 * 1000);
  const isOverdue = now > slaDeadline && application.status === 'new';
  
  let urgencyLevel: SlaInfo['urgencyLevel'] = 'normal';
  if (isOverdue) {
    urgencyLevel = 'critical';
  } else if (timeSinceSubmission > 36) {
    urgencyLevel = 'warning';
  }
  
  // Calculate time to decision if status changed from 'new'
  let timeToDecision: number | undefined;
  const firstDecision = application.statusHistory.find(
    h => h.previousStatus === 'new' && h.newStatus !== 'new'
  );
  if (firstDecision) {
    timeToDecision = (new Date(firstDecision.changedAt).getTime() - submissionTime.getTime()) / (1000 * 60 * 60);
  }
  
  return {
    timeSinceSubmission: Math.round(timeSinceSubmission * 10) / 10,
    timeToDecision: timeToDecision ? Math.round(timeToDecision * 10) / 10 : undefined,
    isOverdue,
    slaDeadline,
    urgencyLevel,
  };
}
