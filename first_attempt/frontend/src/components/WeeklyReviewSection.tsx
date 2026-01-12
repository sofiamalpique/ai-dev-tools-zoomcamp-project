import type { FormEvent } from "react";

import { ErrorNotice, LoadingPlaceholder } from "./AsyncFeedback";
import type { WeeklyReviewSuggestion } from "../types";

type WeeklyReviewProps = {
  reviewStart: string;
  reviewEnd: string;
  reviewLoading: boolean;
  reviewError: string | null;
  reviewData: WeeklyReviewSuggestion | null;
  onReviewStartChange: (value: string) => void;
  onReviewEndChange: (value: string) => void;
  onReviewSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReviewRetry: () => void;
};

const WeeklyReviewSection = ({
  reviewStart,
  reviewEnd,
  reviewLoading,
  reviewError,
  reviewData,
  onReviewStartChange,
  onReviewEndChange,
  onReviewSubmit,
  onReviewRetry,
}: WeeklyReviewProps) => (
  <section className="data-section">
    <h2 className="section-title">Weekly Review</h2>
    <form className="form-card" onSubmit={onReviewSubmit}>
      <div className="form-grid">
        <label className="form-field">
          <span className="form-label">Start date</span>
          <input
            type="date"
            value={reviewStart}
            onChange={(event) => onReviewStartChange(event.target.value)}
          />
        </label>
        <label className="form-field">
          <span className="form-label">End date</span>
          <input
            type="date"
            value={reviewEnd}
            onChange={(event) => onReviewEndChange(event.target.value)}
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" disabled={reviewLoading}>
          {reviewLoading ? "Loading..." : "Get weekly review"}
        </button>
      </div>
    </form>
    <article className="status-card">
      {reviewLoading ? (
        <LoadingPlaceholder label="Loading weekly review" lines={4} />
      ) : reviewError ? (
        <ErrorNotice message={reviewError} onRetry={onReviewRetry} />
      ) : reviewData ? (
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
                    <span className="item-primary">{entry.category_key}</span>
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
);

export default WeeklyReviewSection;
