import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type {
  UserApplication,
  UserProfile,
  UserNotification,
  SavedSearch,
  ComparisonEntry,
  DashboardTab,
  UserStatusFilter,
} from '../../types/dashboard.types';
import { USER_STATUS_CONFIG, getDaysRemaining, isExpiringSoon } from '../../types/dashboard.types';
import {
  mockNotifications,
  mockSavedSearches,
  mockComparisonHistory,
  calculateUserDashboardStats,
} from '../../data/mockUserDashboardData';
import {
  cancelApplicationForCurrentUser,
  listApplicationsByEmail,
  listApplicationsForCurrentUser,
} from '../../api/applicationsApi';
import { getUserApplicationDocumentUrl, listUserApplicationDocuments } from '../../api/userDocumentsApi';
import { ApiError, clearAuthSession, getAuthSession } from '../../api/apiConfig';
import { Header, Footer } from '../../components';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './UserDashboardPage.css';

export function UserDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const storedProfileKeyPrefix = 'loanhub_user_profile_';
  const [authSession, setAuthSession] = useState(getAuthSession());
  
  // State
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    (searchParams.get('tab') as DashboardTab) || 'applications'
  );
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    id: 'guest',
    email: '',
    firstName: 'Guest',
    lastName: '',
    emailNotifications: true,
    smsNotifications: false,
    completionPercentage: 0,
  });
  const [notifications, setNotifications] = useState<UserNotification[]>(mockNotifications);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(mockSavedSearches);
  const [comparisonHistory] = useState<ComparisonEntry[]>(mockComparisonHistory);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all');
  const [selectedApplication, setSelectedApplication] = useState<UserApplication | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState<UserApplication | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [latestDocuments, setLatestDocuments] = useState<UserDocumentView[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [latestApplicationId, setLatestApplicationId] = useState<string | null>(null);
  
  // Stats
  const stats = useMemo(() => calculateUserDashboardStats(applications), [applications]);
  
  // Filtered applications
  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') return applications;
    return applications.filter(app => app.status === statusFilter);
  }, [applications, statusFilter]);
  
  // Unread notifications count
  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length, 
    [notifications]
  );
  
  // Handlers
  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  
  const handleResign = (app: UserApplication) => {
    setShowCancelModal(app);
  };
  
  const confirmResign = async () => {
    if (!showCancelModal) return;
    setCancelError(null);
    setIsCancelling(true);
    try {
      const updated = await cancelApplicationForCurrentUser(showCancelModal.id);
      const status = mapStatus(updated.status);
      setApplications(prev =>
        prev.map(app =>
          app.id === showCancelModal.id
            ? { ...app, status, canResign: false, canContinue: false }
            : app
        )
      );
      setShowCancelModal(null);
      setSelectedApplication(null);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'Your session has expired. Please log in again to cancel the application.'
          : err instanceof Error
            ? err.message
            : 'Unable to cancel the application.';
      setCancelError(message);
    } finally {
      setIsCancelling(false);
    }
  };
  
  const handleMarkAsRead = (notifId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };
  
  const handleDeleteSavedSearch = (searchId: string) => {
    setSavedSearches(prev => prev.filter(s => s.id !== searchId));
  };
  
  const handleApplyAgain = (search: SavedSearch) => {
    navigate(`/search?amount=${search.amount}&duration=${search.duration}${search.monthlyIncome ? `&income=${search.monthlyIncome}` : ''}`);
  };
  
  const handleRerunComparison = (entry: ComparisonEntry) => {
    navigate(`/search?amount=${entry.searchParams.amount}&duration=${entry.searchParams.duration}`);
  };
  
  const handleProfileUpdate = (updatedProfile: Partial<UserProfile>) => {
    setProfile(prev => {
      const merged = { ...prev, ...updatedProfile };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`${storedProfileKeyPrefix}${merged.id}`, JSON.stringify(merged));
      }
      return merged;
    });
    setIsEditingProfile(false);
  };

  const mapStatus = (status: number | string): UserApplication['status'] => {
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
        case 8:
        case 9:
          return 'accepted';
        default:
          return 'new';
      }
    }
    return (status as UserApplication['status']) ?? 'new';
  };

  useEffect(() => {
    const session = getAuthSession();
    setAuthSession(session);
    if (!session) {
      navigate('/login');
      return;
    }
    if (session) {
      const storedProfileRaw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(`${storedProfileKeyPrefix}${session.id}`)
          : null;
      let storedProfile: Partial<UserProfile> | null = null;
      if (storedProfileRaw) {
        try {
          storedProfile = JSON.parse(storedProfileRaw) as Partial<UserProfile>;
        } catch {
          storedProfile = null;
        }
      }
      setProfile((prev) => ({
        ...prev,
        ...storedProfile,
        id: session.id,
        email: session.email,
        firstName: storedProfile?.firstName || session.firstName || 'User',
        lastName: storedProfile?.lastName || session.lastName || '',
      }));
    }

    const mapApplications = (data: Awaited<ReturnType<typeof listApplicationsForCurrentUser>>) =>
      data.map((app) => {
        const status = mapStatus(app.status);
        const canResign = status === 'new' || status === 'preliminarily_accepted';
        return {
        id: app.id,
        referenceNumber: app.id,
        provider: {
          id: app.offerSnapshot.provider,
          name: app.offerSnapshot.provider,
        },
        amount: app.offerSnapshot.amount,
        duration: app.offerSnapshot.durationMonths,
        monthlyInstallment: app.offerSnapshot.installment,
        interestRate: app.offerSnapshot.apr,
        apr: app.offerSnapshot.apr,
        totalRepayment: app.offerSnapshot.totalCost,
        status,
        createdAt: new Date(app.createdAt),
        updatedAt: new Date(app.createdAt),
        expiresAt: new Date(app.offerSnapshot.validUntil),
        documentsRequired: [],
        documentsSubmitted: [],
        canResign,
        canContinue: false,
        };
      });

    const loadApplications = async () => {
      try {
        const data = await listApplicationsForCurrentUser();
        const mapped = mapApplications(data);

        if (mapped.length === 0 && session?.email) {
          const guestData = await listApplicationsByEmail(session.email);
          const guestMapped = mapApplications(guestData);
          const combined = new Map<string, UserApplication>();
          mapped.forEach((item) => combined.set(item.id, item));
          guestMapped.forEach((item) => combined.set(item.id, item));
          setApplications(Array.from(combined.values()));
        } else {
          setApplications(mapped);
        }
        setLoadError(null);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          if (session?.email) {
            try {
              const guestData = await listApplicationsByEmail(session.email);
              setApplications(mapApplications(guestData));
              setLoadError(null);
              return;
            } catch (guestError: unknown) {
              const message =
                guestError instanceof Error ? guestError.message : 'Unable to load applications.';
              setLoadError(message);
              setApplications([]);
              return;
            }
          }

          setApplications([]);
          setLoadError(null);
          return;
        }

        const message = err instanceof Error ? err.message : 'Unable to load applications.';
        setLoadError(message);
      }
    };

    loadApplications();
  }, []);

  useEffect(() => {
    const lastApplication = applications
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!lastApplication) {
      setLatestDocuments([]);
      setLatestApplicationId(null);
      return;
    }

    setLatestApplicationId(lastApplication.id);

    setDocumentsLoading(true);
    setDocumentsError(null);
    listUserApplicationDocuments(lastApplication.id)
      .then((docs) => {
        const mapped = docs.map(mapUserDocument);
        setLatestDocuments(mapped);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load documents.';
        setDocumentsError(message);
        setLatestDocuments([]);
      })
      .finally(() => setDocumentsLoading(false));
  }, [applications]);

  const dashboardUser = authSession
    ? {
        name: `${profile.firstName} ${profile.lastName}`.trim() || authSession.email,
        email: profile.email,
        role: 'User',
      }
    : undefined;

  return (
    <div className="dashboard-page">
      <Header 
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
        adminUser={dashboardUser}
        onLogout={() => {
          clearAuthSession();
          setAuthSession(null);
          navigate('/login');
        }}
      />
      
      <main className="dashboard-main">
        {/* Hero Section */}
        <section className="dashboard-hero">
          <div className="dashboard-hero-container">
            <div className="user-welcome">
              <div className="user-avatar">
                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
              </div>
              <div className="user-info">
                <h1 className="dashboard-title">
                  Welcome back, {profile.firstName}!
                </h1>
                <p className="dashboard-subtitle">
                  Manage your loan applications, documents, and profile settings
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-value">{stats.total}</span>
                <span className="quick-stat-label">Total Applications</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{stats.preApproved + stats.accepted}</span>
                <span className="quick-stat-label">In Progress</span>
              </div>
              <div className="quick-stat highlight">
                <span className="quick-stat-value">{stats.granted}</span>
                <span className="quick-stat-label">Granted</span>
              </div>
              {stats.expiringSoon > 0 && (
                <div className="quick-stat warning">
                  <span className="quick-stat-value">{stats.expiringSoon}</span>
                  <span className="quick-stat-label">Expiring Soon</span>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Dashboard Content */}
        <section className="dashboard-content">
          <div className="dashboard-content-container">
            {/* Navigation Tabs */}
            <nav className="dashboard-tabs">
              <button
                className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={() => handleTabChange('applications')}
              >
                <span className="tab-icon">📋</span>
                My Applications
              </button>
              <button
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                <span className="tab-icon">👤</span>
                Profile
              </button>
              <button
                className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => handleTabChange('documents')}
              >
                <span className="tab-icon">📄</span>
                Documents
              </button>
              <button
                className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleTabChange('notifications')}
              >
                <span className="tab-icon">🔔</span>
                Notifications
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => handleTabChange('saved')}
              >
                <span className="tab-icon">💾</span>
                Saved & History
              </button>
            </nav>
            
            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === 'applications' && (
                <ApplicationsSection
                  applications={filteredApplications}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  stats={stats}
                  loadError={loadError}
                  selectedApplication={selectedApplication}
                  onSelectApplication={setSelectedApplication}
                  onResign={handleResign}
                  onContinue={(app) => navigate(`/apply?ref=${app.referenceNumber}`)}
                  onStartSearch={() => navigate('/search')}
                />
              )}
              
              {activeTab === 'profile' && (
                <ProfileSection
                  profile={profile}
                  isEditing={isEditingProfile}
                  onEdit={() => setIsEditingProfile(true)}
                  onSave={handleProfileUpdate}
                  onCancel={() => setIsEditingProfile(false)}
                />
              )}
              
              {activeTab === 'documents' && (
                <DocumentsSection
                  applications={applications}
                  profile={profile}
                  latestDocuments={latestDocuments}
                  documentsLoading={documentsLoading}
                  documentsError={documentsError}
                  latestApplicationId={latestApplicationId}
                />
              )}
              
              {activeTab === 'notifications' && (
                <NotificationsSection
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                />
              )}
              
              {activeTab === 'saved' && (
                <SavedSection
                  savedSearches={savedSearches}
                  comparisonHistory={comparisonHistory}
                  onDeleteSearch={handleDeleteSavedSearch}
                  onApplyAgain={handleApplyAgain}
                  onRerunComparison={handleRerunComparison}
                />
              )}
            </div>
          </div>
        </section>
      </main>
      
      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(null)}>
          <div className="modal-content resign-modal" onClick={e => e.stopPropagation()}>
            <h2>Cancel application?</h2>
            <p>
              Are you sure you want to cancel application <strong>{showCancelModal.referenceNumber}</strong>?
            </p>
            <p className="warning-text">
              This action cannot be undone. You can apply again with a new search.
            </p>
            {cancelError && (
              <p className="error-text">
                {cancelError}
              </p>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(null)} disabled={isCancelling}>
                Keep Application
              </button>
              <button className="btn btn-danger" onClick={confirmResign} disabled={isCancelling}>
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}

// =====================================================
// Applications Section Component
// =====================================================
interface ApplicationsSectionProps {
  applications: UserApplication[];
  statusFilter: UserStatusFilter;
  onStatusFilterChange: (filter: UserStatusFilter) => void;
  stats: ReturnType<typeof calculateUserDashboardStats>;
  loadError: string | null;
  selectedApplication: UserApplication | null;
  onSelectApplication: (app: UserApplication | null) => void;
  onResign: (app: UserApplication) => void;
  onContinue: (app: UserApplication) => void;
  onStartSearch: () => void;
}

function ApplicationsSection({
  applications,
  statusFilter,
  onStatusFilterChange,
  stats,
  loadError,
  selectedApplication,
  onSelectApplication,
  onResign,
  onContinue,
  onStartSearch,
}: ApplicationsSectionProps) {
  const statusFilters: { value: UserStatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: stats.total },
    { value: 'new', label: 'New', count: stats.newCount },
    { value: 'preliminarily_accepted', label: 'Pre-approved', count: stats.preApproved },
    { value: 'accepted', label: 'Accepted', count: stats.accepted },
    { value: 'granted', label: 'Granted', count: stats.granted },
  ];

  return (
    <div className="applications-section">
      {/* Status Filters */}
      <div className="section-header">
        <h2>My Applications <span className="subtitle">(Last 10 days)</span></h2>
        <div className="filter-buttons">
          {statusFilters.map(filter => (
            <button
              key={filter.value}
              className={`filter-btn ${statusFilter === filter.value ? 'active' : ''}`}
              onClick={() => onStatusFilterChange(filter.value)}
            >
              {filter.label}
              <span className="filter-count">{filter.count}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Applications List */}
      <div className="applications-grid">
        {loadError ? (
          <div className="empty-state">
            <span className="empty-icon">⚠️</span>
            <h3>Unable to load applications</h3>
            <p>{loadError}</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>No applications found</h3>
            <p>Start a new loan search to see your applications here.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onStartSearch}
            >
              Start New Search
            </button>
          </div>
        ) : (
          applications.map(app => (
            <ApplicationCard
              key={app.id}
              application={app}
              isSelected={selectedApplication?.id === app.id}
              onSelect={() => onSelectApplication(selectedApplication?.id === app.id ? null : app)}
              onResign={() => onResign(app)}
              onContinue={() => onContinue(app)}
            />
          ))
        )}
      </div>
      
      {/* Selected Application Details */}
      {selectedApplication && (
        <ApplicationDetails
          application={selectedApplication}
          onClose={() => onSelectApplication(null)}
          onResign={() => onResign(selectedApplication)}
          onContinue={() => onContinue(selectedApplication)}
        />
      )}
    </div>
  );
}

// Application Card Component
interface ApplicationCardProps {
  application: UserApplication;
  isSelected: boolean;
  onSelect: () => void;
  onResign: () => void;
  onContinue: () => void;
}

function ApplicationCard({ application, isSelected, onSelect, onResign, onContinue }: ApplicationCardProps) {
  const statusConfig = USER_STATUS_CONFIG[application.status];
  const daysRemaining = getDaysRemaining(application.expiresAt);
  const expiringSoon = isExpiringSoon(application.expiresAt);
  const isActive = !['granted', 'rejected', 'expired', 'cancelled'].includes(application.status);
  
  return (
    <div className={`application-card ${isSelected ? 'selected' : ''} ${expiringSoon && isActive ? 'expiring' : ''}`}>
      <div className="card-header" onClick={onSelect}>
        <div className="provider-info">
          <div className="provider-logo">
            {application.provider.name.charAt(0)}
          </div>
          <div className="provider-details">
            <span className="provider-name">{application.provider.name}</span>
            <span className="reference-number">{application.referenceNumber}</span>
          </div>
        </div>
        <div 
          className="status-badge"
          style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
        >
          <span className="status-icon">{statusConfig.icon}</span>
          {statusConfig.label}
        </div>
      </div>
      
      <div className="card-body" onClick={onSelect}>
        <div className="loan-details">
          <div className="detail-item">
            <span className="detail-label">Amount</span>
            <span className="detail-value">{formatCurrency(application.amount)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Duration</span>
            <span className="detail-value">{application.duration} months</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Monthly</span>
            <span className="detail-value">{formatCurrency(application.monthlyInstallment)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">APR</span>
            <span className="detail-value">{application.apr}%</span>
          </div>
        </div>
        
        {isActive && (
          <div className={`validity-countdown ${expiringSoon ? 'warning' : ''}`}>
            <span className="countdown-icon">⏳</span>
            <span className="countdown-text">
              {daysRemaining > 0 
                ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                : 'Expires today'
              }
            </span>
          </div>
        )}
        
        {application.nextStep && isActive && (
          <div className="next-step">
            <span className="step-icon">👉</span>
            <span className="step-text">{application.nextStep}</span>
          </div>
        )}
      </div>
      
      {(application.canResign || application.canContinue) && (
        <div className="card-actions">
          {application.canContinue && (
            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onContinue(); }}>
              Continue
            </button>
          )}
          {application.canResign && (
            <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); onResign(); }}>
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Application Details Component
interface ApplicationDetailsProps {
  application: UserApplication;
  onClose: () => void;
  onResign: () => void;
  onContinue: () => void;
}

function ApplicationDetails({ application, onClose, onResign, onContinue }: ApplicationDetailsProps) {
  const statusConfig = USER_STATUS_CONFIG[application.status];
  const daysRemaining = getDaysRemaining(application.expiresAt);
  const isActive = !['granted', 'rejected', 'expired', 'cancelled'].includes(application.status);
  
  return (
    <div className="application-details">
      <div className="details-header">
        <h3>Application Details</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="details-content">
        {/* Status Banner */}
        <div 
          className="status-banner"
          style={{ backgroundColor: statusConfig.bgColor, borderColor: statusConfig.color }}
        >
          <span className="status-icon">{statusConfig.icon}</span>
          <div className="status-info">
            <strong>{statusConfig.label}</strong>
            <p>{application.statusMessage || statusConfig.description}</p>
          </div>
        </div>
        
        {/* Offer Summary */}
        <div className="details-section">
          <h4>Loan Offer Summary</h4>
          <div className="offer-summary">
            <div className="summary-row">
              <span>Provider</span>
              <span>{application.provider.name}</span>
            </div>
            <div className="summary-row">
              <span>Loan Amount</span>
              <span>{formatCurrency(application.amount)}</span>
            </div>
            <div className="summary-row">
              <span>Duration</span>
              <span>{application.duration} months</span>
            </div>
            <div className="summary-row">
              <span>Monthly Installment</span>
              <span className="highlight">{formatCurrency(application.monthlyInstallment)}</span>
            </div>
            <div className="summary-row">
              <span>Interest Rate</span>
              <span>{application.interestRate}%</span>
            </div>
            <div className="summary-row">
              <span>APR</span>
              <span>{application.apr}%</span>
            </div>
            <div className="summary-row total">
              <span>Total Repayment</span>
              <span>{formatCurrency(application.totalRepayment)}</span>
            </div>
          </div>
        </div>
        
        {/* Validity */}
        {isActive && (
          <div className="details-section">
            <h4>Offer Validity</h4>
            <div className={`validity-info ${daysRemaining <= 3 ? 'warning' : ''}`}>
              <div className="validity-bar">
                <div 
                  className="validity-progress"
                  style={{ width: `${Math.max(0, Math.min(100, (daysRemaining / 10) * 100))}%` }}
                />
              </div>
              <p>
                {daysRemaining > 0 
                  ? `This offer expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                  : 'This offer expires today'
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Documents Status */}
        {application.documentsRequired.length > 0 && (
          <div className="details-section">
            <h4>Required Documents</h4>
            <div className="documents-list">
              {application.documentsRequired.map(doc => (
                <div key={doc.id} className={`document-item ${doc.status}`}>
                  <span className="doc-icon">
                    {doc.status === 'verified' ? '✅' : doc.status === 'uploaded' ? '📤' : doc.status === 'rejected' ? '❌' : '📄'}
                  </span>
                  <span className="doc-name">{doc.name}</span>
                  <span className={`doc-status ${doc.status}`}>
                    {doc.status === 'verified' ? 'Verified' : doc.status === 'uploaded' ? 'Pending Review' : doc.status === 'rejected' ? 'Rejected' : 'Required'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Timeline */}
        <div className="details-section">
          <h4>Timeline</h4>
          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-date">{formatDate(application.createdAt)}</span>
              <span className="timeline-event">Application submitted</span>
            </div>
            {application.status !== 'new' && (
              <div className="timeline-item">
                <span className="timeline-date">{formatDate(application.updatedAt)}</span>
                <span className="timeline-event">Status updated to {statusConfig.label}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {(application.canResign || application.canContinue) && (
          <div className="details-actions">
            {application.canContinue && (
              <button className="btn btn-primary" onClick={onContinue}>
                Continue Application
              </button>
            )}
            {application.canResign && (
              <button className="btn btn-outline btn-danger-outline" onClick={onResign}>
                Cancel application
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Profile Section Component
// =====================================================
interface ProfileSectionProps {
  profile: UserProfile;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (profile: Partial<UserProfile>) => void;
  onCancel: () => void;
}

function ProfileSection({ profile, isEditing, onEdit, onSave, onCancel }: ProfileSectionProps) {
  const [formData, setFormData] = useState<UserProfile>(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);
  
  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      }
      // Handle nested fields like 'address.street'
      const [parent, child] = keys;
      return {
        ...prev,
        [parent]: {
          ...(prev[parent as keyof UserProfile] as object),
          [child]: value,
        },
      };
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>Profile Settings</h2>
        {!isEditing && (
          <button className="btn btn-primary" onClick={onEdit}>
            Edit Profile
          </button>
        )}
      </div>
      
      {/* Profile Completion */}
      <div className="profile-completion">
        <div className="completion-header">
          <span>Profile Completion</span>
          <span className="completion-percentage">{profile.completionPercentage}%</span>
        </div>
        <div className="completion-bar">
          <div 
            className="completion-progress"
            style={{ width: `${profile.completionPercentage}%` }}
          />
        </div>
        <p className="completion-hint">
          Complete your profile to get better loan offers and faster approvals.
        </p>
      </div>
      
      <form className="profile-form" onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="readonly"
              />
              <span className="field-hint">Email cannot be changed</span>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={e => handleChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder="+48 123 456 789"
              />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                onChange={e => handleChange('dateOfBirth', e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
        
        {/* Address */}
        <div className="form-section">
          <h3>Address</h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Street Address</label>
              <input
                type="text"
                value={formData.address?.street || ''}
                onChange={e => handleChange('address.street', e.target.value)}
                disabled={!isEditing}
                placeholder="ul. Przykładowa 123"
              />
            </div>
            <div className="form-group">
              <label>Apartment</label>
              <input
                type="text"
                value={formData.address?.apartment || ''}
                onChange={e => handleChange('address.apartment', e.target.value)}
                disabled={!isEditing}
                placeholder="3A"
              />
            </div>
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.address?.city || ''}
                onChange={e => handleChange('address.city', e.target.value)}
                disabled={!isEditing}
                placeholder="Warszawa"
              />
            </div>
            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                value={formData.address?.postalCode || ''}
                onChange={e => handleChange('address.postalCode', e.target.value)}
                disabled={!isEditing}
                placeholder="00-001"
              />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                value={formData.address?.country || ''}
                onChange={e => handleChange('address.country', e.target.value)}
                disabled={!isEditing}
                placeholder="Poland"
              />
            </div>
          </div>
        </div>
        
        {/* Employment */}
        <div className="form-section">
          <h3>Employment Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Employment Status</label>
              <select
                value={formData.employment?.status || ''}
                onChange={e => handleChange('employment.status', e.target.value)}
                disabled={!isEditing}
              >
                <option value="">Select status</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="form-group">
              <label>Employer Name</label>
              <input
                type="text"
                value={formData.employment?.employerName || ''}
                onChange={e => handleChange('employment.employerName', e.target.value)}
                disabled={!isEditing}
                placeholder="Company Name"
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                value={formData.employment?.position || ''}
                onChange={e => handleChange('employment.position', e.target.value)}
                disabled={!isEditing}
                placeholder="Job Title"
              />
            </div>
            <div className="form-group">
              <label>Contract Type</label>
              <select
                value={formData.employment?.contractType || ''}
                onChange={e => handleChange('employment.contractType', e.target.value)}
                disabled={!isEditing}
              >
                <option value="">Select type</option>
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
                <option value="contract">Contract</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Financial */}
        <div className="form-section">
          <h3>Financial Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Monthly Income</label>
              <div className="input-wrapper">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  value={formData.monthlyIncome || ''}
                  onChange={e => handleChange('monthlyIncome', Number(e.target.value))}
                  disabled={!isEditing}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Living Costs</label>
              <div className="input-wrapper">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  value={formData.livingCosts || ''}
                  onChange={e => handleChange('livingCosts', Number(e.target.value))}
                  disabled={!isEditing}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Number of Dependents</label>
              <input
                type="number"
                value={formData.dependents ?? ''}
                onChange={e => handleChange('dependents', Number(e.target.value))}
                disabled={!isEditing}
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        
        {/* Notifications Preferences */}
        <div className="form-section">
          <h3>Notification Preferences</h3>
          <div className="preferences-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={e => handleChange('emailNotifications', e.target.checked)}
                disabled={!isEditing}
              />
              <span className="checkbox-text">
                <strong>Email Notifications</strong>
                <small>Receive updates about your applications via email</small>
              </span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.smsNotifications}
                onChange={e => handleChange('smsNotifications', e.target.checked)}
                disabled={!isEditing}
              />
              <span className="checkbox-text">
                <strong>SMS Notifications</strong>
                <small>Get important alerts via text message</small>
              </span>
            </label>
          </div>
        </div>
        
        {/* Form Actions */}
        {isEditing && (
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// =====================================================
// Documents Section Component
// =====================================================
interface UserDocumentView {
  id: string;
  name: string;
  type: string;
  side: string;
  uploadedAt: Date;
  size: number;
  status: 'pending' | 'verified' | 'rejected';
}

const mapUserDocument = (doc: {
  blobName: string;
  originalFileName: string;
  documentType: string;
  documentSide: string;
  sizeBytes: number;
  uploadedAt: string;
}): UserDocumentView => {
  return {
    id: doc.blobName,
    name: doc.originalFileName,
    type: doc.documentType,
    side: doc.documentSide,
    uploadedAt: new Date(doc.uploadedAt),
    size: doc.sizeBytes,
    status: 'pending',
  };
};

interface DocumentsSectionProps {
  applications: UserApplication[];
  profile: UserProfile;
  latestDocuments: UserDocumentView[];
  documentsLoading: boolean;
  documentsError: string | null;
  latestApplicationId: string | null;
}

function DocumentsSection({
  applications,
  profile,
  latestDocuments,
  documentsLoading,
  documentsError,
  latestApplicationId,
}: DocumentsSectionProps) {
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<UserDocumentView | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  // Get all required documents across applications
  const pendingDocuments = applications
    .filter(app => !['granted', 'rejected', 'expired', 'cancelled'].includes(app.status))
    .flatMap(app => 
      app.documentsRequired
        .filter(doc => doc.status === 'pending')
        .map(doc => ({ ...doc, applicationRef: app.referenceNumber, applicationId: app.id }))
    );
  
  const handleUpload = (docType: string, applicationId: string) => {
    // In real app, this would open file picker and upload
    setUploadingFor(`${docType}-${applicationId}`);
    setTimeout(() => setUploadingFor(null), 2000); // Simulate upload
  };

  return (
    <div className="documents-section">
      <div className="section-header">
        <h2>Documents</h2>
      </div>
      
      {/* ID Verification Status */}
      <div className="id-verification">
        <div className="verification-header">
          <h3>Identity Verification</h3>
          <span className={`verification-status ${profile.idDocument?.verified ? 'verified' : 'pending'}`}>
            {profile.idDocument?.verified ? '✅ Verified' : '⏳ Pending'}
          </span>
        </div>
        {profile.idDocument ? (
          <div className="id-info">
            <p>
              <strong>Document Type:</strong> {profile.idDocument.type.replace('_', ' ').toUpperCase()}
            </p>
            <p>
              <strong>Number:</strong> {profile.idDocument.number.replace(/./g, (c, i) => i < 3 ? c : '*')}
            </p>
            {profile.idDocument.expiryDate && (
              <p>
                <strong>Expires:</strong> {formatDate(profile.idDocument.expiryDate)}
              </p>
            )}
          </div>
        ) : (
          <div className="no-id">
            <p>No ID document on file. Upload your ID to verify your identity.</p>
            <button className="btn btn-primary">Upload ID Document</button>
          </div>
        )}
      </div>
      
      {/* Pending Documents */}
      {pendingDocuments.length > 0 && (
        <div className="documents-list-section">
          <h3>Required Documents</h3>
          <p className="section-description">
            These documents are needed to process your applications.
          </p>
          <div className="documents-grid">
            {pendingDocuments.map(doc => (
              <div key={`${doc.id}-${doc.applicationId}`} className="document-card pending">
                <div className="doc-icon-large">📄</div>
                <div className="doc-info">
                  <h4>{doc.name}</h4>
                  <p className="doc-description">{doc.description}</p>
                  <span className="doc-application">For: {doc.applicationRef}</span>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleUpload(doc.type, doc.applicationId)}
                  disabled={uploadingFor === `${doc.type}-${doc.applicationId}`}
                >
                  {uploadingFor === `${doc.type}-${doc.applicationId}` ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Latest Application Documents */}
      <div className="documents-list-section">
        <h3>Documents from Last Application</h3>
        {documentsLoading ? (
          <div className="empty-state small">
            <p>Loading documents...</p>
          </div>
        ) : documentsError ? (
          <div className="empty-state small">
            <p>{documentsError}</p>
          </div>
        ) : latestDocuments.length === 0 ? (
          <div className="empty-state small">
            <p>No documents submitted for the latest application.</p>
          </div>
        ) : (
          <table className="documents-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Side</th>
                <th>Uploaded</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {latestDocuments.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="doc-cell">
                      <span className="doc-icon-small">📄</span>
                      <div>
                        <span className="doc-name">{doc.name}</span>
                        <span className="doc-filename">{doc.type.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </td>
                  <td>{doc.side?.toUpperCase?.() ?? 'N/A'}</td>
                  <td>{formatDate(doc.uploadedAt)}</td>
                  <td>
                    <span className={`doc-status-badge ${doc.status}`}>
                      {doc.status === 'verified' ? '✅ Verified' : doc.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      title="View"
                      onClick={async () => {
                        if (!latestApplicationId) {
                          setPreviewError('No application found for document preview.');
                          return;
                        }
                        setPreviewDoc(doc);
                        setPreviewUrl(null);
                        setPreviewError(null);
                        setPreviewLoading(true);
                        try {
                          const url = await getUserApplicationDocumentUrl(latestApplicationId, doc.id);
                          setPreviewUrl(url);
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : 'Unable to load document preview.';
                          setPreviewError(message);
                        } finally {
                          setPreviewLoading(false);
                        }
                      }}
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {previewDoc && (
        <UserDocumentPreviewModal
          document={previewDoc}
          url={previewUrl}
          isLoading={previewLoading}
          error={previewError}
          onClose={() => {
            setPreviewDoc(null);
            setPreviewUrl(null);
            setPreviewError(null);
          }}
        />
      )}
    </div>
  );
}

function UserDocumentPreviewModal({
  document,
  url,
  isLoading,
  error,
  onClose,
}: {
  document: UserDocumentView;
  url: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const fileExtension = document.name.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <div>
            <h3 className="preview-title">{document.name}</h3>
            <p className="preview-subtitle">{document.type.replace(/_/g, ' ')}</p>
          </div>
          <button className="preview-close" onClick={onClose}>×</button>
        </div>
        <div className="preview-body">
          {isLoading && (
            <div className="preview-loading">Loading document...</div>
          )}
          {!isLoading && error && (
            <div className="preview-error">{error}</div>
          )}
          {!isLoading && !error && url && (
            <div className="preview-content">
              {isImage && (
                <img src={url} alt={document.name} className="preview-image" />
              )}
              {isPdf && (
                <iframe title={document.name} src={url} className="preview-frame" />
              )}
              {!isImage && !isPdf && (
                <a className="preview-download" href={url} target="_blank" rel="noreferrer">
                  Download file
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Notifications Section Component
// =====================================================
interface NotificationsSectionProps {
  notifications: UserNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

function NotificationsSection({ notifications, onMarkAsRead, onMarkAllAsRead }: NotificationsSectionProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const getNotificationIcon = (type: UserNotification['type']) => {
    switch (type) {
      case 'application_status': return '📋';
      case 'document_required': return '📄';
      case 'document_verified': return '✅';
      case 'document_rejected': return '❌';
      case 'offer_expiring': return '⏰';
      case 'offer_expired': return '⌛';
      case 'system': return '🔔';
      default: return '📬';
    }
  };

  return (
    <div className="notifications-section">
      <div className="section-header">
        <h2>
          Notifications
          {unreadCount > 0 && <span className="unread-badge">{unreadCount} unread</span>}
        </h2>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={onMarkAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>
      
      {/* Email Status */}
      <div className="email-status">
        <div className="email-status-icon">📧</div>
        <div className="email-status-info">
          <strong>Email Notifications Active</strong>
          <p>You're receiving notifications at jan.kowalski@example.com</p>
        </div>
        <a href="#" className="email-settings-link">Manage Preferences →</a>
      </div>
      
      {/* Notifications List */}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔔</span>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
              onClick={() => !notif.isRead && onMarkAsRead(notif.id)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notif.type)}
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notif.title}</h4>
                  <span className="notification-time">
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <p>{notif.message}</p>
                {notif.actionUrl && (
                  <a href={notif.actionUrl} className="notification-action">
                    View Details →
                  </a>
                )}
              </div>
              {!notif.isRead && <div className="unread-indicator" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =====================================================
// Saved & History Section Component
// =====================================================
interface SavedSectionProps {
  savedSearches: SavedSearch[];
  comparisonHistory: ComparisonEntry[];
  onDeleteSearch: (id: string) => void;
  onApplyAgain: (search: SavedSearch) => void;
  onRerunComparison: (entry: ComparisonEntry) => void;
}

function SavedSection({ 
  savedSearches, 
  comparisonHistory, 
  onDeleteSearch, 
  onApplyAgain,
  onRerunComparison,
}: SavedSectionProps) {
  return (
    <div className="saved-section">
      {/* Saved Searches */}
      <div className="saved-searches">
        <div className="section-header">
          <h2>Saved Searches</h2>
        </div>
        
        {savedSearches.length === 0 ? (
          <div className="empty-state small">
            <span className="empty-icon">💾</span>
            <h3>No saved searches</h3>
            <p>Save your search criteria for quick access later.</p>
          </div>
        ) : (
          <div className="saved-grid">
            {savedSearches.map(search => (
              <div key={search.id} className="saved-card">
                <div className="saved-header">
                  <h4>{search.name}</h4>
                  <button 
                    className="btn-icon delete"
                    onClick={() => onDeleteSearch(search.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
                <div className="saved-details">
                  <div className="saved-detail">
                    <span className="label">Amount:</span>
                    <span className="value">{formatCurrency(search.amount)}</span>
                  </div>
                  <div className="saved-detail">
                    <span className="label">Duration:</span>
                    <span className="value">{search.duration} months</span>
                  </div>
                  {search.monthlyIncome && (
                    <div className="saved-detail">
                      <span className="label">Income:</span>
                      <span className="value">{formatCurrency(search.monthlyIncome)}</span>
                    </div>
                  )}
                </div>
                <div className="saved-meta">
                  <span>Created {formatRelativeTime(search.createdAt)}</span>
                  {search.lastUsed && (
                    <span>Last used {formatRelativeTime(search.lastUsed)}</span>
                  )}
                </div>
                <button 
                  className="btn btn-primary btn-full"
                  onClick={() => onApplyAgain(search)}
                >
                  Apply Again
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Comparison History */}
      <div className="comparison-history">
        <div className="section-header">
          <h2>Comparison History</h2>
        </div>
        
        {comparisonHistory.length === 0 ? (
          <div className="empty-state small">
            <span className="empty-icon">📊</span>
            <h3>No comparison history</h3>
            <p>Your loan comparisons will appear here.</p>
          </div>
        ) : (
          <div className="history-list">
            {comparisonHistory.map(entry => (
              <div key={entry.id} className="history-card">
                <div className="history-header">
                  <div className="history-params">
                    <span>{formatCurrency(entry.searchParams.amount)}</span>
                    <span className="separator">•</span>
                    <span>{entry.searchParams.duration} months</span>
                  </div>
                  <span className="history-date">{formatRelativeTime(entry.createdAt)}</span>
                </div>
                <div className="history-offers">
                  {entry.offers.map((offer, idx) => (
                    <div key={idx} className="history-offer">
                      <span className="provider">{offer.providerName}</span>
                      <span className="apr">{offer.apr}% APR</span>
                      <span className="monthly">{formatCurrency(offer.monthlyInstallment)}/mo</span>
                    </div>
                  ))}
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => onRerunComparison(entry)}
                >
                  Search Again
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function for relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export default UserDashboardPage;
