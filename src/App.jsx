/* IdeaHire | P44 | Irys | Pełny plik: src/App.jsx | Przebudowa całego widoku głównego */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./App.css";
import { IDEA_HIRE_PUBLIC_OFFER, CommissionStory, HomeStepCard, IdeaHireLogo, MarketIcon, helpCenterHref } from "./MarketUI";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { useSitePreferences } from "./Preferences";

const IH44_CONFIG={
  "key": "03-Irys",
  "name": "Irys",
  "mode": "quadrants",
  "hue": 286,
  "duration": 20,
  "description": "Mleczny lila, śliwka i cytrynowy akcent. Cztery aktywne pola i menu dokowane przy krawędzi ekranu.",
  "descriptionEN": "Milky lilac, plum and a lemon accent. Four active fields with a menu docked at the edge of the screen.",
  "light": {
    "bg": "#f4eff4",
    "surface": "#fffcf5",
    "soft": "#e9dfec",
    "ink": "#42263f",
    "muted": "#795e75",
    "line": "#d7c2d5",
    "accent": "#79516f",
    "on": "#ffffff",
    "pop": "#e5e9ad"
  },
  "dark": {
    "bg": "#271b28",
    "surface": "#352537",
    "soft": "#473048",
    "ink": "#f9edf2",
    "muted": "#d2b4cb",
    "line": "#654660",
    "accent": "#ddb8d4",
    "on": "#392036",
    "pop": "#d8dea4"
  },
  "pl": {
    "final": [
      "Z czego",
      "zrobimy coś?"
    ],
    "subtitle": "Kliknij pole. Sprawdź zawartość. Wybierz swój następny krok.",
    "eyebrow": "Cztery wejścia. Własny kierunek.",
    "acts": [
      [
        "Jeden ekran.",
        "Wiele możliwości."
      ],
      [
        "Potrzebujesz?",
        "Poszukaj."
      ],
      [
        "Potrafisz?",
        "Pokaż."
      ],
      [
        "Klik.",
        "Twój ruch."
      ]
    ],
    "strip": "POTRZEBA / WARSZTAT / KONTAKT / SZCZEGÓŁY",
    "section": "Rozwiń właściwe pole.",
    "jobs": "Wybierz punkt zaczepienia.",
    "how": "Połącz potrzeby z umiejętnościami.",
    "end": [
      "Ten ruch",
      "należy do Ciebie."
    ],
    "themeDescription": "Mleczny lila, śliwka i cytrynowy akcent. Cztery aktywne pola i menu dokowane przy krawędzi ekranu."
  },
  "en": {
    "final": [
      "What shall",
      "we make of it?"
    ],
    "subtitle": "Click a field. See what is inside. Choose your next move.",
    "eyebrow": "Four entrances. Your own direction.",
    "acts": [
      [
        "One screen.",
        "Many possibilities."
      ],
      [
        "Need it?",
        "Look for it."
      ],
      [
        "Know how?",
        "Show it."
      ],
      [
        "Click.",
        "Your move."
      ]
    ],
    "strip": "NEED / CRAFT / CONTACT / DETAILS",
    "section": "Open the right field.",
    "jobs": "Find a starting point.",
    "how": "Connect needs with skills.",
    "end": [
      "This move",
      "is yours."
    ],
    "themeDescription": "Milky lilac, plum and a lemon accent. Four active fields with a menu docked at the edge of the screen."
  }
};

/* P44 — jedna scenografia pod całym dokumentem; stałe obszary kliknięć. */
function ih44Reduced(){return typeof window!=="undefined"&&!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;}
function ih44WorldFrame(c,w,h,time,s){
  const p=s.palette,px=s.x||0,py=s.y||0,scroll=s.scroll||0,energy=s.intro?1:.45,mode=IH44_CONFIG.mode;
  c.clearRect(0,0,w,h);c.save();
  if(mode==="lagoon"){
    for(let i=0;i<4;i++){
      const x=w*(.17+i*.25)+Math.sin(time*.32+i)*w*.13+px*32,y=h*(.16+i*.22)+Math.cos(time*.26+i)*h*.17+py*24-scroll*.035;
      const gradient=c.createRadialGradient(x,y,0,x,y,w*(.30+i*.035));gradient.addColorStop(0,(i%2?p.pop:p.accent)+(s.dark?"24":"19"));gradient.addColorStop(1,(i%2?p.pop:p.accent)+"00");c.fillStyle=gradient;c.fillRect(0,0,w,h);
    }
    c.lineWidth=1.1;c.strokeStyle=p.accent;c.globalAlpha=s.dark?.16:.10;
    for(let j=0;j<9;j++){c.beginPath();for(let i=0;i<=45;i++){const x=i*w/45,y=h*.62+j*13+Math.sin(i*.15+time*.62+j*.22)*62*energy+Math.cos(i*.10-time*.38)*36+px*10;if(!i)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();}
  }else if(mode==="editorial"){
    c.globalAlpha=.08;c.fillStyle=p.accent;const speed=s.intro?18:5,offset=(time*speed+scroll*.07)%170;
    for(let i=-2;i<12;i++){c.save();c.translate(w*.72+Math.sin(time*.3)*25+px*20,(i*170+offset));c.rotate(-.20);c.fillRect(-w*.15,-1,w*.65,2);c.restore();}
    c.globalAlpha=.15;c.strokeStyle=p.line;c.lineWidth=1;c.beginPath();c.moveTo(w*.38+px*7,0);c.lineTo(w*.38+px*7,h);c.moveTo(w*.76,0);c.lineTo(w*.76,h);c.stroke();
  }else{
    const x=w*(.5+px*.13),y=h*(.48+py*.12),r=Math.max(w,h)*.58;
    const g=c.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,p.pop+(s.dark?"1c":"51"));g.addColorStop(.48,p.accent+"0c");g.addColorStop(1,p.accent+"00");c.fillStyle=g;c.fillRect(0,0,w,h);
    c.globalAlpha=.13;c.strokeStyle=p.accent;c.lineWidth=1;const yy=h*.51+Math.sin(time*.4)*13;
    c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.moveTo(w*.5+Math.cos(time*.36)*12,0);c.lineTo(w*.5+Math.cos(time*.36)*12,h);c.stroke();
  }
  c.restore();
}
function ih44StartWorld(canvas,root,state,report){
  let frame=0,last=0,drawn=0,disposed=false,visible=true,width=0,height=0,ratio=1,context=null,dirty=true,previous=-1,resizeObserver=null;
  const listeners=[],listen=(node,type,fn,opts)=>{node.addEventListener(type,fn,opts);listeners.push(()=>node.removeEventListener(type,fn,opts));};
  const render=now=>{
    frame=0;if(disposed||document.hidden||!visible)return;
    const s=state.current,interval=width<821?1000/28:1000/40;
    if(!s.paused&&!s.reduced&&drawn&&now-drawn<interval-1){frame=requestAnimationFrame(render);return;}
    const dt=last?Math.min(.08,(now-last)/1000):0;last=now;drawn=now;
    if(dirty){width=window.innerWidth;height=window.innerHeight;ratio=Math.min(window.devicePixelRatio||1,1.4);const budget=width<821?600000:1350000,area=width*height*ratio*ratio;if(area>budget)ratio*=Math.sqrt(budget/area);canvas.width=Math.max(1,Math.floor(width*ratio));canvas.height=Math.max(1,Math.floor(height*ratio));dirty=false;}
    if(!s.paused&&!s.reduced){s.time+=dt;if(s.intro)s.elapsed+=dt;}
    if(s.reduced){s.intro=false;s.elapsed=IH44_CONFIG.duration;}
    if(s.elapsed>=IH44_CONFIG.duration)s.intro=false;
    const act=s.intro?Math.min(3,Math.floor(s.elapsed/(IH44_CONFIG.duration/4))):4;
    if(act!==previous){previous=act;root.style.setProperty("--ih44-progress",String(act/4));report({act,intro:s.intro});}
    if(context){try{context.setTransform(ratio,0,0,ratio,0,0);ih44WorldFrame(context,width,height,s.reduced?0:s.time,s);}catch{context=null;}}
    if(!s.paused&&!s.reduced)frame=requestAnimationFrame(render);
  };
  const wake=()=>{if(!disposed&&!document.hidden&&visible&&!frame){last=0;drawn=0;frame=requestAnimationFrame(render);}};
  const move=e=>{if(e.pointerType!=="mouse"||state.current.paused||state.current.reduced)return;state.current.x=Math.max(-1,Math.min(1,e.clientX/window.innerWidth*2-1));state.current.y=Math.max(-1,Math.min(1,e.clientY/window.innerHeight*2-1));};
  const scroll=()=>{state.current.scroll=window.scrollY;if(state.current.paused||state.current.reduced)return;wake();};
  try{context=canvas.getContext("2d");}catch{/* Strona i jej funkcje działają również bez warstwy canvas. */}
  listen(window,"resize",()=>{dirty=true;wake();},{passive:true});listen(window,"scroll",scroll,{passive:true});listen(root,"pointermove",move,{passive:true});listen(root,"pointerleave",()=>{state.current.x=0;state.current.y=0;});
  listen(document,"visibilitychange",()=>{last=0;drawn=0;if(document.hidden){cancelAnimationFrame(frame);frame=0;root.dataset.worldHidden="true";}else{root.dataset.worldHidden="false";wake();}});
  if(typeof IntersectionObserver!=="undefined"){resizeObserver=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;last=0;}},{rootMargin:"100px"});resizeObserver.observe(root);}
  wake();return{wake,destroy(){disposed=true;cancelAnimationFrame(frame);listeners.forEach(fn=>fn());resizeObserver?.disconnect();},finish(){state.current.intro=false;state.current.elapsed=IH44_CONFIG.duration;wake();},replay(){Object.assign(state.current,{intro:true,elapsed:0,time:0,paused:false});previous=-1;wake();}};
}
function useIH44Stage(rootRef,canvasRef,palette,dark){
  const [reduced,setReduced]=useState(ih44Reduced),[paused,setPaused]=useState(false),[act,setAct]=useState(()=>ih44Reduced()?4:0),[intro,setIntro]=useState(()=>!ih44Reduced()),[cycle,setCycle]=useState(0);
  const engine=useRef(null),state=useRef({time:0,elapsed:0,intro:!reduced,reduced,paused:false,palette,dark,x:0,y:0,scroll:0});
  useLayoutEffect(()=>{document.body.classList.add("ih44-page");return()=>document.body.classList.remove("ih44-page");},[]);
  useLayoutEffect(()=>{Object.assign(state.current,{palette,dark,reduced,paused});engine.current?.wake();},[palette,dark,reduced,paused]);
  useEffect(()=>{const m=window.matchMedia?.("(prefers-reduced-motion: reduce)");if(!m)return;const change=()=>setReduced(m.matches);m.addEventListener?.("change",change);return()=>m.removeEventListener?.("change",change);},[]);
  useEffect(()=>{let alive=true;const e=ih44StartWorld(canvasRef.current,rootRef.current,state,u=>{if(alive){setAct(u.act);setIntro(u.intro);}});engine.current=e;return()=>{alive=false;e.destroy();engine.current=null;};},[]);
  useEffect(()=>{const root=rootRef.current;if(!root)return;const elements=[...root.querySelectorAll("[data-world-reveal]")];if(reduced||typeof IntersectionObserver==="undefined"){elements.forEach(el=>el.dataset.worldReveal="seen");return;}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.dataset.worldReveal="seen";observer.unobserve(entry.target);} }),{threshold:.08,rootMargin:"0px 0px -30px 0px"});
    elements.forEach(el=>{el.dataset.worldReveal="waiting";observer.observe(el);});return()=>{observer.disconnect();elements.forEach(el=>el.dataset.worldReveal="seen");};
  },[reduced]);
  return{act,intro,paused,reduced,cycle,state,finish(){engine.current?.finish();},replay(){if(reduced)return;setPaused(false);setIntro(true);setAct(0);setCycle(n=>n+1);engine.current?.replay();},toggle(){state.current.paused=!state.current.paused;setPaused(state.current.paused);engine.current?.wake();}};
}

const IH44_CLASSIC_LIGHT={bg:"#f2f1ed",surface:"#ffffff",soft:"#e8e7e3",ink:"#202020",muted:"#656560",line:"#d0d0cb",accent:"#242424",on:"#ffffff",pop:"#d7d7d0"};
const IH44_CLASSIC_DARK={bg:"#181818",surface:"#242424",soft:"#303030",ink:"#f6f5ef",muted:"#bdbdb5",line:"#494944",accent:"#f0efe8",on:"#202020",pop:"#c9c9bd"};
const IH44_UTIL={
 pl:{menu:"Menu",how:"Jak to działa",categories:"Kategorie",forYou:"Dla Ciebie",notices:"Powiadomienia",account:"Moje konto",login:"Zaloguj się",register:"Dołącz",logout:"Wyloguj się",skip:"Pomiń sekwencję",replay:"Powtórz wejście",pause:"Zatrzymaj ruch",play:"Wznów ruch",next:"Następna strona",previous:"Poprzednia strona",latest:"Ostatnio dodane",sample:"Przykładowy projekt",sampleNote:"Przykład zakresu — nieaktywna oferta",all:"Wszystkie ogłoszenia",find:"Znajdź wykonawcę",work:"Przeglądaj zlecenia",fee:"Zasady rozliczenia",roles:["Zlecam pracę","Szukam zlecenia","Wybieram dziedzinę","Otwieram konto"],rolesCopy:["Przejrzyj specjalistów i opowiedz o zadaniu.","Sprawdź ogłoszenia pasujące do Twoich umiejętności.","Odkryj kategorie i wybierz specjalizację.","Profil, rozmowy i ustalenia w jednym miejscu."],go:"Otwórz",choose:"Wybierz pole",summary:"Pomysł, wykonanie i rozmowa w jednym miejscu.",legal:"Dokumenty i pomoc",steps:[["Opis","Określ zakres, oczekiwany rezultat i termin."],["Wybór","Znajdź osobę z odpowiednimi umiejętnościami."],["Ustalenia","Porozmawiaj o cenie, przekazaniu i szczegółach."]]},
 en:{menu:"Menu",how:"How it works",categories:"Categories",forYou:"For you",notices:"Notifications",account:"My account",login:"Sign in",register:"Join",logout:"Sign out",skip:"Skip the sequence",replay:"Replay the entrance",pause:"Pause motion",play:"Resume motion",next:"Next page",previous:"Previous page",latest:"Recently added",sample:"Sample project",sampleNote:"Illustrative scope — not an active listing",all:"All listings",find:"Find a professional",work:"Browse projects",fee:"Payment rules",roles:["I need help","I want a project","I choose a field","I open my account"],rolesCopy:["Browse professionals and describe the task.","Explore listings that match your skills.","Discover categories and choose a specialism.","Your profile, conversations and agreements together."],go:"Open",choose:"Choose a field",summary:"Ideas, execution and conversation in one place.",legal:"Documents and help",steps:[["Brief","Define the scope, expected outcome and timing."],["Selection","Find a person with the right skills."],["Agreement","Discuss the price, delivery and details."]]},
};
function IH44Arrow({back=false}){return <svg viewBox="0 0 24 24" aria-hidden="true" style={back?{transform:"rotate(180deg)"}:undefined}><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg>;}
function IH44Mark(){return <span className="ih44-mark" aria-hidden="true"><i/><i/><i/><i/></span>;}
function IH44Controls({stage,ui}){return <div className="ih44-motion-controls" role="group" aria-label={ui.menu}>
  <button type="button" onClick={stage.intro?stage.finish:stage.replay} disabled={stage.reduced}>{stage.intro?ui.skip:ui.replay}<span aria-hidden="true">↗</span></button>
  <button type="button" onClick={stage.toggle} disabled={stage.reduced} aria-pressed={stage.paused||stage.reduced}>{stage.paused?ui.play:ui.pause}<span aria-hidden="true">{stage.paused?"▷":"Ⅱ"}</span></button>
</div>;}
function IH44Headline({stage,copy}){return <div className="ih44-headline" data-final={!stage.intro}>
  <h1 className="ih44-final-title">{copy.final.map((line,i)=><span key={i}>{line}</span>)}</h1>
  {stage.intro&&<div className="ih44-entrance-title" key={stage.cycle+"-"+stage.act} aria-hidden="true">{copy.acts[Math.min(stage.act,3)].map((line,i)=><span key={i} style={{"--line":i}}>{line}</span>)}</div>}
</div>;}
function IH44FeatureArt({index}){const english=useSitePreferences().language==="en";return <div className={"ih44-art ih44-art-"+index} aria-hidden="true">
  {index===0?<><span className="ih44-art-caption">BRIEF / 01</span><strong>{english?"Small":"Mała"}<br/>{english?"big":"wielka"}<br/>{english?"change.":"zmiana."}</strong><span className="ih44-art-rule"/><i/><i/></>:index===1?<><span className="ih44-art-caption">PORTFOLIO / 02</span><div className="ih44-letter-wall"><b>Aa</b><b>Web</b><b>▶</b></div><span className="ih44-art-rule"/></>:index===2?<><span className="ih44-art-caption">{english?"CATALOG":"KATALOG"} / 03</span><div className="ih44-category-art"><span>WEB</span><span>FILM</span><span>COPY</span><span>DESIGN</span></div></>:<><span className="ih44-art-caption">{english?"CONTACT":"KONTAKT"} / 04</span><div className="ih44-chat-art"><span>{english?"Hi.":"Hej."}</span><span>{english?"Let’s talk.":"Porozmawiajmy."}</span><span>{english?"Sure.":"Jasne."}</span></div></>}
</div>;}
function IH44Actions({ui,session}){return <div className="ih44-primary-actions"><Link to="/find-talent" className="ih44-button ih44-primary">{ui.find}<IH44Arrow/></Link><Link to="/jobs" className="ih44-button">{ui.work}<IH44Arrow/></Link></div>;}
function IH44LagoonLanding({stage,copy,ui,session}){
 const items=[{to:"/find-talent"},{to:"/jobs"},{href:"#categories"},{to:session?"/account":"/register"}];
 return <section className="ih44-landing ih44-lagoon-landing" aria-label={copy.eyebrow} data-no-translate="true">
  <div className="ih44-opening-meta"><span><IH44Mark/>{copy.eyebrow}</span><IH44Controls stage={stage} ui={ui}/></div>
  <div className="ih44-lagoon-composition">
   <div className="ih44-leading-copy"><IH44Headline stage={stage} copy={copy}/><p>{copy.subtitle}</p><IH44Actions ui={ui} session={session}/></div>
   <div className="ih44-function-grid">{items.map((item,i)=>{const Item=item.to?Link:"a";return <Item key={i} {...item} className={"ih44-function ih44-function-"+i} style={{"--tile":i}}>
    <div className="ih44-function-face"><span className="ih44-function-top"><small>0{i+1}</small><IH44Mark/></span><strong>{ui.roles[i]}</strong><span>{ui.rolesCopy[i]}</span><IH44Arrow/></div>
   </Item>;})}</div>
  </div>
  <div className="ih44-world-caption"><span>{copy.strip}</span><a href="#categories">{ui.categories}<span aria-hidden="true">↓</span></a></div>
 </section>;
}
function IH44PapayaLanding({stage,copy,ui,session}){
 const rail=useRef(null),manual=useRef(false),hover=useRef(false);const [index,setIndex]=useState(0);
 function page(next,automatic=false){const el=rail.current;if(!el)return;if(!automatic)manual.current=true;const n=Math.max(0,Math.min(3,next));setIndex(n);el.scrollTo({left:el.children[n].offsetLeft-el.children[0].offsetLeft,behavior:stage.reduced?"instant":"smooth"});}
 useEffect(()=>{manual.current=false;setIndex(0);rail.current?.scrollTo({left:0,behavior:"instant"});},[stage.cycle]);
 useEffect(()=>{if(!stage.intro||stage.paused||stage.reduced)return;const id=setInterval(()=>{const el=rail.current;if(!el||manual.current||hover.current||document.hidden||el.contains(document.activeElement))return;const r=el.getBoundingClientRect();if(r.bottom<0||r.top>window.innerHeight)return;const width=el.children[0].getBoundingClientRect().width+18,current=Math.round(el.scrollLeft/width);page((current+1)%4,true);},4800);return()=>clearInterval(id);},[stage.intro,stage.paused,stage.reduced]);
 return <section className="ih44-landing ih44-editorial-landing" aria-label={copy.eyebrow} data-no-translate="true">
  <div className="ih44-opening-meta"><span>{copy.eyebrow}</span><IH44Controls stage={stage} ui={ui}/></div>
  <IH44Headline stage={stage} copy={copy}/><div className="ih44-editorial-intro"><p>{copy.subtitle}</p><span className="ih44-edition">IDEAHIRE / {new Date().getFullYear()}</span></div>
  <div className="ih44-filmstrip" ref={rail} onPointerEnter={()=>hover.current=true} onPointerLeave={()=>hover.current=false} onPointerDown={()=>manual.current=true} onScroll={()=>{const el=rail.current;if(el)setIndex(Math.max(0,Math.min(3,Math.round(el.scrollLeft/(el.children[0].getBoundingClientRect().width+18)))));}}>
   {ui.roles.map((label,i)=><article className={"ih44-film-page ih44-film-page-"+i} style={{"--tile":i}} key={label}><IH44FeatureArt index={i}/><div className="ih44-film-page-copy"><small>0{i+1}</small><h2>{label}</h2><p>{ui.rolesCopy[i]}</p>{i===2?<a className="ih44-button" href="#categories">{ui.go}<IH44Arrow/></a>:<Link className="ih44-button" to={i===0?"/find-talent":i===1?"/jobs":session?"/account":"/register"}>{ui.go}<IH44Arrow/></Link>}</div></article>)}
  </div>
  <div className="ih44-strip-controls"><span>{copy.strip}</span><div><button type="button" onClick={()=>page(index-1)} disabled={index===0} aria-label={ui.previous}><IH44Arrow back/></button><span>{String(index+1).padStart(2,"0")} / 04</span><button type="button" onClick={()=>page(index+1)} disabled={index===3} aria-label={ui.next}><IH44Arrow/></button></div></div>
 </section>;
}
function IH44IrisLanding({stage,copy,ui,session}){
 const [active,setActive]=useState(0),buttons=useRef([]),manual=useRef(false);
 useEffect(()=>{manual.current=false;},[stage.cycle]);
 useEffect(()=>{if(stage.intro&&!manual.current)setActive(Math.min(3,stage.act));},[stage.act,stage.intro]);
 function keys(e){if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key))return;e.preventDefault();const next=e.key==="Home"?0:e.key==="End"?3:(active+({ArrowLeft:3,ArrowRight:1,ArrowUp:2,ArrowDown:2}[e.key]))%4;setActive(next);buttons.current[next]?.focus({preventScroll:true});}
 return <section className="ih44-landing ih44-iris-landing" aria-label={copy.eyebrow} data-no-translate="true">
  <div className="ih44-opening-meta"><span><IH44Mark/>{copy.eyebrow}</span><IH44Controls stage={stage} ui={ui}/></div>
  <div className="ih44-iris-heading"><IH44Headline stage={stage} copy={copy}/><p>{copy.subtitle}</p></div>
  <div className="ih44-quadrants" data-active={active} onKeyDown={keys} aria-label={ui.choose}>
   {ui.roles.map((title,i)=><article className={"ih44-quadrant ih44-quadrant-"+i+(active===i?" is-active":"")} key={i} style={{"--tile":i}} onPointerEnter={e=>{if(e.pointerType==="mouse"){manual.current=true;setActive(i);}}}>
    <button type="button" className="ih44-quadrant-pick" ref={el=>buttons.current[i]=el} onClick={()=>{manual.current=true;setActive(i);}} onFocus={()=>{manual.current=true;setActive(i);}} aria-pressed={active===i} aria-controls={"ih44-field-"+i}><span>0{i+1}<IH44Mark/></span><strong>{title}</strong></button>
    <div className="ih44-quadrant-detail" id={"ih44-field-"+i}><p>{ui.rolesCopy[i]}</p>{i===2?<a className="ih44-button" href="#categories">{ui.go}<IH44Arrow/></a>:<Link className="ih44-button" to={i===0?"/find-talent":i===1?"/jobs":session?"/account":"/register"}>{ui.go}<IH44Arrow/></Link>}</div>
    <div className="ih44-quadrant-art" aria-hidden="true"><IH44FeatureArt index={i}/></div>
   </article>)}
  </div>
  <div className="ih44-world-caption"><span>{copy.strip}</span><a href="#categories">{ui.categories}<span aria-hidden="true">↓</span></a></div>
 </section>;
}
function ih44RealJob(job){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(job?.id||""));}
function ih44PublicFee(budget,offer){return Math.round(Math.min(offer.maximum,Math.max(offer.minimum,Number(budget)*offer.percent/100))*100)/100;}
function IH44CommissionPanel(){
 const english=useSitePreferences().language==="en",offer=IDEA_HIRE_PUBLIC_OFFER,[budget,setBudget]=useState(2200),fee=ih44PublicFee(budget,offer);
 const money=value=>Number(value).toLocaleString(english?"en-GB":"pl-PL",{style:"currency",currency:"PLN",maximumFractionDigits:2}),percent=Number(offer.percent).toLocaleString(english?"en-GB":"pl-PL");
 return <aside className="ih44-fee-panel" data-no-translate="true"><div className="ih44-fee-heading"><span className="ih44-kicker">{english?"IdeaHire service fee":"Prowizja IdeaHire"}</span><IH44Mark/></div><strong className="ih44-fee-rate">{percent}<span>%</span></strong>
  <p className="ih44-fee-limits">{english?"Minimum":"Minimum"} {money(offer.minimum)} · {english?"maximum":"maksimum"} {money(offer.maximum)}</p>
  <p>{english?"Orders up to":"Zlecenia do"} {money(offer.orderLimit)}. {english?"Paid by the client.":"Płaci zleceniodawca."}</p>
  <label className="ih44-fee-slider"><span>{english?"Try a project value":"Sprawdź wartość zlecenia"}<output>{money(budget)}</output></span><input type="range" min="100" max={offer.orderLimit} step="100" value={budget} onChange={e=>setBudget(Number(e.target.value))}/></label>
  <div className="ih44-fee-result"><span>{english?"Service fee":"Prowizja"}<strong>{money(fee)}</strong></span><span>{english?"Client total":"Razem dla klienta"}<strong>{money(Number(budget)+fee)}</strong></span></div>
  <small>{english?"Illustrative calculation. You confirm the amount before payment.":"Przykładowe obliczenie. Kwotę potwierdzisz przed płatnością."}</small>
 </aside>;
}
function ih44CategoryLabel(value,english){if(!english)return getCategoryLabel(value);return {Programowanie:"Web, apps and IT","Grafika i design":"Graphics, UX and 3D",Marketing:"Marketing and sales",Copywriting:"Copy and translation",Video:"Video, motion and audio",Fotografia:"Photography","AI i automatyzacje":"AI and automation","Dane, analizy i research":"Data and research","Biznes i e-commerce":"Business and e-commerce","Architektura, wnętrza i CAD":"Architecture and CAD"}[value]||value||"Other";}
function IH44Jobs({jobs,ui,copy,english}){const real=jobs.some(ih44RealJob);return <section className="ih44-section ih44-jobs" id="projects" data-world-reveal="seen" data-no-translate="true">
 <div className="ih44-section-heading"><span className="ih44-kicker">{real?ui.latest:ui.sample}</span><h2>{copy.jobs}</h2><Link to="/jobs">{ui.all}<IH44Arrow/></Link></div>
 <div className="ih44-job-list">{jobs.slice(0,4).map((job,i)=>{const actual=ih44RealJob(job),title=!actual&&english?["A website for a new brand","A visual identity","Copy for a company website"][i%3]:job.title;return <Link className="ih44-job" key={job.id||i} to="/jobs" state={actual?{lucynaJobId:String(job.id),lucynaTitle:String(job.title)}:undefined} style={{"--row":i}}><span className="ih44-job-number">{String(i+1).padStart(2,"0")}</span><div><small>{actual?ih44CategoryLabel(job.category,english):ui.sampleNote}</small><strong>{title}</strong></div><span className="ih44-job-budget">{job.budget?Number(job.budget).toLocaleString(english?"en-GB":"pl-PL")+(english?" PLN":" zł"):"—"}</span><IH44Arrow/></Link>;})}</div>
 </section>;}

/* P40: jeden nagłówek w DOM; przewijanie zabiera cały pas, bezruch odsyła go na górę. */
const IH40_HEADER_STYLES = String.raw`
__IH40__ .ih40-header-slot {display:flow-root!important;position:relative!important;width:100%!important;min-width:0!important;overflow:visible!important;}
__IH40__ .ih40-header-slot > .ih-home-header {position:relative!important;inset:auto!important;translate:0 0!important;}
__IH40__ .ih40-header-slot .home-nav-links {translate:0 0!important;}
@media(prefers-reduced-motion:reduce){__IH40__ .ih40-header-slot > .ih-home-header{transition:none!important;}}
`.replaceAll("__IH40__", "#root".repeat(10));

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
  const english=useSitePreferences().language==="en";
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
      aria-label={english?(open?"Close account menu":"Open account menu"):(open?"Zamknij menu konta":"Otwórz menu konta")} aria-expanded={open} aria-controls="ih27-home-account-menu"
      onClick={() => { if (!open) onOpen?.(); setOpen(value => !value); }}
      onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); if (open) menuRef.current?.querySelector("a")?.focus({ preventScroll: true }); else { onOpen?.(); setOpen(true); } } }}>
      <span className="account-mini-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initial}</span>
    </button>
    {open && createPortal(<nav ref={menuRef} id="ih27-home-account-menu" className="account-menu-dropdown ih18-account-dropdown ih27-home-account-menu"
      aria-label={english?"Account tools":"Funkcje konta"} data-no-translate="true" onKeyDown={navigateMenu}
      onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && !triggerRef.current?.contains(event.relatedTarget)) setOpen(false); }}>
      <div className="account-menu-identity"><strong>{name}</strong><span>{english?"IdeaHire account":"Konto IdeaHire"}</span></div>
      <Link to="/account" onClick={() => setOpen(false)}>{english?"My account":"Moje konto"}</Link>
      <a href={helpCenterHref()} onClick={() => setOpen(false)} referrerPolicy="no-referrer" aria-label={english?"Help — Help centre":"Pomoc — Centrum pomocy"}>
        <MarketIcon kind="help" /><span>{english?"Help":"Pomoc"}</span>
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

function App({ session, loading, categoryGroups = [] }) {

  const homeRootRef=useRef(null),worldCanvasRef=useRef(null);
  const site=useSitePreferences(),english=site.language==="en",dark=site.theme==="dark";
  const palette=site.template==="classic"?(dark?IH44_CLASSIC_DARK:IH44_CLASSIC_LIGHT):(dark?IH44_CONFIG.dark:IH44_CONFIG.light);
  const ui=IH44_UTIL[english?"en":"pl"],copy=IH44_CONFIG[english?"en":"pl"];
  const stage=useIH44Stage(homeRootRef,worldCanvasRef,palette,dark);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const headerSlotRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const navigationRef = useRef(null);
  useIdeaHireScrollHeader(headerRef, headerSlotRef, IH44_CONFIG.mode==="lagoon");

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
    <div ref={homeRootRef} className="app ih44-home" data-design={IH44_CONFIG.mode} data-intro={stage.intro} data-act={stage.act}
      data-paused={stage.paused||stage.reduced} data-reduced={stage.reduced} data-cycle={stage.cycle}>
      <canvas ref={worldCanvasRef} className="ih44-world" aria-hidden="true"/>
      <a className="ih44-skip-link" href="#ih44-content">{english?"Skip to content":"Przejdź do treści"}</a>
      <div ref={headerSlotRef} className="ih44-header-slot">
        <header ref={headerRef} className="ih44-nav" data-auth={session?"member":"guest"} data-mobile-menu-open={mobileMenuOpen}
          onKeyDown={event=>{if(event.key==="Escape"&&mobileMenuOpen){event.preventDefault();setMobileMenuOpen(false);mobileMenuButtonRef.current?.focus({preventScroll:true});}}}>
          <div className="ih44-brand"><IdeaHireLogo className="logo logo-clean"/><small>{IH44_CONFIG.name.toUpperCase()}</small></div>
          <nav ref={navigationRef} id="ih-home-navigation" className="ih44-nav-links" aria-label={ui.menu} data-no-translate="true"
            onClick={event=>{if(event.target?.closest?.("a"))setMobileMenuOpen(false);}}>
            <HomeNavItem href="#how-it-works" order={0}>{ui.how}</HomeNavItem>
            <HomeNavItem href="#categories" order={1}>{ui.categories}</HomeNavItem>
            <HomeNavItem href="#for-users" order={2}>{ui.forYou}</HomeNavItem>
            {session&&<><HomeNavItem to="/notifications" order={3} notification={hasNotifications}>{ui.notices}</HomeNavItem><HomeNavItem to="/account" order={4}>{ui.account}</HomeNavItem></>}
            {!session&&<HomeNavItem to="/jobs" order={3}>{ui.work}</HomeNavItem>}
            {!session&&<Link className="ih44-menu-login" to="/login">{ui.login}</Link>}
          </nav>
          <div className="ih44-user-actions" data-no-translate="true">
            {loading?<span className="ih44-loading-label">{english?"Loading…":"Ładowanie…"}</span>:session?<>
              <HomeAccountMenu name={userName} avatarUrl={avatarUrl} initial={userInitial} onOpen={()=>setMobileMenuOpen(false)}/>
              <button className="ih44-logout" type="button" onClick={handleLogout} aria-label={ui.logout}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M13 8l4 4-4 4M8 12h12" fill="none" stroke="currentColor" strokeWidth="1.6"/></svg></button>
            </>:<><Link className="ih44-login" to="/login">{ui.login}</Link><Link className="ih44-join" to="/register">{ui.register}<IH44Arrow/></Link></>}
          </div>
          <button ref={mobileMenuButtonRef} type="button" className="ih44-burger" aria-label={mobileMenuOpen?(english?"Close menu":"Zamknij menu"):(english?"Open menu":"Otwórz menu")}
            aria-expanded={mobileMenuOpen} aria-controls="ih-home-navigation" onClick={()=>setMobileMenuOpen(v=>!v)}><span aria-hidden="true">{mobileMenuOpen?"×":"☰"}</span></button>
        </header>
      </div>
      <main className="ih44-main" id="ih44-content">
        {IH44_CONFIG.mode==="lagoon"?<IH44LagoonLanding stage={stage} copy={copy} ui={ui} session={session}/>:IH44_CONFIG.mode==="editorial"?<IH44PapayaLanding stage={stage} copy={copy} ui={ui} session={session}/>:<IH44IrisLanding stage={stage} copy={copy} ui={ui} session={session}/>}
        <div className="ih44-flow-band" aria-hidden="true" data-no-translate="true"><div>{Array.from({length:4},(_,i)=><span key={i}><IH44Mark/>{copy.strip}</span>)}</div></div>
        <section className="ih44-section ih44-catalog" id="categories" data-world-reveal="seen">
          <div className="ih44-section-heading" data-no-translate="true"><span className="ih44-kicker">01 / {ui.categories}</span><h2>{copy.section}</h2><p>{english?"Choose a category, then narrow it down to a specialism.":"Wybierz kategorię, potem doprecyzuj specjalizację."}</p></div>
          <div className="ih44-catalog-content"><HomeCategoryBrowser groups={categoryGroups.length?categoryGroups:categories}/><IH44CommissionPanel/></div>
        </section>
        <IH44Jobs jobs={recentJobs} copy={copy} ui={ui} english={english}/>
        <section className="ih44-section ih44-method" id="how-it-works" data-world-reveal="seen">
          <div className="ih44-section-heading" data-no-translate="true"><span className="ih44-kicker">02 / {ui.how}</span><h2>{copy.how}</h2><p>{english?"Scope, price and timing. Put the essentials in the agreement.":"Zakres, cena i termin. Zapiszcie najważniejsze rzeczy w ustaleniach."}</p></div>
          <div className="ih44-steps" data-no-translate="true">{ui.steps.map(([title,description],i)=><HomeStepCard key={title} number={"0"+(i+1)} title={title}>{description}</HomeStepCard>)}</div>
        </section>
        <section className="ih44-section ih44-roles" id="for-users" data-world-reveal="seen" data-no-translate="true">
          <article><span className="ih44-kicker">03 / {ui.roles[0]}</span><h2>{english?"Who can help you with this?":"Kto Ci w tym pomoże?"}</h2><p>{ui.rolesCopy[0]}</p><Link className="ih44-button ih44-primary" to="/find-talent">{ui.find}<IH44Arrow/></Link><IH44Mark/></article>
          <article><span className="ih44-kicker">04 / {ui.roles[1]}</span><h2>{english?"Show what you know.":"Pokaż, na czym się znasz."}</h2><p>{ui.rolesCopy[1]}</p><Link className="ih44-button" to="/jobs">{ui.work}<IH44Arrow/></Link><IH44Mark/></article>
        </section>
        <section className="ih44-section ih44-finale" data-world-reveal="seen" data-no-translate="true"><span className="ih44-kicker">IDEAHIRE</span><h2>{copy.end.map((line,i)=><span key={i}>{line}</span>)}</h2><Link className="ih44-button ih44-primary" to={session?"/account":"/register"}>{session?ui.account:ui.register}<IH44Arrow/></Link></section>
      </main>
      <footer className="ih44-footer" data-no-translate="true"><div><Link to="/" className="ih44-footer-logo">IdeaHire<IH44Mark/></Link><p>{ui.summary}</p></div><nav aria-label={ui.legal}>
        <a href={helpCenterHref()} onClick={event=>{event.currentTarget.href=helpCenterHref();}} referrerPolicy="no-referrer">{english?"Help":"Pomoc"}</a>
        <Link to="/regulamin">{english?"Terms":"Regulamin"}</Link><Link to="/polityka-prywatnosci">{english?"Privacy":"Prywatność"}</Link><Link to="/polityka-cookies">Cookies</Link>
        <a href="mailto:ideahireprywatnosc@gmail.com?subject=Zg%C5%82oszenie%20nielegalnej%20tre%C5%9Bci%20w%20IdeaHire">{english?"Report illegal content":"Zgłoś nielegalną treść"}</a>
      </nav><span>© {new Date().getFullYear()} IdeaHire</span></footer>
    </div>
  );
}

export default App;
