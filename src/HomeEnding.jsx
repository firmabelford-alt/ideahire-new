import { useId, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { IDEA_HIRE_MARK } from "./Brand";
import { useSitePreferences } from "./Preferences";
import "./HomeEnding.css";

const SETTLEMENT_TERMS = "/regulamin#stripe-connect-i-uruchomienie-płatności";
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function FooterReveal({ scene, en }) {
  const stageRef = useRef(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !window.CSS?.supports("clip-path", "inset(0px)")) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = window.visualViewport;
    let frame = 0;

    function renderReveal() {
      frame = 0;
      if (reducedMotion.matches) {
        stage.removeAttribute("data-reveal");
        stage.removeAttribute("data-in-view");
        return;
      }
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const page = document.scrollingElement || document.documentElement;
      const viewportHeight = window.innerHeight;
      const remainingScroll = Math.max(0, page.scrollHeight - viewportHeight - page.scrollTop);
      // The artwork waits at its final screen position. Only the page edge moves.
      const bottomGap = clamp(viewportHeight - rect.bottom + remainingScroll, 0, Math.max(0, viewportHeight - rect.height));
      const top = viewportHeight - bottomGap - rect.height;
      stage.style.setProperty("--finale-top", `${top}px`);
      stage.style.setProperty("--finale-left", `${rect.left}px`);
      stage.style.setProperty("--finale-width", `${rect.width}px`);
      stage.style.setProperty("--finale-height", `${rect.height}px`);
      stage.style.setProperty("--reveal-top", `${clamp(rect.top - top, 0, rect.height)}px`);
      stage.style.setProperty("--reveal-bottom", `${clamp(top + rect.height - rect.bottom, 0, rect.height)}px`);
      stage.setAttribute("data-reveal", "fixed");
      stage.toggleAttribute("data-in-view", rect.top < viewportHeight && rect.bottom > 0);
    }
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(renderReveal);
    }
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    observer?.observe(stage);
    observer?.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    viewport?.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    renderReveal();
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
    };
  }, []);

  return (
    <div ref={stageRef} className="ih-finale-scene">
      <div className="ih-finale-layer">
        <h2>{en ? "Your idea. Working together." : "Twój pomysł. Wspólna praca."}</h2>
      <svg aria-hidden="true" viewBox="0 0 1100 344" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id={scene + "-upper"} x1="0" x2="1">
            <stop offset="0" stopColor="var(--cut-deep)" />
            <stop offset=".48" stopColor="var(--cut-bright)" />
            <stop offset="1" stopColor="var(--cut-mid)" />
          </linearGradient>
          <linearGradient id={scene + "-lower"} x1="1" x2="0">
            <stop offset="0" stopColor="var(--cut-deep)" />
            <stop offset=".58" stopColor="var(--cut-mid)" />
            <stop offset="1" stopColor="var(--cut-bright)" />
          </linearGradient>
          <mask id={scene + "-aperture"} maskUnits="userSpaceOnUse" x="0" y="0" width="1100" height="344">
            <rect width="1100" height="344" fill="white" />
            <g fill="black" transform="translate(463 100) scale(2.7)">
              <path d={IDEA_HIRE_MARK.dot} />
              <path d={IDEA_HIRE_MARK.join} />
            </g>
          </mask>
        </defs>
        <g className="ih-finale-guides" fill="none">
          <path d="M0 20H331l104 61h233L786 20h314M0 326h320l128-76h211l123 76h318" />
          <path d="M0 171h232l90 55h65m323-90h80l92-58h218M0 231h223l62-42h86m399-1h68l67-47h195" />
          <path d="M507 28v16m72-16v16M507 301v16m72-16v16M458 45h169m-169 255h169" />
          <path d="M328 20l4-4m448 310 4 4m-552-159 4-4m602 21 4 4" />
        </g>
        <g mask={"url(#" + scene + "-aperture)"}>
          <path className="ih-finale-band is-under" fill={"url(#" + scene + "-lower)"}
            d="M-85 247H285L410 165H694L818 227H1185V286H797L669 267H444L319 319H-85Z" />
          <path className="ih-finale-band is-over" fill={"url(#" + scene + "-upper)"}
            d="M-85 50H311L427 101H658L782 48H1185V106H808L676 176H408L284 111H-85Z" />
          <path className="ih-finale-band is-edge"
            d="M-85 114H284L405 179H679L812 111H1185v4H813L680 184H403l-121-65H-85Z" />
          <path className="ih-finale-signal" pathLength="1" fill="none"
            d="M-10 60H305l121 52h232L788 60h322M-10 297h323l126-70h232l130 48h309" />
        </g>
        <g className="ih-finale-corners" fill="none">
          <path d="M471 118v-17h18m126 0h18v17M471 237v17h18m126 0h18v-17" />
        </g>
      </svg>
        <small className="ih-finale-credit">© 2026 IdeaHire</small>
      </div>
    </div>
  );
}

export default function HomeEnding({ en = false }) {
  const { theme } = useSitePreferences();
  const scene = "ih-cut-" + useId().replace(/[^a-z0-9_-]/gi, "");
  const dark = theme === "dark";
  return (
    <section className="ih-home-finale" aria-label={en ? "IdeaHire and payments" : "IdeaHire i rozliczenia"} data-no-translate="true">
      <div className="ih-finale-payments">
        <Link to={SETTLEMENT_TERMS}>
          {en ? "Payment terms" : "Zasady płatności"}
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
        </Link>
        <img className="ih-finale-stripe" src={dark ? "/brand/stripe-wordmark-white.svg" : "/brand/stripe-wordmark.svg"}
          width="360" height={dark ? "151" : "150"} loading="lazy" decoding="async" alt="Stripe" />
      </div>
      <FooterReveal scene={scene} en={en} />
    </section>
  );
}
