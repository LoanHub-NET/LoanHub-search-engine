import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './LegalPage.css';

export function PrivacyPage() {
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
            <span className="legal-badge">Privacy Policy</span>
            <h1 className="legal-title">How we handle your data</h1>
            <p className="legal-subtitle">
              This policy explains what information we collect, why we collect
              it, and how you can manage your data when using LoanHub.
            </p>
          </div>
        </section>

        <section className="legal-content">
          <div className="legal-content-container">
            <div className="legal-section">
              <h2>Summary</h2>
              <p>
                We only collect the data needed to provide loan offers and to
                process applications you choose to submit. Anonymous searches do
                not require personal data.
              </p>
            </div>

            <div className="legal-section">
              <h2>Information we collect</h2>
              <p>We may collect the following categories of data:</p>
              <ul>
                <li>Contact details such as name, email, phone, and address.</li>
                <li>Financial data you provide, including income and expenses.</li>
                <li>Application data such as loan amount, duration, and provider selected.</li>
                <li>Usage data, for example pages visited and device information.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>How we use your data</h2>
              <ul>
                <li>To match you with loan offers and provide comparisons.</li>
                <li>To process applications you submit to partner banks.</li>
                <li>To communicate status updates and important notifications.</li>
                <li>To improve site performance and user experience.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>Sharing with partners</h2>
              <p>
                We share only the data required to fulfill your request with
                selected banks or providers. We do not sell personal data.
              </p>
            </div>

            <div className="legal-section">
              <h2>Data retention</h2>
              <p>
                We keep data for as long as needed to provide services, comply
                with legal obligations, or resolve disputes. You can request
                deletion where applicable.
              </p>
            </div>

            <div className="legal-section">
              <h2>Your rights</h2>
              <ul>
                <li>Access, correct, or delete your personal information.</li>
                <li>Withdraw consent where processing is based on consent.</li>
                <li>Request a copy of the data we hold about you.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>Contact</h2>
              <p>
                For privacy requests, email privacy@loanhub.example.
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
