import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IDEA_HIRE_MARK } from "./Brand";
import "./HomeEnding.css";

// Build a side face for every straight edge of the existing 64 × 64 mark.
const signatureSolids = Object.entries(IDEA_HIRE_MARK).map(([part, path]) => {
  let x = 0, y = 0;
  const vertices = Array.from(path.matchAll(/([MLHV])(\d+)(?:\s+(\d+))?/g), ([, command, a, b]) => {
    if (command !== "V") x = Number(a);
    if (command === "V") y = Number(a);
    else if (command !== "H") y = Number(b);
    return [x, y];
  });
  const edges = vertices.map(([left, top], index) => {
    const [nextX, nextY] = vertices[(index + 1) % vertices.length];
    const dx = nextX - left, dy = nextY - top;
    const angle = Math.atan2(dy, dx);
    return {
      left: `${left / 64 * 100}%`, top: `${top / 64 * 100}%`,
      width: `${Math.hypot(dx, dy) / 64 * 100}%`,
      "--edge-angle": `${angle}rad`, "--edge-light": `${66 + Math.sin(angle + 0.7) * 22}%`,
    };
  });
  return { part, path, edges };
});

function SignatureSculpture({ run, artRef }) {
  const gradientId = `ih-finale-metal-${useId().replace(/:/g, "")}`;
  return (
    <div ref={artRef} className="ih-finale-art" aria-hidden="true" data-playing={run > 0 || undefined}>
      <div className="ih-finale-floor" />
      <div className="ih-finale-seam" />
      <div className="ih-finale-object">
        {signatureSolids.map(({ part, path, edges }) => (
          <div className={`ih-finale-solid is-${part}`} key={part}>
            <svg className="ih-finale-back" viewBox="0 0 64 64" focusable="false"><path d={path} /></svg>
            {edges.map((style, index) => <span className="ih-finale-edge" style={style} key={index} />)}
            <svg className="ih-finale-face" viewBox="0 0 64 64" focusable="false">
              <defs>
                <linearGradient id={`${gradientId}-${part}`} x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" className="ih-finale-highlight" />
                  <stop offset=".48" className="ih-finale-material" />
                  <stop offset="1" className="ih-finale-reflection" />
                </linearGradient>
              </defs>
              <path d={path} fill={`url(#${gradientId}-${part})`} />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeEnding({ en = false }) {
  const titleId = useId();
  const art = useRef(null);
  const [motion, setMotion] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!preference.matches && typeof window.IntersectionObserver === "function");
    sync();
    if (preference.addEventListener) {
      preference.addEventListener("change", sync);
      return () => preference.removeEventListener("change", sync);
    }
    preference.addListener?.(sync);
    return () => preference.removeListener?.(sync);
  }, []);

  useEffect(() => {
    if (!motion || run || !art.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < 0.64) return;
      observer.disconnect();
      setRun(value => value || 1);
    }, { threshold: 0.64 });
    observer.observe(art.current);
    return () => observer.disconnect();
  }, [motion, run]);

  const replayLabel = run ? (en ? "Replay animation" : "Powtórz animację") : (en ? "Play animation" : "Odtwórz animację");

  return (
    <section className="ih-home-finale" aria-labelledby={titleId} data-no-translate="true">
      <div className="ih-finale-copy">
        <h2 id={titleId}><span>{en ? "Good ideas" : "Dobry pomysł"}</span><span>{en ? "take shape." : "nabiera kształtu."}</span></h2>
        <p>{en ? "Pick a service or meet the people who can help you take the next step." : "Wybierz usługę albo poznaj ludzi, z którymi ruszysz dalej."}</p>
      </div>
      <SignatureSculpture key={run} run={motion ? run : 0} artRef={art} />
      <nav className="ih-finale-links" aria-label={en ? "Explore IdeaHire offers" : "Przeglądaj oferty IdeaHire"}>
        <Link to="/services">{en ? "Browse services" : "Przeglądaj usługi"}<EndingArrow /></Link>
        <Link to="/jobs">{en ? "Find a project" : "Zobacz zlecenia"}<EndingArrow /></Link>
      </nav>
      <div className="ih-finale-credits">
        <small>© 2026 IdeaHire</small>
        {motion && <button type="button" className="ih-finale-replay" aria-label={replayLabel} title={replayLabel} onClick={() => setRun(value => value + 1)}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {run ? <path d="M4 8a6.2 6.2 0 1 1 1 6M4 4v4h4" /> : <path d="M8 5.5 14 10l-6 4.5z" />}
          </svg>
        </button>}
      </div>
    </section>
  );
}

function EndingArrow() {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>;
}
