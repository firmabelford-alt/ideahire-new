import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const preferences = await readFile(new URL('../src/Preferences.jsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/public/dark-turquoise.css', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const visual = JSON.parse(preferences.match(/IDEA_HIRE_VISUAL_SYSTEM\s*=\s*Object\.freeze\(([\s\S]*?)\);/)[1]);
const selectors = [':root:not([data-template="classic"])', ':root[data-theme="dark"]:not([data-template="classic"])'];
const role = (rule, token) => rule.match(new RegExp(`--v-${token}:\\s*(#[0-9a-f]{6})!important`, 'i'))?.[1];
const paletteRule = selector => css.slice(css.indexOf(selector) + selector.length).split('&', 1)[0];
const luminance = hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
  .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
const contrast = (first, second) => {
  const [lo, hi] = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (hi + .05) / (lo + .05);
};
const surfaces = ['bg', 'paper', 'surface'];

test('both turquoise modes have readable text and actionable links on every surface', () => {
  for (const name of ['turquoise', 'turquoiseDark']) {
    const palette = visual[name];
    for (const surface of surfaces) {
      assert.ok(contrast(palette.ink, palette[surface]) >= 7, `${name} primary text / ${surface}`);
      assert.ok(contrast(palette.muted, palette[surface]) >= 4.5, `${name} secondary text / ${surface}`);
      assert.ok(contrast(palette.accent, palette[surface]) >= 4.5, `${name} links / ${surface}`);
    }
    assert.ok(contrast(palette.on, palette.accent) >= 4.5, `${name} button label`);
  }
});

test('the shared vivid turquoise has sufficient contrast with its action labels in both modes', () => {
  const common = paletteRule(selectors[0]);
  const action = role(common, 'action');
  const ink = role(common, 'action-ink');
  assert.equal(action, visual.turquoise.material);
  assert.equal(action, visual.turquoiseDark.material);
  assert.ok(contrast(action, ink) >= 4.5);
});

test('control boundaries stay visible in both modes', () => {
  for (const surface of surfaces) {
    assert.ok(contrast(role(paletteRule(selectors[0]), 'control-line'), visual.turquoise[surface]) >= 3, `light / ${surface}`);
    assert.ok(contrast(visual.turquoiseDark.line, visual.turquoiseDark[surface]) >= 3, `dark / ${surface}`);
  }
});

test('the first paint and the theme chooser use the same colour roles', () => {
  const roles = { bg:'bg', paper:'surface', surface:'soft', ink:'ink', muted:'muted', line:'line', accent:'accent', on:'on' };
  ['turquoise', 'turquoiseDark'].forEach((theme, i) => {
    const block = paletteRule(selectors[i]);
    for (const [name, token] of Object.entries(roles)) assert.equal(role(block, token), visual[theme][name], `${theme} ${name}`);
  });
  const themeLink = html.indexOf('href="/dark-turquoise.css?');
  assert.ok(themeLink > 0 && themeLink < html.indexOf('href="/headings.css?'));
  assert.ok(html.indexOf('page.dataset.theme') < themeLink);
});

test('the palette layer stays scoped to turquoise and changes no layout metrics', () => {
  assert.deepEqual(css.match(/^  :root[^{]+/gm).map(rule => rule.trim()), selectors);
  assert.ok(css.includes('@layer ideahirePalette'));
  assert.equal(/(?:^|[;{])\s*(?:font(?:-[\w-]+)?|line-height|letter-spacing|display|(?:min-|max-)?(?:width|height)|padding(?:-[\w-]+)?|margin(?:-[\w-]+)?|grid(?:-[\w-]+)?)\s*:/m.test(css), false);
});
