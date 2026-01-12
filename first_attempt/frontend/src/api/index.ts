import { backendClient, mcpClient } from "./client";
import type {
  Category,
  Habit,
  HabitForDate,
  Label,
  Transaction,
  WeeklyReviewSuggestion,
} from "../types";

type HealthResponse = { status: string };

export const getBackendHealth = () =>
  backendClient.get<HealthResponse>("/health");

export const getMcpHealth = () => mcpClient.get<HealthResponse>("/health");

export const listCategories = () =>
  backendClient.get<Category[]>("/api/categories");

export const listLabels = () => backendClient.get<Label[]>("/api/labels");

export const createLabel = (payload: {
  label: string;
  category_id: string;
}) => backendClient.post<Label>("/api/labels", payload);

export const listTransactions = () =>
  backendClient.get<Transaction[]>("/api/transactions");

export const createTransaction = (payload: {
  amount: number;
  occurred_at: string;
  description: string | null;
  label_id: string;
}) => backendClient.post<Transaction>("/api/transactions", payload);

export const listHabits = () => backendClient.get<Habit[]>("/api/habits");

export const createHabit = (payload: {
  name: string;
  start_date: string;
  end_date: string | null;
  interval: number;
  unit: "day" | "week" | "month";
}) => backendClient.post<Habit>("/api/habits", payload);

export const listHabitsForDate = (date: string) =>
  backendClient.get<HabitForDate[]>(
    `/api/habits/for-date?date=${encodeURIComponent(date)}`
  );

export const toggleHabitCompletion = (habitId: string, payload: { date: string }) =>
  backendClient.post<{ status: string }>(
    `/api/habits/${habitId}/toggle`,
    payload
  );

export const getWeeklyReviewSuggestion = (startDate: string, endDate: string) =>
  backendClient.get<WeeklyReviewSuggestion>(
    `/api/reviews/weekly/suggestion?start_date=${encodeURIComponent(
      startDate
    )}&end_date=${encodeURIComponent(endDate)}`
  );
