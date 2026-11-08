import { useEffect, useRef, useState } from "react";
import "./ConnectionSculpture.css";
const DURATION = 6400;

export default function ConnectionSculpture({ en = false }) {
  const hostRef = useRef(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const host = hostRef.current, preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, last = 0, elapsed = 0, visible = false;
    const tick = now => {
      if (last && visible && !document.hidden && !preference.matches) {
        elapsed += now-last;
        if (elapsed >= DURATION) { elapsed = 0; setActive(chapter => (chapter+1)%3); }
        host.style.setProperty("--chapter-progress",elapsed/DURATION);
      }
      last = now; frame = requestAnimationFrame(tick);
    };
    const observer = "IntersectionObserver" in window ? new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting; last = 0; host.dataset.visible = String(visible);
      if (visible) host.dataset.entered = "true";
    },{threshold:.2}) : null;
    if (observer) observer.observe(host);
    else { visible=true; host.dataset.entered="true"; }
    const resetClock = () => { last=0; };
    document.addEventListener("visibilitychange",resetClock);
    frame=requestAnimationFrame(tick);
    return () => { observer?.disconnect(); cancelAnimationFrame(frame); document.removeEventListener("visibilitychange",resetClock); };
  },[]);
  const chapters = en ? [
    ["Portfolio","Choose with a clearer picture","The work.","Before the word.","See a professional’s portfolio and offer before deciding who to work with.","Work · Profile · Offer"],
    ["Agreements","Start on the same page","Your project.","Shared terms.","Agree on the scope, deadline and price together, before the work begins.","Scope · Deadline · Price"],
    ["Collaboration","Keep the context together","One project.","The whole story.","Keep your files, messages and agreements alongside the project they belong to.","Files · Messages · Agreements"],
  ] : [
    ["Portfolio","Wybierasz świadomie","Najpierw prace.","Potem wybór.","Poznaj portfolio i ofertę wykonawcy, zanim zdecydujesz, z kim chcesz pracować.","Prace · Profil · Oferta"],
    ["Ustalenia","Zaczynacie od konkretów","Twój projekt.","Wspólne zasady.","Zakres, termin i cena — uzgadniacie je razem, zanim zacznie się praca.","Zakres · Termin · Cena"],
    ["Współpraca","Zachowujecie cały kontekst","Jeden projekt.","Cała rozmowa.","Pliki, wiadomości i ustalenia zostają przy projekcie, którego dotyczą.","Pliki · Wiadomości · Ustalenia"],
  ];
  return <div className="ih-workprint" ref={hostRef} data-chapter={active} data-entered="false">
    <header className="ih-workprint-top"><span>{en?"FROM FINDING SOMEONE TO WORKING TOGETHER":"OD WYBORU DO WSPÓŁPRACY"}</span><span aria-hidden="true">IDEAHIRE / 0{active+1}</span></header>
    <div className="ih-workprint-accessible"><h2>{en?"From finding someone to working together":"Od wyboru do współpracy"}</h2><dl>{chapters.map(([name,,,,text])=><div key={name}><dt>{name}</dt><dd>{text}</dd></div>)}</dl></div>
    <div className="ih-workprint-stage">
      <div className="ih-workprint-copy" aria-hidden="true">{chapters.map(([name,before,title,second,text,detail],index)=><div className="ih-workprint-chapter" key={name} data-active={active===index}>
        <span className="ih-workprint-eyebrow">{before}</span><h2>{title}<br/><em>{second}</em></h2><p>{text}</p><span className="ih-workprint-detail">{detail}</span>
      </div>)}</div>
      <div className="ih-workprint-art" aria-hidden="true">
        <svg className="ih-workprint-sheet" viewBox="0 0 560 390" data-active={active===0}>
          <path className="ih-workprint-fine" d="M23 322H537M86 52V348M472 52V348"/>
          <g className="ih-workprint-glyph-back"><text x="206" y="295" className="ih-workprint-serif">a</text></g>
          <g className="ih-workprint-glyph-front"><text x="38" y="310" className="ih-workprint-sans">a</text></g>
          <path className="ih-workprint-registration" d="M487 75V101M474 88H500M47 322V338M39 330H55"/>
          <text x="484" y="306" className="ih-workprint-micro" transform="rotate(-90 484 306)">{en?"APPROACH / CRAFT / CHARACTER":"PODEJŚCIE / WARSZTAT / CHARAKTER"}</text>
          <text x="86" y="369" className="ih-workprint-micro">Aa — 01 / PORTFOLIO</text>
        </svg>
        <svg className="ih-workprint-sheet" viewBox="0 0 560 390" data-active={active===1}>
          {[0,1,2].map(line=><g key={line} className="ih-workprint-term" style={{"--item":line}}>
            <text x="88" y={105+line*99} className="ih-workprint-term-label">{(en?["Scope","Deadline","Price"]:["Zakres","Termin","Cena"])[line]}</text>
            <path className="ih-workprint-rule" d={`M88 ${124+line*99}H468`}/><path className="ih-workprint-check" pathLength="1" d={`M418 ${81+line*99}l13 13 25-29`}/>
          </g>)}
          <text x="88" y="369" className="ih-workprint-micro">{en?"02 / A SHARED STARTING POINT":"02 / WSPÓLNY PUNKT WYJŚCIA"}</text>
        </svg>
        <svg className="ih-workprint-sheet" viewBox="0 0 560 390" data-active={active===2}>
          <g className="ih-workprint-message ih-workprint-message-back"><path className="ih-workprint-message-accent" d="M174 63H433C475 63 493 82 493 119V164C493 201 475 220 437 220H366L324 252V220H174C136 220 118 201 118 164V119C118 82 136 63 174 63Z"/><path className="ih-workprint-message-line" d="M166 111H432M166 136H380"/></g>
          <g className="ih-workprint-message ih-workprint-message-front"><path className="ih-workprint-message-ink" d="M105 174H345C384 174 404 193 404 231V265C404 303 384 322 345 322H193L143 355V322H105C66 322 47 303 47 265V231C47 193 66 174 105 174Z"/><text x="91" y="239" className="ih-workprint-file">{en?"The brief.pdf":"Brief projektu.pdf"}</text><path className="ih-workprint-file-line" d="M92 265H332M92 281H254"/></g>
          <text x="424" y="328" className="ih-workprint-micro" transform="rotate(-90 424 328)">{en?"MATERIALS + CONVERSATIONS":"MATERIAŁY + ROZMOWY"}</text>
        </svg>
      </div>
    </div>
    <ol className="ih-workprint-index" aria-label={en?"Three parts of collaboration":"Trzy elementy współpracy"}>{chapters.map(([name],index)=><li key={name} data-active={active===index}><span>0{index+1}</span><span>{name}</span><i aria-hidden="true"/></li>)}</ol>
  </div>;
}
