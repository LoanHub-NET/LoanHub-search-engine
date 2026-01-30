import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Header, Footer } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import {
  createBankApiKey,
  listBankApiKeys,
  loginPlatformAdmin,
  revokeBankApiKey,
  type BankApiKeyCreatedResponse,
  type BankApiKeyResponse,
} from '../../api/platformAdminApi';
import './PlatformAdminDashboardPage.css';

export function PlatformAdminDashboardPage() {
  const { session, isPlatformAdmin, logout, refresh } = useAuth();
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [keys, setKeys] = useState<BankApiKeyResponse[]>([]);
  const [createdKey, setCreatedKey] = useState<BankApiKeyCreatedResponse | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adminUser = useMemo(() => {
    if (!session) return undefined;
    return {
      name: session.firstName || session.email,
      email: session.email,
      role: session.role,
    };
  }, [session]);

  useEffect(() => {
    if (!isPlatformAdmin) return;
    setLoading(true);
    listBankApiKeys()
      .then((data) => setKeys(data))
      .catch((err: unknown) => {
        const messageText = err instanceof Error ? err.message : 'Failed to load API keys.';
        setError(messageText);
      })
      .finally(() => setLoading(false));
  }, [isPlatformAdmin]);

  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await loginPlatformAdmin(loginData.username, loginData.password);
      refresh();
      setMessage('Welcome back. Loading dashboard...');
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : 'Login failed.';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Provide a name for the key.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const created = await createBankApiKey(newKeyName.trim());
      setCreatedKey(created);
      setNewKeyName('');
      const latest = await listBankApiKeys();
      setKeys(latest);
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : 'Could not create API key.';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await revokeBankApiKey(id);
      setKeys((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setMessage('Key revoked.');
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : 'Could not revoke key.';
      setError(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header
        onLoginClick={() => {}}
        onSearchClick={() => {}}
        adminUser={adminUser}
        onLogout={logout}
      />
      <main className="platform-admin-page">
        <section className="platform-admin-hero">
          <div className="platform-admin-hero-inner">
            <span className="platform-badge">Platform Control</span>
            <h1>LoanHub Platform Console</h1>
            <p>Manage API keys for partner search engines and monitor access.</p>
          </div>
        </section>

        {!isPlatformAdmin ? (
          <section className="platform-admin-card">
            <h2>Sign in</h2>
            <p>Use your platform credentials to manage partner API keys.</p>
            <form onSubmit={handleLoginSubmit} className="platform-admin-form">
              <label>
                Username
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Access console'}
              </button>
            </form>
            {message && <div className="platform-message">{message}</div>}
            {error && <div className="platform-message error">{error}</div>}
          </section>
        ) : (
          <section className="platform-admin-grid">
            <div className="platform-card">
              <h2>Create new API key</h2>
              <p>Generate a key for partner search engines. Share it once — it will not be shown again.</p>
              <div className="platform-create">
                <input
                  type="text"
                  placeholder="Partner name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <button onClick={handleCreateKey} disabled={loading}>
                  {loading ? 'Working...' : 'Generate'}
                </button>
              </div>

              {createdKey && (
                <div className="platform-created">
                  <div>
                    <strong>New key for {createdKey.name}</strong>
                    <p>Copy this key now. You will not see it again.</p>
                  </div>
                  <code>{createdKey.apiKey}</code>
                </div>
              )}
            </div>

            <div className="platform-card">
              <div className="platform-card-header">
                <h2>Active API keys</h2>
                <span>{keys.length} total</span>
              </div>
              {loading && keys.length === 0 ? (
                <p className="platform-muted">Loading keys...</p>
              ) : keys.length === 0 ? (
                <p className="platform-muted">No keys yet. Create your first key.</p>
              ) : (
                <div className="platform-table">
                  <div className="platform-table-head">
                    <span>Name</span>
                    <span>Status</span>
                    <span>Created</span>
                    <span></span>
                  </div>
                  {keys.map((key) => (
                    <div className="platform-table-row" key={key.id}>
                      <div>
                        <strong>{key.name}</strong>
                        <small>{key.id}</small>
                      </div>
                      <span className={`pill ${key.isActive ? 'active' : 'revoked'}`}>
                        {key.isActive ? 'Active' : 'Revoked'}
                      </span>
                      <span>{new Date(key.createdAt).toLocaleDateString()}</span>
                      <button
                        type="button"
                        className="link-btn"
                        disabled={!key.isActive || loading}
                        onClick={() => handleRevoke(key.id)}
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
