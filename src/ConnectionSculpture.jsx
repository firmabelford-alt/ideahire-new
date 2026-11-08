import { useEffect, useRef } from "react";
import "./ConnectionSculpture.css";

const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - Math.pow(1 - clamp(value), 4);
const SHOT = 4.4;
const WIPE = .36;

function scenes(en) {
  return en ? [
    { label: "Portfolio", words: ["EXPLORE", "THE WORK."], detail: "See the professional’s portfolio and offer before you choose.", bg: "paper" },
    { label: "Agreements", words: ["AGREE", "THE TERMS."], detail: "Scope, deadline and price. Agree together before you start.", bg: "accent" },
    { label: "Collaboration", words: ["GET TO", "WORK."], detail: "Keep conversations, files and agreements alongside your project.", bg: "ink" },
  ] : [
    { label: "Portfolio", words: ["POZNAJ", "PRACE."], detail: "Zobacz portfolio i ofertę wykonawcy, zanim podejmiesz decyzję.", bg: "paper" },
    { label: "Ustalenia", words: ["USTAL", "WARUNKI."], detail: "Zakres, termin i cena. Ustalcie je wspólnie przed startem.", bg: "accent" },
    { label: "Współpraca", words: ["DZIAŁAJ", "RAZEM."], detail: "Rozmowy, pliki i ustalenia zachowajcie przy jednym projekcie.", bg: "ink" },
  ];
}

function trackedText(ctx, text, x, y, size, weight, color, tracking = 0) {
  ctx.font = weight + " " + size + "px Inter, Arial, sans-serif";
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  let offset = 0;
  for (const char of text) {
    ctx.fillText(char, x + offset, y);
    offset += ctx.measureText(char).width + tracking;
  }
}

function titleSize(ctx, words, width, height, maximum) {
  let size = maximum;
  while (size > 20) {
    ctx.font = "850 " + size + "px Inter, Arial, sans-serif";
    const longest = Math.max(...words.map(word => ctx.measureText(word).width - Math.max(0, word.length - 1) * size * .055));
    if (longest <= width && words.length * size * .94 <= height) break;
    size -= 1;
  }
  return size;
}

function paragraph(ctx, text, x, y, width, color, size) {
  ctx.font = "400 " + size + "px Inter, Arial, sans-serif";
  ctx.fillStyle = color;
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? line + " " + word : word;
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  for (let index = 0; index < lines.length; index++) ctx.fillText(lines[index], x, y + index * size * 1.6);
}

export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null), canvasRef = useRef(null);
  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) { host.dataset.failed = "true"; return; }
    const frames = scenes(en), reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, dpr = 1, elapsed = 0, previous = 0, raf = 0;
    let visible = false, destroyed = false, palette;

    function readPalette() {
      const style = getComputedStyle(host);
      palette = {
        paper: style.getPropertyValue("--promo-paper").trim(),
        ink: style.getPropertyValue("--promo-ink").trim(),
        accent: style.getPropertyValue("--promo-accent").trim(),
      };
    }
    function render() {
      if (!width || !height) return;
      const cycle = elapsed % (SHOT * frames.length), index = Math.floor(cycle / SHOT), local = cycle - index * SHOT;
      const shot = frames[index], next = frames[(index + 1) % frames.length];
      const bg = palette[shot.bg], ink = shot.bg === "ink" ? palette.paper : palette.ink;
      const mobile = width <= 700, pad = mobile ? 24 : Math.max(40, width * .045);
      const contentWidth = Math.min(width - pad * 2, 1100), x = (width - contentWidth) / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      trackedText(ctx, shot.label.toLocaleUpperCase(en ? "en" : "pl"), x, 37, 10, 600, ink, 1.2);
      ctx.font = "500 10px Inter, Arial, sans-serif";
      ctx.fillStyle = ink;
      const count = String(index + 1).padStart(2, "0") + " / 03";
      ctx.fillText(count, x + contentWidth - ctx.measureText(count).width, 37);

      const titleHeight = height - 209, font = titleSize(ctx, shot.words, contentWidth - 4, titleHeight, mobile ? 96 : 154);
      const lineHeight = font * .94, titleY = 82 + (titleHeight - lineHeight * shot.words.length) / 2;
      for (let line = 0; line < shot.words.length; line++) {
        const enter = ease((local - line * .07) / .48);
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 3, 66, contentWidth + 6, height - 174);
        ctx.clip();
        const shift = index === 1 ? (1 - enter) * (line ? -1 : 1) * contentWidth * .55 : 0;
        const rise = index === 1 ? 0 : (1 - enter) * font * .95;
        trackedText(ctx, shot.words[line], x + shift, titleY + (line + 1) * lineHeight + rise, font, 850, ink, -font * .055);
        ctx.restore();
      }
      paragraph(ctx, shot.detail, x, height - 91, Math.min(contentWidth, mobile ? 380 : 570), ink, mobile ? 14 : 15);
      ctx.globalAlpha = .48;
      trackedText(ctx, en ? "WORK. AGREEMENTS. COLLABORATION." : "PRACE. USTALENIA. WSPÓŁPRACA.", x, height - 28, 9, 500, ink, .6);
      ctx.globalAlpha = 1;

      // The same seven-strip cut as the homepage promo.
      if (local > SHOT - WIPE) {
        const progress = ease((local - SHOT + WIPE) / WIPE);
        ctx.fillStyle = palette[next.bg];
        for (let strip = 0; strip < 7; strip++) {
          const move = clamp(progress * 1.35 - strip * .045);
          ctx.fillRect(width * strip / 7, -height + height * 2 * move, width / 7 + 2, height);
        }
      }
      host.dataset.scene = String(index);
      host.dataset.ready = "true";
    }
    function tick(now) {
      raf = 0;
      if (!visible || document.hidden || reduced.matches || destroyed) { previous = 0; return; }
      if (previous) elapsed += Math.min((now - previous) / 1000, .08);
      previous = now;
      render();
      raf = requestAnimationFrame(tick);
    }
    function wake() {
      if (visible && !document.hidden && !reduced.matches && !raf && !destroyed) { previous = 0; raf = requestAnimationFrame(tick); }
    }
    function syncMotion() {
      host.dataset.static = String(reduced.matches);
      cancelAnimationFrame(raf); raf = 0; previous = 0;
      if (!reduced.matches) { render(); wake(); }
    }
    function resize() {
      const box = host.getBoundingClientRect();
      width = box.width; height = box.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      readPalette(); render(); wake();
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      host.dataset.running = String(visible && !reduced.matches && !document.hidden);
      if (!visible) { cancelAnimationFrame(raf); raf = 0; previous = 0; }
      else wake();
    }, { threshold: .1 });
    observer.observe(host);
    const sizing = new ResizeObserver(resize); sizing.observe(host);
    const theme = new MutationObserver(() => { readPalette(); render(); });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-template", "data-theme"] });
    reduced.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", wake);
    document.fonts.ready.then(() => { if (!destroyed) { readPalette(); render(); } });
    resize(); syncMotion();
    return () => {
      destroyed = true; cancelAnimationFrame(raf); observer.disconnect(); sizing.disconnect(); theme.disconnect();
      reduced.removeEventListener("change", syncMotion); document.removeEventListener("visibilitychange", wake);
    };
  }, [en]);

  const content = scenes(en);
  return <div ref={hostRef} className="ih-promo-cut" data-ready="false" data-no-translate="true">
    <canvas ref={canvasRef} className="ih-promo-cut-canvas" aria-hidden="true" />
    <div className="ih-promo-cut-content">
      <h2>{en ? "Explore the work. Agree on the terms. Work together." : "Poznaj prace. Ustal warunki. Działaj razem."}</h2>
      <dl>{content.map(shot => <div key={shot.label}><dt>{shot.label}</dt><dd>{shot.detail}</dd></div>)}</dl>
    </div>
  </div>;
}
