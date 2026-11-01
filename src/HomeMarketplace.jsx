import { Link } from "react-router-dom";
import "./HomeMarketplace.css";

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

function RoundLink({ to, label, className }) {
  const split = label.indexOf(" ");
  return <Link to={to} className={`ih87-round-link ${className}`} aria-label={label}><span><span>{label.slice(0, split)} </span><strong>{label.slice(split + 1)}</strong></span><Arrow /></Link>;
}

/* Live data, rotation, swipe and router state stay owned by the homepage. */
export default function HomeMarketplace({
  en = false, hostRef, stopped, motionPaused, count = 0, index = 0,
  sample = false, isNew = false, pending, onShowPending,
  projectEvents = {}, swipeEvents = {}, trackEvents = {}, children,
}) {
  const copy = en ? {
    eyebrow: "PROJECTS × PEOPLE", title: ["Make", "it happen."],
    note: "Bring your idea. Or your skills. Find the other side of your next project.",
    jobs: "Find a project", talent: "Find a professional", recent: "The project board",
    preview: "An example of a project", fresh: "New project", all: "All projects",
    empty: "A place for your next project.", add: "Post a project", pending: "Show new project",
  } : {
    eyebrow: "PROJEKTY × LUDZIE", title: ["Dobra.", "Do dzieła."],
    note: "Masz pomysł albo fach. Tu znajdziesz drugą stronę.",
    jobs: "Znajdź zlecenie", talent: "Znajdź wykonawcę", recent: "Na tablicy",
    preview: "Przykładowe zlecenie", fresh: "Nowe zlecenie", all: "Wszystkie zlecenia",
    empty: "Miejsce na Twój kolejny projekt.", add: "Dodaj zlecenie", pending: "Pokaż nowe zlecenie",
  };
  return (
    <div ref={hostRef} className="ih53-jobs-finale ih87-market" data-no-translate="true" data-paused={stopped} data-motion-paused={motionPaused}>
      <div className="ih87-composition">
        <header className="ih87-heading">
          <p className="ih87-eyebrow">{copy.eyebrow}</p>
          <h1 className="ih87-title">{copy.title.map(line => <span key={line}>{line}</span>)}</h1>
        </header>
        <RoundLink className="ih87-jobs" to="/jobs" label={copy.jobs}/>
        <section className="ih87-live" aria-labelledby="ih87-projects-title" data-empty={count === 0} {...projectEvents}>
          <div className="ih87-live-heading">
            <h2 id="ih87-projects-title">{count > 0 && sample ? copy.preview : isNew && count > 0 ? copy.fresh : copy.recent}</h2>
            {count > 1 && !sample && <span className="ih87-count" aria-label={en ? `Project ${index + 1} of ${count}` : `Zlecenie ${index + 1} z ${count}`}>{String(index + 1).padStart(2,"0")}<span aria-hidden="true"> / </span>{String(count).padStart(2,"0")}</span>}
          </div>
          <div className="ih87-paper">
            {count > 0 ? <div className="ih87-project-window" {...swipeEvents}><div className="ih53-project-track" {...trackEvents}>{children}</div></div> : <div className="ih87-empty"><p>{copy.empty}</p><Link to="/find-talent">{copy.add}<Arrow /></Link></div>}
          </div>
          <div className="ih87-live-footer"><Link to="/jobs">{copy.all}<Arrow /></Link></div>
          <div className="ih87-project-status" aria-live="polite">{pending && <button type="button" onClick={onShowPending}>{copy.pending}<Arrow /></button>}</div>
        </section>
        <RoundLink className="ih87-talent" to="/freelancers" label={copy.talent}/>
        <p className="ih87-note">{copy.note}</p>
      </div>
    </div>
  );
}
