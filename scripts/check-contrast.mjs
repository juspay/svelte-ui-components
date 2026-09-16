#!/usr/bin/env node
/**
 * Runtime WCAG 1.4.3 contrast gate over every demo route in
 * src/routes/components/, in both themes, against the tree AS IT STANDS -- no
 * historical count is ever trusted or carried forward.
 *
 * This is a promotion, not a rewrite: it started as a scratchpad sweep run by
 * hand to resolve two conflicting audit claims ("51 dark and 18 light
 * actionable" vs "20 light, 13 classes"), which is proof that a *count*
 * without a *method* is not evidence. The method survives the promotion
 * unchanged; only the failure mode changes, from "a report someone reads" to
 * "a command that exits 1". Four properties below are load-bearing because
 * each was absent once and produced a wrong answer that looked clean:
 *
 *   1. HYDRATION SIGNAL. A prior sweep measured server-rendered markup, called
 *      it "hydrated" and reported numbers for a page that had no listeners
 *      attached yet. This gate waits on the same explicit
 *      `html[data-hydrated="true"]` flag the Playwright suite waits on (set by
 *      the root layout's onMount -- see src/routes/+layout.svelte), with a
 *      hard 3-second deadline per route. A missing signal THROWS rather than
 *      falling back to measuring whatever is on screen.
 *
 *   2. MOTION IS KILLED, NOT OUTLASTED. The docs shell and several components
 *      animate colour tokens for ~200ms on a theme change. Waiting a fixed
 *      delay after the flip and hoping it is long enough is how a prior run
 *      measured 80ms in and caught a mid-transition blend -- a colour that
 *      never shipped as a theme value -- and falsely failed ~30% of elements
 *      on every route. This gate instead injects `transition:none !important;
 *      animation:none !important` (light DOM AND every shadow root, since
 *      custom-property inheritance crosses that boundary and so does this
 *      component library's animation) BEFORE the theme flip, so there is no
 *      transition to outrun. Timing is not load-bearing here; disablement is.
 *
 *   3. ONE FRESH SERVER, ALWAYS. A stale preview -- built before the fix it is
 *      meant to verify -- made a prior negative control falsely green: the
 *      server answered from old output while the mutated source sat unbuilt.
 *      This gate refuses to reuse anything already listening on its port and
 *      always runs `pnpm run build && pnpm run preview --strictPort` fresh
 *      before driving a single Chromium session over the whole sweep.
 *
 *   4. NEVER GUESS. "Composite up the ancestor chain" is not a slogan --
 *      see compositeBackdrop(). Most text paints no background of its own, so
 *      a check that only reads an element's own backgroundColor is
 *      structurally blind to the common case (a label on a card on a page).
 *      But an ancestor-chain colour model cannot see through a blur: Status's
 *      frosted panel, rgba(255,255,255,0.6) behind a 60px backdrop-filter,
 *      measured at 1.02:1 from real pixels while this model would have called
 *      it a flat colour. Anything with a gradient, filter, backdrop-filter,
 *      opacity < 1, or a non-normal mix-blend-mode anywhere from the text
 *      element up to <html> is QUARANTINED as INDETERMINATE, never scored.
 *      A disabled control is WCAG-1.4.3 EXEMPT and excluded from the
 *      actionable tally, but counted and listed -- never silently dropped.
 *      Only a real `disabled` state (the property/attribute, or
 *      `aria-disabled="true"`) is exempted; a merely faded-but-live element
 *      (a tab's close affordance, a pending row) is not. Native <svg>/MathML
 *      text (chart ticks, legends, in-slice labels) is counted separately and
 *      excluded from scoring: charting libraries paint shapes as SVG SIBLINGS
 *      of the label, not ancestors, so an ancestor-chain walk cannot see what
 *      the label sits on.
 *
 * What this gate does NOT check is printed on every passing run, at the
 * bottom of main() -- read it before trusting a green run as more than it is.
 *
 * Usage:
 *   node scripts/check-contrast.mjs [--root <repo>] [--routes a,b,c]
 *                                    [--keep-server] [--out <dir>]
 *
 * Re-run any time: `pnpm run check:contrast` with no arguments targets this
 * checkout and writes a fresh report to contrast-report/ next to the repo root.
 */

import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, openSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const __filename = fileURLToPath(import.meta.url);

// ---------------------------------------------------------------------------
// 0. Self re-exec with TypeScript stripping, so scripts/pw-port.ts (the real
//    port/reuse logic playwright.config.ts uses) can be imported verbatim
//    instead of having its hashing re-derived and risking silent drift.
//    Unconditional on first run -- simpler and more robust than probing
//    whether the current Node build strips TS by default (package.json pins
//    node >=22.18, which needs the flag; later builds do not).
// ---------------------------------------------------------------------------
if (!process.env.__CHECK_CONTRAST_REEXECED) {
  const child = spawn(
    process.execPath,
    ['--experimental-strip-types', __filename, ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, __CHECK_CONTRAST_REEXECED: '1' } }
  );
  const code = await new Promise((resolve) => child.on('exit', (c) => resolve(c ?? 1)));
  process.exit(code);
}

// ---------------------------------------------------------------------------
// 1. Args & paths
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = { root: null, routes: null, keepServer: false, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') {
      out.root = argv[++i];
    } else if (a === '--routes') {
      out.routes = argv[++i]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === '--keep-server') {
      out.keepServer = true;
    } else if (a === '--out') {
      out.out = argv[++i];
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
// Repo root, derived from this file's own location -- the same pattern every
// other scripts/check-*.js gate uses. `--root` still overrides, for driving
// this gate against a checkout other than the one it lives in.
const ROOT = path.resolve(args.root ?? new URL('..', import.meta.url).pathname);
const OUT_DIR = path.resolve(args.out ?? path.join(ROOT, 'contrast-report'));
mkdirSync(OUT_DIR, { recursive: true });

if (!existsSync(path.join(ROOT, 'playwright.config.ts'))) {
  throw new Error(`--root ${ROOT} does not look like this repo (no playwright.config.ts found).`);
}

// Resolve @playwright/test exactly as this checkout would (its own installed
// version), regardless of where this script physically lives.
const req = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = req('@playwright/test');

// Import the REAL port/reuse logic from playwright.config.ts's own dependency,
// rather than re-deriving the hash here and risking it drifting from the
// source of truth. playwrightPort() hashes import.meta.dirname of pw-port.ts
// itself (i.e. `<repo>/scripts`), NOT the repo root -- a hand-rolled
// re-derivation using the repo root would silently compute the wrong port.
const pwPort = await import(pathToFileURL(path.join(ROOT, 'scripts/pw-port.ts')).href);
const PORT = pwPort.playwrightPort(pwPort.FUNCTIONAL);
const BASE_PATH = process.env.BASE_PATH ?? ''; // mirrors svelte.config.js
const BASE_URL = `http://localhost:${PORT}`;

// ---------------------------------------------------------------------------
// 2. Route discovery -- the tree as it stands, not a remembered list.
// ---------------------------------------------------------------------------
function discoverRoutes(root) {
  const dir = path.join(root, 'src/routes/components');
  const entries = readdirSync(dir).filter((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() && existsSync(path.join(full, '+page.svelte'));
  });
  entries.sort();
  return entries;
}

const allRoutes = discoverRoutes(ROOT);
const routes = args.routes ?? allRoutes;
const unknown = routes.filter((r) => !allRoutes.includes(r));
if (unknown.length > 0) {
  throw new Error(
    `--routes named slugs not found under src/routes/components: ${unknown.join(', ')}`
  );
}

console.log(`[check-contrast] root: ${ROOT}`);
console.log(`[check-contrast] routes discovered: ${allRoutes.length}; sweeping: ${routes.length}`);
console.log(`[check-contrast] port: ${PORT} (fresh server required)`);

// ---------------------------------------------------------------------------
// 3. Server -- literally playwright.config.ts's webServer.command, reused.
//    Never reuses an already-listening server: property 3 above.
// ---------------------------------------------------------------------------
async function isServerUp() {
  try {
    const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

let serverProc = null;
let weStartedServer = false;

async function ensureServer() {
  if (await isServerUp()) {
    throw new Error(
      `refusing to reuse an existing server at ${BASE_URL}; its output may predate the ` +
        `source this gate is about to measure. Stop it before running this gate.`
    );
  }
  console.log(
    `[check-contrast] starting fresh: pnpm run build && pnpm run preview --port ${PORT} --strictPort`
  );
  const logPath = path.join(OUT_DIR, 'server.log');
  const logFd = openSync(logPath, 'w');
  serverProc = spawn(`pnpm run build && pnpm run preview --port ${PORT} --strictPort`, {
    cwd: ROOT,
    shell: true,
    stdio: ['ignore', logFd, logFd]
  });
  weStartedServer = true;
  const deadline = Date.now() + 180_000; // build (~20s observed) + preview boot, generous margin
  while (Date.now() < deadline) {
    if (await isServerUp()) {
      console.log(`[check-contrast] server up on ${BASE_URL}`);
      return;
    }
    if (serverProc.exitCode !== null) {
      throw new Error(`server process exited early (code ${serverProc.exitCode}); see ${logPath}`);
    }
    await sleep(1000);
  }
  throw new Error(`server did not come up within 180s; see ${logPath}`);
}

function stopServer() {
  if (!weStartedServer || args.keepServer) {
    return;
  }
  console.log('[check-contrast] stopping the server this run started');
  if (serverProc && serverProc.exitCode === null) {
    serverProc.kill('SIGTERM');
  }
  // `pnpm run preview` interposes a process that does not reliably forward a
  // signal sent to the shell down to the actual vite preview grandchild --
  // verified here: a SIGTERM'd shell left vite listening and made the very
  // next run refuse to start, believing a live server was still ours to
  // reuse. scripts/negative-control.mjs documents the identical `npx`
  // interposition. Kill whatever is actually bound to the port instead of
  // trusting the tracked pid tree.
  try {
    // `-sTCP:LISTEN` is load-bearing, not decorative: a bare `-ti tcp:$PORT`
    // also matches OUR OWN process, because isServerUp()'s fetch() to that
    // port is itself a connection "on" tcp:$PORT from lsof's point of view.
    // Without the state filter this loop killed the still-running gate
    // process mid-cleanup -- discovered here when a run died silently with no
    // report and no error, self-SIGKILLed between printing the pid list and
    // reaching the next line. The listener is the only pid that ever needs
    // to die; excluding our own pid besides is a second, cheap guard against
    // the same class of mistake resurfacing under a different lsof flag set.
    const lsof = spawnSync('lsof', ['-ti', `tcp:${PORT}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
    const pids = (lsof.stdout ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s !== '' && Number(s) !== process.pid);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 'SIGKILL');
      } catch {
        // already gone
      }
    }
    if (pids.length > 0) {
      spawnSync('sleep', ['0.3']);
    } // let the OS release the port
  } catch {
    // lsof unavailable (some minimal CI images) -- best effort only; the
    // SIGTERM above still handles the common case.
  }
}

// ---------------------------------------------------------------------------
// 4. Motion killer -- property 2 above. Runs inside the browser. Reaches every
//    shadow root that exists at call time, since a global light-DOM stylesheet
//    does not cross that boundary (unlike a custom-property value, which the
//    theming layer relies on crossing it).
// ---------------------------------------------------------------------------
function disableMotion() {
  const CSS = '*, *::before, *::after { transition: none !important; animation: none !important; }';
  function inject(root) {
    const style = document.createElement('style');
    style.textContent = CSS;
    style.setAttribute('data-check-contrast-disable-motion', '');
    root.appendChild(style);
  }
  inject(document.head ?? document.documentElement);
  (function walk(root) {
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) {
        inject(el.shadowRoot);
        walk(el.shadowRoot);
      }
    }
  })(document);
}

// ---------------------------------------------------------------------------
// 5. In-page measurement. Runs inside the browser via page.evaluate.
//    Self-contained on purpose: no closures over outer-scope state.
// ---------------------------------------------------------------------------
function sweepPage(meta) {
  const { route, theme } = meta;
  const LARGE_MIN_PX = 24; // 18pt
  const LARGE_BOLD_MIN_PX = 18.6667; // 14pt
  const BOLD_MIN_WEIGHT = 700;
  const MAX_LISTED = 400; // defensive cap per page per bucket; overflow is COUNTED, never silently dropped

  function parseColor(str) {
    if (!str) {
      return null;
    }
    const m = /rgba?\(([^)]+)\)/i.exec(str);
    if (!m) {
      return null;
    }
    const parts = m[1].split(',').map((s) => parseFloat(s.trim()));
    const [r, g, b] = parts;
    const a = parts.length > 3 ? parts[3] : 1;
    if ([r, g, b].some((v) => Number.isNaN(v))) {
      return null;
    }
    return { r, g, b, a: Number.isNaN(a) ? 1 : a };
  }

  function relLum(c) {
    const ch = (v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
  }

  function ratioOf(fg, bg) {
    const L1 = relLum(fg);
    const L2 = relLum(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Alpha-composite `top` (with its own alpha) OVER `bottom` (assumed opaque).
  function over(top, bottom) {
    const a = top.a;
    return {
      r: top.r * a + bottom.r * (1 - a),
      g: top.g * a + bottom.g * (1 - a),
      b: top.b * a + bottom.b * (1 - a),
      a: 1
    };
  }

  function getParent(node) {
    if (node.parentElement) {
      return node.parentElement;
    }
    const root = node.getRootNode();
    if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) {
      return root.host;
    }
    return null;
  }

  function isVisible(el) {
    if (!(el instanceof Element)) {
      return false;
    }
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.visibility === 'collapse') {
      return false;
    }
    if (cs.display === 'none') {
      return false;
    }
    return el.getClientRects().length > 0;
  }

  function isDisabled(el) {
    let n = el;
    let guard = 0;
    while (n && guard < 40) {
      guard++;
      if (n instanceof Element) {
        if ('disabled' in n && n.disabled === true) {
          return true;
        }
        if (n.hasAttribute && n.hasAttribute('disabled')) {
          return true;
        }
        if (n.getAttribute && n.getAttribute('aria-disabled') === 'true') {
          return true;
        }
      }
      n = getParent(n);
    }
    return false;
  }

  function selectorFor(el) {
    const parts = [];
    let n = el;
    let depth = 0;
    while (n && depth < 5) {
      if (!(n instanceof Element)) {
        break;
      }
      let s = n.tagName.toLowerCase();
      const pw = n.getAttribute && n.getAttribute('data-pw');
      if (n.id) {
        s += `#${n.id}`;
      } else if (pw) {
        s += `[data-pw="${pw}"]`;
      } else if (typeof n.className === 'string' && n.className.trim()) {
        s += `.${n.className.trim().split(/\s+/).slice(0, 2).join('.')}`;
      }
      parts.unshift(s);
      n = getParent(n);
      depth++;
    }
    return parts.join(' > ');
  }

  function quarantineReasons(el) {
    const cs = getComputedStyle(el);
    const reasons = [];
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      reasons.push('background-image');
    }
    if (cs.filter && cs.filter !== 'none') {
      reasons.push('filter');
    }
    const bf = cs.backdropFilter || cs.webkitBackdropFilter;
    if (bf && bf !== 'none') {
      reasons.push('backdrop-filter');
    }
    const op = parseFloat(cs.opacity);
    if (!Number.isNaN(op) && op < 0.999) {
      reasons.push(`opacity:${cs.opacity}`);
    }
    if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') {
      reasons.push('mix-blend-mode');
    }
    return reasons;
  }

  function toHex(c) {
    const h = (v) =>
      Math.round(Math.max(0, Math.min(255, v)))
        .toString(16)
        .padStart(2, '0');
    return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
  }

  // Walk the FULL ancestor chain (element itself -> ... -> <html>), piercing
  // shadow boundaries via host. Quarantine triggers are checked on every node
  // in that chain, not just up to the first opaque layer: an ancestor's
  // opacity/filter/blend applies to its whole subtree, including a
  // descendant's "opaque" background, so a closer solid colour does not
  // shield against a farther-out effect.
  function compositeBackdrop(startEl) {
    const quarantine = [];
    const layers = []; // near -> far, alpha < 1 possible, stops collecting after first alpha===1
    let node = startEl;
    let stopped = false;
    let guard = 0;
    while (node && guard < 80) {
      guard++;
      if (node instanceof Element) {
        const reasons = quarantineReasons(node);
        if (reasons.length > 0) {
          quarantine.push({ el: selectorFor(node), reasons });
        }
        if (!stopped) {
          const cs = getComputedStyle(node);
          const bg = parseColor(cs.backgroundColor);
          if (bg && bg.a > 0) {
            layers.push(bg);
            if (bg.a >= 0.999) {
              stopped = true;
            }
          }
        }
      }
      node = getParent(node);
    }
    if (!stopped) {
      layers.push({ r: 255, g: 255, b: 255, a: 1 });
    } // browser canvas default
    // Composite far -> near.
    let acc = {
      r: layers[layers.length - 1].r,
      g: layers[layers.length - 1].g,
      b: layers[layers.length - 1].b,
      a: 1
    };
    for (let i = layers.length - 2; i >= 0; i--) {
      acc = over(layers[i], acc);
    }
    return { color: acc, quarantined: quarantine.length > 0, reasons: quarantine };
  }

  // --- collect candidate text-bearing elements, including inside shadow roots ---
  const htmlInstances = [];
  let svgTextCount = 0;
  let unparsedColorCount = 0;

  function hasDirectText(el) {
    for (const c of el.childNodes) {
      if (c.nodeType === 3 && c.textContent.trim().length > 0) {
        return true;
      }
    }
    return false;
  }

  function walk(root) {
    const all = root.querySelectorAll('*');
    for (const el of all) {
      const isHtmlNs =
        el.namespaceURI === 'http://www.w3.org/1999/xhtml' || el.namespaceURI === null;
      if (!isHtmlNs) {
        if (hasDirectText(el) && isVisible(el)) {
          svgTextCount++;
        }
      } else {
        if (hasDirectText(el) && isVisible(el)) {
          htmlInstances.push({ el, kind: 'text' });
        }
        const tag = el.tagName.toLowerCase();
        if ((tag === 'input' || tag === 'textarea') && isVisible(el)) {
          const val = ('value' in el ? String(el.value) : '').trim();
          const ph = (el.getAttribute('placeholder') || '').trim();
          if (val.length > 0) {
            htmlInstances.push({ el, kind: 'value' });
          } else if (ph.length > 0) {
            htmlInstances.push({ el, kind: 'placeholder' });
          }
        }
      }
      if (el.shadowRoot) {
        walk(el.shadowRoot);
      }
    }
  }
  walk(document);

  const failingActionable = [];
  const failingDisabledExempt = [];
  const quarantined = [];
  let overflowActionable = 0;
  let overflowQuarantined = 0;
  let passCount = 0;
  let disabledPassCount = 0;

  for (const inst of htmlInstances) {
    const el = inst.el;
    const cs = getComputedStyle(el);
    const fontSizePx = parseFloat(cs.fontSize) || 16;
    const fontWeight = parseInt(cs.fontWeight, 10) || 400;
    const large =
      fontSizePx >= LARGE_MIN_PX ||
      (fontSizePx >= LARGE_BOLD_MIN_PX && fontWeight >= BOLD_MIN_WEIGHT);
    const threshold = large ? 3.0 : 4.5;
    const disabled = isDisabled(el);

    let fgStr;
    let pseudoNote = '';
    if (inst.kind === 'placeholder') {
      fgStr = getComputedStyle(el, '::placeholder').color || cs.color;
      pseudoNote = '::placeholder';
    } else {
      fgStr = cs.color;
    }
    const fg = parseColor(fgStr);
    if (!fg) {
      unparsedColorCount++;
      continue;
    }

    const ownReasons = quarantineReasons(el);
    const backdrop = compositeBackdrop(el);
    const isQuarantined = backdrop.quarantined || ownReasons.length > 0;

    const text = (
      el.textContent ||
      (inst.kind === 'value' ? el.value : el.getAttribute('placeholder')) ||
      ''
    )
      .trim()
      .slice(0, 60);

    const base = {
      route,
      theme,
      selector: selectorFor(el) + (pseudoNote ? ` ${pseudoNote}` : ''),
      kind: inst.kind,
      text,
      fontSizePx: Math.round(fontSizePx * 100) / 100,
      fontWeight,
      large,
      threshold,
      disabled
    };

    if (isQuarantined) {
      const allReasons = [...ownReasons, ...backdrop.reasons.flatMap((q) => q.reasons)];
      if (quarantined.length < MAX_LISTED) {
        quarantined.push({ ...base, fgHex: toHex(fg), reasons: [...new Set(allReasons)] });
      } else {
        overflowQuarantined++;
      }
      continue;
    }

    const fgOnBg = fg.a < 1 ? over(fg, backdrop.color) : fg;
    const ratio = ratioOf(fgOnBg, backdrop.color);
    const pass = ratio >= threshold;
    const record = {
      ...base,
      fgHex: toHex(fgOnBg),
      bgHex: toHex(backdrop.color),
      ratio: Math.round(ratio * 100) / 100
    };

    if (pass) {
      if (disabled) {
        disabledPassCount++;
      } else {
        passCount++;
      }
      continue;
    }

    if (disabled) {
      if (failingDisabledExempt.length < MAX_LISTED) {
        failingDisabledExempt.push(record);
      } else {
        overflowActionable++;
      }
    } else if (failingActionable.length < MAX_LISTED) {
      failingActionable.push(record);
    } else {
      overflowActionable++;
    }
  }

  return {
    route,
    theme,
    measuredTotal: htmlInstances.length,
    passCount,
    disabledPassCount,
    failingActionable,
    failingDisabledExempt,
    quarantined,
    svgTextExcluded: svgTextCount,
    unparsedColorCount,
    overflowActionable,
    overflowQuarantined
  };
}

// ---------------------------------------------------------------------------
// 6. Drive one browser session over every route x theme.
// ---------------------------------------------------------------------------
async function main() {
  await ensureServer();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  const page = await context.newPage();

  const perPage = [];
  const startedAt = Date.now();

  try {
    for (const route of routes) {
      for (const theme of ['light', 'dark']) {
        const url = `${BASE_URL}${BASE_PATH}/components/${route}`;
        const response = await page.goto(url, { waitUntil: 'load' });
        // Caught here: a concurrent `pnpm run build` from another process replaced
        // .svelte-kit/output under this server's feet mid-sweep, and the preview
        // server started answering every subsequent route with a generic SvelteKit
        // 404/error document. That document still sets html[data-hydrated="true"]
        // (the root layout mounts regardless of which page failed inside it), so the
        // hydration wait below did NOT catch it -- seven routes in a row silently
        // measured the same ~114-element error shell and reported 0 actionable, a
        // false-clean result indistinguishable from a real pass by that check alone.
        // A non-OK navigation response is a second, independent loud failure for the
        // same reason property 1 exists: measuring the wrong page and calling it a
        // pass is worse than crashing.
        if (!response || !response.ok()) {
          throw new Error(
            `[check-contrast] LOUD FAILURE: navigation to ${url} did not return an OK response ` +
              `(status ${response ? response.status() : 'none'}). Measuring anyway risks scoring a ` +
              `404/error page and calling it a pass; this gate refuses to do that. If nothing else is ` +
              `writing to this checkout's build output, re-run; otherwise something else is racing this ` +
              `checkout's .svelte-kit/output.`
          );
        }

        // Property 1: hydration signal, bounded, loud on failure.
        try {
          // page.waitForFunction's real signature is (pageFunction, arg, options) --
          // passing the options object where `arg` belongs is a documented Playwright
          // footgun that silently drops it, leaving the 30s action-timeout default in
          // force. Caught here: a route with a genuinely absent hydration flag ran for
          // 30s instead of failing loud at 3s, which is not what "bounded" means. The
          // explicit `undefined` arg is load-bearing, not decorative.
          // `null`, not `undefined`: this repo's lint bans the literal, and the
          // arg slot only has to be OCCUPIED so the options object lands in the
          // third position. Playwright passes it to the page function, which
          // ignores it.
          await page.waitForFunction(
            () => document.documentElement.dataset.hydrated === 'true',
            null,
            {
              timeout: 3_000
            }
          );
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          throw new Error(
            `[check-contrast] LOUD FAILURE: hydration signal absent after 3s for ${route} (${theme}) at ${url}: ${detail}\n` +
              `  html[data-hydrated="true"] never appeared -- either the root layout's onMount ` +
              `never ran, or this page never became interactive. Measuring anyway would silently ` +
              `score static HTML and call it hydrated; this gate refuses to do that.`,
            { cause: error }
          );
        }

        // Property 2: kill motion before it can be measured mid-transition.
        // Re-applied every iteration: the page above was freshly navigated, so
        // any style tag injected on a prior route/theme is gone.
        await page.evaluate(disableMotion);

        // Post-hydration async render settle (charts, lazy demos). Not a
        // substitute for property 2 above -- this covers JS work (data
        // fetching, lazy imports), not CSS transitions, which are now simply
        // absent rather than outrun.
        await page.waitForTimeout(200);

        await page.evaluate((t) => {
          if (t === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
        }, theme);
        // Not load-bearing (property 2 already guarantees no transition to
        // wait out); kept only as a small paint-flush margin.
        await page.waitForTimeout(50);

        const result = await page.evaluate(sweepPage, { route, theme });
        result.hydrated = true;
        perPage.push(result);

        const f = result.failingActionable.length;
        const q = result.quarantined.length;
        console.log(
          `[check-contrast] ${route.padEnd(24)} ${theme.padEnd(5)} measured=${result.measuredTotal
            .toString()
            .padStart(
              4
            )} fail=${f.toString().padStart(3)} exempt=${result.failingDisabledExempt.length
            .toString()
            .padStart(
              3
            )} indeterminate=${q.toString().padStart(3)} svgText=${result.svgTextExcluded}`
        );
      }
    }
  } finally {
    await context.close();
    await browser.close();
    stopServer();
  }

  const elapsedS = Math.round((Date.now() - startedAt) / 1000);

  // -------------------------------------------------------------------------
  // 7. Aggregate + write report.
  // -------------------------------------------------------------------------
  function classify(r) {
    // A stable "same underlying defect" key: selector shape without the
    // per-instance text, so repeats across routes collapse for a class count.
    return r.selector.replace(/\[data-pw="[^"]*"\]/g, '').replace(/#\S+/g, '');
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    port: PORT,
    routesSwept: routes.length,
    routesDiscovered: allRoutes.length,
    elapsedSeconds: elapsedS,
    byTheme: {}
  };

  for (const theme of ['light', 'dark']) {
    const pages = perPage.filter((p) => p.theme === theme);
    const failingActionable = pages.flatMap((p) => p.failingActionable);
    const failingDisabledExempt = pages.flatMap((p) => p.failingDisabledExempt);
    const quarantined = pages.flatMap((p) => p.quarantined);
    summary.byTheme[theme] = {
      measuredTotal: pages.reduce((s, p) => s + p.measuredTotal, 0),
      passCount: pages.reduce((s, p) => s + p.passCount, 0),
      disabledPassCount: pages.reduce((s, p) => s + p.disabledPassCount, 0),
      actionableFailingCount: failingActionable.length,
      exemptCount: failingDisabledExempt.length,
      indeterminateCount: quarantined.length,
      indeterminateDisabledCount: quarantined.filter((r) => r.disabled).length,
      indeterminateLiveCount: quarantined.filter((r) => !r.disabled).length,
      svgTextExcludedCount: pages.reduce((s, p) => s + p.svgTextExcluded, 0),
      unparsedColorCount: pages.reduce((s, p) => s + p.unparsedColorCount, 0),
      overflowActionable: pages.reduce((s, p) => s + p.overflowActionable, 0),
      overflowQuarantined: pages.reduce((s, p) => s + p.overflowQuarantined, 0),
      actionableFailingClasses: [...new Set(failingActionable.map((r) => classify(r)))].sort(),
      failingActionable,
      failingDisabledExempt,
      quarantined
    };
  }

  const reportPath = path.join(OUT_DIR, 'contrast-report.json');
  writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  const mdPath = path.join(OUT_DIR, 'contrast-report.md');
  writeFileSync(mdPath, renderMarkdown(summary));

  const grand = (field) => summary.byTheme.light[field] + summary.byTheme.dark[field];
  const totalActionable = grand('actionableFailingCount');

  if (totalActionable > 0) {
    console.error(`\n${totalActionable} actionable contrast failure(s):\n`);
    for (const theme of ['light', 'dark']) {
      for (const r of summary.byTheme[theme].failingActionable) {
        console.error(
          `  ${r.route} (${r.theme}) ${r.selector}\n` +
            `    ${JSON.stringify(r.text)}  ${r.fgHex} on ${r.bgHex}  ${r.ratio}:1, needs ${r.threshold}:1\n`
        );
      }
    }
    console.error(`full report: ${reportPath}`);
    console.error(`markdown:    ${mdPath}\n`);
    process.exit(1);
  }

  console.log(
    `\n0 actionable contrast failures across ${routes.length} routes x 2 themes ` +
      `(${grand('measuredTotal')} elements measured, light+dark).`
  );
  console.log(
    `  ${grand('exemptCount')} disabled-control instance(s) would fail WCAG 1.4.3 but are exempt ` +
      `(counted and listed in the report, never silently dropped).`
  );
  console.log(
    `  ${grand('indeterminateCount')} instance(s) indeterminate -- gradient/filter/backdrop-filter/` +
      `opacity/blend somewhere in the ancestor chain, quarantined rather than guessed ` +
      `(${grand('indeterminateDisabledCount')} of those are also on disabled controls, ` +
      `${grand('indeterminateLiveCount')} are live).`
  );
  console.log(
    `  ${grand('svgTextExcludedCount')} native SVG/MathML text instance(s) excluded from scoring ` +
      `(chart shapes are SVG siblings of the label, not ancestors -- an ancestor-chain model can't see them).`
  );
  if (grand('overflowActionable') || grand('overflowQuarantined')) {
    console.log(
      `  ⚠ per-page listing cap hit: ${grand('overflowActionable')} actionable + ` +
        `${grand('overflowQuarantined')} indeterminate not individually listed in the report (still counted above).`
    );
  }
  console.log(`  full report: ${reportPath}`);
  console.log(`  markdown:    ${mdPath}`);
  console.log('  NOT checked — a pass here says nothing about these:');
  for (const shape of [
    'contrast against a gradient, image, video or blended backdrop -- quarantined as indeterminate above, never guessed',
    'the true ratio behind a disabled control -- WCAG-exempt, listed above, not verified',
    'native SVG/MathML text (chart ticks, legends, in-slice labels) -- excluded from scoring, see above',
    'non-text contrast (icon-only buttons, focus rings, borders) -- this gate scores text only',
    'anything not reachable from src/routes/components/*/+page.svelte -- a demo page that does not exist is not swept',
    'colour correctness under forced-colors mode or a browser zoom level other than 100%',
    'any other WCAG success criterion (keyboard access, focus order, semantics) -- this is 1.4.3 only'
  ]) {
    console.log(`    - ${shape}`);
  }
}

function renderMarkdown(summary) {
  const lines = [];
  lines.push(`# Contrast gate — ${summary.generatedAt}`);
  lines.push('');
  lines.push(
    `Root: \`${summary.root}\` · routes swept: ${summary.routesSwept}/${summary.routesDiscovered} · elapsed: ${summary.elapsedSeconds}s`
  );
  lines.push('');
  for (const theme of ['light', 'dark']) {
    const t = summary.byTheme[theme];
    lines.push(`## ${theme}`);
    lines.push('');
    lines.push(
      `- measured: ${t.measuredTotal} (pass ${t.passCount}, disabled-pass ${t.disabledPassCount})`
    );
    lines.push(
      `- **actionable failing: ${t.actionableFailingCount}** across ${t.actionableFailingClasses.length} distinct classes`
    );
    lines.push(`- exempt (disabled, would fail, WCAG 1.4.3-exempt): ${t.exemptCount}`);
    lines.push(
      `- indeterminate (gradient/filter/backdrop-filter/opacity/blend in ancestor chain): ${t.indeterminateCount}` +
        ` (of which ${t.indeterminateDisabledCount} are on disabled controls -- exempt even if a manual check later fails them; ${t.indeterminateLiveCount} are live)`
    );
    lines.push(
      `- SVG/MathML text excluded from scoring (ancestor-chain not applicable): ${t.svgTextExcludedCount}`
    );
    if (t.unparsedColorCount) {
      lines.push(`- unparsed colour (skipped, not scored): ${t.unparsedColorCount}`);
    }
    if (t.overflowActionable || t.overflowQuarantined) {
      lines.push(
        `- ⚠ per-page listing cap hit: ${t.overflowActionable} actionable + ${t.overflowQuarantined} indeterminate not individually listed (still counted above)`
      );
    }
    lines.push('');
    if (t.actionableFailingCount > 0) {
      lines.push('| route | selector | text | ratio | needs | fg | bg |');
      lines.push('|---|---|---|---|---|---|---|');
      for (const r of t.failingActionable) {
        lines.push(
          `| ${r.route} | \`${r.selector}\` | ${JSON.stringify(r.text)} | ${r.ratio}:1 | ${r.threshold}:1 | ${r.fgHex} | ${r.bgHex} |`
        );
      }
      lines.push('');
    }
    if (t.exemptCount > 0) {
      lines.push(
        '<details><summary>disabled / exempt (would fail, excluded from actionable)</summary>\n'
      );
      lines.push('| route | selector | text | ratio | needs |');
      lines.push('|---|---|---|---|---|');
      for (const r of t.failingDisabledExempt) {
        lines.push(
          `| ${r.route} | \`${r.selector}\` | ${JSON.stringify(r.text)} | ${r.ratio}:1 | ${r.threshold}:1 |`
        );
      }
      lines.push('\n</details>\n');
    }
    if (t.indeterminateCount > 0) {
      lines.push(
        '<details><summary>indeterminate — not a single colour, verify by other means</summary>\n'
      );
      lines.push('| route | selector | text | reasons | disabled |');
      lines.push('|---|---|---|---|---|');
      for (const r of t.quarantined) {
        lines.push(
          `| ${r.route} | \`${r.selector}\` | ${JSON.stringify(r.text)} | ${r.reasons.join(', ')} | ${r.disabled ? 'yes' : ''} |`
        );
      }
      lines.push('\n</details>\n');
    }
  }
  return lines.join('\n');
}

main().catch((err) => {
  console.error('[check-contrast] FAILED:', err);
  stopServer();
  process.exit(1);
});
