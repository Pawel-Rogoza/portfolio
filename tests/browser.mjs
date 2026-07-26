/* Browser suite — serves public/ and drives the terminal in headless Chromium.
   Run with: node tests/browser.mjs
   Set CHROMIUM_PATH to use a browser Playwright did not install itself. */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const PORT = Number(process.env.TEST_PORT || 8123);
const BASE = `http://127.0.0.1:${PORT}`;

/* The suite serves the site under the exact policy the vhost ships, so a CSP
   that would break production fails here instead. */
const CSP = readFileSync(join(ROOT, 'deploy', 'nginx', 'portfolio.pawelrogoza.pl.conf'), 'utf8')
  .match(/add_header\s+Content-Security-Policy\s+"([^"]+)"/)[1];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  let path = join(PUBLIC, decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!path.startsWith(PUBLIC) || !existsSync(path)) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, {
    'Content-Type': MIME[extname(path)] || 'application/octet-stream',
    'Content-Security-Policy': CSP,
  });
  res.end(readFileSync(path));
});

let failures = 0;
function check(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(notes => console.log(`  ok   ${name}${notes ? ` — ${notes}` : ''}`))
    .catch(err => { failures++; console.log(`  FAIL ${name}\n         ${err.message}`); });
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

/* Every command, plus the paths that used to be handled by string matching. */
const COMMANDS = [
  'whoami', 'about', 'projects', 'harbor', 'skills', 'htop', 'education', 'goals',
  'contact', 'ls', 'pwd', 'tree', 'cat about.md', 'cat projects/harbor.md',
  'grep linux', 'grep harbor ~/projects', 'find harbor', 'help', 'man cat', 'man top',
  'history', 'echo hello', 'date', 'uptime', 'neofetch', 'banner', 'open github',
  'sudo rm -rf /', 'exit',
  'cd projects', 'ls', 'cd ..', 'cd /home/pawel/projects', 'cd ~',
  'projects/', 'about.md', 'skills.txt', 'projects/harbor.md',
  'top', 'dir', 'email', 'motd', 'show me the projects',
  'cat nope.txt', 'cat projects', 'ls /etc', 'cd nope', 'grep', 'find', 'man nope',
  'theme nonsense', 'open nope', 'echo', 'zzzz',
];

/* Strings that are legitimately the same in both languages. Anything else that
   does not change when the language flips means a missing PL translation. */
const SAME_IN_BOTH = new Set(['navHarbor', 'metaNextValue']);

await new Promise(r => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-gpu'],
});

const problems = [];
const cspViolations = [];
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, ...opts });
  /* a context binding outlives reloads, unlike a variable on window */
  await ctx.exposeFunction('__reportCsp', v => cspViolations.push(v));
  const page = await ctx.newPage();
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', m => {
    const txt = m.text();
    /* Google Fonts is the one allowed third party; a sandboxed runner cannot
       reach it and the site is designed to look right without it. CSP problems
       are collected separately, so filtering network noise here is safe. */
    if (m.type() === 'error' && !/fonts\.g|ERR_/.test(txt)) problems.push(`console: ${txt}`);
  });
  /* the DOM event is exact — unlike console text, it cannot be filtered away */
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', e => {
      window.__reportCsp(`${e.violatedDirective} blocked ${e.blockedURI || 'inline'}`);
    });
  });
  await page.route('https://fonts.**', r => r.abort());
  await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);      // boot sequence
  return page;
}
async function run(page, cmd) {
  await page.click('#term-input');
  await page.fill('#term-input', cmd);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
}

/* getComputedStyle returns oklch() verbatim for oklch-authored colours, so the
   value is round-tripped through a canvas to land in sRGB. Reading the digits
   out of the oklch string directly would compare lightness against a red
   channel — which is how the earlier version of this check passed regardless
   of what colour the page actually was. */
const bodyBrightness = page => page.evaluate(() => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return (r + g + b) / 3;
});

console.log('\nbrowser suite');

const page = await open();

await check('every command produces output and no error', async () => {
  const silent = [];
  for (const cmd of COMMANDS) {
    await run(page, cmd);
    const lines = await page.$eval('#term-output', el =>
      el.lastElementChild ? el.lastElementChild.children.length : 0);
    /* one child is the echoed prompt; a command must print at least one more */
    if (lines < 2) silent.push(cmd);
  }
  assert(!silent.length, `printed nothing: ${silent.join(', ')}`);
  return `${COMMANDS.length} commands`;
});

await check('clear empties the transcript', async () => {
  await run(page, 'clear');
  const children = await page.$eval('#term-output', el => el.children.length);
  assert(children === 0, `transcript still has ${children} block(s)`);
});

await check('scrollback appends instead of replacing', async () => {
  await run(page, 'whoami');
  await run(page, 'pwd');
  const blocks = await page.$eval('#term-output', el => el.children.length);
  assert(blocks === 2, `expected 2 blocks after 2 commands, got ${blocks}`);
});

await check('cd moves the prompt, the breadcrumb and the status bar', async () => {
  await run(page, 'cd projects');
  const state = await page.evaluate(() => ({
    prompt: document.getElementById('prompt-cwd').textContent,
    status: document.getElementById('status-cwd').textContent,
    crumbs: document.getElementById('path-crumbs').textContent,
    title: document.getElementById('term-title').textContent,
  }));
  assert(state.prompt === ':~/projects$', `prompt is ${state.prompt}`);
  assert(state.status === '/home/pawel/projects', `status is ${state.status}`);
  assert(state.crumbs.includes('projects'), `breadcrumb is ${state.crumbs}`);
  assert(state.title.includes('/home/pawel/projects'), `title is ${state.title}`);
  await run(page, 'cd ~');
});

await check('tab completes a unique command', async () => {
  await page.fill('#term-input', 'neo');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(80);
  const value = await page.inputValue('#term-input');
  assert(value === 'neofetch ', `got ${JSON.stringify(value)}`);
});

await check('tab lists candidates on an ambiguous prefix', async () => {
  await page.fill('#term-input', 'c');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(80);
  const listed = await page.$eval('#term-output', el => el.lastElementChild.textContent);
  for (const name of ['cat', 'cd', 'clear', 'contact']) {
    assert(listed.includes(name), `candidate list is missing ${name}`);
  }
});

await check('tab completes a path argument', async () => {
  await page.fill('#term-input', 'cat proj');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(80);
  const value = await page.inputValue('#term-input');
  assert(value === 'cat projects/', `got ${JSON.stringify(value)}`);
  await page.fill('#term-input', '');
});

await check('history recall and the readline keys', async () => {
  await run(page, 'uptime');
  await page.click('#term-input');
  await page.keyboard.press('ArrowUp');
  assert(await page.inputValue('#term-input') === 'uptime', 'ArrowUp did not recall');
  await page.keyboard.press('ArrowDown');
  assert(await page.inputValue('#term-input') === '', 'ArrowDown did not clear');
  await page.fill('#term-input', 'garbage');
  await page.keyboard.press('Control+u');
  assert(await page.inputValue('#term-input') === '', 'Ctrl+U did not kill the line');
  await page.fill('#term-input', 'noise');
  await page.keyboard.press('Control+l');
  await page.waitForTimeout(50);
  assert(await page.$eval('#term-output', el => el.children.length) === 0, 'Ctrl+L did not clear');
  await page.fill('#term-input', '');
});

await check('history survives a reload', async () => {
  await run(page, 'banner');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await page.click('#term-input');
  await page.keyboard.press('ArrowUp');
  assert(await page.inputValue('#term-input') === 'banner', 'history was not persisted');
  await page.fill('#term-input', '');
});

await check('htop meters render and animate', async () => {
  await run(page, 'htop');
  const initial = await page.$$eval('.meter-fill', els => els.map(e => e.style.width));
  assert(initial.length === 7, `expected 7 meters, got ${initial.length}`);
  assert(initial.every(w => parseFloat(w) > 0), `some meters have no width: ${initial}`);
  const boxes = await page.$$eval('.meter-fill', els => els.map(e => e.getBoundingClientRect().height));
  assert(boxes.every(h => h > 0), 'meter bars have zero height — inline span cannot be sized');
  await page.waitForTimeout(1600);
  const later = await page.$$eval('.meter-fill', els => els.map(e => e.style.width));
  assert(later.join() !== initial.join(), 'meters did not move');
  return `7 meters, ${initial[0]} → ${later[0]}`;
});

await check('echoed commands are readable on the light theme', async () => {
  await run(page, 'theme light');
  await run(page, 'whoami');
  const contrast = await page.evaluate(() => {
    /* getComputedStyle hands back oklch() verbatim for oklch-authored colours,
       so the value is round-tripped through a canvas to land in sRGB. */
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const ctx2d = cv.getContext('2d');
    const toRGB = css => {
      ctx2d.clearRect(0, 0, 1, 1);
      ctx2d.fillStyle = css;
      ctx2d.fillRect(0, 0, 1, 1);
      return [...ctx2d.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const lum = ([r, g, b]) => {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const line = document.querySelector('.term-prompt-line');
    const fg = lum(toRGB(getComputedStyle(line.lastChild).color));
    const bg = lum(toRGB(getComputedStyle(document.getElementById('terminal')).backgroundColor));
    const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg];
    return (hi + 0.05) / (lo + 0.05);
  });
  assert(contrast >= 4.5, `contrast ratio is ${contrast.toFixed(2)}:1, needs 4.5:1`);
  return `${contrast.toFixed(1)}:1`;
});

await check('theme switches and persists', async () => {
  await run(page, 'theme dark');
  assert(await page.getAttribute('html', 'data-theme') === 'dark', 'theme command did not apply');
  await page.click('#btn-theme');
  assert(await page.getAttribute('html', 'data-theme') === 'light', 'toggle did not flip back');
  await page.reload({ waitUntil: 'domcontentloaded' });
  assert(await page.getAttribute('html', 'data-theme') === 'light', 'theme was not persisted');
  await page.waitForTimeout(900);
});

await check('exactly one theme icon is visible', async () => {
  const visible = await page.$$eval('#btn-theme svg',
    els => els.filter(e => getComputedStyle(e).display !== 'none').length);
  assert(visible === 1, `${visible} icons visible — check the .icon-btn specificity`);
});

await check('the whole terminal translates to Polish', async () => {
  await run(page, 'lang en');
  const before = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('[data-i18n]').forEach(el => { out[el.dataset.i18n] = el.textContent; });
    return out;
  });
  const enTerminal = await page.$eval('#term-output', el => el.textContent);

  await run(page, 'lang pl');
  const after = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll('[data-i18n]').forEach(el => { out[el.dataset.i18n] = el.textContent; });
    return out;
  });
  const plTerminal = await page.$eval('#term-output', el => el.textContent);

  const untranslated = Object.keys(before).filter(k => before[k] === after[k]);
  assert(untranslated.every(k => SAME_IN_BOTH.has(k)),
    `no Polish string for: ${untranslated.filter(k => !SAME_IN_BOTH.has(k)).join(', ')}`);
  assert(plTerminal !== enTerminal, 'the terminal body did not change language');
  assert(await page.getAttribute('html', 'lang') === 'pl', 'html lang attribute was not updated');

  await run(page, 'skills');
  const skills = await page.$eval('#term-output', el => el.textContent);
  assert(/Bezpiecze/.test(skills), 'skills output is still English');
  await run(page, 'lang en');
  return `${Object.keys(before).length} page strings + terminal body`;
});

await check('chips, nav and the file strip all drive the terminal', async () => {
  await run(page, 'clear');
  await page.click('.chip[data-cmd="harbor"]');
  await page.waitForTimeout(120);
  assert((await page.$eval('#term-output', el => el.textContent)).includes('Harbor'), 'chip did nothing');

  await page.click('.fs-file');
  await page.waitForTimeout(120);
  assert((await page.$eval('#term-output', el => el.textContent)).includes('Rogoża'), 'file strip did nothing');

  await page.click('.nav-links button[data-cmd="skills"]');
  await page.waitForTimeout(120);
  assert((await page.$eval('#term-output', el => el.textContent)).includes('skills.txt'), 'nav did nothing');
});

await check('fullscreen toggles and Esc leaves it', async () => {
  await page.click('#btn-expand');
  await page.waitForTimeout(200);
  assert(await page.$eval('#terminal', el => el.classList.contains('expanded')), 'did not expand');
  assert(await page.getAttribute('#btn-expand', 'aria-expanded') === 'true', 'aria-expanded not set');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  assert(!(await page.$eval('#terminal', el => el.classList.contains('expanded'))), 'Esc did not close');
});

await check('unknown commands offer clickable suggestions', async () => {
  await run(page, 'harbourr');
  const suggestions = await page.$$('.term-suggestion');
  assert(suggestions.length >= 1, 'no suggestions offered');
  await suggestions[0].click();
  await page.waitForTimeout(120);
  const blocks = await page.$eval('#term-output', el => el.children.length);
  assert(blocks >= 2, 'clicking a suggestion did not run it');
  return `${suggestions.length} suggestion(s)`;
});

await check('no interactive element is keyboard-unreachable', async () => {
  const spans = await page.$$('span[data-cmd], span.term-suggestion, span.path-seg');
  assert(!spans.length, `${spans.length} clickable span(s) left`);
  const unreachable = await page.$$eval('[data-cmd]', els =>
    els.filter(e => e.tagName !== 'BUTTON' && e.tagName !== 'A').map(e => e.tagName));
  assert(!unreachable.length, `non-focusable [data-cmd] elements: ${unreachable.join(', ')}`);
});

await check('contact exposes real links', async () => {
  await run(page, 'contact');
  const hrefs = await page.$$eval('#term-output a.term-link', els => els.map(e => e.href));
  assert(hrefs.some(h => h.startsWith('mailto:')), 'no mailto link');
  assert(hrefs.some(h => h.includes('github.com')), 'no GitHub link');
  const unsafe = await page.$$eval('#term-output a[target="_blank"]',
    els => els.filter(e => !/noopener/.test(e.rel)).length);
  assert(!unsafe, `${unsafe} external link(s) without rel="noopener"`);
  return `${hrefs.length} link(s)`;
});

await check('reduced motion skips the boot animation and the meters', async () => {
  const quiet = await open({ reducedMotion: 'reduce' });
  const blocks = await quiet.$eval('#term-output', el => el.children.length);
  assert(blocks === 2, `expected boot + welcome as 2 blocks, got ${blocks}`);
  await run(quiet, 'htop');
  const before = await quiet.$$eval('.meter-fill', els => els.map(e => e.style.width));
  await quiet.waitForTimeout(1600);
  const after = await quiet.$$eval('.meter-fill', els => els.map(e => e.style.width));
  assert(before.join() === after.join(), 'meters still animate under prefers-reduced-motion');
  await quiet.context().close();
});

await check('dark is the default even when the system prefers light', async () => {
  const fresh = await open({ colorScheme: 'light' });

  assert(await fresh.getAttribute('html', 'data-theme') === 'dark',
    'a first visit did not land on the dark theme');
  const dark = await bodyBrightness(fresh);
  assert(dark < 80, `body background brightness ${dark.toFixed(0)} — that is not a dark page`);
  assert(await fresh.getAttribute('#theme-color', 'content') === '#1b1e28',
    'theme-color meta does not match the dark theme');

  /* `theme auto` is the opt-out that hands the choice back to the system */
  await run(fresh, 'theme auto');
  assert(await fresh.getAttribute('html', 'data-theme') === null,
    'theme auto did not clear the override');
  /* body animates its background over .25s — sampling sooner reads a colour
     part way through the transition, not the theme that was applied */
  await fresh.waitForTimeout(450);
  const auto = await bodyBrightness(fresh);
  assert(auto > 200,
    `under theme auto on a light system the page should be light, got ${auto.toFixed(0)}`);

  await fresh.context().close();
  return `default ${dark.toFixed(0)} → auto/light ${auto.toFixed(0)}`;
});

await check('the page survives its own Content-Security-Policy', async () => {
  assert(!cspViolations.length, cspViolations.join('; '));
  return CSP.split(';')[0];
});

await check('no JavaScript errors in the whole run', async () => {
  assert(!problems.length, problems.join('; '));
});

await browser.close();
server.close();

console.log(failures ? `\n${failures} check(s) failed\n` : '\nall browser checks passed\n');
process.exit(failures ? 1 : 0);
