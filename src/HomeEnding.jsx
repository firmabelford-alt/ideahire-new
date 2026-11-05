import { useEffect, useId, useRef, useState } from "react";
import { BrandMark } from "./Brand";
import "./HomeEnding.css";

export default function HomeEnding({ en = false }) {
  const titleId = useId();
  const end = useRef(null);
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
    if (!motion || run || !end.current) return;
    // The marker is after the frame and credits, inside the footer's bottom padding.
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setRun(value => value || 1);
    }, { rootMargin: "0px 0px -18px 0px", threshold: 1 });
    observer.observe(end.current);
    return () => observer.disconnect();
  }, [motion, run]);

  return (
    <section className="ih-home-finale" aria-labelledby={titleId} data-no-translate="true">
      <div className="ih-finale-bar">
        <span className="ih-finale-caption">{en ? "CUT / FINALE" : "CIĘCIE / FINAŁ"}</span>
        {motion && <button type="button" className="ih-finale-replay" onClick={() => setRun(value => value + 1)}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {run ? <path d="M4 8a6.2 6.2 0 1 1 1 6M4 4v4h4" /> : <path d="M8 5.5 14 10l-6 4.5z" />}
          </svg>
          {run ? (en ? "Replay" : "Powtórz cięcie") : (en ? "Open the finale" : "Otwórz finał")}
        </button>}
      </div>
      <div className="ih-finale-stage" key={run} data-playing={motion && run > 0 ? "true" : undefined}>
        <div className="ih-finale-message">
          <h2 id={titleId}><span>{en ? "Let’s make" : "Zróbmy coś"}</span>{" "}<em>{en ? "it happen." : "razem."}</em></h2>
          <BrandMark className="ih-finale-mark" />
        </div>
        {motion && <div className="ih-finale-shutters" aria-hidden="true">
          <div className="ih-finale-shutter ih-finale-shutter-left"><div className="ih-finale-face"><span>IdeaHire</span></div></div>
          <div className="ih-finale-shutter ih-finale-shutter-right"><div className="ih-finale-face"><span>IdeaHire</span></div></div>
        </div>}
      </div>
      <small className="ih-finale-credit">© 2026 IdeaHire</small>
      <span ref={end} className="ih-finale-end" aria-hidden="true" />
    </section>
  );
}
