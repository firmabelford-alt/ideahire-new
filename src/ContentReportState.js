export const CONTENT_CONTACT_EMAIL = 'ideahireprywatnosc@gmail.com';
export const CONTENT_REPORT_REASONS = [
  ['copyright','Prawa autorskie','Copyright'],
  ['privacy_or_image_rights','Prywatność lub wizerunek','Privacy or image rights'],
  ['impersonation','Podszywanie się','Impersonation'],
  ['harassment_or_threats','Nękanie lub groźby','Harassment or threats'],
  ['fraud_or_scam','Oszustwo','Fraud or scam'],
  ['illegal_goods_or_services','Nielegalne towary lub usługi','Illegal goods or services'],
  ['other_terms_breach','Naruszenie regulaminu','Terms violation'],
  ['other_illegal_content','Inna potencjalnie nielegalna treść','Other potentially illegal content'],
];
export function contentReportLocation(value) {
  const text=String(value||'').trim();
  if (!text || text.length>2000 || /[\u0000-\u001f\u007f]/.test(text)) return '';
  try {
    const url=new URL(text,'https://ideahire-new.pages.dev');
    return url.origin==='https://ideahire-new.pages.dev' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function contentReportProblem({location,reason,explanation,legalReference,goodFaith},en=false) {
  if (!contentReportLocation(location)) return en?'Paste a link to the content on IdeaHire.':'Wklej link do zgłaszanej treści w IdeaHire.';
  if (!CONTENT_REPORT_REASONS.some(([value])=>value===reason)) return en?'Choose a reason.':'Wybierz powód zgłoszenia.';
  if (String(explanation||'').trim().length<50 || String(explanation||'').trim().length>5000) return en?'Explain the issue in 50–5000 characters.':'Opisz problem w 50–5000 znakach.';
  if (String(legalReference||'').trim().length>1500) return en?'The reference can contain up to 1500 characters.':'Podstawa zgłoszenia może mieć do 1500 znaków.';
  if (!goodFaith) return en?'Confirm the good faith statement.':'Potwierdź oświadczenie o dobrej wierze.';
  return '';
}
