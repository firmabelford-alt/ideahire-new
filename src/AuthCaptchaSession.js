// Tokens live only in this form instance; Supabase performs the real validation.
export const AUTH_CAPTCHA_TOKEN_TTL_MS = 295_000;

export function createAuthCaptchaSession(enabled, now = () => Date.now()) {
  let token = null;
  let generation = 0;
  let consumed = false;

  return {
    generation: () => generation,
    ready: () => !enabled || Boolean(!consumed && token && now() < token.expiresAt),
    accept(value, expectedGeneration) {
      if (expectedGeneration !== generation || consumed) return false;
      const next = typeof value === "string" && value.length <= 2048 ? value : "";
      if (!next) {
        const changed = token !== null;
        token = null;
        return changed;
      }
      // Repeated callbacks must not extend the lifetime of the same token.
      if (token?.value === next) return false;
      token = { value: next, expiresAt: now() + AUTH_CAPTCHA_TOKEN_TTL_MS };
      return true;
    },
    consume() {
      if (!enabled) return undefined;
      if (consumed || !token || now() >= token.expiresAt) return null;
      const value = token.value;
      token = null;
      consumed = true;
      return value;
    },
    reset() {
      generation += 1;
      token = null;
      consumed = false;
    },
  };
}
