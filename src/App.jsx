/* IdeaHire | P45 | Turkus / Czerń i biel | Pełny plik: src/App.jsx */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { IDEA_HIRE_PUBLIC_OFFER, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences, translateUiText } from "./Preferences";

/* P45 — autorski, przestrzenny monogram iH. Geometria, światło i ruch w WebGL. */
const IH45_VERTEX = String.raw`
precision highp float;
attribute vec2 aSurface;
uniform float uTime, uAssemble, uBurst, uKind, uAspect, uScale, uTurn, uScroll;
uniform vec2 uPointer;
varying vec3 vNormal, vPosition;
varying vec2 vSurface;
mat2 spin(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
vec3 point(vec2 uv){
  float s=uv.x, a=uv.y, k=uKind;
  float horizontal=step(2.5,k)* (1.0-step(3.5,k));
  float dotPart=step(3.5,k);
  float length=mix(mix(1.36,1.12,1.0-step(.5,k)),.84,horizontal);
  length=mix(length,.19,dotPart);
  float taper=smoothstep(0.0,.035,s)*smoothstep(0.0,.035,1.0-s);
  float ca=cos(a),sa=sin(a);
  float w=mix(.29,.25,horizontal),thick=.07;
  w=mix(w,.245,dotPart);
  float across=sign(ca)*pow(abs(ca),.38)*w*taper;
  float depth=sign(sa)*pow(abs(sa),.5)*thick*taper;
  float along=(s*2.0-1.0)*length;
  float fold=(1.0-uAssemble);
  float twist=sin(s*6.28318+uTime*.62+k*.7)*(.25+fold*1.8)+fold*(k-1.5)*.7;
  twist*=1.0-dotPart;
  vec2 crossSection=spin(twist)*vec2(across,depth);
  vec3 p=mix(vec3(crossSection.x,along,crossSection.y),vec3(along,crossSection.x,crossSection.y),horizontal);
  p.z+=sin(s*6.28318+uTime*.5+k)*(.12+fold*.7)*(1.0-dotPart);
  p.x+=sin(s*3.14159)*fold*.34;
  p.xy=spin(fold*(k-1.2)*.95+sin(uTime*.32+k)*.02)*p.xy;
  vec3 centre=k<.5?vec3(-1.62,-.23,.12):k<1.5?vec3(-.34,0.0,0.0):k<2.5?vec3(1.12,0.0,.05):k<3.5?vec3(.39,0.0,.14):vec3(-1.62,1.30,.12);
  centre.x+=(k-1.7)*(fold*.8+uBurst*.36);
  centre.y+=sin(k*2.1+uTime*.5)*(fold*.5+uBurst*.22);
  centre.z+=cos(k*1.7)*(fold*.9+uBurst*.28);
  p+=centre;
  float turn=-.38+uTurn+sin(uTime*.21)*.12+uPointer.x*.34;
  p.xz=spin(turn)*p.xz;
  p.yz=spin(-.12+sin(uTime*.16)*.05+uPointer.y*.15)*p.yz;
  p.xy=spin(-.12+sin(uTime*.2)*.035)*p.xy;
  p.y+=sin(uTime*.45)*.075-uScroll*.17;
  return p;
}
void main(){
  vec2 uv=aSurface;
  vec3 p=point(uv);
  vec3 du=point(vec2(min(.9999,uv.x+.0006),uv.y))-point(vec2(max(.0001,uv.x-.0006),uv.y));
  vec3 dv=point(vec2(uv.x,uv.y+.0006))-point(vec2(uv.x,uv.y-.0006));
  vNormal=normalize(cross(dv,du));vPosition=p;vSurface=uv;
  float camera=6.8, perspective=camera/(camera-p.z);
  gl_Position=vec4(p.x*uScale/uAspect*perspective,p.y*uScale*perspective,(camera-p.z)/20.0,1.0);
}`;
const IH45_FRAGMENT = String.raw`
precision highp float;
uniform vec3 uColor;
uniform float uTime,uDark,uMono,uKind;
varying vec3 vNormal,vPosition;
varying vec2 vSurface;
vec3 environment(vec3 r){
  vec3 e=vec3(.10,.14,.15)+vec3(.16)*max(r.y,0.0);
  float window1=pow(max(0.0,dot(r,normalize(vec3(-.75,1.1,.9)))),16.0);
  float window2=pow(max(0.0,dot(r,normalize(vec3(1.4,.5,1.1)))),38.0);
  float strip=pow(max(0.0,dot(r,normalize(vec3(.3,1.1,-.3)))),60.0);
  e+=vec3(1.0,.98,.92)*window1*2.7+vec3(.7,.94,1.0)*window2*2.0+vec3(1.0)*strip*2.0;
  return e;
}
void main(){
  vec3 n=normalize(vNormal);
  vec3 eye=normalize(vec3(0.0,0.0,6.8)-vPosition);
  if(dot(n,eye)<0.0)n=-n;
  vec3 key=normalize(vec3(-3.0,4.5,5.0)-vPosition);
  vec3 fill=normalize(vec3(4.0,1.6,3.0)-vPosition);
  float diffuse=.35+.65*max(0.0,dot(n,key))+.18*max(0.0,dot(n,fill));
  float fresnel=pow(1.0-max(0.0,dot(n,eye)),4.0);
  float fibre=sin(vSurface.x*620.0+sin(vSurface.y*9.0)*.8)*.003;
  vec3 base=mix(uColor,vec3(.76,.84,.84),.09);
  if(uMono>.5)base=mix(vec3(.43,.45,.46),vec3(.78,.79,.78),uDark);
  float alternating=step(.5,mod(uKind,2.0));
  base=mix(base,vec3(.86,.92,.91),alternating*.50);
  vec3 env=environment(reflect(-eye,n));
  float gloss=pow(max(0.0,dot(n,normalize(key+eye))),55.0);
  vec3 result=base*(diffuse+fibre)+env*(.12+fresnel*.30)+vec3(gloss*.32);
  float occlusion=.88+.12*smoothstep(-.16,.55,abs(vPosition.y));result*=occlusion;
  result=result/(result+vec3(.52));result=pow(result,vec3(.78));
  gl_FragColor=vec4(result,1.0);
}`;

function ih45CreateRenderer(canvas) {
  const gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:"low-power"});
  if(!gl)return null;
  const resources=[];
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(message||"Shader compilation");}resources.push(["shader",s]);return s;}
  let program;
  try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,IH45_VERTEX));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,IH45_FRAGMENT));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));}
  catch{if(program)gl.deleteProgram(program);resources.forEach(([,s])=>gl.deleteShader(s));return null;}
  const surfaces=[],indices=[],rows=80,columns=24;
  for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++)surfaces.push(i/rows,j/columns*Math.PI*2);
  for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);}
  const vertices=gl.createBuffer(),elements=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(surfaces),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elements);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  const uniform={};for(const name of ["uTime","uAssemble","uBurst","uKind","uAspect","uScale","uTurn","uScroll","uPointer","uColor","uDark","uMono"])uniform[name]=gl.getUniformLocation(program,name);
  gl.useProgram(program);const attr=gl.getAttribLocation(program,"aSurface");gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
  return {
    draw(width,height,s){
      if(gl.isContextLost())return;
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,width,height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
      gl.uniform1f(uniform.uTime,s.time);gl.uniform1f(uniform.uAssemble,s.assemble);gl.uniform1f(uniform.uBurst,s.burst);gl.uniform1f(uniform.uAspect,width/height);gl.uniform1f(uniform.uScale,s.scale);gl.uniform1f(uniform.uTurn,s.turn);gl.uniform1f(uniform.uScroll,s.scroll);gl.uniform2f(uniform.uPointer,s.x,s.y);gl.uniform3fv(uniform.uColor,s.color);gl.uniform1f(uniform.uDark,s.dark?1:0);gl.uniform1f(uniform.uMono,s.mono?1:0);
      for(let kind=0;kind<5;kind++){gl.uniform1f(uniform.uKind,kind);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);}
    },
    destroy(){gl.deleteBuffer(vertices);gl.deleteBuffer(elements);gl.deleteProgram(program);resources.forEach(([,s])=>gl.deleteShader(s));}
  };
}

const IH45_DURATION=30;
function ih45Clamp(v,a=0,b=1){return Math.max(a,Math.min(b,v));}
function ih45Ease(v){const t=ih45Clamp(v);return t*t*(3-2*t);}
function ih45Pose(time,elapsed,intro,pointer,scroll,mono,dark){
  const t=intro?elapsed:IH45_DURATION+time%24;
  const assemble=intro?(.18+.82*ih45Ease(t/5)-.30*Math.sin(ih45Clamp((t-8)/9)*Math.PI)+.0):1;
  const burst=intro?Math.pow(Math.sin(ih45Clamp((t-13)/8)*Math.PI),2):.06+.05*Math.sin(time*.35);
  const turn=intro?Math.sin(ih45Clamp(t/23)*Math.PI*2)*.65+Math.sin(t*1.12)*.32*(1-ih45Ease((t-22)/5)):Math.sin(time*.14)*.23;
  return {time,assemble,burst,turn,x:pointer.x,y:pointer.y,scroll:ih45Clamp(scroll/900),mono,dark,color:mono?[.50,.53,.53]:[.04,.68,.71],scale:.50};
}
function ih45StartScene(canvas,root,state,report){
  let engine=null,frame=0,last=0,previous=-1,previousTicket=-1,previousIntro=null,width=0,height=0,dirty=true,visible=true,dead=false,observer=null,resize=null,drawAt=0;
  const clean=[],listen=(target,event,fn,opts)=>{target.addEventListener(event,fn,opts);clean.push(()=>target.removeEventListener(event,fn,opts));};
  function create(){engine?.destroy();try{engine=ih45CreateRenderer(canvas);}catch{engine=null;}root.dataset.webgl=engine?"ready":"fallback";dirty=true;}
  function render(now){
    frame=0;if(dead||document.hidden||!visible)return;
    const s=state.current;
    if(!s.reduced&&!s.paused&&drawAt&&now-drawAt<(window.innerWidth<821?33:25)-1){frame=requestAnimationFrame(render);return;}
    const delta=last?Math.min(.065,(now-last)/1000):0;last=now;drawAt=now;
    if(!s.paused&&!s.reduced){s.time+=delta;if(s.intro)s.elapsed+=delta;s.x+=(s.targetX-s.x)*.10;s.y+=(s.targetY-s.y)*.10;}
    if(s.elapsed>=IH45_DURATION||s.reduced){s.intro=false;s.elapsed=IH45_DURATION;}
    const act=s.intro?Math.min(4,Math.floor(s.elapsed/6)):4;
    const ticket=s.reduced?3:s.intro?Math.min(3,act):Math.floor((Math.max(0,s.time-IH45_DURATION)+21)/7)%4;
    if(act!==previous||ticket!==previousTicket||previousIntro!==s.intro){previous=act;previousTicket=ticket;previousIntro=s.intro;report({act,ticket,intro:s.intro});}
    root.style.setProperty("--scene-progress",String(Math.min(1,s.elapsed/IH45_DURATION)));
    root.style.setProperty("--scene-time",String(s.time));
    if(dirty){const box=canvas.getBoundingClientRect();let ratio=Math.min(window.devicePixelRatio||1,1.6);const budget=box.width<750?470000:1100000;ratio=Math.min(ratio,Math.sqrt(budget/Math.max(1,box.width*box.height)));width=Math.max(1,Math.round(box.width*ratio));height=Math.max(1,Math.round(box.height*ratio));dirty=false;}
    const pose=ih45Pose(s.reduced?0:s.time,s.elapsed,s.intro,s,s.scroll,s.mono,s.dark||act===1||act===3);
    pose.scale=width/height<.9?.42:.50;
    try{engine?.draw(width,height,pose);}catch{engine?.destroy();engine=null;root.dataset.webgl="fallback";}
    if(!s.paused&&!s.reduced)frame=requestAnimationFrame(render);
  }
  function wake(){if(!dead&&!document.hidden&&visible&&!frame){last=0;drawAt=0;frame=requestAnimationFrame(render);}}
  create();
  listen(root,"pointermove",e=>{if(e.pointerType!=="mouse"||state.current.reduced||state.current.paused)return;const box=root.getBoundingClientRect();state.current.targetX=ih45Clamp((e.clientX-box.left)/box.width*2-1,-1,1);state.current.targetY=ih45Clamp((e.clientY-box.top)/box.height*2-1,-1,1);},{passive:true});
  listen(root,"pointerleave",()=>{state.current.targetX=0;state.current.targetY=0;});
  listen(window,"scroll",()=>{state.current.scroll=window.scrollY;},{passive:true});
  listen(window,"resize",()=>{dirty=true;wake();},{passive:true});
  listen(document,"visibilitychange",()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else wake();});
  listen(canvas,"webglcontextlost",e=>{e.preventDefault();engine=null;root.dataset.webgl="fallback";});
  listen(canvas,"webglcontextrestored",()=>{create();wake();});
  if(typeof ResizeObserver!=="undefined"){resize=new ResizeObserver(()=>{dirty=true;wake();});resize.observe(canvas);}
  if(typeof IntersectionObserver!=="undefined"){observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}},{rootMargin:"80px"});observer.observe(root);}
  wake();return {wake,seek(act){state.current.elapsed=act*6;state.current.intro=act<4;previous=-1;wake();},replay(){Object.assign(state.current,{elapsed:0,time:0,intro:true,paused:false});previous=-1;wake();},finish(){state.current.elapsed=IH45_DURATION;state.current.intro=false;previous=-1;wake();},destroy(){dead=true;cancelAnimationFrame(frame);clean.forEach(fn=>fn());observer?.disconnect();resize?.disconnect();engine?.destroy();}};
}
function ih45Reduced(){return typeof window!=="undefined"&&!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;}
function useIH45Scene(rootRef,canvasRef,mono,dark){
  const [reduced,setReduced]=useState(ih45Reduced),[paused,setPaused]=useState(false),[intro,setIntro]=useState(()=>!ih45Reduced()),[act,setAct]=useState(()=>ih45Reduced()?4:0),[ticket,setTicket]=useState(()=>ih45Reduced()?3:0),[cycle,setCycle]=useState(0);
  const engine=useRef(null),state=useRef({time:0,elapsed:0,intro:!reduced,reduced,paused:false,mono,dark,x:0,y:0,targetX:0,targetY:0,scroll:0});
  useLayoutEffect(()=>{Object.assign(state.current,{mono,dark,reduced,paused});engine.current?.wake();},[mono,dark,reduced,paused]);
  useEffect(()=>{const media=window.matchMedia?.("(prefers-reduced-motion: reduce)");if(!media)return;const change=()=>setReduced(media.matches);media.addEventListener?.("change",change);return()=>media.removeEventListener?.("change",change);},[]);
  useEffect(()=>{let alive=true;engine.current=ih45StartScene(canvasRef.current,rootRef.current,state,next=>{if(alive){setAct(next.act);setTicket(next.ticket);setIntro(next.intro);}});return()=>{alive=false;engine.current?.destroy();engine.current=null;};},[]);
  useLayoutEffect(()=>{document.body.classList.add("ih45-page");return()=>document.body.classList.remove("ih45-page");},[]);
  return {act,ticket,intro,paused,reduced,cycle,state,replay(){if(reduced)return;setCycle(n=>n+1);setPaused(false);setIntro(true);setAct(0);engine.current?.replay();},finish(){engine.current?.finish();},seek(next){if(reduced)return;engine.current?.seek(next);},toggle(){state.current.paused=!state.current.paused;setPaused(state.current.paused);engine.current?.wake();}};
}

const IH45_COPY={
  pl:{menu:"Menu",close:"Zamknij menu",how:"Jak to działa",categories:"Kategorie",fee:"Prowizja",account:"Moje konto",login:"Zaloguj się",register:"Dołącz",logout:"Wyloguj się",notices:"Powiadomienia",find:"Znajdź wykonawcę",work:"Znajdź zlecenie",skip:"Pomiń wejście",replay:"Powtórz animację",pause:"Zatrzymaj animacje",play:"Wznów animacje",hero:"Ludzie do Twoich pomysłów.",intro:[ ["Masz","pomysł."],["Ktoś","potrafi."],["Złapcie","kontakt."],["Działajcie","razem."],["Masz pomysł.","Daj mu życie."] ],chapters:["Pomysł","Umiejętności","Rozmowa","Współpraca"],subtitle:"Strona, identyfikacja, film? Znajdź osobę, z którą zrobisz następny krok.",sample:"Przykładowy projekt",all:"Wszystkie zlecenia",go:"Przejrzyj zlecenia",latest:"Do zrobienia",examples:"Przykładowe zakresy",jobsTitle:"Ktoś właśnie szuka\nTwoich umiejętności.",categoriesTitle:"Zacznij od\nswojej dziedziny.",categoryLead:"Wybierz kierunek. Dalej są konkretne specjalizacje.",methodTitle:"Od pierwszej rozmowy\ndo konkretów.",method:[["Opisz, co chcesz zrobić.","Zakres, termin i oczekiwany rezultat. Kilka konkretów ułatwi znalezienie właściwej osoby."],["Sprawdź, z kim pracujesz.","Zobacz profil i portfolio. Zapytaj o doświadczenie przy podobnych projektach."],["Ustalcie warunki.","Porozmawiajcie o cenie, przekazaniu pracy i poprawkach. Zapiszcie ustalenia przed rozpoczęciem."]],closing:["Dobry moment,","żeby zacząć."],summary:"Miejsce spotkania pomysłu z wykonaniem.",legal:"Dokumenty i pomoc",help:"Pomoc",terms:"Regulamin",privacy:"Prywatność",illegal:"Zgłoś nielegalną treść",light:"Tryb jasny",dark:"Tryb ciemny",mono:"Czerń i biel",turquoise:"Turkus",theme:"Szablon strony",language:"Język",more:"Więcej",noOffers:"Przykład — to nie jest aktywne ogłoszenie."},
  en:{menu:"Menu",close:"Close menu",how:"How it works",categories:"Categories",fee:"Service fee",account:"My account",login:"Sign in",register:"Join",logout:"Sign out",notices:"Notifications",find:"Find a professional",work:"Find a project",skip:"Skip the entrance",replay:"Replay the animation",pause:"Pause animations",play:"Resume animations",hero:"People for your ideas.",intro:[["You have","an idea."],["Someone has","the skills."],["Start a","conversation."],["Make it","together."],["Have an idea?","Bring it to life."]],chapters:["Idea","Skills","Conversation","Collaboration"],subtitle:"A website, identity or film? Find the person for your next step.",sample:"Illustrative project",all:"All projects",go:"Browse projects",latest:"Work to do",examples:"Illustrative briefs",jobsTitle:"Someone is looking\nfor your skills.",categoriesTitle:"Start with\nyour field.",categoryLead:"Choose a field, then explore the specialisms.",methodTitle:"From the first conversation\nto the details.",method:[["Say what you need.","The scope, deadline and expected result. A few clear details help you find the right person."],["Get to know the professional.","Explore their profile and portfolio. Ask about experience with similar projects."],["Agree on the details.","Discuss the price, delivery and revisions. Record your agreement before you begin."]],closing:["A good time","to get started."],summary:"Where an idea meets the skills to make it happen.",legal:"Documents and help",help:"Help",terms:"Terms",privacy:"Privacy",illegal:"Report illegal content",light:"Light mode",dark:"Dark mode",mono:"Black and white",turquoise:"Turquoise",theme:"Site template",language:"Language",more:"More",noOffers:"Illustrative scope — not an active listing."}
};
function IH45Arrow({back=false}){return <svg viewBox="0 0 24 24" aria-hidden="true" style={back?{transform:"rotate(180deg)"}:undefined}><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>;}
function IH45Mark(){return <span className="ih45-mark" aria-hidden="true"><i/><i/><i/><i/></span>;}
function IH45Burger({open=false}){return <span className="ih45-burger-lines" data-open={open} aria-hidden="true"><i/><i/><i/></span>;}
function IH45Brand(){return <Link to="/" className="ih45-brand" aria-label="IdeaHire"><IH45Mark/><span>IdeaHire</span></Link>;}
function IH45Motion({stage,copy}){return <div className="ih45-motion" role="group" aria-label={copy.menu}>
  <button type="button" onClick={stage.intro?stage.finish:stage.replay} disabled={stage.reduced}>{stage.intro?copy.skip:copy.replay}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={stage.intro?"m9 6 6 6-6 6M18 6v12":"M5 8a8 8 0 1 1-1 8M5 3v5h5"} fill="none" stroke="currentColor" strokeWidth="1.6"/></svg></button>
  <button type="button" onClick={stage.toggle} disabled={stage.reduced} aria-pressed={stage.paused||stage.reduced} aria-label={stage.paused?copy.play:copy.pause}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={stage.paused?"m8 5 11 7-11 7Z":"M8 5v14M16 5v14"} fill="none" stroke="currentColor" strokeWidth="1.6"/></svg></button>
</div>;}
function IH45Fallback(){return <svg className="ih45-fallback" viewBox="0 0 600 470" aria-hidden="true"><defs><linearGradient id="ih45-metal" x1="0" y1="0" x2="1" y2=".7"><stop stopColor="var(--ih45-sculpt-light)"/><stop offset=".28" stopColor="var(--ih45-sculpt)"/><stop offset=".48" stopColor="var(--ih45-sculpt-light)"/><stop offset="1" stopColor="var(--ih45-sculpt)"/></linearGradient></defs><g transform="translate(70 30) rotate(-9 230 200) skewY(5)" fill="url(#ih45-metal)" stroke="var(--ih45-sculpt)"><rect x="40" y="110" width="56" height="235" rx="17"/><rect x="40" y="40" width="56" height="48" rx="12"/><rect x="185" y="40" width="60" height="305" rx="18"/><rect x="360" y="40" width="60" height="305" rx="18"/><path d="M210 170h180v55H210z"/></g></svg>;}
function IH45Ticket({act,english}){const content=english?[["THE BRIEF","A new website.","Scope · timing · result"],["THE PORTFOLIO","A good match.","Web / design / motion"],["THE CONVERSATION","Shall we talk?","Let’s agree on the details."],["THE AGREEMENT","Ready to begin.","Scope and delivery agreed."]]:[["POMYSŁ","Nowa strona.","Zakres · termin · rezultat"],["PORTFOLIO","To może być to.","Web / grafika / animacja"],["ROZMOWA","Porozmawiamy?","Ustalmy szczegóły."],["USTALENIA","Można zaczynać.","Zakres i termin ustalone."]];const index=Math.min(3,act);return <div className="ih45-ticket" key={index} aria-hidden="true"><div><IH45Mark/><small>{content[index][0]}</small><span>0{index+1}</span></div><strong>{content[index][1]}</strong><p>{content[index][2]}</p><span className="ih45-ticket-rule"/><small>{english?"Illustrative project":"Przykładowy projekt"}</small></div>;}
function IH45Hero({stage,sceneRef,canvasRef,english,copy}){const words=copy.intro[Math.min(4,stage.act)];return <section ref={sceneRef} className="ih45-hero" data-act={stage.act} data-intro={stage.intro} data-cycle={stage.cycle} aria-labelledby="ih45-hero-title" data-no-translate="true">
  <div className="ih45-hero-meta"><span><IH45Mark/>{copy.hero}</span><IH45Motion stage={stage} copy={copy}/></div>
  <div className="ih45-stage">
    <div className="ih45-scene" aria-hidden="true"><IH45Fallback/><canvas ref={canvasRef} className="ih45-canvas"/><span className="ih45-ground"/></div>
    <div className="ih45-hero-heading"><h1 id="ih45-hero-title" className="ih45-sr-only">{copy.intro[4].join(" ")}</h1><div className="ih45-kinetic-title" aria-hidden="true" key={stage.act+"-"+stage.cycle}>{words.map((word,i)=><span key={i} style={{"--word":i}}><b>{word}</b></span>)}</div></div>
    <div className="ih45-hero-copy"><p>{copy.subtitle}</p><div className="ih45-hero-actions"><Link className="ih45-button ih45-solid" to="/find-talent">{copy.find}<IH45Arrow/></Link><Link className="ih45-button" to="/jobs">{copy.work}<IH45Arrow/></Link></div></div>
    <div className="ih45-ticket-wrap"><IH45Ticket act={stage.ticket} english={english}/></div>
    <span className="ih45-stage-signature" aria-hidden="true">IDEA / HIRE</span>
  </div>
  <div className="ih45-chapters"><span className="ih45-progress" aria-hidden="true"/>{copy.chapters.map((title,i)=><button type="button" key={title} onClick={()=>stage.seek(i)} disabled={stage.reduced} aria-current={Math.min(stage.act,3)===i?"step":undefined}><span>0{i+1}</span>{title}<IH45Mark/></button>)}</div>
</section>;}
function IH45FeeStrip({english}){const o=IDEA_HIRE_PUBLIC_OFFER,number=n=>n.toLocaleString(english?"en-GB":"pl-PL");return <a className="ih45-fee-strip" href="#commission" data-no-translate="true"><span><strong>{number(o.percent)}%</strong> {english?"IdeaHire fee":"prowizji IdeaHire"}</span><span>{english?"min.":"min."} {number(o.minimum)} {english?"PLN":"zł"} <i/> {english?"max.":"maks."} {number(o.maximum)} {english?"PLN":"zł"}</span><span className="ih45-fee-strip-last">{english?"The professional gets the project amount.":"Wykonawca otrzymuje kwotę zlecenia."}<IH45Arrow/></span></a>;}
function IH45ThemeButtons({site,copy}){return <div className="ih45-template-switch" role="group" aria-label={copy.theme}><button type="button" aria-pressed={site.template==="classic"} onClick={()=>site.setTemplate("classic")}><i className="ih45-swatch-mono"/>{copy.mono}</button><button type="button" aria-pressed={site.template!=="classic"} onClick={()=>site.setTemplate("current")}><i className="ih45-swatch-turquoise"/>{copy.turquoise}</button></div>;}
function IH45Menu({open,onClose,rootRef,triggerRef,site,copy,session,hasNotifications,logout}){
  const panel=useRef(null);
  useLayoutEffect(()=>{if(!open)return;const root=rootRef.current,oldOverflow=document.body.style.overflow,wasInert=root?.hasAttribute("inert"),returnTo=triggerRef.current;document.body.style.overflow="hidden";root?.setAttribute("inert","");const dialog=panel.current;dialog?.querySelector("button,a")?.focus({preventScroll:true});
    const key=e=>{if(e.key==="Escape"){e.preventDefault();onClose();return;}if(e.key!=="Tab")return;const list=[...(dialog?.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]')||[])].filter(el=>!el.hidden);if(!list.length)return;const first=list[0],last=list[list.length-1];if(e.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};
    document.addEventListener("keydown",key);return()=>{document.body.style.overflow=oldOverflow;if(!wasInert)root?.removeAttribute("inert");document.removeEventListener("keydown",key);returnTo?.focus({preventScroll:true});};
  },[open]);
  if(!open||typeof document==="undefined")return null;
  const english=site.language==="en",links=[{href:"#how-it-works",name:copy.how},{href:"#categories",name:copy.categories},{to:"/jobs",name:copy.work},{to:"/find-talent",name:copy.find},{to:session?"/account":"/register",name:session?copy.account:copy.register}];
  return createPortal(<div ref={panel} id="ih45-menu-dialog" className="ih45-menu" role="dialog" aria-modal="true" aria-labelledby="ih45-menu-title" data-no-translate="true"><div className="ih45-menu-top"><IH45Brand/><button className="ih45-close" onClick={onClose} type="button" aria-label={copy.close}><IH45Burger open/></button></div><div className="ih45-menu-body"><div className="ih45-menu-navigation"><span className="ih45-eyebrow" id="ih45-menu-title">{copy.menu}</span><nav onClick={e=>{if(e.target.closest("a"))onClose();}}>{links.map((item,i)=>{const Item=item.to?Link:"a";return <Item key={i} {...(item.to?{to:item.to}:{href:item.href})} style={{"--index":i}}><small>0{i+1}</small><span>{item.name}</span><IH45Arrow/></Item>;})}</nav></div><div className="ih45-menu-settings"><span className="ih45-eyebrow">{copy.theme}</span><IH45ThemeButtons site={site} copy={copy}/><div className="ih45-menu-options"><button type="button" onClick={()=>site.setTheme(site.theme==="dark"?"light":"dark")}>{site.theme==="dark"?copy.light:copy.dark}<span aria-hidden="true">◐</span></button><button type="button" onClick={()=>site.setLanguage(english?"pl":"en")}>{english?"Polski":"English"}<span aria-hidden="true">{english?"PL":"EN"}</span></button></div>{session?<><Link className="ih45-menu-notices" to="/notifications" onClick={onClose}>{copy.notices}{hasNotifications&&<i/>}<IH45Arrow/></Link><button className="ih45-menu-logout" onClick={()=>{onClose();logout();}} type="button">{copy.logout}<IH45Arrow/></button></>:<Link className="ih45-menu-notices" to="/login" onClick={onClose}>{copy.login}<IH45Arrow/></Link>}<p>{copy.summary}</p><IH45Mark/></div></div></div>,document.body);
}
const IH45_CATEGORY_EN={Programowanie:"Web, apps and IT","Grafika i design":"Graphics, UX and 3D",Marketing:"Marketing and sales",Copywriting:"Copy and translation",Video:"Video, motion and audio",Fotografia:"Photography","AI i automatyzacje":"AI and automation","Dane, analizy i research":"Data and research","Biznes i e-commerce":"Business and e-commerce","Architektura, wnętrza i CAD":"Architecture and CAD"};
const IH45_CATEGORY_COPY={
  Programowanie:["Strona firmowa, sklep, aplikacja lub techniczne wsparcie.","Company websites, shops, apps and technical support."],
  "Grafika i design":["Identyfikacja, projekt interfejsu i grafika do publikacji.","Brand identities, interface design and graphics for publication."],
  Marketing:["Kampanie, komunikacja i promocja Twojej działalności.","Campaigns, communication and promotion for your business."],
  Copywriting:["Teksty na stronę, artykuły i tłumaczenia.","Website copy, articles and translations."],
  Video:["Montaż, animacja i dźwięk do Twojego materiału.","Editing, animation and sound for your content."],
  Fotografia:["Sesje zdjęciowe, retusz i zdjęcia produktów.","Photo shoots, retouching and product photography."],
  "AI i automatyzacje":["Automatyzacja zadań i połączenie narzędzi, z których korzystasz.","Task automation and connections between the tools you use."],
  "Dane, analizy i research":["Uporządkowanie danych, analiza i sprawdzenie informacji.","Data organisation, analysis and research."],
  "Biznes i e-commerce":["Wsparcie w prowadzeniu działalności i sklepu internetowego.","Support for your business and online shop."],
  "Architektura, wnętrza i CAD":["Projekty przestrzeni, wizualizacje i dokumentacja techniczna.","Space design, visualisations and technical drawings."]
};
function IH45Categories({groups,english,copy}){
  const [selection,setSelection]=useState(groups[0]?.value||"Programowanie"),buttons=useRef([]),selected=groups.find(x=>x.value===selection)||groups[0];
  const group=selected||{value:"Programowanie",label:"Strony, aplikacje i IT",subcategories:[]};
  const current=Math.max(0,groups.findIndex(x=>x.value===group.value)),label=english?IH45_CATEGORY_EN[group.value]||group.label:group.label;
  function key(e,index){if(!["ArrowDown","ArrowUp","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?groups.length-1:(index+(e.key==="ArrowDown"?1:groups.length-1))%groups.length;setSelection(groups[next].value);buttons.current[next]?.focus({preventScroll:true});}
  return <section className="ih45-section ih45-categories" id="categories" data-reveal data-no-translate="true"><div className="ih45-section-heading"><span className="ih45-eyebrow">01 / {copy.categories}</span><h2>{copy.categoriesTitle.split("\n").map(x=><span key={x}>{x}</span>)}</h2><p>{copy.categoryLead}</p></div><div className="ih45-category-workspace"><div className="ih45-category-tabs" role="tablist" aria-orientation="vertical" aria-label={copy.categories}>{groups.map((g,i)=><button ref={el=>buttons.current[i]=el} type="button" role="tab" key={g.value} id={"ih45-category-"+i} aria-controls="ih45-category-detail" aria-selected={g.value===group.value} tabIndex={g.value===group.value?0:-1} onKeyDown={e=>key(e,i)} onClick={()=>setSelection(g.value)}><small>{String(i+1).padStart(2,"0")}</small><span>{english?IH45_CATEGORY_EN[g.value]||g.label:g.label}</span><IH45Arrow/></button>)}</div><div className="ih45-category-detail" id="ih45-category-detail" role="tabpanel" tabIndex={0} aria-labelledby={"ih45-category-"+current} key={group.value}><div className="ih45-category-number" aria-hidden="true">{String(current+1).padStart(2,"0")}<IH45Mark/></div><h3>{label}</h3><p>{(IH45_CATEGORY_COPY[group.value]||["Znajdź projekt dla siebie.","Find your next project."])[english?1:0]}</p>{group.subcategories?.length>0&&<div className="ih45-specialisms">{group.subcategories.map(s=><Link key={s} to={"/jobs?"+new URLSearchParams({category:group.value,subcategory:s})}>{english?translateUiText(s):s}<span aria-hidden="true">↗</span></Link>)}</div>}<Link className="ih45-button ih45-solid" to={"/jobs?"+new URLSearchParams({category:group.value})}>{copy.go}<IH45Arrow/></Link></div></div></section>;
}
function ih45RealJob(job){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(job?.id||""));}
function IH45Jobs({jobs,english,copy}){const real=jobs.some(ih45RealJob);return <section className="ih45-section ih45-jobs" id="projects" data-reveal data-no-translate="true"><div className="ih45-section-heading"><span className="ih45-eyebrow">02 / {real?copy.latest:copy.examples}</span><h2>{copy.jobsTitle.split("\n").map(x=><span key={x}>{x}</span>)}</h2><Link className="ih45-text-link" to="/jobs">{copy.all}<IH45Arrow/></Link></div><div className="ih45-job-list">{jobs.slice(0,4).map((job,i)=>{const actual=ih45RealJob(job),title=!actual&&english?["A website for a new brand","A visual identity","Copy for a company website"][i%3]:job.title;return <Link className="ih45-job" key={job.id||i} to="/jobs" state={actual?{lucynaJobId:String(job.id),lucynaTitle:String(job.title)}:undefined}><small>{String(i+1).padStart(2,"0")}</small><div><span>{actual?(english?IH45_CATEGORY_EN[job.category]||job.category:getCategoryLabel(job.category)):copy.noOffers}</span><strong>{title}</strong></div><span className="ih45-job-price">{job.budget?Number(job.budget).toLocaleString(english?"en-GB":"pl-PL")+(english?" PLN":" zł"):"—"}</span><IH45Arrow/></Link>;})}</div></section>;}
function IH45How({english,copy}){const[active,setActive]=useState(0);return <section className="ih45-section ih45-how" id="how-it-works" data-reveal data-no-translate="true"><div className="ih45-section-heading"><span className="ih45-eyebrow">03 / {copy.how}</span><h2>{copy.methodTitle.split("\n").map(x=><span key={x}>{x}</span>)}</h2></div><div className="ih45-method-list">{copy.method.map(([title,text],i)=><article key={title} data-open={active===i}><h3><button type="button" onClick={()=>setActive(active===i?-1:i)} aria-expanded={active===i} aria-controls={"ih45-method-"+i}><small>0{i+1}</small><span>{title}</span><b aria-hidden="true">{active===i?"−":"+"}</b></button></h3><div className="ih45-method-content" id={"ih45-method-"+i} hidden={active!==i}><p>{text}</p><IH45Mark/></div></article>)}</div></section>;}
function ih45Fee(amount){const o=IDEA_HIRE_PUBLIC_OFFER;return Math.round(Math.max(o.minimum,Math.min(o.maximum,amount*o.percent/100))*100)/100;}
function IH45Commission({english,copy}){const[value,setValue]=useState(2200),o=IDEA_HIRE_PUBLIC_OFFER,fee=ih45Fee(value),money=n=>Number(n).toLocaleString(english?"en-GB":"pl-PL",{style:"currency",currency:"PLN",maximumFractionDigits:2});return <section className="ih45-section ih45-commission" id="commission" data-reveal data-no-translate="true"><div className="ih45-section-heading"><span className="ih45-eyebrow">04 / {copy.fee}</span><h2>{english?<>Your project.<br/>Clear numbers.</>:<>Twój projekt.<br/>Jasne kwoty.</>}</h2><p>{english?"The client pays the IdeaHire fee. The professional gets the agreed project amount.":"Prowizję IdeaHire płaci zleceniodawca. Wykonawca otrzymuje ustaloną kwotę zlecenia."}</p></div><div className="ih45-fee-calculator"><div className="ih45-fee-rate"><strong>{o.percent.toLocaleString(english?"en-GB":"pl-PL")}<span>%</span></strong><span>{english?"minimum":"minimum"} {money(o.minimum)}<br/>{english?"maximum":"maksimum"} {money(o.maximum)}</span></div><label htmlFor="ih45-budget">{english?"Project value":"Wartość zlecenia"}<output htmlFor="ih45-budget">{money(value)}</output></label><input id="ih45-budget" type="range" min="100" max={o.orderLimit} step="100" value={value} onChange={e=>setValue(Number(e.target.value))}/><div className="ih45-fee-sum"><span>{english?"IdeaHire fee":"Prowizja IdeaHire"}<strong>{money(fee)}</strong></span><span>{english?"Client total":"Razem dla klienta"}<strong>{money(value+fee)}</strong></span></div><p>{english?"Illustrative calculation. The amount is confirmed before payment. Projects up to ":"Przykładowe obliczenie. Kwota jest potwierdzana przed płatnością. Zlecenia do "}{money(o.orderLimit)}.</p></div></section>;}
function useIH45Reveal(ref,reduced){useEffect(()=>{const items=[...(ref.current?.querySelectorAll("[data-reveal]")||[])];if(reduced||typeof IntersectionObserver==="undefined"){items.forEach(el=>el.dataset.reveal="seen");return;}const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.dataset.reveal="seen";observer.unobserve(e.target);}}),{threshold:.06});items.forEach(el=>{el.dataset.reveal="waiting";observer.observe(el);});return()=>{observer.disconnect();items.forEach(el=>el.dataset.reveal="seen");};},[reduced]);}

function useIdeaHireScrollHeader(headerRef, slotRef, enabled=true) {
  useLayoutEffect(() => {
    if (!enabled) return undefined;
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
  },[headerRef,slotRef,enabled]);
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

function App({ session, loading, categoryGroups = [] }) {

  const homeRootRef=useRef(null),sceneRef=useRef(null),canvasRef=useRef(null);
  const headerRef=useRef(null),headerSlotRef=useRef(null),mobileMenuButtonRef=useRef(null);
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const site=useSitePreferences(),english=site.language==="en",mono=site.template==="classic",dark=site.theme==="dark";
  const copy=IH45_COPY[english?"en":"pl"];
  const stage=useIH45Scene(sceneRef,canvasRef,mono,dark);
  useIH45Reveal(homeRootRef,stage.reduced);
  useIdeaHireScrollHeader(headerRef,headerSlotRef,true);

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

  return <>
    <div ref={homeRootRef} className="ih45-home" data-paused={stage.paused||stage.reduced} data-reduced={stage.reduced} data-palette={site.template}>
      <a className="ih45-skip-link" href="#ih45-content">{english?"Skip to content":"Przejdź do treści"}</a>
      <div ref={headerSlotRef} className="ih45-header-slot">
        <header ref={headerRef} className="ih45-header" data-mobile-menu-open={mobileMenuOpen}>
          <IH45FeeStrip english={english}/>
          <div className="ih45-navigation"><IH45Brand/>
            <nav className="ih45-desktop-nav" aria-label={copy.menu} data-no-translate="true"><a href="#how-it-works">{copy.how}</a><a href="#categories">{copy.categories}</a><a href="#commission">{copy.fee}</a></nav>
            <div className="ih45-header-actions" data-no-translate="true"><button className="ih45-quick-template" type="button" onClick={()=>site.setTemplate(mono?"current":"classic")} aria-label={mono?copy.turquoise:copy.mono}><i className={mono?"ih45-swatch-turquoise":"ih45-swatch-mono"}/><span>{mono?copy.turquoise:copy.mono}</span></button>
              {session?<Link to="/account" className="ih45-avatar" aria-label={copy.account}>{avatarUrl?<img src={avatarUrl} alt=""/>:<span>{userInitial}</span>}{hasNotifications&&<i/>}</Link>:<Link className="ih45-header-login" to="/login">{copy.login}</Link>}
              <button ref={mobileMenuButtonRef} className="ih45-burger" type="button" onClick={()=>setMobileMenuOpen(true)} aria-label={copy.menu} aria-expanded={mobileMenuOpen} aria-controls="ih45-menu-dialog"><span>{copy.menu}</span><IH45Burger/></button>
            </div>
          </div>
        </header>
      </div>
      <main id="ih45-content">
        <IH45Hero stage={stage} sceneRef={sceneRef} canvasRef={canvasRef} english={english} copy={copy}/>
        <section className="ih45-paths" aria-label={english?"Choose your next step":"Wybierz swój następny krok"} data-no-translate="true"><Link to="/find-talent"><IH45Mark/><span><small>{english?"I have a project":"Mam projekt"}</small><strong>{english?"I am looking for a professional.":"Szukam wykonawcy."}</strong></span><IH45Arrow/></Link><Link to="/jobs"><IH45Mark/><span><small>{english?"I have the skills":"Mam umiejętności"}</small><strong>{english?"I am looking for a project.":"Szukam zlecenia."}</strong></span><IH45Arrow/></Link></section>
        <IH45Categories groups={categoryGroups.length?categoryGroups:categories} english={english} copy={copy}/>
        <IH45Jobs jobs={recentJobs} english={english} copy={copy}/>
        <IH45How english={english} copy={copy}/>
        <IH45Commission english={english} copy={copy}/>
        <section className="ih45-section ih45-closing" data-reveal data-no-translate="true"><IH45Mark/><h2>{copy.closing.map(line=><span key={line}>{line}</span>)}</h2><Link className="ih45-button ih45-solid" to={session?"/account":"/register"}>{session?copy.account:copy.register}<IH45Arrow/></Link></section>
      </main>
      <footer className="ih45-footer" data-no-translate="true"><div><IH45Brand/><p>{copy.summary}</p></div><nav aria-label={copy.legal}><a href={helpCenterHref()} onClick={e=>{e.currentTarget.href=helpCenterHref();}} referrerPolicy="no-referrer">{copy.help}</a><Link to="/regulamin">{copy.terms}</Link><Link to="/polityka-prywatnosci">{copy.privacy}</Link><Link to="/polityka-cookies">Cookies</Link><a href="mailto:ideahireprywatnosc@gmail.com?subject=Zg%C5%82oszenie%20nielegalnej%20tre%C5%9Bci%20w%20IdeaHire">{copy.illegal}</a></nav><span>© {new Date().getFullYear()} IdeaHire</span></footer>
    </div>
    <IH45Menu open={mobileMenuOpen} onClose={()=>setMobileMenuOpen(false)} rootRef={homeRootRef} triggerRef={mobileMenuButtonRef} site={site} copy={copy} session={session} hasNotifications={hasNotifications} logout={handleLogout}/>
  </>;
}

export default App;
