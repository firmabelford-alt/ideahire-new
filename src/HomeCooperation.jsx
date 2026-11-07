import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";
import "./HomeCooperation.css";

export function HomeClarity({ en = false }) {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    // The existing public SELECT policy admits only visible reviews.
    // Select only columns already granted to anonymous visitors.
    supabase.from("ideahire_job_reviews")
      .select("id, contractor_id, rating, review_text, created_at")
      .order("created_at", { ascending: false }).limit(8)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setStatus("error"); return; }
        setReviews((data || []).filter(row => row.review_text?.trim() && Number.isInteger(Number(row.rating)) && Number(row.rating) >= 1 && Number(row.rating) <= 5));
        setStatus("ready");
      }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [attempt]);

  return <section className="ih-cooperation ih-real-reviews" aria-labelledby="ih-reviews-title" data-no-translate="true">
    <div className="ih-reviews-heading">
      <h2 id="ih-reviews-title">{en ? "Reviews after working together" : "Opinie po współpracy"}</h2>
      <span>{en ? "From completed projects" : "Z zakończonych zleceń"}</span>
    </div>
    {status === "loading" && <p className="ih-reviews-notice" role="status">{en ? "Loading reviews…" : "Ładowanie opinii…"}</p>}
    {status === "error" && <div className="ih-reviews-notice" role="status"><p>{en ? "Reviews are temporarily unavailable." : "Opinie są chwilowo niedostępne."}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>{en ? "Try again" : "Spróbuj ponownie"}</button></div>}
    {status === "ready" && !reviews.length && <p className="ih-reviews-notice">{en ? "The first reviews will appear after completed projects." : "Pierwsze opinie pojawią się po zakończonych współpracach."}</p>}
    {status === "ready" && reviews.length > 0 && <div className="ih-reviews-composition">
      <div className="ih-review-summary">
        <strong>{new Intl.NumberFormat(en ? "en-GB" : "pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(reviews.reduce((total, review) => total + Number(review.rating), 0) / reviews.length)}<small> / 5</small></strong>
        <span>{en ? `Average of the latest ${reviews.length} reviews` : `Średnia z ostatnich ${reviews.length} opinii`}</span>
      </div>
      <HomeReviewRail reviews={reviews} en={en} />
    </div>}
  </section>;
}

function HomeReviewRail({ reviews, en }) {
  const viewportRef = useRef(null);
  const groupRef = useRef(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    const group = groupRef.current;
    if (!viewport || !group || reviews.length < 2) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, last = 0, visible = true, held = false, manualUntil = 0, offset = viewport.scrollLeft;
    let loopWidth = group.getBoundingClientRect().width;
    const measure = () => { loopWidth = group.getBoundingClientRect().width; };
    const pause = () => { manualUntil = performance.now() + 6000; };
    const press = () => { held = true; pause(); };
    const release = () => { if (!held) return; held = false; manualUntil = performance.now() + 1600; };
    const move = () => { if (held) pause(); };
    const wheel = event => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) pause(); };
    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    resize?.observe(group);
    resize?.observe(viewport);
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); }, { threshold: .05 }) : null;
    observer?.observe(viewport);
    viewport.addEventListener("wheel", wheel, { passive: true });
    viewport.addEventListener("pointerdown", press, { passive: true });
    viewport.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    function tick(now) {
      const keyboardFocus = viewport.contains(document.activeElement) && document.activeElement.matches(":focus-visible");
      const playing = visible && !document.hidden && !motion.matches && !held && now > manualUntil && !keyboardFocus;
      if (playing && last && loopWidth > 0) {
        offset = (Math.max(0, offset) + Math.min(now - last, 64) * .028) % loopWidth;
        viewport.scrollLeft = offset;
      } else offset = viewport.scrollLeft;
      const state = playing ? "running" : "paused";
      if (viewport.dataset.autoplay !== state) viewport.dataset.autoplay = state;
      last = now;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); resize?.disconnect(); observer?.disconnect();
      viewport.removeEventListener("wheel", wheel); viewport.removeEventListener("pointerdown", press); viewport.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release); window.removeEventListener("blur", release);
      delete viewport.dataset.autoplay;
    };
  }, [reviews.length]);
  return <div ref={viewportRef} className="ih-reviews-viewport" tabIndex={0} data-single={reviews.length === 1} aria-label={en ? "Reviews scroll automatically. Focus here to pause; swipe to browse." : "Opinie przewijają się automatycznie. Ustaw fokus, aby zatrzymać; przesuń, aby przeglądać."}>
    <div className="ih-reviews-track">
      {(reviews.length > 1 ? [0, 1, 2] : [0]).map(copy => <div className="ih-reviews-group" key={copy} ref={copy === 0 ? groupRef : undefined} data-review-copy={copy} aria-hidden={copy ? true : undefined}>
        {reviews.map(review => <article className="ih-real-review" key={review.id}>
        <div className="ih-review-stars" role="img" aria-label={en ? `${review.rating} out of 5 stars` : `${review.rating} z 5 gwiazdek`}>
          {Array.from({ length: 5 }, (_, index) => <span key={index} data-filled={index < Number(review.rating)} aria-hidden="true">★</span>)}
        </div>
        <blockquote>{review.review_text}</blockquote>
        <div className="ih-review-source"><time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString(en ? "en-GB" : "pl-PL", { day: "numeric", month: "short", year: "numeric" })}</time><Link className="ih-review-profile" tabIndex={copy ? -1 : undefined} onMouseDown={copy ? event => event.preventDefault() : undefined} to={`/profile/${review.contractor_id}`}>{en ? "Professional’s profile" : "Profil wykonawcy"}</Link></div>
      </article>)}
      </div>)}
    </div>
  </div>;
}

/* The former organic-loop scene is preserved on the design/rumunia branch. */
function ConnectionArtwork() {
  const sceneRef = useRef(null);
  const clip = "ih-join-" + useId().replace(/[^a-z0-9_-]/gi, "");
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return;
    if (typeof IntersectionObserver !== "function") { setActive(true); return; }
    const observer = new IntersectionObserver(entries => setActive(entries.some(entry => entry.intersectionRatio >= .25)), { threshold: [0, .25] });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={sceneRef} className="ih-join-art" data-play={active} aria-hidden="true">
    <svg viewBox="0 0 420 300" focusable="false">
      <defs><clipPath id={clip}><path transform="translate(74 12) scale(4.3)" d="M8 8H22V20H8ZM42 8H50L56 14V56H42V42H22V56H8V28H42Z" /></clipPath></defs>
      <path className="ih-join-guide" d="M5 150H112M308 150H415" />
      <path className="ih-join-outline" transform="translate(74 12) scale(4.3)" d="M8 8H22V20H8ZM42 8H50L56 14V56H42V42H22V56H8V28H42Z" />
      <g clipPath={`url(#${clip})`}>
        {Array.from({ length: 23 }, (_, index) => <path key={index} className="ih-join-slat" d={`M50 ${48 + index * 9.4}H370`} style={{ "--join-shift": `${index % 2 ? 330 : -330}px`, "--join-delay": `${index * 22}ms` }} />)}
      </g>
      <circle className="ih-join-signal ih-join-signal-left" cx="15" cy="150" r="4" />
      <circle className="ih-join-signal ih-join-signal-right" cx="405" cy="150" r="4" />
    </svg>
  </div>;
}

export function HomePaths({ en = false }) {
  return <section className="ih-cooperation ih-paths" id="for-users" aria-label={en ? "Start a collaboration" : "Rozpocznij współpracę"} data-no-translate="true">
    <div className="ih-flow-scene">
      <Link className="ih-flow-choice" to="/find-talent"><small>{en ? "FOR CLIENTS" : "DLA ZLECAJĄCYCH"}</small><strong>{en ? "Hire a professional" : "Zleć pracę"}</strong></Link>
      <ConnectionArtwork />
      <Link className="ih-flow-choice" to="/jobs"><small>{en ? "FOR PROFESSIONALS" : "DLA WYKONAWCÓW"}</small><strong>{en ? "Find a project" : "Znajdź zlecenie"}</strong></Link>
    </div>
  </section>;
}
