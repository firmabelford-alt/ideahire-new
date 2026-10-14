/* IdeaHire | P36 | 2026-10-14 | Pełny plik: src/App.jsx | Scena startowa 3D */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { CommissionStory, HomeStepCard, IdeaHireLogo, MarketIcon, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences } from "./Preferences";

const HOME_SCENE_VERTEX = `attribute vec2 aPosition;
void main(){gl_Position=vec4(aPosition,0.0,1.0);}`;
const HOME_SCENE_FRAGMENT = `precision highp float;
uniform vec2 uResolution,uRotation;
uniform float uTime,uIntro,uDark,uClassic,uRole,uCompact;
const float PI=3.14159265;
mat2 spin(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float rb(vec3 p,vec3 b,float r){vec3 q=abs(p)-b+r;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r;}
float box2(vec2 p,vec2 b){vec2 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,q.y),0.0);}
vec2 add(vec2 a,vec2 b){return a.x<b.x?a:b;}
vec3 local(vec3 p){p.xz=spin(uRotation.x+0.54+smoothstep(0.0,1.0,uIntro))*p.xz;p.yz=spin(uRotation.y-0.22)*p.yz;return p;}
float mark(vec2 p){
 float i=box2(p+vec2(0.24,0.0),vec2(0.032,0.22));
 i=min(i,box2(p+vec2(0.24,-0.22),vec2(0.09,0.025)));
 i=min(i,box2(p+vec2(0.24,0.22),vec2(0.09,0.025)));
 float h=min(box2(p-vec2(0.12,0.0),vec2(0.029,0.235)),box2(p-vec2(0.35,0.0),vec2(0.029,0.235)));
 return min(i,min(h,box2(p-vec2(0.235,0.0),vec2(0.115,0.026))));
}
vec2 scene(vec3 p){
 vec2 d=vec2(p.y+1.52,0.0);vec3 q=local(p);
 float gap=(1.0-smoothstep(0.14,0.83,uIntro))*1.03,s=0.79+gap;
 vec2 core=vec2(rb(q,vec3(0.55),0.13),1.0);
 float frame=max(rb(q,vec3(0.84),0.10),-rb(q,vec3(0.765),0.08));
 float holes=min(min(max(abs(q.x)-0.68,abs(q.y)-0.68),max(abs(q.x)-0.68,abs(q.z)-0.68)),max(abs(q.y)-0.68,abs(q.z)-0.68));
 core=add(core,vec2(max(frame,-holes),2.0));
 float panels=min(rb(vec3(q.xy,abs(q.z)-s),vec3(0.665,0.665,0.045),0.035),
  min(rb(vec3(q.yz,abs(q.x)-s),vec3(0.665,0.665,0.045),0.035),rb(vec3(q.xz,abs(q.y)-s),vec3(0.665,0.665,0.045),0.035)));
 core=add(core,vec2(panels,3.0));
 float signs=min(max(mark(vec2(q.x*sign(q.z),q.y)),abs(abs(q.z)-(s+0.055))-0.012),max(mark(vec2(-q.z*sign(q.x),q.y)),abs(abs(q.x)-(s+0.055))-0.012));
 core=add(core,vec2(signs,4.0));
 vec3 bolts=vec3(abs(q.xy)-0.535,abs(q.z)-(s+0.052)),sideBolts=vec3(abs(q.zy)-0.535,abs(q.x)-(s+0.052));
 core=add(core,vec2(min(length(vec3(bolts.xy,bolts.z*1.5)),length(vec3(sideBolts.xy,sideBolts.z*1.5)))-0.035,5.0));
 float rail=max(rb(q,vec3(0.88),0.095),-rb(q,vec3(0.867),0.09));
 core=add(core,vec2(max(rail,-holes),4.0));
 vec3 ring=p;ring.yz=spin(0.44)*ring.yz;ring.xz=spin(-0.21)*ring.xz;
 float halo=length(vec2(length(ring.xz)-1.53,ring.y))-0.011;
 halo=max(halo,-sin(atan(ring.z,ring.x)*3.0+uTime*0.26)+0.24);
 core=add(core,vec2(halo,4.0));
 vec3 r2=p;r2.xy=spin(0.93)*r2.xy;
 core=add(core,vec2(length(vec2(length(r2.xz)-1.69,r2.y))-0.006,2.0));
 for(int i=0;i<6;i++){
  float a=float(i)*PI/3.0+uTime*0.105;
  vec3 n=p-vec3(cos(a)*1.56,sin(a*2.0)*0.19,sin(a)*1.56);n.xz=spin(a+0.4)*n.xz;
  core=add(core,vec2(rb(n,vec3(0.062,0.075,0.062),0.017),mod(float(i),2.0)>0.5?4.0:2.0));
 }
 return add(d,core);
}
vec3 accent(){vec3 b=mix(vec3(0.055,0.27,0.90),vec3(0.18,0.58,1.0),uDark);return mix(b,mix(vec3(0.30),vec3(0.83,0.86,0.91),uDark),uClassic);}
vec3 backdrop(vec2 uv){
 vec3 b=mix(vec3(0.941,0.958,0.980),vec3(0.020,0.032,0.061),uDark);
 b=mix(b,mix(vec3(0.953,0.950,0.940),vec3(0.042,0.043,0.045),uDark),uClassic);
 return b+accent()*exp(-dot(uv-vec2(0.26,0.22),uv-vec2(0.26,0.22))*3.0)*mix(0.025,0.032,uDark);
}
void main(){
 vec2 uv=(gl_FragCoord.xy-uResolution*0.5)/min(uResolution.x,uResolution.y);vec3 bg=backdrop(uv);
 uv.y-=mix(0.025,mix(0.16,0.225,uCompact),smoothstep(0.66,1.0,uIntro));uv.x-=mix(0.0,0.045,smoothstep(0.66,1.0,uIntro));
 vec3 ro=vec3(0.0,1.05,mix(9.3,mix(8.0,9.15,uCompact),smoothstep(0.16,0.94,uIntro))),target=vec3(0.0,-0.1,0.0);
 vec3 forward=normalize(target-ro),right=normalize(cross(forward,vec3(0.0,1.0,0.0))),up=cross(right,forward);
 vec3 rd=normalize(forward*1.55+right*uv.x+up*uv.y);float dist=0.0;vec2 hit=vec2(0.0);bool found=false;
 for(int i=0;i<72;i++){hit=scene(ro+rd*dist);if(hit.x<0.0017){found=true;break;}dist+=hit.x*0.82;if(dist>15.0)break;}
 vec3 color=bg;
 if(found){
  vec3 p=ro+rd*dist;vec2 e=vec2(0.002,0.0);
  vec3 n=hit.y<0.5?vec3(0.0,1.0,0.0):normalize(vec3(scene(p+e.xyy).x-hit.x,scene(p+e.yxy).x-hit.x,scene(p+e.yyx).x-hit.x));
  vec3 l=normalize(vec3(-0.6,1.4,2.0)),tint=accent();float dif=max(dot(n,l),0.0),rim=pow(1.0-max(dot(n,-rd),0.0),3.5);
  float spec=pow(max(dot(n,normalize(l-rd)),0.0),45.0),ao=clamp(scene(p+n*0.14).x/0.14,0.22,1.0);
  if(hit.y<0.5){
   color=bg*(1.0-exp(-dot(p.xz,p.xz)*0.82)*mix(0.21,0.44,uDark));
   vec2 grid=abs(fract(p.xz*0.72+0.5)-0.5);
   float lines=1.0-smoothstep(0.003,0.007,min(grid.x,grid.y));
   color=mix(color,tint,lines*exp(-length(p.xz)*0.28)*mix(0.055,0.11,uDark));
   color=mix(color,bg,smoothstep(7.0,14.0,dist));
  }else{
   vec3 base=mix(vec3(0.35,0.42,0.51),vec3(0.21,0.27,0.36),uDark);
   base=mix(base,vec3(dot(base,vec3(0.299,0.587,0.114))),uClassic);
   if(hit.y<1.5)base=mix(vec3(0.035,0.07,0.12),vec3(0.02,0.04,0.07),uClassic);
   if(hit.y>2.5&&hit.y<3.5){
    vec3 q=local(p),an=abs(local(p+n*0.01)-q);
    vec2 face=an.z>=max(an.x,an.y)?q.xy:(an.x>=an.y?q.yz:q.xz);
    float inset=1.0-smoothstep(0.46,0.48,max(abs(face.x),abs(face.y)));
    base=mix(base,base*0.66,inset*0.34);base=mix(base,tint,step(0.970,fract((face.x+face.y*0.28)*18.0))*inset*0.12);
    float c=max(abs(face.x),abs(face.y));base+=tint*smoothstep(0.61,0.616,c)*(1.0-smoothstep(0.623,0.627,c))*0.45;
   }
   color=base*(0.33+dif*0.68)*ao+vec3(spec)*0.85+tint*rim*0.24;
   color+=vec3(0.14,0.19,0.26)*pow(max(dot(n,normalize(vec3(1.0,0.4,-1.0))),0.0),2.0);
   if(hit.y>3.5&&hit.y<4.5)color=tint*(0.72+0.16*sin(uTime*1.3+p.x*2.0)+uRole*0.09)+vec3(0.17)*dif+tint*rim*0.26;
   if(hit.y>4.5)color=vec3(0.09,0.11,0.15)*(0.8+dif)+vec3(spec*0.75);
  }
 }
 gl_FragColor=vec4(pow(max(color,0.0),vec3(0.90)),1.0);
}`;

const HOME_SCENE_STYLES = `
#root#root#root .ihx-hero{--ihx-bg:#f3f6fb;--ihx-fg:#172538;--ihx-muted:#53627a;--ihx-accent:#185bd8;--ihx-line:rgba(30,65,112,.15);--ihx-chip:rgba(248,250,255,.84);--ihx-button:#185bd8;--ihx-button-fg:#fff;position:relative!important;width:min(100% - 40px,860px,max(640px,100svh - 150px))!important;aspect-ratio:1!important;min-height:0!important;margin:34px auto 54px!important;display:block!important;isolation:isolate;overflow:hidden;border:1px solid var(--ihx-line)!important;border-radius:28px!important;background:var(--ihx-bg)!important;color:var(--ihx-fg)!important;box-shadow:0 22px 70px rgba(25,47,88,.07)!important;}
#root#root#root .ihx-hero[data-dark="true"]{--ihx-bg:#090f1c;--ihx-fg:#edf2fb;--ihx-muted:#acb9cf;--ihx-line:rgba(145,180,235,.17);--ihx-chip:rgba(12,21,38,.8);--ihx-accent:#82b4ff;--ihx-button:#c4dcff;--ihx-button-fg:#10264a;box-shadow:0 24px 74px rgba(0,0,0,.2)!important;}
#root#root#root .ihx-hero[data-classic="true"]{--ihx-bg:#f4f3f0;--ihx-fg:#232421;--ihx-muted:#62635c;--ihx-accent:#35362f;--ihx-line:rgba(35,36,33,.14);--ihx-chip:rgba(250,249,246,.85);--ihx-button:#242520;--ihx-button-fg:#fff;}
#root#root#root .ihx-hero[data-classic="true"][data-dark="true"]{--ihx-bg:#111211;--ihx-fg:#f0efe9;--ihx-muted:#b5b6ae;--ihx-accent:#ddded6;--ihx-line:rgba(225,225,215,.16);--ihx-chip:rgba(21,22,20,.86);--ihx-button:#e4e5dc;--ihx-button-fg:#22231f;}
#root#root#root .ihx-hero *,#root#root#root .ihx-hero *::before,#root#root#root .ihx-hero *::after{box-sizing:border-box;}
#root#root#root .ihx-canvas{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;touch-action:pan-y;cursor:grab;opacity:1;transition:opacity .5s ease;z-index:1;}
#root#root#root .ihx-canvas:active{cursor:grabbing;}
#root#root#root .ihx-canvas:focus-visible{outline:2px solid var(--ihx-accent);outline-offset:-4px;}
#root#root#root .ihx-hero[data-gpu="false"] .ihx-canvas{opacity:0;pointer-events:none;}
#root#root#root .ihx-bottom-shade{position:absolute;inset:45% 0 0;z-index:2;pointer-events:none;background:linear-gradient(180deg,transparent 0%,var(--ihx-bg) 81%);opacity:.92;}
#root#root#root .ihx-topline{position:absolute;inset:25px 28px auto;z-index:4;display:flex;justify-content:space-between;align-items:center;gap:16px;}
#root#root#root .ihx-wordmark{display:flex;align-items:center;gap:8px;min-width:0;font-size:12px!important;font-weight:650!important;letter-spacing:.06em!important;color:var(--ihx-muted)!important;line-height:1.3!important;}
#root#root#root .ihx-wordmark svg{width:18px;height:18px;flex:none;stroke:var(--ihx-accent);}
#root#root#root .ihx-controls{display:flex;align-items:center;gap:6px;flex:none;}
#root#root#root .ihx-control{appearance:none!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:6px!important;width:auto!important;min-width:34px!important;height:34px!important;padding:0 9px!important;border:1px solid var(--ihx-line)!important;border-radius:9px!important;background:var(--ihx-chip)!important;backdrop-filter:blur(12px);color:var(--ihx-fg)!important;font:inherit!important;font-size:11px!important;font-weight:550!important;line-height:1!important;cursor:pointer;box-shadow:none!important;transform:none!important;transition:background .2s ease,border-color .2s ease!important;white-space:nowrap;}
#root#root#root .ihx-control svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.65;flex:none;}
#root#root#root .ihx-control:hover{border-color:var(--ihx-accent)!important;}
#root#root#root .ihx-control:focus-visible,#root#root#root .ihx-cta:focus-visible,#root#root#root .ihx-live:focus-visible{outline:2px solid var(--ihx-accent)!important;outline-offset:4px!important;}
#root#root#root .ihx-phase{position:absolute;left:30px;right:30px;bottom:35px;display:flex;align-items:center;justify-content:space-between;gap:18px;z-index:4;transition:opacity .4s ease,transform .4s ease;pointer-events:none;}
#root#root#root .ihx-phase-label{color:var(--ihx-fg)!important;font-size:15px!important;letter-spacing:.04em!important;font-weight:550!important;line-height:1.4!important;}
#root#root#root .ihx-phase-index{margin-right:13px;color:var(--ihx-muted);font-variant-numeric:tabular-nums;font-size:11px!important;}
#root#root#root .ihx-progress{display:flex;gap:5px;width:76px;flex:none;}
#root#root#root .ihx-progress i{height:2px;flex:1;background:var(--ihx-line);border-radius:2px;transition:background .4s ease;}
#root#root#root .ihx-progress i.is-current{background:var(--ihx-accent);}
#root#root#root .ihx-hero[data-ready="true"] .ihx-phase{opacity:0;transform:translateY(8px);}
#root#root#root .ihx-copy{position:absolute;left:36px;right:36px;bottom:35px;z-index:4;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .65s ease,transform .65s cubic-bezier(.2,.7,.2,1);}
#root#root#root .ihx-hero[data-ready="true"] .ihx-copy{opacity:1;transform:none;pointer-events:auto;}
#root#root#root .ihx-eyebrow{margin:0 0 10px!important;display:block!important;font-size:10px!important;font-weight:650!important;letter-spacing:.16em!important;text-transform:uppercase!important;color:var(--ihx-muted)!important;line-height:1.4!important;}
#root#root#root .ihx-title{margin:0!important;padding:0!important;display:block!important;font-size:clamp(25px,3.35vw,43px)!important;font-weight:650!important;letter-spacing:-.045em!important;line-height:1.08!important;color:var(--ihx-fg)!important;max-width:660px!important;text-wrap:balance!important;word-break:normal!important;overflow-wrap:normal!important;}
#root#root#root .ihx-title>span{display:block!important;color:var(--ihx-fg)!important;}
#root#root#root .ihx-title>span:last-child{font-weight:450!important;}
#root#root#root .ihx-description{margin:13px 0 0!important;color:var(--ihx-muted)!important;font-size:13px!important;line-height:1.55!important;max-width:490px!important;}
#root#root#root .ihx-actions{display:flex!important;align-items:stretch!important;gap:10px!important;margin:21px 0 0!important;}
#root#root#root .ihx-cta{display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;min-height:47px!important;min-width:0!important;padding:0 18px!important;border:1px solid var(--ihx-line)!important;border-radius:10px!important;font:inherit!important;font-size:13px!important;font-weight:600!important;text-decoration:none!important;color:var(--ihx-fg)!important;background:var(--ihx-chip)!important;box-shadow:none!important;transform:none!important;transition:background .2s ease,border-color .2s ease!important;line-height:1.25!important;}
#root#root#root .ihx-cta:first-child{background:var(--ihx-button)!important;border-color:var(--ihx-button)!important;color:var(--ihx-button-fg)!important;}
#root#root#root .ihx-cta:hover{border-color:var(--ihx-accent)!important;}
#root#root#root .ihx-cta svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:1.6;transition:transform .2s ease!important;}
#root#root#root .ihx-cta:hover svg{transform:translate(2px,-2px);}
#root#root#root .ihx-explore{position:absolute;z-index:3;right:29px;top:56%;display:flex;align-items:center;gap:7px;color:var(--ihx-muted)!important;font-size:10px!important;letter-spacing:.02em;pointer-events:none;opacity:0;transition:opacity .6s ease;}
#root#root#root .ihx-explore svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.3;}
#root#root#root .ihx-hero[data-ready="true"] .ihx-explore{opacity:.85;}
#root#root#root .ihx-live{position:absolute;z-index:4;left:28px;right:28px;top:58px;display:flex;gap:9px;align-items:center;max-width:430px;color:var(--ihx-muted)!important;text-decoration:none!important;font-size:10px!important;line-height:1.5!important;opacity:0;pointer-events:none;transition:opacity .5s ease;overflow:hidden;}
#root#root#root .ihx-hero[data-ready="true"] .ihx-live{opacity:1;pointer-events:auto;}
#root#root#root .ihx-live i{width:5px;height:5px;border-radius:50%;background:var(--ihx-accent);flex:none;}
#root#root#root .ihx-live>span{white-space:nowrap;flex:none;}
#root#root#root .ihx-live strong{font:inherit!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
#root#root#root .ihx-sr{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important;}
#root#root#root .ihx-fallback{position:absolute;inset:0;z-index:0;perspective:800px;background:radial-gradient(ellipse at 62% 32%,color-mix(in srgb,var(--ihx-accent) 7%,transparent),transparent 65%),var(--ihx-bg);}
#root#root#root .ihx-fallback-cube{position:absolute;left:50%;top:29%;width:150px;height:150px;margin-left:-75px;transform-style:preserve-3d;transform:rotateX(-18deg) rotateY(28deg);animation:ihx-turn 32s linear infinite;}
#root#root#root .ihx-face{position:absolute;inset:0;display:grid;place-items:center;border:1px solid var(--ihx-line);border-radius:15px;background:linear-gradient(135deg,var(--ihx-chip),var(--ihx-bg));color:var(--ihx-accent);font-size:32px;font-weight:600;backface-visibility:hidden;box-shadow:inset 0 0 0 9px var(--ihx-bg),inset 0 0 0 10px var(--ihx-line);}
#root#root#root .ihx-face:nth-child(1){transform:translateZ(75px);}#root#root#root .ihx-face:nth-child(2){transform:rotateY(180deg) translateZ(75px);}
#root#root#root .ihx-face:nth-child(3){transform:rotateY(90deg) translateZ(75px);}#root#root#root .ihx-face:nth-child(4){transform:rotateY(-90deg) translateZ(75px);}
#root#root#root .ihx-face:nth-child(5){transform:rotateX(90deg) translateZ(75px);}#root#root#root .ihx-face:nth-child(6){transform:rotateX(-90deg) translateZ(75px);}
#root#root#root .ihx-hero[data-gpu="true"] .ihx-fallback{visibility:hidden;}
#root#root#root .ihx-hero[data-paused="true"] .ihx-fallback-cube{animation-play-state:paused;}
@keyframes ihx-turn{from{transform:rotateX(-18deg) rotateY(28deg);}to{transform:rotateX(-18deg) rotateY(388deg);}}
@media(max-width:640px){
 #root#root#root .ihx-hero{width:calc(100% - 28px)!important;max-width:560px!important;margin:18px auto 32px!important;border-radius:20px!important;}
 #root#root#root .ihx-topline{inset:17px 18px auto;gap:9px;}
 #root#root#root .ihx-wordmark{font-size:10px!important;letter-spacing:.02em!important;}
 #root#root#root .ihx-wordmark svg{width:16px;height:16px;}
 #root#root#root .ihx-copy{left:23px;right:23px;bottom:23px;}
 #root#root#root .ihx-title{font-size:clamp(24px,6.4vw,34px)!important;max-width:100%!important;}
 #root#root#root .ihx-description{font-size:12px!important;line-height:1.4!important;margin-top:9px!important;}
 #root#root#root .ihx-actions{margin-top:15px!important;gap:8px!important;}
 #root#root#root .ihx-cta{flex:1!important;padding:0 12px!important;gap:7px!important;font-size:12px!important;min-height:44px!important;}
 #root#root#root .ihx-cta svg{width:14px;height:14px;}
 #root#root#root .ihx-eyebrow{font-size:9px!important;margin-bottom:7px!important;letter-spacing:.09em!important;}
 #root#root#root .ihx-phase{left:23px;right:23px;bottom:25px;}
 #root#root#root .ihx-explore{right:22px;top:48%;font-size:9px!important;}
 #root#root#root .ihx-live{left:18px;right:18px;top:48px;font-size:9px!important;}
}
@media(max-width:440px){
 #root#root#root .ihx-hero{width:calc(100% - 20px)!important;border-radius:17px!important;}
 #root#root#root .ihx-topline{inset:13px 14px auto;}
 #root#root#root .ihx-control{height:30px!important;min-width:30px!important;padding:0 6px!important;font-size:10px!important;}
 #root#root#root .ihx-control svg{width:13px;height:13px;}
 #root#root#root .ihx-copy{left:19px;right:19px;bottom:18px;}
 #root#root#root .ihx-description{display:none!important;}
 #root#root#root .ihx-title{font-size:clamp(22px,6.3vw,28px)!important;letter-spacing:-.04em!important;}
 #root#root#root .ihx-actions{margin-top:12px!important;}
 #root#root#root .ihx-cta{font-size:11px!important;padding:0 10px!important;min-height:43px!important;}
 #root#root#root .ihx-explore{top:52%;right:18px;}
 #root#root#root .ihx-live{max-width:250px;}
 #root#root#root .ihx-live strong{display:none!important;}
 #root#root#root .ihx-fallback-cube{width:112px;height:112px;margin-left:-56px;top:24%;}
 #root#root#root .ihx-face:nth-child(1){transform:translateZ(56px);}#root#root#root .ihx-face:nth-child(2){transform:rotateY(180deg) translateZ(56px);}
 #root#root#root .ihx-face:nth-child(3){transform:rotateY(90deg) translateZ(56px);}#root#root#root .ihx-face:nth-child(4){transform:rotateY(-90deg) translateZ(56px);}
 #root#root#root .ihx-face:nth-child(5){transform:rotateX(90deg) translateZ(56px);}#root#root#root .ihx-face:nth-child(6){transform:rotateX(-90deg) translateZ(56px);}
}
@media(prefers-reduced-motion:reduce){#root#root#root .ihx-hero *,#root#root#root .ihx-hero *::before,#root#root#root .ihx-hero *::after{animation:none!important;transition:none!important;}}
@media print{#root#root#root .ihx-canvas,#root#root#root .ihx-controls,#root#root#root .ihx-explore{display:none!important;}#root#root#root .ihx-copy{opacity:1;transform:none;position:relative;padding:24px;}#root#root#root .ihx-hero{aspect-ratio:auto!important;}}
`;

/* IdeaHire P36 — scena startowa bez dodatkowych zaleznosci. */
const HOME_INTRO_SEEN = new Set();
const HOME_INTRO_DURATION = 5.2;
const HOME_SCENE_COPY = {
 pl:{eyebrow:"Od pomysłu do realizacji",title:"Masz pomysł.",subtitle:"Znajdź kogoś, kto go zrealizuje.",
 description:"Połącz swój pomysł z ludźmi, którzy potrafią nadać mu kształt.",
 talent:"Znajdź wykonawcę",jobs:"Znajdź zlecenie",skip:"Pomiń wstęp",replay:"Odtwórz wstęp",
 pause:"Zatrzymaj animację",resume:"Wznów animację",rotate:"Obróć obiekt projektu",
 help:"Przeciągnij, aby obrócić. Możesz też użyć strzałek na klawiaturze. Home przywraca widok.",
 drag:"Przeciągnij i odkryj",live:"Nowe w IdeaHire",browse:"Odkryj aktualne zlecenia",
 phases:["Pomysł","Możliwości","Połączenie","Twój następny krok"],region:"Od pomysłu do współpracy w IdeaHire"},
 en:{eyebrow:"From idea to reality",title:"Have an idea?",subtitle:"Find someone who can bring it to life.",
 description:"Connect your idea with people who can give it shape.",
 talent:"Find a freelancer",jobs:"Find a project",skip:"Skip intro",replay:"Replay intro",
 pause:"Pause animation",resume:"Resume animation",rotate:"Rotate the project object",
 help:"Drag to rotate. You can also use the arrow keys. Home resets the view.",
 drag:"Drag to explore",live:"New on IdeaHire",browse:"Explore current projects",
 phases:["The idea","Possibilities","Connection","Your next step"],region:"From idea to collaboration on IdeaHire"}
};
function homeReducedMotion(){return typeof window!=="undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;}
function startHomeScene(canvas,state,onPhase,onComplete,onFailure,onFirstFrame){
 let gl,program,buffer,vertex,fragment,frame=0,disposed=false,observer,resizeObserver,lastFrame=0,visible=true,sizeDirty=true;
 const listeners=[];
 const listen=(node,type,handler,options)=>{node.addEventListener(type,handler,options);listeners.push(()=>node.removeEventListener(type,handler,options));};
 const destroy=()=>{
  if(disposed)return;disposed=true;cancelAnimationFrame(frame);
  observer?.disconnect();resizeObserver?.disconnect();listeners.forEach(remove=>remove());
  if(gl&&!gl.isContextLost()){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);if(vertex)gl.deleteShader(vertex);if(fragment)gl.deleteShader(fragment);}
 };
 try{
  gl=canvas.getContext("webgl",{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:"low-power"});
  if(!gl||gl.isContextLost())throw new Error("scene_context");
  const shader=(type,source)=>{
   const value=gl.createShader(type);if(!value)throw new Error("scene_shader");
   gl.shaderSource(value,source);gl.compileShader(value);
   if(!gl.getShaderParameter(value,gl.COMPILE_STATUS)){gl.deleteShader(value);throw new Error("scene_shader");}
   return value;
  };
  vertex=shader(gl.VERTEX_SHADER,HOME_SCENE_VERTEX);
  const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
  fragment=shader(gl.FRAGMENT_SHADER,precision?.precision?HOME_SCENE_FRAGMENT:HOME_SCENE_FRAGMENT.replace("precision highp float;","precision mediump float;"));
  program=gl.createProgram();if(!program)throw new Error("scene_program");
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("scene_program");
  gl.useProgram(program);buffer=gl.createBuffer();if(!buffer)throw new Error("scene_buffer");
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,"aPosition");gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(["uResolution","uRotation","uTime","uIntro","uDark","uClassic","uRole","uCompact"].map(key=>[key,gl.getUniformLocation(program,key)]));
  let completed=state.current.intro>=HOME_INTRO_DURATION,previousPhase=-1,previousActive=false,painted=false,renderScale=1,slowFrames=0;
  const schedule=()=>{if(!disposed&&!frame&&visible&&!document.hidden)frame=requestAnimationFrame(draw);};
  function draw(now){
   frame=0;if(disposed||!visible||document.hidden)return;
   const s=state.current,active=!s.paused&&!s.reduced,compact=canvas.clientWidth<520,limit=1000/(compact?24:30);
   if(active&&!s.dirty&&lastFrame&&now-lastFrame<limit){schedule();return;}
   const dt=lastFrame&&previousActive&&active?Math.max(0,(now-lastFrame)/1000):0;lastFrame=now;previousActive=active;
   if(dt>0.085&&active){slowFrames++;}else slowFrames=Math.max(0,slowFrames-1);
   if(slowFrames>=4&&renderScale>0.55){renderScale=Math.max(0.55,renderScale*0.8);sizeDirty=true;slowFrames=0;}
   if(active){s.time+=Math.min(dt,0.12);if(s.intro<HOME_INTRO_DURATION)s.intro+=dt;}
   if(s.reduced)s.intro=HOME_INTRO_DURATION;
   if(sizeDirty){
    const r=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,compact?1.2:1.25);
    const w=Math.max(1,Math.round(Math.min(r.width*ratio,compact?480:780)*renderScale)),h=Math.max(1,Math.round(r.height*(w/Math.max(r.width,1))));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    gl.viewport(0,0,w,h);sizeDirty=false;
   }
   const progress=Math.min(1,s.intro/HOME_INTRO_DURATION);
   gl.uniform2f(uniforms.uResolution,canvas.width,canvas.height);
   gl.uniform2f(uniforms.uRotation,s.yaw+s.time*0.065,s.pitch);
   gl.uniform1f(uniforms.uTime,s.time);gl.uniform1f(uniforms.uIntro,progress);
   gl.uniform1f(uniforms.uDark,s.dark?1:0);gl.uniform1f(uniforms.uClassic,s.classic?1:0);gl.uniform1f(uniforms.uRole,s.role);
   gl.uniform1f(uniforms.uCompact,canvas.clientWidth<520?1:0);
   gl.drawArrays(gl.TRIANGLES,0,3);s.dirty=false;
   if(!painted){painted=true;onFirstFrame();}
   const phase=progress<0.24?0:progress<0.57?1:progress<1?2:3;
   if(phase!==previousPhase){previousPhase=phase;onPhase(phase);}
   if(progress<1)completed=false;
   if(progress>=1&&!completed){completed=true;onComplete();}
   if(active)schedule();
  }
  const resize=()=>{renderScale=1;slowFrames=0;sizeDirty=true;state.current.dirty=true;schedule();};
  if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);}
  else listen(window,"resize",resize);
  if(typeof IntersectionObserver!=="undefined"){
   observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;lastFrame=0;
    if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:"80px"});observer.observe(canvas);
  }
  listen(document,"visibilitychange",()=>{lastFrame=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
  listen(canvas,"webglcontextlost",event=>{event.preventDefault();destroy();onFailure();});
  schedule();return{destroy,wake:()=>{state.current.dirty=true;schedule();}};
 }catch{destroy();onFailure();return{destroy,wake:()=>{}};}
}
function SceneIcon({kind}){
 const paths={mark:"M5 5h4v14H5zM13 5h3v6h3v8h-3v-5h-3z",arrow:"M6 18 18 6M6 6h12v12",
 replay:"M4 9a8 8 0 1 1 0 6M4 4v5h5",pause:"M9 6v12M15 6v12",play:"m8 5 11 7-11 7z",
 move:"M12 3v18M3 12h18m-13-5-5 5 5 5m8-10 5 5-5 5"};
 return <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]||paths.arrow}/></svg>;
}
export function IdeaHireCinematicHero({job,userKey="guest"}){
 const site=useSitePreferences();
 const [reduced,setReduced]=useState(homeReducedMotion);
 const preferences={dark:site.theme==="dark",classic:site.template==="classic",language:site.language==="en"?"en":"pl",reduced};
 const [ready,setReady]=useState(()=>HOME_INTRO_SEEN.has(userKey)||homeReducedMotion());
 const [phase,setPhase]=useState(0),[paused,setPaused]=useState(false),[gpu,setGpu]=useState(false);
 const canvasRef=useRef(null),engineRef=useRef(null),dragRef=useRef(null),keyRef=useRef(userKey);
 const motion=useRef({intro:ready?HOME_INTRO_DURATION:0,time:0,yaw:0,pitch:0.08,role:0,paused:false,
  reduced:preferences.reduced,dark:preferences.dark,classic:preferences.classic,dirty:true});
 const text=HOME_SCENE_COPY[preferences.language];
 const realJob=job?.id&&/^[0-9a-f-]{36}$/i.test(String(job.id))?job:null;
 const complete=()=>{HOME_INTRO_SEEN.add(keyRef.current);setReady(true);setPhase(3);};
 useLayoutEffect(()=>{keyRef.current=userKey;},[userKey]);
 useEffect(()=>{
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  const update=()=>setReduced(media.matches);update();media.addEventListener?.("change",update);
  return()=>{media.removeEventListener?.("change",update);};
 },[]);
 useLayoutEffect(()=>{
  Object.assign(motion.current,{dark:preferences.dark,classic:preferences.classic,reduced:preferences.reduced,paused});
  if(preferences.reduced){motion.current.intro=HOME_INTRO_DURATION;complete();}
  engineRef.current?.wake();
 },[site.theme,site.template,site.language,reduced,paused]);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return undefined;
  const engine=startHomeScene(canvas,motion,setPhase,complete,()=>{setGpu(false);complete();},()=>setGpu(true));
  engineRef.current=engine;return()=>{engine.destroy();engineRef.current=null;};
 },[]);
 const wake=()=>engineRef.current?.wake();
 function skip(){motion.current.intro=HOME_INTRO_DURATION;complete();wake();}
 function replay(){
  if(preferences.reduced||!gpu){skip();return;}
  Object.assign(motion.current,{intro:0,time:0,yaw:0,pitch:0.08});setPaused(false);setPhase(0);setReady(false);wake();
 }
 function pointDown(event){
  if(event.button!==0||!ready)return;dragRef.current={id:event.pointerId,x:event.clientX,y:event.clientY};
  try{event.currentTarget.setPointerCapture(event.pointerId);}catch{/* Gest systemowy moze anulowac dotyk. */}
 }
 function pointMove(event){
  const d=dragRef.current;if(!d||d.id!==event.pointerId)return;
  motion.current.yaw+=(event.clientX-d.x)*0.009;
  motion.current.pitch=Math.max(-1,Math.min(1,motion.current.pitch+(event.clientY-d.y)*0.006));
  d.x=event.clientX;d.y=event.clientY;wake();
 }
 function pointUp(event){
  if(dragRef.current?.id!==event.pointerId)return;dragRef.current=null;
  try{event.currentTarget.releasePointerCapture(event.pointerId);}catch{/* Capture mogl juz wygasnac. */}
 }
 function keyRotate(event){
  if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home"].includes(event.key))return;event.preventDefault();
  if(event.key==="Home"){motion.current.yaw=0;motion.current.pitch=0.08;}
  else if(event.key==="ArrowLeft")motion.current.yaw-=0.16;
  else if(event.key==="ArrowRight")motion.current.yaw+=0.16;
  else motion.current.pitch=Math.max(-1,Math.min(1,motion.current.pitch+(event.key==="ArrowUp"?-0.12:0.12)));
  wake();
 }
 function role(value){motion.current.role=value;wake();}
 return <section className="ihx-hero" data-cinematic-version="P36-2026-10-14" data-no-translate="true"
  data-dark={preferences.dark} data-classic={preferences.classic} data-ready={ready} data-gpu={gpu}
  data-paused={paused||preferences.reduced} aria-label={text.region}>
  <style>{HOME_SCENE_STYLES}</style>
  <div className="ihx-fallback" aria-hidden="true"><div className="ihx-fallback-cube">
   {Array.from({length:6},(_,i)=><div className="ihx-face" key={i}>IH</div>)}</div></div>
  <canvas ref={canvasRef} className="ihx-canvas" role="img" aria-label={text.rotate} aria-describedby="ihx-rotation-help"
   tabIndex={ready&&gpu?0:-1} onPointerDown={pointDown} onPointerMove={pointMove} onPointerUp={pointUp}
   onPointerCancel={pointUp} onLostPointerCapture={()=>{dragRef.current=null;}} onKeyDown={keyRotate}/>
  <p id="ihx-rotation-help" className="ihx-sr">{text.help}</p><div className="ihx-bottom-shade" aria-hidden="true"/>
  <div className="ihx-topline"><span className="ihx-wordmark"><SceneIcon kind="mark"/>IDEAHIRE · STUDIO</span>
   <div className="ihx-controls">
    <button className="ihx-control" type="button" onClick={ready?replay:skip} aria-label={ready?text.replay:text.skip} title={ready?text.replay:text.skip}>
     <SceneIcon kind={ready?"replay":"arrow"}/>{!ready&&<span>{text.skip}</span>}</button>
    <button className="ihx-control" type="button" onClick={()=>setPaused(value=>!value)} aria-label={paused?text.resume:text.pause}
     title={paused?text.resume:text.pause} aria-pressed={paused} disabled={preferences.reduced}><SceneIcon kind={paused?"play":"pause"}/></button>
   </div>
  </div>
  <div className="ihx-phase" aria-hidden="true"><span className="ihx-phase-label"><span className="ihx-phase-index">0{Math.min(phase,2)+1}</span>{text.phases[phase]}</span>
   <span className="ihx-progress">{[0,1,2].map(i=><i className={phase>=i?"is-current":""} key={i}/>)}</span></div>
  <span className="ihx-explore" aria-hidden="true"><SceneIcon kind="move"/>{text.drag}</span>
  <Link className="ihx-live" to="/jobs" tabIndex={ready?0:-1} aria-hidden={!ready} aria-label={text.browse}>
   <i aria-hidden="true"/><span>{realJob?text.live:text.browse}</span>{realJob&&<strong title={realJob.title}>{String(realJob.title||"").slice(0,160)}</strong>}</Link>
  <div className="ihx-copy" inert={!ready?"":undefined} aria-hidden={!ready}>
   <span className="ihx-eyebrow">{text.eyebrow}</span><h1 className="ihx-title"><span>{text.title}</span><span>{text.subtitle}</span></h1>
   <p className="ihx-description">{text.description}</p>
   <div className="ihx-actions">
    <Link className="ihx-cta" to="/find-talent" onPointerEnter={()=>role(1)} onPointerLeave={()=>role(0)} onFocus={()=>role(1)} onBlur={()=>role(0)}>
     {text.talent}<SceneIcon kind="arrow"/></Link>
    <Link className="ihx-cta" to="/jobs" onPointerEnter={()=>role(2)} onPointerLeave={()=>role(0)} onFocus={()=>role(2)} onBlur={()=>role(0)}>
     {text.jobs}<SceneIcon kind="arrow"/></Link>
   </div>
  </div>
 </section>;
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
        <IdeaHireCinematicHero job={activeJob} userKey={session?.user?.id || "guest"} />

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
