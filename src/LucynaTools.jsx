import { FormSelect, AutoTextarea } from "./FormControls";
/* IdeaHire | Lucyna AI | P35 | Wiadomości, brief i analiza wybranego materiału. */
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLucynaReveal } from "./LucynaMotion";
import { briefReadiness, briefTemplate, correctionDraft, LUCYNA_UUID, messageTemplate, normalizeMessageVariants, reviewSummary, suggestedCriteria } from "./LucynaCore";

const byteLimit = (value, limit = 12000) => {
  let out = String(value); const encoder = new TextEncoder();
  while (encoder.encode(out).length > limit) out = out.slice(0, Math.max(0,out.length-100));
  return out;
};
export async function readReviewFile(file) {
  if (!file || file.size > 2 * 1024 * 1024) throw new Error("Wybierz plik do 2 MB.");
  const name = file.name.toLowerCase();
  if (/\.(jpg|jpeg|png|webp)$/.test(name)) {
    const bitmap = await createImageBitmap(file);
    try {
      if (!bitmap.width || !bitmap.height || bitmap.width*bitmap.height > 32000000) throw new Error("Wybierz obraz o rozdzielczości do 32 megapikseli.");
      const scale = Math.min(1,768/Math.max(bitmap.width,bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1,Math.round(bitmap.width*scale)); canvas.height = Math.max(1,Math.round(bitmap.height*scale));
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Ta przeglądarka nie odczyta obrazu.");
      ctx.fillStyle = "#fff"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const image = canvas.toDataURL("image/jpeg",0.78);
      if (image.length>550000) throw new Error("Zmniejsz obraz i wybierz go ponownie.");
      return {image,text:"",note:"Obraz zmniejszono do 768 px i usunięto metadane. Drobny tekst może być mniej czytelny. Podgląd pokazuje materiał wysyłany do analizy."};
    } finally { bitmap.close(); }
  }
  if (/\.pdf$/.test(name)) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const task = pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,useSystemFonts:true});
    try {
      const pdf = await task.promise; const texts = []; const pages = Math.min(pdf.numPages,10);
      for (let page = 1; page <= pages; page++) {
        const content = await (await pdf.getPage(page)).getTextContent();
        texts.push("Strona "+page+":\n"+content.items.filter(item=>"str" in item).map(item=>item.str+(item.hasEOL ? "\n" : " ")).join(""));
      }
      const whole = texts.join("\n\n"), text = byteLimit(whole);
      if (!text.trim() || texts.every(t=>/^Strona \d+:\s*$/.test(t))) throw new Error("PDF nie ma odczytywalnego tekstu. Wybierz obraz strony lub wklej tekst.");
      return {text,image:"",note:"Odczytano tekst z "+pages+" z "+pdf.numPages+" stron. Układ, obrazy i skany PDF nie są oceniane."
        +(text!==whole ? " Tekst skrócono do 12 kB. Wybierz istotny fragment przed analizą." : " Sprawdź odczytany fragment przed analizą.")};
    } finally { await task.destroy(); }
  }
  if (!/\.(txt|md|csv|json|html|css|js|jsx|ts|tsx|py|sql)$/.test(name)) throw new Error("Obsługiwane pliki: PDF, tekst i kod oraz JPG, PNG, WEBP. Kod nie jest uruchamiany.");
  const whole = await file.text(), text = byteLimit(whole);
  return {text,image:"",note:text!==whole ? "Tekst skrócono do 12 kB. Wybierz istotny fragment." : "Tekst odczytano lokalnie. Sprawdź go i usuń dane prywatne przed analizą."};
}
async function copyText(text,onNotice) {
  try { await navigator.clipboard.writeText(text); onNotice("Skopiowano. Sprawdź treść przed samodzielnym wysłaniem."); }
  catch { onNotice("Możesz zaznaczyć tekst i skopiować go ręcznie."); }
}
function ReviewScore({summary}) {
  const ref = useRef(null), [display,setDisplay] = useState(0), [started,setStarted] = useState(false);
  useEffect(() => {
    if (!ref.current || started || summary.score === null) return;
    if (!('IntersectionObserver' in window)) {setStarted(true);return;}
    const observer = new IntersectionObserver(entries => {if(entries.some(e=>e.isIntersecting)){setStarted(true);observer.disconnect();}}, {threshold:0.2});
    observer.observe(ref.current); return () => observer.disconnect();
  }, [started,summary.score]);
  useEffect(() => {
    if (!started || summary.score === null) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame, begin;
    const finish = () => {cancelAnimationFrame(frame);setDisplay(summary.score);};
    if (reduced.matches) {finish();return;}
    const tick = now => {if(begin===undefined)begin=now;const p=Math.min(1,(now-begin)/1100);setDisplay(Math.round(summary.score*(1-Math.pow(1-p,3))));if(p<1)frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick); reduced.addEventListener?.('change',finish);
    return () => {cancelAnimationFrame(frame);reduced.removeEventListener?.('change',finish);};
  }, [started,summary.score]);
  return <div className="lu-review-score" ref={ref}>
    <span className="lu-score-eyebrow">PODSUMOWANIE KRYTERIÓW</span>
    {summary.score===null ? <strong className="lu-score-empty">Potrzeba więcej danych</strong>
      : <div className="lu-score-number" role="img" aria-label={summary.score+' procent zgodności ocenionych kryteriów'}><strong aria-hidden="true">{display}<span>%</span></strong><span aria-hidden="true">Zgodność ocenionych<br />kryteriów</span></div>}
    <div className="lu-score-track" aria-hidden="true"><i style={{transform:'scaleX('+(summary.score===null?0:display/100)+')'}} /></div>
    <p>Podstawa w materiale: <strong>{summary.assessed} z {summary.total} kryteriów</strong>. {summary.assessed < summary.total ? 'Pozostałe punkty wymagają sprawdzenia i nie wchodzą do procentu.' : 'Każde ocenione kryterium ma równą wagę.'}</p>
    <details className="lu-score-method"><summary>Jak obliczamy ten wynik?</summary><p>Spełnione: 1 punkt. Częściowo: 0,5. Niezgodność: 0. Wynik to suma punktów podzielona przez liczbę ocenionych kryteriów. „Do sprawdzenia” jest pomijane. Procent nie jest prawdopodobieństwem poprawności ani oceną całej pracy, autora, zgodności prawnej lub bezpieczeństwa. Odbiór pozostaje Twoją decyzją.</p></details>
  </div>;
}
export function MessageVariants({variants,onNotice,onRefine,busy,animate=false}) {
  const normalized = normalizeMessageVariants(variants), [selected,setSelected] = useState(0);
  const [edits,setEdits] = useState(() => normalized?.map(v=>v.body) || []), [copied,setCopied] = useState(false);
  const [interacted,setInteracted]=useState(false);
  const [edited,setEdited]=useState([false,false]);
  const id = React.useId(), timer = useRef(null), editor=useRef(null);
  const reveal=useLucynaReveal(edits[selected] || '',(animate || interacted) && !edited[selected]);
  useEffect(()=>{setEdits(normalizeMessageVariants(variants)?.map(v=>v.body) || []);setSelected(0);setCopied(false);setEdited([false,false]);setInteracted(false);},[variants]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  if (!normalized) return null;
  async function copyVariant() {
    try {await navigator.clipboard.writeText(edits[selected]);setCopied(true);clearTimeout(timer.current);timer.current=setTimeout(()=>setCopied(false),1800);}
    catch {onNotice('Nie udało się skopiować. Zaznacz treść wybranej wersji i skopiuj ją ręcznie.');}
  }
  return <section className="lu-variants" aria-label="Dwa warianty wiadomości">
    <div className="lu-variants-heading"><span>WIADOMOŚĆ DO WYBORU</span><strong>Ten sam sens. Dwie wersje.</strong><p>Wybierz brzmienie, które pasuje do Ciebie. Treść możesz od razu poprawić.</p></div>
    <div className="lu-variant-options" role="group" aria-label="Wybierz wariant wiadomości">{normalized.map((v,i)=><button type="button" key={i} aria-pressed={selected===i} aria-controls={id+'-editor'} onClick={()=>{setSelected(i);setCopied(false);setInteracted(true);}}><span>{i===0?'A':'B'}</span><strong>{v.title}</strong>{selected===i&&<small>Wybrana</small>}</button>)}</div>
    <div className="lu-variant-paper" key={selected} data-revealing={reveal.revealing}>
      <div className="lu-paper-top"><label htmlFor={id+'-editor'}>WARIANT {selected===0?'A':'B'} <span>· {reveal.revealing?'ujawnianie treści':'możesz edytować'}</span></label><span aria-hidden="true">{selected===0?'01':'02'}</span></div>
      {reveal.revealing && <div className="lu-draft-writing" aria-busy="true"><p>{reveal.text}<span className="lu-writing-caret" aria-hidden="true"/></p><button type="button" className="lu-text-button" onClick={()=>{reveal.revealAll();requestAnimationFrame(()=>editor.current?.focus({preventScroll:true}));}}>Pokaż od razu i edytuj</button></div>}
      <AutoTextarea ref={editor} hidden={reveal.revealing} id={id+'-editor'} rows={3} value={edits[selected] || ''} maxLength={2000} onChange={e=>{setEdited(all=>all.map((value,i)=>i===selected?true:value));setEdits(all=>all.map((text,i)=>i===selected?e.target.value:text));setCopied(false);}} />
    </div>
    <div className="lu-tool-actions"><button type="button" className="lu-primary" disabled={!edits[selected]?.trim()} onClick={copyVariant}>{copied?'Skopiowano':'Kopiuj tekst'}</button><button type="button" className="lu-secondary" disabled={busy || !edits[selected]?.trim()} onClick={()=>onRefine(edits[selected])}>Dopracuj</button></div>
    <p className="lu-tool-note">Propozycje AI. Sprawdź fakty, adresata i zobowiązania. Wysyłasz samodzielnie. Edycja tej kopii nie zmienia pierwotnej odpowiedzi zapisanej w historii.</p>
  </section>;
}
export function ReviewResult({ review, onDraft, busy, animate=false }) {
  const summary = reviewSummary(review);
  const reveal=useLucynaReveal(review.summary,animate);
  const labels = {met:"Spełnione",partial:"Częściowo",missing:"Niezgodność",unknown:"Do sprawdzenia"};
  return <section className="lu-review-result" aria-label="Wstępne sprawdzenie materiału">
    <div className="lu-review-heading"><strong>Notatka Lucyny</strong><span>Wstępna analiza AI</span></div>
    <p className="lu-review-summary" aria-busy={reveal.revealing}>{reveal.text}{reveal.revealing && <span className="lu-writing-caret" aria-hidden="true"/>}</p>
    <ol className="lu-criteria-results" data-animate={animate}>{review.criteria.map((row,index)=><li key={index} style={{"--lu-row-index":index}} className={"is-"+row.status}>
      <div><strong>{row.criterion}</strong><span>{labels[row.status] || "Do sprawdzenia"}</span></div>
      <p>{row.reason}</p>{row.quote && <blockquote>{row.quote}</blockquote>}
      <small>{row.basis==="text" ? "Podstawa: dosłowny cytat z wybranego tekstu" : row.basis==="image" ? "Podstawa: obserwacja wybranego obrazu" : "Brak wystarczającego materiału"}</small>
      {row.fix && <p className="lu-fix"><strong>Propozycja poprawki:</strong> {row.fix}</p>}
    </li>)}</ol>
    <ReviewScore summary={summary} />
    <button type="button" className="lu-secondary" disabled={busy} onClick={()=>onDraft(correctionDraft(review))}>Ułóż dwie wiadomości o poprawkach</button>
    <p className="lu-tool-note">Powstaną dwie propozycje w jednej próbie AI. Żadna nie zostanie wysłana automatycznie.</p>
  </section>;
}
function MessageTool({onUseDraft,onLocalDraft,busy,initialDraft=""}) {
  const [purpose,setPurpose] = useState(""), [details,setDetails] = useState(initialDraft), [tone,setTone] = useState("polite");
  useEffect(()=>{setDetails(initialDraft);},[initialDraft]);
  return <section className="lu-tool-card"><div className="lu-tool-heading"><span>WIADOMOŚCI</span><h2>Dobierz słowa do sytuacji</h2><p>Dwie wersje w tym samym tonie, oparte na Twoich faktach. Wybierzesz jedną i dopracujesz ją przed wysłaniem.</p></div>
    <label>Cel wiadomości<input value={purpose} maxLength={300} placeholder="Np. zapytanie o termin albo prośba o poprawki" onChange={e=>setPurpose(e.target.value)} /></label>
    <label>Fakty i ustalenia<AutoTextarea value={details} maxLength={1200} rows={4} placeholder="Podaj tylko fakty potrzebne do tej wiadomości" onChange={e=>setDetails(e.target.value)} /></label>
    <label>Ton<FormSelect value={tone} onChange={e=>setTone(e.target.value)}><option value="polite">Uprzejmy</option><option value="firm">Stanowczy</option><option value="short">Krótki</option></FormSelect></label>
    <div className="lu-tool-actions"><button type="button" className="lu-primary" disabled={busy || !purpose.trim() && !details.trim()} onClick={()=>onUseDraft("Pomóż mi napisać "+({polite:"uprzejmą",firm:"stanowczą",short:"krótką"}[tone])+" wiadomość. Przygotuj dwa warianty w tym samym tonie, zachowując te same fakty.\n\nCel: "+purpose+"\n\nFakty i ustalenia:\n"+details)}>{busy ? "Przygotowuję…" : "Przygotuj dwie wersje z AI"}</button><button type="button" className="lu-secondary" disabled={busy || !purpose.trim() && !details.trim()} onClick={()=>onLocalDraft(messageTemplate({purpose,details,tone}))}>Ułóż szablon bez AI</button></div>
    <p className="lu-tool-note">Oba warianty powstają w jednej próbie AI. Wiadomość wysyłasz samodzielnie. Sprawdź adresata, fakty, terminy i zobowiązania.</p>
  </section>;
}
function BriefTool({onUseDraft,onLocalDraft,busy}) {
  const [fields,setFields] = useState({goal:"",scope:"",result:"",deadline:"",budget:"",acceptance:""});
  const labels = {goal:"Cel",scope:"Zakres",result:"Oczekiwany rezultat",deadline:"Termin",budget:"Budżet",acceptance:"Jak sprawdzisz odbiór?"};
  const readiness = briefReadiness(fields);
  return <section className="lu-tool-card"><div className="lu-tool-heading"><span>ZLECENIE</span><h2>Zacznij od jasnych ustaleń</h2><p>Podaj znane informacje. Lucyna ułoży z nich szkic i wskaże, co warto jeszcze uzgodnić.</p></div>
    <div className="lu-brief-progress"><strong>{readiness.percent}% pól uzupełnionych</strong><progress max="100" value={readiness.percent} aria-label="Kompletność pól zlecenia" /><span>To kompletność formularza; jakość ustaleń sprawdzasz samodzielnie.</span></div>
    <div className="lu-tool-grid">{Object.entries(labels).map(([key,label])=><label key={key}>{label}<AutoTextarea rows={2} maxLength={key==="scope" || key==="acceptance" ? 350 : 180} value={fields[key]} onChange={e=>setFields({...fields,[key]:e.target.value})} /></label>)}</div>
    <div className="lu-tool-actions"><button type="button" className="lu-primary" disabled={busy || !Object.values(fields).some(value=>value.trim())} onClick={()=>onUseDraft("Przygotuj przejrzyste zlecenie na podstawie moich informacji. Zachowaj fakty, brakujące informacje oznacz jako do uzgodnienia.\n\n"+briefTemplate(fields))}>{busy ? "Przygotowuję…" : "Przygotuj zlecenie z AI"}</button><button type="button" className="lu-secondary" disabled={busy || !Object.values(fields).some(value=>value.trim())} onClick={()=>onLocalDraft(briefTemplate(fields))}>Ułóż szablon bez AI</button><Link to="/find-talent">Otwórz formularz publikacji</Link></div>
  </section>;
}
function ReviewTool({supabase,user,busy,onReview,onNotice,deliveryId,conversationId}) {
  const [criteria,setCriteria] = useState(["" ]), [material,setMaterial] = useState(""), [image,setImage] = useState("");
  const [note,setNote] = useState(""), [rights,setRights] = useState(false), [redacted,setRedacted] = useState(false);
  const [loading,setLoading] = useState(false), [linked,setLinked] = useState(null), [loadError,setLoadError] = useState("");
  const [fileBusy,setFileBusy] = useState(false); const fileEpoch = useRef(0);
  useEffect(()=>()=>{fileEpoch.current++;},[]);
  useEffect(()=>{
    let alive = true; setLinked(null); setLoadError("");
    if (!LUCYNA_UUID.test(deliveryId || "")) return ()=>{alive=false;};
    setLoading(true);
    (async()=>{
      try {
        const result = await supabase.from("ideahire_work_deliveries").select("id,conversation_id,agreement_id,summary,status,version").eq("id",deliveryId).maybeSingle();
        if (result.error || !result.data || result.data.status==="blocked") throw new Error("source");
        const delivery = result.data;
        const agreement = await supabase.from("conversation_agreements").select("id,title,scope,deliverables,acceptance_method").eq("id",delivery.agreement_id).maybeSingle();
        if (agreement.error || !agreement.data) throw new Error("source");
        if (!alive) return;
        const candidates = suggestedCriteria(agreement.data.scope,agreement.data.deliverables,agreement.data.acceptance_method);
        setCriteria(candidates.length ? candidates : [""]);
        setLinked({delivery,agreement:agreement.data});
      } catch { if (alive) setLoadError("Nie można odczytać tej pracy lub planu współpracy. Możesz sprawdzić materiał bez powiązania, wpisując kryteria ręcznie."); }
      finally { if (alive) setLoading(false); }
    })();
    return ()=>{alive=false;};
  },[supabase,user?.id,deliveryId]);
  async function chooseFile(event) {
    const file = event.target.files?.[0]; event.target.value=""; if (!file) return;
    const epoch = ++fileEpoch.current; setFileBusy(true);
    try {
      const value = await readReviewFile(file); if (epoch!==fileEpoch.current) return;
      setMaterial(value.text);setImage(value.image);setNote(value.note);setRights(false);setRedacted(false);
    } catch(error) { if (epoch===fileEpoch.current) onNotice(error.message || "Nie udało się odczytać pliku."); }
    finally { if (epoch===fileEpoch.current) setFileBusy(false); }
  }
  const chosen = criteria.map(c=>c.trim()).filter(Boolean);
  const invalid = !chosen.length || chosen.some(c=>c.length<8) || (!material.trim() && !image)
    || new TextEncoder().encode(material).length>12000 || !rights || !redacted || loading || fileBusy;
  return <section className="lu-tool-card"><div className="lu-tool-heading"><span>REZULTAT PRACY</span><h2>Sprawdź względem ustaleń</h2><p>Wybierz materiał i kryteria. Lucyna wskaże dowody, niezgodności oraz rzeczy wymagające dodatkowego sprawdzenia.</p></div>
    {loading && <p role="status">Odczytuję wskazaną pracę…</p>}{loadError && <p className="lu-tool-note" role="status">{loadError}</p>}
    {linked && <div className="lu-linked-work"><strong>{linked.agreement.title || "Plan współpracy"}</strong><span>Rezultat, wersja {linked.delivery.version}</span><p>{linked.delivery.summary}</p><small>Opis autora jest informacją o pracy. Do analizy wybierz właściwy materiał poniżej.</small></div>}
    <fieldset className="lu-criteria-input"><legend>Kryteria do sprawdzenia (1–6)</legend>{criteria.map((criterion,index)=><div key={index}><label><span className="lu-sr-only">Kryterium {index+1}</span><input value={criterion} minLength={8} maxLength={220} placeholder="Np. tekst zawiera trzy jasno opisane korzyści" onChange={e=>setCriteria(criteria.map((c,i)=>i===index ? e.target.value : c))} /></label>
      {criteria.length>1 && <button type="button" className="lu-text-button" aria-label={"Usuń kryterium "+(index+1)} onClick={()=>setCriteria(criteria.filter((_,i)=>i!==index))}>Usuń</button>}</div>)}
      {criteria.length<6 && <button type="button" className="lu-text-button" onClick={()=>setCriteria([...criteria,""])}>+ Dodaj kryterium</button>}</fieldset>
    <label>Wybrany tekst lub fragment kodu<AutoTextarea rows={6} value={material} maxLength={12000} onChange={e=>{setMaterial(e.target.value);setRedacted(false);}} placeholder="Wklej materiał do sprawdzenia. Nie wklejaj prywatnych danych ani instrukcji logowania." /></label>
    <label className="lu-file-picker">Wybierz plik (do 2 MB)<input type="file" disabled={fileBusy || busy} accept=".pdf,.txt,.md,.csv,.json,.html,.css,.js,.jsx,.ts,.tsx,.py,.sql,.jpg,.jpeg,.png,.webp" onChange={chooseFile} /></label>
    {note && <p className="lu-tool-note" role="status">{note}</p>}
    {image && <div className="lu-image-preview"><img src={image} alt="Wybrany obraz przygotowany do analizy" /><button type="button" className="lu-text-button" onClick={()=>{setImage("");setNote("");setRedacted(false);}}>Usuń obraz</button></div>}
    <label className="lu-check"><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)} /><span>Mam prawo udostępnić ten materiał do przetworzenia przez AI i nie naruszam poufności współpracy.</span></label>
    <label className="lu-check"><input type="checkbox" checked={redacted} onChange={e=>setRedacted(e.target.checked)} /><span>Sprawdziłem tekst i obraz; usunąłem dane osobowe, dane wrażliwe i tajemnice, które nie powinny trafić do dostawcy AI.</span></label>
    <button type="button" className="lu-primary" disabled={invalid || busy} onClick={()=>onReview({criteria:chosen,material,image:image || undefined,rights_confirmed:true,redaction_confirmed:true,
      ...(linked ? {source_delivery_id:linked.delivery.id,source_conversation_id:linked.delivery.conversation_id} : {})})}>{busy ? "Trwa analiza…" : "Sprawdź wybrany materiał z AI"}</button>
    <p className="lu-tool-note">Analiza zużywa jedną próbę z puli AI. Plik nie jest zapisywany w historii; zapisane mogą być kryteria i odpowiedź, w tym przytoczone fragmenty. Obraz nie potwierdza działania aplikacji, bezpieczeństwa ani zgodności prawnej.</p>
    {LUCYNA_UUID.test(conversationId || linked?.delivery?.conversation_id || "") && <span className="lu-tool-note">Możesz wrócić do współpracy przez zakładkę Wiadomości. Lucyna nie wysyła tam wyniku automatycznie.</span>}
  </section>;
}
export default function LucynaTools(props) {
  if (props.mode==="message") return <MessageTool {...props} />;
  if (props.mode==="brief") return <BriefTool {...props} />;
  if (props.mode==="review") return <ReviewTool {...props} />;
  return null;
}
