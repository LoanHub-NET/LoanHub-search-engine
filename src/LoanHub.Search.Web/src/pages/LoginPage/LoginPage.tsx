import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Header, Footer } from '../../components';
import { loginUser, registerUser } from '../../api/userApi';
import { ApiError, clearPendingProfile, getPendingProfile } from '../../api/apiConfig';
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    bankName: '',
    apiEndpoint: '',
  });

  const title = useMemo(() => {
    if (mode === 'login') {
      return role === 'admin' ? 'Admin login' : 'User login';
    }
    return role === 'admin' ? 'Register bank admin' : 'Create your account';
  }, [mode, role]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      if (mode === 'register') {
        const pendingProfileForEmail =
          pendingProfile && pendingProfile.email === formData.email ? pendingProfile : null;

        await registerUser({
          email: formData.email,
          password: formData.password,
          profile: {
            firstName: formData.firstName || null,
            lastName: formData.lastName || null,
            age: null,
            jobTitle: pendingProfileForEmail?.jobTitle || null,
            address: pendingProfileForEmail?.address || null,
            phone: pendingProfileForEmail?.phone || null,
            dateOfBirth: pendingProfileForEmail?.dateOfBirth || null,
            monthlyIncome: pendingProfileForEmail?.monthlyIncome ?? null,
            livingCosts: pendingProfileForEmail?.livingCosts ?? null,
            dependents: pendingProfileForEmail?.dependents ?? null,
            idDocumentNumber: pendingProfileForEmail?.idDocumentNumber || null,
          },
        });
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

  const handleOAuth = (provider: string) => {
    setIsSubmitting(true);
    setMessage(null);
    setTimeout(() => {
      setIsSubmitting(false);
      setMessage(`OAuth login via ${provider} (mock). Redirecting...`);
      setTimeout(() => {
        navigate('/');
      }, 900);
    }, 900);
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
          }
        : {
            email: 'user@loanhub.test',
            password: 'UserDemo123!',
            bankName: '',
            apiEndpoint: '',
          };

    setFormData((prev) => ({
      ...prev,
      ...prefill,
      email: prefill?.email ?? mock.email,
      password: prefill?.password ?? mock.password,
      confirmPassword: prefill?.confirmPassword ?? mock.password,
      bankName: prefill?.bankName ?? mock.bankName,
      apiEndpoint: prefill?.apiEndpoint ?? mock.apiEndpoint,
    }));
  }, [location.state, role, searchParams]);

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
                    onClick={() => handleOAuth('Google')}
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
                  <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => handleOAuth('Microsoft')}
                    disabled={isSubmitting}
                  >
                    <span className="oauth-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#F25022" d="M1 1h10v10H1z"/>
                        <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                        <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                        <path fill="#FFB900" d="M13 13h10v10H13z"/>
                      </svg>
                    </span>
                    Microsoft
                  </button>
                  <button
                    type="button"
                    className="oauth-btn"
                    onClick={() => handleOAuth('Facebook')}
                    disabled={isSubmitting}
                  >
                    <span className="oauth-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.43H7.08V12.1h3.05V9.43c0-3.03 1.8-4.7 4.55-4.7 1.32 0 2.7.23 2.7.23v2.98H16.1c-1.5 0-1.96.94-1.96 1.9v2.28h3.33l-.53 3.47h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"/>
                      </svg>
                    </span>
                    Facebook
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
                      placeholder="https://api.bank.com/loans"
                      value={formData.apiEndpoint}
                      onChange={handleChange('apiEndpoint')}
                      required
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
      </main>
      <Footer />
    </>
  );
}
