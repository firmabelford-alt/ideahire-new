/* P65 — recoverable OAuth and in-memory registration across legal documents. */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandSignature } from "./Brand";
import { useSitePreferences } from "./Preferences";
import "./AuthFlow.css";

export function useGoogleAuth(client, onError) {
  const en = useSitePreferences().language === "en";
  const [pending, setPending] = useState(false);
  const state = useRef({ attempt: 0, pending: false, alive: true, timer: 0 });
  const report = useRef(onError);
  report.current = onError;
  const cancel = useCallback(() => {
    const current = state.current;
    current.attempt += 1;
    current.pending = false;
    window.clearTimeout(current.timer);
    if (current.alive) setPending(false);
  }, []);
  useEffect(() => {
    state.current.alive = true;
    // Returning from Google's page can restore the previous React tree from BFCache.
    const restore = event => { if (event.persisted) cancel(); };
    window.addEventListener("pageshow", restore);
    return () => {
      state.current.alive = false;
      cancel();
      window.removeEventListener("pageshow", restore);
    };
  }, [cancel]);
  const start = useCallback(async redirectTo => {
    const current = state.current;
    if (current.pending) return;
    const attempt = ++current.attempt;
    current.pending = true;
    setPending(true);
    const valid = () => current.alive && current.attempt === attempt;
    current.timer = window.setTimeout(() => {
      if (!valid()) return;
      cancel();
      report.current?.(new Error(en ? "Google sign-in did not open. Try again or use email." : "Nie udało się otworzyć logowania Google. Spróbuj ponownie albo użyj e-maila."));
    }, 10000);
    try {
      const { data, error } = await client.auth.signInWithOAuth({ provider: "google", options: { redirectTo, skipBrowserRedirect: true } });
      if (!valid()) return;
      if (error) throw error;
      const preparationError = en ? "Google sign-in could not be prepared. Try again or use email." : "Nie udało się przygotować logowania Google. Spróbuj ponownie albo użyj e-maila.";
      let target;
      try { target = new URL(data?.url || ""); } catch { throw new Error(preparationError); }
      if (!["https:", "http:"].includes(target.protocol) || target.username || target.password) throw new Error(preparationError);
      // Release the form before navigation. A cancelled/stale request never redirects.
      window.clearTimeout(current.timer);
      current.pending = false;
      setPending(false);
      window.location.assign(target.href);
    } catch (error) {
      if (valid()) report.current?.(error);
    } finally {
      if (valid()) cancel();
    }
  }, [client, cancel, en]);
  return { pending, start, cancel };
}

export function GooglePendingNotice({ pending, onCancel }) {
  const en = useSitePreferences().language === "en";
  if (!pending) return null;
  return <p className="ih65-google-pending" role="status">{en ? "You can choose another sign-in method." : "Możesz wybrać inną metodę logowania."}<button type="button" onClick={onCancel}>{en ? "Cancel and use email" : "Anuluj i użyj e-maila"}</button></p>;
}

const RegistrationContext = createContext(null);
const LEGAL_PATHS = new Set(["/regulamin", "/polityka-prywatnosci", "/polityka-cookies"]);

export function RegistrationDraftProvider({ children }) {
  const [draft, setDraft] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== "/register" && !LEGAL_PATHS.has(pathname)) setDraft(null);
  }, [pathname]);
  const value = useMemo(() => ({ draft, saveDraft: setDraft }), [draft]);
  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistrationDraft() {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error("RegistrationDraftProvider is required");
  return context;
}

export function RegistrationDocumentLink({ to, id, snapshot, children }) {
  const navigate = useNavigate();
  const { saveDraft } = useRegistrationDraft();
  return <Link to={to} id={id} data-preserve-router-state="true" onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const authReturn = { pathname: "/register", focusId: id, scrollY: Math.max(0, window.scrollY) };
    saveDraft({ ...snapshot, returnPosition: authReturn });
    navigate(to, { state: { authReturn } });
  }}>{children}</Link>;
}

export function useRegistrationDocumentReturn() {
  const { state } = useLocation();
  const candidate = state?.authReturn;
  const returning = candidate?.pathname === "/register";
  return { returning, to: returning ? "/register" : "/", state: returning ? { authReturn: candidate } : undefined };
}

export function announceLoginSuccess() {
  window.dispatchEvent(new Event("ih:login-success"));
}

export function LoginOpening() {
  const en = useSitePreferences().language === "en";
  const [active, setActive] = useState(false);
  useEffect(() => {
    const open = () => { if (!document.getElementById("ih-brand-boot")) setActive(true); };
    window.addEventListener("ih:login-success", open);
    return () => window.removeEventListener("ih:login-success", open);
  }, []);
  useEffect(() => {
    if (!active) return;
    const root = document.getElementById("root"), hadInert = root?.hasAttribute("inert");
    root?.setAttribute("inert", "");
    const duration = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 180 : 760;
    const timer = window.setTimeout(() => setActive(false), duration);
    return () => { window.clearTimeout(timer); if (!hadInert) root?.removeAttribute("inert"); };
  }, [active]);
  return active ? createPortal(<div id="ih65-login-opening" role="status" aria-label={en ? "IdeaHire — signed in" : "IdeaHire — zalogowano"}>
    <div className="ih65-login-panel ih65-login-top" aria-hidden="true"/>
    <div className="ih65-login-panel ih65-login-bottom" aria-hidden="true"/>
    <div className="ih65-login-brand"><BrandSignature/></div>
  </div>, document.body) : null;
}
