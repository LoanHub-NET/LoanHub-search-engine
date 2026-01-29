import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { 
  LoanApplication, 
  StatusFilter, 
  ApplicationFilters,
  DecisionPayload,
  DashboardStats,
} from '../../types/admin.types';
import { ADMIN_STATUS_CONFIG, calculateSlaInfo } from '../../types/admin.types';
import { ApplicationDetailModal, DecisionModal } from '../../components/admin';
import { Header, AdminFooter } from '../../components';
import type { AdminUser } from '../../components/Header/Header';
import { clearAuthSession, getAuthSession } from '../../api/apiConfig';
import {
  listAdminApplications,
  preliminarilyAcceptApplication,
  rejectAdminApplication,
  type AdminApplicationResponse,
} from '../../api/adminApplicationsApi';
import { calculateDashboardStats } from '../../utils/adminDashboard';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './AdminDashboardPage.css';

type SortKey = 'date' | 'amount' | 'status';

const toProviderId = (providerName: string) =>
  providerName.trim().toLowerCase().replace(/\s+/g, '-');

const normalizeApr = (apr: number) => (apr <= 1 ? apr * 100 : apr);

const mapStatus = (status: number | string): LoanApplication['status'] => {
  if (typeof status === 'number') {
    switch (status) {
      case 1:
        return 'new';
      case 2:
        return 'preliminarily_accepted';
      case 3:
        return 'accepted';
      case 4:
        return 'rejected';
      case 5:
        return 'cancelled';
      case 6:
        return 'granted';
      case 7:
        return 'contract_ready';
      case 8:
        return 'signed_contract_received';
      case 9:
        return 'final_approved';
      default:
        return 'new';
    }
  }

  const normalized = status.toString().trim();
  const key = normalized.replace(/[^a-z]/gi, '').toLowerCase();
  switch (key) {
    case 'new':
      return 'new';
    case 'preliminarilyaccepted':
      return 'preliminarily_accepted';
    case 'accepted':
      return 'accepted';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'granted':
      return 'granted';
    case 'contractready':
      return 'contract_ready';
    case 'signedcontractreceived':
      return 'signed_contract_received';
    case 'finalapproved':
      return 'final_approved';
    default:
      return 'new';
  }
};

const buildReference = (id: string) => `APP-${id.slice(0, 8).toUpperCase()}`;

const mapAdminApplication = (application: AdminApplicationResponse): LoanApplication => {
  const offerSnapshot = application.offerSnapshot;
  const applicantDetails = application.applicantDetails;
  const aprPercent = normalizeApr(offerSnapshot.apr);
  const createdAt = new Date(application.createdAt);
  const updatedAt = new Date(application.updatedAt);
  const expiresAt = offerSnapshot.validUntil
    ? new Date(offerSnapshot.validUntil)
    : new Date(createdAt.getTime() + 10 * 24 * 60 * 60 * 1000);

  return {
    id: application.id,
    referenceNumber: buildReference(application.id),
    assignedAdminId: application.assignedAdminId ?? undefined,
    applicant: {
      userId: application.userId ?? undefined,
      email: application.applicantEmail,
      firstName: applicantDetails?.firstName || 'Unknown',
      lastName: applicantDetails?.lastName || '',
      phone: applicantDetails?.phone ?? undefined,
      dateOfBirth: applicantDetails?.dateOfBirth ? new Date(applicantDetails.dateOfBirth) : undefined,
      monthlyIncome: applicantDetails?.monthlyIncome ?? undefined,
      livingCosts: applicantDetails?.livingCosts ?? undefined,
      dependents: applicantDetails?.dependents ?? undefined,
      isRegistered: Boolean(application.userId),
    },
    offer: {
      offerId: offerSnapshot.providerOfferId,
      amount: offerSnapshot.amount,
      duration: offerSnapshot.durationMonths,
      monthlyInstallment: offerSnapshot.installment,
      interestRate: aprPercent,
      apr: aprPercent,
      totalRepayment: offerSnapshot.totalCost,
    },
    provider: {
      id: toProviderId(offerSnapshot.provider),
      name: offerSnapshot.provider,
    },
    status: mapStatus(application.status),
    statusHistory: (application.statusHistory || []).map((entry, index) => ({
      id: `${application.id}-status-${index}`,
      previousStatus: null,
      newStatus: mapStatus(entry.status),
      changedAt: new Date(entry.changedAt),
      changedBy: 'system',
      reason: entry.reason ?? undefined,
      notes: undefined,
    })),
    documents: [],
    createdAt,
    updatedAt,
    expiresAt,
    internalNotes: [],
  };
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  
  // State
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    application: LoanApplication;
    type: 'accept' | 'reject';
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState(getAuthSession());

  const adminUser: AdminUser | undefined = useMemo(() => {
    if (!authSession) return undefined;
    const name = `${authSession.firstName ?? ''} ${authSession.lastName ?? ''}`.trim() || authSession.email;
    const roleValue = authSession.role;
    const isAdmin = roleValue === 'Admin' || roleValue === 'Administrator' || Number(roleValue) === 1;
    return {
      name,
      email: authSession.email,
      role: isAdmin ? 'Administrator' : 'User',
    };
  }, [authSession]);

  useEffect(() => {
    const session = getAuthSession();
    setAuthSession(session);
    if (!session) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    listAdminApplications()
      .then((response) => {
        const mapped = response.items.map(mapAdminApplication);
        setApplications(mapped);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load applications.';
        setLoadError(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [navigate]);

  // Calculate stats
  const stats: DashboardStats = useMemo(() => {
    return calculateDashboardStats(applications);
  }, [applications]);

  const providers = useMemo(() => {
    const map = new Map<string, LoanApplication['provider']>();
    applications.forEach((app) => {
      map.set(app.provider.id, app.provider);
    });
    return Array.from(map.values());
  }, [applications]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(app => app.status === filters.status);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(app => 
        app.referenceNumber.toLowerCase().includes(term) ||
        app.applicant.email.toLowerCase().includes(term) ||
        `${app.applicant.firstName} ${app.applicant.lastName}`.toLowerCase().includes(term) ||
        app.provider.name.toLowerCase().includes(term)
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      result = result.filter(app => new Date(app.createdAt) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(app => new Date(app.createdAt) <= filters.dateTo!);
    }

    // Filter by provider
    if (filters.providerId) {
      result = result.filter(app => app.provider.id === filters.providerId);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = a.offer.amount - b.offer.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [applications, filters]);

  // Handlers
  const handleStatusFilter = (status: StatusFilter) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  };

  const handleSortChange = (sortBy: SortKey) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleProviderFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ 
      ...prev, 
      providerId: e.target.value || undefined 
    }));
  };

  const handleDecisionSubmit = async (decision: DecisionPayload) => {
    setActionError(null);
    try {
      const updated =
        decision.decision === 'accept'
          ? await preliminarilyAcceptApplication(decision.applicationId)
          : await rejectAdminApplication(decision.applicationId, decision.reason);

      const mapped = mapAdminApplication(updated);
      setApplications(prev =>
        prev.map(app => (app.id === mapped.id ? mapped : app)),
      );
      setDecisionModal(null);
      setSelectedApplication(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update application.';
      setActionError(message);
    }
  };

  const openAcceptModal = (app: LoanApplication) => {
    setDecisionModal({ application: app, type: 'accept' });
  };

  const openRejectModal = (app: LoanApplication) => {
    setDecisionModal({ application: app, type: 'reject' });
  };

  // Status filter options
  const statusOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'new', label: 'New', count: stats.new },
    { value: 'preliminarily_accepted', label: 'Preliminary', count: stats.preliminarilyAccepted },
    { value: 'accepted', label: 'Accepted', count: stats.accepted },
    { value: 'granted', label: 'Granted', count: stats.granted },
    { value: 'rejected', label: 'Rejected', count: stats.rejected },
  ];

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  return (
    <>
      <Header
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
        adminUser={adminUser}
        onLogout={handleLogout}
      />
      <main className="admin-page">
        {/* Header */}
        <section className="admin-hero">
          <div className="admin-hero-container">
            <span className="admin-badge">Admin Dashboard</span>
            <h1 className="admin-title">📋 Loan Applications Overview</h1>
            <p className="admin-subtitle">
              Review incoming requests, monitor provider responses, and manage applications through the approval pipeline.
            </p>
          </div>
        </section>

        <section className="admin-content">
          <div className="admin-content-container">
            {/* Stats Cards */}
            <div className="admin-stats">
              <div className="stat-card pending">
                <div className="stat-icon-wrapper">📬</div>
                <div className="stat-info">
                  <span className="stat-value">{stats.pendingReview}</span>
                  <span className="stat-label">Pending Review</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">📝</div>
                <div className="stat-info">
                  <span className="stat-value">{stats.total}</span>
                  <span className="stat-label">Total Applications</span>
                </div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon-wrapper">✅</div>
                <div className="stat-info">
                  <span className="stat-value">{stats.granted}</span>
                  <span className="stat-label">Granted</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">⏱️</div>
                <div className="stat-info">
                  <span className="stat-value">{stats.avgProcessingTime}h</span>
                  <span className="stat-label">Avg. Processing</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="admin-filters">
              <div className="filters-header">
                <h2>Applications</h2>
                <p>Filter by status, search, or provider to review the right queue.</p>
              </div>
              
              {/* Status Tabs */}
              <div className="filter-buttons">
                {statusOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-btn ${filters.status === option.value ? 'active' : ''}`}
                    onClick={() => handleStatusFilter(option.value)}
                  >
                    {option.label}
                    <span className="filter-count">{option.count}</span>
                  </button>
                ))}
              </div>

              {/* Search and Additional Filters */}
              <div className="filters-secondary">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by reference, name, email, or provider..."
                    value={filters.searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                  />
                </div>

                <select 
                  className="filter-select"
                  value={filters.providerId || ''}
                  onChange={handleProviderFilter}
                >
                  <option value="">All Providers</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>

                <div className="sort-controls">
                  <span className="sort-label">Sort:</span>
                  <button 
                    className={`sort-btn ${filters.sortBy === 'date' ? 'active' : ''}`}
                    onClick={() => handleSortChange('date')}
                  >
                    Date {filters.sortBy === 'date' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button 
                    className={`sort-btn ${filters.sortBy === 'amount' ? 'active' : ''}`}
                    onClick={() => handleSortChange('amount')}
                  >
                    Amount {filters.sortBy === 'amount' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </div>
              </div>
            </div>

            {loadError && (
              <div className="empty-state">
                <span className="empty-icon">⚠️</span>
                <h3>Could not load applications</h3>
                <p>{loadError}</p>
              </div>
            )}

            {actionError && (
              <div className="empty-state">
                <span className="empty-icon">⚠️</span>
                <h3>Action failed</h3>
                <p>{actionError}</p>
              </div>
            )}

            {/* Applications Table */}
            {isLoading ? (
              <div className="empty-state">
                <span className="empty-icon">⏳</span>
                <h3>Loading applications...</h3>
                <p>Please wait while we fetch the latest data.</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <h3>No applications found</h3>
                <p>Try adjusting your filters or search term</p>
              </div>
            ) : (
              <div className="admin-table">
                <div className="table-header">
                  <span>Reference</span>
                  <span>Applicant</span>
                  <span>Provider</span>
                  <span>Amount</span>
                  <span>Duration</span>
                  <span>Status</span>
                  <span>SLA</span>
                  <span>Actions</span>
                </div>

                {filteredApplications.map(app => {
                  const statusConfig = ADMIN_STATUS_CONFIG[app.status];
                  const slaInfo = calculateSlaInfo(app);
                  const canDecide = app.status === 'new' || app.status === 'preliminarily_accepted';

                  return (
                    <div 
                      key={app.id} 
                      className={`table-row ${slaInfo.isOverdue ? 'overdue' : ''}`}
                      onClick={() => setSelectedApplication(app)}
                    >
                      <span className="cell-ref">
                        <span className="ref-number">{app.referenceNumber}</span>
                        <span className="ref-date">{formatDate(app.createdAt)}</span>
                      </span>
                      <span className="cell-applicant">
                        <span className="applicant-name">
                          {app.applicant.firstName} {app.applicant.lastName}
                        </span>
                        <span className="applicant-email">{app.applicant.email}</span>
                      </span>
                      <span className="cell-provider">{app.provider.name}</span>
                      <span className="cell-amount">
                        <span className="amount-value">{formatCurrency(app.offer.amount)}</span>
                        <span className="installment">{formatCurrency(app.offer.monthlyInstallment)}/mo</span>
                      </span>
                      <span className="cell-duration">{app.offer.duration} mo</span>
                      <span className="cell-status">
                        <span 
                          className="status-pill"
                          style={{ 
                            color: statusConfig.color,
                            backgroundColor: statusConfig.bgColor,
                          }}
                        >
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </span>
                      <span className="cell-sla">
                        <span className={`sla-indicator sla-${slaInfo.urgencyLevel}`}>
                          {slaInfo.timeSinceSubmission < 24 
                            ? `${slaInfo.timeSinceSubmission.toFixed(0)}h`
                            : `${Math.floor(slaInfo.timeSinceSubmission / 24)}d`
                          }
                        </span>
                        {slaInfo.isOverdue && <span className="overdue-badge">!</span>}
                      </span>
                      <span className="cell-actions" onClick={e => e.stopPropagation()}>
                        <button 
                          className="action-btn view"
                          onClick={() => setSelectedApplication(app)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        {canDecide && (
                          <>
                            <button 
                              className="action-btn accept"
                              onClick={() => openAcceptModal(app)}
                              title="Accept"
                            >
                              ✓
                            </button>
                            <button 
                              className="action-btn reject"
                              onClick={() => openRejectModal(app)}
                              title="Reject"
                            >
                              ✗
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <AdminFooter />

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onAccept={() => {
            openAcceptModal(selectedApplication);
          }}
          onReject={() => {
            openRejectModal(selectedApplication);
          }}
        />
      )}

      {/* Decision Modal */}
      {decisionModal && (
        <DecisionModal
          applicationId={decisionModal.application.id}
          referenceNumber={decisionModal.application.referenceNumber}
          applicantName={`${decisionModal.application.applicant.firstName} ${decisionModal.application.applicant.lastName}`}
          decisionType={decisionModal.type}
          onClose={() => setDecisionModal(null)}
          onSubmit={handleDecisionSubmit}
        />
      )}
    </>
  );
}
