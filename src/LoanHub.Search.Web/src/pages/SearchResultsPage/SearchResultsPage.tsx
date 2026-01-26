import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { formatCurrency, formatPercent, formatDuration } from '../../utils/formatters';
import type { LoanOffer } from '../../types';
import './SearchResultsPage.css';

type QuickSearchOffer = {
  provider: string;
  providerOfferId: string;
  installment: number;
  apr: number;
  totalCost: number;
  validUntil: string;
};

type QuickSearchSource = {
  provider: string;
  status: string;
  durationMs: number;
  error?: string | null;
};

type QuickSearchResponse = {
  inquiryId: string;
  offers: QuickSearchOffer[];
  sources: QuickSearchSource[];
};

const getProviderLogo = (providerName: string) => providerName.charAt(0).toUpperCase();

const mapQuickOfferToLoanOffer = (
  offer: QuickSearchOffer,
  amount: number,
  duration: number,
): LoanOffer => ({
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
  isPersonalized: false,
  validUntil: new Date(offer.validUntil),
});

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [sources, setSources] = useState<QuickSearchSource[]>([]);
  const [showBlockingLoad, setShowBlockingLoad] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amount = Number(searchParams.get('amount')) || 10000;
  const duration = Number(searchParams.get('duration')) || 12;
  const hasIncome = searchParams.has('income');

  useEffect(() => {
    setShowBlockingLoad(true);
    setLoadingProgress(0);
    setOffers([]);
    setSources([]);
    setErrorMessage(null);

    const controller = new AbortController();
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 12));
    }, 250);

    const loadQuickSearch = async () => {
      try {
        const response = await fetch('/api/search/quick', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            durationMonths: duration,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Failed to load offers.');
        }

        const data = (await response.json()) as QuickSearchResponse;
        const mappedOffers = data.offers
          .map((offer) => mapQuickOfferToLoanOffer(offer, amount, duration))
          .sort((a, b) => a.monthlyInstallment - b.monthlyInstallment);

        setOffers(mappedOffers);
        setSources(data.sources);
        setLoadingProgress(100);
        setShowBlockingLoad(false);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load offers right now.',
        );
        setShowBlockingLoad(false);
        setLoadingProgress(0);
      } finally {
        clearInterval(progressInterval);
      }
    };

    loadQuickSearch();

    return () => {
      controller.abort();
      clearInterval(progressInterval);
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

  const availableProviders = sources.filter((source) => source.status === 'Ok');
  const pendingProviders = sources.filter((source) => source.status !== 'Ok');

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
                  <span className="status-text">Collecting offers from providers...</span>
                </div>
                
                <p className="loading-note">
                  Results guaranteed within 15 seconds
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="results-info">
                {sources.length === 0 ? (
                  <div className="info-partial">
                    <div className="partial-text">Waiting for provider status updates.</div>
                    <div className="partial-loader">
                      <span className="pulse-dot"></span>
                      <span className="pulse-dot"></span>
                      <span className="pulse-dot"></span>
                    </div>
                  </div>
                ) : availableProviders.length < sources.length ? (
                  <div className="info-partial">
                    <div className="partial-text">
                      Available results: {availableProviders.length}/{sources.length}.{' '}
                      {sources.length - availableProviders.length} providers unavailable.
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

              {errorMessage && (
                <div className="info-notice">
                  <span className="notice-icon">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="offers-list">
                {offers.length === 0 && !errorMessage && (
                  <div className="offer-card pending-offer">
                    <div className="offer-header">
                      <div className="provider-info">
                        <span className="provider-logo">ℹ️</span>
                        <span className="provider-name">No offers yet</span>
                      </div>
                    </div>
                    <div className="offer-details">
                      <div className="detail-item main">
                        <span className="detail-label">Monthly Payment</span>
                        <span className="detail-value">—</span>
                      </div>
                    </div>
                  </div>
                )}
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
                  <div key={provider.provider} className="offer-card pending-offer">
                    <div className="offer-header">
                      <div className="provider-info">
                        <span className="provider-logo">{getProviderLogo(provider.provider)}</span>
                        <span className="provider-name">{provider.provider}</span>
                      </div>
                      <span className="pending-tag">{provider.status}</span>
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
                        {provider.error ?? 'No response from provider'}
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
