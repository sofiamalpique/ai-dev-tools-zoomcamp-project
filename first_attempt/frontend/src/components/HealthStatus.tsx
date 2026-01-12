import { ErrorNotice, LoadingPlaceholder } from "./AsyncFeedback";
import type { HealthState } from "../types";

type HealthCardProps = {
  label: string;
  url: string;
  state: HealthState;
  onRetry: () => void;
};

type HealthStatusProps = {
  backend: HealthState;
  mcp: HealthState;
  backendUrl: string;
  mcpUrl: string;
  onRetryBackend: () => void;
  onRetryMcp: () => void;
};

const statusLabel = (state: HealthState) => {
  if (state.ok === null) {
    return "CHECKING";
  }
  return state.ok ? "OK" : "ERROR";
};

const statusClass = (state: HealthState) => {
  if (state.ok === null) {
    return "status idle";
  }
  return state.ok ? "status ok" : "status error";
};

const HealthCard = ({ label, url, state, onRetry }: HealthCardProps) => {
  const payload = state.data ? JSON.stringify(state.data, null, 2) : null;
  const isLoading = state.ok === null && !state.error;
  const hasError = state.ok === false && !!state.error;

  return (
    <article className="status-card">
      <div className="status-line">
        <span className="label">{label}:</span>
        <span className={statusClass(state)}>{statusLabel(state)}</span>
      </div>
      <p className="hint">{url}</p>
      {isLoading ? (
        <LoadingPlaceholder label={`${label} loading`} lines={2} />
      ) : null}
      {hasError ? (
        <ErrorNotice
          message={state.error ?? "Service unavailable."}
          onRetry={onRetry}
        />
      ) : null}
      {!isLoading && !hasError ? (
        <pre className="payload">{payload ?? "OK"}</pre>
      ) : null}
    </article>
  );
};

const HealthStatus = ({
  backend,
  mcp,
  backendUrl,
  mcpUrl,
  onRetryBackend,
  onRetryMcp,
}: HealthStatusProps) => (
  <section className="status-grid">
    <HealthCard
      label="Backend"
      url={backendUrl}
      state={backend}
      onRetry={onRetryBackend}
    />
    <HealthCard
      label="MCP"
      url={mcpUrl}
      state={mcp}
      onRetry={onRetryMcp}
    />
  </section>
);

export default HealthStatus;
