import type { OfferStatus } from './loan.types';

/**
 * Application wizard steps
 */
export type ApplicationStep = 
  | 'offer-details'
  | 'personalize'
  | 'personal-info'
  | 'employment'
  | 'documents'
  | 'review'
  | 'submitted'
  | 'contract';

/**
 * Offer data for the application form (extended version of LoanOffer)
 */
export interface ApplicationOffer {
  id: string;
  providerId?: string;
  providerName: string;
  providerLogo?: string;
  amount: number;
  duration: number;
  monthlyInstallment: number;
  interestRate: number;
  apr: number;
  totalRepayment: number;
  totalInterest: number;
  processingTime?: string;
  isPersonalized?: boolean;
  validUntil?: Date;
}

/**
 * Application step configuration
 */
export interface StepConfig {
  id: ApplicationStep;
  title: string;
  description: string;
  icon: string;
  optional?: boolean;
}

/**
 * All application steps
 */
export const APPLICATION_STEPS: StepConfig[] = [
  {
    id: 'offer-details',
    title: 'Offer Details',
    description: 'Review your selected offer',
    icon: '📋',
  },
  {
    id: 'personalize',
    title: 'Personalize',
    description: 'Get a personalized rate',
    icon: '✨',
  },
  {
    id: 'personal-info',
    title: 'Personal Info',
    description: 'Your basic information',
    icon: '👤',
  },
  {
    id: 'employment',
    title: 'Employment',
    description: 'Job and income details',
    icon: '💼',
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'ID verification',
    icon: '📄',
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm and submit',
    icon: '✅',
  },
];

/**
 * User authentication state for application
 */
export type AuthMode = 'logged-in' | 'guest' | 'register';

/**
 * Personal information form data
 */
export interface PersonalInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    apartment?: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

/**
 * Employment form data
 */
export interface EmploymentData {
  status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | '';
  employerName?: string;
  position?: string;
  employedSince?: string;
  contractType?: 'permanent' | 'temporary' | 'contract' | '';
  monthlyIncome: string;
  additionalIncome?: string;
  livingCosts: string;
  dependents: string;
}

/**
 * Document data
 */
export interface DocumentData {
  idType: 'national_id' | 'passport' | 'drivers_license' | '';
  idNumber: string;
  idFrontFile?: File;
  idBackFile?: File;
  idExpiry?: string;
  additionalDocs?: File[];
}

/**
 * Personalization data for rate calculation
 */
export interface PersonalizationData {
  monthlyIncome: string;
  livingCosts: string;
  dependents: string;
}

/**
 * Complete application form data
 */
export interface ApplicationFormData {
  // Selected offer
  offer: ApplicationOffer | null;
  
  // Personalization (optional step for better rates)
  personalization: PersonalizationData;
  isPersonalized: boolean;
  
  // Auth state
  authMode: AuthMode;
  
  // Personal info
  personalInfo: PersonalInfoData;
  
  // Employment
  employment: EmploymentData;
  
  // Documents
  documents: DocumentData;
  
  // Consent flags
  consents: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    marketingOptIn: boolean;
    creditCheckAuthorized: boolean;
  };
}

/**
 * Initial empty form data
 */
export const INITIAL_APPLICATION_DATA: ApplicationFormData = {
  offer: null,
  personalization: {
    monthlyIncome: '',
    livingCosts: '',
    dependents: '0',
  },
  isPersonalized: false,
  authMode: 'guest',
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      apartment: '',
      city: '',
      postalCode: '',
      country: 'Poland',
    },
  },
  employment: {
    status: '',
    employerName: '',
    position: '',
    employedSince: '',
    contractType: '',
    monthlyIncome: '',
    additionalIncome: '',
    livingCosts: '',
    dependents: '0',
  },
  documents: {
    idType: '',
    idNumber: '',
    idExpiry: '',
  },
  consents: {
    termsAccepted: false,
    privacyAccepted: false,
    marketingOptIn: false,
    creditCheckAuthorized: false,
  },
};

/**
 * Submitted application
 */
export interface SubmittedApplication {
  id: string;
  referenceNumber: string;
  offer: ApplicationOffer;
  personalInfo: PersonalInfoData;
  employment: EmploymentData;
  status: OfferStatus;
  submittedAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  contractUrl?: string;
  contractUploadedAt?: Date;
}

/**
 * Application submission response
 */
export interface ApplicationSubmissionResponse {
  success: boolean;
  applicationId: string;
  referenceNumber: string;
  message: string;
  nextSteps: string[];
}

/**
 * Contract upload response
 */
export interface ContractUploadResponse {
  success: boolean;
  message: string;
  uploadedAt: Date;
}

/**
 * Validation errors for form
 */
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Employment status options
 */
export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
  { value: 'student', label: 'Student' },
] as const;

/**
 * Contract type options
 */
export const CONTRACT_TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'contract', label: 'Contract/Freelance' },
] as const;

/**
 * ID document type options
 */
export const ID_TYPE_OPTIONS = [
  { value: 'national_id', label: 'National ID Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
] as const;

/**
 * Mock user profile for auto-fill when logged in
 */
export const MOCK_LOGGED_IN_USER = {
  isLoggedIn: true,
  personalInfo: {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48 123 456 789',
    dateOfBirth: '1985-03-15',
    address: {
      street: 'ul. Główna 15',
      apartment: '3A',
      city: 'Warszawa',
      postalCode: '00-001',
      country: 'Poland',
    },
  },
  employment: {
    status: 'employed' as const,
    employerName: 'Tech Corp Sp. z o.o.',
    position: 'Senior Developer',
    employedSince: '2019-06-01',
    contractType: 'permanent' as const,
    monthlyIncome: '15000',
    additionalIncome: '',
    livingCosts: '4500',
    dependents: '2',
  },
  documents: {
    idType: 'national_id' as const,
    idNumber: 'ABC123456',
    idExpiry: '2028-03-15',
  },
};
