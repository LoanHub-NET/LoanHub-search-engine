import { useEffect, useMemo, useState } from 'react';
import type { 
  LoanApplication, 
  ApplicationDocument, 
  StatusHistoryEntry,
  SlaInfo,
} from '../../types/admin.types';
import { ADMIN_STATUS_CONFIG, calculateSlaInfo } from '../../types/admin.types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getApplicationDocumentUrl, listApplicationDocuments } from '../../api/adminDocumentsApi';
import './ApplicationDetailModal.css';

interface ApplicationDetailModalProps {
  application: LoanApplication;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
}

type TabId = 'overview' | 'applicant' | 'documents' | 'history' | 'provider';

export function ApplicationDetailModal({
  application,
  onClose,
  onAccept,
  onReject,
}: ApplicationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [documents, setDocuments] = useState<ApplicationDocument[]>(application.documents);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const slaInfo = calculateSlaInfo(application);
  const statusConfig = ADMIN_STATUS_CONFIG[application.status];

  const mappedDocuments = useMemo(() => documents, [documents]);

  useEffect(() => {
    setDocumentsLoading(true);
    setDocumentsError(null);
    listApplicationDocuments(application.id)
      .then((docs) => {
        const mapped = docs.map((doc) => mapApiDocument(doc));
        setDocuments(mapped.length > 0 ? mapped : application.documents);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load documents.';
        setDocumentsError(message);
        setDocuments(application.documents);
      })
      .finally(() => {
        setDocumentsLoading(false);
      });
  }, [application.id, application.documents]);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'applicant', label: 'Applicant', icon: '👤' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'provider', label: 'Provider', icon: '🏦' },
  ];

  const canMakeDecision = application.status === 'new' || application.status === 'preliminarily_accepted';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content application-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <h2>{application.referenceNumber}</h2>
            <div className="modal-header-meta">
              <span 
                className="status-badge"
                style={{ 
                  color: statusConfig.color,
                  backgroundColor: statusConfig.bgColor,
                }}
              >
                {statusConfig.icon} {statusConfig.label}
              </span>
              <SlaTimer slaInfo={slaInfo} />
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {activeTab === 'overview' && (
            <OverviewTab application={application} slaInfo={slaInfo} />
          )}
          {activeTab === 'applicant' && (
            <ApplicantTab application={application} />
          )}
          {activeTab === 'documents' && (
            <DocumentsTab
              documents={mappedDocuments}
              isLoading={documentsLoading}
              error={documentsError}
              onView={async (doc) => {
                if (!doc.blobName) return;
                setPreviewDoc(doc);
                setPreviewUrl(null);
                setPreviewError(null);
                setPreviewLoading(true);
                try {
                  const url = await getApplicationDocumentUrl(application.id, doc.blobName);
                  setPreviewUrl(url);
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Unable to load document preview.';
                  setPreviewError(message);
                } finally {
                  setPreviewLoading(false);
                }
              }}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab history={application.statusHistory} notes={application.internalNotes} />
          )}
          {activeTab === 'provider' && (
            <ProviderTab application={application} />
          )}
        </div>

        {previewDoc && (
          <DocumentPreviewModal
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

        {/* Footer Actions */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {canMakeDecision && (
            <>
              <button className="btn btn-danger" onClick={onReject}>
                ❌ Reject
              </button>
              <button className="btn btn-success" onClick={onAccept}>
                ✅ Accept
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// SLA Timer Component
function SlaTimer({ slaInfo }: { slaInfo: SlaInfo }) {
  const urgencyClass = `sla-timer sla-${slaInfo.urgencyLevel}`;
  
  return (
    <div className={urgencyClass}>
      <span className="sla-icon">⏱️</span>
      <span className="sla-time">
        {slaInfo.timeSinceSubmission < 24 
          ? `${slaInfo.timeSinceSubmission.toFixed(1)}h ago`
          : `${Math.floor(slaInfo.timeSinceSubmission / 24)}d ${Math.round(slaInfo.timeSinceSubmission % 24)}h ago`
        }
      </span>
      {slaInfo.isOverdue && <span className="sla-overdue">OVERDUE</span>}
      {slaInfo.timeToDecision && (
        <span className="sla-decision">
          Decision: {slaInfo.timeToDecision.toFixed(1)}h
        </span>
      )}
    </div>
  );
}

// Overview Tab
function OverviewTab({ application, slaInfo }: { application: LoanApplication; slaInfo: SlaInfo }) {
  return (
    <div className="tab-content overview-tab">
      {/* Loan Details */}
      <section className="detail-section">
        <h3>💰 Loan Details</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Amount</span>
            <span className="detail-value highlight">{formatCurrency(application.offer.amount)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Duration</span>
            <span className="detail-value">{application.offer.duration} months</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Monthly Installment</span>
            <span className="detail-value">{formatCurrency(application.offer.monthlyInstallment)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Interest Rate</span>
            <span className="detail-value">{application.offer.interestRate}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">APR</span>
            <span className="detail-value">{application.offer.apr}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Total Repayment</span>
            <span className="detail-value">{formatCurrency(application.offer.totalRepayment)}</span>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="detail-section">
        <h3>📊 Application Summary</h3>
        <div className="detail-grid">
          {application.assignedAdminId && (
            <div className="detail-item">
              <span className="detail-label">Assigned Admin</span>
              <span className="detail-value">{application.assignedAdminId}</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Submitted</span>
            <span className="detail-value">{formatDate(application.createdAt)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Last Updated</span>
            <span className="detail-value">{formatDate(application.updatedAt)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Expires</span>
            <span className="detail-value">{formatDate(application.expiresAt)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Time in Queue</span>
            <span className="detail-value">
              {slaInfo.timeSinceSubmission < 24 
                ? `${slaInfo.timeSinceSubmission.toFixed(1)} hours`
                : `${Math.floor(slaInfo.timeSinceSubmission / 24)} days ${Math.round(slaInfo.timeSinceSubmission % 24)} hours`
              }
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Documents</span>
            <span className="detail-value">{application.documents.length} uploaded</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status Changes</span>
            <span className="detail-value">{application.statusHistory.length}</span>
          </div>
        </div>
      </section>

      {/* Applicant Quick View */}
      <section className="detail-section">
        <h3>👤 Applicant Quick View</h3>
        <div className="applicant-quick-view">
          <div className="applicant-name">
            {application.applicant.firstName} {application.applicant.lastName}
          </div>
          <div className="applicant-contact">
            <span>📧 {application.applicant.email}</span>
            {application.applicant.phone && <span>📱 {application.applicant.phone}</span>}
          </div>
          <div className="applicant-financial">
            <span>Monthly Income: {formatCurrency(application.applicant.monthlyIncome || 0)}</span>
            <span>Living Costs: {formatCurrency(application.applicant.livingCosts || 0)}</span>
            {application.applicant.dependents !== undefined && (
              <span>Dependents: {application.applicant.dependents}</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Applicant Tab
function ApplicantTab({ application }: { application: LoanApplication }) {
  const { applicant } = application;
  
  return (
    <div className="tab-content applicant-tab">
      {/* Personal Information */}
      <section className="detail-section">
        <h3>👤 Personal Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Full Name</span>
            <span className="detail-value">{applicant.firstName} {applicant.lastName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">{applicant.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone</span>
            <span className="detail-value">{applicant.phone || 'Not provided'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Date of Birth</span>
            <span className="detail-value">
              {applicant.dateOfBirth ? formatDate(applicant.dateOfBirth) : 'Not provided'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Account Status</span>
            <span className="detail-value">
              {applicant.isRegistered 
                ? <span className="badge badge-success">Registered User</span>
                : <span className="badge badge-neutral">Guest</span>
              }
            </span>
          </div>
          {applicant.userId && (
            <div className="detail-item">
              <span className="detail-label">User ID</span>
              <span className="detail-value code">{applicant.userId}</span>
            </div>
          )}
        </div>
      </section>

      {/* Address */}
      {applicant.address && (
        <section className="detail-section">
          <h3>🏠 Address</h3>
          <div className="detail-grid">
            <div className="detail-item wide">
              <span className="detail-label">Street</span>
              <span className="detail-value">
                {applicant.address.street}
                {applicant.address.apartment && `, apt. ${applicant.address.apartment}`}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">City</span>
              <span className="detail-value">{applicant.address.city}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Postal Code</span>
              <span className="detail-value">{applicant.address.postalCode}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Country</span>
              <span className="detail-value">{applicant.address.country}</span>
            </div>
          </div>
        </section>
      )}

      {/* Employment */}
      {applicant.employment && (
        <section className="detail-section">
          <h3>💼 Employment</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value capitalize">{applicant.employment.status.replace('_', ' ')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Employer</span>
              <span className="detail-value">{applicant.employment.employerName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Job Title</span>
              <span className="detail-value">{applicant.employment.jobTitle}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Contract Type</span>
              <span className="detail-value capitalize">{applicant.employment.contractType?.replace('_', ' ')}</span>
            </div>
            {applicant.employment.startDate && (
              <div className="detail-item">
                <span className="detail-label">Start Date</span>
                <span className="detail-value">{formatDate(applicant.employment.startDate)}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Financial Information */}
      <section className="detail-section">
        <h3>💵 Financial Information</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Monthly Income</span>
            <span className="detail-value highlight">{formatCurrency(applicant.monthlyIncome || 0)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Living Costs</span>
            <span className="detail-value">{formatCurrency(applicant.livingCosts || 0)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Disposable Income</span>
            <span className="detail-value highlight">
              {formatCurrency((applicant.monthlyIncome || 0) - (applicant.livingCosts || 0))}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Dependents</span>
            <span className="detail-value">{applicant.dependents ?? 'Not specified'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Debt-to-Income Ratio</span>
            <span className="detail-value">
              {applicant.monthlyIncome 
                ? `${((application.offer.monthlyInstallment / applicant.monthlyIncome) * 100).toFixed(1)}%`
                : 'N/A'
              }
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

// Documents Tab
function DocumentsTab({
  documents,
  onView,
  isLoading,
  error,
}: {
  documents: ApplicationDocument[];
  onView: (doc: ApplicationDocument) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const getDocTypeLabel = (type: ApplicationDocument['type']): string => {
    const labels: Record<ApplicationDocument['type'], string> = {
      id_document: 'ID Document',
      proof_of_income: 'Proof of Income',
      proof_of_address: 'Proof of Address',
      bank_statement: 'Bank Statement',
      employment_contract: 'Employment Contract',
      contract: 'Contract',
      signed_contract: 'Signed Contract',
      other: 'Other',
    };
    return labels[type];
  };

  const getStatusBadge = (status: ApplicationDocument['status']) => {
    const configs: Record<ApplicationDocument['status'], { class: string; label: string }> = {
      pending: { class: 'badge-warning', label: 'Pending Review' },
      verified: { class: 'badge-success', label: 'Verified' },
      rejected: { class: 'badge-danger', label: 'Rejected' },
      expired: { class: 'badge-neutral', label: 'Expired' },
    };
    return configs[status];
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="tab-content documents-tab">
      {isLoading ? (
        <div className="empty-state">
          <span className="empty-icon">⏳</span>
          <p>Loading documents...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <p>{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📄</span>
          <p>No documents uploaded</p>
        </div>
      ) : (
        <div className="documents-list">
          {documents.map(doc => {
            const statusBadge = getStatusBadge(doc.status);
            const sideLabel = doc.side ? ` · ${doc.side.toUpperCase()}` : '';
            return (
              <div key={doc.id} className="document-card">
                <div className="document-icon">📄</div>
                <div className="document-info">
                  <div className="document-name">{doc.name}</div>
                  <div className="document-meta">
                    <span className="document-type">{getDocTypeLabel(doc.type)}{sideLabel}</span>
                    <span className="document-size">{formatFileSize(doc.size)}</span>
                    <span className="document-date">{formatDate(doc.uploadedAt)}</span>
                    <span className="document-uploader">by {doc.uploadedBy}</span>
                  </div>
                </div>
                <div className="document-actions">
                  <span className={`badge ${statusBadge.class}`}>{statusBadge.label}</span>
                  <button className="btn btn-sm btn-secondary" onClick={() => onView(doc)}>
                    View
                  </button>
                  {doc.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-success">✓</button>
                      <button className="btn btn-sm btn-danger">✗</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function mapApiDocument(doc: {
  blobName: string;
  originalFileName: string;
  contentType: string;
  documentType: string;
  documentSide: string;
  sizeBytes: number;
  uploadedAt: string;
}): ApplicationDocument {
  const type = mapDocumentType(doc.documentType);
  const side = mapDocumentSide(doc.documentSide);

  return {
    id: doc.blobName,
    name: doc.originalFileName,
    type,
    url: '',
    blobName: doc.blobName,
    side,
    uploadedAt: new Date(doc.uploadedAt),
    uploadedBy: 'applicant',
    size: doc.sizeBytes,
    status: 'pending',
  };
}

function mapDocumentType(value: string): ApplicationDocument['type'] {
  const normalized = value.toLowerCase();
  switch (normalized) {
    case 'iddocument':
    case 'id_document':
      return 'id_document';
    case 'proofofincome':
    case 'proof_of_income':
      return 'proof_of_income';
    case 'proofofaddress':
    case 'proof_of_address':
      return 'proof_of_address';
    case 'bankstatement':
    case 'bank_statement':
      return 'bank_statement';
    case 'employmentcontract':
    case 'employment_contract':
      return 'employment_contract';
    default:
      return 'other';
  }
}

function mapDocumentSide(value: string): ApplicationDocument['side'] {
  const normalized = value.toLowerCase();
  if (normalized === 'front') return 'front';
  if (normalized === 'back') return 'back';
  return 'unknown';
}

function DocumentPreviewModal({
  document,
  url,
  isLoading,
  error,
  onClose,
}: {
  document: ApplicationDocument;
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

// History Tab (Audit Trail)
function HistoryTab({ 
  history, 
  notes 
}: { 
  history: StatusHistoryEntry[];
  notes: LoanApplication['internalNotes'];
}) {
  // Combine and sort history entries and notes by date
  const timelineItems = [
    ...history.map(h => ({ type: 'status' as const, data: h, date: new Date(h.changedAt) })),
    ...notes.map(n => ({ type: 'note' as const, data: n, date: new Date(n.createdAt) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="tab-content history-tab">
      <h3>📜 Audit Trail</h3>
      
      {timelineItems.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📜</span>
          <p>No history entries</p>
        </div>
      ) : (
        <div className="timeline">
          {timelineItems.map((item) => {
            if (item.type === 'status') {
              const entry = item.data as StatusHistoryEntry;
              const newStatusConfig = ADMIN_STATUS_CONFIG[entry.newStatus];
              
              return (
                <div key={entry.id} className="timeline-item status-change">
                  <div className="timeline-marker" style={{ backgroundColor: newStatusConfig.color }}></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-title">
                        Status changed to{' '}
                        <span 
                          className="status-badge inline"
                          style={{ color: newStatusConfig.color, backgroundColor: newStatusConfig.bgColor }}
                        >
                          {newStatusConfig.label}
                        </span>
                      </span>
                      <span className="timeline-date">{formatDate(entry.changedAt)}</span>
                    </div>
                    <div className="timeline-meta">
                      <span className="timeline-actor">By: {entry.changedBy}</span>
                      {entry.previousStatus && (
                        <span className="timeline-previous">
                          From: {ADMIN_STATUS_CONFIG[entry.previousStatus].label}
                        </span>
                      )}
                    </div>
                    {entry.reason && (
                      <div className="timeline-reason">
                        <strong>Reason:</strong> {entry.reason}
                      </div>
                    )}
                    {entry.notes && (
                      <div className="timeline-notes">
                        <strong>Notes:</strong> {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              const note = item.data as LoanApplication['internalNotes'][0];
              return (
                <div key={note.id} className="timeline-item internal-note">
                  <div className="timeline-marker note-marker">📝</div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-title">Internal Note</span>
                      <span className="timeline-date">{formatDate(note.createdAt)}</span>
                    </div>
                    <div className="timeline-meta">
                      <span className="timeline-actor">By: {note.createdBy}</span>
                    </div>
                    <div className="timeline-note-content">{note.content}</div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

// Provider Tab
function ProviderTab({ application }: { application: LoanApplication }) {
  const { provider, providerResponse } = application;

  return (
    <div className="tab-content provider-tab">
      {/* Provider Information */}
      <section className="detail-section">
        <h3>🏦 Provider Information</h3>
        <div className="provider-card">
          <div className="provider-logo">
            {provider.logo 
              ? <img src={provider.logo} alt={provider.name} />
              : <span className="provider-initials">{provider.name.charAt(0)}</span>
            }
          </div>
          <div className="provider-details">
            <h4>{provider.name}</h4>
            <div className="detail-grid">
              {provider.contactPerson && (
                <div className="detail-item">
                  <span className="detail-label">Contact Person</span>
                  <span className="detail-value">{provider.contactPerson}</span>
                </div>
              )}
              {provider.contactEmail && (
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">
                    <a href={`mailto:${provider.contactEmail}`}>{provider.contactEmail}</a>
                  </span>
                </div>
              )}
              {provider.contactPhone && (
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">
                    <a href={`tel:${provider.contactPhone}`}>{provider.contactPhone}</a>
                  </span>
                </div>
              )}
              {provider.address && (
                <div className="detail-item wide">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{provider.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Provider Response */}
      <section className="detail-section">
        <h3>📨 Provider Response</h3>
        {providerResponse ? (
          <div className="provider-response">
            <div className="response-status">
              <span className={`badge badge-${
                providerResponse.status === 'approved' ? 'success' :
                providerResponse.status === 'rejected' ? 'danger' :
                providerResponse.status === 'needs_info' ? 'warning' : 'neutral'
              }`}>
                {providerResponse.status.replace('_', ' ').toUpperCase()}
              </span>
              {providerResponse.respondedAt && (
                <span className="response-date">
                  Responded: {formatDate(providerResponse.respondedAt)}
                </span>
              )}
            </div>
            {providerResponse.message && (
              <div className="response-message">
                <strong>Message:</strong>
                <p>{providerResponse.message}</p>
              </div>
            )}
            {providerResponse.conditions && providerResponse.conditions.length > 0 && (
              <div className="response-conditions">
                <strong>Conditions:</strong>
                <ul>
                  {providerResponse.conditions.map((condition, index) => (
                    <li key={index}>{condition}</li>
                  ))}
                </ul>
              </div>
            )}
            {providerResponse.finalOffer && (
              <div className="final-offer">
                <strong>Final Offer Terms:</strong>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Interest Rate</span>
                    <span className="detail-value">{providerResponse.finalOffer.interestRate}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Monthly Installment</span>
                    <span className="detail-value">{formatCurrency(providerResponse.finalOffer.monthlyInstallment)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Repayment</span>
                    <span className="detail-value">{formatCurrency(providerResponse.finalOffer.totalRepayment)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">⏳</span>
            <p>Awaiting provider response</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="detail-section">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions">
          <button className="btn btn-secondary">
            📧 Send Email to Provider
          </button>
          <button className="btn btn-secondary">
            📞 Log Phone Call
          </button>
          <button className="btn btn-secondary">
            📝 Add Internal Note
          </button>
        </div>
      </section>
    </div>
  );
}
