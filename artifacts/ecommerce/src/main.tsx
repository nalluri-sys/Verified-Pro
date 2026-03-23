import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const configuredApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)
	?.trim()
	.replace(/\/$/, "");

if (configuredApiBase) {
	(globalThis as typeof globalThis & { __API_BASE_URL__?: string }).__API_BASE_URL__ = configuredApiBase;
}

createRoot(document.getElementById("root")!).render(<App />);
