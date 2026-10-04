/* IdeaHire | PACZKA 05 | 2026-10-04 | Pełny plik: src/MarketUI.jsx */
import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

// The agreed public offer. Charging stays in the server's payment-summary RPC.
export const IDEA_HIRE_PUBLIC_OFFER = Object.freeze({ percent: 6, minimum: 20, maximum: 249, orderLimit: 10000 });

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
