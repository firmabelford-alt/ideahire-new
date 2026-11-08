import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

/* A single opening seam releases the useful parts of a collaboration. */
export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      host.dataset.entered = "true"; host.dataset.phase = "open"; return;
    }
    host.dataset.motion = "enabled";
    const observer = new IntersectionObserver(([entry]) => {
      host.dataset.visible = String(entry.isIntersecting);
      if (entry.isIntersecting && host.dataset.entered !== "true") {
        host.dataset.entered = "true"; host.dataset.phase = "opening";
      }
    }, { threshold: .15 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const notes = en ? [
    ["Before you choose", "The professional’s portfolio", "Explore their work and offer before deciding to work together."],
    ["Before you start", "Terms agreed together", "Agree on the scope, deadline and price for your project."],
    ["While you work", "Materials and conversations", "Keep the files, messages and agreements alongside the project."],
  ] : [
    ["Przed wyborem", "Portfolio wykonawcy", "Sprawdzasz prace i ofertę, zanim zdecydujesz o współpracy."],
    ["Przed startem", "Wspólne ustalenia", "Uzgadniacie zakres, termin i cenę konkretnego projektu."],
    ["W trakcie pracy", "Materiały i rozmowy", "Pliki, wiadomości i ustalenia zostają przy projekcie."],
  ];
  return <div ref={hostRef} className="ih-project-slit" data-entered="false" data-phase="ready" onAnimationEnd={event => {
    if (event.animationName === "ih-slit-note" && event.target.dataset.order === "2") hostRef.current.dataset.phase = "open";
  }}>
    <h2 className="ih-slit-accessible-title">{en ? "What you have alongside your project" : "Co masz przy swoim projekcie"}</h2>
    <div className="ih-slit-composition">
      <div className="ih-slit-art" aria-hidden="true">
        <svg viewBox="0 0 180 330" preserveAspectRatio="none">
          <path className="ih-slit-outline" d="M139 5C63 80 27 198 27 326" />
          <path className="ih-slit-back" d="M132 4C66 80 37 191 36 326L67 301C70 179 96 82 148 10Z" />
          <path className="ih-slit-front" d="M151 6C111 92 91 171 83 293L108 275C116 169 137 88 170 15Z" />
          {["M118 62H178", "M88 165H178", "M69 274H178"].map((path, index) => <g key={path} style={{"--trace":index}}>
            <path className="ih-slit-guide" d={path} />
            <path className="ih-slit-trace" pathLength="1" d={path} />
          </g>)}
        </svg>
      </div>
      <dl className="ih-slit-notes">{notes.map(([when,title,description],index)=><div key={title} className="ih-slit-note" data-order={index} style={{"--note":index}}>
        <dt><small>{when}</small><span>{title}</span></dt>
        <dd>{description}</dd>
      </div>)}</dl>
    </div>
  </div>;
}
