export const NEW_PASSWORD_MIN_LENGTH = 12;

export function getNewPasswordValidationMessage(value, english = false) {
  if (typeof value !== "string" || Array.from(value).length < NEW_PASSWORD_MIN_LENGTH) {
    return english ? "Use a password with at least 12 characters." : "Hasło musi mieć co najmniej 12 znaków.";
  }
  return "";
}

export function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getPasswordRecoveryRedirectUrl(origin) {
  // The root route handles the recovery marker before rendering Home.
  // Keeping the callback on the SPA entry point also works on hosts without
  // a configured history fallback for direct /reset-password requests.
  const url = new URL("/", origin);

  url.searchParams.set("recovery", "1");

  return url.toString();
}

export function isPasswordRecoveryUrl(href) {
  const url = new URL(href, "http://localhost");
  const hashParams = new URLSearchParams(
    url.hash.replace(/^#/, "")
  );

  const hasRecoveryMarker =
    url.searchParams.get("recovery") === "1";

  const hasRecoveryType =
    url.searchParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery";

  const isResetPath =
    url.pathname.replace(/\/$/, "") ===
    "/reset-password";

  const hasAuthCallback =
    url.searchParams.has("code") ||
    url.searchParams.has("token_hash") ||
    url.searchParams.has("error") ||
    hashParams.has("access_token") ||
    hashParams.has("error");

  return (
    hasRecoveryMarker ||
    hasRecoveryType ||
    (isResetPath && hasAuthCallback)
  );
}

export function getCaptchaErrorMessage(error, english = false) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  if (!code.includes("captcha") && !message.includes("captcha")) return "";
  return english
    ? "Security verification failed or expired. Please verify again. If verification is not visible, refresh this page."
    : "Weryfikacja bezpieczeństwa nie powiodła się lub wygasła. Potwierdź ją ponownie. Jeśli nie widzisz weryfikacji, odśwież stronę.";
}

export function getLoginErrorMessage(error, english = false) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "");
  const normalizedMessage = message.toLowerCase();
  const captchaMessage = getCaptchaErrorMessage(error, english);
  if (captchaMessage) return captchaMessage;

  if (
    code === "invalid_credentials" ||
    normalizedMessage.includes("invalid login credentials")
  ) {
    return "Nieprawidłowy adres e-mail lub hasło. Jeśli nie pamiętasz hasła, wybierz „Nie pamiętasz hasła?”.";
  }

  if (
    code === "email_not_confirmed" ||
    normalizedMessage.includes("email not confirmed")
  ) {
    return "Adres e-mail nie został jeszcze potwierdzony. Otwórz wiadomość rejestracyjną i potwierdź konto.";
  }

  if (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network")
  ) {
    return "Nie udało się połączyć z serwerem logowania. Sprawdź internet i spróbuj ponownie.";
  }

  return `Nie udało się zalogować: ${
    message || "Nieznany błąd"
  }`;
}
