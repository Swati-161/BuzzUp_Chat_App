import demoBackend from "./demoBackend";
import { isFirebaseConfigured } from "../firebase";

const MODE_KEY = "buzzup.mode";

export { isFirebaseConfigured };

export function isDemoEmail(email = "") {
  return email.trim().toLowerCase().endsWith("@buzzup.app");
}

export function savedMode() {
  try {
    const mode = localStorage.getItem(MODE_KEY);
    return mode === "firebase" && isFirebaseConfigured ? "firebase" : "demo";
  } catch {
    return "demo";
  }
}

export function saveMode(mode) {
  try { localStorage.setItem(MODE_KEY, mode); } catch { /* storage unavailable */ }
}

export async function getBackend(mode) {
  if (mode === "firebase" && isFirebaseConfigured) {
    const mod = await import("./firebaseBackend");
    return mod.default;
  }
  return demoBackend;
}
