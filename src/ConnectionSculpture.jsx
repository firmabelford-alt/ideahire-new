import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

/* An opening paper figure reveals useful project content in ordinary HTML. */
export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!("IntersectionObserver" in window)) { host.dataset.entered = "true"; return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      host.dataset.entered = "true";
      observer.disconnect();
    }, { threshold: .24 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const items = en ? [
    ["Scope", "What exactly needs to be made."],
    ["Timing", "When the work should be ready."],
    ["Price", "The cost of the agreed scope."],
  ] : [
    ["Zakres", "Co dokładnie ma powstać."],
    ["Termin", "Kiedy praca ma być gotowa."],
    ["Cena", "Ile kosztuje ustalony zakres."],
  ];
  return <div ref={hostRef} className="ih-fold-scene" data-entered="false" data-phase="closed" onAnimationEnd={event => {
    if (event.animationName === "ih-fold-open-top") hostRef.current.dataset.phase = "open";
  }}>
    <div className="ih-fold-figure" aria-hidden="true">
      <svg viewBox="0 0 320 340" focusable="false">
        <path className="ih-fold-upper" d="M48 166A112 112 0 0 1 272 166Z" />
        <path className="ih-fold-lower" d="M48 166H272A112 112 0 0 1 48 166Z" />
        <circle className="ih-fold-pivot" cx="48" cy="166" r="5" />
      </svg>
    </div>
    <div className="ih-fold-content">
      <h2>{en ? "Agree on this before you start." : "Ustalcie to przed startem."}</h2>
      <dl>{items.map(([title, description], index) => <div className="ih-fold-row" key={title} style={{ "--row": index }}>
        <dt>{title}</dt><dd>{description}</dd>
      </div>)}</dl>
    </div>
  </div>;
}
