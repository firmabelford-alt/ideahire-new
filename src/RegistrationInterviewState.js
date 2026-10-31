// Registration answers personalise the account; they never grant permissions.
export const REGISTRATION_INTERVIEW_KEY = "ideahire_registration_interview_v1";
export const REGISTRATION_INTERVIEW_STORAGE = "ideahire_registration_interview_oauth_v1";
const OAUTH_LIFETIME = 60 * 60 * 1000;
const ROLES = ["find_work", "hire_talent", "both"];
const GOALS = ["first_project", "more_orders", "offer_service", "build_portfolio", "find_specialist", "publish_project", "compare_options", "explore_platform"];
const READINESS = ["exploring", "idea", "brief_ready", "urgent"];
const selected = (values, allowed) => [...new Set(Array.isArray(values) ? values.filter(value => allowed.includes(value)) : [])].slice(0, 3);
const browserStorage = () => { try { return typeof window === "undefined" ? null : window.sessionStorage; } catch { return null; } };

export function normalizeRegistrationInterview(value, categories) {
  if (value?.version !== 1 || !ROLES.includes(value.usagePreference) || !["complete", "skip"].includes(value.action)) return null;
  const answer = {
    version: 1,
    action: value.action,
    usagePreference: value.usagePreference,
    freelancerCategories: selected(value.freelancerCategories, categories),
    clientCategories: selected(value.clientCategories, categories),
    onboardingGoals: selected(value.onboardingGoals, GOALS),
    specialtySummary: typeof value.specialtySummary === "string" ? value.specialtySummary.trim().slice(0, 160) : "",
    projectReadiness: READINESS.includes(value.projectReadiness) ? value.projectReadiness : "",
    personalizationEnabled: value.personalizationEnabled === true,
  };
  if (answer.usagePreference === "hire_talent") { answer.freelancerCategories = []; answer.specialtySummary = ""; }
  if (answer.usagePreference === "find_work") { answer.clientCategories = []; answer.projectReadiness = ""; }
  if (answer.action === "complete" && (
    (answer.usagePreference !== "hire_talent" && !answer.freelancerCategories.length) ||
    (answer.usagePreference !== "find_work" && (!answer.clientCategories.length || !answer.projectReadiness)) ||
    !answer.onboardingGoals.length
  )) return null;
  return answer;
}

export function registrationInterviewRpcArgs(answer) {
  const categories = answer.usagePreference === "find_work" ? answer.freelancerCategories
    : answer.usagePreference === "hire_talent" ? answer.clientCategories
    : [...answer.freelancerCategories, ...answer.clientCategories];
  return {
    p_role_preference: answer.usagePreference,
    p_preferred_categories: [...new Set(categories)].slice(0, 3),
    p_freelancer_categories: answer.freelancerCategories,
    p_client_categories: answer.clientCategories,
    p_onboarding_goals: answer.onboardingGoals,
    p_specialty_summary: answer.specialtySummary || null,
    p_project_readiness: answer.projectReadiness || null,
    p_personalization_enabled: answer.personalizationEnabled,
    p_onboarding_action: answer.action,
  };
}

export function rememberRegistrationInterview(answer, storage = browserStorage(), now = Date.now()) {
  try {
    const token = globalThis.crypto.randomUUID();
    storage.setItem(REGISTRATION_INTERVIEW_STORAGE, JSON.stringify({ token, answer, expiresAt: now + OAUTH_LIFETIME }));
    return token;
  } catch { return ""; }
}

export function clearRegistrationInterview(storage = browserStorage()) {
  try { storage.removeItem(REGISTRATION_INTERVIEW_STORAGE); } catch { /* Disabled storage does not block the account. */ }
}

export function registrationInterviewForUser(user, token, categories, storage = browserStorage(), now = Date.now()) {
  if (!user?.id) return null;
  const metadata = normalizeRegistrationInterview(user.user_metadata?.[REGISTRATION_INTERVIEW_KEY], categories);
  if (metadata) return metadata;
  try {
    const pending = JSON.parse(storage.getItem(REGISTRATION_INTERVIEW_STORAGE) || "null");
    if (!pending) return null;
    if (!Number.isFinite(pending.expiresAt) || pending.expiresAt <= now || pending.expiresAt > now + OAUTH_LIFETIME) {
      clearRegistrationInterview(storage);
      return null;
    }
    const bound = pending.userId === user.id;
    const returningFromGoogle = !pending.userId && user.app_metadata?.provider === "google"
      && typeof token === "string" && token && token === pending.token;
    if (!bound && !returningFromGoogle) return null;
    const answer = normalizeRegistrationInterview(pending.answer, categories);
    if (!answer) { clearRegistrationInterview(storage); return null; }
    if (!bound) storage.setItem(REGISTRATION_INTERVIEW_STORAGE, JSON.stringify({ ...pending, userId: user.id }));
    return answer;
  } catch { return null; }
}

export async function saveRegistrationInterview(client, user, answer) {
  // OAuth drafts are bound locally to the account that completed that return.
  // This check prevents a stale request from using a subsequent account's session.
  const session = await client.auth.getSession();
  if (session.error) throw session.error;
  if (session.data?.session?.user?.id !== user.id) throw new Error("Sesja konta zmieniła się. Odśwież stronę, aby zapisać odpowiedzi.");
  if (!user.user_metadata?.[REGISTRATION_INTERVIEW_KEY]) {
    // Keep an OAuth answer on this account before saving its settings, so a
    // failed RPC or closed tab can resume without asking the questions again.
    const staged = await client.auth.updateUser({ data: { [REGISTRATION_INTERVIEW_KEY]: answer } });
    if (staged.error) throw staged.error;
    const current = await client.auth.getSession();
    if (current.error) throw current.error;
    if (current.data?.session?.user?.id !== user.id) throw new Error("Sesja konta zmieniła się. Odśwież stronę, aby zapisać odpowiedzi.");
  }
  const { data, error } = await client.rpc("save_my_ideahire_preferences", registrationInterviewRpcArgs(answer));
  if (error) throw error;
  if (data?.preferences?.needs_onboarding !== false || data?.profile?.needs_onboarding !== false) throw new Error("Nie udało się potwierdzić zapisu odpowiedzi. Spróbuj ponownie.");
  return data;
}

export async function clearRegistrationInterviewMetadata(client, userId) {
  try {
    const session = await client.auth.getSession();
    if (session.error || session.data?.session?.user?.id !== userId) return;
    await client.auth.updateUser({ data: { [REGISTRATION_INTERVIEW_KEY]: null } });
  } catch { /* Saved preferences remain authoritative if metadata cleanup is unavailable. */ }
}
