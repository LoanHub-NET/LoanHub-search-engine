import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { formatCurrency, formatPercent, formatDuration } from '../../utils/formatters';
import type { LoanOffer } from '../../types';
import './SearchResultsPage.css';

const providers = [
  { id: 'bank1', name: 'First National Bank', logo: '🏦' },
  { id: 'bank2', name: 'Metro Credit Union', logo: '🏢' },
  { id: 'bank3', name: 'Digital Finance Co.', logo: '💳' },
  { id: 'bank4', name: 'Summit Trust', logo: '🏛️' },
  { id: 'bank5', name: 'Harborline Bank', logo: '💼' },
];
const minProvidersForResults = 3;

const generateMockOffer = (
  amount: number,
  duration: number,
  provider: typeof providers[number],
  index: number,
): LoanOffer => {
  const baseRate = 5 + index * 1.5 + Math.random() * 2;
  const rate = Math.round(baseRate * 100) / 100;
  const monthlyRate = rate / 100 / 12;
  const installment =
    amount * (monthlyRate * Math.pow(1 + monthlyRate, duration)) /
    (Math.pow(1 + monthlyRate, duration) - 1);

  return {
    id: `offer-${provider.id}-${Date.now()}`,
    providerId: provider.id,
    providerName: provider.name,
    providerLogo: provider.logo,
    amount,
    duration,
    monthlyInstallment: Math.round(installment * 100) / 100,
    interestRate: rate,
    apr: rate + 0.5,
    totalRepayment: Math.round(installment * duration * 100) / 100,
    isPersonalized: false,
    validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  };
};

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [, setIsLoading] = useState(true);
  const [showBlockingLoad, setShowBlockingLoad] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [respondedProviders, setRespondedProviders] = useState<string[]>([]);

  const amount = Number(searchParams.get('amount')) || 10000;
  const duration = Number(searchParams.get('duration')) || 12;
  const hasIncome = searchParams.has('income');

  useEffect(() => {
    // Simulate API call with progress
    setIsLoading(true);
    setShowBlockingLoad(true);
    setLoadingProgress(0);
    setRespondedProviders([]);
    setOffers([]);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) return 100;
        if (prev >= 95) return 95;
        return prev + Math.random() * 12;
      });
    }, 250);

    const blockingTimeout = setTimeout(() => {
      setShowBlockingLoad(false);
    }, 5000);
    const completionTimeouts: Array<ReturnType<typeof setTimeout>> = [];

    const timeouts: Array<ReturnType<typeof setTimeout>> = [];

    const providerDelays = [800, 1400, 2000, 9000, 12000];
    providers.forEach((provider, index) => {
      const delay = providerDelays[index] ?? (1500 + index * 1000);
      const timeout = setTimeout(() => {
        setRespondedProviders((prev) => {
          const next = [...prev, provider.id];
          if (next.length >= providers.length) {
            setLoadingProgress(100);
          } else {
            setLoadingProgress((progress) => Math.min(95, progress + 20));
          }

          if (next.length >= minProvidersForResults) {
            clearTimeout(blockingTimeout);
            completionTimeouts.forEach(clearTimeout);
            completionTimeouts.push(
              setTimeout(() => {
                setShowBlockingLoad(false);
              }, 600),
            );
          }
          return next;
        });
        setOffers((prev) => {
          const next = [
            ...prev,
            generateMockOffer(amount, duration, provider, index),
          ];
          return next.sort((a, b) => a.monthlyInstallment - b.monthlyInstallment);
        });
        setIsLoading(false);
      }, delay);
      timeouts.push(timeout);
    });

    const maxTimeout = setTimeout(() => {
      setLoadingProgress(100);
      setIsLoading(false);
      setShowBlockingLoad(false);
    }, 15000);

    return () => {
      clearTimeout(maxTimeout);
      clearTimeout(blockingTimeout);
      completionTimeouts.forEach(clearTimeout);
      clearInterval(progressInterval);
      timeouts.forEach(clearTimeout);
    };
  }, [amount, duration]);

  const handleLoginClick = () => navigate('/login');
  const handleSearchClick = () => navigate('/search');

  const handleSelectOffer = (offer: LoanOffer) => {
    // Navigate to application page with offer data
    // Convert to the format expected by LoanApplicationPage (ApplicationOffer)
    const applicationOffer = {
      id: offer.id,
      providerId: offer.providerId,
      providerName: offer.providerName,
      providerLogo: offer.providerLogo,
      amount: offer.amount,
      duration: offer.duration,
      interestRate: offer.interestRate,
      apr: offer.apr,
      monthlyInstallment: offer.monthlyInstallment,
      totalRepayment: offer.totalRepayment,
      totalInterest: offer.totalRepayment - offer.amount,
      processingTime: '1-3 business days',
    };
    
    navigate('/apply', { state: { offer: applicationOffer } });
  };

  const pendingProviders = providers.filter(
    (provider) => !respondedProviders.includes(provider.id),
  );

  return (
    <div className="results-page">
      <Header onLoginClick={handleLoginClick} onSearchClick={handleSearchClick} />
      
      <main className="results-main">
        <div className="results-container">
          <div className="results-header">
            <Link to="/search" className="back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>New Search</span>
            </Link>
            
            <h1 className="results-title">
              {showBlockingLoad ? 'Finding Best Offers...' : 'Your Loan Options'}
            </h1>
            
            <div className="search-summary">
              <span className="summary-item">
                <strong>Amount:</strong> {formatCurrency(amount)}
              </span>
              <span className="summary-divider">•</span>
              <span className="summary-item">
                <strong>Duration:</strong> {formatDuration(duration)}
              </span>
            </div>
          </div>

          {showBlockingLoad ? (
            <div className="loading-state">
              <div className="loading-card">
                <div className="loading-icon">🔍</div>
                <h2>Searching providers...</h2>
                <p>We're querying multiple banks to find you the best rates.</p>
                
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                  />
                </div>
                
                <div className="providers-status">
                  {providers.map((provider) => (
                    <span
                      key={provider.id}
                      className={`provider-dot ${
                        respondedProviders.includes(provider.id) ? 'active' : ''
                      }`}
                    ></span>
                  ))}
                  <span className="status-text">
                    {respondedProviders.length} providers responded
                  </span>
                </div>
                
                <p className="loading-note">
                  Results guaranteed within 15 seconds
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="results-info">
                {respondedProviders.length < providers.length ? (
                  <div className="info-partial">
                    <div className="partial-text">
                      Available results: {respondedProviders.length}/{providers.length}.{' '}
                      Waiting for {providers.length - respondedProviders.length} providers.
                    </div>
                    <div className="partial-loader">
                      <span className="pulse-dot"></span>
                      <span className="pulse-dot"></span>
                      <span className="pulse-dot"></span>
                    </div>
                  </div>
                ) : (
                  <div className="info-complete">
                    <span className="badge-icon">✓</span>
                    <span>All providers responded. Results are complete.</span>
                  </div>
                )}
                
                {!hasIncome && (
                  <div className="info-notice">
                    <span className="notice-icon">💡</span>
                    <span>
                      These are estimated rates. Select an offer and provide more details 
                      for personalized rates.
                    </span>
                  </div>
                )}
              </div>

              <div className="offers-list">
                {offers.map((offer, index) => (
                  <div 
                    key={offer.id} 
                    className={`offer-card ${index === 0 ? 'best-offer' : ''}`}
                  >
                    {index === 0 && (
                      <div className="best-badge">Best Rate</div>
                    )}
                    
                    <div className="offer-header">
                      <div className="provider-info">
                        <span className="provider-logo">{offer.providerLogo}</span>
                        <span className="provider-name">{offer.providerName}</span>
                      </div>
                    </div>

                    <div className="offer-details">
                      <div className="detail-item main">
                        <span className="detail-label">Monthly Payment</span>
                        <span className="detail-value">
                          {formatCurrency(offer.monthlyInstallment)}
                        </span>
                      </div>
                      
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Interest Rate</span>
                          <span className="detail-value">{formatPercent(offer.interestRate)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">APR</span>
                          <span className="detail-value">{formatPercent(offer.apr)}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Total Repayment</span>
                          <span className="detail-value">{formatCurrency(offer.totalRepayment)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="offer-actions">
                      <button 
                        className="select-btn"
                        onClick={() => handleSelectOffer(offer)}
                      >
                        Apply Now →
                      </button>
                    </div>

                    <div className="offer-footer">
                      <span className="validity">
                        Valid until {offer.validUntil.toLocaleDateString()}
                      </span>
                      {!offer.isPersonalized && (
                        <span className="estimate-tag">Estimated rate</span>
                      )}
                    </div>
                  </div>
                ))}

                {pendingProviders.map((provider) => (
                  <div key={provider.id} className="offer-card pending-offer">
                    <div className="offer-header">
                      <div className="provider-info">
                        <span className="provider-logo">{provider.logo}</span>
                        <span className="provider-name">{provider.name}</span>
                      </div>
                      <span className="pending-tag">Pending</span>
                    </div>

                    <div className="offer-details">
                      <div className="detail-item main">
                        <span className="detail-label">Monthly Payment</span>
                        <span className="detail-value skeleton-line wide"></span>
                      </div>

                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Interest Rate</span>
                          <span className="detail-value skeleton-line"></span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">APR</span>
                          <span className="detail-value skeleton-line"></span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Total Repayment</span>
                          <span className="detail-value skeleton-line"></span>
                        </div>
                      </div>
                    </div>

                    <div className="offer-actions">
                      <button className="select-btn pending-btn" type="button" disabled>
                        Waiting for response...
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="results-footer">
                <p>
                  Not finding what you're looking for?{' '}
                  <Link to="/search" className="modify-link">
                    Modify your search
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
