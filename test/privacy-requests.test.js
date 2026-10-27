import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrivacyController, privacyCall, privacyDraftProblem } from '../src/PrivacyRequests.js';

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture({ query = () => Promise.resolve({ data: [] }), rpc = () => Promise.resolve({ data: null }) } = {}) {
  const changes = [], calls = [], filters = [];
  const client = {
    from(table) {
      const builder = { select() { return this; }, eq(key, value) { filters.push([key, value]); return this; }, order() { return this; }, in() { return this; }, abortSignal(signal) { return query(table, signal); } };
      return builder;
    },
    rpc(name, args) { calls.push({ name, args }); return { abortSignal: signal => rpc(name, args, signal) }; },
  };
  const controller = createPrivacyController({ client, ownerId: 'owner-a', onChange: patch => changes.push(patch), readTimeoutMs: 20, writeTimeoutMs: 20 });
  return { controller, changes, calls, filters };
}
const submission = { key: 'submit', rpc: 'submit_ideahire_privacy_request', args: { p_description: 'A request with enough detail' }, success: 'Sent', failure: 'Could not send' };

test('confirmed submission releases the form immediately even when the following history request never settles', async () => {
  const f = fixture({ query: () => new Promise(() => {}), rpc: () => Promise.resolve({ data: 'saved-request' }) });
  const result = await f.controller.mutate(submission);
  assert.deepEqual(result, { ok: true, data: 'saved-request' });
  assert.equal(f.changes.filter(patch => 'busy' in patch).at(-1).busy, '');
  assert.equal(f.changes.filter(patch => patch.action?.notice).at(-1).action.notice.tone, 'success');
  f.controller.dispose();
});

test('a history failure after a confirmed write is a history error, never a failed submission', async () => {
  const f = fixture({ query: () => Promise.resolve({ error: { code: '503', message: 'Offline' } }) });
  await f.controller.mutate(submission);
  await tick();
  assert.ok(f.changes.some(patch => patch.historyError));
  assert.equal(f.changes.filter(patch => patch.action?.notice).at(-1).action.notice.text, 'Sent');
  assert.equal(f.calls.filter(call => call.name === submission.rpc).length, 1);
  f.controller.dispose();
});

test('a synchronous duplicate click cannot submit twice before React rerenders', async () => {
  const pending = deferred();
  const f = fixture({ rpc: () => pending.promise });
  const first = f.controller.mutate(submission);
  const second = await f.controller.mutate(submission);
  assert.deepEqual(second, { ok: false, ignored: true });
  pending.resolve({ data: 'saved-request' });
  assert.equal((await first).ok, true);
  assert.equal(f.calls.filter(call => call.name === submission.rpc).length, 1);
  f.controller.dispose();
});

test('a timed out write unlocks controls, reports an uncertain result and never retries the operation', async () => {
  const f = fixture({ rpc: () => new Promise(() => {}) });
  const result = await f.controller.mutate(submission);
  assert.equal(result.ok, false);
  assert.equal(result.uncertain, true);
  assert.equal(f.calls.filter(call => call.name === submission.rpc).length, 1);
  assert.equal(f.changes.filter(patch => 'busy' in patch).at(-1).busy, '');
  assert.match(f.changes.find(patch => patch.action?.notice?.uncertain).action.notice.text, /Sprawdź historię/);
  f.controller.dispose();
});

test('business validation from the server remains actionable and is not presented as a transport timeout', async () => {
  const f = fixture({ rpc: () => Promise.resolve({ error: { code: 'P0001', message: 'Masz już aktywny wniosek tego rodzaju.' } }) });
  assert.equal((await f.controller.mutate(submission)).uncertain, false);
  assert.equal(f.changes.filter(patch => patch.action?.notice).at(-1).action.notice.text, 'Masz już aktywny wniosek tego rodzaju.');
  f.controller.dispose();
});

test('withdrawal feedback belongs to its request and status changes before a history refresh can fail', async () => {
  let reads = 0;
  const f = fixture({ query: table => {
    if (table === 'ideahire_privacy_request_events') return Promise.resolve({ data: [] });
    reads += 1;
    return reads === 1 ? Promise.resolve({ data: [{ id: 'request-a', status: 'submitted' }] }) : new Promise(() => {});
  }, rpc: name => Promise.resolve({ data: name === 'get_my_ideahire_privacy_audits' ? [] : null }) });
  await f.controller.refresh();
  await f.controller.mutate({ ...submission, key: 'request-a', scope: 'request-a', rpc: 'withdraw_my_ideahire_privacy_request', success: 'Withdrawn', updateRequest: request => ({ ...request, status: 'withdrawn' }) });
  assert.equal(f.changes.filter(patch => patch.requests).at(-1).requests[0].status, 'withdrawn');
  assert.equal(f.changes.filter(patch => patch.action?.notice).at(-1).action.scope, 'request-a');
  f.controller.dispose();
});

test('leaving the account cancels pending reads and writes without late state or feedback', async () => {
  const read = deferred(), write = deferred();
  const f = fixture({ query: () => read.promise, rpc: () => write.promise });
  const loading = f.controller.refresh(), saving = f.controller.mutate(submission);
  await tick();
  f.controller.dispose();
  const length = f.changes.length;
  read.resolve({ data: [{ id: 'private-old-owner' }] });
  write.resolve({ data: 'private-old-owner' });
  await Promise.all([loading, saving]);
  assert.equal(f.changes.length, length);
});

test('a superseded read cannot replace a newer confirmed history snapshot', async () => {
  const old = deferred(); let reads = 0;
  const f = fixture({ query: () => ++reads === 1 ? old.promise : Promise.resolve({ data: [] }) });
  const first = f.controller.refresh();
  await tick();
  await f.controller.refresh();
  old.resolve({ data: [{ id: 'stale' }] });
  await first;
  assert.deepEqual(f.changes.filter(patch => patch.requests).at(-1).requests, []);
  assert.ok(f.filters.every(([key, owner]) => key === 'requester_user_id' && owner === 'owner-a'));
  f.controller.dispose();
});

test('request rows remain visible if reports fail; no generic empty state replaces them', async () => {
  const f = fixture({ query: table => Promise.resolve({ data: table === 'ideahire_privacy_requests' ? [{ id: 'request-a' }] : [] }), rpc: () => Promise.resolve({ error: { code: '503' } }) });
  await f.controller.refresh();
  assert.equal(f.changes.filter(patch => patch.requests).at(-1).requests[0].id, 'request-a');
  assert.ok(f.changes.some(patch => /raportów/.test(patch.historyError || '')));
  assert.equal(f.changes.at(-1).loading, false);
  f.controller.dispose();
});

test('closing an account is distinct from minimizing data and requires eligibility', () => {
  const form = { description: 'Proszę o usunięcie moich danych.', requestType: 'erasure', requestedErasureAction: '' };
  assert.equal(privacyDraftProblem(form, true).field, 'privacy-erasure-options');
  assert.ok(privacyDraftProblem({ ...form, requestedErasureAction: 'close_account' }, false));
  assert.equal(privacyDraftProblem({ ...form, requestedErasureAction: 'minimize_data' }, false), null);
  assert.equal(privacyDraftProblem({ ...form, requestedErasureAction: 'close_account' }, true), null);
});

test('short and oversize drafts explain the limit at the description field', () => {
  assert.equal(privacyDraftProblem({ description: 'Short', requestType: 'access' }).field, 'privacy-description');
  assert.equal(privacyDraftProblem({ description: 'x'.repeat(5001), requestType: 'access' }).field, 'privacy-description');
});

test('a disposed deadline does not start a network operation at all', async () => {
  const controller = new AbortController(); controller.abort(); let called = false;
  await assert.rejects(privacyCall(() => { called = true; }, { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(called, false);
});
