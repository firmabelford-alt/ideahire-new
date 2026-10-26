import test from 'node:test';
import assert from 'node:assert/strict';
import { latestTermsDecision, readTermsDecision, termsDecisionContent } from '../src/AgreementWorkflow.js';

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
