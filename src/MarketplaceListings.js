import { useCallback, useSyncExternalStore } from "react";

const EMPTY = Object.freeze([]);
const SAVED_CHANGE = "ideahire:catalog-saves";
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const cache = new Map();

export function listingSaveKey(kind, userId) {
  if (kind !== "jobs" && kind !== "services") return null;
  if (userId != null && (typeof userId !== "string" || !UUID.test(userId))) return null;
  return `ideahire:saved:${kind}:${userId?.toLowerCase() ?? "guest"}`;
}

export function parseSavedListings(raw) {
  if (!raw) return EMPTY;
  try {
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return EMPTY;
    const ids = [...new Set(items.filter(id => typeof id === "string" && UUID.test(id)).map(id => id.toLowerCase()))];
    return ids.length ? ids : EMPTY;
  } catch { return EMPTY; }
}

function savedSnapshot(key) {
  if (!key || typeof window === "undefined") return EMPTY;
  const cached = cache.get(key);
  try {
    const raw = window.localStorage.getItem(key);
    if (cached?.raw === raw) return cached.ids;
    const ids = parseSavedListings(raw);
    cache.set(key, { raw, ids });
    return ids;
  } catch { return cached?.ids ?? EMPTY; }
}

export function useListingFavorites(kind, userId) {
  const key = listingSaveKey(kind, userId);
  const subscribe = useCallback(onChange => {
    if (!key) return () => {};
    const onStorage = event => {
      if (event.key === key || event.key === null) onChange();
    };
    const onLocal = event => { if (event.detail === key) onChange(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener(SAVED_CHANGE, onLocal);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SAVED_CHANGE, onLocal);
    };
  }, [key]);
  const snapshot = useCallback(() => savedSnapshot(key), [key]);
  const ids = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  const toggle = useCallback(value => {
    if (!key || typeof value !== "string" || !UUID.test(value)) return;
    const id = value.toLowerCase(), current = savedSnapshot(key);
    const next = current.includes(id) ? current.filter(item => item !== id) : [id, ...current];
    let raw = cache.get(key)?.raw ?? null;
    try {
      const encoded = JSON.stringify(next);
      window.localStorage.setItem(key, encoded);
      raw = encoded;
    } catch { /* in-memory saves for this visit */ }
    cache.set(key, { raw, ids: next });
    window.dispatchEvent(new CustomEvent(SAVED_CHANGE, { detail: key }));
  }, [key]);
  return { ids, toggle };
}

function amount(item, kind) {
  if (kind === "services" && item.price_mode === "custom") return null;
  const value = kind === "jobs" ? item.budget : item.base_price;
  const n = typeof value === "number" || (typeof value === "string" && value.trim()) ? Number(value) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function timestamp(item) {
  for (const value of [item.published_at, item.created_at]) {
    const date = typeof value === "string" && value ? Date.parse(value) : NaN;
    if (Number.isFinite(date)) return date;
  }
  return null;
}

function compareValues(a, b, descending) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return descending ? b - a : a - b;
}

export function selectMarketplaceListings(rows, { kind, order = "latest", savedOnly = false, savedIds = EMPTY, preferred = EMPTY } = {}) {
  const favorites = savedOnly ? new Set(savedIds) : null;
  const preferredCategories = order === "matched" ? new Set(preferred) : null;
  const byAmount = order === "price-low" || order === "price-high";
  return rows.flatMap(item => {
    if (favorites && !favorites.has(String(item.id).toLowerCase())) return [];
    return [{ item, date: timestamp(item), price: byAmount ? amount(item, kind) : null }];
  }).sort((a, b) => {
    if (preferredCategories) {
      const difference = Number(preferredCategories.has(b.item.category)) - Number(preferredCategories.has(a.item.category));
      if (difference) return difference;
    }
    if (byAmount) {
      const difference = compareValues(a.price, b.price, order === "price-high");
      if (difference) return difference;
    }
    return compareValues(a.date, b.date, order !== "oldest");
  }).map(({ item }) => item);
}
