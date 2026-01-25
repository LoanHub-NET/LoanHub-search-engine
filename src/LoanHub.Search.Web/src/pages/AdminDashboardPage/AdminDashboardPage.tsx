import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './AdminDashboardPage.css';

type ApplicationStatus = 'new' | 'preliminarily accepted' | 'accepted' | 'granted' | 'rejected';

type ApplicationRow = {
  id: string;
  applicant: string;
  provider: string;
  amount: string;
  duration: string;
  status: ApplicationStatus;
  submittedAt: string;
};

const mockApplications: ApplicationRow[] = [
  {
    id: 'LH-2024-001',
    applicant: 'Alex Carter',
    provider: 'First National Bank',
    amount: '$18,000',
    duration: '36 months',
    status: 'new',
    submittedAt: '2024-11-21 09:12',
  },
  {
    id: 'LH-2024-002',
    applicant: 'Jamie Nguyen',
    provider: 'Metro Credit Union',
    amount: '$12,500',
    duration: '24 months',
    status: 'preliminarily accepted',
    submittedAt: '2024-11-21 10:48',
  },
  {
    id: 'LH-2024-003',
    applicant: 'Priya Shah',
    provider: 'Summit Trust',
    amount: '$30,000',
    duration: '60 months',
    status: 'accepted',
    submittedAt: '2024-11-21 11:22',
  },
  {
    id: 'LH-2024-004',
    applicant: 'Daniel Lopez',
    provider: 'Digital Finance Co.',
    amount: '$9,400',
    duration: '18 months',
    status: 'granted',
    submittedAt: '2024-11-21 12:05',
  },
  {
    id: 'LH-2024-005',
    applicant: 'Marta Kowalski',
    provider: 'Harborline Bank',
    amount: '$22,000',
    duration: '48 months',
    status: 'rejected',
    submittedAt: '2024-11-21 12:41',
  },
];

const statusOptions: ApplicationStatus[] = [
  'new',
  'preliminarily accepted',
  'accepted',
  'granted',
  'rejected',
];

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') {
      return mockApplications;
    }
    return mockApplications.filter((app) => app.status === statusFilter);
  }, [statusFilter]);

  return (
    <>
      <Header
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
      />
      <main className="admin-page">
        <section className="admin-hero">
          <div className="admin-hero-container">
            <span className="admin-badge">Admin Dashboard</span>
            <h1 className="admin-title">Loan applications overview</h1>
            <p className="admin-subtitle">
              Review incoming requests, monitor provider responses, and move
              applications through the approval pipeline.
            </p>
          </div>
        </section>

        <section className="admin-content">
          <div className="admin-content-container">
            <div className="admin-stats">
              <div className="stat-card">
                <p>New</p>
                <h3>8</h3>
              </div>
              <div className="stat-card">
                <p>Preliminarily accepted</p>
                <h3>5</h3>
              </div>
              <div className="stat-card">
                <p>Accepted</p>
                <h3>3</h3>
              </div>
              <div className="stat-card">
                <p>Granted</p>
                <h3>12</h3>
              </div>
            </div>

            <div className="admin-filters">
              <div>
                <h2>Applications</h2>
                <p>Filter by status to review the right queue.</p>
              </div>
              <div className="filter-buttons">
                <button
                  type="button"
                  className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </button>
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-table">
              <div className="table-header">
                <span>Application</span>
                <span>Applicant</span>
                <span>Provider</span>
                <span>Amount</span>
                <span>Duration</span>
                <span>Status</span>
                <span>Submitted</span>
              </div>

              {filteredApplications.map((row) => (
                <div key={row.id} className="table-row">
                  <span className="row-id">{row.id}</span>
                  <span>{row.applicant}</span>
                  <span>{row.provider}</span>
                  <span>{row.amount}</span>
                  <span>{row.duration}</span>
                  <span className={`status-pill status-${row.status.replace(' ', '-')}`}>
                    {row.status}
                  </span>
                  <span>{row.submittedAt}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
