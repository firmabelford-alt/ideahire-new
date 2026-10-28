import React, { useEffect, useId, useRef, useState } from "react";
import { FormSelect } from "./FormControls";
import { useSitePreferences } from "./Preferences";
import "./RegistrationDetails.css";

export const REGISTRATION_DETAILS_KEY = "private_registration_details";
export const REGISTRATION_DETAILS_NOTICE_VERSION = "2026-10-28-v1";
export const EMPTY_REGISTRATION_DETAILS = Object.freeze({ fullName: "", accountUse: "", organizationName: "", consent: false });
const USES = new Set(["personal", "self_employed", "organization"]);
const OAUTH_DRAFT_KEY = "ideahire_registration_details_oauth";
const OAUTH_DRAFT_LIFETIME = 15 * 60 * 1000;
const clean = value => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim() : "";

export function normalizeRegistrationDetails(value = {}) {
  const accountUse = USES.has(value.accountUse) ? value.accountUse : "";
  return {
    fullName: clean(value.fullName).slice(0, 160),
    accountUse,
    organizationName: accountUse === "self_employed" || accountUse === "organization" ? clean(value.organizationName).slice(0, 200) : "",
    consent: value.consent === true,
  };
}

function hasDetails(value) {
  return Boolean(value.fullName || value.accountUse || value.organizationName);
}

export function registrationDetailsProblem(value, en = false) {
  return hasDetails(normalizeRegistrationDetails(value)) && value?.consent !== true
    ? (en ? "To save the optional details, give consent below or leave these fields empty." : "Aby zapisać opcjonalne dane, zaznacz zgodę poniżej albo pozostaw te pola puste.")
    : "";
}

export function registrationDetailsMetadata(value, source) {
  const details = normalizeRegistrationDetails(value);
  if (!hasDetails(details) || !details.consent) return null;
  return {
    schema_version: 1,
    full_name: details.fullName || null,
    account_use: details.accountUse || null,
    organization_name: details.organizationName || null,
    source,
    consent: {
      granted: true,
      notice_version: REGISTRATION_DETAILS_NOTICE_VERSION,
      recorded_at_client: new Date().toISOString(),
    },
  };
}

function detailsFromMetadata(metadata) {
  if (metadata?.schema_version !== 1 || metadata?.consent?.granted !== true) return { ...EMPTY_REGISTRATION_DETAILS };
  return normalizeRegistrationDetails({ fullName: metadata.full_name, accountUse: metadata.account_use,
    organizationName: metadata.organization_name, consent: true });
}

export function clearPendingRegistrationDetails() {
  try { window.sessionStorage.removeItem(OAUTH_DRAFT_KEY); } catch { /* Optional browser storage. */ }
}

export function rememberRegistrationDetails(value) {
  const details = normalizeRegistrationDetails(value);
  if (!hasDetails(details) || !details.consent) { clearPendingRegistrationDetails(); return ""; }
  try {
    const token = window.crypto.randomUUID();
    window.sessionStorage.setItem(OAUTH_DRAFT_KEY, JSON.stringify({ token, details, expiresAt: Date.now() + OAUTH_DRAFT_LIFETIME }));
    return token;
  } catch { /* The completion screen still offers these optional fields. */ }
  return "";
}

export function initialRegistrationDetails(user, token) {
  const stored = user?.user_metadata?.[REGISTRATION_DETAILS_KEY];
  if (stored) return detailsFromMetadata(stored);
  if (user?.app_metadata?.provider !== "google") return { ...EMPTY_REGISTRATION_DETAILS };
  try {
    const draft = JSON.parse(window.sessionStorage.getItem(OAUTH_DRAFT_KEY) || "null");
    if (typeof token === "string" && token && draft?.token === token
      && Number.isFinite(draft?.expiresAt) && draft.expiresAt > Date.now()
      && draft.expiresAt <= Date.now() + OAUTH_DRAFT_LIFETIME && draft.details?.consent === true) {
      return normalizeRegistrationDetails(draft.details);
    }
  } catch { /* A missing or expired draft never blocks sign-in. */ }
  clearPendingRegistrationDetails();
  return { ...EMPTY_REGISTRATION_DETAILS };
}

export function RegistrationDetailsFields({ value, onChange, disabled = false, idPrefix = "registration" }) {
  const en = useSitePreferences().language === "en";
  const uid = useId();
  const id = `${idPrefix}-${uid}`;
  const t = (pl, english) => en ? english : pl;
  const update = patch => onChange({ ...value, ...patch });
  const organization = value.accountUse === "self_employed" || value.accountUse === "organization";
  return <section className="ih-registration-details" aria-labelledby={`${id}-title`} data-no-translate="true">
    <header>
      <h2 id={`${id}-title`}>{t("Dane do współpracy", "Work details")} <span>{t("Opcjonalne", "Optional")}</span></h2>
      <p>{t("Możesz uzupełnić je teraz albo później w ustawieniach konta. Pozostają prywatne, oddzielnie od nazwy profilu.", "Add them now or later in account settings. They stay private, separate from your profile name.")}</p>
    </header>
    <label htmlFor={`${id}-name`}>
      {t("Imię i nazwisko", "Full name")}
      <input id={`${id}-name`} name="private-full-name" type="text" value={value.fullName} maxLength={160}
        autoComplete="section-private name" disabled={disabled} onChange={event => update({ fullName: event.target.value })} />
    </label>
    <label htmlFor={`${id}-use`}>
      {t("Jak zamierzasz korzystać z konta?", "How do you plan to use your account?")}
      <FormSelect id={`${id}-use`} name="private-account-use" value={value.accountUse} disabled={disabled}
        aria-describedby={`${id}-status-note`} onChange={event => update({ accountUse: event.target.value,
          organizationName: event.target.value === "personal" || !event.target.value ? "" : value.organizationName })}>
        <option value="">{t("Uzupełnię później", "I'll add this later")}</option>
        <option value="personal">{t("Prywatnie", "Personally")}</option>
        <option value="self_employed">{t("W ramach własnej działalności", "For my own business")}</option>
        <option value="organization">{t("W imieniu firmy lub organizacji", "On behalf of a company or organisation")}</option>
      </FormSelect>
    </label>
    {organization && <label htmlFor={`${id}-organization`}>
      {t("Nazwa firmy lub organizacji", "Company or organisation name")}
      <input id={`${id}-organization`} name="private-organization-name" type="text" value={value.organizationName} maxLength={200}
        autoComplete="section-private organization" disabled={disabled} onChange={event => update({ organizationName: event.target.value })} />
    </label>}
    <small id={`${id}-status-note`} className="ih-registration-details-note">{t("Ten wybór nie przesądza o prawach konsumenta ani sposobie rozliczenia konkretnego zlecenia.", "This choice does not determine consumer rights or how an individual job is settled.")}</small>
    <label className="ih-registration-details-consent" htmlFor={`${id}-consent`}>
      <input id={`${id}-consent`} name="private-details-consent" type="checkbox" checked={value.consent}
        disabled={disabled} onChange={event => update({ consent: event.target.checked })} />
      <span>{t("Zgadzam się na zapis tych opcjonalnych danych na koncie, aby ułatwić przygotowanie przyszłej współpracy. Zgodę mogę wycofać, usuwając te dane w ustawieniach konta.", "I consent to saving these optional details in my account to help prepare future work. I can withdraw consent by deleting these details in account settings.")}</span>
    </label>
  </section>;
}

export function RegistrationDetailsPrivacy({ cookies = false }) {
  const en = useSitePreferences().language === "en";
  return <section className="legal-document-content" id="dobrowolne-dane-wspolpracy" data-no-translate="true">
    <h2>{en ? "Optional work details — 28 October 2026" : "Dobrowolne dane do współpracy — 28 października 2026 r."}</h2>
    {cookies ? <p>{en
      ? "If you enter optional work details and choose Google registration, the ideahire_registration_details_oauth sessionStorage entry temporarily preserves those details and your consent in the current browser tab. It expires for use after 15 minutes and is removed on successful completion or when an expired draft is read. You can also remove it by closing the tab or clearing site data. It contains no password or payment details. If storage is blocked, you can enter the details on the completion screen."
      : "Jeśli wpiszesz dobrowolne dane do współpracy i wybierzesz rejestrację przez Google, wpis ideahire_registration_details_oauth w sessionStorage tymczasowo zachowa te dane i wybór zgody w bieżącej karcie przeglądarki. Po 15 minutach nie jest już wykorzystywany; jest usuwany po pomyślnym zakończeniu procesu lub przy odczycie wygasłego szkicu. Możesz usunąć go także przez zamknięcie karty lub wyczyszczenie danych witryny. Wpis nie zawiera hasła ani danych płatniczych. Przy zablokowanej pamięci dane można wpisać na ekranie uzupełnienia konta."}</p>
      : <>
        <p>{en
          ? "You may voluntarily provide your full name, intended personal or business use and, where relevant, a company or organisation name. The controller identified in this policy stores them privately in your account to help prepare future work. The basis is your separate, optional consent under Article 6(1)(a) GDPR. Leaving the fields empty does not prevent account creation or change your account permissions."
          : "Możesz dobrowolnie podać imię i nazwisko, planowany prywatny lub firmowy sposób korzystania z konta oraz, jeśli dotyczy, nazwę firmy lub organizacji. Administrator wskazany w tej Polityce zapisuje je prywatnie na koncie, aby ułatwić przygotowanie przyszłej współpracy. Podstawą jest odrębna, dobrowolna zgoda z art. 6 ust. 1 lit. a RODO. Pozostawienie pól pustych nie blokuje rejestracji ani nie zmienia uprawnień konta."}</p>
        <p>{en
          ? "These details are not published in your profile or automatically shared with another party. You can change or delete them in account settings. They are kept until you delete them, withdraw consent or the account data is erased. Withdrawal does not affect processing lawfully carried out before withdrawal. Any separately agreed contract or accounting document has its own purpose and retention rules. The recipients, safeguards and your rights are described in the other sections of this policy. These details are a user declaration, not identity verification or a tax classification. Notice version: 2026-10-28-v1."
          : "Dane te nie są publikowane na profilu ani automatycznie przekazywane drugiej stronie. Możesz je zmienić lub usunąć w ustawieniach konta. Pozostają zapisane do ich usunięcia, wycofania zgody albo wyczyszczenia danych konta. Wycofanie zgody nie wpływa na zgodność wcześniejszego przetwarzania z prawem. Odrębnie uzgodniona umowa lub dokument rozliczeniowy ma własny cel i zasady przechowywania. Odbiorców, zabezpieczenia i Twoje prawa opisują pozostałe części tej Polityki. Podane dane stanowią oświadczenie użytkownika, a nie weryfikację tożsamości ani kwalifikację podatkową. Wersja informacji: 2026-10-28-v1."}</p>
      </>}
  </section>;
}

export function AccountPrivateDetails({ user, client }) {
  const en = useSitePreferences().language === "en";
  const [details, setDetails] = useState(() => detailsFromMetadata(user?.user_metadata?.[REGISTRATION_DETAILS_KEY]));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const busy = useRef(false);
  const fingerprint = JSON.stringify(user?.user_metadata?.[REGISTRATION_DETAILS_KEY] ?? null);
  useEffect(() => {
    setDetails(detailsFromMetadata(user?.user_metadata?.[REGISTRATION_DETAILS_KEY]));
  }, [user?.id, fingerprint]);

  async function save(remove = false) {
    if (busy.current || !user?.id) return;
    const problem = !remove && registrationDetailsProblem(details, en);
    if (problem) { setFeedback({ error: true, message: problem }); return; }
    busy.current = true;
    setSaving(true);
    setFeedback(null);
    try {
      const session = await client.auth.getSession();
      if (session.error || session.data?.session?.user?.id !== user.id) throw new Error(en ? "Sign in again to save the details." : "Zaloguj się ponownie, aby zapisać dane.");
      const metadata = remove ? null : registrationDetailsMetadata(details, "account_settings");
      const { data, error } = await client.auth.updateUser({ data: { [REGISTRATION_DETAILS_KEY]: metadata } });
      if (error) throw error;
      if (data?.user?.id !== user.id) throw new Error(en ? "The save was not confirmed." : "Nie potwierdzono zapisu danych.");
      setDetails(detailsFromMetadata(data.user.user_metadata?.[REGISTRATION_DETAILS_KEY]));
      clearPendingRegistrationDetails();
      setFeedback({ error: false, message: remove
        ? (en ? "Optional details deleted. Consent withdrawn." : "Opcjonalne dane usunięte. Zgoda została wycofana.")
        : (en ? "Private work details saved." : "Prywatne dane do współpracy zostały zapisane.") });
    } catch (error) {
      setFeedback({ error: true, message: error?.message || (en ? "The details could not be saved." : "Nie udało się zapisać danych.") });
    } finally { busy.current = false; setSaving(false); }
  }

  return <form className="ih-private-details-form" onSubmit={event => { event.preventDefault(); save(); }} aria-busy={saving} data-no-translate="true">
    <RegistrationDetailsFields value={details} onChange={setDetails} disabled={saving} idPrefix="account-private" />
    <div className="ih-private-details-actions">
      <button type="submit" disabled={saving}>{saving ? (en ? "Saving…" : "Zapisywanie…") : (en ? "Save private details" : "Zapisz prywatne dane")}</button>
      <button type="button" disabled={saving || !user?.user_metadata?.[REGISTRATION_DETAILS_KEY] && !hasDetails(details)} onClick={() => save(true)}>
        {en ? "Delete these details and withdraw consent" : "Usuń te dane i wycofaj zgodę"}
      </button>
    </div>
    {feedback && <p className={`ih-private-details-feedback${feedback.error ? " is-error" : ""}`} role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
  </form>;
}
