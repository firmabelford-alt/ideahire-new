/* IdeaHire | Lucyna AI | P35 | Kontekst rozmowy, historia i pomocnicze narzędzia. */
import { knowledgeAnswer } from "./LucynaKnowledge.js";

export const LUCYNA_BUILD_VERSION = "P35-2026-10-14";
export const LUCYNA_NOTICE_VERSION = "IH-LUCYNA-2026-10-13-V3";
export const LUCYNA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PRIVATE_INPUT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{11}\b|\b(?:sk-[A-Za-z0-9_-]{12,}|(?:sk|rk)_(?:test|live)_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{12,}|sb_secret_[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b|\b(?:has[łl]o|password|passwd|token|api[_ -]?key|secret|kod\s*(?:2fa|mfa))\s*[:=]/i;
export const containsPrivateInput = value => PRIVATE_INPUT.test(String(value || "").replace(/\b(?:ideahire26|ideahirereklamacja|ideahireprywatnosc)@gmail\.com\b/gi, "[publiczny kontakt IdeaHire]"));
export const fold = value => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").trim();

export function weatherCity(message) {
  const text = fold(message);
  if (!/\b(pogod\w*|temperatur\w*|stopni|weather)\b/.test(text)) return null;
  const place = String(message).match(/\b(?:w|we|in|dla)\s+([^?!.;\n]{2,70})/i)?.[1]
    .replace(/\s+(?:dzis(?:iaj)?|dziś|teraz|obecnie|today|now).*$/i, "").trim();
  if (!place || !/^[\p{L}\p{M}\s.'-]+$/u.test(place)) return "";
  const aliases = { amsterdami: "Amsterdam", amsterdamie: "Amsterdam", warszawie: "Warszawa",
    krakowie: "Kraków", londynie: "London", paryzu: "Paris", paryżu: "Paris", berlinie: "Berlin",
    rzymie: "Roma", gdansku: "Gdańsk", poznaniu: "Poznań", wroclawiu: "Wrocław", lodzi: "Łódź" };
  return aliases[fold(place)] || place;
}

export function localAnswer(message, now = new Date()) {
  const guide = knowledgeAnswer(message);
  if (guide) return guide.text;
  const text = fold(message).replace(/[!.?]+$/g, "").trim();
  if (/^(hej|czesc|czesc lucyna|hej lucyna|dzien dobry|witaj|hello|hi)$/.test(text))
    return "Hej! Możesz ze mną normalnie porozmawiać, zapytać o pogodę, przygotować wiadomość albo sprawdzić rezultat pracy. Od czego zaczynamy?";
  if (/^(dzieki|dziekuje|dziekuje lucyna)$/.test(text)) return "Proszę! Napisz, czego potrzebujesz dalej.";
  if (/^(jaki dzis(?:iaj)? dzien|jaka dzis(?:iaj)? data|ktory dzis(?:iaj)? jest|jaka jest dzis(?:iaj)? data)$/.test(text))
    return "Dziś jest " + new Intl.DateTimeFormat("pl-PL", { dateStyle: "full", timeZone: "Europe/Warsaw" }).format(now) + ".";
  if (/^(ktora godzina|ktora jest godzina)$/.test(text))
    return "W Polsce jest " + new Intl.DateTimeFormat("pl-PL", { timeStyle: "short", timeZone: "Europe/Warsaw" }).format(now) + ".";
  const calculation = text.match(/^(?:(?:ile to|ile jest|oblicz)\s+)?(-?\d{1,12}(?:[.,]\d{1,6})?)\s*([+*/x×-])\s*(-?\d{1,12}(?:[.,]\d{1,6})?)$/);
  if (calculation) {
    const a = Number(calculation[1].replace(",", ".")), b = Number(calculation[3].replace(",", "."));
    const op = calculation[2];
    if (op === "/" && b === 0) return "Nie można dzielić przez zero.";
    const result = op === "+" ? a + b : op === "-" ? a - b : op === "/" ? a / b : a * b;
    return calculation[1] + " " + op + " " + calculation[3] + " = "
      + new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 8 }).format(result) + ".";
  }
  return null;
}

export function suggestedCriteria(scope = "", deliverables = "", method = "") {
  return [...new Set([deliverables, scope, method].flatMap(value =>
    String(value).split(/\n|;/).map(line => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
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
    .map(row => row.fix || "Proszę sprawdzić i uzupełnić: " + row.criterion);
  const unknown = (review?.criteria || []).filter(row => row.status === "unknown").map(row => row.criterion);
  const beginning = tone === "firm" ? "Przed odbiorem proszę o następujące poprawki:"
    : tone === "short" ? "Proszę o poprawki:" : "Dziękuję za przesłany rezultat. Po sprawdzeniu materiału proszę o następujące poprawki:";
  const parts = changes.length ? [beginning, changes.map((item, i) => (i + 1) + ". " + item).join("\n")]
    : ["Dziękuję za przesłany rezultat. Chcę jeszcze potwierdzić zgodność z uzgodnionymi kryteriami odbioru."];
  if (unknown.length) parts.push("Proszę także o materiał lub możliwość sprawdzenia:\n" + unknown.map(item => "- " + item).join("\n"));
  return parts.join("\n\n");
}
export function messageTemplate({ purpose = "", details = "", tone = "polite" } = {}) {
  const lead = tone === "firm" ? "Dzień dobry. Proszę o ustalenie kolejnych kroków."
    : tone === "short" ? "Cześć!" : "Dzień dobry, dziękuję za dotychczasowy kontakt.";
  return [lead, purpose.trim(), details.trim(), tone === "short" ? "Daj proszę znać." : "Proszę o potwierdzenie i informację, jaki jest możliwy następny krok."]
    .filter(Boolean).join("\n\n");
}
export function briefReadiness(fields) {
  const keys = ["goal", "scope", "result", "deadline", "budget", "acceptance"];
  const missing = keys.filter(key => !String(fields?.[key] || "").trim());
  return { percent: Math.round((keys.length - missing.length) / keys.length * 100), missing };
}
export function briefTemplate(fields) {
  const labels = { goal: "Cel", scope: "Zakres", result: "Rezultat", deadline: "Termin", budget: "Budżet", acceptance: "Kryteria odbioru" };
  return Object.entries(labels).map(([key, label]) => label + ": " + (String(fields?.[key] || "").trim() || "Do uzupełnienia")).join("\n\n");
}

export function packConversation(conversation) {
  const messages = conversation.messages.filter(message =>
    !["loading", "streaming"].includes(message.status) && (message.text || message.error || message.review || message.catalogs?.length)).slice(-40).map(message => {
    const value = { id: message.id, role: message.role, text: String(message.text || "").slice(0, 8000),
      status: ["done", "error", "stopped", "catalog", "catalog-error"].includes(message.status) ? message.status : "done" };
    for (const key of ["filters", "searchMode", "sources", "provenance", "review", "error", "partial", "kind", "createdAt", "catalogs"])
      if (message[key] !== undefined) value[key] = message[key];
    if (!value.catalogs?.length && Array.isArray(message.items)) value.catalogs = [{
      kind:"catalog",mode:message.searchMode,items:message.items,filters:message.filters,total:message.total
    }];
    return value;
  });
  return { id: conversation.id, title: conversation.title.slice(0, 80), mode: conversation.mode,
    messages, sourceDeliveryId: LUCYNA_UUID.test(conversation.sourceDeliveryId || "") ? conversation.sourceDeliveryId : null,
    sourceConversationId: LUCYNA_UUID.test(conversation.sourceConversationId || "") ? conversation.sourceConversationId : null };
}
export function downloadLucynaExport(conversations) {
  const payload = { format: "IdeaHire-Lucyna-AI", exported_at: new Date().toISOString(),
    note: "Odpowiedzi oznaczone ai_generated pochodzą z AI. Analizy dotyczą wskazanych materiałów, nie są decyzją o odbiorze.",
    conversations: conversations.map(packConversation) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "Lucyna-AI-moje-rozmowy.json";
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function revealAnswer(text, signal, onText, reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (reducedMotion || !text) { onText(text); return; }
  const started = performance.now();
  const duration = Math.min(1500, Math.max(240, text.length * 1.25));
  await new Promise((resolve, reject) => {
    let timer;
    const abort = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); reject(new DOMException("Aborted", "AbortError")); };
    const tick = () => {
      if (signal.aborted) { abort(); return; }
      const fraction = Math.min(1, (performance.now() - started) / duration);
      let end = Math.ceil(text.length * fraction);
      // Nie dziel pary UTF-16 w połowie podczas wyświetlania emoji.
      if (end > 0 && end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
      onText(text.slice(0, end));
      if (fraction === 1) { signal.removeEventListener("abort", abort); resolve(); }
      else timer = setTimeout(tick, 24);
    };
    signal.addEventListener("abort", abort, { once: true });
    timer = setTimeout(tick, 80);
  });
}

export function conversationContext(messages, limit = 10) {
  return messages.filter(message => ["user", "assistant"].includes(message.role)
    && ["done", "catalog", "stopped"].includes(message.status)
    && !message.error && (message.text || message.review || message.catalogs?.length))
    .map(message => {
      let text = String(message.text || "");
      if (message.review) text += "\nAnaliza wskazanego materiału:\n" + message.review.summary + "\n" +
        (message.review.criteria || []).map(row => row.criterion + ": " + row.status + ". " + row.reason + (row.fix ? " Poprawka: " + row.fix : "")).join("\n");
      const catalogs = message.catalogs || (message.items ? [{mode:message.searchMode,items:message.items,filters:message.filters}] : []);
      if (catalogs.length) text = "Odczyty katalogu IdeaHire (dane, numeracja odpowiada kartom):\n" + catalogs.map(catalog =>
        catalog.mode + ":\n" + catalog.items.slice(0,10).map((row,index) => (index+1) + ". " +
          String(row.title || row.name || "Pozycja").slice(0,160) +
          (LUCYNA_UUID.test(row.id || "") ? " | ID: " + row.id : "") +
          (row.category ? " | " + row.category : "") + (row.budget != null ? " | " + row.budget + " PLN" : "")).join("\n")).join("\n") + "\n\n" + text;
      return {role:message.role,content:text.slice(0,5800)};
    }).filter(message => !containsPrivateInput(message.content)).slice(-limit);
}
