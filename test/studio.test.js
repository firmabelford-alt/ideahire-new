import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { build } from 'esbuild';

// Render the actual components, with no browser credentials or network requests.
const compiled = new URL(`.studio-test-${process.pid}.mjs`, import.meta.url);
const result = await build({ stdin: { contents: `export * from '../src/ProfileStudio.jsx'; export {default as WorkDesk} from '../src/WorkDesk.jsx'; export {startBrandOpening} from '../src/BrandOpening.jsx';`, resolveDir: fileURLToPath(new URL('.', import.meta.url)) }, bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, write: false, logLevel: 'silent' });
await writeFile(compiled, result.outputFiles[0].text);
const { ProfileDetailsEditor, ExpertiseEditor, PortfolioStudio, WorkDesk, startBrandOpening } = await import(compiled.href);
await unlink(compiled);
const noop = () => {};
function render(Component, props) {
  const old = console.error;
  console.error = (...args) => { if (!String(args[0]).includes('useLayoutEffect does nothing on the server')) old(...args); };
  try { return renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Component, props))); }
  finally { console.error = old; }
}
const expertise = { categories: ['A','B','C','D'], selected: ['A','B','C'], categoryLabel: value => value, skills: ['React'], draft: '', specialization: '', name: 'Sample', onCategory: noop, onDraft: noop, onKeyDown: noop, onAdd: noop, onRemove: noop, onSpecialization: noop, onSubmit: noop };
const portfolio = { items: [{ id:'p1', title:'A project', description:'Sample', media:[] }], loading:false, busy:false, editingId:null, draft:{ title:'', description:'', projectUrl:'' }, files:[], removedIds:[], maxItems:8, maxImages:12, mediaFor:item => item?.media || [], onEdit:noop, onDelete:noop, onReset:noop, onSubmit:noop, onFiles:noop, onRemoveFile:noop, onToggleMedia:noop, fileInputRef:{ current:null } };

test('skills: the third category prevents a fourth choice while selected categories remain removable', () => {
  const html = render(ExpertiseEditor, expertise);
  const selected = [...html.matchAll(/<button[^>]*aria-pressed="true"[^>]*>/g)].map(x => x[0]);
  const other = html.match(/<button[^>]*aria-pressed="false"[^>]*>/)[0];
  assert.equal(selected.length,3);
  assert.ok(selected.every(value => !value.includes('disabled')));
  assert.match(other,/disabled/);
});

test('profile: pending source data locks the whole form and the save action', () => {
  const html = render(ProfileDetailsEditor, { name:'Sample', about:'', email:'private@example.test', loading:true, onName:noop, onAbout:noop, onAvatar:noop, onSubmit:noop });
  assert.match(html,/<fieldset[^>]*disabled/);
  assert.match(html,/<button[^>]*type="submit"[^>]*disabled/);
  assert.equal((html.match(/private@example.test/g) || []).length,1);
});

test('portfolio: saved albums do not expose an always-open required form', () => {
  const html = render(PortfolioStudio, portfolio);
  assert.match(html,/A project/);
  assert.doesNotMatch(html,/<form/);
});

test('portfolio: navigating back restores a pending draft and its selected files', () => {
  const html = render(PortfolioStudio, { ...portfolio, draft:{ title:'Unsent work', description:'Draft', projectUrl:'' }, files:[{ name:'photo.webp', lastModified:1 }] });
  assert.match(html,/<form/);
  assert.match(html,/value="Unsent work"/);
  assert.match(html,/photo.webp/);
});

test('portfolio: upload and delete actions stay disabled while a save is in progress', () => {
  const html = render(PortfolioStudio, { ...portfolio, busy:true, editingId:'p1', draft:{ title:'A project', description:'', projectUrl:'' } });
  assert.match(html,/<button[^>]*aria-label="Usuń projekt: A project"[^>]*disabled/);
  assert.match(html,/<input[^>]*type="file"[^>]*disabled/);
  assert.match(html,/<button[^>]*type="submit"[^>]*disabled/);
});

test('work desk: a search with no results offers reset, while an empty account offers discovery', () => {
  const props = { rows:[], visible:[], counts:{ unread:0,hiring:0,providing:0 }, filter:'all', search:'', onRole:noop,onSearch:noop,onReset:noop,onOpen:noop };
  const empty = render(WorkDesk, props);
  assert.match(empty,/Tu zaczyna się współpraca/);
  assert.match(empty,/href="\/jobs"/);
  const filtered = render(WorkDesk, { ...props, rows:[{ id:'one' }], search:'absent' });
  assert.match(filtered,/Wyczyść filtry/);
});

test('work desk: private terms markers and inquiry payloads do not leak into project previews', () => {
  const row = { id:'one', client_id:'me', otherProfile:{ name:'Sample' }, job:{ title:'Project' }, lastMessage:{ content:'Hello\n\n[IdeaHire:terms:v1]{"private":"payload"}', sender_id:'me' } };
  const html = render(WorkDesk, { rows:[row], visible:[row], user:{id:'me'}, counts:{unread:0,hiring:1,providing:0}, filter:'all', search:'', onRole:noop,onSearch:noop,onReset:noop,onOpen:noop });
  assert.match(html,/Ty: Hello/);
  assert.doesNotMatch(html,/payload|IdeaHire:terms/);
});

function bootEnvironment({ deep = false, reduced = false, content = true } = {}) {
  const previous = { window:globalThis.window, document:globalThis.document, MutationObserver:globalThis.MutationObserver };
  const timers = new Map(), frames = new Map(), listeners = new Map(), attributes = new Set();
  let serial = 0, removed = false, disconnected = false, ready = false;
  const boot = { dataset:{}, addEventListener:(type,fn) => listeners.set(type,fn), removeEventListener:noop, querySelector:() => null, remove:() => { removed = true; }, focus:noop };
  const root = { setAttribute:key => attributes.add(key), removeAttribute:key => attributes.delete(key), querySelector:() => content ? {} : null };
  const html = { setAttribute:noop, removeAttribute:noop };
  globalThis.document = { documentElement:html, getElementById:id => id === 'ih-brand-boot' ? boot : root, addEventListener:noop,removeEventListener:noop };
  globalThis.window = { location:{pathname:deep ? '/account' : '/'}, matchMedia:() => ({matches:reduced}), setTimeout:(fn,delay) => { const id=++serial;timers.set(id,{fn,delay});return id; }, clearTimeout:id => timers.delete(id), requestAnimationFrame:fn => {const id=++serial;frames.set(id,fn);return id;}, cancelAnimationFrame:id => frames.delete(id), dispatchEvent:event => {if(event.type === 'ih:brand-ready')ready=true;} };
  globalThis.MutationObserver = class { observe(){} disconnect(){disconnected=true;} };
  function frame(){ const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn()); }
  return { boot, timers, attributes, listeners, frame, get removed(){return removed;},get ready(){return ready;},get disconnected(){return disconnected;}, restore(){Object.assign(globalThis,previous);} };
}

test('logo opening: ready content starts a short reveal without waiting for fonts or decorative progress', () => {
  const env=bootEnvironment();
  try {const cleanup=startBrandOpening();env.frame();env.frame();assert.equal(env.boot.dataset.state,'opening');assert.ok([...env.timers.values()].some(timer=>timer.delay<=240));env.listeners.get('animationend')({target:env.boot,animationName:'ih-studio-boot-out'});assert.equal(env.removed,true);assert.equal(env.ready,true);assert.equal(env.attributes.size,0);assert.equal(env.timers.size,0);cleanup();}finally{env.restore();}
});

test('logo opening: a deep link reveals immediately and never traps the account behind the splash', () => {
  const env=bootEnvironment({deep:true});
  try {startBrandOpening();assert.equal(env.removed,true);assert.equal(env.ready,true);assert.equal(env.timers.size,0);}finally{env.restore();}
});

test('logo opening: reduced motion completes on the next task and cleanup cancels pending readiness', () => {
  const env=bootEnvironment({reduced:true});
  try {const cleanup=startBrandOpening();env.frame();env.frame();const finish=[...env.timers.values()].find(timer=>timer.delay===0);assert.ok(finish);finish.fn();assert.equal(env.ready,true);cleanup();assert.equal(env.timers.size,0);}finally{env.restore();}
  const pending=bootEnvironment({content:false});
  try {const cleanup=startBrandOpening();pending.frame();assert.equal(pending.boot.dataset.state,'loading');cleanup();assert.equal(pending.timers.size,0);assert.equal(pending.disconnected,true);}finally{pending.restore();}
});
