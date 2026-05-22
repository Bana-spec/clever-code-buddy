const KEY = "nexus.apikey.v1";

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setApiKey(k: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, k.trim());
}

export function clearApiKey() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function maskApiKey(k: string): string {
  if (k.length <= 10) return "•".repeat(k.length);
  return k.slice(0, 4) + "…" + "•".repeat(8) + k.slice(-4);
}
