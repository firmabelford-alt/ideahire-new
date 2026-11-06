import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon } from "./InterfaceIcons";
import { BrandMark } from "./Brand";
import "./HomeCooperation.css";

export function HomeClarity({ en = false }) {
  const points = en ? [
    ["The person.", "See their work before you choose.", "Explore profiles, portfolios and services. Ask about what matters to your project."],
    ["The agreement.", "Know what you are starting together.", "Agree on the scope, price and deadline before the work begins."],
    ["The conversation.", "Keep the details with the project.", "Exchange messages, confirm arrangements and share materials in your collaboration."],
  ] : [
    ["Człowiek.", "Zobacz prace. Poznaj podejście.", "Sprawdź profil, portfolio i ofertę. Zapytaj o to, co ma znaczenie dla Twojego projektu."],
    ["Ustalenia.", "Wiedz, na co się umawiacie.", "Zakres, cena i termin — ustalcie je wspólnie, zanim zacznie się praca."],
    ["Kontakt.", "Wracaj do konkretów, nie do domysłów.", "W jednej współpracy wymieniajcie wiadomości, zapisujcie ustalenia i przekazujcie materiały."],
  ];

  return <section className="ih-cooperation ih-clarity" aria-labelledby="ih-clarity-title" data-no-translate="true">
    <div className="ih-clarity-intro">
      <div>
        <p className="ih-cooperation-kicker">{en ? "GOOD WORK STARTS WITH A CONVERSATION" : "DOBRA ROBOTA ZACZYNA SIĘ OD ROZMOWY"}</p>
        <h2 id="ih-clarity-title">{en ? "Work together." : "Współpraca bez"}<span>{en ? "Leave out the guesswork." : "czytania w myślach."}</span></h2>
      </div>
      <div className="ih-clarity-summary">
        <p className="ih-clarity-lead">{en ? "You bring the idea. You choose who joins you. Agree on the details together, so both sides know where to begin." : "Przychodzisz z pomysłem. Wybierasz osobę. Szczegóły ustalacie razem — tak, żeby obie strony wiedziały, od czego zaczynają."}</p>
        <a className="ih-cooperation-link" href="#categories">{en ? "Find your field" : "Znajdź swoją dziedzinę"}<ArrowIcon /></a>
      </div>
    </div>
    <ol className="ih-clarity-list">
      {points.map(([label, title, description], index) => <li key={label}>
        <div className="ih-clarity-step"><span className="ih-clarity-index" aria-hidden="true">0{index + 1}</span><p className="ih-clarity-label">{label}</p><span className="ih-clarity-dot" aria-hidden="true" /></div>
        <h3>{title}</h3><p className="ih-clarity-detail">{description}</p>
      </li>)}
    </ol>
  </section>;
}

function ConnectionArtwork({ en, role }) {
  return <div className="ih-connection-art" data-role={role} aria-hidden="true">
    <div className="ih-connection-orbit" />
    <span className="ih-art-coordinate ih-art-coordinate-top">{en ? "YOUR NEXT CONNECTION" : "TWOJE NASTĘPNE POŁĄCZENIE"}</span>
    <div className="ih-connection-brief">
      <span className="ih-art-eyebrow">{en ? "THE STARTING POINT" : "PUNKT WYJŚCIA"}</span>
      <strong>{en ? "Your\nidea." : "Twój\npomysł."}</strong>
      <div className="ih-brief-lines"><i /><i /><i /></div>
      <div className="ih-brief-tags"><span>{en ? "Scope" : "Zakres"}</span><span>{en ? "Deadline" : "Termin"}</span></div>
      <span className="ih-art-page">01 / BRIEF</span>
    </div>
    <div className="ih-connection-folio">
      <span className="ih-art-eyebrow">{en ? "THE OTHER SIDE" : "DRUGA STRONA"}</span>
      <svg className="ih-folio-art" viewBox="0 0 200 150" fill="none" focusable="false">
        <path d="M8 140V75a52 52 0 0 1 104 0v65H8Z" fill="var(--connection-ink)" />
        <path d="M56 140V75a52 52 0 0 1 104 0v65H56Z" fill="var(--connection-accent)" />
        <path d="M104 140V75a52 52 0 0 1 88-37" stroke="var(--connection-ink)" strokeWidth="1.5" />
        <circle cx="162" cy="25" r="17" fill="var(--connection-ink)" />
        <path d="M8 140h184M8 12h42" stroke="var(--connection-ink)" strokeWidth="1.5" />
      </svg>
      <strong>{en ? "Their craft." : "Czyjś fach."}</strong>
      <span className="ih-art-page">02 / PORTFOLIO</span>
    </div>
    <div className="ih-connection-seal"><BrandMark /></div>
    <span className="ih-art-coordinate ih-art-coordinate-bottom">{en ? "An illustration of a collaboration" : "Ilustracja współpracy"}</span>
  </div>;
}

export function HomePaths({ en = false }) {
  const [role, setRole] = useState("hire");
  const tabsRef = useRef(null);
  const hire = role === "hire";
  const title = hire
    ? (en ? ["You have an idea.", "Someone has the craft."] : ["Ty masz pomysł.", "Ktoś ma ten fach."])
    : (en ? ["You have the craft.", "Someone needs it."] : ["Ty masz fach.", "Ktoś go potrzebuje."]);

  function moveTab(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = Array.from(tabsRef.current?.querySelectorAll('[role="tab"]') || []);
    const current = tabs.indexOf(event.target);
    if (current < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    // Instant local content: selection follows the arrow-key focus.
    setRole(next === 0 ? "hire" : "work");
    tabs[next]?.focus({ preventScroll: true });
  }

  return <section className="ih-cooperation ih-paths" id="for-users" aria-labelledby="ih-paths-title" data-no-translate="true">
    <div className="ih-paths-heading"><h2 className="ih-cooperation-kicker" id="ih-paths-title">{en ? "TWO SIDES. ONE CONNECTION." : "DWIE STRONY. JEDNO POŁĄCZENIE."}</h2><span className="ih-paths-connection" aria-hidden="true"><i /><span /><i /></span></div>
    <div className="ih-connection-layout">
      <div className="ih-connection-copy">
        <div className="ih-path-tabs" role="tablist" aria-label={en ? "Your role in the collaboration" : "Twoja rola we współpracy"} ref={tabsRef} onKeyDown={moveTab}>
          {["hire", "work"].map((value, index) => <button key={value} id={`ih-path-tab-${value}`} type="button" role="tab" aria-selected={role === value} aria-controls={`ih-path-panel-${value}`} tabIndex={role === value ? 0 : -1} onClick={() => setRole(value)}><span aria-hidden="true">0{index + 1}</span>{value === "hire" ? (en ? "I’m hiring" : "Zlecam") : (en ? "I’m creating" : "Wykonuję")}<ArrowIcon direction="up-right" /></button>)}
        </div>
        {["hire", "work"].map(value => <div className="ih-path-panel" key={value} role="tabpanel" tabIndex={0} id={`ih-path-panel-${value}`} aria-labelledby={`ih-path-tab-${value}`} hidden={role !== value}>
          {role === value && <>
            <h3>{title[0]}<span>{title[1]}</span></h3>
            <p>{hire
              ? (en ? "You don’t need a whole team to take your next step. Find the right person for the task, explore their work and agree on the details." : "Do następnego kroku nie potrzebujesz całego zespołu. Znajdź osobę do konkretnego zadania, sprawdź jej prace i ustalcie szczegóły.")
              : (en ? "Your skills can become someone’s next step. Explore projects and start a conversation where your work can make a difference." : "To, co potrafisz, może być czyimś następnym krokiem. Sprawdź zlecenia i zacznij rozmowę tam, gdzie Twoja praca może coś zmienić.")}</p>
            <Link className="ih-connection-cta" to={hire ? "/find-talent" : "/jobs"}>{hire ? (en ? "Find a professional" : "Znajdź wykonawcę") : (en ? "Explore projects" : "Przeglądaj zlecenia")}<ArrowIcon /></Link>
            <p className="ih-connection-footnote">{en ? "The scope, price and terms are yours to agree on." : "Zakres, cenę i warunki ustalacie między sobą."}</p>
          </>}
        </div>)}
      </div>
      <ConnectionArtwork en={en} role={role} />
    </div>
  </section>;
}
