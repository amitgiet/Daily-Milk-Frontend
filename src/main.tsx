import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import "react-toastify/dist/ReactToastify.css";
import { registerSW } from "virtual:pwa-register";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToastContainer } from "@/components/ThemedToastContainer";
import { DisplayModeManager } from "@/components/DisplayModeManager";

registerSW({
  immediate: true,
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <DisplayModeManager />
    <App />
    <ThemedToastContainer />
  </ThemeProvider>,
);
