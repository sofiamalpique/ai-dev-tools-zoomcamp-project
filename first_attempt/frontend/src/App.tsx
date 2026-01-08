import { FormEvent, useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000/health";
const MCP_URL = "http://localhost:8001/health";
const API_BASE_URL = "http://localhost:8000";
const CATEGORIES_URL = `${API_BASE_URL}/api/categories`;
const LABELS_URL = `${API_BASE_URL}/api/labels`;
const TRANSACTIONS_URL = `${API_BASE_URL}/api/transactions`;
const WEEKLY_REVIEW_URL = `${API_BASE_URL}/api/reviews/weekly`;

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
  key: string;
  created_at: string;
};

type Label = {
  id: string;
  label: string;
  category_id: string;
  created_at: string;
};

type Transaction = {
  id: string;
  amount: string;
  occurred_at: string;
  description: string | null;
  label_id: string;
  created_at: string;
};

type WeeklyReviewCategory = {
  category_key: string;
  total_amount: string;
};

type WeeklyReview = {
  start_date: string;
  end_date: string;
  total_amount: string;
  by_category: WeeklyReviewCategory[];
};

const initialState: HealthState = {
  ok: null,
  data: null,
  error: null,
};

const buildDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const categories = useList<Category>(CATEGORIES_URL);
  const [labelsRefresh, setLabelsRefresh] = useState(0);
  const labels = useList<Label>(LABELS_URL, labelsRefresh);
  const [transactionsRefresh, setTransactionsRefresh] = useState(0);
  const transactions = useList<Transaction>(
    TRANSACTIONS_URL,
    transactionsRefresh
  );

  const [labelName, setLabelName] = useState("");
  const [labelCategoryId, setLabelCategoryId] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [transactionLabelId, setTransactionLabelId] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionOccurredAt, setTransactionOccurredAt] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [reviewStart, setReviewStart] = useState(() =>
    buildDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))
  );
  const [reviewEnd, setReviewEnd] = useState(() =>
    buildDateInputValue(new Date())
  );
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<WeeklyReview | null>(null);

  useEffect(() => {
    if (!labelCategoryId && categories.data?.length) {
      setLabelCategoryId(categories.data[0].id);
    }
  }, [categories.data, labelCategoryId]);

  useEffect(() => {
    if (!transactionLabelId && labels.data?.length) {
      setTransactionLabelId(labels.data[0].id);
    }
  }, [labels.data, transactionLabelId]);

  const handleLabelSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedLabel = labelName.trim();

    if (!trimmedLabel) {
      setLabelError("Label is required.");
      return;
    }

    if (!labelCategoryId) {
      setLabelError("Pick a category.");
      return;
    }

    setLabelError(null);

    try {
      const response = await fetch(LABELS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: trimmedLabel,
          category_id: labelCategoryId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setLabelError(data?.detail ?? "Failed to create label.");
        return;
      }

      setLabelName("");
      setLabelsRefresh((value) => value + 1);
    } catch (error) {
      setLabelError(
        error instanceof Error ? error.message : "Failed to create label."
      );
    }
  };

  const handleTransactionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number.parseFloat(transactionAmount);

    if (!transactionLabelId) {
      setTransactionError("Pick a label.");
      return;
    }

    if (!Number.isFinite(amount)) {
      setTransactionError("Amount is required.");
      return;
    }

    if (!transactionOccurredAt) {
      setTransactionError("Occurred at is required.");
      return;
    }

    const occurredAtIso = new Date(transactionOccurredAt).toISOString();
    if (occurredAtIso === "Invalid Date") {
      setTransactionError("Occurred at is invalid.");
      return;
    }

    setTransactionError(null);

    try {
      const response = await fetch(TRANSACTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          occurred_at: occurredAtIso,
          description: transactionDescription.trim() || null,
          label_id: transactionLabelId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setTransactionError(data?.detail ?? "Failed to create transaction.");
        return;
      }

      setTransactionAmount("");
      setTransactionOccurredAt("");
      setTransactionDescription("");
      setTransactionsRefresh((value) => value + 1);
    } catch (error) {
      setTransactionError(
        error instanceof Error ? error.message : "Failed to create transaction."
      );
    }
  };

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewStart || !reviewEnd) {
      setReviewError("Start and end dates are required.");
      return;
    }

    setReviewError(null);
    setReviewLoading(true);

    try {
      const response = await fetch(
        `${WEEKLY_REVIEW_URL}?start_date=${encodeURIComponent(
          reviewStart
        )}&end_date=${encodeURIComponent(reviewEnd)}`
      );
      const data = await response.json();

      if (!response.ok) {
        setReviewError(data?.detail ?? "Failed to load review.");
        setReviewData(null);
        return;
      }

      setReviewData(data);
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Failed to load review."
      );
      setReviewData(null);
    } finally {
      setReviewLoading(false);
    }
  };

  const categoryLookup = new Map(
    categories.data?.map((category) => [category.id, category.key]) ?? []
  );
  const labelLookup = new Map(
    labels.data?.map((label) => [label.id, label.label]) ?? []
  );

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
                      <span className="item-primary">{category.key}</span>
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
        <h2 className="section-title">Labels</h2>
        <form className="form-card" onSubmit={handleLabelSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Label</span>
              <input
                type="text"
                value={labelName}
                onChange={(event) => setLabelName(event.target.value)}
                placeholder="e.g. Netflix"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Category</span>
              <select
                value={labelCategoryId}
                onChange={(event) => setLabelCategoryId(event.target.value)}
                disabled={categories.loading || !!categories.error}
              >
                {categories.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.key}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button
              type="submit"
              disabled={categories.loading || !!categories.error}
            >
              Add label
            </button>
            {labelError && <span className="error-text">{labelError}</span>}
          </div>
        </form>
        <article className="status-card">
          {labels.loading && <p className="hint">Loading labels...</p>}
          {labels.error && <p className="error-text">Error: {labels.error}</p>}
          {!labels.loading &&
            !labels.error &&
            (labels.data?.length ? (
              <ul className="data-list">
                {labels.data.map((label) => (
                  <li className="data-item" key={label.id}>
                    <div className="item-row">
                      <span className="item-primary">{label.label}</span>
                      <span className="item-secondary">
                        {categoryLookup.get(label.category_id) ??
                          label.category_id}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">No labels yet.</p>
            ))}
        </article>
      </section>

      <section className="data-section">
        <h2 className="section-title">Weekly Review</h2>
        <form className="form-card" onSubmit={handleReviewSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Start date</span>
              <input
                type="date"
                value={reviewStart}
                onChange={(event) => setReviewStart(event.target.value)}
              />
            </label>
            <label className="form-field">
              <span className="form-label">End date</span>
              <input
                type="date"
                value={reviewEnd}
                onChange={(event) => setReviewEnd(event.target.value)}
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={reviewLoading}>
              {reviewLoading ? "Loading..." : "Get weekly review"}
            </button>
            {reviewError && <span className="error-text">{reviewError}</span>}
          </div>
        </form>
        <article className="status-card">
          {reviewData ? (
            <>
              <div className="item-row review-summary">
                <span className="item-primary">Total</span>
                <span className="item-secondary">{reviewData.total_amount}</span>
              </div>
              {reviewData.by_category.length ? (
                <ul className="data-list">
                  {reviewData.by_category.map((entry) => (
                    <li className="data-item" key={entry.category_key}>
                      <div className="item-row">
                        <span className="item-primary">
                          {entry.category_key}
                        </span>
                        <span className="item-secondary">
                          {entry.total_amount}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">No category totals for this range.</p>
              )}
            </>
          ) : (
            <p className="hint">Run a review to see totals.</p>
          )}
        </article>
      </section>

      <section className="data-section">
        <h2 className="section-title">Transactions</h2>
        <form className="form-card" onSubmit={handleTransactionSubmit}>
          <div className="form-grid transaction-grid">
            <label className="form-field">
              <span className="form-label">Label</span>
              <select
                value={transactionLabelId}
                onChange={(event) => setTransactionLabelId(event.target.value)}
                disabled={labels.loading || !!labels.error}
              >
                {labels.data?.map((label) => (
                  <option key={label.id} value={label.id}>
                    {label.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-label">Amount</span>
              <input
                type="number"
                value={transactionAmount}
                onChange={(event) => setTransactionAmount(event.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Occurred at</span>
              <input
                type="datetime-local"
                value={transactionOccurredAt}
                onChange={(event) =>
                  setTransactionOccurredAt(event.target.value)
                }
              />
            </label>
            <label className="form-field">
              <span className="form-label">Description</span>
              <input
                type="text"
                value={transactionDescription}
                onChange={(event) =>
                  setTransactionDescription(event.target.value)
                }
                placeholder="Optional note"
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              type="submit"
              disabled={labels.loading || !!labels.error}
            >
              Add transaction
            </button>
            {transactionError && (
              <span className="error-text">{transactionError}</span>
            )}
          </div>
        </form>
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
                {transactions.data.map((transaction) => {
                  const labelName = labelLookup.get(transaction.label_id);
                  const title = labelName ?? transaction.label_id;
                  const occurredAt = new Date(
                    transaction.occurred_at
                  ).toLocaleString();

                  return (
                    <li className="data-item" key={transaction.id}>
                      <div className="item-row">
                        <span className="item-primary">{title}</span>
                        <span className="item-secondary">
                          {transaction.amount}
                        </span>
                      </div>
                      <p className="item-muted">{occurredAt}</p>
                      <p className="item-muted">
                        {transaction.description ?? "No description"}
                      </p>
                      {!labelName && (
                        <p className="item-muted">
                          Label ID: {transaction.label_id}
                        </p>
                      )}
                    </li>
                  );
                })}
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
