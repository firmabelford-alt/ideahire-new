// IdeaHire — preview, execute and reconcile ONE immutable dispute settlement.
// Deploy manually as resolve-dispute-payment, verify_jwt=false. Authentication is checked below.
import { createClient } from "npm:@supabase/supabase-js@2.53.0";
type J = Record<string, any>;
type AppError = Error & { review?: boolean; status?: number };
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const env=(name:string)=>Deno.env.get(name)||"";
const mode=/^(?:sk|rk)_(test|live)_/.exec(env("STRIPE_SECRET_KEY"))?.[1];
const live=mode==="live";
const sb=createClient(env("SUPABASE_URL"),env("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:false,autoRefreshToken:false}});
const obj=(x:any):J=>x&&typeof x==="object"&&!Array.isArray(x)?x:{};
const ref=(x:any):string=>typeof x==="string"?x:obj(x).id||"";
function fail(message:string,review=true):never {throw Object.assign(new Error(message),{review});}
function check(ok:any,message:string):asserts ok {if(!ok)fail(message);}
function originAllowed(origin:string){
 if(!origin)return true;
 const allowed=["https://ideahire-new.pages.dev","http://localhost:5173","http://127.0.0.1:5173",env("APP_URL")].filter(Boolean);
 if(allowed.includes(origin))return true;
 try{const u=new URL(origin);return u.origin===origin&&u.protocol==="https:"&&!u.port&&u.hostname.endsWith(".ideahire-new.pages.dev");}catch{return false;}
}
function response(req:Request,status:number,data:J){return new Response(JSON.stringify(data),{status,headers:{
 "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
 "Access-Control-Allow-Origin":req.headers.get("Origin")||env("APP_URL")||"https://ideahire-new.pages.dev",
 "Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type","Access-Control-Allow-Methods":"POST,OPTIONS",Vary:"Origin"}});}
async function rpc(name:string,args:J={}):Promise<any>{const {data,error}=await sb.rpc(name,args);if(error)throw Error(error.message);return data;}
async function body(req:Request):Promise<J>{
 const reader=req.body?.getReader();if(!reader)fail("Brak danych.");let count=0,s="";const decoder=new TextDecoder();
 try{while(true){const x=await reader.read();if(x.done)break;count+=x.value.byteLength;if(count>16384){await reader.cancel();fail("Za duże żądanie.");}s+=decoder.decode(x.value,{stream:true});}s+=decoder.decode();}finally{reader.releaseLock();}
 const b=JSON.parse(s);check(b&&typeof b==="object"&&!Array.isArray(b),"Nieprawidłowe dane.");return b;
}
async function isWorker(req:Request):Promise<boolean>{
 const given=req.headers.get("x-ideahire-worker-secret")||"";
 if(given.length<32||given.length>256)return false;
 const {data,error}=await sb.rpc("ideahire_verify_financial_worker",{p_token:given});
 return !error&&data===true;
}
async function stripe(path:string,form?:J,key?:string):Promise<J>{
 const params=new URLSearchParams();if(form)for(const[k,v]of Object.entries(form))params.set(k,String(v));
 const r=await fetch("https://api.stripe.com"+path,{method:form?"POST":"GET",signal:AbortSignal.timeout(12000),
 headers:{Authorization:"Bearer "+env("STRIPE_SECRET_KEY"),"Stripe-Version":"2026-08-26.dahlia",...(form?{"Content-Type":"application/x-www-form-urlencoded","Idempotency-Key":key!}:{})},body:form?params.toString():undefined});
 const data=await r.json().catch(()=>null);
 if(!r.ok){const code=String(data?.error?.code||data?.error?.type||r.status).replace(/[^a-zA-Z0-9_]/g,"").slice(0,80);
  throw Object.assign(new Error("Stripe nie potwierdził operacji ("+code+"). Sprawdź status tej samej operacji."),{review:r.status===401||r.status===403||code.includes("idempotency")});}
 check(data&&typeof data==="object","Niepełna odpowiedź Stripe.");return data;
}
function actionMetadata(a:J){return {"metadata[ideahire_action_id]":a.id,"metadata[payment_id]":a.payment_id,"metadata[decision_id]":a.decision_id};}
async function paidCharge(a:J):Promise<J>{
 const pi=await stripe("/v1/payment_intents/"+encodeURIComponent(a.payment_intent)+"?expand[]=latest_charge");
 check(pi.object==="payment_intent"&&pi.id===a.payment_intent&&pi.status==="succeeded"&&pi.livemode===a.livemode
  &&pi.amount===a.total&&pi.amount_received===a.total&&pi.currency==="pln"&&pi.metadata?.payment_id===a.payment_id,"Wpłata nie odpowiada rozliczeniu.");
 const c=typeof pi.latest_charge==="object"?pi.latest_charge:await stripe("/v1/charges/"+encodeURIComponent(ref(pi.latest_charge)));
 check(c.object==="charge"&&/^(ch|py)_/.test(c.id)&&c.paid===true&&c.captured===true&&c.amount===a.total&&c.amount_captured===a.total
  &&c.currency==="pln"&&c.livemode===a.livemode&&ref(c.payment_intent)===a.payment_intent&&(!a.charge_id||c.id===a.charge_id),"Niezgodne obciążenie Stripe.");
 if(c.disputed){const ds=await stripe("/v1/disputes?charge="+encodeURIComponent(c.id)+"&limit=100");
  check(ds.has_more===false&&Array.isArray(ds.data)&&ds.data.length>0&&ds.data.every((d:J)=>["won","warning_closed"].includes(d.status)),"Aktywny lub przegrany spór bankowy blokuje zwrot i transfer.");}
 return c;
}
async function recipient(a:J){
 const r=await fetch("https://api.stripe.com/v2/core/accounts/"+encodeURIComponent(a.destination)+"?include[]=configuration.recipient",{
 headers:{Authorization:"Bearer "+env("STRIPE_SECRET_KEY"),"Stripe-Version":"2026-08-26.preview"},signal:AbortSignal.timeout(12000)});
 const c=await r.json().catch(()=>null),cap=c?.configuration?.recipient?.capabilities?.stripe_balance;
 check(r.ok&&c?.id===a.destination&&c.object==="v2.core.account"&&c.livemode===a.livemode&&!c.closed
  &&cap?.stripe_transfers?.status==="active"&&cap?.payouts?.status==="active","Konto wykonawcy nie jest gotowe do przekazania wynagrodzenia.");
}
function transferCheck(t:J,a:J,amount:number,managed:boolean){
 check(t.object==="transfer"&&t.amount===amount&&t.currency==="pln"&&t.livemode===a.livemode
  &&ref(t.destination)===a.destination&&ref(t.source_transaction)===a.charge_id
  &&(!managed||t.metadata?.ideahire_action_id===a.id),"Transfer Stripe nie odpowiada planowi rozliczenia.");
}
async function execute(actor:string,decision:string,resumeReview=false):Promise<J>{
 let a=await rpc("ideahire_prepare_dispute_payment",{p_actor:actor,p_decision:decision,p_livemode:live,p_resume_review:resumeReview});
 if(a.state==="completed")return {ok:true,state:"completed",action:{...a,lease:undefined}};
 check(UUID.test(a.id)&&UUID.test(a.lease)&&a.livemode===live,"Nieprawidłowa rezerwacja rozliczenia.");
 for(const n of ["refund_work","refund_fee","refund_total","contractor_target","total","work"]){check(Number.isSafeInteger(a[n])&&a[n]>=0,"Nieprawidłowa kwota rozliczenia.");}
 const lease=a.lease;
 async function save(step:string,data:J={}){a=await rpc("ideahire_dispute_checkpoint",{p_id:a.id,p_lease:lease,p_step:step,p_data:data});}
 const key=(step:string)=>"ideahire-dispute-"+a.id+"-"+step;
 try{
  let charge=await paidCharge(a);await save("charge",{id:charge.id});
  const existingRefunds=await stripe("/v1/refunds?payment_intent="+encodeURIComponent(a.payment_intent)+"&limit=100");
  check(existingRefunds.has_more===false&&Array.isArray(existingRefunds.data)
   &&existingRefunds.data.every((r:J)=>r.metadata?.ideahire_action_id===a.id||["failed","canceled"].includes(r.status)),
   "Wykryto zwrot spoza tej operacji. Najpierw uzgodnij rozliczenie Stripe.");
  check(charge.amount_refunded===0||a.refund_id||a.refund_started,"Wpłata została zwrócona poza tym rozliczeniem. Wymagana kontrola.");
  // Recover an already-created reversal by its immutable action metadata before any new POST.
  if(a.original_transfer){
   let t=await stripe("/v1/transfers/"+encodeURIComponent(a.original_transfer));transferCheck(t,a,a.work,false);
   const required=a.work-a.contractor_target;
   if(required>0){
    if(!a.reversal_id&&a.reversal_started){
     const found=await stripe("/v1/transfers/"+encodeURIComponent(a.original_transfer)+"/reversals?limit=100");
     check(!found.has_more,"Lista odwróceń wymaga ręcznej kontroli.");
     const matching=found.data.filter((x:J)=>x.metadata?.ideahire_action_id===a.id);
     check(matching.length<=1,"Wykryto więcej niż jedno odwrócenie tej operacji.");
     if(matching.length===1){check(matching[0].amount===required,"Niezgodna kwota odwrócenia.");await save("reversal",{id:matching[0].id});}
    }
    if(!a.reversal_id){
     check(t.amount_reversed===0,"Transfer ma odwrócenie spoza tej operacji.");
     await save("start_reversal",{amount:required});
     const rev=await stripe("/v1/transfers/"+encodeURIComponent(a.original_transfer)+"/reversals",{amount:required,...actionMetadata(a)},key("reversal"));
     check(rev.object==="transfer_reversal"&&rev.amount===required&&ref(rev.transfer)===a.original_transfer&&rev.metadata?.ideahire_action_id===a.id,"Niezgodne odwrócenie transferu.");
     await save("reversal",{id:rev.id});
    }
    const rev=await stripe("/v1/transfers/"+encodeURIComponent(a.original_transfer)+"/reversals/"+encodeURIComponent(a.reversal_id));
    check(rev.amount===required&&ref(rev.transfer)===a.original_transfer&&rev.metadata?.ideahire_action_id===a.id,"Nie potwierdzono odwrócenia.");
    t=await stripe("/v1/transfers/"+encodeURIComponent(a.original_transfer));transferCheck(t,a,a.work,false);
   }
   check(t.amount-t.amount_reversed===a.contractor_target,"Saldo transferu nie odpowiada decyzji.");
  }
  if(a.refund_total>0){
   if(!a.refund_id&&a.refund_started){
    const list=await stripe("/v1/refunds?payment_intent="+encodeURIComponent(a.payment_intent)+"&limit=100");
    check(!list.has_more,"Lista zwrotów wymaga ręcznej kontroli.");
    const matching=list.data.filter((x:J)=>x.metadata?.ideahire_action_id===a.id);
    check(matching.length<=1,"Wykryto więcej niż jeden zwrot tej operacji.");
    if(matching.length===1){check(matching[0].amount===a.refund_total,"Niezgodna kwota zwrotu.");await save("refund",{id:matching[0].id,status:matching[0].status});}
   }
   if(!a.refund_id){
    charge=await paidCharge(a);check(charge.amount_refunded===0,"Wykryto wcześniejszy zwrot.");
    await save("start_refund");
    const r=await stripe("/v1/refunds",{payment_intent:a.payment_intent,amount:a.refund_total,...actionMetadata(a)},key("refund"));
    check(r.object==="refund"&&r.amount===a.refund_total&&r.currency==="pln"&&ref(r.payment_intent)===a.payment_intent&&r.metadata?.ideahire_action_id===a.id,"Niezgodna odpowiedź zwrotu.");
    await save("refund",{id:r.id,status:r.status});
   }
   const r=await stripe("/v1/refunds/"+encodeURIComponent(a.refund_id));
   check(r.object==="refund"&&r.amount===a.refund_total&&r.currency==="pln"&&ref(r.payment_intent)===a.payment_intent
    &&ref(r.charge)===a.charge_id&&r.metadata?.ideahire_action_id===a.id,"Zwrot nie odpowiada tej decyzji.");
   await save("refund",{id:r.id,status:r.status});
   if(["failed","canceled"].includes(r.status))fail("Stripe odrzucił zwrot. Nie twórz kolejnego bez sprawdzenia tej operacji.");
   if(r.status==="requires_action")fail("Zwrot wymaga działania w Stripe, np. uzupełnienia danych rachunku klienta. Sprawdź ten sam zwrot w panelu Stripe.");
   if(r.status!=="succeeded"){
    await rpc("ideahire_pause_dispute_payment",{p_id:a.id,p_lease:lease,p_message:"Stripe przetwarza zwrot. Ponowne sprawdzenie nastąpi automatycznie.",p_review:false});
    return {ok:true,state:"pending",action:{...a,lease:undefined}};
   }
  }
  if(!a.original_transfer&&a.contractor_target>0){
   if(!a.transfer_id&&a.transfer_started){
    const list=await stripe("/v1/transfers?destination="+encodeURIComponent(a.destination)+"&transfer_group="+encodeURIComponent("IH_DISPUTE_"+a.id)+"&limit=100");
    check(!list.has_more,"Lista transferów wymaga ręcznej kontroli.");
    const matching=list.data.filter((x:J)=>x.metadata?.ideahire_action_id===a.id);
    check(matching.length<=1,"Wykryto więcej niż jeden transfer tej operacji.");
    if(matching.length===1){transferCheck(matching[0],a,a.contractor_target,true);await save("transfer",{id:matching[0].id});}
   }
   if(!a.transfer_id){
    await recipient(a);charge=await paidCharge(a);check(charge.amount_refunded===a.refund_total,"Nie potwierdzono kwoty zwrotu przed transferem.");
    await save("start_transfer");
    const t=await stripe("/v1/transfers",{amount:a.contractor_target,currency:"pln",destination:a.destination,
     source_transaction:a.charge_id,transfer_group:"IH_DISPUTE_"+a.id,...actionMetadata(a)},key("transfer"));
    transferCheck(t,a,a.contractor_target,true);await save("transfer",{id:t.id});
   }
   const t=await stripe("/v1/transfers/"+encodeURIComponent(a.transfer_id));transferCheck(t,a,a.contractor_target,true);
   check(t.amount_reversed===0&&!t.reversed,"Transfer rozliczenia został odwrócony.");
  }
  charge=await paidCharge(a);check(charge.amount_refunded===a.refund_total,"Końcowa kwota zwrotów nie odpowiada decyzji.");
  if(a.original_transfer){const t=await stripe("/v1/transfers/"+encodeURIComponent(a.original_transfer));transferCheck(t,a,a.work,false);check(t.amount-t.amount_reversed===a.contractor_target,"Transfer zmienił się podczas rozliczenia.");}
  const result=await rpc("ideahire_finish_dispute_payment",{p_id:a.id,p_lease:lease,p_refunded:charge.amount_refunded,p_contractor:a.contractor_target});
  return {ok:true,state:"completed",action:result};
 }catch(error){
  let message=String((error as Error)?.message||"Nie potwierdzono operacji.");
  for(const secret of [env("STRIPE_SECRET_KEY"),env("SUPABASE_SERVICE_ROLE_KEY"),env("IDEAHIRE_WORKER_SECRET")])if(secret)message=message.split(secret).join("[ukryte]");
  await rpc("ideahire_pause_dispute_payment",{p_id:a.id,p_lease:lease,p_message:message.slice(0,500),p_review:(error as AppError).review===true||/Stare niepotwierdzone|Stary niepotwierdzony|Przekroczono limit/.test(message)}).catch(()=>{});
  throw Error(message);
 }
}

async function protectPlatformFunds():Promise<J>{
 // No Stripe-Account header: this changes only the platform's own bank payout schedule.
 const balance=await stripe("/v1/balance");
 check(balance.object==="balance"&&balance.livemode===live,"Nie potwierdzono środowiska ochrony salda.");
 const account=await stripe("/v1/account");
 check(account.object==="account"&&/^acct_/.test(account.id),"Nie potwierdzono konta platformy.");
 let changed=false;
 if(account.settings?.payouts?.schedule?.interval!=="manual"){
  const setting=await stripe("/v1/balance_settings",{"payments[payouts][schedule][interval]":"manual"},
   "ideahire-platform-manual-"+account.id+"-"+Math.floor(Date.now()/300000));
  check(setting.payments?.payouts?.schedule?.interval==="manual","Stripe nie potwierdził ręcznych wypłat platformy.");
  changed=true;
 }
 const verified=changed?await stripe("/v1/account"):account;
 check(verified.id===account.id&&verified.settings?.payouts?.schedule?.interval==="manual",
  "Automatyczne wypłaty platformy pozostają aktywne. Wymagana kontrola ustawień Stripe.");
 return {protected:true,platform_account:account.id,payout_interval:"manual",changed};
}
async function platformProtectionStatus():Promise<J>{
 const account=await stripe("/v1/account");
 check(account.object==="account"&&/^acct_/.test(account.id),"Nie potwierdzono konta platformy.");
 return {protected:account.settings?.payouts?.schedule?.interval==="manual",payout_interval:account.settings?.payouts?.schedule?.interval||"unknown"};
}

Deno.serve(async(req:Request)=>{
 if(!originAllowed(req.headers.get("Origin")||""))return response(req,403,{ok:false,error:"Niedozwolone źródło żądania."});
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:response(req,200,{}).headers});
 if(req.method!=="POST")return response(req,405,{ok:false,error:"Wymagany POST."});
 if(!mode)return response(req,503,{ok:false,error:"Brak konfiguracji Stripe."});
 try{
  const b=await body(req);
  if(b.action==="run_due"){
   if(!await isWorker(req))return response(req,401,{ok:false,error:"Nieuprawniony harmonogram."});
   await rpc("ideahire_validate_stripe_mode",{p_livemode:live});
   // A protection error is reported; it never suppresses a rightful refund or release.
   let platform_protection:J;
   try{platform_protection=await protectPlatformFunds();}
   catch(e){platform_protection={protected:false,error:String((e as Error).message).slice(0,500)};}
   const due=await rpc("ideahire_financial_due",{p_livemode:live});const results=[];
   // One settlement per tick keeps the worker within runtime limits. Failed items have backoff.
   for(const d of due.slice(0,1)){try{const result=await execute(d.actor_id,d.decision_id); results.push({ok:result.ok,state:result.state,decision_id:d.decision_id});}catch(e){const message=String((e as Error).message).slice(0,500); await rpc("ideahire_note_financial_queue_error",{p_decision:d.decision_id,p_message:message}).catch(()=>{}); results.push({ok:false,decision_id:d.decision_id,error:message});}}
   const auto=await rpc("ideahire_auto_release_due",{p_livemode:live});
   if(results.length===0&&auto?.delivery_id){
    const r=await fetch(env("SUPABASE_URL")+"/functions/v1/accept-work-release",{method:"POST",signal:AbortSignal.timeout(65000),
     headers:{"Content-Type":"application/json","x-ideahire-worker-secret":req.headers.get("x-ideahire-worker-secret")!},
     body:JSON.stringify({delivery_id:auto.delivery_id,auto_accept:true})});
    results.push({auto_accept_status:r.status,delivery_id:auto.delivery_id});
   }
   return response(req,200,{ok:true,livemode:live,platform_protection,results});
  }
  const token=/^Bearer\s+(\S+)$/i.exec(req.headers.get("Authorization")||"")?.[1];
  if(!token)return response(req,401,{ok:false,error:"Zaloguj się ponownie."});
  const {data,error}=await sb.auth.getUser(token);
  if(error||!data.user)return response(req,401,{ok:false,error:"Sesja wygasła."});
  check(UUID.test(String(b.decision_id||"")),"Nieprawidłowy identyfikator decyzji.");
  if(b.action==="preview"){
   const preview=await rpc("ideahire_preview_dispute_payment",{p_actor:data.user.id,p_decision:b.decision_id});
   let platform_protection:J;
   try{platform_protection=await platformProtectionStatus();}
   catch{platform_protection={protected:null,error:"Nie potwierdzono harmonogramu wypłat platformy."};}
   return response(req,200,{ok:true,preview,platform_protection});
  }
  if(b.action!=="execute"||b.confirm_settlement!==true)return response(req,400,{ok:false,error:"Potwierdź plan rozliczenia."});
  return response(req,200,await execute(data.user.id,b.decision_id,b.resume_review===true));
 }catch(error){let message=String((error as Error).message||"Nie udało się sprawdzić rozliczenia.").slice(0,500);
  for(const secret of [env("STRIPE_SECRET_KEY"),env("SUPABASE_SERVICE_ROLE_KEY"),env("IDEAHIRE_WORKER_SECRET")])if(secret)message=message.split(secret).join("[ukryte]");
  return response(req,409,{ok:false,error:message});}
});
