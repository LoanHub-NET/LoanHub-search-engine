import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Header, Footer } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import {
  createBankApiKey,
  listAuditLogs,
  listBankApiKeys,
  loginPlatformAdmin,
  revokeBankApiKey,
  type AuditLogPagedResponse,
  type AuditLogResponse,
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
  const [activeTab, setActiveTab] = useState<'keys' | 'audit'>('keys');
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [auditMeta, setAuditMeta] = useState<AuditLogPagedResponse | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilters, setAuditFilters] = useState({
    from: '',
    to: '',
    method: '',
    path: '',
    email: '',
    statusCode: '',
  });
  const [selectedAudit, setSelectedAudit] = useState<AuditLogResponse | null>(null);

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

  const loadAudits = async (
    pageOverride?: number,
    filtersOverride?: typeof auditFilters,
  ) => {
    if (!isPlatformAdmin) return;
    const page = pageOverride ?? auditPage;
    setAuditLoading(true);
    setAuditError(null);
    const filters = filtersOverride ?? auditFilters;
    const statusValue = filters.statusCode.trim()
      ? Number(filters.statusCode.trim())
      : undefined;
    const fromValue = filters.from ? new Date(filters.from).toISOString() : undefined;
    const toValue = filters.to ? new Date(filters.to).toISOString() : undefined;

    try {
      const data = await listAuditLogs({
        from: fromValue,
        to: toValue,
        method: filters.method.trim() || undefined,
        path: filters.path.trim() || undefined,
        email: filters.email.trim() || undefined,
        statusCode: Number.isNaN(statusValue) ? undefined : statusValue,
        page,
        pageSize: 50,
      });
      setAuditMeta(data);
      setAuditLogs(data.items);
      setAuditPage(data.page);
      setSelectedAudit(data.items[0] ?? null);
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : 'Failed to load audit logs.';
      setAuditError(messageText);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleAuditSearch = async () => {
    await loadAudits(1);
  };

  const handleAuditReset = async () => {
    const resetFilters = {
      from: '',
      to: '',
      method: '',
      path: '',
      email: '',
      statusCode: '',
    };
    setAuditFilters(resetFilters);
    await loadAudits(1, resetFilters);
  };

  const handleAuditPageChange = async (nextPage: number) => {
    await loadAudits(nextPage);
  };

  const formatJson = (value?: string | null) => {
    if (!value) return '';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  };

  useEffect(() => {
    if (!isPlatformAdmin || activeTab !== 'audit') return;
    loadAudits(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformAdmin, activeTab]);

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
          <>
            <section className="platform-admin-tabs">
              <button
                type="button"
                className={`platform-tab ${activeTab === 'keys' ? 'active' : ''}`}
                onClick={() => setActiveTab('keys')}
              >
                API keys
              </button>
              <button
                type="button"
                className={`platform-tab ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                Audit
              </button>
            </section>

            {activeTab === 'keys' ? (
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
            ) : (
              <section className="platform-audit-grid">
                <div className="platform-card">
                  <div className="platform-card-header">
                    <h2>Audit trail</h2>
                    <button
                      type="button"
                      className="audit-refresh"
                      onClick={() => loadAudits()}
                      disabled={auditLoading}
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="audit-filters">
                    <label>
                      From
                      <input
                        type="datetime-local"
                        value={auditFilters.from}
                        onChange={(e) =>
                          setAuditFilters((prev) => ({ ...prev, from: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      To
                      <input
                        type="datetime-local"
                        value={auditFilters.to}
                        onChange={(e) =>
                          setAuditFilters((prev) => ({ ...prev, to: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Method
                      <select
                        value={auditFilters.method}
                        onChange={(e) =>
                          setAuditFilters((prev) => ({ ...prev, method: e.target.value }))
                        }
                      >
                        <option value="">Any</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </label>
                    <label>
                      Status
                      <input
                        type="number"
                        placeholder="200"
                        value={auditFilters.statusCode}
                        onChange={(e) =>
                          setAuditFilters((prev) => ({ ...prev, statusCode: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Path
                      <input
                        type="text"
                        placeholder="/api/..."
                        value={auditFilters.path}
                        onChange={(e) =>
                          setAuditFilters((prev) => ({ ...prev, path: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      User email
                      <input
                        type="text"
                        placeholder="user@example.com"
                        value={auditFilters.email}
                        onChange={(e) =>
                          setAuditFilters((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </label>
                    <div className="audit-filter-actions">
                      <button type="button" onClick={handleAuditSearch} disabled={auditLoading}>
                        Apply
                      </button>
                      <button type="button" className="ghost" onClick={handleAuditReset}>
                        Reset
                      </button>
                    </div>
                  </div>

                  {auditError && <div className="platform-message error">{auditError}</div>}

                  {auditLoading ? (
                    <p className="platform-muted">Loading audit entries...</p>
                  ) : auditLogs.length === 0 ? (
                    <p className="platform-muted">No audit entries match your filters.</p>
                  ) : (
                    <div className="audit-table">
                      <div className="audit-table-head">
                        <span>Time</span>
                        <span>Method</span>
                        <span>Path</span>
                        <span>Status</span>
                        <span>Duration</span>
                        <span>User</span>
                      </div>
                      {auditLogs.map((log) => (
                        <button
                          type="button"
                          key={log.id}
                          className={`audit-table-row ${selectedAudit?.id === log.id ? 'active' : ''}`}
                          onClick={() => setSelectedAudit(log)}
                        >
                          <span>{new Date(log.loggedAt).toLocaleString()}</span>
                          <span>{log.requestMethod ?? '-'}</span>
                          <span className="audit-path">{log.requestPath ?? '-'}</span>
                          <span>{log.statusCode ?? '-'}</span>
                          <span>{log.elapsedMs ? `${log.elapsedMs} ms` : '-'}</span>
                          <span>{log.userEmail ?? 'N/A'}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {auditMeta && auditMeta.totalPages > 1 && (
                    <div className="audit-pagination">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => handleAuditPageChange(Math.max(1, auditPage - 1))}
                        disabled={auditPage <= 1 || auditLoading}
                      >
                        Previous
                      </button>
                      <span>
                        Page {auditMeta.page} of {auditMeta.totalPages} ({auditMeta.totalCount} entries)
                      </span>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() =>
                          handleAuditPageChange(Math.min(auditMeta.totalPages, auditPage + 1))
                        }
                        disabled={auditPage >= auditMeta.totalPages || auditLoading}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                <div className="platform-card audit-detail">
                  <h2>Audit details</h2>
                  {!selectedAudit ? (
                    <p className="platform-muted">Select an entry to inspect headers and payloads.</p>
                  ) : (
                    <div className="audit-detail-body">
                      <div className="audit-detail-meta">
                        <div>
                          <strong>Request</strong>
                          <p>
                            {selectedAudit.requestMethod} {selectedAudit.requestPath}
                          </p>
                          <small>{selectedAudit.queryString}</small>
                        </div>
                        <div>
                          <strong>Status</strong>
                          <p>{selectedAudit.statusCode ?? '-'}</p>
                          <small>{selectedAudit.elapsedMs ? `${selectedAudit.elapsedMs} ms` : ''}</small>
                        </div>
                        <div>
                          <strong>User</strong>
                          <p>{selectedAudit.userEmail ?? 'Anonymous'}</p>
                          <small>{selectedAudit.userId ?? ''}</small>
                        </div>
                        <div>
                          <strong>Client</strong>
                          <p>{selectedAudit.clientIp ?? '-'}</p>
                          <small>{selectedAudit.userAgent ?? ''}</small>
                        </div>
                      </div>

                      {selectedAudit.exception && (
                        <div className="audit-block">
                          <strong>Exception</strong>
                          <pre>{selectedAudit.exception}</pre>
                        </div>
                      )}

                      <div className="audit-block">
                        <strong>Request headers</strong>
                        <pre>{formatJson(selectedAudit.requestHeaders)}</pre>
                      </div>
                      <div className="audit-block">
                        <strong>Request body</strong>
                        <pre>{formatJson(selectedAudit.requestBody)}</pre>
                      </div>
                      <div className="audit-block">
                        <strong>Response headers</strong>
                        <pre>{formatJson(selectedAudit.responseHeaders)}</pre>
                      </div>
                      <div className="audit-block">
                        <strong>Response body</strong>
                        <pre>{formatJson(selectedAudit.responseBody)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
