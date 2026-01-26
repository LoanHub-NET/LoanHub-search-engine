import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  LoanApplication,
  StatusFilter,
  ApplicationFilters,
  DecisionPayload,
  DashboardStats,
  StatusHistoryEntry,
} from '../../types/admin.types';
import { ADMIN_STATUS_CONFIG, calculateSlaInfo } from '../../types/admin.types';
import { ApplicationDetailModal, DecisionModal } from '../../components/admin';
import { Header, Footer } from '../../components';
import type { AdminUser } from '../../components/Header/Header';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculateDashboardStats } from '../../utils/adminDashboard';
import {
  getAdminApplication,
  listAdminApplications,
  preliminarilyAcceptApplication,
  rejectApplication,
} from '../../api/adminApplicationsApi';
import { clearAuthSession, getAuthSession } from '../../api/apiConfig';
import './AdminDashboardPage.css';

type SortKey = 'date' | 'amount' | 'status';

const buildReferenceNumber = (id: string) => `APP-${id.slice(0, 8).toUpperCase()}`;

const mapStatusHistory = (entries: Array<{ status: string; changedAt: string; reason?: string | null }>) => {
  const sorted = [...entries].sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
  return sorted.reduce<StatusHistoryEntry[]>((acc, entry, index) => {
    const previousStatus = index > 0 ? acc[index - 1]?.newStatus ?? null : null;
    acc.push({
      id: `history-${entry.status}-${entry.changedAt}-${index}`,
      previousStatus,
      newStatus: entry.status as LoanApplication['status'],
      changedAt: new Date(entry.changedAt),
      changedBy: 'system',
      reason: entry.reason ?? undefined,
    });
    return acc;
  }, []);
};

const mapAdminField = <T,>(data: Record<string, T | undefined>, camel: string, pascal: string) =>
  data[camel] ?? data[pascal];

const mapAdminApplication = (data: Awaited<ReturnType<typeof getAdminApplication>>): LoanApplication => {
  const applicantDetails =
    mapAdminField(data as Record<string, any>, 'applicantDetails', 'ApplicantDetails') ?? {};
  const offerSnapshot = mapAdminField(data as Record<string, any>, 'offerSnapshot', 'OfferSnapshot') ?? {};
  const statusHistory =
    mapAdminField(data as Record<string, any>, 'statusHistory', 'StatusHistory') ?? [];
  const rejectReason = mapAdminField(data as Record<string, any>, 'rejectReason', 'RejectReason');
  const createdAt = mapAdminField(data as Record<string, any>, 'createdAt', 'CreatedAt');
  const updatedAt = mapAdminField(data as Record<string, any>, 'updatedAt', 'UpdatedAt');
  const validUntil = mapAdminField(data as Record<string, any>, 'validUntil', 'ValidUntil');

  return {
    id: data.id,
    referenceNumber: buildReferenceNumber(data.id),
    applicant: {
      email: data.applicantEmail,
      firstName: applicantDetails.firstName ?? '',
      lastName: applicantDetails.lastName ?? '',
      monthlyIncome: undefined,
      livingCosts: undefined,
      dependents: undefined,
      isRegistered: Boolean(data.userId),
      employment: applicantDetails.jobTitle
        ? {
            status: 'employed',
            jobTitle: applicantDetails.jobTitle,
          }
        : undefined,
      address: applicantDetails.address
        ? {
            street: applicantDetails.address,
            city: '',
            postalCode: '',
            country: '',
          }
        : undefined,
    },
    offer: {
      offerId: offerSnapshot.providerOfferId ?? '',
      amount: offerSnapshot.amount ?? 0,
      duration: offerSnapshot.durationMonths ?? 0,
      monthlyInstallment: offerSnapshot.installment ?? 0,
      interestRate: offerSnapshot.apr ?? 0,
      apr: offerSnapshot.apr ?? 0,
      totalRepayment: offerSnapshot.totalCost ?? 0,
    },
    provider: {
      id: offerSnapshot.provider ?? 'unknown',
      name: offerSnapshot.provider ?? 'Unknown provider',
    },
    status: data.status as LoanApplication['status'],
    statusHistory: mapStatusHistory(statusHistory),
    documents: [],
    createdAt: createdAt ? new Date(createdAt) : new Date(),
    updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    expiresAt: validUntil ? new Date(validUntil) : new Date(),
    internalNotes: [],
    providerResponse: rejectReason
      ? {
          status: 'rejected',
          respondedAt: updatedAt ? new Date(updatedAt) : undefined,
          message: rejectReason ?? undefined,
        }
      : undefined,
  };
};

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>({
    status: 'all',
    searchTerm: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    application: LoanApplication;
    type: 'accept' | 'reject';
  } | null>(null);

  const adminUser = useMemo<AdminUser | undefined>(() => {
    const session = getAuthSession();
    if (!session) return undefined;
    const displayName = [session.firstName, session.lastName].filter(Boolean).join(' ').trim();
    return {
      name: displayName || session.email,
      email: session.email,
      role: session.role === 'Admin' ? 'Administrator' : session.role,
    };
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const page = await listAdminApplications({ pageSize: 200 });
      const details = await Promise.all(page.items.map(item => getAdminApplication(item.id)));
      const mapped = details.map(mapAdminApplication);
      setApplications(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load applications.';
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Calculate stats
  const stats: DashboardStats = useMemo(() => {
    return calculateDashboardStats(applications);
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

  const providerOptions = useMemo(() => {
    const unique = new Map<string, string>();
    applications.forEach(app => {
      if (!unique.has(app.provider.id)) {
        unique.set(app.provider.id, app.provider.name);
      }
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [applications]);

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
    try {
      const response =
        decision.decision === 'accept'
          ? await preliminarilyAcceptApplication(decision.applicationId)
          : await rejectApplication(decision.applicationId, decision.reason);
      const updated = mapAdminApplication(response);
      setApplications(prev => prev.map(app => (app.id === updated.id ? updated : app)));
      setDecisionModal(null);
      setSelectedApplication(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update application.';
      setLoadError(message);
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
    navigate('/');
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
                  {providerOptions.map(provider => (
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

            {/* Applications Table */}
            {isLoading ? (
              <div className="empty-state">
                <span className="empty-icon">⏳</span>
                <h3>Loading applications...</h3>
                <p>Fetching the latest submissions from the database.</p>
              </div>
            ) : loadError ? (
              <div className="empty-state">
                <span className="empty-icon">⚠️</span>
                <h3>Unable to load applications</h3>
                <p>{loadError}</p>
                <button className="btn btn-secondary" onClick={fetchApplications}>
                  Retry
                </button>
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
      <Footer />

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
