/* IdeaHire | P39 | 2026-10-15 | Pełny plik: src/App.jsx | Pomysł × Talent — autorski spektakl iH */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { CommissionStory, HomeStepCard, IdeaHireLogo, MarketIcon, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences } from "./Preferences";

const IH39_STYLES=String.raw`
#root#root#root .ih39-hero {
  --ih39-bg:#eef2f7;--ih39-ink:#162536;--ih39-muted:#526278;--ih39-accent:#2859cc;
  --ih39-on-accent:#fff;--ih39-line:#c5cfdd;--ih39-glass:rgba(251,253,255,.77);
  position:relative!important;isolation:isolate!important;display:block!important;
  box-sizing:border-box!important;width:100%!important;max-width:none!important;
  height:clamp(700px,49vw,800px)!important;min-height:700px!important;
  margin:0 0 36px!important;padding:0!important;border:0!important;border-radius:0!important;
  background:var(--ih39-bg)!important;color:var(--ih39-ink)!important;overflow:hidden!important;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
  text-align:left!important;box-shadow:none!important;
}
#root#root#root .ih39-hero[data-dark="true"] {
  --ih39-bg:#080d16;--ih39-ink:#edf2fa;--ih39-muted:#a4b2c6;--ih39-accent:#a9c3ff;
  --ih39-on-accent:#0d182e;--ih39-line:#314056;--ih39-glass:rgba(20,30,46,.75);
}
#root#root#root .ih39-hero[data-classic="true"] {
  --ih39-bg:#f1f1ef;--ih39-ink:#242628;--ih39-muted:#62656a;--ih39-accent:#303336;
  --ih39-on-accent:#fff;--ih39-line:#c9ccce;--ih39-glass:rgba(252,252,250,.79);
}
#root#root#root .ih39-hero[data-classic="true"][data-dark="true"] {
  --ih39-bg:#101112;--ih39-ink:#f0f1f2;--ih39-muted:#afb3b9;--ih39-accent:#d6d9de;
  --ih39-on-accent:#181a1d;--ih39-line:#3c4249;--ih39-glass:rgba(29,32,36,.80);
}
#root#root#root .ih39-hero,#root#root#root .ih39-hero * {box-sizing:border-box!important;}
#root#root#root .ih39-hero :is(h1,p,span,strong,small,button,a) {font-family:inherit!important;-webkit-text-fill-color:currentColor!important;}
#root#root#root .ih39-hero :is(h1,p) {text-shadow:none!important;}
#root#root#root .ih39-title::before,#root#root#root .ih39-title::after {content:none!important;}
#root#root#root .ih39-atmosphere {position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
#root#root#root .ih39-studio-light {
  position:absolute;inset:-25% -15% -25% 23%;
  background:radial-gradient(ellipse at 68% 48%,color-mix(in srgb,var(--ih39-accent) 11%,transparent),transparent 58%);
}
#root#root#root .ih39-studio-grain {
  position:absolute;inset:0;opacity:.026;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.76' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Cpath fill='%23777777' filter='url(%23n)' d='M0 0h160v160H0z'/%3E%3C/svg%3E");
}
#root#root#root .ih39-floor-line {position:absolute;left:43%;right:4%;top:72%;height:1px;background:linear-gradient(90deg,transparent,var(--ih39-line),transparent);opacity:.2;}
#root#root#root .ih39-stage {
  position:absolute!important;inset:0!important;z-index:2!important;width:100%!important;height:100%!important;
  min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;
  border:0!important;background:none!important;touch-action:pan-y;cursor:grab;outline:none;
}
#root#root#root .ih39-stage[data-dragging="true"] {cursor:grabbing;}
#root#root#root .ih39-stage:focus-visible {outline:2px solid var(--ih39-accent)!important;outline-offset:-8px!important;}
#root#root#root .ih39-canvas {
  position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;
  margin:0!important;border:0!important;opacity:0;pointer-events:none;transition:opacity .26s ease;
}
#root#root#root .ih39-hero[data-gpu="true"] .ih39-canvas {opacity:1;}
#root#root#root .ih39-static-mark {
  position:absolute;left:73.5%;top:43%;width:clamp(280px,34vw,490px);
  transform:translate(-50%,-50%) perspective(1000px) rotateY(-13deg) rotateZ(-3deg);
  color:var(--ih39-ink);opacity:0;pointer-events:none;
  filter:drop-shadow(0 24px 32px color-mix(in srgb,var(--ih39-ink) 18%,transparent));
}
#root#root#root .ih39-static-mark svg {display:block;width:100%;height:auto;}
#root#root#root .ih39-static-dot {fill:var(--ih39-accent);}
#root#root#root .ih39-static-cross {stroke:var(--ih39-accent);}
#root#root#root .ih39-hero[data-ready="true"][data-gpu="false"] .ih39-static-mark {opacity:.88;}
#root#root#root .ih39-stage-corner {position:absolute;right:5.5%;top:20%;font-size:8px!important;letter-spacing:.12em;color:var(--ih39-muted);opacity:.55;pointer-events:none;}
#root#root#root .ih39-topline {
  position:absolute;z-index:8;top:27px;left:clamp(28px,5.8vw,106px);right:clamp(28px,4.8vw,86px);
  display:flex;align-items:center;justify-content:space-between;gap:18px;
}
#root#root#root .ih39-wordmark {display:flex;align-items:center;gap:10px;margin:0!important;color:var(--ih39-ink)!important;font-size:10px!important;font-weight:700!important;line-height:1.5!important;letter-spacing:.12em!important;white-space:nowrap;}
#root#root#root .ih39-wordmark>i {display:block;width:5px;height:5px;background:var(--ih39-accent);border-radius:50%;}
#root#root#root .ih39-wordmark>span {margin-left:12px;color:var(--ih39-muted);font-size:8px!important;font-weight:500!important;letter-spacing:.11em!important;}
#root#root#root .ih39-controls {display:flex;align-items:center;gap:7px;}
#root#root#root .ih39-control {
  display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px;
  min-width:42px!important;min-height:42px!important;width:auto!important;height:42px!important;
  margin:0!important;padding:0 12px!important;border:1px solid var(--ih39-line)!important;border-radius:99px!important;
  background:var(--ih39-glass)!important;color:var(--ih39-ink)!important;backdrop-filter:blur(12px);
  font-size:10px!important;font-weight:550!important;line-height:1.3!important;box-shadow:none!important;
  transform:none!important;cursor:pointer;transition:border-color .2s ease!important;
}
#root#root#root .ih39-control svg {display:block;width:15px;height:15px;flex:none;}
#root#root#root .ih39-control:hover {border-color:var(--ih39-accent)!important;}
#root#root#root .ih39-control:disabled {opacity:.38;cursor:default;}
#root#root#root .ih39-impulse {padding:0 15px!important;}
#root#root#root .ih39-impulse svg {color:var(--ih39-accent);}
#root#root#root .ih39-kinetic {
  position:absolute;z-index:1;left:clamp(28px,5.8vw,106px);top:30%;width:52%;pointer-events:none;
  opacity:1;transform:translateY(0);transition:opacity .28s ease,transform .4s ease;
}
#root#root#root .ih39-kinetic-label {display:flex;align-items:center;gap:10px;margin-bottom:24px;color:var(--ih39-muted);font-size:9px!important;font-weight:550!important;letter-spacing:.14em!important;line-height:1.5!important;}
#root#root#root .ih39-kinetic-label>i {display:block;width:22px;height:1px;background:var(--ih39-accent);}
#root#root#root .ih39-word-frame {perspective:1000px;min-height:clamp(90px,11vw,180px);}
#root#root#root .ih39-kinetic-word {
  display:block!important;margin:0!important;padding:0!important;color:var(--ih39-ink)!important;
  font-size:clamp(72px,9.7vw,161px)!important;font-weight:650!important;line-height:.97!important;
  letter-spacing:-.07em!important;white-space:nowrap!important;transform-origin:50% 100%;
  animation:ih39-word-in .62s cubic-bezier(.14,.75,.15,1) both;
}
#root#root#root .ih39-hero:is([data-act="0"],[data-act="2"]) .ih39-kinetic-word {color:var(--ih39-accent)!important;}
#root#root#root .ih39-hero[data-act="3"] .ih39-kinetic-word {font-size:clamp(70px,9.2vw,154px)!important;letter-spacing:-.075em!important;}
#root#root#root .ih39-kinetic-caption {display:block!important;margin:23px 0 0!important;padding:0!important;max-width:310px;color:var(--ih39-muted)!important;font-size:14px!important;font-weight:400!important;line-height:1.7!important;animation:ih39-caption-in .5s ease both;}
#root#root#root .ih39-timecode {display:flex;align-items:center;gap:12px;width:134px;margin-top:40px;color:var(--ih39-muted);font-size:9px!important;font-variant-numeric:tabular-nums;}
#root#root#root .ih39-timecode>i {flex:1;height:1px;background:var(--ih39-line);}
#root#root#root .ih39-copy {
  position:absolute!important;z-index:5;left:clamp(28px,5.8vw,106px)!important;top:25%!important;
  width:43%!important;max-width:660px!important;margin:0!important;padding:0!important;
  opacity:0;transform:translateY(16px);pointer-events:none;
  transition:opacity .72s ease .28s,transform .9s cubic-bezier(.18,.7,.2,1) .28s;
}
#root#root#root .ih39-hero[data-ready="true"] .ih39-kinetic {opacity:0;transform:translateY(-16px);visibility:hidden;transition:opacity .28s ease,transform .4s ease,visibility 0s .4s;}
#root#root#root .ih39-hero[data-ready="true"] .ih39-copy {opacity:1;transform:translateY(0);pointer-events:auto;}
#root#root#root .ih39-eyebrow {display:block!important;margin:0 0 22px!important;color:var(--ih39-muted)!important;font-size:10px!important;font-weight:600!important;line-height:1.5!important;letter-spacing:.11em!important;text-transform:uppercase!important;}
#root#root#root .ih39-title {
  display:block!important;width:auto!important;max-width:100%!important;margin:0!important;padding:0!important;
  color:var(--ih39-ink)!important;font-size:clamp(56px,6.25vw,100px)!important;font-weight:640!important;
  line-height:1.035!important;letter-spacing:-.063em!important;word-break:normal!important;overflow-wrap:normal!important;text-wrap:initial!important;
}
#root#root#root .ih39-title>span {display:block!important;white-space:nowrap!important;color:var(--ih39-ink)!important;}
#root#root#root .ih39-title>span:last-child {color:var(--ih39-accent)!important;font-weight:450!important;}
#root#root#root .ih39-description {display:block!important;max-width:342px!important;margin:25px 0 0!important;padding:0!important;color:var(--ih39-muted)!important;font-size:14px!important;font-weight:400!important;line-height:1.75!important;}
#root#root#root .ih39-actions {display:flex!important;align-items:stretch!important;gap:10px;margin:28px 0 0!important;}
#root#root#root .ih39-cta {
  position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:17px;
  min-height:52px!important;min-width:0!important;width:auto!important;height:auto!important;margin:0!important;padding:13px 18px!important;
  border:1px solid var(--ih39-line)!important;border-radius:7px!important;background:var(--ih39-glass)!important;
  color:var(--ih39-ink)!important;font-size:12px!important;font-weight:650!important;line-height:1.4!important;
  text-decoration:none!important;box-shadow:none!important;transform:none!important;cursor:pointer;
  transition:background .2s ease,border-color .2s ease!important;
}
#root#root#root .ih39-cta:first-child {border-color:var(--ih39-accent)!important;background:var(--ih39-accent)!important;color:var(--ih39-on-accent)!important;}
#root#root#root .ih39-cta svg {display:block;width:15px;height:15px;flex:none;transition:transform .2s ease;}
#root#root#root .ih39-cta:hover {border-color:var(--ih39-accent)!important;}
#root#root#root .ih39-cta:hover svg {transform:translate(2px,-2px);}
#root#root#root .ih39-copy-signature {display:flex;align-items:center;gap:12px;margin-top:28px;color:var(--ih39-muted);font-size:8px!important;font-weight:550!important;letter-spacing:.13em!important;}
#root#root#root .ih39-copy-signature>i {width:17px;height:1px;background:var(--ih39-line);}
#root#root#root .ih39-projects {
  position:absolute;z-index:6;left:50%;right:4.8%;bottom:88px;display:grid;grid-template-columns:repeat(var(--ih39-count,3),minmax(0,1fr));gap:8px;
  opacity:0;transform:translateY(35px) perspective(1100px) rotateX(14deg);transform-origin:center bottom;pointer-events:none;
  transition:opacity .8s ease .45s,transform 1s cubic-bezier(.14,.75,.15,1) .35s;
}
#root#root#root .ih39-hero[data-ready="true"] .ih39-projects {opacity:1;transform:translateY(0) perspective(1100px) rotateX(0);pointer-events:auto;}
#root#root#root .ih39-project {
  position:relative;display:block!important;min-width:0!important;height:80px!important;min-height:80px!important;margin:0!important;padding:12px!important;
  border:1px solid var(--ih39-line)!important;border-top-color:color-mix(in srgb,var(--ih39-ink) 30%,var(--ih39-line))!important;border-radius:9px!important;
  background:linear-gradient(120deg,color-mix(in srgb,var(--ih39-ink) 3%,var(--ih39-glass)),var(--ih39-glass))!important;
  color:var(--ih39-ink)!important;text-decoration:none!important;backdrop-filter:blur(18px);
  box-shadow:0 12px 28px color-mix(in srgb,var(--ih39-bg) 24%,transparent)!important;transform:none!important;
  transition:border-color .2s ease!important;overflow:hidden;
}
#root#root#root .ih39-project:hover {border-color:var(--ih39-accent)!important;}
#root#root#root .ih39-project-body {display:block;min-width:0;animation:ih39-job-in .65s cubic-bezier(.16,.7,.2,1) both;animation-delay:calc(var(--ih39-order,0)*80ms);}
#root#root#root .ih39-project-top {display:flex;align-items:center;gap:5px;margin-bottom:9px;color:var(--ih39-muted);font-size:7px!important;font-weight:500!important;line-height:1.5!important;min-width:0;}
#root#root#root .ih39-project-top>i {display:block;width:3px;height:3px;border-radius:50%;flex:none;background:var(--ih39-accent);}
#root#root#root .ih39-project-top>span {overflow:hidden;white-space:nowrap;text-overflow:ellipsis;min-width:0;}
#root#root#root .ih39-project-top>small {display:block;margin-left:auto;flex:none;font-size:6px!important;font-weight:450!important;line-height:1.5!important;opacity:.9;}
#root#root#root .ih39-project-title {display:flex;align-items:center;justify-content:space-between;gap:9px;font-size:11px!important;font-weight:550!important;line-height:1.4!important;min-height:30px;overflow-wrap:anywhere;}
#root#root#root .ih39-project-title>svg {display:block;width:12px;height:12px;flex:none;color:var(--ih39-accent);}
#root#root#root .ih39-project-name {display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;min-width:0;max-height:31px;}
#root#root#root .ih39-bottom {
  position:absolute;z-index:7;left:clamp(28px,5.8vw,106px);right:clamp(28px,4.8vw,86px);bottom:20px;
  display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:41px;padding-top:15px;
  border-top:1px solid var(--ih39-line);color:var(--ih39-muted);
}
#root#root#root .ih39-hint {display:flex;align-items:center;gap:8px;min-width:0;font-size:9px!important;font-weight:450!important;line-height:1.5!important;}
#root#root#root .ih39-hint svg {display:block;width:13px;height:13px;flex:none;}
#root#root#root .ih39-progress {display:flex;align-items:center;gap:5px;flex:none;}
#root#root#root .ih39-progress>i {display:block;width:26px;height:2px;border-radius:1px;background:var(--ih39-line);transition:background .35s ease;}
#root#root#root .ih39-progress>i.is-active {background:var(--ih39-accent);}
#root#root#root .ih39-catalog {display:inline-flex!important;align-items:center;gap:10px;flex:none;min-height:30px;margin:0!important;padding:0!important;color:var(--ih39-ink)!important;font-size:10px!important;font-weight:550!important;line-height:1.5!important;text-decoration:none!important;}
#root#root#root .ih39-catalog svg {width:13px;height:13px;}
#root#root#root .ih39-sr {position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important;}
#root#root#root .ih39-hero :is(.ih39-control,.ih39-cta,.ih39-project,.ih39-catalog):focus-visible {outline:2px solid var(--ih39-accent)!important;outline-offset:4px!important;}
#root#root#root .ih39-hero[data-paused="true"] *,#root#root#root .ih39-hero[data-paused="true"] *::before,#root#root#root .ih39-hero[data-paused="true"] *::after {animation-play-state:paused!important;}
#root#root#root .ih39-hero[data-paused="true"] .ih39-project-body {animation:none!important;}
@keyframes ih39-word-in {
  from {opacity:0;transform:translate3d(0,36px,-50px) rotateX(24deg) skewX(-4deg);filter:blur(8px);}
  to {opacity:1;transform:translate3d(0,0,0) rotateX(0) skewX(0);filter:blur(0);}
}
@keyframes ih39-caption-in {from {opacity:0;transform:translateY(9px);}to {opacity:1;transform:translateY(0);}}
@keyframes ih39-job-in {from {opacity:.35;transform:translateY(9px);}to {opacity:1;transform:translateY(0);}}
@media (min-width:821px) and (max-width:1080px) {
  #root#root#root .ih39-hero {height:660px!important;min-height:660px!important;}
  #root#root#root .ih39-copy {left:34px!important;width:43%!important;top:25%!important;}
  #root#root#root .ih39-title {font-size:clamp(49px,5.9vw,63px)!important;}
  #root#root#root .ih39-description {max-width:280px!important;font-size:13px!important;}
  #root#root#root .ih39-cta {padding:12px!important;font-size:11px!important;gap:9px;}
  #root#root#root .ih39-actions {gap:8px;}
  #root#root#root .ih39-wordmark>span {display:none;}
  #root#root#root .ih39-kinetic {left:34px;width:52%;}
  #root#root#root .ih39-kinetic-word {font-size:clamp(68px,9.3vw,101px)!important;}
  #root#root#root .ih39-hero[data-act="3"] .ih39-kinetic-word {font-size:clamp(68px,9.1vw,99px)!important;}
  #root#root#root .ih39-projects {left:50%;right:26px;gap:6px;bottom:82px;}
  #root#root#root .ih39-project {padding:10px!important;}
  #root#root#root .ih39-project-title {font-size:10px!important;}
}
@media (max-width:820px) {
  #root#root#root .ih39-hero {height:auto!important;min-height:0!important;margin-bottom:28px!important;}
  #root#root#root .ih39-topline {left:24px;right:24px;top:20px;gap:12px;}
  #root#root#root .ih39-wordmark {font-size:9px!important;}
  #root#root#root .ih39-wordmark>span {display:none;}
  #root#root#root .ih39-control {min-height:42px!important;min-width:42px!important;height:42px!important;padding:0 10px!important;}
  #root#root#root .ih39-impulse {padding:0 10px!important;}
  #root#root#root .ih39-impulse>span {display:none;}
  #root#root#root .ih39-stage {inset:68px 0 auto!important;height:min(115vw,510px)!important;}
  #root#root#root .ih39-stage-corner {right:24px;top:17%;font-size:7px!important;}
  #root#root#root .ih39-static-mark {left:50%;top:45%;width:min(78vw,390px);}
  #root#root#root .ih39-studio-light {inset:-6% -40% 22% -40%;background:radial-gradient(ellipse at 50% 30%,color-mix(in srgb,var(--ih39-accent) 11%,transparent),transparent 53%);}
  #root#root#root .ih39-floor-line {top:calc(68px + min(115vw,510px)*.82);left:8%;right:8%;}
  #root#root#root .ih39-kinetic {left:24px;top:100px;width:calc(100% - 48px);z-index:1;}
  #root#root#root .ih39-kinetic-label {font-size:7px!important;letter-spacing:.11em!important;margin-bottom:15px;}
  #root#root#root .ih39-word-frame {min-height:72px;}
  #root#root#root .ih39-kinetic-word {font-size:clamp(54px,10.2vw,84px)!important;letter-spacing:-.068em!important;}
  #root#root#root .ih39-hero[data-act="2"] .ih39-kinetic-word {font-size:clamp(45px,9.5vw,78px)!important;}
  #root#root#root .ih39-hero[data-act="3"] .ih39-kinetic-word {font-size:clamp(54px,10.2vw,84px)!important;}
  #root#root#root .ih39-kinetic-caption {max-width:230px;font-size:11px!important;margin-top:11px!important;}
  #root#root#root .ih39-timecode {margin-top:18px;width:96px;font-size:8px!important;}
  #root#root#root .ih39-copy {
    position:relative!important;left:auto!important;top:auto!important;width:auto!important;max-width:none!important;
    margin:0!important;padding:calc(86px + min(115vw,510px)) 24px 0!important;
  }
  #root#root#root .ih39-eyebrow {font-size:9px!important;letter-spacing:.08em!important;margin-bottom:17px!important;}
  #root#root#root .ih39-title {font-size:clamp(47px,8.7vw,73px)!important;letter-spacing:-.058em!important;}
  #root#root#root .ih39-description {font-size:14px!important;max-width:385px!important;margin-top:20px!important;line-height:1.75!important;}
  #root#root#root .ih39-actions {margin-top:23px!important;gap:10px;}
  #root#root#root .ih39-cta {min-height:50px!important;font-size:12px!important;padding:13px 16px!important;flex:0 1 auto;}
  #root#root#root .ih39-copy-signature {font-size:7px!important;margin-top:22px;}
  #root#root#root .ih39-projects {
    position:relative;left:auto;right:auto;bottom:auto;display:flex;gap:10px;
    margin:25px 24px 104px;padding:4px 2px 10px;overflow-x:auto;overflow-y:hidden;
    scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:var(--ih39-line) transparent;
    transform:translateY(20px);perspective:none;overscroll-behavior-x:contain;
  }
  #root#root#root .ih39-project {flex:0 0 78%;max-width:280px;height:90px!important;min-height:90px!important;padding:14px!important;scroll-snap-align:start;}
  #root#root#root .ih39-project-top {font-size:8px!important;margin-bottom:10px;flex-wrap:wrap;}
  #root#root#root .ih39-project-top>small {display:block;flex:0 0 auto;margin-left:auto;font-size:7px!important;font-weight:450!important;opacity:.8;}
  #root#root#root .ih39-project-title {font-size:12px!important;min-height:33px;}
  #root#root#root .ih39-bottom {left:24px;right:24px;bottom:20px;display:grid;grid-template-columns:1fr auto;gap:9px 14px;padding-top:13px;}
  #root#root#root .ih39-hint {grid-column:1/-1;font-size:9px!important;}
  #root#root#root .ih39-progress {gap:4px;}
  #root#root#root .ih39-progress>i {width:19px;}
  #root#root#root .ih39-catalog {min-height:32px;font-size:10px!important;}
}
@media (max-width:420px) {
  #root#root#root .ih39-topline {left:20px;right:20px;}
  #root#root#root .ih39-wordmark {font-size:8px!important;letter-spacing:.08em!important;}
  #root#root#root .ih39-wordmark>i {width:4px;height:4px;}
  #root#root#root .ih39-controls {gap:6px;}
  #root#root#root .ih39-control {font-size:9px!important;padding:0 9px!important;}
  #root#root#root .ih39-copy {padding-left:20px!important;padding-right:20px!important;}
  #root#root#root .ih39-title {font-size:clamp(42px,11.5vw,49px)!important;}
  #root#root#root .ih39-eyebrow {max-width:260px;font-size:8px!important;}
  #root#root#root .ih39-kinetic {left:20px;width:calc(100% - 40px);}
  #root#root#root .ih39-hero[data-act="3"] .ih39-kinetic-word {font-size:clamp(49px,12.8vw,55px)!important;}
  #root#root#root .ih39-description {font-size:13px!important;}
  #root#root#root .ih39-actions {gap:8px;flex-wrap:wrap;}
  #root#root#root .ih39-cta {flex:1 1 140px;padding:12px!important;font-size:11px!important;gap:8px;}
  #root#root#root .ih39-projects {margin-left:20px;margin-right:20px;}
  #root#root#root .ih39-bottom {left:20px;right:20px;}
}
@media (prefers-reduced-motion:reduce) {
  #root#root#root .ih39-hero *,#root#root#root .ih39-hero *::before,#root#root#root .ih39-hero *::after {animation:none!important;transition:none!important;}
}
@media print {
  #root#root#root .ih39-hero {height:auto!important;min-height:0!important;background:#fff!important;color:#111!important;}
  #root#root#root .ih39-hero :is(.ih39-stage,.ih39-atmosphere,.ih39-controls,.ih39-kinetic,.ih39-projects,.ih39-bottom) {display:none!important;}
  #root#root#root .ih39-copy {position:relative!important;left:auto!important;top:auto!important;width:auto!important;opacity:1!important;transform:none!important;padding:30px!important;}
  #root#root#root .ih39-title>span {color:#111!important;}
}
`;

/* P39: autorski sygnet iH, powierzchnie frezowane, studio odbić i pole cząstek. */
const IH39_DURATION=6.8;
const IH39_SEEN=new Set();
const IH39_MATH={
  identity:()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
  mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;},
  move(x,y,z){const m=this.identity();m[12]=x;m[13]=y;m[14]=z;return m;},
  scale(x,y=x,z=x){return new Float32Array([x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1]);},
  rx(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);},
  ry(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);},
  rz(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);},
  unit(a){const d=Math.hypot(...a)||1;return a.map(v=>v/d);},
  cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];},
  ease(a,b,t){const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v);},
  mix(a,b,t){return a+(b-a)*t;},
  noise(n){const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);},
  camera(aspect,yaw,pitch,distance){
    const eye=[Math.sin(yaw)*distance,1.02+pitch*2.2,Math.cos(yaw)*distance];
    const at=[0,.02,0],z=this.unit(eye.map((v,i)=>v-at[i])),x=this.unit(this.cross([0,1,0],z)),y=this.cross(z,x);
    const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
      -x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]);
    const f=1/Math.tan(.56/2),near=.1,far=70;
    const projection=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
    return{matrix:this.mul(projection,view),eye};
  },
  triangle(out,a,b,c){out.push(...a,...b,...c);},
  sweep(path,width,depth,twist=0,steps=64){
    const m=[],around=32;
    const sample=(u,v)=>{
      const t=Math.max(0,Math.min(1,u)),p=path(t),a=path(Math.max(0,t-.001)),b=path(Math.min(1,t+.001));
      const tangent=this.unit(b.map((q,i)=>q-a[i]));
      let side=this.unit(this.cross(tangent,[0,0,1])),front=this.unit(this.cross(side,tangent));
      const roll=twist*Math.sin(t*Math.PI);
      const ss=side.map((q,i)=>q*Math.cos(roll)+front[i]*Math.sin(roll));
      const ff=front.map((q,i)=>q*Math.cos(roll)-side[i]*Math.sin(roll));side=ss;front=ff;
      const end=u<0?-u:u>1?u-1:0,cap=Math.min(Math.PI/2,end/.045*Math.PI/2),shrink=Math.cos(cap);
      const tip=Math.sin(cap)*.075*(u<0?-1:u>1?1:0);
      const w=width*(.94+.06*Math.sin(t*Math.PI)),d=depth;
      const corner=Math.floor(v*4)%4,q=v*4-corner,angle=corner*Math.PI/2+q*Math.PI/2;
      const radius=Math.min(w*.24,d*.42);
      const cx=Math.cos(corner*Math.PI/2+Math.PI/4)>0?w/2-radius:-w/2+radius;
      const cy=Math.sin(corner*Math.PI/2+Math.PI/4)>0?d/2-radius:-d/2+radius;
      const px=(cx+Math.cos(angle)*radius)*shrink,py=(cy+Math.sin(angle)*radius)*shrink;
      const normal=this.unit(side.map((q,i)=>q*Math.cos(angle)*Math.cos(cap)+front[i]*Math.sin(angle)*Math.cos(cap)+tangent[i]*Math.sin(cap)*(u<0?-1:u>1?1:0)));
      return [...p.map((q,i)=>q+side[i]*px+front[i]*py+tangent[i]*tip),...normal,t,v];
    };
    const rings=[];
    for(let i=0;i<=5;i++)rings.push(-.045+i*.009);
    for(let i=1;i<steps;i++)rings.push(i/steps);
    for(let i=0;i<=5;i++)rings.push(1+i*.009);
    for(let r=0;r<rings.length-1;r++)for(let j=0;j<around;j++){
      const a=sample(rings[r],j/around),b=sample(rings[r],(j+1)/around),c=sample(rings[r+1],(j+1)/around),d=sample(rings[r+1],j/around);
      this.triangle(m,a,c,b);this.triangle(m,a,d,c);
    }
    return m;
  },
  sphere(center,radius,steps=36,rows=24){
    const m=[],sample=(u,v)=>{const a=u*Math.PI*2,b=v*Math.PI,n=[Math.cos(a)*Math.sin(b),Math.cos(b),Math.sin(a)*Math.sin(b)];return[...n.map((q,i)=>center[i]+q*radius),...n,u,v];};
    for(let y=0;y<rows;y++)for(let x=0;x<steps;x++){
      const a=sample(x/steps,y/rows),b=sample((x+1)/steps,y/rows),c=sample((x+1)/steps,(y+1)/rows),d=sample(x/steps,(y+1)/rows);
      this.triangle(m,a,b,c);this.triangle(m,a,c,d);
    }
    return m;
  },
};

function ih39Geometry(){
  const g=IH39_MATH;
  const parts=[
    {geometry:g.sweep(t=>[-1.35+.025*Math.sin(t*Math.PI*2),-1.12+t*1.65,.04*Math.sin(t*Math.PI)],.43,.31,.18),tint:0,group:0},
    {geometry:g.sphere([-1.35,1.05,0],.235),tint:1,group:0},
    {geometry:g.sweep(t=>[-.31+.025*Math.sin(t*Math.PI),-1.12+t*2.45,.03*Math.sin(t*Math.PI*2)],.44,.32,-.09),tint:0,group:1},
    {geometry:g.sweep(t=>[.98-.045*Math.sin(t*Math.PI),-1.12+t*2.45,-.03*Math.sin(t*Math.PI)],.44,.32,.12),tint:0,group:2},
    {geometry:g.sweep(t=>[-.31+1.29*t,.03+.14*Math.sin((t-.5)*Math.PI),.08+.11*Math.sin(t*Math.PI)],.43,.30,.6,54),tint:1,group:3},
  ];
  const field=[],cols=140,rows=92;
  for(let z=0;z<rows;z++)for(let x=0;x<cols;x++)field.push(-10+x*20/(cols-1),0,-15+z*22/(rows-1));
  const particles=[],count=6200;
  for(let i=0;i<count;i++){
    const part=parts[i%parts.length],vertices=part.geometry.length/8;
    const offset=Math.floor(g.noise(i+17)*vertices)*8;
    particles.push(part.geometry[offset],part.geometry[offset+1],part.geometry[offset+2],g.noise(i+200),i%2?1:-1,0);
  }
  const trails=[];
  for(let i=0;i<particles.length;i+=6)trails.push(...particles.slice(i,i+5),0,...particles.slice(i,i+5),1);
  return{parts,field,particles,trails};
}

const IH39_MESH_VERTEX=[
  "attribute vec3 aPosition,aNormal;attribute vec2 aUV;",
  "uniform mat4 uCamera,uModel;uniform float uShift;",
  "varying vec3 vWorld,vNormal,vLocal;varying vec2 vUV;",
  "void main(){vec4 w=uModel*vec4(aPosition,1.0);vWorld=w.xyz;vLocal=aPosition;vNormal=mat3(uModel)*aNormal;vUV=aUV;",
  "vec4 clip=uCamera*w;clip.x+=uShift*clip.w;gl_Position=clip;}",
].join("\n");
const IH39_MESH_FRAGMENT=[
  "precision highp float;",
  "uniform vec3 uEye,uAccent;uniform float uDark,uTint,uAlpha,uMirror,uTime;",
  "varying vec3 vWorld,vNormal,vLocal;varying vec2 vUV;",
  "vec3 tone(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}",
  "float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,39.425)))*43758.5453);}",
  "vec3 studio(vec3 r){",
  " vec3 base=mix(vec3(.08,.10,.14),vec3(.24,.28,.34),smoothstep(-.3,.85,r.y));",
  " base=mix(base,vec3(.37,.40,.45),1.0-uDark);",
  " float key=exp(-pow((r.x+.48)*5.2,2.0))*smoothstep(-.25,.0,r.y)*mix(1.6,2.5,uDark);",
  " float strip=pow(max(0.0,dot(r,normalize(vec3(.55,.6,.34)))),35.0)*2.9;",
  " float edge=exp(-pow((r.z+.35)*8.0,2.0))*smoothstep(.05,.5,r.y)*1.2;",
  " float horizon=pow(max(0.0,1.0-abs(r.y+.02)),22.0)*.40;",
  " float blue=pow(max(0.0,dot(r,normalize(vec3(-.9,.1,-.45)))),12.0);",
  " return base+vec3(key+strip+edge)+uAccent*(blue*1.8+horizon*.45);",
  "}",
  "float ggx(vec3 n,vec3 v,vec3 l,float rough){",
  " vec3 h=normalize(v+l);float nv=max(dot(n,v),.001),nl=max(dot(n,l),.0),nh=max(dot(n,h),.0);",
  " float a=rough*rough,a2=a*a,d=nh*nh*(a2-1.0)+1.0;",
  " float D=a2/(3.14159*d*d+.00001),k=(rough+1.0)*(rough+1.0)/8.0;",
  " return D*nv/(nv*(1.0-k)+k)*nl/(nl*(1.0-k)+k)/max(.004,4.0*nv);",
  "}",
  "void main(){",
  " vec3 n=normalize(vNormal),v=normalize(uEye-vWorld);if(!gl_FrontFacing)n=-n;",
  " float grain=hash(vec3(vUV.x*1700.0,floor(vUV.y*80.0),1.0))-.5;",
  " n=normalize(n+vec3(grain*.007,grain*.002,grain*.005));",
  " float nv=max(dot(n,v),0.0),f=pow(1.0-nv,5.0);",
  " vec3 f0=mix(vec3(.74,.79,.85),mix(vec3(.09),uAccent*.8,.80),uTint);",
  " vec3 F=f0+(1.0-f0)*f;",
  " vec3 reflected=studio(reflect(-v,n));",
  " vec3 key=normalize(vec3(-2.0,4.5,4.0)),rim=normalize(vec3(3.0,1.2,-2.0));",
  " float rough=mix(.21,.17,uTint);",
  " vec3 color=reflected*F;",
  " color+=vec3(ggx(n,v,key,rough))*.8+uAccent*ggx(n,v,rim,.26)*1.9;",
  " color+=mix(vec3(.045),uAccent*.035,uTint)*(.3+max(0.0,dot(n,key))*.7);",
  " float contact=1.0-.16*exp(-pow((vLocal.y-.03)*7.0,2.0))*exp(-pow((vLocal.x-.33)*1.8,2.0));",
  " color*=contact;color+=F*pow(1.0-nv,7.0)*.17;",
  " color=pow(tone(color),vec3(1.0/2.2));",
  " color+=(hash(vec3(gl_FragCoord.xy,uTime*.01))-.5)/255.0;",
  " float alpha=uAlpha;",
  " if(uMirror>.5){alpha*=.14*exp(-max(0.0,-1.34-vWorld.y)*2.0);color=mix(color,uAccent,.18);}",
  " gl_FragColor=vec4(color,alpha);",
  "}",
].join("\n");

const IH39_PARTICLE_VERTEX=[
  "attribute vec3 aTarget;attribute float aSeed,aSide,aTrail;",
  "uniform mat4 uCamera,uModel;uniform float uShift,uTime,uGather,uAssemble,uBurst,uRatio;",
  "varying float vAlpha,vSide,vTrail;",
  "void main(){",
  " float angle=aSeed*25.1327+uTime*.85;",
  " vec3 stream=vec3(aSide*(4.9-fract(aSeed+uTime*.22)*5.0),sin(angle)*(.18+aSeed*.7),cos(angle)*.48);",
  " vec3 orbit=vec3(cos(angle)*(1.2+aSeed*.5),sin(angle)*(.65+aSeed*.4),sin(angle*.72)*.65);",
  " vec3 p=mix(stream,orbit,uGather);p=mix(p,aTarget,uAssemble);",
  " vec3 burst=normalize(vec3(sin(aSeed*173.1),cos(aSeed*91.7),sin(aSeed*117.7)));",
  " p+=burst*uBurst*(.8+aSeed*3.9);",
  " p-=normalize(p+vec3(.001,.002,.2))*aTrail*(.10+uBurst*.28)*(1.0-uAssemble*.7);",
  " vec4 w=uModel*vec4(p,1.0),clip=uCamera*w;clip.x+=uShift*clip.w;gl_Position=clip;",
  " gl_PointSize=clamp((1.4+aSeed*2.1)*uRatio/max(1.0,clip.w*.17),.7*uRatio,3.8*uRatio);",
  " vAlpha=(.4+aSeed*.5)*(1.0-uAssemble+uBurst*.7)*(1.0+uBurst*.65);vSide=aSide;vTrail=aTrail;",
  "}",
].join("\n");
const IH39_PARTICLE_FRAGMENT=[
  "precision mediump float;uniform vec3 uAccent;uniform float uDark,uLines;varying float vAlpha,vSide,vTrail;",
  "void main(){float a;if(uLines>.5)a=.20*(1.0-vTrail);else a=1.0-smoothstep(.04,.5,length(gl_PointCoord-vec2(.5)));a*=vAlpha;",
  "vec3 color=mix(uAccent,mix(uAccent,vec3(.96),.8),step(.0,vSide)*uDark);",
  "gl_FragColor=vec4(color,a*mix(.62,1.0,uDark));}",
].join("\n");

const IH39_FIELD_VERTEX=[
  "attribute vec3 aPosition;uniform mat4 uCamera;uniform float uTime,uShift,uRatio,uPulse;varying float vFade,vLight,vSide;",
  "void main(){vec3 p=aPosition;",
  "p.y=-1.52+.21*sin(p.x*1.3+p.z*.6+uTime*.25)+.10*cos(p.z*1.4-uTime*.3);",
  "float distance=length(p.xz);p.y+=.13*sin(distance*3.5-uPulse*9.0)*exp(-abs(distance-uPulse*5.0)*1.7)*step(.001,uPulse);",
  "vec4 c=uCamera*vec4(p,1.0);c.x+=uShift*c.w;gl_Position=c;",
  "gl_PointSize=clamp(2.1*uRatio/max(1.0,c.w*.22),.7*uRatio,2.3*uRatio);",
  "vFade=exp(-max(.0,c.w-3.0)*.14);vLight=.30+.65*smoothstep(-1.70,-1.28,p.y);vSide=c.x/c.w;}",
].join("\n");
const IH39_FIELD_FRAGMENT=[
  "precision mediump float;uniform vec3 uAccent;uniform float uDark;varying float vFade,vLight,vSide;",
  "void main(){float a=1.0-smoothstep(.08,.5,length(gl_PointCoord-vec2(.5)));",
  "gl_FragColor=vec4(uAccent,a*vFade*vLight*mix(.35,.72,uDark)*mix(.3,1.0,smoothstep(-.65,.15,vSide)));}",
].join("\n");

const IH39_QUAD_VERTEX="attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.0,1.0);}";
const IH39_QUAD_FRAGMENT=[
  "precision mediump float;varying vec2 vUV;",
  "uniform float uAspect,uShift,uTime,uDark,uPulse,uPulsePower;uniform vec3 uAccent;",
  "void main(){",
  " vec2 p=(vUV-vec2(.5+uShift*.5,.51))*vec2(uAspect,1.0);",
  " float halo=exp(-dot(p*vec2(1.0,1.12),p*vec2(1.0,1.12))*8.0)*.07;",
  " float ring=exp(-pow((length(p)-uPulse*.75)*26.0,2.0))*uPulsePower*.34;",
  " float ground=exp(-pow((vUV.y-.19)*18.0,2.0))*exp(-p.x*p.x*5.0)*.12;",
  " vec3 col=mix(uAccent,mix(uAccent,vec3(.9,.96,1.0),.55),ring*uDark);",
  " gl_FragColor=vec4(col,(halo+ring+ground)*mix(.40,1.0,uDark));",
  "}",
].join("\n");

function ih39Pose(state,dt,compact) {
  const m=IH39_MATH,s=state;
  if(!s.paused&&!s.reduced){
    s.time+=dt;
    if(!s.ready){s.intro=Math.min(IH39_DURATION,s.intro+dt);if(s.intro>=IH39_DURATION)s.ready=true;}
    if(s.impulse>=0)s.impulse+=dt;
    if(s.impulse>2.55)s.impulse=-1;
  }
  if(s.reduced){s.ready=true;s.intro=IH39_DURATION;s.impulse=-1;s.yaw=s.targetYaw;s.pitch=s.targetPitch;}
  const t=s.ready?IH39_DURATION:s.intro;
  const phase=t<.95?0:t<1.9?1:t<3.25?2:t<5.35?3:4;
  const damp=1-Math.exp(-dt*9);
  s.yaw+=(s.targetYaw-s.yaw)*damp;s.pitch+=(s.targetPitch-s.pitch)*damp;
  if(Math.abs(s.yaw-s.targetYaw)+Math.abs(s.pitch-s.targetPitch)<.0004){s.yaw=s.targetYaw;s.pitch=s.targetPitch;}
  const idle=s.reduced?0:Math.sin(s.time*.22)*.045;
  let burst=0,pulse=0,pulsePower=0;
  if(t>1.94&&t<3.32){
    const u=(t-1.94)/1.38;burst=Math.sin(u*Math.PI)*.72;pulse=u;pulsePower=Math.sin(u*Math.PI);
  }
  if(s.impulse>=0){
    const u=Math.min(1,s.impulse/2.55);burst=Math.sin(u*Math.PI)*.85;pulse=u;pulsePower=Math.sin(u*Math.PI);
  }
  const gather=m.ease(.35,1.65,t),assemble=m.ease(2.9,4.5,t);
  const alpha=m.ease(3.22,4.4,t)*(1-Math.min(.8,burst*.9));
  const yaw=m.mix(.92,-.62,m.ease(.65,3.95,t))+m.ease(4.1,5.8,t)*.29+s.yaw+idle;
  let distance=7.9-m.ease(.7,1.8,t)*.9+m.ease(1.94,2.65,t)*1.6-m.ease(3.05,4.15,t)*2.0+m.ease(4.35,6.3,t)*1.65;
  if(compact)distance+=.75;
  const rotation=m.mul(m.rz(-.055),m.ry(.07+idle*.2));
  const scale=m.scale(1.12+burst*.035);
  return{phase,ready:s.ready,gather,assemble,alpha,burst,pulse,pulsePower,yaw,pitch:s.pitch,distance,
    shift:compact?0:.42+m.ease(5.25,6.75,t)*.055,model:m.mul(m.move(0,.12,0),m.mul(rotation,scale)),time:s.time,t};
}

function ih39Start(canvas,host,state,report) {
  let gl,frame=0,last=0,lastRender=0,disposed=false,visible=true,dirtySize=true,resizeObserver,observer;
  let previousPhase=-1,previousReady=false,firstRendered=false;
  const buffers=[],programs=[],shaders=[],listeners=[];
  const listen=(node,type,fn,options)=>{node.addEventListener(type,fn,options);listeners.push(()=>node.removeEventListener(type,fn,options));};
  const destroy=()=>{
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);frame=0;
    resizeObserver?.disconnect();observer?.disconnect();listeners.forEach(fn=>fn());
    if(gl&&!gl.isContextLost()){buffers.forEach(b=>gl.deleteBuffer(b));programs.forEach(p=>gl.deleteProgram(p));shaders.forEach(s=>gl.deleteShader(s));}
  };
  try {
    gl=canvas.getContext("webgl",{alpha:true,antialias:true,depth:true,stencil:false,premultipliedAlpha:true,powerPreference:"low-power"});
    if(!gl||gl.isContextLost())throw new Error("ih39_context");
    const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
    const program=(vertexSource,fragmentSource,uniformNames,attributes)=>{
      const compile=(type,source)=>{
        const shader=gl.createShader(type);if(!shader)throw new Error("ih39_shader");
        shaders.push(shader);gl.shaderSource(shader,type===gl.FRAGMENT_SHADER&&!precision?.precision?source.replace("precision highp float;","precision mediump float;"):source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error("ih39_shader");
        return shader;
      };
      const p=gl.createProgram();if(!p)throw new Error("ih39_program");programs.push(p);
      gl.attachShader(p,compile(gl.VERTEX_SHADER,vertexSource));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error("ih39_program");
      return{program:p,uniforms:Object.fromEntries(uniformNames.map(n=>[n,gl.getUniformLocation(p,n)])),
        attributes:attributes.map(([name,size,offset])=>({location:gl.getAttribLocation(p,name),size,offset}))};
    };
    const meshProgram=program(IH39_MESH_VERTEX,IH39_MESH_FRAGMENT,["uCamera","uModel","uShift","uEye","uAccent","uDark","uTint","uAlpha","uMirror","uTime"],[["aPosition",3,0],["aNormal",3,12],["aUV",2,24]]);
    const particleProgram=program(IH39_PARTICLE_VERTEX,IH39_PARTICLE_FRAGMENT,["uCamera","uModel","uShift","uTime","uGather","uAssemble","uBurst","uRatio","uAccent","uDark","uLines"],[["aTarget",3,0],["aSeed",1,12],["aSide",1,16],["aTrail",1,20]]);
    const fieldProgram=program(IH39_FIELD_VERTEX,IH39_FIELD_FRAGMENT,["uCamera","uShift","uTime","uRatio","uPulse","uAccent","uDark"],[["aPosition",3,0]]);
    const quadProgram=program(IH39_QUAD_VERTEX,IH39_QUAD_FRAGMENT,["uAspect","uShift","uTime","uDark","uPulse","uPulsePower","uAccent"],[["aPosition",2,0]]);
    const geometry=ih39Geometry();
    const buffer=(data,stride)=>{
      const b=gl.createBuffer();if(!b)throw new Error("ih39_buffer");buffers.push(b);
      gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
      return{buffer:b,count:data.length/stride,stride:stride*4};
    };
    const parts=geometry.parts.map(p=>({...p,mesh:buffer(p.geometry,8)}));
    const particles=buffer(geometry.particles,6),trails=buffer(geometry.trails,6),field=buffer(geometry.field,3),quad=buffer([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1],2);
    let ratio=1,compact=false,aspect=1;
    const resize=()=>{
      const box=host.getBoundingClientRect();if(!box.width||!box.height)return;
      compact=window.matchMedia("(max-width: 820px)").matches;
      ratio=Math.min(window.devicePixelRatio||1,compact?1.3:1.45);
      const pixels=box.width*box.height*ratio*ratio,budget=compact?520000:1500000;
      if(pixels>budget)ratio*=Math.sqrt(budget/pixels);
      const width=Math.max(1,Math.round(box.width*ratio)),height=Math.max(1,Math.round(box.height*ratio));
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);aspect=width/height;dirtySize=false;
    };
    let enabled=[];
    const use=(p,b)=>{
      enabled.forEach(a=>gl.disableVertexAttribArray(a));enabled=[];
      gl.useProgram(p.program);gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);
      p.attributes.forEach(a=>{if(a.location>=0){gl.enableVertexAttribArray(a.location);gl.vertexAttribPointer(a.location,a.size,gl.FLOAT,false,b.stride,a.offset);enabled.push(a.location);}});
    };
    const uniforms=(p,pose,camera,accent,dark)=>{
      const u=p.uniforms;
      if(u.uCamera!=null)gl.uniformMatrix4fv(u.uCamera,false,camera.matrix);
      if(u.uModel!=null)gl.uniformMatrix4fv(u.uModel,false,pose.model);
      if(u.uShift!=null)gl.uniform1f(u.uShift,pose.shift);
      if(u.uEye!=null)gl.uniform3fv(u.uEye,camera.eye);
      if(u.uAccent!=null)gl.uniform3fv(u.uAccent,accent);
      if(u.uDark!=null)gl.uniform1f(u.uDark,dark?1:0);
      if(u.uTime!=null)gl.uniform1f(u.uTime,pose.time);
      if(u.uRatio!=null)gl.uniform1f(u.uRatio,ratio);
    };
    const render=now=>{
      frame=0;if(disposed||!visible||document.hidden)return;
      try{
        if(gl.isContextLost()){destroy();report({failed:true,ready:true});return;}
        const s=state.current;
        const interval=compact?1000/30:1000/45;
        if(!s.paused&&!s.reduced&&lastRender&&now-lastRender<interval-1){frame=requestAnimationFrame(render);return;}
        const dt=last?Math.min(.075,(now-last)/1000):1/45;last=now;lastRender=now;
        if(dirtySize)resize();
        const pose=ih39Pose(s,dt,compact),camera=IH39_MATH.camera(aspect,pose.yaw,pose.pitch,pose.distance);
        if(pose.phase!==previousPhase||pose.ready!==previousReady){
          previousPhase=pose.phase;previousReady=pose.ready;report({phase:pose.phase,ready:pose.ready});
        }
        const accent=s.classic?(s.dark?[.68,.68,.68]:[.32,.32,.32]):(s.dark?[.18,.42,.88]:[.12,.30,.72]);
        gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
        use(quadProgram,quad);uniforms(quadProgram,pose,camera,accent,s.dark);
        gl.uniform1f(quadProgram.uniforms.uAspect,aspect);gl.uniform1f(quadProgram.uniforms.uPulse,pose.pulse);gl.uniform1f(quadProgram.uniforms.uPulsePower,pose.pulsePower);gl.drawArrays(gl.TRIANGLES,0,quad.count);
        use(fieldProgram,field);uniforms(fieldProgram,pose,camera,accent,s.dark);
        gl.uniform1f(fieldProgram.uniforms.uPulse,pose.pulse);gl.drawArrays(gl.POINTS,0,field.count);
        if(pose.alpha>.002){
          gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
          for(const mirror of [1,0]){
            for(const part of parts){
              use(meshProgram,part.mesh);uniforms(meshProgram,pose,camera,accent,s.dark);
              const separated=(1-IH39_MATH.ease(3.1,4.7,pose.t))*.12+pose.burst*.32;
              const x=(part.group-1.3)*separated;
              let model=IH39_MATH.mul(pose.model,IH39_MATH.move(x,Math.sin(part.group*2)*separated*.3,0));
              if(mirror)model=IH39_MATH.mul(IH39_MATH.move(0,-2.84,0),IH39_MATH.mul(IH39_MATH.scale(1,-1,1),model));
              gl.uniformMatrix4fv(meshProgram.uniforms.uModel,false,model);
              gl.uniform1f(meshProgram.uniforms.uTint,part.tint);
              gl.uniform1f(meshProgram.uniforms.uAlpha,pose.alpha);
              gl.uniform1f(meshProgram.uniforms.uMirror,mirror);
              gl.drawArrays(gl.TRIANGLES,0,part.mesh.count);
            }
            if(mirror)gl.clear(gl.DEPTH_BUFFER_BIT);
          }
        }
        gl.enable(gl.DEPTH_TEST);gl.depthMask(false);
        if(pose.assemble<.999||pose.burst>.001){
        use(particleProgram,trails);uniforms(particleProgram,pose,camera,accent,s.dark);
        gl.uniform1f(particleProgram.uniforms.uGather,pose.gather);gl.uniform1f(particleProgram.uniforms.uAssemble,pose.assemble);gl.uniform1f(particleProgram.uniforms.uBurst,pose.burst);gl.uniform1f(particleProgram.uniforms.uLines,1);
        gl.drawArrays(gl.LINES,0,compact?7200:trails.count);
        use(particleProgram,particles);uniforms(particleProgram,pose,camera,accent,s.dark);
        gl.uniform1f(particleProgram.uniforms.uGather,pose.gather);gl.uniform1f(particleProgram.uniforms.uAssemble,pose.assemble);gl.uniform1f(particleProgram.uniforms.uBurst,pose.burst);
        gl.uniform1f(particleProgram.uniforms.uLines,0);
        gl.drawArrays(gl.POINTS,0,compact?3600:particles.count);
        }
        gl.depthMask(true);
        if(!firstRendered){firstRendered=true;report({gpu:true});}
        const settling=Math.abs(s.targetYaw-s.yaw)+Math.abs(s.targetPitch-s.pitch)>.0003;
        if(!s.paused&&!s.reduced||settling)frame=requestAnimationFrame(render);
      }catch{
        destroy();report({failed:true,ready:true});
      }
    };
    const wake=()=>{if(!disposed&&visible&&!document.hidden&&!frame){last=0;lastRender=0;frame=requestAnimationFrame(render);}};
    listen(document,"visibilitychange",()=>{last=0;lastRender=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
    listen(window,"resize",()=>{dirtySize=true;wake();},{passive:true});
    listen(canvas,"webglcontextlost",event=>{event.preventDefault();destroy();report({failed:true,ready:true});});
    if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(()=>{dirtySize=true;wake();});resizeObserver.observe(host);}
    if(typeof IntersectionObserver!=="undefined"){observer=new IntersectionObserver(entries=>{
      visible=!!entries[0]?.isIntersecting;
      if(visible)wake();
      else{
        cancelAnimationFrame(frame);frame=0;last=0;lastRender=0;
        if(!state.current.ready){state.current.ready=true;state.current.intro=IH39_DURATION;report({phase:4,ready:true});}
      }
    },{rootMargin:"100px"});observer.observe(host);}
    resize();wake();return{wake,destroy};
  }catch{
    destroy();report({failed:true,ready:true});return{wake(){},destroy};
  }
}

const IH39_COPY={
  pl:{
    region:"IdeaHire — pomysł spotyka talent",eyebrow:"Twój pomysł zasługuje na ciąg dalszy.",
    title:"Masz pomysł.",subtitle:"Daj mu życie.",
    description:"Połącz swój pomysł z czyimś talentem. Znajdź wykonawcę lub projekt, w którym pokażesz, co potrafisz.",
    talent:"Znajdź wykonawcę",jobs:"Znajdź zlecenie",
    skip:"Pomiń wstęp",replay:"Odtwórz pokaz",pause:"Zatrzymaj animację",resume:"Wznów animację",
    impulse:"Pokaż impuls",reset:"Przywróć kadr",reduced:"Animacja ograniczona",static:"Podgląd statyczny",
    stage:"Przestrzenny sygnet IdeaHire — pomysł i talent",
    help:"Przeciągnij, aby obrócić sygnet. Strzałki zmieniają kadr, Home przywraca widok, a Enter uruchamia impuls. Na telefonie możesz nadal przewijać stronę pionowo.",
    interaction:"Przeciągnij. Odkryj inną perspektywę.",
    signature:"POMYSŁ × TALENT",identity:"RAZEM W IDEAHIRE",catalog:"Odkryj zlecenia",
    demo:"Projekt przykładowy",live:"Z katalogu IdeaHire",projectList:"Projekty w IdeaHire",
    words:["POMYSŁ.","TALENT.","RAZEM.","IdeaHire.","DZIAŁAJ."],
    labels:["Wszystko zaczyna się od pomysłu.","Potrzebuje tylko właściwej osoby.","Dwie strony. Jedna wspólna energia.","Pomysł i talent znajdują swoje miejsce.","Teraz kolej na Twój projekt."],
    cueLabels:["Pomysł","Talent","Połączenie","IdeaHire","Twój ruch"],
    controls:"Sterowanie pokazem",timeline:"Przebieg pokazu",
    examples:[
      {title:"Tożsamość nowej marki",category:"Grafika i design"},
      {title:"Strona, która robi wrażenie",category:"Strony i aplikacje"},
      {title:"Historia opowiedziana obrazem",category:"Wideo i animacja"},
    ],
  },
  en:{
    region:"IdeaHire — ideas meet talent",eyebrow:"Your idea deserves a next chapter.",
    title:"Your idea.",subtitle:"Made real.",
    description:"Connect your idea with someone's talent. Find a freelancer or a project where you can show what you do best.",
    talent:"Find a freelancer",jobs:"Find a project",
    skip:"Skip intro",replay:"Replay the show",pause:"Pause animation",resume:"Resume animation",
    impulse:"Release an impulse",reset:"Reset the view",reduced:"Reduced animation",static:"Static preview",
    stage:"The three-dimensional IdeaHire mark — idea and talent",
    help:"Drag to rotate the mark. Arrow keys change the view, Home resets it, and Enter releases an impulse. You can still scroll vertically on your phone.",
    interaction:"Drag. Discover a new perspective.",
    signature:"IDEA × TALENT",identity:"TOGETHER ON IDEAHIRE",catalog:"Explore projects",
    demo:"Illustrative project",live:"From the IdeaHire catalog",projectList:"Projects on IdeaHire",
    words:["IDEA.","TALENT.","TOGETHER.","IdeaHire.","CREATE."],
    labels:["It all starts with an idea.","It just needs the right person.","Two sides. One shared energy.","Where ideas and talent come together.","Now it is your project's turn."],
    cueLabels:["Idea","Talent","Connection","IdeaHire","Your move"],
    controls:"Show controls",timeline:"The show",
    examples:[
      {title:"An identity for a new brand",category:"Graphic design"},
      {title:"A website that makes an impression",category:"Websites and apps"},
      {title:"A story told through motion",category:"Video and animation"},
    ],
  },
};
function ih39Reduced(){return typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}
function IH39Icon({kind="arrow"}){
  const paths={
    arrow:"M5 19 19 5M6 5h13v13",pause:"M9 6v12M15 6v12",play:"m8 5 11 7-11 7z",
    replay:"M4 9a8 8 0 1 1 0 6M4 4v5h5",move:"M4 12h16M12 4v16m-5-7-3 3 3 3m10-6 3 3-3 3",
    impulse:"m13 3-8 11h6l-1 7 9-12h-6l1-6z",
    project:"M4 5h16v14H4zM4 9h16M8 5v4",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]||paths.arrow}/></svg>;
}

export function IdeaHireCinematicHero({job,jobs=[],userKey="guest"}){
  const site=useSitePreferences(),text=IH39_COPY[site.language==="en"?"en":"pl"];
  const [reduced,setReduced]=useState(ih39Reduced);
  const [ready,setReady]=useState(()=>IH39_SEEN.has(userKey)||ih39Reduced());
  const [phase,setPhase]=useState(()=>IH39_SEEN.has(userKey)||ih39Reduced()?4:0);
  const [paused,setPaused]=useState(false),[gpu,setGpu]=useState(false),[visible,setVisible]=useState(true);
  const [replayKey,setReplayKey]=useState(0);
  const rootRef=useRef(null),hostRef=useRef(null),canvasRef=useRef(null),engineRef=useRef(null),userRef=useRef(userKey);
  const dragRef=useRef(null),resetTimer=useRef(0);
  const motion=useRef({
    intro:ready?IH39_DURATION:0,time:0,ready,paused:false,reduced,dark:site.theme==="dark",classic:site.template==="classic",
    yaw:0,pitch:0,targetYaw:0,targetPitch:0,impulse:-1,
  });
  const isPublic=item=>!!item?.id&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id));
  const publicJobs=(Array.isArray(jobs)?jobs:[]).filter(isPublic);
  const mainIndex=Math.max(0,publicJobs.findIndex(item=>item.id===job?.id));
  const shown=publicJobs.length?Array.from({length:Math.min(3,publicJobs.length)},(_,index)=>({...publicJobs[(mainIndex+index)%publicJobs.length],real:true})):
    text.examples.map((item,index)=>({...item,id:"example-"+index,real:false}));
  useLayoutEffect(()=>{userRef.current=userKey;},[userKey]);
  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)"),update=()=>setReduced(media.matches);
    media.addEventListener?.("change",update);update();return()=>media.removeEventListener?.("change",update);
  },[]);
  useLayoutEffect(()=>{
    Object.assign(motion.current,{dark:site.theme==="dark",classic:site.template==="classic",paused,reduced});
    if(reduced){
      motion.current.ready=true;motion.current.intro=IH39_DURATION;motion.current.impulse=-1;
      setReady(true);setPhase(4);IH39_SEEN.add(userRef.current);
    }
    engineRef.current?.wake();
  },[site.theme,site.template,paused,reduced]);
  useEffect(()=>{
    const canvas=canvasRef.current,host=hostRef.current;if(!canvas||!host)return undefined;
    const engine=ih39Start(canvas,host,motion,update=>{
      if(update.gpu)setGpu(true);
      if(update.failed){setGpu(false);motion.current.ready=true;setReady(true);setPhase(4);IH39_SEEN.add(userRef.current);}
      if(update.phase!==undefined)setPhase(update.phase);
      if(update.ready){setReady(true);IH39_SEEN.add(userRef.current);}
    });
    engineRef.current=engine;return()=>{engine.destroy();engineRef.current=null;};
  },[]);
  useEffect(()=>{
    const root=rootRef.current;if(!root)return undefined;
    const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(entries=>setVisible(!!entries[0]?.isIntersecting),{rootMargin:"100px"}):null;
    observer?.observe(root);
    const onVisibility=()=>setVisible(!document.hidden&&root.getBoundingClientRect().bottom>0&&root.getBoundingClientRect().top<window.innerHeight+100);
    document.addEventListener("visibilitychange",onVisibility);
    return()=>{observer?.disconnect();document.removeEventListener("visibilitychange",onVisibility);};
  },[]);
  useEffect(()=>()=>window.clearTimeout(resetTimer.current),[]);
  function finish(){
    Object.assign(motion.current,{ready:true,intro:IH39_DURATION,impulse:-1,targetYaw:0,targetPitch:0});
    setReady(true);setPhase(4);IH39_SEEN.add(userRef.current);engineRef.current?.wake();
  }
  function replay(){
    if(reduced||!gpu){finish();return;}
    Object.assign(motion.current,{ready:false,intro:0,time:0,impulse:-1,targetYaw:0,targetPitch:0,yaw:0,pitch:0,paused:false});
    setReady(false);setPhase(0);setPaused(false);setReplayKey(key=>key+1);engineRef.current?.wake();
  }
  function impulse(){
    if(reduced||!gpu||!ready)return;
    if(motion.current.impulse>=0&&motion.current.impulse<.5)return;
    motion.current.impulse=0;motion.current.paused=false;setPaused(false);engineRef.current?.wake();
  }
  function resetView(){
    motion.current.targetYaw=0;motion.current.targetPitch=0;engineRef.current?.wake();
  }
  function setView(yaw,pitch){
    motion.current.targetYaw=Math.max(-.75,Math.min(.75,yaw));
    motion.current.targetPitch=Math.max(-.28,Math.min(.28,pitch));
    engineRef.current?.wake();
  }
  function down(event){
    if(!ready||reduced||!gpu||event.button!==0)return;
    window.clearTimeout(resetTimer.current);
    dragRef.current={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:motion.current.targetYaw,pitch:motion.current.targetPitch};
    event.currentTarget.setAttribute("data-dragging","true");
    try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* System może przejąć gest przewijania. */}
  }
  function move(event){
    if(!ready||reduced||!gpu||paused&&!dragRef.current)return;
    const drag=dragRef.current,rect=event.currentTarget.getBoundingClientRect();
    if(drag&&drag.id===event.pointerId)setView(drag.yaw+(event.clientX-drag.x)*.0045,drag.pitch-(event.clientY-drag.y)*.0018);
    else if(event.pointerType==="mouse"){
      const x=(event.clientX-rect.left)/Math.max(1,rect.width)-.5,y=(event.clientY-rect.top)/Math.max(1,rect.height)-.5;
      setView(x*.27,-y*.15);
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current=window.setTimeout(()=>{if(!dragRef.current)resetView();},1200);
  }
  function up(event){
    if(dragRef.current?.id!==event.pointerId)return;
    dragRef.current=null;event.currentTarget.removeAttribute("data-dragging");
    try{event.currentTarget.releasePointerCapture(event.pointerId);}catch{/* Gest mógł zostać anulowany. */}
  }
  function keys(event){
    if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","Enter"].includes(event.key))return;
    event.preventDefault();
    if(event.key==="Home"){resetView();return;}if(event.key==="Enter"){impulse();return;}
    setView(motion.current.targetYaw+(event.key==="ArrowLeft" ? -.10 : event.key==="ArrowRight" ? .10 : 0),
      motion.current.targetPitch+(event.key==="ArrowUp" ? .06 : event.key==="ArrowDown" ? -.06 : 0));
  }
  const stopped=paused||reduced||!visible;
  return <section ref={rootRef} id="ih39-experience" className="ih39-hero"
    data-cinematic-version="P39-2026-10-15" data-no-translate="true" data-ready={ready} data-act={phase}
    data-dark={site.theme==="dark"} data-classic={site.template==="classic"} data-paused={stopped} data-gpu={gpu}
    aria-label={text.region}>
    <style>{IH39_STYLES}</style>
    <div className="ih39-atmosphere" aria-hidden="true"><div className="ih39-studio-light"/><div className="ih39-studio-grain"/><div className="ih39-floor-line"/></div>
    <div ref={hostRef} className="ih39-stage" tabIndex={ready&&gpu?0:-1} role="group"
      aria-label={text.stage} aria-describedby="ih39-help"
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onLostPointerCapture={()=>{dragRef.current=null;hostRef.current?.removeAttribute("data-dragging");}}
      onPointerLeave={()=>{if(!dragRef.current)resetView();}} onKeyDown={keys}>
      <div className="ih39-static-mark" aria-hidden="true">
        <svg viewBox="0 0 330 280" fill="none">
          <path d="M54 115v123M147 42v196M263 42v196" stroke="currentColor" strokeWidth="32" strokeLinecap="round"/>
          <circle cx="54" cy="60" r="18" className="ih39-static-dot"/><path d="M148 150c44 11 71-19 115-24" className="ih39-static-cross" strokeWidth="31" strokeLinecap="round"/>
        </svg>
      </div>
      <canvas ref={canvasRef} className="ih39-canvas" aria-hidden="true"/>
      <span className="ih39-stage-corner" aria-hidden="true">iH / 01</span>
    </div>
    <div className="ih39-topline">
      <span className="ih39-wordmark"><i aria-hidden="true"/>IDEAHIRE <span>/ {text.signature}</span></span>
      <div className="ih39-controls" role="group" aria-label={text.controls}>
        <button type="button" className="ih39-control" onClick={ready?replay:finish}
          disabled={ready&&(reduced||!gpu)} title={ready?(reduced?text.reduced:!gpu?text.static:text.replay):text.skip}
          aria-label={ready?text.replay:text.skip}><IH39Icon kind={ready?"replay":"arrow"}/>{!ready&&<span>{text.skip}</span>}</button>
        <button type="button" className="ih39-control" onClick={()=>setPaused(value=>!value)} disabled={reduced||!gpu}
          aria-pressed={paused||reduced} title={reduced?text.reduced:paused?text.resume:text.pause}
          aria-label={reduced?text.reduced:paused?text.resume:text.pause}><IH39Icon kind={paused&&!reduced?"play":"pause"}/></button>
        {ready&&<button type="button" className="ih39-control ih39-impulse" onClick={impulse}
          disabled={reduced||!gpu} title={text.impulse} aria-label={text.impulse}><IH39Icon kind="impulse"/><span>{text.impulse}</span></button>}
      </div>
    </div>
    <div className="ih39-kinetic" aria-hidden="true" key={replayKey}>
      <span className="ih39-kinetic-label"><i/>0{phase+1} / {text.identity}</span>
      <div className="ih39-word-frame"><strong className="ih39-kinetic-word" key={phase+site.language}>{text.words[phase]}</strong></div>
      <p className="ih39-kinetic-caption" key={"caption-"+phase+site.language}>{text.labels[phase]}</p>
      <div className="ih39-timecode"><span>0{phase+1}</span><i/><span>05</span></div>
    </div>
    <div className="ih39-copy" aria-hidden={!ready} inert={!ready?"":undefined}>
      <span className="ih39-eyebrow">{text.eyebrow}</span>
      <h1 className="ih39-title"><span>{text.title}</span><span>{text.subtitle}</span></h1>
      <p className="ih39-description">{text.description}</p>
      <div className="ih39-actions">
        <Link className="ih39-cta" tabIndex={ready?0:-1} to="/find-talent">{text.talent}<IH39Icon/></Link>
        <Link className="ih39-cta" tabIndex={ready?0:-1} to="/jobs">{text.jobs}<IH39Icon/></Link>
      </div>
      <span className="ih39-copy-signature"><i aria-hidden="true"/>{text.signature}<i aria-hidden="true"/></span>
    </div>
    <div className="ih39-projects" aria-label={text.projectList} aria-hidden={!ready} inert={!ready?"":undefined} style={{"--ih39-count":shown.length}}>
      {shown.map((item,index)=><Link className="ih39-project" tabIndex={ready?0:-1} to="/jobs" key={index} style={{"--ih39-order":index}} title={String(item.title)}>
        <div className="ih39-project-body" key={String(item.id)+site.language}>
          <span className="ih39-project-top"><i aria-hidden="true"/><span>{item.category}</span><small>{item.real?text.live:text.demo}</small></span>
          <span className="ih39-project-title"><span className="ih39-project-name">{item.title}</span><IH39Icon/></span>
        </div>
      </Link>)}
    </div>
    <p id="ih39-help" className="ih39-sr">{text.help}</p>
    <div className="ih39-bottom">
      <span className="ih39-hint"><IH39Icon kind="move"/>{ready?text.interaction:text.labels[phase]}</span>
      <div className="ih39-progress" role="img" aria-label={text.timeline+" — "+text.cueLabels[phase]}>
        {text.cueLabels.map((label,index)=><i key={index} className={index<=phase?"is-active":""} aria-hidden="true"/>)}
      </div>
      <Link className="ih39-catalog" to="/jobs">{text.catalog}<IH39Icon/></Link>
    </div>
  </section>;
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


