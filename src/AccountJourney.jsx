import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

export function RegistrationRoleScreen({ options, value, onChange, onContinue }) {
  const titleRef = useRef(null);
  const panelRef = useRef(null);
  const { moving, move } = useJourneyMotion(panelRef);
  const selected = options.find(option => option.value === value);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  return <main id="ih59-registration" className="ih59-journey" data-moving={moving}>
    <header className="ih59-journey-header">
      <Link to="/" className="ih59-wordmark">IdeaHire</Link>
      <ol className="ih59-registration-steps" aria-label="Etapy rejestracji">
        <li aria-current="step"><b>01</b> Twój kierunek</li>
        <li><b>02</b> Twoje konto</li>
      </ol>
      <Link to="/login" className="ih59-login-link">Zaloguj się</Link>
    </header>

    <div className="ih59-role-content" ref={panelRef}>
      <div className="ih59-role-heading">
        <span className="ih59-kicker">Zacznijmy od Ciebie</span>
        <h1 ref={titleRef} tabIndex={-1}>Co sprowadza Cię<br />do IdeaHire?</h1>
        <p>Ułożymy pierwsze podpowiedzi pod Twój wybór. Zmienisz go w ustawieniach konta.</p>
      </div>
      <fieldset className="ih59-role-options" disabled={moving}>
        <legend className="ih59-sr-only">Wybierz sposób korzystania z IdeaHire</legend>
        {options.map((option, index) => <label className="ih59-role-option" key={option.value} style={{ "--choice": index }}>
          <input type="radio" name="registration-usage" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
          <span className="ih59-role-number" aria-hidden="true">{option.icon}</span>
          <span className="ih59-role-check" aria-hidden="true">✓</span>
          <span className="ih59-role-eyebrow">{option.eyebrow}</span>
          <strong>{option.title}</strong>
          <span className="ih59-role-description">{option.description}</span>
        </label>)}
      </fieldset>
      <p className="ih59-role-status" role="status">{selected ? `Wybrano: ${selected.eyebrow.toLocaleLowerCase("pl-PL")}. Możesz przejść dalej.` : "Zaznacz jedną odpowiedź, aby przejść do formularza."}</p>
    </div>

    <footer className="ih59-journey-footer">
      <p>Wybór służy dopasowaniu treści. Uprawnienia konta zależą od wieku; nie określa on formy zatrudnienia ani rozliczeń.</p>
      <button type="button" className="ih59-primary" disabled={!selected || moving} onClick={() => move(onContinue)}>
        {moving ? "Przechodzimy dalej…" : "Przejdź do formularza"}<span aria-hidden="true">→</span>
      </button>
    </footer>
  </main>;
}

export function RegistrationSentScreen({ email }) {
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); }, []);
  return <main id="ih59-registration" className="ih59-journey ih59-email-confirmation">
    <header className="ih59-journey-header"><Link className="ih59-wordmark" to="/">IdeaHire</Link><span>Potwierdzenie adresu</span></header>
    <section className="ih59-confirmation-content">
      <span className="ih59-kicker">Ostatni krok</span>
      <h1 ref={titleRef} tabIndex={-1}>Sprawdź skrzynkę.</h1>
      <p>Jeżeli adres <strong>{email}</strong> może zostać zarejestrowany, otrzymasz wiadomość z linkiem do potwierdzenia konta.</p>
      <p>Otwórz link w wiadomości. Jeśli konto już istnieje, przejdź do logowania lub odzyskaj hasło.</p>
      <Link className="ih59-primary" to="/login">Przejdź do logowania <span aria-hidden="true">→</span></Link>
    </section>
  </main>;
}

const LIMITED_PANELS = {
  now: [
    ["01", "Poznaj zlecenia", "Przeglądaj ogłoszenia, zakresy prac i budżety w swoich dziedzinach.", "/jobs", "Zobacz zlecenia"],
    ["02", "Sprawdź specjalistów", "Poznaj publiczne profile i zobacz, jak inni prezentują swoje doświadczenie.", "/talent", "Poznaj wykonawców"],
  ],
  later: [
    ["18+", "Zlecenia i współpraca", "Publikowanie zleceń, zgłoszenia, wiadomości i zawieranie umów są dostępne po ukończeniu 18 lat."],
    ["18+", "Płatności i rozliczenia", "Płatne realizacje, wypłaty oraz otwieranie nowych sporów wymagają pełnego konta."],
  ],
};

export function LimitedAccountOverview({ fullAccessLabel, ageRestricted, settings }) {
  const [tab, setTab] = useState("now");
  function changeTab(event) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "now" : event.key === "End" ? "later" : tab === "now" ? "later" : "now";
    setTab(next);
    document.getElementById(`ih59-limited-tab-${next}`)?.focus();
  }
  return <main className="ih59-limited" id="ih59-limited-account">
    <header className="ih59-limited-heading">
      <span className="ih59-kicker">Twoje konto / IdeaHire</span>
      <span className="ih59-age-badge">Konto 16–17 lat</span>
      <h1>Twoje miejsce<br />na start.</h1>
      <p>Przeglądaj projekty i poznaj platformę. W jednym miejscu sprawdzisz, co jest dostępne teraz i co zmieni się po osiemnastych urodzinach.</p>
    </header>
    {ageRestricted && <p className="ih59-restriction-note" role="status">Wybrana funkcja wymaga pełnego konta 18+. Poniżej znajdziesz dostępne możliwości.</p>}
    <section className="ih59-access-date" aria-label="Pełny dostęp">
      <div><span>Pełne konto</span><strong>{fullAccessLabel}</strong></div>
      <p>Po ukończeniu 18 lat. Zachowasz to samo konto — nie trzeba rejestrować się ponownie.</p>
    </section>
    <div className="ih59-access-tabs" role="tablist" aria-label="Dostępność funkcji konta" onKeyDown={changeTab}>
      {[["now", "Dostępne teraz"], ["later", "Po ukończeniu 18 lat"]].map(([id, label]) => <button key={id} type="button" role="tab" id={`ih59-limited-tab-${id}`} aria-controls="ih59-limited-panel" aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>{label}</button>)}
    </div>
    <section className="ih59-limited-grid" role="tabpanel" id="ih59-limited-panel" aria-labelledby={`ih59-limited-tab-${tab}`} tabIndex={0} key={tab}>
      {LIMITED_PANELS[tab].map(([number, title, copy, href, cta]) => <article key={title}>
        <span className="ih59-panel-number">{number}</span><h2>{title}</h2><p>{copy}</p>
        {href ? <Link to={href}>{cta}<span aria-hidden="true">↗</span></Link> : <span className="ih59-locked-label">Dostępne od 18 lat</span>}
      </article>)}
    </section>
    <section className="ih59-limited-privacy"><div><h2>Prywatność pod kontrolą.</h2><p>Data urodzenia nie jest widoczna na publicznym profilu. Jeśli wymaga korekty, skontaktuj się z pomocą IdeaHire.</p></div><Link to="/privacy-center">Prywatność i moje dane <span aria-hidden="true">↗</span></Link></section>
    <div className="ih59-limited-settings">{settings}</div>
  </main>;
}
