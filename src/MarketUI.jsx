/* IdeaHire | PACZKA 06 | 2026-10-04 | Pełny plik: src/MarketUI.jsx */
import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

// The agreed public offer. Charging stays in the server's payment-summary RPC.
export const IDEA_HIRE_PUBLIC_OFFER = Object.freeze({ percent: 6, minimum: 20, maximum: 249, orderLimit: 10000 });

export function IdeaHireLogo({ className = "logo", to = "/" }) {
  const [cycle, setCycle] = useState(0);
  const [active, setActive] = useState(false);
  const timer = useRef(null);
  function play() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    window.clearTimeout(timer.current);
    setCycle((value) => value + 1);
    setActive(true);
    timer.current = window.setTimeout(() => setActive(false), 1050);
  }
  useEffect(() => { play(); return () => window.clearTimeout(timer.current); }, []);
  return (
    <Link className={`${className} ih6-logo`} to={to} aria-label="IdeaHire — strona główna"
      onPointerEnter={(event) => { if (event.pointerType === "mouse") play(); }} onFocus={play} onClick={play}>
      <span className="ih6-logo-word" key={cycle} data-active={active} aria-hidden="true">
        {Array.from("IdeaHire").map((letter, index) => <span className={`ih6-logo-letter${index > 3 ? " is-hire" : ""}`} key={index} style={{ "--ih6-letter": index }}>{letter}</span>)}
        {active && <span className="ih6-logo-pixels">{[0, 1, 2, 3].map((index) => <i key={index} style={{ "--ih6-pixel": index }} />)}</span>}
      </span>
    </Link>
  );
}

const PROFILE_HUB_POSITIONS = [
  { x: "31%", y: "24px" }, { x: "45%", y: "88px" },
  { x: "55%", y: "152px" }, { x: "55%", y: "216px" },
  { x: "45%", y: "280px" }, { x: "31%", y: "344px" },
];

export function ProfileHub({ sections, active, onSelect }) {
  const [open, setOpen] = useState(false);
  const activeIndex = Math.max(0, sections.findIndex((section) => section.key === active));
  const [focusedIndex, setFocusedIndex] = useState(activeIndex);
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const focusOnOpen = useRef(false);
  const current = sections[activeIndex];
  useEffect(() => {
    setOpen(false);
    setFocusedIndex(activeIndex);
  }, [active]);
  useEffect(() => {
    if (!open) return undefined;
    if (focusOnOpen.current) { itemRefs.current[activeIndex]?.focus(); focusOnOpen.current = false; }
    function outside(event) { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function close() { setOpen(false); triggerRef.current?.focus({ preventScroll: true }); }
  function choose(section) { onSelect(section); close(); }
  function keyboard(event) {
    if (!open) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (delta === undefined && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? sections.length - 1 : (focusedIndex + delta + sections.length) % sections.length;
    setFocusedIndex(next);
    itemRefs.current[next]?.focus();
  }
  return (
    <aside className="ih6-profile-hub" ref={rootRef} data-open={open} aria-label="Centrum profilu" onKeyDown={keyboard}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <svg className="ih6-hub-orbit" viewBox="0 0 340 416" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M172 48C300 106 300 310 172 368" /><path className="ih6-hub-spoke" d="M51 208h66" />
      </svg>
      <button type="button" className="ih6-hub-trigger" ref={triggerRef} aria-expanded={open} aria-controls={`${id}-sections`}
        aria-label={`${open ? "Zamknij" : "Otwórz"} centrum profilu. Bieżąca sekcja: ${current.label}.`}
        onClick={() => { setFocusedIndex(activeIndex); setOpen((value) => !value); }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) { event.preventDefault(); event.stopPropagation(); focusOnOpen.current = true; setOpen(true); }
        }}>
        <span className="ih6-hub-emblem" aria-hidden="true"><i /><i /><i /><i /></span>
        <span>Centrum<br />profilu</span><span className="ih6-hub-toggle" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div className="ih6-hub-items" id={`${id}-sections`} role="tablist" aria-label="Sekcje profilu" aria-orientation="vertical" aria-hidden={!open} inert={open ? undefined : ""}>
        {sections.map((section, index) => {
          const position = PROFILE_HUB_POSITIONS[index];
          return <button type="button" role="tab" key={section.key} id={`account-tab-${section.key}`} aria-selected={active === section.key}
            aria-controls="account-tab-panel" tabIndex={open && focusedIndex === index ? 0 : -1}
            className={`ih6-hub-item${active === section.key ? " is-active" : ""}`}
            ref={(element) => { itemRefs.current[index] = element; }}
            style={{ "--ih6-hub-x": position.x, "--ih6-hub-y": position.y, "--ih6-hub-order": index }}
            onFocus={() => setFocusedIndex(index)} onClick={() => choose(section)}>
            <span className="ih6-hub-number" aria-hidden="true">{section.number}</span><span>{section.label}</span>
          </button>;
        })}
      </div>
      <span className="ih6-hub-current" aria-live="polite">{current.label}</span>
    </aside>
  );
}

export function MarketIcon({ kind = "search", ...props }) {
  const paths = {
    search: "m20 20-4.2-4.2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    close: "m6 6 12 12M18 6 6 18",
    plus: "M12 5v14M5 12h14",
    check: "m5 12 4 4L19 6",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[kind] || paths.search} /></svg>;
}

export function MarketHeader({ eyebrow, title, description, children }) {
  return (
    <header className="ih5-page-heading">
      <div><span className="ih5-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {children && <div className="ih5-heading-actions">{children}</div>}
    </header>
  );
}

export function MarketFilters({ search, onSearch, categories, category, onCategory, categoryLabel = (value) => value, sort, onSort, matchedAvailable = false, kind = "zleceń" }) {
  const id = useId();
  return (
    <section className="ih5-filters" aria-label={`Wyszukiwanie ${kind}`}>
      <label className="ih5-search" htmlFor={`${id}-search`}>
        <MarketIcon /><span className="ih5-sr-only">Szukaj {kind}</span>
        <input id={`${id}-search`} type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder={kind === "usług" ? "Usługa, specjalizacja lub rezultat…" : "Tytuł, specjalizacja lub umiejętność…"} maxLength={160} />
      </label>
      <label className="ih5-select-field" htmlFor={`${id}-category`}>
        <span>Kategoria</span>
        <select id={`${id}-category`} value={category} onChange={(event) => onCategory(event.target.value)}>
          {["Wszystkie", ...categories].map((value) => <option key={value} value={value}>{value === "Wszystkie" ? "Wszystkie kategorie" : categoryLabel(value)}</option>)}
        </select>
      </label>
      {onSort && <label className="ih5-select-field" htmlFor={`${id}-sort`}>
        <span>Kolejność</span>
        <select id={`${id}-sort`} value={sort} onChange={(event) => onSort(event.target.value)}>
          <option value="latest">Najnowsze</option><option value="matched" disabled={!matchedAvailable}>Dopasowane do mnie</option>
        </select>
      </label>}
    </section>
  );
}

const STEP_TILES = Array.from({ length: 40 }, (_, index) => {
  const column = index % 8;
  const row = Math.floor(index / 8);
  return {
    "--tile-x": `${8 + column * 12}%`, "--tile-y": `${8 + row * 20}%`,
    "--tile-dx": `${(column - 3.5) * 18}px`, "--tile-dy": `${(row - 2) * 23}px`,
    "--tile-delay": `${(column + row) * 23}ms`, "--tile-turn": `${(index % 3 - 1) * 28}deg`,
  };
});

export function HomeStepCard({ number, title, children }) {
  const [burst, setBurst] = useState(0);
  const [active, setActive] = useState(false);
  const timeout = useRef(null);
  useEffect(() => () => window.clearTimeout(timeout.current), []);
  function play() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    window.clearTimeout(timeout.current);
    setBurst((value) => value + 1);
    setActive(true);
    timeout.current = window.setTimeout(() => setActive(false), 1800);
  }
  return (
    <article className="step home-reveal ih5-step-card" data-burst={active} onPointerEnter={(event) => { if (event.pointerType === "mouse") play(); }}>
      <button type="button" className="ih5-step-trigger" onClick={play} aria-label={`${number}. ${title}. ${children} Odtwórz animację kafelka.`}>
        <span className="ih5-step-number">{number}</span><span className="ih5-step-title">{title}</span><span className="ih5-step-copy">{children}</span><span className="ih5-step-hint" aria-hidden="true"><MarketIcon kind="plus" /></span>
      </button>
      {active && <span key={burst} className="ih5-step-tiles" aria-hidden="true">{STEP_TILES.map((style, index) => <i key={index} style={style} />)}</span>}
    </article>
  );
}

export function CommissionStory() {
  const id = useId().replace(/:/g, "");
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const sceneRef = useRef(null);
  useEffect(() => {
    if (!window.IntersectionObserver) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 });
    if (sceneRef.current) observer.observe(sceneRef.current);
    return () => observer.disconnect();
  }, []);
  const offer = IDEA_HIRE_PUBLIC_OFFER;
  return (
    <aside ref={sceneRef} className="ih5-story" data-paused={paused || !visible} aria-labelledby={`${id}-title`}>
      <div className="ih5-story-top"><span className="ih5-eyebrow">Od pomysłu do gotowej pracy</span><button type="button" className="ih5-story-pause" onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? "Wznów animację pracy" : "Zatrzymaj animację pracy"}>{paused ? "▶" : "Ⅱ"}</button></div>
      <div className="ih5-story-stage" aria-hidden="true">
        <svg viewBox="0 0 420 280" className="ih5-work-scene" focusable="false">
          <defs><linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--ih5-scene-soft)" /><stop offset="1" stopColor="var(--ih5-scene-accent)" stopOpacity=".16" /></linearGradient></defs>
          <ellipse className="ih5-scene-shadow" cx="217" cy="253" rx="151" ry="13" />
          <g className="ih5-scene-window" fill="none" stroke="var(--ih5-scene-line)" strokeWidth="1.5"><rect x="257" y="25" width="84" height="69" rx="13" /><path d="M299 25v69M257 60h84" /></g>
          <g className="ih5-scene-plant"><path d="M342 233v-42" stroke="var(--ih5-scene-accent)" strokeWidth="3" /><path d="M342 208c-33-4-30-32-30-32 25 1 35 16 30 32ZM343 200c-3-28 22-38 22-38 8 25-5 34-22 38Z" fill="var(--ih5-scene-accent)" opacity=".55" /><path d="m326 226 4 23h27l4-23Z" fill="var(--ih5-scene-ink)" opacity=".7" /></g>
          <g className="ih5-scene-chair" fill="var(--ih5-scene-ink)"><rect x="99" y="155" width="20" height="64" rx="9" opacity=".24" /><rect x="103" y="203" width="64" height="12" rx="6" /><path d="M132 215v28m-22 8 22-8 23 8" fill="none" stroke="var(--ih5-scene-ink)" strokeWidth="5" strokeLinecap="round" /></g>
          <g className="ih5-scene-person">
            <g className="ih5-person-head"><path d="M150 101v20" stroke="var(--ih5-scene-skin)" strokeWidth="14" /><circle cx="149" cy="82" r="22" fill="var(--ih5-scene-skin)" /><path d="M126 82c-7-31 33-41 45-15l-5 13c-6-6-13-8-19-8l-4 15Z" fill="var(--ih5-scene-ink)" /><path d="M157 83h15m-10 0v7" stroke="var(--ih5-scene-ink)" strokeWidth="2" fill="none" strokeLinecap="round" /></g>
            <path d="M141 128c-9 22-17 48-9 74" stroke="var(--ih5-scene-accent)" strokeWidth="37" fill="none" strokeLinecap="round" />
            <path d="m137 199 41 6-1 36m-45-38 18 16-10 28" stroke="var(--ih5-scene-ink)" strokeWidth="16" fill="none" strokeLinecap="round" /><path d="m175 243 18 7m-52-2 17 3" stroke="var(--ih5-scene-ink)" strokeWidth="10" strokeLinecap="round" />
            <g className="ih5-person-arm"><path d="m148 131 22 36 35 3" stroke="var(--ih5-scene-accent)" strokeWidth="16" fill="none" strokeLinecap="round" /><path d="m198 169 16 1" stroke="var(--ih5-scene-skin)" strokeWidth="11" strokeLinecap="round" /></g>
          </g>
          <g className="ih5-scene-desk"><rect x="182" y="176" width="134" height="9" rx="4.5" fill="var(--ih5-scene-ink)" /><path d="M198 185v65m101-65v65" stroke="var(--ih5-scene-ink)" strokeWidth="6" strokeLinecap="round" /><rect x="220" y="81" width="83" height="77" rx="9" fill="var(--ih5-scene-ink)" /><rect x="226" y="87" width="71" height="62" rx="4" fill={`url(#${id}-screen)`} /><path d="M259 158v16m-17 0h34" stroke="var(--ih5-scene-ink)" strokeWidth="5" strokeLinecap="round" /><rect x="192" y="170" width="44" height="4" rx="2" fill="var(--ih5-scene-line)" /></g>
          <g className="ih5-scene-code" stroke="var(--ih5-scene-accent)" strokeWidth="3" strokeLinecap="round"><path className="ih5-code-line is-one" d="M236 101h34" /><path className="ih5-code-line is-two" d="M242 113h41" /><path className="ih5-code-line is-three" d="M242 125h24" /><path className="ih5-code-line is-four" d="M236 137h44" /></g>
          <g className="ih5-scene-done"><circle cx="261" cy="118" r="20" fill="var(--ih5-scene-accent)" /><path d="m250 118 7 7 15-15" stroke="var(--ih5-scene-on-accent)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
          <g className="ih5-scene-pixels" fill="var(--ih5-scene-accent)"><rect x="83" y="46" width="10" height="10" rx="2" /><rect x="103" y="30" width="6" height="6" rx="1" /><rect x="328" y="123" width="8" height="8" rx="2" /><rect x="349" y="107" width="5" height="5" rx="1" /></g>
        </svg>
        <div className="ih5-story-caption"><span className="is-idea">Pomysł. Dobry początek.</span><span className="is-work">Ktoś właśnie zamienia go w efekt.</span><span className="is-done">Gotowa praca. Prosta opłata.</span></div>
      </div>
      <div className="ih5-story-offer"><div><span>Prowizja IdeaHire</span><h3 id={`${id}-title`}>{offer.percent}<span>%</span></h3></div><div className="ih5-story-limits"><strong>maks. {offer.maximum} zł</strong><span>min. {offer.minimum} zł · zlecenia do {offer.orderLimit.toLocaleString("pl-PL")} zł</span></div></div>
      <p className="ih5-story-footnote">Klient płaci wynagrodzenie wykonawcy + prowizję IdeaHire.</p>
      <Link className="ih5-story-link" to="/find-talent">Zamień pomysł w projekt <MarketIcon kind="arrow" /></Link>
    </aside>
  );
}
