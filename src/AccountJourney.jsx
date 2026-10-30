import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BrandSignature } from "./Brand";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSitePreferences } from "./Preferences";
import "./AccountJourney.css";

// Animate the outgoing panel before changing the actual step. No delayed focus
// or second mounted copy of a form; reduced motion changes the step immediately.
export function useJourneyMotion(panelRef, { duration = 130, easing = "ease-in" } = {}) {
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
        ], { duration, easing, fill: "forwards" });
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
  const { moving, move } = useJourneyMotion(panelRef, { duration: 320, easing: "ease-in-out" });
  const [question, setQuestion] = useState(0);
  const [startChoice, setStartChoice] = useState("");
  const selected = options.find(option => option.value === value);
  const starts = [
    { value: "ready", title: t("Od razu do konkretów", "Straight to the point"), description: t("Mam plan i wiem, od czego chcę zacząć.", "I have a plan and know where I want to start."), feedback: t("Po utworzeniu konta możesz przejść do projektów, usług i swojego profilu.", "Once your account is ready, you can explore projects, services and your profile.") },
    { value: "compare", title: t("Pomóż mi wybrać kierunek", "Help me find a direction"), description: t("Chcę porównać możliwości i znaleźć coś dla siebie.", "I want to compare the options and find what suits me."), feedback: t("Zacznij od porównania opisów usług, profili i zleceń. Wybór należy do Ciebie.", "Start by comparing services, profiles and project briefs. The choice is yours.") },
    { value: "explore", title: t("Najpierw się rozejrzę", "Let me explore first"), description: t("Wolę poznać platformę we własnym tempie.", "I prefer to get to know the platform at my own pace."), feedback: t("Możesz zacząć od przeglądania. Samo utworzenie konta niczego nie publikuje.", "You can start by browsing. Creating an account does not publish anything.") },
  ];
  const choices = question === 0 ? options : starts;
  const answer = question === 0 ? value : startChoice;
  const heading = question === 0 ? t("Jak chcesz działać?", "How would you like to use IdeaHire?") : t("Co ułatwi Ci start?", "What would help you get started?");
  const status = question === 0 ? (selected ? t(`Wybrano: ${selected.eyebrow}.`, `Selected: ${EN_ROLES[selected.value]?.[0]}.`) : t("Wybierz jedną odpowiedź.", "Choose one option.")) : starts.find(option => option.value === startChoice)?.feedback;
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); titleRef.current?.focus({ preventScroll: true }); }, [question]);
  const continueJourney = () => {
    if (!selected || moving) return;
    move(question === 0 ? () => setQuestion(1) : onContinue);
  };
  return <main id="ih59-registration" className="ih59-journey" data-guided-onboarding="true" data-question={question} data-moving={moving} data-no-translate="true">
    <header className="ih59-journey-header"><Link to="/" className="ih59-wordmark"><BrandSignature /></Link><ol className="ih59-registration-steps" aria-label={t("Etapy rejestracji", "Registration steps")}><li aria-current="step"><b>01</b>{t("Twój kierunek", "Your direction")}</li><li><b>02</b>{t("Twoje konto", "Your account")}</li></ol><Link to="/login" className="ih59-login-link">{t("Zaloguj się", "Sign in")}</Link></header>
    <div className="ih59-role-content" ref={panelRef} key={question}>
      <div className="ih59-role-heading"><span className="ih59-kicker">{t(`Poznajmy się · ${question + 1} z 2`, `Let's get acquainted · ${question + 1} of 2`)}</span><h1 ref={titleRef} tabIndex={-1}>{heading}</h1><p>{question === 0 ? t("Zacznijmy od Twojego planu. Dopasujemy pierwsze podpowiedzi.", "Let's start with your plan and tailor the first suggestions.") : t("Jedna krótka wskazówka na początek. To pytanie możesz pominąć.", "One quick pointer to get you started. You can skip this question.")}</p></div>
      <fieldset className="ih59-role-options" disabled={moving}><legend className="ih59-sr-only">{heading}</legend>
        {choices.map((option, index) => <label className="ih59-role-option" key={option.value} style={{ "--choice": index }}><input type="radio" name={question === 0 ? "registration-usage" : "registration-start"} value={option.value} checked={answer === option.value} onChange={() => { if (question === 0) { onChange(option.value); setStartChoice(""); } else setStartChoice(option.value); }} /><span className="ih59-role-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className="ih59-role-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span><strong>{question === 0 ? (en ? EN_ROLES[option.value]?.[0] : option.eyebrow) : option.title}</strong><span className="ih59-role-description">{question === 0 && en ? EN_ROLES[option.value]?.[2] : option.description}</span></label>)}
      </fieldset>
      <p className={question === 0 ? "ih59-sr-only" : "ih-registration-start-feedback"} role="status" aria-live="polite">{status || " "}</p>
    </div>
    <footer className="ih59-journey-footer"><p>{t("Wybór służy dopasowaniu treści. Uprawnienia konta zależą od wieku; nie określa on formy zatrudnienia ani rozliczeń.", "This choice personalises content. Age determines account permissions; the choice does not determine employment or tax status.")}</p><div className="ih-registration-actions">{question > 0 && <button type="button" className="ih-registration-back" disabled={moving} onClick={() => move(() => setQuestion(0), "back")}>{t("Wstecz", "Back")}</button>}<button type="button" className="ih59-primary" disabled={!selected || moving} onClick={continueJourney}>{moving ? (question === 0 ? t("Przechodzimy dalej…", "Continuing…") : t("Przechodzimy do tworzenia konta…", "Opening your account form…")) : question === 0 ? t("Jeszcze jedno pytanie", "One more question") : t("Przejdźmy do tworzenia konta", "Let's create your account")}</button></div></footer>
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
    <header className="ih59-journey-header"><Link className="ih59-wordmark" to="/"><BrandSignature /></Link><span>{t("Potwierdzenie adresu", "Email confirmation")}</span></header>
    <section className="ih59-confirmation-content"><span className="ih59-kicker">{t("Ostatni krok", "One last step")}</span><h1 ref={titleRef} tabIndex={-1}>{t("Sprawdź skrzynkę.", "Check your inbox.")}</h1><p>{t("Jeżeli adres ", "If ")}<strong>{email}</strong>{t(" może zostać zarejestrowany, otrzymasz wiadomość z linkiem do potwierdzenia konta.", " can be registered, you will receive an email with a confirmation link.")}</p><p>{t("Otwórz link w wiadomości. Jeśli konto już istnieje, przejdź do logowania lub odzyskaj hasło.", "Open the link in the email. If you already have an account, sign in or reset your password.")}</p>
      <div className="ih60-confirmation-actions"><Link className="ih59-primary" to="/login">{t("Przejdź do logowania", "Continue to sign in")}<span aria-hidden="true">→</span></Link><button type="button" className="ih60-secondary" disabled={sending || seconds > 0 || !onResend} onClick={resend}>{sending ? t("Wysyłanie…", "Sending…") : seconds > 0 ? t(`Wyślij ponownie za ${seconds} s`, `Resend in ${seconds}s`) : t("Wyślij link ponownie", "Resend confirmation link")}</button></div>
      {message && <p className="ih60-mail-feedback" role={message.kind === "success" ? "status" : "alert"}>{feedback}</p>}
      <div className="ih60-confirmation-help"><span>{t("Potrzebujesz pomocy?", "Need help?")}</span><a href={SUPPORT_LINK}>{t("Napisz do nas", "Email support")}<span aria-hidden="true">↗</span></a><a href={helpUrl}>{t("Centrum pomocy", "Help centre")}<span aria-hidden="true">↗</span></a></div>
    </section>
  </main>;
}

export function LimitedAccountNavigation({ name, initial, onLogout, helpUrl = "/help/index.html", showAssistant = true }) {
  const en = useSitePreferences().language === "en";
  const location = useLocation();
  const trigger = useRef(null), menu = useRef(null);
  const [open, setOpen] = useState(false);
  const links = [["/", en ? "Home" : "Strona główna"], ["/jobs", en ? "Projects" : "Zlecenia"], ["/services", en ? "Services" : "Usługi"], ["/freelancers", en ? "Freelancers" : "Freelancerzy"], ["/calendar", en ? "Calendar" : "Kalendarz"], ...(showAssistant ? [["/lucyna", "Lucyna AI"]] : []), ["/account", en ? "My account" : "Moje konto"]];
  useEffect(() => setOpen(false), [location.pathname]);
  useLayoutEffect(() => {
    if (!open) return;
    const viewport = window.visualViewport;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect || !menu.current) return;
      const width = viewport?.width || window.innerWidth, height = viewport?.height || window.innerHeight;
      const x = viewport?.offsetLeft || 0, y = viewport?.offsetTop || 0;
      const menuWidth = Math.min(340, width - 24);
      const top = Math.max(y + 12, Math.min(rect.bottom + 8, y + height - 160));
      Object.assign(menu.current.style, { top: `${top}px`, left: `${Math.max(x + 12, Math.min(rect.right - menuWidth, x + width - menuWidth - 12))}px`, width: `${menuWidth}px`, maxHeight: `${Math.max(80, y + height - top - 12)}px` });
    };
    place();
    const frame = requestAnimationFrame(() => menu.current?.querySelector("a")?.focus({ preventScroll: true }));
    const outside = event => { if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false); };
    const keyboard = event => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keyboard);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    viewport?.addEventListener("resize", place);
    viewport?.addEventListener("scroll", place);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keyboard);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      viewport?.removeEventListener("resize", place);
      viewport?.removeEventListener("scroll", place);
    };
  }, [open]);
  const navLinks = () => links.map(([href, title]) => <NavLink to={href} end={href === "/" || href === "/account"} key={href} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "is-active" : ""}>{title}</NavLink>);
  return <header id="ih60-browse-header" className="ih60-browse-header" data-no-translate="true">
    <div className="ih64-limited-brand"><Link className="ih64-home-back" to="/" aria-label={en ? "Back to home" : "Wróć na stronę główną"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h14"/></svg></Link><Link className="ih60-browse-logo" to="/"><BrandSignature /></Link></div>
    <nav className="ih60-browse-desktop" aria-label={en ? "Main navigation" : "Główna nawigacja"}>{navLinks()}</nav>
    <div className="ih64-limited-actions"><Link className="ih60-browse-avatar" to="/account" aria-label={en ? `Account: ${name}` : `Konto: ${name}`}>{initial || "I"}</Link>
      <button ref={trigger} type="button" className="ih64-menu-toggle" aria-label={open ? (en ? "Close menu" : "Zamknij menu") : (en ? "Open menu" : "Otwórz menu")} aria-expanded={open} aria-controls="ih64-limited-menu" onClick={() => setOpen(value => !value)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={open ? "M6 6l12 12M18 6 6 18" : "M4 6h16M4 12h16M4 18h16"}/></svg></button>
      <button type="button" className="ih60-browse-logout" onClick={onLogout}>{en ? "Sign out" : "Wyloguj się"}</button>
    </div>
    {open && createPortal(<nav ref={menu} id="ih64-limited-menu" className="ih64-basic-menu" aria-label={en ? "Navigation and support" : "Nawigacja i pomoc"} data-no-translate="true">{navLinks()}<a href={helpUrl} referrerPolicy="no-referrer">{en ? "Help centre" : "Centrum pomocy"}</a><button type="button" onClick={() => { setOpen(false); onLogout(); }}>{en ? "Sign out" : "Wyloguj się"}</button></nav>, document.body)}
  </header>;
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
