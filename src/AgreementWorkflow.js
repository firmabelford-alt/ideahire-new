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

export function agreementPermissions({ conversation, agreement, userId, decision, loading = false, error = '', blocked = false, canTransact = true, waitingForReply = false }) {
  const participant = Boolean(userId && conversation && [conversation.client_id,conversation.contractor_id].includes(userId));
  const eligible = participant && conversation.agreements_required && !loading && !error && !blocked && canTransact;
  const firstId = conversation?.first_proposer_role === 'contractor' ? conversation?.contractor_id:conversation?.client_id;
  const proposalByMe = Boolean(agreement && agreement.created_by === userId);
  const acceptedByMe = Boolean(agreement && (userId === conversation?.client_id ? agreement.client_accepted_at:agreement.contractor_accepted_at));
  const otherAccepted = Boolean(agreement && (userId === conversation?.client_id ? agreement.contractor_accepted_at:agreement.client_accepted_at));
  const closed = Boolean(conversation?.negotiation_closed_at || decision?.action === 'closed');
  const proposed = Boolean(eligible && !closed && agreement?.conversation_id === conversation.id && agreement.status === 'proposed');
  const changes = decision?.action === 'changes';
  const canStart = Boolean(eligible && !closed && !agreement && firstId === userId && !waitingForReply);
  return {
    proposalByMe, canStart,
    canEdit: Boolean(canStart || proposed && (changes || !proposalByMe && !acceptedByMe)),
    canAccept: Boolean(proposed && !decision && !acceptedByMe && (!proposalByMe || otherAccepted)),
    canRequestChanges: Boolean(proposed && !decision && !proposalByMe && !acceptedByMe),
    canDecline: Boolean(proposed && (changes || !proposalByMe && !acceptedByMe)),
    waitingForResponse: Boolean(proposed && proposalByMe && !decision),
  };
}

// Editing starts from the full current version; sending creates a separate proposal.
export const EMPTY_AGREEMENT_FORM = {
  title: "",
  scope: "",
  deliverables: "",
  priceAmount: "",
  priceCurrency: "PLN",
  deadline: "",
  revisions: "1",
  deliveryFormat: "",
  acceptanceMethod: "",
  cancellationTerms: "",
  additionalTerms: "",
};

export function agreementToForm(
  agreement,
  fallbackTitle = "",
  fallbackPrice = ""
) {
  if (!agreement) {
    return {
      ...EMPTY_AGREEMENT_FORM,
      title: fallbackTitle || "",
      priceAmount:
        fallbackPrice === null ||
        fallbackPrice === undefined
          ? ""
          : String(fallbackPrice),
      priceCurrency: "PLN",
    };
  }

  return {
    title: agreement.title || "",
    scope: agreement.scope || "",
    deliverables:
      agreement.deliverables || "",
    priceAmount:
      agreement.price_amount == null
        ? ""
        : String(agreement.price_amount),
    priceCurrency:
      agreement.price_currency || "PLN",
    deadline: agreement.deadline || "",
    revisions: String(
      agreement.revisions ?? 0
    ),
    deliveryFormat:
      agreement.delivery_format || "",
    acceptanceMethod:
      agreement.acceptance_method || "",
    cancellationTerms:
      agreement.cancellation_terms || "",
    additionalTerms:
      agreement.additional_terms || "",
  };
}
