import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

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
  const items = en ? [
    ["Explore their work", "See the portfolio, profile and offer before choosing a professional."],
    ["Agree on the details", "Discuss the scope, price and deadline together."],
    ["Keep the project together", "Messages, materials and agreements stay alongside your project."],
  ] : [
    ["Portfolio przed wyborem", "Poznaj prace, profil i ofertę wykonawcy."],
    ["Ustalenia przed startem", "Omówcie wspólnie zakres, cenę i termin."],
    ["Kontakt przy projekcie", "Wiadomości, materiały i ustalenia w jednym miejscu."],
  ];
  return <div ref={hostRef} className="ih-work-story" data-entered="false" data-phase="ready" onAnimationEnd={event => {
    if (event.animationName === "ih-work-story-file") hostRef.current.dataset.phase = "revealed";
  }}>
    <div className="ih-work-story-copy">
      <h2>{en ? "From portfolio to working together." : "Od portfolio do współpracy."}</h2>
      <dl>{items.map(([title, description], index) => <div className="ih-work-story-benefit" key={title} style={{ "--step": index }}>
        <dt><span aria-hidden="true">0{index + 1}</span>{title}</dt><dd>{description}</dd>
      </div>)}</dl>
    </div>
    <div className="ih-work-story-art" aria-hidden="true">
      <svg viewBox="0 0 460 330" focusable="false">
        <g className="ih-story-portfolio">
          <path className="ih-story-paper" d="M58 204V40Q58 28 70 28H202L232 58V170" />
          <path className="ih-story-line" d="M202 28V58H232" />
          <text x="80" y="75" className="ih-story-label">Portfolio</text>
          <path className="ih-story-line ih-story-sketch" d="M80 132L108 104L139 139L163 115L200 150M80 164H136M80 178H114" />
        </g>
        <g className="ih-story-message">
          <path className="ih-story-bubble" d="M167 133H380Q398 133 398 151V207Q398 225 380 225H214L188 247V225H167Q149 225 149 207V151Q149 133 167 133Z" />
          <text x="172" y="167" className="ih-story-message-title">{en ? "Agreed together" : "Ustalone wspólnie"}</text>
          <text x="172" y="194" className="ih-story-message-detail">{en ? "Scope · Timing · Price" : "Zakres · Termin · Cena"}</text>
        </g>
        <g className="ih-story-file">
          <path className="ih-story-line" d="M83 245V286Q83 298 95 298H265" />
          <path className="ih-story-file-outline" d="M293 252H323L335 264V301H293ZM323 252V264H335M303 277H324M303 286H319" />
          <text x="102" y="278" className="ih-story-file-label">{en ? "Messages and files" : "Wiadomości i pliki"}</text>
        </g>
      </svg>
    </div>
  </div>;
}
