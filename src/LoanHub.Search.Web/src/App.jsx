const quickFields = [
  { id: "amount", label: "Kwota (PLN)", placeholder: "np. 25 000" },
  { id: "duration", label: "Okres (miesiące)", placeholder: "np. 36" }
];

const detailFields = [
  { id: "income", label: "Dochód netto", placeholder: "np. 6 500 PLN" },
  { id: "costs", label: "Koszty życia", placeholder: "np. 2 100 PLN" },
  { id: "dependents", label: "Liczba osób na utrzymaniu", placeholder: "np. 2" }
];

const offers = [
  {
    name: "Aurora Bank",
    installment: "1 072 PLN / mies.",
    note: "Oferta wstępna, decyzja w 15 s"
  },
  {
    name: "Nova Finance",
    installment: "1 091 PLN / mies.",
    note: "Wstępna decyzja online"
  },
  {
    name: "LoanHub Partners",
    installment: "1 056 PLN / mies.",
    note: "Nowa oferta od zespołu"
  }
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

function App() {
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
            <form className="form-grid">
              {quickFields.map((field) => (
                <label key={field.id} className="field">
                  <span>{field.label}</span>
                  <input type="text" placeholder={field.placeholder} />
                </label>
              ))}
              <button type="button" className="primary-button">
                Pokaż oferty
              </button>
            </form>
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
            <form className="form-grid">
              {detailFields.map((field) => (
                <label key={field.id} className="field">
                  <span>{field.label}</span>
                  <input type="text" placeholder={field.placeholder} />
                </label>
              ))}
              <button type="button" className="secondary-button">
                Oblicz ratę
              </button>
            </form>
          </div>
          <div className="offers">
            <h3>Przykładowe oferty</h3>
            <div className="offer-list">
              {offers.map((offer) => (
                <div key={offer.name} className="offer-card">
                  <div>
                    <h4>{offer.name}</h4>
                    <p>{offer.note}</p>
                  </div>
                  <div className="offer-rate">
                    <span>{offer.installment}</span>
                    <button className="ghost-button">Wybierz</button>
                  </div>
                </div>
              ))}
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
