/* IdeaHire P31 / Lucyna: funkcje lokalne. Nie wywoĹujÄ AI ani nie wysyĹajÄ wiadomoĹci. */
export const LUCYNA_NOTICE_VERSION = "IH-LUCYNA-2026-10-11-V2";
export const LUCYNA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PRIVATE_INPUT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{11}\b|\b(?:sk-[A-Za-z0-9_-]{12,}|sb_secret_[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b|\b(?:has[Ĺl]o|password|passwd|token|api[_ -]?key|secret|kod\s*(?:2fa|mfa))\s*[:=]/i;
export const containsPrivateInput = value => PRIVATE_INPUT.test(String(value || ""));
export const fold = value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ĺ/g, "l").trim();

export function weatherCity(message) {
  const text = fold(message);
  if (!/\b(pogod\w*|temperatur\w*|stopni|weather)\b/.test(text)) return null;
  const place = String(message).match(/\b(?:w|we|in|dla)\s+([^?!.;\n]{2,70})/i)?.[1]
    .replace(/\s+(?:dzis(?:iaj)?|dziĹ|teraz|obecnie|today|now).*$/i, "").trim();
  if (!place || !/^[\p{L}\p{M}\s.'-]+$/u.test(place)) return "";
  const aliases = { amsterdami: "Amsterdam", amsterdamie: "Amsterdam", warszawie: "Warszawa",
    krakowie: "KrakĂłw", londynie: "London", paryzu: "Paris", paryĹźu: "Paris", berlinie: "Berlin",
    rzymie: "Roma", gdansku: "GdaĹsk", poznaniu: "PoznaĹ", wroclawiu: "WrocĹaw", lodzi: "ĹĂłdĹş" };
  return aliases[fold(place)] || place;
}

export function localAnswer(message, now = new Date()) {
  const text = fold(message).replace(/[!.?]+$/g, "").trim();
  if (/^(hej|czesc|czesc lucyna|hej lucyna|dzien dobry|witaj|hello|hi)$/.test(text))
    return "Hej! MoĹźesz ze mnÄ normalnie porozmawiaÄ, zapytaÄ o pogodÄ, przygotowaÄ wiadomoĹÄ albo sprawdziÄ rezultat pracy. Od czego zaczynamy?";
  if (/^(dzieki|dziekuje|dziekuje lucyna)$/.test(text)) return "ProszÄ! Napisz, czego potrzebujesz dalej.";
  if (/^(jaki dzis(?:iaj)? dzien|jaka dzis(?:iaj)? data|ktory dzis(?:iaj)? jest|jaka jest dzis(?:iaj)? data)$/.test(text))
    return "DziĹ jest " + new Intl.DateTimeFormat("pl-PL", { dateStyle: "full", timeZone: "Europe/Warsaw" }).format(now) + ".";
  if (/^(ktora godzina|ktora jest godzina)$/.test(text))
    return "W Polsce jest " + new Intl.DateTimeFormat("pl-PL", { timeStyle: "short", timeZone: "Europe/Warsaw" }).format(now) + ".";
  const calculation = text.match(/^(?:(?:ile to|ile jest|oblicz)\s+)?(-?\d{1,12}(?:[.,]\d{1,6})?)\s*([+*/xĂ-])\s*(-?\d{1,12}(?:[.,]\d{1,6})?)$/);
  if (calculation) {
    const a = Number(calculation[1].replace(",", ".")), b = Number(calculation[3].replace(",", "."));
    const op = calculation[2];
    if (op === "/" && b === 0) return "Nie moĹźna dzieliÄ przez zero.";
    const result = op === "+" ? a + b : op === "-" ? a - b : op === "/" ? a / b : a * b;
    return calculation[1] + " " + op + " " + calculation[3] + " = "
      + new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 8 }).format(result) + ".";
  }
  return null;
}

export function suggestedCriteria(scope = "", deliverables = "", method = "") {
  return [...new Set([deliverables, scope, method].flatMap(value =>
    String(value).split(/\n|;/).map(line => line.replace(/^\s*(?:[-*â˘]|\d+[.)])\s*/, "").trim())
      .filter(line => line.length >= 8).map(line => line.slice(0, 220))))]
    .slice(0, 6);
}

export function reviewSummary(review) {
  const rows = Array.isArray(review?.criteria) ? review.criteria : [];
  const assessed = rows.filter(row => ["met", "partial", "missing"].includes(row.status));
  const earned = assessed.reduce((sum, row) => sum + (row.status === "met" ? 1 : row.status === "partial" ? 0.5 : 0), 0);
  return { total: rows.length, assessed: assessed.length,
    coverage: rows.length ? Math.round(assessed.length / rows.length * 100) : 0,
    score: assessed.length ? Math.round(earned / assessed.length * 100) : null };
}
export function correctionDraft(review, tone = "polite") {
  const changes = (review?.criteria || []).filter(row => row.status === "missing" || row.status === "partial")
    .map(row => row.fix || "ProszÄ sprawdziÄ i uzupeĹniÄ: " + row.criterion);
  const unknown = (review?.criteria || []).filter(row => row.status === "unknown").map(row => row.criterion);
  const beginning = tone === "firm" ? "Przed odbiorem proszÄ o nastÄpujÄce poprawki:"
    : tone === "short" ? "ProszÄ o poprawki:" : "DziÄkujÄ za przesĹany rezultat. Po sprawdzeniu materiaĹu proszÄ o nastÄpujÄce poprawki:";
  const parts = changes.length ? [beginning, changes.map((item, i) => (i + 1) + ". " + item).join("\n")]
    : ["DziÄkujÄ za przesĹany rezultat. ChcÄ jeszcze potwierdziÄ zgodnoĹÄ z uzgodnionymi kryteriami odbioru."];
  if (unknown.length) parts.push("ProszÄ takĹźe o materiaĹ lub moĹźliwoĹÄ sprawdzenia:\n" + unknown.map(item => "- " + item).join("\n"));
  return parts.join("\n\n");
}
export function messageTemplate({ purpose = "", details = "", tone = "polite" } = {}) {
  const lead = tone === "firm" ? "DzieĹ dobry. ProszÄ o ustalenie kolejnych krokĂłw."
    : tone === "short" ? "CzeĹÄ!" : "DzieĹ dobry, dziÄkujÄ za dotychczasowy kontakt.";
  return [lead, purpose.trim(), details.trim(), tone === "short" ? "Daj proszÄ znaÄ." : "ProszÄ o potwierdzenie i informacjÄ, jaki jest moĹźliwy nastÄpny krok."]
    .filter(Boolean).join("\n\n");
}
export function briefReadiness(fields) {
  const keys = ["goal", "scope", "result", "deadline", "budget", "acceptance"];
  const missing = keys.filter(key => !String(fields?.[key] || "").trim());
  return { percent: Math.round((keys.length - missing.length) / keys.length * 100), missing };
}
export function briefTemplate(fields) {
  const labels = { goal: "Cel", scope: "Zakres", result: "Rezultat", deadline: "Termin", budget: "BudĹźet", acceptance: "Kryteria odbioru" };
  return Object.entries(labels).map(([key, label]) => label + ": " + (String(fields?.[key] || "").trim() || "Do uzupeĹnienia")).join("\n\n");
}

export function packConversation(conversation) {
  const messages = conversation.messages.filter(message =>
    !["loading", "streaming"].includes(message.status) && (message.text || message.error)).slice(-40).map(message => {
    const value = { id: message.id, role: message.role, text: String(message.text).slice(0, 8000),
      status: ["done", "error", "stopped", "catalog", "catalog-error"].includes(message.status) ? message.status : "done" };
    for (const key of ["filters", "searchMode", "sources", "provenance", "review", "error", "partial", "kind", "createdAt"])
      if (message[key] !== undefined) value[key] = message[key];
    return value;
  });
  return { id: conversation.id, title: conversation.title.slice(0, 80), mode: conversation.mode,
    messages, sourceDeliveryId: LUCYNA_UUID.test(conversation.sourceDeliveryId || "") ? conversation.sourceDeliveryId : null,
    sourceConversationId: LUCYNA_UUID.test(conversation.sourceConversationId || "") ? conversation.sourceConversationId : null };
}
export function downloadLucynaExport(conversations) {
  const payload = { format: "IdeaHire-Lucyna-2", exported_at: new Date().toISOString(),
    note: "Odpowiedzi oznaczone ai_generated pochodzÄ z AI. Analizy dotyczÄ wskazanych materiaĹĂłw, nie sÄ decyzjÄ o odbiorze.",
    conversations: conversations.map(packConversation) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "Lucyna-moje-rozmowy.json";
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
