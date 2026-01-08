import { useEffect, useState } from "react";

const BACKEND_URL = "http://localhost:8000/health";
const MCP_URL = "http://localhost:8001/health";

type HealthState = {
  ok: boolean | null;
  data: unknown | null;
  error: string | null;
};

const initialState: HealthState = {
  ok: null,
  data: null,
  error: null,
};

const statusLabel = (state: HealthState) =>
  state.ok ? "OK" : "ERROR";

const statusClass = (state: HealthState) =>
  state.ok ? "status ok" : "status error";

const useHealthCheck = (url: string) => {
  const [state, setState] = useState<HealthState>(initialState);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();

        if (!active) {
          return;
        }

        if (response.ok && data?.status === "ok") {
          setState({ ok: true, data, error: null });
          return;
        }

        setState({
          ok: false,
          data,
          error: "Unexpected response.",
        });
      } catch (error) {
        if (!active) {
          return;
        }

        setState({
          ok: false,
          data: null,
          error: error instanceof Error ? error.message : "Request failed.",
        });
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [url]);

  return state;
};

const HealthCard = ({
  label,
  url,
  state,
}: {
  label: string;
  url: string;
  state: HealthState;
}) => {
  const payload = state.data ? JSON.stringify(state.data, null, 2) : null;
  const detail = payload ?? state.error ?? "Loading...";

  return (
    <article className="status-card">
      <div className="status-line">
        <span className="label">{label}:</span>
        <span className={statusClass(state)}>{statusLabel(state)}</span>
      </div>
      <p className="hint">{url}</p>
      <pre className="payload">{detail}</pre>
    </article>
  );
};

function App() {
  const backend = useHealthCheck(BACKEND_URL);
  const mcp = useHealthCheck(MCP_URL);

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Attempt 1</p>
        <h1>Life Ops Planner (MVP)</h1>
        <p className="subtitle">
          Minimal health dashboard for backend + MCP.
        </p>
      </header>

      <section className="status-grid">
        <HealthCard label="Backend" url={BACKEND_URL} state={backend} />
        <HealthCard label="MCP" url={MCP_URL} state={mcp} />
      </section>
    </div>
  );
}

export default App;
