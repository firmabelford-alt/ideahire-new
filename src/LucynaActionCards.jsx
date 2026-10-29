import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Copy, FileText, Wallet } from 'lucide-react';
import { LUCYNA_TARGETS, normalizeLucynaAction } from './LucynaActions';

const money = value => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
export default function LucynaActionCards({ actions, userId, onNotice, administration = false }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(null);
  async function copy(action, index) {
    try {
      await navigator.clipboard.writeText([action.draft.title, action.draft.description, action.draft.expected_outcome].filter(Boolean).join('\n\n'));
      setCopied(index);
    } catch { onNotice('Zaznacz i skopiuj treść szkicu z podglądu.'); }
  }
  return <div className="lu-action-cards">{(actions || []).slice(0, 3).map((raw, index) => {
    const action = normalizeLucynaAction(raw);
    if (!action) return null;
    if (action.kind === 'navigation') {
      const target = LUCYNA_TARGETS[action.target];
      return <Link key={index} className="lu-next-action" to={target.to} data-no-route-transition="true"><span>{target.label}</span><ArrowRight size={18} aria-hidden="true" /></Link>;
    }
    if (action.kind === 'fee') return <section className="lu-fee-card" key={index} aria-label="Pomocnicze obliczenie kosztu współpracy"><div><Wallet size={18} aria-hidden="true" /><strong>Koszt współpracy</strong><span>Obliczenie, bez płatności</span></div><dl><div><dt>Wynagrodzenie wykonawcy</dt><dd>{money(action.amount)}</dd></div><div><dt>Opłata IdeaHire</dt><dd>{money(action.fee)}</dd></div><div><dt>Razem dla klienta</dt><dd>{money(action.total)}</dd></div></dl><p>5,5%, min. 20 zł, maks. 229 zł. Kwotę do zapłaty sprawdzisz w podsumowaniu współpracy; tutaj nie ustalamy VAT ani statusu Stripe.</p></section>;
    const d = action.draft;
    return <section className="lu-draft-card" key={index} aria-label="Szkic zlecenia do sprawdzenia"><div className="lu-draft-label"><FileText size={18} aria-hidden="true" /><span>Szkic zlecenia</span><small>Do Twojej akceptacji</small></div><h3>{d.title}</h3><p>{d.category}{d.budget !== null ? ' · ' + money(d.budget) : ' · Budżet do ustalenia'}</p><details><summary>Przejrzyj przygotowaną treść</summary><p>{d.description}</p>{d.expected_outcome && <><strong>Oczekiwany rezultat</strong><p>{d.expected_outcome}</p></>}{d.project_deadline && <p>Termin: {d.project_deadline}</p>}</details><div className="lu-tool-actions">{!administration && <button type="button" className="lu-primary" onClick={() => navigate('/find-talent', { state: { lucynaJobDraft: { userId, action } } })}>Uzupełnij formularz<ArrowRight size={16} aria-hidden="true" /></button>}<button type="button" className="lu-secondary" onClick={() => copy(action, index)}>{copied === index ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}{copied === index ? 'Skopiowano' : 'Kopiuj szkic'}</button></div><p className="lu-tool-note">Sprawdź treść i uzupełnij brakujące pola. Ogłoszenie opublikujesz samodzielnie w formularzu.</p></section>;
  })}</div>;
}
