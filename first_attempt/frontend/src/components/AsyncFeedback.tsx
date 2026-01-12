type LoadingPlaceholderProps = {
  lines?: number;
  label?: string;
};

type ErrorNoticeProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export const LoadingPlaceholder = ({
  lines = 3,
  label = "Loading",
}: LoadingPlaceholderProps) => {
  const items = Array.from({ length: lines }, (_, index) => (
    <span className="skeleton-line" key={`skeleton-${index}`} />
  ));

  return (
    <div className="loading-stack" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {items}
    </div>
  );
};

export const ErrorNotice = ({
  message,
  onRetry,
  retryLabel = "Retry",
}: ErrorNoticeProps) => (
  <div className="notice error-notice" role="alert">
    <span>{message}</span>
    {onRetry ? (
      <button
        type="button"
        className="button-secondary button-compact"
        onClick={onRetry}
      >
        {retryLabel}
      </button>
    ) : null}
  </div>
);
