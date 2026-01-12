import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import * as api from "../api";

vi.mock("../api", () => ({
  getBackendHealth: vi.fn(),
  getMcpHealth: vi.fn(),
  listCategories: vi.fn(),
  listLabels: vi.fn(),
  createLabel: vi.fn(),
  listTransactions: vi.fn(),
  createTransaction: vi.fn(),
  listHabits: vi.fn(),
  createHabit: vi.fn(),
  listHabitsForDate: vi.fn(),
  toggleHabitCompletion: vi.fn(),
  getWeeklyReviewSuggestion: vi.fn(),
}));

const mockedApi = {
  getBackendHealth: vi.mocked(api.getBackendHealth),
  getMcpHealth: vi.mocked(api.getMcpHealth),
  listCategories: vi.mocked(api.listCategories),
  listLabels: vi.mocked(api.listLabels),
  createLabel: vi.mocked(api.createLabel),
  listTransactions: vi.mocked(api.listTransactions),
  createTransaction: vi.mocked(api.createTransaction),
  listHabits: vi.mocked(api.listHabits),
  createHabit: vi.mocked(api.createHabit),
  listHabitsForDate: vi.mocked(api.listHabitsForDate),
  toggleHabitCompletion: vi.mocked(api.toggleHabitCompletion),
  getWeeklyReviewSuggestion: vi.mocked(api.getWeeklyReviewSuggestion),
};

const category = {
  id: "cat-1",
  key: "health",
  created_at: "2024-01-01T00:00:00Z",
};
const label = {
  id: "label-1",
  label: "Groceries",
  category_id: category.id,
  created_at: "2024-01-01T00:00:00Z",
};
const transaction = {
  id: "txn-1",
  amount: "12.00",
  occurred_at: "2024-01-02",
  description: null,
  label_id: label.id,
  created_at: "2024-01-02T00:00:00Z",
};
const habit = {
  id: "habit-1",
  name: "Drink water",
  start_date: "2024-01-01",
  end_date: null,
  interval: 1,
  unit: "day" as const,
  created_at: "2024-01-01T00:00:00Z",
};
const habitForDate = {
  id: habit.id,
  name: habit.name,
  start_date: habit.start_date,
  end_date: habit.end_date,
  interval: habit.interval,
  unit: habit.unit,
  checked: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedApi.getBackendHealth.mockResolvedValue({ status: "ok" });
  mockedApi.getMcpHealth.mockResolvedValue({ status: "ok" });
  mockedApi.listCategories.mockResolvedValue([category]);
  mockedApi.listLabels.mockResolvedValue([label]);
  mockedApi.createLabel.mockResolvedValue(label);
  mockedApi.listTransactions.mockResolvedValue([transaction]);
  mockedApi.createTransaction.mockResolvedValue(transaction);
  mockedApi.listHabits.mockResolvedValue([habit]);
  mockedApi.createHabit.mockResolvedValue(habit);
  mockedApi.listHabitsForDate.mockResolvedValue([habitForDate]);
  mockedApi.toggleHabitCompletion.mockResolvedValue({ status: "checked" });
  mockedApi.getWeeklyReviewSuggestion.mockResolvedValue({
    start_date: "2024-01-01",
    end_date: "2024-01-07",
    summary: {
      start_date: "2024-01-01",
      end_date: "2024-01-07",
      total_amount: "12.00",
      by_category: [
        {
          category_key: "health",
          total_amount: "12.00",
        },
      ],
    },
    suggestion: "Keep it up.",
  });
});

describe("App", () => {
  it("toggles theme and persists preference", async () => {
    window.localStorage.setItem("lifeOpsTheme", "light");
    const user = userEvent.setup();

    render(<App />);

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
    });

    const toggle = screen.getByRole("button", {
      name: /switch to dark theme/i,
    });
    await user.click(toggle);

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem("lifeOpsTheme")).toBe("dark");
  });

  it("renders core data when API resolves", async () => {
    render(<App />);

    const categoriesSection = screen
      .getByRole("heading", { name: /categories/i })
      .closest("section");

    expect(
      await within(categoriesSection as HTMLElement).findByText(category.key)
    ).toBeInTheDocument();
    expect(await screen.findAllByText(label.label)).not.toHaveLength(0);
    expect(await screen.findByText(transaction.amount)).toBeInTheDocument();
    expect(await screen.findByText(habit.name)).toBeInTheDocument();
  });

  it("shows category load errors and retries", async () => {
    mockedApi.listCategories
      .mockRejectedValueOnce(new Error("Categories failed"))
      .mockResolvedValueOnce([category]);

    const user = userEvent.setup();
    render(<App />);

    const categoriesSection = screen
      .getByRole("heading", { name: /categories/i })
      .closest("section");

    expect(await screen.findByText("Categories failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(mockedApi.listCategories).toHaveBeenCalledTimes(2);
    });
    expect(
      await within(categoriesSection as HTMLElement).findByText(category.key)
    ).toBeInTheDocument();
  });
});
