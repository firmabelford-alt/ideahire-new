/* IdeaHire | P41.1 | 2026-10-15 | Pełny plik: src/App.jsx | NURT — dopracowane kadry i światło */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { CommissionStory, HomeStepCard, IdeaHireLogo, MarketIcon, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences } from "./Preferences";

const IH41_STYLES=String.raw`
__IH41__ .ih41-hero {--ih41-bg:#050b16;--ih41-ink:#f2f6fd;--ih41-muted:#a9b9d0;--ih41-accent:#9cbfff;--ih41-line:rgba(166,190,227,.23);position:relative!important;isolation:isolate!important;display:block!important;box-sizing:border-box!important;width:100%!important;max-width:none!important;height:clamp(710px,53vw,850px)!important;min-height:710px!important;margin:0 0 44px!important;padding:0!important;border:0!important;border-radius:0!important;overflow:hidden!important;background:var(--ih41-bg)!important;color:var(--ih41-ink)!important;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;text-align:left!important;box-shadow:none!important;}
__IH41__ .ih41-hero[data-classic="true"] {--ih41-bg:#0b0b0b;--ih41-accent:#d5d5d5;--ih41-muted:#b6b6b6;--ih41-ink:#f2f2f2;}
__IH41__ .ih41-hero,__IH41__ .ih41-hero * {box-sizing:border-box!important;}
__IH41__ .ih41-hero :is(h1,p,span,strong,small,button,a) {font-family:inherit!important;-webkit-text-fill-color:currentColor!important;text-shadow:none!important;}
__IH41__ .ih41-hero :where(h1,p) {margin:0!important;}
__IH41__ .ih41-hero button:disabled {opacity:.45!important;cursor:default!important;}
__IH41__ .ih41-stage {position:absolute!important;inset:0!important;z-index:0!important;display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;outline:0!important;touch-action:pan-y;cursor:grab;}
__IH41__ .ih41-stage[data-dragging="true"] {cursor:grabbing;}
__IH41__ .ih41-stage:focus-visible {outline:2px solid var(--ih41-accent)!important;outline-offset:-8px!important;}
__IH41__ .ih41-canvas {position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;border:0!important;margin:0!important;pointer-events:none!important;opacity:0;transition:opacity 500ms ease;}
__IH41__ .ih41-hero[data-gpu="true"] .ih41-canvas {opacity:1;}
__IH41__ .ih41-fallback {position:absolute;inset:0;overflow:hidden;pointer-events:none;background:radial-gradient(ellipse at 70% 42%,color-mix(in srgb,var(--ih41-accent) 14%,transparent),transparent 58%),var(--ih41-bg);}
__IH41__ .ih41-fallback svg {position:absolute;width:135%;height:80%;right:-18%;bottom:-8%;fill:none;stroke:var(--ih41-accent);stroke-width:.8;opacity:.43;transform:perspective(700px) rotateX(34deg) rotateZ(-12deg);}
__IH41__ .ih41-hero[data-gpu="true"] .ih41-fallback {opacity:0;transition:opacity 500ms ease;}
__IH41__ .ih41-shade {position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(4,10,21,.75),rgba(4,10,21,.42) 31%,transparent 66%),linear-gradient(0deg,rgba(4,10,21,.93),transparent 24%,transparent 86%,rgba(4,10,21,.30));}
__IH41__ .ih41-topline {position:absolute;z-index:7;top:28px;left:clamp(25px,5.6vw,100px);right:clamp(25px,4.6vw,84px);display:flex;align-items:center;justify-content:space-between;gap:15px;}
__IH41__ .ih41-wordmark {display:inline-flex;align-items:center;gap:12px;color:var(--ih41-ink)!important;font-size:10px!important;font-weight:600!important;letter-spacing:.15em!important;white-space:nowrap;}
__IH41__ .ih41-wordmark i {display:block;width:5px;height:5px;border-radius:50%;background:var(--ih41-accent);box-shadow:0 0 18px color-mix(in srgb,var(--ih41-accent) 65%,transparent);}
__IH41__ .ih41-wordmark > span {color:var(--ih41-muted);font-size:9px!important;font-weight:400!important;letter-spacing:.10em!important;}
__IH41__ .ih41-controls {display:flex;align-items:center;gap:8px;}
__IH41__ .ih41-control {display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:10px!important;margin:0!important;border:1px solid var(--ih41-line)!important;border-radius:50%!important;box-shadow:none!important;color:var(--ih41-ink)!important;background:rgba(7,17,33,.44)!important;backdrop-filter:blur(15px);cursor:pointer!important;transition:background 180ms,border-color 180ms!important;}
__IH41__ .ih41-control:hover {background:rgba(105,152,230,.15)!important;border-color:var(--ih41-accent)!important;}
__IH41__ .ih41-control svg {display:block!important;width:17px!important;height:17px!important;flex:0 0 17px!important;}
__IH41__ .ih41-control.ih41-skip {border-radius:24px!important;padding:10px 15px!important;font-size:11px!important;line-height:1.3!important;}
__IH41__ .ih41-copy,__IH41__ .ih41-titles {position:absolute;left:clamp(28px,5.6vw,100px);width:min(550px,46%);z-index:4;top:47%;transform:translateY(-50%);pointer-events:none;}
__IH41__ .ih41-copy {opacity:0;visibility:hidden;transition:opacity 800ms ease,translate 1000ms cubic-bezier(.17,.8,.2,1),visibility 800ms;translate:0 18px;}
__IH41__ .ih41-hero[data-ready="true"] .ih41-copy {opacity:1;visibility:visible;translate:0 0;}
__IH41__ .ih41-eyebrow {display:block;margin:0 0 24px!important;color:var(--ih41-muted)!important;font-size:10px!important;font-weight:500!important;letter-spacing:.11em!important;line-height:1.7!important;text-transform:uppercase!important;}
__IH41__ .ih41-title {display:block!important;margin:0!important;padding:0!important;font-size:clamp(57px,6.1vw,97px)!important;font-weight:550!important;line-height:1.025!important;letter-spacing:-.065em!important;color:var(--ih41-ink)!important;}
__IH41__ .ih41-title > span {display:block!important;color:inherit!important;margin:0!important;padding:0!important;}
__IH41__ .ih41-title > span:last-child {color:var(--ih41-accent)!important;}
__IH41__ .ih41-title::before,__IH41__ .ih41-title::after {content:none!important;}
__IH41__ .ih41-description {max-width:395px!important;margin:24px 0 0!important;color:var(--ih41-muted)!important;font-size:14px!important;font-weight:400!important;line-height:1.8!important;}
__IH41__ .ih41-titles {max-width:580px;opacity:1;transition:opacity 600ms,visibility 600ms;}
__IH41__ .ih41-hero[data-ready="true"] .ih41-titles {opacity:0;visibility:hidden;}
__IH41__ .ih41-titles-label {display:flex;align-items:center;gap:10px;margin:0 0 25px!important;color:var(--ih41-muted);font-size:10px!important;letter-spacing:.14em!important;}
__IH41__ .ih41-titles-label i {display:block;width:28px;height:1px;background:var(--ih41-accent);}
__IH41__ .ih41-act-title {display:block;font-size:clamp(61px,6.8vw,108px)!important;font-weight:500!important;line-height:1.02!important;letter-spacing:-.065em!important;color:var(--ih41-ink)!important;white-space:pre-line;animation:ih41-type-in 900ms cubic-bezier(.16,.8,.2,1) both;}
__IH41__ .ih41-act-caption {max-width:335px!important;margin:25px 0 0!important;color:var(--ih41-muted)!important;font-size:14px!important;line-height:1.75!important;animation:ih41-type-in 1100ms cubic-bezier(.16,.8,.2,1) both;}
__IH41__ .ih41-actions {position:absolute;left:clamp(28px,5.6vw,100px);bottom:108px;z-index:5;display:flex;align-items:stretch;gap:10px;max-width:calc(100% - 56px);}
__IH41__ .ih41-cta {display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:21px!important;min-width:0!important;min-height:49px!important;padding:14px 18px!important;margin:0!important;border:1px solid rgba(177,198,232,.30)!important;border-radius:9px!important;background:rgba(10,23,43,.65)!important;color:var(--ih41-ink)!important;box-shadow:none!important;font-size:12px!important;font-weight:500!important;line-height:1.4!important;text-decoration:none!important;backdrop-filter:blur(16px);transition:background 180ms,border-color 180ms!important;}
__IH41__ .ih41-cta:first-child {background:#eef4ff!important;color:#10223d!important;border-color:#eef4ff!important;}
__IH41__ .ih41-cta:hover {background:#18375e!important;border-color:#a8c8ff!important;color:#f5f8ff!important;}
__IH41__ .ih41-hero[data-classic="true"] .ih41-cta:hover {background:#303640!important;border-color:#d0d8e5!important;}
__IH41__ .ih41-cta svg {width:17px!important;height:17px!important;flex:0 0 17px!important;}
__IH41__ .ih41-hero :is(a,button):focus-visible {outline:2px solid var(--ih41-accent)!important;outline-offset:4px!important;}
__IH41__ .ih41-footline {position:absolute;bottom:25px;left:clamp(28px,5.6vw,100px);right:clamp(28px,4.6vw,84px);z-index:5;display:flex;align-items:center;justify-content:space-between;gap:24px;padding-top:18px;border-top:1px solid rgba(172,195,229,.14);}
__IH41__ .ih41-signature {display:block;color:var(--ih41-muted)!important;font-size:9px!important;font-weight:500!important;letter-spacing:.15em!important;white-space:nowrap;}
__IH41__ .ih41-chapters {display:flex;align-items:center;gap:7px;}
__IH41__ .ih41-chapter {position:relative!important;display:grid!important;place-items:center!important;width:44px!important;height:44px!important;min-width:44px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;color:var(--ih41-muted)!important;font-size:9px!important;font-weight:500!important;cursor:pointer!important;}
__IH41__ .ih41-chapter::after {position:absolute;bottom:0;left:8px;right:8px;height:1px;background:var(--ih41-line);content:"";transition:background 200ms;}
__IH41__ .ih41-chapter[aria-current="step"] {color:var(--ih41-ink)!important;}
__IH41__ .ih41-chapter[aria-current="step"]::after {background:var(--ih41-accent);}
__IH41__ .ih41-scene-link {position:absolute;right:clamp(28px,4.6vw,84px);bottom:113px;z-index:5;display:inline-flex!important;align-items:center;gap:10px;max-width:270px;min-height:44px;padding:9px 0!important;text-decoration:none!important;color:var(--ih41-muted)!important;font-size:10px!important;line-height:1.6!important;}
__IH41__ .ih41-scene-link:hover {color:var(--ih41-ink)!important;}
__IH41__ .ih41-scene-link svg {flex:0 0 15px;width:15px;height:15px;}
__IH41__ .ih41-sr {position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;clip-path:inset(50%)!important;overflow:hidden!important;white-space:nowrap!important;border:0!important;}
@keyframes ih41-type-in {from{opacity:0;transform:translate3d(0,25px,0);filter:blur(6px)}to{opacity:1;transform:translate3d(0,0,0);filter:blur(0)}}
@media(min-width:1450px){__IH41__ .ih41-copy,__IH41__ .ih41-titles{width:590px;max-width:44%;}}
@media(max-width:1100px) and (min-width:821px){__IH41__ .ih41-title{font-size:57px!important;}__IH41__ .ih41-act-title{font-size:66px!important;}__IH41__ .ih41-copy,__IH41__ .ih41-titles{width:46%;}__IH41__ .ih41-description{font-size:13px!important;max-width:340px!important;}}
@media(max-width:820px){
 __IH41__ .ih41-hero{height:clamp(680px,calc(100svh - 100px),800px)!important;min-height:680px!important;margin-bottom:30px!important;}
 __IH41__ .ih41-shade{background:linear-gradient(0deg,rgba(4,10,21,.97),rgba(4,10,21,.68) 27%,rgba(4,10,21,.12) 57%,transparent 74%,rgba(4,10,21,.15));}
 __IH41__ .ih41-topline{top:20px;left:22px;right:22px;gap:8px;}
 __IH41__ .ih41-wordmark{font-size:9px!important;gap:8px;letter-spacing:.12em!important;}
 __IH41__ .ih41-wordmark > span{display:none;}
 __IH41__ .ih41-controls{gap:6px;}
 __IH41__ .ih41-control.ih41-skip{padding:10px 12px!important;font-size:10px!important;}
 __IH41__ .ih41-copy,__IH41__ .ih41-titles{top:auto;bottom:184px;left:24px;right:24px;transform:none;width:auto;max-width:510px;}
 __IH41__ .ih41-title{font-size:clamp(43px,8.6vw,66px)!important;letter-spacing:-.06em!important;line-height:1.06!important;}
 __IH41__ .ih41-eyebrow{font-size:8px!important;line-height:1.7!important;letter-spacing:.10em!important;margin-bottom:17px!important;max-width:290px;}
 __IH41__ .ih41-description{font-size:12px!important;line-height:1.75!important;margin-top:17px!important;max-width:350px!important;}
 __IH41__ .ih41-titles{bottom:211px;}
 __IH41__ .ih41-titles-label{font-size:9px!important;margin-bottom:19px!important;}
 __IH41__ .ih41-act-title{font-size:clamp(51px,10vw,76px)!important;line-height:1.01!important;}
 __IH41__ .ih41-act-caption{font-size:12px!important;line-height:1.7!important;max-width:285px!important;margin-top:19px!important;}
 __IH41__ .ih41-actions{left:24px;right:24px;bottom:115px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;max-width:none;}
 __IH41__ .ih41-cta{font-size:11px!important;gap:9px!important;padding:12px!important;min-height:48px!important;border-radius:8px!important;}
 __IH41__ .ih41-scene-link{left:24px;right:auto;bottom:61px;min-height:44px;max-width:calc(100% - 48px);font-size:9px!important;}
 __IH41__ .ih41-footline{bottom:13px;left:24px;right:24px;padding-top:6px;gap:12px;}
 __IH41__ .ih41-signature{font-size:8px!important;letter-spacing:.12em!important;}
 __IH41__ .ih41-chapters{display:none;}
 __IH41__ .ih41-chapter{width:26px!important;min-width:26px!important;height:34px!important;}
 __IH41__ .ih41-chapter::after{left:6px;right:6px;}
}
@media(max-width:360px){__IH41__ .ih41-copy,__IH41__ .ih41-titles,__IH41__ .ih41-actions{left:18px;right:18px;}__IH41__ .ih41-title{font-size:42px!important;}__IH41__ .ih41-cta{font-size:10px!important;padding:11px!important;}}
@media(prefers-reduced-motion:reduce){__IH41__ .ih41-hero *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}}

__IH41__ .ih41-hero[data-paused="true"] *{animation-play-state:paused!important;}

__IH41__ .ih41-hero[data-classic="true"] .ih41-shade{background:linear-gradient(90deg,rgba(6,6,6,.75),rgba(6,6,6,.42) 31%,transparent 66%),linear-gradient(0deg,rgba(6,6,6,.93),transparent 24%,transparent 86%,rgba(6,6,6,.30));}
__IH41__ .ih41-hero[data-classic="true"] .ih41-control{background:rgba(18,18,18,.44)!important;}
__IH41__ .ih41-hero[data-classic="true"] .ih41-control:hover{background:rgba(200,200,200,.15)!important;}
__IH41__ .ih41-hero[data-classic="true"] .ih41-cta{background:rgba(24,24,24,.65)!important;}
__IH41__ .ih41-hero[data-classic="true"] .ih41-cta:first-child{background:#f1f1f1!important;border-color:#f1f1f1!important;color:#191919!important;}
__IH41__ .ih41-hero[data-classic="true"] .ih41-cta:hover{background:#343434!important;color:#f2f2f2!important;}
@media(max-width:820px){__IH41__ .ih41-hero[data-classic="true"] .ih41-shade{background:linear-gradient(0deg,rgba(6,6,6,.97),rgba(6,6,6,.68) 27%,rgba(6,6,6,.12) 57%,transparent 74%,rgba(6,6,6,.15));}}
`.replaceAll("__IH41__", "#root".repeat(10));

/* IdeaHire P41.1 — NURT. Dopracowany kadr, światło i ciągły ruch po finale. */
const IH41_DURATION=20.4;
const IH41_SEEN=new Set();
const IH41_M={
  identity:()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
  mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;},
  move(x,y,z){const m=this.identity();m[12]=x;m[13]=y;m[14]=z;return m;},
  scale(x,y=x,z=x){return new Float32Array([x,0,0,0,0,y,0,0,0,0,z,0,0,0,0,1]);},
  rx(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]);},
  ry(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]);},
  rz(a){const c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]);},
  unit(v){const n=Math.hypot(...v)||1;return v.map(x=>x/n);},
  cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];},
  ease(a,b,t){const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v);},
  lerp:(a,b,t)=>a+(b-a)*t,
  noise(n){const v=Math.sin(n*12.9898+78.233)*43758.5453;return v-Math.floor(v);},
  camera(aspect,eye,target){
    const z=this.unit(eye.map((v,i)=>v-target[i])),x=this.unit(this.cross([0,1,0],z)),y=this.cross(z,x);
    const view=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
      -x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]);
    const f=1/Math.tan(.68/2),near=.1,far=80;
    const projection=new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
    return{matrix:this.mul(projection,view),eye,right:x,up:y,f,aspect};
  },
};

function ih41FitPane(model,camera,compact,index=0){
  const m=IH41_M,out=new Float32Array(model);
  const safe=(compact?[[.15,.85,.14,.40],[.05,.54,.11,.34],[.46,.94,.10,.32]]:[[.55,.95,.17,.79],[.48,.78,.12,.52],[.67,.95,.12,.49]])[index];
  const matrix=m.mul(camera.matrix,out),center=[matrix[12],matrix[13],matrix[15]];
  const corners=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,y])=>[0,1,3].map(r=>matrix[r]*x+matrix[4+r]*y));
  const limits=scale=>{
    let left=-Infinity,right=Infinity,down=-Infinity,up=Infinity;
    for(const p of corners){
      const x=center[0]+p[0]*scale,y=center[1]+p[1]*scale,w=center[2]+p[2]*scale;
      left=Math.max(left,((2*safe[0]-1)*w-x)*camera.aspect/camera.f);
      right=Math.min(right,((2*safe[1]-1)*w-x)*camera.aspect/camera.f);
      down=Math.max(down,((1-2*safe[3])*w-y)/camera.f);
      up=Math.min(up,((1-2*safe[2])*w-y)/camera.f);
    }
    return{left,right,down,up,fits:left<=right&&down<=up};
  };
  let scale=1,range=limits(1);
  if(!range.fits){
    let low=0,high=1;
    for(let pass=0;pass<20;pass++){const mid=(low+high)*.5;if(limits(mid).fits)low=mid;else high=mid;}
    scale=low;range=limits(scale);
  }
  const dx=Math.max(range.left,Math.min(range.right,0)),dy=Math.max(range.down,Math.min(range.up,0));
  for(let c=0;c<3;c++)for(let r=0;r<3;r++)out[c*4+r]*=scale;
  for(let r=0;r<3;r++)out[12+r]+=camera.right[r]*dx+camera.up[r]*dy;
  return out;
}

function ih41Pose(s,dt,compact){
  const m=IH41_M;
  if(!s.paused&&!s.reduced){s.time+=dt;if(!s.ready){s.intro=Math.min(IH41_DURATION,s.intro+dt);if(s.intro>=IH41_DURATION)s.ready=true;}if(s.impulse>=0)s.impulse+=dt;if(s.impulse>4.6)s.impulse=-1;}
  if(s.reduced){s.ready=true;s.intro=IH41_DURATION;s.impulse=-1;}
  const t=s.ready?IH41_DURATION:s.intro,ambient=s.reduced?0:s.time;
  const settle=m.ease(15.8,20.4,t),lift=m.ease(2.1,6.4,t)*(1-m.ease(12.8,18.9,t));
  const rush=m.ease(7.1,10.2,t)*(1-m.ease(12.0,16.5,t));
  const loop=ambient%28,breath=m.ease(4,10,loop)*(1-m.ease(14,21,loop));
  const pulseIntro=m.ease(10.9,12.0,t)*(1-m.ease(13.1,15.8,t));
  const pulseAmbient=s.ready?Math.pow(Math.max(0,Math.sin(ambient*.36)),8)*.22:0;
  const manual=s.impulse>=0?Math.sin(Math.min(1,s.impulse/4.6)*Math.PI):0;
  const pulse=Math.max(pulseIntro,manual,pulseAmbient);
  const damp=s.reduced?1:1-Math.exp(-dt*6);
  s.yaw+=(s.targetYaw-s.yaw)*damp;s.pitch+=(s.targetPitch-s.pitch)*damp;
  if(Math.abs(s.yaw-s.targetYaw)+Math.abs(s.pitch-s.targetPitch)<.0002){s.yaw=s.targetYaw;s.pitch=s.targetPitch;}
  const distance=12.2-rush*3.9+settle*.4;
  const yaw=-.13+Math.sin(ambient*.105)*.075+lift*.19-rush*.23+s.yaw*.5;
  const eye=[Math.sin(yaw)*distance,(compact?5.4:3.5)+lift*1.4-rush*1.9+s.pitch*2,Math.cos(yaw)*distance];
  const target=compact?[.15,.55,-2.5]:[.3,.05,-3.8];
  const phase=t<3.8?0:t<7.6?1:t<11.8?2:t<16.2?3:4;
  return{t,time:ambient,phase,ready:s.ready,lift,rush,pulse,settle,breath,eye,target,compact,
    unfold:Math.min(1,m.ease(.0,3.4,t)+pulse*.25),morph:.25+lift*.65+(s.ready?breath*.15:0),
    cardAlpha:m.ease(2.3,4.4,t),cardSpread:1-lift*.22+pulse*.22};
}

function ih41Geometry(compact=false){
  const m=IH41_M,points=[],lines=[],mesh=[],signals=[],dust=[];
  const nx=compact?156:318,nz=compact?104:208;
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const x=-18+i*36/(nx-1),z=-27+((j*47)%nz)*38/(nz-1);
    points.push(x,z,m.noise(i+j*nx),0);
  }
  for(let j=0;j<(compact?37:87);j++)for(let i=0;i<(compact?170:280);i++){
    const steps=compact?170:280,x=-17+i*34/steps,z=-25+j*(35/(compact?36:86));
    lines.push(x,z,0,0,x+34/steps,z,0,0);
  }
  const cu=compact?118:188,cv=compact?32:52;
  for(let j=0;j<cv;j++)for(let i=0;i<cu;i++)points.push(i/(cu-1),(j*13%cv)/(cv-1),m.noise(i+j*cu),1);
  const rows=compact?34:48,cols=compact?68:96;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const a=[i/cols,j/rows,0,1],b=[(i+1)/cols,j/rows,0,1],c=[(i+1)/cols,(j+1)/rows,0,1],d=[i/cols,(j+1)/rows,0,1];
    mesh.push(...a,...b,...c,...a,...c,...d);
  }
  for(let j=0;j<(compact?34:58);j++)for(let i=0;i<30;i++)signals.push(j/(compact?34:58),i/29,m.noise(j+90),2);
  for(let j=0;j<(compact?130:330);j++)dust.push(m.noise(j+130),m.noise(j+900),m.noise(j+1600),3);
  return{points,lines,mesh,signals,dust};
}

const IH41_FIELD=String.raw`
float heightAt(vec2 q){
 float t=uTime*.34;
 float h=sin(q.x*.67+q.y*.31-t)*.75+sin(q.x*1.43-q.y*.53+t*.77)*.32;
 h+=sin(q.x*2.7+q.y*.39+t*.55)*.085+cos(q.y*.78-t*.6)*.13;
 float river=2.0+1.45*sin(q.y*.24+t*.4);
 h+=exp(-pow((q.x-river)*.52,2.0))*.78;
 float ring=length(q-vec2(1.8,-3.0));
 h+=sin(ring*2.8-uTime*2.0)*exp(-ring*.10)*uPulse*.50;
 return -1.65+h;
}
vec3 field(vec2 q,float kind){
 if(kind<.5)return vec3(q.x,heightAt(q),q.y);
 float a=(q.x-.5)*5.5+sin(q.y*4.0+uTime*.12)*.26;
 float r=2.05+.35*sin(q.y*8.0-uTime*.42);
 vec3 p=vec3(3.0+sin(a)*r,1.2+cos(a)*r*.83,-10.0+q.y*12.0);
 p.x+=sin(q.y*5.0+uTime*.18)*.60;
 p.y+=sin(q.x*12.0-q.y*4.0+uTime*.45)*.16;
 vec3 low=vec3((q.x-.5)*10.0+3.1,heightAt(vec2((q.x-.5)*10.0+3.1,-12.0+q.y*14.0))+.12,-12.0+q.y*14.0);
 return mix(low,p,uMorph);
}
`;
const IH41_FIELD_VERTEX=String.raw`
attribute vec4 aParam;
uniform mat4 uCamera;uniform float uTime,uMorph,uPulse,uRatio,uUnfold;uniform mediump float uMode;
varying float vAlpha,vEnergy,vDepth,vKind;
`+IH41_FIELD+String.raw`
void main(){
 vec3 p;float fade=1.0,energy=0.0;float seed=aParam.z;
 if(aParam.w<1.5){
   p=field(aParam.xy,aParam.w);
   if(aParam.w<.5&&uMode<.5){float eruption=exp(-length(p.xz-vec2(2.0,-4.0))*.18)*uPulse; p+=vec3(sin(seed*174.0)*.9,(.15+seed)*4.4,cos(seed*213.0)*.7)*eruption;}
   float arrival=smoothstep(.0,.8,uUnfold*1.8-.15*seed+.15*sin(aParam.x));
   if(aParam.w>.5)p.y+=sin(aParam.x*12.0+uTime*.2)*(1.0-arrival)*2.5;
   fade=arrival;
   float river=2.0+1.45*sin(p.z*.24+uTime*.136);
   energy=exp(-pow((p.x-river)*.65,2.0))*(.3+.7*pow(max(.0,sin(p.z*.7+uTime*.55)),5.0));
   energy=min(1.0,energy+uPulse*uPulse*exp(-length(p.xz-vec2(2.0,-4.0))*.12)*step(.72,seed)*.72);
   if(aParam.w>.5)energy=.45+.5*sin(aParam.x*8.0+uTime*.25);
 }else if(aParam.w<2.5){
   float f=fract(aParam.x+uTime*(.027+seed*.018)-aParam.y*.037);
   float z=-25.0+f*33.0,x=2.0+1.45*sin(z*.24+uTime*.136)+(seed-.5)*7.5;
   x+=sin(z*.55+seed*24.0)*.20;
   p=vec3(x,heightAt(vec2(x,z))+.025,z);energy=1.0;
   fade=pow(1.0-aParam.y,2.2)*smoothstep(.0,.08,f)*(1.0-smoothstep(.90,1.0,f));
 }else{
   p=vec3((aParam.x-.5)*26.0,fract(aParam.y+uTime*.006)*10.0-2.0,-24.0+aParam.z*29.0);
   energy=.3;fade=.10+.15*sin(seed*300.0+uTime*.3);
 }
 vec4 clip=uCamera*vec4(p,1.0);gl_Position=clip;
 float size=aParam.w>1.5&&aParam.w<2.5?mix(2.0,15.0,pow(1.0-aParam.y,9.0)):(1.15+seed*.8);
 gl_PointSize=clamp(size*uRatio*8.0/max(3.0,clip.w),1.0*uRatio,17.0*uRatio);
 float fog=exp(-max(.0,clip.w-6.0)*.042);
 vAlpha=fade*fog;vEnergy=energy;vDepth=clip.w;vKind=aParam.w;
}`;
const IH41_FIELD_FRAGMENT=String.raw`
uniform mediump float uClassic;
precision mediump float;
uniform vec3 uAccent;uniform float uMode;
varying float vAlpha,vEnergy,vDepth,vKind;
void main(){
 float a=1.0;
 if(uMode<.5){vec2 q=gl_PointCoord-.5;a=1.0-smoothstep(.05,.5,length(q));}
 if(uMode>1.5){float d=length(gl_PointCoord-.5);a=exp(-d*d*19.0);}
 vec3 color=mix(uAccent*.75,mix(uAccent,vec3(.89,.96,1.0),.76),vEnergy);
 float strength=uMode>.5&&uMode<1.5?.53:(vKind>2.5?.56:vKind>1.5?1.0:.84);
 color=mix(color,vec3(dot(color,vec3(.2126,.7152,.0722))),uClassic);gl_FragColor=vec4(color,a*vAlpha*strength);
}`;
const IH41_SURFACE_VERTEX=String.raw`
attribute vec4 aParam;uniform mat4 uCamera;uniform float uTime,uMorph,uPulse;
varying vec3 vNormal,vWorld;varying vec2 vUV;
`+IH41_FIELD+String.raw`
void main(){vec3 p=field(aParam.xy,1.0),a=field(aParam.xy+vec2(.003,0.0),1.0),b=field(aParam.xy+vec2(0.0,.003),1.0);
vNormal=normalize(cross(a-p,b-p));vWorld=p;vUV=aParam.xy;gl_Position=uCamera*vec4(p,1.0);}`;
const IH41_SURFACE_FRAGMENT=String.raw`
uniform mediump float uClassic;
precision mediump float;uniform vec3 uEye,uAccent;uniform float uAlpha,uTime;
varying vec3 vNormal,vWorld;varying vec2 vUV;
void main(){vec3 n=normalize(vNormal),v=normalize(uEye-vWorld);float fresnel=pow(1.0-abs(dot(n,v)),2.6);
float edges=smoothstep(.0,.07,vUV.x)*smoothstep(.0,.07,1.0-vUV.x)*smoothstep(.0,.10,vUV.y)*smoothstep(.0,.10,1.0-vUV.y);
vec3 light=normalize(vec3(-2.0,6.0,2.0)-vWorld);float spec=pow(abs(dot(reflect(-light,n),v)),28.0);
vec3 color=uAccent*(.5+fresnel*.7)+vec3(spec*.8);color=mix(color,vec3(dot(color,vec3(.2126,.7152,.0722))),uClassic);gl_FragColor=vec4(color,(.018+fresnel*.10+spec*.05)*edges*uAlpha);}`;
const IH41_QUAD_VERTEX="attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.0,1.0);}";
const IH41_QUAD_FRAGMENT=String.raw`
uniform mediump float uClassic;
precision mediump float;varying vec2 vUV;uniform float uTime,uAspect,uPulse,uComposite;uniform vec3 uAccent;uniform sampler2D uScene;
float noise(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
 if(uComposite>.5){gl_FragColor=texture2D(uScene,vUV);return;}
 vec2 p=vUV;float horizon=exp(-pow((p.y-.52)*5.0,2.0));
 vec3 color=vec3(.018,.030,.058)+uAccent*.095*horizon;
 float ray=exp(-pow((p.x-.69-.12*sin(p.y*2.0+uTime*.05))*6.0,2.0))*smoothstep(.12,.9,p.y);
 float mist=sin(p.x*9.0+p.y*4.0+uTime*.045)*sin(p.x*4.0-p.y*5.0-uTime*.06)*.5+.5;
 color+=uAccent*(ray*.19+mist*horizon*.052);
 float glow=exp(-dot((p-vec2(.67,.40))*vec2(uAspect,1.0),(p-vec2(.67,.40))*vec2(uAspect,1.0))*9.0);
 color+=uAccent*glow*(.032+uPulse*.12);
 float vignette=(1.0-smoothstep(.16,.92,length((p-.5)*vec2(.95,.8))));color*=.65+vignette*.35;
 color+=(noise(mod(gl_FragCoord.xy,128.0)+mod(uTime,128.0)*.1)-.5)/255.0;color=mix(color,vec3(dot(color,vec3(.2126,.7152,.0722))),uClassic);gl_FragColor=vec4(color,1.0);
}`;
const IH41_PANE_VERTEX=String.raw`
attribute vec2 aPosition;uniform mat4 uCamera,uModel;varying vec2 vUV;varying vec3 vNormal,vWorld;
void main(){vUV=aPosition*.5+.5;vec4 w=uModel*vec4(aPosition,0.0,1.0);vWorld=w.xyz;vNormal=mat3(uModel)*vec3(0.0,0.0,1.0);gl_Position=uCamera*w;}`;
const IH41_PANE_FRAGMENT=String.raw`
uniform mediump float uClassic;
precision mediump float;uniform sampler2D uLabel,uScene;uniform vec2 uResolution;uniform vec3 uEye,uAccent;
uniform float uTime,uAlpha,uRefraction,uIndex;varying vec2 vUV;varying vec3 vNormal,vWorld;
float rounded(vec2 p){vec2 q=abs(p-.5)-vec2(.475);return length(max(q,0.0))+min(max(q.x,q.y),0.0)-.015;}
void main(){
 float d=rounded(vUV);if(d>.001)discard;float mask=1.0-smoothstep(-.002,.001,d);
 vec3 n=normalize(vNormal),v=normalize(uEye-vWorld);float fr=pow(1.0-abs(dot(n,v)),3.0);
 float edge=exp(-abs(d)*420.0),lip=exp(-abs(d+.005)*360.0);
 vec2 coord=gl_FragCoord.xy/uResolution;vec2 offset=(vUV-.5)*(.004+fr*.012)+n.xy*.004;
 vec3 behind=texture2D(uScene,clamp(coord+offset,vec2(.002),vec2(.998))).rgb;
 vec3 tint=mix(vec3(.026,.043,.069),uAccent*.14,.25+uIndex*.12);
 vec3 glass=mix(tint,behind,.66*uRefraction);
 float reflection=exp(-pow((vUV.x*.65+vUV.y-.89-.08*sin(uTime*.10+uIndex))*8.0,2.0));
 glass+=uAccent*reflection*.055+vec3(reflection*.022);
 glass+=mix(uAccent,vec3(.78,.88,1.0),.68)*edge*.56+uAccent*lip*.13;
 vec4 label=texture2D(uLabel,vec2(vUV.x,1.0-vUV.y));
 vec3 color=mix(glass,label.rgb,label.a);color=mix(color,vec3(dot(color,vec3(.2126,.7152,.0722))),uClassic);gl_FragColor=vec4(color,mask*uAlpha);
}`;

function ih41CardTexture(item,index,english,classic){
  const canvas=document.createElement("canvas");canvas.width=768;canvas.height=768;
  const c=canvas.getContext("2d");if(!c)throw new Error("ih41_label");
  c.clearRect(0,0,768,768);const accent=classic?"#d6d9df":"#a8c8ff",muted="#a8b5c8",ink="#f1f5fb";
  c.fillStyle=accent;for(let i=0;i<4;i++)c.fillRect(48+i%2*10,51+Math.floor(i/2)*10,6,6);
  c.fillStyle=ink;c.font="600 21px Inter, sans-serif";c.fillText("IdeaHire",84,71);
  c.fillStyle=muted;c.font="500 14px Inter, sans-serif";c.textAlign="right";c.fillText(String(index+1).padStart(2,"0"),720,69);c.textAlign="left";
  c.strokeStyle="rgba(175,197,230,.20)";c.lineWidth=1;c.beginPath();c.moveTo(48,104);c.lineTo(720,104);c.stroke();
  c.fillStyle=accent;c.font="500 17px Inter, sans-serif";c.fillText(String(item.category||"IdeaHire").slice(0,45),49,154);
  c.fillStyle=ink;c.font="500 49px Inter, sans-serif";
  const words=String(item.title||"IdeaHire").slice(0,180).split(/\s+/),lines=[];let line="";
  for(const word of words){const next=line?line+" "+word:word;if(c.measureText(next).width>650&&line){lines.push(line);line=word;}else line=next;}
  if(line)lines.push(line);
  lines.slice(0,4).forEach((text,i)=>{let t=text;while(c.measureText(t).width>650&&t.length>1)t=t.slice(0,-1);if(i===3&&lines.length>4)t=t.slice(0,-2)+"…";c.fillText(t,48,229+i*60);});
  const baseY=501;
  c.strokeStyle=classic?"rgba(212,215,222,.20)":"rgba(117,161,232,.24)";c.lineWidth=1;
  for(let j=0;j<4;j++){c.beginPath();for(let i=0;i<=70;i++){const x=48+i*9.6,y=baseY+j*16+Math.sin(i*.11+index*1.6+j*.36)*(18+j*5);if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();}
  c.beginPath();c.moveTo(48,642);c.lineTo(720,642);c.stroke();
  c.fillStyle=muted;c.font="400 16px Inter, sans-serif";c.fillText(item.real?(english?"From the IdeaHire catalog":"Z katalogu IdeaHire"):(english?"Illustrative project":"Projekt przykładowy"),48,685);
  c.fillStyle=ink;c.font="500 18px Inter, sans-serif";c.fillText(english?"Idea × talent":"Pomysł × talent",48,719);
  c.strokeStyle=accent;c.lineWidth=2;c.beginPath();c.moveTo(689,708);c.lineTo(712,685);c.moveTo(691,685);c.lineTo(712,685);c.lineTo(712,706);c.stroke();
  return canvas;
}

function ih41Start(canvas,host,state,report){
  let gl,frame=0,last=0,lastDraw=0,disposed=false,visible=true,resizeObserver,observer,dirty=true,compact=false,ratio=1,aspect=1,previousPhase=-1,previousReady=false,first=false;
  const buffers=[],programs=[],shaders=[],textures=[],listeners=[];let frameBuffer,depthBuffer,sceneTexture,fboReady=false,labelKey="",labels=[];
  const listen=(node,type,fn,opts)=>{node.addEventListener(type,fn,opts);listeners.push(()=>node.removeEventListener(type,fn,opts));};
  const destroy=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);frame=0;resizeObserver?.disconnect();observer?.disconnect();listeners.forEach(fn=>fn());
    if(gl&&!gl.isContextLost()){buffers.forEach(b=>gl.deleteBuffer(b));programs.forEach(p=>gl.deleteProgram(p));shaders.forEach(s=>gl.deleteShader(s));textures.forEach(t=>gl.deleteTexture(t));if(frameBuffer)gl.deleteFramebuffer(frameBuffer);if(depthBuffer)gl.deleteRenderbuffer(depthBuffer);}};
  try{
    gl=canvas.getContext("webgl",{alpha:false,antialias:true,depth:true,stencil:false,powerPreference:"low-power"});
    if(!gl||gl.isContextLost())throw new Error("ih41_context");
    const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
    const program=(vs,fs,names,attrs)=>{
      const compile=(type,source)=>{const s=gl.createShader(type);if(!s)throw new Error("ih41_shader");shaders.push(s);gl.shaderSource(s,type===gl.FRAGMENT_SHADER&&!precision?.precision?source.replace("precision highp float;","precision mediump float;"):source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error("ih41_compile");return s;};
      const p=gl.createProgram();if(!p)throw new Error("ih41_program");programs.push(p);gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error("ih41_link");
      return{program:p,uniforms:Object.fromEntries(names.map(n=>[n,gl.getUniformLocation(p,n)])),attributes:attrs.map(([name,size,offset])=>({location:gl.getAttribLocation(p,name),size,offset}))};
    };
    const common=["uCamera","uTime","uMorph","uPulse","uEye","uAccent","uClassic"];
    const fieldProgram=program(IH41_FIELD_VERTEX,IH41_FIELD_FRAGMENT,[...common,"uRatio","uUnfold","uMode"],[["aParam",4,0]]);
    const surfaceProgram=program(IH41_SURFACE_VERTEX,IH41_SURFACE_FRAGMENT,[...common,"uAlpha"],[["aParam",4,0]]);
    const quadProgram=program(IH41_QUAD_VERTEX,IH41_QUAD_FRAGMENT,["uTime","uAspect","uPulse","uComposite","uScene","uAccent","uClassic"],[["aPosition",2,0]]);
    const paneProgram=program(IH41_PANE_VERTEX,IH41_PANE_FRAGMENT,[...common,"uModel","uLabel","uScene","uResolution","uAlpha","uRefraction","uIndex"],[["aPosition",2,0]]);
    const buffer=(data,stride)=>{const b=gl.createBuffer();if(!b)throw new Error("ih41_buffer");buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return{buffer:b,count:data.length/stride,stride:stride*4};};
    compact=window.matchMedia("(max-width: 820px)").matches;
    const geometry=ih41Geometry(compact),points=buffer(geometry.points,4),lines=buffer(geometry.lines,4),surface=buffer(geometry.mesh,4),signals=buffer(geometry.signals,4),dust=buffer(geometry.dust,4),quad=buffer([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1],2);
    const texture=()=>{const t=gl.createTexture();if(!t)throw new Error("ih41_texture");textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;};
    sceneTexture=texture();frameBuffer=gl.createFramebuffer();depthBuffer=gl.createRenderbuffer();
    for(let i=0;i<3;i++)labels.push(texture());
    const updateLabels=()=>{
      const s=state.current,key=JSON.stringify([s.english,s.classic,s.cards]);if(key===labelKey)return;labelKey=key;
      for(let i=0;i<3;i++){const item=s.cards?.[i%s.cards.length]||{title:"IdeaHire",category:""};gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,labels[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,ih41CardTexture(item,i,s.english,s.classic));}
    };
    const resize=()=>{
      const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;
      compact=window.matchMedia("(max-width: 820px)").matches;ratio=Math.min(window.devicePixelRatio||1,compact?1.35:1.5);
      const budget=compact?650000:1700000,pixels=rect.width*rect.height*ratio*ratio;if(pixels>budget)ratio*=Math.sqrt(budget/pixels);
      canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));aspect=canvas.width/canvas.height;gl.viewport(0,0,canvas.width,canvas.height);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sceneTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,canvas.width,canvas.height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      if(frameBuffer&&depthBuffer){gl.bindFramebuffer(gl.FRAMEBUFFER,frameBuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,sceneTexture,0);gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,canvas.width,canvas.height);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthBuffer);fboReady=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;}
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);dirty=false;
    };
    let enabled=[];
    const use=(p,b)=>{enabled.forEach(a=>gl.disableVertexAttribArray(a));enabled=[];gl.useProgram(p.program);gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);p.attributes.forEach(a=>{if(a.location>=0){gl.enableVertexAttribArray(a.location);gl.vertexAttribPointer(a.location,a.size,gl.FLOAT,false,b.stride,a.offset);enabled.push(a.location);}});};
    const uniforms=(p,pose,camera,accent)=>{const u=p.uniforms;if(u.uClassic!=null)gl.uniform1f(u.uClassic,state.current.classic?1:0);if(u.uCamera!=null)gl.uniformMatrix4fv(u.uCamera,false,camera.matrix);if(u.uEye!=null)gl.uniform3fv(u.uEye,camera.eye);if(u.uAccent!=null)gl.uniform3fv(u.uAccent,accent);for(const [name,value]of[["uTime",pose.time],["uMorph",pose.morph],["uPulse",pose.pulse],["uRatio",ratio],["uUnfold",pose.unfold]])if(u[name]!=null)gl.uniform1f(u[name],value);};
    const render=now=>{
      frame=0;if(disposed||!visible||document.hidden)return;
      try{
        if(gl.isContextLost())throw new Error("ih41_lost");
        const s=state.current,interval=compact?1000/30:1000/45;
        if(!s.paused&&!s.reduced&&lastDraw&&now-lastDraw<interval-1){frame=requestAnimationFrame(render);return;}
        const dt=last?Math.min(.075,(now-last)/1000):1/45;last=now;lastDraw=now;
        if(dirty)resize();updateLabels();
        const pose=ih41Pose(s,dt,compact),camera=IH41_M.camera(aspect,pose.eye,pose.target),accent=s.classic?[.65,.65,.65]:[.23,.50,.96];
        if(pose.phase!==previousPhase||pose.ready!==previousReady){previousPhase=pose.phase;previousReady=pose.ready;report({phase:pose.phase,ready:pose.ready});}
        host.style.setProperty("--ih41-progress",String(Math.min(1,pose.t/IH41_DURATION)));
        gl.bindFramebuffer(gl.FRAMEBUFFER,fboReady?frameBuffer:null);gl.clearColor(.007,.013,.027,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.disable(gl.BLEND);
        use(quadProgram,quad);uniforms(quadProgram,pose,camera,accent);gl.uniform1f(quadProgram.uniforms.uAspect,aspect);gl.uniform1f(quadProgram.uniforms.uComposite,0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,labels[0]);gl.uniform1i(quadProgram.uniforms.uScene,0);gl.drawArrays(gl.TRIANGLES,0,quad.count);
        gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
        use(surfaceProgram,surface);uniforms(surfaceProgram,pose,camera,accent);gl.uniform1f(surfaceProgram.uniforms.uAlpha,pose.unfold);gl.drawArrays(gl.TRIANGLES,0,surface.count);
        use(fieldProgram,lines);uniforms(fieldProgram,pose,camera,accent);gl.uniform1f(fieldProgram.uniforms.uMode,1);gl.drawArrays(gl.LINES,0,lines.count);
        use(fieldProgram,points);uniforms(fieldProgram,pose,camera,accent);gl.uniform1f(fieldProgram.uniforms.uMode,0);gl.drawArrays(gl.POINTS,0,points.count);
        use(fieldProgram,dust);uniforms(fieldProgram,pose,camera,accent);gl.uniform1f(fieldProgram.uniforms.uMode,0);gl.drawArrays(gl.POINTS,0,dust.count);
        gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);use(fieldProgram,signals);uniforms(fieldProgram,pose,camera,accent);gl.uniform1f(fieldProgram.uniforms.uMode,2);gl.drawArrays(gl.POINTS,0,signals.count);
        if(fboReady){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);use(quadProgram,quad);uniforms(quadProgram,pose,camera,accent);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sceneTexture);gl.uniform1i(quadProgram.uniforms.uScene,0);gl.uniform1f(quadProgram.uniforms.uAspect,aspect);gl.uniform1f(quadProgram.uniforms.uComposite,1);gl.drawArrays(gl.TRIANGLES,0,quad.count);}
        gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.clear(gl.DEPTH_BUFFER_BIT);
        const m=IH41_M;
        for(const i of [2,1,0]){
          const enter=m.ease(2.3+i*.9,5.8+i*.7,pose.t),orbit=(1-enter)*1.8+pose.rush*.75;
          const positions=compact?[[.30,2.6,-1.4],[-1.2,3.25,-5.2],[1.6,3.9,-8.5]]:[[3.8,.8,-1.2],[1.4,2.5,-6.3],[6.8,3.2,-9.1]];
          const p=positions[i],sway=s.reduced?0:Math.sin(pose.time*.20+i*2.1);
          const x=p[0]+Math.sin(orbit+i*1.3)*orbit*.9+sway*.12,y=p[1]+Math.cos(orbit+i)*orbit*.5+Math.sin(pose.time*.24+i)*.10,z=p[2]-(1-enter)*9+pose.rush*1.7;
          const size=(compact?1.38:1.62)*(i===0?1:1.02);
          const rawModel=m.mul(m.move(x,y,z),m.mul(m.ry((i===0?-.25:i===1?.38:-.25)+sway*.075+orbit*.4),m.mul(m.rx(-.055+Math.sin(pose.time*.13+i)*.025),m.mul(m.rz((i-1)*.045+sway*.018),m.scale(size)))));
          const model=ih41FitPane(rawModel,camera,compact,i);
          use(paneProgram,quad);uniforms(paneProgram,pose,camera,accent);gl.uniformMatrix4fv(paneProgram.uniforms.uModel,false,model);gl.uniform2f(paneProgram.uniforms.uResolution,canvas.width,canvas.height);gl.uniform1f(paneProgram.uniforms.uAlpha,pose.cardAlpha*enter*(i===0?.94:.70));gl.uniform1f(paneProgram.uniforms.uIndex,i);gl.uniform1f(paneProgram.uniforms.uRefraction,fboReady?1:0);
          gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,sceneTexture);gl.uniform1i(paneProgram.uniforms.uScene,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,labels[i]);gl.uniform1i(paneProgram.uniforms.uLabel,1);gl.drawArrays(gl.TRIANGLES,0,quad.count);
        }
        gl.depthMask(true);if(!first){first=true;report({gpu:true});}
        const settling=Math.abs(s.yaw-s.targetYaw)+Math.abs(s.pitch-s.targetPitch)>.0002;
        if(!s.paused&&!s.reduced||settling)frame=requestAnimationFrame(render);
      }catch{destroy();report({failed:true,ready:true});}
    };
    const wake=()=>{if(!disposed&&visible&&!document.hidden&&!frame){last=0;lastDraw=0;frame=requestAnimationFrame(render);}};
    listen(document,"visibilitychange",()=>{last=0;lastDraw=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
    listen(window,"resize",()=>{dirty=true;wake();},{passive:true});
    listen(canvas,"webglcontextlost",event=>{event.preventDefault();destroy();report({failed:true,ready:true});});
    if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(()=>{dirty=true;wake();});resizeObserver.observe(host);}
    if(typeof IntersectionObserver!=="undefined"){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;lastDraw=0;if(!state.current.ready){state.current.ready=true;state.current.intro=IH41_DURATION;report({phase:4,ready:true});}}},{rootMargin:"120px"});observer.observe(host);}
    resize();wake();return{wake,destroy};
  }catch{destroy();report({failed:true,ready:true});return{wake(){},destroy};}
}


const IH41_COPY={
  pl:{region:"IdeaHire — przestrzeń dla Twojego pomysłu",signature:"POMYSŁ × TALENT",eyebrow:"Twój pomysł zasługuje na ciąg dalszy.",title:"Masz pomysł.",subtitle:"Daj mu życie.",description:"Znajdź osobę, która nada mu kształt. Albo projekt, w którym pokażesz, co potrafisz.",talent:"Znajdź wykonawcę",jobs:"Znajdź zlecenie",skip:"Pomiń wstęp",replay:"Odtwórz pokaz",pause:"Zatrzymaj animację",resume:"Wznów animację",impulse:"Porusz przestrzeń",stage:"Interaktywna przestrzeń IdeaHire",help:"Przeciągnij, aby zmienić perspektywę. Strzałki przesuwają kadr, Home przywraca widok, Enter porusza pole światła. Pionowe przewijanie na telefonie pozostaje dostępne.",controls:"Sterowanie sceną",chapters:"Ujęcia pokazu",sceneLink:"Odkryj projekty, od których wszystko się zaczyna",words:["Od iskry.","Do pomysłu.","Do spotkania.","Do czegoś\nwielkiego.","Twój ruch."],labels:["Każdy projekt zaczyna się od jednej myśli.","Nadaj jej kierunek. Pozwól nabrać kształtu.","Twój pomysł. Czyjś talent. Właściwy moment.","To, co osobne, zaczyna tworzyć całość.","Właśnie tutaj zaczyna się ciąg dalszy."],cues:["Iskra","Kierunek","Spotkanie","Impuls","Twój ruch"],examples:[{title:"Tożsamość nowej marki",category:"Grafika i design"},{title:"Strona, która robi wrażenie",category:"Strony i aplikacje"},{title:"Historia opowiedziana obrazem",category:"Wideo i animacja"}]},
  en:{region:"IdeaHire — a space for your idea",signature:"IDEA × TALENT",eyebrow:"Your idea deserves a next chapter.",title:"Your idea.",subtitle:"Made real.",description:"Find someone who can bring it to life. Or find a project where your talent makes a difference.",talent:"Find a freelancer",jobs:"Find a project",skip:"Skip intro",replay:"Replay the show",pause:"Pause animation",resume:"Resume animation",impulse:"Move the space",stage:"Interactive IdeaHire space",help:"Drag to change perspective. Arrow keys move the view, Home resets it and Enter sends a pulse through the field of light. Vertical scrolling remains available on phones.",controls:"Scene controls",chapters:"Show chapters",sceneLink:"Discover the projects where it all begins",words:["From a spark.","To an idea.","To a connection.","To something\nextraordinary.","Your move."],labels:["Every project begins with a single thought.","Give it direction. Let it take shape.","Your idea. Someone's talent. The right moment.","Separate possibilities become something shared.","Your next chapter starts here."],cues:["Spark","Direction","Connection","Impulse","Your move"],examples:[{title:"An identity for a new brand",category:"Graphic design"},{title:"A website that makes an impression",category:"Websites and apps"},{title:"A story told through motion",category:"Video and animation"}]},
};
function ih41Reduced(){return typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}
function IH41Icon({kind="arrow"}){
  const paths={arrow:"M5 19 19 5M6 5h13v13",pause:"M9 6v12M15 6v12",play:"m8 5 11 7-11 7z",replay:"M4 9a8 8 0 1 1 0 6M4 4v5h5",impulse:"M3 12c3-9 6 9 9 0s6 9 9 0"};
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[kind]||paths.arrow}/></svg>;
}

export function IdeaHireCinematicHero({job,jobs=[],userKey="guest"}){
  const site=useSitePreferences(),english=site.language==="en",text=IH41_COPY[english?"en":"pl"];
  const [reduced,setReduced]=useState(ih41Reduced),[ready,setReady]=useState(()=>IH41_SEEN.has(userKey)||ih41Reduced());
  const [phase,setPhase]=useState(()=>IH41_SEEN.has(userKey)||ih41Reduced()?4:0),[paused,setPaused]=useState(false),[gpu,setGpu]=useState(false);
  const rootRef=useRef(null),hostRef=useRef(null),canvasRef=useRef(null),engineRef=useRef(null),userRef=useRef(userKey),drag=useRef(null),returnTimer=useRef(0);
  const publicJobs=(Array.isArray(jobs)?jobs:[]).filter(item=>item?.id&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id)));
  const cards=publicJobs.length?publicJobs.slice(0,3).map(item=>({id:String(item.id),title:String(item.title||"IdeaHire"),category:String(item.category||"IdeaHire"),real:true})):text.examples.map((item,index)=>({...item,id:"example-"+index,real:false}));
  const cardsKey=JSON.stringify(cards);
  const motion=useRef({time:0,intro:ready?IH41_DURATION:0,ready,reduced,paused:false,classic:site.template==="classic",english,cards,yaw:0,pitch:0,targetYaw:0,targetPitch:0,impulse:-1});
  useLayoutEffect(()=>{userRef.current=userKey;},[userKey]);
  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)"),change=()=>setReduced(media.matches);
    media.addEventListener?.("change",change);change();return()=>media.removeEventListener?.("change",change);
  },[]);
  useLayoutEffect(()=>{
    Object.assign(motion.current,{classic:site.template==="classic",english,cards:JSON.parse(cardsKey),paused,reduced});
    if(reduced){Object.assign(motion.current,{ready:true,intro:IH41_DURATION,impulse:-1});setReady(true);setPhase(4);IH41_SEEN.add(userRef.current);}
    engineRef.current?.wake();
  },[site.template,english,cardsKey,paused,reduced]);
  useEffect(()=>{
    const engine=ih41Start(canvasRef.current,hostRef.current,motion,update=>{
      if(update.gpu)setGpu(true);
      if(update.failed){setGpu(false);Object.assign(motion.current,{ready:true,intro:IH41_DURATION});setReady(true);setPhase(4);IH41_SEEN.add(userRef.current);}
      if(update.phase!==undefined)setPhase(update.phase);
      if(update.ready){setReady(true);IH41_SEEN.add(userRef.current);}
    });
    engineRef.current=engine;return()=>{engine.destroy();engineRef.current=null;};
  },[]);
  useEffect(()=>()=>window.clearTimeout(returnTimer.current),[]);
  function finish(){Object.assign(motion.current,{ready:true,intro:IH41_DURATION,impulse:-1});setReady(true);setPhase(4);IH41_SEEN.add(userRef.current);engineRef.current?.wake();}
  function replay(){if(reduced||!gpu)return;Object.assign(motion.current,{time:0,intro:0,ready:false,paused:false,impulse:-1,targetYaw:0,targetPitch:0});setReady(false);setPhase(0);setPaused(false);engineRef.current?.wake();}
  function impulse(){if(reduced||!gpu)return;motion.current.impulse=0;motion.current.paused=false;setPaused(false);engineRef.current?.wake();}
  function reset(){motion.current.targetYaw=0;motion.current.targetPitch=0;engineRef.current?.wake();}
  function view(yaw,pitch){motion.current.targetYaw=Math.max(-.48,Math.min(.48,yaw));motion.current.targetPitch=Math.max(-.26,Math.min(.26,pitch));engineRef.current?.wake();}
  function down(event){
    if(reduced||!gpu||event.button!==0)return;window.clearTimeout(returnTimer.current);
    drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:motion.current.targetYaw,pitch:motion.current.targetPitch};
    event.currentTarget.setAttribute("data-dragging","true");try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* System może przejąć pionowe przewijanie. */}
  }
  function move(event){
    if(reduced||!gpu)return;const d=drag.current;
    if(d&&d.id===event.pointerId)view(d.yaw+(event.clientX-d.x)*.0035,d.pitch-(event.clientY-d.y)*.0017);
    else if(event.pointerType==="mouse"&&!paused){const rect=event.currentTarget.getBoundingClientRect();view(((event.clientX-rect.left)/Math.max(1,rect.width)-.5)*.20,-((event.clientY-rect.top)/Math.max(1,rect.height)-.5)*.12);}
    window.clearTimeout(returnTimer.current);returnTimer.current=window.setTimeout(()=>{if(!drag.current)reset();},1400);
  }
  function up(event){if(drag.current?.id!==event.pointerId)return;drag.current=null;event.currentTarget.removeAttribute("data-dragging");try{event.currentTarget.releasePointerCapture(event.pointerId);}catch{/* Gest mógł być anulowany. */}window.clearTimeout(returnTimer.current);returnTimer.current=window.setTimeout(reset,1400);}
  function keys(event){if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","Enter"].includes(event.key))return;event.preventDefault();if(event.key==="Home")return reset();if(event.key==="Enter")return impulse();view(motion.current.targetYaw+(event.key==="ArrowLeft"?-.08:event.key==="ArrowRight"?.08:0),motion.current.targetPitch+(event.key==="ArrowUp"?.05:event.key==="ArrowDown"?-.05:0));}
  function chapter(index){if(reduced||!gpu)return;const start=[0,3.8,7.6,11.8,16.2][index];Object.assign(motion.current,{intro:start,time:start,ready:false,paused:false,impulse:-1});setReady(false);setPhase(index);setPaused(false);engineRef.current?.wake();}
  return <section ref={rootRef} className="ih41-hero" id="ih41-experience" data-cinematic-version="P41.1-NURT-2026-10-15" data-ready={ready} data-paused={paused||reduced} data-gpu={gpu} data-classic={site.template==="classic"} data-no-translate="true" aria-label={text.region}>
    <style>{IH41_STYLES}</style>
    <div ref={hostRef} className="ih41-stage" role="group" tabIndex={gpu&&!reduced?0:-1} aria-label={text.stage} aria-describedby="ih41-help" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={()=>{drag.current=null;hostRef.current?.removeAttribute("data-dragging");}} onPointerLeave={()=>{if(!drag.current)reset();}} onKeyDown={keys}>
      <div className="ih41-fallback" aria-hidden="true"><svg viewBox="0 0 1000 650" preserveAspectRatio="none">{Array.from({length:36},(_,row)=><path key={row} d={Array.from({length:111},(_,i)=>{const x=i*10,y=255+row*8+Math.sin(i*.065+row*.12)*57+Math.cos(i*.12-row*.09)*23;return`${i?"L":"M"}${x.toFixed(1)} ${y.toFixed(1)}`;}).join(" ")}/>)}</svg></div>
      <canvas ref={canvasRef} className="ih41-canvas" aria-hidden="true"/>
    </div>
    <div className="ih41-shade" aria-hidden="true"/>
    <div className="ih41-topline">
      <span className="ih41-wordmark"><i aria-hidden="true"/>IDEAHIRE <span>/ {text.signature}</span></span>
      <div className="ih41-controls" role="group" aria-label={text.controls}>
        <button className={`ih41-control${!ready?" ih41-skip":""}`} type="button" onClick={ready?replay:finish} disabled={ready&&(reduced||!gpu)} aria-label={ready?text.replay:text.skip} title={ready?text.replay:text.skip}><IH41Icon kind={ready?"replay":"arrow"}/>{!ready&&<span>{text.skip}</span>}</button>
        <button className="ih41-control" type="button" onClick={()=>setPaused(value=>!value)} disabled={reduced||!gpu} aria-pressed={paused||reduced} aria-label={paused?text.resume:text.pause} title={paused?text.resume:text.pause}><IH41Icon kind={paused?"play":"pause"}/></button>
        {ready&&<button className="ih41-control" type="button" onClick={impulse} disabled={reduced||!gpu} aria-label={text.impulse} title={text.impulse}><IH41Icon kind="impulse"/></button>}
      </div>
    </div>
    <div className="ih41-titles" aria-hidden="true"><span className="ih41-titles-label"><i/>{text.cues[phase]}</span><strong className="ih41-act-title" key={phase+site.language}>{text.words[phase]}</strong><p className="ih41-act-caption" key={"caption-"+phase+site.language}>{text.labels[phase]}</p></div>
    <div className="ih41-copy" aria-hidden={!ready}><span className="ih41-eyebrow">{text.eyebrow}</span><h1 className="ih41-title"><span>{text.title}</span><span>{text.subtitle}</span></h1><p className="ih41-description">{text.description}</p></div>
    <div className="ih41-actions"><Link className="ih41-cta" to="/find-talent">{text.talent}<IH41Icon/></Link><Link className="ih41-cta" to="/jobs">{text.jobs}<IH41Icon/></Link></div>
    <Link className="ih41-scene-link" to="/jobs">{text.sceneLink}<IH41Icon/></Link>
    <div className="ih41-footline"><span className="ih41-signature">{text.signature}</span><nav className="ih41-chapters" aria-label={text.chapters}>{text.cues.map((cue,index)=><button key={index} type="button" className="ih41-chapter" disabled={reduced||!gpu} onClick={()=>chapter(index)} aria-current={index===phase?"step":undefined} aria-label={`${index+1}. ${cue}`} title={cue}>{String(index+1).padStart(2,"0")}</button>)}</nav></div>
    <p id="ih41-help" className="ih41-sr">{text.help}</p>
  </section>;
}


/* P40: jeden nagłówek w DOM; przewijanie zabiera cały pas, bezruch odsyła go na górę. */
const IH40_HEADER_STYLES = String.raw`
__IH40__ .ih40-header-slot {display:flow-root!important;position:relative!important;width:100%!important;min-width:0!important;overflow:visible!important;}
__IH40__ .ih40-header-slot > .ih-home-header {position:relative!important;inset:auto!important;translate:0 0!important;}
__IH40__ .ih40-header-slot .home-nav-links {translate:0 0!important;}
@media(prefers-reduced-motion:reduce){__IH40__ .ih40-header-slot > .ih-home-header{transition:none!important;}}
`.replaceAll("__IH40__", "#root".repeat(10));

function useIdeaHireScrollHeader(headerRef, slotRef) {
  useLayoutEffect(() => {
    const header = headerRef.current, slot = slotRef.current;
    if (!header || !slot) return undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const properties = ["position","top","right","bottom","left","width","max-width","margin","z-index","opacity","translate","transition","pointer-events","box-shadow"];
    const saved = properties.map(name => [name,header.style.getPropertyValue(name),header.style.getPropertyPriority(name)]);
    const originalInert = header.hasAttribute("inert");
    let mode = "home", idle = 0, returning = 0, frame = 0, hovering = false, focused = false, disposed = false, insetLeft = 0, insetRight = 0;
    const set = (name,value) => header.style.setProperty(name,value,"important");
    const hold = () => hovering || focused || Boolean(header.querySelector('[aria-expanded="true"]'));
    function restore() {
      window.clearTimeout(idle); window.clearTimeout(returning); idle = 0; returning = 0;
      mode = "home";
      saved.forEach(([name,value,priority]) => value ? header.style.setProperty(name,value,priority) : header.style.removeProperty(name));
      slot.style.removeProperty("height");
      if (!originalInert) header.removeAttribute("inert");
      header.dataset.scrollHeader = "home";
    }
    function rest() {
      window.clearTimeout(idle); idle = 0;
      if (mode !== "following" || hold()) return;
      mode = "returning"; header.dataset.scrollHeader = "returning";
      set("opacity","0"); set("translate",reduced.matches ? "0 0" : "0 -12px"); set("pointer-events","none");
      header.setAttribute("inert","");
      returning = window.setTimeout(restore,reduced.matches ? 0 : 230);
    }
    function arm() {
      window.clearTimeout(idle);
      if (mode === "following" && !hold()) idle = window.setTimeout(rest,1200);
    }
    function follow() {
      if (disposed) return;
      const box = slot.getBoundingClientRect();
      const beyond = box.bottom < -12;
      if (!beyond) { restore(); return; }
      if (mode === "home") {
        const headerBox = header.getBoundingClientRect();
        insetLeft = headerBox.left - box.left; insetRight = box.right - headerBox.right;
        slot.style.setProperty("height",`${box.height}px`,"important");
        set("position","fixed"); set("top","0px"); set("right","auto"); set("bottom","auto");
        set("left",`${headerBox.left}px`); set("width",`${headerBox.width}px`); set("max-width","none"); set("margin","0");
        set("z-index","500"); set("box-shadow","0 10px 32px rgba(8,16,30,.12)");
        set("transition",reduced.matches ? "none" : "opacity 210ms ease, translate 230ms cubic-bezier(.2,.75,.3,1)");
      }
      window.clearTimeout(returning); returning = 0;
      if (!originalInert) header.removeAttribute("inert");
      mode = "following"; header.dataset.scrollHeader = "following";
      set("opacity","1"); set("translate","0 0"); set("pointer-events","auto"); arm();
    }
    const scroll = () => { if (!frame) frame = window.requestAnimationFrame(() => {frame = 0; follow();}); };
    const enter = event => {if(event.pointerType === "mouse"){hovering = true;window.clearTimeout(idle);}};
    const leave = () => {hovering = false;arm();};
    const focus = () => {focused = true;window.clearTimeout(idle);if(mode === "returning") follow();};
    const blur = event => {if(header.contains(event.relatedTarget)) return;focused = false;arm();};
    const pointer = event => {if(mode === "following" && event.pointerType === "mouse" && !event.buttons) arm();};
    const resize = () => {
      if (mode === "home") return;
      if (!hold()) {restore();return;}
      const box = slot.getBoundingClientRect();set("left",`${box.left + insetLeft}px`);set("width",`${Math.max(0,box.width - insetLeft - insetRight)}px`);
    };
    const hidden = () => {if(document.hidden) restore();};
    const lost = () => {hovering = false;focused = false;arm();};
    const settings = () => {if(mode === "following") set("transition",reduced.matches ? "none" : "opacity 210ms ease, translate 230ms cubic-bezier(.2,.75,.3,1)");};
    const observer = typeof MutationObserver !== "undefined" ? new MutationObserver(arm) : null;
    observer?.observe(header,{subtree:true,attributes:true,attributeFilter:["aria-expanded","data-mobile-menu-open"]});
    header.dataset.scrollHeader = "home";
    window.addEventListener("scroll",scroll,{passive:true});window.addEventListener("resize",resize,{passive:true});window.addEventListener("blur",lost);
    document.addEventListener("pointermove",pointer,{passive:true});document.addEventListener("visibilitychange",hidden);
    header.addEventListener("pointerenter",enter);header.addEventListener("pointerleave",leave);header.addEventListener("focusin",focus);header.addEventListener("focusout",blur);
    reduced.addEventListener?.("change",settings);
    return () => {
      disposed = true;window.cancelAnimationFrame(frame);restore();observer?.disconnect();delete header.dataset.scrollHeader;
      window.removeEventListener("scroll",scroll);window.removeEventListener("resize",resize);window.removeEventListener("blur",lost);
      document.removeEventListener("pointermove",pointer);document.removeEventListener("visibilitychange",hidden);
      header.removeEventListener("pointerenter",enter);header.removeEventListener("pointerleave",leave);header.removeEventListener("focusin",focus);header.removeEventListener("focusout",blur);
      reduced.removeEventListener?.("change",settings);
    };
  },[headerRef,slotRef]);
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
  const headerSlotRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const navigationRef = useRef(null);
  useIdeaHireScrollHeader(headerRef, headerSlotRef);

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
      <style>{IH40_HEADER_STYLES}</style>
      <div ref={headerSlotRef} className="ih40-header-slot">
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
      </div>

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


