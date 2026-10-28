import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { build } from 'esbuild';
import { adminPrivacyFilter, orderAdminRequests, adminQueueSearch, adminActionLabel, adminQueuePage } from '../src/AdminDomain.js';
const compiled = new URL(`.admin-test-${process.pid}.mjs`,import.meta.url);
const bundle = await build({stdin:{contents:"export * from '../src/AdminDesk.jsx'; export * from '../src/LucynaDock.jsx'; export {default as AdminLucynaDesk, ADMIN_GUIDES} from '../src/AdminLucyna.jsx'; export {getSubpage} from '../src/Subpages.jsx';",resolveDir:fileURLToPath(new URL('.',import.meta.url))},bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},write:false,logLevel:'silent'});
await writeFile(compiled,bundle.outputFiles[0].text);
const {AdminNavigation,AdminQueue,AdminActivityLog,AdminCaseRow,AdminCaseTools,AdminErasureSteps,AdminLucynaDesk,ADMIN_GUIDES,adminRpc,canShowLucynaDock,getSubpage}=await import(compiled.href); await unlink(compiled);
const render=(Component,props={},path='/admin')=>{
 const old=console.error; console.error=(...args)=>{if(!String(args[0]).includes('useLayoutEffect does nothing on the server'))old(...args);};
 try{return renderToStaticMarkup(React.createElement(MemoryRouter,{initialEntries:[path]},React.createElement(Component,props)));}finally{console.error=old;}
};
const now=Date.parse('2026-10-28T12:00:00Z');
const request={id:'one',status:'submitted',due_at:'2026-10-27T12:00:00Z',assigned_admin_id:null};

test('a user-closed request cannot appear as active, overdue or unassigned',()=>{
 const closed={...request,requester_closed_at:'2026-10-28T11:00:00Z'};
 for(const filter of ['active','overdue','unassigned','mine'])assert.equal(adminPrivacyFilter(closed,filter,'staff',now),false);
 assert.equal(adminPrivacyFilter(closed,'completed','staff',now),true);
 assert.equal(adminPrivacyFilter(closed,'requester_closed','staff',now),true);
});
test('an extension replaces the original deadline and completed requests never become overdue',()=>{
 assert.equal(adminPrivacyFilter({...request,extended_due_at:'2026-11-28T12:00:00Z'},'overdue','staff',now),false);
 assert.equal(adminPrivacyFilter({...request,status:'completed'},'overdue','staff',now),false);
 assert.equal(adminPrivacyFilter(request,'overdue','staff',now),true);
});
test('my queue contains only open requests assigned to the current administrator',()=>{
 assert.equal(adminPrivacyFilter({...request,assigned_admin_id:'staff'},'mine','staff',now),true);
 assert.equal(adminPrivacyFilter({...request,assigned_admin_id:'another'},'mine','staff',now),false);
 assert.equal(adminPrivacyFilter({...request,assigned_admin_id:'staff',status:'withdrawn'},'mine','staff',now),false);
});
test('overdue requests come before unassigned and assigned cases without mutating source rows',()=>{
 const input=[{...request,id:'assigned',due_at:'2026-11-01',assigned_admin_id:'staff'},{...request,id:'closed',status:'completed'},{...request,id:'new',due_at:'2026-11-01'},{...request,id:'late',assigned_admin_id:'staff'}];
 assert.deepEqual(orderAdminRequests(input,now).map(x=>x.id),['late','new','assigned','closed']);
 assert.equal(input[0].id,'assigned');
});
test('search finds a case number or Polish user name and tolerates absent metadata',()=>{
 assert.equal(adminQueueSearch({number:'RODO-000017',subtitle:'Łukasz'},' łUKASZ '),true);
 assert.equal(adminQueueSearch({number:'RODO-000017'},'000017'),true);
 assert.equal(adminQueueSearch({},'absent'),false);
});
test('team access is offered only to the owner while all staff have Lucyna and procedures',()=>{
 const admin=render(AdminNavigation,{name:'Sample',role:'admin',onLogout(){}});
 const owner=render(AdminNavigation,{name:'Sample',role:'owner',onLogout(){}});
 assert.doesNotMatch(admin,/href="\/admin\?view=access"/);
 assert.match(owner,/href="\/admin\?view=access"/);
 assert.match(admin,/href="\/admin\/lucyna"/);
 assert.match(admin,/aria-label="Otwórz Lucynę AI"/);
});
test('case tools keep forms mounted across tabs and lead with status instead of history',()=>{
 const children=[React.createElement('section',{className:'privacy-admin-timeline',key:'history'},'History'),React.createElement('form',{className:'privacy-admin-form',key:'status'},React.createElement('input',{defaultValue:'Pending decision'})),React.createElement('form',{className:'privacy-admin-reply-form',key:'reply'},'Reply')];
 const html=render(AdminCaseTools,{children});
 assert.match(html,/value="Pending decision"/); assert.equal((html.match(/<form/g)||[]).length,2);
 assert.match(html,/<button[^>]*aria-pressed="true"[^>]*>Status i termin/);
 assert.match(html,/hidden=""[^>]*>.*?Reply/);
});
test('public dispute participants retain the original content without staff work tabs',()=>{
 const html=render(AdminCaseTools,{disabled:true,children:React.createElement('section',null,'Original content')});
 assert.match(html,/Original content/);assert.doesNotMatch(html,/ih-admin-tabs|hidden=/);
});
test('erasure progress distinguishes owner approval from execution',()=>{
 const html=render(AdminErasureSteps,{request:{identity_status:'verified'},currentCase:{status:'authorized'}});
 assert.equal((html.match(/class="is-done"/g)||[]).length,4);
 assert.match(html,/Wykonanie/);
});
test('a slow administrator write is never automatically retried and is reported as unconfirmed',async()=>{
 let calls=0,signal;
 const client={rpc(){calls++;return{abortSignal(value){signal=value;return new Promise(()=>{});}};}};
 const result=await adminRpc(client,'example_rpc',{}, {timeoutMs:5});
 assert.equal(calls,1);assert.equal(signal.aborted,true);assert.equal(result.error.code,'ADMIN_UNCONFIRMED');assert.match(result.error.message,/mogła zostać zapisana/);
});
test('confirmed writes and business errors are preserved without inventing a transport failure',async()=>{
 const accepted={data:{id:'case'},error:null},denied={data:null,error:{code:'42501',message:'Access denied'}};
 for(const response of [accepted,denied])assert.equal(await adminRpc({rpc(){return{abortSignal(){return Promise.resolve(response);}};}},'example',{}),response);
});
test('the administrator assistant requires a confirmed staff role and does not duplicate the full workspace',()=>{
 const props={enabled:true,userId:'staff',authLoading:false,isStaff:true,staffLoading:false,pathname:'/admin/privacy'};
 assert.equal(canShowLucynaDock(props),true);
 assert.equal(canShowLucynaDock({...props,isStaff:false}),false);
 assert.equal(canShowLucynaDock({...props,staffLoading:true}),false);
 assert.equal(canShowLucynaDock({...props,pathname:'/admin/lucyna/'}),false);
 assert.equal(canShowLucynaDock({...props,pathname:'/login'}),false);
});
test('procedures work without an AI connection and make no inference that a checklist changes a case',()=>{
 const html=render(AdminLucynaDesk,{enabled:false,children:'AI component'});
 assert.match(html,/Potwierdzenie wykonania czynności znajduje się w historii/);
 assert.doesNotMatch(html,/AI component/);
 assert.equal(ADMIN_GUIDES.length,6);
 assert.ok(ADMIN_GUIDES.every(guide=>guide.to.startsWith('/admin')&&guide.steps.length>=4));
});
test('login and password recovery are classified as access pages for navigation exclusion',()=>{
 for(const pathname of ['/login','/register','/reset-password'])assert.equal(getSubpage({pathname,hash:''}).kind,'access');
 assert.equal(adminActionLabel('dispute_appeal_response_added'),'Odpowiedziano na odwołanie');
 assert.equal(adminActionLabel('new_server_event'),'Zapisano działanie administracyjne');
});


test('large queues have bounded pages without losing records at the last page',()=>{
 const items=Array.from({length:17},(_,i)=>({id:String(i)}));
 const pages=[0,1,2].flatMap(page=>adminQueuePage(items,page).rows.map(row=>row.id));
 assert.deepEqual(pages,items.map(row=>row.id));
 assert.equal(adminQueuePage(items,-3).current,0);
 assert.equal(adminQueuePage(items,999).current,2);
 assert.equal(adminQueuePage([],999).rows.length,0);
});
test('a selected record beyond the first page is offered in the desktop list and the mobile picker',()=>{
 const items=Array.from({length:17},(_,i)=>({id:String(i),number:'IH-'+i,title:'Case '+i,subtitle:'Sample',meta:'Open'}));
 const html=render(AdminQueue,{items,selectedId:'14',onSelect(){},children:React.createElement('article',null,'Selected record details')});
 assert.equal((html.match(/<option /g)||[]).length,17);
 assert.match(html,/<option value="14" selected=""/);
 assert.match(html,/<button[^>]*aria-current="true"[^>]*>.*?Case 14/);
 assert.match(html,/13–17 z 17/);
 assert.match(html,/Selected record details/);
});
test('activity rows show the operation, actor and date without a technical disclosure on every row',()=>{
 const html=render(AdminActivityLog,{rows:[{id:'event',action:'dispute_appeal_response_added',actor_user_id:'actor',created_at:'2026-10-28T10:00:00Z',dispute_id:'case-1'}],actorName:()=> 'Administrator Sample',formatDate:()=> '28.10.2026, 11:00'});
 assert.match(html,/Odpowiedziano na odwołanie/);
 assert.match(html,/Administrator Sample/);
 assert.match(html,/href="\/disputes\/case-1"/);
 assert.doesNotMatch(html,/<details|<code/);
});
test('compact admin case rows preserve the target, status and financial context',()=>{
 const html=render(AdminCaseRow,{to:'/disputes/case-1',title:'Project title',number:'IH-000001',status:React.createElement('span',null,'Decision issued'),assignment:'Assigned',budget:'500 PLN',opened:'28.10.2026'});
 for(const text of ['Project title','IH-000001','Decision issued','Assigned','500 PLN','28.10.2026'])assert.match(html,new RegExp(text));
 assert.match(html,/href="\/disputes\/case-1"/);
 assert.doesNotMatch(html,/<h2/);
});
