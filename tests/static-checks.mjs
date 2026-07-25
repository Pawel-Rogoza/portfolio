/* Static checks — no browser, no network, no dependencies.
   Run with: node tests/static-checks.mjs
   Exits non-zero on the first category that fails. */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

let failures = 0;
function check(name, fn) {
  try {
    const notes = fn();
    console.log(`  ok   ${name}${notes ? ` — ${notes}` : ''}`);
  } catch (err) {
    failures++;
    console.log(`  FAIL ${name}\n         ${err.message.replace(/\n/g, '\n         ')}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const html = readFileSync(join(PUBLIC, 'index.html'), 'utf8');
const css = readFileSync(join(PUBLIC, 'css', 'style.css'), 'utf8');
const app = readFileSync(join(PUBLIC, 'js', 'app.js'), 'utf8');
const vhost = readFileSync(join(ROOT, 'deploy', 'nginx', 'portfolio.pawelrogoza.pl.conf'), 'utf8');

console.log('\nstatic checks');

/* ---------------------------------------------------------------- CSP guard
   The vhost ships a CSP without 'unsafe-inline'. Anything inline in the markup
   would be silently dropped in production but work fine locally, so the check
   has to live here rather than in the browser suite. */

check('no inline <script> body', () => {
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .filter(m => m[1].trim().length);
  assert(!inline.length, `${inline.length} inline script block(s) — CSP has no 'unsafe-inline'`);
});

check('no <style> blocks', () => {
  const blocks = [...html.matchAll(/<style[^>]*>/gi)];
  assert(!blocks.length, `${blocks.length} <style> block(s) — move them into css/style.css`);
});

check('no style="" attributes', () => {
  const attrs = [...html.matchAll(/\sstyle\s*=\s*["']/gi)];
  assert(!attrs.length, `${attrs.length} inline style attribute(s) — use a class instead`);
});

check("app.js sets no element .style except CSSOM-only widths", () => {
  /* .style.width on the htop meters is a CSSOM mutation, which CSP does not
     police. Anything that would need a style attribute in markup does. */
  const hits = [...app.matchAll(/\.style\.(\w+)\s*=/g)].map(m => m[1]);
  const allowed = new Set(['width']);
  const bad = hits.filter(p => !allowed.has(p));
  assert(!bad.length, `unexpected inline style properties: ${[...new Set(bad)].join(', ')}`);
  return `${hits.length} CSSOM write(s), all allowed`;
});

check('vhost CSP omits unsafe-inline and unsafe-eval', () => {
  const m = vhost.match(/add_header\s+Content-Security-Policy\s+"([^"]+)"/);
  assert(m, 'no Content-Security-Policy header in the vhost');
  assert(!/unsafe-inline|unsafe-eval/.test(m[1]), 'CSP still allows unsafe-inline / unsafe-eval');
  return m[1].split(';').length + ' directives';
});

check('vhost sets no add_header inside a location block', () => {
  /* add_header in a location silently drops every header inherited from
     server {} — the cache locations must use `expires` instead. */
  const locations = [...vhost.matchAll(/location[^{]*\{([\s\S]*?)\n\s*\}/g)];
  const offenders = locations
    .filter(m => /^\s*add_header/m.test(m[1]))
    .map(m => m[0].split('\n')[0].trim());
  assert(!offenders.length,
    `add_header inside: ${offenders.join(', ')} — this drops the inherited security headers`);
  return `${locations.length} location block(s) clean`;
});

/* ------------------------------------------------------------ asset wiring */

check('every local href/src exists on disk', () => {
  const refs = [...html.matchAll(/(?:href|src)\s*=\s*"([^"]+)"/g)]
    .map(m => m[1])
    .filter(u => !/^(https?:|data:|mailto:|#|\/\/)/.test(u));
  const missing = refs.filter(u => !existsSync(join(PUBLIC, u.split(/[?#]/)[0])));
  assert(!missing.length, `missing: ${missing.join(', ')}`);
  return `${refs.length} reference(s)`;
});

check('no file in public/ is orphaned', () => {
  const files = [];
  (function walk(dir, prefix) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full, `${prefix}${name}/`);
      else files.push(`${prefix}${name}`);
    }
  })(PUBLIC, '');
  /* robots.txt and og.png are fetched by crawlers, not linked from markup */
  const standalone = new Set(['robots.txt', 'index.html', 'og.png']);
  const orphans = files.filter(f => !standalone.has(f) && !html.includes(f));
  assert(!orphans.length, `not referenced from index.html: ${orphans.join(', ')}`);
  return `${files.length} file(s)`;
});

check('.mt-* classes used by app.js are defined in style.css', () => {
  const requested = new Set([...app.matchAll(/\bmt:\s*(\d+)/g)].map(m => m[1]));
  const defined = new Set([...css.matchAll(/\.mt-(\d+)\s*\{/g)].map(m => m[1]));
  const missing = [...requested].filter(n => !defined.has(n));
  assert(!missing.length, `app.js asks for .mt-${missing.join(', .mt-')} but style.css has no such rule`);
  return `${requested.size} spacing value(s) in use`;
});

/* --------------------------------------------------------------- head tags */

check('head carries the SEO and social tags', () => {
  const required = [
    ['<title>', /<title>[^<]+<\/title>/],
    ['meta description', /<meta\s+name="description"\s+content="[^"]{40,}"/],
    ['meta viewport', /<meta\s+name="viewport"/],
    ['canonical', /<link\s+rel="canonical"\s+href="https:\/\//],
    ['og:title', /property="og:title"/],
    ['og:image', /property="og:image"\s+content="https:\/\//],
    ['theme-color', /name="theme-color"/],
    ['favicon', /rel="icon"/],
  ];
  const missing = required.filter(([, re]) => !re.test(html)).map(([name]) => name);
  assert(!missing.length, `missing: ${missing.join(', ')}`);
  return `${required.length} tag(s)`;
});

check('og:image target exists and is 1200x630', () => {
  const path = join(PUBLIC, 'og.png');
  assert(existsSync(path), 'public/og.png is missing');
  /* PNG header: width and height are big-endian uint32 at bytes 16 and 20 */
  const buf = readFileSync(path);
  assert(buf.subarray(1, 4).toString() === 'PNG', 'og.png is not a PNG');
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert(width === 1200 && height === 630, `og.png is ${width}x${height}, expected 1200x630`);
  return `${width}x${height}`;
});

/* ----------------------------------------------------------------- markup */

check('interactive elements are buttons, not clickable spans', () => {
  const spans = [...html.matchAll(/<span[^>]*\bdata-cmd=/gi)];
  assert(!spans.length, `${spans.length} <span data-cmd> — keyboard users cannot reach these`);
});

check('the terminal input is labelled', () => {
  assert(/<label[^>]*for="term-input"/.test(html), 'no <label for="term-input">');
  assert(/id="term-output"[^>]*role="log"/.test(html), 'terminal output is not role="log"');
});

console.log(failures ? `\n${failures} check(s) failed\n` : '\nall static checks passed\n');
process.exit(failures ? 1 : 0);
