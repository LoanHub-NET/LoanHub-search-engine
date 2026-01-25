import type { LoanApplication, DashboardStats, ProviderInfo } from '../types/admin.types';

/**
 * Mock providers data
 */
export const mockProviders: ProviderInfo[] = [
  {
    id: 'provider-1',
    name: 'MockBank',
    logo: '/providers/mockbank.svg',
    contactPerson: 'John Smith',
    contactEmail: 'lending@mockbank.com',
    contactPhone: '+1 (555) 123-4567',
    address: '123 Financial Street, New York, NY 10001',
  },
  {
    id: 'provider-2',
    name: 'SecureFinance',
    logo: '/providers/securefinance.svg',
    contactPerson: 'Sarah Johnson',
    contactEmail: 'partners@securefinance.com',
    contactPhone: '+1 (555) 987-6543',
    address: '456 Banking Avenue, Chicago, IL 60601',
  },
  {
    id: 'provider-3',
    name: 'QuickLoan Pro',
    logo: '/providers/quickloan.svg',
    contactPerson: 'Mike Williams',
    contactEmail: 'business@quickloanpro.com',
    contactPhone: '+1 (555) 456-7890',
    address: '789 Credit Lane, Los Angeles, CA 90001',
  },
];

/**
 * Generate mock applications for admin dashboard
 */
export const mockApplications: LoanApplication[] = [
  {
    id: 'app-001',
    referenceNumber: 'LH-2024-001234',
    applicant: {
      userId: 'user-1',
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
        country: 'Polska',
      },
      employment: {
        status: 'employed',
        employerName: 'Tech Corp Sp. z o.o.',
        jobTitle: 'Senior Developer',
        startDate: new Date('2019-06-01'),
        contractType: 'permanent',
      },
      monthlyIncome: 15000,
      livingCosts: 4500,
      dependents: 2,
      isRegistered: true,
    },
    offer: {
      offerId: 'offer-001',
      amount: 50000,
      duration: 36,
      monthlyInstallment: 1523.45,
      interestRate: 7.99,
      apr: 8.75,
      totalRepayment: 54844.20,
    },
    provider: mockProviders[0],
    status: 'new',
    statusHistory: [
      {
        id: 'hist-001',
        previousStatus: null,
        newStatus: 'new',
        changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        changedBy: 'System',
        notes: 'Application submitted via web portal',
      },
    ],
    documents: [
      {
        id: 'doc-001',
        name: 'ID Card - Front',
        type: 'id_document',
        url: '/documents/id-front.pdf',
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 245000,
        status: 'pending',
      },
      {
        id: 'doc-002',
        name: 'ID Card - Back',
        type: 'id_document',
        url: '/documents/id-back.pdf',
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 198000,
        status: 'pending',
      },
      {
        id: 'doc-003',
        name: 'Income Certificate',
        type: 'proof_of_income',
        url: '/documents/income.pdf',
        uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 156000,
        status: 'pending',
      },
    ],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    internalNotes: [],
  },
  {
    id: 'app-002',
    referenceNumber: 'LH-2024-001235',
    applicant: {
      userId: 'user-2',
      email: 'anna.nowak@example.com',
      firstName: 'Anna',
      lastName: 'Nowak',
      phone: '+48 987 654 321',
      dateOfBirth: new Date('1990-07-22'),
      address: {
        street: 'ul. Kwiatowa 42',
        city: 'Kraków',
        postalCode: '30-001',
        country: 'Polska',
      },
      employment: {
        status: 'employed',
        employerName: 'Finance Solutions SA',
        jobTitle: 'Financial Analyst',
        startDate: new Date('2021-01-15'),
        contractType: 'permanent',
      },
      monthlyIncome: 12000,
      livingCosts: 3800,
      dependents: 0,
      isRegistered: true,
    },
    offer: {
      offerId: 'offer-002',
      amount: 75000,
      duration: 48,
      monthlyInstallment: 1876.23,
      interestRate: 6.99,
      apr: 7.65,
      totalRepayment: 90059.04,
    },
    provider: mockProviders[1],
    status: 'preliminarily_accepted',
    statusHistory: [
      {
        id: 'hist-002a',
        previousStatus: null,
        newStatus: 'new',
        changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        changedBy: 'System',
        notes: 'Application submitted via web portal',
      },
      {
        id: 'hist-002b',
        previousStatus: 'new',
        newStatus: 'preliminarily_accepted',
        changedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
        changedBy: 'admin@loanhub.com',
        reason: 'Documents verified, credit score acceptable',
        notes: 'Awaiting provider confirmation',
      },
    ],
    documents: [
      {
        id: 'doc-004',
        name: 'Passport',
        type: 'id_document',
        url: '/documents/passport.pdf',
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 312000,
        status: 'verified',
      },
      {
        id: 'doc-005',
        name: 'Employment Contract',
        type: 'proof_of_income',
        url: '/documents/contract.pdf',
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 428000,
        status: 'verified',
      },
      {
        id: 'doc-006',
        name: 'Bank Statements (3 months)',
        type: 'bank_statement',
        url: '/documents/statements.pdf',
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 756000,
        status: 'verified',
      },
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    providerResponse: {
      status: 'pending',
      message: 'Application under review by underwriting team',
    },
    internalNotes: [
      {
        id: 'note-001',
        content: 'Good credit history, stable employment. Recommend approval.',
        createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
        createdBy: 'admin@loanhub.com',
      },
    ],
  },
  {
    id: 'app-003',
    referenceNumber: 'LH-2024-001230',
    applicant: {
      userId: 'user-3',
      email: 'piotr.wisniewski@example.com',
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      phone: '+48 555 123 456',
      dateOfBirth: new Date('1978-11-30'),
      address: {
        street: 'ul. Parkowa 8',
        apartment: '12',
        city: 'Gdańsk',
        postalCode: '80-001',
        country: 'Polska',
      },
      employment: {
        status: 'self_employed',
        employerName: 'Wiśniewski Consulting',
        jobTitle: 'Owner',
        startDate: new Date('2015-03-01'),
        contractType: 'self_employed',
      },
      monthlyIncome: 25000,
      livingCosts: 7000,
      dependents: 3,
      isRegistered: true,
    },
    offer: {
      offerId: 'offer-003',
      amount: 150000,
      duration: 60,
      monthlyInstallment: 2987.65,
      interestRate: 5.99,
      apr: 6.45,
      totalRepayment: 179259.00,
    },
    provider: mockProviders[2],
    status: 'accepted',
    statusHistory: [
      {
        id: 'hist-003a',
        previousStatus: null,
        newStatus: 'new',
        changedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        changedBy: 'System',
        notes: 'Application submitted via web portal',
      },
      {
        id: 'hist-003b',
        previousStatus: 'new',
        newStatus: 'preliminarily_accepted',
        changedAt: new Date(Date.now() - 60 * 60 * 60 * 1000),
        changedBy: 'admin@loanhub.com',
        reason: 'Strong financial profile',
      },
      {
        id: 'hist-003c',
        previousStatus: 'preliminarily_accepted',
        newStatus: 'accepted',
        changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        changedBy: 'provider@quickloanpro.com',
        reason: 'Provider approved the loan application',
        notes: 'Contract generated and sent to applicant',
      },
    ],
    documents: [
      {
        id: 'doc-007',
        name: 'ID Document',
        type: 'id_document',
        url: '/documents/id.pdf',
        uploadedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 285000,
        status: 'verified',
      },
      {
        id: 'doc-008',
        name: 'Tax Returns (2 years)',
        type: 'proof_of_income',
        url: '/documents/tax.pdf',
        uploadedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 892000,
        status: 'verified',
      },
      {
        id: 'doc-009',
        name: 'Loan Contract',
        type: 'contract',
        url: '/documents/loan-contract.pdf',
        uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        uploadedBy: 'provider',
        size: 1245000,
        status: 'pending',
      },
    ],
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    providerResponse: {
      status: 'approved',
      respondedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      message: 'Application approved. Please sign the attached contract.',
      finalOffer: {
        interestRate: 5.99,
        monthlyInstallment: 2987.65,
        totalRepayment: 179259.00,
      },
    },
    internalNotes: [
      {
        id: 'note-002',
        content: 'Self-employed for 9+ years, excellent tax records.',
        createdAt: new Date(Date.now() - 60 * 60 * 60 * 1000),
        createdBy: 'admin@loanhub.com',
      },
      {
        id: 'note-003',
        content: 'Provider approved quickly due to strong profile.',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        createdBy: 'admin@loanhub.com',
      },
    ],
  },
  {
    id: 'app-004',
    referenceNumber: 'LH-2024-001220',
    applicant: {
      userId: 'user-4',
      email: 'maria.zielinska@example.com',
      firstName: 'Maria',
      lastName: 'Zielińska',
      phone: '+48 600 111 222',
      dateOfBirth: new Date('1992-05-18'),
      address: {
        street: 'ul. Słoneczna 25',
        city: 'Wrocław',
        postalCode: '50-001',
        country: 'Polska',
      },
      employment: {
        status: 'employed',
        employerName: 'Healthcare Plus',
        jobTitle: 'Nurse',
        startDate: new Date('2018-09-01'),
        contractType: 'permanent',
      },
      monthlyIncome: 8500,
      livingCosts: 3200,
      dependents: 1,
      isRegistered: true,
    },
    offer: {
      offerId: 'offer-004',
      amount: 25000,
      duration: 24,
      monthlyInstallment: 1098.76,
      interestRate: 8.99,
      apr: 9.85,
      totalRepayment: 26370.24,
    },
    provider: mockProviders[0],
    status: 'granted',
    statusHistory: [
      {
        id: 'hist-004a',
        previousStatus: null,
        newStatus: 'new',
        changedAt: new Date(Date.now() - 168 * 60 * 60 * 1000),
        changedBy: 'System',
        notes: 'Application submitted via web portal',
      },
      {
        id: 'hist-004b',
        previousStatus: 'new',
        newStatus: 'preliminarily_accepted',
        changedAt: new Date(Date.now() - 160 * 60 * 60 * 1000),
        changedBy: 'admin@loanhub.com',
        reason: 'All requirements met',
      },
      {
        id: 'hist-004c',
        previousStatus: 'preliminarily_accepted',
        newStatus: 'accepted',
        changedAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
        changedBy: 'provider@mockbank.com',
        reason: 'Approved by provider',
      },
      {
        id: 'hist-004d',
        previousStatus: 'accepted',
        newStatus: 'granted',
        changedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        changedBy: 'System',
        reason: 'Contract signed, funds disbursed',
        notes: 'Funds transferred to account ending in 4521',
      },
    ],
    documents: [
      {
        id: 'doc-010',
        name: 'ID Document',
        type: 'id_document',
        url: '/documents/id-maria.pdf',
        uploadedAt: new Date(Date.now() - 168 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 275000,
        status: 'verified',
      },
      {
        id: 'doc-011',
        name: 'Salary Slip',
        type: 'proof_of_income',
        url: '/documents/salary.pdf',
        uploadedAt: new Date(Date.now() - 168 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 145000,
        status: 'verified',
      },
      {
        id: 'doc-012',
        name: 'Signed Contract',
        type: 'signed_contract',
        url: '/documents/signed-contract.pdf',
        uploadedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 1567000,
        status: 'verified',
      },
    ],
    createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    providerResponse: {
      status: 'approved',
      respondedAt: new Date(Date.now() - 120 * 60 * 60 * 1000),
      message: 'Loan granted and funds disbursed.',
      finalOffer: {
        interestRate: 8.99,
        monthlyInstallment: 1098.76,
        totalRepayment: 26370.24,
      },
    },
    internalNotes: [
      {
        id: 'note-004',
        content: 'Stable employment in healthcare sector.',
        createdAt: new Date(Date.now() - 160 * 60 * 60 * 1000),
        createdBy: 'admin@loanhub.com',
      },
    ],
  },
  {
    id: 'app-005',
    referenceNumber: 'LH-2024-001215',
    applicant: {
      email: 'tomasz.lewandowski@example.com',
      firstName: 'Tomasz',
      lastName: 'Lewandowski',
      phone: '+48 700 333 444',
      dateOfBirth: new Date('1995-12-03'),
      address: {
        street: 'ul. Leśna 7',
        city: 'Poznań',
        postalCode: '60-001',
        country: 'Polska',
      },
      employment: {
        status: 'employed',
        employerName: 'Retail Store',
        jobTitle: 'Sales Associate',
        startDate: new Date('2023-06-01'),
        contractType: 'temporary',
      },
      monthlyIncome: 4500,
      livingCosts: 2800,
      dependents: 0,
      isRegistered: false,
    },
    offer: {
      offerId: 'offer-005',
      amount: 10000,
      duration: 12,
      monthlyInstallment: 879.23,
      interestRate: 12.99,
      apr: 14.25,
      totalRepayment: 10550.76,
    },
    provider: mockProviders[1],
    status: 'rejected',
    statusHistory: [
      {
        id: 'hist-005a',
        previousStatus: null,
        newStatus: 'new',
        changedAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
        changedBy: 'System',
        notes: 'Application submitted via web portal',
      },
      {
        id: 'hist-005b',
        previousStatus: 'new',
        newStatus: 'rejected',
        changedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        changedBy: 'admin@loanhub.com',
        reason: 'Insufficient income and employment history',
        notes: 'Debt-to-income ratio exceeds threshold. Temporary contract less than 12 months.',
      },
    ],
    documents: [
      {
        id: 'doc-013',
        name: 'ID Document',
        type: 'id_document',
        url: '/documents/id-tomasz.pdf',
        uploadedAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 265000,
        status: 'verified',
      },
      {
        id: 'doc-014',
        name: 'Employment Contract',
        type: 'proof_of_income',
        url: '/documents/temp-contract.pdf',
        uploadedAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 189000,
        status: 'rejected',
      },
    ],
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    internalNotes: [
      {
        id: 'note-005',
        content: 'Applicant contacted, advised to reapply after 6 months of stable employment.',
        createdAt: new Date(Date.now() - 70 * 60 * 60 * 1000),
        createdBy: 'admin@loanhub.com',
      },
    ],
  },
  {
    id: 'app-006',
    referenceNumber: 'LH-2024-001236',
    applicant: {
      userId: 'user-6',
      email: 'katarzyna.dabrowska@example.com',
      firstName: 'Katarzyna',
      lastName: 'Dąbrowska',
      phone: '+48 512 345 678',
      dateOfBirth: new Date('1988-02-14'),
      address: {
        street: 'ul. Morska 33',
        apartment: '5B',
        city: 'Gdynia',
        postalCode: '81-001',
        country: 'Polska',
      },
      employment: {
        status: 'employed',
        employerName: 'Maritime Logistics SA',
        jobTitle: 'Operations Manager',
        startDate: new Date('2017-04-01'),
        contractType: 'permanent',
      },
      monthlyIncome: 18000,
      livingCosts: 5500,
      dependents: 2,
      isRegistered: true,
    },
    offer: {
      offerId: 'offer-006',
      amount: 100000,
      duration: 72,
      monthlyInstallment: 1678.90,
      interestRate: 6.49,
      apr: 7.15,
      totalRepayment: 120880.80,
    },
    provider: mockProviders[2],
    status: 'new',
    statusHistory: [
      {
        id: 'hist-006a',
        previousStatus: null,
        newStatus: 'new',
        changedAt: new Date(Date.now() - 45 * 60 * 60 * 1000),
        changedBy: 'System',
        notes: 'Application submitted via mobile app',
      },
    ],
    documents: [
      {
        id: 'doc-015',
        name: 'Passport',
        type: 'id_document',
        url: '/documents/passport-kat.pdf',
        uploadedAt: new Date(Date.now() - 45 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 345000,
        status: 'pending',
      },
      {
        id: 'doc-016',
        name: 'Employment Certificate',
        type: 'proof_of_income',
        url: '/documents/employment-cert.pdf',
        uploadedAt: new Date(Date.now() - 45 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 178000,
        status: 'pending',
      },
      {
        id: 'doc-017',
        name: 'Bank Statements (6 months)',
        type: 'bank_statement',
        url: '/documents/bank-6m.pdf',
        uploadedAt: new Date(Date.now() - 45 * 60 * 60 * 1000),
        uploadedBy: 'applicant',
        size: 956000,
        status: 'pending',
      },
    ],
    createdAt: new Date(Date.now() - 45 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 45 * 60 * 60 * 1000),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    internalNotes: [],
  },
];

/**
 * Calculate dashboard statistics from applications
 */
export function calculateDashboardStats(applications: LoanApplication[]): DashboardStats {
  const stats: DashboardStats = {
    total: applications.length,
    new: 0,
    preliminarilyAccepted: 0,
    accepted: 0,
    granted: 0,
    rejected: 0,
    expired: 0,
    avgProcessingTime: 0,
    pendingReview: 0,
  };

  let totalProcessingTime = 0;
  let processedCount = 0;

  for (const app of applications) {
    switch (app.status) {
      case 'new':
        stats.new++;
        stats.pendingReview++;
        break;
      case 'preliminarily_accepted':
        stats.preliminarilyAccepted++;
        break;
      case 'accepted':
        stats.accepted++;
        break;
      case 'granted':
        stats.granted++;
        break;
      case 'rejected':
        stats.rejected++;
        break;
      case 'expired':
        stats.expired++;
        break;
    }

    // Calculate processing time for decided applications
    if (app.status !== 'new' && app.statusHistory.length > 1) {
      const firstDecision = app.statusHistory.find(h => h.previousStatus === 'new');
      if (firstDecision) {
        const processingTime = 
          (new Date(firstDecision.changedAt).getTime() - new Date(app.createdAt).getTime()) 
          / (1000 * 60 * 60);
        totalProcessingTime += processingTime;
        processedCount++;
      }
    }
  }

  if (processedCount > 0) {
    stats.avgProcessingTime = Math.round((totalProcessingTime / processedCount) * 10) / 10;
  }

  return stats;
}
