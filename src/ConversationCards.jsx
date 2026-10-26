import React from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import { TERMS_MARKER } from './AgreementWorkflow';
export { latestTermsDecision, readTermsDecision, termsDecisionContent } from './AgreementWorkflow';

export function isInquiryMessage(text) {
  return /^Zapytanie o (?:usługę|współpracę):\s*\S/i.test(String(text || '').trim());
}

export function conversationMessagePreview(content, english = false) {
  let text = String(content || '').split(TERMS_MARKER)[0].trim();
  if (isInquiryMessage(text)) {
    const scope = text.match(/(?:^|\n)Cel i zakres:\s*([\s\S]*?)(?=\n\s*\n|$)/i);
    text = scope?.[1] || (english ? 'New project inquiry' : 'Nowe zapytanie o współpracę');
  }
  text = text.replace(/\s+/g, ' ').trim();
  return text.length > 115 ? text.slice(0, 112).trimEnd() + '…' : text;
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

export function InquiryMessageCard({ text, renderText, onTerms, english = false, firstProposalRole }) {
  const { title, fields } = inquiryParts(text);
  return <section className="ih-inquiry-card" aria-label={english ? 'Project inquiry' : 'Zapytanie o współpracę'}>
    <div className="ih-inquiry-card-heading"><span><BriefcaseBusiness size={15} aria-hidden="true"/>{english ? 'Project inquiry' : /^Zapytanie o usługę:/i.test(text.trim()) ? 'Zapytanie o usługę':'Zapytanie o współpracę'}</span><h3>{title}</h3></div>
    <div className="ih-inquiry-card-fields">{fields.map((field, index) => <div key={index} className={field.label ? 'has-label' : 'is-note'}>
      {field.label && <strong>{field.label}</strong>}<div>{renderText(firstProposalRole === 'client' && field.text === 'To niewiążące zapytanie. Oczekuję na ofertę wykonawcy z zakresem, terminem i ceną.'
        ? (english ? 'Discuss the details in chat, then confirm the final scope, price and deadline in Terms.' : 'Szczegóły omówcie w rozmowie. Zakres, cenę i termin potwierdzicie w ustaleniach.') : field.text)}</div>
    </div>)}</div>
    {onTerms && <button type="button" className="ih-inquiry-card-action" onClick={onTerms}>{english ? 'Open project terms' : 'Przejdź do ustaleń'}<span aria-hidden="true">→</span></button>}
  </section>;
}

export function TermsDecisionMessage({ decision, own, onTerms, english = false }) {
  const closed = decision.action === 'closed';
  return <section className={`ih-terms-decision-card${closed ? ' is-closed' : ''}`}>
    <span>{english ? `Terms · version ${decision.version}` : `Ustalenia · wersja ${decision.version}`}</span>
    <h3>{closed ? own ? (english ? 'You declined this collaboration' : 'Zrezygnowałeś ze współpracy') : (english ? 'The other person declined this collaboration' : 'Druga strona zrezygnowała ze współpracy') : own ? (english ? 'You requested changes' : 'Poprosiłeś o zmianę ustaleń') : (english ? 'The other person requested changes' : 'Druga strona poprosiła o zmiany')}</h3>
    <p>{decision.reason}</p>
    <button type="button" onClick={onTerms}>{english ? 'View terms' : 'Zobacz ustalenia'}<span aria-hidden="true">→</span></button>
  </section>;
}
