#!/usr/bin/env node
/**
 * Two CSS mistakes that no build step and no type checker can see, both of
 * which shipped here and were found by a person looking at the screen rather
 * than by anything we ran.
 *
 * 1. `var(--x)` with no fallback, where `--x` is declared nowhere.
 *    A custom property that resolves to nothing makes the WHOLE declaration
 *    invalid at computed-value time, and an invalid declaration does not fall
 *    back to the stylesheet's earlier value -- it falls back to the INHERITED
 *    one. So `color: var(--input-text-color)` did not leave Input's text at its
 *    own default; it handed the colour to whatever the page happened to be
 *    inheriting, which under the dark theme was #d1d5db on Input's own white.
 *    27 instances at 1.47:1. The fix is always a literal at the end of the
 *    chain: `var(--input-text-color, #333333)`.
 *
 * 2. A colour-valued custom property whose light default would be wrong on a
 *    dark ground, with no entry in the library's dark token layer.
 *    Every colour in src/lib is already `var(--x, <light literal>)`, and the
 *    library ships a ThemeSwitcher that stamps data-theme="dark". A component
 *    that never appears in the dark layer therefore renders its light literal
 *    on a dark page: white cells, dark-on-dark labels. That was 1820 failing
 *    text instances across 107 classes before this rule existed -- not a bug
 *    per component, one bug shaped like a hundred.
 *
 * Rule 2 is a ratchet: a new component with a new light-coloured variable and
 * no dark entry fails here rather than three months later on someone's screen.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const LIB = join(ROOT, 'src/lib');
const SRC = join(ROOT, 'src');
const DARK_LAYER = join(ROOT, 'src/lib/styles/theme-dark.css');

function walk(dir, test) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, test));
    } else if (test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const isStyled = (f) => /\.(svelte|css)$/.test(f) && !/\.test\./.test(f);

/** Every `var(...)` use, with its fallback text (null when absent). */
function varUses(text) {
  const uses = [];
  for (let i = text.indexOf('var('); i !== -1; i = text.indexOf('var(', i + 1)) {
    let depth = 0;
    let end = -1;
    for (let j = i + 3; j < text.length; j += 1) {
      if (text[j] === '(') {
        depth += 1;
      } else if (text[j] === ')') {
        depth -= 1;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end === -1) {
      continue;
    }
    const inner = text.slice(i + 4, end);
    const comma = (() => {
      let d = 0;
      for (let j = 0; j < inner.length; j += 1) {
        if (inner[j] === '(') {
          d += 1;
        } else if (inner[j] === ')') {
          d -= 1;
        } else if (inner[j] === ',' && d === 0) {
          return j;
        }
      }
      return -1;
    })();
    const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();
    if (!name.startsWith('--')) {
      continue;
    }
    // Which property is this var() feeding? Scan back to the declaration start.
    const head = text.slice(Math.max(0, i - 200), i);
    const decl = /([-a-zA-Z]+)\s*:\s*[^;{}]*$/.exec(head);
    uses.push({
      name,
      property: decl === null ? '' : decl[1].toLowerCase(),
      fallback: comma === -1 ? null : inner.slice(comma + 1).trim(),
      index: i,
      line: text.slice(0, i).split('\n').length
    });
  }
  return uses;
}

const declared = new Set();
for (const file of walk(SRC, isStyled)) {
  for (const m of readFileSync(file, 'utf8').matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) {
    declared.add(m[1]);
  }
}

/**
 * Invalid-at-computed-value-time resolves to `unset`, and unset means two
 * completely different things. For a non-inherited property it is `initial`
 * -- usually harmless, and sometimes the author's actual intent ("no padding
 * unless a consumer asks for one"). For an inherited property it is
 * `inherit`, which silently hands the component's appearance to whatever the
 * page around it happens to be. Only the second is the defect that shipped
 * here, so only the second is an error.
 */
const INHERITED = new Set([
  'color',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-variant',
  'font-weight',
  'font-stretch',
  'letter-spacing',
  'line-height',
  'text-align',
  'text-indent',
  'text-transform',
  'text-shadow',
  'visibility',
  'white-space',
  'word-spacing',
  'word-break',
  'overflow-wrap',
  'word-wrap',
  'direction',
  'cursor',
  'list-style',
  'list-style-type',
  'list-style-position',
  'list-style-image',
  'quotes',
  'border-collapse',
  'border-spacing',
  'caption-side',
  'empty-cells',
  'orphans',
  'widows',
  'tab-size',
  'hyphens',
  'writing-mode',
  'text-rendering',
  'caret-color',
  'fill',
  'stroke',
  '-webkit-text-fill-color',
  'font-variant-numeric',
  'text-wrap'
]);

const errors = [];
const benign = [];

// ---- Rule 1: a var() chain that never bottoms out in a literal ------------
for (const file of walk(LIB, isStyled)) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, 'utf8');
  for (const use of varUses(text)) {
    if (use.fallback !== null) {
      continue;
    }
    if (declared.has(use.name)) {
      continue;
    }
    if (!INHERITED.has(use.property)) {
      benign.push({ file: rel, line: use.line, name: use.name, property: use.property });
      continue;
    }
    errors.push({
      file: rel,
      line: use.line,
      rule: 'unresolvable-var',
      detail: `${use.property}: var(${use.name}) has no fallback and ${use.name} is declared nowhere in src/. ${use.property} is INHERITED, so the declaration is invalid at computed-value time and the value becomes whatever the surrounding page inherits -- not this component\u2019s default.`,
      fix: `var(${use.name}, <literal>)`
    });
  }
}

// ---- Rule 2: colour defaults with no dark override ------------------------
const parseHex = (s) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s.trim());
  if (m === null) {
    return null;
  }
  const h =
    m[1].length === 3
      ? m[1]
          .split('')
          .map((c) => c + c)
          .join('')
      : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const luminance = (rgb) => {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
};

const SURFACE = /(background|surface|fill|bg)/i;
const FOREGROUND = /(color|text|border|icon|stroke|placeholder)/i;

const darkLayer = existsSync(DARK_LAYER) ? readFileSync(DARK_LAYER, 'utf8') : '';
const darkOverrides = new Set(
  Array.from(darkLayer.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)).map((m) => m[1])
);

/**
 * Colours that deliberately do NOT get a dark override, and why. A surface that
 * is already dark in both themes needs no second value -- and an exemption that
 * is merely absent is indistinguishable from one nobody noticed, which is the
 * failure mode this whole file exists to stop.
 */
const INTENTIONALLY_LIGHT_ONLY = new Map([
  [
    '--_btn-color',
    'Feeds background-color, not text: the primary variant fill, dark in both themes.'
  ],
  [
    '--snippet-prompt-color',
    'Snippet pins --snippet-background to #1e1e1e in either theme; this sits on that.'
  ],
  ['--snippet-copy-color', 'Same fixed #1e1e1e snippet surface as the prompt above.'],
  [
    '--media-player-seek-fill-color',
    'The player chrome is a fixed dark overlay on video regardless of site theme.'
  ],
  [
    '--phone-home-button-border-color',
    'Sits on the phone mockup bezel, which is black in both themes.'
  ],
  ['--text-color', 'IconStack overflow badge; its circle carries its own fixed fill.'],
  [
    '--table-cell-thumb-placeholder-background',
    'Initials swatch. Its paired --table-cell-thumb-placeholder-color is already pinned to the SAME value in both themes, so darkening only the background would break the pair.'
  ]
]);

const needsDark = new Map();
for (const file of walk(LIB, isStyled)) {
  if (file === DARK_LAYER) {
    continue;
  }
  const rel = relative(ROOT, file);
  const text = readFileSync(file, 'utf8');
  for (const use of varUses(text)) {
    if (use.fallback === null) {
      continue;
    }
    const rgb = parseHex(use.fallback);
    if (rgb === null) {
      continue;
    }
    const l = luminance(rgb);
    // A light surface is wrong on a dark page; so is dark foreground ink.
    const wrongInDark =
      (SURFACE.test(use.name) && l > 0.5) ||
      (FOREGROUND.test(use.name) && !SURFACE.test(use.name) && l < 0.25);
    if (!wrongInDark) {
      continue;
    }
    if (darkOverrides.has(use.name) || INTENTIONALLY_LIGHT_ONLY.has(use.name)) {
      continue;
    }
    // First sighting wins: the report names one call site per variable, and a
    // second one adds noise without adding information.
    if (!needsDark.has(use.name)) {
      needsDark.set(use.name, {
        file: rel,
        line: use.line,
        fallback: use.fallback,
        kind: SURFACE.test(use.name) ? 'surface' : 'foreground'
      });
    }
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} unresolvable var() chain(s):\n`);
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}`);
    console.error(`    ${e.detail}`);
    console.error(`    use ${e.fix}\n`);
  }
}

const missing = Array.from(needsDark.entries());

// Machine-readable form, so the list can be worked through rather than only read.
if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      {
        unresolvableVars: errors,
        unthemedColourDefaults: missing.map(([name, info]) => ({ name, ...info }))
      },
      null,
      1
    )
  );
  process.exit(0);
}
if (missing.length > 0) {
  console.error(
    `${missing.length} colour default(s) with no dark override in src/lib/styles/theme-dark.css:\n`
  );
  for (const [name, info] of missing.slice(0, 40)) {
    console.error(`  ${name}: ${info.fallback}  (${info.kind}, ${info.file}:${info.line})`);
  }
  if (missing.length > 40) {
    console.error(`  ... and ${missing.length - 40} more`);
  }
  console.error('');
}

if (errors.length > 0 || missing.length > 0) {
  process.exit(1);
}

console.log(`0 unresolvable var() chains and 0 unthemed colour defaults across src/lib.`);
console.log(
  `  ${declared.size} custom properties declared, ${darkOverrides.size} overridden for dark.`
);
console.log(
  `  ${benign.length} fallback-less var() uses on NON-inherited properties allowed ` +
    '(those resolve to the property\'s initial value, a legitimate "only if a consumer sets it" idiom).'
);
console.log('  NOT checked — a pass here says nothing about these:');
for (const shape of [
  'whether a dark override VALUE actually reaches 4.5:1 (that is the runtime contrast sweep)',
  'colours written as rgb()/hsl()/named rather than hex literals',
  'a light default that is wrong in LIGHT mode (white on white) — also runtime-only',
  'contrast against a gradient, image or blended backdrop'
]) {
  console.log(`    - ${shape}`);
}
