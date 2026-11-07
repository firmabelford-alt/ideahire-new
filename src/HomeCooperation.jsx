import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowIcon } from "./InterfaceIcons";
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
    {status === "ready" && reviews.length > 0 && <div className="ih-reviews-grid">
      {reviews.map(review => <article className="ih-real-review" key={review.id}>
        <div className="ih-review-stars" role="img" aria-label={en ? `${review.rating} out of 5 stars` : `${review.rating} z 5 gwiazdek`}>
          {Array.from({ length: 5 }, (_, index) => <span key={index} data-filled={index < Number(review.rating)} aria-hidden="true">★</span>)}
        </div>
        <blockquote>{review.review_text}</blockquote>
        <div className="ih-review-source"><span>{en ? "Client review" : "Opinia zleceniodawcy"}</span><time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString(en ? "en-GB" : "pl-PL", { day: "numeric", month: "short", year: "numeric" })}</time></div>
        <Link className="ih-review-profile" to={`/profile/${review.contractor_id}`}>{en ? "View professional" : "Zobacz wykonawcę"}<ArrowIcon direction="up-right" /></Link>
      </article>)}
    </div>}
  </section>;
}

const DROP_TILES = [
  [112, 82, -12, "pen"], [224, 65, 8, "code"], [294, 156, 12, "image"],
  [251, 260, -9, "video"], [140, 286, 8, "chart"], [70, 196, -12, "person"], [180, 174, -4, "cursor"],
];
const DROP_COLUMNS = [[0, 0, 1], [1, 0, 2], [0, 1, 1], [2, 0, 1], [1, 1, 3], [2, 1, 2]];
const TILE_ICONS = {
  pen: "M-14 12-9-7 8-17 18-7 7 10-14 12Zm5-19L7 10M-14 12-5 3",
  code: "m-10-12-12 12 12 12m20-24 12 12-12 12M5-18-5 18",
  image: "M-22-19h44v38h-44Z M-22 10-7-4 5 8l9-8 8 7M7-10h.1",
  video: "M-20-17h40v34h-40Z M-5-9l15 9-15 9Z",
  chart: "M-20 18h40M-13 10V-2M0 10v-27M13 10V-9",
  person: "M-17 18c0-19 34-19 34 0M0-4a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  cursor: "M-17-22 20 1 2 5l-8 17-11-44Z",
};

function ConnectionArtwork({ kind }) {
  const sceneRef = useRef(null);
  const lastPlay = useRef(0);
  const [active, setActive] = useState(false);
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return;
    const play = () => { lastPlay.current = Date.now(); setActive(true); };
    if (typeof IntersectionObserver !== "function") { play(); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { play(); observer.disconnect(); }
    }, { threshold: .6 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  function replay(event) {
    if (event.pointerType !== "mouse" || !active || Date.now() - lastPlay.current < 2000) return;
    lastPlay.current = Date.now();
    setCycle(value => value + 1);
  }
  return <div ref={sceneRef} className="ih-drop-art" data-kind={kind} data-play={active} aria-hidden="true" onPointerEnter={replay}>
    <svg viewBox="0 0 400 370" focusable="false">
      <ellipse className="ih-drop-shadow" cx="200" cy="302" rx="135" ry="29" />
      {kind === "people" ? <g key={cycle}>
        <path className="ih-drop-guide" d="M112 82 224 65 294 156 251 260 140 286 70 196Z M112 82 180 174 251 260M70 196 180 174 294 156M224 65 180 174 140 286" />
        {DROP_TILES.map(([x, y, turn, icon], index) => <g key={icon} transform={`translate(${x} ${y})`}>
          <g className="ih-drop-piece ih-drop-tile" data-tone={index % 3} style={{ "--drop-turn": `${turn}deg`, "--drop-delay": `${index * 90}ms` }}>
            <rect className="ih-tile-under" x="-39" y="-31" width="78" height="78" rx="20" />
            <rect className="ih-tile-face" x="-39" y="-39" width="78" height="78" rx="20" />
            <path className="ih-tile-icon" d={TILE_ICONS[icon]} />
          </g>
        </g>)}
      </g> : <g key={cycle}>
        <path className="ih-drop-guide" d="m46 269 152-88 156 89-152 88Z M96 240l156 89M146 211l156 89M96 298l152-88M146 327l152-88" />
        {DROP_COLUMNS.flatMap(([col, row, height], column) => Array.from({ length: height }, (_, level) => <g key={`${col}-${row}-${level}`} transform={`translate(${184 + (col - row) * 43} ${133 + (col + row) * 25 - level * 49})`}>
          <g className="ih-drop-piece ih-drop-cube" data-tone={(column + level) % 3} style={{ "--drop-turn": "0deg", "--drop-delay": `${(column + level * 2) * 90}ms` }}>
            <path className="ih-cube-left" d="M-43 0 0 25V74l-43-25Z" />
            <path className="ih-cube-right" d="M0 25 43 0v49L0 74Z" />
            <path className="ih-cube-top" d="M0-25 43 0 0 25-43 0Z" />
          </g>
        </g>))}
      </g>}
    </svg>
  </div>;
}

export function HomePaths({ en = false }) {
  return <section className="ih-cooperation ih-paths" id="for-users" aria-label={en ? "Start a collaboration" : "Rozpocznij współpracę"} data-no-translate="true">
    <div className="ih-action-squares">
      <Link className="ih-action-square" to="/find-talent">
        <span className="ih-square-index"><span aria-hidden="true">01</span>{en ? "For clients" : "Dla zlecających"}</span>
        <ConnectionArtwork kind="people" />
        <div className="ih-square-action"><h2>{en ? "Hire a professional" : "Zleć pracę"}</h2><span><ArrowIcon direction="up-right" /></span></div>
      </Link>
      <Link className="ih-action-square ih-action-square-build" to="/jobs">
        <span className="ih-square-index"><span aria-hidden="true">02</span>{en ? "For professionals" : "Dla wykonawców"}</span>
        <ConnectionArtwork kind="build" />
        <div className="ih-square-action"><h2>{en ? "Find a project" : "Znajdź zlecenie"}</h2><span><ArrowIcon direction="up-right" /></span></div>
      </Link>
    </div>
    <div className="ih-next-project" aria-labelledby="ih-next-project-title">
      <h2 id="ih-next-project-title">{en ? "Give your idea" : "Daj swojemu pomysłowi"}<span>{en ? "a next chapter." : "ciąg dalszy."}</span></h2>
      <Link to="/find-talent">{en ? "Start a project" : "Zacznij projekt"}<ArrowIcon /></Link>
    </div>
  </section>;
}
