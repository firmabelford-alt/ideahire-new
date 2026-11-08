import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

/* An open working document: a brief unfolds into three shared decisions. */
export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) {
      host.dataset.entered = "true";
      host.dataset.phase = "settled";
      return;
    }
    host.dataset.motion = "enabled";
    const observer = new IntersectionObserver(([entry]) => {
      host.dataset.visible = String(entry.isIntersecting);
      if (entry.isIntersecting && host.dataset.entered !== "true") {
        host.dataset.entered = "true";
        host.dataset.phase = "unfolding";
      }
    }, { threshold: .18 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const decisions = en ? [
    ["Scope", "What we’re making.", "Pages, features and materials."],
    ["Deadline", "When it’s ready.", "Milestones and a delivery date."],
    ["Price", "What it costs.", "A price for the agreed scope."],
  ] : [
    ["Zakres", "Co ma powstać.", "Podstrony, funkcje i materiały."],
    ["Termin", "Na kiedy.", "Etapy i data oddania projektu."],
    ["Cena", "Za ile.", "Wycena ustalonego zakresu."],
  ];

  return <div ref={hostRef} className="ih-brief-study" data-entered="false" data-phase="ready" onAnimationEnd={event => {
    if (event.animationName === "ih-brief-unfold" && event.target.dataset.order === "2") hostRef.current.dataset.phase = "settled";
  }}>
    <div className="ih-brief-heading">
      <span>{en ? "From an idea to a shared plan" : "Od pomysłu do wspólnego planu"}</span>
      <span className="ih-brief-edition" aria-hidden="true">01—03</span>
    </div>

    <div className="ih-brief-composition">
      <div className="ih-brief-source">
        <p className="ih-brief-caption">{en ? "It can start with one sentence" : "Na początek wystarczy jedno zdanie"}</p>
        <h2 className="ih-brief-sentence">
          <span className="ih-brief-sentence-mask"><span>{en ? "“I need" : "„Potrzebuję"}</span></span>
          <span className="ih-brief-sentence-mask"><span>{en ? "a new website.”" : "nowej strony.”"}</span></span>
        </h2>
        <svg className="ih-brief-pencil" viewBox="0 0 470 32" fill="none" aria-hidden="true">
          <path pathLength="1" d="M4 19C96 9 231 8 363 14C402 16 427 16 463 11" />
          <path className="ih-brief-pencil-return" pathLength="1" d="M13 26C125 18 264 22 331 23" />
        </svg>
        <p className="ih-brief-context">{en ? "Find someone whose work fits your idea. Turn the details into a plan together." : "Znajdź osobę, której prace pasują do Twojego pomysłu. Szczegóły ustalcie razem."}</p>
      </div>

      <div className="ih-brief-plan">
        <p className="ih-brief-caption">{en ? "Three things you agree together" : "Trzy rzeczy, które ustalacie razem"}</p>
        <div className="ih-brief-decisions">
          <div className="ih-brief-spine" aria-hidden="true"><span /><i /></div>
          <dl>{decisions.map(([label, title, detail], index) => <div className="ih-brief-item" key={label} data-order={index} style={{ "--order": index }}>
            <dt><span className="ih-brief-number" aria-hidden="true">0{index + 1}</span>{label}</dt>
            <dd><strong>{title}</strong><span>{detail}</span></dd>
          </div>)}</dl>
        </div>
      </div>
    </div>

    <p className="ih-brief-note"><span>{en ? "Your idea. Your collaboration." : "Twój pomysł. Wasza współpraca."}</span><span>{en ? "Portfolio, conversations and agreements — alongside the project." : "Portfolio, rozmowy i ustalenia — przy projekcie."}</span></p>
  </div>;
}
