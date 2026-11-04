import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './Brand';
import { ArrowIcon } from './InterfaceIcons';
import { FormSelect, AutoTextarea } from './FormControls';
import { useSitePreferences } from './Preferences';
import { supabase } from './supabase';
import { CONTENT_CONTACT_EMAIL, CONTENT_REPORT_REASONS, contentReportLocation, contentReportProblem } from './ContentReportState';
import './ContentReport.css';

export default function ContentReport({ user, client = supabase }) {
  const en=useSitePreferences().language==='en', t=(pl,english)=>en?english:pl;
  const [form,setForm]=useState({location:'',reason:'other_illegal_content',explanation:'',legalReference:'',goodFaith:false});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState(null),[copied,setCopied]=useState(false);
  const locked=useRef(false);
  const update=(field,value)=>setForm(previous=>({...previous,[field]:value}));
  async function copyContact(){try{await navigator.clipboard.writeText(CONTENT_CONTACT_EMAIL);setCopied(true);}catch{setError(t('Skopiuj adres e-mail widoczny poniżej.','Copy the email address shown below.'));}}
  async function submit(event){
    event.preventDefault();if(locked.current)return;
    const problem=contentReportProblem(form,en);if(problem){setError(problem);return;}
    locked.current=true;setBusy(true);setError('');
    try {
      const {data,error:requestError}=await client.rpc('submit_ideahire_platform_content_report',{p_location:contentReportLocation(form.location),p_reason_code:form.reason,p_explanation:form.explanation.trim(),p_legal_reference:form.legalReference.trim()||null,p_good_faith_confirmed:true});
      if(requestError)throw requestError;
      if(!data?.report_number||!data?.id)throw Error('missing_receipt');
      setReceipt(data);
    } catch {setError(t('Nie otrzymaliśmy potwierdzenia. Zachowaliśmy treść formularza — spróbuj ponownie. Ponowienie nie utworzy drugiego otwartego zgłoszenia tej samej strony.','We could not confirm submission. Your form is preserved. Try again; retrying will not create another open report for the same page.'));}
    finally {locked.current=false;setBusy(false);}
  }
  return <div className="ih-report-page" data-no-translate="true">
    <header className="ih-report-nav"><BrandLogo/><Link to="/"><ArrowIcon direction="left"/>{t('Strona główna','Home')}</Link></header>
    <main className="ih-report-main">
      <header className="ih-report-heading"><span>{t('Bezpieczeństwo w IdeaHire','Safety at IdeaHire')}</span><h1>{t('Zgłoś treść','Report content')}</h1><p>{t('Wskaż konkretną stronę i opisz problem. Zgłoszenie trafi do ręcznej analizy zespołu IdeaHire.','Share the page link and explain the issue. The IdeaHire team will review the report.')}</p></header>
      {receipt ? <section className="ih-report-receipt" role="status"><span>{t('Otrzymaliśmy zgłoszenie','Report received')}</span><h2>{receipt.report_number}</h2><p>{t('Zachowaj ten numer. Zgłoszenie czeka na analizę; samo wysłanie nie oznacza usunięcia treści ani nałożenia sankcji.','Keep this reference. The report awaits review; submission does not automatically remove content or impose a sanction.')}</p><Link to="/account">{t('Centrum konta','Account centre')}<ArrowIcon/></Link></section>
      : user ? <form className="ih-report-form" onSubmit={submit}>
        <fieldset disabled={busy}><legend className="sr-only">{t('Dane zgłoszenia','Report details')}</legend>
          <label>{t('Link do treści','Content link')}<input type="url" inputMode="url" autoComplete="url" value={form.location} onChange={e=>update('location',e.target.value)} required maxLength={2000} placeholder="https://ideahire-new.pages.dev/…"/><small>{t('Możesz wskazać zlecenie, usługę, profil lub inną stronę IdeaHire.','Link to a project, service, profile or another IdeaHire page.')}</small></label>
          <label>{t('Powód zgłoszenia','Reason')}<FormSelect value={form.reason} onChange={e=>update('reason',e.target.value)}>{CONTENT_REPORT_REASONS.map(([value,pl,english])=><option key={value} value={value}>{en?english:pl}</option>)}</FormSelect></label>
          <label>{t('Co wymaga sprawdzenia?','What should we review?')}<AutoTextarea value={form.explanation} onChange={e=>update('explanation',e.target.value)} minLength={50} maxLength={5000} rows={6} required/><small>{t('Opisz konkretny fragment i kontekst. Minimum 50 znaków. Nie podawaj zbędnych danych innych osób.','Describe the content and context in at least 50 characters. Avoid unnecessary personal data.')}</small></label>
          <label>{t('Przepis lub punkt regulaminu','Legal or terms reference')}<span className="ih-report-optional">{t('Opcjonalnie','Optional')}</span><input value={form.legalReference} onChange={e=>update('legalReference',e.target.value)} maxLength={1500}/></label>
          <label className="ih-report-faith"><input type="checkbox" checked={form.goodFaith} onChange={e=>update('goodFaith',e.target.checked)} required/><span>{t('Potwierdzam, że zgłaszam treść w dobrej wierze, a podane informacje są zgodne z moją wiedzą.','I confirm that I am reporting in good faith and that the information is accurate to the best of my knowledge.')}</span></label>
          {error&&<p className="ih-report-feedback" role="alert">{error}</p>}
          <button className="ih-report-submit" type="submit">{busy?t('Wysyłanie…','Submitting…'):t('Wyślij do analizy','Submit for review')}<ArrowIcon/></button>
        </fieldset>
      </form> : <section className="ih-report-access"><h2>{t('Przekaż zgłoszenie w serwisie','Submit on IdeaHire')}</h2><p>{t('Zaloguj się, aby wysłać formularz i otrzymać numer zgłoszenia na stronie.','Sign in to submit the form and receive a report reference on this page.')}</p><Link className="ih-report-submit" to="/login" state={{from:{pathname:'/report-content'}}}>{t('Zaloguj się i zgłoś','Sign in to report')}<ArrowIcon/></Link></section>}
      <aside className="ih-report-contact"><h2>{t('Kontakt bez logowania','Contact without signing in')}</h2><p>{t('Możesz też napisać na poniższy adres. Podaj link do treści, opis problemu i kontakt do siebie.','You can also email this address with the page link, a description of the issue and your contact details.')}</p><div><code>{CONTENT_CONTACT_EMAIL}</code><button type="button" onClick={copyContact}>{copied?t('Skopiowano','Copied'):t('Skopiuj adres','Copy address')}</button></div>{!user&&error&&<p role="status">{error}</p>}</aside>
      <p className="ih-report-privacy"><Link to="/polityka-prywatnosci">{t('Jak chronimy Twoje dane','How we protect your data')}</Link></p>
    </main>
  </div>;
}
