let fallbackId: string | null = null;

const STORAGE_KEY = "reservationClientId";

const createId = () =>
  `client-${Math.random().toString(16).slice(2)}-${Date.now()}`;

export function getClientId(): string {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    if (!fallbackId) {
      fallbackId = createId();
    }
    return fallbackId;
  }

  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = createId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    if (!fallbackId) {
      fallbackId = createId();
    }
    return fallbackId;
  }
}
