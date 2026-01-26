import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { formatCurrency, formatPercent, formatDuration } from '../../utils/formatters';
import type { LoanOffer } from '../../types';
import {
  createOfferSelection,
  searchDetailed,
  searchQuick,
} from '../../api/loanhubApi';
import { mapOfferDtoToLoanOffer } from '../../api/mappers';
import { getProviderId, getProviderLogo } from '../../utils/providers';
import './SearchResultsPage.css';

interface ProviderStatus {
  id: string;
  name: string;
  logo: string;
  status: string;
}

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [showBlockingLoad, setShowBlockingLoad] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [respondedProviders, setRespondedProviders] = useState<string[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const amount = Number(searchParams.get('amount')) || 10000;
  const duration = Number(searchParams.get('duration')) || 12;
  const hasIncome = searchParams.has('income');
  const income = Number(searchParams.get('income'));
  const livingCosts = Number(searchParams.get('costs'));
  const dependents = Number(searchParams.get('dependents'));

  useEffect(() => {
    let isActive = true;
    setShowBlockingLoad(true);
    setLoadingProgress(0);
    setRespondedProviders([]);
    setOffers([]);
    setProviders([]);
    setError(null);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) return prev;
        return Math.min(90, prev + Math.random() * 10);
      });
    }, 250);

    const fetchOffers = async () => {
      try {
        const response = hasIncome
          ? await searchDetailed({
              amount,
              durationMonths: duration,
              income,
              livingCosts,
              dependents,
            })
          : await searchQuick({ amount, durationMonths: duration });

        if (!isActive) return;

        setInquiryId(response.inquiryId);
        setOffers(
          response.offers
            .map((offer) => mapOfferDtoToLoanOffer(offer, amount, duration, hasIncome))
            .sort((a, b) => a.monthlyInstallment - b.monthlyInstallment),
        );

        const providerStatuses = response.sources.map((source) => ({
          id: getProviderId(source.provider),
          name: source.provider,
          logo: getProviderLogo(source.provider),
          status: source.status,
        }));

        setProviders(providerStatuses);
        setRespondedProviders(providerStatuses.map((provider) => provider.id));
        setLoadingProgress(100);
        setShowBlockingLoad(false);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load offers.');
        setLoadingProgress(100);
        setShowBlockingLoad(false);
      } finally {
        clearInterval(progressInterval);
      }
    };

    fetchOffers();

    return () => {
      isActive = false;
      clearInterval(progressInterval);
    };
  }, [amount, duration, hasIncome, income, livingCosts, dependents]);

  const handleLoginClick = () => navigate('/login');
  const handleSearchClick = () => navigate('/search');

  const handleSelectOffer = async (offer: LoanOffer) => {
    const applicationOffer = {
      id: offer.id,
      providerId: offer.providerId,
      providerName: offer.providerName,
      providerLogo: offer.providerLogo,
      providerOfferId: offer.providerOfferId,
      amount: offer.amount,
      duration: offer.duration,
      interestRate: offer.interestRate,
      apr: offer.apr,
      monthlyInstallment: offer.monthlyInstallment,
      totalRepayment: offer.totalRepayment,
      totalInterest: offer.totalRepayment - offer.amount,
      processingTime: '1-3 business days',
      validUntil: offer.validUntil,
    };

    if (!inquiryId || !offer.providerOfferId) {
      navigate('/apply', { state: { offer: applicationOffer } });
      return;
    }

    setIsSelecting(true);
    setError(null);

    try {
      const selection = await createOfferSelection({
        inquiryId,
        provider: offer.providerName,
        providerOfferId: offer.providerOfferId,
        installment: offer.monthlyInstallment,
        apr: offer.apr,
        totalCost: offer.totalRepayment,
        amount: offer.amount,
        durationMonths: offer.duration,
        validUntil: offer.validUntil.toISOString(),
        ...(hasIncome
          ? {
              income,
              livingCosts,
              dependents,
            }
          : null),
      });

      navigate('/apply', {
        state: {
          offer: applicationOffer,
          selectionId: selection.id,
          inquiryId: selection.inquiryId,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create selection.');
    } finally {
      setIsSelecting(false);
    }
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
              {error && (
                <div className="results-empty">
                  <h2>Unable to load offers</h2>
                  <p>{error}</p>
                </div>
              )}
              {!error && (
                <>
                  {offers.length === 0 ? (
                    <div className="results-empty">
                      <h2>No offers found</h2>
                      <p>Try adjusting your search criteria.</p>
                    </div>
                  ) : (
                    <div className="results-grid">
                      {offers.map((offer) => (
                        <div key={offer.id} className="offer-card">
                          <div className="offer-header">
                            <div className="provider-info">
                              <span className="provider-logo">{offer.providerLogo}</span>
                              <div>
                                <h3>{offer.providerName}</h3>
                                <span className="offer-id">Offer ID: {offer.id}</span>
                              </div>
                            </div>
                            {offer.isPersonalized && (
                              <span className="personalized-badge">Personalized</span>
                            )}
                          </div>

                          <div className="offer-details">
                            <div className="detail-item highlight">
                              <span className="detail-label">Monthly Payment</span>
                              <span className="detail-value">{formatCurrency(offer.monthlyInstallment)}</span>
                            </div>
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

                          <div className="offer-footer">
                            <button
                              className="select-offer-btn"
                              onClick={() => handleSelectOffer(offer)}
                              disabled={isSelecting}
                            >
                              {isSelecting ? 'Processing...' : 'Select Offer'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingProviders.length > 0 && (
                    <div className="pending-providers">
                      <h3>Still waiting on {pendingProviders.length} providers</h3>
                      <div className="provider-list">
                        {pendingProviders.map((provider) => (
                          <div key={provider.id} className="provider-pill">
                            <span className="provider-logo">{provider.logo}</span>
                            <span>{provider.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
