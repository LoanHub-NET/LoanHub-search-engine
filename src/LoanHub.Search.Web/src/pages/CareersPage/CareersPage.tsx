import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './CareersPage.css';

export function CareersPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
      />
      <main className="careers-page">
        <section className="careers-hero">
          <div className="careers-hero-container">
            <div className="careers-hero-text">
              <span className="careers-badge">Careers</span>
              <h1 className="careers-title">We are not hiring right now</h1>
              <p className="careers-subtitle">
                LoanHub is focused on building a fast, transparent loan search
                experience. We are a small team and not opening new roles at the
                moment, but we will share updates here when that changes.
              </p>
              <div className="careers-actions">
                <button
                  className="careers-btn"
                  type="button"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </button>
                <button
                  className="careers-btn secondary"
                  type="button"
                  onClick={() => navigate('/search')}
                >
                  Explore Loan Search
                </button>
              </div>
              <p className="careers-note">
                Tip: check back later for product, data, and partnerships roles.
              </p>
            </div>

            <div className="careers-hero-graphic" aria-hidden="true">
              <div className="graphic-orbit"></div>
              <div className="graphic-card">
                <span className="graphic-status">No open roles</span>
                <div className="graphic-line"></div>
                <div className="graphic-row">
                  <span className="graphic-dot"></span>
                  <span className="graphic-bar"></span>
                </div>
                <div className="graphic-row">
                  <span className="graphic-dot"></span>
                  <span className="graphic-bar short"></span>
                </div>
                <div className="graphic-stamp">NOT HIRING</div>
              </div>
            </div>
          </div>
        </section>

        <section className="careers-info">
          <div className="careers-info-container">
            <div className="info-card">
              <h2>What we are building</h2>
              <p>
                A trusted place to compare loan offers instantly, with clear
                pricing, fair terms, and a smooth application flow.
              </p>
            </div>
            <div className="info-card">
              <h2>What we value</h2>
              <p>
                Customer clarity, responsible lending, and simple interfaces that
                help people make confident decisions.
              </p>
            </div>
            <div className="info-card">
              <h2>When we hire</h2>
              <p>
                We will list open roles here first. Until then, stay connected
                through our updates and product news.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
