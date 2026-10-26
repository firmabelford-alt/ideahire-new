import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const preferences = await readFile(new URL('../src/Preferences.jsx',import.meta.url),'utf8');
const css = await readFile(new URL('../src/public/dark-turquoise.css',import.meta.url),'utf8');
const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
const visual = JSON.parse(preferences.match(/IDEA_HIRE_VISUAL_SYSTEM\s*=\s*Object\.freeze\(([\s\S]*?)\);/)[1]);
const palette = visual.turquoiseDark;
const luminance = hex => {
  const linear = [1,3,5].map(offset => parseInt(hex.slice(offset,offset+2),16)/255)
    .map(value => value <= .04045 ? value/12.92:((value+.055)/1.055)**2.4);
  return linear.reduce((sum,value,index) => sum+value*[.2126,.7152,.0722][index],0);
};
const contrast = (first,second) => {
  const [lo,hi] = [luminance(first),luminance(second)].sort((a,b) => a-b);
  return (hi+.05)/(lo+.05);
};

test('dark turquoise keeps primary and secondary text readable on every surface', () => {
  for (const surface of ['bg','paper','surface']) {
    assert.ok(contrast(palette.ink,palette[surface]) >= 7,`primary text / ${surface}`);
    assert.ok(contrast(palette.muted,palette[surface]) >= 4.5,`secondary text / ${surface}`);
  }
});
test('dark turquoise links and primary button labels meet normal-text contrast', () => {
  for (const surface of ['bg','paper','surface']) assert.ok(contrast(palette.accent,palette[surface]) >= 4.5,`link / ${surface}`);
  assert.ok(contrast(palette.on,palette.accent) >= 4.5,'primary button label');
});
test('control boundaries and focus indicators remain visible on the darkest and raised surfaces', () => {
  for (const surface of ['bg','paper','surface']) {
    assert.ok(contrast(palette.line,palette[surface]) >= 3,`boundary / ${surface}`);
    assert.ok(contrast(palette.accent,palette[surface]) >= 3,`focus / ${surface}`);
  }
});
test('the first-paint stylesheet and the theme chooser use the same colour roles', () => {
  const roles = {bg:'bg',paper:'surface',surface:'soft',ink:'ink',muted:'muted',line:'line',accent:'accent',on:'on'};
  for (const [name,token] of Object.entries(roles)) {
    assert.equal(css.match(new RegExp(`--v-${token}:\\s*(#[0-9a-f]{6})!important`,'i'))?.[1],palette[name],name);
  }
  const themeLink = html.indexOf('href="/dark-turquoise.css?');
  assert.ok(themeLink > 0 && themeLink < html.indexOf('href="/headings.css?'));
  assert.ok(html.indexOf("page.dataset.theme") < themeLink);
});
test('the colour layer stays scoped to the dark turquoise template and preserves font and layout metrics', () => {
  assert.equal((css.match(/:root/g) || []).length,1);
  assert.ok(css.includes(':root[data-theme="dark"]:not([data-template="classic"])'));
  assert.ok(css.includes('@layer ideahirePalette'));
  assert.equal(/(?:^|[;{])\s*(?:font(?:-[\w-]+)?|line-height|letter-spacing|display|(?:min-|max-)?(?:width|height)|padding(?:-[\w-]+)?|margin(?:-[\w-]+)?|grid(?:-[\w-]+)?)\s*:/m.test(css),false);
});
