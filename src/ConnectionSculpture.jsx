import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

/* One continuous folded ribbon; content stays readable after its reveal. */
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

  const sections = en ? [
    ["Portfolio", "Let the work speak.", "Explore the work and offer before choosing a professional."],
    ["Agreements", "Get the details right.", "Scope, deadline and price. Agree together before you start."],
    ["Collaboration", "Keep it all together.", "Conversations, files and agreements alongside your project."],
  ] : [
    ["Portfolio", "Prace mówią więcej.", "Sprawdź portfolio i ofertę, zanim wybierzesz wykonawcę."],
    ["Ustalenia", "Najpierw konkrety.", "Zakres, termin i cena. Ustalcie je wspólnie przed startem."],
    ["Współpraca", "Wszystko przy projekcie.", "Rozmowy, pliki i ustalenia w jednym miejscu."],
  ];

  return <div ref={hostRef} className="ih-folded-ribbon" data-entered="false" data-phase="ready" onAnimationEnd={event => {
    if (event.animationName === "ih-ribbon-copy" && event.target.dataset.order === "2") hostRef.current.dataset.phase = "open";
  }}>
    <h2 className="ih-ribbon-accessible-title">{en ? "From choosing a professional to working together" : "Od wyboru wykonawcy do wspólnej pracy"}</h2>
    <div className="ih-ribbon-body">
      {sections.map(([label, title, description], index) => <article className="ih-ribbon-band" key={label} style={{ "--band": index }} data-band={index}>
        <span className="ih-ribbon-paper" aria-hidden="true"><span className="ih-ribbon-crease" /></span>
        <div className="ih-ribbon-copy" data-order={index}>
          <p className="ih-ribbon-label"><span aria-hidden="true">0{index + 1}</span>{label}</p>
          <h3>{title}</h3>
          <p className="ih-ribbon-description">{description}</p>
        </div>
        <span className="ih-ribbon-folio" aria-hidden="true">0{index + 1}</span>
      </article>)}
    </div>
  </div>;
}
