import type {
  UserApplication,
  UserProfile,
  UserNotification,
  SavedSearch,
  ComparisonEntry,
} from '../types/dashboard.types';

/**
 * Mock user profile
 */
export const mockUserProfile: UserProfile = {
  id: 'user-123',
  email: 'jan.kowalski@example.com',
  firstName: 'Jan',
  lastName: 'Kowalski',
  phone: '+48 123 456 789',
  dateOfBirth: new Date('1985-03-15'),
  address: {
    street: 'ul. Główna 15',
    apartment: '3A',
    city: 'Warszawa',
    postalCode: '00-001',
    country: 'Poland',
  },
  employment: {
    status: 'employed',
    employerName: 'Tech Corp Sp. z o.o.',
    position: 'Senior Developer',
    startDate: new Date('2019-06-01'),
    contractType: 'permanent',
  },
  monthlyIncome: 15000,
  livingCosts: 4500,
  dependents: 2,
  idDocument: {
    type: 'national_id',
    number: 'ABC123456',
    expiryDate: new Date('2028-03-15'),
    verified: true,
  },
  emailNotifications: true,
  smsNotifications: false,
  completionPercentage: 85,
};

/**
 * Mock user applications (last 10 days)
 */
export const mockUserApplications: UserApplication[] = [
  {
    id: 'app-001',
    referenceNumber: 'LH-2026-001234',
    provider: {
      id: 'provider-1',
      name: 'MockBank',
      logo: '/providers/mockbank.svg',
    },
    amount: 50000,
    duration: 36,
    monthlyInstallment: 1523.45,
    interestRate: 7.99,
    apr: 8.75,
    totalRepayment: 54844.20,
    status: 'new',
    statusMessage: 'Your application is being reviewed by our team.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
    documentsRequired: [
      {
        id: 'req-1',
        type: 'id_front',
        name: 'ID Card (Front)',
        description: 'Front side of your national ID card',
        required: true,
        status: 'uploaded',
      },
      {
        id: 'req-2',
        type: 'id_back',
        name: 'ID Card (Back)',
        description: 'Back side of your national ID card',
        required: true,
        status: 'uploaded',
      },
      {
        id: 'req-3',
        type: 'proof_of_income',
        name: 'Income Certificate',
        description: 'Recent pay slip or income statement',
        required: true,
        status: 'pending',
      },
    ],
    documentsSubmitted: [
      {
        id: 'doc-1',
        type: 'id_front',
        name: 'ID Card (Front)',
        fileName: 'id_front.jpg',
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        size: 245000,
        status: 'pending',
      },
      {
        id: 'doc-2',
        type: 'id_back',
        name: 'ID Card (Back)',
        fileName: 'id_back.jpg',
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        size: 198000,
        status: 'pending',
      },
    ],
    canResign: true,
    canContinue: true,
    nextStep: 'Upload income certificate to proceed',
  },
  {
    id: 'app-002',
    referenceNumber: 'LH-2026-001235',
    provider: {
      id: 'provider-2',
      name: 'SecureFinance',
      logo: '/providers/securefinance.svg',
    },
    amount: 75000,
    duration: 48,
    monthlyInstallment: 1876.23,
    interestRate: 6.99,
    apr: 7.65,
    totalRepayment: 90059.04,
    status: 'preliminarily_accepted',
    statusMessage: 'Your application has been pre-approved! Awaiting final verification.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    documentsRequired: [
      {
        id: 'req-4',
        type: 'id_front',
        name: 'ID Card (Front)',
        description: 'Front side of your national ID card',
        required: true,
        status: 'verified',
      },
      {
        id: 'req-5',
        type: 'proof_of_income',
        name: 'Employment Contract',
        description: 'Your current employment contract',
        required: true,
        status: 'verified',
      },
      {
        id: 'req-6',
        type: 'bank_statement',
        name: 'Bank Statement',
        description: 'Last 3 months bank statements',
        required: true,
        status: 'verified',
      },
    ],
    documentsSubmitted: [
      {
        id: 'doc-3',
        type: 'id_front',
        name: 'Passport',
        fileName: 'passport.pdf',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        size: 312000,
        status: 'verified',
      },
      {
        id: 'doc-4',
        type: 'proof_of_income',
        name: 'Employment Contract',
        fileName: 'contract.pdf',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        size: 428000,
        status: 'verified',
      },
      {
        id: 'doc-5',
        type: 'bank_statement',
        name: 'Bank Statement',
        fileName: 'bank_statement.pdf',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        size: 156000,
        status: 'verified',
      },
    ],
    canResign: true,
    canContinue: true,
    nextStep: 'Waiting for final approval from provider',
  },
  {
    id: 'app-003',
    referenceNumber: 'LH-2026-001236',
    provider: {
      id: 'provider-3',
      name: 'QuickLoan Pro',
      logo: '/providers/quickloan.svg',
    },
    amount: 25000,
    duration: 24,
    monthlyInstallment: 1124.58,
    interestRate: 8.49,
    apr: 9.25,
    totalRepayment: 26989.92,
    status: 'accepted',
    statusMessage: 'Congratulations! Your loan has been approved. Please sign the contract.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    documentsRequired: [
      {
        id: 'req-7',
        type: 'signed_contract',
        name: 'Signed Loan Contract',
        description: 'Please download, sign, and upload the loan contract',
        required: true,
        status: 'pending',
      },
    ],
    documentsSubmitted: [],
    canResign: true,
    canContinue: true,
    nextStep: 'Download and sign the loan contract to finalize',
  },
  {
    id: 'app-004',
    referenceNumber: 'LH-2026-001237',
    provider: {
      id: 'provider-1',
      name: 'MockBank',
      logo: '/providers/mockbank.svg',
    },
    amount: 100000,
    duration: 60,
    monthlyInstallment: 1998.75,
    interestRate: 6.49,
    apr: 7.15,
    totalRepayment: 119925.00,
    status: 'granted',
    statusMessage: 'Your loan has been disbursed to your account.',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Already completed
    documentsRequired: [],
    documentsSubmitted: [
      {
        id: 'doc-6',
        type: 'signed_contract',
        name: 'Signed Contract',
        fileName: 'signed_contract.pdf',
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        size: 524000,
        status: 'verified',
      },
    ],
    canResign: false,
    canContinue: false,
  },
  {
    id: 'app-005',
    referenceNumber: 'LH-2026-001238',
    provider: {
      id: 'provider-2',
      name: 'SecureFinance',
      logo: '/providers/securefinance.svg',
    },
    amount: 30000,
    duration: 36,
    monthlyInstallment: 945.82,
    interestRate: 9.99,
    apr: 10.75,
    totalRepayment: 34049.52,
    status: 'rejected',
    statusMessage: 'Unfortunately, your application could not be approved at this time.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    documentsRequired: [],
    documentsSubmitted: [],
    canResign: false,
    canContinue: false,
  },
  {
    id: 'app-006',
    referenceNumber: 'LH-2026-001239',
    provider: {
      id: 'provider-3',
      name: 'QuickLoan Pro',
      logo: '/providers/quickloan.svg',
    },
    amount: 15000,
    duration: 12,
    monthlyInstallment: 1312.50,
    interestRate: 7.49,
    apr: 8.25,
    totalRepayment: 15750.00,
    status: 'new',
    statusMessage: 'Application submitted, awaiting initial review.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now - expiring soon!
    documentsRequired: [
      {
        id: 'req-8',
        type: 'id_front',
        name: 'ID Document',
        description: 'Valid government-issued ID',
        required: true,
        status: 'pending',
      },
      {
        id: 'req-9',
        type: 'proof_of_income',
        name: 'Proof of Income',
        description: 'Recent income verification',
        required: true,
        status: 'pending',
      },
    ],
    documentsSubmitted: [],
    canResign: true,
    canContinue: true,
    nextStep: 'Upload required documents to proceed',
  },
];

/**
 * Mock notifications
 */
export const mockNotifications: UserNotification[] = [
  {
    id: 'notif-1',
    type: 'application_status',
    title: 'Application Pre-approved!',
    message: 'Great news! Your application LH-2026-001235 has been pre-approved by SecureFinance.',
    applicationId: 'app-002',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    actionUrl: '/dashboard?app=app-002',
  },
  {
    id: 'notif-2',
    type: 'offer_expiring',
    title: 'Offer Expiring Soon',
    message: 'Your offer from QuickLoan Pro (LH-2026-001239) expires in 2 days. Take action now!',
    applicationId: 'app-006',
    isRead: false,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    actionUrl: '/dashboard?app=app-006',
  },
  {
    id: 'notif-3',
    type: 'document_verified',
    title: 'Documents Verified',
    message: 'All your documents for application LH-2026-001235 have been verified successfully.',
    applicationId: 'app-002',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'notif-4',
    type: 'application_status',
    title: 'Loan Granted!',
    message: 'Congratulations! Your loan of $100,000 from MockBank has been disbursed.',
    applicationId: 'app-004',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Welcome to LoanHub!',
    message: 'Thank you for creating an account. Complete your profile to get better loan offers.',
    isRead: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    actionUrl: '/dashboard?tab=profile',
  },
  {
    id: 'notif-6',
    type: 'document_required',
    title: 'Document Required',
    message: 'Please upload income certificate for application LH-2026-001234.',
    applicationId: 'app-001',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    actionUrl: '/dashboard?app=app-001&tab=documents',
  },
];

/**
 * Mock saved searches
 */
export const mockSavedSearches: SavedSearch[] = [
  {
    id: 'search-1',
    name: 'Home Renovation Loan',
    amount: 50000,
    duration: 36,
    monthlyIncome: 15000,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'search-2',
    name: 'Car Purchase',
    amount: 75000,
    duration: 48,
    monthlyIncome: 15000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'search-3',
    name: 'Quick Cash',
    amount: 10000,
    duration: 12,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

/**
 * Mock comparison history
 */
export const mockComparisonHistory: ComparisonEntry[] = [
  {
    id: 'comp-1',
    searchParams: {
      amount: 50000,
      duration: 36,
    },
    offers: [
      { providerId: 'provider-1', providerName: 'MockBank', monthlyInstallment: 1523.45, apr: 8.75 },
      { providerId: 'provider-2', providerName: 'SecureFinance', monthlyInstallment: 1498.32, apr: 8.25 },
      { providerId: 'provider-3', providerName: 'QuickLoan Pro', monthlyInstallment: 1545.67, apr: 9.15 },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'comp-2',
    searchParams: {
      amount: 25000,
      duration: 24,
    },
    offers: [
      { providerId: 'provider-1', providerName: 'MockBank', monthlyInstallment: 1124.58, apr: 9.25 },
      { providerId: 'provider-3', providerName: 'QuickLoan Pro', monthlyInstallment: 1098.45, apr: 8.75 },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

/**
 * Calculate dashboard stats
 */
export function calculateUserDashboardStats(applications: UserApplication[]) {
  const total = applications.length;
  const newCount = applications.filter(a => a.status === 'new').length;
  const preApproved = applications.filter(a => a.status === 'preliminarily_accepted').length;
  const accepted = applications.filter(a => a.status === 'accepted').length;
  const granted = applications.filter(a => a.status === 'granted').length;
  const expiringSoon = applications.filter(a => {
    if (['granted', 'rejected', 'expired', 'cancelled'].includes(a.status)) return false;
    const daysLeft = Math.ceil((new Date(a.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  }).length;

  return {
    total,
    newCount,
    preApproved,
    accepted,
    granted,
    expiringSoon,
  };
}
