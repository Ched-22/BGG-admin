import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ToastProvider } from "./components/ui";
import { ThemeProvider, initTheme } from "./context/ThemeContext";
<<<<<<< HEAD
import { AuthProvider } from "./context/AuthContext";
=======
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43

initTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
<<<<<<< HEAD
        <AuthProvider>
          <App />
        </AuthProvider>
=======
        <App />
>>>>>>> b090358bc2a53c1c91f0c5f7f5db697eea38ad43
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>
);
