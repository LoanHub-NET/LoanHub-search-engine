import type { LoanOffer } from '../types/loan.types';
import type { ApplicationOffer } from '../types/application.types';
import type { LoanApplication } from '../types/admin.types';
import type { UserApplication, UserProfile } from '../types/dashboard.types';
import type {
  ApplicationResponse,
  AuthResponse,
  OfferDto,
  OfferSnapshot,
} from './loanhubApi';
import { getProviderId, getProviderLogo } from '../utils/providers';

const STATUS_MAP: Record<string, string> = {
  '1': 'new',
  '2': 'preliminarily_accepted',
  '3': 'accepted',
  '4': 'rejected',
  '5': 'cancelled',
  '6': 'granted',
  '7': 'contract_ready',
  '8': 'signed_contract_received',
  '9': 'final_approved',
};

export const normalizeStatus = (status: number | string) => {
  if (typeof status === 'number') return STATUS_MAP[String(status)] ?? 'new';
  const trimmed = status.toString().trim();
  const numeric = STATUS_MAP[trimmed];
  if (numeric) return numeric;
  return trimmed
    .replace(/\s+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
};

export const mapOfferDtoToLoanOffer = (
  dto: OfferDto,
  amount: number,
  duration: number,
  isPersonalized: boolean,
): LoanOffer => ({
  id: dto.providerOfferId || `${dto.provider}-${Date.now()}`,
  providerId: getProviderId(dto.provider),
  providerName: dto.provider,
  providerLogo: getProviderLogo(dto.provider),
  amount,
  duration,
  monthlyInstallment: dto.installment,
  interestRate: dto.apr,
  apr: dto.apr,
  totalRepayment: dto.totalCost,
  isPersonalized,
  validUntil: new Date(dto.validUntil),
  providerOfferId: dto.providerOfferId,
});

export const mapOfferSnapshotToApplicationOffer = (snapshot: OfferSnapshot): ApplicationOffer => ({
  id: snapshot.providerOfferId || `${snapshot.provider}-${snapshot.amount}`,
  providerId: getProviderId(snapshot.provider),
  providerName: snapshot.provider,
  providerLogo: getProviderLogo(snapshot.provider),
  amount: snapshot.amount,
  duration: snapshot.durationMonths,
  interestRate: snapshot.apr,
  apr: snapshot.apr,
  monthlyInstallment: snapshot.installment,
  totalRepayment: snapshot.totalCost,
  totalInterest: snapshot.totalCost - snapshot.amount,
  processingTime: '1-3 business days',
  validUntil: new Date(snapshot.validUntil),
  providerOfferId: snapshot.providerOfferId,
});

export const mapApplicationResponseToAdminApplication = (
  application: ApplicationResponse,
): LoanApplication => {
  const offer = application.offerSnapshot;
  const statusHistory = application.statusHistory.map((entry, index) => ({
    id: `${application.id}-${index}`,
    previousStatus:
      index > 0 ? normalizeStatus(application.statusHistory[index - 1].status) : null,
    newStatus: normalizeStatus(entry.status),
    changedAt: new Date(entry.changedAt),
    changedBy: 'system',
    reason: entry.reason ?? undefined,
  }));

  return {
    id: application.id,
    referenceNumber: `LH-${application.id.split('-')[0].toUpperCase()}`,
    applicant: {
      userId: application.userId ?? undefined,
      email: application.applicantEmail,
      firstName: application.applicantDetails.firstName,
      lastName: application.applicantDetails.lastName,
      isRegistered: Boolean(application.userId),
      employment: {
        status: 'employed',
        employerName: application.applicantDetails.jobTitle,
        jobTitle: application.applicantDetails.jobTitle,
      },
    },
    offer: {
      offerId: offer.providerOfferId,
      amount: offer.amount,
      duration: offer.durationMonths,
      monthlyInstallment: offer.installment,
      interestRate: offer.apr,
      apr: offer.apr,
      totalRepayment: offer.totalCost,
    },
    provider: {
      id: getProviderId(offer.provider),
      name: offer.provider,
      logo: getProviderLogo(offer.provider),
    },
    status: normalizeStatus(application.status),
    statusHistory,
    documents: [],
    createdAt: new Date(application.createdAt),
    updatedAt: new Date(application.updatedAt),
    expiresAt: new Date(offer.validUntil),
    internalNotes: [],
  };
};

export const mapApplicationResponseToUserApplication = (
  application: ApplicationResponse,
): UserApplication => {
  const offer = application.offerSnapshot;
  const normalizedStatus = normalizeStatus(application.status);
  const userStatus =
    normalizedStatus === 'contract_ready' ||
    normalizedStatus === 'signed_contract_received' ||
    normalizedStatus === 'final_approved'
      ? 'accepted'
      : (normalizedStatus as UserApplication['status']);

  return {
    id: application.id,
    referenceNumber: `LH-${application.id.split('-')[0].toUpperCase()}`,
    provider: {
      id: getProviderId(offer.provider),
      name: offer.provider,
      logo: getProviderLogo(offer.provider),
    },
    amount: offer.amount,
    duration: offer.durationMonths,
    monthlyInstallment: offer.installment,
    interestRate: offer.apr,
    apr: offer.apr,
    totalRepayment: offer.totalCost,
    status: userStatus,
    statusMessage: application.rejectReason ?? undefined,
    createdAt: new Date(application.createdAt),
    updatedAt: new Date(application.updatedAt),
    expiresAt: new Date(offer.validUntil),
    documentsRequired: [],
    documentsSubmitted: [],
    canResign: normalizedStatus === 'new' || normalizedStatus === 'preliminarily_accepted',
    canContinue: normalizedStatus === 'contract_ready',
    nextStep: normalizedStatus === 'contract_ready' ? 'Sign contract' : undefined,
  };
};

export const mapAuthResponseToUserProfile = (auth: AuthResponse): UserProfile => {
  const completionFields = [
    auth.firstName,
    auth.lastName,
    auth.age,
    auth.jobTitle,
    auth.address,
    auth.idDocumentNumber,
  ];
  const completionPercentage =
    (completionFields.filter((value) => value !== null && value !== undefined && value !== '').length /
      completionFields.length) *
    100;

  return {
    id: auth.id,
    email: auth.email,
    firstName: auth.firstName ?? '',
    lastName: auth.lastName ?? '',
    address: auth.address
      ? {
          street: auth.address,
          city: '',
          postalCode: '',
          country: '',
        }
      : undefined,
    employment: auth.jobTitle
      ? {
          status: 'employed',
          position: auth.jobTitle,
        }
      : undefined,
    idDocument: auth.idDocumentNumber
      ? {
          type: 'national_id',
          number: auth.idDocumentNumber,
          verified: false,
        }
      : undefined,
    emailNotifications: true,
    smsNotifications: false,
    completionPercentage: Math.round(completionPercentage),
  };
};
