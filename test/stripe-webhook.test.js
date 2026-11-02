import fs from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { transformSync } from "esbuild";
const source=fs.readFileSync(new URL("../supabase/functions/stripe-webhook/index.ts",import.meta.url),"utf8").replace(/^import .*from "npm:[^"]+";\s*$/m,"");
const context=vm.createContext({module:{exports:{}},exports:{},crypto:crypto.webcrypto,Request,Response,TextEncoder,TextDecoder,Uint8Array,AbortSignal,console:{...console,error:()=>{}}});
vm.runInContext(transformSync(source,{loader:"ts",format:"cjs",target:"es2022"}).code,context);
const api=context.module.exports;
const secret="whsec_local_fixture_only";
const now=Math.floor(Date.now()/1000);
const raw=new TextEncoder().encode('{"one":"zażółć","two":2}');
const mac=(body,t=now)=>crypto.createHmac("sha256",secret).update(t+".").update(body).digest("hex");
const signed=(body,t=now)=>"t="+t+",v1="+mac(body,t);
function check(name,fn){return test(name,fn);}
await check("correct HMAC over original Unicode bytes",async()=>assert.equal(await api.verifyStripeSignature(raw,signed(raw),secret),true));
await check("changed payload invalidates signature",async()=>assert.equal(await api.verifyStripeSignature(new TextEncoder().encode("{}"),signed(raw),secret),false));
await check("expired signature rejected",async()=>assert.equal(await api.verifyStripeSignature(raw,signed(raw,now-3600),secret),false));
await check("future signature rejected",async()=>assert.equal(await api.verifyStripeSignature(raw,signed(raw,now+3600),secret),false));
await check("duplicate timestamps rejected",async()=>assert.equal(await api.verifyStripeSignature(raw,signed(raw)+",t="+now,secret),false));
await check("rotation accepts one valid v1 among candidates",async()=>assert.equal(await api.verifyStripeSignature(raw,"t="+now+",v1="+"0".repeat(64)+",v1="+mac(raw),secret),true));
await check("malformed signature rejected",async()=>assert.equal(await api.verifyStripeSignature(raw,"t="+now+",v1=bad",secret),false));
await check("missing secret rejected",async()=>assert.equal(await api.verifyStripeSignature(raw,signed(raw),""),false));
const pid="55555555-5555-4555-8555-555555555555";
function event(type="payment_intent.succeeded",object={object:"payment_intent",id:"pi_FIXTURE",currency:"pln",amount_received:52750,status:"succeeded",latest_charge:"ch_FIXTURE",metadata:{payment_id:pid}}){
 return{id:"evt_FIXTURE",object:"event",type,created:now,livemode:false,data:{object}};
}
function handler(options={}){
 const calls=[],factory=()=>({rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==="ideahire_observe_financial_event")return options.observerError?{error:{message:"retry"}}:{data:options.managed===true,error:null};
  return{data:"funds_secured",error:null};
 },from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:options.missing?null:{id:pid,stripe_livemode:options.live??false},error:null})})})})});
 return{calls,fn:api.createWebhookHandler({SUPABASE_URL:"https://fixture.invalid",SUPABASE_SERVICE_ROLE_KEY:"local-fixture",STRIPE_WEBHOOK_SECRET:secret},factory)};
}
async function invoke(h,e,headers={}){
 const body=JSON.stringify(e);
 return h.fn(new Request("https://fixture.invalid/webhook",{method:"POST",body,headers:{"Stripe-Signature":signed(body),...headers}}));
}
await check("valid payment webhook reaches guarded payment RPC",async()=>{
 const h=handler();assert.equal((await invoke(h,event())).status,200);assert.ok(h.calls.some(c=>c.name==="ideahire_apply_stripe_event"));
});
await check("bad signature cannot reach any RPC",async()=>{
 const h=handler();assert.equal((await invoke(h,event(),{"Stripe-Signature":"bad"})).status,400);assert.equal(h.calls.length,0);
});
await check("unknown signed event is ignored without RPC",async()=>{
 const h=handler();assert.equal((await invoke(h,event("customer.created"))).status,200);assert.equal(h.calls.length,0);
});
await check("connected-account event is not applied to platform payments",async()=>{
 const h=handler();assert.equal((await invoke(h,{...event(),account:"acct_OTHER"})).status,200);assert.equal(h.calls.length,0);
});
await check("managed refund does not fall through into legacy payment RPC",async()=>{
 const h=handler({managed:true});assert.equal((await invoke(h,event("refund.failed",{id:"re_FIXTURE",object:"refund",livemode:false}))).status,200);assert.equal(h.calls.length,1);
});
await check("financial observer error returns 500 for Stripe redelivery",async()=>{
 const h=handler({observerError:true});assert.equal((await invoke(h,event())).status,500);
});
await check("object and event mode mismatch rejected before applying",async()=>{
 const h=handler();assert.equal((await invoke(h,event("payment_intent.succeeded",{...event().data.object,livemode:true}))).status,400);assert.equal(h.calls.length,0);
});
await check("payment row mode mismatch rejected",async()=>{
 const h=handler({live:true});assert.equal((await invoke(h,event())).status,500);assert.equal(h.calls.some(c=>c.name==="ideahire_apply_stripe_event"),false);
});
await check("unmapped signed payment returns 500 for retry",async()=>{
 const h=handler({missing:true});assert.equal((await invoke(h,event())).status,500);
});
await check("BLIK is detected without classifying premium cards as standard EEA",async()=>{
 assert.equal(api.detectedPaymentMethod({payment_method_details:{type:"blik"}}),"blik");
 assert.equal(api.detectedPaymentMethod({payment_method_details:{type:"card",card:{country:"US"}}}),null);
});
await check("unmanaged BLIK refund accepts its actual pyr identifier",async()=>{
 const h=handler();const e=event("charge.refunded",{object:"charge",id:"py_FIXTURE",payment_intent:"pi_FIXTURE",currency:"pln",amount:52750,amount_refunded:52750,metadata:{payment_id:pid},refunds:{data:[{id:"pyr_FIXTURE"}]}});
 const r=await invoke(h,e);assert.equal(r.status,200);assert.equal(h.calls.find(c=>c.name==="ideahire_apply_stripe_event").args.p_refund_id,"pyr_FIXTURE");
});
await check("oversized declared webhook rejected before database",async()=>{
 const h=handler();assert.equal((await invoke(h,event(),{"Content-Length":String(1024*1024+1)})).status,413);assert.equal(h.calls.length,0);
});
await check("GET webhook is not accepted",async()=>{
 const h=handler();assert.equal((await h.fn(new Request("https://fixture.invalid/webhook"))).status,405);assert.equal(h.calls.length,0);
});



