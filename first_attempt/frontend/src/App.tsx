import { FormEvent, useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000/health";
const MCP_URL = "http://localhost:8001/health";
const API_BASE_URL = "http://localhost:8000";
const CATEGORIES_URL = `${API_BASE_URL}/api/categories`;
const TRANSACTIONS_URL = `${API_BASE_URL}/api/transactions`;

type HealthState = {
  ok: boolean | null;
  data: unknown | null;
  error: string | null;
};

type ListState<T> = {
  data: T[] | null;
  loading: boolean;
  error: string | null;
};

type Category = {
  id: string;
  name: string;
  kind: string;
  created_at: string;
};

type Transaction = {
  id: string;
  amount: string;
  occurred_at: string;
  description: string | null;
  category_id: string;
  created_at: string;
};

const initialState: HealthState = {
  ok: null,
  data: null,
  error: null,
};

const statusLabel = (state: HealthState) =>
  state.ok ? "OK" : "ERROR";

const statusClass = (state: HealthState) =>
  state.ok ? "status ok" : "status error";

const useHealthCheck = (url: string) => {
  const [state, setState] = useState<HealthState>(initialState);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();

        if (!active) {
          return;
        }

        if (response.ok && data?.status === "ok") {
          setState({ ok: true, data, error: null });
          return;
        }

        setState({
          ok: false,
          data,
          error: "Unexpected response.",
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          ok: false,
          data: null,
          error: error instanceof Error ? error.message : "Request failed.",
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [url]);

  return state;
};

const useList = <T,>(url: string, refreshKey = 0) => {
  const [state, setState] = useState<ListState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();

        if (!active) {
          return;
        }

        if (!response.ok) {
          setState({
            data: null,
            loading: false,
            error: data?.detail ?? "Request failed.",
          });
          return;
        }

        setState({ data, loading: false, error: null });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : "Request failed.",
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [url, refreshKey]);

  return state;
};

const HealthCard = ({
  label,
  url,
  state,
}: {
  label: string;
  url: string;
  state: HealthState;
}) => {
  const payload = state.data ? JSON.stringify(state.data, null, 2) : null;
  const detail = payload ?? state.error ?? "Loading...";

  return (
    <article className="status-card">
      <div className="status-line">
        <span className="label">{label}:</span>
        <span className={statusClass(state)}>{statusLabel(state)}</span>
      </div>
      <p className="hint">{url}</p>
      <pre className="payload">{detail}</pre>
    </article>
  );
};

function App() {
  const backend = useHealthCheck(BACKEND_URL);
  const mcp = useHealthCheck(MCP_URL);
  const [categoriesRefresh, setCategoriesRefresh] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [categoryKind, setCategoryKind] = useState("house");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const categories = useList<Category>(CATEGORIES_URL, categoriesRefresh);
  const transactions = useList<Transaction>(TRANSACTIONS_URL);

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      setCategoryError("Name is required.");
      return;
    }

    setCategoryError(null);

    try {
      const response = await fetch(CATEGORIES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, kind: categoryKind }),
      });
      const data = await response.json();

      if (!response.ok) {
        setCategoryError(data?.detail ?? "Failed to create category.");
        return;
      }

      setCategoryName("");
      setCategoryKind("house");
      setCategoriesRefresh((value) => value + 1);
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "Failed to create category."
      );
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Attempt 1</p>
        <h1>Life Ops Planner (MVP)</h1>
        <p className="subtitle">
          Minimal health dashboard for backend + MCP.
        </p>
      </header>

      <section className="status-grid">
        <HealthCard label="Backend" url={BACKEND_URL} state={backend} />
        <HealthCard label="MCP" url={MCP_URL} state={mcp} />
      </section>

      <section className="data-section">
        <h2 className="section-title">Categories</h2>
        <form className="form-card" onSubmit={handleCategorySubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Name</span>
              <input
                type="text"
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="e.g. Groceries"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Kind</span>
              <select
                value={categoryKind}
                onChange={(event) => setCategoryKind(event.target.value)}
              >
                <option value="house">house</option>
                <option value="health">health</option>
                <option value="supermarket">supermarket</option>
                <option value="fun">fun</option>
                <option value="subscriptions">subscriptions</option>
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button type="submit">Add category</button>
            {categoryError && (
              <span className="error-text">{categoryError}</span>
            )}
          </div>
        </form>
        <article className="status-card">
          {categories.loading && <p className="hint">Loading categories...</p>}
          {categories.error && (
            <p className="error-text">Error: {categories.error}</p>
          )}
          {!categories.loading &&
            !categories.error &&
            (categories.data?.length ? (
              <ul className="data-list">
                {categories.data.map((category) => (
                  <li className="data-item" key={category.id}>
                    <div className="item-row">
                      <span className="item-primary">{category.name}</span>
                      <span className="item-secondary">{category.kind}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">No categories yet.</p>
            ))}
        </article>
      </section>

      <section className="data-section">
        <h2 className="section-title">Transactions</h2>
        <article className="status-card">
          {transactions.loading && (
            <p className="hint">Loading transactions...</p>
          )}
          {transactions.error && (
            <p className="error-text">Error: {transactions.error}</p>
          )}
          {!transactions.loading &&
            !transactions.error &&
            (transactions.data?.length ? (
              <ul className="data-list">
                {transactions.data.map((transaction) => (
                  <li className="data-item" key={transaction.id}>
                    <div className="item-row">
                      <span className="item-primary">
                        {transaction.occurred_at}
                      </span>
                      <span className="item-secondary">
                        {transaction.amount}
                      </span>
                    </div>
                    <p className="item-muted">
                      {transaction.description ?? "No description"}
                    </p>
                    <p className="item-muted">
                      Category: {transaction.category_id}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">No transactions yet.</p>
            ))}
        </article>
      </section>
    </div>
  );
}

export default App;
