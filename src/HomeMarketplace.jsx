import { Link } from "react-router-dom";
import "./HomeMarketplace.css";

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

/* Presentation only: the homepage still owns live data, rotation and swipe. */
export default function HomeMarketplace({
  en = false, hostRef, stopped, motionPaused, count = 0, index = 0,
  sample = false, isNew = false, pending, onShowPending,
  projectEvents = {}, swipeEvents = {}, trackEvents = {}, children,
}) {
  const copy = en ? {
    eyebrow: "A PLACE TO GET THINGS GOING", title: ["Let's connect", "the dots."],
    intro: "You bring the idea. Someone brings the know-how. See what happens next.",
    client: "Have something in mind?", clientNote: "Find the person who can help you make it happen.",
    maker: "Your next move.", makerNote: "A project worth your time could start right here.",
    jobs: "Find a project", talent: "Find a professional", recent: "On the project board",
    preview: "An example of a project", fresh: "New project", all: "All projects",
    empty: "The board is open for your first project.", add: "Post a project", pending: "Show new project",
  } : {
    eyebrow: "TU SPRAWY NABIERAJĄ BIEGU", title: ["Połączmy", "kropki."],
    intro: "Ty masz pomysł. Ktoś ma fach w ręku. Zobaczmy, co z tego wyjdzie.",
    client: "Masz coś do zrobienia?", clientNote: "Znajdź osobę, z którą ruszysz z miejsca.",
    maker: "Teraz Twój ruch.", makerNote: "Kolejny projekt może zacząć się właśnie tutaj.",
    jobs: "Znajdź zlecenie", talent: "Znajdź wykonawcę", recent: "Na tablicy zleceń",
    preview: "Przykładowe zlecenie", fresh: "Nowe zlecenie", all: "Wszystkie zlecenia",
    empty: "Na tablicy jest miejsce na Twój projekt.", add: "Dodaj zlecenie", pending: "Pokaż nowe zlecenie",
  };
  return (
    <div ref={hostRef} className="ih53-jobs-finale ih86-market" data-no-translate="true" data-paused={stopped} data-motion-paused={motionPaused}>
      <div className="ih86-board">
        <header className="ih86-heading">
          <p className="ih86-eyebrow">{copy.eyebrow}</p>
          <h1 className="ih86-title"><span>{copy.title[0]}</span><strong>{copy.title[1]}</strong></h1>
          <p className="ih86-lead">{copy.intro}</p>
        </header>
        <div className="ih86-client">
          <span className="ih86-node" aria-hidden="true"/>
          <p className="ih86-entry-title">{copy.client}</p>
          <p className="ih86-entry-note">{copy.clientNote}</p>
          <Link className="ih86-talent-link" to="/freelancers">{copy.talent}<Arrow /></Link>
        </div>
        <section className="ih86-live" aria-labelledby="ih86-projects-title" data-empty={count === 0} {...projectEvents}>
          <div className="ih86-live-heading">
            <h2 id="ih86-projects-title"><span aria-hidden="true"/>{count > 0 && sample ? copy.preview : isNew && count > 0 ? copy.fresh : copy.recent}</h2>
            {count > 1 && !sample && <span className="ih86-count" aria-label={en ? `Project ${index + 1} of ${count}` : `Zlecenie ${index + 1} z ${count}`}>{String(index + 1).padStart(2,"0")}<span aria-hidden="true"> / </span>{String(count).padStart(2,"0")}</span>}
          </div>
          <div className="ih86-ticket">
            {count > 0 ? <div className="ih86-project-window" {...swipeEvents}><div className="ih53-project-track" {...trackEvents}>{children}</div></div> : <div className="ih86-empty"><span aria-hidden="true">+</span><p>{copy.empty}</p><Link to="/find-talent">{copy.add}<Arrow /></Link></div>}
          </div>
          <div className="ih86-live-footer"><Link to="/jobs">{copy.all}<Arrow /></Link></div>
          <div className="ih86-project-status" aria-live="polite">{pending && <button type="button" onClick={onShowPending}>{copy.pending}<Arrow /></button>}</div>
        </section>
        <div className="ih86-maker">
          <div className="ih86-constellation" aria-hidden="true"><i/><i/><i/></div>
          <p className="ih86-maker-title">{copy.maker}</p>
          <p className="ih86-entry-note">{copy.makerNote}</p>
          <Link className="ih86-jobs-link" to="/jobs">{copy.jobs}<Arrow /></Link>
        </div>
      </div>
    </div>
  );
}
