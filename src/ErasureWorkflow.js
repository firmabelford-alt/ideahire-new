import { privacyCall } from './PrivacyRequests.js';

export const ERASURE_CONFIRMATION = 'ZATWIERDZAM USUNIECIE';

export const ERASURE_SCOPE = [
  ['private_profile_rows','Dane profilu','Nazwa, zdjęcie, opis, specjalizacje, umiejętności i liczniki profilu.'],
  ['public_profile_rows','Profil publiczny','Nazwa, zdjęcie, biogram i kraj. Zastąpimy nazwę tekstem „Profil bez danych”.'],
  ['avatar_objects','Pliki zdjęć','Zdjęcia profilu i portfolio. Materiały objęte zgłoszeniem pozostają jako dowody.'],
  ['portfolio_items','Projekty portfolio','Tytuły, opisy i linki projektów bez zgłoszeń moderacyjnych.'],
  ['portfolio_images','Zdjęcia projektów','Wpisy zdjęć, podpisy i kolejność w albumach bez zgłoszeń.'],
  ['age_profile_rows','Dane wieku','Data urodzenia i zapis potwierdzenia informacji o wieku.'],
  ['auth_optional_metadata','Opcjonalne dane konta','Zapisana nazwa i inne opcjonalne dane. Adres e-mail i dane logowania pozostają.'],
  ['user_preference_rows','Ustawienia rozmów','Osobiste ustawienia widoku rozmów.'],
  ['block_rows','Własne blokady','Blokady ustawione przez tego użytkownika. Blokady innych osób pozostają.'],
  ['dispute_notifications','Powiadomienia o sporach','Kopie powiadomień użytkownika. Same spory pozostają.'],
  ['discovery_preferences','Preferencje dopasowań','Wybrane kategorie, cele i preferencje wyszukiwania.'],
  ['onboarding_profiles','Odpowiedzi na start','Dane personalizacji wprowadzone podczas przygotowania konta.'],
  ['lucyna_preferences','Ustawienia Lucyny','Osobista personalizacja asystentki.'],
  ['lucyna_threads','Zapisane rozmowy z Lucyną','Historia asystentki przypisana do tego konta.'],
  ['profile_discovery','Ustawienia widoczności','Zapis preferencji prezentowania profilu.'],
  ['removable_services','Niepowiązane oferty usług','Oferty bez zapytań i rezerwacji. Powiązane oferty zachowamy, a aktywne wstrzymamy.'],
  ['removable_job_applications','Niepowiązane zgłoszenia','Zgłoszenia bez przyjęcia i bez powiązanej współpracy.'],
  ['removable_messages','Niepowiązane wiadomości','Własne wiadomości bez umów, płatności, sporów, zapytań o usługi lub kontakt, zgłoszeń ani dowodów.'],
  ['removable_conversations','Puste rozmowy','Wyłącznie puste rozmowy bez zapytań, umów, płatności, dowodów i innych powiązań.'],
  ['removable_jobs','Niepowiązane zlecenia','Zlecenia bez zgłoszeń, współpracy, rozliczeń i moderacji.'],
  ['unused_stripe_rows','Nieużywana konfiguracja wypłat','Wyłącznie pusty wpis bez połączonego konta Stripe.'],
];
export const ERASURE_RETAINED_LABELS = {
  services_total:'Oferty powiązane z zapytaniami lub rezerwacjami',service_inquiries_total:'Zapytania o usługi',
  reported_portfolio_items:'Portfolio objęte zgłoszeniem',other_users_blocks:'Blokady nałożone przez inne osoby',
  auth_login_account:'Konto logowania',legal_acceptances:'Potwierdzenia dokumentów prawnych',privacy_requests_open:'Otwarte wnioski RODO',
  payments_total:'Płatności',disputes_total:'Spory',agreements_total:'Umowy i ustalenia',
  conversations_total:'Rozmowy przed operacją',messages_total:'Wiadomości przed operacją',job_applications_total:'Zgłoszenia przed operacją',jobs_total:'Zlecenia przed operacją',
};
export const ERASURE_STAGES={confirmation:'potwierdzenie wpisaną frazą',authorization:'zatwierdzenie właściciela',begin:'kontrola zakresu',avatar_files:'zdjęcia profilu i portfolio',work_files:'niepowiązane pliki',auth_metadata:'opcjonalne dane konta',apply_data:'dane profilu i powiązania',auth_closure:'zamknięcie logowania',finalize:'zapis wyniku'};
export function erasureScopeRows(inventory) {
  return ERASURE_SCOPE.map(([key,label,description])=>({key,label,description,value:Math.max(0,Number(inventory?.erasable_now?.[key])||0)}));
}
export function erasureOutcomeKnown(currentCase) {
  return Boolean(currentCase && (currentCase.status!=='processing' || currentCase.failure_reason));
}
export function erasureFailureMessage(error) {
  if(error?.uncertain) return 'Nie otrzymano potwierdzenia zakończenia. Operacja mogła wykonać część zmian. Odśwież status i sprawdź wynik przed ponownym uruchomieniem.';
  const stage=ERASURE_STAGES[error?.stage];
  const text=error?.code==='23503'?'Usuwanie zatrzymało się na powiązanych danych. Wniosek pozostaje otwarty; potrzebna jest kontrola powiązań.':error?.status===401?'Sesja wygasła. Zaloguj się ponownie i sprawdź status operacji.':error?.code==='42501'||error?.status===403?'Brak uprawnień do wykonania tej operacji. Może ją kontynuować prowadzący administrator lub właściciel.':error?.message && !/Edge Function|fetch|network|non-2xx/i.test(error.message)?error.message:'Serwer nie potwierdził wykonania operacji. Odśwież status i sprawdź wynik.';
  return `${stage ? `Etap: ${stage}. ` : ''}${text}`;
}
// A bounded call, with no automatic retries. A timeout does not mean rollback.
export async function executeErasure(client,body,{timeoutMs=60000}={}) {
  if(!['minimize_data','close_account'].includes(body.expectedActionType)) throw new Error('Najpierw sprawdź zakres operacji.');
  const confirmation=body.executionConfirmation ?? body.ownerConfirmation;
  if(typeof confirmation!=='string'||confirmation.trim()!==ERASURE_CONFIRMATION) throw new Error(`Wpisz dokładnie: ${ERASURE_CONFIRMATION}`);
  let result;
  try { result=await privacyCall(signal=>client.functions.invoke('ideahire-admin-erasure',{body,signal}),{timeoutMs}); }
  catch(error) { throw Object.assign(new Error(erasureFailureMessage({uncertain:true})),{uncertain:true,cause:error}); }
  if(result.error){
    let payload;
    try { payload=await result.error.context?.clone().json(); } catch { /* Gateways may return non-JSON. */ }
    const error=Object.assign(new Error(payload?.error||result.error.message),{code:payload?.code,stage:payload?.stage,status:result.error.context?.status,uncertain:!result.error.context || !payload || (!payload.code && result.error.context.status>=500)});
    throw error;
  }
  if(!result.data?.ok) throw Object.assign(new Error(result.data?.error||'Nie potwierdzono wykonania operacji.'),{stage:result.data?.stage,code:result.data?.code});
  return result.data;
}
