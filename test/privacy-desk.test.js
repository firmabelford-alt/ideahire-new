import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const compiled = new URL(`.privacy-desk-${process.pid}.mjs`, import.meta.url);
const result = await build({ stdin: { contents: "export * from '../src/PrivacyDesk.jsx';", resolveDir: fileURLToPath(new URL('.', import.meta.url)) }, bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, write: false, logLevel: 'silent' });
await writeFile(compiled, result.outputFiles[0].text);
const { PrivacyReceipt, PrivacyFeedback, PrivacyHistoryNotice } = await import(compiled.href);
await unlink(compiled);
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

test('a confirmed request replaces the form with a receipt and enabled next actions', () => {
  const html = render(PrivacyReceipt, { request: { id: 'request-a' }, number: 'RODO-000012', type: 'Kopia danych', onNew() {} });
  assert.match(html, /Wniosek został wysłany/);
  assert.match(html, /href="#privacy-request-request-a"/);
  assert.match(html, /Złóż kolejny wniosek/);
  assert.doesNotMatch(html, /disabled|<form|<textarea/);
});

test('a receipt stays useful while a slow history read has not provided the request number', () => {
  const html = render(PrivacyReceipt, { request: { id: 'request-a' }, number: null, type: 'Dostęp do danych', onNew() {} });
  assert.match(html, /Potwierdzenie wysłania/);
  assert.match(html, /href="#privacy-history"/);
  assert.doesNotMatch(html, /RODO-000000|undefined/);
});

test('form errors are announced as alerts and withdrawn feedback is an ordinary status', () => {
  assert.match(render(PrivacyFeedback, { notice: { tone: 'error', text: 'Uzupełnij opis.' } }), /role="alert"/);
  assert.match(render(PrivacyFeedback, { notice: { tone: 'success', text: 'Ten wniosek został wycofany.' } }), /role="status"/);
  assert.equal(render(PrivacyFeedback, { notice: null }), '');
});

test('history retry disables only its own refresh button while reading', () => {
  const html = render(PrivacyHistoryNotice, { error: 'Nie udało się odświeżyć historii.', refreshing: true, onRefresh() {} });
  assert.match(html, /role="status"/);
  assert.match(html, /<button[^>]*disabled/);
  assert.match(html, /Odświeżanie/);
});
