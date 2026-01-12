export type HealthState = {
  ok: boolean | null;
  data: unknown | null;
  error: string | null;
};

export type ListState<T> = {
  data: T[] | null;
  loading: boolean;
  error: string | null;
};

export type Category = {
  id: string;
  key: string;
  created_at: string;
};

export type Label = {
  id: string;
  label: string;
  category_id: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  amount: string;
  occurred_at: string;
  description: string | null;
  label_id: string;
  created_at: string;
};

export type HabitUnit = "day" | "week" | "month";

export type HabitSchedule = {
  start_date: string;
  end_date: string | null;
  interval: number;
  unit: HabitUnit;
};

export type HabitForDate = HabitSchedule & {
  id: string;
  name: string;
  checked: boolean;
};

export type Habit = HabitSchedule & {
  id: string;
  name: string;
  created_at: string;
};

export type WeeklyReviewCategory = {
  category_key: string;
  total_amount: string;
};

export type WeeklyReviewSummary = {
  start_date: string;
  end_date: string;
  total_amount: string;
  by_category: WeeklyReviewCategory[];
};

export type WeeklyReviewSuggestion = {
  start_date: string;
  end_date: string;
  summary: WeeklyReviewSummary;
  suggestion: string;
};
