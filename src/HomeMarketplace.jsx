import { Link } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ListingThumbnail } from "./ListingThumbnail";
import { nearestProjectStop, projectScrollStops } from "./HomeProjectScroll";
import "./HomeMarketplace.css";
import { homeFeedKey } from "./HomeFeed";

function Arrow() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

function EntryLink({ to, label, className }) {
  return <Link to={to} className={`ih88-entry ${className}`}><span>{label}</span><Arrow /></Link>;
}

export function HomeProjectCard({ job, en = false, sample = false, duplicate = false, category, price, author, client }) {
  const service = job.showcase_kind === 'service';
  const href = service ? `/services/${job.id}` : '/jobs';
  const destination = service || sample ? undefined : { lucynaJobId: job.id, lucynaTitle: job.title };
  return <article className="ih-showcase-card">
    <Link className="ih-showcase-cover" to={href} state={destination} data-preserve-router-state="true" aria-label={`${service ? (en ? 'View service' : 'Zobacz usługę') : (en ? 'View project' : 'Zobacz zlecenie')}: ${job.title}`} tabIndex={-1}>
      <ListingThumbnail path={job.thumbnail_path} ownerId={job.user_id} kind={service ? "services" : "jobs"} title={job.title} client={client} fallback={
        <div className="ih-showcase-no-image"><span>IdeaHire</span><strong>{category}</strong><small>{service ? (en ? 'Service by a freelancer' : 'Usługa wykonawcy') : (en ? 'Project brief' : 'Zlecenie do realizacji')}</small></div>
      } />
    </Link>
    <div className="ih-showcase-body">
      <div className="ih-showcase-category-row"><span className="ih-showcase-kind">{service ? (en ? "Service" : "Usługa") : (en ? "Project" : "Zlecenie")}</span><span className="ih-showcase-category">{category}</span></div>
      <h3 title={job.title}><Link tabIndex={duplicate ? -1 : undefined} to={href} state={destination} data-preserve-router-state="true">{String(job.title || '').slice(0, 160)}</Link></h3>
      <p className="ih-showcase-description">{String(job.description || (en ? 'See what the client needs and how you can help.' : 'Sprawdź, czego potrzebuje zleceniodawca i jak możesz pomóc.')).slice(0, 280)}</p>
      <div className="ih-showcase-author">{author}</div>
      {sample && <small className="ih-showcase-example">{en ? 'Illustrative project' : 'Przykładowe zlecenie'}</small>}
      <div className="ih-showcase-bottom"><div><small>{service ? (job.price_mode === 'custom' ? (en ? 'Price' : 'Cena') : (en ? 'Price from' : 'Cena od')) : (en ? 'Budget' : 'Budżet')}</small><strong>{price}</strong></div><Link tabIndex={duplicate ? -1 : undefined} className="ih-showcase-open" data-preserve-router-state="true" to={href} state={destination} aria-label={`${en ? 'View details' : 'Zobacz szczegóły'}: ${job.title}`}>{en ? 'Details' : 'Szczegóły'}<Arrow /></Link></div>
    </div>
  </article>;
}

/* Native scrolling keeps touch, trackpad and keyboard interactions predictable. */
export default function HomeMarketplace({ en = false, jobs = [], renderProject, paused = false, reduced = false }) {
  const host = useRef(null), rail = useRef(null), activeId = useRef(jobs[0] ? homeFeedKey(jobs[0]) : undefined), known = useRef(new Set()), initialized = useRef(false);
  const openedAt = useRef(Date.now());
  const [stops, setStops] = useState([0]), [position, setPosition] = useState(0), [manualPause, setManualPause] = useState(false);
  const [hover, setHover] = useState(false), [focus, setFocus] = useState(false), [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden), [pending, setPending] = useState(null);
  const signature = jobs.map(homeFeedKey).join('|');
  const motionPaused = paused || reduced || manualPause;
  const stopped = motionPaused || hover || focus || hidden || !visible;
  const copy = en ? {
    eyebrow: ['Your idea', 'The right people', 'Work together'], title: ['Have something in mind?', 'Let’s get it done.'],
    intro: 'Find someone who knows how to help. Or put your skills to work on your next project.',
    jobs: 'Find a project', talent: 'Find a professional', recent: 'Projects and services. Take a look.', all: 'Browse all',
    empty: 'Have a project in mind? Tell people what you need.', add: 'Post a project', pending: 'See the new listing',
    hint: 'New projects and services, in one place', mobileHint: 'Scrolls automatically · swipe to explore', pause: 'Pause scrolling', play: 'Resume scrolling',
  } : {
    eyebrow: ['Twój pomysł', 'Właściwi ludzie', 'Wspólna praca'], title: ['Masz coś do zrobienia?', 'Znajdźmy kogoś do pomocy.'],
    intro: 'Poznaj ludzi, którzy znają się na rzeczy. A jeśli to Ty szukasz zlecenia — sprawdź, gdzie przydadzą się Twoje umiejętności.',
    jobs: 'Znajdź zlecenie', talent: 'Znajdź wykonawcę', recent: 'Zlecenia i usługi. Zobacz, co nowego.', all: 'Przeglądaj wszystkie',
    empty: 'Masz pomysł na projekt? Opisz go i zaproś do współpracy.', add: 'Dodaj zlecenie', pending: 'Zobacz nową ofertę',
    hint: 'Nowe projekty i oferty wykonawców, w jednym miejscu', mobileHint: 'Przewija się automatycznie · możesz też przesunąć', pause: 'Zatrzymaj przewijanie', play: 'Wznów przewijanie',
  };
  function goTo(index, manual = false) {
    if (manual) setManualPause(true);
    const next = Math.max(0, Math.min(index, stops.length - 1));
    rail.current?.scrollTo({ left: stops[next], behavior: reduced ? 'instant' : 'smooth' });
  }
  function readPosition() {
    const node = rail.current;
    if (!node) return;
    const firstCopy = node.children[jobs.length];
    const cycle = firstCopy ? firstCopy.offsetLeft - node.firstElementChild.offsetLeft : 0;
    if (cycle > 0 && node.scrollLeft >= cycle) node.scrollLeft %= cycle;
    const next = nearestProjectStop(stops, node.scrollLeft);
    setPosition(next);
    const cards = Array.from(node.children).slice(0, jobs.length);
    const first = cards[0]?.offsetLeft || 0;
    const nearestCard = cards.reduce((best, card) => Math.abs(card.offsetLeft - first - node.scrollLeft) < Math.abs(best.offsetLeft - first - node.scrollLeft) ? card : best, cards[0]);
    activeId.current = nearestCard?.dataset.projectId;
  }
  useLayoutEffect(() => {
    const node = rail.current;
    if (!node) return;
    const measure = () => {
      const next = projectScrollStops(Array.from(node.children).slice(0, jobs.length).map(child => child.offsetLeft), node.children[Math.max(0, jobs.length - 1)].offsetLeft - node.firstElementChild.offsetLeft);
      setStops(next);
      setPosition(nearestProjectStop(next, node.scrollLeft));
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(node);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, [signature]);
  useLayoutEffect(() => {
    const node = rail.current;
    if (!node || !jobs.length) return;
    const current = Array.from(node.children).find(child => child.dataset.projectId === activeId.current) || node.firstElementChild;
    node.scrollTo({ left: current.offsetLeft - node.firstElementChild.offsetLeft, behavior: 'instant' });
    activeId.current = current.dataset.projectId;
    const incoming = jobs.filter(job => !known.current.has(homeFeedKey(job)));
    const fresh = incoming.find(job => new Date(job.created_at).getTime() >= openedAt.current);
    if (initialized.current && fresh) setPending(homeFeedKey(fresh));
    else if (!initialized.current) initialized.current = true;
    known.current = new Set(jobs.map(homeFeedKey));
    setPending(id => jobs.some(job => homeFeedKey(job) === id) ? id : null);
  }, [signature]);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => setVisible(!!entries[0]?.isIntersecting), { threshold: .15 });
    if (rail.current || host.current) observer?.observe(rail.current || host.current);
    if (!observer) setVisible(true);
    return () => { document.removeEventListener('visibilitychange', update); observer?.disconnect(); };
  }, [Boolean(jobs.length)]);
  useEffect(() => {
    const node = rail.current;
    if (stopped || jobs.length < 2 || !node) return;
    let frame = 0, previous = 0, offset = node.scrollLeft;
    const tick = now => {
      const firstCopy = node.children[jobs.length];
      const cycle = firstCopy ? firstCopy.offsetLeft - node.firstElementChild.offsetLeft : 0;
      if (cycle > 0) {
        if (previous) offset = (offset + Math.min(now - previous, 64) * .026) % cycle;
        node.scrollLeft = offset;
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stopped, signature]);
  function showPending() {
    const node = rail.current;
    const card = Array.from(node?.children || []).find(child => child.dataset.projectId === pending);
    if (card) { setManualPause(true); node.scrollTo({ left: card.offsetLeft - node.firstElementChild.offsetLeft, behavior: reduced ? 'instant' : 'smooth' }); }
    setPending(null);
  }
  return <div ref={host} className="ih53-jobs-finale ih88-market ih91-market" data-no-translate="true" data-paused={stopped} data-motion-paused={motionPaused}>
    <div className="ih88-layout">
      <div className="ih88-intro">
        <header className="ih88-heading">
          <p className="ih88-eyebrow">{copy.eyebrow.map(word => <span key={word}>{word}</span>)}</p>
          <h1 className="ih88-title"><span className="ih88-title-first">{copy.title[0]}</span><span className="ih88-title-last">{copy.title[1]}</span></h1>
        </header>
        <div className="ih88-hero-bottom"><p className="ih88-lead">{copy.intro}</p><nav className="ih88-actions" aria-label={en ? 'Start a collaboration' : 'Rozpocznij współpracę'}><EntryLink className="ih88-talent" to="/freelancers" label={copy.talent}/><EntryLink className="ih88-jobs" to="/jobs" label={copy.jobs}/></nav></div>
      </div>
      <section className="ih88-live" aria-labelledby="ih88-projects-title" onPointerEnter={event => { if (event.pointerType === 'mouse') setHover(true); }} onPointerLeave={() => setHover(false)} onFocusCapture={() => setFocus(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }}>
        <div className="ih88-live-heading"><div><h2 id="ih88-projects-title">{copy.recent}</h2><p>{copy.hint}</p></div><nav className="ih-feed-catalog-links" aria-label={en ? "Browse listings" : "Przeglądaj ogłoszenia"}><Link to="/jobs">{en ? "Projects" : "Zlecenia"}<Arrow /></Link><Link to="/services">{en ? "Services" : "Usługi"}<Arrow /></Link></nav></div>
        {jobs.length ? <>
          <div ref={rail} className="ih-showcase-rail" id="ih-home-project-rail" role="region" aria-roledescription={en ? 'carousel' : 'karuzela'} aria-label={copy.recent} tabIndex={0} data-single={jobs.length === 1} data-count={jobs.length} data-auto-moving={!stopped && jobs.length > 1} onScroll={readPosition} onPointerDown={() => setManualPause(true)} onWheel={() => setManualPause(true)} onKeyDown={event => {
            if (event.target !== event.currentTarget) return;
            if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); goTo(event.key === 'Home' ? 0 : event.key === 'End' ? stops.length - 1 : position + (event.key === 'ArrowRight' ? 1 : -1), true); }
          }}>{(jobs.length > 1 ? [0, 1] : [0]).flatMap(copy => jobs.map((job, index) => <div className="ih-showcase-slide" data-project-id={homeFeedKey(job)} data-copy={copy} key={`${copy}-${homeFeedKey(job)}`} role="group" aria-hidden={copy === 1 ? true : undefined} aria-roledescription={en ? 'slide' : 'slajd'} aria-label={copy === 0 ? `${index + 1} ${en ? 'of' : 'z'} ${jobs.length}` : undefined}>{renderProject(job, { duplicate: copy === 1 })}</div>))}</div>
          {stops.length > 1 && <div className="ih-showcase-controls"><span className="ih-showcase-swipe-hint">{motionPaused ? (en ? 'Swipe to explore projects and services' : 'Przesuń, aby zobaczyć zlecenia i usługi') : copy.mobileHint}</span><div className="ih-showcase-dots" role="group" aria-label={en ? 'Choose listing position' : 'Wybierz pozycję ofert'}>{stops.map((left, index) => <button key={index} type="button" aria-label={en ? `Show position ${index + 1} of ${stops.length}` : `Pokaż pozycję ${index + 1} z ${stops.length}`} aria-current={position === index ? 'true' : undefined} aria-controls="ih-home-project-rail" onClick={() => goTo(index, true)}><span /></button>)}</div><span className="ih-showcase-count">{String(position + 1).padStart(2, '0')}<span> / {String(stops.length).padStart(2, '0')}</span></span>{!reduced && <button className="ih-showcase-pause" type="button" disabled={paused} aria-label={motionPaused ? copy.play : copy.pause} onClick={() => setManualPause(value => !value)}>{motionPaused ? <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 8 6-8 6Z"/></svg> : <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4v12M13 4v12"/></svg>}</button>}</div>}
        </> : <div className="ih88-empty"><p>{copy.empty}</p><Link to="/find-talent">{copy.add}<Arrow /></Link></div>}
        <div className="ih88-project-status" aria-live="polite">{pending && <button type="button" onClick={showPending}>{copy.pending}<Arrow /></button>}</div>
      </section>
    </div>
  </div>;
}
