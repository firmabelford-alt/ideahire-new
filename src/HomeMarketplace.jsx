import { Link } from "react-router-dom";
import { useLayoutEffect, useRef, useState } from "react";
import { ListingThumbnail } from "./ListingThumbnail";
import "./HomeMarketplace.css";

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

function EntryLink({ to, label, className }) {
  return <Link to={to} className={`ih88-entry ${className}`}><span>{label}</span><Arrow /></Link>;
}

export function HomeProjectCard({ job, en = false, incoming = false, isNew = false, sample = false, category, price, author, client }) {
  return <article className={'ih53-project-card' + (incoming ? ' is-incoming' : '')} aria-hidden={incoming || undefined} inert={incoming ? '' : undefined} data-new={isNew}>
    <div className="ih53-project-top">{author}</div>
    <span className="ih59-project-category">{category}</span>
    <ListingThumbnail path={job.thumbnail_path} ownerId={job.user_id} kind="jobs" title={job.title} client={client} />
    <div className="ih66-project-description"><h3 title={job.title}>{String(job.title || '').slice(0,160)}</h3><p>{String(job.description || (en ? 'Review the scope and requirements in the listing.' : 'Sprawdź zakres i wymagania w ogłoszeniu.')).slice(0,280)}</p></div>
    {sample && <small className="ih53-project-caption">{en ? 'Illustrative project' : 'Przykładowe zlecenie'}</small>}
    <div className="ih53-project-bottom ih66-project-budget"><div><small>{en ? 'Budget' : 'Budżet'}</small><strong>{price}</strong></div><Link className="ih53-project-open" data-preserve-router-state="true" to="/jobs" state={sample ? undefined : {lucynaJobId:job.id,lucynaTitle:job.title}} tabIndex={incoming ? -1 : undefined}>{en ? 'View project' : 'Zobacz zlecenie'} <span aria-hidden="true"><Arrow /></span></Link></div>
  </article>;
}

/* The homepage owns live data, rotation, swipe and the selected project's state. */
export default function HomeMarketplace({
  en = false, hostRef, stopped, motionPaused, count = 0, index = 0,
  sample = false, isNew = false, pending, onShowPending,
  projectEvents = {}, swipeEvents = {}, trackEvents = {}, children,
}) {
  const projectWindowRef = useRef(null);
  const [projectHeight, setProjectHeight] = useState(null);
  const sliding = trackEvents['data-sliding'];
  useLayoutEffect(() => {
    const windowElement = projectWindowRef.current;
    const cards = windowElement?.querySelectorAll('.ih53-project-card');
    const card = cards?.[sliding ? 1 : 0] || cards?.[0];
    if (!windowElement || !card) { setProjectHeight(null); return; }
    const measure = () => {
      const style = getComputedStyle(windowElement);
      const height = Math.ceil(card.getBoundingClientRect().height + parseFloat(style.borderTopWidth || 0) + parseFloat(style.borderBottomWidth || 0));
      if (height > 0) setProjectHeight(current => current === height ? current : height);
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(card);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [children, sliding, count]);
  const copy = en ? {
    eyebrow: ["Projects", "Professionals", "Collaboration"], title: ["A good idea.", "Now make it happen."],
    intro: "Find a professional for your idea. Or a project for your skills.",
    jobs: "Find a project", talent: "Find a professional", recent: "Recent projects", allShort: "All projects",
    preview: "An example of a project", fresh: "New project", all: "All projects",
    empty: "Have a project in mind? Tell people what you need.", add: "Post a project", pending: "Show new project",
  } : {
    eyebrow: ["Zlecenia", "Wykonawcy", "Współpraca"], title: ["Dobry pomysł.", "Teraz dobra robota."],
    intro: "Znajdź wykonawcę do swojego pomysłu. Albo projekt dla swoich umiejętności.",
    jobs: "Znajdź zlecenie", talent: "Znajdź wykonawcę", recent: "Ostatnie zlecenia", allShort: "Wszystkie",
    preview: "Przykładowe zlecenie", fresh: "Nowe zlecenie", all: "Wszystkie zlecenia",
    empty: "Masz pomysł na projekt? Opisz go i zaproś do współpracy.", add: "Dodaj zlecenie", pending: "Pokaż nowe zlecenie",
  };
  return (
    <div ref={hostRef} className="ih53-jobs-finale ih88-market ih91-market" data-no-translate="true" data-paused={stopped} data-motion-paused={motionPaused}>
      <div className="ih88-layout">
        <div className="ih88-intro">
          <header className="ih88-heading">
            <p className="ih88-eyebrow">{copy.eyebrow.map(word => <span key={word}>{word}</span>)}</p>
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
            <Link to="/jobs" aria-label={copy.all}><span className="ih91-all-full">{copy.all}</span><span className="ih91-all-short">{copy.allShort}</span><Arrow /></Link>
          </div>
          {count > 0 ? <div ref={projectWindowRef} className="ih88-project-window" style={projectHeight ? { height: projectHeight } : undefined} {...swipeEvents}><div className="ih53-project-track" {...trackEvents}>{children}</div></div> : <div className="ih88-empty"><p>{copy.empty}</p><Link to="/find-talent">{copy.add}<Arrow /></Link></div>}
          <div className="ih88-project-status" aria-live="polite">{pending && <button type="button" onClick={onShowPending}>{copy.pending}<Arrow /></button>}</div>
        </section>
      </div>
    </div>
  );
}
