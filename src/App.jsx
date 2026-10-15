/* IdeaHire | P38 | 2026-10-15 | Pełny plik: src/App.jsx | Przestrzeń zleceń + nawigacja kursora */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { CommissionStory, HomeStepCard, IdeaHireLogo, MarketIcon, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences } from "./Preferences";

const IH38_STYLES = String.raw`
#root#root#root .ih38-hero {
  --ih38-bg: #f1f4f8; --ih38-ink: #18283b; --ih38-muted: #526277;
  --ih38-accent: #285ed4; --ih38-accent-soft: #dce6f9; --ih38-on-accent: #fff;
  --ih38-line: #cbd4e1; --ih38-paper: #fbfcfe; --ih38-paper-back: #e2e7ef;
  --ih38-glass: rgba(251,253,255,.86); --ih38-shade: rgba(40,62,100,.16);
  --ih38-scene-scale: 1; --ih38-stage-scale: 1; --ih38-orbit-x: 0deg; --ih38-orbit-y: 0deg;
  position: relative !important; isolation: isolate !important; display: block !important;
  width: 100% !important; max-width: none !important; min-height: 660px !important;
  margin: 0 0 36px !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important;
  background: var(--ih38-bg) !important; color: var(--ih38-ink) !important; overflow: hidden !important;
  font-family: Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif !important;
  text-align: left !important; box-shadow: none !important;
}
#root#root#root .ih38-hero[data-dark="true"] {
  --ih38-bg: #0c1422; --ih38-ink: #edf2fa; --ih38-muted: #a2b2ca;
  --ih38-accent: #9dbcf8; --ih38-accent-soft: #223756; --ih38-on-accent: #101c31;
  --ih38-line: #35435a; --ih38-paper: #1b2a3e; --ih38-paper-back: #28374e;
  --ih38-glass: rgba(24,38,57,.92); --ih38-shade: rgba(0,3,10,.42);
}
#root#root#root .ih38-hero[data-classic="true"] {
  --ih38-bg: #f1f0ed; --ih38-ink: #242925; --ih38-muted: #63665e;
  --ih38-accent: #424a42; --ih38-accent-soft: #dddfd7; --ih38-line: #ccd0c6;
  --ih38-paper: #fbfbf7; --ih38-paper-back: #e2e3db; --ih38-glass: rgba(249,250,246,.91);
  --ih38-shade: rgba(36,43,31,.17); --ih38-on-accent: #fff;
}
#root#root#root .ih38-hero[data-classic="true"][data-dark="true"] {
  --ih38-bg: #161816; --ih38-ink: #f0f1eb; --ih38-muted: #b0b7ad;
  --ih38-accent: #d0d8c9; --ih38-accent-soft: #373f33; --ih38-line: #454e42;
  --ih38-paper: #262c24; --ih38-paper-back: #373e33; --ih38-glass: rgba(37,44,33,.94);
  --ih38-shade: rgba(0,0,0,.36); --ih38-on-accent: #20261d;
}
#root#root#root .ih38-hero, #root#root#root .ih38-hero * { box-sizing: border-box !important; }
#root#root#root .ih38-hero :is(h1,h2,p,button,a,strong,span,small) {
  font-family: inherit !important; -webkit-text-fill-color: currentColor !important;
}
#root#root#root .ih38-hero :is(h1,h2,p) { text-shadow: none !important; }
#root#root#root .ih38-hero svg { flex: 0 0 auto; }
#root#root#root .ih38-atmosphere { position: absolute; z-index: -2; inset: 0; overflow: hidden; pointer-events: none; }
#root#root#root .ih38-horizon {
  position: absolute; left: 35%; top: -4%; width: 75%; height: 100%;
  background: radial-gradient(ellipse at 62% 48%,color-mix(in srgb,var(--ih38-accent) 12%,transparent),transparent 64%);
  opacity: .9;
}
#root#root#root .ih38-light {
  position: absolute; top: -26%; left: 34%; width: 60%; height: 150%;
  transform: rotate(-26deg); transform-origin: 50% 50%;
  background: linear-gradient(90deg,transparent 15%,color-mix(in srgb,var(--ih38-accent) 5%,transparent) 47%,color-mix(in srgb,var(--ih38-accent) 12%,transparent) 52%,transparent 75%);
  filter: blur(25px); animation: ih38-light-travel 19s ease-in-out infinite alternate;
}
#root#root#root .ih38-grain {
  position: absolute; inset: 0; opacity: .035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Cpath fill='%23888888' filter='url(%23n)' d='M0 0h160v160H0z'/%3E%3C/svg%3E");
}
#root#root#root .ih38-field {
  position: absolute !important; inset: 0 !important; z-index: -1; display: block !important;
  width: 100% !important; height: 100% !important; margin: 0 !important; border: 0 !important;
  opacity: .73; pointer-events: none !important;
  mask-image: linear-gradient(90deg,rgba(0,0,0,.16),#000 58%);
}
#root#root#root .ih38-hero[data-gpu="false"] .ih38-field { visibility: hidden; }
#root#root#root .ih38-topline {
  position: absolute; z-index: 8; left: clamp(28px,5.6vw,100px); right: clamp(28px,4vw,72px); top: 26px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
#root#root#root .ih38-wordmark {
  display: inline-flex !important; align-items: center; gap: 9px; margin: 0 !important;
  font-size: 10px !important; font-weight: 700 !important; line-height: 1.4 !important; letter-spacing: .095em !important;
  color: var(--ih38-ink) !important;
}
#root#root#root .ih38-wordmark > i { display: block; width: 5px; height: 5px; border-radius: 50%; background: var(--ih38-accent); }
#root#root#root .ih38-wordmark > span { margin-left: 12px; color: var(--ih38-muted); font-weight: 500 !important; letter-spacing: .035em !important; }
#root#root#root .ih38-controls { display: flex; align-items: center; gap: 7px; }
#root#root#root .ih38-control {
  display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 7px;
  min-width: 40px !important; min-height: 40px !important; width: auto !important; height: 40px !important;
  padding: 0 11px !important; margin: 0 !important; background: var(--ih38-glass) !important;
  border: 1px solid var(--ih38-line) !important; border-radius: 99px !important;
  color: var(--ih38-ink) !important; font-size: 11px !important; font-weight: 550 !important; line-height: 1 !important;
  box-shadow: none !important; transform: none !important; cursor: pointer; backdrop-filter: blur(14px);
}
#root#root#root .ih38-control svg { width: 16px; height: 16px; }
#root#root#root .ih38-control:hover { border-color: var(--ih38-accent) !important; }
#root#root#root .ih38-control:disabled { opacity: .5 !important; cursor: default; }
#root#root#root .ih38-layout {
  position: relative; z-index: 2; display: grid !important; grid-template-columns: minmax(0,.46fr) minmax(0,.54fr);
  align-items: center !important; gap: 12px; min-height: 660px;
  padding: 96px clamp(28px,4vw,72px) 84px clamp(28px,5.6vw,100px) !important;
}
#root#root#root .ih38-copy { position: relative !important; z-index: 4; min-width: 0; padding: 0 !important; }
#root#root#root .ih38-eyebrow {
  display: block !important; margin: 0 0 20px !important; color: var(--ih38-muted) !important;
  font-size: 10px !important; font-weight: 650 !important; line-height: 1.6 !important; letter-spacing: .12em !important;
  text-transform: uppercase !important; max-width: 100%;
}
#root#root#root .ih38-title {
  display: block !important; width: auto !important; max-width: 100% !important;
  margin: 0 !important; padding: 0 !important; color: var(--ih38-ink) !important;
  font-size: clamp(51px,5.85vw,98px) !important; font-weight: 640 !important;
  line-height: 1.035 !important; letter-spacing: -.064em !important; text-wrap: initial !important;
  word-break: normal !important; overflow-wrap: normal !important;
}
#root#root#root .ih38-title > span { display: block !important; white-space: nowrap !important; color: var(--ih38-ink) !important; }
#root#root#root .ih38-title > span:last-child { color: var(--ih38-accent) !important; font-weight: 450 !important; }
#root#root#root .ih38-description {
  max-width: 325px !important; margin: 24px 0 0 !important; padding: 0 !important;
  color: var(--ih38-muted) !important; font-size: 15px !important; font-weight: 400 !important; line-height: 1.75 !important;
}
#root#root#root .ih38-actions { display: flex !important; align-items: stretch; gap: 10px; margin: 27px 0 0 !important; }
#root#root#root .ih38-cta {
  position: relative; display: inline-flex !important; align-items: center !important; justify-content: space-between !important;
  gap: 16px; min-height: 51px !important; min-width: 0 !important; width: auto !important;
  margin: 0 !important; padding: 13px 17px !important; border: 1px solid var(--ih38-line) !important;
  border-radius: 8px !important; background: var(--ih38-glass) !important; color: var(--ih38-ink) !important;
  font-size: 12px !important; font-weight: 650 !important; line-height: 1.4 !important; text-decoration: none !important;
  box-shadow: none !important; transform: none !important; transition: border-color .2s ease !important;
}
#root#root#root .ih38-cta:first-child { background: var(--ih38-accent) !important; border-color: var(--ih38-accent) !important; color: var(--ih38-on-accent) !important; }
#root#root#root .ih38-cta svg { width: 15px; height: 15px; transition: transform .2s ease; }
#root#root#root .ih38-cta:hover { border-color: var(--ih38-accent) !important; }
#root#root#root .ih38-cta:hover svg { transform: translate(2px,-2px); }
#root#root#root .ih38-chapters { display: flex; gap: 14px; margin-top: 34px; max-width: 100%; }
#root#root#root .ih38-chapter {
  position: relative; display: flex !important; align-items: center; gap: 7px; min-height: 44px !important;
  min-width: 0 !important; width: auto !important; padding: 0 1px 11px !important; margin: 0 !important;
  border: 0 !important; border-radius: 0 !important; background: none !important; color: var(--ih38-muted) !important;
  box-shadow: none !important; transform: none !important; font-size: 10px !important; line-height: 1.4 !important;
  font-weight: 600 !important; cursor: pointer;
}
#root#root#root .ih38-chapter-number { font-size: 9px !important; font-variant-numeric: tabular-nums; font-weight: 450 !important; opacity: .85; }
#root#root#root .ih38-chapter > i { position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--ih38-line); }
#root#root#root .ih38-chapter > i::after { content: ""; display: block; height: 100%; background: var(--ih38-accent); transform: scaleX(0); transform-origin: left; transition: transform .65s ease; }
#root#root#root .ih38-chapter[aria-pressed="true"] { color: var(--ih38-ink) !important; }
#root#root#root .ih38-chapter[aria-pressed="true"] > i::after { transform: scaleX(1); }
#root#root#root .ih38-stage {
  position: relative !important; align-self: center !important; width: 100% !important; height: 490px !important;
  min-width: 0 !important; margin: 0 !important; padding: 0 !important;
  touch-action: pan-y; cursor: grab; perspective: 1200px; outline: none;
}
#root#root#root .ih38-stage[data-dragging="true"] { cursor: grabbing; }
#root#root#root .ih38-stage-sizer {
  position: absolute; left: 50%; top: 50%; width: 650px; height: 510px;
  transform: translate(-50%,-50%) scale(var(--ih38-stage-scale)); transform-origin: center;
  perspective: 1200px;
}
#root#root#root .ih38-world {
  position: absolute; inset: 0; transform-style: preserve-3d;
  transform: rotateX(var(--ih38-orbit-x)) rotateY(var(--ih38-orbit-y));
}
#root#root#root .ih38-connections { position: absolute; inset: 0; width: 100%; height: 100%; fill: none; color: var(--ih38-accent); opacity: .43; transform: translateZ(-45px); pointer-events: none; }
#root#root#root .ih38-connections path { stroke: currentColor; stroke-width: .6; }
#root#root#root .ih38-connections circle { fill: currentColor; }
#root#root#root .ih38-connections path.ih38-stream { stroke-width: 1.4; stroke-dasharray: 14 320; animation: ih38-stream 8s linear infinite; opacity: .8; }
#root#root#root .ih38-ground-shadow { position: absolute; left: 150px; top: 344px; width: 407px; height: 136px; transform: rotate(-8deg) translateZ(-60px); border-radius: 50%; background: radial-gradient(ellipse,var(--ih38-shade),transparent 67%); filter: blur(14px); pointer-events: none; }
#root#root#root .ih38-plate { border: 1px solid var(--ih38-line) !important; background: var(--ih38-glass) !important; color: var(--ih38-ink) !important; box-shadow: 0 20px 50px var(--ih38-shade),inset 0 1px 0 rgba(255,255,255,.17) !important; }
#root#root#root .ih38-job-wrap {
  position: absolute; z-index: 5; left: 205px; top: 86px; width: 325px;
  transform: translateZ(56px) rotateY(-13deg) rotateX(5deg) rotateZ(-6deg);
  transform-style: preserve-3d; animation: ih38-document-arrive 1.65s cubic-bezier(.2,.72,.2,1) both;
}
#root#root#root .ih38-paper-edge { position: absolute; inset: 7px -5px -7px 5px; border: 1px solid var(--ih38-line); border-radius: 17px; background: var(--ih38-paper-back); transform: translateZ(-6px); opacity: .8; }
#root#root#root .ih38-paper-edge-two { inset: 13px -9px -13px 9px; transform: translateZ(-12px); opacity: .38; }
#root#root#root .ih38-document {
  position: relative !important; display: flex !important; flex-direction: column;
  width: 325px !important; height: 369px !important; min-height: 369px !important; margin: 0 !important; padding: 21px 23px 16px !important;
  border-radius: 17px !important; background: var(--ih38-paper) !important; overflow: hidden;
}
#root#root#root .ih38-document-top { display: flex; align-items: center; gap: 10px; padding-bottom: 17px; border-bottom: 1px solid var(--ih38-line); }
#root#root#root .ih38-file-icon { display: grid; place-items: center; width: 32px; height: 38px; border: 1px solid var(--ih38-line); border-radius: 6px; background: var(--ih38-accent-soft); color: var(--ih38-accent); }
#root#root#root .ih38-file-icon svg { width: 18px; height: 18px; }
#root#root#root .ih38-document-top > span:nth-child(2) { color: var(--ih38-ink) !important; font-size: 9px !important; font-weight: 650 !important; letter-spacing: .095em; }
#root#root#root .ih38-document-top small { display: block; margin-top: 5px; color: var(--ih38-muted); font-size: 9px !important; font-weight: 400 !important; letter-spacing: 0; }
#root#root#root .ih38-document-number { margin-left: auto; font-size: 11px !important; font-weight: 400 !important; color: var(--ih38-muted); font-variant-numeric: tabular-nums; }
#root#root#root .ih38-document-content { min-width: 0; flex: 1; animation: ih38-content-update .7s ease both; }
#root#root#root .ih38-category { display: block; margin: 17px 0 9px; height: 13px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 9px !important; font-weight: 600 !important; line-height: 1.4 !important; color: var(--ih38-accent); }
#root#root#root .ih38-document h2 {
  display: -webkit-box !important; -webkit-box-orient: vertical; -webkit-line-clamp: 2; height: 57px; overflow: hidden;
  margin: 0 !important; padding: 0 !important; max-width: 100% !important; color: var(--ih38-ink) !important;
  font-size: 24px !important; font-weight: 600 !important; line-height: 1.17 !important; letter-spacing: -.045em !important; overflow-wrap: anywhere !important;
}
#root#root#root .ih38-document-content > p { display: -webkit-box !important; -webkit-box-orient: vertical; -webkit-line-clamp: 2; height: 33px; overflow: hidden; color: var(--ih38-muted) !important; font-size: 10px !important; font-weight: 400 !important; line-height: 1.65 !important; margin: 12px 0 14px !important; padding: 0 !important; }
#root#root#root .ih38-brief-line { display: flex; gap: 5px; width: 100%; height: 3px; margin-bottom: 17px; }
#root#root#root .ih38-brief-line > i { flex: 1; border-radius: 2px; background: var(--ih38-line); }
#root#root#root .ih38-brief-line > i:first-child { background: var(--ih38-accent); }
#root#root#root .ih38-hero[data-phase="1"] .ih38-brief-line > i:nth-child(2),
#root#root#root .ih38-hero[data-phase="2"] .ih38-brief-line > i { background: var(--ih38-accent); }
#root#root#root .ih38-document-facts { display: grid; grid-template-columns: .8fr 1.2fr; gap: 14px; }
#root#root#root .ih38-document-facts span { display: block; margin-bottom: 7px; color: var(--ih38-muted); font-size: 9px !important; font-weight: 450 !important; }
#root#root#root .ih38-document-facts strong { display: block; font-size: 10px !important; font-weight: 650 !important; line-height: 1.5 !important; overflow-wrap: anywhere; }
#root#root#root .ih38-document-facts > div:first-child strong { font-size: 19px !important; letter-spacing: -.025em; font-weight: 550 !important; white-space: nowrap; }
#root#root#root .ih38-document-facts > div:last-child strong { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; height: 30px; overflow: hidden; }
#root#root#root .ih38-document-footer { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 20px; padding-top: 13px; border-top: 1px solid var(--ih38-line); }
#root#root#root .ih38-document-footer > span { display: flex; align-items: center; gap: 6px; font-size: 8px !important; color: var(--ih38-muted); font-weight: 500 !important; }
#root#root#root .ih38-document-footer > span i { display: block; width: 4px; height: 4px; background: var(--ih38-accent); border-radius: 50%; }
#root#root#root .ih38-document-footer svg { width: 13px; height: 13px; color: var(--ih38-accent); }
#root#root#root .ih38-card-sheen {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(112deg,transparent 26%,rgba(255,255,255,.09) 43%,rgba(255,255,255,.22) 47%,transparent 66%);
  background-size: 230% 100%; background-position: var(--ih38-light-x,53%) 0; mix-blend-mode: screen; opacity: .7;
}
#root#root#root .ih38-project {
  position: absolute; z-index: 2; left: 444px; top: 40px; width: 188px; padding: 9px !important;
  border-radius: 11px !important; transform: translateZ(-16px) rotateY(-16deg) rotateZ(7deg);
  animation: ih38-project-arrive 1.55s cubic-bezier(.18,.7,.2,1) .85s both;
}
#root#root#root .ih38-project-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 8px; }
#root#root#root .ih38-project-top > span { color: var(--ih38-muted); font-size: 6px !important; font-weight: 550 !important; letter-spacing: .06em; }
#root#root#root .ih38-project-top svg { width: 11px; height: 11px; color: var(--ih38-accent); }
#root#root#root .ih38-artwork { position: relative; height: 185px; padding: 13px; background: var(--ih38-accent-soft); border: 1px solid color-mix(in srgb,var(--ih38-accent) 18%,transparent); border-radius: 5px; overflow: hidden; }
#root#root#root .ih38-art-edition { position: relative; z-index: 2; font-size: 7px !important; color: var(--ih38-accent); font-weight: 650 !important; letter-spacing: .07em; }
#root#root#root .ih38-art-sculpture { position: absolute; width: 136px; height: 100px; left: 35px; top: 35px; transform: rotate(-24deg); }
#root#root#root .ih38-art-sculpture > i { position: absolute; width: 100px; height: 68px; border-radius: 50%; border: 10px solid var(--ih38-accent); box-shadow: inset 3px 2px 6px rgba(255,255,255,.24),4px 8px 8px var(--ih38-shade); transform: rotateX(25deg); }
#root#root#root .ih38-art-sculpture > i:nth-child(2) { left: 8px; top: 8px; }
#root#root#root .ih38-art-sculpture > i:nth-child(3) { left: 16px; top: 16px; }
#root#root#root .ih38-art-sculpture > i:nth-child(4) { left: 24px; top: 24px; }
#root#root#root .ih38-art-sculpture > i:nth-child(5) { left: 32px; top: 32px; }
#root#root#root .ih38-artwork > strong { position: absolute; left: 13px; bottom: 27px; max-width: 110px; color: var(--ih38-accent); font-size: 16px !important; line-height: 1 !important; font-weight: 550 !important; letter-spacing: -.04em; }
#root#root#root .ih38-art-footer { position: absolute; left: 13px; right: 13px; bottom: 9px; display: flex; gap: 10px; align-items: center; font-size: 6px !important; color: var(--ih38-accent); }
#root#root#root .ih38-art-footer > i { flex: 1; height: 1px; background: currentColor; opacity: .35; }
#root#root#root .ih38-swatches { display: flex; align-items: center; gap: 4px; margin-top: 8px; }
#root#root#root .ih38-swatches > i { width: 12px; height: 12px; border-radius: 50%; border: 1px solid var(--ih38-line); background: var(--ih38-accent); }
#root#root#root .ih38-swatches > i:nth-child(2) { background: var(--ih38-ink); }
#root#root#root .ih38-swatches > i:nth-child(3) { background: var(--ih38-accent-soft); }
#root#root#root .ih38-swatches > i:nth-child(4) { background: var(--ih38-paper); }
#root#root#root .ih38-swatches > span { margin-left: auto; font-size: 5px !important; font-weight: 500 !important; letter-spacing: .04em; color: var(--ih38-muted); }
#root#root#root .ih38-small-job {
  position: absolute; z-index: 3; left: 28px; top: 302px; width: 209px;
  display: flex; align-items: flex-start; gap: 10px; padding: 14px !important; border-radius: 12px !important;
  transform: translateZ(3px) rotateY(15deg) rotateZ(-10deg);
  animation: ih38-small-arrive 1.4s cubic-bezier(.2,.7,.2,1) 1.1s both;
}
#root#root#root .ih38-small-job-icon { display: grid; place-items: center; flex: 0 0 27px; height: 30px; border-radius: 5px; border: 1px solid var(--ih38-line); color: var(--ih38-accent); background: var(--ih38-accent-soft); }
#root#root#root .ih38-small-job-icon svg { width: 15px; height: 15px; }
#root#root#root .ih38-small-job > div { min-width: 0; animation: ih38-content-update .7s ease both; }
#root#root#root .ih38-small-job > div > span { display: block; margin-bottom: 6px; color: var(--ih38-muted); font-size: 7px !important; line-height: 1.4 !important; font-weight: 500 !important; }
#root#root#root .ih38-small-job strong { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; font-size: 12px !important; line-height: 1.2 !important; font-weight: 550 !important; letter-spacing: -.02em; }
#root#root#root .ih38-small-job small { display: block; margin-top: 9px; color: var(--ih38-muted); font-size: 7px !important; line-height: 1.4 !important; font-weight: 450 !important; }
#root#root#root .ih38-talent {
  position: absolute; z-index: 4; left: 380px; top: 445px; width: 244px;
  display: flex; align-items: center; gap: 12px; padding: 16px !important; border-radius: 12px !important;
  transform: translateZ(24px) rotateY(-12deg) rotateZ(4deg);
  animation: ih38-talent-arrive 1.3s cubic-bezier(.2,.7,.2,1) 2.3s both;
}
#root#root#root .ih38-talent-symbol { display: grid; place-items: center; flex: 0 0 32px; height: 36px; border-radius: 8px; border: 1px solid var(--ih38-line); background: var(--ih38-accent-soft); color: var(--ih38-accent); }
#root#root#root .ih38-talent-symbol svg { width: 18px; height: 18px; }
#root#root#root .ih38-talent > div:nth-child(2) { min-width: 0; }
#root#root#root .ih38-talent > div > span { display: block; color: var(--ih38-ink); font-size: 10px !important; font-weight: 600 !important; line-height: 1.4 !important; }
#root#root#root .ih38-talent strong { display: block; margin-top: 5px; color: var(--ih38-muted); font-size: 7px !important; font-weight: 450 !important; line-height: 1.4 !important; }
#root#root#root .ih38-talent-indicator { display: block; margin-left: auto; flex: 0 0 5px; height: 5px; background: var(--ih38-accent); border-radius: 50%; }
#root#root#root .ih38-scene-label { position: absolute; z-index: 1; top: 18px; left: 145px; display: flex; align-items: center; gap: 10px; color: var(--ih38-muted); transform: translateZ(-28px); opacity: .7; }
#root#root#root .ih38-scene-label span { font-size: 7px !important; font-weight: 500 !important; letter-spacing: .045em; }
#root#root#root .ih38-scene-label > i { width: 30px; height: 1px; background: currentColor; }
#root#root#root .ih38-foot {
  position: absolute; z-index: 5; left: clamp(28px,5.6vw,100px); right: clamp(28px,4vw,72px); bottom: 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 20px;
  min-height: 39px; padding-top: 15px; border-top: 1px solid var(--ih38-line); color: var(--ih38-muted);
}
#root#root#root .ih38-caption { display: flex; align-items: center; gap: 9px; min-width: 0; font-size: 9px !important; font-weight: 450 !important; line-height: 1.5 !important; }
#root#root#root .ih38-caption svg { width: 14px; height: 14px; }
#root#root#root .ih38-feed { display: flex; align-items: center; gap: 9px; min-width: 0; max-width: 45%; min-height: 28px; color: var(--ih38-ink) !important; font-size: 9px !important; line-height: 1.5 !important; font-weight: 500 !important; text-decoration: none !important; }
#root#root#root .ih38-feed > span { flex: 0 0 auto; }
#root#root#root .ih38-feed > strong { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--ih38-muted); font-size: 9px !important; font-weight: 450 !important; animation: ih38-content-update .7s ease both; }
#root#root#root .ih38-feed > svg { width: 13px; height: 13px; }
#root#root#root .ih38-feed-dot { display: block; width: 4px; height: 4px; border-radius: 50%; background: var(--ih38-accent); }
#root#root#root .ih38-sr { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip-path: inset(50%) !important; white-space: nowrap !important; }
#root#root#root .ih38-hero :is(.ih38-cta,.ih38-control,.ih38-chapter,.ih38-feed,.ih38-stage):focus-visible { outline: 2px solid var(--ih38-accent) !important; outline-offset: 5px !important; }
#root#root#root .ih38-hero[data-paused="true"] *, #root#root#root .ih38-hero[data-paused="true"] *::before, #root#root#root .ih38-hero[data-paused="true"] *::after { animation-play-state: paused !important; }
#root#root#root .ih38-hero[data-ready="true"] :is(.ih38-job-wrap,.ih38-project,.ih38-small-job,.ih38-talent) { animation: none; }
#root#root#root .ih38-hero[data-phase="0"] .ih38-project { opacity: .68; }
#root#root#root .ih38-hero[data-phase="0"] .ih38-talent { opacity: .65; }
#root#root#root .ih38-hero[data-phase="2"] .ih38-project { opacity: 1; }
@keyframes ih38-light-travel { from { transform: translateX(-12%) rotate(-26deg); opacity: .45; } to { transform: translateX(14%) rotate(-22deg); opacity: 1; } }
@keyframes ih38-stream { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -668; } }
@keyframes ih38-document-arrive { from { opacity: 0; transform: translate3d(14px,40px,-100px) rotateY(-30deg) rotateX(13deg) rotateZ(-10deg); } to { opacity: 1; transform: translateZ(56px) rotateY(-13deg) rotateX(5deg) rotateZ(-6deg); } }
@keyframes ih38-project-arrive { from { opacity: 0; transform: translate3d(30px,-15px,-85px) rotateY(-35deg) rotateZ(14deg); } to { opacity: 1; transform: translateZ(-16px) rotateY(-16deg) rotateZ(7deg); } }
@keyframes ih38-small-arrive { from { opacity: 0; transform: translate3d(-30px,30px,-70px) rotateY(25deg) rotateZ(-17deg); } to { opacity: 1; transform: translateZ(3px) rotateY(15deg) rotateZ(-10deg); } }
@keyframes ih38-talent-arrive { from { opacity: 0; transform: translate3d(25px,22px,-65px) rotateY(-20deg) rotateZ(10deg); } to { opacity: 1; transform: translateZ(24px) rotateY(-12deg) rotateZ(4deg); } }
@keyframes ih38-content-update { from { opacity: .35; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@media (min-width: 1680px) { #root#root#root .ih38-layout { min-height: 720px; } #root#root#root .ih38-stage { height: 525px !important; } }
@media (min-width: 821px) and (max-width: 1080px) {
  #root#root#root .ih38-layout { padding-left: 34px !important; padding-right: 26px !important; grid-template-columns: minmax(0,.46fr) minmax(0,.54fr); gap: 0; min-height: 620px; }
  #root#root#root .ih38-hero { min-height: 620px !important; }
  #root#root#root .ih38-title { font-size: clamp(45px,5.75vw,63px) !important; }
  #root#root#root .ih38-description { max-width: 285px !important; font-size: 14px !important; }
  #root#root#root .ih38-actions { gap: 8px; }
  #root#root#root .ih38-cta { padding: 12px !important; gap: 8px; font-size: 11px !important; }
  #root#root#root .ih38-chapters { gap: 10px; }
  #root#root#root .ih38-stage { height: 410px !important; }
  #root#root#root .ih38-wordmark > span { display: none; }
}
@media (max-width: 820px) {
  #root#root#root .ih38-hero { min-height: 0 !important; margin-bottom: 28px !important; }
  #root#root#root .ih38-layout { display: flex !important; flex-direction: column; align-items: stretch !important; gap: 15px; min-height: 0; padding: 90px 24px 104px !important; }
  #root#root#root .ih38-topline { left: 24px; right: 24px; top: 20px; gap: 9px; }
  #root#root#root .ih38-wordmark { font-size: 9px !important; }
  #root#root#root .ih38-wordmark > span { display: none; }
  #root#root#root .ih38-control { min-height: 40px !important; min-width: 40px !important; padding: 0 9px !important; font-size: 10px !important; }
  #root#root#root .ih38-eyebrow { font-size: 9px !important; margin-bottom: 16px !important; letter-spacing: .09em !important; }
  #root#root#root .ih38-title { font-size: clamp(48px,8.7vw,75px) !important; letter-spacing: -.058em !important; }
  #root#root#root .ih38-description { font-size: 14px !important; margin-top: 20px !important; max-width: 365px !important; }
  #root#root#root .ih38-actions { margin-top: 23px !important; }
  #root#root#root .ih38-cta { min-height: 49px !important; font-size: 12px !important; }
  #root#root#root .ih38-chapters { gap: 18px; margin-top: 20px; }
  #root#root#root .ih38-chapter { font-size: 10px !important; }
  #root#root#root .ih38-stage { height: min(calc((100vw - 48px)*1.1591),591.6px) !important; max-width: 540px; align-self: center !important; margin-top: 2px !important; }
  #root#root#root .ih38-stage-sizer { width: 440px; height: 510px; }
  #root#root#root .ih38-job-wrap { left: 69px; top: 61px; width: 296px; }
  #root#root#root .ih38-document { width: 296px !important; height: 354px !important; min-height: 354px !important; padding: 19px 21px 14px !important; }
  #root#root#root .ih38-document h2 { font-size: 23px !important; }
  #root#root#root .ih38-document-top { padding-bottom: 13px; }
  #root#root#root .ih38-document-content > p { margin: 10px 0 13px !important; }
  #root#root#root .ih38-document-facts > div:first-child strong { font-size: 18px !important; }
  #root#root#root .ih38-document-footer { margin-top: 16px; }
  #root#root#root .ih38-project { left: 291px; top: 15px; width: 139px; padding: 7px !important; }
  #root#root#root .ih38-project-top > span { font-size: 5px !important; }
  #root#root#root .ih38-artwork { height: 149px; padding: 9px; }
  #root#root#root .ih38-art-edition { font-size: 5px !important; }
  #root#root#root .ih38-art-sculpture { left: 20px; top: 23px; transform: scale(.76) rotate(-24deg); transform-origin: top left; }
  #root#root#root .ih38-artwork > strong { left: 9px; bottom: 26px; font-size: 13px !important; }
  #root#root#root .ih38-swatches > span { display: none; }
  #root#root#root .ih38-small-job { left: 9px; top: 411px; width: 187px; padding: 12px !important; }
  #root#root#root .ih38-talent { left: 224px; top: 424px; width: 207px; padding: 13px !important; gap: 9px; }
  #root#root#root .ih38-talent > div > span { font-size: 9px !important; }
  #root#root#root .ih38-talent-symbol { flex-basis: 28px; height: 32px; }
  #root#root#root .ih38-scene-label { top: 17px; left: 50px; }
  #root#root#root .ih38-scene-label span:last-child { display: none; }
  #root#root#root .ih38-ground-shadow { left: 20px; width: 410px; top: 318px; }
  #root#root#root .ih38-connections { opacity: .24; }
  #root#root#root .ih38-horizon { left: -15%; width: 150%; }
  #root#root#root .ih38-field { mask-image: linear-gradient(#0000 10%,#000 47%); opacity: .66; }
  #root#root#root .ih38-foot { left: 24px; right: 24px; bottom: 22px; flex-wrap: wrap; gap: 9px; padding-top: 13px; }
  #root#root#root .ih38-caption { width: 100%; font-size: 9px !important; }
  #root#root#root .ih38-feed { max-width: 100%; font-size: 10px !important; min-height: 30px; }
}
@media (max-width: 420px) {
  #root#root#root .ih38-layout { padding: 88px 20px 107px !important; gap: 18px; }
  #root#root#root .ih38-topline { left: 20px; right: 20px; }
  #root#root#root .ih38-title { font-size: clamp(43px,11.7vw,51px) !important; }
  #root#root#root .ih38-eyebrow { max-width: 245px; font-size: 8px !important; }
  #root#root#root .ih38-actions { flex-wrap: wrap; gap: 8px; }
  #root#root#root .ih38-cta { padding: 12px 13px !important; font-size: 11px !important; gap: 8px; flex: 1 1 140px; }
  #root#root#root .ih38-chapters { gap: 17px; }
  #root#root#root .ih38-chapter { font-size: 9px !important; }
  #root#root#root .ih38-stage { height: calc((100vw - 40px)*1.1591) !important; }
  #root#root#root .ih38-foot { left: 20px; right: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  #root#root#root .ih38-hero *, #root#root#root .ih38-hero *::before, #root#root#root .ih38-hero *::after { animation: none !important; transition: none !important; }
}
@media print {
  #root#root#root .ih38-hero { background: #fff !important; color: #111 !important; min-height: 0 !important; }
  #root#root#root .ih38-layout { display: block !important; min-height: 0 !important; padding: 32px !important; }
  #root#root#root .ih38-hero :is(.ih38-field,.ih38-stage,.ih38-controls,.ih38-foot,.ih38-chapters,.ih38-atmosphere) { display: none !important; }
  #root#root#root .ih38-title > span { color: #111 !important; }
}
`;

/* IdeaHire P38 — przestrzeń zleceń. Własne pole WebGL + ostre karty DOM. */
const IH38_DURATION = 4.8;
const IH38_SEEN = new Set();
const IH38_COPY = {
  pl: {
    region: "Od pomysłu do realizacji",
    eyebrow: "Twój pomysł zasługuje na ciąg dalszy.",
    title: "Masz pomysł.",
    subtitle: "Daj mu życie.",
    description: "Znajdź kogoś, kto go zrealizuje. Albo odkryj projekt dla siebie.",
    talent: "Znajdź wykonawcę",
    jobs: "Znajdź zlecenie",
    skip: "Pomiń wstęp",
    replay: "Odtwórz wstęp",
    pause: "Zatrzymaj animację",
    resume: "Wznów animację",
    reduced: "Animacja ograniczona",
    reset: "Przywróć kadr",
    stage: "Interaktywna przestrzeń zleceń",
    help: "Przesuń kursor, aby zmienić perspektywę. Przeciągnij scenę lub użyj strzałek klawiatury. Home przywraca kadr. Przewijanie telefonu pozostaje dostępne.",
    hint: "Przeciągnij, aby zmienić perspektywę",
    live: "Zlecenia z IdeaHire",
    demo: "Scena demonstracyjna",
    browse: "Odkryj zlecenia",
    phases: ["Pomysł", "Połączenie", "Realizacja"],
    phaseLabels: ["Zaczyna się od pomysłu.", "Właściwi ludzie. Wspólny kierunek.", "Pomysł nabiera kształtu."],
    brief: "BRIEF PROJEKTU",
    project: "Identyfikacja wizualna marki",
    category: "Grafika i design",
    categoryLabel: "Kategoria",
    summary: "Nowy znak, spójna typografia i materiały, które opowiedzą historię marki.",
    budget: "Budżet",
    scope: "Zakres",
    scopeText: "Logo / Typografia / Materiały",
    connection: "Połącz pomysł z talentem",
    skills: "Design · Strategia · Wykonanie",
    draft: "KIERUNEK KREATYWNY",
    deliverable: "PODGLĄD PROJEKTU",
    artwork: "Nadaj temu formę.",
    nextProject: "Strona dla nowej marki",
    nextCategory: "Strony i aplikacje",
    list: "Zobacz projekty",
    sceneSteps: "Wybierz etap animacji",
    briefPreview: "Przykład briefu",
    relatedProject: "Kolejne zlecenie",
    offer: "Od pierwszego szkicu do efektu.",
    craft: "Szczegóły robią różnicę.",
  },
  en: {
    region: "From idea to reality",
    eyebrow: "Your idea deserves a next chapter.",
    title: "Your idea.",
    subtitle: "Made real.",
    description: "Find someone who can bring it to life. Or discover a project of your own.",
    talent: "Find a freelancer",
    jobs: "Find a project",
    skip: "Skip intro",
    replay: "Replay intro",
    pause: "Pause animation",
    resume: "Resume animation",
    reduced: "Reduced animation",
    reset: "Reset the view",
    stage: "Interactive project space",
    help: "Move your pointer to change the perspective. Drag the scene or use the arrow keys. Home resets the view. Scrolling on your phone remains available.",
    hint: "Drag to change the perspective",
    live: "Projects on IdeaHire",
    demo: "Illustrative scene",
    browse: "Explore projects",
    phases: ["Idea", "Connection", "Reality"],
    phaseLabels: ["It starts with an idea.", "The right people. A shared direction.", "Your idea takes shape."],
    brief: "PROJECT BRIEF",
    project: "A visual identity for a brand",
    category: "Graphic design",
    categoryLabel: "Category",
    summary: "A new mark, considered typography and materials that tell the brand's story.",
    budget: "Budget",
    scope: "Scope",
    scopeText: "Logo / Typography / Materials",
    connection: "Connect your idea with talent",
    skills: "Design · Strategy · Craft",
    draft: "CREATIVE DIRECTION",
    deliverable: "PROJECT PREVIEW",
    artwork: "Give it form.",
    nextProject: "A website for a new brand",
    nextCategory: "Websites and apps",
    list: "Explore projects",
    sceneSteps: "Select an animation stage",
    briefPreview: "Illustrative brief",
    relatedProject: "Another project",
    offer: "From the first sketch to the result.",
    craft: "Details make the difference.",
  },
};

function ih38Reduced() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const IH38_VERTEX = [
  "attribute vec3 aPosition;",
  "uniform mat4 uCamera;",
  "uniform float uTime,uKind,uRatio,uReveal;",
  "uniform vec2 uPointer;",
  "varying float vDepth,vLight,vSide,vKind;",
  "float surface(vec2 p){",
  " float t=uTime*.24;",
  " float wave=.34*sin(p.x*.77+p.y*.32+t)+.19*cos(p.y*.91-p.x*.23-t*.74);",
  " wave+=.09*sin(p.x*1.68+p.y*.85-t*1.1);",
  " float d=length(p-uPointer);",
  " wave+=.24*cos(d*2.4-uTime*.58)*exp(-d*.57);",
  " return wave;",
  "}",
  "void main(){",
  " vec3 p=aPosition;",
  " if(uKind<1.5){p.y=-1.16+surface(p.xz);",
  "  float dx=(surface(p.xz+vec2(.025,0.0))-surface(p.xz-vec2(.025,0.0)))/.05;",
  "  float dz=(surface(p.xz+vec2(0.0,.025))-surface(p.xz-vec2(0.0,.025)))/.05;",
  "  vec3 n=normalize(vec3(-dx,1.0,-dz));",
  "  vLight=.24+.52*max(0.0,dot(n,normalize(vec3(-1.0,2.0,.4))));",
  "  vLight+=.42*pow(max(0.0,dot(n,normalize(vec3(1.0,1.0,-.5)))),20.0);",
  " }else{p.y+=.055*sin(uTime*.34+p.x);p.x+=.035*cos(uTime*.27+p.z);vLight=.4+.5*sin(aPosition.x*13.5)*sin(aPosition.z*8.1);}",
  " vec4 clip=uCamera*vec4(p,1.0);gl_Position=clip;",
  " vSide=clip.x/max(.1,clip.w);vDepth=exp(-max(0.0,clip.w-3.0)*.12);vKind=uKind;",
  " gl_PointSize=clamp((uKind>1.5?2.6:2.2)*uRatio/max(1.0,clip.w*.22),.85*uRatio,3.4*uRatio);",
  " vLight*=uReveal;",
  "}",
].join("\n");

const IH38_FRAGMENT = [
  "precision mediump float;",
  "uniform vec3 uAccent;uniform float uDark;",
  "varying float vDepth,vLight,vSide,vKind;",
  "void main(){",
  " float a=1.0;",
  " if(vKind>.5){float d=length(gl_PointCoord-vec2(.5));a=1.0-smoothstep(.08,.5,d);}",
  " float side=mix(.13,1.0,smoothstep(-.65,.25,vSide));",
  " a*=vDepth*vLight*side*mix(.34,.78,uDark);",
  " if(vKind<.5)a*=.26;if(vKind>1.5)a*=.35;",
  " vec3 c=mix(uAccent,mix(uAccent,vec3(.90,.95,1.0),.52),clamp(vLight-.3,0.0,.7)*uDark);",
  " gl_FragColor=vec4(c,a);",
  "}",
].join("\n");

const IH38_MATH = {
  unit(a) { const d = Math.hypot(...a) || 1; return a.map(v => v / d); },
  cross(a, b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; },
  multiply(a, b) {
    const out = new Float32Array(16);
    for (let c=0;c<4;c++) for (let r=0;r<4;r++) for (let k=0;k<4;k++) out[c*4+r]+=a[k*4+r]*b[c*4+k];
    return out;
  },
  camera(aspect, yaw, pitch) {
    const eye = [1.1+yaw*.045,3.25+pitch*.025,9.3], at = [0,-.48,-2.4];
    const z=this.unit(eye.map((v,i)=>v-at[i])),x=this.unit(this.cross([0,1,0],z)),y=this.cross(z,x);
    const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
      -x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]);
    const f=1/Math.tan(.67/2),near=.1,far=65;
    const projection=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
    return this.multiply(projection,view);
  },
};

function ih38Start(canvas, root, stage, state, report) {
  let gl, program, vertex, fragment, frame=0, last=0, visible=true, disposed=false;
  let dirtySize=true, resizeObserver, intersectionObserver, previousPhase=-1, previousReady=false;
  const buffers=[], listeners=[];
  const listen=(node,type,fn,options)=> {
    node.addEventListener(type,fn,options);
    listeners.push(()=>node.removeEventListener(type,fn,options));
  };
  const destroy=()=> {
    if(disposed)return;
    disposed=true;cancelAnimationFrame(frame);frame=0;
    resizeObserver?.disconnect();intersectionObserver?.disconnect();listeners.forEach(fn=>fn());
    if(gl&&!gl.isContextLost()){
      buffers.forEach(buffer=>gl.deleteBuffer(buffer));
      if(program)gl.deleteProgram(program);
      if(vertex)gl.deleteShader(vertex);
      if(fragment)gl.deleteShader(fragment);
    }
  };
  try {
    gl=canvas.getContext("webgl",{alpha:true,antialias:true,depth:false,stencil:false,premultipliedAlpha:false,powerPreference:"low-power"});
    if(!gl||gl.isContextLost())throw new Error("ih38_context");
    const shader=(type,source)=> {
      const item=gl.createShader(type);
      if(!item)throw new Error("ih38_shader");
      gl.shaderSource(item,source);gl.compileShader(item);
      if(!gl.getShaderParameter(item,gl.COMPILE_STATUS)){gl.deleteShader(item);throw new Error("ih38_shader");}
      return item;
    };
    vertex=shader(gl.VERTEX_SHADER,IH38_VERTEX);fragment=shader(gl.FRAGMENT_SHADER,IH38_FRAGMENT);
    program=gl.createProgram();
    if(!program)throw new Error("ih38_program");
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("ih38_program");
    gl.useProgram(program);
    const attribute=gl.getAttribLocation(program,"aPosition");
    if(attribute<0)throw new Error("ih38_position");
    const uniforms=Object.fromEntries(["uCamera","uTime","uKind","uRatio","uReveal","uPointer","uAccent","uDark"].map(name=>[name,gl.getUniformLocation(program,name)]));
    const point=(x,z,nx,nz)=>[-15+x*30/(nx-1),0,-21+z*28/(nz-1)];
    const compact=window.matchMedia("(max-width: 820px)").matches;
    const points=[],lines=[],dust=[];
    const nx=compact?96:146,nz=compact?64:94;
    for(let z=0;z<nz;z++)for(let x=0;x<nx;x++)points.push(...point(x,z,nx,nz));
    const lx=compact?54:86,lz=compact?36:56;
    for(let z=0;z<lz;z++)for(let x=0;x<lx;x++){
      if(x<lx-1)lines.push(...point(x,z,lx,lz),...point(x+1,z,lx,lz));
      if(z<lz-1)lines.push(...point(x,z,lx,lz),...point(x,z+1,lx,lz));
    }
    for(let i=0;i<(compact?70:130);i++){
      const noise=n=>{const p=Math.sin(n*12.9898+78.233)*43758.5453;return p-Math.floor(p);};
      dust.push((noise(i+1)-.5)*24,noise(i+20)*4.2-.6,-noise(i+60)*20);
    }
    const meshes=[lines,points,dust].map((data,kind)=>{
      const buffer=gl.createBuffer();
      if(!buffer)throw new Error("ih38_buffer");
      buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
      return {buffer,kind,count:data.length/3,mode:kind===0?gl.LINES:gl.POINTS};
    });
    let ratio=1;
    const resize=()=> {
      const box=root.getBoundingClientRect();
      if(!box.width||!box.height)return;
      const cap=box.width<=820?1.35:1.65;
      ratio=Math.min(window.devicePixelRatio||1,cap);
      const pixels=box.width*box.height*ratio*ratio;
      if(pixels>1800000)ratio*=Math.sqrt(1800000/pixels);
      const width=Math.max(1,Math.round(box.width*ratio)),height=Math.max(1,Math.round(box.height*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);
      const stageWidth=stage.getBoundingClientRect().width;
      const base=window.matchMedia("(max-width: 820px)").matches?440:650;
      root.style.setProperty("--ih38-stage-scale",String(Math.min(1.16,Math.max(.2,stageWidth/base))));
      dirtySize=false;
    };
    const render=now=> {
      frame=0;if(disposed||!visible||document.hidden)return;
      try {
        if(gl.isContextLost()){destroy();report({failed:true,ready:true,phase:2});return;}
        const elapsed=last?Math.min(.06,(now-last)/1000):1/60;last=now;
        const s=state.current;
        if(!s.paused&&!s.reduced){
          s.time+=elapsed;
          if(!s.ready){s.intro=Math.min(IH38_DURATION,s.intro+elapsed);if(s.intro>=IH38_DURATION)s.ready=true;}
        }
        if(s.reduced){s.ready=true;s.intro=IH38_DURATION;}
        const phase=s.ready?s.phase:Math.min(2,Math.floor(s.intro/(IH38_DURATION/3)));
        if(phase!==previousPhase||s.ready!==previousReady){
          previousPhase=phase;previousReady=s.ready;
          report({phase,ready:s.ready});
        }
        const smooth=1-Math.exp(-elapsed*7.5);
        if(s.reduced){s.yaw=s.targetYaw;s.pitch=s.targetPitch;}
        s.yaw+=(s.targetYaw-s.yaw)*smooth;s.pitch+=(s.targetPitch-s.pitch)*smooth;
        const settled=Math.abs(s.targetYaw-s.yaw)+Math.abs(s.targetPitch-s.pitch)<.025;
        if(settled){s.yaw=s.targetYaw;s.pitch=s.targetPitch;}
        const ambient=s.paused||s.reduced?0:Math.sin(s.time*.22)*.85;
        root.style.setProperty("--ih38-orbit-x",(s.pitch*.72)+"deg");
        root.style.setProperty("--ih38-orbit-y",(s.yaw*.8+ambient)+"deg");
        root.style.setProperty("--ih38-light-x",(53+s.yaw*1.2)+"%");
        if(dirtySize)resize();
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(program);gl.enableVertexAttribArray(attribute);
        gl.uniformMatrix4fv(uniforms.uCamera,false,IH38_MATH.camera(canvas.width/canvas.height,s.yaw,s.pitch));
        gl.uniform1f(uniforms.uTime,s.time);gl.uniform1f(uniforms.uRatio,ratio);
        gl.uniform1f(uniforms.uReveal,s.ready?1:.38+.62*Math.min(1,s.intro/1.4));
        gl.uniform2f(uniforms.uPointer,s.pointer[0],s.pointer[1]);
        gl.uniform1f(uniforms.uDark,s.dark?1:0);
        const accent=s.classic?(s.dark?[.65,.69,.74]:[.31,.35,.41]):(s.dark?[.35,.58,.88]:[.18,.38,.68]);
        gl.uniform3fv(uniforms.uAccent,accent);
        for(const mesh of meshes){
          gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.vertexAttribPointer(attribute,3,gl.FLOAT,false,0,0);
          gl.uniform1f(uniforms.uKind,mesh.kind);gl.drawArrays(mesh.mode,0,mesh.count);
        }
        if(!s.paused&&!s.reduced||!settled)frame=requestAnimationFrame(render);
      } catch {
        destroy();report({failed:true,ready:true,phase:2});
      }
    };
    const wake=()=>{if(!disposed&&visible&&!document.hidden&&!frame){last=0;frame=requestAnimationFrame(render);}};
    listen(document,"visibilitychange",()=>{
      last=0;
      if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();
    });
    listen(window,"resize",()=>{dirtySize=true;wake();},{passive:true});
    listen(canvas,"webglcontextlost",event=>{event.preventDefault();destroy();report({failed:true,ready:true,phase:2});});
    if(typeof ResizeObserver!=="undefined"){
      resizeObserver=new ResizeObserver(()=>{dirtySize=true;wake();});resizeObserver.observe(root);resizeObserver.observe(stage);
    }
    if(typeof IntersectionObserver!=="undefined"){
      intersectionObserver=new IntersectionObserver(entries=>{
        visible=!!entries[0]?.isIntersecting;
        if(visible){last=0;wake();}else{cancelAnimationFrame(frame);frame=0;last=0;}
      },{rootMargin:"100px"});
      intersectionObserver.observe(root);
    }
    resize();report({gpu:true});wake();
    return {wake,destroy};
  } catch {
    destroy();report({failed:true,ready:true,phase:2});
    return {wake(){},destroy};
  }
}

function IH38Icon({kind="arrow"}) {
  const paths={
    arrow:"M5 19 19 5M6 5h13v13",
    pause:"M9 6v12M15 6v12",
    play:"m8 5 11 7-11 7z",
    replay:"M4 9a8 8 0 1 1 0 6M4 4v5h5",
    move:"M4 12h16M12 4v16m-5-7-3 3 3 3m10-6 3 3-3 3",
    brief:"M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h4",
    check:"m5 12 4 4L19 6",
    link:"M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]||paths.arrow}/></svg>;
}

export function IdeaHireCinematicHero({job,jobs=[],userKey="guest"}) {
  const site=useSitePreferences();
  const [reduced,setReduced]=useState(ih38Reduced);
  const [ready,setReady]=useState(()=>IH38_SEEN.has(userKey)||ih38Reduced());
  const [phase,setPhase]=useState(()=>IH38_SEEN.has(userKey)||ih38Reduced()?2:0);
  const [paused,setPaused]=useState(false);
  const [gpu,setGpu]=useState(false);
  const [visible,setVisible]=useState(true);
  const rootRef=useRef(null),canvasRef=useRef(null),stageRef=useRef(null),engineRef=useRef(null);
  const dragRef=useRef(null),pointerTimerRef=useRef(0),userRef=useRef(userKey);
  const motion=useRef({
    intro:ready?IH38_DURATION:0,time:0,ready,phase:ready?2:0,paused:false,reduced,
    dark:site.theme==="dark",classic:site.template==="classic",
    yaw:0,pitch:0,targetYaw:0,targetPitch:0,pointer:[2,-2],
  });
  const text=IH38_COPY[site.language==="en"?"en":"pl"];
  const realJobs=jobs.filter(item=>item?.id&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id)));
  const isRealJob=!!job?.id&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(job.id));
  const mainJob=isRealJob?job:realJobs[0];
  const otherJob=realJobs.find(item=>item.id!==mainJob?.id);
  const title=mainJob?.title||text.project;
  const category=mainJob?.category||text.category;
  const summary=mainJob?.description||text.summary;
  const numericBudget=Number(mainJob?.budget);
  const budget=mainJob?(Number.isFinite(numericBudget)&&numericBudget>0?
    new Intl.NumberFormat(site.language==="en"?"en-GB":"pl-PL",{style:"currency",currency:"PLN",maximumFractionDigits:0}).format(numericBudget):"—"):
    new Intl.NumberFormat(site.language==="en"?"en-GB":"pl-PL",{style:"currency",currency:"PLN",maximumFractionDigits:0}).format(1800);

  useLayoutEffect(()=>{userRef.current=userKey;},[userKey]);
  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setReduced(media.matches);
    media.addEventListener?.("change",update);update();
    return()=>media.removeEventListener?.("change",update);
  },[]);
  useLayoutEffect(()=>{
    Object.assign(motion.current,{dark:site.theme==="dark",classic:site.template==="classic",paused,reduced});
    if(reduced){
      motion.current.ready=true;motion.current.intro=IH38_DURATION;motion.current.phase=2;
      setReady(true);setPhase(2);IH38_SEEN.add(userRef.current);
    }
    engineRef.current?.wake();
  },[site.theme,site.template,reduced,paused]);
  useEffect(()=>{
    const root=rootRef.current,stage=stageRef.current,canvas=canvasRef.current;
    if(!root||!stage||!canvas)return undefined;
    const engine=ih38Start(canvas,root,stage,motion,update=>{
      if(update.gpu)setGpu(true);
      if(update.failed)setGpu(false);
      if(update.phase!==undefined){setPhase(update.phase);motion.current.phase=update.phase;}
      if(update.ready){setReady(true);motion.current.ready=true;IH38_SEEN.add(userRef.current);}
    });
    engineRef.current=engine;
    return()=>{engine.destroy();engineRef.current=null;};
  },[]);
  useEffect(()=>{
    const root=rootRef.current,stage=stageRef.current;if(!root||!stage)return undefined;
    const resize=()=>{
      const mobile=window.matchMedia("(max-width: 820px)").matches;
      root.style.setProperty("--ih38-stage-scale",String(Math.min(1.16,Math.max(.2,stage.getBoundingClientRect().width/(mobile?440:650)))));
    };
    resize();window.addEventListener("resize",resize,{passive:true});
    const size=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
    size?.observe(stage);
    const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>setVisible(!!entries[0]?.isIntersecting),{rootMargin:"100px"}):null;
    observer?.observe(root);
    const visibility=()=>{if(document.hidden)setVisible(false);else setVisible(root.getBoundingClientRect().bottom>0&&root.getBoundingClientRect().top<window.innerHeight+100);};
    document.addEventListener("visibilitychange",visibility);
    return()=>{window.removeEventListener("resize",resize);document.removeEventListener("visibilitychange",visibility);size?.disconnect();observer?.disconnect();};
  },[]);
  useEffect(()=>()=>window.clearTimeout(pointerTimerRef.current),[]);
  function finish(nextPhase=2) {
    Object.assign(motion.current,{ready:true,intro:IH38_DURATION,phase:nextPhase});
    setReady(true);setPhase(nextPhase);IH38_SEEN.add(userRef.current);engineRef.current?.wake();
  }
  function replay() {
    if(reduced||!gpu){finish();return;}
    Object.assign(motion.current,{ready:false,intro:0,time:0,phase:0,targetYaw:0,targetPitch:0});
    setReady(false);setPhase(0);setPaused(false);engineRef.current?.wake();
  }
  function resetView() {
    Object.assign(motion.current,{targetYaw:0,targetPitch:0,pointer:[2,-2]});
    rootRef.current?.style.setProperty("--ih38-orbit-x","0deg");
    rootRef.current?.style.setProperty("--ih38-orbit-y","0deg");
    engineRef.current?.wake();
  }
  function updateView(yaw,pitch) {
    motion.current.targetYaw=Math.max(-12,Math.min(12,yaw));
    motion.current.targetPitch=Math.max(-8,Math.min(8,pitch));
    if(!gpu){
      rootRef.current?.style.setProperty("--ih38-orbit-y",motion.current.targetYaw*.8+"deg");
      rootRef.current?.style.setProperty("--ih38-orbit-x",motion.current.targetPitch*.72+"deg");
    }
    engineRef.current?.wake();
  }
  function pointerDown(event) {
    if(event.button!==0||event.target.closest("a,button")||reduced)return;
    dragRef.current={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:motion.current.targetYaw,pitch:motion.current.targetPitch};
    stageRef.current?.setAttribute("data-dragging","true");
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* Przewijanie może przejąć gest. */}
  }
  function pointerMove(event) {
    if(reduced||paused&&!dragRef.current)return;
    const rect=event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-rect.left)/Math.max(1,rect.width)-.5,y=(event.clientY-rect.top)/Math.max(1,rect.height)-.5;
    motion.current.pointer=[x*12+2,y*8-2];
    const drag=dragRef.current;
    if(drag&&drag.id===event.pointerId){
      updateView(drag.yaw+(event.clientX-drag.x)*.055,drag.pitch-(event.clientY-drag.y)*.034);
    }else if(event.pointerType==="mouse"){
      updateView(x*11,-y*7);
    }
    window.clearTimeout(pointerTimerRef.current);
    pointerTimerRef.current=window.setTimeout(()=>{if(!dragRef.current)resetView();},1200);
  }
  function pointerUp(event) {
    if(dragRef.current?.id!==event.pointerId)return;
    dragRef.current=null;stageRef.current?.removeAttribute("data-dragging");
    try{event.currentTarget.releasePointerCapture(event.pointerId);}catch{/* Gest mógł zostać anulowany. */}
  }
  function keys(event) {
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home"].includes(event.key))return;
    event.preventDefault();
    if(event.key==="Home"){resetView();return;}
    updateView(motion.current.targetYaw+(event.key==="ArrowLeft"?-2:event.key==="ArrowRight"?2:0),
      motion.current.targetPitch+(event.key==="ArrowUp"?2:event.key==="ArrowDown"?-2:0));
  }
  const stopped=paused||reduced||!visible;
  return (
    <section ref={rootRef} id="ih38-experience" className="ih38-hero"
      data-cinematic-version="P38-2026-10-15" data-no-translate="true"
      data-dark={site.theme==="dark"} data-classic={site.template==="classic"}
      data-ready={ready} data-phase={phase} data-gpu={gpu} data-paused={stopped}
      aria-label={text.region}>
      <style>{IH38_STYLES}</style>
      <div className="ih38-atmosphere" aria-hidden="true"><i className="ih38-horizon"/><i className="ih38-light"/><i className="ih38-grain"/></div>
      <canvas ref={canvasRef} className="ih38-field" aria-hidden="true"/>
      <div className="ih38-topline">
        <span className="ih38-wordmark"><i aria-hidden="true"/>IDEAHIRE<span>/ {text.region}</span></span>
        <div className="ih38-controls">
          <button type="button" className="ih38-control" onClick={ready?replay:()=>finish()}
            title={ready?text.replay:text.skip} aria-label={ready?text.replay:text.skip}>
            <IH38Icon kind={ready?"replay":"arrow"}/>{!ready&&<span>{text.skip}</span>}
          </button>
          <button type="button" className="ih38-control" onClick={resetView} title={text.reset} aria-label={text.reset}><IH38Icon kind="move"/></button>
          <button type="button" className="ih38-control" onClick={()=>setPaused(value=>!value)}
            title={reduced?text.reduced:paused?text.resume:text.pause}
            aria-label={reduced?text.reduced:paused?text.resume:text.pause}
            aria-pressed={paused||reduced} disabled={reduced}><IH38Icon kind={paused&&!reduced?"play":"pause"}/></button>
        </div>
      </div>
      <div className="ih38-layout">
        <div className="ih38-copy">
          <span className="ih38-eyebrow">{text.eyebrow}</span>
          <h1 className="ih38-title"><span>{text.title}</span><span>{text.subtitle}</span></h1>
          <p className="ih38-description">{text.description}</p>
          <div className="ih38-actions">
            <Link className="ih38-cta" to="/find-talent">{text.talent}<IH38Icon/></Link>
            <Link className="ih38-cta" to="/jobs">{text.jobs}<IH38Icon/></Link>
          </div>
          <div className="ih38-chapters" role="group" aria-label={text.sceneSteps}>
            {text.phases.map((label,index)=><button key={index} type="button" className="ih38-chapter"
              aria-pressed={phase===index} onClick={()=>finish(index)}>
              <span className="ih38-chapter-number">0{index+1}</span><span>{label}</span><i aria-hidden="true"/>
            </button>)}
          </div>
        </div>
        <div ref={stageRef} className="ih38-stage" role="group" tabIndex={0}
          aria-label={text.stage} aria-describedby="ih38-stage-help"
          onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
          onLostPointerCapture={()=>{dragRef.current=null;stageRef.current?.removeAttribute("data-dragging");}}
          onPointerLeave={()=>{if(!dragRef.current)resetView();}} onKeyDown={keys}>
          <div className="ih38-stage-sizer">
            <div className="ih38-world">
              <svg className="ih38-connections" viewBox="0 0 650 510" aria-hidden="true">
                <path d="M45 370C100 365 170 320 240 246S400 98 555 82"/>
                <path d="M176 392C295 455 375 474 508 468"/>
                <path className="ih38-stream" d="M45 370C100 365 170 320 240 246S400 98 555 82"/>
                <circle cx="45" cy="370" r="3"/><circle cx="555" cy="82" r="3"/><circle cx="508" cy="468" r="3"/>
              </svg>
              <div className="ih38-ground-shadow" aria-hidden="true"/>
              <div className="ih38-project ih38-plate" aria-label={text.deliverable}>
                <div className="ih38-project-top"><span>02 / {text.deliverable}</span><IH38Icon kind="check"/></div>
                <div className="ih38-artwork">
                  <span className="ih38-art-edition">FORMA / STUDIO</span>
                  <div className="ih38-art-sculpture" aria-hidden="true"><i/><i/><i/><i/><i/></div>
                  <strong>{text.artwork}</strong><span className="ih38-art-footer">Aa <i/> 01 — 26</span>
                </div>
                <div className="ih38-swatches" aria-hidden="true"><i/><i/><i/><i/><span>FORM / TYPE / DETAIL</span></div>
              </div>
              <div className="ih38-job-wrap">
                <div className="ih38-paper-edge" aria-hidden="true"/><div className="ih38-paper-edge ih38-paper-edge-two" aria-hidden="true"/>
                <article className="ih38-document ih38-plate">
                  <div className="ih38-document-top"><span className="ih38-file-icon"><IH38Icon kind="brief"/></span>
                    <span>{text.brief}<small>{mainJob?"IdeaHire":text.briefPreview}</small></span><span className="ih38-document-number">01</span>
                  </div>
                  <div className="ih38-document-content" key={String(mainJob?.id||"demo")+site.language}>
                    <span className="ih38-category">{category}</span>
                    <h2 title={String(title)}>{title}</h2>
                    <p title={String(summary)}>{summary}</p>
                    <div className="ih38-brief-line" aria-hidden="true"><i/><i/><i/></div>
                    <div className="ih38-document-facts">
                      <div><span>{text.budget}</span><strong>{budget}</strong></div>
                      <div><span>{mainJob?text.categoryLabel:text.scope}</span><strong>{mainJob?category:text.scopeText}</strong></div>
                    </div>
                  </div>
                  <div className="ih38-document-footer"><span><i aria-hidden="true"/>{mainJob?text.live:text.demo}</span><IH38Icon/></div>
                  <div className="ih38-card-sheen" aria-hidden="true"/>
                </article>
              </div>
              <div className="ih38-small-job ih38-plate">
                <span className="ih38-small-job-icon"><IH38Icon kind="brief"/></span>
                <div key={String(otherJob?.id||"second-demo")+site.language}>
                  <span>{otherJob?.category||text.nextCategory}</span><strong title={String(otherJob?.title||text.nextProject)}>{otherJob?.title||text.nextProject}</strong>
                  <small>{otherJob?text.relatedProject:text.demo}</small>
                </div>
              </div>
              <div className="ih38-talent ih38-plate">
                <div className="ih38-talent-symbol" aria-hidden="true"><IH38Icon kind="link"/></div>
                <div><span>{text.connection}</span><strong>{text.skills}</strong></div>
                <i className="ih38-talent-indicator" aria-hidden="true"/>
              </div>
              <div className="ih38-scene-label" aria-hidden="true"><span>03 / {text.draft}</span><i/><span>{text.craft}</span></div>
            </div>
          </div>
        </div>
      </div>
      <p id="ih38-stage-help" className="ih38-sr">{text.help}</p>
      <div className="ih38-foot">
        <span className="ih38-caption"><IH38Icon kind="move"/><span>{ready?text.hint:text.phaseLabels[phase]}</span></span>
        <Link className="ih38-feed" to="/jobs" aria-label={text.browse}>
          <span className="ih38-feed-dot" aria-hidden="true"/><span>{mainJob?text.live:text.browse}</span>
          {mainJob&&<strong key={mainJob.id} title={String(mainJob.title)}>{mainJob.title}</strong>}<IH38Icon/>
        </Link>
      </div>
    </section>
  );
}

/* Tylko pasek nawigacji na stronie głównej; bez zmian pozycji logo i konta. */
function useIdeaHireCursorNavigation(navigationRef,headerRef) {
  useEffect(()=>{
    const nav=navigationRef.current,header=headerRef.current;
    if(!nav||!header)return undefined;
    const desktop=window.matchMedia("(min-width: 1001px) and (hover: hover) and (pointer: fine)");
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    const saved=["translate","will-change","z-index"].map(name=>[name,nav.style.getPropertyValue(name),nav.style.getPropertyPriority(name)]);
    const overflow=[header.style.getPropertyValue("overflow"),header.style.getPropertyPriority("overflow")];
    let current=0,target=0,frame=0,idleTimer=0,last=0,pointerOver=false,focused=false,disposed=false;
    const enabled=()=>desktop.matches&&!reduced.matches;
    const tick=now=>{
      frame=0;if(disposed)return;
      const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
      current+=(target-current)*(1-Math.exp(-dt*9));
      if(Math.abs(target-current)<.05)current=target;
      nav.style.setProperty("translate","0 "+current.toFixed(2)+"px","important");
      if(Math.abs(target-current)>.01)frame=requestAnimationFrame(tick);
    };
    const wake=()=>{if(!frame){last=0;frame=requestAnimationFrame(tick);}};
    const returnHome=()=>{
      window.clearTimeout(idleTimer);idleTimer=0;
      if(pointerOver||focused)return;
      target=0;wake();
    };
    const scheduleHome=()=>{
      window.clearTimeout(idleTimer);
      idleTimer=window.setTimeout(returnHome,780);
    };
    const move=event=>{
      if(!enabled()||event.pointerType!=="mouse"||pointerOver||focused||event.buttons)return;
      const box=nav.getBoundingClientRect(),originTop=box.top-current;
      if(originTop+box.height<0||originTop>window.innerHeight)returnHome();
      else {
        const desired=Math.max(0,(event.clientY-originTop-box.height/2-36)*.42);
        const viewportRoom=Math.max(0,window.innerHeight-originTop-box.height-24);
        target=Math.min(180,viewportRoom,desired);wake();scheduleHome();
      }
    };
    const enter=()=>{pointerOver=true;window.clearTimeout(idleTimer);target=current;};
    const leave=()=>{pointerOver=false;scheduleHome();};
    const focus=()=>{focused=true;window.clearTimeout(idleTimer);target=current;};
    const blur=event=>{if(nav.contains(event.relatedTarget))return;focused=false;returnHome();};
    const settings=()=>{
      window.clearTimeout(idleTimer);cancelAnimationFrame(frame);frame=0;current=0;target=0;last=0;
      nav.style.setProperty("translate","0 0","important");
      if(enabled()){
        nav.style.setProperty("will-change","translate","important");
        nav.style.setProperty("z-index","150","important");
        header.style.setProperty("overflow","visible","important");
      }else{
        saved.forEach(([name,value,priority])=>value?nav.style.setProperty(name,value,priority):nav.style.removeProperty(name));
        overflow[0]?header.style.setProperty("overflow",overflow[0],overflow[1]):header.style.removeProperty("overflow");
      }
    };
    const scroll=()=>{if(!pointerOver&&!focused)returnHome();};
    const outside=()=>{pointerOver=false;returnHome();};
    settings();
    document.addEventListener("pointermove",move,{passive:true});
    nav.addEventListener("pointerenter",enter);nav.addEventListener("pointerleave",leave);
    nav.addEventListener("focusin",focus);nav.addEventListener("focusout",blur);
    window.addEventListener("scroll",scroll,{passive:true});
    window.addEventListener("blur",outside);document.addEventListener("pointerleave",outside);
    desktop.addEventListener?.("change",settings);reduced.addEventListener?.("change",settings);
    return()=>{
      disposed=true;window.clearTimeout(idleTimer);cancelAnimationFrame(frame);
      document.removeEventListener("pointermove",move);
      nav.removeEventListener("pointerenter",enter);nav.removeEventListener("pointerleave",leave);
      nav.removeEventListener("focusin",focus);nav.removeEventListener("focusout",blur);
      window.removeEventListener("scroll",scroll);window.removeEventListener("blur",outside);document.removeEventListener("pointerleave",outside);
      desktop.removeEventListener?.("change",settings);reduced.removeEventListener?.("change",settings);
      saved.forEach(([name,value,priority])=>value?nav.style.setProperty(name,value,priority):nav.style.removeProperty(name));
      overflow[0]?header.style.setProperty("overflow",overflow[0],overflow[1]):header.style.removeProperty("overflow");
    };
  },[navigationRef,headerRef]);
}

const categories = [
  { value: "Programowanie", label: "Strony, aplikacje i IT" },
  { value: "Grafika i design", label: "Grafika, UX i 3D" },
  { value: "Marketing", label: "Marketing i sprzedaż" },
  { value: "Copywriting", label: "Teksty i tłumaczenia" },
  { value: "Video", label: "Wideo, animacja i audio" },
  { value: "Fotografia", label: "Fotografia i obróbka zdjęć" },
  { value: "AI i automatyzacje", label: "AI i automatyzacje" },
  { value: "Dane, analizy i research", label: "Dane, analizy i research" },
  { value: "Biznes i e-commerce", label: "Biznes i e-commerce" },
  { value: "Architektura, wnętrza i CAD", label: "Architektura, wnętrza i CAD" },
];

const categoryLabels = Object.fromEntries(
  categories.map((category) => [category.value, category.label])
);

function getCategoryLabel(category) {
  return categoryLabels[category] || category || "Inna kategoria";
}

const fallbackJobs = [
  {
    id: "fallback-1",
    title: "Nowoczesna strona internetowa",
    description:
      "Szukam osoby, która stworzy prostą i szybką stronę dla nowej marki.",
    category: "Programowanie",
    budget: 3000,
  },
  {
    id: "fallback-2",
    title: "Identyfikacja wizualna marki",
    description:
      "Potrzebuję spójnego logo oraz podstawowych materiałów graficznych.",
    category: "Grafika i design",
    budget: 1800,
  },
  {
    id: "fallback-3",
    title: "Teksty na stronę firmową",
    description:
      "Zlecę przygotowanie przejrzystych tekstów do sześciu podstron.",
    category: "Copywriting",
    budget: 900,
  },
];

const HOME_CATEGORY_COPY = {
  Programowanie: { summary: "Strony, sklepy i aplikacje — od pierwszego projektu po integracje i naprawy.", descriptions: [
    "Pojedyncza strona prezentująca ofertę i prowadząca do kontaktu lub zakupu.",
    "Witryna z ofertą firmy, najważniejszymi informacjami i formularzem kontaktowym.",
    "Sklep z katalogiem produktów, koszykiem i obsługą zamówień.",
    "Aplikacja działająca w przeglądarce, dopasowana do potrzeb Twoich użytkowników.",
    "Aplikacja na telefon z funkcjami określonymi w Twoim projekcie.",
    "Budowa lub rozbudowa strony z wykorzystaniem gotowego systemu i narzędzi no-code.",
    "Połączenie usług i systemów, które mają wymieniać dane lub wykonywać wspólne zadania.",
    "Diagnoza i poprawa konkretnych problemów w istniejącej stronie lub aplikacji.",
    "Sprawdzenie wydajności lub bezpieczeństwa oraz lista zaleceń do wdrożenia.",
    "Przeniesienie strony, danych lub usług do nowego środowiska.",
  ] },
  "Grafika i design": { summary: "Wygląd marki, interfejsy i materiały graficzne dopasowane do Twojego projektu.", descriptions: [
    "Znak marki przygotowany do użycia w internecie i materiałach drukowanych.",
    "Spójny zestaw kolorów, typografii i materiałów budujących wygląd marki.",
    "Projekt ekranów i sposobu korzystania ze strony lub aplikacji.",
    "Banery i kreacje dopasowane do kampanii oraz formatów reklamowych.",
    "Zestaw grafik do publikacji na wybranych kanałach społecznościowych.",
    "Ulotki, plakaty lub inne projekty przygotowane do przekazania drukarni.",
    "Projekt wyglądu opakowania lub etykiety z uwzględnieniem wymaganych wymiarów.",
    "Czytelne slajdy z uporządkowaną treścią i spójnym układem.",
    "Autorska ilustracja do publikacji, produktu lub komunikacji marki.",
    "Edytowalne projekty, które możesz później samodzielnie uzupełniać w Canvie.",
    "Model obiektu w trzech wymiarach do dalszej pracy lub prezentacji.",
    "Obraz produktu pokazujący jego wygląd, materiały i detale.",
  ] },
  Marketing: { summary: "Kampanie, treści i analityka pomagające docierać do właściwych odbiorców.", descriptions: [
    "Plan komunikacji, kanałów i działań dopasowany do celów marki.",
    "Analiza widoczności strony w wyszukiwarce i lista konkretnych usprawnień.",
    "Poprawa treści lub elementów wybranych podstron pod określone cele.",
    "Przygotowanie ustawień i struktury kampanii w Google Ads.",
    "Przygotowanie kampanii i ustawień reklam w ekosystemie Meta.",
    "Konfiguracja kampanii reklamowej na TikToku.",
    "Zestaw publikacji z treścią dopasowaną do marki i jej odbiorców.",
    "Przygotowanie wiadomości i struktury kampanii do wybranej grupy odbiorców.",
    "Ustawienie pomiaru zdarzeń i raportów potrzebnych do oceny działań.",
    "Uporządkowana baza potencjalnych kontaktów według wskazanych kryteriów.",
    "Treści i materiały ułatwiające prezentację oferty klientom.",
    "Pomysł i plan współpracy z twórcami w ramach wybranej kampanii.",
  ] },
  Copywriting: { summary: "Teksty, redakcja i tłumaczenia — czytelna komunikacja dopasowana do odbiorców.", descriptions: [
    "Treści na podstrony prezentujące ofertę i pomagające użytkownikowi podjąć decyzję.",
    "Artykuły o ustalonej tematyce, długości i stylu.",
    "Opisy przedstawiające cechy, zastosowanie i najważniejsze informacje o produktach.",
    "Treści odpowiadające na potrzeby odbiorców i wskazane tematy wyszukiwania.",
    "Krótkie komunikaty do reklam, banerów lub kampanii.",
    "Zestaw tekstów do publikacji na wybranych profilach społecznościowych.",
    "Wiadomość do subskrybentów z uporządkowaną treścią i jasnym celem.",
    "Tekst prowadzący nagranie, reklamę lub inną formę opowieści.",
    "Poprawa języka, błędów i struktury istniejącego tekstu.",
    "Redakcja treści AI, sprawdzenie spójności i dopasowanie języka do odbiorców.",
    "Przekład treści między wskazanymi językami z zachowaniem sensu i stylu.",
    "Dostosowanie komunikatów i treści produktu do nowego języka oraz odbiorców.",
    "Przepisanie nagrania do czytelnego tekstu.",
    "Przygotowanie tekstu i synchronizacji napisów do nagrania.",
  ] },
  Video: { summary: "Montaż, animacja i dźwięk — materiały do publikacji, reklamy i prezentacji.", descriptions: [
    "Uporządkowanie ujęć i montaż nagrania według ustalonego celu i długości.",
    "Zestaw krótkich filmów dopasowanych do formatów mediów społecznościowych.",
    "Przygotowanie materiału do publikacji na YouTube.",
    "Film promujący markę, produkt lub usługę.",
    "Wideo prezentujące wygląd, działanie lub zastosowanie produktu.",
    "Animowany materiał objaśniający pomysł lub budujący opowieść.",
    "Animacja typografii i elementów graficznych do filmu lub kampanii.",
    "Materiał wideo przygotowany z wykorzystaniem narzędzi generatywnych.",
    "Dodanie napisów lub przygotowanie wersji filmu w innym języku.",
    "Montaż odcinka, usunięcie przerw i przygotowanie nagrania do publikacji.",
    "Czyszczenie, wyrównanie i poprawa jakości dostarczonego dźwięku.",
    "Nagranie głosu do filmu, prezentacji lub innego materiału.",
    "Krótki motyw muzyczny lub muzyka do wskazanego zastosowania.",
    "Dobór i przygotowanie efektów dźwiękowych budujących charakter materiału.",
  ] },
  Fotografia: { summary: "Zdjęcia i obróbka materiałów — od sesji produktowej po retusz istniejących ujęć.", descriptions: [
    "Zdjęcia produktów do katalogu, sklepu lub materiałów promocyjnych.",
    "Sesja przedstawiająca osoby, zespół lub charakter marki.",
    "Reportaż fotograficzny z wydarzenia według ustalonego zakresu.",
    "Zdjęcia lokalu lub budynku do oferty i prezentacji.",
    "Sesja pojazdu pokazująca jego wygląd i detale.",
    "Sesja portretowa dopasowana do wybranego stylu i przeznaczenia.",
    "Zdjęcia produktów przygotowane do spójnego katalogu internetowego.",
    "Zdjęcia pozwalające oglądać obiekt lub przestrzeń z różnych stron.",
    "Poprawa szczegółów zdjęcia z zachowaniem uzgodnionego wyglądu.",
    "Wycięcie obiektu ze zdjęcia i przygotowanie pliku z wybranym tłem.",
    "Naprawa uszkodzeń i poprawa czytelności starych fotografii.",
  ] },
  "AI i automatyzacje": { summary: "Narzędzia AI i integracje, które upraszczają konkretne zadania w Twojej firmie.", descriptions: [
    "Bot odpowiadający na pytania lub wspierający wybrany proces firmy.",
    "Asystent wykonujący ustalone zadania z wykorzystaniem modeli AI i narzędzi.",
    "Połączenie aplikacji w automatyczny przepływ danych i działań.",
    "Dodanie funkcji AI do istniejącej witryny, aplikacji lub systemu.",
    "Wyszukiwanie i odpowiedzi oparte na wskazanej bazie dokumentów.",
    "Asystent obsługujący wybrane zadania za pomocą rozmowy głosowej.",
    "Automatyczne przetwarzanie dokumentów według ustalonego schematu.",
    "Usprawnienie powtarzalnych pytań i zadań związanych z obsługą klientów.",
    "Analiza procesów i wskazanie miejsc, w których można zastosować AI.",
    "Uporządkowanie i przygotowanie danych do wskazanego zastosowania AI.",
    "Zestaw instrukcji i szablonów pracy z AI dopasowany do zespołu.",
  ] },
  "Dane, analizy i research": { summary: "Porządkowanie informacji, badania i raporty ułatwiające pracę z danymi.", descriptions: [
    "Usunięcie błędów, duplikatów i niespójności w dostarczonych danych.",
    "Uporządkowanie struktury, formatów i obliczeń w arkuszu.",
    "Przeniesienie danych z dokumentu PDF do arkusza nadającego się do dalszej pracy.",
    "Uzupełnienie danych w uzgodnionym systemie lub pliku.",
    "Pozyskanie wskazanych danych ze stron zgodnie z ustalonym zakresem.",
    "Panel raportowy pokazujący wybrane wskaźniki i zestawienia.",
    "Analiza zbioru danych i przedstawienie wniosków dotyczących zadanych pytań.",
    "Czytelne wykresy i zestawienia pokazujące zależności w danych.",
    "Research rynku, odbiorców lub konkurencji w określonym obszarze.",
    "Opracowanie odpowiedzi i podsumowanie wyników badania ankietowego.",
    "Uporządkowanie danych lub przeniesienie ich do nowej bazy.",
    "Oznaczenie przykładów w danych według ustalonej instrukcji.",
  ] },
  "Biznes i e-commerce": { summary: "Wsparcie sklepu i organizacji pracy — katalogi, procedury i materiały biznesowe.", descriptions: [
    "Wprowadzenie produktów, zdjęć i parametrów do katalogu sklepu.",
    "Opracowanie informacji potrzebnych do publikacji produktów.",
    "Przygotowanie konta sprzedawcy na wskazanej platformie.",
    "Ujednolicenie kategorii, parametrów i informacji w katalogu.",
    "Ustawienie lub uporządkowanie danych i procesów w systemie CRM.",
    "Przygotowanie i uporządkowanie kontaktów według wybranych kryteriów.",
    "Zestawienie informacji o ofertach i działaniach wskazanych konkurentów.",
    "Slajdy przedstawiające ofertę, plan lub wyniki działalności.",
    "Opis zasad, procesów i instrukcji potrzebnych w codziennej pracy.",
    "Uporządkowanie etapów, zadań i terminów wybranego projektu.",
    "Przygotowanie ogłoszeń, formularzy lub innych materiałów rekrutacyjnych.",
    "Wykonanie ustalonego zestawu zadań administracyjnych.",
    "Przegląd sklepu i lista usprawnień dotyczących wybranego obszaru.",
  ] },
  "Architektura, wnętrza i CAD": { summary: "Projekty przestrzeni, rysunki i modele do prezentacji lub dalszej pracy.", descriptions: [
    "Projekt aranżacji wnętrza zgodny z potrzebami i zakresem zlecenia.",
    "Plan rozmieszczenia stref i wyposażenia w pomieszczeniu.",
    "Obrazy pokazujące planowany wygląd obiektu lub przestrzeni.",
    "Rysunek techniczny lub projektowy w dwóch wymiarach.",
    "Model obiektu przygotowany w uzgodnionym narzędziu CAD.",
    "Projekt mebla z określeniem wymiarów i uzgodnionych detali.",
    "Model przygotowany do wskazanego procesu druku 3D.",
    "Rysunki i informacje techniczne potrzebne do produkcji.",
    "Koncepcja układu i wyglądu przestrzeni lokalu.",
    "Wizualne przedstawienie budynku, lokalu lub planowanej inwestycji.",
  ] },
};

function HomeCategoryBrowser({ groups }) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(groups[0]?.value || "");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const triggerRef = useRef(null);
  const group = groups.find((item) => item.value === selectedCategory) || groups[0];
  const subcategories = group?.subcategories || [];
  const copy = HOME_CATEGORY_COPY[group?.value];
  const subIndex = subcategories.indexOf(selectedSubcategory);
  const description = subIndex >= 0
    ? copy?.descriptions[subIndex] || copy?.summary
    : copy?.summary;
  const count = groups.reduce((total, item) => total + (item.subcategories?.length || 0), 0);
  const query = new URLSearchParams({ category: group?.value || "" });
  if (selectedSubcategory) query.set("subcategory", selectedSubcategory);

  function closeBrowser() {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  function selectCategory(value) {
    if (value !== selectedCategory) {
      setSelectedCategory(value);
      setSelectedSubcategory("");
    }
  }

  function onMousePreview(event, action) {
    if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) action();
  }

  return (
    <div className={`ih-category-browser${open ? " is-open" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) { event.preventDefault(); closeBrowser(); }
      }}>
      <button ref={triggerRef} type="button" className="ih-category-trigger"
        aria-expanded={open} aria-controls="ih-category-panel"
        onClick={() => setOpen((current) => !current)}>
        <span className="ih-category-trigger-top"><span>{String(groups.length).padStart(2, "0")} kategorii</span><span className="ih-category-toggle" aria-hidden="true">{open ? "−" : "+"}</span></span>
        <span className="ih-category-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="ih-category-trigger-title">Nasze<br />kategorie</span>
        <span className="ih-category-trigger-bottom"><span>{open ? "Zwiń katalog" : "Odkryj specjalizacje"}</span><span aria-hidden="true">↗</span></span>
      </button>

      <section id="ih-category-panel" className="ih-category-panel" hidden={!open} aria-labelledby="ih-category-panel-title">
        <div className="ih-category-panel-heading">
          <div><span className="ih-category-kicker">Znajdź swój kierunek</span><h3 id="ih-category-panel-title">Kategorie i specjalizacje</h3><p>{groups.length} kategorii{count > 0 ? ` · ${count} specjalizacji` : ""}. Wybierz to, czego potrzebujesz.</p></div>
          <button type="button" className="ih-category-close" onClick={closeBrowser} aria-label="Zamknij kategorie">×</button>
        </div>
        <div className="ih-category-layout">
          <div className="ih-category-list" role="group" aria-label="Wybierz kategorię">
            {groups.map((item, index) => (
              <button type="button" key={item.value} className="ih-category-option" aria-pressed={item.value === group?.value}
                onClick={() => selectCategory(item.value)} onFocus={() => selectCategory(item.value)}
                onPointerEnter={(event) => onMousePreview(event, () => selectCategory(item.value))}>
                <span className="ih-category-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span>{item.label}</span><span className="ih-category-option-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <div className="ih-category-content">
            <div className="ih-category-content-heading"><span className="ih-category-kicker">Specjalizacje</span><h4>{group?.label}</h4></div>
            <div className="ih-subcategory-grid" role="group" aria-label={`Specjalizacje: ${group?.label}`}>
              {subcategories.map((item) => (
                <button type="button" className="ih-subcategory-option" key={item} aria-pressed={item === selectedSubcategory} aria-describedby="ih-category-description"
                  onClick={() => setSelectedSubcategory(item)} onFocus={() => setSelectedSubcategory(item)}
                  onPointerEnter={(event) => onMousePreview(event, () => setSelectedSubcategory(item))}>
                  <span>{item}</span><span aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
            <div className="ih-category-detail" id="ih-category-description">
              <span className="ih-category-kicker">{selectedSubcategory ? "O tej specjalizacji" : "O tej kategorii"}</span>
              <strong>{selectedSubcategory || group?.label}</strong><p>{description || "Przejrzyj zlecenia w tej kategorii i znajdź projekt dla siebie."}</p>
            </div>
            <div className="ih-category-links">
              <Link className="ih-category-jobs-link" to={`/jobs?${query.toString()}`}>Pokaż zlecenia <span aria-hidden="true">↗</span></Link>
              {selectedSubcategory && <Link className="ih-category-all-link" to={`/jobs?${new URLSearchParams({ category: group?.value }).toString()}`}>Cała kategoria</Link>}
              <Link className="ih-category-all-link" to="/jobs">Wszystkie zlecenia</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


function HomeNavItem({ children, order, to, href, notification = false }) {
  const Item = to ? Link : "a";
  return (
    <Item
      {...(to ? { to } : { href })}
      className={`ih-nav-item${to === "/notifications" ? " home-notifications-link" : ""}`}
      style={{ "--ih-nav-order": order }}
    >
      <span className="ih-nav-pixels" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span className="ih-nav-label">{children}</span>
      {notification && <span className="home-notifications-dot" aria-label="Nowe powiadomienia" />}
    </Item>
  );
}

function HomeAccountMenu({ name, avatarUrl, initial, onOpen }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const viewport = window.visualViewport;
    let frame = 0;
    function placeMenu() {
      frame = 0;
      const menu = menuRef.current;
      const trigger = triggerRef.current;
      if (!menu || !trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = viewport?.width || window.innerWidth;
      const height = viewport?.height || window.innerHeight;
      const offsetLeft = viewport?.offsetLeft || 0;
      const offsetTop = viewport?.offsetTop || 0;
      const menuWidth = Math.max(0, Math.min(300, width - 24));
      const top = Math.max(offsetTop + 12, Math.min(rect.bottom + 8, offsetTop + height - 160));
      const left = Math.max(offsetLeft + 12, Math.min(rect.right - menuWidth, offsetLeft + width - menuWidth - 12));
      menu.style.setProperty("top", `${top}px`);
      menu.style.setProperty("left", `${left}px`);
      menu.style.setProperty("width", `${menuWidth}px`);
      menu.style.setProperty("max-height", `${Math.max(0, offsetTop + height - top - 12)}px`);
    }
    function schedule() { if (!frame) frame = window.requestAnimationFrame(placeMenu); }
    placeMenu();
    const focusFrame = window.requestAnimationFrame(() => menuRef.current?.querySelector("a")?.focus({ preventScroll: true }));
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    viewport?.addEventListener("resize", schedule, { passive: true });
    viewport?.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function closeOutside(event) {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    }
    function closeWithKeyboard(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithKeyboard);
    };
  }, [open]);

  function navigateMenu(event) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const links = Array.from(menuRef.current?.querySelectorAll("a") || []);
    if (!links.length) return;
    event.preventDefault();
    const index = links.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? links.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
    links[next].focus({ preventScroll: true });
  }

  return <>
    <button ref={triggerRef} className="home-account-avatar-link ih27-home-account-trigger" type="button"
      aria-label={open ? "Zamknij menu konta" : "Otwórz menu konta"} aria-expanded={open} aria-controls="ih27-home-account-menu"
      onClick={() => { if (!open) onOpen?.(); setOpen(value => !value); }}
      onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); if (open) menuRef.current?.querySelector("a")?.focus({ preventScroll: true }); else { onOpen?.(); setOpen(true); } } }}>
      <span className="account-mini-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initial}</span>
    </button>
    {open && createPortal(<nav ref={menuRef} id="ih27-home-account-menu" className="account-menu-dropdown ih18-account-dropdown ih27-home-account-menu"
      aria-label="Funkcje konta" onKeyDown={navigateMenu}
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && !triggerRef.current?.contains(event.relatedTarget)) setOpen(false); }}>
      <div className="account-menu-identity"><strong>{name}</strong><span>Konto IdeaHire</span></div>
      <Link to="/account" onClick={() => setOpen(false)}>Moje konto</Link>
      <a href={helpCenterHref()} onClick={() => setOpen(false)} referrerPolicy="no-referrer" aria-label="Pomoc — Centrum pomocy">
        <MarketIcon kind="help" /><span>Pomoc</span>
      </a>
    </nav>, document.body)}
  </>;
}

function HomeGreeting({ name }) {
  return (
    <span className="auth-user home-auth-user ih-welcome" title={`Cześć, ${name}`}>
      <span className="ih-welcome-readable">Cześć, {name}</span>
      <span className="ih-welcome-spark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="ih-welcome-copy" aria-hidden="true">
        <span className="ih-welcome-prefix">Cześć,</span>{" "}
        <strong className="ih-welcome-name">
          {Array.from(name).map((letter, index) => (
            <span key={index} style={{ "--ih-letter-order": Math.min(index, 12) }}>{letter}</span>
          ))}
        </strong>
      </span>
    </span>
  );
}

// Fictional content for the requested visual test. Keep the demo label visible.
const HOME_DEMO_REVIEWS = [
  { initial: "A", name: "Aleksandra", role: "zleceniodawczyni", text: "Mam pomysł i od razu wiem, gdzie szukać osoby, która pomoże mi go zrealizować." },
  { initial: "M", name: "Michał", role: "freelancer", text: "Przejrzyste kategorie i zlecenia w jednym miejscu. Tak lubię szukać nowych projektów." },
  { initial: "K", name: "Karolina", role: "zleceniodawczyni", text: "Najbardziej podoba mi się prosty układ. Mogę skupić się na swoim projekcie." },
  { initial: "P", name: "Piotr", role: "freelancer", text: "Od małego zadania po większy projekt — łatwo znaleźć swój kierunek." },
];

function HomeDemoReviews() {
  return (
    <section className="ih-demo-reviews" aria-labelledby="ih-demo-reviews-title">
      <div className="ih-demo-reviews-heading">
        <div>
          <span className="ih-demo-review-caption">Pomysły spotykają ludzi</span>
          <h2 id="ih-demo-reviews-title">Opinie przykładowe — test wyglądu</h2>
        </div>
      </div>
      <div className="ih-demo-reviews-viewport" tabIndex={0} aria-label="Przykładowe, fikcyjne opinie do testu wyglądu. Najedź kursorem lub ustaw fokus, aby zatrzymać przewijanie.">
        <div className="ih-demo-reviews-track" id="ih-demo-reviews-track">
          {[0, 1].map((copy) => (
            <div className="ih-demo-reviews-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
              {HOME_DEMO_REVIEWS.map((review) => (
                <article className="ih-demo-review" key={review.name}>
                  <span className="ih-demo-review-tag">Opinia testowa</span>
                  <blockquote>{review.text}</blockquote>
                  <div className="ih-demo-review-person">
                    <span className="ih-demo-review-avatar" aria-hidden="true">{review.initial}</span>
                    <div><strong>{review.name}</strong><span>{review.role}</span></div>
                    <span className="ih-demo-review-quote" aria-hidden="true">“</span>
                  </div>
                </article>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function App({ session, loading, categoryGroups = [] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const navigationRef = useRef(null);
  useIdeaHireCursorNavigation(navigationRef, headerRef);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    navigationRef.current?.querySelector("a")?.focus({ preventScroll: true });
    function closeOutside(event) {
      if (!headerRef.current?.contains(event.target)) setMobileMenuOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [mobileMenuOpen]);

  const [hasNotifications, setHasNotifications] = useState(false);
  const [recentJobs, setRecentJobs] = useState(fallbackJobs);
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    checkNotifications(session);

    function handleNotificationsRead(
      event
    ) {
      if (
        !event?.detail?.userId ||
        event.detail.userId ===
          session?.user?.id
      ) {
        setHasNotifications(false);
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
        `ideahire_read_notifications_${session?.user?.id}`
      ) {
        checkNotifications(session);
      }
    }

    window.addEventListener(
      "ideahire:notifications-read",
      handleNotificationsRead
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    const interval = setInterval(() => {
      if (mounted) {
        checkNotifications(session);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);

      window.removeEventListener(
        "ideahire:notifications-read",
        handleNotificationsRead
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    async function loadRecentJobs() {
      try {
        const { data, error } =
          await supabase
            .from("jobs")
            .select(
              "id, title, description, category, budget, created_at"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(8);

        if (error) {
          console.error(
            "HOME RECENT JOBS ERROR:",
            error
          );
          return;
        }

        if (
          mounted &&
          Array.isArray(data) &&
          data.length > 0
        ) {
          setRecentJobs(data);
          setActiveJobIndex(0);
        }
      } catch (error) {
        console.error(
          "HOME RECENT JOBS ERROR:",
          error
        );
      }
    }

    loadRecentJobs();

    const channel = supabase
      .channel("home-recent-jobs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "jobs",
        },
        () => {
          loadRecentJobs();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (recentJobs.length <= 1) return undefined;

    const interval = window.setInterval(
      () => {
        setActiveJobIndex(
          (current) =>
            (current + 1) % recentJobs.length
        );
      },
      4500
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [recentJobs.length]);

  useLayoutEffect(() => {
    const root = document.querySelector(".app");

    if (!root) return undefined;

    const revealElements = Array.from(
      root.querySelectorAll(".home-reveal")
    );

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    root.classList.add("home-motion-ready");

    revealElements.forEach((element) => {
      const group = element.parentElement;
      const groupedElements = group
        ? Array.from(group.children).filter((child) =>
            child.classList.contains("home-reveal")
          )
        : [];
      const position = Math.max(
        0,
        groupedElements.indexOf(element)
      );

      element.style.setProperty(
        "--home-reveal-delay",
        `${Math.min(position, 5) * 75}ms`
      );
    });

    if (
      prefersReducedMotion ||
      !("IntersectionObserver" in window)
    ) {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });

      return () => {
        root.classList.remove("home-motion-ready");
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;

          if (entry.isIntersecting) {
            element.classList.add("is-visible");
            element.classList.remove(
              "is-above",
              "is-below"
            );
            return;
          }

          element.classList.remove("is-visible");

          const viewportTop =
            entry.rootBounds?.top || 0;
          const viewportBottom =
            entry.rootBounds?.bottom ||
            window.innerHeight;

          if (
            entry.boundingClientRect.bottom <=
            viewportTop
          ) {
            element.classList.add("is-above");
            element.classList.remove("is-below");
          } else if (
            entry.boundingClientRect.top >=
            viewportBottom
          ) {
            element.classList.add("is-below");
            element.classList.remove("is-above");
          }
        });
      },
      {
        threshold: [0, 0.08, 0.18],
        rootMargin: "-5% 0px -5% 0px",
      }
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      root.classList.remove("home-motion-ready");
    };
  }, []);

  async function checkNotifications(currentSession) {
    const userId = currentSession?.user?.id;

    if (!userId) {
      setHasNotifications(false);
      return;
    }

    try {
      const { data: myJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("user_id", userId);

      if (jobsError) {
        console.error("HOME NOTIFICATION JOBS ERROR:", jobsError);
        return;
      }

      const jobIds = (myJobs || []).map((job) => job.id);

      let applications = [];

      if (jobIds.length > 0) {
        const {
          data,
          error: applicationsError,
        } = await supabase
          .from("job_applications")
          .select("id, job_id, applicant_id, created_at")
          .in("job_id", jobIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (applicationsError) {
          console.error(
            "HOME NOTIFICATION APPLICATIONS ERROR:",
            applicationsError
          );
          return;
        }

        applications = data || [];
      }

      const readKey = `ideahire_read_notifications_${userId}`;

      let readIds = [];

      try {
        const storedReadIds = JSON.parse(
          localStorage.getItem(readKey) || "[]"
        );

        readIds = Array.isArray(storedReadIds)
          ? storedReadIds
          : [];
      } catch {
        readIds = [];
      }

      const [
        rejectedResult,
        acceptedResult,
        blockedResult,
      ] = await Promise.all([
        supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("status", "rejected"),

        supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("status", "accepted"),

        supabase
          .from("user_blocks")
          .select("id")
          .eq("blocked_id", userId),
      ]);

      if (rejectedResult.error) {
        console.error(
          "HOME REJECTED NOTIFICATIONS ERROR:",
          rejectedResult.error
        );
      }

      if (acceptedResult.error) {
        console.error(
          "HOME ACCEPTED NOTIFICATIONS ERROR:",
          acceptedResult.error
        );
      }

      if (blockedResult.error) {
        console.error(
          "HOME BLOCK NOTIFICATIONS ERROR:",
          blockedResult.error
        );
      }

      const hasUnreadIncoming =
        (applications || []).some(
          (application) =>
            !readIds.includes(
              `incoming:${application.id}`
            )
        );

      const hasUnreadRejected =
        (rejectedResult.data || []).some(
          (application) =>
            !readIds.includes(
              `rejected:${application.id}`
            )
        );

      const hasUnreadAccepted =
        (acceptedResult.data || []).some(
          (application) =>
            !readIds.includes(
              `accepted:${application.id}`
            )
        );

      const hasUnreadBlock =
        (blockedResult.data || []).some(
          (block) =>
            !readIds.includes(
              `blocked:${block.id}`
            )
        );

      setHasNotifications(
        hasUnreadIncoming ||
          hasUnreadRejected ||
          hasUnreadAccepted ||
          hasUnreadBlock
      );
    } catch (error) {
      console.error("HOME NOTIFICATION CHECK ERROR:", error);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Nie udało się wylogować: ${error.message}`);
      return;
    }

    navigate("/");
  }

  const userName =
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    session?.user?.user_metadata
      ?.avatar_url || "";

  const userInitial = userName
    .charAt(0)
    .toUpperCase();

  const activeJob =
    recentJobs[
      activeJobIndex % recentJobs.length
    ] || fallbackJobs[0];

  const nextJob =
    recentJobs[
      (activeJobIndex + 1) %
        recentJobs.length
    ] || fallbackJobs[1];

  const followingJob =
    recentJobs[
      (activeJobIndex + 2) %
        recentJobs.length
    ] || fallbackJobs[2];

  function formatBudget(value) {
    return `${Number(
      value || 0
    ).toLocaleString("pl-PL")} zł`;
  }

  return (
    <div className="app ih-home-refresh ih-home-v3 ih-home-v4 ih-home-v6 ih-home-v7">
      <header ref={headerRef} className="navbar home-navbar ih-home-header" data-auth={session ? "member" : "guest"}
        data-mobile-menu-open={mobileMenuOpen}
        onKeyDown={(event) => {
          if (event.key === "Escape" && mobileMenuOpen) {
            event.preventDefault();
            setMobileMenuOpen(false);
            mobileMenuButtonRef.current?.focus({ preventScroll: true });
          }
        }}>
        <IdeaHireLogo className="logo logo-clean" />

        <nav ref={navigationRef} id="ih-home-navigation" className="nav-links home-nav-links" aria-label="Nawigacja strony głównej"
          onClick={(event) => { if (event.target?.closest?.("a")) setMobileMenuOpen(false); }}>
          <HomeNavItem href="#how-it-works" order={0}>Jak to działa</HomeNavItem>
          <HomeNavItem href="#categories" order={1}>Kategorie</HomeNavItem>
          <HomeNavItem href="#for-users" order={2}>Dla Ciebie</HomeNavItem>

          {session && (
            <>
              <HomeNavItem to="/notifications" order={3} notification={hasNotifications}>Powiadomienia</HomeNavItem>
              <HomeNavItem to="/account" order={4}>Moje konto</HomeNavItem>
            </>
          )}
          {!session && <Link className="ih-mobile-login" to="/login">Zaloguj się</Link>}
        </nav>

        <div className="nav-actions">
          {loading ? (
            <span>Ładowanie...</span>
          ) : session ? (
            <>
              <HomeGreeting name={userName} />

              <HomeAccountMenu name={userName} avatarUrl={avatarUrl} initial={userInitial} onOpen={() => setMobileMenuOpen(false)} />

              <button
                className="btn btn-dark ih-logout-btn"
                type="button"
                onClick={handleLogout}
                aria-label="Wyloguj się"
              >
                <span className="ih-logout-label">Wyloguj się</span>
                <svg className="ih-logout-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 5H5v14h5M13 8l4 4-4 4M8 12h12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link
                className="btn btn-ghost"
                to="/login"
              >
                Zaloguj się
              </Link>

              <Link
                className="btn btn-dark"
                to="/register"
              >
                Zacznij teraz
              </Link>
            </>
          )}
        </div>

        <button ref={mobileMenuButtonRef} className="ih-mobile-nav-toggle" type="button"
          aria-label={mobileMenuOpen ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={mobileMenuOpen} aria-controls="ih-home-navigation"
          onClick={() => setMobileMenuOpen((current) => !current)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={mobileMenuOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
      </header>

      <main>
        <IdeaHireCinematicHero job={activeJob} jobs={recentJobs} userKey={session?.user?.id || "guest"} />

        <HomeDemoReviews />

        <section
          className="categories section"
          id="categories"
        >
          <div className="section-heading home-reveal ih-category-intro">
            <div>
              <span className="section-label">Kategorie</span>

              <h2>
                Znajdź dokładnie to, czego potrzebujesz.
              </h2>
            </div>

            <p>
              Od małych zadań po większe projekty.
              Wybierz kategorię i zacznij szukać.
            </p>
          </div>

          <div className="ih5-category-showcase">
            <HomeCategoryBrowser groups={categoryGroups.length ? categoryGroups : categories} />
            <CommissionStory />
          </div>
        </section>

        <section
          className="how section"
          id="how-it-works"
        >
          <div className="section-heading centered home-reveal">
            <span className="section-label">
              Jak to działa
            </span>

            <h2>Prościej się nie da.</h2>

            <p>
              Trzy kroki. Jeden konkretny cel.
            </p>
          </div>

          <div className="steps">
            <HomeStepCard number="01" title="Opisz potrzebę">Powiedz nam, czego potrzebujesz i określ podstawowe szczegóły projektu.</HomeStepCard>
            <HomeStepCard number="02" title="Wybierz osobę">Przejrzyj zgłoszenia i wybierz wykonawcę, który najlepiej pasuje do Twojego projektu.</HomeStepCard>
            <HomeStepCard number="03" title="Zrealizuj projekt">Ustal szczegóły, rozpocznij współpracę i doprowadź projekt do końca.</HomeStepCard>
          </div>
        </section>

        <section
          className="split-section section home-reveal"
          id="for-users"
        >
          <div className="split-card">
            <span className="section-label">
              Dla zlecających
            </span>

            <h2>Masz coś do zrobienia?</h2>

            <p>
              Znajdź osobę, która ma odpowiednie umiejętności
              i może zająć się Twoim projektem.
            </p>

            <Link
              className="btn btn-light"
              to="/find-talent"
            >
              Dodaj zlecenie 
            </Link>
          </div>

          <div className="split-card light">
            <span className="section-label">
              Dla wykonawców
            </span>

            <h2>Masz coś do zaoferowania?</h2>

            <p>
              Pokaż swoje umiejętności, znajdź interesujące
              projekty i rozwijaj swoje portfolio.
            </p>

            <Link
              className="btn btn-outline"
              to="/jobs"
            >
              Znajdź zlecenia 
            </Link>
          </div>
        </section>

        <section className="final-cta home-reveal">
          <span className="section-label">IdeaHire</span>

          <h2 className="final-cta-title">
            <span>Twój następny projekt</span>
            <span>zaczyna się tutaj.</span>
          </h2>

          <Link
            className="btn btn-light btn-large"
            to={session ? "/account" : "/register"}
          >
            {session
              ? "Przejdź do konta "
              : "Zacznij teraz "}
          </Link>
        </section>
      </main>

      <footer className="footer home-reveal">
        <div>
          <Link className="logo logo-clean" to="/">
            Idea<span>Hire</span>
          </Link>

          <p>Prosto. Szybko. Skutecznie.</p>
        </div>

        <div className="footer-links">
          <a href={helpCenterHref()} onClick={event => { event.currentTarget.href = helpCenterHref(); }} referrerPolicy="no-referrer" aria-label="Pomoc — Centrum pomocy">Pomoc</a>
          <a href="#how-it-works">Jak to działa</a>
          <a href="#categories">Kategorie</a>
          <a href="#for-users">Dla Ciebie</a>
          <Link to="/regulamin">Regulamin</Link>
          <Link to="/polityka-prywatnosci">Polityka prywatności</Link>
          <Link to="/polityka-cookies">Polityka cookies</Link>
          <a href="mailto:ideahireprywatnosc@gmail.com?subject=Zg%C5%82oszenie%20nielegalnej%20tre%C5%9Bci%20w%20IdeaHire">
            Zgłoś nielegalną treść
          </a>
        </div>

        <span>© 2026 IdeaHire</span>
      </footer>
    </div>
  );
}

export default App;


