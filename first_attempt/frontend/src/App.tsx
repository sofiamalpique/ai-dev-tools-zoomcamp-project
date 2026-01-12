import { FormEvent, useEffect, useState } from "react";

import {
  createHabit,
  createLabel,
  createTransaction,
  getBackendHealth,
  getMcpHealth,
  getWeeklyReviewSuggestion,
  listCategories,
  listHabits,
  listHabitsForDate,
  listLabels,
  listTransactions,
  toggleHabitCompletion,
} from "./api";
import { API_BASE_URL, MCP_BASE_URL } from "./api/client";
import CategoriesLabelsSection from "./components/CategoriesLabelsSection";
import HabitsSection from "./components/HabitsSection";
import Header from "./components/Header";
import HealthStatus from "./components/HealthStatus";
import TransactionsSection from "./components/TransactionsSection";
import WeeklyReviewSection from "./components/WeeklyReviewSection";
import type {
  Category,
  Habit,
  HabitForDate,
  HabitUnit,
  HealthState,
  Label,
  ListState,
  Transaction,
  WeeklyReviewSuggestion,
} from "./types";

type Theme = "light" | "dark";

type HealthResponse = {
  status: string;
};

const BACKEND_HEALTH_URL = `${API_BASE_URL}/health`;
const MCP_HEALTH_URL = `${MCP_BASE_URL}/health`;
const THEME_STORAGE_KEY = "lifeOpsTheme";

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

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
};

const useHealthCheck = (
  fetcher: () => Promise<HealthResponse>,
  refreshKey = 0
) => {
  const [state, setState] = useState<HealthState>(initialState);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetcher();

        if (!active) {
          return;
        }

        if (data?.status === "ok") {
          setState({ ok: true, data, error: null });
          return;
        }

        setState({
          ok: false,
          data,
          error: "Unexpected response. Please try again.",
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          ok: false,
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Request failed. Please try again.",
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [fetcher, refreshKey]);

  return state;
};

const useList = <T,>(fetcher: () => Promise<T[]>, refreshKey = 0) => {
  const [state, setState] = useState<ListState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetcher();

        if (!active) {
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
          error:
            error instanceof Error
              ? error.message
              : "Request failed. Please try again.",
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [fetcher, refreshKey]);

  return state;
};

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [backendRefresh, setBackendRefresh] = useState(0);
  const [mcpRefresh, setMcpRefresh] = useState(0);
  const backend = useHealthCheck(getBackendHealth, backendRefresh);
  const mcp = useHealthCheck(getMcpHealth, mcpRefresh);
  const [categoriesRefresh, setCategoriesRefresh] = useState(0);
  const categories = useList<Category>(listCategories, categoriesRefresh);
  const [labelsRefresh, setLabelsRefresh] = useState(0);
  const labels = useList<Label>(listLabels, labelsRefresh);
  const [habitsRefresh, setHabitsRefresh] = useState(0);
  const habits = useList<Habit>(listHabits, habitsRefresh);
  const [habitsForDateRefresh, setHabitsForDateRefresh] = useState(0);
  const [habitsForDate, setHabitsForDate] = useState<ListState<HabitForDate>>({
    data: null,
    loading: true,
    error: null,
  });
  const [transactionsRefresh, setTransactionsRefresh] = useState(0);
  const transactions = useList<Transaction>(
    listTransactions,
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
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
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
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

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
        const data = await listHabitsForDate(habitsDate);

        if (!active) {
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
          error:
            error instanceof Error
              ? error.message
              : "Request failed. Please try again.",
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
      await createLabel({
        label: trimmedLabel,
        category_id: labelCategoryId,
      });

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
      await createHabit({
        name: trimmedName,
        start_date: habitStartDate,
        end_date: habitNoEndDate ? null : habitEndDate,
        interval: intervalValue,
        unit: habitUnit,
      });

      setHabitName("");
      setHabitStartAuto(true);
      setHabitStartDate(habitsDate);
      setHabitEndDate("");
      setHabitNoEndDate(true);
      setHabitInterval("1");
      setHabitUnit("day");
      setHabitsRefresh((value) => value + 1);
      setHabitsForDateRefresh((value) => value + 1);
      setIsAddHabitOpen(false);
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
      const data = await toggleHabitCompletion(habitId, { date: habitsDate });

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
      await createTransaction({
        amount,
        occurred_at: transactionOccurredAt,
        description: transactionDescription.trim() || null,
        label_id: transactionLabelId,
      });

      setTransactionAmount("");
      setTransactionOccurredAt("");
      setTransactionDescription("");
      setTransactionsRefresh((value) => value + 1);
    } catch (error) {
      setTransactionError(
        error instanceof Error
          ? error.message
          : "Failed to create transaction."
      );
    }
  };

  const runReview = async () => {
    if (!reviewStart || !reviewEnd) {
      setReviewError("Start and end dates are required.");
      return;
    }

    setReviewError(null);
    setReviewLoading(true);

    try {
      const data = await getWeeklyReviewSuggestion(reviewStart, reviewEnd);
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

  const handleReviewSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runReview();
  };

  const handleReviewRetry = () => {
    runReview();
  };

  const handleThemeToggle = () => {
    setTheme((value) => (value === "dark" ? "light" : "dark"));
  };

  const handleHabitStartDateChange = (value: string) => {
    setHabitStartAuto(false);
    setHabitStartDate(value);
  };

  const handleHabitNoEndDateChange = (value: boolean) => {
    setHabitNoEndDate(value);
    if (value) {
      setHabitEndDate("");
    }
  };

  const handleHabitEndDateChange = (value: string) => {
    setHabitEndDate(value);
    if (value) {
      setHabitNoEndDate(false);
    }
  };

  return (
    <div className="page">
      <Header theme={theme} onToggleTheme={handleThemeToggle} />

      <HealthStatus
        backend={backend}
        mcp={mcp}
        backendUrl={BACKEND_HEALTH_URL}
        mcpUrl={MCP_HEALTH_URL}
        onRetryBackend={() => setBackendRefresh((value) => value + 1)}
        onRetryMcp={() => setMcpRefresh((value) => value + 1)}
      />

      <CategoriesLabelsSection
        categories={categories}
        labels={labels}
        labelName={labelName}
        labelCategoryId={labelCategoryId}
        labelError={labelError}
        onRetryCategories={() => setCategoriesRefresh((value) => value + 1)}
        onRetryLabels={() => setLabelsRefresh((value) => value + 1)}
        onLabelNameChange={setLabelName}
        onLabelCategoryIdChange={setLabelCategoryId}
        onLabelSubmit={handleLabelSubmit}
      />

      <WeeklyReviewSection
        reviewStart={reviewStart}
        reviewEnd={reviewEnd}
        reviewLoading={reviewLoading}
        reviewError={reviewError}
        reviewData={reviewData}
        onReviewStartChange={setReviewStart}
        onReviewEndChange={setReviewEnd}
        onReviewSubmit={handleReviewSubmit}
        onReviewRetry={handleReviewRetry}
      />

      <HabitsSection
        habits={habits}
        habitsForDate={habitsForDate}
        habitsDate={habitsDate}
        onHabitsDateChange={setHabitsDate}
        habitToggleError={habitToggleError}
        onRetryHabits={() => setHabitsRefresh((value) => value + 1)}
        onRetryHabitsForDate={() =>
          setHabitsForDateRefresh((value) => value + 1)
        }
        isAddHabitOpen={isAddHabitOpen}
        onOpenAddHabit={() => setIsAddHabitOpen(true)}
        onCloseAddHabit={() => setIsAddHabitOpen(false)}
        habitName={habitName}
        onHabitNameChange={setHabitName}
        habitStartDate={habitStartDate}
        onHabitStartDateChange={handleHabitStartDateChange}
        habitEndDate={habitEndDate}
        onHabitEndDateChange={handleHabitEndDateChange}
        habitNoEndDate={habitNoEndDate}
        onHabitNoEndDateChange={handleHabitNoEndDateChange}
        habitInterval={habitInterval}
        onHabitIntervalChange={setHabitInterval}
        habitUnit={habitUnit}
        onHabitUnitChange={setHabitUnit}
        habitError={habitError}
        onHabitSubmit={handleHabitSubmit}
        onHabitToggle={handleHabitToggle}
      />

      <TransactionsSection
        labels={labels}
        transactions={transactions}
        transactionLabelId={transactionLabelId}
        transactionAmount={transactionAmount}
        transactionOccurredAt={transactionOccurredAt}
        transactionDescription={transactionDescription}
        transactionError={transactionError}
        onRetryTransactions={() => setTransactionsRefresh((value) => value + 1)}
        onTransactionLabelChange={setTransactionLabelId}
        onTransactionAmountChange={setTransactionAmount}
        onTransactionOccurredAtChange={setTransactionOccurredAt}
        onTransactionDescriptionChange={setTransactionDescription}
        onTransactionSubmit={handleTransactionSubmit}
      />
    </div>
  );
}

export default App;
