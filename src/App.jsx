/* IdeaHire | P51 | Optyczna głębia, wejścia sekcji i zlecenia po Cięciu | Pełny plik src/App.jsx */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { IDEA_HIRE_PUBLIC_OFFER, CommissionStory, HomeStepCard, IdeaHireLogo, MarketIcon, helpCenterHref } from "./MarketUI";
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
    IH51_MOTION.paused=paused||reduced;window.dispatchEvent(new CustomEvent("ih51-motion",{detail:{paused:IH51_MOTION.paused}}));
    if(reduced){motion.current.finished=true;setFinished(true);}
    if(reduced){setSound(false);engineRef.current?.mute();}
    engineRef.current?.wake();
  },[reduced,english,classic,paused]);
  useEffect(()=>{
    alive.current=true;
    const engine=ih43Start(canvasRef.current,rootRef.current,motion,update=>{
      if(!alive.current)return;
      if(update.ready)setReady(true);
      if(update.failed){setFailed(true);setFinished(true);}
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
  function replayIntro(){if(reduced||failed)return;motion.current.paused=false;setPaused(false);setFinished(false);engineRef.current?.replay();}
  function hover(index){motion.current.hover=index;engineRef.current?.wake();}
  function move(event){
    if(reduced||paused||failed||event.pointerType!=="mouse")return;
    const rect=event.currentTarget.getBoundingClientRect();
    motion.current.pointerX=IH43.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1);
    motion.current.pointerY=IH43.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1);
  }
  function leave(){motion.current.pointerX=0;motion.current.pointerY=0;hover(-1);}
  return <section ref={rootRef} className="ih43-film" data-cinematic-version={"P43-"+IH43_FILM.key}
    data-stage={finished?"jobs":"intro"} data-ready={ready} data-failed={failed} data-classic={classic} data-no-translate="true"
    aria-label={labels.region} onPointerMove={move} onPointerLeave={leave}>
    <style>{IH43_STYLES}</style>
    {finished&&<IH51JobsFinale jobs={jobs} paused={paused} reduced={reduced} canReplay={!reduced&&!failed} onReplay={replayIntro} onPause={togglePause}/>}
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


const IH51_STYLES=String.raw`/* P51 — scenografia 3D i wejścia istniejących kart. Układ P43 zachowany. */
__IH51__{isolation:isolate!important;background:transparent!important;}
__IH51__ > main,__IH51__ > footer{position:relative;z-index:1;background:transparent!important;}
__IH51__ > main > :is(.categories.section,.how.section,.split-section.section,.final-cta){background:transparent!important;}
__IH51__ > .ih51-backdrop{display:block!important;position:fixed!important;inset:0!important;z-index:0!important;width:100%!important;height:100svh!important;pointer-events:none!important;overflow:hidden!important;}
__IH51__ .ih51-backdrop > canvas{display:block;width:100%;height:100%;pointer-events:none;}
__IH51__ .ih51-optical-fallback{position:absolute;inset:-15%;background:linear-gradient(120deg,transparent 24%,color-mix(in srgb,var(--ih-home-surface) 55%,transparent) 43%,transparent 65%);animation:ih51-optical-drift 16s ease-in-out infinite alternate;}
__IH51__ .ih51-backdrop[data-renderer=ready] .ih51-optical-fallback{display:none!important;}
@keyframes ih51-optical-drift{from{translate:-7% -10%;rotate:-4deg;}to{translate:9% 12%;rotate:4deg;}}
__IH51__ .ih51-backdrop:not([data-renderer=ready])>canvas{visibility:hidden;}
__IH51__ .ih51-mark-scene{position:absolute!important;left:32%!important;top:42%!important;display:block!important;width:126px!important;height:126px!important;transform:translate(-50%,-50%)!important;pointer-events:none!important;overflow:visible!important;}
__IH51__ .ih40-step-mark .ih51-mark-scene{left:-12px!important;top:26px!important;width:108px!important;height:86px!important;}
__IH51__ .ih51-mark-scene>canvas{display:block!important;width:100%!important;height:100%!important;border:0!important;background:transparent!important;pointer-events:none!important;}
__IH51__ .ih-category-trigger[data-ih51-ready=true] .ih-category-mark > i,__IH51__ .ih40-step[data-ih51-ready=true] .ih40-step-mark > i{opacity:0!important;}
__IH51__ .ih40-step[data-ih51-ready=true] > .ih40-step-mosaic{display:none!important;}
__IH51__ [data-ih51-tilt=true]{transform:perspective(1200px) rotateX(var(--ih51-rx,0deg)) rotateY(var(--ih51-ry,0deg))!important;transform-origin:center!important;transition:transform 180ms ease,box-shadow 180ms ease!important;will-change:transform;box-shadow:0 4px 0 -1px var(--ih-home-surface),0 5px 0 var(--ih-home-line),0 18px 32px color-mix(in srgb,var(--ih-home-ink) 12%,transparent)!important;}
__IH51__ [data-ih51-press=true]{animation:ih51-card-press 650ms cubic-bezier(.2,.8,.2,1) both!important;}
@keyframes ih51-card-press{0%,100%{rotate:1 0 0 0deg;scale:1;}35%{rotate:1 0 0 4deg;scale:.975;}65%{rotate:1 0 0 -1deg;scale:1.008;}}
__IH51__{overflow-x:clip!important;}
__IH51__ :is(.ih5-category-showcase,.steps,.split-section){perspective:1300px!important;}
__IH51__ .home-reveal{opacity:1!important;transform:none!important;filter:none!important;}
__IH51__ [data-ih51-entrance]{backface-visibility:hidden;transform-origin:50% 70%;}
__IH51__ [data-ih51-entrance=waiting]{filter:opacity(0)!important;pointer-events:none!important;}
__IH51__ [data-ih51-entrance=entering]{animation:ih51-section-in 1020ms cubic-bezier(.16,.85,.23,1) var(--ih51-stagger,0ms) both!important;}
__IH51__ [data-ih51-entrance=entering] [data-ih51-part]{animation:ih51-content-in 710ms cubic-bezier(.15,.8,.2,1) calc(var(--ih51-stagger,0ms) + var(--ih51-part-delay,190ms)) both!important;}
@keyframes ih51-section-in{0%{translate:var(--ih51-entry-x,0px) var(--ih51-entry-y,48px);clip-path:var(--ih51-mask,inset(0 0 100% 0));rotate:1 0 0 8deg;}65%{translate:0 -3px;clip-path:inset(0 0 0 0);rotate:1 0 0 -.7deg;}100%{translate:0 0;clip-path:inset(0 0 0 0);rotate:1 0 0 0deg;}}
@keyframes ih51-content-in{from{translate:var(--ih51-part-x,40px) 14px;clip-path:inset(0 0 100% 0);}to{translate:0 0;clip-path:inset(0 0 0 0);}}
__IH51__ .ih51-fee-island{position:absolute!important;inset:0!important;display:flex!important;flex-direction:column!important;color:var(--ih-home-ink)!important;font-family:inherit!important;}
__IH51__ .ih51-receipt{position:relative!important;flex:1 1 0!important;min-height:40px!important;width:100%!important;}
__IH51__ .ih51-receipt>canvas{display:block!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;pointer-events:none!important;}
__IH51__ .ih51-receipt-fallback{display:flex;align-items:center;justify-content:center;position:absolute;inset:0;font:700 22px/1.4 Inter,Arial;color:var(--ih-home-ink);}
__IH51__ .ih51-receipt[data-renderer=ready] .ih51-receipt-fallback{display:none!important;}
__IH51__ .ih51-fee-controls{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;align-items:end!important;gap:15px!important;padding:4px 7px 0!important;flex:0 0 auto!important;}
__IH51__ .ih51-fee-controls label,__IH51__ .ih51-fee-controls output{display:flex!important;flex-direction:column!important;gap:2px!important;margin:0!important;font:500 10px/1.2 Inter,Arial!important;color:var(--ih-home-muted)!important;}
__IH51__ .ih51-fee-controls label>span{display:flex!important;align-items:center!important;gap:6px!important;min-height:30px!important;}
__IH51__ .ih51-fee-controls input{box-sizing:border-box!important;width:95px!important;min-width:0!important;height:30px!important;padding:4px 7px!important;border:1px solid var(--ih-home-line)!important;border-radius:5px!important;background:var(--ih-home-surface)!important;color:var(--ih-home-ink)!important;font:650 16px/1.3 Inter,Arial!important;}
__IH51__ .ih51-fee-controls input:focus-visible{outline:2px solid var(--ih-home-ink)!important;outline-offset:2px!important;}
__IH51__ .ih51-fee-controls output strong{display:block!important;min-height:30px!important;padding-top:4px!important;color:var(--ih-home-ink)!important;font:700 16px/1.3 Inter,Arial!important;white-space:nowrap!important;}
@media(max-width:380px){__IH51__ .ih51-fee-controls{gap:9px!important;}__IH51__ .ih51-fee-controls output strong{font-size:14px!important;}__IH51__ .ih51-fee-controls input{width:80px!important;}}
@media(max-width:760px){__IH51__ .ih40-step-mark .ih51-mark-scene{width:98px!important;height:80px!important;top:20px!important;}__IH51__ .ih51-mark-scene{width:116px!important;height:116px!important;}}
@media(prefers-reduced-motion:reduce){__IH51__ [data-ih51-entrance],__IH51__ [data-ih51-part]{filter:none!important;pointer-events:auto!important;translate:none!important;rotate:none!important;clip-path:none!important;animation:none!important;}__IH51__ .ih51-optical-fallback{animation:none!important;}__IH51__ [data-ih51-tilt=true],__IH51__ [data-ih51-press=true]{transform:none!important;transition:none!important;animation:none!important;will-change:auto!important;}}
body.ih51-active::before,body.ih51-active::after{display:none!important;}
__IH51__ .ih43-film[data-stage=jobs]{background:var(--v-bg)!important;color:var(--v-ink)!important;}
__IH51__ .ih43-film[data-stage=jobs]>.ih43-canvas{visibility:hidden!important;}
__IH51__ .ih43-film[data-stage=jobs] .ih43-hit,__IH51__ .ih43-film[data-stage=jobs] .ih43-accessible{display:none!important;}
__IH51__ .ih51-jobs-finale{position:absolute!important;inset:0!important;z-index:4!important;display:grid!important;grid-template-rows:auto minmax(0,1fr) auto!important;gap:24px!important;padding:26px clamp(28px,4.5vw,72px) 25px!important;background:var(--v-bg)!important;color:var(--v-ink)!important;font-family:Inter,Arial,sans-serif!important;text-align:left!important;animation:ih51-finale-in 720ms cubic-bezier(.16,.8,.2,1) both;}
__IH51__ .ih51-jobs-finale *{box-sizing:border-box!important;}
__IH51__ .ih51-finale-top{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important;min-height:44px!important;border-bottom:1px solid var(--v-line)!important;padding-bottom:14px!important;}
__IH51__ .ih51-finale-top>span{font-size:11px!important;font-weight:700!important;letter-spacing:.13em!important;}
__IH51__ .ih51-replay{display:inline-flex!important;align-items:center!important;gap:9px!important;min-height:44px!important;padding:8px 12px!important;border:1px solid var(--v-line)!important;border-radius:6px!important;background:transparent!important;color:var(--v-ink)!important;font:600 11px/1.4 Inter,Arial!important;cursor:pointer!important;}
__IH51__ .ih51-replay>span:first-child{font-size:24px!important;line-height:1!important;}
__IH51__ .ih51-finale-layout{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;align-items:center!important;gap:clamp(30px,5vw,80px)!important;min-height:0!important;}
__IH51__ .ih51-finale-copy h2{display:block!important;margin:0 0 20px!important;font-size:clamp(39px,4.7vw,75px)!important;line-height:1.06!important;font-weight:800!important;letter-spacing:-.055em!important;color:var(--v-ink)!important;-webkit-text-fill-color:currentColor!important;}
__IH51__ .ih51-finale-copy h2>span{display:block!important;animation:ih51-finale-line 800ms cubic-bezier(.16,.8,.2,1) 160ms both;}
__IH51__ .ih51-finale-copy h2>span+span{animation-delay:270ms;}
__IH51__ .ih51-finale-copy>p{max-width:410px!important;margin:0!important;color:var(--v-muted)!important;font-size:14px!important;line-height:1.7!important;}
__IH51__ .ih51-finale-actions{display:flex!important;flex-wrap:wrap!important;gap:10px!important;margin-top:28px!important;}
__IH51__ .ih51-finale-actions>a{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;min-height:48px!important;padding:12px 16px!important;border:1px solid var(--v-ink)!important;border-radius:6px!important;background:var(--v-ink)!important;color:var(--v-bg)!important;-webkit-text-fill-color:currentColor!important;text-decoration:none!important;font-size:12px!important;font-weight:650!important;animation:ih51-finale-line 780ms cubic-bezier(.16,.8,.2,1) 400ms both;}
__IH51__ .ih51-finale-actions>a+a{background:transparent!important;color:var(--v-ink)!important;animation-delay:490ms;}
__IH51__ .ih51-finale-actions>a>span{font-size:18px!important;}
__IH51__ .ih51-projects{position:relative!important;min-width:0!important;animation:ih51-project-in 850ms cubic-bezier(.16,.8,.2,1) 290ms both;}
__IH51__ .ih51-project-window{position:relative!important;min-height:330px!important;perspective:1200px!important;touch-action:pan-y!important;}
__IH51__ .ih51-project-card{position:relative!important;display:flex!important;flex-direction:column!important;min-height:330px!important;width:100%!important;padding:25px!important;overflow:hidden!important;border:1px solid var(--v-line)!important;border-radius:12px!important;background:var(--v-surface)!important;color:var(--v-ink)!important;box-shadow:0 8px 0 -4px var(--v-bg),0 9px 0 -4px var(--v-line)!important;animation:ih51-project-in 620ms cubic-bezier(.18,.8,.2,1) both;}
__IH51__ .ih51-project-card[data-direction=previous]{--ih51-job-entry:-72px;}
__IH51__ .ih51-project-card[data-direction=new]{--ih51-job-entry:0px;animation-name:ih51-new-project-in;}
__IH51__ .ih51-project-card.is-outgoing{position:absolute!important;inset:0!important;z-index:0!important;pointer-events:none!important;animation:ih51-project-out 500ms ease both!important;}
__IH51__ .ih51-project-top{display:flex!important;justify-content:space-between!important;gap:12px!important;margin-bottom:26px!important;font-size:10px!important;line-height:1.4!important;font-weight:650!important;color:var(--v-muted)!important;}
__IH51__ .ih51-project-category{display:block!important;margin-bottom:11px!important;font-size:11px!important;font-weight:650!important;line-height:1.4!important;}
__IH51__ .ih51-project-card h3{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:3!important;overflow:hidden!important;margin:0 0 12px!important;font-size:clamp(23px,2.5vw,36px)!important;font-weight:750!important;line-height:1.16!important;letter-spacing:-.035em!important;color:var(--v-ink)!important;-webkit-text-fill-color:currentColor!important;overflow-wrap:anywhere!important;}
__IH51__ .ih51-project-card>p{display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;overflow:hidden!important;margin:0 0 24px!important;color:var(--v-muted)!important;font-size:13px!important;line-height:1.6!important;}
__IH51__ .ih51-project-bottom{display:flex!important;align-items:end!important;justify-content:space-between!important;gap:20px!important;margin-top:auto!important;padding-top:16px!important;border-top:1px solid var(--v-line)!important;}
__IH51__ .ih51-project-bottom small{display:block!important;margin-bottom:6px!important;color:var(--v-muted)!important;font-size:10px!important;line-height:1.4!important;}
__IH51__ .ih51-project-bottom strong{display:block!important;font-size:25px!important;line-height:1.2!important;font-weight:700!important;color:var(--v-ink)!important;}
__IH51__ .ih51-project-open{display:grid!important;place-items:center!important;width:48px!important;height:48px!important;flex:0 0 48px!important;border:1px solid var(--v-ink)!important;border-radius:50%!important;background:var(--v-ink)!important;color:var(--v-bg)!important;-webkit-text-fill-color:currentColor!important;font-size:25px!important;text-decoration:none!important;}
__IH51__ .ih51-project-progress{position:absolute!important;left:0!important;right:0!important;bottom:0!important;height:3px!important;background:var(--v-line)!important;}
__IH51__ .ih51-project-progress>i{display:block!important;height:3px!important;background:var(--v-ink)!important;transform-origin:left!important;animation:ih51-project-clock 6500ms linear both;}
__IH51__ .ih51-project-controls{display:flex!important;align-items:center!important;gap:10px!important;margin-top:20px!important;}
__IH51__ .ih51-project-controls>button{display:grid!important;place-items:center!important;flex:0 0 44px!important;width:44px!important;height:44px!important;padding:0!important;border:1px solid var(--v-line)!important;border-radius:50%!important;background:transparent!important;color:var(--v-ink)!important;font:500 20px/1 Inter,Arial!important;cursor:pointer!important;}
__IH51__ .ih51-project-controls>button:disabled{opacity:.35!important;cursor:default!important;}
__IH51__ .ih51-project-controls>span{min-width:60px!important;text-align:center!important;font-size:11px!important;font-weight:600!important;}
__IH51__ .ih51-project-controls>.ih51-project-pause{margin-left:auto!important;}
__IH51__ .ih51-project-status{position:absolute!important;right:0!important;top:-35px!important;max-width:100%!important;font-size:11px!important;}
__IH51__ .ih51-project-status>button{padding:6px 10px!important;border:1px solid var(--v-ink)!important;border-radius:5px!important;background:var(--v-ink)!important;color:var(--v-bg)!important;font:600 11px/1.4 Inter,Arial!important;cursor:pointer!important;}
__IH51__ .ih51-finale-fee{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px 18px!important;border-top:1px solid var(--v-line)!important;padding-top:16px!important;font-size:11px!important;line-height:1.5!important;}
__IH51__ .ih51-finale-fee>strong{font-weight:750!important;}
__IH51__ .ih51-finale-fee>p{flex-basis:100%!important;margin:0!important;font-size:11px!important;line-height:1.5!important;color:var(--v-muted)!important;}
__IH51__ .ih51-project-empty{display:grid!important;place-content:center!important;gap:14px!important;min-height:330px!important;padding:24px!important;border:1px solid var(--v-line)!important;color:var(--v-ink)!important;}
__IH51__ .ih51-project-empty a{color:var(--v-ink)!important;}
__IH51__ .ih51-jobs-finale :is(a,button):focus-visible{outline:3px solid var(--v-ink)!important;outline-offset:4px!important;}
@keyframes ih51-finale-in{from{clip-path:inset(0 0 100% 0);translate:0 24px;}to{clip-path:inset(0 0 0 0);translate:0 0;}}
@keyframes ih51-finale-line{from{translate:-38px 16px;clip-path:inset(0 100% 0 0);}to{translate:0 0;clip-path:inset(0 0 0 0);}}
@keyframes ih51-project-in{from{translate:var(--ih51-job-entry,72px) 20px;rotate:0 1 0 -8deg;clip-path:inset(0 0 0 100%);}to{translate:0 0;rotate:0 1 0 0deg;clip-path:inset(0 0 0 0);}}
@keyframes ih51-new-project-in{from{translate:0 -45px;rotate:1 0 0 8deg;clip-path:inset(0 0 100% 0);}to{translate:0 0;rotate:1 0 0 0deg;clip-path:inset(0 0 0 0);}}
@keyframes ih51-project-out{from{translate:0 0;opacity:1;}to{translate:-50px 8px;opacity:0;}}
@keyframes ih51-project-clock{from{scale:0 1;}to{scale:1 1;}}
@media(max-width:820px){
 __IH51__ .ih51-jobs-finale{padding:16px 20px!important;gap:14px!important;}
 __IH51__ .ih51-finale-top{padding-bottom:10px!important;min-height:44px!important;gap:8px!important;}
 __IH51__ .ih51-finale-top>span{font-size:9px!important;letter-spacing:.08em!important;}
 __IH51__ .ih51-replay{font-size:10px!important;gap:6px!important;padding:4px 8px!important;}
 __IH51__ .ih51-finale-layout{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto!important;align-content:center!important;gap:20px!important;}
 __IH51__ .ih51-finale-copy h2{font-size:clamp(25px,7.2vw,48px)!important;line-height:1.07!important;margin-bottom:9px!important;letter-spacing:-.045em!important;}
 __IH51__ .ih51-finale-copy>p{font-size:12px!important;line-height:1.55!important;max-width:500px!important;}
 __IH51__ .ih51-finale-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:9px!important;margin-top:14px!important;}
 __IH51__ .ih51-finale-actions>a{font-size:10px!important;min-height:44px!important;padding:10px!important;gap:5px!important;}
 __IH51__ .ih51-project-window,__IH51__ .ih51-project-card{min-height:244px!important;}
 __IH51__ .ih51-project-card{padding:19px!important;}
 __IH51__ .ih51-project-top{font-size:9px!important;margin-bottom:16px!important;}
 __IH51__ .ih51-project-category{font-size:10px!important;margin-bottom:8px!important;}
 __IH51__ .ih51-project-card h3{font-size:24px!important;-webkit-line-clamp:2!important;line-height:1.13!important;margin-bottom:10px!important;}
 __IH51__ .ih51-project-card>p{font-size:12px!important;line-height:1.5!important;margin-bottom:15px!important;}
 __IH51__ .ih51-project-bottom{padding-top:12px!important;}
 __IH51__ .ih51-project-bottom strong{font-size:22px!important;}
 __IH51__ .ih51-project-open{width:44px!important;height:44px!important;flex-basis:44px!important;}
 __IH51__ .ih51-project-controls{margin-top:13px!important;gap:8px!important;}
 __IH51__ .ih51-finale-fee{padding-top:10px!important;gap:4px 12px!important;font-size:10px!important;}
 __IH51__ .ih51-finale-fee>p{font-size:10px!important;}
 __IH51__ .ih51-project-status{top:auto!important;bottom:4px!important;right:54px!important;max-width:calc(100% - 215px)!important;}
 __IH51__ .ih51-project-status>button{font-size:9px!important;max-width:100%!important;padding:4px!important;}
}
@media(max-width:360px){__IH51__ .ih51-jobs-finale{padding:14px 16px!important;gap:11px!important;}__IH51__ .ih51-finale-layout{gap:15px!important;}__IH51__ .ih51-replay>span:last-child{max-width:75px!important;line-height:1.2!important;}__IH51__ .ih51-project-card{padding:16px!important;}__IH51__ .ih51-project-window,__IH51__ .ih51-project-card{min-height:232px!important;}__IH51__ .ih51-project-card h3{font-size:22px!important;}}
@media(prefers-reduced-motion:reduce){__IH51__ .ih51-jobs-finale,__IH51__ .ih51-jobs-finale *{animation:none!important;transition:none!important;translate:none!important;rotate:none!important;clip-path:none!important;}__IH51__ .ih51-project-card.is-outgoing{display:none!important;}}
@media(max-width:820px){
 __IH51__ .ih51-project-card{padding:16px!important;}
 __IH51__ .ih51-project-top{margin-bottom:12px!important;}
 __IH51__ .ih51-project-category{margin-bottom:6px!important;}
 __IH51__ .ih51-project-card h3{font-size:22px!important;margin-bottom:8px!important;}
 __IH51__ .ih51-project-card>p{-webkit-line-clamp:1!important;margin-bottom:12px!important;}
}
__IH51__ .ih51-replay:disabled{opacity:.5!important;cursor:default!important;}
__IH51__ .ih51-jobs-finale[data-motion-paused=true],__IH51__ .ih51-jobs-finale[data-motion-paused=true] *{animation:none!important;translate:none!important;rotate:none!important;clip-path:none!important;}
__IH51__ .ih51-jobs-finale[data-motion-paused=true] .is-outgoing{display:none!important;}
@media(max-width:600px){__IH51__ .ih51-finale-copy>p{display:none!important;}__IH51__ .ih51-finale-layout{gap:16px!important;}__IH51__ .ih51-finale-actions{margin-top:12px!important;}}
`.replaceAll("__IH51__","#root".repeat(13)+" .ih51-home");
function ih51Clamp(x,a=0,b=1){return Math.max(a,Math.min(b,x));}
function ih51Ease(x){x=ih51Clamp(x);return 1-Math.pow(1-x,5);}
function ih51Mix(a,b,t){return a+(b-a)*t;}
function ih51Identity(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];}
function ih51Mul(a,b){const o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
function ih51Transform(x,y,z,rx=0,ry=0,rz=0,scale=1,sy=scale,sz=scale){
 const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),ssy=Math.sin(ry),cz=Math.cos(rz),ssz=Math.sin(rz);
 const X=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1],Y=[cy,0,-ssy,0,0,1,0,0,ssy,0,cy,0,0,0,0,1],Z=[cz,ssz,0,0,-ssz,cz,0,0,0,0,1,0,0,0,0,1];
 const m=ih51Mul(ih51Mul(Z,Y),X);for(let r=0;r<3;r++){m[r]*=scale;m[4+r]*=sy;m[8+r]*=sz;}m[12]=x;m[13]=y;m[14]=z;return m;
}
function ih51Perspective(fov,aspect,near=.1,far=70){const f=1/Math.tan(fov/2);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
function ih51Look(eye,at){const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);const z=norm(eye.map((x,i)=>x-at[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function ih51RGB(hex){return[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
function ih51Fonts(){const fonts=document.fonts;if(!fonts)return Promise.resolve();const tasks=[fonts.ready];if(fonts.load)for(const weight of [400,600,700,800])tasks.push(fonts.load(weight+' 32px Inter','Zażółć gęślą jaźń ąćęłńóśźż 5,5% IdeaHire'));return Promise.allSettled(tasks);}
function ih51CardMesh(){
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
function ih51ShadowMesh(){return{vertices:[-1,-1,0,0,0,1,0,0,0,1,-1,0,0,0,1,1,0,0,1,1,0,0,0,1,1,1,0,-1,1,0,0,0,1,0,1,0],indices:[0,1,2,0,2,3]};}
/* P51: optyczna głębia powierzchni. Brak obiektów, modeli i figur w tle. */
const IH51_OPTICS_VERTEX=String.raw`
attribute vec2 aCoord;varying vec2 vUv;
void main(){vUv=aCoord*.5+.5;gl_Position=vec4(aCoord,0.0,1.0);}`;
const IH51_OPTICS_FRAGMENT=String.raw`
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
function ih51OpticsRenderer(canvas){
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(!gl)return null;
 let program=null,buffer=null;const shaders=[];
 const destroy=()=>{if(buffer)gl.deleteBuffer(buffer);shaders.forEach(sh=>gl.deleteShader(sh));if(program)gl.deleteProgram(program);};
 try{
  program=gl.createProgram();for(const[kind,source]of[[gl.VERTEX_SHADER,IH51_OPTICS_VERTEX],[gl.FRAGMENT_SHADER,IH51_OPTICS_FRAGMENT]]){const sh=gl.createShader(kind);shaders.push(sh);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('optics shader');gl.attachShader(program,sh);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('optics link');
  const uniforms={};for(const name of['uResolution','uPointer','uTime','uScroll','uDark','uBG','uPaper','uShade'])uniforms[name]=gl.getUniformLocation(program,name);
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const coord=gl.getAttribLocation(program,'aCoord');
  return{draw(w,h,s){if(gl.isContextLost())return false;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.useProgram(program);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(coord);gl.vertexAttribPointer(coord,2,gl.FLOAT,false,0,0);gl.uniform2f(uniforms.uResolution,s.cssWidth,s.cssHeight);gl.uniform2f(uniforms.uPointer,s.x||0,s.y||0);gl.uniform1f(uniforms.uTime,s.reduced?0:s.time);gl.uniform1f(uniforms.uScroll,s.scroll||0);const bg=ih51RGB(s.palette.bg);gl.uniform1f(uniforms.uDark,bg.reduce((a,v)=>a+v,0)<1?1:0);for(const[name,value]of[['uBG',bg],['uPaper',ih51RGB(s.palette.paper)],['uShade',ih51RGB(s.palette.material)]])gl.uniform3fv(uniforms[name],new Float32Array(value));gl.drawArrays(gl.TRIANGLES,0,6);return true;},destroy};
 }catch{destroy();return null;}
}
/* P51 — sceny dodane do istniejących kart; żadna scena nie steruje układem. */
const IH51_VERTEX=String.raw`
precision highp float;attribute vec3 aPosition,aNormal;attribute vec2 aUV;attribute float aMaterial;
uniform mat4 uModel,uVP;varying vec3 vPosition,vNormal;varying vec2 vUV;varying float vMaterial;
void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=normalize(mat3(uModel)*aNormal);vUV=aUV;vMaterial=aMaterial;gl_Position=uVP*p;}`;
const IH51_FRAGMENT=String.raw`
precision highp float;uniform vec3 uEye,uBase,uLight,uBG,uInk;uniform float uKind,uAlpha,uTime;uniform sampler2D uTexture;
varying vec3 vPosition,vNormal;varying vec2 vUV;varying float vMaterial;
void main(){vec3 n=normalize(vNormal),eye=normalize(uEye-vPosition);if(dot(n,eye)<0.0)n=-n;
 vec3 light=normalize(vec3(-4.0+sin(uTime*.32)*2.0,6.0,9.0)-vPosition);float diffuse=max(0.0,dot(n,light));float spec=pow(max(0.0,dot(n,normalize(light+eye))),35.0);
 vec3 col=uBase*(.63+.34*diffuse)+uLight*spec*.16;float alpha=uAlpha;
 if(uKind<.5&&vMaterial<.5)col=texture2D(uTexture,vUV).rgb*(.98+.02*diffuse);
 if(uKind>2.5){vec2 p=(vUV-.5)*2.0;alpha*=exp(-4.0*dot(p,p));col=uInk;}
 gl_FragColor=vec4(clamp(col,0.0,1.0),alpha);}`;
function ih51Fee(amount){const o=IDEA_HIRE_PUBLIC_OFFER;return Math.round(Math.max(o.minimum,Math.min(o.maximum,amount*o.percent/100))*100)/100;}
function ih51Money(value,english){return Number(value).toLocaleString(english?'en-GB':'pl-PL',{maximumFractionDigits:2})+(english?' PLN':' zł');}
function ih51Receipt(s){
 const c=document.createElement('canvas');c.width=1080;c.height=370;const x=c.getContext('2d'),p=s.palette,en=s.english;
 x.fillStyle=p.paper;x.fillRect(0,0,1080,370);x.strokeStyle=p.line;x.lineWidth=2;x.strokeRect(2,2,1076,366);x.fillStyle=p.ink;
 x.font='600 22px Inter,Arial';x.fillText('IDEAHIRE / '+(en?'CALCULATION':'OBLICZENIE'),42,51);x.font='700 114px Inter,Arial';x.fillText(en?'5.5%':'5,5%',39,190);
 x.font='500 25px Inter,Arial';x.fillText(en?'IdeaHire fee':'Prowizja IdeaHire',47,238);x.font='700 40px Inter,Arial';x.fillText(ih51Money(ih51Fee(s.amount),en),47,308);
 x.strokeStyle=p.line;x.beginPath();x.moveTo(452,95);x.lineTo(452,321);x.stroke();x.font='500 24px Inter,Arial';x.fillText(en?'Professional receives':'Wykonawca otrzymuje',498,134);x.font='700 43px Inter,Arial';x.fillText(ih51Money(s.amount,en),498,195);x.font='500 22px Inter,Arial';x.fillText(en?'Client total':'Klient płaci łącznie',498,259);x.font='700 39px Inter,Arial';x.fillText(ih51Money(s.amount+ih51Fee(s.amount),en),498,315);return c;
}
function ih51ScenePlan(s,w,h){
 const mode=s.mode,aspect=w/Math.max(1,h),x=s.x||0,y=s.y||0,t=s.time;
 const eye=mode==='background'?[x*.48,.35+y*.32,12]:mode==='mark'?[.15+x*.30,.3+y*.22,5.7]:[.2+x*.25,.5+y*.18,Math.max(2.7,6.0/aspect)];
 const vp=ih51Mul(ih51Perspective((mode==='background'?45:38)*Math.PI/180,aspect),ih51Look(eye,[0,0,0])),calls=[];
 if(mode==='background'){
  return{eye,vp,calls};
 }else if(mode==='mark'){
  const build=s.reduced?1:ih51Ease(s.build/.8),spread=1-build;
  for(let group=0;group<4;group++)for(let cell=0;cell<16;cell++){
   const gx=(group%2-.5)*1.17,gy=(.5-Math.floor(group/2))*1.17,cx=(cell%4-1.5)*.245,cy=(1.5-Math.floor(cell/4))*.245;
   const seed=((cell*17+group*29)%67)/67,delay=ih51Ease((s.build-seed*.13)/.62),splay=s.reduced?0:1-delay;
   const xx=gx+cx+splay*(cx+gx)*1.2,yy=gy+cy+splay*(cy+gy)*1.2,zz=splay*(.5+seed*.9);
   calls.push({mesh:'card',kind:1,alpha:1,model:ih51Transform(xx,yy,zz,-.12+y*.09+splay*.6,.18+x*.18+splay*(seed-.5),spread*(seed-.5)*.3,.097,.073,.70)});
  }
 }else{
  const turn=s.reduced?0:Math.sin(t*.55)*.018;
  calls.push({mesh:'shadow',kind:3,alpha:.14,model:ih51Transform(0,-.89,-.35,-Math.PI/2,0,0,2.4,.65,1)});
  calls.push({mesh:'card',kind:0,alpha:1,model:ih51Transform(0,.05,0,-.10+y*.035,-.13+x*.09,-.025+turn,1.48,.378,1.1)});
 }
 return{eye,vp,calls};
}
function ih51Renderer(canvas,mode){
 if(mode==='background')return ih51OpticsRenderer(canvas);
 const gl=canvas.getContext('webgl',{alpha:mode!=='background',antialias:true,powerPreference:'low-power'});if(!gl)return null;
 const shaders=[],buffers=[];let program,texture=null,signature='';
 try{program=gl.createProgram();for(const[type,source]of[[gl.VERTEX_SHADER,IH51_VERTEX],[gl.FRAGMENT_SHADER,IH51_FRAGMENT]]){const sh=gl.createShader(type);shaders.push(sh);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error('scene shader');gl.attachShader(program,sh);}gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('scene link');gl.useProgram(program);
  const meshes={};for(const[name,data]of Object.entries({card:ih51CardMesh(),shadow:ih51ShadowMesh()})){const vb=gl.createBuffer(),ib=gl.createBuffer();buffers.push(vb,ib);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.vertices),gl.STATIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(data.indices),gl.STATIC_DRAW);meshes[name]={vb,ib,count:data.indices.length};}
  const uniforms={},attributes={};for(const key of['uModel','uVP','uEye','uBase','uLight','uBG','uInk','uKind','uAlpha','uTexture','uTime'])uniforms[key]=gl.getUniformLocation(program,key);for(const key of['aPosition','aNormal','aUV','aMaterial'])attributes[key]=gl.getAttribLocation(program,key);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));for(const[k,v]of[[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);gl.uniform1i(uniforms.uTexture,0);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  return{draw(width,height,s){
   if(gl.isContextLost())return false;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}gl.viewport(0,0,width,height);gl.useProgram(program);const p=s.palette,bg=ih51RGB(p.bg),plan=ih51ScenePlan(s,s.cssWidth,s.cssHeight);gl.clearColor(...(mode==='background'?bg:[0,0,0]),mode==='background'?1:0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
   gl.uniformMatrix4fv(uniforms.uVP,false,new Float32Array(plan.vp));gl.uniform1f(uniforms.uTime,s.reduced?0:s.time);for(const[key,value]of[['uEye',plan.eye],['uBase',s.markColor||ih51RGB(p.material)],['uLight',ih51RGB(p.paper)],['uBG',bg],['uInk',ih51RGB(p.ink)]])gl.uniform3fv(uniforms[key],new Float32Array(value));
   if(mode==='receipt'){const next=JSON.stringify([p,s.amount,s.english,s.fontCycle]);if(signature!==next){signature=next;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,ih51Receipt(s));for(const[k,v]of[[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);}gl.uniform1i(uniforms.uTexture,0);}
   for(const call of plan.calls){const mesh=meshes[call.mesh];gl.bindBuffer(gl.ARRAY_BUFFER,mesh.vb);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ib);for(const[key,size,offset]of[['aPosition',3,0],['aNormal',3,12],['aUV',2,24],['aMaterial',1,32]]){const a=attributes[key];gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,36,offset);}gl.uniformMatrix4fv(uniforms.uModel,false,new Float32Array(call.model));gl.uniform1f(uniforms.uKind,call.kind);gl.uniform1f(uniforms.uAlpha,call.alpha);if(texture)gl.bindTexture(gl.TEXTURE_2D,texture);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}
   return true;
  },destroy(){buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(sh=>gl.deleteShader(sh));if(texture)gl.deleteTexture(texture);gl.deleteProgram(program);}};
 }catch{buffers.forEach(b=>gl.deleteBuffer(b));shaders.forEach(sh=>gl.deleteShader(sh));if(texture)gl.deleteTexture(texture);if(program)gl.deleteProgram(program);return null;}
}
function ih51StartScene(canvas,host,owner,state){
 let engine=null,dead=false,frame=0,last=0,lastDraw=0,visible=true,dirty=true,observer,resize;const listeners=[];

 const listen=(node,event,fn,options)=>{node.addEventListener(event,fn,options);listeners.push(()=>node.removeEventListener(event,fn,options));};
 if(state.current.mode==='background')state.current.scroll=state.current.targetScroll=(window.scrollY||0)/Math.max(1,window.innerHeight);
 const create=()=>{engine?.destroy();engine=ih51Renderer(canvas,state.current.mode);host.dataset.renderer=engine?'loading':'fallback';if(state.current.mode==='mark')owner.dataset.ih51Ready='false';};
 function tick(now){frame=0;if(dead||!visible||document.hidden)return;const s=state.current,interval=window.innerWidth<821?1000/30:1000/40;
  if(!s.paused&&!s.reduced&&lastDraw&&now-lastDraw<interval-1){frame=requestAnimationFrame(tick);return;}const dt=last?Math.min(.08,(now-last)/1000):0;last=now;lastDraw=now;
  if(!s.paused&&!s.reduced){s.time+=dt;s.build+=dt;s.settle+=dt;s.x+=(s.targetX-s.x)*.14;s.y+=(s.targetY-s.y)*.14;s.scroll+=(s.targetScroll-s.scroll)*.10;}
  if(dirty){const b=host.getBoundingClientRect();s.cssWidth=Math.max(1,b.width);s.cssHeight=Math.max(1,b.height);const budget=s.mode==='background'?(window.innerWidth<821?400000:800000):s.mode==='mark'?30000:220000,dpr=Math.min(window.devicePixelRatio||1,1.6,Math.sqrt(budget/(s.cssWidth*s.cssHeight)));s.width=Math.max(1,Math.round(s.cssWidth*dpr));s.height=Math.max(1,Math.round(s.cssHeight*dpr));dirty=false;}

  try{const drawn=engine?.draw(s.width,s.height,s);if(drawn){host.dataset.renderer='ready';if(s.mode==='mark')owner.dataset.ih51Ready='true';}}catch{engine?.destroy();engine=null;host.dataset.renderer='fallback';if(s.mode==='mark')owner.dataset.ih51Ready='false';}
  if(engine&&!s.paused&&!s.reduced&&(s.mode!=='mark'||s.active||s.build<1.05||s.settle<.55))frame=requestAnimationFrame(tick);
 }
 const wake=()=>{if(!dead&&visible&&!document.hidden&&!frame){last=0;lastDraw=0;frame=requestAnimationFrame(tick);}};
 const replay=()=>{const s=state.current;if(!s.reduced&&!s.paused){s.build=0;s.settle=0;}wake();};
 create();listen(window,'resize',()=>{dirty=true;wake();},{passive:true});listen(window,'scroll',()=>{state.current.targetScroll=(window.scrollY||0)/Math.max(1,window.innerHeight);wake();},{passive:true});
 listen(owner,'pointermove',e=>{if(e.pointerType!=='mouse'||state.current.reduced||state.current.paused)return;const b=owner.getBoundingClientRect();state.current.targetX=(e.clientX-b.left)/Math.max(1,b.width)*2-1;state.current.targetY=(e.clientY-b.top)/Math.max(1,b.height)*2-1;state.current.settle=0;wake();},{passive:true});
 listen(owner,'pointerenter',e=>{if(e.pointerType==='mouse'){state.current.active=true;replay();}});listen(owner,'pointerleave',()=>{Object.assign(state.current,{active:false,targetX:0,targetY:0,settle:0});wake();});
 if(state.current.mode==='mark'){listen(owner,'ih51-card-enter',replay);listen(owner,'focusin',replay);listen(owner,'click',replay);listen(owner,'focusout',()=>{state.current.active=false;wake();});}
 listen(window,'ih51-motion',e=>{state.current.paused=!!e.detail?.paused;wake();});
 listen(document,'visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden)wake();});
 listen(canvas,'webglcontextlost',e=>{e.preventDefault();engine?.destroy();engine=null;host.dataset.renderer='fallback';if(state.current.mode==='mark')owner.dataset.ih51Ready='false';cancelAnimationFrame(frame);frame=0;});listen(canvas,'webglcontextrestored',()=>{create();dirty=true;wake();});
 if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}},{rootMargin:state.current.mode==='background'?'0px':'60px'});observer.observe(host);}
 if(typeof ResizeObserver!=='undefined'){resize=new ResizeObserver(()=>{dirty=true;wake();});resize.observe(host);}
 if(state.current.mode==='receipt')ih51Fonts().then(()=>{if(!dead){state.current.fontCycle=(state.current.fontCycle||0)+1;wake();}}).catch(()=>{});
 wake();return{wake,replay,destroy(){dead=true;cancelAnimationFrame(frame);listeners.forEach(fn=>fn());observer?.disconnect();resize?.disconnect();engine?.destroy();if(state.current.mode==='mark')delete owner.dataset.ih51Ready;}};
}
function ih51Initial(mode,palette,reduced,english=false,amount=500){return{mode,palette,reduced,english,amount,paused:IH51_MOTION.paused,time:0,build:1.2,settle:1,x:0,y:0,targetX:0,targetY:0,scroll:0,targetScroll:0,active:false};}
const IH51_MOTION={paused:false};
function useIH51Reduced(){const[value,setValue]=useState(()=>typeof window!=='undefined'&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const m=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!m)return;const change=()=>setValue(m.matches);m.addEventListener?.('change',change);return()=>m.removeEventListener?.('change',change);},[]);return value;}
function ih51Palette(site){return IDEA_HIRE_VISUAL_SYSTEM[site.template==='classic'?(site.theme==='dark'?'monoDark':'mono'):(site.theme==='dark'?'turquoiseDark':'turquoise')];}
function IH51Backdrop({rootRef}){
 const host=useRef(null),canvas=useRef(null),site=useSitePreferences(),reduced=useIH51Reduced(),palette=ih51Palette(site);
 useEffect(()=>{const state={current:ih51Initial('background',palette,reduced)};const engine=ih51StartScene(canvas.current,host.current,rootRef.current,state);return()=>engine.destroy();},[palette,reduced]);
 return <div className="ih51-backdrop" ref={host} aria-hidden="true"><div className="ih51-optical-fallback"/><canvas ref={canvas}/></div>;
}
function ih51Entrances(root,reduced){
 const selector='.ih-category-browser,.ih5-story,.steps > .ih40-step,.split-section > .split-card,.final-cta,.section-heading,.ih-demo-reviews-heading';
 const nodes=Array.from(root.querySelectorAll(selector)),records=new Map();let observer=null,paused=IH51_MOTION.paused,dead=false;
 const finish=node=>{const record=records.get(node);if(!record)return;clearTimeout(record.timer);record.timer=0;node.dataset.ih51Entrance='shown';if(!dead&&!reduced&&!paused)observer?.observe(node);};
 const reveal=(node,immediate=false,delay=0)=>{
  const record=records.get(node);if(!record)return;
  if(immediate){finish(node);return;}if(node.dataset.ih51Entrance==='entering'||node.dataset.ih51Entrance==='shown')return;
  observer?.unobserve(node);node.style.setProperty('--ih51-stagger',delay+'ms');node.dataset.ih51Entrance='entering';node.dispatchEvent(new CustomEvent('ih51-card-enter',{bubbles:true}));node.querySelector('.ih-category-trigger')?.dispatchEvent(new CustomEvent('ih51-card-enter'));
  record.timer=setTimeout(()=>finish(node),1320+delay);
 };
 nodes.forEach((node,index)=>{
  const siblings=Array.from(node.parentElement?.children||[]),ordinal=Math.max(0,siblings.indexOf(node)),up=node.matches('.final-cta,.section-heading,.ih-demo-reviews-heading');
  node.style.setProperty('--ih51-entry-x',up?'0px':ordinal%2?'76px':'-76px');node.style.setProperty('--ih51-entry-y',up?'72px':'28px');node.style.setProperty('--ih51-mask',up?'inset(0 0 100% 0)':ordinal%2?'inset(0 0 0 100%)':'inset(0 100% 0 0)');
  const parts=Array.from(node.querySelectorAll('.ih40-step-number,.ih40-step-title,.ih40-step-copy,:scope > .section-label,:scope > h2:not(.final-cta-title),:scope > p,:scope > .btn,.final-cta-title > span'));
  parts.forEach((part,i)=>{part.dataset.ih51Part='true';part.style.setProperty('--ih51-part-x',part.matches('.btn')?(ordinal%2?'-56px':'56px'):i%2?'32px':'-32px');part.style.setProperty('--ih51-part-delay',190+Math.min(i,4)*90+'ms');});records.set(node,{timer:0,parts});
 });
 const focus=e=>{const node=e.target.closest?.(selector);if(node)reveal(node,true);};
 const motion=e=>{paused=!!e.detail?.paused;if(paused){observer?.disconnect();nodes.forEach(n=>reveal(n,true));}else if(!reduced)nodes.forEach(n=>observer?.observe(n));};
 if(!reduced&&!paused&&typeof IntersectionObserver!=='undefined')try{
  observer=new IntersectionObserver(entries=>{if(dead)return;let count=0;for(const entry of entries){const node=entry.target;if(entry.isIntersecting){reveal(node,paused,count++*85);}else if(node.dataset.ih51Entrance!=='entering'){const b=entry.boundingClientRect;if(b.bottom<=0||b.top>=window.innerHeight)node.dataset.ih51Entrance='waiting';}}},{threshold:0,rootMargin:'0px 0px -40px 0px'});
  nodes.forEach(node=>{const b=node.getBoundingClientRect();node.dataset.ih51Entrance=b.bottom<=0?'shown':'waiting';observer.observe(node);});
 }catch{observer?.disconnect();nodes.forEach(n=>finish(n));}else nodes.forEach(n=>finish(n));
 root.addEventListener('focusin',focus);root.addEventListener('pointerdown',focus,true);window.addEventListener('ih51-motion',motion);
 return()=>{dead=true;observer?.disconnect();root.removeEventListener('focusin',focus);root.removeEventListener('pointerdown',focus,true);window.removeEventListener('ih51-motion',motion);for(const[node,{timer,parts}]of records){clearTimeout(timer);delete node.dataset.ih51Entrance;for(const key of['--ih51-stagger','--ih51-entry-x','--ih51-entry-y','--ih51-mask'])node.style.removeProperty(key);parts.forEach(part=>{delete part.dataset.ih51Part;part.style.removeProperty('--ih51-part-x');part.style.removeProperty('--ih51-part-delay');});}};
}
function useIH51LegacyEnhancements(rootRef){
 const site=useSitePreferences(),reduced=useIH51Reduced(),palette=ih51Palette(site);
 useEffect(()=>{
  const root=rootRef.current;if(!root)return;document.body.classList.add('ih51-active');
  const marks=[],presses=new Map(),stopEntrances=ih51Entrances(root,reduced);let frame=0,pending=null,current=null;
  for(const mark of root.querySelectorAll('.ih-category-mark,.ih40-step-mark')){
   const owner=mark.closest('.ih-category-trigger,.ih40-step');if(!owner)continue;
   const host=document.createElement('span'),canvas=document.createElement('canvas');host.className='ih51-mark-scene';host.setAttribute('aria-hidden','true');host.appendChild(canvas);mark.appendChild(host);
   const state={current:ih51Initial('mark',palette,reduced)};state.current.markColor=ih51RGB(mark.classList.contains('ih-category-mark')?palette.on:palette.ink);const sample=mark.querySelector('i');const color=sample?getComputedStyle(sample).backgroundColor:'';const numbers=color.match(/[\d.]+/g);if(numbers?.length>=3&&(numbers.length<4||Number(numbers[3])>=.5))state.current.markColor=numbers.slice(0,3).map(v=>Number(v)/255);
   const engine=ih51StartScene(canvas,host,owner,state);marks.push({engine,host,mark});
  }
  const reset=()=>{if(current){current.style.removeProperty('--ih51-rx');current.style.removeProperty('--ih51-ry');current.removeAttribute('data-ih51-tilt');current=null;}};
  const move=e=>{if(e.pointerType!=='mouse'||reduced||IH51_MOTION.paused)return;const target=e.target.closest?.('.ih-category-trigger,.ih40-step > button,.split-card');if(!target){reset();return;}pending={target,x:e.clientX,y:e.clientY};if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(!pending)return;const{target,x,y}=pending,b=target.getBoundingClientRect();if(current!==target)reset();current=target;target.dataset.ih51Tilt='true';target.style.setProperty('--ih51-rx',((.5-(y-b.top)/Math.max(1,b.height))*8).toFixed(2)+'deg');target.style.setProperty('--ih51-ry',(((x-b.left)/Math.max(1,b.width)-.5)*8).toFixed(2)+'deg');});};
  const clearPresses=()=>{presses.forEach((timer,target)=>{clearTimeout(timer);target.removeAttribute('data-ih51-press');});presses.clear();};
  const press=e=>{if(e.pointerType==='mouse'||reduced||IH51_MOTION.paused)return;const target=e.target.closest?.('.ih-category-trigger,.ih40-step > button');if(!target)return;clearTimeout(presses.get(target));target.dataset.ih51Press='true';presses.set(target,setTimeout(()=>{target.removeAttribute('data-ih51-press');presses.delete(target);},680));};
  root.addEventListener('pointermove',move,{passive:true});root.addEventListener('pointerdown',press,{passive:true});root.addEventListener('pointercancel',clearPresses);root.addEventListener('pointerleave',reset);window.addEventListener('blur',reset);
  return()=>{stopEntrances();cancelAnimationFrame(frame);reset();clearPresses();root.removeEventListener('pointermove',move);root.removeEventListener('pointerdown',press);root.removeEventListener('pointercancel',clearPresses);root.removeEventListener('pointerleave',reset);window.removeEventListener('blur',reset);marks.forEach(({engine,host,mark})=>{engine.destroy();host.remove();delete mark.dataset.ih51Ready;});document.body.classList.remove('ih51-active');};
 },[rootRef,palette,reduced]);
}
function IH51FeeIsland(){
 const site=useSitePreferences(),palette=ih51Palette(site),english=site.language==='en',reduced=useIH51Reduced(),[draft,setDraft]=useState('500');
 const amount=ih51Clamp(Number(draft)||1,1,IDEA_HIRE_PUBLIC_OFFER.orderLimit),host=useRef(null),canvas=useRef(null),engine=useRef(null),state=useRef(ih51Initial('receipt',palette,reduced,english,amount));
 useLayoutEffect(()=>{Object.assign(state.current,{palette,reduced,english,amount});engine.current?.wake();},[palette,reduced,english,amount]);
 useEffect(()=>{engine.current=ih51StartScene(canvas.current,host.current,host.current,state);return()=>{engine.current?.destroy();engine.current=null;};},[]);
 return <div className="ih51-fee-island"><div className="ih51-receipt" ref={host} aria-hidden="true"><canvas ref={canvas}/><span className="ih51-receipt-fallback">{ih51Money(amount,english)} + {ih51Money(ih51Fee(amount),english)}</span></div><div className="ih51-fee-controls"><label>{english?'Project value':'Kwota zlecenia'}<span><input type="number" min="1" max={IDEA_HIRE_PUBLIC_OFFER.orderLimit} step="1" inputMode="decimal" value={draft} onChange={e=>setDraft(e.target.value)} onBlur={()=>setDraft(String(amount))}/>{english?'PLN':'zł'}</span></label><output aria-live="polite">{english?'Client total':'Łącznie dla klienta'}<strong>{ih51Money(amount+ih51Fee(amount),english)}</strong></output></div></div>;
}
function ih51RealJob(job){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(job?.id||''));}
function IH51JobsFinale({jobs=[],paused,reduced,onReplay,onPause,canReplay=true}){
 const site=useSitePreferences(),en=site.language==='en',host=useRef(null),real=jobs.filter(ih51RealJob),list=real.length?real:jobs;
 const signature=list.map(j=>j.id).join('|'),known=useRef(new Set(list.map(j=>j.id))),current=useRef(list[0]||null),gesture=useRef(null);
 const[view,setView]=useState(()=>({job:list[0]||null,previous:null,sequence:0,direction:'next'})),[pending,setPending]=useState(null),[hover,setHover]=useState(false),[focus,setFocus]=useState(false),[visible,setVisible]=useState(true),[hidden,setHidden]=useState(()=>document.hidden);
 const stopped=paused||reduced||hover||focus||hidden||!visible,active=list.find(j=>j.id===view.job?.id)||view.job,index=Math.max(0,list.findIndex(j=>j.id===active?.id));current.current=active;
 const copy=en?{kicker:'IDEAHIRE / PROJECTS',title:['Find work.','Use your skills.'],intro:'Browse recent briefs or find the right person for your own project.',talent:'Find a professional',jobs:'Browse all projects',replay:'Replay the introduction',previous:'Previous project',next:'Next project',pause:'Pause animations',play:'Resume animations',sample:'Illustrative project',published:'Recently published',new:'New project',view:'View project',budget:'Project budget',empty:'No projects to display yet.',emptyAction:'Explore the catalogue',terms:'Paid only by the client. The freelancer receives the full agreed amount.',fee:'IdeaHire fee',minimum:'min.',maximum:'max.',pending:'Show new projects',controls:'Project preview controls'}:{kicker:'IDEAHIRE / ZLECENIA',title:['Znajdź zlecenie.','Wykorzystaj swój fach.'],intro:'Sprawdź ostatnie ogłoszenia lub znajdź osobę do własnego projektu.',talent:'Znajdź wykonawcę',jobs:'Wszystkie zlecenia',replay:'Powtórz wprowadzenie',previous:'Poprzednie zlecenie',next:'Następne zlecenie',pause:'Zatrzymaj animacje',play:'Wznów animacje',sample:'Przykładowe zlecenie',published:'Ostatnio opublikowane',new:'Nowe zlecenie',view:'Zobacz ogłoszenie',budget:'Budżet projektu',empty:'Nie ma jeszcze zleceń do wyświetlenia.',emptyAction:'Przejrzyj katalog',terms:'Płaci wyłącznie zleceniodawca. Wykonawca otrzymuje całą ustaloną kwotę.',fee:'Prowizja IdeaHire',minimum:'min.',maximum:'maks.',pending:'Pokaż nowe zlecenia',controls:'Sterowanie podglądem zleceń'};
 function show(job,direction='next'){
  if(!job)return;setView(previous=>previous.job?.id===job.id?{...previous,job}:{job,previous:previous.job,sequence:previous.sequence+1,direction});setPending(null);
 }
 function next(direction){if(!list.length)return;show(list[(index+direction+list.length)%list.length],direction<0?'previous':'next');}
 useEffect(()=>{
  const incoming=list.filter(job=>!known.current.has(job.id));known.current=new Set(list.map(job=>job.id));
  if(incoming.length&&real.length)setPending({job:incoming[0],count:incoming.length});
  else if(!current.current||!list.some(j=>j.id===current.current.id))show(list[0]);
 },[signature]);
 useEffect(()=>{if(pending&&!stopped)show(pending.job,'new');},[pending,stopped]);
 useEffect(()=>{if(stopped||list.length<2||pending)return;const timer=setTimeout(()=>next(1),6500);return()=>clearTimeout(timer);},[view.sequence,signature,stopped,!!pending]);
 useEffect(()=>{if(!view.previous)return;const timer=setTimeout(()=>setView(previous=>({...previous,previous:null})),650);return()=>clearTimeout(timer);},[view.sequence]);
 useEffect(()=>{
  const update=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',update);let observer;
  if(typeof IntersectionObserver!=='undefined'){observer=new IntersectionObserver(entries=>setVisible(!!entries[0]?.isIntersecting),{threshold:0});observer.observe(host.current);}
  return()=>{document.removeEventListener('visibilitychange',update);observer?.disconnect();};
 },[]);
 function renderCard(job,outgoing=false){
  const sample=job.preview===true||!ih51RealJob(job),amount=Number(job.budget),category=getCategoryLabel(job.category),label=en?translateUiText(category):category;
  const price=Number.isFinite(amount)&&amount>0?ih51Money(amount,en):(en?'To be agreed':'Do ustalenia');
  return <article className={'ih51-project-card'+(outgoing?' is-outgoing':'')} data-direction={view.direction} key={(outgoing?'out:':'in:')+view.sequence} aria-hidden={outgoing||undefined}>
   <div className="ih51-project-top"><span>{sample?copy.sample:view.direction==='new'?copy.new:copy.published}</span><span>{String(list.length?index+1:0).padStart(2,'0')} / {String(list.length).padStart(2,'0')}</span></div>
   <span className="ih51-project-category">{label}</span><h3 title={job.title}>{String(job.title||'').slice(0,160)}</h3>
   <p>{String(job.description||(en?'Review the scope and requirements in the listing.':'Sprawdź zakres i wymagania w ogłoszeniu.')).slice(0,280)}</p>
   <div className="ih51-project-bottom"><div><small>{copy.budget}</small><strong>{price}</strong></div>{outgoing?<span className="ih51-project-open" aria-hidden="true">↗</span>:<Link className="ih51-project-open" to="/jobs" state={sample?undefined:{lucynaJobId:job.id,lucynaTitle:job.title}} aria-label={copy.view+': '+job.title}>↗</Link>}</div>
   {!outgoing&&list.length>1&&<span className="ih51-project-progress" aria-hidden="true"><i style={{animationPlayState:stopped?'paused':'running'}}/></span>}
  </article>;
 }
 return <div className="ih51-jobs-finale" ref={host} data-no-translate="true" data-paused={stopped} data-motion-paused={paused||reduced}>
  <div className="ih51-finale-top"><span>{copy.kicker}</span><button type="button" className="ih51-replay" disabled={!canReplay} onClick={onReplay}><span aria-hidden="true">↻</span><span>{copy.replay}</span></button></div>
  <div className="ih51-finale-layout"><div className="ih51-finale-copy"><h2>{copy.title.map((line,i)=><span key={i}>{line}</span>)}</h2><p>{copy.intro}</p><div className="ih51-finale-actions"><Link to="/find-talent">{copy.talent}<span aria-hidden="true">↗</span></Link><Link to="/jobs">{copy.jobs}<span aria-hidden="true">↗</span></Link></div></div>
   <div className="ih51-projects" onPointerEnter={e=>{if(e.pointerType==='mouse')setHover(true);}} onPointerLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}}>
    <div className="ih51-project-window" onPointerDown={e=>{if(e.pointerType==='touch')gesture.current={x:e.clientX,y:e.clientY};}} onPointerCancel={()=>{gesture.current=null;}} onPointerUp={e=>{const first=gesture.current;gesture.current=null;if(!first)return;const dx=e.clientX-first.x,dy=e.clientY-first.y;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.5)next(dx>0?-1:1);}}>
     {view.previous&&renderCard(view.previous,true)}{active?renderCard(active):<div className="ih51-project-empty"><p>{copy.empty}</p><Link to="/jobs">{copy.emptyAction} ↗</Link></div>}
    </div>
    <div className="ih51-project-controls" role="group" aria-label={copy.controls}><button type="button" onClick={()=>next(-1)} disabled={list.length<2} aria-label={copy.previous}>←</button><span>{String(list.length?index+1:0).padStart(2,'0')} / {String(list.length).padStart(2,'0')}</span><button type="button" onClick={()=>next(1)} disabled={list.length<2} aria-label={copy.next}>→</button><button type="button" className="ih51-project-pause" onClick={onPause} aria-label={paused?copy.play:copy.pause} aria-pressed={paused}><span aria-hidden="true">{paused?'▶':'Ⅱ'}</span></button></div>
    <div className="ih51-project-status" aria-live="polite">{pending&&<button type="button" onClick={()=>show(pending.job,'new')}>{copy.pending} <span aria-hidden="true">↗</span></button>}</div>
   </div>
  </div>
  <div className="ih51-finale-fee"><strong>{copy.fee} {IDEA_HIRE_PUBLIC_OFFER.percent.toLocaleString(en?'en-GB':'pl-PL')}%</strong><span>{copy.minimum} {IDEA_HIRE_PUBLIC_OFFER.minimum} {en?'PLN':'zł'} · {copy.maximum} {IDEA_HIRE_PUBLIC_OFFER.maximum} {en?'PLN':'zł'}</span><p>{copy.terms}</p></div>
 </div>;
}
function IH51CommissionStory() {
  const id = "ih51-commission";
  const [visible, setVisible] = useState(true);
  const sceneRef = useRef(null);
  useEffect(() => {
    if (!window.IntersectionObserver) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.08 });
    if (sceneRef.current) observer.observe(sceneRef.current);
    return () => observer.disconnect();
  }, []);
  const offer = IDEA_HIRE_PUBLIC_OFFER;
  return (
    <aside ref={sceneRef} className="ih5-story" data-paused={!visible} aria-labelledby={`${id}-title`}>
      <div className="ih5-story-top"><span className="ih5-eyebrow">Od pomysłu do gotowej pracy</span></div>
      <div className="ih5-story-stage" aria-hidden="true">
        <IH51FeeIsland />
      </div>
      <div className="ih5-story-offer"><div><span>Prowizja IdeaHire</span><h3 id={`${id}-title`}>{offer.percent.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}<span>%</span></h3></div><div className="ih5-story-limits"><strong>maks. {offer.maximum} zł</strong><span>min. {offer.minimum} zł · zlecenia do {offer.orderLimit.toLocaleString("pl-PL")} zł</span></div></div>
      <p className="ih5-story-footnote">Klient płaci wynagrodzenie wykonawcy + prowizję IdeaHire.</p>
      <Link className="ih5-story-link" to="/find-talent">Zamień pomysł w projekt <MarketIcon kind="arrow" /></Link>
    </aside>
  );
}


function App({ session, loading, categoryGroups = [] }) {
  const ih51RootRef=useRef(null);
  useIH51LegacyEnhancements(ih51RootRef);
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
    <div ref={ih51RootRef} className="app ih-home-refresh ih-home-v3 ih-home-v4 ih-home-v6 ih-home-v7 ih51-home">
      <style>{IH51_STYLES}</style>
      <IH51Backdrop rootRef={ih51RootRef}/>
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
            <IH51CommissionStory />
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


