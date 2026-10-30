import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { writeFile,unlink } from 'node:fs/promises';
const compiled=new URL(`.erasure-worker-${process.pid}.mjs`,import.meta.url);
const bundle=await build({entryPoints:[new URL('../supabase/functions/ideahire-admin-erasure/index.ts',import.meta.url).pathname],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent',plugins:[{name:'isolated-client',setup(b){b.onResolve({filter:/^npm:@supabase\/supabase-js@/},()=>({path:'client',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const createClient=(...args)=>globalThis.__erasureClient(...args);',loader:'js'}));}}]});
let handler;
globalThis.Deno={env:{get:key=>key==='SUPABASE_URL'?'https://test.invalid':key==='SUPABASE_SERVICE_ROLE_KEY'?'service-fixture':'public-fixture'},serve:fn=>{handler=fn;}};
await writeFile(compiled,bundle.outputFiles[0].text);await import(compiled.href);await unlink(compiled);delete globalThis.Deno;
const actor='11111111-1111-4111-8111-111111111111',target='22222222-2222-4222-8222-222222222222',caseId='33333333-3333-4333-8333-333333333333';
function fixture(options={}){
 const calls=[], action=options.action||'minimize_data';
 const userClient={auth:{getUser:async()=>({data:{user:options.expired?null:{id:actor}},error:options.expired?{message:'Expired'}:null})},from:()=>({select(){return this;},eq(){return this;},async maybeSingle(){return {data:options.missing?null:{id:caseId,status:options.status||'processing',action_type:action,execution_result:{account_remains_active:true}},error:null};}}),async rpc(name,args){calls.push({name,args});
  if(name==='admin_begin_ideahire_erasure_execution')return {data:{target_user_id:options.self?actor:target,action_type:action,avatar_objects:[{bucket_id:'avatars',name:'photo.jpg'}],resumed:true},error:null};
  if(name==='admin_get_ideahire_erasure_work_objects')return {data:{work_objects:[]},error:null};
  if(name==='admin_apply_ideahire_erasure_data')return options.failure?{data:null,error:options.failure}:{data:{profile_rows_anonymized:1},error:null};
  return {data:null,error:null};
 }};
 const serviceClient={storage:{from:bucket=>({remove:async paths=>{calls.push({name:'storage.remove',bucket,paths});return {data:paths.map(name=>({name})),error:null};}})},auth:{admin:{getUserById:async()=>({data:{user:{user_metadata:{name:'Sample',old:null}}},error:null}),updateUserById:async(id,values)=>{calls.push({name:'auth.metadata',id,values});return {error:null};},deleteUser:async(id,soft)=>{calls.push({name:'auth.deleteUser',id,soft});return {error:null};}}}};
 globalThis.__erasureClient=(_url,key)=>key==='service-fixture'?serviceClient:userClient;
 return {calls,request:async(body={},signedIn=true)=>{
  const response=await handler(new Request('https://test.invalid',{method:'POST',headers:{Origin:'https://ideahire-new.pages.dev','Content-Type':'application/json',...(signedIn?{Authorization:'Bearer test-session'}:{})},body:JSON.stringify({caseId,expectedActionType:action,...body})}));
  return {status:response.status,data:await response.json()};
 }};
}
test('the erasure worker rejects an absent or expired session without changing files or data',async()=>{
 for(const expired of [false,true]){const f=fixture({expired});const r=await f.request({},expired);assert.equal(r.status,401);assert.equal(f.calls.length,0);}
});
test('a stale action selection and a missing case cannot start a destructive operation',async()=>{
 let f=fixture();assert.equal((await f.request({expectedActionType:'close_account'})).status,409);assert.equal(f.calls.length,0);
 f=fixture({missing:true});assert.equal((await f.request()).status,404);assert.equal(f.calls.length,0);
});
test('an already completed erasure is returned without re-executing it',async()=>{
 const f=fixture({status:'completed'}),r=await f.request();assert.equal(r.data.alreadyCompleted,true);assert.equal(f.calls.length,0);
});
test('an owner phrase is required before an awaiting operation can be authorized',async()=>{
 const f=fixture({status:'awaiting_owner'});assert.equal((await f.request()).status,409);assert.equal(f.calls.length,0);
});
test('minimization clears optional metadata and data but never closes the login account',async()=>{
 const f=fixture(),r=await f.request({executionConfirmation:'ZATWIERDZAM USUNIECIE'});assert.equal(r.status,200);assert.equal(r.data.ok,true);assert.equal(r.data.executionResult.auth_soft_deleted,false);
 assert.equal(f.calls.some(x=>x.name==='auth.deleteUser'),false);
 assert.deepEqual(f.calls.find(x=>x.name==='auth.metadata').values,{user_metadata:{name:null}});
 assert.equal(f.calls.filter(x=>x.name==='admin_apply_ideahire_erasure_data').length,1);
 assert.equal(f.calls.at(-1).name,'admin_finalize_ideahire_erasure_case');
});
test('a relational failure is reported at its real stage and cannot finalize the case as complete',async()=>{
 const f=fixture({failure:{code:'23503',message:'foreign key internal detail'}}),r=await f.request({executionConfirmation:'ZATWIERDZAM USUNIECIE'});
 assert.equal(r.status,409);assert.equal(r.data.code,'23503');assert.equal(r.data.stage,'apply_data');assert.equal(r.data.retryable,false);
 assert.doesNotMatch(r.data.error,/foreign key|internal detail/);
 assert.equal(f.calls.some(x=>x.name==='admin_finalize_ideahire_erasure_case'),false);
 assert.equal(f.calls.at(-1).name,'admin_note_ideahire_erasure_failure');
});
