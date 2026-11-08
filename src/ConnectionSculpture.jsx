import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

/* Typography is the composition: a printed strip releases the message. */
export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!("IntersectionObserver" in window)) { host.dataset.entered = "true"; return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      host.dataset.entered = "true";
      observer.disconnect();
    }, { threshold: .22 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const benefits = en ? [
    ["Portfolio", "Work, profile and offer before you choose."],
    ["Agreements", "Scope, deadline and price before you start."],
    ["Contact", "Messages and materials alongside your project."],
  ] : [
    ["Portfolio", "Prace, profil i oferta przed wyborem."],
    ["Ustalenia", "Zakres, termin i cena przed startem."],
    ["Kontakt", "Wiadomości i materiały przy projekcie."],
  ];
  return <div ref={hostRef} className="ih-editorial-match" data-entered="false" data-phase="ready" onAnimationEnd={event => {
    if (event.animationName === "ih-match-second") hostRef.current.dataset.phase = "revealed";
  }}>
    <h2 className="ih-match-title">
      <span className="ih-match-first"><span className="ih-match-verb">{en ? "See the" : "Zobacz"}</span>{" "}
        <span className="ih-match-print"><span className="ih-match-print-ink" aria-hidden="true" /><span className="ih-match-print-word">{en ? "work." : "prace."}</span></span>
      </span>
      <span className="ih-match-second-mask"><span className="ih-match-second">{en ? "Meet the person." : "Poznaj człowieka."}</span></span>
    </h2>
    <dl className="ih-match-benefits">{benefits.map(([title, description], index) => <div key={title} style={{ "--step": index }}>
      <dt>{title}</dt><dd>{description}</dd>
    </div>)}</dl>
  </div>;
}
