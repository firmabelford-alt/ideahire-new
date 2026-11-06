import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { IDEA_HIRE_MARK } from "./Brand";
import { useSitePreferences } from "./Preferences";
import "./HomeEnding.css";

const SETTLEMENT_TERMS = "/regulamin#stripe-connect-i-uruchomienie-płatności";

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function ClosingCut({ scene }) {
  const stageRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !window.CSS?.supports("clip-path", "polygon(0 0, 100% 0, 100% 100%)")) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const viewport = window.visualViewport;
    let point = null;
    let frame = 0;

    function renderCut() {
      frame = 0;
      if (reducedMotion.matches) {
        stage.removeAttribute("data-curtained");
        return;
      }
      const rect = stage.getBoundingClientRect();
      if (!rect.height || !rect.width) return;
      const viewportHeight = viewport?.height || window.innerHeight;
      const visible = viewportHeight + (viewport?.offsetTop || 0) - rect.top;
      const progress = clamp(visible / Math.min(rect.height, viewportHeight * 0.78));
      const inside = point && point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
      const x = inside ? clamp((point.x - rect.left) / rect.width, 0.17, 0.83) : 0.5;
      const y = inside ? clamp((point.y - rect.top) / rect.height) : 0.5;
      // The seam follows the scroll. Pointer movement shapes only its local notch.
      const edge = (1 - progress) ** 2 * 100;
      const notch = Math.sin(progress * Math.PI) * (4 + 8 * y);
      stage.style.setProperty("--cut-edge-y", `${edge.toFixed(2)}%`);
      stage.style.setProperty("--cut-notch", `${notch.toFixed(2)}%`);
      stage.style.setProperty("--cut-focus-x", `${(x * 100).toFixed(2)}%`);
      stage.style.setProperty("--cut-focus-y", `${(y * 100).toFixed(2)}%`);
      stage.style.setProperty("--cut-rise", `${((1 - progress) * 18).toFixed(2)}px`);
      stage.toggleAttribute("data-curtained", progress < 1);
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(renderCut);
    }

    function track(event) {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      point = { x: event.clientX, y: event.clientY };
      schedule();
    }

    function resetPointer() {
      point = null;
      schedule();
    }

    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
    observer?.observe(stage);
    observer?.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    viewport?.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    stage.addEventListener("pointermove", track, { passive: true });
    stage.addEventListener("pointerleave", resetPointer);
    renderCut();
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      stage.removeEventListener("pointermove", track);
      stage.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  return (
    <div ref={stageRef} className="ih-finale-scene" aria-hidden="true">
      <svg viewBox="0 0 1100 344" preserveAspectRatio="xMidYMid slice" focusable="false">
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
    </div>
  );
}

export default function HomeEnding({ en = false }) {
  const { theme } = useSitePreferences();
  const paymentsTitle = useId();
  const scene = "ih-cut-" + useId().replace(/[^a-z0-9_-]/gi, "");

  const dark = theme === "dark";
  return (
    <section className="ih-home-finale"
      aria-label={en ? "IdeaHire and payments" : "IdeaHire i rozliczenia"} data-no-translate="true">
      <section className="ih-finale-payments" aria-labelledby={paymentsTitle}>
          <div>
            <h2 id={paymentsTitle}>{en ? "Payments and payouts" : "Płatności i wypłaty"}</h2>
            <Link to={SETTLEMENT_TERMS}>
              {en ? "Payment terms" : "Zasady płatności"}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
            </Link>
          </div>
          <img className="ih-finale-stripe" src={dark ? "/brand/stripe-wordmark-white.svg" : "/brand/stripe-wordmark.svg"}
            width="360" height={dark ? "151" : "150"} loading="lazy" decoding="async" alt="Stripe" />
      </section>
      <div className="ih-finale-story">
        <div>
          <span className="ih-finale-kicker">{en ? "The first step" : "Pierwszy krok"}</span>
          <h2>{en ? "You don’t need the whole plan." : "Nie musisz mieć całego planu."}{" "}
            <em>{en ? "You just need to start." : "Wystarczy zacząć."}</em>
          </h2>
        </div>
        <p>{en ? "Tell us what you want to make. Or show what you can do. That’s how working together begins."
          : "Opowiedz, co chcesz zrobić. Albo pokaż, co potrafisz. Od tego zaczyna się współpraca."}</p>
      </div>
      <ClosingCut scene={scene} />
      <small className="ih-finale-credit">© 2026 IdeaHire</small>
    </section>
  );
}
