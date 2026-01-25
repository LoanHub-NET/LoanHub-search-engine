import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './LegalPage.css';

export function CookiesPage() {
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
            <span className="legal-badge">Cookie Policy</span>
            <h1 className="legal-title">How we use cookies</h1>
            <p className="legal-subtitle">
              We use cookies and similar technologies to keep the site working
              and improve your experience.
            </p>
          </div>
        </section>

        <section className="legal-content">
          <div className="legal-content-container">
            <div className="legal-section">
              <h2>What are cookies</h2>
              <p>
                Cookies are small text files stored on your device. They help
                websites remember preferences and measure performance.
              </p>
            </div>

            <div className="legal-section">
              <h2>Types of cookies we use</h2>
              <ul>
                <li>Essential cookies required for core site functionality.</li>
                <li>Analytics cookies to understand usage and improve features.</li>
                <li>Preference cookies to remember settings and choices.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2>Managing cookies</h2>
              <p>
                You can manage cookies through your browser settings. Disabling
                some cookies may affect site functionality.
              </p>
            </div>

            <div className="legal-section">
              <h2>Third-party cookies</h2>
              <p>
                Some partners may set cookies when you continue to their sites.
                Their policies govern those cookies.
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
