import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

/* Typography is the composition: a printed strip releases the message. */
export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null), motionRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current;
    motionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!("IntersectionObserver" in window)) { host.dataset.entered = "true"; return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      host.dataset.phase = motionRef.current.matches ? "revealed" : "revealing";
      host.dataset.entered = "true";
      observer.disconnect();
    }, { threshold: .22 });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const benefits = en ? [
    ["Portfolio", "Explore the professional’s work and offer."],
    ["Agreements", "Agree on the scope, deadline and price."],
    ["Contact", "Conversations and materials alongside your project."],
  ] : [
    ["Portfolio", "Zobacz prace i ofertę wykonawcy."],
    ["Ustalenia", "Uzgodnijcie zakres, termin i cenę."],
    ["Kontakt", "Rozmowy i materiały przy projekcie."],
  ];
  function moveInk(event) {
    if (event.pointerType !== "mouse" || motionRef.current?.matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    event.currentTarget.style.setProperty("--ink-x", `${(x * 2).toFixed(2)}px`);
    event.currentTarget.style.setProperty("--ink-y", `${(y * 1.25).toFixed(2)}px`);
    event.currentTarget.style.setProperty("--ink-turn", `${(x * .35).toFixed(3)}deg`);
  }
  function resetInk(event) {
    for (const [name, value] of [["--ink-x", "0px"], ["--ink-y", "0px"], ["--ink-turn", "0deg"]]) event.currentTarget.style.setProperty(name, value);
  }
  return <div ref={hostRef} className="ih-editorial-match" data-entered="false" data-phase="ready" onAnimationEnd={event => {
    if (event.animationName === "ih-match-second") hostRef.current.dataset.phase = "revealed";
  }}>
    <h2 className="ih-match-title">
      <span className="ih-match-first"><span className="ih-match-verb">{en ? "See the" : "Zobacz"}</span>{" "}
        <span className="ih-match-print" onPointerMove={moveInk} onPointerLeave={resetInk}><span className="ih-match-print-surface" aria-hidden="true"><span className="ih-match-print-ink" /></span><span className="ih-match-print-word">{en ? "work." : "prace."}</span></span>
      </span>
      <span className="ih-match-second-mask"><span className="ih-match-second"><span className="ih-match-human-verb">{en ? "Meet the" : "Poznaj"}</span>{" "}<span className="ih-match-human">{en ? "person." : "człowieka."}</span></span></span>
    </h2>
    <dl className="ih-match-benefits">{benefits.map(([title, description], index) => <div key={title} style={{ "--step": index }}>
      <dt>{title}</dt><dd>{description}</dd>
    </div>)}</dl>
  </div>;
}
