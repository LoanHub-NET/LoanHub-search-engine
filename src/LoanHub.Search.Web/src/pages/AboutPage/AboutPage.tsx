import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './AboutPage.css';

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
      />
      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-container">
            <span className="about-badge">About Us</span>
            <h1 className="about-title">Transparent loans, smarter choices</h1>
            <p className="about-subtitle">
              LoanHub is a search engine for loan offers. We bring together
              multiple providers and show clear, comparable terms so people can
              choose with confidence.
            </p>
            <div className="about-actions">
              <button
                type="button"
                className="about-btn"
                onClick={() => navigate('/search')}
              >
                Start Searching
              </button>
              <button
                type="button"
                className="about-btn secondary"
                onClick={() => navigate('/careers')}
              >
                Careers
              </button>
            </div>
          </div>
        </section>

        <section className="about-values">
          <div className="about-values-container">
            <div className="about-card">
              <h2>Our mission</h2>
              <p>
                Make loan comparison fast, fair, and simple for everyone with a
                secure experience and clear pricing.
              </p>
            </div>
            <div className="about-card">
              <h2>How we work</h2>
              <p>
                We request offers in parallel, normalize the results, and show
                the best options within seconds.
              </p>
            </div>
            <div className="about-card">
              <h2>Built on trust</h2>
              <p>
                Your anonymous search stays anonymous. We collect only what is
                needed when you decide to apply.
              </p>
            </div>
          </div>
        </section>

        <section className="about-stats">
          <div className="about-stats-container">
            <div className="stat-card">
              <span className="stat-value">3+</span>
              <span className="stat-label">Provider APIs</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">15s</span>
              <span className="stat-label">Max wait time</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">10 days</span>
              <span className="stat-label">Offer validity</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
