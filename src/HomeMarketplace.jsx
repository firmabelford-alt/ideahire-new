import { Link } from "react-router-dom";
import "./HomeMarketplace.css";

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

/* Presentation only: the existing homepage owns live data, rotation and swipe. */
export default function HomeMarketplace({
  en = false, hostRef, stopped, motionPaused, count = 0, index = 0,
  sample = false, isNew = false, pending, onShowPending,
  projectEvents = {}, swipeEvents = {}, trackEvents = {}, children,
}) {
  const copy = en ? {
    eyebrow: "IDEAHIRE · PROJECTS & PEOPLE", title: ["Your next", "project."],
    intro: "Find someone for your idea. Or put your skills to work.",
    jobs: "I'm looking for a project", jobsHint: "Explore briefs and find the right project for you.",
    talent: "I need a professional", talentHint: "Find the right person for your idea.",
    recent: "On IdeaHire now", preview: "An example of a project", fresh: "New project",
    all: "All projects", empty: "There are no active projects at the moment.",
    add: "Post a project", pending: "Show new project",
  } : {
    eyebrow: "IDEAHIRE · PROJEKTY I LUDZIE", title: ["Twój następny", "projekt."],
    intro: "Zleć to, co masz w planach. Albo wykorzystaj to, co umiesz.",
    jobs: "Szukam zlecenia", jobsHint: "Sprawdzam projekty i wybieram coś dla siebie.",
    talent: "Potrzebuję wykonawcy", talentHint: "Szukam osoby do swojego projektu.",
    recent: "Teraz na IdeaHire", preview: "Tak wygląda przykładowe zlecenie", fresh: "Nowe zlecenie",
    all: "Wszystkie zlecenia", empty: "Na razie nie ma aktywnych zleceń.",
    add: "Dodaj zlecenie", pending: "Pokaż nowe zlecenie",
  };
  return (
    <div ref={hostRef} className="ih53-jobs-finale ih83-market" data-no-translate="true" data-paused={stopped} data-motion-paused={motionPaused}>
      <div className="ih83-market-inner">
        <div className="ih83-start">
          <div className="ih83-intro">
            <p className="ih83-eyebrow">{copy.eyebrow}</p>
            <h1 className="ih83-title">{copy.title.map(line => <span key={line}>{line}</span>)}</h1>
            <p className="ih83-intro-text">{copy.intro}</p>
          </div>
          <nav className="ih83-directions" aria-label={en ? "Choose your next step" : "Wybierz, co chcesz zrobić"}>
            <Link to="/jobs" className="ih83-direction">
              <span><strong>{copy.jobs}</strong><span>{copy.jobsHint}</span></span><Arrow />
            </Link>
            <Link to="/freelancers" className="ih83-direction">
              <span><strong>{copy.talent}</strong><span>{copy.talentHint}</span></span><Arrow />
            </Link>
          </nav>
        </div>

        <section className="ih83-projects" aria-labelledby="ih83-projects-title" data-empty={count === 0} {...projectEvents}>
          <div className="ih83-projects-heading">
            <h2 id="ih83-projects-title">{count > 0 && sample ? copy.preview : isNew && count > 0 ? copy.fresh : copy.recent}</h2>
            {count > 1 && !sample && <span className="ih83-project-count" aria-label={en ? `Project ${index + 1} of ${count}` : `Zlecenie ${index + 1} z ${count}`}>{String(index + 1).padStart(2, "0")}<span aria-hidden="true"> / </span>{String(count).padStart(2, "0")}</span>}
            {count > 0 && <Link className="ih83-all-projects" to="/jobs">{copy.all}<Arrow /></Link>}
          </div>
          {count > 0 ? (
            <div className="ih83-project-window" {...swipeEvents}>
              <div className="ih53-project-track" {...trackEvents}>{children}</div>
            </div>
          ) : (
            <div className="ih83-empty"><p>{copy.empty}</p><Link to="/find-talent">{copy.add}<Arrow /></Link></div>
          )}
          <div className="ih83-project-status" aria-live="polite">{pending && <button type="button" onClick={onShowPending}>{copy.pending}<Arrow /></button>}</div>
        </section>
      </div>
    </div>
  );
}
