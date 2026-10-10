/* IdeaHire | PACZKA 25 | 2026-10-10 | Pełny plik: src/MarketUI.jsx */
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

export function ProfileHub({ sections, active, onSelect, children, open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  function setOpen(value) {
    const next = typeof value === "function" ? value(open) : value;
    setInternalOpen(next);
    onOpenChange?.(next);
  }
  const [present, setPresent] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const activeIndex = Math.max(0, sections.findIndex((section) => section.key === active));
  const id = useId();
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const focusRequestedRef = useRef(false);
  const current = active ? sections[activeIndex] : null;
  const branches = [
    "M480 0C480 32 160 20 160 64", "M480 0V64", "M480 0C480 32 800 20 800 64",
    "M480 0C480 30 24 12 24 58V198C24 224 160 204 160 232",
    "M480 0C480 32 320 20 320 58V198C320 224 480 204 480 232",
    "M480 0C480 30 936 12 936 58V198C936 224 800 204 800 232",
  ];
  const mobileBranches = [
    "M400 0C400 22 200 14 200 36", "M400 0C400 22 600 14 600 36",
    "M400 0C400 24 8 14 8 42V140C8 160 200 142 200 164",
    "M400 0C400 24 792 14 792 42V140C792 160 600 142 600 164",
    "M400 0V268C400 288 200 270 200 292", "M400 0V268C400 288 600 270 600 292",
  ];
  useEffect(() => { setOpen(false); }, [active]);
  useEffect(() => {
    let frame = 0;
    let timer = 0;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      setPresent(true);
      if (reduced) setExpanded(true);
      else frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => setExpanded(true));
      });
    } else {
      setExpanded(false);
      if (reduced) setPresent(false);
      else timer = window.setTimeout(() => setPresent(false), 620);
    }
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, [open]);
  useEffect(() => {
    if (!open || !present || !focusRequestedRef.current) return;
    focusRequestedRef.current = false;
    const frame = window.requestAnimationFrame(() => itemRefs.current[activeIndex]?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open, present, activeIndex]);
  function close() { focusRequestedRef.current = false; setOpen(false); triggerRef.current?.focus({ preventScroll: true }); }
  function choose(section) { onSelect(section); close(); }
  function keyboard(event) {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(); return; }
    if (!event.target.closest('[role="tablist"]')) return;
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (delta === undefined && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const index = itemRefs.current.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? sections.length - 1 : (index + delta + sections.length) % sections.length;
    itemRefs.current[next]?.focus();
  }
  return <div className="ih16-profile-hub" data-open={open} data-present={present} onKeyDown={keyboard}>
    <span className="section-label">Konto</span>
    <button type="button" className="ih16-hub-trigger" ref={triggerRef} aria-expanded={open} aria-controls={`${id}-sections`}
      aria-label={`${open ? "Zamknij" : "Otwórz"} centrum profilu.${current ? ` Bieżąca sekcja: ${current.label}.` : " Wybierz funkcję konta."}`}
      onClick={() => setOpen(value => !value)} onKeyDown={event => {
        if (event.key === "ArrowDown") { event.preventDefault(); focusRequestedRef.current = true; setOpen(true); }
      }}>
      <span className="ih16-hub-emblem" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>Centrum<br />profilu</span><span className="ih16-hub-toggle" aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    <p className="ih16-hub-hint">{open ? "Wybierz funkcję poniżej" : "Kliknij koło, aby otworzyć funkcje konta"}</p>
    {current && <span className="ih16-hub-current" aria-live="polite">{current.label}</span>}
    <div className="ih18-hub-reveal" data-expanded={expanded} hidden={!present} aria-hidden={!open} inert={open ? undefined : ""}>
    <div className="ih18-hub-clip">
    <div className="ih16-hub-panel" id={`${id}-sections`} hidden={!present}>
      <div className="ih16-hub-items" role="tablist" aria-label="Sekcje profilu">
        <svg className="ih17-hub-network is-desktop" viewBox="0 0 960 356" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {branches.map((path, index) => <path key={index} d={path} pathLength="1" style={{ "--ih18-branch-index": index }} className={active && index === activeIndex ? "is-active" : undefined} vectorEffect="non-scaling-stroke" />)}
        </svg>
        <svg className="ih17-hub-network is-mobile" viewBox="0 0 800 396" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {mobileBranches.map((path, index) => <path key={index} d={path} pathLength="1" style={{ "--ih18-branch-index": index }} className={active && index === activeIndex ? "is-active" : undefined} vectorEffect="non-scaling-stroke" />)}
        </svg>
        {sections.map((section, index) => <button type="button" role="tab" key={section.key} id={`account-tab-${section.key}`}
          aria-selected={active === section.key} aria-controls="account-tab-panel" tabIndex={open ? 0 : -1}
          className={`ih16-hub-item${active === section.key ? " is-active" : ""}`} style={{ "--ih17-node-index": index }} ref={el => { itemRefs.current[index] = el; }}
          onClick={() => choose(section)}><span className="ih16-hub-number" aria-hidden="true">{section.number}</span><span>{section.label}</span></button>)}
      </div>
      {children}
    </div>
    </div>
    </div>
  </div>;
}

export function MarketIcon({ kind = "search", ...props }) {
  const paths = {
    search: "m20 20-4.2-4.2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    close: "m6 6 12 12M18 6 6 18",
    plus: "M12 5v14M5 12h14",
    check: "m5 12 4 4L19 6",
    message: "M5 4h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-6 3V6a2 2 0 0 1 2-2ZM7 9h10M7 13h6",
    chevron: "m7 10 5 5 5-5",
    files: "M8 3h7l5 5v12H8ZM15 3v6h5M4 7v15h12",
    expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    collapse: "M3 8h5V3m13 5h-5V3M8 21v-5H3m13 5v-5h5",
    panels: "M3 4h18v16H3ZM14 4v16",
    calendar: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4M17 3v4M3 10h18M7 14h2M13 14h2M7 18h2",
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[kind] || paths.search} /></svg>;
}

export function MarketHeader({ eyebrow, title, description, children }) {
  return (
    <header className="ih5-page-heading">
      <div><span className="ih5-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {children && <div className="ih5-heading-actions">{children}</div>}
    </header>
  );
}

export function MarketSelect({ id, label, value, options, onChange }) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const typeahead = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ side: "down", height: 320 });
  const selected = Math.max(0, options.findIndex((option) => option.value === value));
  const [focused, setFocused] = useState(selected);
  const selectedOption = options[selected];
  const enabled = options.map((option, index) => !option.disabled ? index : -1).filter((index) => index >= 0);
  useEffect(() => {
    if (!open) return undefined;
    optionRefs.current[focused]?.focus({ preventScroll: true });
    optionRefs.current[focused]?.scrollIntoView?.({ block: "nearest" });
  }, [open, focused]);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function close(restoreFocus = false) {
    setOpen(false);
    typeahead.current = { text: "", time: 0 };
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }
  function show(last = false) {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = (window.visualViewport?.height || window.innerHeight) - rect.bottom - 16;
      const above = rect.top - 16;
      const up = below < 220 && above > below;
      setMenuLayout({ side: up ? "up" : "down", height: Math.max(80, Math.min(320, up ? above : below)) });
    }
    setFocused(last ? enabled[enabled.length - 1] : enabled.includes(selected) ? selected : enabled[0]);
    setOpen(true);
  }
  function choose(index) { if (options[index]?.disabled) return; onChange(options[index].value); close(true); }
  function keyboard(event) {
    if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === "Tab") { close(); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(event.key === "End"); return; }
      const current = enabled.indexOf(focused);
      const index = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (event.key === "ArrowUp" ? -1 : 1) + enabled.length) % enabled.length;
      setFocused(enabled[index]); return;
    }
    if (open && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); choose(focused); return; }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") {
      event.preventDefault();
      const now = Date.now();
      const previous = now - typeahead.current.time < 700 ? typeahead.current.text : "";
      const typed = `${previous}${event.key}`.toLocaleLowerCase("pl-PL");
      typeahead.current = { text: typed, time: now };
      const normalize = (text) => text.toLocaleLowerCase("pl-PL").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
      const next = enabled.find((index) => normalize(options[index].label).startsWith(normalize(typed)));
      if (next !== undefined) { setFocused(next); setOpen(true); }
    }
  }
  return (
    <div className="ih7-select" ref={rootRef} data-open={open} data-side={menuLayout.side} style={{ "--ih7-menu-height": `${menuLayout.height}px` }} onKeyDown={keyboard}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}>
      <span id={`${selectId}-label`} className="ih7-select-label">{label}</span>
      <button type="button" id={selectId} ref={triggerRef} className="ih7-select-trigger" aria-haspopup="listbox"
        aria-expanded={open} aria-controls={`${selectId}-options`} aria-labelledby={`${selectId}-label ${selectId}-value`}
        onClick={() => open ? close() : show()}>
        <span id={`${selectId}-value`}>{selectedOption?.label || "Wybierz"}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="none"><path d="m5 7 5 5 5-5" /></svg>
      </button>
      <div className="ih7-select-menu" role="listbox" id={`${selectId}-options`} aria-labelledby={`${selectId}-label`}
        aria-hidden={!open} inert={open ? undefined : ""}>
        {options.map((option, index) => <button type="button" role="option" key={option.value}
          ref={(element) => { optionRefs.current[index] = element; }} tabIndex={open && focused === index ? 0 : -1}
          aria-selected={option.value === value} aria-disabled={Boolean(option.disabled)} disabled={option.disabled}
          className="ih7-select-option" onFocus={() => setFocused(index)} onClick={() => choose(index)}>
          <span>{option.label}</span>{option.value === value && <MarketIcon kind="check" />}
        </button>)}
      </div>
    </div>
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
      <MarketSelect id={`${id}-category`} label="Kategoria" value={category} onChange={onCategory}
        options={[{ value: "Wszystkie", label: "Wszystkie kategorie" }, ...categories.map((value) => ({ value, label: categoryLabel(value) }))]} />
      {onSort && <MarketSelect id={`${id}-sort`} label="Kolejność" value={sort} onChange={onSort}
        options={[{ value: "latest", label: "Najnowsze" }, { value: "matched", label: "Dopasowane do mnie", disabled: !matchedAvailable }]} />}
    </section>
  );
}

const STEP_TILES = Array.from({ length: 84 }, (_, index) => {
  const column = index % 12;
  const row = Math.floor(index / 12);
  return {
    "--tile-x": `${4 + column * 8.2}%`, "--tile-y": `${5 + row * 14.5}%`,
    "--tile-dx": `${(column - 5.5) * 9}px`, "--tile-dy": `${(row - 3) * 11}px`,
    "--tile-delay": `${(column + row) * 17}ms`, "--tile-turn": `${(index % 3 - 1) * 12}deg`,
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
    timeout.current = window.setTimeout(() => setActive(false), 1600);
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

export function HomePreviewMotion({ children }) {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!window.IntersectionObserver) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 });
    if (rootRef.current) observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);
  return <div className="hero-visual ih-orbit-preview ih6-job-preview ih7-preview-motion" ref={rootRef} data-paused={!visible}>
    {children}
  </div>;
}

export function CommissionStory() {
  const id = useId().replace(/:/g, "");
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
    <aside ref={sceneRef} className="ih5-story" data-paused={!visible} aria-labelledby={`${id}-title`}>
      <div className="ih5-story-top"><span className="ih5-eyebrow">Od pomysłu do gotowej pracy</span></div>
      <div className="ih5-story-stage" aria-hidden="true">
        <svg viewBox="0 0 420 280" className="ih5-work-scene" focusable="false">
          <defs><linearGradient id={`${id}-screen`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--ih5-scene-soft)" /><stop offset="1" stopColor="var(--ih5-scene-accent)" stopOpacity=".16" /></linearGradient></defs>
          <ellipse className="ih5-scene-shadow" cx="217" cy="253" rx="151" ry="13" />
          <g className="ih5-scene-window" fill="none" data-scene-stroke="line" stroke="var(--ih5-scene-line)" strokeWidth="1.5"><rect x="257" y="25" width="84" height="69" rx="13" /><path d="M299 25v69M257 60h84" /></g>
          <g className="ih5-scene-plant"><path d="M342 233v-42" data-scene-stroke="accent" stroke="var(--ih5-scene-accent)" strokeWidth="3" /><path d="M342 208c-33-4-30-32-30-32 25 1 35 16 30 32ZM343 200c-3-28 22-38 22-38 8 25-5 34-22 38Z" data-scene-fill="accent" fill="var(--ih5-scene-accent)" opacity=".55" /><path d="m326 226 4 23h27l4-23Z" data-scene-fill="ink" fill="var(--ih5-scene-ink)" opacity=".7" /></g>
          <g className="ih5-scene-chair" data-scene-fill="ink" fill="var(--ih5-scene-ink)"><rect x="99" y="155" width="20" height="64" rx="9" opacity=".24" /><rect x="103" y="203" width="64" height="12" rx="6" /><path d="M132 215v28m-22 8 22-8 23 8" fill="none" data-scene-stroke="ink" stroke="var(--ih5-scene-ink)" strokeWidth="5" strokeLinecap="round" /></g>
          <g className="ih5-scene-person">
            <g className="ih5-person-head"><path d="M150 101v20" data-scene-stroke="skin" stroke="var(--ih5-scene-skin)" strokeWidth="14" /><circle cx="149" cy="82" r="22" data-scene-fill="skin" fill="var(--ih5-scene-skin)" /><path d="M126 82c-7-31 33-41 45-15l-5 13c-6-6-13-8-19-8l-4 15Z" data-scene-fill="ink" fill="var(--ih5-scene-ink)" /><circle cx="160" cy="81" r="1.6" data-person-part="eye" fill="var(--ih16-face)" /><path d="m166 84 5 4h-6m-5 7h5" data-person-part="face" stroke="var(--ih16-face)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
            <path d="M141 128c-9 22-17 48-9 74" data-scene-stroke="accent" stroke="var(--ih5-scene-accent)" strokeWidth="37" data-person-part="shirt" fill="none" strokeLinecap="round" />
            <path d="m137 199 41 6-1 36m-45-38 18 16-10 28" data-scene-stroke="ink" stroke="var(--ih5-scene-ink)" strokeWidth="16" data-person-part="trousers" fill="none" strokeLinecap="round" /><path d="m175 243 18 7m-52-2 17 3" data-scene-stroke="ink" stroke="var(--ih5-scene-ink)" strokeWidth="10" strokeLinecap="round" />
            <g className="ih5-person-arm"><path d="m148 131 22 36 35 3" data-scene-stroke="accent" stroke="var(--ih5-scene-accent)" strokeWidth="16" data-person-part="shirt" fill="none" strokeLinecap="round" /><path d="m198 169 16 1" data-scene-stroke="skin" stroke="var(--ih5-scene-skin)" strokeWidth="11" strokeLinecap="round" /></g>
          </g>
          <g className="ih5-scene-desk"><rect x="182" y="176" width="134" height="9" rx="4.5" data-scene-fill="ink" fill="var(--ih5-scene-ink)" /><path d="M198 185v65m101-65v65" data-scene-stroke="ink" stroke="var(--ih5-scene-ink)" strokeWidth="6" strokeLinecap="round" /><rect x="220" y="81" width="83" height="77" rx="9" data-scene-fill="ink" fill="var(--ih5-scene-ink)" /><rect x="226" y="87" width="71" height="62" rx="4" fill={`url(#${id}-screen)`} /><path d="M259 158v16m-17 0h34" data-scene-stroke="ink" stroke="var(--ih5-scene-ink)" strokeWidth="5" strokeLinecap="round" /><rect x="192" y="170" width="44" height="4" rx="2" data-scene-fill="line" fill="var(--ih5-scene-line)" /></g>
          <g className="ih5-scene-code" data-scene-stroke="accent" stroke="var(--ih5-scene-accent)" strokeWidth="3" strokeLinecap="round"><path className="ih5-code-line is-one" d="M236 101h34" /><path className="ih5-code-line is-two" d="M242 113h41" /><path className="ih5-code-line is-three" d="M242 125h24" /><path className="ih5-code-line is-four" d="M236 137h44" /></g>
          <g className="ih5-scene-done"><circle cx="261" cy="118" r="20" data-scene-fill="accent" fill="var(--ih5-scene-accent)" /><path d="m250 118 7 7 15-15" data-scene-stroke="on-accent" stroke="var(--ih5-scene-on-accent)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>
          <g className="ih5-scene-pixels" data-scene-fill="accent" fill="var(--ih5-scene-accent)"><rect x="83" y="46" width="10" height="10" rx="2" /><rect x="103" y="30" width="6" height="6" rx="1" /><rect x="328" y="123" width="8" height="8" rx="2" /><rect x="349" y="107" width="5" height="5" rx="1" /></g>
        </svg>
        <div className="ih5-story-caption"><span className="is-idea">Pomysł. Dobry początek.</span><span className="is-work">Ktoś właśnie zamienia go w efekt.</span><span className="is-done">Gotowa praca. Prosta opłata.</span></div>
      </div>
      <div className="ih5-story-offer"><div><span>Prowizja IdeaHire</span><h3 id={`${id}-title`}>{offer.percent}<span>%</span></h3></div><div className="ih5-story-limits"><strong>maks. {offer.maximum} zł</strong><span>min. {offer.minimum} zł · zlecenia do {offer.orderLimit.toLocaleString("pl-PL")} zł</span></div></div>
      <p className="ih5-story-footnote">Klient płaci wynagrodzenie wykonawcy + prowizję IdeaHire.</p>
      <Link className="ih5-story-link" to="/find-talent">Zamień pomysł w projekt <MarketIcon kind="arrow" /></Link>
    </aside>
  );
}

// Shared local calendar. ISO values remain unchanged for forms and server validation.
export function IdeaHireDateField({ type = "date", value = "", onChange, min, max, id, name, required, disabled, autoComplete, ...props }) {
  const generated = useId();
  const fieldId = id || generated;
  const root = useRef(null);
  const panel = useRef(null);
  const trigger = useRef(null);
  const focusPending = useRef(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [focusedDay, setFocusedDay] = useState("");
  const [month, setMonth] = useState("");
  const isTime = type === "datetime-local";
  const months = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
  const weekdays = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
  const pad = number => String(number).padStart(2, "0");
  const isoDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  function parseDate(raw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw || "")) return null;
    const [year, monthNumber, day] = raw.split("-").map(Number);
    const date = new Date(0);
    date.setFullYear(year, monthNumber - 1, day);
    date.setHours(12, 0, 0, 0);
    return isoDate(date) === raw ? date : null;
  }
  function hasValidFormat(raw) {
    if (!parseDate(raw?.slice(0, 10))) return false;
    return !isTime || /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(raw);
  }
  const now = new Date();
  const today = isoDate(now);
  const nowYear = now.getFullYear();
  const lowerDate = parseDate(min?.slice(0, 10)) ? min.slice(0, 10) : `${nowYear - 120}-01-01`;
  const upperDate = parseDate(max?.slice(0, 10)) ? max.slice(0, 10) : `${nowYear + 30}-12-31`;
  const lowerMonth = lowerDate.slice(0, 7);
  const upperMonth = upperDate.slice(0, 7);
  const minYear = Number(lowerDate.slice(0, 4));
  const maxYear = Number(upperDate.slice(0, 4));
  const rangeAvailable = lowerDate <= upperDate && (!min || !max || min <= max);
  const dateKey = draft.slice(0, 10);
  const timeKey = draft.slice(11, 16) || `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const [year, monthNumber] = (month || today.slice(0, 7)).split("-").map(Number);
  const firstDay = parseDate(`${year}-${pad(monthNumber)}-01`);
  const days = new Date(year, monthNumber, 0).getDate();
  const offset = firstDay ? (firstDay.getDay() + 6) % 7 : 0;
  const valid = candidate => hasValidFormat(candidate) && candidate.slice(0, 10) >= lowerDate && candidate.slice(0, 10) <= upperDate && (!min || candidate >= min) && (!max || candidate <= max);
  const caption = props["aria-label"] || (isTime ? "Data i godzina" : "Wybierz datę");
  function format(raw) {
    return hasValidFormat(raw) ? `${raw.slice(8, 10)}.${raw.slice(5, 7)}.${raw.slice(0, 4)}${isTime ? `, ${raw.slice(11, 16)}` : ""}` : "";
  }
  function clampDate(raw) { return raw < lowerDate ? lowerDate : raw > upperDate ? upperDate : raw; }
  function candidateForDate(raw) {
    let candidate = isTime ? `${raw}T${timeKey}` : raw;
    if (min && candidate < min && min.slice(0, 10) === raw) candidate = min;
    if (max && candidate > max && max.slice(0, 10) === raw) candidate = max;
    return candidate;
  }
  function close() {
    setOpen(false);
    if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
  }
  function show() {
    if (disabled) return;
    const initialDate = clampDate(hasValidFormat(value) ? value.slice(0, 10) : today);
    let initial = hasValidFormat(value) ? value : candidateForDate(initialDate);
    if (min && initial < min) initial = min;
    if (max && initial > max) initial = max;
    setDraft(initial);
    setMonth(initial.slice(0, 7));
    setFocusedDay(initial.slice(0, 10));
    focusPending.current = true;
    setOpen(true);
  }
  function commit(candidate) {
    if (candidate && !valid(candidate)) return;
    if (!candidate && required) return;
    onChange?.({ target: { value: candidate, name }, currentTarget: { value: candidate, name } });
    close();
  }
  function changeMonth(nextMonth, focus = false) {
    const next = nextMonth < lowerMonth ? lowerMonth : nextMonth > upperMonth ? upperMonth : nextMonth;
    const [nextYear, nextNumber] = next.split("-").map(Number);
    const lastDay = new Date(nextYear, nextNumber, 0).getDate();
    const day = Math.min(Number(focusedDay.slice(8, 10)) || 1, lastDay);
    setFocusedDay(clampDate(`${next}-${pad(day)}`));
    setMonth(next);
    focusPending.current = focus;
  }
  function moveMonth(delta, focus = false) {
    const date = parseDate(`${month}-01`);
    if (!date) return;
    date.setMonth(date.getMonth() + delta);
    changeMonth(isoDate(date).slice(0, 7), focus);
  }
  function dayKeyDown(event) {
    const date = parseDate(event.target.dataset.date);
    if (!date) return;
    const shifts = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      moveMonth((event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1), true);
      return;
    }
    let shift = shifts[event.key];
    if (event.key === "Home") shift = -((date.getDay() + 6) % 7);
    if (event.key === "End") shift = 6 - ((date.getDay() + 6) % 7);
    if (shift == null) return;
    event.preventDefault();
    date.setDate(date.getDate() + shift);
    const next = clampDate(isoDate(date));
    setFocusedDay(next);
    setMonth(next.slice(0, 7));
    focusPending.current = true;
  }
  useEffect(() => {
    if (!open || !focusPending.current) return;
    focusPending.current = false;
    const selected = panel.current?.querySelector(`[data-date="${focusedDay}"]:not(:disabled)`);
    const firstAvailable = panel.current?.querySelector('.ih20-calendar-days button:not(:disabled)');
    (selected || firstAvailable || panel.current?.querySelector('button'))?.focus({ preventScroll: true });
  }, [open, month, focusedDay]);
  useEffect(() => { if (disabled && open) setOpen(false); }, [disabled, open]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.getPropertyValue("overflow");
    const previousPriority = document.body.style.getPropertyPriority("overflow");
    document.body.style.setProperty("overflow", "hidden", "important");
    function outside(event) {
      if (!panel.current?.contains(event.target) && !root.current?.contains(event.target)) close();
    }
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      if (previousOverflow) document.body.style.setProperty("overflow", previousOverflow, previousPriority);
      else document.body.style.removeProperty("overflow");
    };
  }, [open]);
  const cells = Array.from({ length: Math.ceil((days + offset) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    if (day < 1 || day > days) return null;
    const key = `${month}-${pad(day)}`;
    return { day, key, unavailable: !rangeAvailable || key < lowerDate || key > upperDate };
  });
  return <span className="ih20-date-field" ref={root}>
    <input {...props} ref={trigger} id={fieldId} type="text" value={format(value)} readOnly disabled={disabled} autoComplete={autoComplete}
      placeholder={props.placeholder || (isTime ? "Wybierz datę i godzinę" : "Wybierz datę")}
      aria-haspopup="dialog" aria-expanded={open} aria-required={required || undefined} aria-controls={open ? `${fieldId}-calendar` : undefined}
      onClick={show} onKeyDown={event => { if (["Enter", " ", "ArrowDown"].includes(event.key)) { event.preventDefault(); show(); } }} />
    <input className="ih20-date-validator" type={type} name={name} value={value} min={min} max={max} required={required} disabled={disabled}
      tabIndex={-1} aria-hidden="true" onChange={onChange} onInvalid={event => { event.preventDefault(); show(); }} />
    <span className="ih20-date-icon" aria-hidden="true"><MarketIcon kind="calendar" /></span>
    {open && createPortal(<div className="ih20-calendar-backdrop" onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <section ref={panel} id={`${fieldId}-calendar`} className="ih20-calendar" role="dialog" aria-modal="true" aria-labelledby={`${fieldId}-calendar-title`}
        onKeyDown={event => {
          event.stopPropagation();
          if (event.key === "Escape") { event.preventDefault(); close(); }
          if (event.key === "Tab") {
            const controls = [...panel.current.querySelectorAll('button:not(:disabled):not([tabindex="-1"]), select:not(:disabled)')];
            if (event.shiftKey && (document.activeElement === controls[0] || !controls.includes(document.activeElement))) { event.preventDefault(); controls.at(-1)?.focus(); }
            else if (!event.shiftKey && (document.activeElement === controls.at(-1) || !controls.includes(document.activeElement))) { event.preventDefault(); controls[0]?.focus(); }
          }
        }}>
        <header><strong id={`${fieldId}-calendar-title`}>{caption}</strong><button type="button" onClick={close} aria-label="Zamknij kalendarz">×</button></header>
        <div className="ih20-calendar-navigation">
          <button type="button" onClick={() => moveMonth(-1)} disabled={!rangeAvailable || month <= lowerMonth} aria-label="Poprzedni miesiąc">‹</button>
          <select aria-label="Miesiąc" value={monthNumber} onChange={event => changeMonth(`${year}-${pad(event.target.value)}`)}>
            {months.map((label, index) => <option value={index + 1} key={label} disabled={`${year}-${pad(index + 1)}` < lowerMonth || `${year}-${pad(index + 1)}` > upperMonth}>{label}</option>)}
          </select>
          <select aria-label="Rok" value={year} onChange={event => changeMonth(`${event.target.value}-${pad(monthNumber)}`)}>
            {Array.from({ length: Math.max(0, maxYear - minYear + 1) }, (_, index) => <option value={maxYear - index} key={index}>{maxYear - index}</option>)}
          </select>
          <button type="button" onClick={() => moveMonth(1)} disabled={!rangeAvailable || month >= upperMonth} aria-label="Następny miesiąc">›</button>
        </div>
        <div className="ih20-calendar-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
        <div className="ih20-calendar-days" role="grid" aria-label={`${months[monthNumber - 1]} ${year}`} onKeyDown={dayKeyDown}>
          {Array.from({ length: cells.length / 7 }, (_, row) => <div className="ih21-calendar-row" role="row" key={row}>
            {cells.slice(row * 7, row * 7 + 7).map((cell, column) => cell ? <button type="button" role="gridcell" key={cell.key} data-day={cell.day} data-date={cell.key}
              disabled={cell.unavailable} tabIndex={focusedDay === cell.key ? 0 : -1} aria-selected={dateKey === cell.key}
              aria-current={today === cell.key ? "date" : undefined} aria-label={parseDate(cell.key)?.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
              onFocus={() => setFocusedDay(cell.key)} onClick={() => { if (isTime) setDraft(candidateForDate(cell.key)); else commit(cell.key); }}>{cell.day}</button>
              : <span role="gridcell" aria-hidden="true" key={`blank-${column}`} />)}
          </div>)}
        </div>
        {isTime && <div className="ih20-calendar-time"><span>Godzina</span>
          <select aria-label="Godzina" value={timeKey.slice(0, 2)} onChange={event => setDraft(`${dateKey}T${event.target.value}:${timeKey.slice(3, 5)}`)}>
            {Array.from({ length: 24 }, (_, index) => pad(index)).map(hour => <option key={hour}>{hour}</option>)}
          </select><span>:</span>
          <select aria-label="Minuta" value={timeKey.slice(3, 5)} onChange={event => setDraft(`${dateKey}T${timeKey.slice(0, 2)}:${event.target.value}`)}>
            {Array.from({ length: 60 }, (_, index) => pad(index)).map(minute => <option key={minute}>{minute}</option>)}
          </select>
        </div>}
        {(!rangeAvailable || (isTime && !valid(draft))) && <p className="ih21-calendar-hint" role="status">{!rangeAvailable ? "Brak dostępnych dat w tym zakresie." : `Wybierz termin${min ? ` od ${format(min)}` : ""}${max ? ` do ${format(max)}` : ""}.`}</p>}
        <footer>{!required && <button type="button" onClick={() => commit("")}>Wyczyść</button>}<button type="button" onClick={close}>Anuluj</button>{isTime && <button type="button" className="is-primary" disabled={!valid(draft)} onClick={() => commit(draft)}>Wybierz</button>}</footer>
      </section>
    </div>, document.body)}
  </span>;
}
