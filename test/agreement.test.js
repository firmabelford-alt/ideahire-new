import test from 'node:test';
import assert from 'node:assert/strict';
import { agreementToForm, EMPTY_AGREEMENT_FORM, agreementPermissions, latestTermsDecision, readTermsDecision, termsDecisionContent } from '../src/AgreementWorkflow.js';

const conversation = { id: 'room-1', client_id: 'client', contractor_id: 'freelancer' };
const agreement = { id: '11111111-1111-4111-8111-111111111111', conversation_id: conversation.id, version: 2, created_by: 'client' };
const message = (action, overrides = {}) => ({ id: 'message-1', conversation_id: conversation.id, sender_id: 'freelancer', created_at: '2026-10-25T10:00:00Z', content: termsDecisionContent(action, agreement, 'Inny termin realizacji'), ...overrides });

test('a database response survives message pagination and supplies the current decision', () => {
  const current = { ...agreement, response_action: 'changes', response_by: 'freelancer', response_reason: 'Przesuń termin', responded_at: '2026-10-25T10:00:00Z', response_message_id: 'message-1' };
  assert.equal(latestTermsDecision([], current, conversation)?.reason, 'Przesuń termin');
  assert.equal(latestTermsDecision([], current, conversation)?.senderId, 'freelancer');
});

test('pasting a terms marker cannot close or unlock an authoritative pending proposal', () => {
  const current = { ...agreement, response_action: null };
  assert.equal(latestTermsDecision([message('closed')], current, conversation), null);
  assert.equal(latestTermsDecision([message('changes')], current, conversation), null);
});

test('a server decision wins over a later contradictory message', () => {
  const current = { ...agreement, response_action: 'closed', response_by: 'client', response_reason: 'Rezygnacja', responded_at: '2026-10-25T09:00:00Z' };
  assert.equal(latestTermsDecision([message('changes')], current, conversation)?.action, 'closed');
});

test('legacy decisions from another room, version, author or hidden message are ignored', () => {
  assert.equal(readTermsDecision(message('changes', { conversation_id: 'another-room' }), agreement, conversation), null);
  assert.equal(readTermsDecision(message('changes', { sender_id: 'client' }), agreement, conversation), null);
  assert.equal(readTermsDecision(message('changes', { sender_id: 'stranger' }), agreement, conversation), null);
  assert.equal(readTermsDecision(message('changes', { moderation_status: 'hidden' }), agreement, conversation), null);
  assert.equal(readTermsDecision(message('changes'), { ...agreement, version: 3 }, conversation), null);
  assert.equal(latestTermsDecision([message('changes')], agreement, { ...conversation, id: 'another-room' }), null);
});

test('a new version clears the response to the old proposal', () => {
  const revised = { ...agreement, id: '22222222-2222-4222-8222-222222222222', version: 3, response_action: null };
  assert.equal(latestTermsDecision([message('changes'), message('closed')], revised, conversation), null);
});

test('old conversations can still show a valid recipient change request', () => {
  assert.equal(latestTermsDecision([message('changes')], agreement, conversation)?.action, 'changes');
});

test('erasing the response author does not reopen a closed collaboration', () => {
  assert.equal(latestTermsDecision([], { ...agreement, response_action: 'closed', response_by: null }, conversation)?.action, 'closed');
});

const serviceConversation = { ...conversation, agreements_required:true, origin_type:'service_inquiry',first_proposer_role:'client' };
const pending = { ...agreement,status:'proposed',client_accepted_at:'2026-10-26T12:00:00Z',contractor_accepted_at:null,response_action:null };
const permissions = (userId,record = pending,decision = null,extra = {}) => agreementPermissions({conversation:serviceConversation,agreement:record,userId,decision,...extra});
test('the client sends the first service proposal and waits without an edit or decision shortcut', () => {
  assert.equal(permissions('client',null).canStart,true);
  assert.equal(permissions('freelancer',null).canStart,false);
  const author = permissions('client');
  assert.equal(author.canEdit,false); assert.equal(author.canAccept,false); assert.equal(author.canDecline,false); assert.equal(author.waitingForResponse,true);
});
test('the freelancer can accept, ask for changes, counterpropose or decline client terms', () => {
  const recipient = permissions('freelancer');
  for (const action of ['canAccept','canEdit','canRequestChanges','canDecline']) assert.equal(recipient[action],true,action);
});
test('a request for changes unlocks a new version or a decision to end negotiations', () => {
  const decision = { action:'changes',senderId:'freelancer' };
  assert.equal(permissions('client',pending,decision).canEdit,true);
  assert.equal(permissions('client',pending,decision).canDecline,true);
  assert.equal(permissions('client',pending,decision).canAccept,false);
});
test('the client can accept, counter or decline a freelancer counterproposal; its author waits', () => {
  const counter = { ...pending,created_by:'freelancer',version:3,client_accepted_at:null,contractor_accepted_at:'2026-10-26T12:10:00Z' };
  const clientActions = permissions('client',counter);
  assert.equal(clientActions.canAccept,true); assert.equal(clientActions.canEdit,true); assert.equal(clientActions.canDecline,true);
  assert.equal(permissions('freelancer',counter).canEdit,false);
});
test('accepted, closed, stale, inaccessible or unconfirmed terms never expose negotiation actions', () => {
  const allDisabled = actions => ['canStart','canEdit','canAccept','canRequestChanges','canDecline'].forEach(action => assert.equal(actions[action],false,action));
  allDisabled(permissions('client',{...pending,status:'accepted'}));
  allDisabled(permissions('freelancer',pending,{action:'closed'}));
  allDisabled(permissions('freelancer',{...pending,status:'superseded'}));
  allDisabled(permissions('freelancer',{...pending,conversation_id:'other-room'}));
  allDisabled(permissions('stranger'));
  for (const extra of [{loading:true},{error:'refresh'},{blocked:true},{canTransact:false}]) allDisabled(permissions('freelancer',pending,null,extra));
});


test('editing preserves every field from the current proposal without changing its record', () => {
  const record = Object.freeze({
    ...pending, title:'Strona firmowa', scope:'Zakres\nz drugą linią', deliverables:'Kod i pliki',
    price_amount:800.5, price_currency:'PLN', deadline:'2026-11-05', revisions:0,
    delivery_format:'ZIP + PDF', acceptance_method:'Testy i odbiór w panelu',
    cancellation_terms:'Uzgodnione warunki anulowania', additional_terms:'Materiały dostarcza klient',
  });
  const form = agreementToForm(record,'Inny tytuł',9999);
  assert.deepEqual(form, {title:record.title,scope:record.scope,deliverables:record.deliverables,
    priceAmount:'800.5',priceCurrency:'PLN',deadline:record.deadline,revisions:'0',
    deliveryFormat:record.delivery_format,acceptanceMethod:record.acceptance_method,
    cancellationTerms:record.cancellation_terms,additionalTerms:record.additional_terms});
  form.scope = 'Poprawiony zakres';
  assert.equal(record.scope,'Zakres\nz drugą linią');
  assert.equal(record.status,'proposed');
  assert.equal(record.client_accepted_at,pending.client_accepted_at);
});
test('a new proposal uses clean defaults while preserving an explicit zero price', () => {
  assert.deepEqual(agreementToForm(null,'Nowe zlecenie',0),{...EMPTY_AGREEMENT_FORM,title:'Nowe zlecenie',priceAmount:'0'});
  const first = agreementToForm(null), second = agreementToForm(null);
  first.scope = 'Szkic';
  assert.equal(second.scope,''); assert.equal(EMPTY_AGREEMENT_FORM.scope,'');
});
