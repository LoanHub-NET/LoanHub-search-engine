import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './LegalPage.css';

export function GdprPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
      />
      <main className="legal-page">
        <section className="legal-hero">
          <div className="legal-hero-container">
            <span className="legal-badge">GDPR</span>
            <h1 className="legal-title">Your data protection rights</h1>
            <p className="legal-subtitle">
              This page describes your rights under the General Data Protection
              Regulation and how to exercise them.
            </p>
          </div>
        </section>

        <section className="legal-content">
          <div className="legal-content-container">
            <div className="legal-section">
              <h2>Lawful basis</h2>
              <p>
                We process data based on consent, contract necessity, and
                legitimate interest to provide and improve the service.
              </p>
            </div>

            <div className="legal-section">
              <h2>Your rights</h2>
              <ul>
                <li>Right of access to your personal data.</li>
                <li>Right to rectification of inaccurate data.</li>
                <li>Right to erasure where applicable.</li>
                <li>Right to restrict or object to processing.</li>
                <li>Right to data portability.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>How to make a request</h2>
              <p>
                Email gdpr@loanhub.example with your request and a description
                of the data involved. We may need to verify your identity.
              </p>
            </div>

            <div className="legal-section">
              <h2>Complaints</h2>
              <p>
                You can contact your local data protection authority if you
                believe your rights have been violated.
              </p>
            </div>

            <p className="legal-meta">Last updated: 2025-02-01</p>
            <div className="legal-actions">
              <a className="legal-action-link" href="/">
                Back to Home
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
