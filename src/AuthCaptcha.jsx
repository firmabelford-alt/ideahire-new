import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createAuthCaptchaSession, AUTH_CAPTCHA_TOKEN_TTL_MS } from "./AuthCaptchaSession";
import "./AuthCaptcha.css";

const SITE_KEY = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
const ENABLED = import.meta.env.VITE_AUTH_TURNSTILE_ENABLED === "true";
const SCRIPT_ID = "ideahire-auth-turnstile";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let apiRequest = null;

function loadTurnstile() {
  if (typeof window.turnstile?.render === "function") return Promise.resolve(window.turnstile);
  if (apiRequest) return apiRequest;
  apiRequest = new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);
    const created = !script;
    if (created) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
    }
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      if (ok && typeof window.turnstile?.render === "function") resolve(window.turnstile);
      else {
        script.remove();
        apiRequest = null;
        reject(new Error("captcha_script_unavailable"));
      }
    };
    const loaded = () => finish(true);
    const failed = () => finish(false);
    const timer = window.setTimeout(failed, 15000);
    script.addEventListener("load", loaded);
    script.addEventListener("error", failed);
    if (created) document.head.appendChild(script);
  });
  return apiRequest;
}

function AuthCaptcha({ action, theme, language, generation, onToken, onRetry }) {
  const host = useRef(null);
  const [size, setSize] = useState("compact");
  const [status, setStatus] = useState("loading");
  const en = language === "en";

  useEffect(() => {
    const node = host.current;
    const measure = () => setSize((node?.parentElement?.clientWidth || 0) >= 300 ? "flexible" : "compact");
    measure();
    if (typeof ResizeObserver === "undefined" || !node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node.parentElement);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    let widget;
    let api;
    let expiryTimer;
    const clearToken = (nextStatus) => {
      if (!active) return;
      window.clearTimeout(expiryTimer);
      onToken("");
      setStatus(nextStatus);
    };
    onToken("");
    setStatus("loading");
    (SITE_KEY ? loadTurnstile() : Promise.reject(new Error("captcha_configuration_missing"))).then(loadedApi => {
      if (!active || !host.current) return;
      api = loadedApi;
      setStatus("waiting");
      widget = api.render(host.current, {
        sitekey: SITE_KEY,
        action,
        theme,
        language,
        size,
        "response-field": false,
        retry: "never",
        "refresh-expired": "auto",
        callback: value => {
          if (!active) return;
          if (typeof value !== "string" || !value || value.length > 2048) { clearToken("error"); return; }
          window.clearTimeout(expiryTimer);
          onToken(value);
          setStatus("verified");
          expiryTimer = window.setTimeout(() => clearToken("expired"), AUTH_CAPTCHA_TOKEN_TTL_MS);
        },
        "expired-callback": () => clearToken("expired"),
        "timeout-callback": () => clearToken("error"),
        "error-callback": () => { clearToken("error"); return true; },
      });
      if (widget === undefined || widget === null) throw new Error("captcha_widget_unavailable");
    }).catch(() => clearToken("error"));
    return () => {
      active = false;
      window.clearTimeout(expiryTimer);
      onToken("");
      if (api && widget !== undefined && widget !== null) {
        try { api.remove(widget); } catch { /* This widget may already have been removed. */ }
      }
    };
  }, [action, theme, language, generation, size, onToken]);

  const messages = en ? {
    loading: "Starting verification…", waiting: "Complete verification to send the form.",
    verified: "Verification complete.", expired: "Verification expired. Please verify again.",
    error: "Verification could not start. Please try again.",
  } : {
    loading: "Uruchamianie weryfikacji…", waiting: "Potwierdź weryfikację, aby wysłać formularz.",
    verified: "Weryfikacja zakończona.", expired: "Weryfikacja wygasła. Potwierdź ją ponownie.",
    error: "Nie udało się uruchomić weryfikacji. Spróbuj ponownie.",
  };

  return <section className="ih-auth-captcha" aria-label={en ? "Security verification" : "Weryfikacja bezpieczeństwa"} data-captcha-state={status} data-captcha-action={action}>
    <div ref={host} className="ih-auth-captcha-widget" data-size={size} />
    <p className="ih-auth-captcha-status" role="status" aria-live="polite">{messages[status]}</p>
    {(status === "error" || status === "expired") && <button className="ih-auth-captcha-retry" type="button" onClick={onRetry}>{en ? "Retry verification" : "Ponów weryfikację"}</button>}
  </section>;
}

export function useAuthCaptcha(action, { theme = "light", language = "pl" } = {}) {
  const enabled = ENABLED;
  const widgetTheme = theme === "dark" ? "dark" : "light";
  const widgetLanguage = language === "en" ? "en" : "pl";
  const session = useMemo(() => createAuthCaptchaSession(enabled), [enabled, action, widgetTheme, widgetLanguage]);
  const [, redraw] = useReducer(value => value + 1, 0);
  const generation = session.generation();
  const accept = useCallback(value => {
    if (session.accept(value, generation)) redraw();
  }, [session, generation]);
  const reset = useCallback(() => { session.reset(); redraw(); }, [session]);
  const consume = useCallback(() => { const value = session.consume(); redraw(); return value; }, [session]);

  return {
    ready: session.ready(), consume, reset,
    english: widgetLanguage === "en",
    message: widgetLanguage === "en" ? "Complete security verification and try again." : "Potwierdź weryfikację bezpieczeństwa i spróbuj ponownie.",
    field: enabled ? <AuthCaptcha key={`${action}:${widgetTheme}:${widgetLanguage}`} action={action} theme={widgetTheme} language={widgetLanguage} generation={generation} onToken={accept} onRetry={reset} /> : null,
  };
}
