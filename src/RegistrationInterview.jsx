import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BrandSignature } from "./Brand";
import { useSitePreferences, translateUiText } from "./Preferences";
import { RegistrationDocumentLink } from "./AuthFlow";
import { normalizeRegistrationInterview } from "./RegistrationInterviewState";
import "./RegistrationInterview.css";

export const EMPTY_INTERVIEW = {
  version: 1, step: 0, usagePreference: "", freelancerCategories: [], clientCategories: [],
  onboardingGoals: [], specialtySummary: "", projectReadiness: "", personalizationEnabled: null,
  support: "", categoryAudience: "freelancer",
};

// Keep the outgoing scene faded until React has mounted the next one. Only the
// scene animates, so headings and answers arrive together without a flash.
function useInterviewMotion(panelRef, scene) {
  const [moving, setMoving] = useState(false);
  const active = useRef(null), locked = useRef(false), mounted = useRef(true), entering = useRef(false);
  const finish = () => {
    active.current?.cancel();
    active.current = null;
    locked.current = false;
    if (mounted.current) setMoving(false);
  };
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; entering.current = false; active.current?.cancel(); };
  }, []);
  useLayoutEffect(() => {
    if (!entering.current) return;
    entering.current = false;
    const previous = active.current;
    const panel = panelRef.current;
    if (!panel?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { finish(); return; }
    const animation = panel.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 420, easing: "cubic-bezier(.2,0,.2,1)", fill: "both",
    });
    active.current = animation;
    previous?.cancel();
    animation.finished.then(() => { if (active.current === animation) finish(); }, () => { if (mounted.current && active.current === animation) finish(); });
  }, [scene]);
  async function move(commit) {
    if (locked.current) return;
    locked.current = true;
    setMoving(true);
    const panel = panelRef.current;
    if (!panel?.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      commit(); finish(); return;
    }
    try {
      const animation = panel.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards",
      });
      active.current = animation;
      await animation.finished;
      if (!mounted.current) return;
      entering.current = true;
      commit();
    } catch { if (mounted.current) finish(); }
  }
  return { moving, move };
}

function Choice({ name, value, checked, onChange, title, description, number, multiple = false }) {
  return <label className="ri-choice">
    <input type={multiple ? "checkbox" : "radio"} name={name} value={value} checked={checked} onChange={onChange} />
    {number && <span className="ri-choice-number" aria-hidden="true">{String(number).padStart(2, "0")}</span>}
    <span className="ri-choice-copy"><strong>{title}</strong>{description && <span>{description}</span>}</span>
    <span className="ri-choice-check" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span>
  </label>;
}

function CinemaArtwork() {
  const id = useId().replace(/:/g, "");
  const mark = "M8 8H22V20H8ZM42 8H50L56 14V56H42V42H22V56H8V28H42Z";
  return <div className="ri-artwork" aria-hidden="true"><svg viewBox="0 0 600 600" focusable="false">
    <defs>
      <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f2e4d5"/><stop offset=".45" stopColor="#d8bea7"/><stop offset="1" stopColor="#9d8875"/></linearGradient>
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#fff4df"/><stop offset=".6" stopColor="#edc4a7"/><stop offset="1" stopColor="#cc9a7a"/></linearGradient>
      <radialGradient id={`${id}-light`}><stop stopColor="#d8b89a" stopOpacity=".25"/><stop offset="1" stopColor="#d8b89a" stopOpacity="0"/></radialGradient>
    </defs>
    <circle cx="300" cy="330" r="270" fill={`url(#${id}-light)`}/>
    <g className="ri-orbit-back" fill="none"><ellipse cx="300" cy="306" rx="238" ry="100" transform="rotate(-28 300 306)" stroke={`url(#${id}-ribbon)`} strokeWidth="32"/><ellipse cx="300" cy="306" rx="254" ry="116" transform="rotate(-28 300 306)" stroke="#b9a48f" strokeOpacity=".25" strokeWidth="1"/></g>
    <g className="ri-sculpture">
      {Array.from({ length: 9 }, (_, index) => <path key={index} d={mark} transform={`translate(${158 + (9 - index) * 4} ${139 + (9 - index) * 4}) scale(4.4)`} fill={index < 5 ? "#8c7867" : "#b39a84"}/>)}
      <path d={mark} transform="translate(158 139) scale(4.4)" fill={`url(#${id}-face)`}/>
      <path d="m193 174 61 0m114 0 35 0 26 26v177" fill="none" stroke="#fff5e0" strokeOpacity=".6" strokeWidth="2"/>
    </g>
    <path className="ri-orbit-front" d="M88 426C116 484 309 423 465 319" fill="none" stroke={`url(#${id}-ribbon)`} strokeWidth="32" strokeLinecap="round"/>
    <g className="ri-art-points" fill="#bd9c81"><circle cx="126" cy="157" r="5"/><circle cx="491" cy="168" r="3"/><circle cx="476" cy="450" r="5"/></g>
  </svg></div>;
}

export default function RegistrationInterview({ value, onChange, onComplete, usageOptions, categories, categoryDetails, categoryLabel, goalOptions, readinessOptions, snapshot }) {
  const en = useSitePreferences().language === "en";
  const t = (pl, english) => en ? english : pl;
  const localText = text => en ? translateUiText(text) : text;
  const fieldLabel = category => localText(categoryLabel(category));
  const state = { ...EMPTY_INTERVIEW, ...value };
  const step = Math.min(5, Math.max(0, Number(state.step) || 0));
  const [cover, setCover] = useState(() => !value?.started && !value?.action && !(Number(value?.step) > 0));
  const [message, setMessage] = useState("");
  const titleRef = useRef(null), panelRef = useRef(null), viewportRef = useRef(null), answersRef = useRef(null), errorRef = useRef(null);
  const { moving, move } = useInterviewMotion(panelRef, cover ? "cover" : step);
  const labels = t(["Twój kierunek", "Dziedziny", "Cel", "Dobry start", "Twój widok", "Gotowe"], ["Your direction", "Fields", "Goal", "A good start", "Your view", "Ready"]);
  const role = usageOptions.find(option => option.value === state.usagePreference);
  const works = state.usagePreference !== "hire_talent", hires = state.usagePreference !== "find_work";
  const audience = state.usagePreference === "both" ? state.categoryAudience : works ? "freelancer" : "client";
  const activeCategories = audience === "freelancer" ? state.freelancerCategories : state.clientCategories;
  const availableGoals = goalOptions.filter(option => option.audience === "all" || state.usagePreference === "both" || option.audience === (works ? "freelancer" : "client"));
  const supports = [
    { value: "clarity", title: t("Jasny pierwszy krok", "A clear first step"), description: t("Wolę wiedzieć, od czego zacząć, bez nadmiaru opcji.", "I prefer to know where to begin, without too many options."), feedback: t("Zacznij od jednego celu. Pozostałe możliwości będą na Ciebie czekać.", "Start with one goal. The other options will still be there.") },
    { value: "control", title: t("Spokój i kontrola", "Calm and control"), description: t("Chcę najpierw porównać możliwości i ustalić szczegóły.", "I want to compare the options and agree on the details first."), feedback: t("Możesz porównać profile, zakresy usług i ustalenia przed rozpoczęciem współpracy.", "You can compare profiles, service scopes and terms before starting work together.") },
    { value: "pace", title: t("Własne tempo", "My own pace"), description: t("Najpierw się rozejrzę. Decyzję podejmę, gdy będę gotowy.", "I will explore first and decide when I am ready."), feedback: t("Samo utworzenie konta niczego nie publikuje ani nie uruchamia płatności.", "Creating an account does not publish anything or start a payment.") },
  ];
  const support = supports.find(option => option.value === state.support);
  const update = patch => { setMessage(""); onChange({ ...state, ...patch }); };
  const toggle = (key, choice) => {
    const selected = state[key];
    if (!selected.includes(choice) && selected.length >= 3) { setMessage(t("Możesz wybrać maksymalnie trzy odpowiedzi.", "You can choose up to three answers.")); return; }
    update({ [key]: selected.includes(choice) ? selected.filter(item => item !== choice) : [...selected, choice] });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    answersRef.current?.scrollTo({ top: 0, behavior: "instant" });
    titleRef.current?.focus({ preventScroll: true });
  }, [step, cover]);

  useEffect(() => {
    if (!message) return;
    errorRef.current?.focus({ preventScroll: true });
    errorRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [message]);

  useEffect(() => {
    const viewport = window.visualViewport;
    let notice = null;
    const resize = () => {
      const height = Math.round(viewport?.height || window.innerHeight);
      const noticeSpace = notice ? Math.ceil(notice.getBoundingClientRect().height) + 28 : 0;
      viewportRef.current?.style.setProperty("--ri-viewport-height", `${height}px`);
      if (viewportRef.current) viewportRef.current.dataset.compact = String(height - noticeSpace < 580);
      viewportRef.current?.style.setProperty("--ri-cookie-space", `${noticeSpace}px`);
    };
    const noticeResize = new ResizeObserver(resize);
    const updateNotice = () => {
      const next = document.querySelector(".cookie-notice");
      if (next !== notice) { noticeResize.disconnect(); notice = next; if (notice) noticeResize.observe(notice); }
      resize();
    };
    const changes = new MutationObserver(updateNotice);
    changes.observe(document.getElementById("root"), { childList: true, subtree: true });
    updateNotice();
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    return () => { viewport?.removeEventListener("resize", resize); window.removeEventListener("resize", resize); changes.disconnect(); noticeResize.disconnect(); };
  }, []);

  function start() {
    if (moving) return;
    move(() => { onChange({ ...state, started: true }); setCover(false); });
  }

  function validation() {
    if (step === 0 && !role) return t("Wybierz, jak chcesz korzystać z IdeaHire.", "Choose how you want to use IdeaHire.");
    if (step === 1 && works && !state.freelancerCategories.length) {
      onChange({ ...state, categoryAudience: "freelancer" });
      return t("Wybierz co najmniej jedną dziedzinę, w której chcesz działać.", "Choose at least one field you want to work in.");
    }
    if (step === 1 && hires && !state.clientCategories.length) {
      onChange({ ...state, categoryAudience: "client" });
      return t("Wybierz co najmniej jedną dziedzinę, w której szukasz pomocy.", "Choose at least one field you need help with.");
    }
    if (step === 2 && !state.onboardingGoals.length) return t("Wybierz co najmniej jeden cel na początek.", "Choose at least one goal to start with.");
    if (step === 2 && hires && !state.projectReadiness) return t("Zaznacz, na jakim etapie jest Twój projekt.", "Select the current stage of your project.");
    if (step === 4 && typeof state.personalizationEnabled !== "boolean") return t("Wybierz kolejność wyników, od której chcesz zacząć.", "Choose how you want your results to be ordered.");
    return "";
  }

  function next() {
    if (moving) return;
    const problem = validation();
    if (problem) { setMessage(problem); return; }
    setMessage("");
    if (step < 5) { move(() => onChange({ ...state, step: step + 1 })); return; }
    const answer = normalizeRegistrationInterview({ ...state, action: "complete" }, categories);
    if (!answer) { setMessage(t("Sprawdź swoje odpowiedzi przed przejściem do formularza.", "Please review your answers before continuing to the form.")); return; }
    move(() => onComplete(answer));
  }

  function skip() {
    if (moving) return;
    const answer = normalizeRegistrationInterview({ ...EMPTY_INTERVIEW, usagePreference: state.usagePreference || "both", action: "skip", personalizationEnabled: false }, categories);
    move(() => onComplete(answer));
  }

  const titles = [
    t("Co Cię sprowadza do IdeaHire?", "What brings you to IdeaHire?"),
    works && hires ? t("W czym działasz i czego szukasz?", "What do you do and what do you need?") : works ? t("W czym chcesz działać?", "What would you like to work on?") : t("Jakiej pomocy szukasz?", "What do you need help with?"),
    t("Co chcesz osiągnąć na początek?", "What would you like to achieve first?"),
    t("Co ułatwi Ci pierwszy krok?", "What would make the first step easier?"),
    t("Jak chcesz odkrywać możliwości?", "How would you like to explore?"),
    t("Twój punkt startu jest gotowy.", "Your starting point is ready."),
  ];
  const descriptions = [
    t("Dobry pomysł zaczyna się od Ciebie. Kilka wyborów pomoże ułożyć pierwszy widok — po swojemu.", "A good idea starts with you. A few choices will help shape your first view, your way."),
    t("Wybierz do trzech dziedzin dla każdej roli. Żadna z nich nie zamyka Ci innych możliwości.", "Choose up to three fields for each role. You can still explore everything else."),
    t("Wybierz od jednego do trzech celów. Nie musisz mieć gotowego planu na wszystko.", "Choose one to three goals. You do not need a plan for everything."),
    t("Nie każdy zaczyna tak samo. Wybierz to, co jest Ci teraz najbliższe. To pytanie możesz pominąć.", "Everyone starts differently. Choose what feels useful right now. You can skip this question."),
    t("To ustawienie kolejności wyników, nie zgoda na reklamy. Zmienisz je w ustawieniach konta.", "This sets the order of your results. It is not advertising consent, and you can change it in account settings."),
    t("Sprawdź swoje wybory. Za chwilę utworzysz konto; odpowiedzi zapiszą się po zalogowaniu. Możesz je potem zmienić.", "Review your choices. Next you will create your account; your answers will be saved after sign-in. You can change them later."),
  ];

  return <main id="ih-registration-interview" ref={viewportRef} data-no-translate="true" data-cover={cover} data-step={step} data-moving={moving} aria-busy={moving}>
    <div className="ri-ambient" aria-hidden="true"><span/><span/><span/></div>
    <header className="ri-header"><Link to="/" className="ri-brand" aria-label="IdeaHire"><BrandSignature /></Link><Link to="/login">{t("Zaloguj się", "Sign in")}</Link></header>
    <div className="ri-progress-wrap" hidden={cover}>
      <div className="ri-progress-caption"><span>{t("Poznajmy się", "Let's get acquainted")} <b>{String(step + 1).padStart(2, "0")} / 06</b></span><span>{labels[step]}</span></div>
      <div className="ri-progress" role="progressbar" aria-label={t("Postęp wywiadu", "Interview progress")} aria-valuemin={1} aria-valuemax={6} aria-valuenow={step + 1} aria-valuetext={t(`Krok ${step + 1} z 6: ${labels[step]}`, `Step ${step + 1} of 6: ${labels[step]}`)}><span style={{ width: `${(step + 1) / 6 * 100}%` }} /></div>
    </div>
    <div className="ri-stage" ref={panelRef} key={cover ? "cover" : step}>
      {cover ? <div className="ri-cover">
        <div className="ri-cover-copy">
          <h1 ref={titleRef} tabIndex={-1}><span>{t("Z pomysłu.", "From an idea.")}</span><span>{t("W coś", "To something")} <em>{t("więcej.", "more.")}</em></span></h1>
        </div><CinemaArtwork/>
      </div> : <div className="ri-question-layout">
      <div className="ri-heading"><span className="ri-kicker">{step === 5 ? t("Pomysł. Ludzie. Pierwszy krok.", "Ideas. People. A first step.") : labels[step]}</span><h1 ref={titleRef} tabIndex={-1}>{titles[step]}</h1><p>{descriptions[step]}</p></div>
      <div className="ri-answer-viewport" ref={answersRef}>
      {message && <p className="ri-error" role="alert" ref={errorRef} tabIndex={-1}>{message}</p>}
      <fieldset className="ri-fields" disabled={moving}><legend className="ri-sr-only">{titles[step]}</legend>
        {step === 0 && <div className="ri-choices ri-choices-three">{usageOptions.map((option, index) => <Choice key={option.value} name="interview-role" value={option.value} number={index + 1} checked={state.usagePreference === option.value}
          title={t(option.eyebrow, ["Find projects", "Hire a specialist", "Work and hire"][index])}
          description={t(option.description, ["Find work, develop your profile and offer your services.", "Publish briefs and find the right people for your projects.", "Deliver projects and commission work from others."][index])}
          onChange={() => update({ usagePreference: option.value, categoryAudience: option.value === "hire_talent" ? "client" : "freelancer", onboardingGoals: state.onboardingGoals.filter(goal => goalOptions.some(item => item.value === goal && (item.audience === "all" || option.value === "both" || item.audience === (option.value === "find_work" ? "freelancer" : "client")))) })} />)}</div>}
        {step === 1 && <>
          {works && hires && <div className="ri-category-tabs" role="group" aria-label={t("Dziedziny dla Twoich ról", "Fields for your roles")}><button type="button" aria-pressed={audience === "freelancer"} onClick={() => update({ categoryAudience: "freelancer" })}>{t("Realizuję", "I deliver")} <span>{state.freelancerCategories.length}/3</span></button><button type="button" aria-pressed={audience === "client"} onClick={() => update({ categoryAudience: "client" })}>{t("Szukam pomocy", "I need help")} <span>{state.clientCategories.length}/3</span></button></div>}
          <p className="ri-context">{audience === "freelancer" ? t("Dziedziny, w których chcesz realizować projekty", "Fields you want to work in") : t("Dziedziny, w których szukasz wykonawców", "Fields you need help with")}</p>
          <div className="ri-choices ri-category-choices">{categories.map((category, index) => <Choice key={category} multiple name={`interview-${audience}-categories`} value={category} number={index + 1} checked={activeCategories.includes(category)} title={fieldLabel(category)} description={localText(categoryDetails[category])} onChange={() => toggle(audience === "freelancer" ? "freelancerCategories" : "clientCategories", category)} />)}</div>
          <p className="ri-counter" role="status">{t(`Wybrano ${activeCategories.length} z 3`, `Selected ${activeCategories.length} of 3`)}</p>
          {audience === "freelancer" && <label className="ri-text-field">{t("Jednym zdaniem: czym się zajmujesz?", "In one sentence: what do you do?")}<input type="text" value={state.specialtySummary} maxLength={160} onChange={event => update({ specialtySummary: event.target.value })} placeholder={t("Np. projektuję sklepy internetowe", "For example, I design online stores")} /><small>{t("Opcjonalnie. Nie wpisuj tutaj danych kontaktowych ani informacji wrażliwych.", "Optional. Please leave out contact details and sensitive information.")}</small></label>}
        </>}
        {step === 2 && <>
          <div className="ri-choices ri-choices-two">{availableGoals.map((option, index) => <Choice key={option.value} multiple name="interview-goals" value={option.value} number={index + 1} checked={state.onboardingGoals.includes(option.value)} title={localText(option.title)} description={localText(option.description)} onChange={() => toggle("onboardingGoals", option.value)} />)}</div>
          <p className="ri-counter" role="status">{t(`Wybrano ${state.onboardingGoals.length} z 3`, `Selected ${state.onboardingGoals.length} of 3`)}</p>
          {hires && <fieldset className="ri-readiness"><legend>{t("Na jakim etapie jest Twój projekt?", "What stage is your project at?")}</legend><div className="ri-choices ri-choices-two">{readinessOptions.map(option => <Choice key={option.value} name="interview-readiness" value={option.value} checked={state.projectReadiness === option.value} title={localText(option.title)} description={localText(option.description)} onChange={() => update({ projectReadiness: option.value })} />)}</div></fieldset>}
        </>}
        {step === 3 && <><div className="ri-choices ri-choices-three">{supports.map((option, index) => <Choice key={option.value} name="interview-support" value={option.value} number={index + 1} checked={state.support === option.value} title={localText(option.title)} description={localText(option.description)} onChange={() => update({ support: option.value })} />)}</div><p className="ri-feedback" role="status">{support?.feedback || t("Możesz przejść dalej bez wybierania odpowiedzi.", "You can continue without choosing an answer.")}</p></>}
        {step === 4 && <div className="ri-choices ri-choices-two"><Choice name="interview-order" value="matched" checked={state.personalizationEnabled === true} title={t("Dopasowane dla Ciebie", "Matched to you")} description={t("Wybrane dziedziny pojawią się wyżej. Pozostałe nadal będą dostępne.", "Your chosen fields appear higher. Everything else remains available.")} onChange={() => update({ personalizationEnabled: true })} /><Choice name="interview-order" value="newest" checked={state.personalizationEnabled === false} title={t("Tylko najnowsze", "Newest first")} description={t("Zaczniesz od najnowszych publikacji, bez dopasowania kolejności do dziedzin.", "Start with the latest posts, without ordering by your chosen fields.")} onChange={() => update({ personalizationEnabled: false })} /></div>}
        {step === 5 && <div className="ri-summary"><span className="ri-summary-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg></span><dl><div><dt>{t("Twój kierunek", "Your direction")}</dt><dd>{localText(role?.eyebrow)}</dd></div>{works && <div><dt>{t("Realizuję", "I deliver")}</dt><dd>{state.freelancerCategories.map(fieldLabel).join(" · ")}</dd></div>}{hires && <div><dt>{t("Szukam pomocy", "I need help")}</dt><dd>{state.clientCategories.map(fieldLabel).join(" · ")}</dd></div>}<div><dt>{t("Na początek", "My first goals")}</dt><dd>{state.onboardingGoals.map(goal => localText(goalOptions.find(option => option.value === goal)?.title)).filter(Boolean).join(" · ")}</dd></div>{hires && <div><dt>{t("Etap projektu", "Project stage")}</dt><dd>{localText(readinessOptions.find(option => option.value === state.projectReadiness)?.title)}</dd></div>}<div><dt>{t("Kolejność wyników", "Result order")}</dt><dd>{state.personalizationEnabled ? t("Dopasowane dla Ciebie", "Matched to you") : t("Tylko najnowsze", "Newest first")}</dd></div></dl><p>{support?.feedback || t("Zacznij od jednego kroku. Profil, usługi i projekty ułożysz we własnym tempie.", "Start with one step. Build your profile, services and projects at your own pace.")}</p></div>}
      </fieldset>
      <details className="ri-privacy"><summary>{t("Odpowiedzi i prywatność", "Answers and privacy")}</summary><div><p>{t("Odpowiedzi są dobrowolne i służą ustawieniu widoku. Uprawnienia konta zależą od wieku. Ten wybór nie określa formy zatrudnienia ani rozliczeń.", "The answers are optional and shape your view. Account permissions depend on age. These choices do not determine employment or tax status.")}</p>{step === 3 && <p>{t("Pytanie o pierwszy krok służy tylko wskazówce na tym ekranie. Tej odpowiedzi nie zapisujemy w profilu.", "The question about your first step is only used for the tip on this screen. This answer is not saved to your profile.")}</p>}<RegistrationDocumentLink to="/polityka-prywatnosci#wywiad-przed-rejestracja" id="ri-interview-info" snapshot={snapshot}>{t("Jak przechowujemy odpowiedzi?", "How do we store the answers?")}</RegistrationDocumentLink></div></details>
      </div></div>}
    </div>
    <footer className="ri-footer"><div className="ri-navigation">{!cover && step > 0 && <button type="button" className="ri-back" disabled={moving} onClick={() => { setMessage(""); move(() => onChange({ ...state, step: step - 1 })); }}>{t("Wstecz", "Back")}</button>}<button type="button" className="ri-next" disabled={moving} onClick={cover ? start : next}><span>{cover ? t("Zaczynamy", "Let's begin") : step === 5 ? t("Przejdź do formularza", "Continue to the form") : t("Dalej", "Continue")}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button></div><div className="ri-footer-meta"><button type="button" className="ri-skip" disabled={moving} onClick={skip}>{t("Pomiń wywiad", "Skip the interview")}</button><div className="ri-document-links"><RegistrationDocumentLink to="/polityka-prywatnosci" id="ri-privacy" snapshot={snapshot}>{t("Prywatność", "Privacy")}</RegistrationDocumentLink><RegistrationDocumentLink to="/polityka-cookies" id="ri-cookies" snapshot={snapshot}>{t("Cookies", "Cookies")}</RegistrationDocumentLink></div></div></footer>
  </main>;
}

export function RegistrationAccountHeader({ titleRef, usageLabel, skipped, disabled, onEdit }) {
  const en = useSitePreferences().language === "en";
  const t = (pl, english) => en ? english : pl;
  return <>
    <div className="ri-account-topbar" data-no-translate="true">
      <Link className="logo" to="/" aria-label="IdeaHire"><BrandSignature /></Link>
      <Link className="ri-account-login" to="/login">{t("Zaloguj się", "Sign in")}</Link>
    </div>
    <div className="auth-header" data-no-translate="true">
      <h1 tabIndex={-1} ref={titleRef}>{t("Utwórz konto", "Create your account")}</h1>
      <p>{t("Wybierz wygodny sposób rejestracji.", "Choose how you would like to sign up.")}</p>
    </div>
    <div className="ih59-registration-selection" data-no-translate="true">
      <div><small>{skipped ? t("Wywiad jest opcjonalny", "The interview is optional") : t("Twój kierunek", "Your direction")}</small><strong>{skipped ? t("Możesz do niego wrócić", "You can return to it") : en ? translateUiText(usageLabel) : usageLabel}</strong></div>
      <button type="button" disabled={disabled} onClick={onEdit} aria-label={t("Edytuj wywiad", "Edit the interview")}>{skipped ? t("Uzupełnij", "Answer") : t("Edytuj", "Edit")}</button>
    </div>
  </>;
}

export function RegistrationProviderNotice() {
  const en = useSitePreferences().language === "en";
  return <details className="ri-provider-notice" data-no-translate="true">
    <summary>{en ? "How Google registration works" : "Jak działa rejestracja przez Google"}</summary>
    <p className="google-auth-notice">{en
      ? "Google shares your email address, account name and photo with IdeaHire. The name fills your profile; the photo only becomes public after you save your profile. After your first sign-in, you will complete your date of birth and confirm the documents required to activate your IdeaHire account."
      : "Google przekaże IdeaHire adres e-mail, nazwę i zdjęcie konta. Nazwa uzupełni profil; zdjęcie pojawi się publicznie dopiero po zapisaniu profilu. Po pierwszym logowaniu uzupełnisz datę urodzenia i potwierdzisz dokumenty wymagane do aktywowania konta IdeaHire."}</p>
  </details>;
}

export function RegistrationInterviewPrivacy({ cookies = false }) {
  const en = useSitePreferences().language === "en";
  const t = (pl, english) => en ? english : pl;
  return <section className="ri-legal-supplement" id="wywiad-przed-rejestracja" aria-labelledby="ri-legal-supplement-title" data-no-translate="true">
    <span>{t("Uzupełnienie informacji · 31 października 2026 r.", "Additional information · 31 October 2026")}</span>
    <h2 id="ri-legal-supplement-title">{cookies ? t("Wywiad i pamięć rejestracji", "Interview and registration storage") : t("Dobrowolny wywiad przed rejestracją", "Optional interview before registration")}</h2>
    <p>{t("Wywiad zbiera wybrany sposób korzystania z IdeaHire, dziedziny, cele, opcjonalny opis specjalizacji, etap projektu i kolejność wyników. Możesz pominąć go bez blokowania rejestracji. Preferencje nie określają formy zatrudnienia, statusu podatkowego ani uprawnień konta.", "The interview collects your chosen way of using IdeaHire, fields, goals, an optional specialty description, project stage and result order. You can skip it without blocking registration. These preferences do not determine employment, tax status or account permissions.")}</p>
    <p>{t("Przed wysłaniem formularza odpowiedzi pozostają w pamięci otwartej strony, także przy przejściu do dokumentów prawnych. Po wysłaniu rejestracji e-mailem są przekazywane jako preferencje tego konta. Po zalogowaniu zapisujemy je w ustawieniach, które można później zmienić lub usunąć. Krótkie pytanie o dobry start daje tylko wskazówkę na ekranie: tej odpowiedzi nie zapisujemy w koncie i nie tworzymy profilu psychologicznego.", "Before form submission, answers stay in the open page's memory, including when you visit legal documents. Email registration sends them as this account's preferences. After sign-in we save them in settings, which you can later change or remove. The short question about a good start is only used for an on-screen tip: that answer is not saved to the account and does not create a psychological profile.")}</p>
    <dl><div><dt>ideahire_registration_interview_oauth_v1</dt><dd>{t("sessionStorage, wyłącznie po wybraniu logowania Google. Szkic przenosi odpowiedzi przez tę próbę logowania; losowy token wiąże powrót z próbą, a następnie szkic jest przypisywany do tego konta. Odpowiedzi nie są umieszczane w adresie URL. Ważność przeniesienia wynosi godzinę. Szkic jest usuwany po poprawnym zapisie, przy odczycie wygasłego szkicu lub wraz z końcem sesji karty.", "sessionStorage, only after choosing Google sign-in. The draft carries answers through that sign-in attempt; a random token binds the return to the attempt, and the draft is then bound to this account. Answers are not placed in the URL. The transfer is valid for one hour. The draft is removed after a successful save, when an expired draft is read, or when the tab session ends.")}</dd></div><div><dt>{t("Techniczna kopia przy rejestracji", "Technical registration copy")}</dt><dd>{t("Aby ponowić zapis po przerwaniu połączenia, wybrane preferencje mogą tymczasowo pozostać w danych rejestracji konta. Dla Google następuje to po zalogowaniu i uzupełnieniu wymaganego formularza konta. Po poprawnym zapisie ustawień podejmujemy usunięcie tej kopii; jeśli połączenie jest niedostępne, ponawiamy przy kolejnym odczycie ustawień. Kopia nie służy przyznawaniu uprawnień.", "To retry after a connection failure, the chosen preferences may temporarily remain in the account's registration data. For Google this happens after sign-in and completion of the required account form. After settings are saved, we attempt to remove that copy; if the connection is unavailable, we retry when settings are next loaded. This copy never grants permissions.")}</dd></div></dl>
    <p>{t("Przycisk „Rozumiem” zamyka informację o niezbędnej pamięci witryny. Nie wyraża zgody reklamowej ani analitycznej. Ustawienie kolejności wyników jest odrębnym wyborem funkcji konta. Regulamin i potwierdzenie zapoznania się z polityką prywatności znajdują się osobno w formularzu tworzenia konta.", "The “Got it” button closes the notice about necessary site storage. It does not give advertising or analytics consent. Result ordering is a separate choice of an account feature. Terms acceptance and acknowledgement of the privacy information are separate fields in the account creation form.")}</p>
  </section>;
}
