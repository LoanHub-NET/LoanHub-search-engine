import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { formatCurrency, formatPercent, formatDuration } from '../../utils/formatters';
import type { LoanOffer } from '../../types';
import './SearchResultsPage.css';

// Mock data - in production, this would come from API
const generateMockOffers = (amount: number, duration: number): LoanOffer[] => {
  const providers = [
    { id: 'bank1', name: 'First National Bank', logo: '🏦' },
    { id: 'bank2', name: 'Metro Credit Union', logo: '🏢' },
    { id: 'bank3', name: 'Digital Finance Co.', logo: '💳' },
  ];

  return providers.map((provider, index) => {
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
  }).sort((a, b) => a.monthlyInstallment - b.monthlyInstallment);
};

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [providersResponded, setProvidersResponded] = useState(0);

  const amount = Number(searchParams.get('amount')) || 10000;
  const duration = Number(searchParams.get('duration')) || 12;
  const hasIncome = searchParams.has('income');

  useEffect(() => {
    // Simulate API call with progress
    setIsLoading(true);
    setLoadingProgress(0);
    setProvidersResponded(0);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 200);

    const providerInterval = setInterval(() => {
      setProvidersResponded((prev) => Math.min(prev + 1, 3));
    }, 500);

    // Simulate max 15 second timeout, but resolve faster
    const timeout = setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(providerInterval);
      setLoadingProgress(100);
      setProvidersResponded(3);
      setOffers(generateMockOffers(amount, duration));
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      clearInterval(progressInterval);
      clearInterval(providerInterval);
    };
  }, [amount, duration]);

  const handleLoginClick = () => navigate('/login');
  const handleSearchClick = () => navigate('/search');

  const handleSelectOffer = (offer: LoanOffer) => {
    // If not personalized, redirect to refine search
    if (!offer.isPersonalized && !hasIncome) {
      navigate(`/search/refine?offerId=${offer.id}&amount=${amount}&duration=${duration}`);
    } else {
      // Proceed with application
      navigate(`/apply?offerId=${offer.id}`);
    }
  };

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
              {isLoading ? 'Finding Best Offers...' : 'Your Loan Options'}
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

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-card">
                <div className="loading-icon">🔍</div>
                <h2>Searching {3} providers...</h2>
                <p>We're querying multiple banks to find you the best rates.</p>
                
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                  />
                </div>
                
                <div className="providers-status">
                  <span className="provider-dot active"></span>
                  <span className="provider-dot active"></span>
                  <span className="provider-dot active"></span>
                  <span className="status-text">
                    {providersResponded}/3 providers responded
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
                <div className="info-badge">
                  <span className="badge-icon">✓</span>
                  <span>{offers.length} offers found from {offers.length} providers</span>
                </div>
                
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
                        {hasIncome ? 'Apply Now' : 'Get Personalized Rate'}
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
