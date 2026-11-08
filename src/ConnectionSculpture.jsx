import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

/* A single die-cut sheet, opened by a flat travelling shutter. */
export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      host.dataset.entered = "true";
      host.dataset.phase = "open";
      return;
    }
    host.dataset.motion = "enabled";
    const observer = new IntersectionObserver(([entry]) => {
      host.dataset.visible = String(entry.isIntersecting);
      if (entry.isIntersecting && host.dataset.entered !== "true") {
        host.dataset.entered = "true";
        host.dataset.phase = "opening";
      }
    }, { threshold: .15 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const details = en ? [
    ["Portfolio", "Work and offers before you choose."],
    ["Agreements", "Scope, deadline and price before you start."],
    ["Contact", "Conversations and files alongside the project."],
  ] : [
    ["Portfolio", "Prace i oferta przed wyborem."],
    ["Ustalenia", "Zakres, termin i cena przed startem."],
    ["Kontakt", "Rozmowy i pliki przy projekcie."],
  ];

  return <div ref={hostRef} className="ih-cut-study" data-entered="false" data-phase="ready" onAnimationEnd={event => {
    if (event.animationName === "ih-cut-shutter") hostRef.current.dataset.phase = "open";
  }}>
    <svg className="ih-cut-outline" viewBox="0 0 1000 580" preserveAspectRatio="none" aria-hidden="true">
      <path className="ih-cut-paper" d="M64 1H999V515L934 579H1V65Z" />
      <path className="ih-cut-edge ih-cut-edge-first" pathLength="1" d="M1 65L64 1" />
      <path className="ih-cut-edge ih-cut-edge-last" pathLength="1" d="M999 515L934 579" />
    </svg>
    <div className="ih-cut-window" aria-hidden="true"><span className="ih-cut-shutter" /></div>
    <div className="ih-cut-content">
      <p className="ih-cut-kicker">{en ? "Before the first “let’s do it”" : "Przed pierwszym „działamy”"}</p>
      <h2 className="ih-cut-title"><span>{en ? "Get to know the work." : "Poznaj prace."}</span><span>{en ? "Agree on the details." : "Ustal szczegóły."}</span></h2>
      <p className="ih-cut-intro">{en ? "Choose a professional by their work. Talk through your project and agree on the next step together." : "Wybierz wykonawcę po jego pracach. Porozmawiajcie o projekcie i wspólnie ustalcie następny krok."}</p>
      <dl className="ih-cut-details">{details.map(([label, description]) => <div key={label}><dt>{label}</dt><dd>{description}</dd></div>)}</dl>
    </div>
  </div>;
}
