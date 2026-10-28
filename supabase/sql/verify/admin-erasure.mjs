// Isolated PostgreSQL tests. No live service, credentials or account data are used.
// IDEAHIRE_PGLITE_MODULE=/path/to/@electric-sql/pglite/dist/index.js node --test supabase/sql/verify/admin-erasure.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(process.env.IDEAHIRE_PGLITE_MODULE ? pathToFileURL(process.env.IDEAHIRE_PGLITE_MODULE).href : '@electric-sql/pglite');
const sql = await readFile(new URL('../functions/admin_erasure_relational_safety.sql',import.meta.url),'utf8');
const owner='11111111-1111-4111-8111-111111111111', target='22222222-2222-4222-8222-222222222222', other='33333333-3333-4333-8333-333333333333', admin='44444444-4444-4444-8444-444444444444';
const operation='55555555-5555-4555-8555-555555555555';
const id=n=>`aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12,'0')}`;
let db;
const scalar=async(query,params=[])=>Object.values((await db.query(query,params)).rows[0])[0];
const count=table=>scalar(`select count(*)::int from public.${table}`);

test.before(async()=>{
 db=new PGlite();
 await db.exec(`
  create role anon; create role authenticated; create schema auth; create schema storage;
  create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.user_id',true),'')::uuid$$;
  create table storage.objects(bucket_id text,owner_id text,name text);
  create table public.ideahire_staff(user_id uuid,role text,is_active boolean);
  create table public.ideahire_erasure_cases(id uuid primary key,privacy_request_id uuid,target_user_id uuid,action_type text,status text,owner_approved_by uuid,approved_at timestamptz,execution_started_by uuid,prepared_by uuid,execution_started_at timestamptz,completed_at timestamptz,inventory_snapshot jsonb,execution_result jsonb default '{}',failure_reason text,updated_at timestamptz);
  create table public.ideahire_erasure_case_events(id uuid default gen_random_uuid(),case_id uuid,actor_user_id uuid,actor_role text,event_type text,visibility text,message text,details jsonb,created_at timestamptz default now());
  create table public.profiles(id uuid primary key,name text,avatar_url text,about text,specialty_categories text[] default '{}',specialization text,skills text[] default '{}',completed_jobs int default 0,posted_jobs int default 0,disputed_jobs int default 0,positive_reviews int default 0,neutral_reviews int default 0,negative_reviews int default 0,updated_at timestamptz);
  create table public.public_profiles(user_id uuid primary key,name text,avatar_url text,bio text,country_code text,updated_at timestamptz);
  create table public.ideahire_age_profiles(user_id uuid,date_of_birth date,age_notice_version text,age_notice_acknowledged_at timestamptz,updated_at timestamptz);
  create table public.jobs(id uuid primary key,user_id uuid);
  create table public.conversations(id uuid primary key,client_id uuid,contractor_id uuid,job_id uuid);
  create table public.messages(id uuid primary key,conversation_id uuid references public.conversations(id),sender_id uuid);
  create table public.freelancer_services(id uuid primary key,freelancer_id uuid,status text,updated_at timestamptz);
  create table public.service_inquiries(id uuid primary key,service_id uuid references public.freelancer_services(id) on delete restrict,conversation_id uuid references public.conversations(id) on delete restrict,hidden_job_id uuid references public.jobs(id) on delete restrict,client_id uuid,freelancer_id uuid);
  create table public.service_reservations(id uuid primary key,service_id uuid references public.freelancer_services(id) on delete restrict);
  create table public.conversation_agreements(id uuid primary key,conversation_id uuid,status text);
  create table public.ideahire_payments(id uuid primary key,conversation_id uuid,job_id uuid,agreement_id uuid,client_id uuid,contractor_id uuid,status text);
  create table public.disputes(id uuid primary key,conversation_id uuid,job_id uuid,client_id uuid,contractor_id uuid,opened_by uuid,status text);
  create table public.dispute_message_evidence(message_id uuid references public.messages(id) on delete restrict);
  create table public.ideahire_portfolio_items(id uuid primary key,user_id uuid,image_path text);
  create table public.ideahire_portfolio_media(id uuid primary key,user_id uuid,portfolio_item_id uuid references public.ideahire_portfolio_items(id) on delete cascade,image_path text);
  create table public.ideahire_content_reports(conversation_id uuid,message_id uuid,shared_item_id uuid,portfolio_item_id uuid,portfolio_media_id uuid);
  create table public.ideahire_private_report_evidence(conversation_id uuid);
  create table public.ideahire_profile_inquiries(conversation_id uuid,project_job_id uuid references public.jobs(id) on delete restrict);
  create table public.ideahire_profile_contact_requests(conversation_id uuid);
  create table public.ideahire_work_deliveries(id uuid,conversation_id uuid);
  create table public.ideahire_shared_items(id uuid,conversation_id uuid,message_id uuid,delivery_id uuid,sender_id uuid,storage_bucket text,storage_path text);
  create table public.conversation_user_state(user_id uuid,conversation_id uuid);
  create table public.user_blocks(blocker_id uuid,blocked_id uuid);
  create table public.dispute_notifications(user_id uuid);
  create table public.job_applications(applicant_id uuid,job_id uuid,status text);
  create table public.ideahire_moderation_cases(target_user_id uuid,source_job_id uuid,status text,effective_at timestamptz,ends_at timestamptz);
  create table public.ideahire_moderation_notices(source_job_id uuid);
  create table public.ideahire_job_republication_holds(job_id uuid);
  create table public.ideahire_stripe_accounts(user_id uuid,stripe_account_id text,onboarding_status text,details_submitted boolean,charges_enabled boolean,payouts_enabled boolean);
  create table public.ideahire_legal_acceptances(user_id uuid);
  create table public.ideahire_privacy_requests(id uuid default gen_random_uuid(),requester_user_id uuid,request_type text,status text,decision_summary text,completed_at timestamptz,updated_at timestamptz);
  create table public.ideahire_privacy_request_events(request_id uuid,actor_user_id uuid,actor_role text,event_type text,visibility text,message text);
  create table public.ideahire_admin_audit_log(actor_user_id uuid,actor_role text,action text,target_user_id uuid,details jsonb);
  create table public.ideahire_account_lifecycle(user_id uuid,status text,data_minimized_at timestamptz,closed_at timestamptz,erasure_case_id uuid);
  create table public.ideahire_discovery_preferences(user_id uuid);
  create table public.ideahire_onboarding_profiles(user_id uuid);
  create table public.ideahire_lucyna_v2_preferences(user_id uuid);
  create table public.ideahire_lucyna_v2_threads(user_id uuid);
  create table public.ideahire_profile_discovery(user_id uuid);
 `);
 await db.exec(sql);
});
test.after(async()=>{await db.close();});
test.beforeEach(async()=>{
 await db.exec(`do $$declare r record;begin for r in select tablename from pg_tables where schemaname in ('public','auth','storage') loop execute format('truncate table %I.%I cascade',case when r.tablename='users' then 'auth' when r.tablename='objects' then 'storage' else 'public' end,r.tablename);end loop;end$$;`);
 await db.exec(`select set_config('test.user_id','${owner}',false);
  insert into auth.users(id) values('${owner}'),('${target}'),('${other}'),('${admin}');
  insert into public.ideahire_staff values('${owner}','owner',true),('${admin}','admin',true);
  insert into public.ideahire_erasure_cases(id,privacy_request_id,target_user_id,action_type,status,owner_approved_by,approved_at,execution_started_by) values('${operation}','${id(99)}','${target}','minimize_data','processing','${owner}',now(),'${owner}');
  insert into public.ideahire_privacy_requests(id,requester_user_id,request_type,status) values('${id(99)}','${target}','erasure','in_progress');
  insert into public.profiles(id,name,about,avatar_url,skills) values('${target}','Sample','Profile text','photo',array['Skill']);
  insert into public.public_profiles values('${target}','Sample','photo','Bio','PL',now());
  insert into public.ideahire_age_profiles values('${target}','1990-01-01','v1',now(),now());
  insert into public.ideahire_account_lifecycle(user_id,status) values('${target}','erasure_pending');
  insert into public.conversations values('${id(1)}','${target}','${other}',null),('${id(2)}','${target}','${other}',null),('${id(3)}','${target}','${other}',null),('${id(4)}','${target}','${other}',null),('${id(5)}','${target}','${other}',null),('${id(6)}','${target}','${other}',null);
  insert into public.messages values('${id(11)}','${id(1)}','${target}'),('${id(13)}','${id(3)}','${target}'),('${id(14)}','${id(4)}','${target}'),('${id(15)}','${id(5)}','${other}'),('${id(16)}','${id(6)}',null);
  insert into public.dispute_message_evidence values('${id(14)}');
  insert into public.freelancer_services values('${id(21)}','${target}','active',now()),('${id(22)}','${target}','active',now());
  insert into public.service_inquiries values('${id(30)}','${id(22)}','${id(2)}',null,'${other}','${target}');
  insert into public.conversation_agreements values('${id(31)}','${id(3)}','accepted');
  insert into public.ideahire_payments values('${id(32)}','${id(3)}',null,'${id(31)}','${target}','${other}','pending');
  insert into public.disputes values('${id(33)}','${id(3)}',null,'${target}','${other}','${other}','open');
  insert into public.ideahire_portfolio_items(id,user_id) values('${id(40)}','${target}'),('${id(41)}','${target}');
  insert into public.ideahire_portfolio_media(id,user_id,portfolio_item_id) values('${id(42)}','${target}','${id(40)}'),('${id(43)}','${target}','${id(41)}');
  insert into public.ideahire_content_reports(portfolio_item_id) values('${id(41)}');
  insert into public.user_blocks values('${target}','${other}'),('${other}','${target}');
 `);
 for(const table of ['ideahire_discovery_preferences','ideahire_onboarding_profiles','ideahire_lucyna_v2_preferences','ideahire_lucyna_v2_threads','ideahire_profile_discovery'])await db.exec(`insert into public.${table} values('${target}'),('${other}')`);
});

test('approved minimization keeps the login and all inquiry, payment, dispute and other-party records',async()=>{
 const before=await scalar('select public.ideahire_build_erasure_inventory($1)',[target]);
 assert.equal(before.erasable_now.removable_conversations,1);
 const result=await scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]);
 assert.equal(result.conversations_deleted,1);assert.equal(result.messages_deleted,1);
 assert.equal(await count('service_inquiries'),1);assert.equal(await count('ideahire_payments'),1);assert.equal(await count('disputes'),1);
 assert.equal(await scalar('select count(*)::int from auth.users where id=$1',[target]),1);
 assert.equal(await scalar('select name from public.profiles where id=$1',[target]),'Profil bez danych');
 assert.equal(await scalar('select count(*)::int from public.messages where sender_id is null'),1);
 assert.equal(await scalar('select count(*)::int from public.messages where sender_id=$1',[other]),1);
});
test('optional portfolio, service offers and personalization are removed without deleting protected records',async()=>{
 const result=await scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]);
 assert.equal(result.portfolio_items_deleted,1);assert.equal(result.portfolio_images_deleted,1);
 assert.equal(result.services_deleted,1);assert.equal(result.services_paused,1);
 assert.equal(await count('ideahire_portfolio_items'),1);assert.equal(await scalar('select status from public.freelancer_services'),'paused');
 for(const table of ['ideahire_discovery_preferences','ideahire_onboarding_profiles','ideahire_lucyna_v2_preferences','ideahire_lucyna_v2_threads','ideahire_profile_discovery']){
  assert.equal(await scalar(`select count(*)::int from public.${table} where user_id=$1`,[target]),0);
  assert.equal(await scalar(`select count(*)::int from public.${table} where user_id=$1`,[other]),1);
 }
});
test('data erasure cannot remove another person’s block against the still-active account',async()=>{
 await scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]);
 assert.equal(await scalar('select count(*)::int from public.user_blocks where blocker_id=$1 and blocked_id=$2',[other,target]),1);
 assert.equal(await scalar('select count(*)::int from public.user_blocks where blocker_id=$1',[target]),0);
});
test('resuming the data phase is idempotent and never removes inquiry references',async()=>{
 const first=await scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]);
 const again=await scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]);
 assert.deepEqual(again,first);assert.equal(await count('service_inquiries'),1);
 assert.equal(await scalar("select count(*)::int from public.ideahire_erasure_case_events where event_type='data_minimized'"),1);
});
test('unapproved operations, ordinary users and a different administrator are rejected',async()=>{
 await db.exec(`select set_config('test.user_id','${target}',false)`);
 await assert.rejects(()=>scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]),/Brak uprawnień/);
 await db.exec(`select set_config('test.user_id','${admin}',false)`);
 await assert.rejects(()=>scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]),/rozpoczął/);
 await db.exec(`select set_config('test.user_id','${owner}',false);update public.ideahire_erasure_cases set approved_at=null;`);
 await assert.rejects(()=>scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]),/Brak ważnego zatwierdzenia/);
 assert.equal(await scalar('select name from public.profiles'),'Sample');
});
test('a recorded failure stays resumable and cannot be presented as completed',async()=>{
 await db.query('select public.admin_note_ideahire_erasure_failure($1,$2,$3,$4)',[operation,'data','23503','Operacja została przerwana na powiązanych danych.']);
 assert.equal(await scalar('select status from public.ideahire_erasure_cases'),'processing');
 assert.equal(await scalar("select execution_result->'last_error'->>'code' from public.ideahire_erasure_cases"),'23503');
 assert.equal(await scalar('select event_type from public.ideahire_erasure_case_events'),'failed');
});
test('the internal inventory is not exposed directly to anonymous or ordinary authenticated callers',async()=>{
 assert.equal(await scalar("select has_function_privilege('anon','public.ideahire_build_erasure_inventory(uuid)','execute')"),false);
 assert.equal(await scalar("select has_function_privilege('authenticated','public.ideahire_build_erasure_inventory(uuid)','execute')"),false);
 assert.equal(await scalar("select has_function_privilege('authenticated','public.admin_apply_ideahire_erasure_data(uuid)','execute')"),true);
});

test('reported portfolio files remain available as evidence when the avatar batch is prepared',async()=>{
 await db.exec(`update public.ideahire_portfolio_items set image_path='${target}/protected.jpg' where id='${id(41)}';
 insert into storage.objects values('avatars','${target}','${target}/protected.jpg'),('avatars','${target}','${target}/ordinary.jpg');`);
 const result=await scalar('select public.admin_begin_ideahire_erasure_execution($1)',[operation]);
 assert.equal(result.avatar_objects.length,1);assert.match(result.avatar_objects[0].name,/ordinary.jpg/);
 assert.equal(result.inventory.erasable_now.avatar_objects,1);
 await db.exec('update public.ideahire_erasure_cases set approved_at=null');
 await assert.rejects(()=>scalar('select public.admin_begin_ideahire_erasure_execution($1)',[operation]),/Brak ważnego zatwierdzenia/);
});

test('finalization requires a real successful data checkpoint and keeps minimization login active',async()=>{
 await assert.rejects(()=>scalar('select public.admin_finalize_ideahire_erasure_case($1,false,$2,null)',[operation,{data_minimization:{}}]),/Brak potwierdzonego wyniku/);
 const data=await scalar('select public.admin_apply_ideahire_erasure_data($1)',[operation]);
 await assert.rejects(()=>scalar('select public.admin_finalize_ideahire_erasure_case($1,false,$2,$3)',[operation,{data_minimization:data},'Niepowodzenie końcowego etapu.']),/Brak potwierdzonego wyniku/);
 assert.equal(await scalar('select status from public.ideahire_erasure_cases'),'processing');
 await scalar('select public.admin_finalize_ideahire_erasure_case($1,false,$2,null)',[operation,{data_minimization:data}]);
 assert.equal(await scalar('select status from public.ideahire_erasure_cases'),'completed');
 assert.equal(await scalar('select status from public.ideahire_privacy_requests'),'completed');
 assert.equal(await scalar('select status from public.ideahire_account_lifecycle'),'active');
 assert.equal(await scalar('select count(*)::int from auth.users where id=$1',[target]),1);
});
test('private-work enumeration retains conversation-level evidence and only returns an unrelated file',async()=>{
 await db.exec(`insert into public.ideahire_shared_items(id,conversation_id,message_id,sender_id,storage_bucket,storage_path) values('${id(61)}','${id(1)}','${id(11)}','${target}','ideahire-private-work','ordinary.pdf'),('${id(62)}','${id(4)}','${id(14)}','${target}','ideahire-private-work','evidence.pdf');`);
 const result=await scalar('select public.admin_get_ideahire_erasure_work_objects($1)',[operation]);
 assert.deepEqual(result.work_objects.map(x=>x.name),['ordinary.pdf']);
});
