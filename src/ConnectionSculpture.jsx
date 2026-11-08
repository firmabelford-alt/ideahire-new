import { useEffect, useRef, useState } from "react";
import "./ConnectionSculpture.css";

const READ_TIMES = [8200, 8200, 8200];

export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, last = 0, elapsed = 0, chapter = 0, visible = false;

    const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
    const tick = now => {
      if (!visible || document.hidden || preference.matches) { stop(); return; }
      if (last) elapsed += now - last;
      last = now;
      if (elapsed >= READ_TIMES[chapter]) {
        elapsed = 0;
        chapter = (chapter + 1) % READ_TIMES.length;
        setActive(chapter);
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      host.dataset.reduced = String(preference.matches);
      if (visible && !document.hidden && !preference.matches) {
        if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
      } else stop();
    };
    const enter = isVisible => {
      visible = isVisible;
      host.dataset.visible = String(visible);
      if (visible) host.dataset.entered = "true";
      sync();
    };
    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => enter(entry.isIntersecting), { threshold: .2 })
      : null;
    if (observer) observer.observe(host);
    else enter(true);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer?.disconnect(); stop();
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const topics = en
    ? ["Choose your professional", "Start with a shared plan", "Keep the context together"]
    : ["Wybór wykonawcy", "Wspólny plan na start", "Wszystko przy projekcie"];
  const headlines = en
    ? [["See the work.", "Get to know the approach."], ["The scope and deadline.", "Agreed together."], ["Messages and files.", "In the same place."]]
    : [["Sprawdź prace.", "Poznaj podejście."], ["Zakres i termin", "ustalacie razem."], ["Rozmowy i pliki.", "W jednym miejscu."]];
  const descriptions = en ? [
    "A portfolio and a clear offer help you choose someone with the right skills for your project.",
    "Discuss the task, agree on the details and start the work with a shared understanding of what needs to happen.",
    "Keep messages, materials and agreements alongside the project they belong to. It is easier to retain the context and return to the details.",
  ] : [
    "Portfolio i oferta pomagają wybrać osobę z umiejętnościami pasującymi do Twojego zadania.",
    "Omówcie zadanie, ustalcie szczegóły i zacznijcie pracę ze wspólnym planem. Od początku wiecie, na co się umawiacie.",
    "Wiadomości, materiały i ustalenia zostają przy projekcie, którego dotyczą. Łatwiej zachować kontekst i wrócić do konkretów.",
  ];

  return <div className="ih-reveal" ref={hostRef} data-entered="false" data-scene={active} data-no-translate="true">
    <div className="ih-reveal-accessible">
      <h2>{en ? "Why work with IdeaHire" : "Dlaczego warto pracować z IdeaHire"}</h2>
      <dl>{topics.map((topic,index)=><div key={topic}><dt>{topic}</dt><dd>{descriptions[index]}</dd></div>)}</dl>
    </div>
    <div className="ih-reveal-shell" aria-hidden="true">
      <div className="ih-reveal-screen">
        <div className="ih-reveal-stage">
          {headlines.map((lines, index) => <div className="ih-reveal-face" key={index} data-active={active === index}>
            <span className="ih-reveal-topic">{topics[index]}</span>
            <h2>{lines.map((line, lineIndex) => <span className="ih-reveal-line" key={line} style={{"--line":lineIndex}}><span className="ih-reveal-word">{line}</span></span>)}</h2>
            <p className="ih-reveal-description">{descriptions[index]}</p>
          </div>)}
        </div>
        <div className="ih-reveal-static">
          {topics.map((topic,index)=><div key={topic}><strong>{topic}</strong><p>{descriptions[index]}</p></div>)}
        </div>
      </div>
    </div>
  </div>;
}
