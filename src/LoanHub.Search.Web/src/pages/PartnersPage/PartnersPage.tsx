import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './PartnersPage.css';

const partners = [
  { name: 'Aurora Bank', tag: 'Retail & Mortgage', hue: 210 },
  { name: 'Northline Credit', tag: 'Personal Loans', hue: 145 },
  { name: 'Solstice Finance', tag: 'SME Lending', hue: 28 },
  { name: 'Harborstone Bank', tag: 'Auto & Home', hue: 262 },
  { name: 'Summit Trust', tag: 'Consumer Lending', hue: 340 },
  { name: 'Oakridge Capital', tag: 'Business Loans', hue: 18 },
  { name: 'Bluegate Bank', tag: 'Personal & SME', hue: 198 },
  { name: 'Everwell Bank', tag: 'Green Lending', hue: 112 },
  { name: 'Crescent Union', tag: 'Mortgage', hue: 256 },
  { name: 'Lakeside Bank', tag: 'Community Finance', hue: 46 },
  { name: 'Silvercrest', tag: 'Digital Lending', hue: 188 },
  { name: 'Pioneer Credit', tag: 'Personal Loans', hue: 32 },
];

const visiblePartners = partners.slice(0, 3);
const totalCount = partners.length;

export function PartnersPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
      />
      <main className="partners-page">
        <section className="partners-hero">
          <div className="partners-hero-container">
            <span className="partners-badge">Our Partners</span>
            <h1 className="partners-title">Connected bank partners</h1>
            <p className="partners-subtitle">
              We aggregate offers from verified lenders and normalize responses
              so you can compare apples to apples.
            </p>
            <a className="page-back-link" href="/">← Back to Home</a>
          </div>
        </section>

        <section className="partners-list">
          <div className="partners-list-container">
            {visiblePartners.map((partner) => (
              <div key={partner.name} className="partner-card">
                <div
                  className="partner-icon"
                  style={{ background: `hsl(${partner.hue} 75% 55% / 0.15)` }}
                >
                  <span
                    className="partner-dot"
                    style={{ background: `hsl(${partner.hue} 75% 55%)` }}
                  ></span>
                </div>
                <div className="partner-info">
                  <h2>{partner.name}</h2>
                  <p>{partner.tag}</p>
                </div>
              </div>
            ))}

            <div className="partner-card more">
              <div className="partner-icon neutral">
                <span className="partner-dot neutral"></span>
              </div>
              <div className="partner-info">
                <h2>+ {totalCount - visiblePartners.length} more banks</h2>
                <p>Fully connected, shown on search results.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="partners-cta">
          <div className="partners-cta-container">
            <div>
              <h2>Want to become a partner?</h2>
              <p>We onboard new providers with stable APIs and verified rates.</p>
            </div>
            <button
              type="button"
              className="partners-btn"
              onClick={() => navigate('/contact')}
            >
              Contact Partnerships
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
