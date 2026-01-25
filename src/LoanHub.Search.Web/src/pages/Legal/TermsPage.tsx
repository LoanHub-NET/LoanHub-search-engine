import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './LegalPage.css';

export function TermsPage() {
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
            <span className="legal-badge">Terms of Service</span>
            <h1 className="legal-title">Using LoanHub</h1>
            <p className="legal-subtitle">
              These terms describe the rules for using the LoanHub platform and
              services.
            </p>
          </div>
        </section>

        <section className="legal-content">
          <div className="legal-content-container">
            <div className="legal-section">
              <h2>Acceptance of terms</h2>
              <p>
                By accessing or using LoanHub, you agree to these terms and our
                policies. If you do not agree, do not use the service.
              </p>
            </div>

            <div className="legal-section">
              <h2>Service description</h2>
              <p>
                LoanHub provides loan offer comparison and application routing.
                We do not provide loans directly and do not guarantee approval.
              </p>
            </div>

            <div className="legal-section">
              <h2>Eligibility</h2>
              <p>
                You must provide accurate information and be legally eligible
                to apply for financial products in your jurisdiction.
              </p>
            </div>

            <div className="legal-section">
              <h2>Prohibited use</h2>
              <ul>
                <li>Submitting false or misleading information.</li>
                <li>Interfering with the service or attempting unauthorized access.</li>
                <li>Using automated tools to scrape or overload the platform.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>Third-party providers</h2>
              <p>
                Offers and decisions are made by partner banks. Their terms and
                privacy policies apply once you proceed with an application.
              </p>
            </div>

            <div className="legal-section">
              <h2>Disclaimers</h2>
              <p>
                The service is provided as is without warranties. We strive for
                accuracy but do not guarantee completeness or uninterrupted
                access.
              </p>
            </div>

            <div className="legal-section">
              <h2>Changes to terms</h2>
              <p>
                We may update these terms periodically. Continued use means you
                accept the updated terms.
              </p>
            </div>

            <p className="legal-meta">Last updated: 2025-02-01</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
