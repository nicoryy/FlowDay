const KEY = "flowday_api_url";
const EVENT = "flowday_api_url_changed";

export function getStoredApiUrl(): string | null {
  return localStorage.getItem(KEY);
}

export function setStoredApiUrl(url: string): void {
  localStorage.setItem(KEY, url.replace(/\/+$/, ""));
  window.dispatchEvent(new Event(EVENT));
}

export function clearStoredApiUrl(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function onApiUrlChange(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}
