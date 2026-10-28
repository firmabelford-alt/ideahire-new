import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, FileText, LockKeyhole, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { AdminTabs } from './AdminDesk';
import LucynaSymbol from './LucynaSymbol';

export const ADMIN_GUIDES = [
  { id:'privacy', icon:ClipboardList, title:'Obsłuż wniosek RODO', to:'/admin/privacy', action:'Otwórz wnioski', steps:['Wybierz wniosek i sprawdź termin odpowiedzi oraz jego status.','Przejmij sprawę, aby było jasne, kto ją prowadzi.','Sprawdź zakres żądania i status potwierdzenia tożsamości.','Zapisz odpowiedź dla użytkownika. Notatki wewnętrzne trzymaj w osobnym polu.','Zmień status po wykonaniu czynności i sprawdź historię zapisu.'] },
  { id:'erasure', icon:LockKeyhole, title:'Przygotuj usunięcie danych', to:'/admin/privacy?type=erasure', action:'Otwórz wnioski o usunięcie', steps:['Otwórz właściwy wniosek i konto użytkownika.','Potwierdź tożsamość oraz wybrany zakres: minimalizacja danych albo zamknięcie konta.','Sprawdź wykaz danych, blokady, aktywne zobowiązania i powody zachowania dokumentacji.','Przygotuj operację zgodną z żądaniem i przekaż ją właścicielowi do zatwierdzenia.','Wykonaj zatwierdzoną operację, sprawdź wynik i przygotuj odpowiedź użytkownikowi.'] },
  { id:'dispute', icon:MessageSquare, title:'Poprowadź spór', to:'/admin', action:'Otwórz kolejkę spraw', steps:['Otwórz sprawę i sprawdź jej opiekuna oraz bieżący etap.','Przeczytaj ustalenia współpracy, chronologię i dowody dołączone do sprawy.','Jeżeli czegoś brakuje, wyślij konkretne pytanie do właściwej strony.','Oddziel ustalone fakty od twierdzeń stron i informacji wymagających weryfikacji.','Zapisz uzasadnioną decyzję oraz sprawdź dostępne odwołania i status rozliczenia.'] },
  { id:'evidence', icon:FileText, title:'Sprawdź wiadomość dowodową', to:'/admin/messages', action:'Otwórz wiadomości dowodowe', steps:['Wyszukaj wiadomość po treści, użytkowniku albo numerze sprawy.','Sprawdź autora, osobę dołączającą dowód oraz datę wysłania.','Otwórz powiązaną sprawę, aby ocenić wiadomość w kontekście.','Korzystaj wyłącznie z dowodów udostępnionych w ramach sprawy. Zapisz wynik analizy w jej dokumentacji.'] },
  { id:'moderation', icon:ShieldCheck, title:'Rozpatrz zgłoszenie', to:'/admin/moderation', action:'Otwórz moderację', steps:['Otwórz zgłoszenie i sprawdź, jakiej treści lub konta dotyczy.','Przeanalizuj dowody, kontekst, wcześniejsze decyzje i ewentualne zobowiązania.','Wskaż konkretną podstawę i fakty. Samo zgłoszenie nie przesądza o naruszeniu.','Wybierz proporcjonalne działanie, zakres oraz czas obowiązywania.','Zapisz decyzję, sprawdź zawiadomienie użytkownika i obsłuż ewentualne odwołanie.'] },
  { id:'activity', icon:Users, title:'Sprawdź pracę zespołu', to:'/admin?view=activity', action:'Otwórz rejestr działań', steps:['Sprawdź opis działania, wykonawcę i datę w rejestrze.','W razie potrzeby otwórz powiązaną sprawę i porównaj jej historię.','Zmiany uprawnień obsługuje właściciel w sekcji Dostęp zespołu.','Po nadaniu albo odebraniu roli sprawdź potwierdzenie i aktualny status konta.'] },
];

export default function AdminLucynaDesk({ enabled, children }) {
  const [tab,setTab]=useState('guide'),[selected,setSelected]=useState('privacy'),[checked,setChecked]=useState({});
  const guide=ADMIN_GUIDES.find(item=>item.id===selected)||ADMIN_GUIDES[0];
  const completed=guide.steps.filter((_,i)=>checked[`${guide.id}:${i}`]).length;
  return <main className="admin-shell ih-admin-lucyna-desk" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261028">
    <header className="admin-page-header"><div><span className="section-label">Wsparcie zespołu</span><h1>Lucyna i instrukcje</h1><p>Procedury pod ręką i pomoc w przygotowaniu czytelnych szkiców.</p></div><span className="ih-admin-assistant-mark"><LucynaSymbol /></span></header>
    <AdminTabs items={[["guide","Instrukcje zespołu"],["chat","Rozmowa z Lucyną"]]} value={tab} onChange={setTab} />
    <section className="ih-admin-guide-layout" hidden={tab!=='guide'}>
      <nav className="ih-admin-guide-menu" aria-label="Wybierz instrukcję">{ADMIN_GUIDES.map(({id,title,icon:Icon})=><button type="button" key={id} aria-pressed={selected===id} onClick={()=>setSelected(id)}><Icon size={19} aria-hidden="true"/><span>{title}</span><ArrowRight size={17} aria-hidden="true"/></button>)}</nav>
      <article className="dispute-panel ih-admin-guide-detail"><div className="dispute-panel-heading"><h2>{guide.title}</h2><span>{completed}/{guide.steps.length}</span></div><p>Lista pomocnicza w tej sesji. Potwierdzenie wykonania czynności znajduje się w historii właściwej sprawy.</p><ol>{guide.steps.map((step,i)=><li key={`${guide.id}:${i}`}><label><input type="checkbox" checked={Boolean(checked[`${guide.id}:${i}`])} onChange={event=>setChecked(old=>({...old,[`${guide.id}:${i}`]:event.target.checked}))}/><span>{step}</span></label></li>)}</ol><Link className="ih-admin-guide-action" to={guide.to}>{guide.action}<ArrowRight size={18} aria-hidden="true"/></Link></article>
    </section>
    {tab==='chat'&&<section className="ih-admin-lucyna-chat" aria-label="Rozmowa z Lucyną AI">{enabled?children:<div className="dispute-state-card"><h2>Rozmowa AI jest obecnie wyłączona</h2><p>Instrukcje zespołu pozostają dostępne. Wróć do nich, aby przejść przez właściwą procedurę.</p><button type="button" onClick={()=>setTab('guide')}>Otwórz instrukcje zespołu</button></div>}</section>}
  </main>;
}
