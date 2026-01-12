import type { FormEvent } from "react";

import { ErrorNotice, LoadingPlaceholder } from "./AsyncFeedback";
import type { Category, Label, ListState } from "../types";

type CategoriesLabelsProps = {
  categories: ListState<Category>;
  labels: ListState<Label>;
  labelName: string;
  labelCategoryId: string;
  labelError: string | null;
  onRetryCategories: () => void;
  onRetryLabels: () => void;
  onLabelNameChange: (value: string) => void;
  onLabelCategoryIdChange: (value: string) => void;
  onLabelSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const CategoriesLabelsSection = ({
  categories,
  labels,
  labelName,
  labelCategoryId,
  labelError,
  onRetryCategories,
  onRetryLabels,
  onLabelNameChange,
  onLabelCategoryIdChange,
  onLabelSubmit,
}: CategoriesLabelsProps) => {
  const categoryLookup = new Map(
    categories.data?.map((category) => [category.id, category.key]) ?? []
  );

  return (
    <>
      <section className="data-section">
        <h2 className="section-title">Categories</h2>
        <article className="status-card">
          {categories.loading ? (
            <LoadingPlaceholder label="Loading categories" lines={3} />
          ) : null}
          {categories.error ? (
            <ErrorNotice
              message={categories.error}
              onRetry={onRetryCategories}
            />
          ) : null}
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
        <form className="form-card" onSubmit={onLabelSubmit}>
          <div className="form-grid">
            <label className="form-field">
              <span className="form-label">Label</span>
              <input
                type="text"
                value={labelName}
                onChange={(event) => onLabelNameChange(event.target.value)}
                placeholder="e.g. Netflix"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Category</span>
              <select
                value={labelCategoryId}
                onChange={(event) => onLabelCategoryIdChange(event.target.value)}
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
          {labels.loading ? (
            <LoadingPlaceholder label="Loading labels" lines={3} />
          ) : null}
          {labels.error ? (
            <ErrorNotice message={labels.error} onRetry={onRetryLabels} />
          ) : null}
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
    </>
  );
};

export default CategoriesLabelsSection;
