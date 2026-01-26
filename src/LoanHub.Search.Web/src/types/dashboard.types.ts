/**
 * User dashboard types
 */

/**
 * Application status from user perspective
 */
export type UserApplicationStatus = 
  | 'new'
  | 'preliminarily_accepted'
  | 'accepted'
  | 'granted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

/**
 * Status filter for user dashboard
 */
export type UserStatusFilter = UserApplicationStatus | 'all';

/**
 * User application in the dashboard
 */
export interface UserApplication {
  id: string;
  referenceNumber: string;
  
  // Offer details
  provider: {
    id: string;
    name: string;
    logo?: string;
  };
  amount: number;
  duration: number;
  monthlyInstallment: number;
  interestRate: number;
  apr: number;
  totalRepayment: number;
  
  // Status
  status: UserApplicationStatus;
  statusMessage?: string;
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  
  // Documents
  documentsRequired: DocumentRequirement[];
  documentsSubmitted: UserDocument[];
  
  // Actions
  canResign: boolean;
  canContinue: boolean;
  nextStep?: string;
}

/**
 * Document requirement
 */
export interface DocumentRequirement {
  id: string;
  type: DocumentType;
  name: string;
  description: string;
  required: boolean;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
}

/**
 * User uploaded document
 */
export interface UserDocument {
  id: string;
  type: DocumentType;
  name: string;
  fileName: string;
  uploadedAt: Date;
  size: number;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
}

/**
 * Document types
 */
export type DocumentType = 
  | 'id_front'
  | 'id_back'
  | 'passport'
  | 'proof_of_income'
  | 'bank_statement'
  | 'employment_contract'
  | 'signed_contract'
  | 'other';

/**
 * User profile for dashboard
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  
  // Address
  address?: {
    street: string;
    apartment?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  
  // Employment
  employment?: {
    status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
    employerName?: string;
    position?: string;
    startDate?: Date;
    contractType?: 'permanent' | 'temporary' | 'contract';
  };
  
  // Financial
  monthlyIncome?: number;
  livingCosts?: number;
  dependents?: number;
  
  // Documents
  idDocument?: {
    type: 'passport' | 'national_id' | 'drivers_license';
    number: string;
    expiryDate?: Date;
    verified: boolean;
  };
  
  // Preferences
  emailNotifications: boolean;
  smsNotifications: boolean;
  
  completionPercentage: number;
}

/**
 * User notification
 */
export interface UserNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  applicationId?: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

/**
 * Notification types
 */
export type NotificationType = 
  | 'application_status'
  | 'document_required'
  | 'document_verified'
  | 'document_rejected'
  | 'offer_expiring'
  | 'offer_expired'
  | 'system';

/**
 * Saved search
 */
export interface SavedSearch {
  id: string;
  name: string;
  amount: number;
  duration: number;
  monthlyIncome?: number;
  createdAt: Date;
  lastUsed?: Date;
}

/**
 * Comparison history entry
 */
export interface ComparisonEntry {
  id: string;
  searchParams: {
    amount: number;
    duration: number;
  };
  offers: {
    providerId: string;
    providerName: string;
    monthlyInstallment: number;
    apr: number;
  }[];
  createdAt: Date;
}

/**
 * Dashboard tab
 */
export type DashboardTab = 
  | 'applications'
  | 'profile'
  | 'documents'
  | 'notifications'
  | 'saved';

/**
 * Status configuration for display
 */
export const USER_STATUS_CONFIG: Record<UserApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}> = {
  new: {
    label: 'New',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: '📝',
    description: 'Application submitted, awaiting review',
  },
  preliminarily_accepted: {
    label: 'Pre-approved',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: '⏳',
    description: 'Preliminary approval received, final verification in progress',
  },
  accepted: {
    label: 'Accepted',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    icon: '✅',
    description: 'Offer accepted, awaiting contract signing',
  },
  granted: {
    label: 'Granted',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    icon: '🎉',
    description: 'Loan granted and disbursed',
  },
  rejected: {
    label: 'Rejected',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: '❌',
    description: 'Application was not approved',
  },
  expired: {
    label: 'Expired',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    icon: '⏰',
    description: 'Offer validity period has ended',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#9ca3af',
    bgColor: 'rgba(156, 163, 175, 0.1)',
    icon: '🚫',
    description: 'You cancelled this application',
  },
};

/**
 * Calculate days remaining until expiry
 */
export function getDaysRemaining(expiresAt: Date): number {
  const now = new Date();
  const diff = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check if offer is expiring soon (within 3 days)
 */
export function isExpiringSoon(expiresAt: Date): boolean {
  return getDaysRemaining(expiresAt) <= 3;
}
