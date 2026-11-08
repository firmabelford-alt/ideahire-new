import { useEffect, useRef, useState } from "react";
import { IDEA_HIRE_PUBLIC_OFFER } from "./MarketUI";
import "./ConnectionSculpture.css";

const READ_TIMES = [8200, 8200, 9600];

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

  const labels = en ? ["The platform", "Working together", "The fee"] : ["Platforma", "Współpraca", "Rozliczenie"];
  const topics = en ? ["What IdeaHire is", "Before the work begins", "How the fee works"] : ["Czym jest IdeaHire", "Zanim zacznie się praca", "Jak się rozliczacie"];
  const headlines = en
    ? [["Projects.", "Services.", "Collaboration."], ["A good start", "has clear", "terms."]]
    : [["Zlecenia.", "Usługi.", "Współpraca."], ["Dobry start", "ma konkretne", "warunki."]];
  const descriptions = en ? [
    "We connect people who have a project with freelancers who have the skills to bring it to life.",
    "Agree on the scope, price and deadline together, before the work begins.",
  ] : [
    "Łączymy osoby, które mają projekt, z freelancerami, którzy mają umiejętności do jego realizacji.",
    "Zakres, cenę i termin ustalacie wspólnie, zanim zacznie się praca.",
  ];
  const fee = IDEA_HIRE_PUBLIC_OFFER;
  const locale = en ? "en-GB" : "pl-PL";
  const rate = `${fee.percent.toLocaleString(locale)}%`;
  const money = amount => `${amount.toLocaleString(locale)} ${en ? "PLN" : "zł"}`;
  const feeLines = en
    ? ["The client pays the fee.", "The freelancer receives the full agreed amount."]
    : ["Prowizję płaci zleceniodawca.", "Wykonawca otrzymuje całą ustaloną kwotę."];

  return <div className="ih-reveal" ref={hostRef} data-entered="false" data-scene={active} data-no-translate="true">
    <div className="ih-reveal-accessible">
      <h2>{en ? "IdeaHire: collaboration and fees" : "IdeaHire: współpraca i rozliczenia"}</h2>
      <dl>
        <dt>{topics[0]}</dt><dd>{descriptions[0]}</dd>
        <dt>{topics[1]}</dt><dd>{descriptions[1]}</dd>
        <dt>{topics[2]}</dt><dd>{rate}. {feeLines.join(" ")} {en ? "Minimum" : "Minimum"}: {money(fee.minimum)}. {en ? "Maximum" : "Maksimum"}: {money(fee.maximum)}.</dd>
      </dl>
    </div>
    <div className="ih-reveal-shell" aria-hidden="true">
      <div className="ih-reveal-release" />
      <div className="ih-reveal-screen">
        <div className="ih-reveal-heading"><span>IdeaHire<span className="ih-reveal-heading-dot">.</span></span><span className="ih-reveal-counter">0{active + 1}<span> / 03</span></span></div>
        <div className="ih-reveal-stage">
          {headlines.map((lines, index) => <div className="ih-reveal-face" key={index} data-active={active === index}>
            <span className="ih-reveal-topic">{topics[index]}</span>
            <h2>{lines.map((line, lineIndex) => <span className="ih-reveal-line" key={line} style={{"--line":lineIndex}}><span className="ih-reveal-word">{line}</span></span>)}</h2>
            <p className="ih-reveal-description">{descriptions[index]}</p>
          </div>)}
          <div className="ih-reveal-face ih-reveal-fee" data-active={active === 2}>
            <span className="ih-reveal-topic">{en ? "IdeaHire fee" : "Prowizja IdeaHire"}</span>
            <div className="ih-reveal-rate"><span>{rate}</span></div>
            <p className="ih-reveal-description">{feeLines.map(line=><span key={line}>{line}</span>)}</p>
            <div className="ih-reveal-limits"><span><small>{en ? "Minimum fee" : "Minimum prowizji"}</small><strong>{money(fee.minimum)}</strong></span><span><small>{en ? "Maximum fee" : "Maksimum prowizji"}</small><strong>{money(fee.maximum)}</strong></span></div>
          </div>
        </div>
        <div className="ih-reveal-static">
          <div><strong>{topics[0]}</strong><p>{en ? "Projects, services and the people who make them happen." : "Zlecenia, usługi i ludzie, którzy je realizują."}</p></div>
          <div><strong>{topics[1]}</strong><p>{descriptions[1]}</p></div>
          <div><strong>{rate} — {en ? "IdeaHire fee" : "prowizja IdeaHire"}</strong><p>{en ? "Paid by the client. Min." : "Płaci zleceniodawca. Min."} {money(fee.minimum)}, {en ? "max." : "maks."} {money(fee.maximum)}.</p></div>
        </div>
        <ol className="ih-reveal-index">{labels.map((label,index)=><li key={label} data-active={active===index}><i/>{label}</li>)}</ol>
      </div>
    </div>
  </div>;
}
