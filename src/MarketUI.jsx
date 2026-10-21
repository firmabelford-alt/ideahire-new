/* IdeaHire | P40 | 2026-10-15 | Pełny plik: src/MarketUI.jsx | Moduły, mikrokwadraty i widoczność haseł */
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useSitePreferences, translateUiText } from "./Preferences";
import { SubpageHeading, SubpageCatalogTabs } from "./Subpages";
import { BrandLogo } from "./Brand";

// The agreed public offer. Charging stays in the server's payment-summary RPC.
export const IDEA_HIRE_PUBLIC_OFFER = Object.freeze({ percent: 5.5, minimum: 20, maximum: 229, orderMinimum: 1, orderLimit: 10000 });

export function IdeaHireLogo({ className = "logo", to = "/" }) {
  return <BrandLogo className={className} to={to} />;
}

/* P40 — Splot: jeden język kwadratów dla strony i centrum konta. */
const IH40_UI_STYLES = String.raw`
__IH40__ .ih40-account-overview { display:block!important;min-height:0!important;margin:0 0 24px!important;padding:8px 0!important; }
__IH40__ .ih40-hub { --m-ink:var(--ih6-ink,#182535);--m-muted:var(--ih6-muted,#5c6879);--m-line:var(--ih6-line,#d5dce5);--m-surface:var(--ih6-surface,#fff);--m-soft:var(--ih6-soft,#f1f4f8);--m-accent:var(--ih6-accent,#2859cc);display:block!important;width:100%!important;max-width:1120px!important;margin:0 auto!important;color:var(--m-ink)!important; }
__IH40__ .ih40-hub,__IH40__ .ih40-hub * {box-sizing:border-box!important;font-family:Inter,system-ui,sans-serif!important;-webkit-text-fill-color:currentColor!important;}
__IH40__ .ih40-hub [hidden] {display:none!important;}
__IH40__ .ih40-hub-heading {display:flex!important;align-items:center!important;justify-content:space-between!important;gap:24px!important;min-height:176px!important;padding:26px 30px!important;margin:0 0 22px!important;border:1px solid var(--m-line)!important;border-radius:22px!important;overflow:hidden!important;background:linear-gradient(125deg,var(--m-surface),var(--m-soft))!important;position:relative!important;}
__IH40__ .ih40-hub-heading h1 {font-size:clamp(27px,3.1vw,39px)!important;font-weight:650!important;line-height:1.13!important;letter-spacing:-.045em!important;margin:10px 0 12px!important;color:var(--m-ink)!important;text-align:left!important;}
__IH40__ .ih40-hub-heading > div:first-child {min-width:0!important;flex:1!important;}
__IH40__ .ih40-hub-heading p {max-width:510px!important;margin:0!important;color:var(--m-muted)!important;font-size:14px!important;line-height:1.65!important;overflow-wrap:anywhere!important;}
__IH40__ .ih40-hub-eyebrow {display:flex!important;align-items:center!important;gap:9px!important;font-size:10px!important;line-height:1.4!important;letter-spacing:.13em!important;text-transform:uppercase!important;color:var(--m-muted)!important;}
__IH40__ .ih40-hub-eyebrow i {width:7px!important;height:7px!important;display:block!important;background:var(--m-accent)!important;border-radius:1px!important;}
__IH40__ .ih40-hub-home {display:inline-flex!important;align-items:center!important;gap:10px!important;min-height:44px!important;padding:10px 14px!important;border:1px solid var(--m-line)!important;border-radius:10px!important;background:var(--m-surface)!important;color:var(--m-ink)!important;font-size:12px!important;font-weight:600!important;white-space:nowrap!important;cursor:pointer!important;}
__IH40__ .ih40-hub[data-expanded="false"] .ih40-hub-heading {min-height:0!important;padding:16px 22px!important;margin-bottom:0!important;}
__IH40__ .ih40-hub[data-expanded="false"] .ih40-hub-heading h1 {font-size:21px!important;margin:6px 0 0!important;}
__IH40__ .ih40-hub[data-expanded="false"] .ih40-hub-heading p {display:none!important;}
__IH40__ .ih40-modules {display:block!important;position:relative!important;flex:0 0 172px!important;width:172px!important;height:146px!important;margin:0 10px!important;perspective:700px!important;pointer-events:none!important;}
__IH40__ .ih40-module-plane {position:absolute!important;inset:16px 24px!important;display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:10px!important;transform:rotateX(42deg) rotateZ(-28deg)!important;transform-style:preserve-3d!important;}
__IH40__ .ih40-module-plane > i {display:block!important;border:10px solid var(--m-accent)!important;border-radius:6px!important;aspect-ratio:1!important;background:transparent!important;box-shadow:3px 5px 0 color-mix(in srgb,var(--m-accent) 42%,var(--m-ink)),10px 13px 20px color-mix(in srgb,var(--m-ink) 15%,transparent)!important;transform:translateZ(calc(var(--module) * 7px))!important;}
__IH40__ .ih40-module-plane > i:nth-child(2),__IH40__ .ih40-module-plane > i:nth-child(3) {border-color:var(--m-ink)!important;}
__IH40__ .ih40-hub-heading:hover .ih40-module-plane > i {animation:ih40-module-in 1100ms cubic-bezier(.18,.8,.2,1) both!important;animation-delay:calc(var(--module) * 65ms)!important;}
__IH40__ .ih40-hub-section-heading {display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;margin:0 0 12px!important;}
__IH40__ .ih40-hub-section-heading h2 {margin:0!important;font-size:14px!important;font-weight:650!important;color:var(--m-ink)!important;}
__IH40__ .ih40-hub-section-heading > span {font-size:11px!important;color:var(--m-muted)!important;}
__IH40__ .ih40-hub-grid {display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;width:100%!important;margin:0!important;padding:0!important;}
__IH40__ .ih40-hub-tile {position:relative!important;display:grid!important;grid-template-columns:1fr auto!important;grid-template-rows:36px auto 1fr!important;align-items:start!important;gap:12px 10px!important;min-width:0!important;width:100%!important;min-height:166px!important;padding:20px!important;margin:0!important;overflow:hidden!important;border:1px solid var(--m-line)!important;border-radius:16px!important;background:var(--m-surface)!important;color:var(--m-ink)!important;box-shadow:0 3px 10px color-mix(in srgb,var(--m-ink) 3%,transparent)!important;text-align:left!important;cursor:pointer!important;transition:border-color 180ms,box-shadow 180ms,background 180ms!important;}
__IH40__ .ih40-hub-tile::after {content:""!important;position:absolute!important;width:60px!important;height:60px!important;right:-18px!important;bottom:-20px!important;border:1px solid var(--m-line)!important;transform:rotate(-16deg)!important;pointer-events:none!important;}
__IH40__ .ih40-hub-tile:hover,__IH40__ .ih40-hub-tile[aria-selected="true"] {border-color:var(--m-accent)!important;background:color-mix(in srgb,var(--m-accent) 4%,var(--m-surface))!important;box-shadow:0 8px 22px color-mix(in srgb,var(--m-ink) 7%,transparent)!important;}
__IH40__ .ih40-hub-tile > .ih40-hub-symbol {grid-column:1!important;grid-row:1!important;display:grid!important;place-items:center!important;width:34px!important;height:34px!important;border:1px solid var(--m-line)!important;border-radius:8px!important;color:var(--m-accent)!important;background:var(--m-soft)!important;}
__IH40__ .ih40-hub-tile > small {grid-column:2!important;grid-row:1!important;color:var(--m-muted)!important;font-size:10px!important;letter-spacing:.08em!important;}
__IH40__ .ih40-hub-tile > strong {grid-column:1 / -1!important;grid-row:2!important;color:inherit!important;font-size:16px!important;font-weight:650!important;line-height:1.3!important;}
__IH40__ .ih40-hub-tile > .ih40-hub-description {grid-column:1 / -1!important;grid-row:3!important;display:block!important;max-width:265px!important;color:var(--m-muted)!important;font-size:12px!important;font-weight:400!important;line-height:1.6!important;}
__IH40__ .ih40-hub-actions {margin:26px 0 0!important;padding:22px 0 0!important;border-top:1px solid var(--m-line)!important;}
__IH40__ .ih40-hub-actions .ih14-account-actions {display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;margin:0!important;padding:0!important;border:0!important;opacity:1!important;transform:none!important;}
__IH40__ .ih40-hub-actions .ih14-account-action-group {gap:10px!important;padding:18px!important;border-radius:14px!important;background:var(--m-soft)!important;}
__IH40__ .ih40-hub-actions .ih14-account-action-group h2 {font-size:13px!important;}
__IH40__ .ih40-hub-actions .ih14-account-action-group :is(a,button) {font-size:12px!important;min-height:44px!important;padding:10px!important;line-height:1.5!important;}
__IH40__ .ih40-hub :is(button,a):focus-visible {outline:3px solid var(--m-accent)!important;outline-offset:3px!important;}
__IH40__ .ih40-password {display:block!important;position:relative!important;width:100%!important;min-width:0!important;margin:0!important;padding:0!important;}
__IH40__ .ih40-password > input {display:block!important;width:100%!important;min-width:0!important;box-sizing:border-box!important;padding-right:58px!important;font-size:16px!important;}
__IH40__ .ih40-password > button {position:absolute!important;inset:50% 5px auto auto!important;transform:translateY(-50%)!important;display:grid!important;place-items:center!important;width:44px!important;height:44px!important;min-width:44px!important;min-height:44px!important;margin:0!important;padding:11px!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;color:var(--ih7-muted,#5b687b)!important;cursor:pointer!important;}
__IH40__ .ih40-password > button:hover {color:var(--ih7-ink,#20314a)!important;background:color-mix(in srgb,currentColor 8%,transparent)!important;}
__IH40__ .ih40-password > button:focus-visible {outline:2px solid var(--ih6-accent,#2859cc)!important;outline-offset:-2px!important;}
__IH40__ .ih40-password > button svg {display:block!important;width:21px!important;height:21px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.7!important;}
__IH40__ .ih40-step {position:relative!important;isolation:isolate!important;display:block!important;min-width:0!important;min-height:280px!important;padding:0!important;overflow:hidden!important;border:1px solid var(--ih-home-line,#cdd6e3)!important;border-radius:22px!important;background:var(--ih-home-surface,#fff)!important;color:var(--ih-home-ink,#182535)!important;box-shadow:0 6px 24px color-mix(in srgb,currentColor 4%,transparent)!important;}
__IH40__ .ih40-step > button {display:flex!important;position:relative!important;z-index:2!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;gap:0!important;width:100%!important;min-width:0!important;height:100%!important;min-height:280px!important;padding:28px!important;margin:0!important;border:0!important;border-radius:inherit!important;background:transparent!important;color:inherit!important;box-shadow:none!important;transform:none!important;text-align:left!important;cursor:pointer!important;-webkit-text-fill-color:currentColor!important;font-family:inherit!important;}
__IH40__ .ih40-step > button:focus-visible {outline:3px solid var(--ih-home-accent,currentColor)!important;outline-offset:-5px!important;}
__IH40__ .ih40-step-number {display:grid!important;place-items:center!important;flex:0 0 39px!important;width:39px!important;height:39px!important;margin:0 0 34px!important;border:1px solid var(--ih-home-line,#cdd6e3)!important;border-radius:9px!important;font-size:11px!important;font-weight:600!important;}
__IH40__ .ih40-step-title {display:block!important;margin:0 0 12px!important;font-size:clamp(20px,1.8vw,25px)!important;line-height:1.2!important;letter-spacing:-.035em!important;font-weight:650!important;}
__IH40__ .ih40-step-copy {display:block!important;max-width:310px!important;margin:0!important;color:var(--ih-home-muted,#5c6879)!important;font-size:13px!important;font-weight:400!important;line-height:1.75!important;}
__IH40__ .ih40-step-mark {position:absolute!important;top:28px!important;right:28px!important;display:grid!important;grid-template-columns:repeat(2,6px)!important;gap:3px!important;}
__IH40__ .ih40-step-mark i {display:block!important;width:6px!important;height:6px!important;background:currentColor!important;border-radius:1px!important;opacity:.65!important;}
__IH40__ .ih40-step-mosaic {position:absolute!important;inset:0!important;z-index:1!important;display:grid!important;grid-template-columns:repeat(16,minmax(0,1fr))!important;grid-template-rows:none!important;grid-auto-rows:max-content!important;align-content:start!important;gap:1px!important;padding:0!important;margin:0!important;pointer-events:none!important;}
__IH40__ .ih40-step-mosaic i {display:block!important;min-width:0!important;min-height:0!important;aspect-ratio:1!important;background:var(--ih-home-accent,#2859cc)!important;border-radius:1px!important;opacity:0;animation:ih40-square-build 1380ms cubic-bezier(.17,.75,.23,1) both!important;animation-delay:var(--micro-delay)!important;transform-origin:center!important;}
@keyframes ih40-square-build {0%{opacity:0;transform:translate3d(var(--micro-x),var(--micro-y),0) rotate(var(--micro-turn)) scale(.12)}38%{opacity:var(--micro-opacity);transform:translate3d(0,0,0) rotate(0) scale(1)}68%{opacity:var(--micro-opacity);transform:scale(1)}100%{opacity:0;transform:scale(1)}}
@keyframes ih40-module-in {0%{opacity:.1;transform:translate3d(0,20px,-45px) rotateY(70deg)}65%,100%{opacity:1;transform:translateZ(calc(var(--module) * 7px))}}
@media(max-width:760px){
 __IH40__ .ih40-hub-heading {gap:14px!important;padding:22px!important;min-height:166px!important;border-radius:18px!important;}
 __IH40__ .ih40-hub-heading p {font-size:13px!important;}
 __IH40__ .ih40-modules {flex-basis:110px!important;width:110px!important;height:116px!important;margin:0!important;}
 __IH40__ .ih40-module-plane {inset:22px 8px!important;gap:7px!important;}
 __IH40__ .ih40-module-plane > i {border-width:7px!important;border-radius:4px!important;}
 __IH40__ .ih40-hub-grid {grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}
 __IH40__ .ih40-hub-tile {padding:16px!important;min-height:168px!important;border-radius:14px!important;gap:10px!important;}
 __IH40__ .ih40-hub-tile > strong {font-size:15px!important;}
 __IH40__ .ih40-hub-actions .ih14-account-actions {grid-template-columns:minmax(0,1fr)!important;gap:10px!important;}
 __IH40__ .ih40-hub[data-expanded="false"] .ih40-hub-heading {flex-wrap:wrap!important;gap:12px!important;padding:16px!important;}
 __IH40__ .ih40-hub-home {white-space:normal!important;}
 __IH40__ .ih40-step,__IH40__ .ih40-step > button {min-height:234px!important;}
 __IH40__ .ih40-step > button {padding:24px!important;}
 __IH40__ .ih40-step-number {margin-bottom:24px!important;}
}
@media(max-width:420px){
 __IH40__ .ih40-hub-heading {padding:20px 17px!important;gap:6px!important;}
 __IH40__ .ih40-hub-heading h1 {font-size:27px!important;}
 __IH40__ .ih40-modules {display:none!important;}
 __IH40__ .ih40-module-plane {inset:30px 0!important;gap:5px!important;}
 __IH40__ .ih40-module-plane > i {border-width:5px!important;}
 __IH40__ .ih40-hub-grid {gap:8px!important;}
 __IH40__ .ih40-hub-tile {padding:14px!important;min-height:178px!important;}
 __IH40__ .ih40-hub-tile > .ih40-hub-description {font-size:11px!important;line-height:1.65!important;}
}
@media(prefers-reduced-motion:reduce){
 __IH40__ .ih40-step-mosaic {display:none!important;}
 __IH40__ .ih40-hub *,__IH40__ .ih40-step * {animation:none!important;transition:none!important;}
}
`.replaceAll("__IH40__", "#root".repeat(10));

let ih40StyleUsers = 0;
function IdeaHireModuleStyles() {
  useLayoutEffect(() => {
    let style = document.getElementById("ih40-module-styles");
    if (!style) { style = document.createElement("style"); style.id = "ih40-module-styles"; style.textContent = IH40_UI_STYLES; document.head.appendChild(style); }
    ih40StyleUsers += 1;
    return () => { ih40StyleUsers -= 1; if (!ih40StyleUsers) style.remove(); };
  }, []);
  return null;
}

export function PasswordInput({ id, disabled, ...props }) {
  const generatedId = useId();
  const inputId = id || `ih-password-${generatedId}`;
  const [shown, setShown] = useState(false);
  const inputRef = useRef(null);
  const { language } = useSitePreferences();
  const label = language === "en" ? (shown ? "Hide password" : "Show password") : (shown ? "Ukryj hasło" : "Pokaż hasło");
  return <span className="ih40-password">
    <IdeaHireModuleStyles />
    <input {...props} id={inputId} ref={inputRef} disabled={disabled} type={shown ? "text" : "password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
    <button type="button" disabled={disabled} aria-controls={inputId} aria-pressed={shown} aria-label={label} title={label} data-no-translate="true"
      onPointerDown={event => { if (event.pointerType === "mouse") event.preventDefault(); }}
      onClick={() => {
        const input = inputRef.current;
        const start = input?.selectionStart, end = input?.selectionEnd;
        setShown(value => !value);
        window.requestAnimationFrame(() => {
          input?.focus({ preventScroll: true });
          try { if (start != null && end != null) input?.setSelectionRange(start, end); } catch { /* Niektóre menedżery haseł przejmują zaznaczenie. */ }
        });
      }}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.4-7 10-7 10 7 10 7-3.4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{shown && <path d="m3 3 18 18"/>}</svg>
    </button>
  </span>;
}

export function ProfileHub({ sections, active, onSelect, children, open: controlledOpen, onOpenChange, displayName }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const expanded = !active || open;
  const id = useId();
  const rootRef = useRef(null), itemRefs = useRef([]);
  const activeIndex = Math.max(0, sections.findIndex(section => section.key === active));
  const [focused, setFocused] = useState(activeIndex);
  const { language } = useSitePreferences();
  const en = language === "en";
  const c = (pl, english) => en ? english : pl;
  const copy = {
    profile: [c("Dane profilu", "Profile details"), c("Zdjęcie, nazwa i Twój opis.", "Your photo, name and introduction."), "account"],
    expertise: [c("Specjalizacja", "Expertise"), c("Dziedziny, w których działasz.", "Your skills and areas of expertise."), "talent"],
    portfolio: [c("Portfolio", "Portfolio"), c("Projekty, które mówią za Ciebie.", "Projects that speak for themselves."), "panels"],
    jobs: [c("Zlecenia", "Your projects"), c("Ogłoszenia i ich zgłoszenia.", "Your listings and applications."), "briefcase"],
    preferences: [c("Ustawienia", "Settings"), c("Rekomendacje, prywatność i konto.", "Recommendations, privacy and account."), "check"],
    templates: [c("Wygląd", "Appearance"), c("Motyw, który pasuje do Ciebie.", "Choose the look that suits you."), "panels"],
  };
  const current = sections.find(section => section.key === active);
  function setOpen(value) { setInternalOpen(value); onOpenChange?.(value); }
  useEffect(() => { setFocused(activeIndex); }, [activeIndex]);
  function keyboard(event) {
    if (event.key === "Escape" && active && open) {
      event.preventDefault(); setOpen(false); rootRef.current?.querySelector(".ih40-hub-home")?.focus(); return;
    }
    if (!event.target.closest('[role="tablist"]')) return;
    const columns = window.matchMedia("(max-width: 760px)").matches ? 2 : 3;
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns }[event.key];
    if (delta == null && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const index = itemRefs.current.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? sections.length - 1 : (Math.max(0,index) + delta + sections.length) % sections.length;
    setFocused(next); itemRefs.current[next]?.focus();
  }
  return <section className="ih40-hub" ref={rootRef} data-expanded={expanded} onKeyDown={keyboard} aria-label={c("Centrum konta", "Account center")}>
    <IdeaHireModuleStyles />
    <header className="ih40-hub-heading" data-no-translate="true">
      <div>
        <span className="ih40-hub-eyebrow"><i aria-hidden="true"/>{c("IdeaHire / Twoja przestrzeń", "IdeaHire / Your workspace")}</span>
        <h1>{expanded ? c("Centrum Twoich możliwości.", "Your next move starts here.") : copy[active]?.[0] || current?.label}</h1>
        {expanded && <p>{displayName ? `${c("Cześć", "Hi")}, ${displayName}. ` : ""}{c("Zadbaj o profil i przejdź do działania. Wszystko masz pod ręką.", "Shape your profile and get to work. Everything is within reach.")}</p>}
      </div>
      {expanded ? <div className="ih40-modules" aria-hidden="true"><span className="ih40-module-plane">{[0,1,2,3].map(i => <i key={i} style={{"--module":i}}/>)}</span></div> : null}
      {active && <button type="button" className="ih40-hub-home" aria-expanded={expanded} aria-controls={`${id}-sections`} onClick={() => setOpen(!open)}>
        <MarketIcon kind={open ? "close" : "talent"}/>{open ? c("Wróć do sekcji", "Back to section") : c("Wszystkie sekcje", "All sections")}
      </button>}
    </header>
    <div id={`${id}-sections`} hidden={!expanded}>
      <div className="ih40-hub-section-heading" data-no-translate="true"><h2>{c("Twój profil i konto", "Your profile and account")}</h2><span>{c("Wybierz sekcję", "Choose a section")}</span></div>
      <div className="ih40-hub-grid" role="tablist" aria-label={c("Sekcje konta", "Account sections")} data-no-translate="true">
        {sections.map((section,index) => {
          const [label,description,icon] = copy[section.key] || [section.label,section.description,"panels"];
          return <button type="button" key={section.key} role="tab" className="ih40-hub-tile" id={`account-tab-${section.key}`} aria-selected={active === section.key}
            aria-controls="account-tab-panel" tabIndex={focused === index ? 0 : -1} ref={element => {itemRefs.current[index] = element;}}
            onFocus={() => setFocused(index)} onClick={() => { setOpen(false); onSelect(section); }}>
            <span className="ih40-hub-symbol" aria-hidden="true"><MarketIcon kind={icon}/></span><small aria-hidden="true">{section.number}</small>
            <strong>{label}</strong><span className="ih40-hub-description">{description}</span>
          </button>;
        })}
      </div>
      <div className="ih40-hub-actions">{children}</div>
    </div>
  </section>;
}

export function MarketIcon({ kind = "search", ...props }) {
  if (kind === "bookmark") return null;
  const paths = {
    search: "m20 20-4.2-4.2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    arrow: "M5 12h14m-6-6 6 6-6 6",
    back: "M19 12H5m6-6-6 6 6 6",
    diagonal: "M5 12h14m-6-6 6 6-6 6",
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
    account: "M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    briefcase: "M3 7h18v14H3ZM8 7V3h8v4M3 12l9 3 9-3M12 12v5",
    talent: "M3 4h7v7H3ZM14 4h7v7h-7ZM3 15h7v6H3ZM14 15h7v6h-7",
    help: "M9 9a3 3 0 1 1 5 2c-1.2.8-2 1.2-2 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[kind] || paths.search} /></svg>;
}

export function MarketHeader({ eyebrow, title, description, children }) {
  const en = useSitePreferences().language === 'en';
  const location = useLocation();
  const jobs = location.pathname === '/jobs';
  const creating = location.pathname === '/find-talent';
  const editing = location.pathname.startsWith('/edit-job/');
  const heading = jobs ? {
    eyebrow: en ? 'For freelancers' : 'Dla wykonawców',
    title: en ? 'Find a job' : 'Znajdź zlecenie',
    description: en ? 'Check the brief, budget and deadline. Choose a project for yourself.' : 'Sprawdź zakres, budżet i termin. Wybierz projekt dla siebie.',
  } : creating ? {
    eyebrow: en ? 'For clients' : 'Dla zlecających',
    title: en ? 'Post a job' : 'Zleć pracę',
    description: en ? 'Describe the project, scope and terms in four steps.' : 'Opisz projekt, zakres i warunki współpracy w czterech krokach.',
  } : editing ? {
    eyebrow: en ? 'Your listing' : 'Twoje ogłoszenie',
    title: en ? 'Edit your job' : 'Edytuj zlecenie',
    description: en ? 'Update the details that freelancers need to prepare an offer.' : 'Zaktualizuj szczegóły potrzebne wykonawcom do przygotowania oferty.',
  } : { eyebrow, title, description };
  return <>{jobs && <SubpageCatalogTabs active="jobs" />}<SubpageHeading {...heading} actions={children || (jobs ? <Link className="ih79-button is-primary" to="/find-talent"><MarketIcon kind="plus" />{en ? 'Post a job' : 'Dodaj zlecenie'}</Link> : undefined)} variant={jobs ? 'catalog' : 'editor'} /></>;
}

export function MarketCatalogHeader({ eyebrow, title, description, count, noun = 'jobs', status, tabs, actions, children }) {
  const en = useSitePreferences().language === 'en';
  const value = Math.max(0, Number(count) || 0);
  const words = { jobs: ['zlecenie', 'zlecenia', 'zleceń'], services: ['usługa', 'usługi', 'usług'], profiles: ['profil', 'profile', 'profili'] }[noun] || ['wynik', 'wyniki', 'wyników'];
  const polish = value === 1 ? words[0] : value % 10 >= 2 && value % 10 <= 4 && (value % 100 < 12 || value % 100 > 14) ? words[1] : words[2];
  const english = { jobs: 'job', services: 'service', profiles: 'profile' }[noun] || 'result';
  const statusCopy = en ? ({ 'Szukamy usług…': 'Loading services…', 'Szukamy freelancerów…': 'Loading freelancers…', 'Wyniki niedostępne': 'Results unavailable' }[status] || status) : status;
  return <div className="ih73-catalog-header">
    {tabs || <SubpageCatalogTabs active={noun === 'profiles' ? 'people' : noun === 'services' ? 'services' : 'jobs'} />}
    <SubpageHeading title={title} actions={actions} variant="catalog" />
    <div className="ih73-catalog-context">
      <p className="ih73-result-count" role="status" aria-live="polite" aria-atomic="true">{statusCopy || <><strong>{new Intl.NumberFormat(en ? 'en-GB' : 'pl-PL').format(value)}</strong><span>{en ? english + (value === 1 ? '' : 's') : polish}</span></>}</p>
    </div>
    {children}
  </div>;
}

// Only visual preferences travel to the public help site. Never forward a session,
// email, account ID, the current route or the application's query string.
export function helpCenterHref() {
  const fallback = "/help/index.html";
  const setting = String(import.meta.env?.VITE_HELP_CENTER_URL || "").trim();
  let address;
  try {
    address = setting ? new URL(setting) : new URL(fallback, window.location.origin);
    if (address.username || address.password || (setting && address.protocol !== "https:")) throw new Error("Invalid help address");
  } catch { address = new URL(fallback, window.location.origin); }
  address.search = "";
  address.hash = "";
  address.searchParams.set("theme", document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  address.searchParams.set("template", document.documentElement.dataset.template === "classic" ? "classic" : "current");
  return address.origin === window.location.origin ? `${address.pathname}${address.search}` : address.href;
}

export function MarketSelect({ id, label, value, options, onChange }) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
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
    const option = optionRefs.current[focused], menu = menuRef.current;
    option?.focus({ preventScroll: true });
    if (option && menu) {
      const item = option.getBoundingClientRect(), list = menu.getBoundingClientRect();
      if (item.top < list.top + 6) menu.scrollTop += item.top - list.top - 6;
      else if (item.bottom > list.bottom - 6) menu.scrollTop += item.bottom - list.bottom + 6;
    }
  }, [open, focused]);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    const resized = () => setOpen(false);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resized);
    window.visualViewport?.addEventListener("resize", resized);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resized);
      window.visualViewport?.removeEventListener("resize", resized);
    };
  }, [open]);
  function close(restoreFocus = false) {
    setOpen(false);
    typeahead.current = { text: "", time: 0 };
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }
  function show(last = false) {
    if (!enabled.length) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0;
      let bottom = top + (viewport?.height || window.innerHeight);
      const navigation = document.querySelector('.ih68-top-nav');
      if (navigation && getComputedStyle(navigation).position === 'fixed') bottom = Math.min(bottom, navigation.getBoundingClientRect().top);
      const header = document.querySelector('.ih68-header');
      const above = (rootRef.current?.getBoundingClientRect().top ?? rect.top) - Math.max(top, header?.getBoundingClientRect().bottom || top) - 12;
      const below = bottom - rect.bottom - 12;
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
      if (next !== undefined) { if (!open) show(); setFocused(next); }
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
      <div ref={menuRef} className="ih7-select-menu" role="listbox" id={`${selectId}-options`} aria-labelledby={`${selectId}-label`}
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

export function MarketFilters({ search, onSearch, categories, category, onCategory, categoryLabel = value => value, sort, onSort, matchedAvailable = false, kind = 'zleceń', children }) {
  const id = useId();
  const en = useSitePreferences().language === 'en';
  const people = kind === 'freelancerów';
  const services = kind === 'usług';
  const label = people ? (en ? 'Search freelancers' : 'Szukaj freelancerów') : services ? (en ? 'Search services' : 'Szukaj usług') : (en ? 'Search jobs' : 'Szukaj zleceń');
  const fields = ['Wszystkie', ...categories.filter(value => value !== 'Wszystkie')];
  const fieldLabel = value => value === 'Wszystkie' ? (en ? 'All fields' : 'Wszystkie dziedziny') : en ? translateUiText(categoryLabel(value)) : categoryLabel(value);
  return <div className={"ih75-catalog ih80-catalog-" + (people ? "people" : services ? "services" : "jobs")}>
    <aside className="ih75-catalog-sidebar" aria-label={en ? 'Filter by field' : 'Filtruj według dziedziny'}>
      <h2>{en ? 'Fields' : 'Dziedziny'}</h2>
      <nav id={id + '-fields'} className="ih75-category-list" aria-label={en ? 'Fields' : 'Dziedziny'}>
        {fields.map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => onCategory(value)}><span>{fieldLabel(value)}</span>{category === value && <MarketIcon kind="check" />}</button>)}
      </nav>
      {(search || category !== 'Wszystkie') && <button type="button" className="ih73-clear-filters" onClick={() => { onSearch(''); onCategory('Wszystkie'); }}><MarketIcon kind="close" />{en ? 'Clear filters' : 'Wyczyść filtry'}</button>}
    </aside>
    <div className="ih75-catalog-main">
      <section className="ih75-catalog-controls" aria-label={label}>
        <label className="ih73-catalog-search" htmlFor={id + '-search'}><MarketIcon kind="search" /><span className="ih5-sr-only">{label}</span>
          <input id={id + '-search'} type="search" value={search} onChange={event => onSearch(event.target.value)} maxLength={160}
            placeholder={people ? (en ? 'Name, skills or specialisation' : 'Imię, umiejętności lub specjalizacja') : services ? (en ? 'Service, field or result' : 'Usługa, dziedzina lub rezultat') : (en ? 'Project, field or skill' : 'Projekt, dziedzina lub umiejętność')} />
          {search && <button type="button" onClick={() => onSearch('')} aria-label={en ? 'Clear search' : 'Wyczyść wyszukiwanie'}><MarketIcon kind="close" /></button>}
        </label>
        <div className="ih76-catalog-refinements">
          <div className="ih87-catalog-select ih76-category-select">
            <MarketSelect id={id + '-category'} label={en ? 'Field' : 'Dziedzina'} value={category}
              options={fields.map(value => ({ value, label: fieldLabel(value) }))} onChange={onCategory} />
          </div>
          {onSort && <div className="ih87-catalog-select">
            <MarketSelect id={id + '-sort'} label={en ? 'Sort by' : 'Kolejność'} value={sort} onChange={onSort}
              options={[{ value: 'latest', label: en ? 'Newest first' : 'Najnowsze' },
                { value: 'matched', label: en ? 'Matched to me' : 'Dopasowane do mnie', disabled: !matchedAvailable }]} />
          </div>}
        </div>
        {(search || category !== 'Wszystkie') && <button type="button" className="ih76-mobile-clear" onClick={() => { onSearch(''); onCategory('Wszystkie'); }}><MarketIcon kind="close" />{en ? 'Clear filters' : 'Wyczyść filtry'}</button>}
      </section>
      <div className="ih75-catalog-results">{children}</div>
    </div>
  </div>;
}

const STEP_TILES = Array.from({ length: 320 }, (_, index) => {
  const x = index % 16, y = Math.floor(index / 16);
  const edge = x === 0 || x === 15 || y === 0 || y === 19;
  const n = (index * 73 % 191) / 191;
  return { "--micro-delay": `${Math.round((x + y) * 8 + n * 125)}ms`, "--micro-x": `${Math.round((x - 7.5) * (5 + n * 8))}px`,
    "--micro-y": `${Math.round((y - 9.5) * (6 + n * 10))}px`, "--micro-turn": `${Math.round((n - .5) * 80)}deg`, "--micro-opacity": edge ? .26 : .035 + n * .045 };
});

export function HomeStepCard({ number, title, children }) {
  const [cycle, setCycle] = useState(0), [active, setActive] = useState(false);
  const timer = useRef(null), lastPlay = useRef(0);
  const { language } = useSitePreferences();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function play() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const now = Date.now();
    if (now - lastPlay.current < 250) return;
    lastPlay.current = now;
    window.clearTimeout(timer.current); setCycle(value => value + 1); setActive(true);
    timer.current = window.setTimeout(() => setActive(false), 1780);
  }
  return <article className="step home-reveal ih40-step" onPointerEnter={event => { if(event.pointerType === "mouse") play(); }}>
    <IdeaHireModuleStyles />
    <button type="button" onFocus={play} onClick={play} aria-label={`${number}. ${title}. ${children} ${language === "en" ? "Replay the square animation." : "Odtwórz animację kwadratów."}`}>
      <span className="ih40-step-number">{number}</span><span className="ih40-step-title" onPointerEnter={event => {if(event.pointerType === "mouse") play();}}>{title}</span><span className="ih40-step-copy">{children}</span>
      <span className="ih40-step-mark" aria-hidden="true"><i/><i/><i/><i/></span>
    </button>
    {active && <span key={cycle} className="ih40-step-mosaic" aria-hidden="true">{STEP_TILES.map((style,index) => <i key={index} style={style}/>)}</span>}
  </article>;
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
      <div className="ih5-story-offer"><div><span>Prowizja IdeaHire</span><h3 id={`${id}-title`}>{offer.percent.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}<span>%</span></h3></div><div className="ih5-story-limits"><strong>maks. {offer.maximum} zł</strong><span>min. {offer.minimum} zł · zlecenia do {offer.orderLimit.toLocaleString("pl-PL")} zł</span></div></div>
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

