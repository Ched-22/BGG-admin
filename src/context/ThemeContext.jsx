import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext({
  theme: "dark",
});

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

export function initTheme() {
  applyTheme("dark");
}

export function ThemeProvider({ children }) {
  useEffect(() => {
    applyTheme("dark");
  }, []);

  return <ThemeContext.Provider value={{ theme: "dark" }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
