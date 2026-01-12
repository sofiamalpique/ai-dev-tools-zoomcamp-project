import type { FormEvent } from "react";

import { ErrorNotice, LoadingPlaceholder } from "./AsyncFeedback";
import type { Habit, HabitForDate, HabitUnit, ListState } from "../types";

type HabitsSectionProps = {
  habits: ListState<Habit>;
  habitsForDate: ListState<HabitForDate>;
  habitsDate: string;
  onHabitsDateChange: (value: string) => void;
  habitToggleError: string | null;
  onRetryHabits: () => void;
  onRetryHabitsForDate: () => void;
  isAddHabitOpen: boolean;
  onOpenAddHabit: () => void;
  onCloseAddHabit: () => void;
  habitName: string;
  onHabitNameChange: (value: string) => void;
  habitStartDate: string;
  onHabitStartDateChange: (value: string) => void;
  habitEndDate: string;
  onHabitEndDateChange: (value: string) => void;
  habitNoEndDate: boolean;
  onHabitNoEndDateChange: (value: boolean) => void;
  habitInterval: string;
  onHabitIntervalChange: (value: string) => void;
  habitUnit: HabitUnit;
  onHabitUnitChange: (value: HabitUnit) => void;
  habitError: string | null;
  onHabitSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onHabitToggle: (habitId: string) => void;
};

const buildScheduleSummary = (habit: {
  start_date: string;
  end_date: string | null;
  interval: number;
  unit: HabitUnit;
}) => {
  const unitLabel = habit.interval === 1 ? habit.unit : `${habit.unit}s`;
  const repeatText =
    habit.interval === 1
      ? `Every ${habit.unit}`
      : `Every ${habit.interval} ${unitLabel}`;
  const endText = habit.end_date ? `Ends ${habit.end_date}` : "No end date";
  return `${repeatText} \u2022 Started ${habit.start_date} \u2022 ${endText}`;
};

const HabitsSection = ({
  habits,
  habitsForDate,
  habitsDate,
  onHabitsDateChange,
  habitToggleError,
  onRetryHabits,
  onRetryHabitsForDate,
  isAddHabitOpen,
  onOpenAddHabit,
  onCloseAddHabit,
  habitName,
  onHabitNameChange,
  habitStartDate,
  onHabitStartDateChange,
  habitEndDate,
  onHabitEndDateChange,
  habitNoEndDate,
  onHabitNoEndDateChange,
  habitInterval,
  onHabitIntervalChange,
  habitUnit,
  onHabitUnitChange,
  habitError,
  onHabitSubmit,
  onHabitToggle,
}: HabitsSectionProps) => {
  const dueHabitIds = habitsForDate.data
    ? new Set(habitsForDate.data.map((habit) => habit.id))
    : null;
  const notDueHabits =
    dueHabitIds && habits.data
      ? habits.data.filter((habit) => !dueHabitIds.has(habit.id))
      : null;

  return (
    <section className="data-section">
      <div className="section-header">
        <h2 className="section-title">Habits</h2>
        {!isAddHabitOpen && (
          <button
            className="add-habit-button"
            type="button"
            aria-label="Add habit"
            onClick={onOpenAddHabit}
          >
            +
          </button>
        )}
      </div>
      <div className="form-card">
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Date</span>
            <input
              type="date"
              value={habitsDate}
              onChange={(event) => onHabitsDateChange(event.target.value)}
            />
          </label>
        </div>
      </div>
      {isAddHabitOpen && (
        <form className="form-card" onSubmit={onHabitSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Habit name</span>
              <input
                type="text"
                value={habitName}
                onChange={(event) => onHabitNameChange(event.target.value)}
                placeholder="e.g. Drink water"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Starts</span>
              <input
                type="date"
                value={habitStartDate}
                onChange={(event) => onHabitStartDateChange(event.target.value)}
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
                  onChange={(event) =>
                    onHabitIntervalChange(event.target.value)
                  }
                />
                <select
                  className="inline-select"
                  value={habitUnit}
                  onChange={(event) =>
                    onHabitUnitChange(
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
                    onChange={(event) =>
                      onHabitNoEndDateChange(event.target.checked)
                    }
                  />
                  <span>Never</span>
                </label>
                <span className="inline-text">On</span>
                <input
                  className="inline-input"
                  type="date"
                  value={habitEndDate}
                  onChange={(event) => onHabitEndDateChange(event.target.value)}
                  disabled={habitNoEndDate}
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit">Add habit</button>
            <button
              type="button"
              className="button-secondary"
              onClick={onCloseAddHabit}
            >
              Cancel
            </button>
            {habitError && <span className="error-text">{habitError}</span>}
          </div>
        </form>
      )}
      <article className="status-card">
        {habitsForDate.loading ? (
          <LoadingPlaceholder label="Loading habits" lines={3} />
        ) : null}
        {habitsForDate.error ? (
          <ErrorNotice
            message={habitsForDate.error}
            onRetry={onRetryHabitsForDate}
          />
        ) : null}
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
                      onChange={() => onHabitToggle(habit.id)}
                      disabled={
                        habitsForDate.loading ||
                        !!habitsForDate.error ||
                        !habitsDate
                      }
                    />
                    <span className="item-primary">{habit.name}</span>
                  </label>
                  <p className="item-muted">{buildScheduleSummary(habit)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">No habits due for this date.</p>
          ))}
      </article>
      <details className="secondary-panel">
        <summary className="summary-line">
          Not due{notDueHabits ? ` (${notDueHabits.length})` : ""}
        </summary>
        <article className="status-card secondary-card">
          {habits.loading ? (
            <LoadingPlaceholder label="Loading habits" lines={2} />
          ) : null}
          {habits.error ? (
            <ErrorNotice message={habits.error} onRetry={onRetryHabits} />
          ) : null}
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
  );
};

export default HabitsSection;
