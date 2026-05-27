import { Icon } from "../ui";
import { useTheme } from "../../context/ThemeContext";

function ThemeToggle({ className = "", showLabel = false, size = 18 }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle icon-btn ${className}`.trim()}
      onClick={toggleTheme}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      aria-pressed={!isDark}
    >
      {isDark ? <Icon.Sun size={size} /> : <Icon.Moon size={size} />}
      {showLabel ? (
        <span className="theme-toggle-label">{isDark ? "Claro" : "Escuro"}</span>
      ) : null}
    </button>
  );
}

export default ThemeToggle;
