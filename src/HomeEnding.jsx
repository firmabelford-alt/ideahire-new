import { useId, useLayoutEffect, useRef } from "react";
import { BrandSignature } from "./Brand";
import "./HomeEnding.css";

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
      stage.style.setProperty("--finale-viewport-width", `${document.documentElement.clientWidth}px`);
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
        <h2>{en ? "Your next project" : "Twój następny projekt"}<span>{en ? "starts here." : "zaczyna się tutaj."}</span></h2>
      <svg className="ih-finale-ribbons" aria-hidden="true" viewBox="0 0 1200 460" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={scene + "-ribbon"} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--ribbon-soft)" />
            <stop offset=".52" stopColor="var(--v-action)" />
            <stop offset="1" stopColor="var(--v-field)" />
          </linearGradient>
          <linearGradient id={scene + "-echo"} x1="0" x2="1">
            <stop offset="0" stopColor="var(--v-field)" stopOpacity=".12" />
            <stop offset="1" stopColor="var(--v-action)" stopOpacity=".3" />
          </linearGradient>
        </defs>
        <path fill={"url(#" + scene + "-echo)"} d="M-80 258C180 450 380 84 660 233S1030 433 1280 188V250C1030 490 888 421 650 280S181 501-80 316Z" />
        <path fill={"url(#" + scene + "-ribbon)"} d="M-80 295C170 120 370 444 648 290S1025 160 1280 279V340C1010 205 896 220 664 343S165 205-80 361Z" />
        <path className="ih-finale-trace" d="M-80 284C170 109 370 433 648 279S1025 149 1280 268" />
      </svg>
        <BrandSignature className="ih-finale-brand" />
        <small className="ih-finale-credit">© 2026 IdeaHire</small>
      </div>
    </div>
  );
}

export default function HomeEnding({ en = false }) {
  const scene = "ih-cut-" + useId().replace(/[^a-z0-9_-]/gi, "");
  return (
    <section className="ih-home-finale" aria-label={en ? "IdeaHire and payments" : "IdeaHire i rozliczenia"} data-no-translate="true">
      <div className="ih-finale-payments">
        <img className="ih-finale-stripe" src="/brand/stripe-wordmark.svg"
          width="360" height="150" loading="lazy" decoding="async" alt="Stripe" />
      </div>
      <FooterReveal scene={scene} en={en} />
    </section>
  );
}
