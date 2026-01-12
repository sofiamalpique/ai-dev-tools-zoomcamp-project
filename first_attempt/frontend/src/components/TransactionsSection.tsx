import type { FormEvent } from "react";

import { ErrorNotice, LoadingPlaceholder } from "./AsyncFeedback";
import type { Label, ListState, Transaction } from "../types";

type TransactionsSectionProps = {
  labels: ListState<Label>;
  transactions: ListState<Transaction>;
  transactionLabelId: string;
  transactionAmount: string;
  transactionOccurredAt: string;
  transactionDescription: string;
  transactionError: string | null;
  onRetryTransactions: () => void;
  onTransactionLabelChange: (value: string) => void;
  onTransactionAmountChange: (value: string) => void;
  onTransactionOccurredAtChange: (value: string) => void;
  onTransactionDescriptionChange: (value: string) => void;
  onTransactionSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const TransactionsSection = ({
  labels,
  transactions,
  transactionLabelId,
  transactionAmount,
  transactionOccurredAt,
  transactionDescription,
  transactionError,
  onRetryTransactions,
  onTransactionLabelChange,
  onTransactionAmountChange,
  onTransactionOccurredAtChange,
  onTransactionDescriptionChange,
  onTransactionSubmit,
}: TransactionsSectionProps) => {
  const labelLookup = new Map(
    labels.data?.map((label) => [label.id, label.label]) ?? []
  );

  return (
    <section className="data-section">
      <h2 className="section-title">Transactions</h2>
      <form className="form-card" onSubmit={onTransactionSubmit}>
        <div className="form-grid transaction-grid">
          <label className="form-field">
            <span className="form-label">Label</span>
            <select
              value={transactionLabelId}
              onChange={(event) =>
                onTransactionLabelChange(event.target.value)
              }
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
              onChange={(event) => onTransactionAmountChange(event.target.value)}
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
                onTransactionOccurredAtChange(event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span className="form-label">Description</span>
            <input
              type="text"
              value={transactionDescription}
              onChange={(event) =>
                onTransactionDescriptionChange(event.target.value)
              }
              placeholder="Optional note"
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={labels.loading || !!labels.error}>
            Add transaction
          </button>
          {transactionError && (
            <span className="error-text">{transactionError}</span>
          )}
        </div>
      </form>
      <article className="status-card">
        {transactions.loading ? (
          <LoadingPlaceholder label="Loading transactions" lines={3} />
        ) : null}
        {transactions.error ? (
          <ErrorNotice
            message={transactions.error}
            onRetry={onRetryTransactions}
          />
        ) : null}
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
  );
};

export default TransactionsSection;
