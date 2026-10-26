// Isolated PostgreSQL verification; never connects to a live Supabase project.
// npm install --prefix /tmp/ih-negotiation-test --no-save @electric-sql/pglite
// IDEAHIRE_PGLITE_MODULE=/tmp/ih-negotiation-test/node_modules/@electric-sql/pglite/dist/index.js \
//   node --test supabase/sql/verify/conversation-negotiation.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(process.env.IDEAHIRE_PGLITE_MODULE
  ? pathToFileURL(process.env.IDEAHIRE_PGLITE_MODULE).href : '@electric-sql/pglite');
const migration = await readFile(new URL('../functions/conversation_negotiation.sql', import.meta.url), 'utf8');
const client = '11111111-1111-4111-8111-111111111111';
const freelancer = '22222222-2222-4222-8222-222222222222';
const stranger = '33333333-3333-4333-8333-333333333333';
const room = '44444444-4444-4444-8444-444444444444';
const service = '55555555-5555-4555-8555-555555555555';
const inquiry = '66666666-6666-4666-8666-666666666666';
let db;

test.before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('test.user_id', true), '')::uuid;
    $$;
    create table public.conversations (
      id uuid primary key, client_id uuid, contractor_id uuid,
      first_proposer_role text default 'client', origin_type text default 'job', origin_id uuid
    );
    create table public.messages (
      id uuid primary key default gen_random_uuid(), conversation_id uuid references public.conversations,
      sender_id uuid references auth.users, content text not null, created_at timestamptz default now()
    );
    create table public.conversation_agreements (
      id uuid primary key default gen_random_uuid(), conversation_id uuid references public.conversations,
      version integer not null, created_by uuid references auth.users, status text default 'proposed',
      client_accepted_at timestamptz, contractor_accepted_at timestamptz,
      unique (conversation_id, version)
    );
    create table public.freelancer_services (id uuid primary key, capacity_limit integer default 1);
    create table public.service_inquiries (
      id uuid primary key, conversation_id uuid references public.conversations, service_id uuid references public.freelancer_services,
      status text default 'offer_sent', updated_at timestamptz default now()
    );
    create table public.service_reservations (
      id uuid primary key default gen_random_uuid(), inquiry_id uuid unique references public.service_inquiries,
      agreement_id uuid references public.conversation_agreements, service_id uuid references public.freelancer_services,
      status text default 'held', reserved_until timestamptz default now() + interval '24 hours', updated_at timestamptz default now()
    );
    create table public.ideahire_payments (id uuid primary key default gen_random_uuid(), agreement_id uuid references public.conversation_agreements, status text);
    create table public.user_blocks (blocker_id uuid, blocked_id uuid);
    grant usage on schema auth to authenticated;
    grant select on public.conversation_agreements to authenticated;
    insert into auth.users values ('${client}'), ('${freelancer}'), ('${stranger}');
    -- Dependency fixture: v2 replaces the previous proposal in one transaction.
    create function public.test_propose(p_room uuid) returns uuid language plpgsql as $$
    declare v_id uuid; v_version integer;
    begin
      perform 1 from public.conversations where id = p_room for update;
      update public.conversation_agreements set status = 'superseded' where conversation_id = p_room and status = 'proposed';
      select coalesce(max(version), 0) + 1 into v_version from public.conversation_agreements where conversation_id = p_room;
      insert into public.conversation_agreements (conversation_id, version, created_by, client_accepted_at, contractor_accepted_at)
      select p_room, v_version, auth.uid(), case when auth.uid() = client_id then now() end, case when auth.uid() = contractor_id then now() end
      from public.conversations where id = p_room returning id into v_id;
      return v_id;
    end; $$;
  `);
  await db.exec(migration);
});
test.after(async () => { await db?.close(); });
test.beforeEach(async () => {
  await db.exec(`truncate public.messages, public.conversations, public.conversation_agreements,
    public.freelancer_services, public.service_inquiries, public.service_reservations, public.ideahire_payments, public.user_blocks cascade;
    insert into public.conversations(id,client_id,contractor_id) values ('${room}','${client}','${freelancer}');`);
  await as(client);
});
const as = user => db.query("select set_config('test.user_id', $1, false)", [user]);
const propose = async () => (await db.query('select public.test_propose($1) as id', [room])).rows[0].id;
const respond = async (id, action, reason = '') => (await db.query('select public.respond_to_conversation_agreement($1,$2,$3) as result', [id, action, reason])).rows[0].result;
const row = async (table, id) => (await db.query(`select * from public.${table} where id=$1`, [id])).rows[0];
async function heldService() {
  await db.query("update public.conversations set origin_type='service_inquiry', origin_id=$1, first_proposer_role='contractor' where id=$2", [inquiry, room]);
  await as(freelancer);
  const id = await propose();
  await db.query('insert into public.freelancer_services(id) values($1)', [service]);
  await db.query('insert into public.service_inquiries(id,conversation_id,service_id) values($1,$2,$3)', [inquiry, room, service]);
  await db.query('insert into public.service_reservations(inquiry_id,agreement_id,service_id) values($1,$2,$3)', [inquiry, id, service]);
  return id;
}

test('client starts a job; author cannot replace a proposal waiting for the freelancer', async () => {
  await as(freelancer);
  await assert.rejects(propose, /Pierwszą propozycję/);
  await as(client);
  const id = await propose();
  await assert.rejects(propose, /czeka na odpowiedź/);
  assert.equal((await row('conversation_agreements', id)).status, 'proposed', 'failed revision must roll back superseding the active proposal');
});

test('recipient requests changes; only a new version can then be accepted', async () => {
  const id = await propose();
  await assert.rejects(() => respond(id, 'changes', 'Własna zmiana'), /Poczekaj/);
  await as(freelancer);
  const result = await respond(id, 'changes', 'Zmień termin na listopad');
  assert.equal(result.agreement.response_by, freelancer);
  await assert.rejects(() => db.query("update public.conversation_agreements set contractor_accepted_at=now(), status='accepted' where id=$1", [id]), /wymaga nowej wersji/);
  await as(client);
  const revised = await propose();
  assert.equal((await row('conversation_agreements', revised)).version, 2);
  assert.equal((await row('conversation_agreements', revised)).response_action, null);
  await assert.rejects(() => respond(id, 'closed', 'Nieaktualna wersja'), /nowsza propozycja/);
});

test('freelancer can counterpropose; the client can accept those conditions', async () => {
  await propose();
  await as(freelancer);
  const id = await propose();
  await assert.rejects(propose, /czeka na odpowiedź/);
  await as(client);
  await db.query("update public.conversation_agreements set client_accepted_at=now(), status='accepted' where id=$1", [id]);
  assert.equal((await row('conversation_agreements', id)).status, 'accepted');
  await assert.rejects(() => respond(id, 'closed', 'Nie zgadzam się'), /Zaakceptowanej/);
});

test('declining a service atomically releases its held slot and notifies the other participant once', async () => {
  const id = await heldService();
  await as(client);
  const result = await respond(id, 'closed', 'Nie zgadzam się na te warunki');
  assert.equal(result.released_slots, 1);
  assert.equal(result.message.sender_id, client);
  assert.match(result.message.content, /Rezygnacja ze współpracy/);
  assert.equal((await row('service_inquiries', inquiry)).status, 'declined');
  assert.ok((await row('conversations', room)).negotiation_closed_at);
  const slots = await db.query("select status, reserved_until from public.service_reservations where inquiry_id=$1", [inquiry]);
  assert.equal(slots.rows[0].status, 'released');
  assert.equal(slots.rows[0].reserved_until, null);
  const again = await respond(id, 'closed', 'Ponowienie');
  assert.equal(again.changed, false);
  assert.equal(again.message.id, result.message.id);
  assert.equal((await db.query('select count(*)::int as n from public.messages')).rows[0].n, 1);
  await as(freelancer);
  await assert.rejects(propose, /została porzucona/);
  await assert.rejects(() => db.query("update public.conversation_agreements set client_accepted_at=now() where id=$1", [id]), /została porzucona/);
});

test('a failed notification rolls back closure and slot release together', async () => {
  const id = await heldService();
  await db.exec("alter table public.messages add constraint simulate_message_failure check(content not like '%Rezygnacja ze współpracy%')");
  await as(client);
  try {
    await assert.rejects(() => respond(id, 'closed'), /simulate_message_failure/);
    assert.equal((await row('conversations', room)).negotiation_closed_at, null);
    assert.equal((await row('service_inquiries', inquiry)).status, 'offer_sent');
    assert.equal((await db.query('select status from public.service_reservations')).rows[0].status, 'held');
    assert.equal((await row('conversation_agreements', id)).response_action, null);
  } finally {
    await db.exec('alter table public.messages drop constraint simulate_message_failure');
  }
});

test('outsiders, invalid actions and blocked participants cannot record decisions', async () => {
  const id = await propose();
  await as(stranger);
  await assert.rejects(() => respond(id, 'closed'), /Nie masz dostępu/);
  await as(freelancer);
  await assert.rejects(() => respond(id, 'invalid'), /Nieprawidłowa/);
  await assert.rejects(() => respond(id, 'changes', 'ab'), /Opisz/);
  await db.query('insert into public.user_blocks values($1,$2)', [client, freelancer]);
  await assert.rejects(() => respond(id, 'closed'), /blokady/);
  assert.equal((await db.query('select count(*)::int as n from public.messages')).rows[0].n, 0);
});

test('payment and active reservations prevent negotiation cancellation', async () => {
  const id = await heldService();
  await as(client);
  await db.query("insert into public.ideahire_payments(agreement_id,status) values($1,'funds_secured')", [id]);
  await assert.rejects(() => respond(id, 'closed'), /rozpoczęte rozliczenie/);
  await db.exec('delete from public.ideahire_payments');
  await db.exec("update public.service_reservations set status='active'");
  await assert.rejects(() => respond(id, 'closed'), /Realizacja już się rozpoczęła/);
  assert.equal((await row('conversations', room)).negotiation_closed_at, null);
});

test('a change request can be followed by closure; reapplying the migration preserves history', async () => {
  const id = await heldService();
  await as(client);
  await respond(id, 'changes', 'Cena jest za wysoka');
  const result = await respond(id, 'closed', 'Rezygnuję');
  assert.equal(result.released_slots, 1);
  await db.exec(migration);
  assert.equal((await row('conversation_agreements', id)).response_action, 'closed');
  assert.equal((await db.query('select count(*)::int as n from public.messages')).rows[0].n, 2);
});

test('authenticated participants can use the RPC without direct write privileges', async () => {
  const id = await heldService();
  await as(client);
  await db.exec('set role authenticated');
  try {
    const result = await respond(id, 'closed', 'Nie akceptuję warunków');
    assert.equal(result.released_slots, 1);
    await assert.rejects(() => db.query("update public.conversation_agreements set response_action=null where id=$1", [id]), /permission denied/);
  } finally { await db.exec('reset role'); }
});

test('anonymous callers cannot execute the decision RPC', async () => {
  const id = await propose();
  await as('');
  await db.exec('set role anon');
  try { await assert.rejects(() => respond(id, 'closed'), /permission denied/); }
  finally { await db.exec('reset role'); }
  assert.equal((await row('conversation_agreements', id)).response_action, null);
});

test('removing a decision message does not block erasure or reopen the collaboration', async () => {
  const id = await heldService();
  await as(client);
  const result = await respond(id, 'closed', 'Rezygnuję');
  await db.query('delete from public.messages where id=$1', [result.message.id]);
  const record = await row('conversation_agreements', id);
  assert.equal(record.response_message_id, null);
  assert.equal(record.response_action, 'closed');
  assert.ok((await row('conversations', room)).negotiation_closed_at);
});

test('new service inquiries use the client as first proposer, including older inquiry RPC callers', async () => {
  await db.query('delete from public.conversations where id=$1', [room]);
  await db.query("insert into public.conversations(id,client_id,contractor_id,origin_type,first_proposer_role) values($1,$2,$3,'service_inquiry','contractor')", [room, client, freelancer]);
  assert.equal((await row('conversations', room)).first_proposer_role, 'client');
  await as(freelancer);
  await assert.rejects(propose, /Pierwszą propozycję/);
  await as(client);
  assert.ok(await propose());
});

test('the initial service message describes client-led terms without rewriting the brief', async () => {
  await db.query("update public.conversations set origin_type='service_inquiry', first_proposer_role='client' where id=$1", [room]);
  const oldNote = 'To niewiążące zapytanie. Oczekuję na ofertę wykonawcy z zakresem, terminem i ceną.';
  const brief = `Zapytanie o usługę: Zdjęcia\n\nCel i zakres:\nCytuję wcześniejszy opis: ${oldNote}\n\n`;
  const result = await db.query('insert into public.messages(conversation_id,sender_id,content) values($1,$2,$3) returning content', [room, client, brief + oldNote]);
  assert.ok(result.rows[0].content.startsWith(brief), 'the client brief stays intact');
  assert.match(result.rows[0].content.slice(brief.length), /Zleceniodawca przygotowuje pierwszą propozycję/);
});
