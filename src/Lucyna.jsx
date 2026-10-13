/* IdeaHire | Lucyna AI | P33 | 2026-10-13 | Poprawka odpowiedzi i rozpoznawania pytań. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { helpCenterHref } from "./MarketUI";
import { containsPrivateInput, downloadLucynaExport, LUCYNA_NOTICE_VERSION, localAnswer, weatherCity, revealAnswer } from "./LucynaCore";
import { knowledgeAnswer, LUCYNA_GUIDE, resolveLucynaMode } from "./LucynaKnowledge";
import { useLucynaMemory } from "./LucynaMemory";
import LucynaTools, { ReviewResult } from "./LucynaTools";
export { containsPrivateInput } from "./LucynaCore";
import "./Lucyna.css";

const CATEGORIES = ["Programowanie", "Grafika i design", "Marketing", "Copywriting", "Video",
  "Fotografia", "AI i automatyzacje", "Dane, analizy i research", "Biznes i e-commerce", "Architektura, wnętrza i CAD"];
const MODES = [
  { id: "chat", icon: "spark", title: "Porozmawiaj", short: "Rozmowa", text: "Podstawowe pytania, pomysły i pogoda.", example: "Hej, ile dziś stopni w Amsterdamie?" },
  { id: "message", icon: "edit", title: "Ułóż wiadomość", short: "Wiadomość", text: "Dobierz ton i przygotuj treść do współpracy.", example: "" },
  { id: "review", icon: "check", title: "Sprawdź rezultat", short: "Sprawdź pracę", text: "Kryteria, dowody i propozycje poprawek.", example: "" },
  { id: "freelancers", icon: "people", title: "Znajdź wykonawcę", short: "Wykonawcy", text: "Przygotuj filtry i poznaj dostępne profile.", example: "Szukam wykonawcy prostej strony internetowej." },
  { id: "jobs", icon: "work", title: "Znajdź zlecenie", short: "Zlecenia", text: "Wyszukaj aktywne projekty w swoim obszarze.", example: "Zajmuję się grafiką. Szukam zleceń na projektowanie logo." },
  { id: "brief", icon: "edit", title: "Przygotuj zlecenie", short: "Szkic zlecenia", text: "Jasny zakres, rezultat i kryteria odbioru.", example: "Potrzebuję strony dla restauracji. Pomóż mi przygotować opis zlecenia." },
  { id: "help", icon: "help", title: "Pomoc IdeaHire", short: "Pomoc", text: "Instrukcje konta, współpracy i korzystania ze strony.", example: "Jak uzupełnić portfolio i pokazać się w katalogu freelancerów?" },
];
const FAQ = LUCYNA_GUIDE.filter((item, index, all) => all.findIndex(other => other.id === item.id) === index);
const ERRORS = {
  user_limit: "Dzisiejszy limit generowania AI został wykorzystany. Pomoc IdeaHire i narzędzia lokalne pozostają dostępne.",
  global_limit: "Wspólna darmowa pula AI została dziś wykorzystana. Nadal możesz pytać o IdeaHire i korzystać z narzędzi lokalnych.",
  busy: "Lucyna obsługuje teraz inne rozmowy. Spróbuj ponownie za chwilę.",
  cooldown: "Poczekaj kilka sekund przed kolejną wiadomością.",
  duplicate: "To żądanie zostało już przyjęte. Poczekaj na wynik albo wyślij nowe pytanie.",
  setup: "Lucyna czeka na uruchomienie. Możesz już korzystać z katalogów i instrukcji pomocy.",
  disabled: "Rozmowy AI są teraz wyłączone. Katalogi i Centrum pomocy pozostają dostępne.",
  account: "Generowanie AI wymaga pełnego, aktywnego konta. Podstawowa pomoc IdeaHire pozostaje dostępna.",
  auth: "Sesja wygasła. Zaloguj się ponownie, aby porozmawiać z Lucyną.",
  private: "Usuń dane kontaktowe, numery dokumentów i klucze dostępu z treści wiadomości.",
  invalid: "Skróć wiadomość i spróbuj ponownie. Limit wynosi 2000 znaków i 3,6 kB tekstu.",
  size: "Wybrany materiał jest zbyt duży. Skróć tekst albo wybierz mniejszy obraz.",
  notice: "Przeczytaj informację o działaniu Lucyny i wybierz zapis historii przed użyciem AI.",
  legal_pending: "Lucyna jest w przygotowaniu do uruchomienia publicznego. Lokalne szablony i katalogi są dostępne.",
  free_setup: "Darmowa pula Lucyny czeka na konfigurację. Lokalne szablony i katalogi są dostępne.",
  review_pending: "Analiza pracy jest w przygotowaniu do udostępnienia. Możesz już przygotować własne kryteria odbioru.",
  review_input: "Sprawdź kryteria, wielkość materiału i potwierdzenia przed analizą.",
  source: "Nie masz dostępu do wskazanej pracy lub rozmowy. Nie wysłaliśmy materiału do AI.",
  weather: "Źródło pogody jest chwilowo niedostępne. Spróbuj później.",
  weather_limit: "Dzienna pula pobierania nowych prognoz została wyczerpana. Zapisane prognozy są nadal dostępne.",
  weather_disabled: "Pobieranie pogody jest teraz wyłączone.",
  weather_setup: "Pobieranie pogody czeka na konfigurację.",
  provider: "Nie udało się uzyskać odpowiedzi AI. Spróbuj później; katalogi i instrukcje nadal działają.",
  provider_auth: "Połączenie Lucyny z AI wymaga poprawienia klucza lub uprawnień przez obsługę IdeaHire. Instrukcje strony nadal działają.",
  provider_quota: "Wspólna darmowa pula dostawcy AI została dziś wyczerpana. Podstawowa pomoc IdeaHire nadal działa.",
  provider_busy: "Model AI jest teraz przeciążony. Spróbuj ponownie za chwilę.",
  provider_model: "Model Lucyny wymaga poprawienia konfiguracji przez obsługę IdeaHire.",
  provider_request: "Usługa AI odrzuciła format zapytania. Obsługa IdeaHire musi sprawdzić konfigurację połączenia.",
  provider_empty: "Model nie zwrócił treści odpowiedzi. Możesz ponowić pytanie.",
  provider_format: "Nie udało się odczytać odpowiedzi modelu. Możesz ponowić pytanie.",
  provider_stream: "Odpowiedź została przerwana. Otrzymana część pozostaje widoczna.",
  free_model: "Wybrany model wymaga płatnego planu. Połączenie zostało zatrzymane; obsługa IdeaHire musi ustawić bezpłatny model.",
  timeout: "Generowanie trwało zbyt długo. Zachowaliśmy otrzymaną część odpowiedzi.",
  unavailable: "Lucyna jest chwilowo niedostępna. Spróbuj później lub skorzystaj z katalogów i pomocy.",
};
const BLOCKED = new Set(["user_limit", "global_limit", "disabled", "setup", "account", "auth", "legal_pending"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const makeId = () => crypto.randomUUID();
const newConversation = () => ({ id: makeId(), title: "Nowa rozmowa", mode: "chat", messages: [] });

function Icon({ name = "spark", ...props }) {
  const paths = {
    spark: "m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4ZM20 2v4M18 4h4",
    people: "M16 21v-2a5 5 0 0 0-10 0v2M15 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM18 11a3 3 0 0 1 3 3v3",
    work: "M3 7h18v14H3ZM8 7V3h8v4M3 12l9 3 9-3",
    edit: "m4 16-1 5 5-1L20 8l-4-4ZM14 6l4 4M4 4h6",
    help: "M9 9a3 3 0 1 1 5 2c-1.2.8-2 1.2-2 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
    plus: "M12 5v14M5 12h14", close: "m6 6 12 12M18 6 6 18",
    send: "M12 20V4m-6 6 6-6 6 6", stop: "M6 6h12v12H6Z",
    history: "M3 4h18v16H3ZM8 4v16M12 9h5M12 13h5",
    copy: "M9 8h12v13H9ZM15 8V3H3v13h6",
    arrow: "M5 12h14m-6-6 6 6-6 6", check: "m5 12 4 4L19 6",
    shield: "m12 3 9 4v5c0 5-9 9-9 9s-9-4-9-9V7ZM8 12l3 3 5-6",
    exit: "M15 3h6v18h-6M13 8l-4 4 4 4M3 12h14",
    download: "M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4",
    trash: "M3 6h18M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7M14 10v7",
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}><path d={paths[name] || paths.spark} /></svg>;
}
function Mark({ small = false }) {
  return <span className={"lu-mark" + (small ? " is-small" : "")} aria-hidden="true"><span className="lu-mark-halo" /><Icon name="spark" /></span>;
}
function ThinkingIndicator() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => { const start = Date.now(); const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000); return () => clearInterval(timer); }, []);
  return <div className="lu-thinking" role="status"><span className="lu-thinking-dots" aria-hidden="true"><i /><i /><i /></span>
    <span>{elapsed >= 30 ? "To trwa dłużej niż zwykle…" : elapsed >= 12 ? "Jeszcze chwila…" : "Przygotowuję odpowiedź…"}</span></div>;
}
function Inline({ text }) {
  return String(text).split(/(\*\*[^*]+\*\*|\x60[^\x60]+\x60)/g).map((part, i) => part.startsWith("**") && part.endsWith("**")
    ? <strong key={i}>{part.slice(2, -2)}</strong>
    : part.charCodeAt(0) === 96 && part.charCodeAt(part.length - 1) === 96
      ? <code key={i}>{part.slice(1, -1)}</code> : <React.Fragment key={i}>{part}</React.Fragment>);
}
export function SafeText({ text }) {
  return <div className="lu-answer-text">{String(text).split(/\n{2,}/).map((block, i) => {
    const lines = block.split("\n");
    if (/^\x60{3}/.test(block)) return <pre key={i}><code>{block.replace(/^\x60{3}[^\n]*\n?|\n?\x60{3}$/g, "")}</code></pre>;
    if (lines.every(l => /^\s*[-*]\s+/.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*[-*]\s+/, "")} /></li>)}</ul>;
    if (lines.every(l => /^\s*\d+[.)]\s+/.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*\d+[.)]\s+/, "")} /></li>)}</ol>;
    if (lines.length === 1 && /^#{1,3}\s/.test(block)) return <h3 key={i}><Inline text={block.replace(/^#{1,3}\s+/, "")} /></h3>;
    return <p key={i}><Inline text={block} /></p>;
  })}</div>;
}
export async function readEvents(response, signal, onEvent) {
  if (!response.body) throw Object.assign(new Error("unavailable"), { code: "unavailable" });
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = "", finished = false, receivedText = false;
  const onAbort = () => { reader.cancel().catch(() => {}); };
  const frame = value => {
    const lines = value.split("\n");
    const event = lines.find(line => line.startsWith("event:"))?.slice(6).trim();
    const data = lines.filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n");
    if (!event || !data || finished) return;
    let payload;
    try { payload = JSON.parse(data); } catch { throw Object.assign(new Error(), {code:"provider_format"}); }
    if (event === "text" && typeof payload?.text === "string" && payload.text.trim()) receivedText = true;
    onEvent(event, payload);
    if (event === "done" || event === "error") finished = true;
  };
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    while (!finished) {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      const chunk = await reader.read();
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      if (chunk.done) break;
      buffer = (buffer + decoder.decode(chunk.value, { stream: true })).replace(/\r\n/g, "\n");
      if (buffer.length > 30_000) throw Object.assign(new Error(), {code:"provider_format"});
      let i;
      while (!finished && (i = buffer.indexOf("\n\n")) !== -1) { frame(buffer.slice(0, i)); buffer = buffer.slice(i + 2); }
    }
    if (!finished) { buffer += decoder.decode(); if (buffer.trim()) frame(buffer); }
    if (!finished) throw Object.assign(new Error(), {code:receivedText ? "provider_stream" : "provider_empty"});
  } finally { signal.removeEventListener("abort", onAbort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

function SourceLinks({ sources }) {
  const allowed = sources?.filter(s => LUCYNA_GUIDE.some(f => f.id === s.id)).slice(0, 3) || [];
  const weather = sources?.filter(s=>["https://www.met.no/en","https://creativecommons.org/licenses/by/4.0/"].includes(s.url)) || [];
  if (weather.length) return <div className="lu-sources"><span>Źródło prognozy</span>{weather.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title}<Icon name="arrow" /></a>)}</div>;
  return allowed.length ? <div className="lu-sources"><span>Instrukcje IdeaHire</span>{allowed.map(s =>
    <a key={s.id} href={helpCenterHref() + "#article/" + encodeURIComponent(s.id)}><Icon name="help" />{s.title}<Icon name="arrow" /></a>)}</div> : null;
}
function SearchBox({ mode, filters, onSearch, loading }) {
  const [query, setQuery] = useState(filters?.query || "");
  const [category, setCategory] = useState(filters?.category || "");
  const id = React.useId();
  return <form className="lu-search-box" onSubmit={event => { event.preventDefault(); onSearch({ query: query.trim().slice(0, 100), category }); }}>
    <div className="lu-search-title"><Icon name={mode === "jobs" ? "work" : "people"} /><strong>Filtry katalogu</strong><span>Możesz je zmienić</span></div>
    <div className="lu-search-fields">
      <label htmlFor={id + "-query"}>Hasło<input id={id + "-query"} value={query} maxLength={100} placeholder="Np. WordPress, logo, montaż"
        onChange={event => setQuery(event.target.value)} /></label>
      <label htmlFor={id + "-category"}>Kategoria<select id={id + "-category"} value={category} onChange={event => setCategory(event.target.value)}>
        <option value="">Wszystkie kategorie</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
      <button type="submit" className="lu-primary" disabled={loading}>{loading ? "Wyszukiwanie…" : "Przeszukaj katalog"}<Icon name="arrow" /></button>
    </div>
    <p>Wyniki pochodzą z katalogu. To wyszukiwanie działa również bez odpowiedzi AI.</p>
  </form>;
}
function Results({ mode, items, total }) {
  if (!items?.length) return <div className="lu-no-results"><Icon name={mode === "jobs" ? "work" : "people"} />
    <strong>Brak wyników dla tych filtrów</strong><p>Spróbuj krótszego hasła lub wybierz wszystkie kategorie.</p></div>;
  return <div className="lu-results"><div className="lu-results-heading"><strong>Wyniki katalogu</strong><span>{total} dostępnych wyników</span></div>
    <div className="lu-result-grid">{items.filter(row => UUID.test(row.id)).slice(0, 6).map(row =>
      <article className="lu-result-card" key={row.id}>
        <span className="lu-result-symbol" aria-hidden="true">{mode === "jobs" ? <Icon name="work" /> : String(row.name || "U").slice(0, 1).toUpperCase()}</span>
        <div><span className="lu-result-category">{mode === "jobs" ? row.category : row.specialization || "Profil freelancera"}</span>
          <h3>{mode === "jobs" ? row.title : row.name || "Freelancer"}</h3>
          <p>{mode === "jobs" ? row.description : String(row.about || "Poznaj informacje i realizacje na profilu.").slice(0, 160)}</p>
          {mode === "jobs" && <strong className="lu-result-budget">{row.budget_negotiable ? "Budżet do ustalenia" : new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 }).format(Number(row.budget) || 0)}</strong>}
          <Link to={mode === "jobs" ? "/jobs" : "/profile/" + row.id} state={mode === "jobs" ? { lucynaJobId: row.id, lucynaTitle: row.title } : undefined}>
            {mode === "jobs" ? "Zobacz zlecenie" : "Zobacz profil"}<Icon name="arrow" /></Link>
        </div>
      </article>)}</div>
    <p className="lu-result-note">{mode === "jobs" ? "Kolejność: najnowsze ogłoszenia." : "Kolejność odpowiada zwykłemu katalogowi IdeaHire."} Bez ocen osób przez AI.</p>
  </div>;
}

export default function Lucyna({ supabase, user, Navbar }) {
  const [params] = useSearchParams();
  const [conversations, setConversations] = useState(() => [newConversation()]);
  const [activeId, setActiveId] = useState(() => null);
  const active = useMemo(() => conversations.find(c => c.id === activeId) || conversations[0], [activeId, conversations]);
  const mode = MODES.find(m => m.id === active.mode) || MODES[0];
  const [draft, setDraft] = useState(""); const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ loading: true, enabled: false, remaining: null });
  const [notice, setNotice] = useState(""); const [searching, setSearching] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false); const [infoOpen, setInfoOpen] = useState(false);
  const [copied, setCopied] = useState(null); const [newBelow, setNewBelow] = useState(false);
  const [toolDraft,setToolDraft] = useState(""); const [deleting,setDeleting] = useState(false);
  const [historyChoice,setHistoryChoice] = useState(true);
  const memory = useLucynaMemory({supabase,user,conversations,setConversations});
  const initialRoute = useRef("");
  const routeTarget = useRef(null);
  const requestRef = useRef(null); const searchRef = useRef(null); const mounted = useRef(true);
  const listRef = useRef(null); const textareaRef = useRef(null); const scrollFrame = useRef(0);
  const followingRef = useRef(true); const pageRef = useRef(null); const infoRef = useRef(null);
  const infoTriggerRef = useRef(null); const historyTriggerRef = useRef(null); const sideRef = useRef(null);
  const userIdRef = useRef(user?.id); const ownerRef = useRef(user?.id); const mainRef = useRef(null);
  const patchMessage = useCallback((conversationId, messageId, values) => setConversations(all => all.map(c => c.id === conversationId
    ? { ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, ...values } : m) } : c)), []);
  const refreshStatus = useCallback(async () => {
    const uid = user?.id;
    try {
      const { data, error } = await supabase.rpc("ideahire_lucyna_v2_status");
      if (!mounted.current || uid !== userIdRef.current) return;
      if (error || !data) throw new Error("setup");
      const code = data.code || (!data.eligible ? "account" : !data.enabled ? "disabled" : !data.global_available ? "global_limit" : data.remaining <= 0 ? "user_limit" : "");
      setStatus({ ...data, loading: false, code });
    } catch { if (mounted.current && uid === userIdRef.current) setStatus({ loading: false, enabled: false, remaining: null, code: "setup" }); }
  }, [supabase, user?.id]);
  const stop = useCallback(() => {
    const current = requestRef.current;
    if (!current) return;
    requestRef.current = null; current.abort();
    patchMessage(current.conversationId, current.messageId, { status: "stopped" });
    setBusy(false);
  }, [patchMessage]);
  useEffect(() => {
    mounted.current = true; userIdRef.current = user?.id;
    if (ownerRef.current !== user?.id) {
      requestRef.current?.abort(); searchRef.current?.abort();
      requestRef.current = null; searchRef.current = null;
      ownerRef.current = user?.id;
      setConversations([newConversation()]); setActiveId(null); setDraft(""); setNotice("");
      setToolsOpen(false); setBusy(false); setSearching(false); setHistoryOpen(false); setInfoOpen(false); setToolDraft("");initialRoute.current="";
      setStatus({ loading: true, enabled: false, remaining: null });
    }
    refreshStatus();
    return () => { mounted.current = false; requestRef.current?.abort(); searchRef.current?.abort(); cancelAnimationFrame(scrollFrame.current); };
  }, [refreshStatus, user?.id]);
  useEffect(()=>{
    if (!memory.ready || busy) return;
    const key = user?.id+":"+params.toString();
    if (initialRoute.current===key) return;
    initialRoute.current=key;
    const requested = params.get("mode");
    if (!MODES.some(m=>m.id===requested)) return;
    if (params.get("delivery") || params.get("conversation")) {
      const c = {...newConversation(),mode:requested}; routeTarget.current=c.id;
      setConversations(all=>all[0]?.messages.length===0 ? [c,...all.slice(1)] : all.length<12 ? [c,...all] : all);
      if (conversations.length<12 || conversations[0]?.messages.length===0) setActiveId(c.id);
      else setNotice("Usuń wybraną rozmowę, aby utworzyć rozmowę dla tej pracy.");
    } else setConversations(all=>all.map((c,index)=>index===0 ? {...c,mode:requested} : c));
  },[params,memory.ready,user?.id,busy]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 900px)");
    const update = () => { setMobile(query.matches); if (!query.matches) setHistoryOpen(false); };
    query.addEventListener("change", update); return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const bodyOverflow = document.body.style.overflow, htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden"; document.documentElement.style.overflow = "hidden";
    return () => { document.body.style.overflow = bodyOverflow; document.documentElement.style.overflow = htmlOverflow; };
  }, []);
  useEffect(() => {
    const viewport = window.visualViewport;
    let naturalHeight = viewport?.height || window.innerHeight; let previousWidth = window.innerWidth;
    const update = () => {
      const header = pageRef.current?.parentElement?.querySelector(".account-navbar");
      const height = viewport?.height || window.innerHeight;
      const focused = document.activeElement === textareaRef.current;
      if (!focused || Math.abs(window.innerWidth - previousWidth) > 100) naturalHeight = height;
      previousWidth = window.innerWidth;
      pageRef.current?.style.setProperty("--lu-viewport", height + "px");
      pageRef.current?.style.setProperty("--lu-offset-top", (viewport?.offsetTop || 0) + "px");
      pageRef.current?.style.setProperty("--lu-navbar", (header?.getBoundingClientRect().height ?? 170) + "px");
      if (pageRef.current) pageRef.current.dataset.keyboard = String(window.matchMedia("(max-width:900px)").matches
        && focused && height < naturalHeight - 120);
    };
    update(); viewport?.addEventListener("scroll", update); viewport?.addEventListener("resize", update); window.addEventListener("resize", update);
    document.addEventListener("focusin", update); document.addEventListener("focusout", update);
    return () => { viewport?.removeEventListener("scroll", update); viewport?.removeEventListener("resize", update); window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update); document.removeEventListener("focusout", update); };
  }, []);
  useEffect(() => {
    const panel = infoOpen ? infoRef.current : mobile && historyOpen ? sideRef.current : null;
    if (!panel) return;
    const before = document.activeElement; const first = panel.querySelector("button,a,input,select");
    first?.focus({ preventScroll: true });
    const keyboard = event => {
      if (event.key === "Escape") { event.preventDefault(); setInfoOpen(false); setHistoryOpen(false); }
      if (event.key === "Tab") {
        const elements = [...panel.querySelectorAll("button,a,input,select,[tabindex='0']")].filter(el => !el.disabled);
        const first = elements[0]; const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.removeEventListener("keydown", keyboard); before?.isConnected && before.focus({ preventScroll: true }); };
  }, [infoOpen, mobile, historyOpen]);
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = Math.min(144, textareaRef.current.scrollHeight) + "px";
  }, [draft]);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (followingRef.current) {
      cancelAnimationFrame(scrollFrame.current);
      scrollFrame.current = requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
    } else setNewBelow(true);
  }, [active.messages]);
  useEffect(() => { followingRef.current = true; setNewBelow(false); if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [active.id]);
  function chooseMode(id) {
    if (busy) return;
    setConversations(all => all.map(c => c.id === active.id ? { ...c, mode: id } : c));
    setToolsOpen(["brief", "message", "review"].includes(id));
    textareaRef.current?.focus({ preventScroll: true });
  }
  function startNew() {
    if (conversations.length>=12) {setNotice("Masz już 12 rozmów. Pobierz kopię i usuń wybraną rozmowę przed utworzeniem nowej.");return;}
    stop(); searchRef.current?.abort(); searchRef.current = null; setSearching(false); const c = newConversation();
    setConversations(all => [c, ...all]); setActiveId(c.id); setDraft("");setToolDraft(""); setNotice(""); setHistoryOpen(false); setToolsOpen(false);
    followingRef.current = true; textareaRef.current?.focus({ preventScroll: true });
  }
  async function deleteConversation(id) {
    if (deleting || !window.confirm("Usunąć tę rozmowę z historii Lucyny na koncie i z bieżącej sesji?")) return;
    if (busy) stop();
    searchRef.current?.abort();setDeleting(true);
    try {
      await memory.remove(id);
      setConversations(all => { const rest = all.filter(c => c.id !== id); return rest.length ? rest : [newConversation()]; });
      if (id === active.id) setActiveId(null);
    } catch {setNotice("Nie udało się usunąć rozmowy z konta. Spróbuj ponownie.");}
    finally {setDeleting(false);}
  }
  async function clearHistory() {
    if (deleting || !window.confirm("Usunąć wszystkie rozmowy Lucyny z konta i bieżącej sesji? Tej czynności nie można cofnąć.")) return;
    stop();searchRef.current?.abort();setDeleting(true);
    try {await memory.clear();setConversations([newConversation()]);setActiveId(null);setToolDraft("");setNotice("Usunięto historię Lucyny.");}
    catch {setNotice("Nie udało się usunąć historii z konta. Spróbuj ponownie.");}
    finally {setDeleting(false);}
  }
  async function runSearch(filters, conversationId = active.id, messageId = null, searchMode = active.mode) {
    if (searchRef.current) return;
    if (!messageId && active.messages.length>=40) {setNotice("Ta rozmowa osiągnęła 40 wiadomości. Zacznij nową rozmowę.");return;}
    if (containsPrivateInput(filters.query)) { setNotice(ERRORS.private); return; }
    const controller = new AbortController(); searchRef.current = controller; setSearching(true); setNotice("");
    const id = messageId || makeId();
    if (!messageId) setConversations(all => all.map(c => c.id === conversationId
      ? { ...c, messages: [...c.messages, { id, role: "assistant", text: "Przeszukuję katalog według wybranych filtrów.", status: "catalog", filters, searchMode }] } : c));
    try {
      const operation = searchMode === "jobs"
        ? supabase.rpc("ideahire_lucyna_search_jobs", { p_search: filters.query || null, p_category: filters.category || null, p_limit: 6 })
        : supabase.rpc("list_ideahire_freelancers", { p_search: filters.query || null, p_category: filters.category || null, p_offset: 0, p_limit: 6 });
      const { data, error } = await operation.abortSignal(controller.signal);
      if (controller.signal.aborted || !mounted.current) return;
      if (error) throw new Error("catalog");
      const value = Array.isArray(data) ? data[0] : data;
      patchMessage(conversationId, id, { text: "Wyniki dla zatwierdzonych filtrów.", status: "catalog", filters,
        items: value?.items || [], total: Number(value?.total) || 0 });
    } catch {
      if (!controller.signal.aborted && mounted.current) patchMessage(conversationId, id,
        { text: "Nie udało się pobrać katalogu. Możesz przejść do niego bezpośrednio i spróbować ponownie.", status: "catalog-error" });
    } finally { if (searchRef.current === controller) { searchRef.current = null; if (mounted.current) setSearching(false); } }
  }
  async function animateResult(result, controller, conversationId, messageId) {
    const text = String(result.text).slice(0, 8000);
    patchMessage(conversationId, messageId, { sources: result.sources, kind: result.kind,
      provenance: result.provenance || { ai_generated: false, method: "ideahire-guide" } });
    await revealAnswer(text, controller.signal, visible => {
      if (mounted.current && requestRef.current === controller)
        patchMessage(conversationId, messageId, { text: visible, status: "streaming" });
    });
    if (mounted.current && requestRef.current === controller)
      patchMessage(conversationId, messageId, { text, status: "done", partial: !!result.partial });
  }
  async function send(event, options = {}) {
    event?.preventDefault();
    if (requestRef.current || deleting || !(options.text || draft).trim()) return;
    if (!memory.ready) { setNotice("Wczytuję ustawienia historii. Spróbuj za chwilę."); return; }
    const text = (options.text || draft).trim();
    const sendMode = resolveLucynaMode(text, options.mode || (active.mode === "review" ? "chat" : active.mode), !!options.review);
    if (active.messages.length > 38) { setNotice("Ta rozmowa jest już pełna. Pobierz kopię lub zacznij nową rozmowę."); return; }
    if (text.length > 2000 || new TextEncoder().encode(text).length > 3600) { setNotice(ERRORS.invalid); return; }
    if (containsPrivateInput(text)) { setNotice(ERRORS.private); return; }
    if (options.review && [options.review.material, ...options.review.criteria].some(containsPrivateInput)) { setNotice(ERRORS.private); return; }
    const guide = !options.review && !["jobs", "freelancers"].includes(sendMode) ? knowledgeAnswer(text) : null;
    const local = !options.review && !guide ? localAnswer(text) : null;
    const simple = guide || (local ? { text: local, sources: [], kind: "local" } : null);
    const isWeather = ["chat", "help"].includes(sendMode) && weatherCity(text) !== null;
    if (!simple && !memory.acknowledged) { setNotice(ERRORS.notice); setInfoOpen(true); return; }
    if (!simple && (status.loading || BLOCKED.has(status.code) && !(isWeather && ["user_limit", "global_limit"].includes(status.code)))) {
      setNotice(ERRORS[status.code] || ERRORS.unavailable); return;
    }
    const conversationId = active.id, messageId = makeId(), requestId = makeId(), ownerId = user?.id;
    const controller = new AbortController();
    controller.conversationId = conversationId; controller.messageId = messageId; requestRef.current = controller;
    setBusy(true); setDraft(""); setNotice(""); followingRef.current = true;
    setConversations(all => all.map(c => c.id === conversationId ? { ...c, title: c.messages.length ? c.title : text.slice(0, 52),
      ...(options.review ? { sourceDeliveryId: options.review.source_delivery_id || null, sourceConversationId: options.review.source_conversation_id || null } : {}),
      messages: [...c.messages, { id: makeId(), role: "user", text, status: "done", createdAt: new Date().toISOString() },
        { id: messageId, role: "assistant", text: "", status: "loading", createdAt: new Date().toISOString(),
          provenance: simple ? { ai_generated: false, method: "ideahire-guide" } : { ai_generated: true, verified: false }, kind: simple?.kind || "ai" }] } : c));
    const timer = window.setTimeout(() => controller.abort(), 65_000);
    try {
      if (simple) { await animateResult(simple, controller, conversationId, messageId); return; }
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session?.access_token || data.session.user?.id !== ownerId || userIdRef.current !== ownerId
        || controller.signal.aborted || requestRef.current !== controller) throw Object.assign(new Error(), { code: "auth" });
      const response = await fetch(String(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, "") + "/functions/v1/ideahire-lucyna", {
        method: "POST", headers: { Authorization: "Bearer " + data.session.access_token,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, mode: sendMode, message: text, notice_version: LUCYNA_NOTICE_VERSION,
          ...(options.review ? { review: options.review } : {}),
          notes: options.review ? "" : active.messages.filter(m => m.role === "user" && !containsPrivateInput(m.text)).slice(0, -2).map(m => m.text).join("\n").slice(-1200),
          history: options.review ? [] : active.messages.filter(m => m.status === "done" && !m.filters && !m.items && !m.review && !containsPrivateInput(m.text))
            .slice(-4).map(m => ({ role: m.role, content: m.text.slice(-1500) })) }), signal: controller.signal,
      });
      if (requestRef.current !== controller) return;
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw Object.assign(new Error(), { code: response.status === 401 ? "auth" : detail.code || "unavailable", detail });
      }
      if (response.headers.get("content-type")?.includes("application/json")) {
        const result = await response.json();
        if (requestRef.current !== controller || !mounted.current) return;
        if (result.filters) {
          if (!CATEGORIES.includes(result.filters.category) && result.filters.category !== "") throw new Error("provider");
          patchMessage(conversationId, messageId, { text: "Przygotowałam filtry. Sprawdź je i zatwierdź wyszukiwanie w katalogu.", filters: result.filters,
            searchMode: sendMode, status: "done", provenance: result.provenance });
        } else if (Array.isArray(result.review?.criteria)) {
          patchMessage(conversationId, messageId, { text: "Wstępne sprawdzenie materiału względem Twoich kryteriów.", review: result.review,
            provenance: result.provenance, kind: "review", status: "done" });
        } else if (typeof result.text === "string") await animateResult(result, controller, conversationId, messageId);
        else throw new Error("provider");
        if (Number.isInteger(result.remaining)) setStatus(old => ({ ...old, remaining: result.remaining, code: result.remaining === 0 ? "user_limit" : "" }));
      } else {
        let completed = false, failed = false, receivedText = "";
        await readEvents(response, controller.signal, (eventName, value) => {
        if (requestRef.current !== controller || !mounted.current) return;
        if (eventName === "meta") {
          patchMessage(conversationId, messageId, { sources: value.sources });
          setStatus(old => ({ ...old, remaining: value.remaining, code: value.remaining === 0 ? "user_limit" : "" }));
        } else if (eventName === "text" && typeof value.text === "string") {
          receivedText = value.text.slice(0, 8000);
          patchMessage(conversationId, messageId, { text: receivedText, status: "streaming" });
        } else if (eventName === "done") {
          if (!receivedText.trim()) throw Object.assign(new Error(), { code: "provider_empty" });
          completed = true;
          patchMessage(conversationId, messageId, { status: "done", partial: !!value.partial, provenance: value.provenance });
        } else if (eventName === "error") {
          failed = true;
          throw Object.assign(new Error(), { code: value.code || "provider", detail: value });
        }
        });
        if (!completed && !failed && requestRef.current === controller && !controller.signal.aborted)
          throw Object.assign(new Error(), { code: receivedText.trim() ? "provider_stream" : "provider_empty" });
      }
    } catch (error) {
      if (requestRef.current !== controller || !mounted.current) return;
      const code = error.name === "AbortError" ? "timeout" : error.code || "provider";
      const reference = UUID.test(error.detail?.request_id || "") ? error.detail.request_id : requestId;
      const message = (ERRORS[code] || ERRORS.unavailable) + "\nIdentyfikator zgłoszenia: " + reference;
      patchMessage(conversationId, messageId, { status: "error", error: message });
      if (BLOCKED.has(code) || Number.isInteger(error.detail?.remaining)) setStatus(old => ({ ...old,
        ...(Number.isInteger(error.detail?.remaining) ? { remaining: error.detail.remaining } : {}),
        code: BLOCKED.has(code) ? code : error.detail?.remaining === 0 ? "user_limit" : old.code }));
    } finally {
      window.clearTimeout(timer);
      if (requestRef.current === controller) {
        requestRef.current = null;
        if (mounted.current) { setBusy(false); if (!simple) refreshStatus(); }
      }
    }
  }

  async function copy(message) {
    const text = message.review ? [message.review.summary,...message.review.criteria.map(c=>c.criterion+": "+c.status+"\n"+c.reason+(c.quote ? "\nCytat: "+c.quote : "")+(c.fix ? "\nPoprawka: "+c.fix : ""))].join("\n\n") : message.text;
    try { await navigator.clipboard.writeText((message.provenance?.ai_generated ? "[Propozycja wygenerowana przez AI — Lucyna AI / IdeaHire]\n\n" : "")+text); setCopied(message.id); window.setTimeout(() => mounted.current && setCopied(null), 1800); }
    catch { setNotice("Nie udało się skopiować. Możesz zaznaczyć tekst i skopiować go ręcznie."); }
  }
  const isSearch = ["freelancers", "jobs"].includes(active.mode);
  function useToolDraft(text) {setDraft(text.slice(0,2000));setNotice("Propozycja jest w polu wiadomości. Sprawdź ją i wybierz wysłanie do Lucyny, aby skorzystać z AI.");textareaRef.current?.focus({preventScroll:true});}
  function useCorrection(text) {chooseMode("message");setToolDraft(text);setNotice("Przygotowano szkic wiadomości. Sprawdź punkty względem uzgodnień przed wysłaniem drugiej stronie.");}
  return <div className="lucyna-route">
    <section className={"lucyna-root" + (sidebarCollapsed ? " is-sidebar-hidden" : "")}
      ref={pageRef} aria-label="Lucyna AI — asystentka IdeaHire">
      <div className="lu-shell">
        {mobile && historyOpen && <button className="lu-drawer-shade" type="button"
          aria-label="Zamknij historię rozmów" onClick={() => setHistoryOpen(false)} />}
        <aside className={"lu-sidebar" + (historyOpen ? " is-open" : "")} ref={sideRef}
          aria-label="Historia Lucyny AI" aria-hidden={mobile && !historyOpen || !mobile && sidebarCollapsed ? true : undefined}
          inert={mobile && !historyOpen || !mobile && sidebarCollapsed ? "" : undefined}>
          <div className="lu-sidebar-brand"><Link to="/account" aria-label="Wróć do IdeaHire">IdeaHire<span>Twój warsztat współpracy</span></Link>
            <button className="lu-icon-button" type="button" aria-label="Zamknij historię"
              onClick={() => mobile ? setHistoryOpen(false) : setSidebarCollapsed(true)}><Icon name="history" /></button></div>
          <button type="button" className="lu-new-button" disabled={!memory.ready || deleting}
            onClick={startNew}><Icon name="plus" />Nowa rozmowa</button>
          <div className="lu-sidebar-label">Rozmowy</div>
          <nav className="lu-history-list" aria-label="Rozmowy z Lucyną AI">
            {conversations.map(c => <div key={c.id} className={"lu-history-item" + (c.id === active.id ? " is-active" : "")}>
              <button type="button" aria-current={c.id === active.id ? "true" : undefined}
                onClick={() => { stop(); setActiveId(c.id); setDraft(""); setNotice(""); setHistoryOpen(false); setToolDraft(""); }}>
                <Icon name="spark" /><span>{c.title}</span></button>
              <button type="button" className="lu-delete-conversation" disabled={deleting || !memory.ready}
                aria-label={"Usuń rozmowę: " + c.title} onClick={() => deleteConversation(c.id)}><Icon name="trash" /></button>
            </div>)}
          </nav>
          <div className="lu-sidebar-bottom">
            <button className="lu-sidebar-link" type="button" onClick={() => setInfoOpen(true)}><Icon name="shield" />Historia i prywatność</button>
            <button className="lu-sidebar-link" type="button" onClick={() => downloadLucynaExport(conversations)}><Icon name="download" />Pobierz rozmowy</button>
            <button className="lu-sidebar-link" type="button" disabled={deleting || !memory.ready} onClick={clearHistory}><Icon name="trash" />Usuń historię</button>
            <a className="lu-sidebar-link" href={helpCenterHref()}><Icon name="help" />Centrum pomocy<Icon name="arrow" /></a>
            <Link className="lu-sidebar-account" to="/account"><span className="lu-user-initial">{String(user?.user_metadata?.full_name || user?.user_metadata?.name || "Ty").slice(0, 1).toUpperCase()}</span>
              <span>Twoje konto<small>{!memory.ready ? "Wczytuję ustawienia…" : memory.saving ? "Zapisuję rozmowę…" : memory.acknowledged && memory.historyEnabled ? "Historia zapisywana na koncie" : "Rozmowa w bieżącej sesji"}</small></span><Icon name="arrow" /></Link>
          </div>
        </aside>
        <main className="lu-main" ref={mainRef} inert={mobile && historyOpen || infoOpen ? "" : undefined}>
          <header className="lu-chat-toolbar">
            <div className="lu-toolbar-identity">
              <button type="button" className="lu-icon-button lu-history-toggle" ref={historyTriggerRef}
                aria-label={mobile ? "Otwórz historię rozmów" : sidebarCollapsed ? "Pokaż historię rozmów" : "Ukryj historię rozmów"}
                aria-expanded={mobile ? historyOpen : !sidebarCollapsed}
                onClick={() => mobile ? setHistoryOpen(true) : setSidebarCollapsed(value => !value)}><Icon name="history" /></button>
              <Mark small /><div><h1>Lucyna <span>AI</span></h1><p>{busy ? "Przygotowuję odpowiedź" : mode.id === "chat" ? "Twoja asystentka w IdeaHire" : mode.title}</p></div>
            </div>
            <div className="lu-toolbar-actions"><span className="lu-free-badge"><span className="lu-status-dot" />Bezpłatnie</span>
              <button type="button" className={"lu-tools-toggle" + (toolsOpen ? " is-active" : "")}
                aria-label="Narzędzia Lucyny AI" aria-expanded={toolsOpen} aria-controls="lucyna-tools" onClick={() => setToolsOpen(value => !value)}><Icon name="spark" /><span>Narzędzia</span></button>
              <button className="lu-icon-button lu-toolbar-info" type="button" ref={infoTriggerRef}
                aria-label="Jak działa Lucyna AI i prywatność" onClick={() => setInfoOpen(true)}><Icon name="shield" /></button>
              <Link to="/account" className="lu-icon-button" aria-label="Wróć do IdeaHire"><Icon name="exit" /></Link>
            </div>
          </header>
          {toolsOpen && <div id="lucyna-tools" className="lu-mode-bar" aria-label="Zadanie Lucyny AI">
            {MODES.map(m => <button key={m.id} type="button" disabled={busy} className={active.mode === m.id ? "is-active" : ""}
              aria-pressed={active.mode === m.id} onClick={() => chooseMode(m.id)}><Icon name={m.icon} /><span>{m.short}</span></button>)}
          </div>}
          <div className={"lu-messages" + (!active.messages.length ? " is-empty" : "")} ref={listRef}
            role="region" aria-label="Treść rozmowy" aria-busy={busy}
            onScroll={() => { const el = listRef.current; followingRef.current = el.scrollHeight - el.clientHeight - el.scrollTop < 100; if (followingRef.current) setNewBelow(false); }}>
            {memory.ready && !memory.acknowledged && <section className="lu-first-notice" aria-label="Przed rozmową z Lucyną AI">
              <div><Icon name="shield" /><strong>Ty wybierasz, czy zapamiętywać rozmowy</strong></div>
              <p>Generowanie AI przekazuje pytanie i krótki kontekst do Cloudflare. Podstawowa pomoc IdeaHire działa bez wywoływania modelu.</p>
              <label className="lu-check"><input type="checkbox" checked={historyChoice} onChange={e => setHistoryChoice(e.target.checked)} />
                <span>Zapamiętuj rozmowy na moim koncie przez maksymalnie 30 dni od ostatniego zapisu. Mogę je pobrać i usunąć.</span></label>
              <div className="lu-tool-actions"><button type="button" className="lu-text-button" onClick={() => setInfoOpen(true)}>Jak chronimy dane?</button>
                <button type="button" className="lu-primary" disabled={memory.ackSaving}
                  onClick={() => memory.acknowledge(historyChoice).catch(() => setNotice("Nie udało się zapisać ustawienia. Spróbuj ponownie."))}>Rozumiem, rozpocznij<Icon name="check" /></button></div>
            </section>}
            {memory.memoryError && <p className="lu-memory-error" role="status">{memory.memoryError}</p>}
            {!active.messages.length && !["message", "review", "brief"].includes(active.mode) && <div className="lu-welcome">
              <div className="lu-welcome-mark"><Mark /><span className="lu-welcome-orbit" /></div>
              <span className="lu-welcome-eyebrow">LUCYNA AI · IDEAHIRE</span>
              <h2>W czym mogę<br /><span>Ci dzisiaj pomóc?</span></h2>
              <p>Od pierwszego pomysłu do dobrze ustalonej współpracy.</p>
              <div className="lu-starter-grid">
                <button type="button" onClick={() => { chooseMode("chat"); send(null, { text: "Czym jest IdeaHire?", mode: "chat" }); }} disabled={!memory.ready || busy}><Icon name="help" /><strong>Poznaj IdeaHire</strong><span>Jak działa strona i od czego zacząć</span><Icon name="arrow" /></button>
                {MODES.filter(m => ["brief", "freelancers", "jobs"].includes(m.id)).map(m => <button key={m.id} type="button"
                  onClick={() => { chooseMode(m.id); setDraft(m.example); }}><Icon name={m.icon} /><strong>{m.title}</strong><span>{m.text}</span><Icon name="arrow" /></button>)}
              </div>
              <div className="lu-welcome-note"><span /><span>Podstawowe pytania o IdeaHire bez zużywania puli AI</span></div>
            </div>}
            {isSearch && !active.messages.length && <SearchBox mode={active.mode} onSearch={filters => runSearch(filters)} loading={searching} />}
            {active.mode === "help" && !active.messages.length && <div className="lu-faq-links"><span>Przewodnik po IdeaHire</span>{FAQ.slice(0, 4).map(f =>
              <button key={f.id} type="button" disabled={!memory.ready || busy} onClick={() => send(null, { text: f.title, mode: "help" })}><Icon name="help" /><span>{f.title}</span><Icon name="arrow" /></button>)}</div>}
            <LucynaTools key={active.id + ":" + active.mode} mode={active.mode} supabase={supabase} user={user} busy={busy}
              onUseDraft={useToolDraft} onNotice={setNotice} initialDraft={toolDraft}
              deliveryId={active.sourceDeliveryId || (routeTarget.current === active.id ? params.get("delivery") : null)}
              conversationId={active.sourceConversationId || (routeTarget.current === active.id ? params.get("conversation") : null)}
              onReview={review => send(null, { text: "Sprawdź wybrany materiał względem kryteriów:\n" + review.criteria.map((c, i) => (i + 1) + ". " + c).join("\n"), mode: "review", review })} />
            {active.messages.map(message => <article key={message.id} className={"lu-message is-" + message.role}
              data-ai-generated={message.provenance?.ai_generated ? "true" : "false"} data-ai-model={message.provenance?.model}
              data-ai-output-sha256={message.provenance?.answer_sha256}>
              <div className="lu-message-avatar">{message.role === "assistant" ? <Mark small /> : <span aria-hidden="true">Ty</span>}</div>
              <div className="lu-message-content"><span className="lu-message-author">{message.role === "assistant" ? message.status?.startsWith("catalog") ? "Katalog IdeaHire" : "Lucyna AI" : "Ty"}</span>
                {message.text && <SafeText text={message.text} />}
                {message.review && <ReviewResult review={message.review} onDraft={useCorrection} />}
                {message.status === "loading" && <ThinkingIndicator />}
                {message.status === "streaming" && <span className="lu-stream-cursor" aria-label="Odpowiedź jest wyświetlana" />}
                {message.filters && <SearchBox key={JSON.stringify(message.filters)} mode={message.searchMode} filters={message.filters} loading={searching}
                  onSearch={filters => runSearch(filters, active.id, message.id, message.searchMode)} />}
                {message.items && <Results mode={message.searchMode} items={message.items} total={message.total} />}
                <SourceLinks sources={message.sources} />
                {message.error && <p className="lu-message-error" role="status">{message.error}</p>}
                {message.status === "stopped" && <span className="lu-message-note">Generowanie zatrzymane.</span>}
                {message.partial && <span className="lu-message-note">Odpowiedź jest częściowa.</span>}
                {message.role === "assistant" && !["loading", "streaming"].includes(message.status) && (message.text || message.review) && <div className="lu-message-actions">
                  <button type="button" onClick={() => copy(message)}><Icon name={copied === message.id ? "check" : "copy"} />{copied === message.id ? "Skopiowano" : "Kopiuj"}</button>
                  {message.provenance?.ai_generated && <span>Wygenerowano z AI</span>}
                  {message.kind === "guide" && <span>Wiedza IdeaHire · bez zużycia puli AI</span>}
                </div>}
              </div>
            </article>)}
          </div>
          {newBelow && <button type="button" className="lu-jump-bottom" onClick={() => { followingRef.current = true; listRef.current.scrollTop = listRef.current.scrollHeight; setNewBelow(false); }}><Icon name="arrow" />Nowsze wiadomości</button>}
          <div className="lu-composer-area">
            {(notice || status.code) && <div className="lu-notice" role="status"><Icon name="help" /><p>{notice || ERRORS[status.code]}</p>
              {["setup", "disabled", "global_limit", "user_limit", "account"].includes(status.code) && <button type="button" onClick={refreshStatus}>Sprawdź dostępność</button>}</div>}
            <form className={"lu-composer" + (busy ? " is-busy" : "")} onSubmit={send}>
              <label className="lu-sr-only" htmlFor="lucyna-message">Wiadomość do Lucyny AI</label>
              <textarea id="lucyna-message" ref={textareaRef} rows={1} maxLength={2000} value={draft}
                placeholder={isSearch ? "Opisz, kogo lub jakiego zlecenia szukasz…" : active.mode === "brief" ? "Opisz pomysł na zlecenie…" : "Napisz do Lucyny AI…"}
                onChange={event => setDraft(event.target.value)} onKeyDown={event => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && !window.matchMedia("(pointer: coarse)").matches) { event.preventDefault(); if (!busy) send(); }
                }} />
              {busy ? <button className="lu-send" type="button" onClick={stop} aria-label="Zatrzymaj odpowiedź"><Icon name="stop" /></button>
                : <button className="lu-send" type="submit" disabled={!draft.trim() || !memory.ready || deleting} aria-label="Wyślij wiadomość do Lucyny AI"><Icon name="send" /></button>}
            </form>
            <div className="lu-composer-meta"><span>Lucyna AI może się mylić. Sprawdź ważne informacje.</span>
              <span>{status.loading ? "Sprawdzam pulę AI…" : status.remaining == null ? "Pomoc IdeaHire bez zużycia puli AI" : status.remaining + " / " + (status.limit || 20) + " prób AI na dziś"}{draft.length > 1600 ? " · " + draft.length + "/2000" : ""}</span></div>
          </div>
        </main>
      </div>
      {infoOpen && <div className="lu-info-shade" onPointerDown={event => { if (event.target === event.currentTarget) setInfoOpen(false); }}>
        <section className="lu-info-dialog" role="dialog" aria-modal="true" aria-labelledby="lucyna-info-title" ref={infoRef}>
          <button className="lu-icon-button" type="button" aria-label="Zamknij informacje" onClick={() => setInfoOpen(false)}><Icon name="close" /></button>
          <Mark small /><h2 id="lucyna-info-title">Lucyna AI i Twoje dane</h2>
          <p>Rozmawiasz z asystentką AI IdeaHire. Pomagam w pytaniach, tekstach i przygotowaniu współpracy.</p>
          <ul><li>Podstawowe instrukcje IdeaHire i obliczenia prowizji działają bez wysyłania pytania do modelu.</li>
            <li>Generowanie AI przekazuje Cloudflare pytanie, krótki kontekst i materiały wybrane przez Ciebie.</li>
            <li>Jeśli włączysz zapis, historia pozostaje na Twoim koncie w Supabase do 30 dni od ostatniego zapisu. Możesz ją pobrać i usunąć.</li>
            <li>Wybrany plik nie jest przechowywany w historii. Odpowiedź może zawierać cytaty z materiału.</li>
            <li>Nie wklejaj haseł, numerów dokumentów, danych wrażliwych ani materiałów poufnych.</li>
            <li>Do 20 prób generowania dziennie na konto w ramach wspólnej darmowej puli. Także przerwana lub nieudana próba może zużyć limit. Reset o północy UTC.</li>
            <li>Prognoza pochodzi z MET Norway, dla centrum wskazanego miasta. Nie korzystamy z GPS urządzenia.</li>
            <li>Ty zatwierdzasz filtry i podejmujesz decyzje. Lucyna AI nie wysyła wiadomości, nie akceptuje prac i nie wykonuje płatności.</li></ul>
          <label className="lu-check"><input type="checkbox" disabled={memory.ackSaving} checked={memory.acknowledged ? memory.historyEnabled : historyChoice}
            onChange={e => memory.acknowledged ? memory.acknowledge(e.target.checked).catch(() => setNotice("Nie udało się zmienić ustawienia historii.")) : setHistoryChoice(e.target.checked)} /><span>Zapamiętuj rozmowy na moim koncie</span></label>
          <p className="lu-tool-note">Wyłączenie zapisu nie usuwa wcześniejszych rozmów.</p>
          <Link to="/polityka-prywatnosci">Polityka prywatności<Icon name="arrow" /></Link>
          <button className="lu-primary" type="button" disabled={memory.ackSaving} onClick={() => {
            if (memory.acknowledged) setInfoOpen(false);
            else memory.acknowledge(historyChoice).then(() => setInfoOpen(false)).catch(() => setNotice("Nie udało się zapisać ustawienia. Spróbuj ponownie."));
          }}>Rozumiem<Icon name="check" /></button>
        </section>
      </div>}
    </section>
  </div>;
}
