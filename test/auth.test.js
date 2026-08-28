import test from "node:test";
import assert from "node:assert/strict";

import {
  getLoginErrorMessage,
  getPasswordRecoveryRedirectUrl,
  isPasswordRecoveryUrl,
  normalizeEmail,
} from "../src/auth.js";

test("normalizes e-mail used by login and recovery", () => {
  assert.equal(
    normalizeEmail("  User@Example.COM "),
    "user@example.com"
  );
});

test("creates a recovery URL that loads the SPA root", () => {
  assert.equal(
    getPasswordRecoveryRedirectUrl(
      "https://ideahire.example"
    ),
    "https://ideahire.example/?recovery=1"
  );
});

test("recognizes supported password recovery callbacks", () => {
  assert.equal(
    isPasswordRecoveryUrl(
      "https://ideahire.example/?recovery=1"
    ),
    true
  );

  assert.equal(
    isPasswordRecoveryUrl(
      "https://ideahire.example/#access_token=a&type=recovery"
    ),
    true
  );

  assert.equal(
    isPasswordRecoveryUrl(
      "https://ideahire.example/reset-password?code=abc"
    ),
    true
  );

  assert.equal(
    isPasswordRecoveryUrl(
      "https://ideahire.example/?code=signup-code"
    ),
    false
  );
});

test("turns Supabase login errors into useful Polish messages", () => {
  assert.equal(
    getLoginErrorMessage({
      code: "invalid_credentials",
      message: "Invalid login credentials",
    }),
    "Nieprawidłowy adres e-mail lub hasło. Jeśli nie pamiętasz hasła, użyj opcji resetowania poniżej."
  );

  assert.match(
    getLoginErrorMessage({
      code: "email_not_confirmed",
      message: "Email not confirmed",
    }),
    /nie został jeszcze potwierdzony/i
  );
});
