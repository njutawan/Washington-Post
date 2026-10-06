/**
 * Allowlist-based `npm audit` gate for CI.
 *
 * Plain `npm audit --audit-level=moderate` fails the build on EVERY
 * moderate+ advisory — including ones with NO published fix, where the only
 * "remediation" would be a breaking rewrite. That trains everyone to ignore a
 * red gate. This script instead:
 *
 *  1. Runs `npm audit --json` and collects every moderate/high/critical advisory.
 *  2. Fails (exit 1) on anything NOT on the allowlist below.
 *  3. Warns when an allowlisted advisory no longer reproduces (fixed upstream
 *     → remove it from the list).
 *
 * Every allowlist entry MUST document: why no fix is available, why exposure
 * is negligible, and when to re-check. Details live in SECURITY_AUDIT.md.
 *
 * Usage: `npm run audit:ci`
 */

import { execFileSync } from 'node:child_process';

// ---------------------------------------------------------------------------
// Allowlist: advisories with no published fix + negligible exposure.
// ---------------------------------------------------------------------------
const ALLOWLIST = [
  {
    id: 'GHSA-vfj7-8cjw-p6xm', // braces (high): stack-exhaustion via nested patterns
    reason:
      'No patched braces release exists (3.0.3 is latest); the only audit ' +
      '"fix" is a breaking tailwindcss v3→v4 migration. Reachable solely via ' +
      'build-time tooling (tailwind content scanning, chokidar watch, eslint) ' +
      'that parses the repo\'s own trusted configs — no user input reaches it.',
    recheck: 'When planning the tailwindcss v4 migration, or if braces publishes a fix.',
  },
  {
    id: 'GHSA-hp3w-g68c-fv3c', // sprintf-js (moderate): DoS via unbounded precision
    reason:
      'Advisory affects ALL sprintf-js versions (no patch). Only reachable via ' +
      'js-yaml\'s CLI bin (bin/js-yaml.js → argparse → sprintf-js), which the ' +
      'app never imports — gray-matter uses js-yaml/lib (verified: zero ' +
      'argparse references in lib/). Dead code at runtime; front-matter is ' +
      'parsed only from repo-local trusted MDX.',
    recheck: 'When replacing gray-matter, or if sprintf-js/js-yaml publishes a fix.',
  },
  {
    id: 'GHSA-g84c-rxfj-3j2c', // webpack-dev-middleware (high): path traversal
    reason:
      'No backport for the 6.x line, and the latest @storybook/builder-webpack5 ' +
      '(10.6.x) still pins webpack-dev-middleware ^6. Dev-only: Storybook dev ' +
      'server on localhost; exploitation requires access to the developer\'s ' +
      'own machine. Never shipped to users.',
    recheck: 'When Storybook ships a builder on webpack-dev-middleware ≥7.4.5.',
  },
];

const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const THRESHOLD = 'moderate';

function runAudit() {
  try {
    const out = execFileSync('npm', ['audit', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024,
    });
    return JSON.parse(out);
  } catch (err) {
    // npm exits non-zero when vulnerabilities are found — the JSON is still
    // on stdout, so parse it instead of treating it as a gate failure.
    const out = err?.stdout;
    if (typeof out === 'string' && out.includes('"vulnerabilities"')) {
      return JSON.parse(out);
    }
    console.error('❌ Could not run `npm audit --json`:', err?.message || err);
    process.exit(2);
  }
}

function collectAdvisories(report) {
  /** Map GHSA id → { id, severity, title, modules:Set } */
  const found = new Map();
  const vulns = report?.vulnerabilities || {};
  for (const [pkg, details] of Object.entries(vulns)) {
    for (const via of details?.via || []) {
      if (typeof via !== 'object' || !via.url) continue;
      const match = String(via.url).match(/GHSA-[a-z0-9-]+/);
      if (!match) continue;
      const id = match[0];
      if (!found.has(id)) {
        found.set(id, {
          id,
          severity: details.severity || 'unknown',
          title: via.title || pkg,
          modules: new Set(),
        });
      }
      found.get(id).modules.add(pkg);
      // Keep the highest severity seen for this advisory.
      const cur = found.get(id);
      if ((SEVERITY_RANK[details.severity] || 0) > (SEVERITY_RANK[cur.severity] || 0)) {
        cur.severity = details.severity;
      }
    }
  }
  return [...found.values()];
}

function main() {
  const report = runAudit();
  const advisories = collectAdvisories(report).filter(
    (a) => (SEVERITY_RANK[a.severity] || 0) >= SEVERITY_RANK[THRESHOLD],
  );
  const allowed = new Map(ALLOWLIST.map((e) => [e.id, e]));
  const blocking = advisories.filter((a) => !allowed.has(a.id));
  const acknowledged = advisories.filter((a) => allowed.has(a.id));
  const stale = ALLOWLIST.filter((e) => !advisories.some((a) => a.id === e.id));

  console.log(`\nnpm audit gate (threshold: ${THRESHOLD}+, allowlist: ${ALLOWLIST.length} entries)`);
  console.log('─'.repeat(72));

  if (acknowledged.length > 0) {
    console.log('\n✅ Acknowledged (allowlisted, documented in SECURITY_AUDIT.md):');
    for (const a of acknowledged) {
      console.log(`   • ${a.id} [${a.severity}] — ${a.title}`);
      console.log(`     via: ${[...a.modules].slice(0, 4).join(', ')}${a.modules.size > 4 ? '…' : ''}`);
    }
  }

  if (stale.length > 0) {
    console.log('\n🧹 Allowlist entries that no longer reproduce (please remove + update docs):');
    for (const e of stale) console.log(`   • ${e.id}`);
  }

  if (blocking.length > 0) {
    console.log('\n❌ BLOCKING — new unacknowledged advisories (fix or allowlist with justification):');
    for (const a of blocking) {
      console.log(`   • ${a.id} [${a.severity}] — ${a.title}`);
      console.log(`     via: ${[...a.modules].slice(0, 6).join(', ')}${a.modules.size > 6 ? '…' : ''}`);
      console.log(`     https://github.com/advisories/${a.id}`);
    }
    console.log(`\nGate result: FAIL (${blocking.length} blocking advisory group(s))\n`);
    process.exit(1);
  }

  console.log(`\nGate result: PASS — 0 blocking advisories (${acknowledged.length} acknowledged)\n`);
}

main();
