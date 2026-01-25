import { useState } from "react";

const quickFields = [
  { id: "amount", label: "Kwota (PLN)", placeholder: "np. 25 000" },
  { id: "durationMonths", label: "Okres (miesiące)", placeholder: "np. 36" }
];

const toDecimal = (value) => (value === "" ? null : Number.parseFloat(value));
const toInt = (value) => (value === "" ? null : Number.parseInt(value, 10));

const initialForm = {
  amount: "",
  durationMonths: ""
};

const pickOffers = (data) => {
  if (!data) {
    return [];
  }

  const offers = data.offers ?? data.Offers;
  if (Array.isArray(offers)) {
    return offers;
  }

  const values = offers?.$values;
  return Array.isArray(values) ? values : [];
};

function App() {
  const [quickForm, setQuickForm] = useState(initialForm);
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const response = await fetch("/api/search/quick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: toDecimal(quickForm.amount),
          durationMonths: toInt(quickForm.durationMonths)
        })
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        setOffers([]);
        setStatus("error");
        setError(
          data?.message || data?.error || "Nie udało się pobrać ofert."
        );
        return;
      }

      setOffers(pickOffers(data));
      setStatus("success");
    } catch (fetchError) {
      setOffers([]);
      setStatus("error");
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Wystąpił błąd sieci."
      );
    }
  };

  return (
    <div className="page">
      <header className="header">
        <h1>LoanHub</h1>
        <p className="subtitle">Szybkie wyszukiwanie ofert kredytowych</p>
      </header>

      <main className="content">
        <section className="card">
          <h2>Szybkie wyszukiwanie</h2>
          <form className="form" onSubmit={handleSubmit}>
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
          {status === "loading" && (
            <p className="status">Wysyłanie zapytania...</p>
          )}
          {status === "error" && <p className="status error">{error}</p>}
        </section>

        <section className="card">
          <h2>Lista ofert</h2>
          {offers.length === 0 ? (
            <p className="status">Brak ofert do wyświetlenia.</p>
          ) : (
            <ul className="offer-list">
              {offers.map((offer) => (
                <li
                  key={
                    offer.id ??
                    offer.providerOfferId ??
                    offer.ProviderOfferId ??
                    offer.provider ??
                    offer.Provider
                  }
                  className="offer"
                >
                  <div>
                    <h3>{offer.provider ?? offer.Provider ?? "Oferta"}</h3>
                    <p>
                      RRSO: {offer.apr ?? offer.Apr}% • Koszt całkowity: {" "}
                      {offer.totalCost ?? offer.TotalCost}
                    </p>
                  </div>
                  <div className="offer-rate">
                    {offer.installment ?? offer.Installment} PLN / mies.
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
