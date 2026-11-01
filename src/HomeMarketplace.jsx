import { Link } from "react-router-dom";
import { BrandMark } from "./Brand";
import "./HomeMarketplace.css";

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

function ActionLink({ to, label }) {
  const split = label.indexOf(" ");
  return <Link to={to} aria-label={label}><span className="ih84-action-label"><span>{label.slice(0,split)}</span><strong>{label.slice(split+1)}</strong></span><Arrow /></Link>;
}

/* Live data, rotation and swipe remain owned by the homepage. */
export default function HomeMarketplace({
  en = false, hostRef, stopped, motionPaused, count = 0, index = 0,
  sample = false, isNew = false, pending, onShowPending,
  projectEvents = {}, swipeEvents = {}, trackEvents = {}, children,
}) {
  const copy = en ? {
    eyebrow: "IDEAS MEET PEOPLE", title: ["Your idea.", "The right people."],
    intro: "Find your next project. Or someone who can help bring yours to life.",
    jobs: "Find a project", talent: "Find a professional", recent: "Projects on IdeaHire",
    preview: "An example of a project", fresh: "New project", all: "All projects",
    empty: "There are no active projects at the moment.", add: "Post a project", pending: "Show new project",
  } : {
    eyebrow: "POMYSŁY SPOTYKAJĄ LUDZI", title: ["Twój pomysł.", "Właściwi ludzie."],
    intro: "Znajdź zlecenie. Albo osobę, która pomoże Ci ruszyć z projektem.",
    jobs: "Znajdź zlecenie", talent: "Znajdź wykonawcę", recent: "Zlecenia na IdeaHire",
    preview: "Przykładowe zlecenie", fresh: "Nowe zlecenie", all: "Wszystkie zlecenia",
    empty: "Na razie nie ma aktywnych zleceń.", add: "Dodaj zlecenie", pending: "Pokaż nowe zlecenie",
  };
  return (
    <div ref={hostRef} className="ih53-jobs-finale ih83-market ih84-market" data-no-translate="true" data-paused={stopped} data-motion-paused={motionPaused}>
      <div className="ih84-hub">
        <div className="ih84-intro">
          <div className="ih85-masthead"><p className="ih84-eyebrow">{copy.eyebrow}</p><BrandMark className="ih85-hero-mark"/></div>
          <h1 className="ih84-title">{copy.title.map(line => <span key={line}>{line}</span>)}</h1>
          <p className="ih84-lead">{copy.intro}</p>
          <nav className="ih84-actions" aria-label={en ? "Choose your next step" : "Wybierz, co chcesz zrobić"}>
            <ActionLink to="/jobs" label={copy.jobs}/>
            <ActionLink to="/freelancers" label={copy.talent}/>
          </nav>
        </div>

        <section className="ih84-live" aria-labelledby="ih84-projects-title" data-empty={count === 0} {...projectEvents}>
          <div className="ih84-live-heading">
            <div><span className="ih84-live-dot" aria-hidden="true"/><h2 id="ih84-projects-title">{count > 0 && sample ? copy.preview : isNew && count > 0 ? copy.fresh : copy.recent}</h2></div>
            {count > 1 && !sample && <span className="ih84-count" aria-label={en ? `Project ${index + 1} of ${count}` : `Zlecenie ${index + 1} z ${count}`}>{String(index + 1).padStart(2,"0")}<span aria-hidden="true"> / </span>{String(count).padStart(2,"0")}</span>}
          </div>
          {count > 0 ? <div className="ih84-project-window" {...swipeEvents}><div className="ih53-project-track" {...trackEvents}>{children}</div></div> : <div className="ih84-empty"><p>{copy.empty}</p><Link to="/find-talent">{copy.add}<Arrow /></Link></div>}
          <div className="ih84-live-footer"><Link to="/jobs">{copy.all}<Arrow /></Link></div>
          <div className="ih84-project-status" aria-live="polite">{pending && <button type="button" onClick={onShowPending}>{copy.pending}<Arrow /></button>}</div>
        </section>
      </div>
    </div>
  );
}
