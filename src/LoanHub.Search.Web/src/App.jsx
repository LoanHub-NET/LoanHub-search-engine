import { useMemo, useState } from "react";

const quickFields = [
  { id: "amount", label: "Kwota (PLN)", placeholder: "np. 25 000" },
  { id: "durationMonths", label: "Okres (miesiące)", placeholder: "np. 36" }
];

const detailFields = [
  { id: "amount", label: "Kwota (PLN)", placeholder: "np. 25 000" },
  { id: "durationMonths", label: "Okres (miesiące)", placeholder: "np. 36" },
  { id: "income", label: "Dochód netto", placeholder: "np. 6 500" },
  { id: "livingCosts", label: "Koszty życia", placeholder: "np. 2 100" },
  { id: "dependents", label: "Liczba osób na utrzymaniu", placeholder: "np. 2" }
];

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

const toDecimal = (value) => (value === "" ? null : Number.parseFloat(value));
const toInt = (value) => (value === "" ? null : Number.parseInt(value, 10));

const ResponsePanel = ({ response, error, loading }) => {
  if (loading) {
    return <p className="response loading">Wysyłanie zapytania...</p>;
  }

  if (error) {
    return <p className="response error">{error}</p>;
  }

  if (!response) {
    return (
      <p className="response hint">
        Brak odpowiedzi — użyj przycisku, aby wywołać endpoint.
      </p>
    );
  }

  return (
    <pre className="response json">
      {JSON.stringify(response, null, 2)}
    </pre>
  );
};

function App() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:5000");
  const [authToken, setAuthToken] = useState("");
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({});

  const [quickForm, setQuickForm] = useState({
    amount: "",
    durationMonths: ""
  });
  const [detailForm, setDetailForm] = useState({
    amount: "",
    durationMonths: "",
    income: "",
    livingCosts: "",
    dependents: ""
  });
  const [selectionCreateForm, setSelectionCreateForm] = useState({
    inquiryId: "",
    provider: "",
    providerOfferId: "",
    installment: "",
    apr: "",
    totalCost: "",
    amount: "",
    durationMonths: ""
  });
  const [selectionGetForm, setSelectionGetForm] = useState({ id: "" });
  const [selectionRecalcForm, setSelectionRecalcForm] = useState({
    id: "",
    income: "",
    livingCosts: "",
    dependents: ""
  });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    age: "",
    jobTitle: "",
    address: "",
    idDocumentNumber: ""
  });
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [externalRegisterForm, setExternalRegisterForm] = useState({
    provider: "",
    subject: "",
    email: "",
    firstName: "",
    lastName: "",
    age: "",
    jobTitle: "",
    address: "",
    idDocumentNumber: ""
  });
  const [externalLoginForm, setExternalLoginForm] = useState({
    provider: "",
    subject: ""
  });
  const [userGetForm, setUserGetForm] = useState({ id: "" });
  const [userUpdateForm, setUserUpdateForm] = useState({
    id: "",
    firstName: "",
    lastName: "",
    age: "",
    jobTitle: "",
    address: "",
    idDocumentNumber: ""
  });
  const [applicationCreateForm, setApplicationCreateForm] = useState({
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
  const [applicationGetForm, setApplicationGetForm] = useState({ id: "" });
  const [applicationListForm, setApplicationListForm] = useState({
    applicantEmail: "",
    status: "",
    days: "10"
  });
  const [applicationCancelForm, setApplicationCancelForm] = useState({ id: "" });
  const [adminGetForm, setAdminGetForm] = useState({ id: "" });
  const [adminActionForm, setAdminActionForm] = useState({ id: "" });
  const [adminRejectForm, setAdminRejectForm] = useState({
    id: "",
    reason: ""
  });

  const apiBase = useMemo(() => baseUrl.replace(/\/$/, ""), [baseUrl]);

  const handleRequest = async (key, { method, path, body, query }) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: null }));

    try {
      const queryString = query
        ? `?${new URLSearchParams(query).toString()}`
        : "";
      const response = await fetch(`${apiBase}${path}${queryString}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      setResponses((prev) => ({
        ...prev,
        [key]: {
          status: response.status,
          ok: response.ok,
          data
        }
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [key]: error instanceof Error ? error.message : String(error)
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

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
          <a href="#status" className="nav-link">
            Statusy
          </a>
          <a href="#api" className="nav-link">
            Endpointy API
          </a>
          <button className="ghost-button">Zaloguj się</button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">Wyszukiwarka ofert kredytowych</p>
            <h1>Znajdź najlepszą ofertę kredytu w jednym miejscu.</h1>
            <p className="lead">
              LoanHub łączy oferty z wielu instytucji, pokazując je w jednym,
              przejrzystym widoku. Zaczynasz anonimowo, a dopiero po wyborze
              oferty prosimy o szczegóły.
            </p>
            <div className="hero-actions">
              <button className="primary-button">Rozpocznij wyszukiwanie</button>
              <button className="secondary-button">Zobacz panel klienta</button>
            </div>
            <div className="counter">
              <span className="counter-value">12 438</span>
              <span className="counter-label">
                osób znalazło najlepszy kredyt w LoanHub
              </span>
            </div>
          </div>
          <div className="hero-card">
            <h2>Szybkie wyszukiwanie (anonimowo)</h2>
            <p>Wprowadź tylko kwotę i okres kredytu.</p>
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                handleRequest("search-quick", {
                  method: "POST",
                  path: "/api/search/quick",
                  body: {
                    amount: toDecimal(quickForm.amount),
                    durationMonths: toInt(quickForm.durationMonths)
                  }
                });
              }}
            >
              {quickFields.map((field) => (
                <label key={field.id} className="field">
                  <span>{field.label}</span>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={quickForm[field.id]}
                    onChange={(event) =>
                      setQuickForm((prev) => ({
                        ...prev,
                        [field.id]: event.target.value
                      }))
                    }
                  />
                </label>
              ))}
              <button type="submit" className="primary-button">
                Pokaż oferty
              </button>
            </form>
            <ResponsePanel
              response={responses["search-quick"]}
              error={errors["search-quick"]}
              loading={loading["search-quick"]}
            />
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

        <section id="search" className="section split">
          <div>
            <h2>Rozszerzona wyszukiwarka</h2>
            <p>
              Jeśli chcesz od razu pokazać pełny profil finansowy, uzupełnij
              dodatkowe informacje. Uzyskasz dokładniejszą ratę i RRSO.
            </p>
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault();
                handleRequest("search-detailed", {
                  method: "POST",
                  path: "/api/search/detailed",
                  body: {
                    amount: toDecimal(detailForm.amount),
                    durationMonths: toInt(detailForm.durationMonths),
                    income: toDecimal(detailForm.income),
                    livingCosts: toDecimal(detailForm.livingCosts),
                    dependents: toInt(detailForm.dependents)
                  }
                });
              }}
            >
              {detailFields.map((field) => (
                <label key={field.id} className="field">
                  <span>{field.label}</span>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={detailForm[field.id]}
                    onChange={(event) =>
                      setDetailForm((prev) => ({
                        ...prev,
                        [field.id]: event.target.value
                      }))
                    }
                  />
                </label>
              ))}
              <button type="submit" className="secondary-button">
                Oblicz ratę
              </button>
            </form>
            <ResponsePanel
              response={responses["search-detailed"]}
              error={errors["search-detailed"]}
              loading={loading["search-detailed"]}
            />
          </div>
          <div className="offers">
            <h3>Przykładowe oferty</h3>
            <div className="offer-list">
              {(responses["search-detailed"]?.data?.offers ?? []).length === 0 ? (
                <div className="offer-card empty">
                  <div>
                    <h4>Brak wyników</h4>
                    <p>Wypełnij formularz, aby pobrać oferty z API.</p>
                  </div>
                  <span className="badge">API</span>
                </div>
              ) : (
                responses["search-detailed"].data.offers.map((offer) => (
                  <div key={offer.id ?? offer.providerOfferId} className="offer-card">
                    <div>
                      <h4>{offer.provider}</h4>
                      <p>RRSO: {offer.apr}% • Koszt całkowity: {offer.totalCost}</p>
                    </div>
                    <div className="offer-rate">
                      <span>{offer.installment} PLN / mies.</span>
                      <button className="ghost-button" type="button">
                        Wybierz
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="helper">
              Po wyborze oferty poprosimy o dane do kalkulacji dokładnej raty i
              RRSO.
            </p>
          </div>
        </section>

        <section id="status" className="section">
          <div className="section-heading">
            <h2>Panel klienta i statusy</h2>
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
          <div className="split-note">
            <div>
              <h3>Ścieżki dalszej obsługi</h3>
              <ul>
                <li>
                  Zalogowani klienci mają uzupełnione dane osobowe i dokumenty.
                </li>
                <li>
                  Bez konta prosimy o email i wymagane szczegóły, aby kontynuować
                  wniosek.
                </li>
                <li>
                  Po akceptacji banku wysyłamy link do podpisu umowy i śledzenia
                  postępu.
                </li>
              </ul>
            </div>
            <div className="admin-card">
              <h4>Panel pracownika banku</h4>
              <p>
                Pracownik widzi wszystkie zapytania, może akceptować lub
                odrzucać wniosek z podaniem powodu. O każdej decyzji informujemy
                e-mailem.
              </p>
              <button className="primary-button">Przejdź do panelu</button>
            </div>
          </div>
        </section>

        <section id="api" className="section api-section">
          <div className="section-heading">
            <h2>Interaktywne endpointy backendu</h2>
            <p>
              Poniżej znajdują się wszystkie dostępne endpointy API. Każdy
              formularz wysyła realne zapytanie do backendu i pokazuje odpowiedź
              wraz ze statusem HTTP.
            </p>
          </div>

          <div className="api-config">
            <label className="field">
              <span>Bazowy adres API</span>
              <input
                type="text"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="http://localhost:5000"
              />
            </label>
            <label className="field">
              <span>Token JWT (dla endpointów autoryzowanych)</span>
              <input
                type="text"
                value={authToken}
                onChange={(event) => setAuthToken(event.target.value)}
                placeholder="Wklej token JWT"
              />
            </label>
          </div>

          <div className="api-group">
            <h3>Wyszukiwanie ofert</h3>
            <div className="api-grid">
              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Szybkie wyszukiwanie</h4>
                    <p>POST /api/search/quick</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("search-quick-api", {
                      method: "POST",
                      path: "/api/search/quick",
                      body: {
                        amount: toDecimal(quickForm.amount),
                        durationMonths: toInt(quickForm.durationMonths)
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>Kwota</span>
                    <input
                      type="text"
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
                      value={quickForm.durationMonths}
                      onChange={(event) =>
                        setQuickForm((prev) => ({
                          ...prev,
                          durationMonths: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Wyślij zapytanie
                  </button>
                </form>
                <ResponsePanel
                  response={responses["search-quick-api"]}
                  error={errors["search-quick-api"]}
                  loading={loading["search-quick-api"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Dokładne wyszukiwanie</h4>
                    <p>POST /api/search/detailed</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("search-detailed-api", {
                      method: "POST",
                      path: "/api/search/detailed",
                      body: {
                        amount: toDecimal(detailForm.amount),
                        durationMonths: toInt(detailForm.durationMonths),
                        income: toDecimal(detailForm.income),
                        livingCosts: toDecimal(detailForm.livingCosts),
                        dependents: toInt(detailForm.dependents)
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>Kwota</span>
                    <input
                      type="text"
                      value={detailForm.amount}
                      onChange={(event) =>
                        setDetailForm((prev) => ({
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
                      value={detailForm.durationMonths}
                      onChange={(event) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          durationMonths: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Dochód</span>
                    <input
                      type="text"
                      value={detailForm.income}
                      onChange={(event) =>
                        setDetailForm((prev) => ({
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
                      value={detailForm.livingCosts}
                      onChange={(event) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          livingCosts: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Osoby na utrzymaniu</span>
                    <input
                      type="text"
                      value={detailForm.dependents}
                      onChange={(event) =>
                        setDetailForm((prev) => ({
                          ...prev,
                          dependents: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Wyślij zapytanie
                  </button>
                </form>
                <ResponsePanel
                  response={responses["search-detailed-api"]}
                  error={errors["search-detailed-api"]}
                  loading={loading["search-detailed-api"]}
                />
              </div>
            </div>
          </div>

          <div className="api-group">
            <h3>Wybór oferty</h3>
            <div className="api-grid">
              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Utwórz wybór oferty</h4>
                    <p>POST /api/offer-selections</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("selection-create", {
                      method: "POST",
                      path: "/api/offer-selections",
                      body: {
                        inquiryId: selectionCreateForm.inquiryId,
                        provider: selectionCreateForm.provider,
                        providerOfferId: selectionCreateForm.providerOfferId,
                        installment: toDecimal(selectionCreateForm.installment),
                        apr: toDecimal(selectionCreateForm.apr),
                        totalCost: toDecimal(selectionCreateForm.totalCost),
                        amount: toDecimal(selectionCreateForm.amount),
                        durationMonths: toInt(selectionCreateForm.durationMonths)
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>ID zapytania (InquiryId)</span>
                    <input
                      type="text"
                      value={selectionCreateForm.inquiryId}
                      onChange={(event) =>
                        setSelectionCreateForm((prev) => ({
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
                      value={selectionCreateForm.provider}
                      onChange={(event) =>
                        setSelectionCreateForm((prev) => ({
                          ...prev,
                          provider: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>ProviderOfferId</span>
                    <input
                      type="text"
                      value={selectionCreateForm.providerOfferId}
                      onChange={(event) =>
                        setSelectionCreateForm((prev) => ({
                          ...prev,
                          providerOfferId: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Rata (Installment)</span>
                    <input
                      type="text"
                      value={selectionCreateForm.installment}
                      onChange={(event) =>
                        setSelectionCreateForm((prev) => ({
                          ...prev,
                          installment: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>RRSO (APR)</span>
                    <input
                      type="text"
                      value={selectionCreateForm.apr}
                      onChange={(event) =>
                        setSelectionCreateForm((prev) => ({
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
                      value={selectionCreateForm.totalCost}
                      onChange={(event) =>
                        setSelectionCreateForm((prev) => ({
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
                      value={selectionCreateForm.amount}
                      onChange={(event) =>
                        setSelectionCreateForm((prev) => ({
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
                      value={selectionCreateForm.durationMonths}
                      onChange={(event) =>
                        setSelectionCreateForm((prev) => ({
                          ...prev,
                          durationMonths: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Utwórz wybór
                  </button>
                </form>
                <ResponsePanel
                  response={responses["selection-create"]}
                  error={errors["selection-create"]}
                  loading={loading["selection-create"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Pobierz wybór oferty</h4>
                    <p>GET /api/offer-selections/{"{id}"}</p>
                  </div>
                  <span className="badge">GET</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("selection-get", {
                      method: "GET",
                      path: `/api/offer-selections/${selectionGetForm.id}`
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wyboru</span>
                    <input
                      type="text"
                      value={selectionGetForm.id}
                      onChange={(event) =>
                        setSelectionGetForm({ id: event.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Pobierz wybór
                  </button>
                </form>
                <ResponsePanel
                  response={responses["selection-get"]}
                  error={errors["selection-get"]}
                  loading={loading["selection-get"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Przelicz wybór oferty</h4>
                    <p>POST /api/offer-selections/{"{id}"}/recalculate</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("selection-recalc", {
                      method: "POST",
                      path: `/api/offer-selections/${selectionRecalcForm.id}/recalculate`,
                      body: {
                        income: toDecimal(selectionRecalcForm.income),
                        livingCosts: toDecimal(selectionRecalcForm.livingCosts),
                        dependents: toInt(selectionRecalcForm.dependents)
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wyboru</span>
                    <input
                      type="text"
                      value={selectionRecalcForm.id}
                      onChange={(event) =>
                        setSelectionRecalcForm((prev) => ({
                          ...prev,
                          id: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Dochód</span>
                    <input
                      type="text"
                      value={selectionRecalcForm.income}
                      onChange={(event) =>
                        setSelectionRecalcForm((prev) => ({
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
                      value={selectionRecalcForm.livingCosts}
                      onChange={(event) =>
                        setSelectionRecalcForm((prev) => ({
                          ...prev,
                          livingCosts: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Osoby na utrzymaniu</span>
                    <input
                      type="text"
                      value={selectionRecalcForm.dependents}
                      onChange={(event) =>
                        setSelectionRecalcForm((prev) => ({
                          ...prev,
                          dependents: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Przelicz ofertę
                  </button>
                </form>
                <ResponsePanel
                  response={responses["selection-recalc"]}
                  error={errors["selection-recalc"]}
                  loading={loading["selection-recalc"]}
                />
              </div>
            </div>
          </div>

          <div className="api-group">
            <h3>Użytkownicy</h3>
            <div className="api-grid">
              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Rejestracja</h4>
                    <p>POST /api/users/register</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("user-register", {
                      method: "POST",
                      path: "/api/users/register",
                      body: {
                        email: registerForm.email,
                        password: registerForm.password,
                        profile: {
                          firstName: registerForm.firstName,
                          lastName: registerForm.lastName,
                          age: toInt(registerForm.age),
                          jobTitle: registerForm.jobTitle,
                          address: registerForm.address,
                          idDocumentNumber: registerForm.idDocumentNumber
                        }
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          email: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Hasło</span>
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          password: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Imię</span>
                    <input
                      type="text"
                      value={registerForm.firstName}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
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
                      value={registerForm.lastName}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
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
                      value={registerForm.age}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
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
                      value={registerForm.jobTitle}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
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
                      value={registerForm.address}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
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
                      value={registerForm.idDocumentNumber}
                      onChange={(event) =>
                        setRegisterForm((prev) => ({
                          ...prev,
                          idDocumentNumber: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Zarejestruj
                  </button>
                </form>
                <ResponsePanel
                  response={responses["user-register"]}
                  error={errors["user-register"]}
                  loading={loading["user-register"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Logowanie</h4>
                    <p>POST /api/users/login</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("user-login", {
                      method: "POST",
                      path: "/api/users/login",
                      body: {
                        email: loginForm.email,
                        password: loginForm.password
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          email: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Hasło</span>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) =>
                        setLoginForm((prev) => ({
                          ...prev,
                          password: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Zaloguj
                  </button>
                </form>
                <ResponsePanel
                  response={responses["user-login"]}
                  error={errors["user-login"]}
                  loading={loading["user-login"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Rejestracja zewnętrzna</h4>
                    <p>POST /api/users/external/register</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("user-external-register", {
                      method: "POST",
                      path: "/api/users/external/register",
                      body: {
                        provider: externalRegisterForm.provider,
                        subject: externalRegisterForm.subject,
                        email: externalRegisterForm.email,
                        profile: {
                          firstName: externalRegisterForm.firstName,
                          lastName: externalRegisterForm.lastName,
                          age: toInt(externalRegisterForm.age),
                          jobTitle: externalRegisterForm.jobTitle,
                          address: externalRegisterForm.address,
                          idDocumentNumber: externalRegisterForm.idDocumentNumber
                        }
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>Provider</span>
                    <input
                      type="text"
                      value={externalRegisterForm.provider}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
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
                      value={externalRegisterForm.subject}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
                          ...prev,
                          subject: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={externalRegisterForm.email}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
                          ...prev,
                          email: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Imię</span>
                    <input
                      type="text"
                      value={externalRegisterForm.firstName}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
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
                      value={externalRegisterForm.lastName}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
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
                      value={externalRegisterForm.age}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
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
                      value={externalRegisterForm.jobTitle}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
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
                      value={externalRegisterForm.address}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
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
                      value={externalRegisterForm.idDocumentNumber}
                      onChange={(event) =>
                        setExternalRegisterForm((prev) => ({
                          ...prev,
                          idDocumentNumber: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Zarejestruj zewnętrznie
                  </button>
                </form>
                <ResponsePanel
                  response={responses["user-external-register"]}
                  error={errors["user-external-register"]}
                  loading={loading["user-external-register"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Logowanie zewnętrzne</h4>
                    <p>POST /api/users/external/login</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("user-external-login", {
                      method: "POST",
                      path: "/api/users/external/login",
                      body: {
                        provider: externalLoginForm.provider,
                        subject: externalLoginForm.subject
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>Provider</span>
                    <input
                      type="text"
                      value={externalLoginForm.provider}
                      onChange={(event) =>
                        setExternalLoginForm((prev) => ({
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
                      value={externalLoginForm.subject}
                      onChange={(event) =>
                        setExternalLoginForm((prev) => ({
                          ...prev,
                          subject: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Zaloguj zewnętrznie
                  </button>
                </form>
                <ResponsePanel
                  response={responses["user-external-login"]}
                  error={errors["user-external-login"]}
                  loading={loading["user-external-login"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Podgląd użytkownika</h4>
                    <p>GET /api/users/{"{id}"}</p>
                  </div>
                  <span className="badge">GET</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("user-get", {
                      method: "GET",
                      path: `/api/users/${userGetForm.id}`
                    });
                  }}
                >
                  <label className="field">
                    <span>ID użytkownika</span>
                    <input
                      type="text"
                      value={userGetForm.id}
                      onChange={(event) =>
                        setUserGetForm({ id: event.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Pobierz dane
                  </button>
                </form>
                <ResponsePanel
                  response={responses["user-get"]}
                  error={errors["user-get"]}
                  loading={loading["user-get"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Aktualizacja profilu</h4>
                    <p>PUT /api/users/{"{id}"}</p>
                  </div>
                  <span className="badge">PUT</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("user-update", {
                      method: "PUT",
                      path: `/api/users/${userUpdateForm.id}`,
                      body: {
                        firstName: userUpdateForm.firstName,
                        lastName: userUpdateForm.lastName,
                        age: toInt(userUpdateForm.age),
                        jobTitle: userUpdateForm.jobTitle,
                        address: userUpdateForm.address,
                        idDocumentNumber: userUpdateForm.idDocumentNumber
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>ID użytkownika</span>
                    <input
                      type="text"
                      value={userUpdateForm.id}
                      onChange={(event) =>
                        setUserUpdateForm((prev) => ({
                          ...prev,
                          id: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Imię</span>
                    <input
                      type="text"
                      value={userUpdateForm.firstName}
                      onChange={(event) =>
                        setUserUpdateForm((prev) => ({
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
                      value={userUpdateForm.lastName}
                      onChange={(event) =>
                        setUserUpdateForm((prev) => ({
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
                      value={userUpdateForm.age}
                      onChange={(event) =>
                        setUserUpdateForm((prev) => ({
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
                      value={userUpdateForm.jobTitle}
                      onChange={(event) =>
                        setUserUpdateForm((prev) => ({
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
                      value={userUpdateForm.address}
                      onChange={(event) =>
                        setUserUpdateForm((prev) => ({
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
                      value={userUpdateForm.idDocumentNumber}
                      onChange={(event) =>
                        setUserUpdateForm((prev) => ({
                          ...prev,
                          idDocumentNumber: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Zaktualizuj profil
                  </button>
                </form>
                <ResponsePanel
                  response={responses["user-update"]}
                  error={errors["user-update"]}
                  loading={loading["user-update"]}
                />
              </div>
            </div>
          </div>

          <div className="api-group">
            <h3>Wnioski kredytowe</h3>
            <div className="api-grid">
              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Utwórz wniosek</h4>
                    <p>POST /api/applications</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("application-create", {
                      method: "POST",
                      path: "/api/applications",
                      body: {
                        applicantEmail: applicationCreateForm.applicantEmail,
                        firstName: applicationCreateForm.firstName,
                        lastName: applicationCreateForm.lastName,
                        age: toInt(applicationCreateForm.age),
                        jobTitle: applicationCreateForm.jobTitle,
                        address: applicationCreateForm.address,
                        idDocumentNumber: applicationCreateForm.idDocumentNumber,
                        provider: applicationCreateForm.provider,
                        providerOfferId: applicationCreateForm.providerOfferId,
                        installment: toDecimal(applicationCreateForm.installment),
                        apr: toDecimal(applicationCreateForm.apr),
                        totalCost: toDecimal(applicationCreateForm.totalCost),
                        amount: toDecimal(applicationCreateForm.amount),
                        durationMonths: toInt(applicationCreateForm.durationMonths)
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={applicationCreateForm.applicantEmail}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.firstName}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.lastName}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.age}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.jobTitle}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.address}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.idDocumentNumber}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.provider}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
                          ...prev,
                          provider: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>ProviderOfferId</span>
                    <input
                      type="text"
                      value={applicationCreateForm.providerOfferId}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.installment}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.apr}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.totalCost}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.amount}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
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
                      value={applicationCreateForm.durationMonths}
                      onChange={(event) =>
                        setApplicationCreateForm((prev) => ({
                          ...prev,
                          durationMonths: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Wyślij wniosek
                  </button>
                </form>
                <ResponsePanel
                  response={responses["application-create"]}
                  error={errors["application-create"]}
                  loading={loading["application-create"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Pobierz wniosek</h4>
                    <p>GET /api/applications/{"{id}"}</p>
                  </div>
                  <span className="badge">GET</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("application-get", {
                      method: "GET",
                      path: `/api/applications/${applicationGetForm.id}`
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wniosku</span>
                    <input
                      type="text"
                      value={applicationGetForm.id}
                      onChange={(event) =>
                        setApplicationGetForm({ id: event.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Pobierz wniosek
                  </button>
                </form>
                <ResponsePanel
                  response={responses["application-get"]}
                  error={errors["application-get"]}
                  loading={loading["application-get"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Lista wniosków</h4>
                    <p>GET /api/applications</p>
                  </div>
                  <span className="badge">GET</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("application-list", {
                      method: "GET",
                      path: "/api/applications",
                      query: {
                        applicantEmail: applicationListForm.applicantEmail,
                        status: applicationListForm.status || undefined,
                        days: applicationListForm.days
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>Email</span>
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
                    <span>Status</span>
                    <input
                      type="text"
                      value={applicationListForm.status}
                      onChange={(event) =>
                        setApplicationListForm((prev) => ({
                          ...prev,
                          status: event.target.value
                        }))
                      }
                      placeholder="Optional"
                    />
                  </label>
                  <label className="field">
                    <span>Zakres dni</span>
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
                  <button type="submit" className="secondary-button">
                    Pobierz listę
                  </button>
                </form>
                <ResponsePanel
                  response={responses["application-list"]}
                  error={errors["application-list"]}
                  loading={loading["application-list"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Anuluj wniosek</h4>
                    <p>POST /api/applications/{"{id}"}/cancel</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("application-cancel", {
                      method: "POST",
                      path: `/api/applications/${applicationCancelForm.id}/cancel`
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wniosku</span>
                    <input
                      type="text"
                      value={applicationCancelForm.id}
                      onChange={(event) =>
                        setApplicationCancelForm({ id: event.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Anuluj wniosek
                  </button>
                </form>
                <ResponsePanel
                  response={responses["application-cancel"]}
                  error={errors["application-cancel"]}
                  loading={loading["application-cancel"]}
                />
              </div>
            </div>
          </div>

          <div className="api-group">
            <h3>Panel administratora</h3>
            <div className="api-grid">
              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Lista wniosków</h4>
                    <p>GET /api/admin/applications</p>
                  </div>
                  <span className="badge">GET</span>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    handleRequest("admin-list", {
                      method: "GET",
                      path: "/api/admin/applications"
                    })
                  }
                >
                  Pobierz listę (Admin)
                </button>
                <ResponsePanel
                  response={responses["admin-list"]}
                  error={errors["admin-list"]}
                  loading={loading["admin-list"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Szczegóły wniosku</h4>
                    <p>GET /api/admin/applications/{"{id}"}</p>
                  </div>
                  <span className="badge">GET</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("admin-get", {
                      method: "GET",
                      path: `/api/admin/applications/${adminGetForm.id}`
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wniosku</span>
                    <input
                      type="text"
                      value={adminGetForm.id}
                      onChange={(event) =>
                        setAdminGetForm({ id: event.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Pobierz szczegóły
                  </button>
                </form>
                <ResponsePanel
                  response={responses["admin-get"]}
                  error={errors["admin-get"]}
                  loading={loading["admin-get"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Akceptuj wniosek</h4>
                    <p>POST /api/admin/applications/{"{id}"}/accept</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("admin-accept", {
                      method: "POST",
                      path: `/api/admin/applications/${adminActionForm.id}/accept`
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wniosku</span>
                    <input
                      type="text"
                      value={adminActionForm.id}
                      onChange={(event) =>
                        setAdminActionForm({ id: event.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Akceptuj
                  </button>
                </form>
                <ResponsePanel
                  response={responses["admin-accept"]}
                  error={errors["admin-accept"]}
                  loading={loading["admin-accept"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Wstępnie zaakceptuj</h4>
                    <p>POST /api/admin/applications/{"{id}"}/preliminary-accept</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("admin-preliminary", {
                      method: "POST",
                      path: `/api/admin/applications/${adminActionForm.id}/preliminary-accept`
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wniosku</span>
                    <input
                      type="text"
                      value={adminActionForm.id}
                      onChange={(event) =>
                        setAdminActionForm({ id: event.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Wstępna akceptacja
                  </button>
                </form>
                <ResponsePanel
                  response={responses["admin-preliminary"]}
                  error={errors["admin-preliminary"]}
                  loading={loading["admin-preliminary"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Przyznaj finansowanie</h4>
                    <p>POST /api/admin/applications/{"{id}"}/grant</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("admin-grant", {
                      method: "POST",
                      path: `/api/admin/applications/${adminActionForm.id}/grant`
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wniosku</span>
                    <input
                      type="text"
                      value={adminActionForm.id}
                      onChange={(event) =>
                        setAdminActionForm({ id: event.target.value })
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Przyznaj
                  </button>
                </form>
                <ResponsePanel
                  response={responses["admin-grant"]}
                  error={errors["admin-grant"]}
                  loading={loading["admin-grant"]}
                />
              </div>

              <div className="api-card">
                <div className="card-header">
                  <div>
                    <h4>Odrzuć wniosek</h4>
                    <p>POST /api/admin/applications/{"{id}"}/reject</p>
                  </div>
                  <span className="badge">POST</span>
                </div>
                <form
                  className="form-grid"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleRequest("admin-reject", {
                      method: "POST",
                      path: `/api/admin/applications/${adminRejectForm.id}/reject`,
                      body: {
                        reason: adminRejectForm.reason
                      }
                    });
                  }}
                >
                  <label className="field">
                    <span>ID wniosku</span>
                    <input
                      type="text"
                      value={adminRejectForm.id}
                      onChange={(event) =>
                        setAdminRejectForm((prev) => ({
                          ...prev,
                          id: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Powód odrzucenia</span>
                    <input
                      type="text"
                      value={adminRejectForm.reason}
                      onChange={(event) =>
                        setAdminRejectForm((prev) => ({
                          ...prev,
                          reason: event.target.value
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className="secondary-button">
                    Odrzuć
                  </button>
                </form>
                <ResponsePanel
                  response={responses["admin-reject"]}
                  error={errors["admin-reject"]}
                  loading={loading["admin-reject"]}
                />
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
          <a href="#">Polityka cookies</a>
          <a href="#">Regulamin</a>
          <a href="#">Kontakt</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
