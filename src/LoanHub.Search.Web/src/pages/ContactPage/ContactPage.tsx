import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './ContactPage.css';

export function ContactPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
      />
      <main className="contact-page">
        <section className="contact-hero">
          <div className="contact-hero-container">
            <span className="contact-badge">Contact</span>
            <h1 className="contact-title">Talk to the LoanHub team</h1>
            <p className="contact-subtitle">
              Have a question about offers, partnerships, or the platform?
              Reach out and we will get back to you soon.
            </p>
            <a className="page-back-link" href="/">← Back to Home</a>
          </div>
        </section>

        <section className="contact-content">
          <div className="contact-content-container">
            <div className="contact-card">
              <h2>Support</h2>
              <p>help@loanhub.example</p>
              <p>Mon-Fri, 9:00-17:00</p>
            </div>
            <div className="contact-card">
              <h2>Partnerships</h2>
              <p>partners@loanhub.example</p>
              <p>We onboard new lenders quarterly.</p>
            </div>
            <div className="contact-card">
              <h2>Press</h2>
              <p>press@loanhub.example</p>
              <p>Media kit available upon request.</p>
            </div>
          </div>
        </section>

        <section className="contact-cta">
          <div className="contact-cta-container">
            <div>
              <h2>Need to start a loan search?</h2>
              <p>
                Try the anonymous quick search and see offers in seconds.
              </p>
            </div>
            <button
              type="button"
              className="contact-btn"
              onClick={() => navigate('/search')}
            >
              Start Search
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
