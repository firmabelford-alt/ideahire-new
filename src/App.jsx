/* IdeaHire | P43 | Zwarcie | Pełny plik: src/App.jsx | Film 48 s, 14 ujęć, pętla */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { IDEA_HIRE_PUBLIC_OFFER, CommissionStory, HomeStepCard, IdeaHireLogo, MarketIcon, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences } from "./Preferences";

const IH43_STYLES=String.raw`
__IH43__ .ih43-film {--ih43-pad:28px;--ih43-bottom:101px;--ih43-button:226px;--ih43-gap:12px;--ih43-toolbar:calc(100% - 176px);position:relative!important;isolation:isolate!important;display:block!important;width:100%!important;max-width:none!important;height:clamp(710px,53vw,850px)!important;min-height:710px!important;margin:0 0 44px!important;padding:0!important;overflow:hidden!important;border:0!important;border-radius:0!important;background:#101d34!important;color:#f2f0de!important;font-family:Inter,Arial,sans-serif!important;text-align:left!important;box-shadow:none!important;}
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
  "key": "02-Zwarcie",
  "name": "Zwarcie",
  "genre": "network",
  "period": 48,
  "palette": {
    "paper": "#f2f0de",
    "ink": "#101d34",
    "accent": "#2857f1",
    "secondary": "#e0f26b",
    "light": "#ffffff",
    "muted": "#7e91b9"
  },
  "shots": [
    {
      "kind": "signal",
      "duration": 1.8,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        0,
        0,
        0.78
      ]
    },
    {
      "kind": "signal",
      "duration": 2.2,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        0,
        0,
        1
      ]
    },
    {
      "kind": "portfolio",
      "duration": 4,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        0,
        0,
        1.06
      ]
    },
    {
      "kind": "signal",
      "duration": 2,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        450,
        -60,
        0.75
      ]
    },
    {
      "kind": "board",
      "duration": 4.5,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        1050,
        -150,
        1
      ]
    },
    {
      "kind": "signal",
      "duration": 2.5,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        1450,
        -10,
        0.8
      ]
    },
    {
      "kind": "message",
      "duration": 5,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        2100,
        110,
        1.05
      ]
    },
    {
      "kind": "message",
      "duration": 3.5,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        2100,
        110,
        1.12
      ]
    },
    {
      "kind": "arrangement",
      "duration": 4,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        3150,
        -90,
        1
      ]
    },
    {
      "kind": "signal",
      "duration": 2.5,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        3150,
        -90,
        0.88
      ]
    },
    {
      "kind": "zoom",
      "duration": 3,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        2000,
        0,
        0.34
      ]
    },
    {
      "kind": "zoom",
      "duration": 3,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        1500,
        0,
        0.28
      ]
    },
    {
      "kind": "zoom",
      "duration": 4,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        1050,
        -100,
        0.64
      ]
    },
    {
      "kind": "final",
      "duration": 6.0,
      "bg": "ink",
      "motion": "slam",
      "camera": [
        0,
        0,
        0.7
      ]
    }
  ],
  "pl": {
    "cta": [
      "Przeglądaj ogłoszenia",
      "Poznaj specjalistów"
    ],
    "subtitle": "Portfolio pokazuje robotę. Rozmowa ustawia kierunek.",
    "disclosure": "Ilustracja działania — fikcyjna korespondencja.",
    "floating": [
      "Dopasowanie",
      "Kontakt",
      "Decyzja"
    ],
    "ui": {
      "portfolio": "Portfolio",
      "works": [
        "Ruch",
        "Postać",
        "Czołówka"
      ],
      "caption": "Wybrane realizacje",
      "inquiries": "Zapytania",
      "projects": [
        "Animowany wstęp",
        "Bohater kampanii",
        "Intro festiwalu"
      ],
      "correspondence": "Korespondencja",
      "messages": [
        "Pasuje.",
        "Kiedy zaczynasz?",
        "Podeślę próbkę."
      ],
      "arrangement": "Współpraca",
      "points": [
        "Ustalenia",
        "Harmonogram",
        "Rozliczenie"
      ]
    },
    "ctaMobile": [
      "Ogłoszenia",
      "Specjaliści"
    ],
    "frames": [
      [
        "UMIESZ",
        "WIĘCEJ."
      ],
      [
        "POKAŻ",
        "WARSZTAT."
      ],
      [
        "REALIZACJE",
        "MÓWIĄ."
      ],
      [
        "KTOŚ",
        "SZUKA."
      ],
      [
        "WŁAŚNIE",
        "CIEBIE."
      ],
      [
        "OFERTA."
      ],
      [
        "ROZMOWA."
      ],
      [
        "PASUJE."
      ],
      [
        "WSPÓŁPRACA."
      ],
      [
        "KIEDY",
        "ZACZYNASZ?"
      ],
      [
        "RZEMIOSŁO."
      ],
      [
        "WŁAŚCIWY ADRES."
      ],
      [
        "WYBIERASZ",
        "SAMODZIELNIE."
      ],
      [
        "Zarabiaj",
        "tym, co umiesz."
      ]
    ],
    "final": [
      "Zarabiaj",
      "tym, co umiesz."
    ]
  },
  "en": {
    "cta": [
      "See opportunities",
      "Meet professionals"
    ],
    "subtitle": "A portfolio shows the skill. A conversation sets the course.",
    "disclosure": "Product illustration — fictional correspondence.",
    "floating": [
      "Match",
      "Contact",
      "Decision"
    ],
    "ui": {
      "portfolio": "Portfolio",
      "works": [
        "Motion",
        "Character",
        "Opening"
      ],
      "caption": "Selected projects",
      "inquiries": "Inquiries",
      "projects": [
        "Animated opening",
        "Campaign character",
        "Festival introduction"
      ],
      "correspondence": "Correspondence",
      "messages": [
        "That fits.",
        "When can you begin?",
        "I’ll send a sample."
      ],
      "arrangement": "Collaboration",
      "points": [
        "Agreements",
        "Schedule",
        "Settlement"
      ]
    },
    "ctaMobile": [
      "Listings",
      "Specialists"
    ],
    "frames": [
      [
        "YOU HAVE",
        "THE SKILLS."
      ],
      [
        "SHOW",
        "YOUR CRAFT."
      ],
      [
        "LET THE",
        "WORK SPEAK."
      ],
      [
        "SOMEONE",
        "IS LOOKING."
      ],
      [
        "FOR",
        "YOU."
      ],
      [
        "A PROPOSAL."
      ],
      [
        "A CONVERSATION."
      ],
      [
        "THAT FITS."
      ],
      [
        "COLLABORATION."
      ],
      [
        "WHEN",
        "CAN YOU BEGIN?"
      ],
      [
        "EXPERTISE."
      ],
      [
        "THE RIGHT PLACE."
      ],
      [
        "ON",
        "YOUR TERMS."
      ],
      [
        "Earn",
        "with your craft."
      ]
    ],
    "final": [
      "Earn",
      "with your craft."
    ]
  },
  "paths": [
    "/jobs",
    "/find-talent"
  ],
  "finalStart": 42.0,
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
    if(!s.paused&&!s.reduced)s.time+=dt;
    c.setTransform(ratio,0,0,ratio,0,0);const phase=ih43Frame(c,width,height,s.time,s,true);
    if(phase.index!==previous){previous=phase.index;report({scene:phase.index});hit(phase.index);}if(!s.ready){s.ready=true;report({ready:true});}
    if(!s.paused&&!s.reduced)frame=requestAnimationFrame(render);
  }catch{destroy();report({failed:true,ready:true});}};
  const wake=()=>{if(!disposed&&visible&&!document.hidden&&!frame){last=0;lastDraw=0;frame=requestAnimationFrame(render);}};
  try{
    c=canvas.getContext("2d",{alpha:false});if(!c)throw new Error("ih43_canvas");
    listen(window,"resize",()=>{dirty=true;wake();},{passive:true});listen(document,"visibilitychange",()=>{last=0;lastDraw=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;stopSound();}else wake();});
    if(typeof ResizeObserver!=="undefined"){resizeObserver=new ResizeObserver(()=>{dirty=true;wake();});resizeObserver.observe(host);}
    if(typeof IntersectionObserver!=="undefined"){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;lastDraw=0;stopSound();}},{rootMargin:"100px"});observer.observe(host);}
    document.fonts?.ready?.then(()=>{if(!disposed){IH43_MEASURE.clear();wake();}}).catch(()=>{});
    resize();wake();
    return{wake,destroy,mute(){sound=false;state.current.sound=false;stopSound();wake();},replay(){state.current.time=0;previous=-1;wake();},finale(){state.current.time=IH43_FILM.finalStart+1.6;previous=-1;wake();},async toggleSound(){if(disposed||state.current.reduced)return false;try{if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;audio=new Context();}if(!sound){await audio.resume();if(disposed||state.current.reduced)return false;sound=true;}else{sound=false;stopSound();}state.current.sound=sound;wake();return sound;}catch{return false;}}};
  }catch{destroy();report({failed:true,ready:true});return{wake(){},destroy,mute(){},replay(){},finale(){},async toggleSound(){return false;}};}
}

function ih43NetworkCard(c,x,y,w,h,p,label,accent){ih43Panel(c,x,y,w,h,{fill:p.paper,ink:p.ink,label});ih43Box(c,x-w/2+20,y-h/2+59,w-40,5,accent,2);}
function ih43Portfolio(c,x,y,p,lang,time){
  ih43NetworkCard(c,x,y,590,325,p,lang.portfolio,p.accent);
  const colors=[p.accent,p.secondary,p.ink];
  for(let i=0;i<3;i++){const yy=y-85+Math.sin(time*2+i)*6,xx=x-253+i*168;c.save();c.translate(xx,yy);c.rotate(Math.sin(time+i)*.025);ih43Box(c,0,0,154,174,colors[i],5);const tone=i===1?p.ink:p.paper;ih43Text(c,lang.works[i],16,40,20,tone,800);for(let r=0;r<5;r++){c.globalAlpha=.13+(r%2)*.12;c.fillStyle=tone;c.fillRect(16,70+r*13,88+Math.sin(r+i)*22,4);}c.globalAlpha=1;ih43Text(c,"0"+(i+1),16,153,12,tone,500);c.restore();}
  ih43Text(c,lang.caption,x-253,y+132,13,p.ink,500);
}
function ih43Requests(c,x,y,p,lang,time){
  ih43NetworkCard(c,x,y,590,325,p,lang.inquiries,p.secondary);
  for(let i=0;i<3;i++){const beat=.5+.5*Math.sin(time*2.5+i),xx=x-263+(i===1?beat*8:0),yy=y-84+i*70;ih43Box(c,xx,yy,526,58,i===1?p.accent:null,6,i===1?null:"rgba(10,20,40,.17)");ih43Text(c,lang.projects[i],xx+16,yy+34,20,i===1?p.paper:p.ink,650);ih43Arrow(c,xx+495,yy+29,i===1?p.paper:p.ink,13);}
}
function ih43Messages(c,x,y,p,lang,time){
  ih43NetworkCard(c,x,y,590,325,p,lang.correspondence,p.accent);
  for(let i=0;i<3;i++){const pulse=IH43.ease(((time*.7+i*.28)%2)/.35),xx=x-251+(i%2?100:0),yy=y-83+i*68;ih43Box(c,xx+(1-pulse)*30,yy,400,54,i%2?p.accent:p.ink,12);ih43Text(c,lang.messages[i],xx+17+(1-pulse)*30,yy+33,18,p.paper,550);}
}
function ih43Arrangement(c,x,y,p,lang,time){
  ih43NetworkCard(c,x,y,590,325,p,lang.arrangement,p.secondary);
  for(let i=0;i<3;i++){const xx=x-245,yy=y-75+i*63;ih43Text(c,lang.points[i],xx,yy+16,19,p.ink,650);c.strokeStyle=p.accent;c.lineWidth=3;c.beginPath();c.moveTo(xx+440,yy+5);c.lineTo(xx+448,yy+13);c.lineTo(xx+463,yy-5);c.stroke();}
  const w=110+Math.sin(time*3)*16;ih43Box(c,x-245,y+119,w,5,p.accent,2);
}
function ih43Scene(c,l,p,phase,s,time){
  const lang=s.english?IH43_FILM.en:IH43_FILM.pl,shot=phase.shot,prev=IH43_FILM.shots[(phase.index-1+IH43_FILM.shots.length)%IH43_FILM.shots.length];
  const cam=shot.camera||[0,0,1],before=prev.camera||cam,turn=IH43.ease(phase.local/.95),flatten=IH43.mix(["zoom","final"].includes(prev.kind)?.05:1,["zoom","final"].includes(shot.kind)?.05:1,turn),cx=IH43.mix(before[0],cam[0],turn),cy=IH43.mix(before[1],cam[1],turn)*flatten,zoom=IH43.mix(before[2],cam[2],turn);
  const scale=(l.mobile?Math.min(l.cw/650,l.ch/620):Math.min(l.cw/940,l.ch/620))*zoom;
  const stageY=l.y+l.ch*.73;
  c.save();c.translate(l.w/2,stageY);c.scale(scale,scale);c.rotate(s.reduced?0:Math.sin(time*.7)*.012+(1-turn)*.035);c.translate(-cx,-cy);
  const nodes=[[0,0],[1050,-150*flatten],[2100,110*flatten],[3150,-90*flatten]];
  c.strokeStyle=p.secondary;c.lineWidth=3;c.setLineDash([9,12]);c.lineDashOffset=-time*75;
  for(let i=0;i<3;i++){const a=nodes[i],b=nodes[i+1];c.beginPath();c.moveTo(a[0]+295,a[1]);c.bezierCurveTo(a[0]+520,a[1],b[0]-520,b[1],b[0]-295,b[1]);c.stroke();}
  c.setLineDash([]);
  for(let i=0;i<3;i++){const t=(time*.28+i*.31)%1,a=nodes[i],b=nodes[i+1],x=IH43.mix(a[0]+315,b[0]-315,t),y=IH43.mix(a[1],b[1],t);ih43Tag(c,lang.floating[i],x,y,{fill:p.secondary,ink:p.ink},-.03,1);}
  ih43Portfolio(c,...nodes[0],p,lang.ui,time);ih43Requests(c,...nodes[1],p,lang.ui,time);ih43Messages(c,...nodes[2],p,lang.ui,time);ih43Arrangement(c,...nodes[3],p,lang.ui,time);c.restore();
  const final=shot.kind==="final",height=l.ch*(final?.52:.40),words=lang.frames[phase.index];
  c.save();if(shot.kind==="zoom"){c.globalAlpha=.9;}
  ih43Lines(c,words,{x:l.pad,y:l.y-7,w:l.cw,h:height},{color:shot.bg==="paper"?p.ink:p.paper,progress:IH43.clamp(phase.local/.50),mode:phase.index%2?"letters":"side",max:l.mobile?66:138});c.restore();
  if(final){const yy=l.y+l.ch*.96;ih43Text(c,lang.subtitle,l.pad,yy,l.mobile?11:15,shot.bg==="paper"?p.ink:p.paper,550);}
}

function ih43Reduced(){
  return typeof window!=="undefined"&&!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/* Każdy wariant jest alternatywą całego pliku App.jsx. Trasy, płatności i dalsza strona pozostają w części P40. */
export function IdeaHireCinematicHero(){
  const site=useSitePreferences();
  const english=site.language==="en",classic=site.template==="classic";
  const copy=english?IH43_FILM.en:IH43_FILM.pl;
  const [reduced,setReduced]=useState(ih43Reduced);
  const [paused,setPaused]=useState(false);
  const [sound,setSound]=useState(false);
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);
  const [scene,setScene]=useState(()=>ih43Reduced()?IH43_FILM.shots.length-1:0);
  const rootRef=useRef(null),canvasRef=useRef(null),engineRef=useRef(null),alive=useRef(false),soundBusy=useRef(false);
  const motion=useRef({time:0,paused:false,reduced,english,classic,offer:IDEA_HIRE_PUBLIC_OFFER,ready:false,sound:false,pointerX:0,pointerY:0,hover:-1});
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
    if(reduced){setSound(false);engineRef.current?.mute();}
    engineRef.current?.wake();
  },[reduced,english,classic,paused]);
  useEffect(()=>{
    alive.current=true;
    const engine=ih43Start(canvasRef.current,rootRef.current,motion,update=>{
      if(!alive.current)return;
      if(update.ready)setReady(true);
      if(update.failed)setFailed(true);
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
  function hover(index){motion.current.hover=index;engineRef.current?.wake();}
  function move(event){
    if(reduced||paused||failed||event.pointerType!=="mouse")return;
    const rect=event.currentTarget.getBoundingClientRect();
    motion.current.pointerX=IH43.clamp((event.clientX-rect.left)/rect.width*2-1,-1,1);
    motion.current.pointerY=IH43.clamp((event.clientY-rect.top)/rect.height*2-1,-1,1);
  }
  function leave(){motion.current.pointerX=0;motion.current.pointerY=0;hover(-1);}
  return <section ref={rootRef} className="ih43-film" data-cinematic-version={"P43-"+IH43_FILM.key}
    data-ready={ready} data-failed={failed} data-classic={classic} data-no-translate="true"
    aria-label={labels.region} onPointerMove={move} onPointerLeave={leave}>
    <style>{IH43_STYLES}</style>
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


