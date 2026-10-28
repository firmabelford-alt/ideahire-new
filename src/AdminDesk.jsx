import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, ClipboardList, FileText, History, LayoutDashboard, LockKeyhole, LogOut, Menu, MessageSquare, Search, ShieldCheck, Users, X } from 'lucide-react';
import { BrandSignature } from './Brand';
import { FormSelect } from './FormControls';
import { adminActionLabel, adminQueueSearch, adminQueuePage } from './AdminDomain';
import { privacyCall } from './PrivacyRequests';
import LucynaSymbol from './LucynaSymbol';
import { requestLucynaDock } from './LucynaDock';
import './AdminDesk.css';

const navigation = [
  ['/admin','Sprawy i spory',LayoutDashboard], ['/admin/privacy','Wnioski RODO',ClipboardList],
  ['/admin/privacy?type=erasure','Usuwanie danych',LockKeyhole], ['/admin/jobs','Ogłoszenia',FileText],
  ['/admin/messages','Wiadomości dowodowe',MessageSquare], ['/admin/moderation','Moderacja',ShieldCheck],
  ['/admin?view=activity','Rejestr działań',History], ['/admin?view=access','Dostęp zespołu',Users,'owner'], ['/admin/lucyna','Lucyna i instrukcje',MessageSquare],
];
export function AdminNavigation({ name, role, onLogout, assistantEnabled = true }) {
  const location = useLocation(), [open,setOpen] = useState(false), dialog = useRef(null);
  const query = new URLSearchParams(location.search);
  useLayoutEffect(() => { document.body.classList.add('ih-admin-mode'); return () => document.body.classList.remove('ih-admin-mode'); }, []);
  useEffect(() => { setOpen(false); }, [location.pathname,location.search]);
  useEffect(() => { if(open && !dialog.current?.open) dialog.current?.showModal(); if(!open && dialog.current?.open) dialog.current.close(); }, [open]);
  const active = to => {
    if(to === '/admin') return (location.pathname === '/admin' && !query.get('view')) || location.pathname.startsWith('/disputes/');
    if(to.includes('?view=')) return location.pathname === '/admin' && query.get('view') === to.split('=')[1];
    if(to.includes('type=erasure')) return location.pathname.startsWith('/admin/privacy/users/') || (location.pathname === '/admin/privacy' && query.get('type') === 'erasure');
    if(to === '/admin/privacy') return location.pathname === to && query.get('type') !== 'erasure';
    return location.pathname.startsWith(to);
  };
  const links = () => <nav className="ih-admin-nav-links" aria-label="Sekcje administracji">{navigation.filter(item => !item[3] || role === 'owner').map(([to,label,Icon]) => <Link key={to} to={to} aria-current={active(to) ? 'page' : undefined} onClick={() => setOpen(false)}><Icon size={19} aria-hidden="true" /><span>{label}</span>{active(to) && <ChevronRight size={16} aria-hidden="true" />}</Link>)}</nav>;
  return <>
    <a className="ih-admin-skip" href="#ih-admin-content">Przejdź do obszaru pracy</a>
    <header className="ih-admin-header"><Link to="/admin" className="ih-admin-brand" aria-label="IdeaHire — administracja"><BrandSignature /></Link><span className="ih-admin-header-label">Administracja</span><div className="ih-admin-header-actions">{assistantEnabled && <Link to="/admin/lucyna" className="ih-admin-lucyna ih-top-assistant" onClick={requestLucynaDock} aria-label="Otwórz Lucynę AI"><LucynaSymbol /><span>Lucyna AI</span></Link>}<Link to="/account" aria-label="Wróć do centrum konta"><ArrowLeft size={18} aria-hidden="true" /><span>Centrum konta</span></Link><button type="button" className="ih-admin-menu-button" onClick={()=>setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="ih-admin-menu"><Menu size={24} aria-hidden="true" /><span>Menu</span></button></div></header>
    <aside className="ih-admin-sidebar">{links()}<div className="ih-admin-identity"><strong>{name}</strong><span>{role === 'owner' ? 'Właściciel' : 'Administrator'}</span><button type="button" onClick={onLogout}><LogOut size={17} aria-hidden="true" />Wyloguj się</button></div></aside>
    <dialog className="ih-admin-mobile-menu" id="ih-admin-menu" ref={dialog} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} aria-labelledby="ih-admin-menu-title"><div className="ih-admin-menu-heading"><strong id="ih-admin-menu-title">Administracja</strong><button type="button" onClick={()=>setOpen(false)} aria-label="Zamknij menu"><X size={22} /></button></div>{links()}<div className="ih-admin-identity"><strong>{name}</strong><span>{role === 'owner' ? 'Właściciel' : 'Administrator'}</span><button type="button" onClick={onLogout}><LogOut size={17} />Wyloguj się</button></div></dialog>
  </>;
}

export function AdminTabs({ items, value, onChange, label='Obszary pracy' }) {
  return <nav className="ih-admin-tabs" aria-label={label}>{items.map(([id,title,count]) => <button type="button" key={id} aria-pressed={value === id} onClick={()=>onChange(id)}>{title}{count != null && <span>{count}</span>}</button>)}</nav>;
}
export function AdminPane({ active, children }) { return <div className="ih-admin-pane" hidden={!active}>{children}</div>; }

export function AdminFilterBar({ search, onSearch, placeholder='Szukaj sprawy lub użytkownika', filter, onFilter, options, label='Widok' }) {
  return <div className={"ih-admin-filterbar" + (options ? "" : " is-search-only")}><label className="ih-admin-search"><Search size={19} aria-hidden="true" /><span className="ih-admin-sr">{placeholder}</span><input type="search" value={search} onChange={event=>onSearch(event.target.value)} placeholder={placeholder} maxLength={200} />{search && <button type="button" onClick={()=>onSearch('')} aria-label="Wyczyść wyszukiwanie"><X size={18} /></button>}</label>{options && <FormSelect label={label} value={filter} onChange={event=>onFilter(event.target.value)}>{options.map(([id,title])=><option value={id} key={id}>{title}</option>)}</FormSelect>}</div>;
}

export function AdminMetrics({ items }) {
  return <div className="ih-admin-metrics">{items.map(({label,value,onClick,active})=>onClick ? <button type="button" key={label} onClick={onClick} aria-pressed={Boolean(active)}><strong>{value}</strong><span>{label}</span><ArrowRight size={16} aria-hidden="true" /></button> : <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>;
}

export function useAdminSelection(items, key='request') {
  const [params,setParams] = useSearchParams();
  const requested = params.get(key);
  const selectedId = items.some(item=>item.id === requested) ? requested : items[0]?.id || '';
  const select = id => { const next = new URLSearchParams(params); next.set(key,id); setParams(next,{replace:true,preventScrollReset:true}); };
  return [selectedId,select];
}

export function AdminQueue({ items, selectedId, onSelect, children, label='Kolejka spraw' }) {
  const [page,setPage] = useState(() => Math.max(0,Math.floor(items.findIndex(item=>item.id===selectedId)/6)));
  const selectedIndex=items.findIndex(item=>item.id===selectedId);
  useEffect(()=>setPage(Math.max(0,Math.floor(selectedIndex/6))),[selectedId]);
  const result=adminQueuePage(items,page);
  return <div className="ih-admin-queue-layout">
    <label className="ih-admin-mobile-picker"><span>{label} <span>({items.length})</span></span><select value={selectedId || ''} onChange={event=>onSelect(event.target.value)}>{items.map(item=><option key={item.id} value={item.id}>{[item.number,item.title].filter(Boolean).join(' · ')}</option>)}</select></label>
    <aside className="ih-admin-queue-list" aria-label={label}>
      <div className="ih-admin-queue-caption"><strong>{label}</strong><span>{items.length}</span></div>
      <div className="ih-admin-queue-rows">{result.rows.map(item=><button type="button" key={item.id} onClick={()=>onSelect(item.id)} aria-current={selectedId===item.id ? 'true' : undefined}><span className="ih-admin-queue-number">{item.number}</span><strong>{item.title}</strong><span>{item.subtitle}</span><span className={'ih-admin-queue-meta'+(item.urgent ? ' is-urgent' : '')}>{item.meta}</span></button>)}</div>
      {result.last>0&&<nav className="ih-admin-queue-pages" aria-label="Strony listy"><button type="button" disabled={result.current===0} onClick={()=>setPage(result.current-1)} aria-label="Poprzednie wpisy"><ArrowLeft size={17} aria-hidden="true"/></button><span>{result.start+1}–{Math.min(items.length,result.start+result.rows.length)} z {items.length}</span><button type="button" disabled={result.current===result.last} onClick={()=>setPage(result.current+1)} aria-label="Następne wpisy"><ArrowRight size={17} aria-hidden="true"/></button></nav>}
    </aside>
    <div className="ih-admin-record" tabIndex={-1}>{children}</div>
  </div>;
}

export function AdminCaseRow({ to, title, number, status, assignment, budget, opened }) {
  return <Link className="ih-admin-case-row" to={to}><div className="ih-admin-case-row-heading"><span>{number}</span>{status}</div><h3>{title || 'Sprawa dotycząca współpracy'}</h3><div className="ih-admin-case-row-meta"><span>{assignment}</span><strong>{budget}</strong><span>{opened}</span></div><span className="ih-admin-case-row-open">Otwórz sprawę<ArrowRight size={17} aria-hidden="true"/></span></Link>;
}

export function AdminActivityLog({ rows, actorName, formatDate }) {
  const [search,setSearch]=useState(''),[showCodes,setShowCodes]=useState(false);
  const visible=rows.filter(row=>adminQueueSearch({title:adminActionLabel(row.action),subtitle:actorName(row),number:row.action,search:formatDate(row.created_at)},search));
  return <section className="ih-admin-activity"><AdminFilterBar search={search} onSearch={setSearch} placeholder="Szukaj działania lub administratora"/><div className="ih-admin-activity-toolbar"><strong>Liczba wpisów: {visible.length}</strong><label><input type="checkbox" checked={showCodes} onChange={event=>setShowCodes(event.target.checked)}/><span>Kody techniczne</span></label></div>{visible.length===0?<p className="ih-admin-activity-empty">{rows.length?'Brak wpisów pasujących do wyszukiwania.':'Brak zapisanych działań.'}</p>:<ol className="ih-admin-activity-list">{visible.map(row=><li key={row.id}><div><strong>{adminActionLabel(row.action)}</strong>{showCodes&&<code>{row.action}</code>}</div><div className="ih-admin-activity-meta"><span>{actorName(row)}</span><time dateTime={row.created_at}>{formatDate(row.created_at)}</time></div>{row.dispute_id&&<Link to={'/disputes/'+row.dispute_id}>Otwórz sprawę<ArrowRight size={16} aria-hidden="true"/></Link>}</li>)}</ol>}</section>;
}

function flatten(children) { return React.Children.toArray(children).flatMap(child => child?.type === React.Fragment ? flatten(child.props.children) : [child]).filter(child=>typeof child !== 'string' || child.trim()); }
const slots = [
  ['status','Status i termin',['privacy-admin-form']], ['reply','Wiadomość',['privacy-admin-reply-form']],
  ['audit','Analiza ochrony danych',['privacy-audit-workspace']], ['history','Historia',['privacy-admin-timeline']],
  ['case','Przebieg sprawy',['ih-admin-case-summary']], ['context','Rozmowa i ustalenia',['admin-case-context-panel']],
  ['evidence','Dowody',['ih-admin-evidence']], ['communication','Korespondencja',['ih-admin-correspondence']],
  ['decision','Decyzja i działania',['admin-workbench']], ['appeals','Odwołania',['ih-admin-dispute-appeals']],
];
export function AdminCaseTools({ children, disabled=false }) {
  const [selected,setSelected] = useState('');
  if(disabled) return <>{children}</>;
  const groups = new Map();
  for(const child of flatten(children)) {
    const names = String(child?.props?.className || '').split(/\s+/);
    const slot = slots.find(([, , classes])=>classes.some(name=>names.includes(name))) || ['other','Informacje',[]];
    if(!groups.has(slot[0])) groups.set(slot[0],{title:slot[1],children:[]});
    groups.get(slot[0]).children.push(child);
  }
  if(!groups.size) return null;
  const ordered = [...groups].sort(([a],[b]) => (slots.findIndex(slot=>slot[0]===a)+1 || 100) - (slots.findIndex(slot=>slot[0]===b)+1 || 100));
  const active = groups.has(selected) ? selected : ordered[0][0];
  return <div className="ih-admin-case-tools"><AdminTabs items={ordered.map(([id,item])=>[id,item.title])} value={active} onChange={setSelected} label="Narzędzia wybranej sprawy" />{ordered.map(([id,item])=><AdminPane key={id} active={active===id}>{item.children}</AdminPane>)}</div>;
}

export function AdminAuditAction({ action }) { return <><strong>{adminActionLabel(action)}</strong><details className="ih-admin-audit-technical"><summary>Kod zdarzenia</summary><code className="ih-admin-audit-code">{action}</code></details></>; }

export function AdminErasureSteps({ request, currentCase }) {
  const steps=[['Wniosek',Boolean(request)],['Tożsamość',request?.identity_status === 'verified'],['Przygotowanie',Boolean(currentCase)],['Zatwierdzenie',Boolean(currentCase?.owner_approved_at || ['authorized','processing','completed','partially_completed'].includes(currentCase?.status))],['Wykonanie',Boolean(currentCase?.executed_at || ['completed','partially_completed'].includes(currentCase?.status))]];
  return <ol className="ih-admin-erasure-steps" aria-label="Etapy usuwania danych">{steps.map(([label,done],index)=><li key={label} className={done?'is-done':''}><span aria-hidden="true">{done?<Check size={15}/>:index+1}</span><strong>{label}</strong><span className="ih-admin-sr">{done?'Zrealizowano':'Do weryfikacji'}</span></li>)}</ol>;
}

export function AdminRefreshNotice({ warning, onRefresh }) { return warning ? <div className="ih-admin-refresh-warning" role="status"><p>{warning}</p><button type="button" onClick={onRefresh}>Odśwież dane</button></div> : null; }

export function useAdminDialog() {
  const [question,setQuestion] = useState(null), pending=useRef(null), active=useRef(true), sequence=useRef(0);
  const finish = useCallback(value=>{ const resolve=pending.current; pending.current=null; setQuestion(null); resolve?.(value); },[]);
  useEffect(()=>{ active.current=true; return ()=>{ active.current=false; pending.current?.(null); pending.current=null; }; },[]);
  const ask = (message,type) => !active.current || pending.current ? Promise.resolve(null) : new Promise(resolve=>{pending.current=resolve;setQuestion({message,type,id:++sequence.current});});
  return { prompt:message=>ask(message,'text'), confirm:message=>ask(message,'confirm'), element:question ? <AdminQuestion key={question.id} question={question} onFinish={finish} /> : null };
}
function AdminQuestion({ question,onFinish }) {
  const ref=useRef(null), [text,setText]=useState('');
  useEffect(()=>{ref.current?.showModal();},[]);
  return <dialog className="ih-admin-question" ref={ref} onCancel={event=>{event.preventDefault();onFinish(null);}} aria-labelledby="ih-admin-question-title"><form method="dialog" onSubmit={event=>{event.preventDefault();onFinish(question.type==='text'?text:true);}}><h2 id="ih-admin-question-title">{question.type==='text'?'Uzasadnienie działania':'Potwierdź działanie'}</h2><p>{question.message}</p>{question.type==='text'&&<label><span>Treść uzasadnienia</span><textarea autoFocus value={text} onChange={event=>setText(event.target.value)} rows={5} maxLength={5000}/></label>}<div className="ih-admin-dialog-actions"><button type="button" onClick={()=>onFinish(null)}>Anuluj</button><button type="submit" className="is-primary" disabled={question.type==='text'&&!text.trim()}>Dalej</button></div></form></dialog>;
}

export function adminRead(query) { return privacyCall(signal=>query.abortSignal(signal)); }
export async function adminRpc(client,name,args,options={}) {
  try { return await privacyCall(signal=>client.rpc(name,args).abortSignal(signal),{timeoutMs:20000,...options}); }
  catch(error) { return { data:null,error:{ code:'ADMIN_UNCONFIRMED',message:'Nie otrzymano potwierdzenia z serwera. Operacja mogła zostać zapisana. Odśwież dane przed ponowieniem; formularz zachował wpisaną treść.' } }; }
}

export function filterAdminQueue(items, search) { return items.filter(item=>adminQueueSearch(item,search)); }
