/* IdeaHire | P58 | Katalog specjalizacji, spokojne tło, pełne przyciski i film bez dolnego panelu | Pełny plik src/App.jsx */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as IH57React from "react";
import * as IH57JSX from "react/jsx-runtime";
import { createPortal } from "react-dom";
import "./App.css";
import { IDEA_HIRE_PUBLIC_OFFER, MarketIcon, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences, translateUiText, IDEA_HIRE_VISUAL_SYSTEM } from "./Preferences";

const IH43_STYLES=String.raw`
__IH43__ .ih43-film {--ih43-pad:28px;--ih43-bottom:101px;--ih43-button:226px;--ih43-gap:12px;--ih43-toolbar:calc(100% - 176px);position:relative!important;isolation:isolate!important;display:block!important;width:100%!important;max-width:none!important;height:clamp(710px,53vw,850px)!important;min-height:710px!important;margin:0 0 44px!important;padding:0!important;overflow:hidden!important;border:0!important;border-radius:0!important;background:#141313!important;color:#eee9df!important;font-family:Inter,Arial,sans-serif!important;text-align:left!important;box-shadow:none!important;}
__IH43__ .ih43-film,__IH43__ .ih43-film * {box-sizing:border-box!important;}
__IH43__ .ih43-film[data-classic="true"] {background:#121212!important;color:#efefec!important;}
__IH43__ .ih43-canvas {position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;opacity:0;pointer-events:none!important;}
__IH43__ .ih43-film[data-ready="true"] .ih43-canvas {opacity:1;}
__IH43__ .ih43-film[data-failed="true"] .ih43-canvas {display:none!important;}
__IH43__ .ih43-hit {position:absolute!important;z-index:3!important;display:block!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;background:transparent!important;background-image:none!important;color:transparent!important;-webkit-text-fill-color:transparent!important;border:0!important;border-radius:8px!important;box-shadow:none!important;text-shadow:none!important;text-decoration:none!important;transform:none!important;transition:none!important;animation:none!important;cursor:pointer!important;touch-action:manipulation;}
__IH43__ .ih43-hit::before,__IH43__ .ih43-hit::after {content:none!important;}
__IH43__ .ih43-hit:focus-visible {outline:2px solid #fff!important;outline-offset:4px!important;box-shadow:0 0 0 7px #111!important;}
__IH43__ .ih43-hit:disabled {cursor:default!important;}
__IH43__ .ih43-control {left:calc(var(--ih43-toolbar) + var(--ih43-index) * 52px)!important;top:22px!important;width:44px!important;height:44px!important;border-radius:50%!important;}
__IH43__ .ih43-link {left:calc(var(--ih43-pad) + var(--ih43-index) * (var(--ih43-button) + var(--ih43-gap)))!important;bottom:calc(var(--ih43-bottom) - 52px)!important;width:var(--ih43-button)!important;height:52px!important;}
__IH43__ .ih43-accessible,__IH43__ .ih43-link-label {position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-accessible {top:18%!important;left:var(--ih43-pad)!important;width:calc(100% - var(--ih43-pad) * 2)!important;height:auto!important;margin:0!important;overflow:visible!important;clip:auto!important;clip-path:none!important;white-space:normal!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-accessible h1 {margin:0 0 25px!important;padding:0!important;font-size:clamp(42px,7vw,102px)!important;font-weight:800!important;line-height:1.05!important;letter-spacing:-.05em!important;color:inherit!important;-webkit-text-fill-color:currentColor!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-accessible p {max-width:600px!important;margin:0 0 15px!important;font-size:14px!important;line-height:1.6!important;color:inherit!important;-webkit-text-fill-color:currentColor!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-control {display:none!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-link {display:flex!important;align-items:center!important;justify-content:center!important;background:#f4f0e5!important;border:1px solid #171717!important;color:#171717!important;-webkit-text-fill-color:#171717!important;}
__IH43__ .ih43-film[data-failed="true"] .ih43-link-label {position:static!important;width:auto!important;height:auto!important;margin:0!important;padding:8px!important;overflow:visible!important;clip:auto!important;clip-path:none!important;white-space:normal!important;font-size:12px!important;font-weight:700!important;line-height:1.4!important;text-align:center!important;}
@media(max-width:820px){__IH43__ .ih43-film {--ih43-pad:20px;--ih43-gap:10px;--ih43-button:calc((100% - 50px) / 2);--ih43-toolbar:calc(100% - 168px);height:min(820px,max(680px,calc(100svh - 96px)))!important;min-height:680px!important;margin-bottom:30px!important;}}
`.replaceAll("__IH43__","#root".repeat(10));

const IH43_FILM={
  "key": "01-Ciecie",
  "name": "Cięcie",
  "genre": "cut",
  "period": 44,
  "palette": {
    "paper": "#eee9df",
    "ink": "#141313",
    "accent": "#ed3625",
    "secondary": "#c8c0ac",
    "light": "#ffffff",
    "muted": "#827a70"
  },
  "shots": [
    {
      "kind": "type",
      "duration": 1.6,
      "bg": "ink",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 2,
      "bg": "accent",
      "motion": "side"
    },
    {
      "kind": "brief",
      "duration": 3.8,
      "bg": "ink",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 1.8,
      "bg": "paper",
      "motion": "side"
    },
    {
      "kind": "services",
      "duration": 3.2,
      "bg": "accent",
      "motion": "slam"
    },
    {
      "kind": "fee",
      "duration": 4.8,
      "bg": "paper",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 1.8,
      "bg": "ink",
      "motion": "letters"
    },
    {
      "kind": "type",
      "duration": 1.4,
      "bg": "paper",
      "motion": "side"
    },
    {
      "kind": "dialogue",
      "duration": 3.4,
      "bg": "accent",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 1.5,
      "bg": "ink",
      "motion": "slam"
    },
    {
      "kind": "terms",
      "duration": 3.8,
      "bg": "accent",
      "motion": "slam"
    },
    {
      "kind": "type",
      "duration": 2,
      "bg": "paper",
      "motion": "side"
    },
    {
      "kind": "pair",
      "duration": 4,
      "bg": "ink",
      "motion": "slam"
    },
    {
      "kind": "final",
      "duration": 8.9,
      "bg": "accent",
      "motion": "slam"
    }
  ],
  "pl": {
    "cta": [
      "Potrzebuję wykonawcy",
      "Szukam zlecenia"
    ],
    "subtitle": "Zlecenia i wykonawcy w jednym miejscu.",
    "disclosure": "Prezentacja działania IdeaHire.",
    "endTags": [
      "GRAFIKA",
      "KOD",
      "MONTAŻ"
    ],
    "ui": {
      "panel": "Opis / zakres",
      "project": "Twój projekt",
      "details": [
        "Zakres pracy",
        "Termin",
        "Budżet"
      ],
      "note": "Przykład opisu",
      "fee": "Prowizja IdeaHire",
      "minimum": "min.",
      "maximum": "maks.",
      "limit": "Zlecenia do",
      "payer": "Prowizję płaci wyłącznie zleceniodawca.",
      "thread": "Uzgodnienia",
      "messages": [
        "Proponuję te warunki.",
        "Potwierdzam."
      ],
      "prompt": "Ustalenia przed rozpoczęciem pracy."
    },
    "ctaMobile": [
      "Wykonawcy",
      "Zlecenia"
    ],
    "frames": [
      [
        "TWÓJ",
        "PROJEKT."
      ],
      [
        "WŁAŚCIWE",
        "UMIEJĘTNOŚCI."
      ],
      [
        "OKREŚL",
        "ZAKRES."
      ],
      [
        "OPUBLIKUJ",
        "ZLECENIE."
      ],
      [
        "PROJEKTOWANIE.",
        "PROGRAMOWANIE.",
        "MONTAŻ."
      ],
      [
        "PROWIZJA."
      ],
      [
        "WYBIERZ",
        "WYKONAWCĘ."
      ],
      [
        "UZGODNIJ",
        "SZCZEGÓŁY."
      ],
      [
        "ROZMOWA",
        "O PROJEKCIE."
      ],
      [
        "JASNE",
        "WARUNKI."
      ],
      [
        "ZAKRES.",
        "TERMIN.",
        "WYNAGRODZENIE."
      ],
      [
        "REALIZACJA."
      ],
      [
        "ZLECAJĄCY.",
        "WYKONAWCA.",
        "WSPÓŁPRACA."
      ],
      [
        "Znajdź osobę.",
        "Zrealizuj projekt."
      ]
    ],
    "final": [
      "Znajdź osobę.",
      "Zrealizuj projekt."
    ]
  },
  "en": {
    "cta": [
      "Commission a task",
      "Browse listings"
    ],
    "subtitle": "Projects and professionals in one place.",
    "disclosure": "An introduction to IdeaHire.",
    "endTags": [
      "DESIGN",
      "CODE",
      "EDITING"
    ],
    "ui": {
      "panel": "Description / scope",
      "project": "Your project",
      "details": [
        "Scope of work",
        "Deadline",
        "Budget"
      ],
      "note": "Example brief",
      "fee": "IdeaHire service fee",
      "minimum": "min.",
      "maximum": "max.",
      "limit": "Orders up to",
      "payer": "The fee is paid only by the client.",
      "thread": "Agreement",
      "messages": [
        "I propose these terms.",
        "Confirmed."
      ],
      "prompt": "Agree on the details before work begins."
    },
    "ctaMobile": [
      "Hire talent",
      "Find work"
    ],
    "frames": [
      [
        "YOUR",
        "PROJECT."
      ],
      [
        "THE RIGHT",
        "SKILLS."
      ],
      [
        "DEFINE",
        "THE SCOPE."
      ],
      [
        "PUBLISH",
        "YOUR BRIEF."
      ],
      [
        "DESIGN.",
        "DEVELOPMENT.",
        "EDITING."
      ],
      [
        "THE FEE."
      ],
      [
        "CHOOSE",
        "A PROFESSIONAL."
      ],
      [
        "AGREE",
        "THE DETAILS."
      ],
      [
        "DISCUSS",
        "THE PROJECT."
      ],
      [
        "CLEAR",
        "TERMS."
      ],
      [
        "SCOPE.",
        "TIMING.",
        "PAYMENT."
      ],
      [
        "DELIVERY."
      ],
      [
        "CLIENT.",
        "FREELANCER.",
        "COLLABORATION."
      ],
      [
        "Find the right person.",
        "Complete your project."
      ]
    ],
    "final": [
      "Find the right person.",
      "Complete your project."
    ]
  },
  "paths": [
    "/find-talent",
    "/jobs"
  ],
  "finalStart": 35.1,
  "offer": {
    "percent": 5.5,
    "minimum": 20,
    "maximum": 229,
    "orderLimit": 10000
  }
};

/* IdeaHire P43 — montaż typografii i scen interfejsu. Canvas 2D, bez modeli 3D. */
const IH43={
  clamp:(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),
  mix:(a,b,t)=>a+(b-a)*t,
  ease(t){t=this.clamp(t);return 1-Math.pow(1-t,4);},
  smooth(t){t=this.clamp(t);return t*t*(3-2*t);},
  back(t){t=this.clamp(t);return 1+2.70158*Math.pow(t-1,3)+1.70158*Math.pow(t-1,2);},
  phase(time){
    const cycle=((time%IH43_FILM.period)+IH43_FILM.period)%IH43_FILM.period;
    let start=0;
    for(let i=0;i<IH43_FILM.shots.length;i++){const shot=IH43_FILM.shots[i];if(cycle<start+shot.duration||i===IH43_FILM.shots.length-1)return{shot,index:i,local:cycle-start,start,cycle};start+=shot.duration;}
  },
  layout(w,h){const mobile=w<=820,pad=mobile?20:Math.max(28,Math.min(72,w*.045)),gap=mobile?10:12,buttonWidth=mobile?(w-pad*2-gap)/2:226;
    return{w,h,mobile,pad,x:pad,y:84,cw:w-pad*2,ch:Math.max(250,h-244),bottom:h-101,buttonWidth,gap,toolbarX:w-pad-148,toolbarY:22};
  },
};
const IH43_MEASURE=new Map();
function ih43Contrast(a,b){const lum=s=>{const values=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return values[0]*.2126+values[1]*.7152+values[2]*.0722;},x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function ih43Readable(background,preferred,alternate){if(ih43Contrast(background,preferred)>=4.5)return preferred;if(ih43Contrast(background,alternate)>=4.5)return alternate;return ih43Contrast(background,"#000000")>=ih43Contrast(background,"#ffffff")?"#000000":"#ffffff";}
function ih43Path(c,x,y,w,h,r=12){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();}
function ih43Box(c,x,y,w,h,fill,r=12,stroke=null){ih43Path(c,x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function ih43Text(c,text,x,y,size,color,weight=600,align="left",tracking=0){
  weight=Math.round(weight/100)*100;c.font=weight+" "+size+"px Inter, Arial, sans-serif";c.fillStyle=color;c.textAlign=align;c.textBaseline="alphabetic";
  if(!tracking){c.fillText(String(text),x,y);return;}
  const chars=Array.from(String(text)),width=chars.reduce((s,ch)=>s+c.measureText(ch).width,0)+(chars.length-1)*tracking;
  let offset=align==="center"?-width/2:align==="right"?-width:0;c.textAlign="left";
  for(const ch of chars){c.fillText(ch,x+offset,y);offset+=c.measureText(ch).width+tracking;}
}
function ih43Fit(c,lines,width,height,maxSize=180,weight=900){
  weight=Math.round(weight/100)*100;
  const key=[lines.join("|"),Math.round(width),Math.round(height),maxSize,weight].join(":");if(IH43_MEASURE.has(key))return IH43_MEASURE.get(key);
  let size=Math.min(maxSize,height/(lines.length*.94));c.font=weight+" "+size+"px Inter, Arial, sans-serif";
  const measured=Math.max(1,...lines.map(line=>c.measureText(line).width));size*=Math.min(1,width/measured);
  if(IH43_MEASURE.size>400)IH43_MEASURE.clear();IH43_MEASURE.set(key,size);return size;
}
function ih43Lines(c,lines,box,options={}){
  const {x,y,w,h}=box,weight=options.weight||900,size=ih43Fit(c,lines,w,h,options.max||190,weight),lineHeight=size*.94;
  const block=lines.length*lineHeight,top=y+(h-block)*.5,progress=options.progress??1,mode=options.mode||"rise",color=options.color||"#fff";
  for(let i=0;i<lines.length;i++){
    const reveal=IH43.ease((progress-i*.065)/.78);c.save();c.globalAlpha*=IH43.clamp(reveal*1.6);
    let ox=0,oy=0,angle=0,scale=1;
    if(mode==="slam"){scale=1+(1-reveal)*2.8;angle=(1-reveal)*(i%2?.12:-.10);}
    else if(mode==="side"){ox=(1-reveal)*(i%2?1:-1)*w*1.2;angle=(1-reveal)*.08;}
    else if(mode==="letters"){
      const text=lines[i],chars=Array.from(text);c.font=weight+" "+size+"px Inter, Arial, sans-serif";let offset=0;
      for(let n=0;n<chars.length;n++){const p=IH43.ease((progress-n*.018-i*.04)/.58);c.save();c.translate(x+offset,top+(i+1)*lineHeight+(1-p)*size*.85);c.rotate((1-p)*(n%2?.2:-.2));c.globalAlpha*=p;ih43Text(c,chars[n],0,0,size,color,weight);c.restore();offset+=c.measureText(chars[n]).width;}
      c.restore();continue;
    }else oy=(1-reveal)*size*1.65;
    const align=options.align||"left",anchor=align==="center"?x+w/2:x;
    c.translate(anchor+ox,top+(i+1)*lineHeight+oy);c.rotate(angle);c.scale(scale,scale);ih43Text(c,lines[i],0,0,size,color,weight,align,-size*.045);c.restore();
  }
  return{size,top,bottom:top+block};
}
function ih43Tag(c,text,x,y,colors,angle=0,scale=1){
  c.save();c.translate(x,y);c.rotate(angle);c.scale(scale,scale);c.font="700 15px Inter, Arial, sans-serif";const w=c.measureText(text).width+36;ih43Box(c,-w/2,-20,w,40,colors.fill,5,colors.stroke);const ink=ih43Readable(colors.fill,colors.ink,"#ffffff");ih43Text(c,text,0,5,15,ink,700,"center");c.restore();return w;
}
function ih43Arrow(c,x,y,color,size=14){c.strokeStyle=color;c.lineWidth=1.7;c.lineCap="round";c.beginPath();c.moveTo(x-size*.45,y+size*.45);c.lineTo(x+size*.45,y-size*.45);c.moveTo(x-size*.33,y-size*.45);c.lineTo(x+size*.45,y-size*.45);c.lineTo(x+size*.45,y+size*.33);c.stroke();}
function ih43Panel(c,x,y,w,h,options={}){
  const fill=options.fill||"#f5f0e5",ink=options.ink||"#151515";c.save();c.translate(x,y);c.rotate(options.angle||0);c.scale(options.scale||1,options.scale||1);c.globalAlpha*=options.alpha??1;
  c.shadowColor="rgba(0,0,0,.18)";c.shadowBlur=26;c.shadowOffsetY=10;ih43Box(c,-w/2,-h/2,w,h,fill,10);c.shadowColor="transparent";
  c.strokeStyle=options.line||"rgba(20,20,20,.16)";c.lineWidth=1;c.beginPath();c.moveTo(-w/2+20,-h/2+43);c.lineTo(w/2-20,-h/2+43);c.stroke();
  if(options.label)ih43Text(c,options.label,-w/2+21,-h/2+28,11,ink,600);
  c.fillStyle=ink;for(let i=0;i<3;i++){c.globalAlpha*=.8;c.beginPath();c.arc(w/2-23-i*9,-h/2+24,2,0,Math.PI*2);c.fill();}c.restore();
}
function ih43Palette(classic){const p=IH43_FILM.palette;if(!classic)return p;return{...p,paper:"#efefec",ink:"#121212",accent:"#777777",secondary:"#b0b0ad",light:"#ffffff",muted:"#777777"};}
function ih43Backdrop(c,l,p,shot,time){
  const mode=shot.bg||"ink",bg=mode==="paper"?p.paper:mode==="accent"?p.accent:mode==="secondary"?p.secondary:p.ink;c.fillStyle=bg;c.fillRect(0,0,l.w,l.h);
  c.save();c.globalAlpha=.055;c.strokeStyle=mode==="paper"?p.ink:p.paper;c.lineWidth=1;
  if(IH43_FILM.genre==="cut"){
    const drift=(time*48)%80;for(let x=-100;x<l.w+100;x+=80){c.beginPath();c.moveTo(x+drift,0);c.lineTo(x+drift-l.h*.14,l.h);c.stroke();}
  }else if(IH43_FILM.genre==="network"){
    const offset=(time*14)%44;for(let x=-44;x<l.w+44;x+=44)for(let y=-44;y<l.h+44;y+=44)c.fillRect(x+offset,y,1.1,1.1);
  }else{
    const band=(time*32)%160;for(let y=-160;y<l.h+160;y+=160)c.fillRect(0,y+band,l.w,1);
  }
  c.restore();return{bg,ink:mode==="paper"||mode==="secondary"?p.ink:p.paper};
}
function ih43Transition(c,l,p,phase){
  const duration=.32,remaining=phase.shot.duration-phase.local;if(remaining>duration||IH43_FILM.genre==="network")return;
  const progress=IH43.ease(1-remaining/duration),next=IH43_FILM.shots[(phase.index+1)%IH43_FILM.shots.length];
  const color=next.bg==="paper"?p.paper:next.bg==="accent"?p.accent:next.bg==="secondary"?p.secondary:p.ink;
  c.save();c.fillStyle=color;
  if(IH43_FILM.genre==="cut"){
    for(let i=0;i<7;i++){const x=l.w*i/7,shift=IH43.clamp(progress*1.35-i*.045);c.fillRect(x,-l.h+(l.h*2)*shift,l.w/7+2,l.h);}
  }else{c.translate(l.w*(1-progress),0);c.transform(1,0,-.18,1,0,0);c.fillRect(0,-10,l.w+l.h*.2,l.h+20);}
  c.restore();
}
function ih43Ui(c,l,p,s,phase){
  const bg=phase.shot.bg||"ink",surface=bg==="paper"?p.paper:bg==="accent"?p.accent:bg==="secondary"?p.secondary:p.ink,ink=ih43Readable(surface,p.ink,p.paper),outline=ink===p.ink||ink==="#000000"?"rgba(20,20,20,.35)":"rgba(245,245,235,.45)";
  const language=s.english?IH43_FILM.en:IH43_FILM.pl;
  const brandSize=l.mobile?19:22;ih43Text(c,"IdeaHire",l.pad,52,brandSize,ink,800);
  const progress=phase.cycle/IH43_FILM.period;c.fillStyle=outline;c.fillRect(l.pad,68,l.w-l.pad*2,1);c.fillStyle=ink;c.fillRect(l.pad,68,(l.w-l.pad*2)*progress,2);
  const icon=(index,type)=>{
    const x=l.toolbarX+index*52,y=l.toolbarY;c.save();if(s.reduced)c.globalAlpha=.4;ih43Box(c,x,y,44,44,null,22,outline);c.translate(x+22,y+22);c.strokeStyle=ink;c.lineWidth=1.5;c.lineCap="round";
    if(type==="skip"){c.beginPath();c.moveTo(-7,-7);c.lineTo(3,0);c.lineTo(-7,7);c.closePath();c.stroke();c.beginPath();c.moveTo(7,-7);c.lineTo(7,7);c.stroke();}
    else if(type==="replay"){c.beginPath();c.arc(0,0,8,-2.6,2.7);c.stroke();c.beginPath();c.moveTo(-7,-8);c.lineTo(-7,-2);c.lineTo(-1,-2);c.stroke();}
    else if(type==="pause"){if(s.paused||s.reduced){c.beginPath();c.moveTo(-4,-7);c.lineTo(7,0);c.lineTo(-4,7);c.closePath();c.stroke();}else{c.beginPath();c.moveTo(-3,-7);c.lineTo(-3,7);c.moveTo(3,-7);c.lineTo(3,7);c.stroke();}}
    else{c.beginPath();c.moveTo(-8,-3);c.lineTo(-4,-3);c.lineTo(1,-8);c.lineTo(1,8);c.lineTo(-4,3);c.lineTo(-8,3);c.closePath();c.stroke();if(s.sound){c.beginPath();c.arc(0,0,11,-.65,.65);c.stroke();}else{c.beginPath();c.moveTo(6,-4);c.lineTo(12,4);c.moveTo(12,-4);c.lineTo(6,4);c.stroke();}}
    c.restore();
  };icon(0,phase.cycle<IH43_FILM.finalStart?"skip":"replay");icon(1,"pause");icon(2,"sound");
  for(let i=0;i<2;i++){
    const x=l.pad+i*(l.buttonWidth+l.gap),y=l.bottom,hover=s.hover===i,fill=i===0?ink:null,textColor=i===0?ih43Readable(ink,p.paper,p.ink):ink;
    c.save();if(hover){c.shadowColor=ink;c.shadowBlur=14;c.globalAlpha=.95;}ih43Box(c,x,y,l.buttonWidth,52,fill,8,ink);c.shadowColor="transparent";
    const label=(l.mobile?language.ctaMobile:language.cta)[i],font=ih43Fit(c,[label],l.buttonWidth-57,22,l.mobile?12:13,650);ih43Text(c,label,x+16,y+31,font,textColor,650);ih43Arrow(c,x+l.buttonWidth-22,y+26,textColor,14);c.restore();
  }
  ih43Text(c,language.disclosure,l.pad,l.h-26,l.mobile?9:10,ink,450);
  if(!l.mobile){const stamp=String(phase.index+1).padStart(2,"0")+" / "+String(IH43_FILM.shots.length).padStart(2,"0");ih43Text(c,stamp,l.w-l.pad,l.h-26,10,ink,500,"right");}
}
function ih43Frame(c,w,h,time,s,includeUi=true){
  const clock=s.reduced?IH43_FILM.finalStart+2.5:time,l=IH43.layout(w,h),phase=IH43.phase(clock),p=ih43Palette(s.classic);
  c.save();c.beginPath();c.rect(0,0,w,h);c.clip();ih43Backdrop(c,l,p,phase.shot,time);
  c.save();c.beginPath();c.rect(0,75,w,h-195);c.clip();
  const px=s.reduced?0:(s.pointerX||0)*3,py=s.reduced?0:(s.pointerY||0)*2;c.translate(px,py);
  ih43Scene(c,l,p,phase,s,clock);c.restore();
  if(!s.reduced){c.save();c.beginPath();c.rect(0,75,w,h-195);c.clip();ih43Transition(c,l,p,phase);c.restore();}
  if(includeUi)ih43Ui(c,l,p,s,phase);
  c.restore();return phase;
}
function ih43Start(canvas,host,state,report){
  let frame=0,disposed=false,visible=true,last=0,lastDraw=0,dirty=true,width=0,height=0,ratio=1,previous=-1,observer,resizeObserver,c,audio=null,sound=false;
  const listeners=[],audioNodes=new Set();
  const listen=(node,type,fn,opts)=>{node.addEventListener(type,fn,opts);listeners.push(()=>node.removeEventListener(type,fn,opts));};
  const stopSound=()=>{for(const node of audioNodes){try{node.stop();}catch{}}audioNodes.clear();};
  function hit(index){if(!sound||!audio||audio.state!=="running"||state.current.paused||state.current.reduced)return;
    try{const oscillator=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;oscillator.type=IH43_FILM.genre==="network"?"sine":"triangle";oscillator.frequency.setValueAtTime(150+index%3*35,now);oscillator.frequency.exponentialRampToValueAtTime(52+index%2*18,now+.12);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.09,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.17);oscillator.connect(gain);gain.connect(audio.destination);audioNodes.add(oscillator);oscillator.onended=()=>{audioNodes.delete(oscillator);oscillator.disconnect();gain.disconnect();};oscillator.start(now);oscillator.stop(now+.19);}catch{sound=false;state.current.sound=false;report({sound:false});}
  }
  const destroy=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);frame=0;listeners.forEach(fn=>fn());observer?.disconnect();resizeObserver?.disconnect();stopSound();if(audio&&audio.state!=="closed")audio.close().catch(()=>{});};
  const resize=()=>{const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;ratio=Math.min(window.devicePixelRatio||1,width<=820?1.45:1.6);const budget=width<=820?700000:1800000,px=width*height*ratio*ratio;if(px>budget)ratio*=Math.sqrt(budget/px);canvas.width=Math.max(1,Math.floor(width*ratio));canvas.height=Math.max(1,Math.floor(height*ratio));
    const l=IH43.layout(width,height);for(const[key,value]of Object.entries({pad:l.pad,bottom:height-l.bottom,button:l.buttonWidth,gap:l.gap,toolbar:l.toolbarX}))host.style.setProperty("--ih43-"+key,value+"px");dirty=false;};
  const render=now=>{frame=0;if(disposed||!visible||document.hidden)return;try{
    const s=state.current,interval=width<=820?1000/30:1000/45;if(!s.paused&&!s.reduced&&lastDraw&&now-lastDraw<interval-1){frame=requestAnimationFrame(render);return;}
    const dt=last?Math.min(.1,(now-last)/1000):0;last=now;lastDraw=now;if(dirty)resize();if(!width||!height){frame=requestAnimationFrame(render);return;}
    if(!s.paused&&!s.reduced&&!s.finished)s.time+=dt;
    if(!s.finished&&!s.reduced&&s.time>=IH43_FILM.period){s.time=IH43_FILM.period-.001;s.finished=true;sound=false;s.sound=false;stopSound();report({finished:true,sound:false});}
    c.setTransform(ratio,0,0,ratio,0,0);const phase=ih43Frame(c,width,height,s.time,s,true);
    if(phase.index!==previous){previous=phase.index;report({scene:phase.index});hit(phase.index);}if(!s.ready){s.ready=true;report({ready:true});}
    if(!s.paused&&!s.reduced&&!s.finished)frame=requestAnimationFrame(render);
  }catch{destroy();report({failed:true,ready:true});}};
  const wake=()=>{if(!disposed&&visible&&!document.hidden&&!frame){last=0;lastDraw=0;frame=requestAnimationFrame(render);}};
  try{
    c=canvas.getContext("2d",{alpha:false});if(!c)throw new Error("ih43_canvas");
    listen(window,"resize",()=>{dirty=true;wake();},{passive:true});listen(document,"visibilitychange",()=>{last=0;lastDraw=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;stopSound();}else wake();});
    if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(()=>{dirty=true;wake();});resizeObserver.observe(host);}
    if(typeof IntersectionObserver!=="undefined"){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;lastDraw=0;stopSound();}},{rootMargin:"100px"});observer.observe(host);}
    document.fonts?.ready?.then(()=>{if(!disposed){IH43_MEASURE.clear();wake();}}).catch(()=>{});
    resize();wake();
    return{wake,destroy,mute(){sound=false;state.current.sound=false;stopSound();wake();},replay(){state.current.time=0;state.current.finished=false;report({finished:false});previous=-1;wake();},finale(){state.current.finished=false;state.current.time=IH43_FILM.finalStart+1.6;previous=-1;wake();},async toggleSound(){if(disposed||state.current.reduced||state.current.finished)return false;try{if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;audio=new Context();}if(!sound){await audio.resume();if(disposed||state.current.reduced||state.current.finished)return false;sound=true;}else{sound=false;stopSound();}state.current.sound=sound;wake();return sound;}catch{return false;}}};
  }catch{destroy();report({failed:true,ready:true});return{wake(){},destroy,mute(){},replay(){},finale(){},async toggleSound(){return false;}};}
}

function ih43Brief(c,l,p,phase,words,time){
  const enter=IH43.back(phase.local/.58),w=Math.min(l.cw*.78,l.mobile?360:650),h=l.mobile?245:286,x=l.w*.53,y=l.y+l.ch*.57;
  c.save();c.translate(x+(1-enter)*l.w,y);c.rotate((1-enter)*-.16+Math.sin(time*2)*.012);c.scale(.92+enter*.08,.92+enter*.08);
  ih43Panel(c,0,0,w,h,{fill:p.paper,ink:p.ink,label:words.panel});
  ih43Text(c,words.project,-w/2+24,-h/2+86,l.mobile?24:34,p.ink,800);
  const tags=words.details;for(let i=0;i<tags.length;i++){const t=IH43.ease((phase.local-.18-i*.12)/.4),fill=i%2?p.accent:p.ink;c.save();c.globalAlpha=t;ih43Box(c,-w/2+24,-h/2+113+i*33,(w-48)*t,25,fill,3);ih43Text(c,tags[i],-w/2+35,-h/2+131+i*33,12,ih43Readable(fill,p.paper,p.ink),550);c.restore();}
  ih43Text(c,words.note,-w/2+24,h/2-23,11,p.ink,450);c.restore();
}
function ih43CutFee(c,l,p,phase,s,words){
  const o=s.offer||IH43_FILM.offer,locale=s.english?"en-US":"pl-PL",fmt=n=>Number(n).toLocaleString(locale),pct=fmt(o.percent)+"%",currency=s.english?"PLN":"zł";
  const color=p.ink,progress=IH43.ease(phase.local/.38);
  ih43Text(c,words.fee,l.pad,l.y+22,l.mobile?13:16,color,650);
  ih43Lines(c,[pct],{x:l.pad,y:l.y+28,w:l.cw,h:l.ch*.60},{color,progress,mode:"slam",max:l.mobile?108:230});
  const y=l.y+l.ch*.68,labels=[words.minimum+" "+fmt(o.minimum)+" "+currency,words.maximum+" "+fmt(o.maximum)+" "+currency];
  for(let i=0;i<2;i++){const t=IH43.ease((phase.local-.35-i*.12)/.4),w=(l.cw-12)/2;c.save();c.globalAlpha=t;ih43Box(c,l.pad+i*(w+12),y+(1-t)*40,w,47,p.ink,5);ih43Text(c,labels[i],l.pad+i*(w+12)+14,y+30,l.mobile?13:18,p.paper,700);c.restore();}
  ih43Text(c,words.limit+" "+fmt(o.orderLimit)+" "+currency,l.pad,y+77,l.mobile?11:14,color,550);
  ih43Text(c,words.payer,l.pad,y+98,l.mobile?10:12,color,450);
  const full=s.english?"The freelancer receives the full agreed amount.":"Wykonawca otrzymuje całą ustaloną kwotę.";const size=ih43Fit(c,[full],l.cw,18,l.mobile?10:12,500);ih43Text(c,full,l.pad,y+117,size,color,500);
}
function ih43CutConversation(c,l,p,phase,words,time){
  const width=Math.min(l.cw*.84,660),height=l.mobile?220:250,x=l.w/2,y=l.y+l.ch*.58;
  const e=IH43.ease(phase.local/.5);ih43Panel(c,x+(1-e)*l.w,y,width,height,{fill:p.paper,ink:p.ink,label:words.thread,angle:(1-e)*.12});
  for(let i=0;i<2;i++){const a=IH43.back((phase.local-.30-i*.60)/.42);if(a<=0)continue;const bw=width*(i?.65:.70),xx=x-width*.43+(i?width*.22:0),yy=y-height*.25+i*82,fill=i?p.accent:p.ink;c.save();c.globalAlpha=IH43.clamp(a);c.translate(xx,yy+(1-a)*35);ih43Box(c,0,0,bw,60,fill,10);ih43Text(c,words.messages[i],16,36,l.mobile?15:20,ih43Readable(fill,p.paper,p.ink),650);c.restore();}
  const tick=.4+.6*Math.sin(time*5)**2;c.save();c.globalAlpha=tick;const promptSize=ih43Fit(c,[words.prompt],width-22,18,l.mobile?10:11,500);ih43Text(c,words.prompt,x,y+height*.61,promptSize,p.ink,500,"center");c.restore();
}
function ih43Scene(c,l,p,phase,s,time){
  const shot=phase.shot,lang=s.english?IH43_FILM.en:IH43_FILM.pl,text=lang.frames[phase.index],ink=shot.bg==="paper"||shot.bg==="secondary"?p.ink:p.paper;
  const enter=IH43.clamp(phase.local/.48),shake=s.reduced?0:Math.sin(phase.local*72)*Math.exp(-phase.local*13)*5;
  c.translate(shake,0);
  const titleBox={x:l.pad,y:l.y+13,w:l.cw,h:l.ch-16};
  if(shot.kind==="brief"){
    ih43Lines(c,text,{x:l.pad,y:l.y,w:l.cw,h:l.ch*.27},{color:ink,progress:enter,mode:"side",max:l.mobile?48:72});ih43Brief(c,l,p,phase,lang.ui,time);
  }else if(shot.kind==="fee")ih43CutFee(c,l,p,phase,s,lang.ui);
  else if(shot.kind==="dialogue"){
    ih43Lines(c,text,{x:l.pad,y:l.y,w:l.cw,h:l.ch*.25},{color:ink,progress:enter,mode:"side",max:l.mobile?52:86});ih43CutConversation(c,l,p,phase,lang.ui,time);
  }else if(shot.kind==="services"){
    for(let i=0;i<3;i++){
      const e=IH43.back((phase.local-i*.16)/.48),yy=l.y+l.ch*(.21+i*.29),x=l.pad+(i%2?1-e:e-1)*l.w;
      c.save();c.translate(x,yy);c.rotate((i-1)*-.028);const sz=ih43Fit(c,[text[i]],l.cw,l.ch*.26,l.mobile?68:145,900);ih43Text(c,text[i],0,sz*.45,sz,ink,900,"left",-sz*.05);c.restore();
    }
  }else if(shot.kind==="terms"){
    const scale=IH43.back(phase.local/.45);c.save();c.translate(l.w/2,l.y+l.ch/2);c.rotate(-.05+(1-scale)*.2);c.scale(scale,scale);ih43Box(c,-l.cw*.44,-l.ch*.36,l.cw*.88,l.ch*.72,p.paper,0);c.strokeStyle=p.ink;c.lineWidth=3;c.strokeRect(-l.cw*.41,-l.ch*.32,l.cw*.82,l.ch*.64);ih43Lines(c,text,{x:-l.cw*.36,y:-l.ch*.29,w:l.cw*.72,h:l.ch*.58},{color:p.ink,progress:1,mode:"rise",max:l.mobile?48:100});c.restore();
  }else if(shot.kind==="pair"){
    const two=text.slice(0,2),gap=14,bw=l.mobile?l.cw:(l.cw-gap)/2,bh=l.mobile?l.ch*.30:l.ch*.60;
    for(let i=0;i<2;i++){const e=IH43.ease((phase.local-i*.16)/.5),x=l.mobile?l.pad:l.pad+i*(bw+gap),y=l.mobile?l.y+i*(bh+16):l.y+l.ch*.05;c.save();c.translate((i?1:-1)*(1-e)*l.w,0);ih43Box(c,x,y,bw,bh,i?p.accent:p.paper,7);ih43Lines(c,[two[i]],{x:x+18,y:y+20,w:bw-36,h:bh-40},{color:i?p.paper:p.ink,progress:1,max:l.mobile?38:68});c.restore();}
    ih43Lines(c,[text[2]],{x:l.pad,y:l.y+l.ch*.72,w:l.cw,h:l.ch*.27},{color:ink,progress:IH43.ease((phase.local-.55)/.40),mode:"slam",max:l.mobile?55:100});
  }else if(shot.kind==="final"){
    const float=s.reduced?0:Math.sin(time*1.6)*3;
    if(!s.reduced){c.save();c.globalAlpha=.12;const label=lang.endTags[Math.floor(phase.local/2.1)%3],sz=l.mobile?100:245;ih43Text(c,label,l.pad+(1-((phase.local/3)%1))*l.cw,l.y+l.ch*.80,sz,ink,900);c.restore();}
    ih43Lines(c,text,{...titleBox,y:titleBox.y-25+float,h:l.ch*.72},{color:ink,progress:IH43.clamp(phase.local/.6),mode:"letters",max:l.mobile?85:185});
    const tags=lang.endTags;for(let i=0;i<3;i++){const x=l.pad+l.cw*(.17+i*.33),y=l.y+l.ch*.85+Math.sin(time*2+i*1.7)*5;ih43Tag(c,tags[i],x,y,{fill:i%2?p.accent:p.paper,ink:i%2?p.paper:p.ink},Math.sin(time+i)*.035,l.mobile?.73:1);}
  }else ih43Lines(c,text,titleBox,{color:ink,progress:enter,mode:shot.motion||"slam",max:l.mobile?95:220});
  if(shot.kind!=="fee"&&shot.kind!=="final"){
    const rail=s.english?"CUT / ":"CIĘCIE / ";c.save();c.globalAlpha=.28;ih43Text(c,rail+String(phase.index+1).padStart(2,"0"),l.w-l.pad,l.y+l.ch-2,9,ink,600,"right",1.2);c.restore();
  }
}

function ih43Reduced(){
  return typeof window!=="undefined"&&!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/* Każdy wariant jest alternatywą całego pliku App.jsx. Trasy, płatności i dalsza strona pozostają w części P40. */
export function IdeaHireCinematicHero({jobs=[]}){
  const site=useSitePreferences();
  const english=site.language==="en",classic=site.template==="classic";
  const copy=english?IH43_FILM.en:IH43_FILM.pl;
  const [reduced,setReduced]=useState(ih43Reduced);
  const [paused,setPaused]=useState(false);
  const [sound,setSound]=useState(false);
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);
  const [finished,setFinished]=useState(ih43Reduced);
  const [welcomed,setWelcomed]=useState(ih43Reduced);
  const [scene,setScene]=useState(()=>ih43Reduced()?IH43_FILM.shots.length-1:0);
  const rootRef=useRef(null),canvasRef=useRef(null),engineRef=useRef(null),alive=useRef(false),soundBusy=useRef(false);
  const motion=useRef({time:0,paused:false,finished:false,reduced,english,classic,offer:IDEA_HIRE_PUBLIC_OFFER,ready:false,sound:false,pointerX:0,pointerY:0,hover:-1});
  const finale=scene===IH43_FILM.shots.length-1;
  const labels=english?{
    region:"IdeaHire — "+IH43_FILM.name,
    skip:"Skip to the final scene",replay:"Replay the film",pause:"Pause the animation",play:"Resume the animation",
    soundOn:"Enable sound",soundOff:"Mute sound",controls:"Film controls",
  }:{
    region:"IdeaHire — "+IH43_FILM.name,
    skip:"Przejdź do finału",replay:"Odtwórz od początku",pause:"Zatrzymaj animację",play:"Wznów animację",
    soundOn:"Włącz dźwięk",soundOff:"Wycisz dźwięk",controls:"Sterowanie filmem",
  };
  useEffect(()=>{
    const media=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if(!media)return;
    const change=()=>setReduced(media.matches);change();
    media.addEventListener?.("change",change);
    return()=>media.removeEventListener?.("change",change);
  },[]);
  useLayoutEffect(()=>{
    Object.assign(motion.current,{reduced,english,classic,paused,offer:IDEA_HIRE_PUBLIC_OFFER});
    IH53_MOTION.paused=paused||reduced;window.dispatchEvent(new CustomEvent("ih53-motion",{detail:{paused:IH53_MOTION.paused}}));
    if(reduced){motion.current.finished=true;setWelcomed(true);setFinished(true);}
    if(reduced){setSound(false);engineRef.current?.mute();}
    engineRef.current?.wake();
  },[reduced,english,classic,paused]);
  useEffect(()=>{
    alive.current=true;
    const engine=ih43Start(canvasRef.current,rootRef.current,motion,update=>{
      if(!alive.current)return;
      if(update.ready)setReady(true);
      if(update.failed){setFailed(true);setWelcomed(true);setFinished(true);}
      if(update.finished!==undefined)setFinished(update.finished);
      if(update.scene!==undefined)setScene(update.scene);
      if(update.sound!==undefined)setSound(update.sound);
    });
    engineRef.current=engine;
    return()=>{alive.current=false;engine.destroy();engineRef.current=null;};
  },[]);
  function cut(){
    if(reduced||failed)return;
    if(IH43.phase(motion.current.time).cycle>=IH43_FILM.finalStart){
      motion.current.paused=false;setPaused(false);engineRef.current?.replay();
    }else engineRef.current?.finale();
  }
  function togglePause(){
    motion.current.paused=!motion.current.paused;
    setPaused(motion.current.paused);engineRef.current?.wake();
  }
  async function toggleSound(){
    if(soundBusy.current||reduced||failed)return;
    soundBusy.current=true;
    try{const enabled=await engineRef.current?.toggleSound();if(alive.current)setSound(!!enabled);}
    finally{soundBusy.current=false;}
  }
  function replayIntro(){if(reduced||failed)return;motion.current.paused=false;setPaused(false);setWelcomed(false);setFinished(false);engineRef.current?.replay();}
  function hover(index){motion.current.hover=index;engineRef.current?.wake();}
  function move(event){
    if(reduced||paused||failed||event.pointerType!=="mouse")return;
    const rect=event.currentTarget.getBoundingClientRect();
    motion.current.pointerX=IH43.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1);
    motion.current.pointerY=IH43.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1);
  }
  function leave(){motion.current.pointerX=0;motion.current.pointerY=0;hover(-1);}
  return <section ref={rootRef} className="ih43-film" data-cinematic-version={"P43-"+IH43_FILM.key}
    data-stage={finished?(welcomed?"jobs":"welcome"):"intro"} data-ready={ready} data-failed={failed} data-classic={classic} data-no-translate="true"
    aria-label={labels.region} onPointerMove={move} onPointerLeave={leave}>
    <style>{IH43_STYLES}</style>
    {finished&&!welcomed&&<IH53Welcome paused={paused} onPause={togglePause} onDone={()=>setWelcomed(true)}/>}
    {finished&&welcomed&&<IH53JobsFinale jobs={jobs} paused={paused} reduced={reduced} canReplay={!reduced&&!failed} onReplay={replayIntro} onPause={togglePause}/>}
    <canvas ref={canvasRef} className="ih43-canvas" aria-hidden="true"/>
    <div className="ih43-accessible">
      <h1>{copy.final.join(" ")}</h1>
      <p>{copy.subtitle}</p>
      <p>{copy.disclosure}</p>
      {IH43_FILM.genre==="cut"&&<p>{english?"IdeaHire service fee":"Prowizja IdeaHire"}: {IDEA_HIRE_PUBLIC_OFFER.percent}%,
        {english?" minimum":" min."} {IDEA_HIRE_PUBLIC_OFFER.minimum} {english?"PLN":"zł"},
        {english?" maximum":" maks."} {IDEA_HIRE_PUBLIC_OFFER.maximum} {english?"PLN":"zł"}.
        {english?" Orders up to ":" Zlecenia do "}{IDEA_HIRE_PUBLIC_OFFER.orderLimit} {english?"PLN. Paid by the client.":"zł. Płaci zleceniodawca."}</p>}
    </div>
    <div role="group" aria-label={labels.controls}>
      <button type="button" className="ih43-hit ih43-control" style={{"--ih43-index":0}}
        aria-label={finale?labels.replay:labels.skip} title={finale?labels.replay:labels.skip} disabled={reduced||failed} onClick={cut}/>
      <button type="button" className="ih43-hit ih43-control" style={{"--ih43-index":1}}
        aria-label={paused?labels.play:labels.pause} title={paused?labels.play:labels.pause} aria-pressed={paused||reduced}
        disabled={reduced||failed} onClick={togglePause}/>
      <button type="button" className="ih43-hit ih43-control" style={{"--ih43-index":2}}
        aria-label={sound?labels.soundOff:labels.soundOn} title={sound?labels.soundOff:labels.soundOn} aria-pressed={sound}
        disabled={reduced||failed} onClick={toggleSound}/>
    </div>
    {copy.cta.map((label,index)=><Link key={index} className="ih43-hit ih43-link" style={{"--ih43-index":index}}
      to={IH43_FILM.paths[index]} onMouseEnter={()=>hover(index)} onMouseLeave={()=>hover(-1)} onFocus={()=>hover(index)} onBlur={()=>hover(-1)}>
      <span className="ih43-link-label">{label}</span>
    </Link>)}
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

const IH58_CATEGORY_EN = {
  Programowanie: 'Websites, apps and IT',
  'Grafika i design': 'Design, UX and 3D',
  Marketing: 'Marketing and sales',
  Copywriting: 'Writing and translation',
  Video: 'Video, animation and audio',
  Fotografia: 'Photography and image editing',
  'AI i automatyzacje': 'AI and automation',
  'Dane, analizy i research': 'Data, analysis and research',
  'Biznes i e-commerce': 'Business and e-commerce',
  'Architektura, wnętrza i CAD': 'Architecture, interiors and CAD',
};
const IH58_SUMMARY_EN = {
  Programowanie: 'Websites, shops and applications. Build, connect or improve the tools your project needs.',
  'Grafika i design': 'Brand identity, interfaces and visual materials prepared for their intended use.',
  Marketing: 'Campaigns, content and analytics matched to your audience and business goals.',
  Copywriting: 'Website copy, articles and translations with an agreed scope and tone.',
  Video: 'Editing, animation and sound for your film, campaign or publication.',
  Fotografia: 'Photography and image editing for products, people and places.',
  'AI i automatyzacje': 'Practical automation and AI integrations for clearly defined tasks.',
  'Dane, analizy i research': 'Organised data, research and reports that answer specific questions.',
  'Biznes i e-commerce': 'Product catalogues, presentations and support for everyday business operations.',
  'Architektura, wnętrza i CAD': 'Space planning, drawings and models for presentation or further design work.',
};
function ih58SearchText(value) {
  return String(value || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
}
function HomeCategoryBrowser({ groups = [] }) {
  const en = useSitePreferences().language === 'en';
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(groups[0]?.value || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [search, setSearch] = useState('');
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const categoryButtons = useRef(new Map());
  const group = groups.find(item => item.value === selectedCategory) || groups[0];
  const label = item => en ? IH58_CATEGORY_EN[item?.value] || translateUiText(item?.label || item?.value || '') : item?.label || item?.value || '';
  const subLabel = value => en ? translateUiText(value) : value;
  const count = groups.reduce((sum, item) => sum + (item.subcategories?.length || 0), 0);
  const rows = groups.flatMap(item => (item.subcategories || []).map((value, index) => ({ group: item, value, index })));
  const terms = ih58SearchText(search).trim().split(/\s+/).filter(Boolean);
  const results = terms.length ? rows.filter(item => {
    const text = ih58SearchText([item.value, subLabel(item.value), item.group.value, label(item.group), HOME_CATEGORY_COPY[item.group.value]?.descriptions[item.index]].join(' '));
    return terms.every(term => text.includes(term));
  }) : rows.filter(item => item.group.value === group?.value);
  const queryFor = (category, subcategory) => {
    const query = new URLSearchParams({ category: category || '' });
    if (subcategory) query.set('subcategory', subcategory);
    return `/jobs?${query.toString()}`;
  };
  const groupCopy = HOME_CATEGORY_COPY[group?.value];
  const selectedIndex = group?.subcategories?.indexOf(selectedSubcategory) ?? -1;
  const summary = en ? IH58_SUMMARY_EN[group?.value] : groupCopy?.summary;
  const description = en ? summary : selectedIndex >= 0 ? groupCopy?.descriptions[selectedIndex] || summary : summary;
  const examples = ['Programowanie', 'Grafika i design', 'Video'].map(value => {
    const item = groups.find(candidate => candidate.value === value && candidate.subcategories?.length);
    if (!item) return null;
    const preferred = item.subcategories.find(sub => value === 'Programowanie' ? /strona firmowa/i.test(sub) : value === 'Video' ? /montaż/i.test(sub) : /^logo$/i.test(sub));
    return { group: item, value: preferred || item.subcategories[0] };
  }).filter(Boolean);

  function closeBrowser() {
    setOpen(false);
    if (panelRef.current?.contains(document.activeElement)) triggerRef.current?.focus({ preventScroll: true });
  }
  function selectCategory(value, subcategory = '') {
    setSelectedCategory(value);
    setSelectedSubcategory(subcategory);
    setSearch('');
  }
  function keyboardCategory(event, index) {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key) || !groups.length) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + groups.length) % groups.length;
    selectCategory(groups[next].value);
    categoryButtons.current.get(groups[next].value)?.focus({ preventScroll: true });
  }

  return <div className={`ih-category-browser ih58-category-browser${open ? ' is-open' : ''}`} data-no-translate="true"
    onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); closeBrowser(); } }}>
    <button ref={triggerRef} type="button" className="ih-category-trigger ih58-category-trigger" aria-expanded={open} aria-controls="ih-category-panel" onClick={() => open ? closeBrowser() : setOpen(true)}>
      <span className="ih-category-trigger-top"><span>{String(groups.length).padStart(2, '0')} {en ? 'fields of work' : 'dziedzin współpracy'}</span><span className="ih-category-toggle" aria-hidden="true">{open ? '−' : '+'}</span></span>
      <span className="ih-category-trigger-title">{en ? <>What is<br />your project?</> : <>Jaki masz<br />projekt?</>}</span>
      <span className="ih58-category-teaser">{count > 0 ? `${count} ${en ? 'specialisations. One place to start.' : 'specjalizacji. Jeden punkt wyjścia.'}` : en ? 'Choose the field that fits your project.' : 'Wybierz dziedzinę swojego projektu.'}</span>
      <span className="ih58-category-lines" aria-hidden="true">{groups.map((item, index) => <i key={item.value} style={{ '--ih58-i': index }} />)}</span>
      <span className="ih-category-trigger-bottom"><span>{open ? en ? 'Close catalogue' : 'Zwiń katalog' : en ? 'Explore specialisations' : 'Odkryj specjalizacje'}</span><span aria-hidden="true">↗</span></span>
    </button>
    <div className="ih53-category-expansion" data-open={open} aria-hidden={!open} inert={open ? undefined : ''}><div className="ih53-category-clip">
      <section ref={panelRef} id="ih-category-panel" className="ih-category-panel ih58-category-panel" aria-labelledby="ih-category-panel-title">
        <div className="ih-category-panel-heading"><div><span className="ih-category-kicker">{en ? 'Start with what you need' : 'Zacznij od tego, czego potrzebujesz'}</span><h3 id="ih-category-panel-title">{en ? 'Find your specialisation.' : 'Znajdź swoją specjalizację.'}</h3><p>{en ? `${groups.length} categories · ${count} specialisations. Choose a task and see relevant projects.` : `${groups.length} kategorii · ${count} specjalizacji. Wybierz zadanie i przejdź do odpowiednich zleceń.`}</p></div><button type="button" className="ih-category-close" onClick={closeBrowser} aria-label={en ? 'Close categories' : 'Zamknij kategorie'}>×</button></div>
        <div className="ih58-search-row"><label className="ih58-category-search"><MarketIcon kind="search" /><span className="ih57-sr">{en ? 'Search all specialisations' : 'Szukaj we wszystkich specjalizacjach'}</span><input ref={inputRef} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={en ? 'What do you need? e.g. logo, website, editing' : 'Czego potrzebujesz? np. logo, strona, montaż'} autoComplete="off" aria-controls="ih58-specialisations" /></label><Link className="ih58-all-jobs" to="/jobs">{en ? 'All projects' : 'Wszystkie zlecenia'} <span aria-hidden="true">↗</span></Link></div>
        {!!examples.length && <div className="ih58-category-examples"><span>{en ? 'Try a task:' : 'Przykłady zadań:'}</span>{examples.map(item => <button key={item.group.value} type="button" onClick={() => selectCategory(item.group.value, item.value)}>{subLabel(item.value)} <span aria-hidden="true">↗</span></button>)}</div>}
        <div className="ih-category-layout ih58-category-layout">
          <div className="ih-category-list ih58-category-list" role="tablist" aria-orientation="vertical" aria-label={en ? 'Fields of work' : 'Dziedziny współpracy'}>
            {groups.map((item, index) => <button key={item.value} ref={node => { if (node) categoryButtons.current.set(item.value, node); else categoryButtons.current.delete(item.value); }} type="button" className="ih-category-option ih58-category-option" role="tab" id={`ih58-category-${index}`} aria-controls="ih58-category-content" aria-selected={item.value === group?.value} tabIndex={item.value === group?.value ? 0 : -1} onClick={() => selectCategory(item.value)} onKeyDown={event => keyboardCategory(event, index)}>
              <span className="ih58-category-icon" aria-hidden="true"><IH53CategoryIcon category={item.value} /></span><span>{label(item)}</span><small>{item.subcategories?.length || 0}</small>
            </button>)}
          </div>
          <div className="ih-category-content ih58-category-content" id="ih58-category-content" role="tabpanel" aria-labelledby={`ih58-category-${Math.max(0, groups.findIndex(item => item.value === group?.value))}`}>
            <div className="ih58-category-title" key={terms.length ? 'search' : group?.value}><span className="ih-category-kicker">{terms.length ? en ? 'Across all categories' : 'We wszystkich kategoriach' : en ? 'Your field of work' : 'Twoja dziedzina'}</span><h4>{terms.length ? en ? 'Search results' : 'Wyniki wyszukiwania' : label(group)}</h4><p>{terms.length ? en ? `${results.length} matching specialisations` : `Pasujące specjalizacje: ${results.length}` : summary}</p></div>
            <div id="ih58-specialisations" className="ih58-specialisations" role="group" aria-label={en ? 'Specialisations' : 'Specjalizacje'}>
              {results.map((item, index) => <div key={`${item.group.value}/${item.value}`} className="ih58-specialisation" data-selected={item.group.value === group?.value && item.value === selectedSubcategory} style={{ '--ih58-i': Math.min(index, 8) }}>
                <button type="button" aria-pressed={item.group.value === group?.value && item.value === selectedSubcategory} aria-describedby="ih-category-description" onClick={() => { setSelectedCategory(item.group.value); setSelectedSubcategory(item.value); }}><span>{subLabel(item.value)}</span>{terms.length > 0 && <small>{label(item.group)}</small>}</button><Link to={queryFor(item.group.value, item.value)} aria-label={`${en ? 'View projects:' : 'Pokaż zlecenia:'} ${subLabel(item.value)}`}><span aria-hidden="true">↗</span></Link>
              </div>)}
              {!results.length && <div className="ih58-category-empty"><strong>{en ? 'No matching specialisation.' : 'Brak pasującej specjalizacji.'}</strong><p>{en ? 'Try a shorter phrase or browse the categories.' : 'Spróbuj krótszej frazy lub wybierz kategorię.'}</p><button type="button" onClick={() => { setSearch(''); inputRef.current?.focus(); }}>{en ? 'Clear search' : 'Wyczyść wyszukiwanie'}</button></div>}
            </div>
            <div className="ih-category-detail ih58-category-detail" id="ih-category-description"><span className="ih-category-kicker">{selectedSubcategory ? en ? 'Your selection' : 'Twój wybór' : en ? 'From choice to a project' : 'Od wyboru do zlecenia'}</span><strong>{selectedSubcategory ? subLabel(selectedSubcategory) : label(group)}</strong><p>{description || (en ? 'Choose a specialisation and browse matching project briefs.' : 'Wybierz specjalizację i przejrzyj pasujące ogłoszenia.')}</p><div className="ih-category-links"><Link className="ih-category-jobs-link" to={queryFor(group?.value, selectedSubcategory)}>{en ? 'View matching projects' : 'Zobacz dopasowane zlecenia'} <span aria-hidden="true">↗</span></Link>{selectedSubcategory && <Link className="ih-category-all-link" to={queryFor(group?.value)}>{en ? 'Whole category' : 'Cała kategoria'}</Link>}</div></div>
          </div>
        </div>
        <span className="ih57-sr" role="status" aria-live="polite">{open ? `${results.length} ${en ? 'specialisations available' : 'dostępnych specjalizacji'}` : ''}</span>
      </section>
    </div></div>
  </div>;
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


const IH58_STYLES = String.raw`/* P58: spokojne tło, użyteczny katalog i film bez dolnego panelu. */
__IH58__ {background:var(--v-bg)!important;box-shadow:none!important;}
__IH58__ > main {background:transparent!important;box-shadow:none!important;}
__IH58__::before,__IH58__::after,__IH58__ > main::before,__IH58__ > main::after,__IH58__ .footer::before,__IH58__ .footer::after,__IH58__ .section::before,__IH58__ .section::after,__IH58__ .split-card::before,__IH58__ .split-card::after,__IH58__ .final-cta::before,__IH58__ .final-cta::after {content:none!important;display:none!important;}
__IH58__ :is(.section,.ih5-category-showcase,.ih-category-browser,.ih-category-trigger,.ih5-story,.ih-category-panel,.split-card,.final-cta,.footer,.ih53-showcase-tile,[data-ih53-tilt]) {box-shadow:none!important;filter:none!important;}
__IH58__ :is(.section,.ih5-category-showcase,.split-section,.footer) {background:transparent!important;background-image:none!important;}
__IH58__ > .ih53-backdrop {display:none!important;}
__IH58__ .footer {border-radius:0!important;backdrop-filter:none!important;transform:none!important;translate:none!important;rotate:none!important;clip-path:none!important;}
__IH58__ .ih53-jobs-finale {position:relative!important;isolation:isolate!important;}
__IH58__ .ih53-jobs-finale > :not(.ih58-ambient) {position:relative;z-index:1;}
__IH58__ .ih58-ambient {display:block!important;position:absolute!important;inset:0!important;z-index:0!important;pointer-events:none!important;overflow:hidden!important;contain:paint;}
__IH58__ .ih58-ambient::before,__IH58__ .ih58-ambient::after {content:'';position:absolute;top:0;bottom:0;width:1px;left:55%;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--v-muted) 8%,transparent) 40%,transparent);}
__IH58__ .ih58-ambient::after {left:83%;opacity:.6;}
__IH58__ .ih58-ambient > i {position:absolute;display:block;top:-25%;left:44%;width:1px;height:130px;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--v-ink) 16%,transparent),transparent);animation:ih58-flow 15s linear infinite;}
__IH58__ .ih58-ambient > i:nth-child(2) {left:55%;height:180px;animation-duration:19s;animation-delay:-7s;}
__IH58__ .ih58-ambient > i:nth-child(3) {left:83%;height:100px;animation-duration:17s;animation-delay:-11s;}
__IH58__ .ih58-ambient > b {position:absolute;left:34%;right:0;top:-30%;height:130px;opacity:.45;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--v-muted) 4%,transparent) 75%,transparent);animation:ih58-flow 23s linear infinite;}
__IH58__ .ih58-ambient[data-paused=true] > * {animation-play-state:paused!important;}
@keyframes ih58-flow {from{translate:0 0;}to{translate:0 850px;}}

__IH58__ .ih58-category-trigger {transform:none!important;transition:border-color 180ms,background-color 180ms!important;overflow:hidden!important;}
__IH58__ .ih58-category-trigger .ih-category-trigger-title {display:block!important;margin:18px 0 16px!important;line-height:1.05!important;font-size:clamp(39px,4.2vw,62px)!important;letter-spacing:-.05em!important;}
__IH58__ .ih58-category-teaser {display:block!important;max-width:360px!important;font:400 13px/1.65 Inter,Arial,sans-serif!important;color:inherit!important;}
__IH58__ .ih58-category-lines {display:flex!important;gap:6px!important;width:100%!important;max-width:330px!important;margin:28px 0!important;}
__IH58__ .ih58-category-lines i {display:block!important;flex:1!important;height:3px!important;background:currentColor!important;opacity:.24!important;transform:scaleX(.36);transform-origin:left;transition:transform 320ms cubic-bezier(.2,.8,.2,1),opacity 240ms;transition-delay:calc(var(--ih58-i)*18ms);}
__IH58__ .ih58-category-trigger:is(:hover,:focus-visible) .ih58-category-lines i,__IH58__ .ih58-category-trigger[aria-expanded=true] .ih58-category-lines i {transform:scaleX(1);opacity:.65!important;}
__IH58__ .ih58-category-trigger .ih-category-trigger-bottom {margin-top:auto!important;}
__IH58__ .ih58-category-panel {padding:clamp(22px,3.5vw,44px)!important;border-radius:18px!important;background:var(--v-bg)!important;color:var(--v-ink)!important;}
__IH58__ .ih58-category-panel * {box-sizing:border-box!important;}
__IH58__ .ih58-category-panel .ih-category-panel-heading {align-items:flex-start!important;gap:18px!important;margin-bottom:25px!important;}
__IH58__ .ih58-category-panel h3 {font-size:clamp(27px,3.2vw,42px)!important;line-height:1.1!important;letter-spacing:-.04em!important;margin:10px 0 12px!important;color:var(--v-ink)!important;}
__IH58__ .ih58-category-panel .ih-category-panel-heading p {font-size:13px!important;line-height:1.65!important;color:var(--v-muted)!important;max-width:650px!important;}
__IH58__ .ih58-category-panel .ih-category-close {flex:0 0 44px!important;width:44px!important;height:44px!important;border:1px solid var(--v-line)!important;background:var(--v-surface)!important;color:var(--v-ink)!important;border-radius:50%!important;box-shadow:none!important;}
__IH58__ .ih58-search-row {display:flex!important;gap:14px!important;align-items:stretch!important;margin:0 0 14px!important;}
__IH58__ .ih58-category-search {display:flex!important;align-items:center!important;gap:12px!important;flex:1!important;min-width:0!important;min-height:54px!important;padding:0 16px!important;border:1px solid var(--v-line)!important;border-radius:8px!important;background:var(--v-surface)!important;color:var(--v-ink)!important;}
__IH58__ .ih58-category-search:focus-within {outline:2px solid var(--v-accent)!important;outline-offset:2px!important;}
__IH58__ .ih58-category-search > svg {flex:0 0 20px!important;width:20px!important;height:20px!important;stroke:currentColor!important;fill:none!important;}
__IH58__ .ih58-category-search input {flex:1!important;width:100%!important;min-width:0!important;min-height:52px!important;padding:10px 0!important;margin:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:var(--v-ink)!important;-webkit-text-fill-color:currentColor!important;font:400 14px/1.5 Inter,Arial,sans-serif!important;box-shadow:none!important;outline:0!important;}
__IH58__ .ih58-category-search input::placeholder {color:var(--v-muted)!important;opacity:1!important;}
__IH58__ .ih58-all-jobs {display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:18px!important;min-height:54px!important;padding:12px 18px!important;border:1px solid var(--v-line)!important;border-radius:8px!important;color:var(--v-ink)!important;background:var(--v-bg)!important;font:600 12px/1.5 Inter,Arial,sans-serif!important;text-decoration:none!important;white-space:nowrap!important;}
__IH58__ .ih58-category-examples {display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:8px!important;margin-bottom:30px!important;color:var(--v-muted)!important;font:400 11px/1.5 Inter,Arial,sans-serif!important;}
__IH58__ .ih58-category-examples > span {margin-right:4px!important;}
__IH58__ .ih58-category-examples button {display:inline-flex!important;align-items:center!important;gap:12px!important;min-height:38px!important;padding:7px 11px!important;border:1px solid var(--v-line)!important;border-radius:5px!important;background:var(--v-bg)!important;color:var(--v-ink)!important;font:500 11px/1.5 Inter,Arial,sans-serif!important;cursor:pointer!important;}
__IH58__ .ih58-category-layout {display:grid!important;grid-template-columns:minmax(210px,.36fr) minmax(0,1fr)!important;gap:clamp(22px,3.5vw,48px)!important;align-items:start!important;}
__IH58__ .ih58-category-list {display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:4px!important;max-height:none!important;overflow:visible!important;padding:0!important;margin:0!important;}
__IH58__ .ih58-category-option {display:grid!important;grid-template-columns:26px minmax(0,1fr) 24px!important;gap:10px!important;align-items:center!important;min-width:0!important;min-height:58px!important;padding:12px!important;margin:0!important;border:1px solid transparent!important;border-radius:8px!important;background:transparent!important;color:var(--v-muted)!important;font:500 12px/1.45 Inter,Arial,sans-serif!important;text-align:left!important;transform:none!important;transition:background-color 160ms,color 160ms,border-color 160ms!important;box-shadow:none!important;cursor:pointer!important;}
__IH58__ .ih58-category-option[aria-selected=true] {background:var(--v-ink)!important;color:var(--v-bg)!important;border-color:var(--v-ink)!important;}
__IH58__ .ih58-category-option:hover:not([aria-selected=true]) {color:var(--v-ink)!important;background:var(--v-surface)!important;}
__IH58__ .ih58-category-option small {color:inherit!important;text-align:right!important;font:400 10px/1.5 Inter,Arial,sans-serif!important;}
__IH58__ .ih58-category-icon {display:grid!important;place-items:center!important;}
__IH58__ .ih58-category-icon svg {display:block!important;width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.5!important;stroke-linecap:round!important;stroke-linejoin:round!important;}
__IH58__ .ih58-category-content {min-width:0!important;padding:0!important;}
__IH58__ .ih58-category-title {padding:0 0 20px!important;animation:ih58-catalog-in 260ms cubic-bezier(.2,.8,.2,1) both;}
__IH58__ .ih58-category-title h4 {margin:10px 0 12px!important;font:700 clamp(23px,2.6vw,34px)/1.15 Inter,Arial,sans-serif!important;letter-spacing:-.035em!important;color:var(--v-ink)!important;}
__IH58__ .ih58-category-title p {max-width:650px!important;margin:0!important;font:400 13px/1.7 Inter,Arial,sans-serif!important;color:var(--v-muted)!important;}
__IH58__ .ih58-specialisations {display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important;}
__IH58__ .ih58-specialisation {display:flex!important;min-width:0!important;align-items:stretch!important;border:1px solid var(--v-line)!important;border-radius:7px!important;overflow:hidden!important;background:var(--v-bg)!important;color:var(--v-ink)!important;animation:ih58-catalog-in 280ms calc(var(--ih58-i)*22ms) both;}
__IH58__ .ih58-specialisation[data-selected=true] {border-color:var(--v-accent)!important;background:var(--v-surface)!important;}
__IH58__ .ih58-specialisation button {flex:1!important;min-width:0!important;min-height:59px!important;margin:0!important;padding:12px!important;border:0!important;border-radius:0!important;background:transparent!important;color:inherit!important;font:500 12px/1.5 Inter,Arial,sans-serif!important;text-align:left!important;cursor:pointer!important;overflow-wrap:anywhere!important;box-shadow:none!important;}
__IH58__ .ih58-specialisation button > small {display:block!important;margin-top:3px!important;font:400 10px/1.45 Inter,Arial,sans-serif!important;color:var(--v-muted)!important;}
__IH58__ .ih58-specialisation > a {display:grid!important;place-items:center!important;flex:0 0 44px!important;min-height:44px!important;color:var(--v-ink)!important;background:transparent!important;font-size:20px!important;text-decoration:none!important;border-left:1px solid var(--v-line)!important;}
__IH58__ .ih58-specialisation > a:hover {background:var(--v-ink)!important;color:var(--v-bg)!important;}
__IH58__ .ih58-category-detail {margin-top:20px!important;padding:22px!important;border:1px solid var(--v-line)!important;border-radius:9px!important;background:var(--v-surface)!important;color:var(--v-ink)!important;}
__IH58__ .ih58-category-detail strong {display:block!important;margin:9px 0!important;font:650 20px/1.3 Inter,Arial,sans-serif!important;letter-spacing:-.025em!important;color:inherit!important;}
__IH58__ .ih58-category-detail p {margin:0 0 18px!important;font:400 13px/1.7 Inter,Arial,sans-serif!important;color:var(--v-muted)!important;}
__IH58__ .ih58-category-detail .ih-category-links {display:flex!important;gap:14px!important;align-items:center!important;flex-wrap:wrap!important;margin:0!important;}
__IH58__ .ih58-category-detail .ih-category-jobs-link {display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:20px!important;min-height:48px!important;padding:12px 16px!important;border:1px solid var(--v-ink)!important;border-radius:6px!important;background:var(--v-ink)!important;color:var(--v-bg)!important;font:600 12px/1.5 Inter,Arial,sans-serif!important;text-decoration:none!important;}
__IH58__ .ih58-category-detail .ih-category-all-link {min-height:44px!important;display:inline-flex!important;align-items:center!important;color:var(--v-ink)!important;font:500 12px/1.5 Inter,Arial,sans-serif!important;}
__IH58__ .ih58-category-empty {grid-column:1/-1!important;padding:24px!important;border:1px solid var(--v-line)!important;border-radius:7px!important;font:400 13px/1.7 Inter,Arial,sans-serif!important;}
__IH58__ .ih58-category-empty button {min-height:44px!important;padding:9px 13px!important;border:1px solid var(--v-line)!important;border-radius:5px!important;color:var(--v-ink)!important;background:var(--v-bg)!important;cursor:pointer!important;}
__IH58__ .ih58-category-panel :is(button,a):focus-visible {outline:2px solid var(--v-accent)!important;outline-offset:3px!important;}
@keyframes ih58-catalog-in {from{opacity:0;translate:0 9px;}to{opacity:1;translate:0 0;}}

__IH58__ .ih53-showcase-links {display:flex!important;gap:10px!important;flex-wrap:wrap!important;margin-top:24px!important;}
__IH58__ .ih53-showcase-links > a {display:inline-flex!important;align-items:center!important;justify-content:space-between!important;gap:20px!important;min-height:50px!important;padding:13px 19px!important;border:1px solid var(--v-ink)!important;border-radius:6px!important;background:var(--v-ink)!important;color:var(--v-bg)!important;-webkit-text-fill-color:currentColor!important;font:600 13px/1.5 Inter,Arial,sans-serif!important;text-decoration:none!important;box-shadow:none!important;transition:opacity 150ms!important;}
__IH58__ .ih53-showcase-links > a:last-child {background:var(--v-surface)!important;border-color:var(--v-line)!important;color:var(--v-ink)!important;}
__IH58__ .ih53-showcase-links > a > span {text-decoration:none!important;}
__IH58__ .ih53-showcase-links > a::before,__IH58__ .ih53-showcase-links > a::after {content:none!important;}
__IH58__ .ih53-showcase-links > a:hover {opacity:.85!important;}
__IH58__ .ih53-showcase-links > a:focus-visible {outline:2px solid var(--v-accent)!important;outline-offset:4px!important;}

__IH58_FILM__ {--ih57-dock:32px;}
__IH58_FILM__ .ih57-top-actions > button {width:42px!important;height:42px!important;min-width:42px!important;min-height:42px!important;}
__IH58_FILM__ .ih57-copy-window {inset:var(--ih57-head) 0 var(--ih57-dock)!important;padding-bottom:24px!important;}
__IH58_FILM__ .ih58-film-progress {position:absolute!important;z-index:5!important;bottom:0!important;left:0!important;right:0!important;display:block!important;height:calc(30px + env(safe-area-inset-bottom,0px))!important;min-height:0!important;margin:0!important;padding:0 clamp(20px,4vw,60px) env(safe-area-inset-bottom,0px)!important;background:transparent!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important;color:#fff!important;}
__IH58_FILM__ .ih58-film-progress label {position:relative!important;display:block!important;height:30px!important;width:100%!important;margin:0!important;padding:0!important;}
__IH58_FILM__ .ih58-film-progress input {appearance:none!important;-webkit-appearance:none!important;display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:30px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;background:transparent!important;cursor:pointer!important;color:#fff!important;}
__IH58_FILM__ .ih58-film-progress input::-webkit-slider-runnable-track {height:3px!important;border:0!important;border-radius:0!important;background:linear-gradient(90deg,#e1e4e3 var(--ih57-progress),#747c78 var(--ih57-progress))!important;}
__IH58_FILM__ .ih58-film-progress input::-webkit-slider-thumb {appearance:none!important;-webkit-appearance:none!important;width:12px!important;height:12px!important;margin-top:-4.5px!important;border:0!important;border-radius:50%!important;background:#fff!important;opacity:0!important;box-shadow:none!important;}
__IH58_FILM__ .ih58-film-progress input::-moz-range-track {height:3px!important;border:0!important;background:#747c78!important;}
__IH58_FILM__ .ih58-film-progress input::-moz-range-progress {height:3px!important;background:#e1e4e3!important;}
__IH58_FILM__ .ih58-film-progress input::-moz-range-thumb {width:12px!important;height:12px!important;border:0!important;border-radius:50%!important;background:#fff!important;opacity:0!important;}
__IH58_FILM__ .ih58-film-progress input:is(:hover,:focus-visible)::-webkit-slider-thumb {opacity:1!important;}
__IH58_FILM__ .ih58-film-progress input:is(:hover,:focus-visible)::-moz-range-thumb {opacity:1!important;}
__IH58_FILM__ .ih58-film-progress input:focus-visible {outline:2px solid #fff!important;outline-offset:0!important;}
__IH58_FILM__ .ih58-film-progress::before,__IH58_FILM__ .ih58-film-progress::after {content:none!important;}

@media(max-width:820px) {
 __IH58__ .ih58-category-layout {grid-template-columns:minmax(0,1fr)!important;gap:25px!important;}
 __IH58__ .ih58-category-list {grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important;}
 __IH58__ .ih58-category-option {min-height:62px!important;grid-template-columns:21px minmax(0,1fr)!important;gap:9px!important;padding:10px!important;font-size:11px!important;}
 __IH58__ .ih58-category-option small {display:none!important;}
 __IH58__ .ih58-category-icon svg {width:19px!important;height:19px!important;}
 __IH58__ .ih58-category-panel {padding:22px!important;}
 __IH58__ .ih58-category-trigger .ih-category-trigger-title {font-size:46px!important;}
 __IH58_FILM__ .ih57-top {padding-inline:18px!important;gap:10px!important;}
 __IH58_FILM__ .ih57-top-actions {gap:5px!important;}
 __IH58_FILM__ .ih57-top-actions > button {width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;}
 __IH58_FILM__ .ih57-top .ih57-brand > b {font-size:23px!important;}
 __IH58_FILM__ .ih57-top .ih57-sign {width:17px!important;height:17px!important;gap:3px!important;}
}
@media(max-width:480px) {
 __IH58__ .ih58-category-panel {padding:20px 16px!important;}
 __IH58__ .ih58-search-row {flex-direction:column!important;gap:8px!important;}
 __IH58__ .ih58-all-jobs {justify-content:space-between!important;min-height:44px!important;font-size:11px!important;}
 __IH58__ .ih58-category-search {padding-inline:11px!important;gap:8px!important;}
 __IH58__ .ih58-category-search input {font-size:16px!important;}
 __IH58__ .ih58-specialisations {grid-template-columns:minmax(0,1fr)!important;}
 __IH58__ .ih58-category-examples button {min-height:44px!important;}
 __IH58__ .ih58-category-detail {padding:18px!important;}
 __IH58__ .ih58-category-detail .ih-category-jobs-link {width:100%!important;}
 __IH58__ .ih53-showcase-links {display:grid!important;grid-template-columns:minmax(0,1fr)!important;}
 __IH58__ .ih53-showcase-links > a {width:100%!important;}
 __IH58__ .ih58-ambient::after,__IH58__ .ih58-ambient > i:nth-child(3) {display:none!important;}
}
@media(prefers-reduced-motion:reduce) {
 __IH58__ .ih58-ambient > *,__IH58__ .ih58-category-lines > i,__IH58__ .ih58-specialisation,__IH58__ .ih58-category-title {animation:none!important;transition:none!important;translate:none!important;}
}
`.replaceAll("__IH58__", "#root".repeat(26) + " .ih53-home").replaceAll("__IH58_FILM__", "body " + "#ih57-cinema".repeat(6));

const IH53_STYLES=String.raw`/* P53 — scenografia 3D i wejścia istniejących kart. Układ P43 zachowany. */
__IH53__{isolation:isolate!important;background:transparent!important;}
__IH53__ > main,__IH53__ > footer{position:relative;z-index:1;background:transparent!important;}
__IH53__ > main > :is(.categories.section,.how.section,.split-section.section){background:transparent!important;}
__IH53__ > .ih53-backdrop{display:block!important;position:fixed!important;inset:0!important;z-index:0!important;width:100%!important;height:100svh!important;pointer-events:none!important;overflow:hidden!important;}
__IH53__ .ih53-backdrop > canvas{display:block;width:100%;height:100%;pointer-events:none;}
__IH53__ .ih53-optical-fallback{position:absolute;inset:-15%;background:linear-gradient(120deg,transparent 24%,color-mix(in srgb,var(--ih-home-surface) 55%,transparent) 43%,transparent 65%);animation:ih53-optical-drift 16s ease-in-out infinite alternate;}
__IH53__ .ih53-backdrop[data-renderer=ready] .ih53-optical-fallback{display:none!important;}
@keyframes ih53-optical-drift{from{translate:-7% -10%;rotate:-4deg;}to{translate:9% 12%;rotate:4deg;}}
__IH53__ .ih53-backdrop:not([data-renderer=ready])>canvas{visibility:hidden;}
__IH53__ .ih53-mark-scene{position:absolute!important;left:32%!important;top:42%!important;display:block!important;width:126px!important;height:126px!important;transform:translate(-50%,-50%)!important;pointer-events:none!important;overflow:visible!important;}
__IH53__ .ih40-step-mark .ih53-mark-scene{left:-12px!important;top:26px!important;width:108px!important;height:86px!important;}
__IH53__ .ih53-mark-scene>canvas{display:block!important;width:100%!important;height:100%!important;border:0!important;background:transparent!important;pointer-events:none!important;}
__IH53__ .ih-category-trigger[data-ih53-ready=true] .ih-category-mark > i,__IH53__ .ih40-step[data-ih53-ready=true] .ih40-step-mark > i{opacity:0!important;}
__IH53__ .ih40-step[data-ih53-ready=true] > .ih40-step-mosaic{display:none!important;}
__IH53__ [data-ih53-tilt=true]{transform:perspective(1200px) rotateX(var(--ih53-rx,0deg)) rotateY(var(--ih53-ry,0deg))!important;transform-origin:center!important;transition:transform 180ms ease,box-shadow 180ms ease!important;will-change:transform;box-shadow:0 4px 0 -1px var(--ih-home-surface),0 5px 0 var(--ih-home-line),0 18px 32px color-mix(in srgb,var(--ih-home-ink) 12%,transparent)!important;}
__IH53__ [data-ih53-press=true]{animation:ih53-card-press 650ms cubic-bezier(.2,.8,.2,1) both!important;}
@keyframes ih53-card-press{0%,100%{rotate:1 0 0 0deg;scale:1;}35%{rotate:1 0 0 4deg;scale:.975;}65%{rotate:1 0 0 -1deg;scale:1.008;}}
__IH53__{overflow-x:clip!important;}
__IH53__ :is(.ih5-category-showcase,.steps,.split-section){perspective:1300px!important;}
__IH53__ .home-reveal{opacity:1!important;transform:none!important;filter:none!important;}
__IH53__ [data-ih53-entrance]{backface-visibility:hidden;transform-origin:50% 70%;}
__IH53__ [data-ih53-entrance=waiting]{filter:opacity(0)!important;}
__IH53__ [data-ih53-entrance=entering]{animation:ih53-section-in 1020ms cubic-bezier(.16,.85,.23,1) var(--ih53-stagger,0ms) both!important;}
__IH53__ [data-ih53-entrance=entering] [data-ih53-part]{animation:ih53-content-in 710ms cubic-bezier(.15,.8,.2,1) calc(var(--ih53-stagger,0ms) + var(--ih53-part-delay,190ms)) both!important;}
@keyframes ih53-section-in{0%{translate:var(--ih53-entry-x,0px) var(--ih53-entry-y,48px);clip-path:var(--ih53-mask,inset(0 0 100% 0));rotate:1 0 0 8deg;}65%{translate:0 -3px;clip-path:inset(0 0 0 0);rotate:1 0 0 -.7deg;}100%{translate:0 0;clip-path:inset(0 0 0 0);rotate:1 0 0 0deg;}}
@keyframes ih53-content-in{from{translate:var(--ih53-part-x,40px) 14px;clip-path:inset(0 0 100% 0);}to{translate:0 0;clip-path:inset(0 0 0 0);}}
@media(max-width:760px){__IH53__ .ih40-step-mark .ih53-mark-scene{width:98px!important;height:80px!important;top:20px!important;}__IH53__ .ih53-mark-scene{width:116px!important;height:116px!important;}}
@media(prefers-reduced-motion:reduce){__IH53__ [data-ih53-entrance],__IH53__ [data-ih53-part]{filter:none!important;pointer-events:auto!important;translate:none!important;rotate:none!important;clip-path:none!important;animation:none!important;}__IH53__ .ih53-optical-fallback{animation:none!important;}__IH53__ [data-ih53-tilt=true],__IH53__ [data-ih53-press=true]{transform:none!important;transition:none!important;animation:none!important;will-change:auto!important;}}
body.ih53-active::before,body.ih53-active::after{display:none!important;}

/* P53: biały nagłówek, oddzielone karty i dostępne rozwijanie treści. */
__IH53__ {--ih53-card:#75dfd2;--ih53-card-ink:#123e37;--ih53-card-muted:#24574f;--ih53-card-line:#49ae9e;--ih53-panel:var(--v-surface);background:var(--v-bg)!important;color:var(--v-ink)!important;}
html[data-template=classic] __IH53__ {--ih53-card:#f3f3f3;--ih53-card-ink:#191919;--ih53-card-muted:#505050;--ih53-card-line:#cecece;}
html[data-theme=dark] __IH53__ {--ih53-card:#244f48;--ih53-card-ink:#edfff9;--ih53-card-muted:#c4e5db;--ih53-card-line:#57867a;}
html[data-theme=dark][data-template=classic] __IH53__ {--ih53-card:#252525;--ih53-card-ink:#fafafa;--ih53-card-muted:#cecece;--ih53-card-line:#505050;}
__IH53__ .ih40-header-slot {z-index:200!important;background:#fff!important;}
__IH53__ .ih-home-header {--ih-home-ink:#191d1c;--ih-home-muted:#4f5754;--ih-home-surface:#fff;--ih-home-line:#dfe4e1;--ih-home-accent:#191d1c;--ih-home-on-accent:#fff;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:20px!important;width:100%!important;max-width:none!important;height:auto!important;min-height:88px!important;padding:18px clamp(20px,4vw,64px)!important;background:#fff!important;background-image:none!important;color:#191d1c!important;border:0!important;border-bottom:1px solid #e3e7e5!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important;isolation:isolate!important;overflow:visible!important;}
__IH53__ .ih-home-header::before,__IH53__ .ih-home-header::after,__IH53__ .ih-nav-pixels,__IH53__ .ih-welcome {display:none!important;}
__IH53__ .ih-home-header .logo {color:#191d1c!important;-webkit-text-fill-color:currentColor!important;font-size:30px!important;letter-spacing:-1.7px!important;white-space:nowrap!important;transform:none!important;animation:none!important;}
__IH53__ .ih-home-header .logo span {color:inherit!important;-webkit-text-fill-color:currentColor!important;}
__IH53__ .ih-home-header .nav-actions {display:flex!important;align-items:center!important;gap:12px!important;margin-left:auto!important;}
__IH53__ .ih-home-header .nav-actions .btn {display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;padding:10px 17px!important;border:1px solid #191d1c!important;border-radius:5px!important;background:#191d1c!important;color:#fff!important;font:600 12px/1.4 Inter,Arial,sans-serif!important;text-decoration:none!important;box-shadow:none!important;transform:none!important;animation:none!important;}
__IH53__ .ih-home-header .nav-actions .btn-ghost {background:#fff!important;color:#191d1c!important;border-color:transparent!important;}
__IH53__ .ih-home-header .ih-mobile-nav-toggle {display:grid!important;place-items:center!important;position:relative!important;width:46px!important;height:46px!important;min-width:46px!important;margin:0!important;padding:10px!important;border:1px solid #dfe4e1!important;border-radius:5px!important;background:#fff!important;color:#191d1c!important;box-shadow:none!important;cursor:pointer!important;}
__IH53__ .ih-home-header .ih-mobile-nav-toggle svg {display:block!important;width:24px!important;height:24px!important;stroke:currentColor!important;fill:none!important;stroke-width:1.8!important;stroke-linecap:round!important;}
__IH53__ .ih-home-header .home-nav-links {position:absolute!important;inset:calc(100% + 8px) 24px auto auto!important;display:none!important;flex-direction:column!important;align-items:stretch!important;justify-content:start!important;gap:0!important;width:300px!important;max-width:calc(100vw - 32px)!important;max-height:calc(100svh - 110px)!important;padding:8px!important;margin:0!important;overflow:auto!important;overscroll-behavior:contain!important;border:1px solid #dfe4e1!important;border-radius:8px!important;background:#fff!important;color:#191d1c!important;box-shadow:0 12px 36px #15251e15!important;transform:none!important;translate:none!important;backdrop-filter:none!important;z-index:220!important;}
__IH53__ .ih-home-header[data-mobile-menu-open=true] .home-nav-links {display:flex!important;animation:ih53-menu-in 190ms ease-out both!important;}
__IH53__ .ih-home-header .home-nav-links::before,__IH53__ .ih-home-header .home-nav-links::after,__IH53__ .ih-home-header .ih-nav-item::before,__IH53__ .ih-home-header .ih-nav-item::after {display:none!important;}
__IH53__ .ih-home-header .home-nav-links>a {display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;width:100%!important;min-height:48px!important;padding:12px 15px!important;border:0!important;border-radius:4px!important;background:#fff!important;color:#191d1c!important;font:550 14px/1.5 Inter,Arial,sans-serif!important;text-decoration:none!important;transform:none!important;animation:none!important;box-shadow:none!important;opacity:1!important;}
__IH53__ .ih-home-header .home-nav-links>a:hover {background:#f1f5f3!important;}
__IH53__ .ih-home-header .home-nav-links .ih-nav-label {transform:none!important;color:inherit!important;}
__IH53__ .ih-home-header .home-notifications-dot {position:static!important;display:block!important;width:7px!important;height:7px!important;margin-left:auto!important;background:#12675a!important;}
__IH53__ .ih-home-header .ih-mobile-nav-toggle[data-notification=true]::after {content:'';position:absolute;width:6px;height:6px;top:7px;right:7px;border-radius:50%;background:#12675a;}
__IH53__ .ih-home-header .account-mini-avatar {border-color:#dfe4e1!important;background:#eef2ef!important;color:#191d1c!important;}
body.ih53-active .ih27-home-account-menu {background:#fff!important;color:#191d1c!important;border-color:#dfe4e1!important;}
body.ih53-active .ih27-home-account-menu :is(a,strong,span) {color:#191d1c!important;}
@keyframes ih53-menu-in {from{opacity:0;translate:0 -7px;}to{opacity:1;translate:0 0;}}
__IH53__ .ih5-category-showcase {display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:24px!important;max-width:1040px!important;margin:35px auto 0!important;align-items:stretch!important;}
__IH53__ .ih-category-browser {display:contents!important;pointer-events:auto!important;}
__IH53__ .ih-category-trigger {grid-column:1!important;grid-row:1!important;display:flex!important;flex-direction:column!important;min-height:440px!important;height:auto!important;width:100%!important;padding:30px!important;position:relative!important;background:var(--ih53-card)!important;color:var(--ih53-card-ink)!important;border:1px solid var(--ih53-card-line)!important;border-radius:10px!important;box-shadow:none!important;overflow:hidden!important;}
__IH53__ .ih-category-trigger::before,__IH53__ .ih-category-trigger::after {display:none!important;}
__IH53__ .ih-category-trigger :is(span,i) {color:var(--ih53-card-ink)!important;}
__IH53__ .ih-category-mark>i {background:var(--ih53-card-ink)!important;}
__IH53__ .ih-category-trigger-title {font-size:clamp(40px,4vw,62px)!important;line-height:1.03!important;letter-spacing:-.045em!important;margin-top:auto!important;}
__IH53__ .ih-category-trigger-bottom {margin-top:28px!important;border-color:var(--ih53-card-line)!important;}
__IH53__ .ih-category-mark {flex:1 1 auto!important;min-height:105px!important;}
__IH53__ .ih53-category-expansion {grid-column:1/-1!important;grid-row:2!important;display:grid!important;grid-template-rows:0fr!important;visibility:hidden!important;transition:grid-template-rows 380ms cubic-bezier(.2,.7,.2,1),visibility 380ms,margin-top 380ms!important;}
__IH53__ .ih53-category-expansion[data-open=true] {grid-template-rows:1fr!important;visibility:visible!important;}
__IH53__ .ih53-category-clip {min-height:0!important;overflow:hidden!important;}
__IH53__ .ih-category-panel {display:block!important;position:relative!important;inset:auto!important;width:100%!important;margin:0!important;background:var(--v-surface)!important;color:var(--v-ink)!important;border:1px solid var(--v-line)!important;border-radius:10px!important;padding:28px!important;box-shadow:none!important;animation:none!important;transform:none!important;opacity:1!important;}
__IH53__ .ih-category-panel :is(h3,h4,strong) {color:var(--v-ink)!important;}
__IH53__ .ih-category-panel :is(p,.ih-category-kicker) {color:var(--v-muted)!important;}
__IH53__ .ih-category-option,__IH53__ .ih-subcategory-option {background:var(--v-surface)!important;color:var(--v-ink)!important;border-color:var(--v-line)!important;border-radius:5px!important;box-shadow:none!important;}
__IH53__ .ih-category-option[aria-pressed=true],__IH53__ .ih-subcategory-option[aria-pressed=true] {background:var(--ih53-card)!important;color:var(--ih53-card-ink)!important;}
__IH53__ .ih-category-option[aria-pressed=true] *,__IH53__ .ih-subcategory-option[aria-pressed=true] * {color:inherit!important;}
__IH53__ .ih-category-detail {background:var(--v-soft)!important;border-color:var(--v-line)!important;}
__IH53__ .ih-category-jobs-link {background:var(--v-accent)!important;color:var(--v-on)!important;border-color:var(--v-accent)!important;}
__IH53__ .ih-category-all-link {color:var(--v-ink)!important;}
__IH53__ .ih53-calculator {grid-column:2!important;grid-row:1!important;display:flex!important;flex-direction:column!important;min-height:440px!important;height:auto!important;aspect-ratio:auto!important;width:100%!important;padding:30px!important;border:1px solid var(--ih53-card-line)!important;border-radius:10px!important;background:var(--ih53-card)!important;color:var(--ih53-card-ink)!important;box-shadow:none!important;overflow:visible!important;}
__IH53__ .ih53-calculator::before,__IH53__ .ih53-calculator::after {display:none!important;}
__IH53__ .ih53-fee-heading h3 {margin:0 0 20px!important;font-size:17px!important;line-height:1.4!important;letter-spacing:-.02em!important;color:inherit!important;}
__IH53__ .ih53-fee-heading>span {display:block!important;font-size:11px!important;line-height:1.5!important;}
__IH53__ .ih53-fee-heading>strong {display:block!important;margin:2px 0 0!important;font-size:58px!important;font-weight:750!important;line-height:1.05!important;letter-spacing:-.055em!important;color:inherit!important;}
__IH53__ .ih53-fee-heading>p {margin:8px 0 20px!important;font-size:11px!important;line-height:1.5!important;color:var(--ih53-card-muted)!important;}
__IH53__ .ih53-amount {display:flex!important;flex-direction:column!important;gap:7px!important;font-size:11px!important;font-weight:550!important;color:inherit!important;}
__IH53__ .ih53-amount>span {display:flex!important;align-items:center!important;gap:12px!important;padding:0 14px 0 0!important;border:1px solid var(--ih53-card-line)!important;border-radius:6px!important;background:var(--v-surface)!important;color:var(--v-ink)!important;}
__IH53__ .ih53-amount input {display:block!important;width:100%!important;min-width:0!important;height:46px!important;margin:0!important;padding:10px 14px!important;border:0!important;border-radius:6px!important;background:var(--v-surface)!important;color:var(--v-ink)!important;font:600 18px/1.4 Inter,Arial,sans-serif!important;box-shadow:none!important;}
__IH53__ .ih53-fee-breakdown {display:grid!important;gap:10px!important;margin:20px 0 0!important;font-size:12px!important;line-height:1.5!important;}
__IH53__ .ih53-fee-breakdown>div {display:flex!important;justify-content:space-between!important;gap:15px!important;}
__IH53__ .ih53-fee-breakdown :is(dt,dd) {margin:0!important;color:inherit!important;}
__IH53__ .ih53-fee-breakdown dd {font-weight:650!important;white-space:nowrap!important;}
__IH53__ .ih53-fee-total {padding-top:12px!important;border-top:1px solid var(--ih53-card-line)!important;font-weight:650!important;}
__IH53__ .ih53-fee-note {margin:16px 0 0!important;font-size:10px!important;line-height:1.6!important;color:var(--ih53-card-muted)!important;}
__IH53__ .ih53-questions {display:grid!important;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)!important;gap:clamp(30px,5vw,80px)!important;padding-block:72px!important;align-items:start!important;}
__IH53__ .ih53-questions-intro h2 {margin:15px 0 20px!important;font-size:clamp(30px,3vw,44px)!important;font-weight:700!important;line-height:1.12!important;letter-spacing:-.045em!important;color:var(--v-ink)!important;}
__IH53__ .ih53-questions-intro p {max-width:350px!important;margin:0 0 24px!important;font-size:14px!important;line-height:1.75!important;color:var(--v-muted)!important;}
__IH53__ .ih53-questions-intro>a {display:inline-flex!important;align-items:center!important;gap:14px!important;min-height:44px!important;font-size:12px!important;color:var(--v-ink)!important;text-decoration:underline!important;text-underline-offset:4px!important;}
__IH53__ .ih53-faq {min-width:0!important;border-top:1px solid var(--v-line)!important;}
__IH53__ .ih53-faq-row {border-bottom:1px solid var(--v-line)!important;background:var(--v-bg)!important;}
__IH53__ .ih53-faq-row h3 {margin:0!important;}
__IH53__ .ih53-faq-row h3>button {display:flex!important;align-items:center!important;justify-content:space-between!important;gap:20px!important;width:100%!important;min-height:74px!important;padding:17px 4px!important;border:0!important;background:transparent!important;color:var(--v-ink)!important;font:600 15px/1.5 Inter,Arial,sans-serif!important;text-align:left!important;cursor:pointer!important;}
__IH53__ .ih53-faq-toggle {font-size:25px!important;font-weight:400!important;line-height:1!important;}
__IH53__ .ih53-faq-expansion {display:grid!important;grid-template-rows:0fr!important;visibility:hidden!important;transition:grid-template-rows 280ms ease,visibility 280ms!important;}
__IH53__ .ih53-faq-expansion[data-open=true] {grid-template-rows:1fr!important;visibility:visible!important;}
__IH53__ .ih53-faq-expansion>div {min-height:0!important;overflow:hidden!important;}
__IH53__ .ih53-faq-answer {padding:0 35px 24px 4px!important;font-size:13px!important;line-height:1.8!important;color:var(--v-muted)!important;}
__IH53__ .ih53-faq-answer p {margin:0!important;}
__IH53__ .ih53-faq-answer a {display:inline-flex!important;align-items:center!important;gap:15px!important;min-height:44px!important;margin-top:10px!important;color:var(--v-ink)!important;font-weight:600!important;text-underline-offset:4px!important;}
__IH53__ .split-section {gap:24px!important;}
__IH53__ .split-card,__IH53__ .split-card.light {background:var(--ih53-card)!important;color:var(--ih53-card-ink)!important;border:1px solid var(--ih53-card-line)!important;border-radius:10px!important;box-shadow:none!important;}
__IH53__ .split-card::before,__IH53__ .split-card::after {display:none!important;}
__IH53__ .split-card :is(.section-label,h2,p) {color:var(--ih53-card-ink)!important;-webkit-text-fill-color:currentColor!important;}
__IH53__ .split-card p {color:var(--ih53-card-muted)!important;}
__IH53__ .split-card .btn,__IH53__ .final-cta .btn {background:var(--v-surface)!important;color:var(--v-ink)!important;border:1px solid var(--ih53-card-line)!important;border-radius:5px!important;box-shadow:none!important;}
__IH53__ .final-cta {width:calc(100% - 2 * clamp(20px,4vw,64px))!important;max-width:1320px!important;margin:65px auto!important;border:1px solid var(--ih53-card-line)!important;border-radius:10px!important;background:var(--ih53-card)!important;color:var(--ih53-card-ink)!important;box-shadow:none!important;}
__IH53__ .final-cta::before,__IH53__ .final-cta::after {display:none!important;}
__IH53__ .final-cta :is(h2,.section-label),__IH53__ .final-cta-title>span {color:var(--ih53-card-ink)!important;-webkit-text-fill-color:currentColor!important;}
__IH53__ .footer {background:var(--v-bg)!important;color:var(--v-ink)!important;border-top:1px solid var(--v-line)!important;}
__IH53__ .footer :is(a,p,span) {color:inherit!important;}
__IH53__ :is(.ih53-faq-row button,.ih53-amount input,.ih-category-trigger,.ih-mobile-nav-toggle):focus-visible {outline:3px solid var(--v-accent)!important;outline-offset:4px!important;}
@media(max-width:820px) {
 __IH53__ .ih-home-header {min-height:76px!important;padding:14px 20px!important;gap:12px!important;}
 __IH53__ .ih-home-header .logo {font-size:27px!important;}
 __IH53__ .ih-home-header .nav-actions {gap:10px!important;}
 __IH53__ .ih-home-header .ih-logout-label {display:none!important;}
 __IH53__ .ih-home-header .nav-actions .ih-logout-btn {width:44px!important;min-width:44px!important;padding:10px!important;}
 __IH53__ .ih-home-header .ih-logout-icon {display:block!important;width:22px!important;height:22px!important;stroke:currentColor!important;fill:none!important;stroke-width:1.8!important;}
 __IH53__ .ih5-category-showcase {display:flex!important;flex-direction:column!important;gap:0!important;margin-top:25px!important;}
 __IH53__ .ih-category-trigger {order:0!important;min-height:330px!important;padding:25px!important;}
 __IH53__ .ih53-category-expansion {order:1!important;margin:0!important;}
 __IH53__ .ih53-category-expansion[data-open=true] {margin-top:16px!important;}
 __IH53__ .ih53-calculator {order:2!important;margin-top:20px!important;min-height:0!important;padding:25px!important;}
 __IH53__ .ih-category-panel {padding:20px!important;}
 __IH53__ .ih53-questions {grid-template-columns:1fr!important;gap:28px!important;padding-block:50px!important;}
 __IH53__ .ih53-questions-intro p {max-width:500px!important;margin-bottom:12px!important;}
 __IH53__ .ih53-faq-row h3>button {min-height:68px!important;font-size:14px!important;}
 __IH53__ .ih53-faq-answer {padding-right:15px!important;}
 __IH53__ .final-cta {margin-block:40px!important;}
}
@media(max-width:600px) {
 __IH53__ .ih-home-header .nav-actions>a.btn-dark {display:none!important;}
 __IH53__ .ih-home-header .nav-actions .btn-ghost {padding:10px 0!important;font-size:11px!important;}
 __IH53__ .ih-home-header .home-nav-links {right:16px!important;}
 __IH53__ .ih-home-header .account-mini-avatar {width:38px!important;height:38px!important;}
 __IH53__ .ih-home-header .nav-actions {gap:8px!important;}
 __IH53__ .split-section {gap:20px!important;}
 __IH53__ .ih53-fee-heading>strong {font-size:52px!important;}
}
@media(max-width:360px) {__IH53__ .ih-home-header {padding-inline:16px!important;gap:8px!important;}__IH53__ .ih-home-header .logo {font-size:25px!important;}__IH53__ .ih-home-header .nav-actions {gap:6px!important;}}
@media(prefers-reduced-motion:reduce) {__IH53__ .home-nav-links,__IH53__ .ih53-category-expansion,__IH53__ .ih53-faq-expansion {animation:none!important;transition:none!important;}}

__IH53__ .ih43-film[data-stage=jobs] {height:auto!important;min-height:700px!important;background:var(--v-bg)!important;color:var(--v-ink)!important;overflow:visible!important;}
__IH53__ .ih43-film[data-stage=jobs]>.ih43-canvas,__IH53__ .ih43-film[data-stage=jobs] .ih43-hit,__IH53__ .ih43-film[data-stage=jobs] .ih43-accessible,__IH53__ .ih43-film[data-stage=jobs] .ih43-toolbar {display:none!important;}
__IH53__ .ih53-jobs-finale {position:relative!important;display:grid!important;grid-template-rows:auto 1fr auto!important;gap:24px!important;min-height:700px!important;padding:18px clamp(24px,4.5vw,72px) 30px!important;background:var(--v-bg)!important;color:var(--v-ink)!important;font-family:Inter,Arial,sans-serif!important;text-align:left!important;animation:ih53-finale-in 550ms ease-out both;}
__IH53__ .ih53-jobs-finale * {box-sizing:border-box!important;}
__IH53__ .ih53-finale-top {display:flex!important;justify-content:flex-end!important;min-height:44px!important;}
__IH53__ .ih53-replay {display:inline-flex!important;align-items:center!important;gap:9px!important;min-height:44px!important;padding:8px 12px!important;border:1px solid var(--v-line)!important;border-radius:5px!important;background:var(--v-bg)!important;color:var(--v-ink)!important;font:550 11px/1.4 Inter,Arial!important;cursor:pointer!important;}
__IH53__ .ih53-replay>span:first-child {font-size:24px!important;}
__IH53__ .ih53-replay:disabled {opacity:.5!important;cursor:default!important;}
__IH53__ .ih53-finale-layout {display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;align-items:center!important;gap:clamp(30px,5vw,80px)!important;min-height:0!important;}
__IH53__ .ih53-finale-copy h1 {margin:0 0 20px!important;font-size:clamp(29px,3.7vw,60px)!important;line-height:1.06!important;font-weight:750!important;letter-spacing:-.055em!important;color:var(--v-ink)!important;-webkit-text-fill-color:currentColor!important;}
__IH53__ .ih53-finale-copy h1>span {display:block!important;}
__IH53__ .ih53-finale-copy>p {max-width:410px!important;margin:0!important;color:var(--v-muted)!important;font-size:14px!important;line-height:1.7!important;}
__IH53__ .ih53-finale-actions {display:flex!important;flex-wrap:wrap!important;gap:10px!important;margin-top:28px!important;}
__IH53__ .ih53-finale-actions>a {display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;min-height:48px!important;padding:12px 16px!important;border:1px solid var(--v-ink)!important;border-radius:5px!important;background:var(--v-ink)!important;color:var(--v-bg)!important;-webkit-text-fill-color:currentColor!important;text-decoration:none!important;font-size:12px!important;font-weight:600!important;}
__IH53__ .ih53-finale-actions>a+a {background:var(--v-bg)!important;color:var(--v-ink)!important;}
__IH53__ .ih53-finale-actions>a>span {font-size:18px!important;}
__IH53__ .ih53-projects {position:relative!important;min-width:0!important;}
__IH53__ .ih53-project-window {position:relative!important;overflow:hidden!important;border:1px solid var(--ih53-card-line)!important;border-radius:10px!important;background:var(--ih53-card)!important;touch-action:pan-y!important;}
__IH53__ .ih53-project-track {display:flex!important;width:100%!important;transform:translateX(0)!important;transition:none!important;}
__IH53__ .ih53-project-track[data-sliding=true] {transform:translateX(-100%)!important;transition:transform 520ms cubic-bezier(.22,.7,.2,1)!important;}
__IH53__ .ih53-project-card {position:relative!important;display:flex!important;flex-direction:column!important;flex:0 0 100%!important;min-width:0!important;min-height:450px!important;height:450px!important;width:100%!important;padding:26px!important;background:var(--ih53-card)!important;color:var(--ih53-card-ink)!important;overflow:hidden!important;}
__IH53__ .ih53-project-top {display:flex!important;align-items:start!important;justify-content:space-between!important;gap:12px!important;min-width:0!important;margin-bottom:26px!important;}
__IH53__ .ih53-project-author {display:flex!important;align-items:center!important;gap:10px!important;min-width:0!important;color:var(--ih53-card-ink)!important;text-decoration:none!important;}
__IH53__ .ih53-author-avatar {display:grid!important;place-items:center!important;flex:0 0 42px!important;width:42px!important;height:42px!important;border:1px solid var(--ih53-card-line)!important;border-radius:50%!important;overflow:hidden!important;background:var(--v-surface)!important;color:var(--v-ink)!important;font-size:17px!important;font-weight:600!important;}
__IH53__ .ih53-author-avatar img {display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;}
__IH53__ .ih53-project-author>span:last-child {display:block!important;min-width:0!important;}
__IH53__ .ih53-project-author strong {display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;max-width:210px!important;font-size:13px!important;line-height:1.5!important;font-weight:650!important;color:inherit!important;}
__IH53__ .ih53-project-author small {display:block!important;font-size:10px!important;line-height:1.5!important;color:var(--ih53-card-muted)!important;}
__IH53__ .ih53-project-category {flex:0 1 40%!important;max-width:40%!important;padding:5px 8px!important;border:1px solid var(--ih53-card-line)!important;border-radius:4px!important;color:var(--ih53-card-ink)!important;font-size:10px!important;line-height:1.5!important;overflow-wrap:anywhere!important;text-align:right!important;}
__IH53__ .ih53-project-card h3 {display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;overflow:hidden!important;margin:0 0 12px!important;font-size:clamp(24px,2.5vw,36px)!important;font-weight:700!important;line-height:1.15!important;letter-spacing:-.035em!important;color:var(--ih53-card-ink)!important;-webkit-text-fill-color:currentColor!important;overflow-wrap:anywhere!important;}
__IH53__ .ih53-project-card>p {display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important;margin:0 0 24px!important;color:var(--ih53-card-muted)!important;font-size:13px!important;line-height:1.6!important;}
__IH53__ .ih53-project-bottom {display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;margin-top:auto!important;padding-top:17px!important;border-top:1px solid var(--ih53-card-line)!important;}
__IH53__ .ih53-project-bottom small {display:block!important;font-size:10px!important;line-height:1.5!important;color:var(--ih53-card-muted)!important;}
__IH53__ .ih53-project-bottom strong {display:block!important;font-size:25px!important;font-weight:700!important;line-height:1.4!important;color:var(--ih53-card-ink)!important;white-space:nowrap!important;}
__IH53__ .ih53-project-open {display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:14px!important;min-height:44px!important;padding:10px 12px!important;border:1px solid var(--ih53-card-line)!important;border-radius:5px!important;background:var(--v-surface)!important;color:var(--v-ink)!important;text-decoration:none!important;font-size:11px!important;line-height:1.4!important;font-weight:600!important;}
__IH53__ .ih53-project-open>span {font-size:20px!important;}
__IH53__ .ih53-project-caption {margin-top:15px!important;color:var(--ih53-card-muted)!important;font-size:9px!important;line-height:1.5!important;}
__IH53__ .ih53-project-controls {display:flex!important;align-items:center!important;gap:12px!important;margin-top:12px!important;min-height:44px!important;color:var(--v-muted)!important;}
__IH53__ .ih53-project-controls>span {font-size:11px!important;font-weight:600!important;white-space:nowrap!important;}
__IH53__ .ih53-project-controls>small {font-size:10px!important;line-height:1.5!important;}
__IH53__ .ih53-project-pause {display:grid!important;place-items:center!important;flex:0 0 44px!important;width:44px!important;height:44px!important;margin-left:auto!important;padding:0!important;border:1px solid var(--v-line)!important;border-radius:5px!important;background:var(--v-bg)!important;color:var(--v-ink)!important;font:500 20px/1 Inter,Arial!important;cursor:pointer!important;}
__IH53__ .ih53-project-status {min-height:0!important;font-size:11px!important;line-height:1.5!important;}
__IH53__ .ih53-project-status>button {display:block!important;min-height:40px!important;padding:6px 0!important;border:0!important;background:var(--v-bg)!important;color:var(--v-ink)!important;font:600 11px/1.5 Inter,Arial!important;text-decoration:underline!important;text-underline-offset:4px!important;cursor:pointer!important;}
__IH53__ .ih53-finale-fee {display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:5px 18px!important;border-top:1px solid var(--v-line)!important;padding-top:18px!important;font-size:11px!important;line-height:1.6!important;}
__IH53__ .ih53-finale-fee>p {flex-basis:100%!important;margin:0!important;font-size:11px!important;line-height:1.6!important;color:var(--v-muted)!important;}
__IH53__ .ih53-project-empty {flex:0 0 100%!important;min-height:350px!important;display:grid!important;place-content:center!important;padding:25px!important;gap:15px!important;color:var(--ih53-card-ink)!important;}
__IH53__ .ih53-project-empty a {color:inherit!important;}
__IH53__ .ih53-jobs-finale :is(a,button):focus-visible {outline:3px solid var(--v-ink)!important;outline-offset:3px!important;}
@keyframes ih53-finale-in {from{opacity:0;translate:0 20px;}to{opacity:1;translate:0 0;}}
@media(max-width:820px) {
 __IH53__ .ih43-film[data-stage=jobs],__IH53__ .ih53-jobs-finale {min-height:0!important;}
 __IH53__ .ih53-jobs-finale {padding:15px 20px 26px!important;gap:22px!important;}
 __IH53__ .ih53-finale-layout {grid-template-columns:minmax(0,1fr)!important;gap:25px!important;}
 __IH53__ .ih53-finale-copy h1 {font-size:clamp(25px,7.2vw,48px)!important;margin-bottom:14px!important;}
 __IH53__ .ih53-finale-copy>p {font-size:13px!important;max-width:500px!important;}
 __IH53__ .ih53-finale-actions {display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:9px!important;margin-top:18px!important;}
 __IH53__ .ih53-finale-actions>a {font-size:11px!important;min-height:46px!important;padding:10px!important;gap:5px!important;}
 __IH53__ .ih53-project-card {padding:22px!important;min-height:375px!important;height:375px!important;}
 __IH53__ .ih53-project-top {margin-bottom:22px!important;}
 __IH53__ .ih53-project-card h3 {font-size:27px!important;-webkit-line-clamp:2!important;}
 __IH53__ .ih53-project-author strong {max-width:150px!important;}
 __IH53__ .ih53-project-category {max-width:35%!important;font-size:9px!important;}
}
@media(max-width:380px) {
 __IH53__ .ih53-jobs-finale {padding-inline:16px!important;}
 __IH53__ .ih53-project-card {padding:18px!important;}
 __IH53__ .ih53-project-author {gap:8px!important;}
 __IH53__ .ih53-author-avatar {width:36px!important;height:36px!important;flex-basis:36px!important;}
 __IH53__ .ih53-project-author strong {max-width:105px!important;font-size:12px!important;}
 __IH53__ .ih53-project-category {padding:4px 6px!important;}
 __IH53__ .ih53-project-bottom strong {font-size:22px!important;}
 __IH53__ .ih53-project-open {font-size:10px!important;padding:8px!important;gap:7px!important;}
 __IH53__ .ih53-project-open>span {display:none!important;}
 __IH53__ .ih53-project-controls>small {font-size:9px!important;}
}
@media(prefers-reduced-motion:reduce) {__IH53__ .ih53-jobs-finale {animation:none!important;}__IH53__ .ih53-project-track {transition:none!important;}}

/* P53: skróty na pasku, powitanie i powrót do wcześniejszych kart. */
__IH53__ .ih-home-header {gap:24px!important;min-height:86px!important;}
__IH53__ .ih53-primary-nav {display:flex!important;align-items:center!important;justify-content:center!important;gap:clamp(14px,2.2vw,32px)!important;flex:1 1 auto!important;min-width:0!important;margin-left:30px!important;}
__IH53__ .ih53-primary-nav>a {display:inline-flex!important;align-items:center!important;gap:7px!important;min-height:44px!important;color:#202b26!important;-webkit-text-fill-color:currentColor!important;font:600 13px/1.5 Inter,Arial,sans-serif!important;white-space:nowrap!important;text-decoration:none!important;}
__IH53__ .ih53-primary-nav>a:hover {text-decoration:underline!important;text-underline-offset:6px!important;}
__IH53__ .ih53-primary-nav .ih53-unread {width:6px!important;height:6px!important;border-radius:50%!important;background:#12695d!important;}
__IH53__ .ih-home-header .nav-actions {flex:0 0 auto!important;margin-left:0!important;}
__IH53__ .home-nav-links .ih53-menu-divider {margin:5px 12px!important;border-top:1px solid #dfe4e1!important;}
__IH53__ .ih53-menu-label {padding:9px 15px 4px!important;color:#5b675f!important;font:550 10px/1.5 Inter,Arial,sans-serif!important;}
__IH53__ .ih43-film[data-stage=welcome]>.ih43-canvas,__IH53__ .ih43-film[data-stage=welcome] .ih43-hit,__IH53__ .ih43-film[data-stage=welcome] .ih43-accessible {display:none!important;}
__IH53__ .ih43-film[data-stage=welcome] {background:var(--v-bg)!important;color:var(--v-ink)!important;}
__IH53__ .ih53-welcome-screen {position:absolute!important;inset:0!important;z-index:5!important;display:flex!important;flex-direction:column!important;justify-content:center!important;padding:36px clamp(24px,6vw,100px)!important;background:var(--v-bg)!important;color:var(--v-ink)!important;overflow:hidden!important;animation:ih53-welcome-mask 2800ms cubic-bezier(.2,.7,.2,1) both;}
__IH53__ .ih53-welcome-title {margin:auto 0!important;line-height:.94!important;}
__IH53__ .ih53-welcome-title>span {display:block!important;margin-bottom:20px!important;font-size:clamp(21px,3.5vw,58px)!important;letter-spacing:-.035em!important;font-weight:600!important;animation:ih53-welcome-line 620ms cubic-bezier(.15,.8,.2,1) both;}
__IH53__ .ih53-welcome-title>strong {display:block!important;font-size:clamp(48px,13.8vw,205px)!important;letter-spacing:-.075em!important;font-weight:800!important;line-height:.94!important;animation:ih53-welcome-line 680ms cubic-bezier(.15,.8,.2,1) 110ms both;}
__IH53__ .ih53-welcome-title>strong>span {color:#bd3828!important;}
__IH53__ .ih53-welcome-bottom {display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;min-height:44px!important;border-top:1px solid var(--v-line)!important;padding-top:18px!important;font-size:12px!important;}
__IH53__ .ih53-welcome-bottom>button {width:44px!important;height:44px!important;border:1px solid var(--v-line)!important;border-radius:50%!important;background:var(--v-bg)!important;color:var(--v-ink)!important;font-size:20px!important;cursor:pointer!important;}
__IH53__ .ih53-welcome-screen[data-paused=true],__IH53__ .ih53-welcome-screen[data-paused=true] * {animation-play-state:paused!important;}
@keyframes ih53-welcome-line {from{translate:0 80px;clip-path:inset(0 0 100% 0);}to{translate:0 0;clip-path:inset(0 0 0 0);}}
@keyframes ih53-welcome-mask {0%,84%{clip-path:inset(0 0 0 0);}100%{clip-path:inset(0 0 100% 0);}}
__IH53__ .ih53-jobs-finale {min-height:700px!important;padding-top:20px!important;}
__IH53__ .ih43-film[data-stage=jobs] {min-height:700px!important;}
__IH53__ .ih53-project-window {max-width:500px!important;margin-left:auto!important;border-radius:26px!important;background:var(--v-surface)!important;border-color:var(--v-line)!important;}
__IH53__ .ih53-project-card {min-height:335px!important;height:335px!important;padding:24px!important;background:var(--v-surface)!important;color:var(--v-ink)!important;}
__IH53__ .ih53-project-top {align-items:center!important;gap:12px!important;margin-bottom:20px!important;}
__IH53__ .ih53-project-author {color:var(--v-ink)!important;}
__IH53__ .ih53-author-avatar {width:50px!important;height:50px!important;flex-basis:50px!important;border:2px solid var(--ih53-card)!important;box-shadow:0 0 0 1px var(--v-line)!important;}
__IH53__ .ih53-project-author small,__IH53__ .ih53-project-caption,__IH53__ .ih53-project-card>p,__IH53__ .ih53-project-bottom small {color:var(--v-muted)!important;}
__IH53__ .ih53-project-category {display:grid!important;place-items:center!important;width:44px!important;height:44px!important;flex:0 0 44px!important;max-width:44px!important;border:0!important;border-radius:50%!important;padding:10px!important;background:var(--ih53-card)!important;color:var(--ih53-card-ink)!important;}
__IH53__ .ih53-project-category svg {display:block!important;width:24px!important;height:24px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.65!important;stroke-linecap:round!important;stroke-linejoin:round!important;}
__IH53__ .ih53-project-card h3 {font-size:clamp(23px,2.15vw,31px)!important;line-height:1.15!important;-webkit-line-clamp:2!important;min-height:2.3em!important;margin-bottom:10px!important;color:var(--v-ink)!important;}
__IH53__ .ih53-project-card>p {font-size:12px!important;line-height:1.55!important;margin-bottom:14px!important;-webkit-line-clamp:2!important;min-height:3.1em!important;}
__IH53__ .ih53-project-bottom {border-color:var(--v-line)!important;padding-top:13px!important;}
__IH53__ .ih53-project-bottom strong {font-size:23px!important;color:var(--v-ink)!important;}
__IH53__ .ih53-project-caption {margin-top:10px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
__IH53__ .ih53-project-controls,__IH53__ .ih53-project-status {max-width:500px!important;margin-left:auto!important;}
__IH53__ .ih53-project-pause {border-radius:50%!important;}
/* Wcześniejsze miękkie, zwarte karty; bez rozlanego turkusowego panelu. */
__IH53__ .ih5-category-showcase {max-width:860px!important;grid-template-columns:minmax(0,400px) minmax(0,400px)!important;gap:24px!important;}
__IH53__ .ih-category-trigger,__IH53__ .ih53-calculator {border-radius:24px!important;min-height:440px!important;padding:26px!important;}
__IH53__ .ih-category-trigger {background:var(--ih53-card)!important;}
__IH53__ .split-section {gap:24px!important;}
__IH53__ .split-card,__IH53__ .split-card.light {border-radius:24px!important;background:var(--v-surface)!important;border-color:var(--v-line)!important;color:var(--v-ink)!important;}
__IH53__ .split-card :is(.section-label,h2),__IH53__ .split-card p {color:var(--v-ink)!important;}
__IH53__ .split-card p {color:var(--v-muted)!important;}
__IH53__ .split-card .btn {background:var(--v-accent)!important;border-color:var(--v-accent)!important;color:var(--v-on)!important;border-radius:9px!important;}
__IH53__ .split-card.light .btn {background:var(--v-surface)!important;color:var(--v-ink)!important;border-color:var(--v-line)!important;}
__IH53__ .final-cta {width:calc(100% - 2 * clamp(20px,4vw,64px))!important;max-width:1160px!important;min-height:0!important;margin:45px auto!important;padding:55px clamp(24px,5vw,72px)!important;border:1px solid var(--v-line)!important;border-radius:24px!important;background:var(--v-surface)!important;color:var(--v-ink)!important;}
__IH53__ .final-cta :is(h2,.section-label),__IH53__ .final-cta-title>span {color:var(--v-ink)!important;}
__IH53__ .final-cta .btn {border-radius:9px!important;border-color:var(--v-accent)!important;background:var(--v-accent)!important;color:var(--v-on)!important;}
@media(max-width:1260px) {__IH53__ .ih53-primary-nav {margin-left:8px!important;gap:16px!important;}__IH53__ .ih53-primary-nav .ih53-desktop-account {display:none!important;}__IH53__ .ih-home-header {gap:16px!important;}}
@media(max-width:940px) {__IH53__ .ih53-primary-nav {display:none!important;}__IH53__ .ih-home-header .nav-actions {margin-left:auto!important;}}
@media(max-width:820px) {__IH53__ .ih-home-header {min-height:76px!important;}__IH53__ .ih53-welcome-title>strong {font-size:14vw!important;letter-spacing:-.07em!important;}__IH53__ .ih53-welcome-bottom {font-size:10px!important;}__IH53__ .ih43-film[data-stage=jobs],__IH53__ .ih53-jobs-finale {min-height:0!important;}__IH53__ .ih53-project-window,__IH53__ .ih53-project-controls,__IH53__ .ih53-project-status {max-width:none!important;margin-left:0!important;}__IH53__ .ih53-project-card {height:330px!important;min-height:330px!important;padding:22px!important;}__IH53__ .ih-category-trigger,__IH53__ .ih53-calculator {padding:25px!important;}__IH53__ .ih5-category-showcase {gap:0!important;}__IH53__ .final-cta {padding:38px 24px!important;}}
@media(max-width:380px) {__IH53__ .ih53-project-bottom strong {font-size:21px!important;}__IH53__ .ih53-project-card {padding:18px!important;}__IH53__ .ih53-project-category {width:40px!important;height:40px!important;flex-basis:40px!important;}__IH53__ .ih53-author-avatar {width:44px!important;height:44px!important;flex-basis:44px!important;}__IH53__ .ih53-project-author strong {max-width:155px!important;}}
@media(prefers-reduced-motion:reduce) {__IH53__ .ih53-welcome-screen,__IH53__ .ih53-welcome-screen * {animation:none!important;}}

`.replaceAll("__IH53__","#root".repeat(13)+" .ih53-home");
function ih53Clamp(x,a=0,b=1){return Math.max(a,Math.min(b,x));}
function ih53Ease(x){x=ih53Clamp(x);return 1-Math.pow(1-x,5);}
function ih53Mix(a,b,t){return a+(b-a)*t;}
function ih53Identity(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
function ih53Mul(a,b){const o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function ih53Transform(x,y,z,rx=0,ry=0,rz=0,scale=1,sy=scale,sz=scale){
 const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),ssy=Math.sin(ry),cz=Math.cos(rz),ssz=Math.sin(rz);
 const X=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1],Y=[cy,0,-ssy,0,0,1,0,0,ssy,0,cy,0,0,0,0,1],Z=[cz,ssz,0,0,-ssz,cz,0,0,0,0,1,0,0,0,0,1];
 const m=ih53Mul(ih53Mul(Z,Y),X);for(let r=0;r<3;r++){m[r]*=scale;m[4+r]*=sy;m[8+r]*=sz;}m[12]=x;m[13]=y;m[14]=z;return m;
}
function ih53Perspective(fov,aspect,near=.1,far=70){const f=1/Math.tan(fov/2);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function ih53Look(eye,at){const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);const z=norm(eye.map((x,i)=>x-at[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function ih53RGB(hex){return[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
function ih53Fonts(){const fonts=document.fonts;if(!fonts)return Promise.resolve();const tasks=[fonts.ready];if(fonts.load)for(const weight of [400,600,700,800])tasks.push(fonts.load(weight+' 32px Inter','Zażółć gęślą jaźń ąćęłńóśźż 5,5% IdeaHire'));return Promise.allSettled(tasks);}
function ih53CardMesh(){
 const ring=[],radius=.055,w=1.25,h=1.67;
 for(let corner=0;corner<4;corner++){const cx=corner===0||corner===3?w-radius:-w+radius,cy=corner<2?h-radius:-h+radius;for(let j=0;j<=5;j++){const a=corner*Math.PI/2+j*Math.PI/10;ring.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a)]);}}
 const vertices=[],indices=[],put=(p,n,u,v,m)=>{const i=vertices.length/9;vertices.push(...p,...n,u,v,m);return i;};
 const center=put([0,0,.025],[0,0,1],.5,.5,0),front=[];
 for(const[x,y]of ring)front.push(put([x,y,.025],[0,0,1],(x+w)/(w*2),(y+h)/(h*2),0));
 for(let i=0;i<ring.length;i++)indices.push(center,front[i],front[(i+1)%ring.length]);
 for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,n=[dy/length,-dx/length,0];const start=vertices.length/9;for(const[p,z]of [[a,.025],[b,.025],[b,-.025],[a,-.025]])put([p[0],p[1],z],n,0,0,1);indices.push(start,start+1,start+2,start,start+2,start+3);}
 const back=vertices.length/9;for(const p of [[-w,-h],[w,-h],[w,h],[-w,h]])put([...p,-.025],[0,0,-1],0,0,1);indices.push(back,back+2,back+1,back,back+3,back+2);
 return{vertices,indices};
}
function ih53ShadowMesh(){return{vertices:[-1,-1,0,0,0,1,0,0,0,1,-1,0,0,0,1,1,0,0,1,1,0,0,0,1,1,1,0,-1,1,0,0,0,1,0,1,0],indices:[0,1,2,0,2,3]};}
/* P53: optyczna głębia powierzchni. Brak obiektów, modeli i figur w tle. */
const IH53_OPTICS_VERTEX=String.raw`
attribute vec2 aCoord;varying vec2 vUv;
void main(){vUv=aCoord*.5+.5;gl_Position=vec4(aCoord,0.0,1.0);}`;
const IH53_OPTICS_FRAGMENT=String.raw`
precision highp float;
uniform vec2 uResolution,uPointer;uniform float uTime,uScroll,uDark;
uniform vec3 uBG,uPaper,uShade;varying vec2 vUv;
void main(){
 vec2 p=(vUv-.5)*vec2(uResolution.x/uResolution.y,1.0);p+=uPointer*vec2(.045,.025);
 float t=uTime*.22+uScroll*.24;
 float a=p.x*1.55+p.y*.7+t,b=p.y*2.0-p.x*.45-t*.65;
 vec3 normal=normalize(vec3(-.18*cos(a)+.055*cos(b),-.095*cos(a)-.16*cos(b),1.0));
 vec3 light=normalize(vec3(-.60+sin(t*.35)*.25,.70,1.0));
 float diffuse=dot(normal,light),spec=pow(max(0.0,dot(normal,normalize(light+vec3(0.0,0.0,1.0)))),18.0);
 float sweep=1.15-mod(uTime*.19+uScroll*.15,2.30);
 float lane=p.y+p.x*.32+sin(p.x*.8+t*.6)*.16-sweep;
 float sheen=exp(-lane*lane*11.0),glint=exp(-lane*lane*95.0),shadow=exp(-pow((lane+.19)*4.5,2.0));
 float depth=clamp( .12+shadow*.24+(1.0-diffuse)*.12,0.0,.37);
 vec3 low=mix(uBG,uShade,mix(depth,.055,uDark));
 vec3 high=mix(mix(uPaper,vec3(1.0),.12*(1.0-uDark)),uShade,uDark*.42);
 vec3 col=mix(low,high,clamp(sheen*.45+glint*.32+spec*.12,0.0,.82));
 gl_FragColor=vec4(col,1.0);
}`;
function ih53OpticsRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return null;
 let program=null,buffer=null;const shaders=[];
 const destroy=()=>{if(buffer)gl.deleteBuffer(buffer);shaders.forEach(sh=>gl.deleteShader(sh));if(program)gl.deleteProgram(program);};
 try{
  program=gl.createProgram();for(const[kind,source]of[[gl.VERTEX_SHADER,IH53_OPTICS_VERTEX],[gl.FRAGMENT_SHADER,IH53_OPTICS_FRAGMENT]]){const sh=gl.createShader(kind);shaders.push(sh);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('optics shader');gl.attachShader(program,sh);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('optics link');
  const uniforms={};for(const name of['uResolution','uPointer','uTime','uScroll','uDark','uBG','uPaper','uShade'])uniforms[name]=gl.getUniformLocation(program,name);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const coord=gl.getAttribLocation(program,'aCoord');
  return{draw(w,h,s){if(gl.isContextLost())return false;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.useProgram(program);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(coord);gl.vertexAttribPointer(coord,2,gl.FLOAT,false,0,0);gl.uniform2f(uniforms.uResolution,s.cssWidth,s.cssHeight);gl.uniform2f(uniforms.uPointer,s.x||0,s.y||0);gl.uniform1f(uniforms.uTime,s.reduced?0:s.time);gl.uniform1f(uniforms.uScroll,s.scroll||0);const bg=ih53RGB(s.palette.bg);gl.uniform1f(uniforms.uDark,bg.reduce((a,v)=>a+v,0)<1?1:0);for(const[name,value]of[['uBG',bg],['uPaper',ih53RGB(s.palette.paper)],['uShade',ih53RGB(bg.reduce((a,v)=>a+v,0)<1?s.palette.material:'#edf4f2')]])gl.uniform3fv(uniforms[name],new Float32Array(value));gl.drawArrays(gl.TRIANGLES,0,6);return true;},destroy};
 }catch{destroy();return null;}
}
/* P53 — sceny dodane do istniejących kart; żadna scena nie steruje układem. */
const IH53_VERTEX=String.raw`
precision highp float;attribute vec3 aPosition,aNormal;attribute vec2 aUV;attribute float aMaterial;
uniform mat4 uModel,uVP;varying vec3 vPosition,vNormal;varying vec2 vUV;varying float vMaterial;
void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=normalize(mat3(uModel)*aNormal);vUV=aUV;vMaterial=aMaterial;gl_Position=uVP*p;}`;
const IH53_FRAGMENT=String.raw`
precision highp float;uniform vec3 uEye,uBase,uLight,uBG,uInk;uniform float uKind,uAlpha,uTime;uniform sampler2D uTexture;
varying vec3 vPosition,vNormal;varying vec2 vUV;varying float vMaterial;
void main(){vec3 n=normalize(vNormal),eye=normalize(uEye-vPosition);if(dot(n,eye)<0.0)n=-n;
 vec3 light=normalize(vec3(-4.0+sin(uTime*.32)*2.0,6.0,9.0)-vPosition);float diffuse=max(0.0,dot(n,light));float spec=pow(max(0.0,dot(n,normalize(light+eye))),35.0);
 vec3 col=uBase*(.63+.34*diffuse)+uLight*spec*.16;float alpha=uAlpha;
 if(uKind<.5&&vMaterial<.5)col=texture2D(uTexture,vUV).rgb*(.98+.02*diffuse);
 if(uKind>2.5){vec2 p=(vUV-.5)*2.0;alpha*=exp(-4.0*dot(p,p));col=uInk;}
 gl_FragColor=vec4(clamp(col,0.0,1.0),alpha);}`;
function ih53Fee(amount){const o=IDEA_HIRE_PUBLIC_OFFER;return Math.round(Math.max(o.minimum,Math.min(o.maximum,amount*o.percent/100))*100)/100;}
function ih53Money(value,english){return Number(value).toLocaleString(english?'en-GB':'pl-PL',{maximumFractionDigits:2})+(english?' PLN':' zł');}
function ih53Receipt(s){
 const c=document.createElement('canvas');c.width=1080;c.height=370;const x=c.getContext('2d'),p=s.palette,en=s.english;
 x.fillStyle=p.paper;x.fillRect(0,0,1080,370);x.strokeStyle=p.line;x.lineWidth=2;x.strokeRect(2,2,1076,366);x.fillStyle=p.ink;
 x.font='600 22px Inter,Arial';x.fillText('IDEAHIRE / '+(en?'CALCULATION':'OBLICZENIE'),42,51);x.font='700 114px Inter,Arial';x.fillText(en?'5.5%':'5,5%',39,190);
 x.font='500 25px Inter,Arial';x.fillText(en?'IdeaHire fee':'Prowizja IdeaHire',47,238);x.font='700 40px Inter,Arial';x.fillText(ih53Money(ih53Fee(s.amount),en),47,308);
 x.strokeStyle=p.line;x.beginPath();x.moveTo(452,95);x.lineTo(452,321);x.stroke();x.font='500 24px Inter,Arial';x.fillText(en?'Professional receives':'Wykonawca otrzymuje',498,134);x.font='700 43px Inter,Arial';x.fillText(ih53Money(s.amount,en),498,195);x.font='500 22px Inter,Arial';x.fillText(en?'Client total':'Klient płaci łącznie',498,259);x.font='700 39px Inter,Arial';x.fillText(ih53Money(s.amount+ih53Fee(s.amount),en),498,315);return c;
}
function ih53ScenePlan(s,w,h){
 const mode=s.mode,aspect=w/Math.max(1,h),x=s.x||0,y=s.y||0,t=s.time;
 const eye=mode==='background'?[x*.48,.35+y*.32,12]:mode==='mark'?[.15+x*.30,.3+y*.22,5.7]:[.2+x*.25,.5+y*.18,Math.max(2.7,6.0/aspect)];
 const vp=ih53Mul(ih53Perspective((mode==='background'?45:38)*Math.PI/180,aspect),ih53Look(eye,[0,0,0])),calls=[];
 if(mode==='background'){
  return{eye,vp,calls};
 }else if(mode==='mark'){
  const build=s.reduced?1:ih53Ease(s.build/.8),spread=1-build;
  for(let group=0;group<4;group++)for(let cell=0;cell<16;cell++){
   const gx=(group%2-.5)*1.17,gy=(.5-Math.floor(group/2))*1.17,cx=(cell%4-1.5)*.245,cy=(1.5-Math.floor(cell/4))*.245;
   const seed=((cell*17+group*29)%67)/67,delay=ih53Ease((s.build-seed*.13)/.62),splay=s.reduced?0:1-delay;
   const xx=gx+cx+splay*(cx+gx)*1.2,yy=gy+cy+splay*(cy+gy)*1.2,zz=splay*(.5+seed*.9);
   calls.push({mesh:'card',kind:1,alpha:1,model:ih53Transform(xx,yy,zz,-.12+y*.09+splay*.6,.18+x*.18+splay*(seed-.5),spread*(seed-.5)*.3,.097,.073,.70)});
  }
 }else{
  const turn=s.reduced?0:Math.sin(t*.55)*.018;
  calls.push({mesh:'shadow',kind:3,alpha:.14,model:ih53Transform(0,-.89,-.35,-Math.PI/2,0,0,2.4,.65,1)});
  calls.push({mesh:'card',kind:0,alpha:1,model:ih53Transform(0,.05,0,-.10+y*.035,-.13+x*.09,-.025+turn,1.48,.378,1.1)});
 }
 return{eye,vp,calls};
}
function ih53Renderer(canvas,mode){
 if(mode==='background')return ih53OpticsRenderer(canvas);
 const gl=canvas.getContext('webgl',{alpha:mode!=='background',antialias:true,powerPreference:'low-power'});if(!gl)return null;
 const shaders=[],buffers=[];let program,texture=null,signature='';
 try{program=gl.createProgram();for(const[type,source]of[[gl.VERTEX_SHADER,IH53_VERTEX],[gl.FRAGMENT_SHADER,IH53_FRAGMENT]]){const sh=gl.createShader(type);shaders.push(sh);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('scene shader');gl.attachShader(program,sh);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('scene link');gl.useProgram(program);
  const meshes={};for(const[name,data]of Object.entries({card:ih53CardMesh(),shadow:ih53ShadowMesh()})){const vb=gl.createBuffer(),ib=gl.createBuffer();buffers.push(vb,ib);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.vertices),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(data.indices),gl.STATIC_DRAW);meshes[name]={vb,ib,count:data.indices.length};}
  const uniforms={},attributes={};for(const key of['uModel','uVP','uEye','uBase','uLight','uBG','uInk','uKind','uAlpha','uTexture','uTime'])uniforms[key]=gl.getUniformLocation(program,key);for(const key of['aPosition','aNormal','aUV','aMaterial'])attributes[key]=gl.getAttribLocation(program,key);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));for(const[k,v]of[[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);gl.uniform1i(uniforms.uTexture,0);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  return{draw(width,height,s){
   if(gl.isContextLost())return false;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}gl.viewport(0,0,width,height);gl.useProgram(program);const p=s.palette,bg=ih53RGB(p.bg),plan=ih53ScenePlan(s,s.cssWidth,s.cssHeight);gl.clearColor(...(mode==='background'?bg:[0,0,0]),mode==='background'?1:0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniformMatrix4fv(uniforms.uVP,false,new Float32Array(plan.vp));gl.uniform1f(uniforms.uTime,s.reduced?0:s.time);for(const[key,value]of[['uEye',plan.eye],['uBase',s.markColor||ih53RGB(p.material)],['uLight',ih53RGB(p.paper)],['uBG',bg],['uInk',ih53RGB(p.ink)]])gl.uniform3fv(uniforms[key],new Float32Array(value));
   if(mode==='receipt'){const next=JSON.stringify([p,s.amount,s.english,s.fontCycle]);if(signature!==next){signature=next;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,ih53Receipt(s));for(const[k,v]of[[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);}gl.uniform1i(uniforms.uTexture,0);}
   for(const call of plan.calls){const mesh=meshes[call.mesh];gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ib);for(const[key,size,offset]of[['aPosition',3,0],['aNormal',3,12],['aUV',2,24],['aMaterial',1,32]]){const a=attributes[key];gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,36,offset);}gl.uniformMatrix4fv(uniforms.uModel,false,new Float32Array(call.model));gl.uniform1f(uniforms.uKind,call.kind);gl.uniform1f(uniforms.uAlpha,call.alpha);if(texture)gl.bindTexture(gl.TEXTURE_2D,texture);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}
   return true;
  },destroy(){buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(sh=>gl.deleteShader(sh));if(texture)gl.deleteTexture(texture);gl.deleteProgram(program);}};
 }catch{buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(sh=>gl.deleteShader(sh));if(texture)gl.deleteTexture(texture);if(program)gl.deleteProgram(program);return null;}
}
function ih53StartScene(canvas,host,owner,state){
 let engine=null,dead=false,frame=0,last=0,lastDraw=0,visible=true,dirty=true,observer,resize;const listeners=[];

 const listen=(node,event,fn,options)=>{node.addEventListener(event,fn,options);listeners.push(()=>node.removeEventListener(event,fn,options));};
 if(state.current.mode==='background')state.current.scroll=state.current.targetScroll=(window.scrollY||0)/Math.max(1,window.innerHeight);
 const create=()=>{engine?.destroy();engine=ih53Renderer(canvas,state.current.mode);host.dataset.renderer=engine?'loading':'fallback';if(state.current.mode==='mark')owner.dataset.ih53Ready='false';};
 function tick(now){frame=0;if(dead||!visible||document.hidden)return;const s=state.current,interval=window.innerWidth<821?1000/30:1000/40;
  if(!s.paused&&!s.reduced&&lastDraw&&now-lastDraw<interval-1){frame=requestAnimationFrame(tick);return;}const dt=last?Math.min(.08,(now-last)/1000):0;last=now;lastDraw=now;
  if(!s.paused&&!s.reduced){s.time+=dt;s.build+=dt;s.settle+=dt;s.x+=(s.targetX-s.x)*.14;s.y+=(s.targetY-s.y)*.14;s.scroll+=(s.targetScroll-s.scroll)*.10;}
  if(dirty){const b=host.getBoundingClientRect();s.cssWidth=Math.max(1,b.width);s.cssHeight=Math.max(1,b.height);const budget=s.mode==='background'?(window.innerWidth<821?400000:800000):s.mode==='mark'?30000:220000,dpr=Math.min(window.devicePixelRatio||1,1.6,Math.sqrt(budget/(s.cssWidth*s.cssHeight)));s.width=Math.max(1,Math.round(s.cssWidth*dpr));s.height=Math.max(1,Math.round(s.cssHeight*dpr));dirty=false;}

  try{const drawn=engine?.draw(s.width,s.height,s);if(drawn){host.dataset.renderer='ready';if(s.mode==='mark')owner.dataset.ih53Ready='true';}}catch{engine?.destroy();engine=null;host.dataset.renderer='fallback';if(s.mode==='mark')owner.dataset.ih53Ready='false';}
  if(engine&&!s.paused&&!s.reduced&&(s.mode!=='mark'||s.active||s.build<1.05||s.settle<.55))frame=requestAnimationFrame(tick);
 }
 const wake=()=>{if(!dead&&visible&&!document.hidden&&!frame){last=0;lastDraw=0;frame=requestAnimationFrame(tick);}};
 const replay=()=>{const s=state.current;if(!s.reduced&&!s.paused){s.build=0;s.settle=0;}wake();};
 create();listen(window,'resize',()=>{dirty=true;wake();},{passive:true});listen(window,'scroll',()=>{state.current.targetScroll=(window.scrollY||0)/Math.max(1,window.innerHeight);wake();},{passive:true});
 listen(owner,'pointermove',e=>{if(e.pointerType!=='mouse'||state.current.reduced||state.current.paused)return;const b=owner.getBoundingClientRect();state.current.targetX=(e.clientX-b.left)/Math.max(1,b.width)*2-1;state.current.targetY=(e.clientY-b.top)/Math.max(1,b.height)*2-1;state.current.settle=0;wake();},{passive:true});
 listen(owner,'pointerenter',e=>{if(e.pointerType==='mouse'){state.current.active=true;replay();}});listen(owner,'pointerleave',()=>{Object.assign(state.current,{active:false,targetX:0,targetY:0,settle:0});wake();});
 if(state.current.mode==='mark'){listen(owner,'ih53-card-enter',replay);listen(owner,'focusin',replay);listen(owner,'click',replay);listen(owner,'focusout',()=>{state.current.active=false;wake();});}
 listen(window,'ih53-motion',e=>{state.current.paused=!!e.detail?.paused;wake();});
 listen(document,'visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden)wake();});
 listen(canvas,'webglcontextlost',e=>{e.preventDefault();engine?.destroy();engine=null;host.dataset.renderer='fallback';if(state.current.mode==='mark')owner.dataset.ih53Ready='false';cancelAnimationFrame(frame);frame=0;});listen(canvas,'webglcontextrestored',()=>{create();dirty=true;wake();});
 if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}},{rootMargin:state.current.mode==='background'?'0px':'60px'});observer.observe(host);}
 if(typeof ResizeObserver!=='undefined'){resize=new ResizeObserver(()=>{dirty=true;wake();});resize.observe(host);}
 if(state.current.mode==='receipt')ih53Fonts().then(()=>{if(!dead){state.current.fontCycle=(state.current.fontCycle||0)+1;wake();}}).catch(()=>{});
 wake();return{wake,replay,destroy(){dead=true;cancelAnimationFrame(frame);listeners.forEach(fn=>fn());observer?.disconnect();resize?.disconnect();engine?.destroy();if(state.current.mode==='mark')delete owner.dataset.ih53Ready;}};
}
function ih53Initial(mode,palette,reduced,english=false,amount=500){return{mode,palette,reduced,english,amount,paused:IH53_MOTION.paused,time:0,build:1.2,settle:1,x:0,y:0,targetX:0,targetY:0,scroll:0,targetScroll:0,active:false};}
const IH53_MOTION={paused:false};
function useIH53Reduced(){const[value,setValue]=useState(()=>typeof window!=='undefined'&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const m=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!m)return;const change=()=>setValue(m.matches);m.addEventListener?.('change',change);return()=>m.removeEventListener?.('change',change);},[]);return value;}
function ih53Palette(site){return IDEA_HIRE_VISUAL_SYSTEM[site.template==='classic'?(site.theme==='dark'?'monoDark':'mono'):(site.theme==='dark'?'turquoiseDark':'turquoise')];}
function IH53Backdrop({rootRef}){
 const host=useRef(null),canvas=useRef(null),site=useSitePreferences(),reduced=useIH53Reduced(),palette=ih53Palette(site);
 useEffect(()=>{const state={current:ih53Initial('background',palette,reduced)};const engine=ih53StartScene(canvas.current,host.current,rootRef.current,state);return()=>engine.destroy();},[palette,reduced]);
 return <div className="ih53-backdrop" ref={host} aria-hidden="true"><div className="ih53-optical-fallback"/><canvas ref={canvas}/></div>;
}
function ih53Entrances(root,reduced){
 const selector='.ih-category-trigger,.ih5-story,.ih53-showcase-tile,.split-section > .split-card,.final-cta,.section-heading,.ih-demo-reviews-heading';
 const nodes=Array.from(root.querySelectorAll(selector)),records=new Map();let observer=null,paused=IH53_MOTION.paused,dead=false;
 const finish=node=>{const record=records.get(node);if(!record)return;clearTimeout(record.timer);record.timer=0;node.dataset.ih53Entrance='shown';if(!dead&&!reduced&&!paused)observer?.observe(node);};
 const reveal=(node,immediate=false,delay=0)=>{
  const record=records.get(node);if(!record)return;
  if(immediate){finish(node);return;}if(node.dataset.ih53Entrance==='entering'||node.dataset.ih53Entrance==='shown')return;
  observer?.unobserve(node);node.style.setProperty('--ih53-stagger',delay+'ms');node.dataset.ih53Entrance='entering';node.dispatchEvent(new CustomEvent('ih53-card-enter',{bubbles:true}));node.querySelector('.ih-category-trigger')?.dispatchEvent(new CustomEvent('ih53-card-enter'));
  record.timer=setTimeout(()=>finish(node),1320+delay);
 };
 nodes.forEach((node,index)=>{
  const siblings=Array.from(node.parentElement?.children||[]),ordinal=Math.max(0,siblings.indexOf(node)),up=node.matches('.final-cta,.section-heading,.ih-demo-reviews-heading');
  node.style.setProperty('--ih53-entry-x',up?'0px':ordinal%2?'76px':'-76px');node.style.setProperty('--ih53-entry-y',up?'72px':'28px');node.style.setProperty('--ih53-mask',up?'inset(0 0 100% 0)':ordinal%2?'inset(0 0 0 100%)':'inset(0 100% 0 0)');
  const parts=Array.from(node.querySelectorAll('.ih40-step-number,.ih40-step-title,.ih40-step-copy,:scope > .section-label,:scope > h2:not(.final-cta-title),:scope > p,:scope > .btn,.final-cta-title > span'));
  parts.forEach((part,i)=>{part.dataset.ih53Part='true';part.style.setProperty('--ih53-part-x',part.matches('.btn')?(ordinal%2?'-56px':'56px'):i%2?'32px':'-32px');part.style.setProperty('--ih53-part-delay',190+Math.min(i,4)*90+'ms');});records.set(node,{timer:0,parts});
 });
 const focus=e=>{const node=e.target.closest?.(selector);if(node)reveal(node,true);};
 const motion=e=>{paused=!!e.detail?.paused;if(paused){observer?.disconnect();nodes.forEach(n=>reveal(n,true));}else if(!reduced)nodes.forEach(n=>observer?.observe(n));};
 if(!reduced&&!paused&&typeof IntersectionObserver!=='undefined')try{
  observer=new IntersectionObserver(entries=>{if(dead)return;let count=0;for(const entry of entries){const node=entry.target;if(entry.isIntersecting){reveal(node,paused,count++*85);}else if(node.dataset.ih53Entrance!=='entering'){const b=entry.boundingClientRect;if(b.bottom<=0||b.top>=window.innerHeight)node.dataset.ih53Entrance='waiting';}}},{threshold:0,rootMargin:'0px 0px -40px 0px'});
  nodes.forEach(node=>{const b=node.getBoundingClientRect();if(!b.width||!b.height){finish(node);observer.unobserve(node);return;}node.dataset.ih53Entrance=b.bottom<=0?'shown':'waiting';observer.observe(node);});
 }catch{observer?.disconnect();nodes.forEach(n=>finish(n));}else nodes.forEach(n=>finish(n));
 root.addEventListener('focusin',focus);root.addEventListener('pointerdown',focus,true);window.addEventListener('ih53-motion',motion);
 return()=>{dead=true;observer?.disconnect();root.removeEventListener('focusin',focus);root.removeEventListener('pointerdown',focus,true);window.removeEventListener('ih53-motion',motion);for(const[node,{timer,parts}]of records){clearTimeout(timer);delete node.dataset.ih53Entrance;for(const key of['--ih53-stagger','--ih53-entry-x','--ih53-entry-y','--ih53-mask'])node.style.removeProperty(key);parts.forEach(part=>{delete part.dataset.ih53Part;part.style.removeProperty('--ih53-part-x');part.style.removeProperty('--ih53-part-delay');});}};
}
function useIH53LegacyEnhancements(rootRef){
 const site=useSitePreferences(),reduced=useIH53Reduced(),palette=ih53Palette(site);
 useLayoutEffect(()=>{document.body.classList.add('ih53-active');return()=>document.body.classList.remove('ih53-active');},[]);
 useEffect(()=>{
  const root=rootRef.current;if(!root)return;
  const marks=[],presses=new Map(),stopEntrances=ih53Entrances(root,reduced);let frame=0,pending=null,current=null;
  for(const mark of root.querySelectorAll('.ih-category-mark')){
   const owner=mark.closest('.ih-category-trigger,.ih40-step');if(!owner)continue;
   const host=document.createElement('span'),canvas=document.createElement('canvas');host.className='ih53-mark-scene';host.setAttribute('aria-hidden','true');host.appendChild(canvas);mark.appendChild(host);
   const state={current:ih53Initial('mark',palette,reduced)};state.current.markColor=ih53RGB(palette.ink);const sample=mark.querySelector('i');const color=sample?getComputedStyle(sample).backgroundColor:'';const numbers=color.match(/[\d.]+/g);if(numbers?.length>=3&&(numbers.length<4||Number(numbers[3])>=.5))state.current.markColor=numbers.slice(0,3).map(v=>Number(v)/255);
   const engine=ih53StartScene(canvas,host,owner,state);marks.push({engine,host,mark});
  }
  const reset=()=>{if(current){current.style.removeProperty('--ih53-rx');current.style.removeProperty('--ih53-ry');current.removeAttribute('data-ih53-tilt');current=null;}};
  const move=e=>{if(e.pointerType!=='mouse'||reduced||IH53_MOTION.paused)return;const target=e.target.closest?.('.ih-category-trigger,.ih40-step > button,.split-card');if(!target){reset();return;}pending={target,x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(!pending)return;const{target,x,y}=pending,b=target.getBoundingClientRect();if(current!==target)reset();current=target;target.dataset.ih53Tilt='true';target.style.setProperty('--ih53-rx',((.5-(y-b.top)/Math.max(1,b.height))*8).toFixed(2)+'deg');target.style.setProperty('--ih53-ry',(((x-b.left)/Math.max(1,b.width)-.5)*8).toFixed(2)+'deg');});};
  const clearPresses=()=>{presses.forEach((timer,target)=>{clearTimeout(timer);target.removeAttribute('data-ih53-press');});presses.clear();};
  const press=e=>{if(e.pointerType==='mouse'||reduced||IH53_MOTION.paused)return;const target=e.target.closest?.('.ih-category-trigger,.ih40-step > button');if(!target)return;clearTimeout(presses.get(target));target.dataset.ih53Press='true';presses.set(target,setTimeout(()=>{target.removeAttribute('data-ih53-press');presses.delete(target);},680));};
  root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerdown',press,{passive:true});root.addEventListener('pointercancel',clearPresses);root.addEventListener('pointerleave',reset);window.addEventListener('blur',reset);
  return()=>{stopEntrances();cancelAnimationFrame(frame);reset();clearPresses();root.removeEventListener('pointermove',move);root.removeEventListener('pointerdown',press);root.removeEventListener('pointercancel',clearPresses);root.removeEventListener('pointerleave',reset);window.removeEventListener('blur',reset);marks.forEach(({engine,host,mark})=>{engine.destroy();host.remove();delete mark.dataset.ih53Ready;});};
 },[rootRef,palette,reduced]);
}
function IH53CommissionStory(){
 const site=useSitePreferences(),en=site.language==='en',[draft,setDraft]=useState('500');
 const amount=ih53Clamp(Number(draft)||1,1,IDEA_HIRE_PUBLIC_OFFER.orderLimit),fee=ih53Fee(amount);
 return <aside className="ih5-story ih53-calculator" data-no-translate="true" aria-labelledby="ih53-fee-title">
  <div className="ih53-fee-heading"><h3 id="ih53-fee-title">{en?'Know the cost before you start':'Sprawdź koszt przed rozpoczęciem'}</h3><span>{en?'IdeaHire fee':'Prowizja IdeaHire'}</span><strong>{en?'5.5%':'5,5%'}</strong><p>{en?'Minimum PLN 20 · maximum PLN 229':'Minimum 20 zł · maksimum 229 zł'}</p></div>
  <label className="ih53-amount">{en?'Agreed project amount':'Ustalona kwota zlecenia'}<span><input type="number" min="1" max={IDEA_HIRE_PUBLIC_OFFER.orderLimit} step="1" inputMode="decimal" value={draft} onChange={e=>setDraft(e.target.value)} onBlur={()=>setDraft(String(amount))}/><span>{en?'PLN':'zł'}</span></span></label>
  <dl className="ih53-fee-breakdown" aria-live="polite"><div><dt>{en?'Freelancer receives':'Wykonawca otrzymuje'}</dt><dd>{ih53Money(amount,en)}</dd></div><div><dt>{en?'IdeaHire fee':'Prowizja IdeaHire'}</dt><dd>{ih53Money(fee,en)}</dd></div><div className="ih53-fee-total"><dt>{en?'Client pays in total':'Zleceniodawca płaci łącznie'}</dt><dd><output>{ih53Money(amount+fee,en)}</output></dd></div></dl>
  <p className="ih53-fee-note">{en?'The fee is paid only by the client. The freelancer receives the full agreed amount. Projects up to PLN 10,000.':'Prowizję płaci wyłącznie zleceniodawca. Wykonawca otrzymuje całą ustaloną kwotę. Zlecenia do 10 000 zł.'}</p>
 </aside>;
}
function IH53Welcome({paused,onPause,onDone}){
 const en=useSitePreferences().language==='en',elapsed=useRef(0),host=useRef(null),done=useRef(onDone),[visible,setVisible]=useState(true),[hidden,setHidden]=useState(()=>document.hidden);done.current=onDone;
 useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[]);
 useEffect(()=>{if(typeof IntersectionObserver==='undefined')return;let io;try{io=new IntersectionObserver(entries=>setVisible(!!entries[0]?.isIntersecting),{threshold:0});io.observe(host.current);}catch{}return()=>io?.disconnect();},[]);
 useEffect(()=>{if(paused||hidden||!visible)return;let frame=0,last=0,dead=false;function tick(now){if(dead)return;if(last)elapsed.current+=Math.max(0,now-last);last=now;if(elapsed.current>=2800){done.current();return;}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);return()=>{dead=true;cancelAnimationFrame(frame);};},[paused,hidden,visible]);
 return <div ref={host} className="ih53-welcome-screen" data-paused={paused||hidden||!visible} data-no-translate="true"><div className="ih53-welcome-title" role="status"><span>{en?'WELCOME TO':'WITAMY W'}</span><strong>IDEAHIRE<span aria-hidden="true">.</span></strong></div><div className="ih53-welcome-bottom"><span>{en?'Projects. People. Collaboration.':'Projekty. Ludzie. Współpraca.'}</span><button type="button" onClick={onPause} aria-label={en?(paused?'Resume welcome':'Pause welcome'):(paused?'Wznów powitanie':'Zatrzymaj powitanie')} aria-pressed={paused}>{paused?'▶':'Ⅱ'}</button></div></div>;
}
/* P57: odtwarzacz odzyskany z zachowanego podglądu filmu. */
var IH57_STYLES = String.raw`@font-face{font-family:IdeaHireFilmText;src:url('/media/ideahire-film-text.woff2') format('woff2');font-weight:400;font-style:normal;font-display:optional;}
@font-face{font-family:IdeaHireFilmDisplay;src:url('/media/ideahire-film-display.woff2') format('woff2');font-weight:800;font-style:normal;font-display:optional;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-showcase{display:grid!important;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important;align-items:center!important;gap:clamp(32px,6vw,100px)!important;padding-block:65px!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih53-showcase-copy h2{margin:18px 0 23px!important;font:700 clamp(33px,3.4vw,52px)/1.08 Inter,Arial,sans-serif!important;letter-spacing:-.045em!important;color:var(--v-ink)!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih53-showcase-copy>p{max-width:430px!important;margin:0 0 25px!important;color:var(--v-muted)!important;font:400 14px/1.8 Inter,Arial,sans-serif!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih53-showcase-invitation{display:block!important;max-width:400px!important;color:var(--v-muted)!important;font:400 12px/1.7 Inter,Arial,sans-serif!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih53-showcase-links{display:flex!important;flex-wrap:wrap!important;gap:15px 24px!important;margin-top:23px!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih53-showcase-links>a{display:inline-flex!important;align-items:center!important;gap:18px!important;min-height:44px!important;color:var(--v-ink)!important;font:600 13px/1.5 Inter,Arial,sans-serif!important;text-decoration:underline!important;text-underline-offset:5px!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile{position:relative!important;display:block!important;isolation:isolate!important;aspect-ratio:1!important;width:100%!important;max-width:560px!important;height:auto!important;min-height:0!important;max-height:none!important;padding:0!important;margin:0!important;overflow:hidden!important;border:1px solid #394342!important;border-radius:24px!important;background:#4b5050!important;color:#fff!important;text-align:left!important;box-shadow:0 18px 45px #1b262618!important;cursor:pointer!important;perspective:1400px!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile *,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema *{box-sizing:border-box!important;-webkit-text-fill-color:currentColor!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-picture{position:absolute!important;inset:-2px!important;display:block!important;overflow:hidden!important;transform:rotateX(var(--ih57-rx,0deg)) rotateY(var(--ih57-ry,0deg)) scale(1.025)!important;transition:transform 350ms ease!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-picture>img,#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-picture>video{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;border:0!important;border-radius:0!important;pointer-events:none!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-picture>video{opacity:0!important;transition:opacity 250ms!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile[data-preview=true] .ih57-tile-picture>video{opacity:1!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-top{position:absolute!important;z-index:2!important;inset:0 0 auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;padding:23px!important;background:#151c1b9e!important;color:#fff!important;pointer-events:none!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-brand,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-brand{display:inline-flex!important;align-items:center!important;flex:none!important;gap:10px!important;white-space:nowrap!important;color:inherit!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-brand>b,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-brand>b{display:block!important;margin:0!important;font:800 28px/1 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;letter-spacing:-.06em!important;color:inherit!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-sign,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-sign{display:grid!important;grid-template-columns:repeat(2,7px)!important;grid-template-rows:repeat(2,7px)!important;gap:3px!important;transform:rotate(-5deg)!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-sign>i,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-sign>i{display:block!important;width:7px!important;height:7px!important;margin:0!important;border:0!important;border-radius:1px!important;background:currentColor!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-top>span:last-child{font:400 10px/1.5 IdeaHireFilmText,Inter,Arial,sans-serif!important;letter-spacing:.06em!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-copy{position:absolute!important;z-index:2!important;inset:auto 0 0!important;display:block!important;padding:25px!important;background:#34383ad6!important;color:#fff!important;pointer-events:none!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-copy>strong{display:block!important;white-space:pre-line!important;margin:0 0 17px!important;color:#fff!important;font:800 clamp(29px,3vw,44px)/1.04 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;letter-spacing:-.045em!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-copy>span{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;font:400 12px/1.5 IdeaHireFilmText,Inter,Arial,sans-serif!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-copy i{display:grid!important;place-items:center!important;flex:none!important;width:43px!important;height:43px!important;border:1px solid #ffffffa6!important;border-radius:50%!important;background:#ffffff13!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-copy svg{width:19px!important;height:19px!important;stroke:currentColor!important;fill:currentColor!important;stroke-width:1.5!important;}
#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile:focus-visible{outline:3px solid var(--v-accent,#12776f)!important;outline-offset:5px!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema{--ih57-head:82px;--ih57-dock:32px;position:fixed!important;inset:0!important;z-index:2147483000!important;isolation:isolate!important;display:block!important;width:100%!important;height:100%!important;height:100dvh!important;min-width:0!important;margin:0!important;padding:0!important;overflow:hidden!important;background:#343839!important;color:#fff!important;font-family:IdeaHireFilmText,Inter,Arial,sans-serif!important;-webkit-font-smoothing:antialiased;overscroll-behavior:contain!important;animation:ih57-open 720ms cubic-bezier(.16,.78,.17,1) both;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema[data-closing=true]{animation:ih57-close 400ms cubic-bezier(.3,.02,.4,1) both!important;pointer-events:none!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-poster,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-video{position:absolute!important;z-index:0!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;margin:0!important;border:0!important;border-radius:0!important;background:#343839!important;pointer-events:none!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-video{opacity:0!important;transition:opacity 220ms!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema[data-ready=true] .ih57-video{opacity:1!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema :is(button,a,input){font-family:inherit!important;-webkit-tap-highlight-color:transparent;touch-action:manipulation;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema button{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;min-width:44px!important;min-height:44px!important;margin:0!important;padding:10px!important;border:1px solid #ffffff60!important;border-radius:50%!important;background:#17201e26!important;color:#fff!important;font-size:14px!important;line-height:1.4!important;box-shadow:none!important;text-shadow:none!important;cursor:pointer!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema button:disabled{opacity:.45!important;cursor:default!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema button::before,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema button::after{content:none!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema svg{display:block!important;flex:none!important;width:21px!important;height:21px!important;stroke:currentColor!important;stroke-width:1.7!important;stroke-linecap:round!important;stroke-linejoin:round!important;fill:none!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema svg[data-kind=play]{fill:currentColor!important;stroke-width:1!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema :is(button,a,input):focus-visible{outline:3px solid #fff!important;outline-offset:3px!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-top{position:absolute!important;z-index:4!important;inset:0 0 auto!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:24px!important;min-height:78px!important;padding:calc(14px + env(safe-area-inset-top,0px)) clamp(20px,4vw,64px) 14px!important;background:#161c1bb8!important;color:#fff!important;backdrop-filter:blur(10px);}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-film-label{margin-right:auto!important;color:#e5ecea!important;font:400 10px/1.5 IdeaHireFilmText,Inter,Arial,sans-serif!important;letter-spacing:.14em!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-top-actions{display:flex!important;align-items:center!important;flex:none!important;gap:10px!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-window{position:absolute!important;z-index:2!important;inset:var(--ih57-head) 0 var(--ih57-dock)!important;display:flex!important;flex-direction:column!important;min-width:0!important;padding:18px 0 clamp(20px,4vh,52px)!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;scrollbar-width:thin!important;scrollbar-color:#e7eceb #34403b!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy{display:grid!important;flex:none!important;grid-template-columns:minmax(0,1fr)!important;align-items:center!important;gap:34px!important;width:100%!important;margin:auto 0 0!important;padding:30px clamp(24px,4vw,64px) 32px!important;border-block:1px solid #ffffff1c!important;background:#34383acc!important;color:#fff!important;backdrop-filter:blur(6px);animation:ih57-copy-in 480ms cubic-bezier(.16,.8,.2,1) both;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-detail=true]{grid-template-columns:minmax(0,1fr) minmax(270px,350px)!important;gap:clamp(24px,4vw,68px)!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-main{min-width:0!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-eyebrow{display:block!important;margin:0 0 19px!important;color:#e5e9e8!important;font:400 11px/1.5 IdeaHireFilmText,Inter,Arial,sans-serif!important;letter-spacing:.09em!important;text-transform:uppercase!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy h2{display:block!important;min-width:0!important;margin:0!important;padding:0!important;color:#fff!important;font:800 clamp(52px,7vw,108px)/1.025 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;letter-spacing:-.055em!important;text-wrap:balance!important;overflow-wrap:normal!important;word-break:normal!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy h2>span{display:block!important;color:inherit!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-detail=true] h2{font-size:clamp(38px,4.2vw,68px)!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-kind=final] h2>span:first-child{font-size:1.25em!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-kind=final] h2>span:last-child{margin-top:13px!important;font-size:.47em!important;line-height:1.12!important;letter-spacing:-.035em!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-main>p{max-width:620px!important;margin:23px 0 0!important;color:#f1f4f3!important;font:400 16px/1.65 IdeaHireFilmText,Inter,Arial,sans-serif!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail{display:block!important;min-width:0!important;margin:0!important;padding:24px!important;border:1px solid #ffffff59!important;border-radius:12px!important;background:#f7faf7!important;color:#172723!important;box-shadow:0 14px 40px #0000001c!important;transform:perspective(1100px) rotateY(-3deg) translateZ(6px)!important;animation:ih57-detail-in 650ms cubic-bezier(.16,.8,.2,1) both;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail-label{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin:0 0 19px!important;color:#182e28!important;font:800 18px/1.2 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;letter-spacing:-.04em!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail-label small{max-width:145px!important;margin:0!important;color:#4e5e58!important;font:400 9px/1.45 IdeaHireFilmText,Inter,Arial,sans-serif!important;letter-spacing:.035em!important;text-align:right!important;text-transform:uppercase!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail h3{margin:0 0 18px!important;color:#172723!important;font:800 23px/1.12 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;letter-spacing:-.045em!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail dl{margin:0!important;padding:0!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail dl>div{display:flex!important;align-items:baseline!important;justify-content:space-between!important;gap:14px!important;min-width:0!important;padding:10px 0!important;border-top:1px solid #d2dcd5!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail dt{display:block!important;flex:1!important;margin:0!important;color:#53655c!important;font:400 12px/1.5 IdeaHireFilmText,Inter,Arial,sans-serif!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail dd{display:block!important;min-width:0!important;max-width:65%!important;margin:0!important;color:#172723!important;font:800 13px/1.5 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;text-align:right!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-portfolio ul{display:grid!important;grid-template-columns:1fr!important;gap:12px!important;margin:0 0 18px!important;padding:0!important;list-style:none!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-portfolio li{display:flex!important;align-items:center!important;gap:12px!important;margin:0!important;padding:0!important;color:#172723!important;font:400 15px/1.4 IdeaHireFilmText,Inter,Arial,sans-serif!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-portfolio svg{width:18px!important;height:18px!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail>small{display:block!important;margin:13px 0 0!important;color:#53655c!important;font:400 11px/1.55 IdeaHireFilmText,Inter,Arial,sans-serif!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-messages>p{max-width:92%!important;margin:0 0 10px!important;padding:12px 14px!important;border:1px solid #d1ddd5!important;border-radius:12px 12px 12px 2px!important;background:#e9efeb!important;color:#172723!important;font:400 14px/1.5 IdeaHireFilmText,Inter,Arial,sans-serif!important;animation:ih57-message-in 500ms ease both;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-messages>p+p{margin-left:auto!important;border-radius:12px 12px 2px 12px!important;background:#fff!important;animation-delay:220ms;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate{display:flex!important;align-items:baseline!important;gap:12px!important;margin-bottom:17px!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate>strong{display:block!important;color:#142d25!important;font:800 74px/.95 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;letter-spacing:-.07em!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate strong>span{font-size:.58em!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate>span{color:#53655c!important;font:400 13px/1.5 IdeaHireFilmText,Inter,Arial,sans-serif!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card dl{animation:ih57-value-in 280ms ease both;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card dd{font-size:18px!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-limits{display:flex!important;justify-content:space-between!important;gap:12px!important;margin-top:12px!important;color:#53655c!important;font:400 11px/1.6 IdeaHireFilmText,Inter,Arial,sans-serif!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-limits b{display:block!important;color:#172723!important;font:800 14px/1.5 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-final-actions{display:flex!important;flex-wrap:wrap!important;gap:12px!important;margin-top:25px!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-final-actions>a{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:30px!important;min-height:48px!important;max-width:100%!important;padding:12px 17px!important;border:1px solid #fff!important;border-radius:6px!important;background:#fff!important;color:#192820!important;font:800 14px/1.5 IdeaHireFilmDisplay,Inter,Arial,sans-serif!important;text-decoration:none!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-final-actions>a+a{background:transparent!important;color:#fff!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-loading{position:absolute!important;z-index:7!important;top:calc(var(--ih57-head) + 12px)!important;left:24px!important;max-width:calc(100% - 48px)!important;padding:0!important;color:#fff!important;font-size:12px!important;line-height:1.5!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-loading:not(:empty){padding:9px 13px!important;border-radius:5px!important;background:#1e2726ed!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-gate{position:absolute!important;z-index:6!important;top:calc(var(--ih57-head) + 24px)!important;left:50%!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:12px!important;max-width:calc(100% - 40px)!important;padding:14px!important;border:1px solid #ffffff55!important;border-radius:8px!important;background:#212c29ed!important;transform:translateX(-50%)!important;color:#fff!important;text-align:center!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-gate p{margin:0!important;font-size:14px!important;line-height:1.5!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-gate button{min-width:160px!important;border-radius:5px!important;white-space:nowrap!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-sr{position:absolute!important;width:1px!important;height:1px!important;min-width:0!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important;}
body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema[data-playing=false] .ih57-copy,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema[data-playing=false] .ih57-detail,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema[data-playing=false] .ih57-messages>p,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema[data-playing=false] .ih57-fee-card dl{animation:none!important;}
@keyframes ih57-open{from{clip-path:var(--ih57-origin);transform:perspective(1800px) translateZ(-85px) rotateY(-3deg);}to{clip-path:inset(0);transform:none;}}
@keyframes ih57-close{from{clip-path:inset(0);opacity:1;}to{clip-path:var(--ih57-origin);opacity:0;}}
@keyframes ih57-copy-in{from{opacity:0;transform:perspective(1400px) translate3d(0,32px,-40px) rotateX(4deg);}to{opacity:1;transform:none;}}
@keyframes ih57-detail-in{from{opacity:0;transform:perspective(1100px) translate3d(55px,10px,-80px) rotateY(-15deg);}to{opacity:1;transform:perspective(1100px) rotateY(-3deg) translateZ(6px);}}
@keyframes ih57-message-in{from{opacity:0;translate:0 12px;}to{opacity:1;translate:0 0;}}
@keyframes ih57-value-in{from{opacity:.4;translate:0 5px;}to{opacity:1;translate:0 0;}}
@media(max-width:820px){
 #root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-showcase{grid-template-columns:1fr!important;gap:28px!important;padding-block:45px!important;}#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile{max-width:none!important;}#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih53-showcase-copy h2{font-size:36px!important;}#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih53-showcase-copy>p{max-width:560px!important;}#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-top{padding:20px!important;}#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-copy{padding:22px!important;}#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-copy>strong{font-size:clamp(30px,8vw,48px)!important;}#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-top>span:last-child{font-size:9px!important;}
 body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema{--ih57-head:76px;--ih57-dock:32px;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-top{min-height:70px!important;padding:calc(12px + env(safe-area-inset-top,0px)) 20px 12px!important;gap:14px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-top .ih57-brand>b{font-size:25px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-film-label{display:none!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-top-actions{gap:8px!important;}
 body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-window{padding-top:12px!important;padding-bottom:20px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-detail=true]{grid-template-columns:minmax(0,1fr)!important;gap:18px!important;padding:22px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-eyebrow{margin-bottom:14px!important;font-size:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy h2{font-size:clamp(37px,10vw,72px)!important;line-height:1.035!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-detail=true] h2{font-size:clamp(30px,7.7vw,52px)!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-main>p{margin-top:15px!important;font-size:14px!important;line-height:1.6!important;}
 body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail{padding:17px!important;transform:none!important;border-radius:9px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail-label{margin-bottom:13px!important;font-size:17px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail h3{margin-bottom:12px!important;font-size:20px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail dl>div{padding:7px 0!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-portfolio ul{display:flex!important;flex-wrap:wrap!important;gap:11px 16px!important;margin-bottom:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-portfolio li{font-size:13px!important;gap:6px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail>small{margin-top:9px!important;font-size:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-messages>p{font-size:13px!important;padding:10px 12px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate{margin-bottom:12px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate>strong{font-size:58px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-limits{margin-top:8px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-limits b{display:inline!important;margin-left:5px!important;font-size:12px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card dd{font-size:17px!important;}
 body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-final-actions{gap:10px!important;margin-top:20px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-final-actions>a{flex:1 1 230px!important;min-height:46px!important;font-size:13px!important;}
}
@media(max-width:820px) and (max-height:720px) and (max-aspect-ratio:1/1){body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-window{padding:12px 0 14px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-detail=true]{gap:10px!important;padding:14px 18px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-detail=true] h2{font-size:clamp(26px,7vw,40px)!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-eyebrow{font-size:9px!important;margin-bottom:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-main>p{font-size:12px!important;line-height:1.45!important;margin-top:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail{padding:14px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail-label{font-size:16px!important;margin-bottom:9px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail h3{font-size:18px!important;margin-bottom:9px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail dl>div{padding:5px 0!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail>small{font-size:10px!important;margin-top:6px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-portfolio ul{gap:8px 12px!important;margin-bottom:7px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-portfolio li{font-size:12px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-messages>p{font-size:12px!important;line-height:1.4!important;padding:8px 10px!important;margin-bottom:8px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card{display:grid!important;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)!important;column-gap:12px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card>.ih57-detail-label,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card>.ih57-fee-limits,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card>small{grid-column:1/-1!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate{display:block!important;align-self:center!important;margin:0!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate>strong{font-size:47px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate>span{font-size:11px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card dt{font-size:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-card dd{font-size:15px!important;}}
@media(max-height:500px) and (min-aspect-ratio:1/1){body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema{--ih57-head:62px;--ih57-dock:32px;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-top{min-height:60px!important;padding:8px 22px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-top .ih57-brand>b{font-size:23px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-window{padding:8px 0!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-detail=true]{grid-template-columns:minmax(0,1fr) minmax(210px,250px)!important;gap:25px!important;padding:18px 24px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy:not([data-detail=true]){grid-template-columns:1fr!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy h2,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy[data-detail=true] h2{font-size:clamp(29px,4vw,47px)!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-eyebrow{font-size:9px!important;margin-bottom:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-copy-main>p{font-size:12px!important;line-height:1.5!important;margin-top:12px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail{padding:13px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail-label{font-size:16px!important;margin-bottom:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail h3{font-size:18px!important;margin-bottom:10px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail dl>div{padding:5px 0!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-fee-rate>strong{font-size:42px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail>small{font-size:9px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-final-actions{margin-top:14px!important;}body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-final-actions>a{flex:none!important;min-height:44px!important;padding:8px 12px!important;font-size:12px!important;}}
@media(prefers-reduced-motion:reduce){#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-picture,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema *{animation:none!important;transition:none!important;scroll-behavior:auto!important;}#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root#root .ih53-home .ih57-tile-picture,body #ih57-cinema#ih57-cinema#ih57-cinema#ih57-cinema .ih57-detail{transform:none!important;}}
`,
  IH57_DURATION = 40,
  IH57_MEDIA = {
    wide: "/media/ideahire-film-wide.mp4",
    tall: "/media/ideahire-film-tall.mp4",
    posterWide: "/media/ideahire-film-poster-wide.jpg",
    posterTall: "/media/ideahire-film-poster-tall.jpg"
  },
  IH57_CHAPTERS = [{
    start: 0,
    step: 0,
    kind: "intro",
    pl: ["Pomys\u0142 potrzebuje", "ludzi."],
    en: ["Ideas need", "people."],
    subPl: "Znajd\u017A wykonawc\u0119 w IdeaHire.",
    subEn: "Find a professional on IdeaHire.",
    labelPl: "IdeaHire / Ludzie i projekty",
    labelEn: "IdeaHire / People and projects"
  }, {
    start: 6.7,
    step: 0,
    kind: "brief",
    pl: ["Tw\xF3j projekt.", "Konkretne warunki."],
    en: ["Your project.", "Clear requirements."],
    subPl: "Zakres, termin, bud\u017Cet. Dobry pocz\u0105tek wsp\xF3\u0142pracy.",
    subEn: "Scope, timing, budget. A clear place to start.",
    labelPl: "Zlecenie w IdeaHire",
    labelEn: "Your IdeaHire brief"
  }, {
    start: 12.7,
    step: 1,
    kind: "portfolio",
    pl: ["Sprawd\u017A portfolio.", "Poznaj umiej\u0119tno\u015Bci."],
    en: ["Explore portfolios.", "Find the right skills."],
    subPl: "Na IdeaHire wybierasz, z kim chcesz pracowa\u0107.",
    subEn: "Choose who you want to work with on IdeaHire.",
    labelPl: "Wykonawcy w IdeaHire",
    labelEn: "Professionals on IdeaHire"
  }, {
    start: 18.7,
    step: 2,
    kind: "messages",
    pl: ["Ustalcie szczeg\xF3\u0142y.", "Zanim zaczniecie."],
    en: ["Agree on the details.", "Before you start."],
    subPl: "Porozmawiajcie o zakresie, materia\u0142ach i terminie.",
    subEn: "Discuss the scope, materials and deadline.",
    labelPl: "Rozmowa w IdeaHire",
    labelEn: "Your conversation on IdeaHire"
  }, {
    start: 24.7,
    step: 2,
    kind: "fee",
    pl: ["Prowizja IdeaHire.", "Zobacz wyliczenie."],
    en: ["The IdeaHire fee.", "See the calculation."],
    subPl: "Stawka, minimum i limit widoczne przed rozpocz\u0119ciem.",
    subEn: "The rate, minimum and cap are shown before you start.",
    labelPl: "Prowizja bez domys\u0142\xF3w",
    labelEn: "A fee you can calculate"
  }, {
    start: 32.7,
    step: 3,
    kind: "final",
    pl: ["IdeaHire.", "Od pomys\u0142u do wsp\xF3\u0142pracy."],
    en: ["IdeaHire.", "From an idea to working together."],
    subPl: "Znajd\u017A wykonawc\u0119 albo projekt dla siebie.",
    subEn: "Find a professional or a project for yourself.",
    labelPl: "Teraz Tw\xF3j projekt",
    labelEn: "Your project starts here"
  }];
function ih57ChapterIndex(A) {
  let e = 0;
  return IH57_CHAPTERS.forEach((t, n) => {
    A >= t.start && (e = n);
  }), e;
}
function ih57Fee(A, e = IDEA_HIRE_PUBLIC_OFFER) {
  let t = Math.max(0, Math.min(e.orderLimit, Number(A) || 0));
  return t > 0 ? Math.round(Math.min(e.maximum, Math.max(e.minimum, t * e.percent / 100)) * 100) / 100 : 0;
}
function ih57Clock(A) {
  return "00:" + String(Math.floor(Math.max(0, Math.min(40, A || 0)))).padStart(2, "0");
}
function IH57Icon({
  kind: A
}) {
  let e = {
    close: "M6 6l12 12M18 6 6 18",
    play: "m9 5 11 7-11 7Z",
    pause: "M8 5v14M16 5v14",
    full: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    replay: "M4 9a8 8 0 1 1-1 6M4 3v6h6",
    check: "m5 12 4 4L19 6"
  };
  return (0, IH57JSX.jsx)("svg", {
    viewBox: "0 0 24 24",
    "aria-hidden": "true",
    focusable: "false",
    "data-kind": A,
    children: (0, IH57JSX.jsx)("path", {
      d: e[A] || e.play
    })
  });
}
function IH57Wordmark() {
  return (0, IH57JSX.jsxs)("span", {
    className: "ih57-brand",
    children: [(0, IH57JSX.jsxs)("span", {
      className: "ih57-sign",
      "aria-hidden": "true",
      children: [(0, IH57JSX.jsx)("i", {}), (0, IH57JSX.jsx)("i", {}), (0, IH57JSX.jsx)("i", {}), (0, IH57JSX.jsx)("i", {})]
    }), (0, IH57JSX.jsx)("b", {
      children: "IdeaHire"
    })]
  });
}
function useIH57Portrait() {
  let [A, e] = (0, IH57React.useState)(() => typeof window < "u" && window.innerHeight > window.innerWidth * 1.2);
  return (0, IH57React.useEffect)(() => {
    let t = () => e(window.innerHeight > window.innerWidth * 1.2);
    return window.addEventListener("resize", t, {
      passive: !0
    }), window.visualViewport?.addEventListener("resize", t, {
      passive: !0
    }), t(), () => {
      window.removeEventListener("resize", t), window.visualViewport?.removeEventListener("resize", t);
    };
  }, []), A;
}
function IH57SceneDetail({
  kind: A,
  en: e,
  time: t
}) {
  let n = IDEA_HIRE_PUBLIC_OFFER,
    r = o => ih53Money(o, e),
    a = e ? ["Project amount", "IdeaHire fee", "Minimum", "Maximum", "Example calculation"] : ["Kwota zlecenia", "Prowizja IdeaHire", "Minimum", "Maksimum", "Przyk\u0142adowe wyliczenie"];
  if (A === "brief") return (0, IH57JSX.jsxs)("aside", {
    className: "ih57-detail ih57-brief",
    "aria-label": e ? "Illustrative project brief" : "Przyk\u0142adowy opis zlecenia",
    children: [(0, IH57JSX.jsxs)("span", {
      className: "ih57-detail-label",
      children: ["IdeaHire ", (0, IH57JSX.jsx)("small", {
        children: e ? "ILLUSTRATIVE BRIEF" : "PRZYK\u0141ADOWE ZLECENIE"
      })]
    }), (0, IH57JSX.jsx)("h3", {
      children: e ? "A website for a studio" : "Strona dla pracowni"
    }), (0, IH57JSX.jsxs)("dl", {
      children: [(0, IH57JSX.jsxs)("div", {
        children: [(0, IH57JSX.jsx)("dt", {
          children: e ? "Scope" : "Zakres"
        }), (0, IH57JSX.jsx)("dd", {
          children: e ? "Design and development" : "Projekt i wdro\u017Cenie"
        })]
      }), (0, IH57JSX.jsxs)("div", {
        children: [(0, IH57JSX.jsx)("dt", {
          children: e ? "Deadline" : "Termin"
        }), (0, IH57JSX.jsx)("dd", {
          children: e ? "To be agreed" : "Do ustalenia"
        })]
      }), (0, IH57JSX.jsxs)("div", {
        children: [(0, IH57JSX.jsx)("dt", {
          children: e ? "Budget" : "Bud\u017Cet"
        }), (0, IH57JSX.jsx)("dd", {
          children: r(1e3)
        })]
      })]
    })]
  });
  if (A === "portfolio") return (0, IH57JSX.jsxs)("aside", {
    className: "ih57-detail ih57-portfolio",
    children: [(0, IH57JSX.jsxs)("span", {
      className: "ih57-detail-label",
      children: ["IdeaHire ", (0, IH57JSX.jsx)("small", {
        children: e ? "BEFORE YOU CHOOSE" : "PRZED WYBOREM"
      })]
    }), (0, IH57JSX.jsx)("h3", {
      children: e ? "See the work behind the profile." : "Zobacz prac\u0119 za profilem."
    }), (0, IH57JSX.jsx)("ul", {
      children: (e ? ["Portfolio", "Skills", "Reviews"] : ["Portfolio", "Umiej\u0119tno\u015Bci", "Opinie"]).map(o => (0, IH57JSX.jsxs)("li", {
        children: [(0, IH57JSX.jsx)(IH57Icon, {
          kind: "check"
        }), o]
      }, o))
    }), (0, IH57JSX.jsx)("small", {
      children: e ? "Choose based on the information in the profile." : "Podejmij decyzj\u0119 na podstawie profilu."
    })]
  });
  if (A === "messages") return (0, IH57JSX.jsxs)("aside", {
    className: "ih57-detail ih57-messages",
    children: [(0, IH57JSX.jsxs)("span", {
      className: "ih57-detail-label",
      children: ["IdeaHire ", (0, IH57JSX.jsx)("small", {
        children: e ? "ILLUSTRATIVE CONVERSATION" : "PRZYK\u0141ADOWA ROZMOWA"
      })]
    }), (0, IH57JSX.jsx)("p", {
      children: e ? "The scope: design and development." : "Zakres: projekt i wdro\u017Cenie."
    }), (0, IH57JSX.jsx)("p", {
      children: e ? "Let\u2019s agree on timing and materials." : "Ustalmy termin i materia\u0142y."
    }), (0, IH57JSX.jsx)("small", {
      children: e ? "Details in one conversation." : "Ustalenia w jednej rozmowie."
    })]
  });
  if (A === "fee") {
    let o = Math.max(0, t - 24.7),
      i = o < 2.8 ? 250 : o < 5.6 ? 1e3 : n.orderLimit,
      l = ih57Fee(i);
    return (0, IH57JSX.jsxs)("aside", {
      className: "ih57-detail ih57-fee-card",
      "aria-label": a[4],
      children: [(0, IH57JSX.jsxs)("span", {
        className: "ih57-detail-label",
        children: ["IdeaHire ", (0, IH57JSX.jsx)("small", {
          children: a[4]
        })]
      }), (0, IH57JSX.jsxs)("div", {
        className: "ih57-fee-rate",
        children: [(0, IH57JSX.jsxs)("strong", {
          children: [n.percent.toLocaleString(e ? "en-GB" : "pl-PL"), (0, IH57JSX.jsx)("span", {
            children: "%"
          })]
        }), (0, IH57JSX.jsx)("span", {
          children: e ? "service fee" : "prowizji"
        })]
      }), (0, IH57JSX.jsxs)("dl", {
        children: [(0, IH57JSX.jsxs)("div", {
          children: [(0, IH57JSX.jsx)("dt", {
            children: a[0]
          }), (0, IH57JSX.jsx)("dd", {
            children: r(i)
          })]
        }), (0, IH57JSX.jsxs)("div", {
          children: [(0, IH57JSX.jsx)("dt", {
            children: a[1]
          }), (0, IH57JSX.jsx)("dd", {
            children: r(l)
          })]
        })]
      }, i), (0, IH57JSX.jsxs)("div", {
        className: "ih57-fee-limits",
        children: [(0, IH57JSX.jsxs)("span", {
          children: [a[2], " ", (0, IH57JSX.jsx)("b", {
            children: r(n.minimum)
          })]
        }), (0, IH57JSX.jsxs)("span", {
          children: [a[3], " ", (0, IH57JSX.jsx)("b", {
            children: r(n.maximum)
          })]
        })]
      }), (0, IH57JSX.jsxs)("small", {
        children: [e ? "Projects up to " : "Zlecenia do ", r(n.orderLimit)]
      })]
    });
  }
  return null;
}
function IH57Scene({
  time: A,
  en: e,
  ended: t,
  onNavigate: n
}) {
  let r = t ? 5 : ih57ChapterIndex(A),
    a = IH57_CHAPTERS[r],
    o = e ? a.en : a.pl,
    i = !["intro", "final"].includes(a.kind);
  return (0, IH57JSX.jsx)("div", {
    className: "ih57-copy-window",
    children: (0, IH57JSX.jsxs)("section", {
      className: "ih57-copy",
      "data-kind": a.kind,
      "data-detail": i,
      "aria-label": e ? "IdeaHire film chapter" : "Rozdzia\u0142 filmu IdeaHire",
      children: [(0, IH57JSX.jsxs)("div", {
        className: "ih57-copy-main",
        children: [(0, IH57JSX.jsx)("span", {
          className: "ih57-eyebrow",
          children: e ? a.labelEn : a.labelPl
        }), (0, IH57JSX.jsx)("h2", {
          children: o.map((l, f) => (0, IH57JSX.jsx)("span", {
            children: l
          }, f))
        }), (0, IH57JSX.jsx)("p", {
          children: e ? a.subEn : a.subPl
        }), a.kind === "final" && (0, IH57JSX.jsxs)("div", {
          className: "ih57-final-actions",
          children: [(0, IH57JSX.jsxs)(Link, {
            to: "/find-talent",
            onClick: n,
            children: [e ? "Find a professional" : "Znajd\u017A wykonawc\u0119", (0, IH57JSX.jsx)(IH57Icon, {
              kind: "arrow"
            })]
          }), (0, IH57JSX.jsxs)(Link, {
            to: "/jobs",
            onClick: n,
            children: [e ? "Browse projects" : "Przegl\u0105daj zlecenia", (0, IH57JSX.jsx)(IH57Icon, {
              kind: "arrow"
            })]
          })]
        })]
      }), i && (0, IH57JSX.jsx)(IH57SceneDetail, {
        kind: a.kind,
        en: e,
        time: A
      })]
    }, r)
  });
}
function IH57Cinema({
  media: A = IH57_MEDIA,
  onClose: e,
  origin: t
}) {
  let n = useSitePreferences().language === "en",
    r = useIH53Reduced(),
    a = useIH57Portrait(),
    o = (0, IH57React.useRef)(null),
    i = (0, IH57React.useRef)(null),
    l = (0, IH57React.useRef)(null),
    f = (0, IH57React.useRef)(null),
    d = (0, IH57React.useRef)(null),
    s = (0, IH57React.useRef)(!1),
    v = (0, IH57React.useRef)(0),
    h = (0, IH57React.useRef)(!r && !IH53_MOTION.paused),
    P = (0, IH57React.useRef)(0),
    y = (0, IH57React.useRef)(0),
    L = (0, IH57React.useRef)(!1),
    [c, u] = (0, IH57React.useState)(0),
    [p, B] = (0, IH57React.useState)(!1),
    [Q, x] = (0, IH57React.useState)(!1),
    [X, g] = (0, IH57React.useState)(!1),
    [E, O] = (0, IH57React.useState)(!1),
    [G, Ce] = (0, IH57React.useState)(!1),
    [Wn, gA] = (0, IH57React.useState)(!1),
    [DA, dc] = (0, IH57React.useState)(!1),
    [Xa, cc] = (0, IH57React.useState)(!1),
    [pc, bl] = (0, IH57React.useState)(""),
    [Xl, vc] = (0, IH57React.useState)(0),
    La = a ? A.tall : A.wide,
    Ll = a ? A.posterTall : A.posterWide,
    mc = Q ? 5 : ih57ChapterIndex(c),
    hc = IH57_CHAPTERS[mc].step;
  function Ie() {
    h.current = !1, P.current++, f.current?.pause(), B(!1), gA(!1);
  }
  function lt() {
    let Z = f.current;
    if (!Z || G) return;
    h.current = !0, O(!1);
    let w = ++P.current;
    try {
      Z.play()?.then(() => {
        s.current || w !== P.current || !h.current || (B(!Z.paused), gA(!1));
      }).catch(xA => {
        s.current || w !== P.current || xA?.name === "AbortError" || (B(!1), gA(!1), O(!0));
      });
    } catch {
      B(!1), O(!0);
    }
  }
  function Gt(Z) {
    let w = Math.max(0, Math.min(IH57_DURATION - .04, Number(Z) || 0));
    if (v.current = w, L.current = !1, x(!1), u(w), O(!1), f.current?.readyState >= 1) try {
      f.current.currentTime = w;
    } catch {}
  }
  function Pc() {
    Gt(0), h.current = !0, lt();
  }
  function yc(Z) {
    let w = Z.currentTarget;
    if (!s.current) {
      if (Ce(!1), g(!1), gA(!1), v.current > 0) try {
        w.currentTime = Math.min(v.current, Math.max(0, w.duration - .04));
      } catch {}
      h.current && lt();
    }
  }
  function Bc(Z) {
    if (s.current) return;
    let w = Math.max(0, Math.min(40, Z.currentTarget.currentTime || 0));
    v.current = w, L.current || u(w);
  }
  function bc() {
    if (!s.current) if (L.current = !0, x(!0), u(40), h.current && !r && !document.hidden) {
      v.current = 34;
      try {
        f.current.currentTime = 34;
      } catch {}
      lt();
    } else Ie();
  }
  let Qa = (0, IH57React.useRef)(null);
  Qa.current || (Qa.current = Z => {
    let w = f.current;
    w && w !== Z && (v.current = Number.isFinite(w.currentTime) ? w.currentTime : v.current, w.pause()), f.current = Z;
  });
  function qn(Z = !1) {
    if (!(Xa || s.current)) {
      if (Ie(), document.fullscreenElement === o.current && document.exitFullscreen?.().catch(() => {}), Z || r) {
        e();
        return;
      }
      cc(!0), y.current = setTimeout(() => {
        s.current || e();
      }, 430);
    }
  }
  async function Xc() {
    try {
      document.fullscreenElement === o.current ? await document.exitFullscreen() : o.current?.requestFullscreen ? await o.current.requestFullscreen() : bl(n ? "The film already fills the browser window." : "Film wype\u0142nia ju\u017C ca\u0142y widok przegl\u0105darki.");
    } catch {
      bl(n ? "Fullscreen is unavailable. The browser-sized view stays open." : "Pe\u0142ny ekran jest niedost\u0119pny. Film pozostaje na ca\u0142y widok przegl\u0105darki.");
    }
  }
  (0, IH57React.useLayoutEffect)(() => {
    s.current = !1;
    let Z = document.activeElement,
      w = document.getElementById("root"),
      zA = w?.hasAttribute("inert"),
      xA = window.scrollX,
      ft = window.scrollY,
      _A = document.body,
      We = document.documentElement,
      Ql = ["overflow", "paddingRight", "position", "top", "left", "width"],
      gc = Object.fromEntries(Ql.map(qe => [qe, _A.style[qe]])),
      xc = We.style.overflow,
      ga = Math.max(0, window.innerWidth - We.clientWidth);
    We.style.overflow = "hidden", _A.style.overflow = "hidden", _A.style.position = "fixed", _A.style.top = -ft + "px", _A.style.left = -xA + "px", _A.style.width = "100%", ga && ga < 60 && (_A.style.paddingRight = ga + "px"), w?.setAttribute("inert", "");
    let kc = requestAnimationFrame(() => d.current?.focus({
      preventScroll: !0
    }));
    return () => {
      if (s.current = !0, P.current++, clearTimeout(y.current), cancelAnimationFrame(kc), f.current?.pause(), We.style.overflow = xc, Ql.forEach(qe => _A.style[qe] = gc[qe]), w && !zA && w.removeAttribute("inert"), window.scrollX !== xA || window.scrollY !== ft) {
        let qe = We.style.scrollBehavior;
        We.style.scrollBehavior = "auto", window.scrollTo(xA, ft), We.style.scrollBehavior = qe;
      }
      Z?.isConnected && Z.focus({
        preventScroll: !0
      });
    };
  }, []), (0, IH57React.useEffect)(() => {
    let Z = w => {
      if (w.key === "Escape") {
        w.preventDefault(), qn();
        return;
      }
      if (w.key === "Tab") {
        let zA = Array.from(o.current?.querySelectorAll("button:not(:disabled),a[href],input:not(:disabled)") || []).filter(_A => !_A.closest("[hidden]")),
          xA = zA[0],
          ft = zA[zA.length - 1];
        w.shiftKey && document.activeElement === xA ? (w.preventDefault(), ft?.focus()) : !w.shiftKey && document.activeElement === ft && (w.preventDefault(), xA?.focus());
        return;
      }
      w.target?.closest?.("input,button,a,textarea,select") || ((w.key === " " || w.key.toLowerCase() === "k") && (w.preventDefault(), p ? Ie() : lt()), (w.key === "ArrowRight" || w.key === "ArrowLeft") && (w.preventDefault(), Gt(c + (w.key === "ArrowRight" ? 5 : -5))));
    };
    return document.addEventListener("keydown", Z), () => document.removeEventListener("keydown", Z);
  }, [p, c, Xa, n, G, r]), (0, IH57React.useEffect)(() => {
    let Z = () => {
        document.hidden && Ie();
      },
      w = () => dc(document.fullscreenElement === o.current),
      zA = xA => {
        xA.detail?.paused && Ie();
      };
    return document.addEventListener("visibilitychange", Z), document.addEventListener("fullscreenchange", w), window.addEventListener("ih53-motion", zA), () => {
      document.removeEventListener("visibilitychange", Z), document.removeEventListener("fullscreenchange", w), window.removeEventListener("ih53-motion", zA);
    };
  }, []), (0, IH57React.useEffect)(() => {
    r && Ie();
  }, [r]), (0, IH57React.useLayoutEffect)(() => {
    let Z = () => {
      if (!o.current) return;
      let zA = i.current?.getBoundingClientRect().height,
        xA = l.current?.getBoundingClientRect().height;
      zA > 0 && o.current.style.setProperty("--ih57-head", zA + "px"), xA > 0 && o.current.style.setProperty("--ih57-dock", xA + "px");
    };
    Z();
    let w;
    return typeof ResizeObserver < "u" && (w = new ResizeObserver(Z), i.current && w.observe(i.current), l.current && w.observe(l.current)), window.addEventListener("resize", Z, {
      passive: !0
    }), () => {
      w?.disconnect(), window.removeEventListener("resize", Z);
    };
  }, [n, a, Q]), (0, IH57React.useEffect)(() => {
    if (!h.current || X || G) return;
    let Z = setTimeout(() => {
      !s.current && !X && (gA(!1), O(!0));
    }, 12e3);
    return () => clearTimeout(Z);
  }, [La, Xl, X, G]);
  let Lc = t ? `${Math.max(0, t.top)}px ${Math.max(0, window.innerWidth - t.right)}px ${Math.max(0, window.innerHeight - t.bottom)}px ${Math.max(0, t.left)}px round 24px` : "15% 25% 15% 25% round 24px",
    Qc = n ? ["Project", "Talent", "Details", "Start"] : ["Projekt", "Wyb\xF3r", "Ustalenia", "Start"];
  return createPortal(
  <div id="ih57-cinema" ref={o} role="dialog" aria-modal="true" aria-labelledby="ih57-title" data-no-translate="true" data-playing={p} data-ended={Q} data-closing={Xa} data-ready={X} data-portrait={a} style={{ '--ih57-origin': Lc }}>
    <img className="ih57-poster" src={Ll} alt="" />
    {!G && <video key={La + Xl} ref={Qa.current} className="ih57-video" src={La} poster={Ll} playsInline muted preload="auto" aria-hidden="true" tabIndex={-1} disablePictureInPicture
      onLoadedMetadata={yc} onLoadedData={() => { g(true); gA(false); }} onCanPlay={() => gA(false)}
      onPlaying={event => { if (!s.current && event.currentTarget === f.current) { g(true); O(false); B(true); gA(false); } }}
      onPause={event => { if (!s.current && event.currentTarget === f.current) B(false); }}
      onTimeUpdate={Bc} onEnded={bc} onWaiting={() => { if (h.current) gA(true); }}
      onError={() => { if (!s.current) { h.current = false; Ce(true); B(false); gA(false); } }} />}
    <header className="ih57-top" ref={i}>
      <IH57Wordmark /><span className="ih57-film-label">{n ? 'PEOPLE. PROJECTS. IDEAHIRE.' : 'LUDZIE. PROJEKTY. IDEAHIRE.'}</span>
      <div className="ih57-top-actions">
        <button type="button" disabled={G} onClick={() => Q ? Pc() : p ? Ie() : lt()} aria-label={n ? Q ? 'Replay film' : p ? 'Pause film' : 'Play film' : Q ? 'Powtórz film' : p ? 'Zatrzymaj film' : 'Odtwórz film'}><IH57Icon kind={Q ? 'replay' : p ? 'pause' : 'play'} /></button>
        <button type="button" onClick={Xc} aria-label={n ? 'Toggle fullscreen' : 'Włącz lub wyłącz pełny ekran'} aria-pressed={DA}><IH57Icon kind="full" /></button>
        <button type="button" ref={d} onClick={() => qn()} aria-label={n ? 'Close film' : 'Zamknij film'}><IH57Icon kind="close" /></button>
      </div>
    </header>
    <h1 id="ih57-title" className="ih57-sr">{n ? 'IdeaHire — ideas need people. Illustrative scenes.' : 'IdeaHire — pomysł potrzebuje ludzi. Sceny ilustracyjne.'}</h1>
    <IH57Scene time={c} en={n} ended={Q} onNavigate={() => qn(true)} />
    {(E || G) && <div className="ih57-gate" role="status">{G ? <><p>{n ? 'The film could not be played.' : 'Nie udało się odtworzyć filmu.'}</p><button type="button" onClick={() => { Ce(false); O(false); h.current = true; vc(value => value + 1); }}>{n ? 'Try again' : 'Spróbuj ponownie'}</button></> : <button type="button" onClick={lt}><IH57Icon kind="play" />{n ? 'Play film' : 'Uruchom film'}</button>}</div>}
    <div className="ih57-loading" role="status" aria-live="polite">{Wn && h.current ? n ? 'Loading film…' : 'Ładuję film…' : pc}</div>
    <footer ref={l} className="ih58-film-progress"><label><span className="ih57-sr">{n ? 'Film position' : 'Pozycja filmu'}</span><input type="range" min="0" max="40" step=".1" value={c} disabled={G} aria-valuetext={`${ih57Clock(c)} / 00:40`} onChange={event => Gt(event.target.value)} style={{ '--ih57-progress': `${c / 40 * 100}%` }} /></label></footer>
  </div>, document.body
);
}
function IH53Showcase({
  media: A = IH57_MEDIA
}) {
  let e = useSitePreferences().language === "en",
    t = useIH53Reduced(),
    n = (0, IH57React.useRef)(null),
    r = (0, IH57React.useRef)(null),
    [a, o] = (0, IH57React.useState)(!1),
    [i, l] = (0, IH57React.useState)(null),
    [f, d] = (0, IH57React.useState)(!1),
    [s, v] = (0, IH57React.useState)(!1),
    [h, P] = (0, IH57React.useState)(!1),
    [y, L] = (0, IH57React.useState)(() => IH53_MOTION.paused),
    [c, u] = (0, IH57React.useState)(() => document.hidden),
    [p, B] = (0, IH57React.useState)(!1),
    Q = typeof navigator < "u" && navigator.connection?.saveData,
    x = (f || s) && h && !a && !y && !c && !t && !Q;
  return (0, IH57React.useEffect)(() => {
    let X = O => L(!!O.detail?.paused),
      g = () => u(document.hidden);
    window.addEventListener("ih53-motion", X), document.addEventListener("visibilitychange", g);
    let E;
    return typeof IntersectionObserver < "u" ? (E = new IntersectionObserver(O => P(O.some(G => G.isIntersecting)), {
      rootMargin: "100px",
      threshold: .01
    }), E.observe(n.current)) : P(!0), () => {
      E?.disconnect(), window.removeEventListener("ih53-motion", X), document.removeEventListener("visibilitychange", g);
    };
  }, []), (0, IH57React.useEffect)(() => {
    if (B(!1), !x) return;
    let X = !1,
      g = r.current;
    try {
      g?.play()?.catch(() => {
        X || B(!1);
      });
    } catch {}
    return () => {
      X = !0, g?.pause();
    };
  }, [x]), (0, IH57JSX.jsxs)("section", {
    className: "section ih53-showcase ih57-showcase",
    id: "how-it-works",
    "data-no-translate": "true",
    children: [(0, IH57JSX.jsx)("style", {
      children: IH57_STYLES
    }), (0, IH57JSX.jsxs)("div", {
      className: "ih53-showcase-copy",
      children: [(0, IH57JSX.jsx)("span", {
        className: "section-label",
        children: e ? "People. Projects. IdeaHire." : "Ludzie. Projekty. IdeaHire."
      }), (0, IH57JSX.jsx)("h2", {
        children: e ? "An idea needs the right people." : "Pomys\u0142 potrzebuje w\u0142a\u015Bciwych ludzi."
      }), (0, IH57JSX.jsx)("p", {
        children: e ? "Describe the project, explore portfolios and agree on the details. See how you can start working together on IdeaHire." : "Opisz projekt, sprawd\u017A portfolio, ustal szczeg\xF3\u0142y. Zobacz, jak mo\u017Cesz rozpocz\u0105\u0107 wsp\xF3\u0142prac\u0119 w IdeaHire."
      }), (0, IH57JSX.jsx)("span", {
        className: "ih53-showcase-invitation",
        children: e ? "See how a project starts on IdeaHire." : "Zobacz, jak zaczyna się współpraca w IdeaHire."
      }), (0, IH57JSX.jsxs)("div", {
        className: "ih53-showcase-links",
        children: [(0, IH57JSX.jsxs)(Link, {
          to: "/find-talent",
          children: [e ? "I have a project" : "Mam projekt", (0, IH57JSX.jsx)("span", {
            "aria-hidden": "true",
            children: "\u2197"
          })]
        }), (0, IH57JSX.jsxs)(Link, {
          to: "/jobs",
          children: [e ? "I am looking for work" : "Szukam zlecenia", (0, IH57JSX.jsx)("span", {
            "aria-hidden": "true",
            children: "\u2197"
          })]
        })]
      })]
    }), (0, IH57JSX.jsxs)("button", {
      type: "button",
      ref: n,
      className: "ih53-showcase-tile ih57-tile",
      "aria-haspopup": "dialog",
      "aria-label": e ? "Open the IdeaHire film fullscreen" : "Otw\xF3rz film IdeaHire na ca\u0142y ekran",
      "data-preview": p && x,
      onPointerEnter: X => {
        X.pointerType === "mouse" && d(!0);
      },
      onPointerLeave: () => {
        d(!1), n.current?.style.setProperty("--ih57-rx", "0deg"), n.current?.style.setProperty("--ih57-ry", "0deg");
      },
      onPointerMove: X => {
        if (X.pointerType !== "mouse" || t) return;
        let g = X.currentTarget.getBoundingClientRect();
        g.width && g.height && (X.currentTarget.style.setProperty("--ih57-rx", (-(X.clientY - g.top) / g.height + .5) * 2.8 + "deg"), X.currentTarget.style.setProperty("--ih57-ry", ((X.clientX - g.left) / g.width - .5) * 2.8 + "deg"));
      },
      onFocus: () => v(!0),
      onBlur: () => v(!1),
      onClick: () => {
        l(n.current.getBoundingClientRect()), o(!0), d(!1);
      },
      children: [(0, IH57JSX.jsxs)("span", {
        className: "ih57-tile-picture",
        children: [(0, IH57JSX.jsx)("img", {
          src: A.posterWide,
          alt: "",
          loading: "lazy",
          decoding: "async"
        }), x && (0, IH57JSX.jsx)("video", {
          ref: r,
          src: A.wide,
          muted: !0,
          playsInline: !0,
          preload: "none",
          "aria-hidden": "true",
          tabIndex: -1,
          onPlaying: () => B(!0),
          onTimeUpdate: X => {
            X.currentTarget.currentTime > 6.5 && (X.currentTarget.currentTime = 0);
          },
          onError: () => B(!1)
        })]
      }), (0, IH57JSX.jsxs)("span", {
        className: "ih57-tile-top",
        children: [(0, IH57JSX.jsx)(IH57Wordmark, {}), (0, IH57JSX.jsx)("span", {
          children: e ? "40 SECOND FILM" : "FILM \xB7 40 SEKUND"
        })]
      }), (0, IH57JSX.jsxs)("span", {
        className: "ih57-tile-copy",
        children: [(0, IH57JSX.jsx)("strong", {
          children: e ? `Ideas need
people.` : `Pomys\u0142 potrzebuje
ludzi.`
        }), (0, IH57JSX.jsxs)("span", {
          children: [e ? "Watch fullscreen" : "Obejrzyj na ca\u0142y ekran", (0, IH57JSX.jsx)("i", {
            "aria-hidden": "true",
            children: (0, IH57JSX.jsx)(IH57Icon, {
              kind: "play"
            })
          })]
        })]
      })]
    }), a && (0, IH57JSX.jsx)(IH57Cinema, {
      media: A,
      origin: i,
      onClose: () => {
        o(!1), d(!1), v(!1), B(!1);
      }
    })]
  });
}

function IH53CategoryIcon({category}){const value=String(category||'').toLowerCase();let drawing=value.includes('program')||value.includes('ai')?<><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-12-2 14"/></>:value.includes('graf')||value.includes('design')?<><path d="m4 17 1-4L15 3l6 6-10 10-4 1Z"/><path d="m13 5 6 6M5 15l4 4"/></>:value.includes('video')||value.includes('foto')?<><rect x="3" y="6" width="14" height="13" rx="3"/><path d="m17 10 4-3v13l-4-3M7 3h6"/></>:value.includes('market')?<><path d="M4 10v5h4l10 5V4L8 10Zm4 5 2 6h3l-2-5M21 9v6"/></>:value.includes('copy')||value.includes('tekst')?<><path d="M6 3h9l4 4v14H6Zm9 0v5h4M9 12h7M9 16h5"/></>:<><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><rect x="3" y="7" width="18" height="14" rx="3"/><path d="M3 12c6 4 12 4 18 0M10 13h4"/></>;return <svg viewBox="0 0 24 24" aria-hidden="true">{drawing}</svg>;}
function ih53RealJob(job){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(job?.id||''));}
function IH53JobAuthor({job,en,inactive=false}){
 const[failedUrl,setFailedUrl]=useState(null),name=String(job.author?.name||'').trim()||(en?'Client':'Zleceniodawca'),url=job.author?.avatar_url;
 const failed=failedUrl===url;
 const content=<><span className="ih53-author-avatar" aria-hidden="true">{url&&!failed?<img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailedUrl(url)}/>:name.charAt(0).toLocaleUpperCase(en?'en':'pl')}</span><span><strong>{name}</strong><small>{job.preview?(en?'Sample profile':'Przykładowy profil'):(en?'Project author':'Autor zlecenia')}</small></span></>;
 return job.user_id&&!job.preview&&!inactive?<Link className="ih53-project-author" to={'/profile/'+job.user_id}>{content}</Link>:<div className="ih53-project-author">{content}</div>;
}
function IH53JobsFinale({jobs=[],paused,reduced,onReplay,onPause,canReplay=true}){
 const en=useSitePreferences().language==='en',host=useRef(null),real=jobs.filter(ih53RealJob),list=real.length?real:jobs;
 const signature=list.map(j=>j.id).join('|'),known=useRef(new Set(list.map(j=>j.id))),current=useRef(list[0]||null),gesture=useRef(null),sequence=useRef(0);
 const[view,setView]=useState(()=>({job:list[0]||null,next:null,shift:false,sequence:0,new:false})),[pending,setPending]=useState(null),[hover,setHover]=useState(false),[focus,setFocus]=useState(false),[visible,setVisible]=useState(true),[hidden,setHidden]=useState(()=>document.hidden);
 const stopped=paused||reduced||hover||focus||hidden||!visible,active=list.find(j=>j.id===view.job?.id)||view.job,index=Math.max(0,list.findIndex(j=>j.id===active?.id));current.current=active;
 const copy=en?{title:['Find work.','Use your skills.'],intro:'Browse recent briefs or find the right person for your own project.',talent:'Find a professional',jobs:'Browse all projects',replay:'Replay the introduction',pause:'Pause animations',play:'Resume animations',sample:'Illustrative project',published:'Recent projects',new:'New project',view:'View project',budget:'Budget',empty:'No projects to display yet.',terms:'Paid only by the client. The freelancer receives the full agreed amount.',fee:'IdeaHire fee',pending:'Show new project',auto:'Projects change automatically',still:'Project preview'}:{title:['Znajdź zlecenie.','Wykorzystaj swój fach.'],intro:'Sprawdź ostatnie ogłoszenia lub znajdź osobę do własnego projektu.',talent:'Znajdź wykonawcę',jobs:'Wszystkie zlecenia',replay:'Powtórz wprowadzenie',pause:'Zatrzymaj animacje',play:'Wznów animacje',sample:'Przykładowe zlecenie',published:'Ostatnie ogłoszenia',new:'Nowe zlecenie',view:'Zobacz ogłoszenie',budget:'Budżet',empty:'Nie ma jeszcze zleceń do wyświetlenia.',terms:'Płaci wyłącznie zleceniodawca. Wykonawca otrzymuje całą ustaloną kwotę.',fee:'Prowizja IdeaHire',pending:'Pokaż nowe zlecenie',auto:'Ogłoszenia zmieniają się automatycznie',still:'Podgląd ogłoszeń'};
 function commit(){setView(v=>v.next?{job:v.next,next:null,shift:false,sequence:v.sequence,new:v.new}:v);}
 function show(job,isNew=false){
  if(!job)return;setPending(null);sequence.current++;
  setView(v=>reduced||paused||v.job?.id===job.id?{job,next:null,shift:false,sequence:sequence.current,new:isNew}:{...v,next:job,shift:false,sequence:sequence.current,new:isNew});
 }
 useLayoutEffect(()=>{if(!view.next)return;const frame=requestAnimationFrame(()=>setView(v=>({...v,shift:true})));return()=>cancelAnimationFrame(frame);},[view.sequence]);
 useEffect(()=>{if(!view.next)return;const timer=setTimeout(commit,600);return()=>clearTimeout(timer);},[view.sequence,!!view.next]);
 useEffect(()=>{if((paused||reduced)&&view.next)commit();},[paused,reduced]);
 useEffect(()=>{
  const incoming=list.filter(j=>!known.current.has(j.id));known.current=new Set(list.map(j=>j.id));
  if(incoming.length&&real.length)setPending({job:incoming[0],count:incoming.length});
  else if(!current.current||!list.some(j=>j.id===current.current.id))show(list[0]);
 },[signature]);
 useEffect(()=>{if(pending&&!stopped&&!view.next)show(pending.job,true);},[pending,stopped,!!view.next]);
 useEffect(()=>{if(stopped||list.length<2||pending||view.next)return;const timer=setTimeout(()=>show(list[(index+1)%list.length]),6500);return()=>clearTimeout(timer);},[view.sequence,signature,stopped,!!pending,!!view.next]);
 useEffect(()=>{
  const update=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',update);let observer;
  if(typeof IntersectionObserver!=='undefined')try{observer=new IntersectionObserver(entries=>setVisible(!!entries[0]?.isIntersecting),{threshold:0});observer.observe(host.current);}catch{}
  return()=>{document.removeEventListener('visibilitychange',update);observer?.disconnect();};
 },[]);
 function renderCard(job,incoming=false){
  const sample=job.preview===true||!ih53RealJob(job),amount=Number(job.budget),category=getCategoryLabel(job.category),label=en?translateUiText(category):category;
  const price=Number.isFinite(amount)&&amount>0?ih53Money(amount,en):(en?'To be agreed':'Do ustalenia');
  return <article className={'ih53-project-card'+(incoming?' is-incoming':'')} key={job.id} aria-hidden={incoming||undefined} inert={incoming?'':undefined} data-new={view.new}>
   <div className="ih53-project-top"><IH53JobAuthor job={job} en={en} inactive={incoming}/><span className="ih53-project-category" title={label} aria-label={label}><IH53CategoryIcon category={job.category}/></span></div>
   <h3 title={job.title}>{String(job.title||'').slice(0,160)}</h3><p>{String(job.description||(en?'Review the scope and requirements in the listing.':'Sprawdź zakres i wymagania w ogłoszeniu.')).slice(0,280)}</p>
   <div className="ih53-project-bottom"><div><small>{copy.budget}</small><strong>{price}</strong></div><Link className="ih53-project-open" to="/jobs" state={sample?undefined:{lucynaJobId:job.id,lucynaTitle:job.title}} tabIndex={incoming?-1:undefined}>{copy.view} <span aria-hidden="true">↗</span></Link></div>
   <small className="ih53-project-caption" title={label}>{sample?copy.sample:view.new?copy.new:copy.published} · {label}</small>
  </article>;
 }
 return <div className="ih53-jobs-finale" ref={host} data-no-translate="true" data-paused={stopped} data-motion-paused={paused||reduced}>
  <div className="ih58-ambient" aria-hidden="true" data-paused={stopped}><i/><i/><i/><b/></div>
  <div className="ih53-finale-top"><button type="button" className="ih53-replay" disabled={!canReplay} onClick={onReplay}><span aria-hidden="true">↻</span><span>{copy.replay}</span></button></div>
  <div className="ih53-finale-layout"><div className="ih53-finale-copy"><h1>{copy.title.map((line,i)=><span key={i}>{line}</span>)}</h1><p>{copy.intro}</p><div className="ih53-finale-actions"><Link to="/find-talent">{copy.talent}<span aria-hidden="true">↗</span></Link><Link to="/jobs">{copy.jobs}<span aria-hidden="true">↗</span></Link></div></div>
   <div className="ih53-projects" onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}}>
    <div className="ih53-project-window" onPointerDown={e=>{if(e.pointerType==='touch')gesture.current={x:e.clientX,y:e.clientY};}} onPointerCancel={()=>{gesture.current=null;}} onPointerUp={e=>{const first=gesture.current;gesture.current=null;if(!first||view.next)return;const dx=e.clientX-first.x,dy=e.clientY-first.y;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.5)show(list[(index+(dx>0?-1:1)+list.length)%list.length]);}}>
     <div className="ih53-project-track" data-sliding={view.shift} onTransitionEnd={e=>{if(e.target===e.currentTarget&&e.propertyName==='transform')commit();}}>{active?renderCard(active):<div className="ih53-project-empty"><p>{copy.empty}</p><Link to="/jobs">{copy.jobs}</Link></div>}{view.next&&renderCard(view.next,true)}</div>
    </div>
    <div className="ih53-project-controls"><span>{String(list.length?index+1:0).padStart(2,'0')} / {String(list.length).padStart(2,'0')}</span><small>{reduced?copy.still:copy.auto}</small><button type="button" className="ih53-project-pause" onClick={onPause} aria-label={paused?copy.play:copy.pause} aria-pressed={paused} disabled={reduced}><span aria-hidden="true">{paused?'▶':'Ⅱ'}</span></button></div>
    <div className="ih53-project-status" aria-live="polite">{pending&&<button type="button" onClick={()=>show(pending.job,true)}>{copy.pending}</button>}</div>
   </div>
  </div>
  <div className="ih53-finale-fee"><strong>{copy.fee} {IDEA_HIRE_PUBLIC_OFFER.percent.toLocaleString(en?'en-GB':'pl-PL')}%</strong><span>{en?'min. PLN 20 · max. PLN 229':'min. 20 zł · maks. 229 zł'}</span><p>{copy.terms}</p></div>
 </div>;
}

function App({ session, loading, categoryGroups = [] }) {
  const ih53English=useSitePreferences().language==="en";
  const ih53RootRef=useRef(null);
  useIH53LegacyEnhancements(ih53RootRef);
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

    let request = 0;
    async function loadRecentJobs() {
      const ticket = ++request;
      try {
        const { data, error } = await supabase.from("jobs")
          .select("id, title, description, category, budget, created_at, user_id")
          .order("created_at", { ascending: false }).limit(8);
        if (error || !Array.isArray(data) || !mounted || ticket !== request) return;
        const ownerIds = [...new Set(data.map(job => job.user_id).filter(Boolean))];
        let owners = [];
        if (ownerIds.length) {
          try {
            const result = await supabase.from("profiles").select("id, name, avatar_url").in("id", ownerIds);
            if (!result.error && Array.isArray(result.data)) owners = result.data;
          } catch { /* A private or missing profile uses a neutral author label. */ }
        }
        if (!mounted || ticket !== request) return;
        const byId = new Map(owners.map(owner => [owner.id, owner]));
        setRecentJobs(data.map(job => ({ ...job, author: byId.get(job.user_id) || null })));
        setActiveJobIndex(0);
      } catch (error) {
        console.error("HOME RECENT JOBS ERROR:", error);
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
    <div ref={ih53RootRef} className="app ih-home-refresh ih-home-v3 ih-home-v4 ih-home-v6 ih-home-v7 ih53-home">
      <style>{IH53_STYLES}</style>
      <style>{IH58_STYLES}</style>
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
        <Link className="logo logo-clean" to="/" aria-label="IdeaHire — strona główna">Idea<span>Hire</span></Link>

        <nav className="ih53-primary-nav" aria-label={ih53English?"Main shortcuts":"Główne skróty"} onClick={(event)=>{if(event.target?.closest?.("a"))setMobileMenuOpen(false);}}>
          <a href="#how-it-works">{ih53English?"Explore IdeaHire":"Poznaj IdeaHire"}</a><a href="#categories">{ih53English?"Categories":"Kategorie"}</a><a href="#for-users">{ih53English?"For you":"Dla Ciebie"}</a>
          {session&&<Link className="ih53-desktop-account" to="/notifications">Powiadomienia{hasNotifications&&<span className="ih53-unread" aria-label="Nowe powiadomienia"/>}</Link>}
          {session&&<Link className="ih53-desktop-account" to="/account">Moje konto</Link>}
        </nav>
        <nav ref={navigationRef} id="ih-home-navigation" className="nav-links home-nav-links" aria-label="Nawigacja strony głównej"
          onClick={(event) => { if (event.target?.closest?.("a")) setMobileMenuOpen(false); }}>
          <HomeNavItem href="#how-it-works" order={0}>{ih53English?"Explore IdeaHire":"Poznaj IdeaHire"}</HomeNavItem>
          <HomeNavItem href="#categories" order={1}>Kategorie</HomeNavItem>
          <HomeNavItem href="#for-users" order={2}>Dla Ciebie</HomeNavItem>

          {session && (
            <>
              <HomeNavItem to="/notifications" order={3} notification={hasNotifications}>Powiadomienia</HomeNavItem>
              <HomeNavItem to="/account" order={4}>Moje konto</HomeNavItem>
            </>
          )}
          <span className="ih53-menu-divider" aria-hidden="true"/>
          <span className="ih53-menu-label">{ih53English?"Explore":"Odkrywaj"}</span>
          <HomeNavItem to="/jobs" order={5}>Wszystkie zlecenia</HomeNavItem>
          <HomeNavItem to="/find-talent" order={6}>Znajdź wykonawcę</HomeNavItem>
          <HomeNavItem to="/regulamin" order={7}>Regulamin</HomeNavItem>
          <a href={helpCenterHref()} referrerPolicy="no-referrer">Centrum pomocy</a>
          {!session && <Link className="ih-mobile-login" to="/login">Zaloguj się</Link>}
        </nav>

        <div className="nav-actions">
          {loading ? (
            <span>Ładowanie...</span>
          ) : session ? (
            <>


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
          aria-expanded={mobileMenuOpen} aria-controls="ih-home-navigation" data-notification={hasNotifications}
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
            <IH53CommissionStory />
          </div>
        </section>

        <IH53Showcase />

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


