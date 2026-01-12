type Theme = "light" | "dark";

type HeaderProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

const Header = ({ theme, onToggleTheme }: HeaderProps) => {
  const isDark = theme === "dark";

  return (
    <header className="hero">
      <div className="hero-top">
        <div>
          <p className="eyebrow">Attempt 1</p>
          <h1>Life Ops Planner (MVP)</h1>
          <p className="subtitle">Minimal health dashboard for backend + MCP.</p>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          <span className="theme-toggle-label">Theme</span>
          <span className="theme-toggle-value">
            {isDark ? "Dark" : "Light"}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
