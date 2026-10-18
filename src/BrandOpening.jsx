/* P61 — real readiness, followed by one full-viewport opening per document. */
import { useEffect, useState } from "react";

export function useBrandReady() {
  const [ready, setReady] = useState(() => !document.getElementById("ih-brand-boot"));
  useEffect(() => {
    const update = () => setReady(true);
    window.addEventListener("ih:brand-ready", update);
    if (!document.getElementById("ih-brand-boot")) update();
    return () => window.removeEventListener("ih:brand-ready", update);
  }, []);
  return ready;
}

export function startBrandOpening() {
  const boot = document.getElementById("ih-brand-boot");
  const root = document.getElementById("root");
  if (!boot || !root) return () => {};
  const html = document.documentElement;
  const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let cancelled = false, completed = false, prepared = false, opening = false, staged = false;
  let stable = 0, frame = 0, fontTimer = 0, finishTimer = 0;
  const timers = new Set();
  const timer = (callback, delay) => {
    const id = window.setTimeout(() => { timers.delete(id); callback(); }, delay);
    timers.add(id);
    return id;
  };
  window.clearTimeout(window.__ihBootWatchdog);
  root.setAttribute("inert", "");
  root.setAttribute("aria-busy", "true");
  root.setAttribute("aria-hidden", "true");
  html.setAttribute("data-ih-boot", "loading");
  boot.dataset.state = "loading";

  function stopWatching() {
    observer.disconnect();
    window.cancelAnimationFrame(frame);
    frame = 0;
  }
  function finish() {
    if (cancelled || completed) return;
    completed = true;
    stopWatching();
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
    boot.removeEventListener("animationend", onAnimationEnd);
    document.removeEventListener("keydown", containKeyboard, true);
    boot.remove();
    root.removeAttribute("inert");
    root.removeAttribute("aria-hidden");
    root.removeAttribute("aria-busy");
    html.removeAttribute("data-ih-boot");
    window.__ihBrandReady = true;
    window.dispatchEvent(new Event("ih:brand-ready"));
  }
  function onAnimationEnd(event) {
    if (opening && event.target.classList.contains("ih-boot-bottom") && event.animationName === "ih61-open-bottom") finish();
  }
  function reveal() {
    if (cancelled || completed || opening) return;
    opening = true;
    window.clearTimeout(fontTimer);
    stopWatching();
    boot.dataset.state = "opening";
    html.setAttribute("data-ih-boot", "opening");
    window.dispatchEvent(new Event("ih:brand-opening"));
    // animationend can be omitted by a background tab or browser preference.
    finishTimer = timer(finish, motion?.matches ? 140 : 1150);
  }
  function prepare() {
    if (prepared || cancelled || completed) return;
    prepared = true;
    // The logo is outlined. Waiting briefly here concerns the page text only.
    fontTimer = timer(stage, 600);
    if (document.fonts?.ready) Promise.resolve(document.fonts.ready).then(stage, stage);
    else stage();
  }
  function stage() {
    if (cancelled || completed || staged) return;
    staged = true;
    window.clearTimeout(fontTimer);
    // Let the mark complete its 560 ms entrance on a warm cache too.
    const elapsed = performance.now() - (window.__ihBootStarted ?? 0);
    const remaining = motion?.matches ? 0 : Math.max(0, 560 - elapsed);
    if (remaining) timer(reveal, remaining);
    else reveal();
  }
  function containKeyboard(event) {
    if (event.key !== "Tab" || completed || cancelled) return;
    const items = boot.dataset.state === "error"
      ? [...boot.querySelectorAll("button:not([hidden]):not([disabled])")]
      : [];
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!items.length) { boot.focus({ preventScroll: true }); return; }
    const current = items.indexOf(document.activeElement);
    const next = current < 0 ? event.shiftKey ? items.length - 1 : 0 : (current + (event.shiftKey ? -1 : 1) + items.length) % items.length;
    items[next].focus({ preventScroll: true });
  }
  function inspect() {
    frame = 0;
    if (cancelled || completed || prepared) return;
    const busy = root.querySelector("[data-route-loading='true']");
    const content = root.querySelector("main, .app, .page, form, [role='alert']");
    if (busy || !content) { stable = 0; return; }
    if (++stable >= 2) prepare();
    else frame = window.requestAnimationFrame(inspect);
  }
  function check() {
    if (!frame && !prepared && !cancelled && !completed) frame = window.requestAnimationFrame(inspect);
  }
  function continueLoading() {
    if (boot.dataset.state === "error") reveal();
  }
  const observer = new MutationObserver(check);
  observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-route-loading"] });
  boot.addEventListener("animationend", onAnimationEnd);
  boot.tabIndex = -1;
  document.addEventListener("keydown", containKeyboard, true);
  boot.querySelector("[data-boot-continue]")?.addEventListener("click", continueLoading);
  const slowTimer = timer(() => {
    if (opening || completed || cancelled) return;
    boot.dataset.state = "error";
    html.setAttribute("data-ih-boot", "error");
  }, 18000);
  check();
  return () => {
    cancelled = true;
    stopWatching();
    for (const id of timers) window.clearTimeout(id);
    timers.clear();
    window.clearTimeout(fontTimer);
    window.clearTimeout(finishTimer);
    window.clearTimeout(slowTimer);
    boot.removeEventListener("animationend", onAnimationEnd);
    document.removeEventListener("keydown", containKeyboard, true);
    boot.querySelector("[data-boot-continue]")?.removeEventListener("click", continueLoading);
  };
}

export default function BrandOpening() {
  useEffect(startBrandOpening, []);
  return null;
}
