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
          <a href="#auth" className="nav-link">
            Logowanie
          </a>
          <a href="#applications" className="nav-link">
            Wnioski
          </a>
          <a href="#admin" className="nav-link">
            Admin
          </a>
          <a href="#api" className="nav-link">
            Endpointy API
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

        <section className="section split">
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
            <h3>Oferty z wyszukiwarki</h3>
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
              <h3>Konfiguracja API</h3>
              <p className="helper">
                Jeśli frontend działa na innym porcie niż backend, wpisz pełny adres
                bazowy (np. http://localhost:5000). Pozostaw puste, aby użyć bieżącego
                hosta.
              </p>
              <label className="field">
                <span>Adres bazowy API</span>
                <input
                  type="text"
                  placeholder={envApiBase || "http://localhost:5000"}
                  value={apiBase}
                  onChange={(event) => setApiBase(event.target.value)}
                />
              </label>
              <div className="inline-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setApiBase("")}
                >
                  Wyczyść (użyj bieżącego hosta)
                </button>
                {envApiBase && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setApiBase(envApiBase)}
                  >
                    Przywróć z .env
                  </button>
                )}
              </div>
              <div className="hint-box">
                Aktualny adres: {apiBase ? apiBase : "używam bieżącego hosta"}
              </div>
            </div>
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
          <a href="#top">Powrót na górę</a>
          <a href="#search">Wyszukiwarka</a>
          <a href="#auth">Logowanie</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
