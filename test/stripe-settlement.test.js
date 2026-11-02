import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { transformSync } from "esbuild";

const source = fs.readFileSync(new URL("../supabase/functions/resolve-dispute-payment/index.ts", import.meta.url), "utf8");
const compiled = transformSync(source.replace(/^import .*from "npm:[^"]+";\s*$/m, ""), { loader:"ts", target:"es2022" }).code;
const ID = "11111111-1111-4111-8111-111111111111";
const LEASE = "22222222-2222-4222-8222-222222222222";
const ACTOR = "33333333-3333-4333-8333-333333333333";
const DECISION = "44444444-4444-4444-8444-444444444444";

function harness(options = {}) {
  let a = {
    id:ID, lease:LEASE, payment_id:"55555555-5555-4555-8555-555555555555", decision_id:DECISION,
    state:"processing", livemode:false, refund_work:25000, refund_fee:1375, refund_total:26375,
    contractor_target:25000, total:52750, work:50000, destination:"acct_TESTRECIPIENT",
    payment_intent:"pi_TESTPAYMENT", charge_id:"ch_TESTSOURCE", original_transfer:null,
    refund_id:null, refund_status:null, refund_started:null, reversal_id:null, reversal_started:null,
    transfer_id:null, transfer_started:null, ...options.action,
  };
  const calls = [], rpcCalls = [];
  let chargeRefunded = options.chargeRefunded ?? 0;
  let reversed = options.reversed ?? 0;
  let refund = options.refund ? {...options.refund} : null;
  let createdTransfer = null;
  const transfer = (id, amount, amountReversed = 0) => ({
    object:"transfer", id, amount, amount_reversed:amountReversed, reversed:amountReversed === amount,
    currency:"pln", livemode:false, destination:a.destination, source_transaction:a.charge_id,
    metadata:{ideahire_action_id:a.id}, transfer_group:"IH_SOURCE_GROUP",
  });
  const charge = () => ({
    object:"charge",id:a.charge_id,paid:true,captured:true,amount:a.total,amount_captured:a.total,
    amount_refunded:chargeRefunded,currency:"pln",livemode:false,payment_intent:a.payment_intent,
    transfer_group:"IH_SOURCE_GROUP",disputed:options.bankStatus != null,...options.charge,
  });
  const refundObject = (status = options.refundStatus || "succeeded") => ({
    object:"refund",id:"re_TESTREFUND",amount:a.refund_total,currency:"pln",
    payment_intent:a.payment_intent,charge:a.charge_id,metadata:{ideahire_action_id:a.id},status,
    ...options.refund,
  });
  const rpc = async (name, args) => {
    rpcCalls.push({name,args});
    if (name === "ideahire_prepare_dispute_payment") return {data:structuredClone(a),error:null};
    if (name === "ideahire_dispute_checkpoint") {
      assert.equal(args.p_id,a.id);assert.equal(args.p_lease,LEASE);
      const data=args.p_data, step=args.p_step;
      if(step==="charge")a.charge_id=data.id;
      if(step==="start_refund")a.refund_started="now";
      if(step==="start_reversal")a.reversal_started="now";
      if(step==="start_transfer")a.transfer_started="now";
      if(step==="refund"){a.refund_id=data.id;if(!options.storedTerminal)a.refund_status=data.status;}
      if(step==="reversal")a.reversal_id=data.id;
      if(step==="transfer")a.transfer_id=data.id;
      return {data:structuredClone(a),error:null};
    }
    if (name === "ideahire_pause_dispute_payment") {a.state=args.p_review?"needs_review":"pending";return{data:null,error:null};}
    if (name === "ideahire_finish_dispute_payment") {
      if(a.refund_total>0&&a.refund_status!=="succeeded")return{error:{message:"No final confirmation"}};
      a.state="completed";return {data:structuredClone(a),error:null};
    }
    throw new Error("Unexpected RPC "+name);
  };
  const fetch = async (input, init = {}) => {
    const url=new URL(String(input)),method=init.method||"GET",form=new URLSearchParams(init.body||"");
    assert.equal(url.hostname,"api.stripe.com","all provider calls must remain mocked");
    calls.push({path:url.pathname,search:url.search,method,form:Object.fromEntries(form),headers:init.headers});
    const ok = data => new Response(JSON.stringify(data),{status:200});
    if(url.pathname === "/v1/payment_intents/"+a.payment_intent) return ok({
      object:"payment_intent",id:a.payment_intent,status:"succeeded",livemode:false,amount:a.total,
      amount_received:a.total,currency:"pln",metadata:{payment_id:a.payment_id},latest_charge:charge(),...options.intent,
    });
    if(url.pathname === "/v1/disputes")return ok({data:[{status:options.bankStatus}],has_more:false});
    if(url.pathname === "/v1/refunds"&&method==="GET")return ok({data:options.externalRefunds|| (refund?[refund]:[]),has_more:options.refundHasMore||false});
    if(url.pathname === "/v1/refunds"&&method==="POST"){
      assert.equal(Number(form.get("amount")),a.refund_total);
      refund=refundObject();if(refund.status==="succeeded")chargeRefunded=refund.amount;
      return ok(refund);
    }
    if(url.pathname === "/v1/refunds/"+(a.refund_id||"re_TESTREFUND")){
      refund??=refundObject();if(refund.status==="succeeded")chargeRefunded=refund.amount;return ok(refund);
    }
    if(url.pathname === "/v2/core/accounts/"+a.destination)return ok({
      object:"v2.core.account",id:a.destination,livemode:false,closed:false,
      configuration:{recipient:{capabilities:{stripe_balance:{stripe_transfers:{status:options.recipientRestricted?"inactive":"active"},payouts:{status:"active"}}}}},
    });
    if(url.pathname === "/v1/transfers"&&method==="GET"){
      return ok({data:options.recoveredTransfers||[],has_more:options.transferHasMore||false});
    }
    if(url.pathname === "/v1/transfers"&&method==="POST"){
      if(options.insufficient)return new Response(JSON.stringify({error:{code:"balance_insufficient"}}),{status:400});
      createdTransfer=transfer("tr_TESTCREATED",a.contractor_target);return ok(createdTransfer);
    }
    if(url.pathname === "/v1/transfers/"+a.original_transfer+"/reversals"&&method==="POST"){
      reversed=Number(form.get("amount"));return ok({object:"transfer_reversal",id:"trr_TESTREVERSAL",amount:reversed,transfer:a.original_transfer,metadata:{ideahire_action_id:a.id}});
    }
    if(url.pathname === "/v1/transfers/"+a.original_transfer+"/reversals"&&method==="GET"){
      return ok({has_more:false,data:options.recoveredReversals||[]});
    }
    if(url.pathname === "/v1/transfers/"+a.original_transfer+"/reversals/"+(a.reversal_id||"trr_TESTREVERSAL")){
      return ok({object:"transfer_reversal",id:a.reversal_id,amount:reversed,transfer:a.original_transfer,metadata:{ideahire_action_id:a.id}});
    }
    if(a.original_transfer&&url.pathname === "/v1/transfers/"+a.original_transfer)return ok(transfer(a.original_transfer,a.work,reversed));
    if(url.pathname === "/v1/transfers/"+a.transfer_id)return ok(createdTransfer||(options.recoveredTransfers||[]).find(t=>t.id===a.transfer_id));
    throw new Error("Unexpected provider route "+method+" "+url.pathname);
  };
  const sandbox = {createClient:()=>({rpc}),Deno:{env:{get:name=>({STRIPE_SECRET_KEY:"sk_test_local_fixture",SUPABASE_URL:"https://fixture.invalid",SUPABASE_SERVICE_ROLE_KEY:"local-fixture-key"})[name]||""},serve:()=>{}},
    fetch,Response,Request,URL,URLSearchParams,AbortSignal,TextDecoder,Uint8Array,console};
  const context=vm.createContext(sandbox);vm.runInContext(compiled,context);
  return {a,calls,rpcCalls,run:()=>vm.runInContext('execute("'+ACTOR+'","'+DECISION+'")',context)};
}
const posts=(h,path)=>h.calls.filter(c=>c.method==="POST"&&c.path===path);
const hasFinish=h=>h.rpcCalls.some(c=>c.name==="ideahire_finish_dispute_payment");

test("partial refund after an existing transfer reverses 250 and refunds 263.75 exactly once", async()=>{
  const h=harness({action:{original_transfer:"tr_TESTORIGINAL"}});
  const result=await h.run();assert.equal(result.state,"completed");
  assert.equal(posts(h,"/v1/transfers/tr_TESTORIGINAL/reversals").length,1);
  assert.equal(posts(h,"/v1/transfers/tr_TESTORIGINAL/reversals")[0].form.amount,"25000");
  assert.equal(posts(h,"/v1/refunds").length,1);assert.equal(posts(h,"/v1/refunds")[0].form.amount,"26375");
  assert.equal(posts(h,"/v1/transfers").length,0);
});
test("partial refund before a transfer pays only the remaining 250",async()=>{
  const h=harness();await h.run();
  assert.equal(posts(h,"/v1/transfers").length,1);assert.equal(posts(h,"/v1/transfers")[0].form.amount,"25000");
  assert.equal(posts(h,"/v1/transfers")[0].form.source_transaction,"ch_TESTSOURCE");
  assert.equal("application_fee_amount" in posts(h,"/v1/transfers")[0].form,false);
});
for(const status of ["pending","requires_action","failed","canceled"]){
  test("refund "+status+" cannot pay the freelancer or finish",async()=>{
    const h=harness({refundStatus:status});
    if(status==="pending")assert.equal((await h.run()).state,"pending");else await assert.rejects(h.run());
    assert.equal(posts(h,"/v1/transfers").length,0);assert.equal(hasFinish(h),false);
    assert.equal(h.a.state,status==="pending"?"pending":"needs_review");
  });
}
test("unknown refund status stops for review rather than polling forever",async()=>{
  const h=harness({refundStatus:"unexpected_provider_state"});
  await assert.rejects(h.run());assert.equal(h.a.state,"needs_review");assert.equal(posts(h,"/v1/transfers").length,0);
  assert.equal(h.rpcCalls.filter(c=>c.name==="ideahire_dispute_checkpoint"&&c.args.p_step==="refund").length,0);
});
test("known failed refund cannot pay the freelancer from a stale succeeded API response",async()=>{
  const r={object:"refund",id:"re_TESTREFUND",amount:26375,currency:"pln",payment_intent:"pi_TESTPAYMENT",charge:"ch_TESTSOURCE",metadata:{ideahire_action_id:ID},status:"succeeded"};
  const h=harness({action:{refund_id:r.id,refund_status:"failed",refund_started:"old"},refund:r,chargeRefunded:26375,storedTerminal:true});
  await assert.rejects(h.run());assert.equal(posts(h,"/v1/transfers").length,0);assert.equal(h.a.state,"needs_review");
});
test("completed action returns without any provider operation",async()=>{
  const h=harness({action:{state:"completed"}});assert.equal((await h.run()).state,"completed");assert.equal(h.calls.length,0);
});
for(const bankStatus of ["needs_response","under_review","lost"]){
  test("bank dispute "+bankStatus+" blocks every financial POST",async()=>{
    const h=harness({bankStatus});await assert.rejects(h.run());
    assert.equal(h.calls.filter(c=>c.method==="POST").length,0);assert.equal(h.a.state,"needs_review");
  });
}
for(const bankStatus of ["won","warning_closed"]){
  test("closed bank dispute "+bankStatus+" permits a matching settlement",async()=>{
    const h=harness({bankStatus});assert.equal((await h.run()).state,"completed");
  });
}
test("external refund requires review before any transfer or new refund",async()=>{
  const h=harness({externalRefunds:[{status:"succeeded",metadata:{ideahire_action_id:"another-action"}}]});
  await assert.rejects(h.run());assert.equal(h.calls.filter(c=>c.method==="POST").length,0);
});
for(const change of [{currency:"eur"},{livemode:true},{amount:1},{paid:false},{captured:false},{payment_intent:"pi_OTHER"}]){
  test("mismatched source "+JSON.stringify(change)+" blocks provider mutations",async()=>{
    const h=harness({charge:change});await assert.rejects(h.run());assert.equal(h.calls.filter(c=>c.method==="POST").length,0);
  });
}
test("restricted recipient prevents transfer and retains review status",async()=>{
  const h=harness({recipientRestricted:true});await assert.rejects(h.run());assert.equal(posts(h,"/v1/transfers").length,0);assert.equal(h.a.state,"needs_review");
});
test("insufficient balance does not finish or claim a successful transfer",async()=>{
  const h=harness({insufficient:true});await assert.rejects(h.run());assert.equal(hasFinish(h),false);assert.equal(h.a.state,"pending");
});
test("paginated refunds stop before any financial mutation",async()=>{
  const h=harness({refundHasMore:true});await assert.rejects(h.run());assert.equal(h.calls.filter(c=>c.method==="POST").length,0);
});
test("paginated transfer recovery cannot create another transfer",async()=>{
  const r={object:"refund",id:"re_TESTREFUND",amount:26375,currency:"pln",payment_intent:"pi_TESTPAYMENT",charge:"ch_TESTSOURCE",metadata:{ideahire_action_id:ID},status:"succeeded"};
  const h=harness({action:{transfer_started:"old",refund_id:r.id,refund_status:"succeeded",refund_started:"old"},refund:r,chargeRefunded:26375,transferHasMore:true});
  await assert.rejects(h.run());assert.equal(posts(h,"/v1/transfers").length,0);
});
test("existing transfer is recovered across both groups without a second POST",async()=>{
  const r={object:"refund",id:"re_TESTREFUND",amount:26375,currency:"pln",payment_intent:"pi_TESTPAYMENT",charge:"ch_TESTSOURCE",metadata:{ideahire_action_id:ID},status:"succeeded"};
  const t={object:"transfer",id:"tr_TESTRECOVERED",amount:25000,amount_reversed:0,reversed:false,currency:"pln",livemode:false,destination:"acct_TESTRECIPIENT",source_transaction:"ch_TESTSOURCE",metadata:{ideahire_action_id:ID}};
  const h=harness({action:{transfer_started:"old",refund_id:r.id,refund_status:"succeeded",refund_started:"old"},refund:r,chargeRefunded:26375,recoveredTransfers:[t]});
  assert.equal((await h.run()).state,"completed");assert.equal(posts(h,"/v1/transfers").length,0);
});

