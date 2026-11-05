import assert from "node:assert/strict";
import { test } from "node:test";
import { listingSaveKey, parseSavedListings, selectMarketplaceListings } from "../src/MarketplaceListings.js";

const older = { id: "older", created_at: "2026-11-01", base_price: "220", budget: 650, category: "design" };
const newer = { id: "newer", created_at: "2026-11-03", base_price: 120, budget: 900, category: "code" };
const quoted = { id: "quoted", created_at: "2026-11-04", price_mode: "custom", base_price: 0 };
const unknown = { id: "unknown", created_at: "missing", base_price: null, budget: "" };
const names = rows => rows.map(row => row.id);

test("oldest and newest use the listing date and put unavailable dates last", () => {
  const rows = [newer, unknown, older];
  assert.deepEqual(names(selectMarketplaceListings(rows, { kind: "services", order: "oldest" })), ["older", "newer", "unknown"]);
  assert.deepEqual(names(selectMarketplaceListings(rows, { kind: "services" })), ["newer", "older", "unknown"]);
  assert.deepEqual(names(rows), ["newer", "unknown", "older"]);
});

test("a quote and a missing price do not become zero-cost services when sorting", () => {
  const rows = [unknown, newer, quoted, older];
  assert.deepEqual(names(selectMarketplaceListings(rows, { kind: "services", order: "price-low" })), ["newer", "older", "quoted", "unknown"]);
  assert.deepEqual(names(selectMarketplaceListings(rows, { kind: "services", order: "price-high" })), ["older", "newer", "quoted", "unknown"]);
});

test("saved jobs keep the chosen budget order and do not revive absent listings", () => {
  const rows = [newer, older, unknown];
  assert.deepEqual(names(selectMarketplaceListings(rows, {
    kind: "jobs", order: "price-low", savedOnly: true, savedIds: ["newer", "older", "expired"],
  })), ["older", "newer"]);
  assert.deepEqual(names(selectMarketplaceListings(rows, {
    kind: "jobs", order: "matched", preferred: ["design"],
  })), ["older", "newer", "unknown"]);
});

test("local saves are separate by account and catalogue and ignore malformed records", () => {
  const a = "d9d81709-a602-4c54-8b34-f2a15a76246e";
  const b = "17558442-cd23-4072-afec-caa7aa65ba42";
  assert.notEqual(listingSaveKey("services", a), listingSaveKey("jobs", a));
  assert.notEqual(listingSaveKey("services", a), listingSaveKey("services", b));
  assert.notEqual(listingSaveKey("services", a), listingSaveKey("services", null));
  assert.equal(listingSaveKey("services", "broken"), null);
  assert.deepEqual(parseSavedListings(JSON.stringify([a, a.toUpperCase(), false, "oops", b])), [a, b]);
  assert.deepEqual(parseSavedListings("{invalid"), []);
});
