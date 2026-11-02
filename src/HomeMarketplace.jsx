import { Link } from "react-router-dom";
import "./HomeMarketplace.css";

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

function EntryLink({ to, label, className }) {
  return <Link to={to} className={`ih88-entry ${className}`}><span>{label}</span></Link>;
}

/* The homepage owns live data, rotation, swipe and the selected project's state. */
export default function HomeMarketplace({
  en = false, hostRef, stopped, motionPaused, count = 0, index = 0,
  sample = false, isNew = false, pending, onShowPending,
  projectEvents = {}, swipeEvents = {}, trackEvents = {}, children,
}) {
  const copy = en ? {
    eyebrow: "A place for ideas and skills.", title: ["An idea is a start.", "People make it happen."],
    intro: "Find a professional for your idea. Or a project for your skills.",
    jobs: "Find a project", talent: "Find a professional", recent: "Projects on IdeaHire",
    preview: "An example of a project", fresh: "New project", all: "All projects",
    empty: "Have a project in mind? Tell people what you need.", add: "Post a project", pending: "Show new project",
  } : {
    eyebrow: "Miejsce dla pomysłów i umiejętności.", title: ["Pomysł to początek.", "Ludzie robią resztę."],
    intro: "Znajdź wykonawcę do swojego pomysłu. Albo projekt dla swoich umiejętności.",
    jobs: "Znajdź zlecenie", talent: "Znajdź wykonawcę", recent: "Zlecenia na IdeaHire",
    preview: "Przykładowe zlecenie", fresh: "Nowe zlecenie", all: "Wszystkie zlecenia",
    empty: "Masz pomysł na projekt? Opisz go i zaproś do współpracy.", add: "Dodaj zlecenie", pending: "Pokaż nowe zlecenie",
  };
  return (
    <div ref={hostRef} className="ih53-jobs-finale ih88-market" data-no-translate="true" data-paused={stopped} data-motion-paused={motionPaused}>
      <div className="ih88-layout">
        <div className="ih88-intro">
          <header className="ih88-heading">
            <p className="ih88-eyebrow">{copy.eyebrow}</p>
            <h1 className="ih88-title" aria-label={copy.title.join(" ")}>
              <span className="ih88-title-first">{copy.title[0]}</span>
              <span className="ih88-title-last">{copy.title[1]}</span>
            </h1>
          </header>
          <div className="ih88-hero-bottom">
            <p className="ih88-lead">{copy.intro}</p>
            <nav className="ih88-actions" aria-label={en ? "Start a collaboration" : "Rozpocznij współpracę"}>
              <EntryLink className="ih88-talent" to="/freelancers" label={copy.talent}/>
              <EntryLink className="ih88-jobs" to="/jobs" label={copy.jobs}/>
            </nav>
          </div>
        </div>

        <section className="ih88-live" aria-labelledby="ih88-projects-title" data-empty={count === 0} {...projectEvents}>
          <div className="ih88-live-heading">
            <div><h2 id="ih88-projects-title">{count > 0 && sample ? copy.preview : isNew && count > 0 ? copy.fresh : copy.recent}</h2>
            {count > 1 && !sample && <span className="ih88-count" aria-label={en ? `Project ${index + 1} of ${count}` : `Zlecenie ${index + 1} z ${count}`}>{String(index + 1).padStart(2,"0")}<span aria-hidden="true"> / </span>{String(count).padStart(2,"0")}</span>}</div>
            <Link to="/jobs">{copy.all}<Arrow /></Link>
          </div>
          {count > 0 ? <div className="ih88-project-window" {...swipeEvents}><div className="ih53-project-track" {...trackEvents}>{children}</div></div> : <div className="ih88-empty"><p>{copy.empty}</p><Link to="/find-talent">{copy.add}<Arrow /></Link></div>}
          <div className="ih88-project-status" aria-live="polite">{pending && <button type="button" onClick={onShowPending}>{copy.pending}<Arrow /></button>}</div>
        </section>
      </div>
    </div>
  );
}
