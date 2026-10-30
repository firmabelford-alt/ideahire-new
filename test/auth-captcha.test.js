import test from "node:test";
import assert from "node:assert/strict";
import { createAuthCaptchaSession, AUTH_CAPTCHA_TOKEN_TTL_MS } from "../src/AuthCaptchaSession.js";

test("unconfigured CAPTCHA preserves existing authentication without a fabricated token", () => {
  const session = createAuthCaptchaSession(false);
  assert.equal(session.ready(), true);
  assert.equal(session.consume(), undefined);
});

test("configured authentication requires verification before every request", () => {
  const session = createAuthCaptchaSession(true);
  assert.equal(session.ready(), false);
  assert.equal(session.consume(), null);
  session.accept("verified-token", session.generation());
  assert.equal(session.ready(), true);
  assert.equal(session.consume(), "verified-token");
  assert.equal(session.ready(), false);
  assert.equal(session.consume(), null);
  assert.equal(session.accept("duplicate-callback", session.generation()), false);
});

test("a new attempt rejects callbacks from a removed widget", () => {
  const session = createAuthCaptchaSession(true);
  const oldGeneration = session.generation();
  session.accept("first-token", oldGeneration);
  session.consume();
  session.reset();
  assert.equal(session.accept("late-old-token", oldGeneration), false);
  assert.equal(session.ready(), false);
  session.accept("new-token", session.generation());
  assert.equal(session.consume(), "new-token");
});

test("expiry is enforced even when a background tab has delayed its timer", () => {
  let now = 0;
  const session = createAuthCaptchaSession(true, () => now);
  session.accept("time-limited-token", session.generation());
  now = AUTH_CAPTCHA_TOKEN_TTL_MS;
  assert.equal(session.ready(), false);
  assert.equal(session.consume(), null);
});

test("repeated callbacks cannot extend an issued token's lifetime", () => {
  let now = 0;
  const session = createAuthCaptchaSession(true, () => now);
  session.accept("same-token", session.generation());
  now = AUTH_CAPTCHA_TOKEN_TTL_MS - 1;
  assert.equal(session.accept("same-token", session.generation()), false);
  now += 1;
  assert.equal(session.consume(), null);
});

test("expiry and malformed callbacks invalidate verification", () => {
  const session = createAuthCaptchaSession(true);
  session.accept("valid-token", session.generation());
  session.accept("", session.generation());
  assert.equal(session.consume(), null);
  session.accept("valid-token", session.generation());
  session.accept("x".repeat(2049), session.generation());
  assert.equal(session.ready(), false);
});
