import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '../../components';
import './LoginPage.css';

type Mode = 'login' | 'register';
type Role = 'user' | 'admin';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setMessage(
        mode === 'login'
          ? 'Login successful (mock). Redirecting...'
          : 'Registration submitted (mock). Redirecting...',
      );
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

    setMode('login');
    setFormData((prev) => ({
      ...prev,
      email: mock.email,
      password: mock.password,
      confirmPassword: mock.password,
      bankName: mock.bankName,
      apiEndpoint: mock.apiEndpoint,
    }));
  }, [role]);

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
