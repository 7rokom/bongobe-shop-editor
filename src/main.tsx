import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/dataLayer"; // Initialize dataLayer globally

createRoot(document.getElementById("root")!).render(<App />);
