import { Link } from "react-router-dom";
import { ArrowIcon } from "./InterfaceIcons";
import "./HomeCooperation.css";

export function HomeClarity({ en = false }) {
  const points = en ? [
    ["The person.", "Look at their work, not just their words.", "Explore profiles, portfolios and services. Ask about what matters to your project."],
    ["The agreement.", "Know what you are starting together.", "Agree on the scope, price and deadline before the work begins."],
    ["The conversation.", "Keep the details with the project.", "Use your collaboration to exchange messages, confirm arrangements and share materials."],
  ] : [
    ["Człowiek.", "Zobacz, co robi. Potem zdecyduj.", "Sprawdź profil, portfolio i ofertę. Zapytaj o to, co ma znaczenie dla Twojego projektu."],
    ["Ustalenia.", "Wiedz, na co się umawiacie.", "Zakres, cena i termin — ustalcie je wspólnie, zanim zacznie się praca."],
    ["Kontakt.", "Trzymaj szczegóły przy projekcie.", "W jednej współpracy wymieniajcie wiadomości, zapisujcie ustalenia i przekazujcie materiały."],
  ];

  return <section className="ih-cooperation ih-clarity" aria-labelledby="ih-clarity-title" data-no-translate="true">
    <div className="ih-clarity-intro">
      <p className="ih-cooperation-kicker">{en ? "BEFORE YOU BEGIN" : "ZANIM ZACZNIESZ"}</p>
      <h2 id="ih-clarity-title">{en ? "A good choice starts" : "Dobry wybór zaczyna się"}<span>{en ? "with the details." : "od konkretów."}</span></h2>
      <p className="ih-clarity-lead">{en ? "You choose the person. You agree on the terms together. You know where the conversation continues." : "Ty wybierasz osobę. Warunki ustalacie razem. Rozmowa ma swoje miejsce."}</p>
      <a className="ih-cooperation-link" href="#categories">{en ? "Find your field" : "Znajdź swoją dziedzinę"}<ArrowIcon /></a>
    </div>
    <ol className="ih-clarity-list">
      {points.map(([label, title, description], index) => <li key={label}>
        <span className="ih-clarity-index" aria-hidden="true">0{index + 1}</span>
        <div><p className="ih-clarity-label">{label}</p><h3>{title}</h3><p className="ih-clarity-detail">{description}</p></div>
      </li>)}
    </ol>
  </section>;
}

export function HomePaths({ en = false }) {
  return <section className="ih-cooperation ih-paths" id="for-users" aria-labelledby="ih-paths-title" data-no-translate="true">
    <div className="ih-paths-heading">
      <h2 className="ih-cooperation-kicker" id="ih-paths-title">{en ? "WHICH SIDE DO YOU START ON?" : "PO KTÓREJ STRONIE ZACZYNASZ?"}</h2>
      <span className="ih-paths-connection" aria-hidden="true"><i /><span /><i /></span>
    </div>
    <article className="ih-path ih-path-hire">
      <div className="ih-path-side"><span className="ih-path-number" aria-hidden="true">01</span><p>{en ? "I HAVE A PROJECT" : "CHCĘ ZLECIĆ"}</p></div>
      <h3>{en ? "Your goal." : "Twój cel."}<span>{en ? "Someone’s strength." : "Czyjeś mocne strony."}</span></h3>
      <div className="ih-path-next"><p>{en ? "A website, a visual identity, a video? Find someone, explore their work and talk about what you need." : "Strona, projekt graficzny, montaż? Wybierz osobę, sprawdź jej prace i porozmawiaj o swoim zadaniu."}</p><Link className="ih-cooperation-link" to="/find-talent">{en ? "Find a professional" : "Znajdź wykonawcę"}<ArrowIcon direction="up-right" /></Link></div>
    </article>
    <article className="ih-path ih-path-work">
      <div className="ih-path-side"><span className="ih-path-number" aria-hidden="true">02</span><p>{en ? "I HAVE THE SKILLS" : "CHCĘ WYKONAĆ"}</p></div>
      <h3>{en ? "Your craft." : "Twój fach."}<span>{en ? "Someone’s next step." : "Czyjś następny krok."}</span></h3>
      <div className="ih-path-next"><p>{en ? "Show what you do best. Explore projects and get in touch where your skills can make a difference." : "Pokaż, co robisz najlepiej. Przejrzyj zlecenia i odezwij się tam, gdzie Twoje umiejętności mogą coś wnieść."}</p><Link className="ih-cooperation-link" to="/jobs">{en ? "Explore projects" : "Przeglądaj zlecenia"}<ArrowIcon direction="up-right" /></Link></div>
    </article>
  </section>;
}
