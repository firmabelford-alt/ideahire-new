import test from 'node:test';
import assert from 'node:assert/strict';
import { executeErasure,erasureFailureMessage,erasureScopeRows,erasureOutcomeKnown,ERASURE_CONFIRMATION } from '../src/ErasureWorkflow.js';
const confirmedScope={caseId:'case',expectedActionType:'minimize_data',executionConfirmation:ERASURE_CONFIRMATION};
test('HTTP errors expose the actual stage, preserve the response and avoid generic Edge Function copy',async()=>{
  const response=new Response(JSON.stringify({error:'internal FK',code:'23503',stage:'apply_data'}),{status:409});
  let calls=0;
  await assert.rejects(()=>executeErasure({functions:{invoke:async()=>{calls++;return{error:{message:'Edge Function returned a non-2xx status code',context:response}};}}},confirmedScope),error=>{
    assert.equal(error.code,'23503');assert.match(erasureFailureMessage(error),/powiązanych danych/);assert.match(erasureFailureMessage(error),/Etap: dane profilu/);assert.doesNotMatch(erasureFailureMessage(error),/Edge Function|internal FK/);return true;
  });
  assert.equal(calls,1);assert.equal(response.bodyUsed,false);
});
test('a slow erasure stays unconfirmed, aborts the wait and is never retried',async()=>{
  let calls=0,signal;
  await assert.rejects(()=>executeErasure({functions:{invoke:(_name,options)=>{calls++;signal=options.signal;return new Promise(()=>{});}}},confirmedScope,{timeoutMs:5}),error=>error.uncertain&&/Odśwież status/.test(error.message));
  assert.equal(calls,1);assert.equal(signal.aborted,true);
});
test('an explicit scope is required and a completed response is returned intact',async()=>{
  let calls=0;const data={ok:true,alreadyCompleted:true,executionResult:{account_remains_active:true}};
  const client={functions:{invoke:async(_name,options)=>{calls++;assert.equal(options.body.expectedActionType,'minimize_data');return{data};}}};
  await assert.rejects(()=>executeErasure(client,{caseId:'case'}));assert.equal(calls,0);
  assert.equal(await executeErasure(client,confirmedScope),data);
});
test('the exact deletion scope names optional data and never counts browser-local settings as server deletion',()=>{
  const rows=erasureScopeRows({erasable_now:{portfolio_items:2,lucyna_threads:5,removable_services:1,browser_local_preferences:1}});
  assert.equal(rows.find(x=>x.key==='lucyna_threads').value,5);
  assert.equal(rows.find(x=>x.key==='portfolio_items').value,2);
  assert.equal(rows.some(x=>x.key==='browser_local_preferences'),false);
  assert.match(rows.find(x=>x.key==='block_rows').description,/innych osób pozostają/);
});
test('a refresh cannot unlock a timed-out operation that is still running without a confirmed failure',()=>{
  assert.equal(erasureOutcomeKnown({status:'processing',failure_reason:null}),false);
  assert.equal(erasureOutcomeKnown(null),false);
  assert.equal(erasureOutcomeKnown({status:'processing',failure_reason:'Próba przerwana'}),true);
  assert.equal(erasureOutcomeKnown({status:'completed'}),true);
});
