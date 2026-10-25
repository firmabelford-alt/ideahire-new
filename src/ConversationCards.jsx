import React from 'react';

const TERMS_MARKER = '\n\n[IdeaHire:terms:v1]';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readTermsDecision(message, agreement, conversation) {
  if (!message || !conversation || message.moderation_status === 'hidden') return null;
  if (message.conversation_id !== conversation.id || ![conversation.client_id, conversation.contractor_id].includes(message.sender_id)) return null;
  const content = String(message.content || '');
  const index = content.lastIndexOf(TERMS_MARKER);
  if (index < 0) return null;
  try {
    const event = JSON.parse(content.slice(index + TERMS_MARKER.length));
    if (!UUID.test(event.agreementId) || !Number.isInteger(event.version) || event.version < 1) return null;
    if (agreement && (event.agreementId !== agreement.id || event.version !== Number(agreement.version))) return null;
    if (!['changes', 'closed'].includes(event.action)) return null;
    if (event.action === 'changes' && agreement && message.sender_id === agreement.created_by) return null;
    return { ...event, reason: String(event.reason || '').slice(0, 1200), senderId: message.sender_id, messageId: message.id, createdAt: message.created_at };
  } catch { return null; }
}

export function latestTermsDecision(messages, agreement, conversation) {
  if (!agreement || !conversation) return null;
  return messages.map(message => readTermsDecision(message, agreement, conversation)).filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

export function termsDecisionContent(action, agreement, reason) {
  const title = action === 'closed' ? 'Zakończenie negocjacji' : 'Prośba o zmianę ustaleń';
  return `${title} — wersja ${agreement.version}.\n${reason.trim()}${TERMS_MARKER}${JSON.stringify({ agreementId: agreement.id, version: Number(agreement.version), action, reason: reason.trim() })}`;
}

export function isInquiryMessage(text) {
  return /^Zapytanie o (?:usługę|współpracę):\s*\S/i.test(String(text || '').trim());
}

function inquiryParts(text) {
  const paragraphs = String(text).trim().split(/\n\s*\n/);
  const first = paragraphs.shift() || '';
  const firstLines = first.split('\n');
  const title = firstLines.shift().replace(/^Zapytanie o (?:usługę|współpracę):\s*/i, '');
  if (firstLines.join('\n').trim()) paragraphs.unshift(firstLines.join('\n'));
  const fields = paragraphs.map(paragraph => {
    const match = paragraph.match(/^(Cel i zakres|Zakres|Oczekiwany rezultat|Preferowany termin|Termin|Dostępne materiały|Materiały od klienta|Budżet|Format przekazania):\s*([\s\S]*)$/i);
    return match ? { label: match[1], text: match[2] } : { text: paragraph };
  });
  return { title, fields };
}

export function InquiryMessageCard({ text, renderText, onTerms, english = false }) {
  const { title, fields } = inquiryParts(text);
  return <section className="ih-inquiry-card" aria-label={english ? 'Project inquiry' : 'Zapytanie o współpracę'}>
    <div className="ih-inquiry-card-heading"><span>{english ? 'Project inquiry' : 'Zapytanie o współpracę'}</span><h3>{title}</h3></div>
    <div className="ih-inquiry-card-fields">{fields.map((field, index) => <div key={index} className={field.label ? 'has-label' : 'is-note'}>
      {field.label && <strong>{field.label}</strong>}<div>{renderText(field.text)}</div>
    </div>)}</div>
    {onTerms && <button type="button" className="ih-inquiry-card-action" onClick={onTerms}>{english ? 'Open project terms' : 'Przejdź do ustaleń'}<span aria-hidden="true">→</span></button>}
  </section>;
}

export function TermsDecisionMessage({ decision, own, onTerms, english = false }) {
  const closed = decision.action === 'closed';
  return <section className={`ih-terms-decision-card${closed ? ' is-closed' : ''}`}>
    <span>{english ? `Terms · version ${decision.version}` : `Ustalenia · wersja ${decision.version}`}</span>
    <h3>{closed ? (english ? 'Negotiations ended' : 'Negocjacje zakończone') : own ? (english ? 'You requested changes' : 'Poprosiłeś o zmianę ustaleń') : (english ? 'The other person requested changes' : 'Druga strona poprosiła o zmiany')}</h3>
    <p>{decision.reason}</p>
    <button type="button" onClick={onTerms}>{english ? 'View terms' : 'Zobacz ustalenia'}<span aria-hidden="true">→</span></button>
  </section>;
}
