export const TERMS_MARKER = '\n\n[IdeaHire:terms:v1]';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Messages render the decision in the thread. New agreement records carry the
// authoritative response, so a pasted message cannot unlock or close terms.
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
  if (!agreement || !conversation || agreement.conversation_id !== conversation.id) return null;
  if (Object.hasOwn(agreement, 'response_action')) {
    if (!['changes', 'closed'].includes(agreement.response_action)
      || agreement.response_by != null && ![conversation.client_id, conversation.contractor_id].includes(agreement.response_by)
      || agreement.response_action === 'changes' && (!agreement.response_by || agreement.response_by === agreement.created_by)) return null;
    return {
      agreementId: agreement.id, version: Number(agreement.version), action: agreement.response_action,
      reason: agreement.response_reason || '', senderId: agreement.response_by,
      messageId: agreement.response_message_id, createdAt: agreement.responded_at,
    };
  }
  // Compatibility with conversations created before the database migration.
  return messages.map(message => readTermsDecision(message, agreement, conversation)).filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

export function termsDecisionContent(action, agreement, reason) {
  const title = action === 'closed' ? 'Rezygnacja ze współpracy' : 'Prośba o zmianę ustaleń';
  return `${title} — wersja ${agreement.version}.\n${reason.trim()}${TERMS_MARKER}${JSON.stringify({ agreementId: agreement.id, version: Number(agreement.version), action, reason: reason.trim() })}`;
}
