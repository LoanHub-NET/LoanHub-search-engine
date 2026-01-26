import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { formatCurrency, formatPercent, formatDuration } from '../../utils/formatters';
import type { LoanOffer, LoanProvider } from '../../types';
import { searchDetailed, searchQuick } from '../../api/searchApi';
import './SearchResultsPage.css';

const providerLogoMap: Record<string, string> = {
  MockBank1: '🏦',
  MockBank2: '🏛️',
};

const fallbackProviders: LoanProvider[] = [
  { id: 'mockbank1', name: 'MockBank1', logo: '🏦' },
  { id: 'mockbank2', name: 'MockBank2', logo: '🏛️' },
];

const minProvidersForResults = 2;

const toSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [showBlockingLoad, setShowBlockingLoad] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [respondedProviders, setRespondedProviders] = useState<string[]>([]);
  const [providers, setProviders] = useState<LoanProvider[]>(fallbackProviders);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const amount = Number(searchParams.get('amount')) || 10000;
  const duration = Number(searchParams.get('duration')) || 12;
  const incomeParam = searchParams.get('income');
  const costsParam = searchParams.get('costs');
  const dependentsParam = searchParams.get('dependents');

  const income = incomeParam ? Number(incomeParam) : null;
  const livingCosts = costsParam ? Number(costsParam) : null;
  const dependents = dependentsParam ? Number(dependentsParam) : null;

  const isPersonalizedSearch = useMemo(() => {
    if (income === null || livingCosts === null || dependents === null) {
      return false;
    }
    return income > 0 && livingCosts >= 0 && dependents >= 0;
  }, [income, livingCosts, dependents]);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setShowBlockingLoad(true);
    setLoadingProgress(0);
    setRespondedProviders([]);
    setOffers([]);
    setErrorMessage(null);
    setProviders(fallbackProviders);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) return 100;
        if (prev >= 95) return 95;
        return prev + Math.random() * 12;
      });
    }, 250);

    const fetchOffers = async () => {
      try {
        const response = isPersonalizedSearch
          ? await searchDetailed(
              {
                amount,
                durationMonths: duration,
                income: income ?? 0,
                livingCosts: livingCosts ?? 0,
                dependents: dependents ?? 0,
              },
              controller.signal,
            )
          : await searchQuick(
              {
                amount,
                durationMonths: duration,
              },
              controller.signal,
            );

        if (!isActive) return;

        const apiProviders: LoanProvider[] = response.sources.map((source) => ({
          id: toSlug(source.provider),
          name: source.provider,
          logo: providerLogoMap[source.provider] ?? '🏦',
        }));

        const mappedOffers: LoanOffer[] = response.offers.map((offer, index) => ({
          id: `${offer.providerOfferId}-${index}`,
          providerId: toSlug(offer.provider),
          providerName: offer.provider,
          providerLogo: providerLogoMap[offer.provider] ?? '🏦',
          amount,
          duration,
          monthlyInstallment: offer.installment,
          interestRate: offer.apr * 100,
          apr: offer.apr * 100,
          totalRepayment: offer.totalCost,
          isPersonalized: isPersonalizedSearch,
          validUntil: new Date(offer.validUntil),
        }));

        setProviders(apiProviders.length ? apiProviders : fallbackProviders);
        setRespondedProviders(apiProviders.map((provider) => provider.id));
        setOffers(
          mappedOffers.sort((a, b) => a.monthlyInstallment - b.monthlyInstallment),
        );
        setLoadingProgress(100);
        setShowBlockingLoad(false);
      } catch (error) {
        if (!isActive || controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Failed to load offers.';
        setErrorMessage(message);
        setLoadingProgress(100);
        setShowBlockingLoad(false);
      }
    };

    void fetchOffers();

    return () => {
      isActive = false;
      controller.abort();
      clearInterval(progressInterval);
    };
  }, [amount, duration, dependents, income, isPersonalizedSearch, livingCosts, reloadKey]);

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
                
                {!isPersonalizedSearch && (
                  <div className="info-notice">
                    <span className="notice-icon">💡</span>
                    <span>
                      These are estimated rates. Select an offer and provide more details 
                      for personalized rates.
                    </span>
                  </div>
                )}
              </div>

              {errorMessage ? (
                <div className="loading-state">
                  <div className="loading-card">
                    <div className="loading-icon">⚠️</div>
                    <h2>Unable to load offers</h2>
                    <p>{errorMessage}</p>
                    <button className="select-btn" onClick={() => setReloadKey((prev) => prev + 1)}>
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
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
              )}

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
