import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header, Footer } from '../../components';
import {
  getGoogleOAuthConfig,
  loginUser,
  loginWithGoogleOAuthCode,
  registerUser,
} from '../../api/userApi';
import { ApiError, clearPendingProfile, getPendingProfile } from '../../api/apiConfig';
import type { UserProfile } from '../../types/dashboard.types';
import './LoginPage.css';

type Mode = 'login' | 'register';
type Role = 'user' | 'admin';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingProfile] = useState(getPendingProfile());
  const storedProfileKeyPrefix = 'loanhub_user_profile_';
  const oauthStateKey = 'loanhub_google_oauth_state';
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bankName: '',
    apiEndpoint: '',
    apiKey: '',
  });

  const title = useMemo(() => {
    if (mode === 'login') {
      return role === 'admin' ? 'Admin login' : 'User login';
    }
    return role === 'admin' ? 'Register bank admin' : 'Create your account';
  }, [mode, role]);

  const buildAddressText = (address?: UserProfile['address'], fallback?: string | null) => {
    if (!address) return fallback ?? null;
    const parts = [
      address.street,
      address.apartment ? `Apt ${address.apartment}` : null,
      address.postalCode && address.city ? `${address.postalCode} ${address.city}` : address.city,
      address.country,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : fallback ?? null;
  };

  const computeAge = (dateOfBirth?: string | null) => {
    if (!dateOfBirth) return null;
    const parsed = new Date(dateOfBirth);
    if (Number.isNaN(parsed.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - parsed.getFullYear();
    const monthDiff = today.getMonth() - parsed.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
      age -= 1;
    }
    return Math.max(0, age);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === 'register') {
        const pendingProfileForEmail =
          pendingProfile && pendingProfile.email === formData.email ? pendingProfile : null;

        const pendingAddressObject =
          pendingProfileForEmail && typeof pendingProfileForEmail.address === 'object'
            ? (pendingProfileForEmail.address as UserProfile['address'])
            : undefined;
        const pendingAddressText = buildAddressText(
          pendingAddressObject,
          pendingProfileForEmail?.addressText ??
            (typeof pendingProfileForEmail?.address === 'string'
              ? pendingProfileForEmail.address
              : null),
        );

        const authResponse = await registerUser({
          email: formData.email,
          password: formData.password,
          role,
          bankName: role === 'admin' ? formData.bankName : null,
          bankApiEndpoint: role === 'admin' ? formData.apiEndpoint : null,
          bankApiKey: role === 'admin' ? formData.apiKey : null,
          profile: {
            firstName: formData.firstName || null,
            lastName: formData.lastName || null,
            age: computeAge(pendingProfileForEmail?.dateOfBirth ?? null),
            jobTitle: pendingProfileForEmail?.jobTitle || null,
            address: pendingAddressText,
            phone: pendingProfileForEmail?.phone || null,
            dateOfBirth: pendingProfileForEmail?.dateOfBirth || null,
            monthlyIncome: pendingProfileForEmail?.monthlyIncome ?? null,
            livingCosts: pendingProfileForEmail?.livingCosts ?? null,
            dependents: pendingProfileForEmail?.dependents ?? null,
            idDocumentNumber: pendingProfileForEmail?.idDocumentNumber || null,
          },
        });

        if (role === 'user' && pendingProfileForEmail) {
          const storedProfile: UserProfile = {
            id: authResponse.id,
            email: authResponse.email,
            firstName: pendingProfileForEmail.firstName ?? authResponse.firstName ?? 'User',
            lastName: pendingProfileForEmail.lastName ?? authResponse.lastName ?? '',
            phone: pendingProfileForEmail.phone,
            dateOfBirth: pendingProfileForEmail.dateOfBirth
              ? new Date(pendingProfileForEmail.dateOfBirth)
              : undefined,
            address: pendingAddressObject,
            employment: pendingProfileForEmail.jobTitle || pendingProfileForEmail.employerName
              ? {
                  status: 'employed',
                  employerName: pendingProfileForEmail.employerName,
                  position: pendingProfileForEmail.jobTitle,
                }
              : undefined,
            monthlyIncome: pendingProfileForEmail.monthlyIncome,
            livingCosts: pendingProfileForEmail.livingCosts,
            dependents: pendingProfileForEmail.dependents,
            idDocument: pendingProfileForEmail.idDocumentNumber
              ? {
                  type: pendingProfileForEmail.idDocumentType ?? 'national_id',
                  number: pendingProfileForEmail.idDocumentNumber,
                  expiryDate: pendingProfileForEmail.idDocumentExpiry
                    ? new Date(pendingProfileForEmail.idDocumentExpiry)
                    : undefined,
                  verified: false,
                }
              : undefined,
            emailNotifications: true,
            smsNotifications: false,
            completionPercentage: 0,
          };

          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              `${storedProfileKeyPrefix}${authResponse.id}`,
              JSON.stringify(storedProfile),
            );
          }
        }
        clearPendingProfile();
        setMessage('Registration successful. Redirecting...');
      } else {
        await loginUser({
          email: formData.email,
          password: formData.password,
        });
        setMessage('Login successful. Redirecting...');
      }

      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin');
          return;
        }
        navigate('/dashboard');
      }, 900);
    } catch (err: unknown) {
      if (mode === 'login' && err instanceof ApiError && err.status === 401) {
        setError('błedne hasło');
        setIsSubmitting(false);
        return;
      }
      const messageText =
        err instanceof Error ? err.message : 'We could not complete the request.';
      setError(messageText);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  const handleGoogleOAuth = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const config = await getGoogleOAuthConfig();
      const state = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(oauthStateKey, state);
      }

      const redirectUri =
        config.redirectUri?.trim() || `${window.location.origin}/login`;

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: config.scope,
        state,
        include_granted_scopes: 'true',
        prompt: 'select_account',
      });

      const authUrl = `${config.authorizationEndpoint}?${params.toString()}`;
      setMessage('Redirecting to Google...');
      window.location.assign(authUrl);
    } catch (err: unknown) {
      const messageText =
        err instanceof Error ? err.message : 'We could not start Google login.';
      setError(messageText);
      setIsSubmitting(false);
    }
  };

  const handleChange =
    (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

  useEffect(() => {
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'register' || requestedMode === 'login') {
      setMode(requestedMode);
    }

    const state = location.state as { prefill?: Partial<typeof formData> } | null;
    const prefill = state?.prefill;

    const mock =
      role === 'admin'
        ? {
            email: 'admin@loanhub.test',
            password: 'AdminDemo123!',
            bankName: 'Summit Trust',
            apiEndpoint: 'https://api.summittrust.test/loans',
            apiKey: '',
          }
        : {
            email: 'user@loanhub.test',
            password: 'UserDemo123!',
            bankName: '',
            apiEndpoint: '',
            apiKey: '',
          };

    setFormData((prev) => ({
      ...prev,
      ...prefill,
      email: prefill?.email ?? mock.email,
      password: prefill?.password ?? mock.password,
      confirmPassword: prefill?.confirmPassword ?? mock.password,
      bankName: prefill?.bankName ?? mock.bankName,
      apiEndpoint: prefill?.apiEndpoint ?? mock.apiEndpoint,
      apiKey: prefill?.apiKey ?? mock.apiKey,
    }));
  }, [location.state, role, searchParams]);

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const description = searchParams.get('error_description');
      setError(description ? `${oauthError}: ${description}` : oauthError);
      return;
    }

    const code = searchParams.get('code');
    if (!code) return;

    const returnedState = searchParams.get('state');
    const expectedState =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem(oauthStateKey)
        : null;

    if (!expectedState || returnedState !== expectedState) {
      setError('OAuth state mismatch. Please try again.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(oauthStateKey);
    }

    setMode('login');
    setRole('user');
    setIsSubmitting(true);
    setMessage('Signing you in with Google...');
    setError(null);

    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('code');
    cleanUrl.searchParams.delete('state');
    cleanUrl.searchParams.delete('scope');
    cleanUrl.searchParams.delete('authuser');
    cleanUrl.searchParams.delete('prompt');
    window.history.replaceState({}, document.title, cleanUrl.toString());

    loginWithGoogleOAuthCode({ code, redirectUri })
      .then(() => {
        setMessage('Login successful. Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 900);
      })
      .catch((err: unknown) => {
        const messageText =
          err instanceof Error ? err.message : 'OAuth login failed.';
        setError(messageText);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [navigate, searchParams]);

  return (
    <>
      <Header
        onLoginClick={() => navigate('/login')}
        onSearchClick={() => navigate('/search')}
      />
      <main className="login-page">
        <section className="login-hero">
          <div className="login-hero-container">
            <span className="login-badge">LoanHub Access</span>
            <h1 className="login-title">{title}</h1>
            <p className="login-subtitle">
              {mode === 'login'
                ? 'Access your saved applications, offers, and account settings.'
                : 'Create an account to manage offers, track applications, and finish onboarding.'}
            </p>
          </div>
        </section>

        <section className="login-content">
          <div className="login-card">
            <div className="role-toggle">
              <button
                type="button"
                className={`role-btn ${role === 'user' ? 'active' : ''}`}
                onClick={() => setRole('user')}
              >
                <span className="role-icon" aria-hidden="true">👤</span>
                <span className="role-text">
                  <span className="role-title">User</span>
                  <span className="role-desc">Find and manage loan offers</span>
                </span>
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'admin' ? 'active' : ''}`}
                onClick={() => setRole('admin')}
              >
                <span className="role-icon" aria-hidden="true">🏦</span>
                <span className="role-text">
                  <span className="role-title">Bank Admin</span>
                  <span className="role-desc">Connect provider APIs</span>
                </span>
              </button>
            </div>

            {role === 'user' && (
              <div className="oauth-section">
                <p className="oauth-title">Or continue with</p>
                <div className="oauth-buttons">
                  <button
                    type="button"
                    className="oauth-btn"
                    onClick={handleGoogleOAuth}
                    disabled={isSubmitting}
                  >
                    <span className="oauth-icon">
                      <svg viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.74 1.22 9.24 3.22l6.9-6.9C35.9 2.08 30.3 0 24 0 14.6 0 6.52 5.38 2.55 13.2l8.45 6.57C13 13.24 18.08 9.5 24 9.5Z"/>
                        <path fill="#4285F4" d="M46.5 24c0-1.6-.14-3.13-.4-4.6H24v9.3h12.65c-.55 2.9-2.2 5.36-4.67 7.04l7.2 5.58C43.9 37.02 46.5 31 46.5 24Z"/>
                        <path fill="#FBBC05" d="M10.99 28.77A14.5 14.5 0 0 1 10.2 24c0-1.66.28-3.27.79-4.77l-8.45-6.57A23.98 23.98 0 0 0 0 24c0 3.88.93 7.55 2.54 10.82l8.45-6.05Z"/>
                        <path fill="#34A853" d="M24 48c6.3 0 11.6-2.08 15.47-5.68l-7.2-5.58C30.1 38.9 27.24 40 24 40c-5.9 0-11-3.72-12.99-8.94l-8.45 6.05C6.52 42.62 14.6 48 24 48Z"/>
                      </svg>
                    </span>
                    Google
                  </button>
                </div>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange('firstName')}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange('lastName')}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  required
                />
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange('password')}
                  required
                />
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    required
                  />
                </div>
              )}

              <label className="password-toggle">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                />
                <span>Show password</span>
              </label>

              {mode === 'register' && role === 'admin' && (
                <>
                  <div className="form-group">
                    <label htmlFor="bankName">Bank name</label>
                    <input
                      id="bankName"
                      name="bankName"
                      type="text"
                      value={formData.bankName}
                      onChange={handleChange('bankName')}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="apiEndpoint">Bank API endpoint</label>
                    <input
                      id="apiEndpoint"
                      name="apiEndpoint"
                      type="url"
                      placeholder="@baseUrl = https://api.bank.com"
                      value={formData.apiEndpoint}
                      onChange={handleChange('apiEndpoint')}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="apiKey">Bank API key</label>
                    <input
                      id="apiKey"
                      name="apiKey"
                      type="password"
                      placeholder="@apiKey = X-Api-Key value"
                      value={formData.apiKey}
                      onChange={handleChange('apiKey')}
                    />
                  </div>
                </>
              )}

              <button className="submit-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : mode === 'login' ? 'Log in' : 'Register'}
              </button>
            </form>

            {message && <div className="form-message">{message}</div>}
            {error && <div className="form-message error">{error}</div>}

            <div className="login-footer">
              <p>
                {mode === 'login' ? 'No account yet?' : 'Already have an account?'}
              </p>
              <button
                type="button"
                className="text-link"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Create one' : 'Log in instead'}
              </button>
            </div>
          </div>
        </section>
        <button
          type="button"
          className="platform-admin-entry"
          onClick={() => navigate('/platform-admin')}
          aria-label="Platform admin dashboard"
          title="Platform admin dashboard"
        >
          ⚙
        </button>
      </main>
      <Footer />
    </>
  );
}
