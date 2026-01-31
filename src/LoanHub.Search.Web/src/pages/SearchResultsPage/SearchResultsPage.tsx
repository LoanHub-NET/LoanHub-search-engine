import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { fetchSearchResults, type SearchApiSource } from '../../api/searchApi';
import { clearAuthSession, getAuthSession } from '../../api/apiConfig';
import { formatCurrency, formatPercent, formatDuration } from '../../utils/formatters';
import type { LoanOffer, LoanSearchQuery } from '../../types';
import './SearchResultsPage.css';

const providerIcons = ['🏦', '🏢', '💳', '🏛️', '💼', '🏤'];

const getProviderLogo = (providerName: string) => {
  const hash = providerName
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return providerIcons[hash % providerIcons.length];
};

const parseOptionalNumber = (value: string | null) => {
  if (value === null || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [sources, setSources] = useState<SearchApiSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);
  const [authSession, setAuthSession] = useState(getAuthSession());

  const amount = Number(searchParams.get('amount')) || 10000;
  const duration = Number(searchParams.get('duration')) || 12;
  const income = parseOptionalNumber(searchParams.get('income'));
  const livingCosts = parseOptionalNumber(searchParams.get('costs'));
  const dependents = parseOptionalNumber(searchParams.get('dependents'));
  const hasIncome = income !== undefined || livingCosts !== undefined || dependents !== undefined;

  const searchQuery = useMemo<LoanSearchQuery>(() => {
    const query: LoanSearchQuery = {
      amount,
      duration,
    };

    if (income !== undefined) {
      query.monthlyIncome = income;
    }
    if (livingCosts !== undefined) {
      query.livingCosts = livingCosts;
    }
    if (dependents !== undefined) {
      query.dependents = dependents;
    }

    return query;
  }, [amount, duration, income, livingCosts, dependents]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    setSources([]);
    setOffers([]);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 8;
      });
    }, 250);

    fetchSearchResults(searchQuery)
      .then((response) => {
        if (!isActive) return;
        const mappedOffers = response.offers
          .map((offer) => ({
            id: offer.providerOfferId,
            providerId: offer.provider.toLowerCase().replace(/\s+/g, '-'),
            providerName: offer.provider,
            providerLogo: getProviderLogo(offer.provider),
            amount,
            duration,
            monthlyInstallment: offer.installment,
            interestRate: offer.apr,
            apr: offer.apr,
            totalRepayment: offer.totalCost,
            isPersonalized: hasIncome,
            validUntil: new Date(offer.validUntil),
          }))
          .sort((a, b) => a.monthlyInstallment - b.monthlyInstallment);

        setSources(response.sources);
        setOffers(mappedOffers);
        setLoadingProgress(100);
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        const message =
          err instanceof Error
            ? err.message
            : 'We could not retrieve offers at the moment.';
        setError(message);
        setLoadingProgress(100);
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
        clearInterval(progressInterval);
      });

    return () => {
      clearInterval(progressInterval);
      isActive = false;
    };
  }, [amount, duration, hasIncome, searchQuery, retrySeed]);

  useEffect(() => {
    setAuthSession(getAuthSession());
  }, []);

  const adminUser = useMemo(() => {
    if (!authSession) return undefined;
    const displayName =
      `${authSession.firstName ?? ''} ${authSession.lastName ?? ''}`.trim() || authSession.email;
    return {
      name: displayName,
      email: authSession.email,
      role: authSession.role,
    };
  }, [authSession]);

  const handleLoginClick = () => navigate('/login');
  const handleSearchClick = () => navigate('/search');
  const handleLogout = () => {
    clearAuthSession();
    setAuthSession(null);
    navigate('/login');
  };

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

  const successfulSources = sources.filter((source) => source.status === 'Ok');
  const failedSources = sources.filter((source) => source.status !== 'Ok');

  return (
    <div className="results-page">
      <Header
        onLoginClick={handleLoginClick}
        onSearchClick={handleSearchClick}
        adminUser={adminUser}
        onLogout={handleLogout}
      />
      
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
                <h2>Searching providers...</h2>
                <p>We're querying multiple banks to find you the best rates.</p>
                
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${Math.min(loadingProgress, 100)}%` }}
                  />
                </div>
                
                <div className="providers-status">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={`loading-dot-${index}`}
                      className={`provider-dot ${
                        loadingProgress > (index + 1) * 20 ? 'active' : ''
                      }`}
                    ></span>
                  ))}
                  <span className="status-text">
                    {loadingProgress > 0 ? 'Waiting for provider responses' : 'Starting search'}
                  </span>
                </div>
                
                <p className="loading-note">
                  Results guaranteed within 15 seconds
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-card">
                <div className="error-icon">⚠️</div>
                <h2>We couldn't fetch offers</h2>
                <p>{error}</p>
                <button
                  type="button"
                  className="retry-btn"
                  onClick={() => setRetrySeed((prev) => prev + 1)}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="results-info">
                <div className="info-complete">
                  <span className="badge-icon">✓</span>
                  <span>
                    {successfulSources.length} providers responded successfully.
                  </span>
                </div>

                {failedSources.length > 0 && (
                  <div className="info-notice">
                    <span className="notice-icon">⏱️</span>
                    <span>
                      {failedSources.length} providers timed out or returned errors.
                      Showing available results.
                    </span>
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
