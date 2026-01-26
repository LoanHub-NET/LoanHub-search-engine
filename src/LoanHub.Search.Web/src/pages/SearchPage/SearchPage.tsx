import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { useForm } from '../../hooks';
import { clearAuthSession, getAuthSession } from '../../api/apiConfig';
import type { UserProfile } from '../../types/dashboard.types';
import { 
  validateQuickSearch, 
  validateExtendedSearch,
  LOAN_AMOUNT, 
  LOAN_DURATION 
} from '../../utils/validation';
import { formatNumber } from '../../utils/formatters';
import type { FieldError } from '../../types';
import './SearchPage.css';

interface SearchFormValues {
  [key: string]: string;
  amount: string;
  duration: string;
  monthlyIncome: string;
  livingCosts: string;
  dependents: string;
}

const AMOUNT_PRESETS = [5000, 10000, 25000, 50000, 100000];
const DURATION_PRESETS = [6, 12, 24, 36, 60, 120];
const storedProfileKeyPrefix = 'loanhub_user_profile_';

const getStoredProfile = (userId?: string | null): Partial<UserProfile> | null => {
  if (!userId || typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(`${storedProfileKeyPrefix}${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<UserProfile>;
  } catch {
    return null;
  }
};

export function SearchPage() {
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [authSession, setAuthSession] = useState(getAuthSession());

  const validateForm = (values: SearchFormValues): FieldError[] => {
    if (showAdvanced) {
      const result = validateExtendedSearch(values);
      return result.errors;
    }
    const result = validateQuickSearch({ 
      amount: values.amount, 
      duration: values.duration 
    });
    return result.errors;
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    setValue,
    handleSubmit,
  } = useForm<SearchFormValues>({
    initialValues: {
      amount: LOAN_AMOUNT.DEFAULT.toString(),
      duration: LOAN_DURATION.DEFAULT.toString(),
      monthlyIncome: '',
      livingCosts: '',
      dependents: '',
    },
    validate: validateForm,
    onSubmit: (formValues) => {
      const params = new URLSearchParams({
        amount: formValues.amount,
        duration: formValues.duration,
      });

      if (showAdvanced) {
        if (formValues.monthlyIncome) {
          params.set('income', formValues.monthlyIncome);
        }
        if (formValues.livingCosts) {
          params.set('costs', formValues.livingCosts);
        }
        if (formValues.dependents) {
          params.set('dependents', formValues.dependents);
        }
      }

      navigate(`/search/results?${params.toString()}`);
    },
  });

  useEffect(() => {
    const session = getAuthSession();
    setAuthSession(session);
    if (!session) return;
    const storedProfile = getStoredProfile(session.id);

    const monthlyIncome = storedProfile?.monthlyIncome ?? session.monthlyIncome ?? null;
    const livingCosts = storedProfile?.livingCosts ?? session.livingCosts ?? null;
    const dependents = storedProfile?.dependents ?? session.dependents ?? null;

    const hasAdvancedData =
      monthlyIncome !== null || livingCosts !== null || dependents !== null;

    if (hasAdvancedData && !showAdvanced) {
      setShowAdvanced(true);
    }

    if (!values.monthlyIncome && monthlyIncome !== null) {
      setValue('monthlyIncome', String(monthlyIncome));
    }
    if (!values.livingCosts && livingCosts !== null) {
      setValue('livingCosts', String(livingCosts));
    }
    if (!values.dependents && dependents !== null) {
      setValue('dependents', String(dependents));
    }
  }, [setValue, showAdvanced, values.dependents, values.livingCosts, values.monthlyIncome]);

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
  const handleSearchClick = () => {}; // Already on search page
  const handleLogout = () => {
    clearAuthSession();
    setAuthSession(null);
    navigate('/login');
  };

  const getFieldError = (field: keyof SearchFormValues) => {
    return touched[field] && errors[field] ? errors[field] : null;
  };

  return (
    <div className="search-page">
      <Header
        onLoginClick={handleLoginClick}
        onSearchClick={handleSearchClick}
        adminUser={adminUser}
        onLogout={handleLogout}
      />
      
      <main className="search-main">
        <div className="search-container">
          <div className="search-header">
            <h1 className="search-title">Find Your Perfect Loan</h1>
            <p className="search-subtitle">
              Compare offers from multiple banks. Fill in your details for personalized results.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="search-form">
            <div className="form-section">
              <h2 className="section-title">Loan Details</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount" className="form-label">
                    Loan Amount <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={values.amount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      min={LOAN_AMOUNT.MIN}
                      max={LOAN_AMOUNT.MAX}
                      step="100"
                      className={`form-input ${getFieldError('amount') ? 'error' : ''}`}
                      placeholder="Enter amount"
                    />
                  </div>
                  {getFieldError('amount') && (
                    <span className="error-message">{getFieldError('amount')}</span>
                  )}
                  <div className="presets">
                    {AMOUNT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`preset-btn ${values.amount === preset.toString() ? 'active' : ''}`}
                        onClick={() => setValue('amount', preset.toString())}
                      >
                        ${formatNumber(preset)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="duration" className="form-label">
                    Duration <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={values.duration}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      min={LOAN_DURATION.MIN}
                      max={LOAN_DURATION.MAX}
                      className={`form-input ${getFieldError('duration') ? 'error' : ''}`}
                      placeholder="Enter months"
                    />
                    <span className="input-suffix">months</span>
                  </div>
                  {getFieldError('duration') && (
                    <span className="error-message">{getFieldError('duration')}</span>
                  )}
                  <div className="presets">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`preset-btn ${values.duration === preset.toString() ? 'active' : ''}`}
                        onClick={() => setValue('duration', preset.toString())}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="advanced-toggle">
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
                <svg
                  className={`toggle-icon ${showAdvanced ? 'open' : ''}`}
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>

            {showAdvanced && (
              <div className="form-section advanced-section">
                <h2 className="section-title">Financial Information</h2>
                <p className="section-description">
                  Optional: Provide these details for more accurate, personalized offers.
                </p>

                <div className="form-row three-col">
                  <div className="form-group">
                    <label htmlFor="monthlyIncome" className="form-label">
                      Monthly Income
                    </label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input
                        type="number"
                        id="monthlyIncome"
                        name="monthlyIncome"
                        value={values.monthlyIncome}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        min="0"
                        step="100"
                        className={`form-input ${getFieldError('monthlyIncome') ? 'error' : ''}`}
                        placeholder="e.g., 5000"
                      />
                    </div>
                    {getFieldError('monthlyIncome') && (
                      <span className="error-message">{getFieldError('monthlyIncome')}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="livingCosts" className="form-label">
                      Monthly Living Costs
                    </label>
                    <div className="input-wrapper">
                      <span className="input-prefix">$</span>
                      <input
                        type="number"
                        id="livingCosts"
                        name="livingCosts"
                        value={values.livingCosts}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        min="0"
                        step="100"
                        className={`form-input ${getFieldError('livingCosts') ? 'error' : ''}`}
                        placeholder="e.g., 2000"
                      />
                    </div>
                    {getFieldError('livingCosts') && (
                      <span className="error-message">{getFieldError('livingCosts')}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="dependents" className="form-label">
                      Number of Dependents
                    </label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        id="dependents"
                        name="dependents"
                        value={values.dependents}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        min="0"
                        max="20"
                        className={`form-input ${getFieldError('dependents') ? 'error' : ''}`}
                        placeholder="e.g., 2"
                      />
                    </div>
                    {getFieldError('dependents') && (
                      <span className="error-message">{getFieldError('dependents')}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Find Best Offers</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </>
                )}
              </button>
            </div>

            <p className="form-disclaimer">
              🔒 Your search is anonymous. We query multiple banks in real-time without 
              affecting your credit score.
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
