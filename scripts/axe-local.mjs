/**
 * Local axe-core scan without a browser (for sandboxes where Playwright
 * browsers can't be downloaded).
 *
 * Fetches SSR HTML from a running server (`npm run start`), inlines the built
 * CSS so getComputedStyle resolves, and runs the same axe-core config as
 * e2e/accessibility.spec.ts inside jsdom.
 *
 * Caveats vs Playwright:
 *  - No client JS hydration (SSR HTML only) and no real layout engine, so
 *    `color-contrast` findings are approximate — verify each one manually.
 *  - jsdom reports layout-dependent rules as "incomplete", never violations.
 *
 * Usage:
 *   npm run build && (npm run start &)
 *   node scripts/axe-local.mjs [route-path ...] [--dark]
 */

import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

// NOTE: axe-core is a UMD bundle that binds `window` at LOAD time
// (`})(typeof window === 'object' ? window : this)`), so it must be
// require()d lazily per scan, after the jsdom globals are installed.
const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve('axe-core');

const BASE = process.env.AXE_BASE_URL || 'http://localhost:3000';
const ROUTES = [
  '/',
  '/politics',
  '/opinions',
  '/article/house-passes-short-term-spending-bill',
  '/author/david-ignatius',
  '/live/shutdown-countdown',
  '/games',
  '/newsletters',
  '/signin',
  '/search?q=shutdown',
  '/analytics',
];

const args = process.argv.slice(2);
const darkOnly = args.includes('--dark');
const lightOnly = args.includes('--light');
const wanted = args.filter((a) => !a.startsWith('--'));
const routes = wanted.length > 0 ? wanted : ROUTES;
const modes = darkOnly ? ['dark'] : lightOnly ? ['light'] : ['light', 'dark'];

function loadCss() {
  const dir = new URL('../.next/static/css/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
  return files.map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
}

async function scan(path, mode, css) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  if (!res.ok) return { path, mode, error: `HTTP ${res.status}` };

  const dom = new JSDOM(html, { url: BASE + path, pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  if (mode === 'dark') document.documentElement.classList.add('dark');
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Install jsdom globals, then load a FRESH axe-core bound to this window.
  const saved = new Map();
  const setGlobal = (key, value) => {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  };
  setGlobal('window', window);
  setGlobal('document', document);
  setGlobal('navigator', window.navigator);
  setGlobal('getComputedStyle', window.getComputedStyle.bind(window));
  for (const k of ['Node', 'Element', 'HTMLElement', 'SVGElement', 'NodeList', 'HTMLCollection', 'self']) {
    if (window[k]) setGlobal(k, window[k]);
  }
  delete require.cache[AXE_PATH];
  const axe = require('axe-core');
  let results;
  try {
    results = await axe.run(document, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
      exclude: ['.x-num'],
    });
  } finally {
    for (const [key, desc] of saved) {
      if (desc) Object.defineProperty(globalThis, key, desc);
      else delete globalThis[key];
    }
    window.close();
  }
  return { path, mode, violations: results.violations };
}

const css = loadCss();
console.log(`axe-local: ${routes.length} route(s) × ${modes.join('+')} (css ${(css.length / 1024).toFixed(0)} KB inlined)\n`);

let total = 0;
const byRule = new Map();
for (const path of routes) {
  for (const mode of modes) {
    const r = await scan(path, mode, css);
    if (r.error) {
      console.log(`❌ ${path} [${mode}]: ${r.error}`);
      continue;
    }
    const n = r.violations.length;
    total += r.violations.reduce((s, v) => s + v.nodes.length, 0);
    console.log(`${n === 0 ? '✅' : '🔴'} ${path} [${mode}]: ${n} rule(s) violated`);
    for (const v of r.violations) {
      if (!byRule.has(v.id)) byRule.set(v.id, { ...v, pages: [] });
      byRule.get(v.id).pages.push(`${path} [${mode}] (${v.nodes.length} nodes)`);
    }
  }
}

console.log('\n' + '='.repeat(78));
if (byRule.size === 0) {
  console.log('No violations found. (Contrast results are approximate in jsdom.)');
} else {
  for (const v of byRule.values()) {
    console.log(`\n### ${v.id} — ${v.help} [${v.impact}]`);
    console.log(`    ${v.description}`);
    console.log(`    ${v.helpUrl}`);
    console.log(`    pages: ${v.pages.join(', ')}`);
    for (const node of v.nodes.slice(0, 4)) {
      console.log(`    - ${node.target.join(' ')} :: ${(node.html || '').slice(0, 160)}`);
      if (node.failureSummary) {
        console.log(`      ${String(node.failureSummary).split('\n').slice(0, 3).join(' / ').slice(0, 220)}`);
      }
    }
    const extra = v.nodes.length - 4;
    if (extra > 0) console.log(`    … +${extra} more node(s)`);
  }
}
console.log(`\nTotal violating nodes: ${total}`);
