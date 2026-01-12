import { FormEvent, useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000/health";
const MCP_URL = "http://localhost:8001/health";
const API_BASE_URL = "http://localhost:8000";
const CATEGORIES_URL = `${API_BASE_URL}/api/categories`;
const LABELS_URL = `${API_BASE_URL}/api/labels`;
const HABITS_URL = `${API_BASE_URL}/api/habits`;
const HABITS_FOR_DATE_URL = `${API_BASE_URL}/api/habits/for-date`;
const TRANSACTIONS_URL = `${API_BASE_URL}/api/transactions`;
const WEEKLY_REVIEW_URL = `${API_BASE_URL}/api/reviews/weekly/suggestion`;

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

type HabitUnit = "day" | "week" | "month";

type HabitSchedule = {
  start_date: string;
  end_date: string | null;
  interval: number;
  unit: HabitUnit;
};

type HabitForDate = HabitSchedule & {
  id: string;
  name: string;
  checked: boolean;
};

type Habit = HabitSchedule & {
  id: string;
  name: string;
  created_at: string;
};

type WeeklyReviewCategory = {
  category_key: string;
  total_amount: string;
};

type WeeklyReviewSummary = {
  start_date: string;
  end_date: string;
  total_amount: string;
  by_category: WeeklyReviewCategory[];
};

type WeeklyReviewSuggestion = {
  start_date: string;
  end_date: string;
  summary: WeeklyReviewSummary;
  suggestion: string;
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

const buildScheduleSummary = (habit: HabitSchedule) => {
  const unitLabel =
    habit.interval === 1 ? habit.unit : `${habit.unit}s`;
  const repeatText =
    habit.interval === 1
      ? `Every ${habit.unit}`
      : `Every ${habit.interval} ${unitLabel}`;
  const endText = habit.end_date ? `Ends ${habit.end_date}` : "No end date";
  return `${repeatText} \u2022 Started ${habit.start_date} \u2022 ${endText}`;
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
  const [habitsRefresh, setHabitsRefresh] = useState(0);
  const habits = useList<Habit>(HABITS_URL, habitsRefresh);
  const [habitsForDateRefresh, setHabitsForDateRefresh] = useState(0);
  const [habitsForDate, setHabitsForDate] = useState<ListState<HabitForDate>>({
    data: null,
    loading: true,
    error: null,
  });
  const [transactionsRefresh, setTransactionsRefresh] = useState(0);
  const transactions = useList<Transaction>(
    TRANSACTIONS_URL,
    transactionsRefresh
  );

  const [labelName, setLabelName] = useState("");
  const [labelCategoryId, setLabelCategoryId] = useState("");
  const [labelError, setLabelError] = useState<string | null>(null);
  const [habitName, setHabitName] = useState("");
  const [habitError, setHabitError] = useState<string | null>(null);
  const [habitToggleError, setHabitToggleError] = useState<string | null>(null);
  const [habitsDate, setHabitsDate] = useState(() =>
    buildDateInputValue(new Date())
  );
  const [habitStartDate, setHabitStartDate] = useState(() =>
    buildDateInputValue(new Date())
  );
  const [habitStartAuto, setHabitStartAuto] = useState(true);
  const [habitEndDate, setHabitEndDate] = useState("");
  const [habitNoEndDate, setHabitNoEndDate] = useState(true);
  const [habitInterval, setHabitInterval] = useState("1");
  const [habitUnit, setHabitUnit] = useState<HabitUnit>("day");
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
  const [reviewData, setReviewData] = useState<WeeklyReviewSuggestion | null>(
    null
  );

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

  useEffect(() => {
    if (habitStartAuto) {
      setHabitStartDate(habitsDate);
    }
  }, [habitsDate, habitStartAuto]);

  useEffect(() => {
    let active = true;
    setHabitToggleError(null);

    if (!habitsDate) {
      setHabitsForDate({
        data: null,
        loading: false,
        error: "Date is required.",
      });
      return () => {
        active = false;
      };
    }

    const load = async () => {
      setHabitsForDate((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await fetch(
          `${HABITS_FOR_DATE_URL}?date=${encodeURIComponent(habitsDate)}`
        );
        const data = await response.json();

        if (!active) {
          return;
        }

        if (!response.ok) {
          setHabitsForDate({
            data: null,
            loading: false,
            error: data?.detail ?? "Failed to load habits.",
          });
          return;
        }

        setHabitsForDate({ data, loading: false, error: null });
      } catch (error) {
        if (!active) {
          return;
        }

        setHabitsForDate({
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
  }, [habitsDate, habitsForDateRefresh]);

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

  const handleHabitSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = habitName.trim();
    const intervalValue = Number.parseInt(habitInterval, 10);

    if (!trimmedName) {
      setHabitError("Habit name is required.");
      return;
    }

    if (!habitStartDate) {
      setHabitError("Start date is required.");
      return;
    }

    if (!Number.isInteger(intervalValue) || intervalValue < 1) {
      setHabitError("Interval must be at least 1.");
      return;
    }

    if (!habitNoEndDate && !habitEndDate) {
      setHabitError("End date is required or choose no end date.");
      return;
    }

    setHabitError(null);

    try {
      const response = await fetch(HABITS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          start_date: habitStartDate,
          end_date: habitNoEndDate ? null : habitEndDate,
          interval: intervalValue,
          unit: habitUnit,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setHabitError(data?.detail ?? "Failed to create habit.");
        return;
      }

      setHabitName("");
      setHabitStartAuto(true);
      setHabitStartDate(habitsDate);
      setHabitEndDate("");
      setHabitNoEndDate(true);
      setHabitInterval("1");
      setHabitUnit("day");
      setHabitsRefresh((value) => value + 1);
      setHabitsForDateRefresh((value) => value + 1);
    } catch (error) {
      setHabitError(
        error instanceof Error ? error.message : "Failed to create habit."
      );
    }
  };

  const handleHabitToggle = async (habitId: string) => {
    if (!habitsDate) {
      setHabitToggleError("Date is required.");
      return;
    }

    setHabitToggleError(null);

    try {
      const response = await fetch(`${HABITS_URL}/${habitId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: habitsDate }),
      });
      const data = await response.json();

      if (!response.ok) {
        const detail = data?.detail ?? "Unable to update habit.";
        setHabitToggleError(
          response.status === 400 &&
            detail === "Habit not scheduled for this date"
            ? "Not scheduled for this date. Pick a due date."
            : detail
        );
        return;
      }

      if (data?.status) {
        setHabitsForDateRefresh((value) => value + 1);
      }
    } catch (error) {
      setHabitToggleError(
        error instanceof Error ? error.message : "Failed to toggle habit."
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

    setTransactionError(null);

    try {
      const response = await fetch(TRANSACTIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          occurred_at: transactionOccurredAt,
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
  const dueHabitIds = habitsForDate.data
    ? new Set(habitsForDate.data.map((habit) => habit.id))
    : null;
  const notDueHabits =
    dueHabitIds && habits.data
      ? habits.data.filter((habit) => !dueHabitIds.has(habit.id))
      : null;

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
                <span className="item-secondary">
                  {reviewData.summary.total_amount}
                </span>
              </div>
              {reviewData.summary.by_category.length ? (
                <ul className="data-list">
                  {reviewData.summary.by_category.map((entry) => (
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
              <div className="review-suggestion">
                <p className="hint">Weekly suggestion</p>
                <p className="item-muted">
                  {reviewData.suggestion?.trim() ||
                    "No suggestion yet. Try another range."}
                </p>
              </div>
            </>
          ) : (
            <p className="hint">Run a review to see totals.</p>
          )}
        </article>
      </section>

      <section className="data-section">
        <h2 className="section-title">Habits</h2>
        <div className="form-card">
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Date</span>
              <input
                type="date"
                value={habitsDate}
                onChange={(event) => setHabitsDate(event.target.value)}
              />
            </label>
          </div>
        </div>
        <form className="form-card" onSubmit={handleHabitSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Habit name</span>
              <input
                type="text"
                value={habitName}
                onChange={(event) => setHabitName(event.target.value)}
                placeholder="e.g. Drink water"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Starts</span>
              <input
                type="date"
                value={habitStartDate}
                onChange={(event) => {
                  setHabitStartAuto(false);
                  setHabitStartDate(event.target.value);
                }}
              />
            </label>
            <div className="form-field form-span-2">
              <span className="form-label">Repeats</span>
              <div className="form-inline">
                <span className="inline-text">Every</span>
                <input
                  className="inline-input"
                  type="number"
                  min={1}
                  step={1}
                  value={habitInterval}
                  onChange={(event) => setHabitInterval(event.target.value)}
                />
                <select
                  className="inline-select"
                  value={habitUnit}
                  onChange={(event) =>
                    setHabitUnit(
                      event.target.value as "day" | "week" | "month"
                    )
                  }
                >
                  <option value="day">day</option>
                  <option value="week">week</option>
                  <option value="month">month</option>
                </select>
              </div>
            </div>
            <div className="form-field form-span-2">
              <span className="form-label">Ends</span>
              <div className="form-inline">
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={habitNoEndDate}
                    onChange={(event) => {
                      setHabitNoEndDate(event.target.checked);
                      if (event.target.checked) {
                        setHabitEndDate("");
                      }
                    }}
                  />
                  <span>Never</span>
                </label>
                <span className="inline-text">On</span>
                <input
                  className="inline-input"
                  type="date"
                  value={habitEndDate}
                  onChange={(event) => {
                    setHabitEndDate(event.target.value);
                    if (event.target.value) {
                      setHabitNoEndDate(false);
                    }
                  }}
                  disabled={habitNoEndDate}
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Add habit</button>
            {habitError && <span className="error-text">{habitError}</span>}
          </div>
        </form>
        <article className="status-card">
          {habitsForDate.loading && (
            <p className="hint">Loading habits...</p>
          )}
          {habitsForDate.error && (
            <p className="error-text">Error: {habitsForDate.error}</p>
          )}
          {habitToggleError && (
            <p className="notice-text">{habitToggleError}</p>
          )}
          {!habitsForDate.loading &&
            !habitsForDate.error &&
            (habitsForDate.data?.length ? (
              <ul className="data-list">
                {habitsForDate.data.map((habit) => (
                  <li className="data-item" key={habit.id}>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={habit.checked}
                        onChange={() => handleHabitToggle(habit.id)}
                        disabled={
                          habitsForDate.loading ||
                          !!habitsForDate.error ||
                          !habitsDate
                        }
                      />
                      <span className="item-primary">{habit.name}</span>
                    </label>
                    <p className="item-muted">
                      {buildScheduleSummary(habit)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">No habits due for this date.</p>
            ))}
        </article>
        <details className="secondary-panel">
          <summary className="summary-line">
            Not due
            {notDueHabits ? ` (${notDueHabits.length})` : ""}
          </summary>
          <article className="status-card secondary-card">
            {habits.loading && <p className="hint">Loading habits...</p>}
            {habits.error && (
              <p className="error-text">Error: {habits.error}</p>
            )}
            {!habits.loading &&
              !habits.error &&
              (notDueHabits === null ? (
                <p className="hint">
                  Pick a date to see which habits are not due.
                </p>
              ) : notDueHabits.length ? (
                <ul className="data-list">
                  {notDueHabits.map((habit) => (
                    <li className="data-item" key={habit.id}>
                      <label className="checkbox-row is-disabled">
                        <input type="checkbox" checked={false} disabled />
                        <span className="item-primary">{habit.name}</span>
                      </label>
                      <p className="item-muted">
                        {buildScheduleSummary(habit)}
                      </p>
                      <p className="item-muted">Not due for this date.</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">
                  {habits.data?.length
                    ? "All habits are due for this date."
                    : "No habits created yet."}
                </p>
              ))}
          </article>
        </details>
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
                type="date"
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
                  const occurredAt = transaction.occurred_at;

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
