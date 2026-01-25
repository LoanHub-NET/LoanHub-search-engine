import { useMemo, useState } from "react";

const steps = [
  {
    title: "Start anonimowo",
    description:
      "Podaj tylko kwotę i okres. W 15 sekund pokażemy oferty z trzech źródeł API."
  },
  {
    title: "Doprecyzuj dane",
    description:
      "Po wyborze oferty uzupełnij dochód, koszty i liczbę osób na utrzymaniu."
  },
  {
    title: "Wybierz ścieżkę",
    description:
      "Zaloguj się, zarejestruj lub kontynuuj bez konta — potrzebny jest tylko email."
  },
  {
    title: "Potwierdź i podpisz",
    description:
      "Po akceptacji otrzymasz dokumenty do podpisu i link do kontynuacji."
  }
];

const statusItems = [
  "Nowe",
  "Wstępnie zaakceptowane",
  "Zaakceptowane",
  "Przyznane"
];

const emptyRequest = { loading: false, data: null, error: null };

const normalizeNumber = (value) => {
  if (typeof value !== "string") return value;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  return normalized.length ? Number(normalized) : 0;
};

const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

function App() {
  const defaultBaseUrl =
    import.meta.env.VITE_API_BASE_URL ||
    (window.location.origin.includes("localhost") ? "http://localhost:5000" : "");
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultBaseUrl);
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [requests, setRequests] = useState({});
  const [responses, setResponses] = useState({});

  const [quickForm, setQuickForm] = useState({ amount: "", duration: "" });
  const [detailedForm, setDetailedForm] = useState({
    amount: "",
    duration: "",
    income: "",
    livingCosts: "",
    dependents: ""
  });
  const [searchContext, setSearchContext] = useState({ amount: 0, duration: 0 });
  const [inquiryId, setInquiryId] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    jobTitle: "",
    address: "",
    idDocumentNumber: ""
  });
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [externalAuthForm, setExternalAuthForm] = useState({
    provider: "",
    subject: "",
    email: ""
  });
  const [userTargetId, setUserTargetId] = useState("");

  const [selectionForm, setSelectionForm] = useState({
    inquiryId: "",
    provider: "",
    providerOfferId: "",
    installment: "",
    apr: "",
    totalCost: "",
    amount: "",
    durationMonths: ""
  });
  const [selectionLookupId, setSelectionLookupId] = useState("");
  const [recalculateForm, setRecalculateForm] = useState({
    income: "",
    livingCosts: "",
    dependents: ""
  });

  const [applicationForm, setApplicationForm] = useState({
    applicantEmail: "",
    firstName: "",
    lastName: "",
    age: "",
    jobTitle: "",
    address: "",
    idDocumentNumber: "",
    provider: "",
    providerOfferId: "",
    installment: "",
    apr: "",
    totalCost: "",
    amount: "",
    durationMonths: ""
  });
  const [applicationLookupId, setApplicationLookupId] = useState("");
  const [applicationListForm, setApplicationListForm] = useState({
    applicantEmail: "",
    status: "",
    days: "10"
  });

  const [adminLookupId, setAdminLookupId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const activeRequests = useMemo(() => requests, [requests]);

  const updateRequest = (key, patch) => {
    setRequests((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? emptyRequest), ...patch }
    }));
  };

  const runRequest = async (key, callback) => {
    updateRequest(key, { loading: true, error: null });
    try {
      const data = await callback();
      setResponses((prev) => ({ ...prev, [key]: data }));
      updateRequest(key, { loading: false, data, error: null });
      return data;
    } catch (error) {
      updateRequest(key, {
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };

  const callApi = async ({ path, method = "GET", body, withAuth = false }) => {
    const base =
      apiBaseUrl && apiBaseUrl.endsWith("/")
        ? apiBaseUrl.slice(0, -1)
        : apiBaseUrl;
    const headers = { "Content-Type": "application/json" };
    if (withAuth && token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const payload = await parseResponse(response);
    if (!response.ok) {
      const message =
        typeof payload === "string"
          ? payload
          : payload?.message ?? JSON.stringify(payload);
      throw new Error(message || response.statusText);
    }

    return payload;
  };

  const handleQuickSearch = () =>
    runRequest("quickSearch", async () => {
      const amount = normalizeNumber(quickForm.amount);
      const durationMonths = Number(quickForm.duration);
      const data = await callApi({
        path: "/api/search/quick",
        method: "POST",
        body: { amount, durationMonths }
      });
      setSearchContext({ amount, duration: durationMonths });
      if (data?.inquiryId) {
        setInquiryId(data.inquiryId);
        setSelectionForm((prev) => ({ ...prev, inquiryId: data.inquiryId }));
      }
      return data;
    });

  const handleDetailedSearch = () =>
    runRequest("detailedSearch", async () => {
      const payload = {
        amount: normalizeNumber(detailedForm.amount),
        durationMonths: Number(detailedForm.duration),
        income: normalizeNumber(detailedForm.income),
        livingCosts: normalizeNumber(detailedForm.livingCosts),
        dependents: Number(detailedForm.dependents)
      };
      const data = await callApi({
        path: "/api/search/detailed",
        method: "POST",
        body: payload
      });
      setSearchContext({ amount: payload.amount, duration: payload.durationMonths });
      if (data?.inquiryId) {
        setInquiryId(data.inquiryId);
        setSelectionForm((prev) => ({ ...prev, inquiryId: data.inquiryId }));
      }
      return data;
    });

  const handleSelectOffer = (offer) => {
    setSelectedOffer(offer);
    setSelectionForm((prev) => ({
      ...prev,
      provider: offer.provider ?? offer.Provider,
      providerOfferId: offer.providerOfferId ?? offer.ProviderOfferId,
      installment: String(offer.installment ?? offer.Installment),
      apr: String(offer.apr ?? offer.Apr),
      totalCost: String(offer.totalCost ?? offer.TotalCost),
      amount: String(searchContext.amount || prev.amount),
      durationMonths: String(searchContext.duration || prev.durationMonths)
    }));
    setApplicationForm((prev) => ({
      ...prev,
      provider: offer.provider ?? offer.Provider,
      providerOfferId: offer.providerOfferId ?? offer.ProviderOfferId,
      installment: String(offer.installment ?? offer.Installment),
      apr: String(offer.apr ?? offer.Apr),
      totalCost: String(offer.totalCost ?? offer.TotalCost),
      amount: String(searchContext.amount || prev.amount),
      durationMonths: String(searchContext.duration || prev.durationMonths)
    }));
  };

  const handleRegister = () =>
    runRequest("register", async () => {
      const data = await callApi({
        path: "/api/users/register",
        method: "POST",
        body: {
          email: authForm.email,
          password: authForm.password,
          profile: {
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            age: Number(profileForm.age),
            jobTitle: profileForm.jobTitle,
            address: profileForm.address,
            idDocumentNumber: profileForm.idDocumentNumber
          }
        }
      });
      setToken(data.token ?? "");
      setCurrentUser(data);
      return data;
    });

  const handleLogin = () =>
    runRequest("login", async () => {
      const data = await callApi({
        path: "/api/users/login",
        method: "POST",
        body: {
          email: authForm.email,
          password: authForm.password
        }
      });
      setToken(data.token ?? "");
      setCurrentUser(data);
      return data;
    });

  const handleExternalRegister = () =>
    runRequest("externalRegister", async () => {
      const data = await callApi({
        path: "/api/users/external/register",
        method: "POST",
        body: {
          provider: externalAuthForm.provider,
          subject: externalAuthForm.subject,
          email: externalAuthForm.email,
          profile: {
            firstName: profileForm.firstName,
            lastName: profileForm.lastName,
            age: Number(profileForm.age),
            jobTitle: profileForm.jobTitle,
            address: profileForm.address,
            idDocumentNumber: profileForm.idDocumentNumber
          }
        }
      });
      setToken(data.token ?? "");
      setCurrentUser(data);
      return data;
    });

  const handleExternalLogin = () =>
    runRequest("externalLogin", async () => {
      const data = await callApi({
        path: "/api/users/external/login",
        method: "POST",
        body: {
          provider: externalAuthForm.provider,
          subject: externalAuthForm.subject
        }
      });
      setToken(data.token ?? "");
      setCurrentUser(data);
      return data;
    });

  const handleUserGet = () =>
    runRequest("userGet", () =>
      callApi({
        path: `/api/users/${userTargetId}`,
        method: "GET",
        withAuth: true
      })
    );

  const handleUserUpdate = () =>
    runRequest("userUpdate", async () => {
      const data = await callApi({
        path: `/api/users/${userTargetId}`,
        method: "PUT",
        withAuth: true,
        body: {
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          age: Number(profileForm.age),
          jobTitle: profileForm.jobTitle,
          address: profileForm.address,
          idDocumentNumber: profileForm.idDocumentNumber
        }
      });
      setCurrentUser(data);
      return data;
    });

  const handleCreateSelection = () =>
    runRequest("selectionCreate", () =>
      callApi({
        path: "/api/offer-selections",
        method: "POST",
        body: {
          inquiryId: selectionForm.inquiryId,
          provider: selectionForm.provider,
          providerOfferId: selectionForm.providerOfferId,
          installment: normalizeNumber(selectionForm.installment),
          apr: normalizeNumber(selectionForm.apr),
          totalCost: normalizeNumber(selectionForm.totalCost),
          amount: normalizeNumber(selectionForm.amount),
          durationMonths: Number(selectionForm.durationMonths)
        }
      })
    );

  const handleGetSelection = () =>
    runRequest("selectionGet", () =>
      callApi({
        path: `/api/offer-selections/${selectionLookupId}`,
        method: "GET"
      })
    );

  const handleRecalculateSelection = () =>
    runRequest("selectionRecalculate", () =>
      callApi({
        path: `/api/offer-selections/${selectionLookupId}/recalculate`,
        method: "POST",
        body: {
          income: normalizeNumber(recalculateForm.income),
          livingCosts: normalizeNumber(recalculateForm.livingCosts),
          dependents: Number(recalculateForm.dependents)
        }
      })
    );

  const handleCreateApplication = () =>
    runRequest("applicationCreate", () =>
      callApi({
        path: "/api/applications",
        method: "POST",
        body: {
          applicantEmail: applicationForm.applicantEmail,
          firstName: applicationForm.firstName,
          lastName: applicationForm.lastName,
          age: Number(applicationForm.age),
          jobTitle: applicationForm.jobTitle,
          address: applicationForm.address,
          idDocumentNumber: applicationForm.idDocumentNumber,
          provider: applicationForm.provider,
          providerOfferId: applicationForm.providerOfferId,
          installment: normalizeNumber(applicationForm.installment),
          apr: normalizeNumber(applicationForm.apr),
          totalCost: normalizeNumber(applicationForm.totalCost),
          amount: normalizeNumber(applicationForm.amount),
          durationMonths: Number(applicationForm.durationMonths)
        }
      })
    );

  const handleGetApplication = () =>
    runRequest("applicationGet", () =>
      callApi({
        path: `/api/applications/${applicationLookupId}`,
        method: "GET"
      })
    );

  const handleListApplications = () =>
    runRequest("applicationList", () =>
      callApi({
        path: `/api/applications?applicantEmail=${encodeURIComponent(
          applicationListForm.applicantEmail
        )}&status=${encodeURIComponent(
          applicationListForm.status
        )}&days=${encodeURIComponent(applicationListForm.days)}`,
        method: "GET"
      })
    );

  const handleCancelApplication = () =>
    runRequest("applicationCancel", () =>
      callApi({
        path: `/api/applications/${applicationLookupId}/cancel`,
        method: "POST"
      })
    );

  const handleAdminList = () =>
    runRequest("adminList", () =>
      callApi({
        path: "/api/admin/applications",
        method: "GET",
        withAuth: true
      })
    );

  const handleAdminGet = () =>
    runRequest("adminGet", () =>
      callApi({
        path: `/api/admin/applications/${adminLookupId}`,
        method: "GET",
        withAuth: true
      })
    );

  const handleAdminAccept = () =>
    runRequest("adminAccept", () =>
      callApi({
        path: `/api/admin/applications/${adminLookupId}/accept`,
        method: "POST",
        withAuth: true
      })
    );

  const handleAdminPreliminaryAccept = () =>
    runRequest("adminPreliminaryAccept", () =>
      callApi({
        path: `/api/admin/applications/${adminLookupId}/preliminary-accept`,
        method: "POST",
        withAuth: true
      })
    );

  const handleAdminGrant = () =>
    runRequest("adminGrant", () =>
      callApi({
        path: `/api/admin/applications/${adminLookupId}/grant`,
        method: "POST",
        withAuth: true
      })
    );

  const handleAdminReject = () =>
    runRequest("adminReject", () =>
      callApi({
        path: `/api/admin/applications/${adminLookupId}/reject`,
        method: "POST",
        withAuth: true,
        body: { reason: rejectReason }
      })
    );

  const renderResponse = (key, emptyMessage) => {
    const req = activeRequests[key] ?? emptyRequest;
    if (req.loading) {
      return <p className="helper">Ładowanie danych...</p>;
    }
    if (req.error) {
      return <p className="error">Błąd: {req.error}</p>;
    }
    if (req.data) {
      return <pre>{JSON.stringify(req.data, null, 2)}</pre>;
    }
    if (responses[key]) {
      return <pre>{JSON.stringify(responses[key], null, 2)}</pre>;
    }
    return <p className="helper">{emptyMessage}</p>;
  };

  const offersFromSearch =
    responses.quickSearch?.offers ?? responses.detailedSearch?.offers ?? [];

  return (
    <div className="page">
      <header className="topbar">
        <div className="logo">LoanHub</div>
        <nav className="nav">
          <a href="#how" className="nav-link">
            Jak to działa
          </a>
          <a href="#search" className="nav-link">
            Wyszukiwarka
          </a>
          <a href="#auth" className="nav-link">
            Logowanie
          </a>
          <a href="#applications" className="nav-link">
            Wnioski
          </a>
          <a href="#admin" className="nav-link">
            Admin
          </a>
        </nav>
      </header>
      <div className="api-config">
        <div>
          <strong>Adres API</strong>
          <p className="helper">
            Jeśli widzisz „Failed to fetch”, upewnij się, że backend działa oraz
            wpisz poprawny adres (np. http://localhost:5000).
          </p>
        </div>
        <input
          type="text"
          value={apiBaseUrl}
          onChange={(event) => setApiBaseUrl(event.target.value)}
          placeholder="http://localhost:5000"
        />
      </div>

      <main>
        <section className="hero" id="top">
          <div className="hero-content">
            <p className="eyebrow">Wyszukiwarka ofert kredytowych</p>
            <h1>Obsłuż każdy etap zapytania z jednego panelu.</h1>
            <p className="lead">
              Ten frontend jest spięty z endpointami backendu: wyszukiwanie,
              wybór oferty, wnioski oraz panel administratora. Wszystko jest
              klikalne i zwraca realne odpowiedzi API.
            </p>
            <div className="hero-actions">
              <a href="#search" className="primary-button">
                Rozpocznij wyszukiwanie
              </a>
              <a href="#auth" className="secondary-button">
                Zaloguj się lub zarejestruj
              </a>
            </div>
            <div className="counter">
              <span className="counter-value">12 438</span>
              <span className="counter-label">
                osób znalazło najlepszy kredyt w LoanHub
              </span>
            </div>
          </div>
          <div className="hero-card" id="search">
            <h2>Szybkie wyszukiwanie (anonimowo)</h2>
            <p>Wprowadź tylko kwotę i okres kredytu.</p>
            <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
              <label className="field">
                <span>Kwota (PLN)</span>
                <input
                  type="text"
                  placeholder="np. 25 000"
                  value={quickForm.amount}
                  onChange={(event) =>
                    setQuickForm((prev) => ({
                      ...prev,
                      amount: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Okres (miesiące)</span>
                <input
                  type="text"
                  placeholder="np. 36"
                  value={quickForm.duration}
                  onChange={(event) =>
                    setQuickForm((prev) => ({
                      ...prev,
                      duration: event.target.value
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="primary-button"
                onClick={handleQuickSearch}
              >
                Pokaż oferty (POST /api/search/quick)
              </button>
            </form>
            <div className="response-card">
              <h4>Odpowiedź API</h4>
              {renderResponse(
                "quickSearch",
                "Wprowadź dane i wyślij zapytanie, aby zobaczyć wynik."
              )}
            </div>
            <p className="helper">
              Wyniki pojawią się do 15 sekund, nawet jeśli odpowiedzi z API będą
              przychodzić w różnym czasie.
            </p>
          </div>
        </section>

        <section id="how" className="section">
          <div className="section-heading">
            <h2>Jak to działa</h2>
            <p>
              Po krótkim zapytaniu zbieramy oferty z co najmniej trzech firm.
              Każdy etap jest przejrzysty i kontrolowany przez Ciebie.
            </p>
          </div>
          <div className="steps">
            {steps.map((step) => (
              <article key={step.title} className="step-card">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section split">
          <div>
            <h2>Rozszerzona wyszukiwarka</h2>
            <p>
              Jeśli chcesz od razu pokazać pełny profil finansowy, uzupełnij
              dodatkowe informacje. Uzyskasz dokładniejszą ratę i RRSO.
            </p>
            <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
              <label className="field">
                <span>Kwota (PLN)</span>
                <input
                  type="text"
                  placeholder="np. 25 000"
                  value={detailedForm.amount}
                  onChange={(event) =>
                    setDetailedForm((prev) => ({
                      ...prev,
                      amount: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Okres (miesiące)</span>
                <input
                  type="text"
                  placeholder="np. 36"
                  value={detailedForm.duration}
                  onChange={(event) =>
                    setDetailedForm((prev) => ({
                      ...prev,
                      duration: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Dochód netto</span>
                <input
                  type="text"
                  placeholder="np. 6 500 PLN"
                  value={detailedForm.income}
                  onChange={(event) =>
                    setDetailedForm((prev) => ({
                      ...prev,
                      income: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Koszty życia</span>
                <input
                  type="text"
                  placeholder="np. 2 100 PLN"
                  value={detailedForm.livingCosts}
                  onChange={(event) =>
                    setDetailedForm((prev) => ({
                      ...prev,
                      livingCosts: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Liczba osób na utrzymaniu</span>
                <input
                  type="text"
                  placeholder="np. 2"
                  value={detailedForm.dependents}
                  onChange={(event) =>
                    setDetailedForm((prev) => ({
                      ...prev,
                      dependents: event.target.value
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="secondary-button"
                onClick={handleDetailedSearch}
              >
                Oblicz ratę (POST /api/search/detailed)
              </button>
            </form>
            <div className="response-card">
              <h4>Odpowiedź API</h4>
              {renderResponse(
                "detailedSearch",
                "Uzupełnij dane i wyślij zapytanie, aby zobaczyć wynik."
              )}
            </div>
          </div>
          <div className="offers">
            <h3>Oferty z wyszukiwarki</h3>
            <div className="offer-list">
              {offersFromSearch.length ? (
                offersFromSearch.map((offer) => (
                  <div key={offer.provider ?? offer.Provider} className="offer-card">
                    <div>
                      <h4>{offer.provider ?? offer.Provider}</h4>
                      <p>ID oferty: {offer.providerOfferId ?? offer.ProviderOfferId}</p>
                      <p>RRSO: {offer.apr ?? offer.Apr}%</p>
                      <p>Koszt całkowity: {offer.totalCost ?? offer.TotalCost} PLN</p>
                    </div>
                    <div className="offer-rate">
                      <span>{offer.installment ?? offer.Installment} PLN / mies.</span>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => handleSelectOffer(offer)}
                      >
                        Wybierz (POST /api/offer-selections)
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="helper">
                  Po wyszukiwaniu szybkim lub szczegółowym pojawią się tutaj oferty.
                </p>
              )}
            </div>
            <p className="helper">
              Wybór oferty automatycznie wypełni formularze wyboru i wniosku.
            </p>
          </div>
        </section>

        <section id="auth" className="section">
          <div className="section-heading">
            <h2>Logowanie i profil użytkownika</h2>
            <p>
              Endpointy /api/users pozwalają zakładać konto, logować się oraz
              aktualizować profil. Token JWT przechowujemy lokalnie w tym widoku.
            </p>
          </div>
          <div className="panel-grid">
            <div className="panel">
              <h3>Dane profilu</h3>
              <div className="form-grid">
                <label className="field">
                  <span>Imię</span>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        firstName: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Nazwisko</span>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        lastName: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Wiek</span>
                  <input
                    type="text"
                    value={profileForm.age}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        age: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Stanowisko</span>
                  <input
                    type="text"
                    value={profileForm.jobTitle}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        jobTitle: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Adres</span>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        address: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Dokument</span>
                  <input
                    type="text"
                    value={profileForm.idDocumentNumber}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        idDocumentNumber: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
            </div>
            <div className="panel">
              <h3>Rejestracja / logowanie lokalne</h3>
              <div className="form-grid">
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={authForm.email}
                    onChange={(event) =>
                      setAuthForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Hasło</span>
                  <input
                    type="password"
                    value={authForm.password}
                    onChange={(event) =>
                      setAuthForm((prev) => ({
                        ...prev,
                        password: event.target.value
                      }))
                    }
                  />
                </label>
                <div className="inline-actions">
                  <button className="primary-button" type="button" onClick={handleRegister}>
                    Rejestruj (POST /api/users/register)
                  </button>
                  <button className="ghost-button" type="button" onClick={handleLogin}>
                    Zaloguj (POST /api/users/login)
                  </button>
                </div>
                <div className="response-card">
                  <h4>Odpowiedź API</h4>
                  {renderResponse(
                    "register",
                    "Zarejestruj się, aby zobaczyć odpowiedź."
                  )}
                  {renderResponse("login", "Zaloguj się, aby zobaczyć odpowiedź.")}
                </div>
              </div>
            </div>
            <div className="panel">
              <h3>Logowanie zewnętrzne</h3>
              <div className="form-grid">
                <label className="field">
                  <span>Dostawca</span>
                  <input
                    type="text"
                    value={externalAuthForm.provider}
                    onChange={(event) =>
                      setExternalAuthForm((prev) => ({
                        ...prev,
                        provider: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Subject</span>
                  <input
                    type="text"
                    value={externalAuthForm.subject}
                    onChange={(event) =>
                      setExternalAuthForm((prev) => ({
                        ...prev,
                        subject: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Email (dla rejestracji)</span>
                  <input
                    type="email"
                    value={externalAuthForm.email}
                    onChange={(event) =>
                      setExternalAuthForm((prev) => ({
                        ...prev,
                        email: event.target.value
                      }))
                    }
                  />
                </label>
                <div className="inline-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleExternalRegister}
                  >
                    Rejestruj (POST /api/users/external/register)
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleExternalLogin}
                  >
                    Zaloguj (POST /api/users/external/login)
                  </button>
                </div>
                <div className="response-card">
                  <h4>Odpowiedź API</h4>
                  {renderResponse(
                    "externalRegister",
                    "Uzupełnij dane i zarejestruj zewnętrznie."
                  )}
                  {renderResponse(
                    "externalLogin",
                    "Zaloguj zewnętrznie, aby zobaczyć odpowiedź."
                  )}
                </div>
              </div>
            </div>
            <div className="panel">
              <h3>Token i profil</h3>
              <div className="form-grid">
                <label className="field">
                  <span>JWT token (zapisany lokalnie)</span>
                  <input
                    type="text"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>ID użytkownika</span>
                  <input
                    type="text"
                    value={userTargetId}
                    onChange={(event) => setUserTargetId(event.target.value)}
                  />
                </label>
                <div className="inline-actions">
                  <button className="secondary-button" type="button" onClick={handleUserGet}>
                    Pobierz (GET /api/users/:id)
                  </button>
                  <button className="ghost-button" type="button" onClick={handleUserUpdate}>
                    Aktualizuj profil (PUT /api/users/:id)
                  </button>
                </div>
                <div className="response-card">
                  <h4>Odpowiedź API</h4>
                  {renderResponse("userGet", "Podaj ID, aby pobrać profil.")}
                  {renderResponse("userUpdate", "Aktualizuj profil, aby zobaczyć wynik.")}
                </div>
                {currentUser && (
                  <div className="token-box">
                    <strong>Aktywny użytkownik:</strong>
                    <span>{currentUser.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="offers" className="section">
          <div className="section-heading">
            <h2>Wybór oferty i rekalkulacja</h2>
            <p>
              Endpointy /api/offer-selections obsługują wybór oferty oraz
              rekalkulację na podstawie dochodu i kosztów życia.
            </p>
          </div>
          <div className="panel-grid">
            <div className="panel">
              <h3>Utwórz wybór oferty</h3>
              <div className="form-grid">
                <label className="field">
                  <span>ID zapytania (InquiryId)</span>
                  <input
                    type="text"
                    value={selectionForm.inquiryId}
                    onChange={(event) =>
                      setSelectionForm((prev) => ({
                        ...prev,
                        inquiryId: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Provider</span>
                  <input
                    type="text"
                    value={selectionForm.provider}
                    onChange={(event) =>
                      setSelectionForm((prev) => ({
                        ...prev,
                        provider: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>ID oferty</span>
                  <input
                    type="text"
                    value={selectionForm.providerOfferId}
                    onChange={(event) =>
                      setSelectionForm((prev) => ({
                        ...prev,
                        providerOfferId: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Rata</span>
                  <input
                    type="text"
                    value={selectionForm.installment}
                    onChange={(event) =>
                      setSelectionForm((prev) => ({
                        ...prev,
                        installment: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>RRSO</span>
                  <input
                    type="text"
                    value={selectionForm.apr}
                    onChange={(event) =>
                      setSelectionForm((prev) => ({
                        ...prev,
                        apr: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Koszt całkowity</span>
                  <input
                    type="text"
                    value={selectionForm.totalCost}
                    onChange={(event) =>
                      setSelectionForm((prev) => ({
                        ...prev,
                        totalCost: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Kwota</span>
                  <input
                    type="text"
                    value={selectionForm.amount}
                    onChange={(event) =>
                      setSelectionForm((prev) => ({
                        ...prev,
                        amount: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Okres (miesiące)</span>
                  <input
                    type="text"
                    value={selectionForm.durationMonths}
                    onChange={(event) =>
                      setSelectionForm((prev) => ({
                        ...prev,
                        durationMonths: event.target.value
                      }))
                    }
                  />
                </label>
                {selectedOffer && (
                  <div className="hint-box">
                    Wybrano ofertę: {selectedOffer.provider ?? selectedOffer.Provider}
                  </div>
                )}
                <button className="primary-button" type="button" onClick={handleCreateSelection}>
                  Utwórz wybór (POST /api/offer-selections)
                </button>
                <div className="response-card">
                  <h4>Odpowiedź API</h4>
                  {renderResponse(
                    "selectionCreate",
                    "Wybierz ofertę lub uzupełnij formularz, aby zapisać wybór."
                  )}
                </div>
              </div>
            </div>
            <div className="panel">
              <h3>Pobierz / przelicz wybór</h3>
              <div className="form-grid">
                <label className="field">
                  <span>ID wyboru</span>
                  <input
                    type="text"
                    value={selectionLookupId}
                    onChange={(event) => setSelectionLookupId(event.target.value)}
                  />
                </label>
                <div className="inline-actions">
                  <button className="secondary-button" type="button" onClick={handleGetSelection}>
                    Pobierz (GET /api/offer-selections/:id)
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleRecalculateSelection}
                  >
                    Rekalkuluj (POST /api/offer-selections/:id/recalculate)
                  </button>
                </div>
                <label className="field">
                  <span>Dochód</span>
                  <input
                    type="text"
                    value={recalculateForm.income}
                    onChange={(event) =>
                      setRecalculateForm((prev) => ({
                        ...prev,
                        income: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Koszty życia</span>
                  <input
                    type="text"
                    value={recalculateForm.livingCosts}
                    onChange={(event) =>
                      setRecalculateForm((prev) => ({
                        ...prev,
                        livingCosts: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Liczba osób</span>
                  <input
                    type="text"
                    value={recalculateForm.dependents}
                    onChange={(event) =>
                      setRecalculateForm((prev) => ({
                        ...prev,
                        dependents: event.target.value
                      }))
                    }
                  />
                </label>
                <div className="response-card">
                  <h4>Odpowiedź API</h4>
                  {renderResponse(
                    "selectionGet",
                    "Podaj ID, aby pobrać wybór oferty."
                  )}
                  {renderResponse(
                    "selectionRecalculate",
                    "Uzupełnij dane i rekalkuluj, aby zobaczyć wynik."
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="applications" className="section">
          <div className="section-heading">
            <h2>Panel klienta i statusy wniosków</h2>
            <p>
              Zalogowani użytkownicy mogą wracać do zapytań z ostatnich 10 dni i
              filtrować je po statusie.
            </p>
          </div>
          <div className="status-grid">
            {statusItems.map((status) => (
              <div key={status} className="status-card">
                <span>{status}</span>
              </div>
            ))}
          </div>
          <div className="panel-grid">
            <div className="panel">
              <h3>Utwórz wniosek</h3>
              <div className="form-grid">
                <label className="field">
                  <span>Email klienta</span>
                  <input
                    type="email"
                    value={applicationForm.applicantEmail}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        applicantEmail: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Imię</span>
                  <input
                    type="text"
                    value={applicationForm.firstName}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        firstName: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Nazwisko</span>
                  <input
                    type="text"
                    value={applicationForm.lastName}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        lastName: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Wiek</span>
                  <input
                    type="text"
                    value={applicationForm.age}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        age: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Stanowisko</span>
                  <input
                    type="text"
                    value={applicationForm.jobTitle}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        jobTitle: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Adres</span>
                  <input
                    type="text"
                    value={applicationForm.address}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        address: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Numer dokumentu</span>
                  <input
                    type="text"
                    value={applicationForm.idDocumentNumber}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        idDocumentNumber: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Provider</span>
                  <input
                    type="text"
                    value={applicationForm.provider}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        provider: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>ID oferty</span>
                  <input
                    type="text"
                    value={applicationForm.providerOfferId}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        providerOfferId: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Rata</span>
                  <input
                    type="text"
                    value={applicationForm.installment}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        installment: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>RRSO</span>
                  <input
                    type="text"
                    value={applicationForm.apr}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        apr: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Koszt całkowity</span>
                  <input
                    type="text"
                    value={applicationForm.totalCost}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        totalCost: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Kwota</span>
                  <input
                    type="text"
                    value={applicationForm.amount}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        amount: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Okres (miesiące)</span>
                  <input
                    type="text"
                    value={applicationForm.durationMonths}
                    onChange={(event) =>
                      setApplicationForm((prev) => ({
                        ...prev,
                        durationMonths: event.target.value
                      }))
                    }
                  />
                </label>
                <button className="primary-button" type="button" onClick={handleCreateApplication}>
                  Utwórz wniosek (POST /api/applications)
                </button>
                <div className="response-card">
                  <h4>Odpowiedź API</h4>
                  {renderResponse(
                    "applicationCreate",
                    "Uzupełnij formularz, aby utworzyć wniosek."
                  )}
                </div>
              </div>
            </div>
            <div className="panel">
              <h3>Lista i status wniosku</h3>
              <div className="form-grid">
                <label className="field">
                  <span>Email klienta</span>
                  <input
                    type="email"
                    value={applicationListForm.applicantEmail}
                    onChange={(event) =>
                      setApplicationListForm((prev) => ({
                        ...prev,
                        applicantEmail: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Status (opcjonalnie)</span>
                  <input
                    type="text"
                    value={applicationListForm.status}
                    onChange={(event) =>
                      setApplicationListForm((prev) => ({
                        ...prev,
                        status: event.target.value
                      }))
                    }
                  />
                </label>
                <label className="field">
                  <span>Ilość dni (domyślnie 10)</span>
                  <input
                    type="text"
                    value={applicationListForm.days}
                    onChange={(event) =>
                      setApplicationListForm((prev) => ({
                        ...prev,
                        days: event.target.value
                      }))
                    }
                  />
                </label>
                <button className="secondary-button" type="button" onClick={handleListApplications}>
                  Lista wniosków (GET /api/applications)
                </button>
                <label className="field">
                  <span>ID wniosku</span>
                  <input
                    type="text"
                    value={applicationLookupId}
                    onChange={(event) => setApplicationLookupId(event.target.value)}
                  />
                </label>
                <div className="inline-actions">
                  <button className="ghost-button" type="button" onClick={handleGetApplication}>
                    Pobierz (GET /api/applications/:id)
                  </button>
                  <button className="ghost-button" type="button" onClick={handleCancelApplication}>
                    Anuluj (POST /api/applications/:id/cancel)
                  </button>
                </div>
                <div className="response-card">
                  <h4>Odpowiedź API</h4>
                  {renderResponse(
                    "applicationList",
                    "Podaj email, aby pobrać listę wniosków."
                  )}
                  {renderResponse(
                    "applicationGet",
                    "Podaj ID, aby pobrać szczegóły wniosku."
                  )}
                  {renderResponse(
                    "applicationCancel",
                    "Anuluj wniosek, aby zobaczyć wynik."
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="admin" className="section">
          <div className="section-heading">
            <h2>Panel pracownika banku</h2>
            <p>
              Endpointy administracyjne wymagają roli Admin i tokenu JWT. Możesz
              przeglądać wszystkie wnioski oraz zmieniać ich status.
            </p>
          </div>
          <div className="panel-grid">
            <div className="panel admin-panel">
              <h3>Akcje administratora</h3>
              <div className="form-grid">
                <button className="primary-button" type="button" onClick={handleAdminList}>
                  Lista wniosków (GET /api/admin/applications)
                </button>
                <label className="field">
                  <span>ID wniosku</span>
                  <input
                    type="text"
                    value={adminLookupId}
                    onChange={(event) => setAdminLookupId(event.target.value)}
                  />
                </label>
                <div className="inline-actions">
                  <button className="secondary-button" type="button" onClick={handleAdminGet}>
                    Pobierz (GET /api/admin/applications/:id)
                  </button>
                  <button className="ghost-button" type="button" onClick={handleAdminAccept}>
                    Akceptuj
                  </button>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleAdminPreliminaryAccept}
                  >
                    Wstępnie zaakceptuj
                  </button>
                  <button className="ghost-button" type="button" onClick={handleAdminGrant}>
                    Przyznaj
                  </button>
                </div>
                <label className="field">
                  <span>Powód odrzucenia</span>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                  />
                </label>
                <button className="ghost-button" type="button" onClick={handleAdminReject}>
                  Odrzuć (POST /api/admin/applications/:id/reject)
                </button>
                <div className="response-card">
                  <h4>Odpowiedź API</h4>
                  {renderResponse(
                    "adminList",
                    "Kliknij, aby pobrać listę wszystkich wniosków."
                  )}
                  {renderResponse(
                    "adminGet",
                    "Podaj ID, aby pobrać szczegóły wniosku."
                  )}
                  {renderResponse(
                    "adminAccept",
                    "Akceptuj wniosek, aby zobaczyć wynik."
                  )}
                  {renderResponse(
                    "adminPreliminaryAccept",
                    "Wstępnie zaakceptuj wniosek, aby zobaczyć wynik."
                  )}
                  {renderResponse(
                    "adminGrant",
                    "Przyznaj wniosek, aby zobaczyć wynik."
                  )}
                  {renderResponse(
                    "adminReject",
                    "Odrzuć wniosek, aby zobaczyć wynik."
                  )}
                </div>
              </div>
            </div>
            <div className="panel admin-info">
              <h3>Wskazówki</h3>
              <ul>
                <li>Wklej token JWT z sekcji logowania, aby uruchomić akcje admina.</li>
                <li>Po wyszukiwaniu zapisz InquiryId — przyda się do wyboru oferty.</li>
                <li>Wybór oferty automatycznie uzupełnia wniosek klienta.</li>
              </ul>
              <div className="hint-box">
                Aktywne InquiryId: {inquiryId || "brak"}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <strong>LoanHub</strong>
          <p>Bezpieczna porównywarka kredytów dla Ciebie.</p>
        </div>
        <div className="footer-links">
          <a href="#top">Powrót na górę</a>
          <a href="#search">Wyszukiwarka</a>
          <a href="#auth">Logowanie</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
