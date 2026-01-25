/**
 * User account information
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  phone?: string;
  address?: Address;
  employment?: EmploymentInfo;
  idDocument?: IdDocument;
  authProvider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address information
 */
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

/**
 * Employment information
 */
export interface EmploymentInfo {
  status: EmploymentStatus;
  employer?: string;
  position?: string;
  monthlyIncome?: number;
  employedSince?: Date;
}

/**
 * Employment status options
 */
export type EmploymentStatus = 
  | 'employed'
  | 'self_employed'
  | 'unemployed'
  | 'retired'
  | 'student';

/**
 * ID document information
 */
export interface IdDocument {
  type: IdDocumentType;
  number: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate: Date;
}

/**
 * ID document types
 */
export type IdDocumentType = 
  | 'passport'
  | 'national_id'
  | 'drivers_license';

/**
 * Authentication provider
 */
export type AuthProvider = 
  | 'local'
  | 'azure_ad'
  | 'google'
  | 'facebook';

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
