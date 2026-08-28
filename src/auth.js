export function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function getPasswordRecoveryRedirectUrl(origin) {
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

export function getLoginErrorMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "");
  const normalizedMessage = message.toLowerCase();

  if (
    code === "invalid_credentials" ||
    normalizedMessage.includes("invalid login credentials")
  ) {
    return "Nieprawidłowy adres e-mail lub hasło. Jeśli nie pamiętasz hasła, użyj opcji resetowania poniżej.";
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
