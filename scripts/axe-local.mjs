/**
 * Local axe-core scan without a browser (for sandboxes where Playwright
 * browsers can't be downloaded).
 *
 * Fetches SSR HTML from a running server (`npm run start`), inlines the built
 * CSS so getComputedStyle resolves, and runs the same axe-core config as
 * e2e/accessibility.spec.ts inside jsdom.
 *
 * How color-contrast works here: jsdom's CSS engine does not resolve var()
 * or modern `rgb(R G B / A)` syntax, so the built CSS + HTML are pre-resolved
 * to legacy `rgba()` literals (per-mode design tokens parsed from
 * src/app/globals.css) before axe runs. A fake 2D canvas context answers
 * axe's icon-ligature probe (this site uses inline SVG icons, no icon fonts).
 *
 * Caveats vs Playwright:
 *  - No client JS hydration (SSR HTML only) and no layout engine: absolute
 *    positioning, @media color variants, and `clamp()`/`em` font sizes are
 *    not evaluated — font sizes fall back to the stricter ≤4.5:1 threshold.
 *    Treat CI as the final arbiter; verify large-text flags by hand.
 *  - Truly layout-dependent rules stay "incomplete", never violations.
 *
 * Usage:
 *   npm run build && (npm run start &)
 *   node scripts/axe-local.mjs [route-path ...] [--dark|--light] [--incomplete]
 */

import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM, VirtualConsole } from 'jsdom';

// Silence jsdom's "Not implemented: ..." chatter (pseudo-element probes etc.)
// — axe calls those thousands of times per scan.
const quietConsole = new VirtualConsole();
quietConsole.on('jsdomError', () => {});
quietConsole.on('error', () => {});

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
const showIncomplete = args.includes('--incomplete');
const wanted = args.filter((a) => !a.startsWith('--'));
const routes = wanted.length > 0 ? wanted : ROUTES;
const modes = darkOnly ? ['dark'] : lightOnly ? ['light'] : ['light', 'dark'];

function loadCss() {
  const dir = new URL('../.next/static/css/', import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith('.css'));
  return files.map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
}

/** Parse :root (light) and .dark custom-property values from globals.css. */
function loadTokens() {
  const src = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
  const block = (sel) => {
    const m = src.match(new RegExp(`${sel.replace('.', '\\.')}\\s*{([^}]*)}`));
    const map = new Map();
    if (!m) return map;
    for (const line of m[1].split(';')) {
      const mm = line.match(/(--[\w-]+)\s*:\s*(.+)/);
      if (mm) map.set(mm[1].trim(), mm[2].trim());
    }
    return map;
  };
  const light = block(':root');
  const dark = new Map([...light, ...block('.dark')]);
  // Resolve var() chains inside token values (few passes are plenty).
  for (const map of [light, dark]) {
    for (let i = 0; i < 5; i++) {
      for (const [k, v] of map) {
        map.set(k, v.replace(/var\(\s*(--[\w-]+)(?:\s*,\s*([^)]*))?\)/g, (_, n, fb) => map.get(n) ?? fb ?? ''));
      }
    }
  }
  return { light, dark };
}

/**
 * Rewrite CSS/HTML so jsdom's legacy CSS engine yields parseable colors:
 *  1. Substitute per-rule `--tw-*-opacity` values (fallbacks lie for /A syntax).
 *  2. Substitute design tokens (mode-appropriate) and remaining var() fallbacks.
 *  3. Convert space-separated `rgb(R G B / A)` → legacy `rgba(R,G,B,A)`.
 *  4. Convert `rem` → px (axe needs absolute font sizes for the AA-large rule).
 */
function resolveForJsdom(text, tokens) {
  // 1. Tailwind opacity vars are declared per-rule; inline their real values.
  text = text.replace(/([^{}]+)\{([^{}]*)\}/g, (rule, sel, body) => {
    const ops = {};
    body.replace(/--tw-(text|bg|border|divide|ring|ring-offset|placeholder|gradient-from|gradient-via|gradient-to)-opacity:\s*([\d.]+)/g, (_, k, v) => { ops[k] = v; });
    for (const [k, v] of Object.entries(ops)) {
      body = body.replace(new RegExp(`var\\(--tw-${k}-opacity[^)]*\\)`, 'g'), v);
    }
    return `${sel}{${body}}`;
  });
  // 2. Design tokens, then any leftover var() with a fallback.
  text = text.replace(/var\(\s*(--[\w-]+)(?:\s*,\s*([^)]*))?\)/g, (_, name, fb) => tokens.get(name) ?? fb ?? `var(${name})`);
  // 3. Modern space-separated color functions → legacy comma syntax.
  text = text.replace(/rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\/\s*([\d.]+)\s*\)/g, 'rgba($1,$2,$3,$4)');
  text = text.replace(/rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g, 'rgb($1,$2,$3)');
  // 4. rem → px (root = 16px).
  text = text.replace(/([\d.]+)rem\b/g, (_, n) => `${parseFloat(n) * 16}px`);
  return text;
}

async function scan(path, mode, css, tokens) {
  const res = await fetch(BASE + path);
  const raw = await res.text();
  if (!res.ok) return { path, mode, error: `HTTP ${res.status}` };
  const map = mode === 'dark' ? tokens.dark : tokens.light;
  const html = resolveForJsdom(raw, map);
  css = resolveForJsdom(css, map);

  const dom = new JSDOM(html, { url: BASE + path, pretendToBeVisual: true, virtualConsole: quietConsole });
  const { window } = dom;
  const { document } = window;

  // Geometry shims: jsdom has no layout (all rects are 0×0, Range lacks
  // getClientRects), which makes axe skip color-contrast entirely. Fake a
  // layout where every non-blank text node owns a disjoint x-slot and each
  // element's rect spans its descendant text slots. Then axe's spatial grid
  // yields exactly the ancestor-chain background stack for every text node
  // (no cross-contamination between unrelated elements), and visibility /
  // overlap / clipping gates behave. Style-based hiding
  // (display/visibility/opacity/clip/hidden attr) still excludes content.
  // Consequence: zero-size/off-screen text and true CSS overlaps (fixed
  // bars occluding scrolled content) are NOT modeled — verify each flag by
  // hand (selectors are printed).
  const textRects = new WeakMap();
  const elRects = new WeakMap();
  let slot = 0;
  const walker = document.createTreeWalker(document.body, window.NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const t = walker.currentNode;
    if (t.nodeValue && t.nodeValue.trim() !== '') {
      textRects.set(t, new window.DOMRect(slot * 10, 0, 10, 100));
      slot++;
    }
  }
  const elRect = (el) => {
    if (elRects.has(el)) return elRects.get(el);
    let min = Infinity, max = -Infinity;
    for (const child of el.childNodes) {
      let r = null;
      if (child.nodeType === 3) r = textRects.get(child);
      else if (child.nodeType === 1) r = elRect(child);
      if (r && r.width > 0) { min = Math.min(min, r.x); max = Math.max(max, r.x + r.width); }
    }
    const rect = Number.isFinite(min)
      ? new window.DOMRect(min, 0, max - min, 100)
      : new window.DOMRect(0, 0, 0, 100); // textless subtree
    elRects.set(el, rect);
    return rect;
  };
  elRect(document.documentElement);
  window.Element.prototype.getBoundingClientRect = function () {
    return elRects.get(this) || new window.DOMRect(0, 0, 0, 100);
  };
  window.Element.prototype.getClientRects = function () {
    const r = elRects.get(this);
    return r && r.width > 0 ? [r] : [];
  };
  window.Range.prototype.getClientRects = function () {
    const c = this.startContainer;
    if (!c) return [];
    if (c.nodeType === 3) {
      const r = textRects.get(c);
      return r ? [r] : [];
    }
    const r = elRects.get(c);
    return r && r.width > 0 ? [r] : [];
  };
  if (typeof window.DOMPoint !== 'function') {
    window.DOMPoint = class DOMPoint {
      constructor(x = 0, y = 0, z = 0, w = 1) { this.x = x; this.y = y; this.z = z; this.w = w; }
      static fromPoint(p) { return new window.DOMPoint(p?.x || 0, p?.y || 0, p?.z || 0, p?.w ?? 1); }
    };
  }

  // Fake 2D canvas: axe's color-contrast check calls _isIconLigature(), which
  // needs canvas measureText/getImageData. This site uses inline SVG icons
  // (no icon fonts), so the shim answers "every glyph renders normally",
  // letting contrast evaluation proceed in jsdom.
  window.HTMLCanvasElement.prototype.getContext = function () {
    const canvas = this;
    return {
      canvas,
      set font(_) {},
      get font() { return '10px sans-serif'; },
      set textAlign(_) {},
      set textBaseline(_) {},
      measureText: (s) => ({ width: String(s).length * 10 }),
      fillText: () => {},
      clearRect: () => {},
      getImageData: (_x, _y, w, h) => ({
        data: new Uint8ClampedArray(Math.max(1, Math.ceil(w)) * Math.max(1, Math.ceil(h)) * 4).fill(255),
      }),
    };
  };
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
      resultTypes: showIncomplete ? ['violations', 'incomplete'] : ['violations'],
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
  return { path, mode, violations: results.violations, incomplete: results.incomplete || [] };
}

const css = loadCss();
const tokens = loadTokens();
console.log(`axe-local: ${routes.length} route(s) × ${modes.join('+')} (css ${(css.length / 1024).toFixed(0)} KB inlined, ${tokens.light.size} tokens)\n`);

let total = 0;
const byRule = new Map();
// Contrast pair inventory: "fg on bg" -> { count, modes:Set, examples:[...] }
const pairs = new Map();
for (const path of routes) {
  for (const mode of modes) {
    const r = await scan(path, mode, css, tokens);
    if (r.error) {
      console.log(`❌ ${path} [${mode}]: ${r.error}`);
      continue;
    }
    const n = r.violations.length;
    total += r.violations.reduce((s, v) => s + v.nodes.length, 0);
    if (showIncomplete && r.incomplete.length > 0) {
      const summary = r.incomplete.map((v) => `${v.id}×${v.nodes.length}`).join(', ');
      console.log(`   …incomplete (needs-review): ${summary}`);
    }
    console.log(`${n === 0 ? '✅' : '🔴'} ${path} [${mode}]: ${n} rule(s) violated`);
    for (const v of r.violations) {
      if (!byRule.has(v.id)) byRule.set(v.id, { ...v, pages: [] });
      byRule.get(v.id).pages.push(`${path} [${mode}] (${v.nodes.length} nodes)`);
      if (v.id === 'color-contrast') {
        for (const node of v.nodes) {
          const m = String(node.failureSummary || '').match(/foreground color: (#[0-9a-f]+).*?background color: (#[0-9a-f]+).*?font size: ([^,]+)/i);
          const key = m ? `${m[1]} on ${m[2]}` : '(unparsed)';
          if (!pairs.has(key)) pairs.set(key, { count: 0, modes: new Set(), examples: [] });
          const p = pairs.get(key);
          p.count++;
          p.modes.add(mode);
          if (p.examples.length < 2) {
            p.examples.push({ page: `${path} [${mode}]`, selector: node.target.join(' '), detail: (m ? m[0] : '').slice(0, 140) });
          }
        }
      }
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
if (pairs.size > 0) {
  console.log('\n' + '='.repeat(78));
  console.log(`CONTRAST PAIR INVENTORY (${pairs.size} unique failing pairs)`);
  const sorted = [...pairs.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [key, p] of sorted) {
    console.log(`\n### ${key} — ×${p.count} [${[...p.modes].join(', ')}]`);
    for (const ex of p.examples) {
      console.log(`    e.g. ${ex.page} :: ${ex.selector}`);
      console.log(`         ${(ex.detail || '').slice(0, 150)}`);
    }
  }
}
console.log(`\nTotal violating nodes: ${total}`);
// jsdom windows keep the event loop alive; the report is complete — exit now.
process.exit(0);
