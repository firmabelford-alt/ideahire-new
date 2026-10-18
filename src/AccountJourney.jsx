import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSitePreferences } from "./Preferences";
import "./AccountJourney.css";

// Animate the outgoing panel before changing the actual step. No delayed focus
// or second mounted copy of a form; reduced motion changes the step immediately.
export function useJourneyMotion(panelRef) {
  const [moving, setMoving] = useState(false);
  const [direction, setDirection] = useState("forward");
  const active = useRef(null);
  const mounted = useRef(true);
  const locked = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.cancel();
      active.current = null;
    };
  }, []);

  async function move(commit, nextDirection = "forward") {
    if (locked.current) return;
    locked.current = true;
    setDirection(nextDirection);
    setMoving(true);
    const panel = panelRef.current;
    try {
      if (panel?.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const animation = panel.animate([
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: `translateX(${nextDirection === "back" ? 18 : -18}px)` },
        ], { duration: 130, easing: "ease-in", fill: "forwards" });
        active.current = animation;
        await animation.finished;
      }
      if (mounted.current) commit();
    } catch { /* Unmount cancels an in-progress transition. */ }
    finally {
      active.current?.cancel();
      active.current = null;
      locked.current = false;
      if (mounted.current) setMoving(false);
    }
  }

  return { moving, direction, move };
}

const SUPPORT_EMAIL = "ideahire26@gmail.com";
const SUPPORT_LINK = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Pomoc przy rejestracji w IdeaHire")}`;
const EN_ROLES = {
  find_work: ["Find projects", "I work as a freelancer", "Find work, develop a profile and offer your own services."],
  hire_talent: ["Hire a specialist", "I commission projects", "Publish briefs and find the right people to deliver them."],
  both: ["Use both roles", "I work and hire", "Deliver your own projects and commission work from others."],
};

export function RegistrationRoleScreen({ options, value, onChange, onContinue }) {
  const en = useSitePreferences().language === "en";
  const t = (pl, english) => en ? english : pl;
  const titleRef = useRef(null), panelRef = useRef(null);
  const { moving, move } = useJourneyMotion(panelRef);
  const selected = options.find(option => option.value === value);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); titleRef.current?.focus({ preventScroll: true }); }, []);
  return <main id="ih59-registration" className="ih59-journey" data-moving={moving} data-no-translate="true">
    <header className="ih59-journey-header"><Link to="/" className="ih59-wordmark">IdeaHire</Link><ol className="ih59-registration-steps" aria-label={t("Etapy rejestracji", "Registration steps")}><li aria-current="step"><b>01</b>{t("Twój kierunek", "Your direction")}</li><li><b>02</b>{t("Twoje konto", "Your account")}</li></ol><Link to="/login" className="ih59-login-link">{t("Zaloguj się", "Sign in")}</Link></header>
    <div className="ih59-role-content" ref={panelRef}>
      <div className="ih59-role-heading"><span className="ih59-kicker">{t("Zacznijmy od Ciebie", "Let's start with you")}</span><h1 ref={titleRef} tabIndex={-1}>{t(<>Co sprowadza Cię<br />do IdeaHire?</>, <>What brings you<br />to IdeaHire?</>)}</h1><p>{t("Ułożymy pierwsze podpowiedzi pod Twój wybór. Zmienisz go w ustawieniach konta.", "Your choice shapes the first suggestions. You can change it in your account settings.")}</p></div>
      <fieldset className="ih59-role-options" disabled={moving}><legend className="ih59-sr-only">{t("Wybierz sposób korzystania z IdeaHire", "Choose how to use IdeaHire")}</legend>
        {options.map((option, index) => <label className="ih59-role-option" key={option.value} style={{ "--choice": index }}><input type="radio" name="registration-usage" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span className="ih59-role-number" aria-hidden="true">{option.icon}</span><span className="ih59-role-check" aria-hidden="true">✓</span><span className="ih59-role-eyebrow">{en ? EN_ROLES[option.value]?.[0] : option.eyebrow}</span><strong>{en ? EN_ROLES[option.value]?.[1] : option.title}</strong><span className="ih59-role-description">{en ? EN_ROLES[option.value]?.[2] : option.description}</span></label>)}
      </fieldset>
      <p className="ih59-role-status" role="status">{selected ? t(`Wybrano: ${selected.eyebrow.toLocaleLowerCase("pl-PL")}. Możesz przejść dalej.`, `Selected: ${EN_ROLES[selected.value]?.[0]}. You can continue.`) : t("Zaznacz jedną odpowiedź, aby przejść do formularza.", "Choose one option to continue to the account form.")}</p>
    </div>
    <footer className="ih59-journey-footer"><p>{t("Wybór służy dopasowaniu treści. Uprawnienia konta zależą od wieku; nie określa on formy zatrudnienia ani rozliczeń.", "This choice personalises content. Age determines account permissions; the choice does not determine employment or tax status.")}</p><button type="button" className="ih59-primary" disabled={!selected || moving} onClick={() => move(onContinue)}>{moving ? t("Przechodzimy dalej…", "Continuing…") : t("Przejdź do formularza", "Continue to the form")}<span aria-hidden="true">→</span></button></footer>
  </main>;
}

export function RegistrationSentScreen({ email, onResend, helpUrl = "/help/index.html" }) {
  const en = useSitePreferences().language === "en";
  const t = (pl, english) => en ? english : pl;
  const titleRef = useRef(null), request = useRef(false), mounted = useRef(true);
  const [sending, setSending] = useState(false), [retryAt, setRetryAt] = useState(0), [seconds, setSeconds] = useState(0);
  const [message, setMessage] = useState(null);
  useEffect(() => { mounted.current = true; titleRef.current?.focus({ preventScroll: true }); return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let timer;
    const update = () => {
      const left = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
      setSeconds(left);
      if (!left && timer) window.clearInterval(timer);
    };
    update();
    if (retryAt <= Date.now()) return;
    timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  async function resend() {
    if (request.current || retryAt > Date.now() || !onResend) return;
    request.current = true; setSending(true); setMessage(null); setRetryAt(Date.now() + 60000);
    try {
      await onResend();
      if (mounted.current) setMessage({ kind: "success" });
    } catch (error) {
      if (!mounted.current) return;
      const limited = Number(error?.status) === 429 || /rate_limit|over_email_send|too many/i.test(String(error?.code || error?.message || ""));
      setMessage({ kind: limited ? "limited" : "error" });
      if (!limited) setRetryAt(0);
    } finally { request.current = false; if (mounted.current) setSending(false); }
  }
  const feedback = message?.kind === "success" ? t("Jeśli konto czeka na potwierdzenie, link został ponownie wysłany. Sprawdź również folder spam.", "If the account is awaiting confirmation, the link has been sent again. Check your spam folder too.") : message?.kind === "limited" ? t("Odczekaj minutę przed kolejną próbą wysłania linku.", "Wait one minute before requesting another confirmation link.") : t("Nie udało się ponownie wysłać linku. Spróbuj jeszcze raz lub skontaktuj się z pomocą.", "The link could not be sent again. Retry or contact support.");
  return <main id="ih59-registration" className="ih59-journey ih59-email-confirmation" data-no-translate="true">
    <header className="ih59-journey-header"><Link className="ih59-wordmark" to="/">IdeaHire</Link><span>{t("Potwierdzenie adresu", "Email confirmation")}</span></header>
    <section className="ih59-confirmation-content"><span className="ih59-kicker">{t("Ostatni krok", "One last step")}</span><h1 ref={titleRef} tabIndex={-1}>{t("Sprawdź skrzynkę.", "Check your inbox.")}</h1><p>{t("Jeżeli adres ", "If ")}<strong>{email}</strong>{t(" może zostać zarejestrowany, otrzymasz wiadomość z linkiem do potwierdzenia konta.", " can be registered, you will receive an email with a confirmation link.")}</p><p>{t("Otwórz link w wiadomości. Jeśli konto już istnieje, przejdź do logowania lub odzyskaj hasło.", "Open the link in the email. If you already have an account, sign in or reset your password.")}</p>
      <div className="ih60-confirmation-actions"><Link className="ih59-primary" to="/login">{t("Przejdź do logowania", "Continue to sign in")}<span aria-hidden="true">→</span></Link><button type="button" className="ih60-secondary" disabled={sending || seconds > 0 || !onResend} onClick={resend}>{sending ? t("Wysyłanie…", "Sending…") : seconds > 0 ? t(`Wyślij ponownie za ${seconds} s`, `Resend in ${seconds}s`) : t("Wyślij link ponownie", "Resend confirmation link")}</button></div>
      {message && <p className="ih60-mail-feedback" role={message.kind === "success" ? "status" : "alert"}>{feedback}</p>}
      <div className="ih60-confirmation-help"><span>{t("Potrzebujesz pomocy?", "Need help?")}</span><a href={SUPPORT_LINK}>{t("Napisz do nas", "Email support")}<span aria-hidden="true">↗</span></a><a href={helpUrl}>{t("Centrum pomocy", "Help centre")}<span aria-hidden="true">↗</span></a></div>
    </section>
  </main>;
}

export function LimitedAccountNavigation({ name, initial, onLogout, helpUrl = "/help/index.html", showAssistant = true }) {
  const en = useSitePreferences().language === "en";
  const location = useLocation(), menu = useRef(null);
  const links = [["/", en ? "Home" : "Strona główna"], ["/jobs", en ? "Projects" : "Zlecenia"], ["/services", en ? "Services" : "Usługi"], ["/freelancers", en ? "Freelancers" : "Freelancerzy"], ["/calendar", en ? "Calendar" : "Kalendarz"], ...(showAssistant ? [["/lucyna", "Lucyna AI"]] : []), ["/account", en ? "My account" : "Moje konto"]];
  const close = () => menu.current?.removeAttribute("open");
  useEffect(close, [location.pathname]);
  const navLinks = () => links.map(([href, title]) => <NavLink to={href} end={href === "/" || href === "/account"} key={href} onClick={close} className={({ isActive }) => isActive ? "is-active" : ""}>{title}</NavLink>);
  return <header id="ih60-browse-header" className="ih60-browse-header" data-no-translate="true"><Link className="ih60-browse-logo" to="/">IdeaHire</Link><nav className="ih60-browse-desktop" aria-label={en ? "Main navigation" : "Główna nawigacja"}>{navLinks()}</nav><Link className="ih60-browse-avatar" to="/account" aria-label={en ? `Account: ${name}` : `Konto: ${name}`}>{initial || "I"}</Link><details ref={menu} className="ih60-browse-menu" onKeyDown={event => { if (event.key === "Escape") { close(); menu.current?.querySelector("summary")?.focus(); } }}><summary aria-label={en ? "Open navigation menu" : "Otwórz menu nawigacji"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></summary><nav aria-label={en ? "Navigation and support" : "Nawigacja i pomoc"}>{navLinks()}<a href={helpUrl}>{en ? "Help centre" : "Centrum pomocy"}</a><button type="button" onClick={onLogout}>{en ? "Sign out" : "Wyloguj się"}</button></nav></details><button type="button" className="ih60-browse-logout" onClick={onLogout}>{en ? "Sign out" : "Wyloguj się"}</button></header>;
}

export function LimitedAccountOverview({ fullAccessLabel, ageRestricted, settings, helpUrl = "/help/index.html", showAssistant = true }) {
  const en = useSitePreferences().language === "en";
  const t = (pl, english) => en ? english : pl;
  const tiles = [
    ["01", t("Zlecenia", "Projects"), t("Sprawdź zakresy prac, budżety i dziedziny.", "Explore briefs, budgets and fields of work."), "/jobs"],
    ["02", t("Usługi", "Services"), t("Poznaj gotowe oferty i ich zakres.", "Browse service offers and what they include."), "/services"],
    ["03", t("Freelancerzy", "Freelancers"), t("Zobacz profile i portfolio wykonawców.", "Explore specialists' profiles and portfolios."), "/freelancers"],
    ["04", showAssistant ? "Lucyna AI" : t("Kalendarz", "Calendar"), showAssistant ? t("Zapytaj o korzystanie z IdeaHire.", "Ask about using IdeaHire.") : t("Uporządkuj swoje własne terminy.", "Organise your own schedule."), showAssistant ? "/lucyna" : "/calendar"],
  ];
  return <main className="ih59-limited ih60-account" id="ih59-limited-account" data-no-translate="true">
    <header className="ih60-account-heading"><div><span className="ih59-kicker">{t("Twoje konto", "Your account")}</span><h1>{t("Moje IdeaHire", "My IdeaHire")}</h1><p>{t("Przeglądaj platformę i ustaw widok pod swoje zainteresowania.", "Browse the platform and make it fit your interests.")}</p></div><span className="ih60-account-badge">{t("Konto 16–17 lat", "Account ages 16–17")}</span></header>
    {ageRestricted && <div className="ih59-restriction-note" role="status">{t("Ta funkcja wymaga pełnego konta zgodnie z regulaminem. Pozostałe części platformy możesz przeglądać poniżej.", "This feature requires a full account under the platform terms. You can browse the rest of the platform below.")}</div>}
    <section className="ih60-account-welcome"><div><span>IDEAHIRE</span><h2>{t("Cała strona jest przed Tobą.", "The platform is yours to explore.")}</h2><p>{t("Przejdź na stronę główną albo wybierz katalog, który Cię interesuje.", "Go to the homepage or open the catalogue you want to explore.")}</p></div><Link to="/">{t("Przejdź do strony głównej", "Go to the homepage")}<span aria-hidden="true">↗</span></Link></section>
    <div className="ih60-account-layout"><section className="ih60-account-catalogues" aria-labelledby="ih60-browse-title"><h2 id="ih60-browse-title">{t("Przeglądaj IdeaHire", "Explore IdeaHire")}</h2><div className="ih60-account-tiles">{tiles.map(([number, title, copy, href]) => <Link key={href} to={href}><span><small>{number}</small><i aria-hidden="true">↗</i></span><h3>{title}</h3><p>{copy}</p></Link>)}</div></section>
      <aside className="ih60-account-aside"><section className="ih60-access-meta"><span>{t("Pełne konto od", "Full account from")}</span><strong>{fullAccessLabel}</strong><p>{t("To data Twoich 18. urodzin. Zachowasz obecne konto.", "Your 18th birthday. You will keep the same account.")}</p><details><summary>{t("Co wymaga pełnego konta?", "What requires a full account?")}</summary><ul><li>{t("Publikowanie i przyjmowanie płatnych zleceń.", "Publishing and accepting paid projects.")}</li><li>{t("Wiadomości dotyczące współpracy i zawieranie umów.", "Project messages and entering into contracts.")}</li><li>{t("Płatności, wypłaty i nowe spory.", "Payments, payouts and new disputes.")}</li></ul><Link to="/regulamin">{t("Zasady konta w regulaminie", "Account rules in the terms")}</Link></details></section>
      <section className="ih60-account-support"><h2>{t("Pomoc i prywatność", "Support & privacy")}</h2><Link to="/privacy-center">{t("Moje dane i prywatność", "My data & privacy")}<span aria-hidden="true">↗</span></Link><a href={helpUrl}>{t("Centrum pomocy", "Help centre")}<span aria-hidden="true">↗</span></a><a href={SUPPORT_LINK}>{t("Napisz do pomocy", "Email support")}<span aria-hidden="true">↗</span></a></section></aside>
    </div>
    <details className="ih60-account-settings"><summary>{t("Wygląd strony", "Site appearance")}<span>{t("Zmień szablon", "Change template")}</span></summary>{settings}</details>
  </main>;
}
