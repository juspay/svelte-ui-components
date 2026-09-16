#!/usr/bin/env node
/**
 * The parity programme's memory.
 *
 * Seven task packs raised 46 items. Across a week of sessions they were tracked
 * in prose -- summaries, artifacts, a peer's reports -- and prose forgets: two
 * whole packs (SD-*, CW-*) dropped out of the running total entirely, and
 * several items reported as done were done only in the half that was easy to
 * see. Reading a status back out of a document proves nothing about the tree.
 *
 * So status is not stored here. It is DERIVED on every run by a probe that
 * reads the source, and each probe returns the evidence it used, so a status
 * can always be argued with. Items whose acceptance is a judgement call are
 * marked `manual` and say so rather than inventing a number.
 *
 *   node scripts/parity-ledger.mjs            # full table
 *   node scripts/parity-ledger.mjs --open     # only what is still actionable
 *   node scripts/parity-ledger.mjs --json     # machine-readable
 *   node scripts/parity-ledger.mjs --summary  # the tally line alone
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, basename } from 'node:path';
import { WC2_UNREACHABLE } from './wc2-unreachable.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const p = (...s) => join(ROOT, ...s);

const walk = (dir, test, out = []) => {
  if (!existsSync(dir)) {
    return out;
  }
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, test, out);
    } else if (test(entry)) {
      out.push(full);
    }
  }
  return out;
};
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');

const wrappers = walk(p('src/wc/components'), (f) => f.endsWith('.wc.svelte'));
const libFiles = walk(p('src/lib'), (f) => /\.(svelte|ts)$/.test(f) && !/\.test\./.test(f));
const libSvelte = libFiles.filter((f) => f.endsWith('.svelte'));
const docs = walk(p('docs'), (f) => f.endsWith('.md'));
const wcIndex = read(p('src/wc/index.ts'));

const CLOSED = 'closed';
const PARTIAL = 'partial';
const OPEN = 'open';
const NA = 'n/a';
/**
 * Complete to the limit of what any agent can do; the rest needs a person.
 *
 * This is not a softer PARTIAL and must not be used as one. It means the
 * remaining work requires a decision only the owner can make, or a tool no
 * agent can drive -- a real screen reader, a policy about public API. Without
 * it the Stop hook lists those items forever under "pick up the next one",
 * which is advice no agent can act on, and repeated often enough it teaches
 * everyone to skim the list. Each BLOCKED item must name the specific decision
 * in its evidence, so it reads as a question to answer rather than a task to
 * start.
 */
const BLOCKED = 'blocked';

const countWhere = (files, re) => files.filter((f) => re.test(read(f))).length;
/**
 * A zero denominator is not evidence of anything -- there was no population to
 * grade, not a population that was satisfied. `n === total` is vacuously true
 * at 0 === 0, so without this a probe whose detector stopped matching anything
 * (a broken regex, a renamed API, a population that emptied out) reads CLOSED
 * exactly like one that is genuinely done, and the headline cannot tell them
 * apart. Proven: disabling ANIMATES's only match left "44 closed, 0
 * actionable" unchanged with a dead detector behind it.
 */
const grade = (n, total) => (total === 0 ? OPEN : n === total ? CLOSED : n > 0 ? PARTIAL : OPEN);

/** A file name, for evidence lines that would be unreadable as full paths. */
const base = (file) => basename(file);

/**
 * Any motion at all -- used where the question is "is timing tokenised".
 *
 * The lookahead sits INSIDE the optional whitespace, not after it. Written as
 * `transition:\s*(?!none)`, `\s*` backtracks to zero width and the lookahead
 * then tests the space rather than the word, so `transition: none` matched and
 * Draggable -- whose only transition declaration IS `none` -- was reported as
 * animating with a hardcoded duration.
 */
const ANIMATES = /@keyframes|transition:(?!\s*none\b)|animation:(?!\s*none\b)/;

/** CSS properties whose transition MOVES or RESIZES rather than recolouring. */
const MOVING_PROPERTY =
  /(transform|width|height|left|right|top|bottom|margin|translate|scale|rotate|inset)/;

/**
 * What makes a component's motion the kind `prefers-reduced-motion` is for, or
 * `null` if it only recolours.
 *
 * Bounded to a single declaration on purpose. A first attempt used
 * `transition:[^;]*` with the property list after it, and `[^;]` matches
 * newlines -- so it ran past the declaration and matched a `top` or `left`
 * elsewhere in the file, reporting Banner and Gallery as moving when their only
 * motion is a fade. Over-reporting here invents work, which the README costs the
 * same as losing it.
 */
// Motion a CSS `@media (prefers-reduced-motion: reduce)` block CAN switch off.
const CSS_REACHABLE_MOTION = [
  [/@keyframes/, () => '@keyframes'],
  [
    /transition:\s[^;{}]{0,160};/g,
    (text) => {
      for (const m of text.matchAll(/transition:\s[^;{}]{0,160};/g)) {
        if (MOVING_PROPERTY.test(m[0])) {
          return m[0].replace(/\s+/g, ' ').slice(0, 48);
        }
      }
      return null;
    }
  ],
  // `scroll-behavior: smooth` in a stylesheet. Requiring the literal `smooth` is
  // what keeps a guard's own `scroll-behavior: auto` from counting as motion.
  [/scroll-behavior:[^;}]*\bsmooth\b/, (text) => /scroll-behavior:[^;}]*\bsmooth\b/.exec(text)[0]]
];

// Motion NO stylesheet can reach, so only a script-level read of the preference
// switches it off. Each of these was invisible to this probe before, and three of
// the four components carrying them had no guard at all.
const SCRIPT_ONLY_MOTION = [
  // Svelte transition directives. `transition:` is the two-way form; `in:`/`out:`
  // are the one-way forms this probe used to miss entirely -- Toast and
  // ModalAnimation animate exclusively through them. `fade` stays excluded with
  // the other opacity-only cases.
  [/\b(?:transition|in|out):(slide|fly|scale|draw)\b/, (m) => `svelte ${m[1]}`],
  // A ScrollToOptions / scrollIntoView value. Not a style at all -- no rule, no
  // media query and no `!important` reaches it.
  //
  // Matched by SHAPE -- any `behavior` value that is not a hardcoded 'auto' -- rather
  // than by the literal 'smooth', because it must survive its own repair. Requiring
  // 'smooth' adjacently meant rewriting a site as
  // `behavior: prefersReducedMotion() ? 'auto' : 'smooth'` made the motion invisible,
  // so the component left the population and the probe reported 25 of 25: fixing a
  // component stopped it being counted. A population that shrinks as it is repaired is
  // the same structural retirement as a bare count against a constant, reached from the
  // other direction. It still scrolls smoothly whenever the preference is off, so it
  // stays in and is counted as guarded.
  //
  // The lookahead absorbs its own whitespace. `\s*(?!…)` would let the engine backtrack
  // to zero width and test the lookahead against a space, which always passes -- the
  // same trap that made `transition:\s*(?!none)` match `transition: none` here before.
  [
    // The lookbehind matters: `behavior:` is a substring of the CSS property
    // `scroll-behavior:`, so without it this script-only pattern claimed every
    // stylesheet rule -- including a guard's own `scroll-behavior: auto` -- and
    // reported ChatMessageList as unguarded script motion when it has none.
    /(?<![-\w])behavior:(?![ \t]*['"`](?:auto|instant)['"`])[ \t]*[A-Za-z'"`(]/,
    () => 'a scroll behavior value'
  ],
  // A canvas render loop. Pixels a stylesheet has no selector for, so like the three
  // above it can only be reached from script. Both halves are required: a lone
  // requestAnimationFrame is used for one-shot layout measurement in five components
  // here and none of them animate. Matches nothing in this tree today and is here for
  // the shape rather than a current count -- release's VoiceOrb is exactly this, and
  // omitting the form would have let it enter the library outside the population.
  //
  // Note VoiceOrb's guard is deliberately PARTIAL: it freezes idle rotation and the
  // sine fallback, and leaves analyser-driven motion running because that reports live
  // microphone state (docs/VoiceOrb.md). This probe reads presence and says so, which
  // is the right answer here -- a blanket "guard everything that moves" pass would
  // regress it.
  [
    /requestAnimationFrame/,
    (text) => (/getContext\(\s*['"`]2d|<canvas/.test(text) ? 'a canvas render loop' : null)
  ],
  // An INLINE style write, which outranks every rule in the component's own
  // stylesheet. A CSS guard here would read correctly in review and lose at runtime,
  // which is the sharpest case for separating the two guard forms. A write of a
  // hardcoded 'auto' or 'instant' is excluded: that is a component turning motion OFF,
  // not on. 'instant' cost a false positive before it was excluded -- ChatMessageList
  // pins its scroll with `behavior: 'instant'` precisely so the correction does NOT
  // animate, and the probe reported it as unguarded motion.
  [
    /\.style\.scrollBehavior[ \t]*=(?![ \t]*['"`](?:auto|instant)['"`])/,
    (m) => m[0].replace(/\s+/g, ' ').slice(0, 48)
  ]
];

/**
 * What moves in this source, and WHICH GUARD FORM can switch it off.
 *
 * Returning the required form is the point. `prefers-reduced-motion` in a file used
 * to be treated as one thing, so a `@media` block counted as a guard for motion no
 * media query can reach -- Scroller would have reported CLOSED on a guard that
 * cannot work. Where a file carries both kinds, the stricter requirement wins.
 */
/**
 * Comments, removed before any motion is matched.
 *
 * Components in this library document the very directives they do NOT use.
 * OverlayAnimation's markup comment names Toast's `in:fly` while its own motion
 * is `in:fade`/`out:fade` -- opacity-only, which this probe deliberately
 * excludes. Matching inside that comment put OverlayAnimation into the moving
 * population and reported it unguarded, which is precisely the over-reporting
 * the README costs the same as losing a finding: it invents work.
 *
 * SD-1 already records this lesson from the other direction -- the first version
 * of that probe counted `document.activeElement` textually and reported OPEN
 * while the real gate reported zero, because the gate strips comments and the
 * components carry comments naming the API they avoid. A source-reading probe
 * has to strip them too.
 *
 * `//` is only treated as a comment when it does not follow a colon, so a
 * `https://` inside a string survives.
 */
const withoutComments = (text) =>
  text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const movementIn = (rawText) => {
  const text = withoutComments(rawText);
  // `?? null` rather than comparing against the literal: this repo's lint bans it,
  // and `find` returning nothing is the one place it would otherwise appear.
  const firstMatch = (patterns, apply) =>
    patterns.map(apply).find((found) => found !== null) ?? null;

  const script = firstMatch(SCRIPT_ONLY_MOTION, ([re, describe]) => {
    const m = re.exec(text);
    return m === null ? null : describe(m);
  });
  if (script !== null) {
    return { what: script, needs: 'script' };
  }
  const css = firstMatch(CSS_REACHABLE_MOTION, ([re, describe]) => {
    // A /g regex carries lastIndex between calls, so `test` on the shared literal
    // would skip matches on later files. Probe with a fresh, non-global copy.
    const probe = re.global ? new RegExp(re.source) : re;
    return probe.test(text) ? describe(text) : null;
  });
  return css === null ? null : { what: css, needs: 'css' };
};

// A `@media (prefers-reduced-motion: reduce)` block. Switches off CSS motion only.
const CSS_GUARD = /@media[^{]*prefers-reduced-motion/;
// Reading the preference in script, which is the only thing that reaches a Svelte
// transition directive, a ScrollToOptions value, an inline style write or a canvas.
//
// The CALL, not the identifier. Matching the bare name meant
// `import { prefersReducedMotion } from '../utils'` satisfied it, so deleting the
// only call site left this green -- both negative controls passed with the guard
// removed. Same defect FI-1 had (`formAssociated(` rather than the word), caught the
// same way: by mutating the guard and watching the probe fail to notice.
//
// `reducedMotion.current` (src/lib/reduced-motion.svelte.ts) is the THIRD form, and
// it is the strongest of them. This probe's own evidence line warns that a script
// guard may not stay CURRENT -- a component reading the preference once into a
// variable never revisits it. Sheet is the component that solved exactly that, by
// reading reactive `$state` instead of calling the plain un-reactive
// `prefersReducedMotion()`, so a preference toggled mid-session reaches an
// already-mounted panel. Omitting it reported Sheet as the single unguarded mover
// in the library: the probe penalising the one component that fixed the weakness
// the probe itself documents. A guard test that only knows the weaker idiom will
// always drive callers back toward it.
const SCRIPT_GUARD =
  /prefersReducedMotion\s*\(|reducedMotion\.current|matchMedia\(\s*['"`]\(prefers-reduced-motion/;

/**
 * Does this file carry the guard FORM its own motion actually needs?
 *
 * Comments are stripped first, and this direction matters more than the
 * population's: a comment that merely NAMES `prefersReducedMotion()` -- which
 * several components carry while explaining why they do not need it -- would
 * otherwise count as the guard itself and report a moving, unguarded component
 * as CLOSED. A false finding wastes an hour; a false clearance ships the defect.
 */
const guardFor = (rawText, needs) => {
  const text = withoutComments(rawText);
  return needs === 'script'
    ? SCRIPT_GUARD.test(text)
    : CSS_GUARD.test(text) || SCRIPT_GUARD.test(text);
};

/**
 * Ask the real gate rather than re-implementing its rule here. The first
 * version of this file counted `document.activeElement` textually and reported
 * SD-1 open while check-shadow-safety.js reported zero, because the gate strips
 * comments and exempts the two helpers that must read the raw API -- and the
 * components carry comments naming the very API they avoid. Two checks for one
 * rule will always drift; the gate is the one that can fail CI, so it wins.
 */
/**
 * Run a gate and report what it said -- including on success.
 *
 * This used to read stdout only in the `catch` branch. Every gate here prints a
 * "NOT checked" list on a PASSING run, because the most expensive mistake this
 * repo has made is reading a green gate as a broader guarantee than it gives --
 * and three real defects have since been found in exactly the space a passing
 * gate had disclaimed. So the gates documented their limits to a consumer built
 * to care about failure and throw success away. The instrument was fine; this
 * function discarded the most valuable thing it produced.
 */
const gate = (script) => {
  const limits = (out) => {
    const lines = out.split('\n');
    const start = lines.findIndex((l) => /NOT checked/.test(l));
    if (start === -1) {
      return '';
    }
    const shapes = lines
      .slice(start + 1)
      .filter((l) => /^\s+-\s/.test(l))
      .map((l) => l.replace(/^\s+-\s*/, '').trim());
    return shapes.length === 0 ? '' : ` — does NOT check: ${shapes.join('; ')}`;
  };
  try {
    const out = execFileSync('node', [p('scripts', script)], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return { clean: true, note: `gate exits clean${limits(out)}` };
  } catch (error) {
    const raw = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    const out = raw.trim().split('\n')[0];
    return { clean: false, note: out || 'gate exits non-zero' };
  }
};

/**
 * Each probe returns { status, evidence }. `evidence` must name what was
 * counted rather than restate the title -- a status with nothing countable
 * behind it is exactly the failure this file exists to remove.
 */
const ITEMS = [
  {
    id: 'SD-1',
    pack: 'Shadow DOM',
    title: 'Shadow-aware focus reads',
    probe: () => {
      const g = gate('check-shadow-safety.js');
      return {
        status: g.clean ? CLOSED : OPEN,
        evidence: `check-shadow-safety.js: ${g.note}`
      };
    }
  },
  {
    id: 'SD-2',
    pack: 'Shadow DOM',
    title: 'Portalling to document.body leaves the stylesheet behind',
    probe: () => {
      // Measure shadow-AWARENESS, not the absence of one string. The first
      // version counted files containing `document.body.appendChild` and, once
      // they were fixed, reported "0 files append to document.body; 0 branch on
      // being inside a shadow root" -- a second number computed over an empty
      // set, which reads like a miss and would also have missed a NEW portal
      // written as `target.append(node)` against a hardcoded body.
      //
      // So enumerate the sites that actually relocate a node, and ask each
      // whether it resolves its destination from that node's own root.
      const sites = libFiles.filter((f) => {
        const text = read(f);
        return /portal/i.test(text) && /\.append(Child)?\(/.test(text);
      });
      const aware = sites.filter((f) => /getRootNode\(\)/.test(read(f)));
      const hardcoded = sites
        .filter((f) => !/getRootNode\(\)/.test(read(f)))
        .map((f) => basename(f));
      return {
        status: grade(aware.length, sites.length),
        evidence: `${aware.length} of ${sites.length} portal sites resolve their destination from the node's own root${hardcoded.length > 0 ? `; hardcoded: ${hardcoded.join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'SD-3',
    pack: 'Shadow DOM',
    title: 'IDREF and label association do not cross the boundary',
    probe: () => {
      const stated = (f) => /shadow|limitation|cannot|does not cross/i.test(read(p('docs', f)));
      const label = stated('Label.md');
      const toggle = stated('Toggle.md');
      return {
        status: grade([label, toggle].filter(Boolean).length, 2),
        evidence: `docs/Label.md states the limit: ${label}; docs/Toggle.md: ${toggle}`
      };
    }
  },
  {
    id: 'SD-4',
    pack: 'Shadow DOM',
    title: 'No wrapper sets a host display',
    probe: () => {
      const n = countWhere(wrappers, /:host/);
      return {
        status: grade(n, wrappers.length),
        evidence: `${n} of ${wrappers.length} wrappers declare a :host rule`
      };
    }
  },
  {
    id: 'SD-5',
    pack: 'Shadow DOM',
    title: 'Two sui-radio elements sharing a name are not one group',
    probe: () => {
      const ok = /shadow|custom element|sui-radio/i.test(read(p('src/lib/Radio/properties.ts')));
      return {
        status: ok ? CLOSED : OPEN,
        // Marked so the distinction survives: this row reads the same as a fixed
        // defect and is not one. Native radio grouping is name-scoped per DOCUMENT
        // and two shadow roots are two scopes, so the platform cannot group them;
        // the resolution is that the limitation is stated where a consumer will
        // meet it. A later reader must be able to tell "we changed the code" from
        // "we wrote down why we cannot".
        evidence: `RESOLVED BY DOCUMENTING, not by a code change: Radio/properties.ts states the cross-shadow-root grouping limitation: ${ok}`
      };
    }
  },
  {
    id: 'SD-6',
    pack: 'Shadow DOM',
    title: 'Make the shadow rules enforceable',
    probe: () => {
      const a = existsSync(p('scripts/check-shadow-safety.js'));
      const b = existsSync(p('scripts/check-docs-contract.js'));
      return {
        status: grade([a, b].filter(Boolean).length, 2),
        evidence: `activeElement/contains gate: ${a}; docs-tag gate: ${b}`
      };
    }
  },
  {
    id: 'SD-7',
    pack: 'Shadow DOM',
    title: 'Sequencing guidance for the chart work',
    probe: () => ({
      status: NA,
      evidence: 'guidance, not work: fix SD-1 and SD-2 before writing chart wrappers'
    })
  },

  {
    id: 'WC-1',
    pack: 'WC contract',
    title: 'Component defaults died through the custom element',
    probe: () => {
      // Counting wrappers that have ANY slot answered a different question than
      // the item asks. The defect is a wrapper REPLACING a component's default
      // with an empty slot, and `check-wc-contract.js` already decides that --
      // per prop, with a reasoned exception list. Deferring to it means one rule
      // with one owner, rather than a second detector drifting away from the
      // first. The old form closed on `n >= 35` of 97, so sixty wrappers could
      // have lost every default and it would still have read CLOSED.
      const g = gate('check-wc-contract.js');
      const n = countWhere(wrappers, /<slot/);
      return {
        status: g.clean ? CLOSED : PARTIAL,
        evidence: `component defaults are check-wc-contract.js's rule: ${g.note}. ${n} of ${wrappers.length} wrappers render at least one slot`
      };
    }
  },
  {
    id: 'WC-2',
    pack: 'WC contract',
    title: 'Argument-less content props have no host path',
    probe: () => {
      // Per PROP, not per wrapper. Asking only "does this wrapper have a slot"
      // let a wrapper exposing 1 of 6 props count as exposing every one, and
      // the evidence line then claimed "93 of 97 expose every slottable content
      // prop" while 12 props had no host path at all. wc2-slots' own numbers
      // are what exposed the gap: their 12-unreachable did not reconcile with
      // this probe's 6.
      const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      const unreachable = new Map(WC2_UNREACHABLE.map((e) => [`${e.component}.${e.prop}`, e.why]));

      // `### Slots` tables (docs/<Name>.md) are the fallback source of truth for
      // whether a prop has a host path, read only when the kebab convention
      // below finds nothing. Two real wrappers need it: Modal.footerSnippet is
      // bridged through a slot literally named `footer` (matching the
      // underlying Modal's own `footer` prop, not a kebab of `footerSnippet`),
      // and Modal.content / Sheet.content are bridged through the bare DEFAULT
      // slot, which the kebab check only ever looks for when the prop is named
      // `children`. Both were real, working, documented bridges that this probe
      // reported as gaps for years because its only two detectors did not cover
      // either shape -- see the WC-2 closure notes for how that was found.
      const DEFAULT_SLOT = Symbol('default-slot');
      const slotMapFromDocs = (name) => {
        const page = read(p('docs', `${name}.md`));
        const start = page.indexOf('### Slots');
        if (start === -1) {
          return new Map();
        }
        const rest = page.slice(start + '### Slots'.length);
        const end = rest.search(/\n#{2,3}\s/);
        const section = end === -1 ? rest : rest.slice(0, end);
        const map = new Map();
        for (const line of section.split('\n')) {
          const row = /^\|\s*(.+?)\s*\|\s*`(\w+)`\s*\|/.exec(line);
          if (row === null) {
            continue;
          }
          const [, slotCell, prop] = row;
          if (slotCell === '_(default)_') {
            map.set(prop, DEFAULT_SLOT);
            continue;
          }
          const named = /^`([a-z0-9-]+)`$/.exec(slotCell);
          if (named !== null) {
            map.set(prop, named[1]);
          }
        }
        return map;
      };
      // Does the wrapper's own `{#snippet <prop>}…{/snippet}` block (the one
      // bridging this exact prop) contain the slot shape the docs claim? Named
      // slots are still matched anywhere in the file, matching the check below --
      // a bare default slot has to be searched for inside the right snippet,
      // since an unnamed `<slot>` elsewhere in the file (e.g. `children`'s) would
      // otherwise false-match every other prop too.
      const bridgesVia = (text, prop, slotName) => {
        if (slotName !== DEFAULT_SLOT) {
          return new RegExp(`<slot[^>]*name="${slotName}"`).test(text);
        }
        const body = new RegExp(`\\{#snippet ${prop}\\([^)]*\\)\\}([\\s\\S]*?)\\{/snippet\\}`).exec(
          text
        );
        return body !== null && /<slot(?![^>]*name=)[^>]*>/.test(body[1]);
      };

      const gaps = [];
      const unreachableFound = [];
      let exposed = 0;
      for (const file of wrappers) {
        const text = read(file);
        const name = basename(file, '.wc.svelte');
        const props = read(p('src/lib', name, 'properties.ts'));
        const docSlots = slotMapFromDocs(name);
        // Dedupe by prop name within the file: Stepper/properties.ts declares
        // `badge?: Snippet` twice -- once on `Step` (an array entry) and once on
        // `OptionalStepProperties` (the internal Step.svelte's own props) -- and
        // neither is a prop of the wrapped `Stepper` component at all (its own
        // `StepperProperties` has no `badge`). Counting both inflated one
        // unreachable prop into two gaps of the same name; the population this
        // probe must count is "props on the component this wrapper wraps",
        // once each.
        const seen = new Set();
        for (const m of props.matchAll(/(\w+)\??\s*:\s*Snippet(?!<)/g)) {
          const prop = m[1];
          if (seen.has(prop)) {
            continue;
          }
          seen.add(prop);
          const key = `${name}.${prop}`;
          // A named slot spelled as the prop's kebab-case is the convention here;
          // `children` is the exception, reached through the default slot.
          const named = new RegExp(`<slot[^>]*name="${kebab(prop)}"`).test(text);
          const viaDefault = prop === 'children' && /<slot\s*>|<slot\s*\/>/.test(text);
          // `.has()` rather than comparing `.get()` to `undefined`: this repo's lint
          // config bans the literal `undefined` outright.
          const viaDocs = docSlots.has(prop) && bridgesVia(text, prop, docSlots.get(prop));
          if (named || viaDefault || viaDocs) {
            exposed += 1;
            continue;
          }
          if (unreachable.has(key)) {
            unreachableFound.push(key);
            continue;
          }
          gaps.push(key);
        }
      }
      const reachableTotal = exposed + gaps.length;
      const evidence =
        `${exposed} of ${reachableTotal} reachable argument-less snippet props have a host path` +
        (gaps.length > 0 ? ` (still missing: ${gaps.join(', ')})` : '') +
        `; ${unreachableFound.length} of ${unreachable.size} recorded as structurally unreachable, each with a stated reason (scripts/wc2-unreachable.mjs)`;
      return {
        status: gaps.length === 0 ? CLOSED : PARTIAL,
        evidence
      };
    }
  },
  {
    id: 'WC-3',
    pack: 'WC contract',
    title: 'Parameterized snippets cannot be slots, and the docs do not say so',
    probe: () => {
      // A `Snippet<[...]>` with a non-empty argument list is the whole
      // population: those are exactly the props no named slot can express.
      // Counting marked doc pages instead would pass as soon as enough
      // unrelated pages happened to say "Svelte-only".
      const owed = new Set();
      for (const dir of readdirSync(p('src/lib'), { withFileTypes: true })) {
        if (!dir.isDirectory()) {
          continue;
        }
        const props = read(p('src/lib', dir.name, 'properties.ts'));
        for (const m of props.matchAll(/\w+\??\s*:\s*Snippet<\[([^\]]*)\]>/g)) {
          if (m[1].trim() !== '') {
            owed.add(dir.name);
          }
        }
      }
      const missing = [...owed].filter(
        (c) => !/Svelte-only|Svelte only/i.test(read(p('docs', `${c}.md`)))
      );
      return {
        status: grade(owed.size - missing.length, owed.size),
        evidence: `${owed.size - missing.length} of ${owed.size} components with parameterized snippets are marked Svelte-only; missing: ${missing.join(', ') || 'none'}`
      };
    }
  },
  {
    id: 'WC-4',
    pack: 'WC contract',
    title: 'Wrappers dispatch no DOM events, and docs said otherwise',
    probe: () => {
      // The rule was DECIDED: a callback prop dispatches a bare-named CustomEvent
      // if and only if its name is absent from the host-handler set, with
      // LottiePlayer's shipped `error` grandfathered as one reasoned exception.
      // So this stops asking for a decision and starts measuring the migration.
      const wired = wrappers.filter((f) => /dispatchEvents\(/.test(read(f)));
      const owing = wrappers.filter((f) => {
        const block = /props:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\}\}/.exec(read(f));
        return block !== null && /^\s*on[a-z]+:/m.test(block[1]);
      });
      const g = gate('check-docs-contract.js');
      return {
        status: grade(wired.length, owing.length),
        evidence: `${wired.length} of ${owing.length} wrappers with callback props dispatch under the agreed rule; the docs half is gated (${g.note.split('—')[0].trim()})`
      };
    }
  },
  {
    id: 'WC-5',
    pack: 'WC contract',
    title: 'Chart components have no custom element',
    probe: () => {
      const live = new Set(
        wrappers
          .filter((f) => wcIndex.includes(`components/${basename(f, '.wc.svelte')}.wc.svelte`))
          .map((f) => (/tag:\s*'([a-z0-9-]+)'/.exec(read(f)) ?? ['', ''])[1])
      );
      const used = new Set();
      for (const f of docs) {
        for (const m of read(f).matchAll(/<(sui-[a-z0-9-]+)/g)) {
          used.add(m[1]);
        }
      }
      const bad = [...used].filter(
        (t) =>
          !live.has(t) && !docs.some((f) => new RegExp(`there is no \`?<?${t}`, 'i').test(read(f)))
      );
      return {
        status: bad.length === 0 ? CLOSED : OPEN,
        evidence: `${bad.length} docs tags resolve to no registered element${bad.length ? ': ' + bad.join(', ') : ''}`
      };
    }
  },
  {
    id: 'WC-6',
    pack: 'WC contract',
    title: 'Extend the gate so none of it can regress',
    probe: () => {
      const scripts = walk(p('scripts'), (f) => /\.(js|ts|mjs)$/.test(f));
      const has = (re) => scripts.some((f) => re.test(read(f)));
      const checks = [
        has(/component-default-replaced-by-empty-slot/),
        has(/assignedSlot|no named slot and no default slot/i),
        has(/unregistered-element/),
        has(/undispatched-event/)
      ];
      return {
        status: grade(checks.filter(Boolean).length, 4),
        evidence: `${checks.filter(Boolean).length} of 4 gate checks present [snippet-default, slot-required, tag-resolves, event-dispatched] = ${checks.join(', ')}`
      };
    }
  },

  {
    id: 'FI-1',
    pack: 'Forms',
    title: 'A custom element could not take part in a form',
    probe: () => {
      // `n >= 5` had no denominator, so it could never fall: adding form controls
      // that CANNOT take part in a form only leaves n where it is. The population
      // is the controls themselves -- a component owning both a `name` and a
      // `value` prop is one -- and every one of their wrappers must be
      // form-associated or the element silently submits nothing.
      // The population is declared by the wrappers themselves: an element that
      // declares BOTH `name` and `value` is announcing it intends to be
      // submitted, and without `formAssociated` that name goes nowhere.
      //
      // Two looser signals were tried and rejected for INVENTING work, which
      // costs as much as losing it. Reading `name` + `value` from the component's
      // properties.ts caught four charts, whose series have a name and whose
      // points have a value. Matching `name` alone caught Avatar, where the name
      // is the person's. Neither is a form control.
      const controls = wrappers.filter((f) => {
        const block = /props:\s*\{([\s\S]*?)\n\s*\}\s*\n\s*\}\}/.exec(read(f));
        return block !== null && /^\s*name:/m.test(block[1]) && /^\s*value:/m.test(block[1]);
      });
      // The CALL, not the word anywhere in the file -- matching the word alone
      // meant removing only the import left the call site behind and the probe
      // reported no change, a control that failed to discriminate. But not the
      // `extend:` spelling either: Radio composes its own grouping mixin around
      // it, `radioGrouping(formAssociated({...})(Base))`, and pinning the
      // spelling reported the one control with the MOST form work as having none.
      const associated = controls.filter((c) => /formAssociated\(/.test(read(c)));
      const missing = controls.filter((c) => !associated.includes(c));
      return {
        status: grade(associated.length, controls.length),
        evidence: `${associated.length} of ${controls.length} elements declaring name+value are form-associated${missing.length > 0 ? `; missing: ${missing.map(base).join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'FI-2',
    pack: 'Forms',
    title: 'Only one component wired validity to a message',
    probe: () => {
      const CONTROLS = [
        'Input',
        'Checkbox',
        'Radio',
        'Toggle',
        'Slider',
        'Select',
        'FileInput',
        'ChipInput',
        'SplitInput',
        'Combobox',
        'ColorPicker',
        'Choicebox',
        'DateRangePicker',
        'InputButton'
      ];
      // The disjunction used to be /describeField|aria-describedby/, and a
      // hand-rolled aria-describedby satisfies that identically to actually
      // adopting the shared helper -- so a control that wires up its own
      // attribute read CLOSED next to one that imports describeField from
      // src/lib/_field/description.ts, though only the latter gets that
      // module's two rules (reference only ids that are actually rendered;
      // aria-invalid means invalid NOW, not "can be invalid") enforced once
      // rather than re-derived, and possibly re-broken, at every call site.
      // Require the IMPORT, the same discriminator FI-1 and MT-3 had to learn:
      // match the thing that makes it true, not a word that merely co-occurs.
      const lacks = CONTROLS.filter((c) => {
        const dir = p('src/lib', c);
        return (
          existsSync(dir) &&
          !walk(dir, (f) => /\.(svelte|ts)$/.test(f)).some((f) =>
            /from\s+['"][^'"]*_field\/description['"]/.test(read(f))
          )
        );
      });
      return {
        status: lacks.length === 0 ? CLOSED : PARTIAL,
        evidence: `${CONTROLS.length - lacks.length} of ${CONTROLS.length} controls adopt the shared describeField helper (src/lib/_field/description.ts) rather than hand-rolling aria-describedby; bespoke: ${lacks.join(', ')}`
      };
    }
  },
  {
    id: 'FI-3',
    pack: 'Forms',
    title: 'Two names for "required"',
    probe: () => {
      const t = read(p('src/lib/Input/properties.ts'));
      const ok = /required\?:/.test(t) && /deprecated/i.test(t);
      return {
        status: ok ? CLOSED : OPEN,
        evidence: `required declared, mandatory deprecated: ${ok}`
      };
    }
  },
  {
    id: 'FI-4',
    pack: 'Forms',
    title: 'Choicebox looks like a control and cannot be one',
    probe: () => {
      const t = read(p('src/lib/Choicebox/Choicebox.svelte'));
      const native = /<input/.test(t);
      return {
        status: native ? CLOSED : OPEN,
        evidence: `native control inside Choicebox: ${native}; name prop: ${/\bname\b\s*[=:]/.test(t)}`
      };
    }
  },
  {
    id: 'FI-5',
    pack: 'Forms',
    title: 'The tel default validates one country',
    probe: () => {
      // Ask the file that actually defines validateInput, not any file in
      // src/lib mentioning both "validate" and "locale". The loose version
      // also matched Table/properties.ts, whose line 344 says "locale-aware
      // sorting" -- so FI-5 could have read CLOSED with no implementation at
      // all. The real signal is the `tel` branch taking a caller-supplied
      // preset rather than hardcoding one market's rule.
      const owner = walk(p('src/lib'), (f) => /\.ts$/.test(f) && !/\.test\./.test(f)).find((f) =>
        /export (function|const) validateInput/.test(read(f))
      );
      const text = typeof owner === 'string' ? read(owner) : '';
      const parameterised = /case 'tel'/.test(text) && /telPreset|telPattern/.test(text);
      const where = typeof owner === 'string' ? owner.replace(/^.*\/src\//, 'src/') : 'NOWHERE';
      return {
        status: parameterised ? CLOSED : OPEN,
        evidence: `validateInput is defined in ${where}; its tel branch takes a caller-supplied preset: ${parameterised}`
      };
    }
  },
  {
    id: 'FI-6',
    pack: 'Forms',
    title: 'Generalise the label for/id fix',
    probe: () => {
      const t = read(p('src/lib/InputButton/InputButton.svelte'));
      const ok = /for=\{/.test(t) && /id=\{/.test(t);
      return {
        status: ok ? CLOSED : PARTIAL,
        evidence: `InputButton emits both for and id: ${ok}`
      };
    }
  },

  {
    id: 'MT-1',
    pack: 'Motion',
    title: 'Motion outside the token contract',
    probe: () => {
      // Counting files that read a motion token, against nothing, could only rise.
      // The question is whether the files that ANIMATE take their timing from the
      // token contract rather than hardcoding it, so the denominator is those.
      const animating = libSvelte.filter((f) => ANIMATES.test(read(f)));
      // A CSS token OR a duration prop. Svelte's own transition directives take a
      // JS number, which no custom property can supply, so Banner's
      // `duration: transitionDuration ?? 300` IS inside the contract -- the
      // consumer controls it, just not through CSS. Demanding a token there would
      // be asking for something the platform cannot give.
      const tokened = animating.filter(
        (f) =>
          /--[a-z-]*(duration|transition|animation)/.test(read(f)) ||
          /\b\w*[dD]uration\s*\??\s*[:?]/.test(read(f))
      );
      const missing = animating.filter((f) => !tokened.includes(f));
      return {
        status: grade(tokened.length, animating.length),
        evidence: `${tokened.length} of ${animating.length} animating components read a motion token${missing.length > 0 ? `; hardcoded: ${missing.map(base).join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'MT-2',
    pack: 'Motion',
    title: 'One concept, three token shapes',
    probe: () => ({
      status: CLOSED,
      evidence: 'landed before MT-3 so the guards became one block against the token chain',
      manual: true
    })
  },
  {
    id: 'MT-3',
    pack: 'Motion',
    title: 'Animating components ignored the OS motion preference',
    probe: () => {
      // `n >= 12` was the starkest of these: a bare count of components that HAVE
      // a guard, against a constant. Adding fifty unguarded animating components
      // only raises n, so once it passed it could never fail again -- not a guard
      // that happens to be green, a guard that has been structurally retired. It
      // read CLOSED while Button, the most-used component here, ran an eight
      // second unguarded fill.
      //
      // The population is what reduced motion is actually about: MOVEMENT.
      // Keyframes, and transitions that translate, scale, rotate or resize.
      // Colour and opacity fades are deliberately out -- demanding guards on
      // those would invent work, which costs exactly as much as losing it.
      // Each entry carries the guard form its own motion needs. The old test was
      // /prefers-reduced-motion|prefersReducedMotion/, which could not tell a CSS
      // block from a script read and would have scored Scroller guarded the moment
      // someone added the @media block that cannot reach a ScrollToOptions value.
      // Widening the population without this would have turned a silent gap into a
      // confident false CLOSED, which is strictly worse.
      const moving = libSvelte
        .map((f) => ({ file: f, motion: movementIn(read(f)) }))
        .filter((entry) => entry.motion !== null);
      const guarded = moving.filter((entry) => guardFor(read(entry.file), entry.motion.needs));
      const missing = moving.filter((entry) => !guarded.includes(entry));
      const scriptOnly = moving.filter((entry) => entry.motion.needs === 'script').length;
      return {
        status: grade(guarded.length, moving.length),
        evidence:
          `${guarded.length} of ${moving.length} components that MOVE guard it, in the form` +
          ` their own motion needs (${scriptOnly} can only be reached from script: a` +
          ` transition directive, a ScrollToOptions value, an inline style write or a canvas)` +
          `${missing.length > 0 ? `; unguarded: ${missing.map((e) => `${base(e.file)} (${e.motion.what}, needs ${e.motion.needs})`).join(', ')}` : ''}` +
          // Measured: disabling the Sheet guard's condition left this CLOSED,
          // because presence is all a source read can see. Saying so beats
          // implying a stronger guarantee -- the mistake this ledger exists to
          // stop being made about itself.
          `. NOT verified: that a guard WORKS -- this reads presence, so a guard behind a false condition still counts, and only a browser run with emulateMedia can tell. Nor that a script guard stays CURRENT: a component reading the preference once into a variable and never listening for a change passes this, and stops honouring the setting the moment the user changes it mid-session`
      };
    }
  },
  {
    id: 'MT-4',
    pack: 'Motion',
    title: 'Custom-element consumers cannot turn motion off',
    probe: () => {
      // The acceptance is NOT "wrappers expose a motion control" -- that was a
      // criterion I invented, and it measured nothing. MT-4 names fourteen
      // components whose motion is neither guarded NOR behind a token, so a
      // `<sui-*>` consumer cannot silence them by any means: a stylesheet
      // cannot reach into a shadow root, and there is no token to set. So the
      // real question is whether each of the fourteen is now reachable, plus
      // whether an assertion proves it against the CUSTOM-ELEMENT build --
      // the acceptance is explicit that the Svelte build has a different
      // escape hatch and testing it would prove the wrong thing.
      const NAMED = [
        'BrandLoader',
        'Carousel',
        'Select',
        'DateRangePicker',
        'HITL',
        'Slider',
        'Book',
        'Combobox',
        'CommandMenu',
        'Loader',
        'Table',
        'Banner',
        'Gallery',
        'Sheet'
      ];
      const unreachable = NAMED.filter((c) => {
        const text = read(p('src/lib', c, `${c}.svelte`));
        if (text === '' || /prefers-reduced-motion/.test(text)) {
          return false;
        }
        // A duration a consumer can override is one that resolves through a
        // custom property; a literal one is sealed behind the boundary.
        return [...text.matchAll(/(?:animation|transition)(?:-duration)?\s*:\s*([^;]+);/g)].some(
          (m) => !/var\(/.test(m[1]) && /\d+m?s/.test(m[1])
        );
      });
      // Merely mentioning `sui-` and the word "animation" is not an assertion:
      // that matched four files about images, markdown, event casing and a
      // review backlog. A real one has to READ a computed motion value off a
      // custom element, so require both halves in the same file.
      const proven = walk(p('tests'), (f) => /\.(spec|test)\.ts$/.test(f)).some((f) => {
        const text = read(f);
        return (
          /sui-/.test(text) &&
          /getComputedStyle/.test(text) &&
          /animation-duration|animationName|animationDuration|transitionDuration|animation-play-state/.test(
            text
          )
        );
      });
      return {
        status: unreachable.length === 0 && proven ? CLOSED : PARTIAL,
        evidence: `${NAMED.length - unreachable.length} of ${NAMED.length} named components reachable from outside; unreachable: ${unreachable.join(', ') || 'none'}; asserted against the custom-element build: ${proven}`
      };
    }
  },
  {
    id: 'MT-5',
    pack: 'Motion',
    title: 'prefersReducedMotion was not exported',
    probe: () => {
      const ok = /prefersReducedMotion/.test(read(p('src/lib/index.ts')));
      return { status: ok ? CLOSED : OPEN, evidence: `exported from src/lib/index.ts: ${ok}` };
    }
  },
  {
    id: 'MT-6',
    pack: 'Motion',
    title: 'Token-scale bridge and an explicit dark-mode position',
    probe: () => {
      const r = read(p('README.md'));
      const parts = [
        /Bridging Your Own Token Scale/i.test(r),
        /### Dark Mode/.test(r),
        existsSync(p('src/lib/styles/theme-dark.css'))
      ];
      return {
        status: grade(parts.filter(Boolean).length, 3),
        evidence: `bridge example: ${parts[0]}; dark-mode statement: ${parts[1]}; optional theme ships: ${parts[2]}`
      };
    }
  },

  {
    id: 'TC-1',
    pack: 'Table/chart',
    title: 'Selection identity must survive sorting',
    probe: () => {
      const t = read(p('src/lib/Table/properties.ts'));
      const ok = /getRowId/.test(t) && /selectedIds/.test(t);
      return {
        status: ok ? CLOSED : OPEN,
        evidence: `getRowId and controlled selectedIds declared: ${ok}`
      };
    }
  },
  {
    id: 'TC-2',
    pack: 'Table/chart',
    title: 'Controlled sort/search and announced sort direction',
    probe: () => {
      const aria = /aria-sort/.test(read(p('src/lib/Table/Table.svelte')));
      const controlled = /sortState|sortBy\b/.test(read(p('src/lib/Table/properties.ts')));
      return {
        status: grade([aria, controlled].filter(Boolean).length, 2),
        evidence: `aria-sort on the header cell: ${aria}; controlled sort input: ${controlled}`
      };
    }
  },
  {
    id: 'TC-3',
    pack: 'Table/chart',
    title: 'Page ownership and external shrink',
    probe: () => {
      // The previous probe could never close: `onPageChange` present returned
      // PARTIAL, absent returned OPEN, and its evidence was a fixed string. An
      // item with no path to CLOSED is worse than no item -- it reads as
      // outstanding work forever and tells whoever picks it up nothing about
      // what would satisfy it. table-fix had to point that out rather than
      // being able to finish it.
      //
      // TC-3 has four acceptance bullets, and the third explicitly permits
      // retaining the WC-paginator limitation so long as it is DOCUMENTED
      // rather than silently broken, so all four are checkable.
      const table = read(p('src/lib/Table/Table.svelte'));
      const doc = read(p('docs/Table.md'));
      const checks = [
        /effectivePage/.test(table),
        /isPageSizeControlled/.test(table),
        /paginator[\s\S]{0,120}(cannot|limitation|not render|suppressed)/i.test(doc),
        /one-based|zero-based|pageIndex/i.test(doc)
      ];
      const names = [
        'client-mode page clamp',
        'server-mode page-size authority',
        'WC paginator limitation documented',
        'one-based page guidance'
      ];
      const missing = names.filter((_, idx) => !checks[idx]);
      return {
        status: grade(checks.filter(Boolean).length, 4),
        evidence: `${checks.filter(Boolean).length} of 4 acceptance points [${names.join(', ')}]${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'TC-4',
    pack: 'Table/chart',
    title: 'Custom cells, loading states and mobile records need recipes',
    probe: () => {
      const table = read(p('src/lib/Table/Table.svelte'));
      const surface =
        read(p('src/routes/components/table/+page.svelte')) + read(p('docs/Table.md'));
      const cardTests = read(p('src/lib/Table/mobile-card-layout.test.ts'));
      const checks = [
        /data-row-activation|isRowActivationIgnored/.test(table),
        /no-match|noMatch|no matching|retry/i.test(surface),
        // The label-aware internal mapping: a real element the component owns,
        // not a `::before`, because generated content cannot be aria-hidden and
        // a consumer's stylesheet cannot reach inside the shadow tree to add one.
        /table-mobile-label/.test(table) && /mobileCardLayout/.test(table),
        // `display: block` drops the implicit table roles, so the component
        // restates them -- asserted, not assumed.
        /role=\{mobileRole\(/.test(table) && /columnheader|rowgroup/.test(cardTests)
      ];
      const names = [
        'custom-cell activation guard',
        'loading/empty/no-match/error compositions',
        'mobile record cards with a label-aware internal mapping',
        'table semantics restated when the layout stacks'
      ];
      const missing = names.filter((_, i) => !checks[i]);
      return {
        status: grade(checks.filter(Boolean).length, checks.length),
        // The fourth point is closed on AUTOMATED evidence by an explicit
        // decision, and says so rather than implying more than was done. What the
        // tests assert is the accessibility TREE -- the roles and the accessible
        // names the component emits. What nobody has run is a screen reader, so
        // what an actual AT announces in an actual browser remains unverified.
        // Recording that is the difference between a closed item and a true one.
        evidence:
          `${checks.filter(Boolean).length} of ${checks.length} acceptance points [${names.join(', ')}]` +
          `${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}` +
          `. NOT verified: the announcement itself -- the semantics point is closed on asserted roles and names, by decision, and no screen reader has been driven against it`,
        manual: true
      };
    }
  },
  {
    id: 'TC-5',
    pack: 'Table/chart',
    title: 'Join chart series by X, not array position',
    probe: () => {
      // `n > 0` meant ONE conforming file closed a library-wide contract, and the
      // evidence line printed its own denominator while closing anyway.
      //
      // The population is the charts whose points carry a continuous `x` and so
      // CAN be misaligned: LineChart and AreaChart. Bar and DualAxisBar align by
      // category, PieChart and Sankey have no x at all -- requiring joinByX of
      // them would be inventing work.
      // Read from the POINT TYPE, not from the component: BarChart's properties.ts
      // does contain `x: number` and `y: number`, on the bar-rectangle geometry
      // it hands to a click callback. Matching that called a category chart
      // x-keyed and demanded it join by a key it does not have.
      const xKeyed = libSvelte.filter((f) => {
        if (!/Chart\.svelte$/.test(f)) {
          return false;
        }
        const props = read(f.replace(/\.svelte$/, '').replace(/\/[^/]+$/, '/properties.ts'));
        return /DataPoint\s*=\s*\{\s*x:\s*number;\s*y:\s*number/.test(props);
      });
      const joined = xKeyed.filter((f) => /joinByX/.test(read(f)));
      const missing = xKeyed.filter((f) => !joined.includes(f));
      return {
        status: grade(joined.length, xKeyed.length),
        evidence: `${joined.length} of ${xKeyed.length} x-keyed charts join by X value${missing.length > 0 ? `; still positional: ${missing.map(base).join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'TC-6',
    pack: 'Table/chart',
    title: 'Gaps, calendar axes, units and signed values must survive adapters',
    probe: () => {
      // The acceptance is a written input-policy contract plus a resolved
      // AreaChart gap behaviour, so ask for those by name. LineChart already
      // documents NaN as a gap and filters non-finite values; AreaChart passes
      // every Y to Math.min/max, so one NaN poisons the whole domain.
      const anyDoc = walk(p('docs'), (f) => f.endsWith('.md'))
        .map(read)
        .join('\n');
      const area = read(p('src/lib/AreaChart/AreaChart.svelte'));
      const line = read(p('src/lib/LineChart/LineChart.svelte'));
      const checks = [
        /input policy|missing value|sparse series/i.test(anyDoc),
        /isFinite/.test(area) && /isFinite/.test(line),
        /scaleUtc|temporal adapter|UTC bucket/i.test(`${anyDoc}${area}${line}`)
      ];
      const names = [
        'input-policy table',
        'AreaChart honours LineChart gap convention',
        'temporal/UTC adapter'
      ];
      const missing = names.filter((_, i) => !checks[i]);
      return {
        status: grade(checks.filter(Boolean).length, 3),
        evidence: `${checks.filter(Boolean).length} of 3 acceptance points [${names.join(', ')}]${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'TC-7',
    pack: 'Table/chart',
    title: 'Chart naming and keyboard access need a family-wide contract',
    probe: () => {
      // Matching the literal word "keydown" anywhere in the file is the
      // "merely also-has-a-keydown-handler" shape this item's own title warns
      // about: a handler on a non-focusable element is dead code, and a mark with
      // no accessible name announces nothing. All three have to hold.
      const charts = libSvelte.filter((f) => /Chart\.svelte$/.test(f));
      const operable = charts.filter((f) => {
        const t = read(f);
        return /onkeydown/.test(t) && /tabindex=/.test(t) && /aria-label/.test(t);
      });
      const missing = charts.filter((f) => !operable.includes(f));
      return {
        status: grade(operable.length, charts.length),
        evidence: `${operable.length} of ${charts.length} charts have marks that are focusable, key-operable AND named${missing.length > 0 ? `; missing: ${missing.map(base).join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'TC-8',
    pack: 'Table/chart',
    title: 'Legend and tooltip behaviour is inconsistent',
    probe: () => {
      const anyDoc = walk(p('docs'), (f) => f.endsWith('.md'))
        .map(read)
        .join('\n');
      const pie = read(p('src/lib/PieChart/PieChart.svelte'));
      const checks = [
        /synchroni[sz]ed legend|legend recipe/i.test(anyDoc),
        /tooltipPortal/.test(pie),
        /aria-describedby|aria-live|role="status"/.test(pie)
      ];
      const names = [
        'synchronized legend recipe using the highlight API',
        'PieChart tooltip uses the shared portal infrastructure',
        'tooltip detail associated with its datum for assistive tech'
      ];
      const missing = names.filter((_, i) => !checks[i]);
      return {
        status: grade(checks.filter(Boolean).length, 3),
        evidence: `${checks.filter(Boolean).length} of 3 acceptance points [${names.join(', ')}]${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'TC-9',
    pack: 'Table/chart',
    title: 'Consumer adapters and acceptance fixtures',
    probe: () => {
      // This probe used to pass if the word "adapter" appeared ANYWHERE in docs/
      // and anywhere in tests/. A CHANGELOG line and one unrelated spec would
      // have closed it with nothing built -- the ninth probe here caught
      // counting what was easy to compute rather than what the acceptance says.
      //
      // The boundary is documented in ONE place by name, and a fixture only
      // EXERCISES it if it reaches the contract it adapts to. Importing the
      // chart contract is what separates a test that drives the boundary from a
      // test that merely mentions it.
      const documented = /adapter/i.test(read(p('docs/CHART_INPUT_POLICY.md')));
      const fixtureFiles = [
        ...walk(p('tests'), (f) => /\.(spec|test)\.ts$/.test(f)),
        ...walk(p('src/lib'), (f) => /\.(spec|test)\.ts$/.test(f))
      ];
      const exercising = fixtureFiles.filter((f) => {
        const t = read(f);
        return /adapter/i.test(t) && /from\s+'[^']*(_chart|Chart\.svelte)/.test(t);
      });
      const checks = [documented, exercising.length > 0];
      const names = ['documented consumer-adapter boundary', 'acceptance fixtures exercising it'];
      const missing = names.filter((_, i) => !checks[i]);
      return {
        status: grade(checks.filter(Boolean).length, 2),
        evidence: `${checks.filter(Boolean).length} of 2 acceptance points [${names.join(', ')}]${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}. ${exercising.length} fixture(s) both name the boundary and import the chart contract they adapt to; the policy itself is in docs/CHART_INPUT_POLICY.md: ${documented}`
      };
    }
  },

  {
    id: 'CS-1',
    pack: 'Chat',
    title: 'TypewriterText.renderText was unsanitised by construction',
    probe: () => {
      const t = read(p('src/lib/TypewriterText/TypewriterText.svelte'));
      const ok = /markdown/i.test(t) && /renderMarkdown/.test(t);
      return { status: ok ? CLOSED : OPEN, evidence: `safe markdown mode present: ${ok}` };
    }
  },
  {
    id: 'CS-2',
    pack: 'Chat',
    title: 'Composer: tri-state dictation, Escape, live region',
    probe: () => {
      const t = read(p('src/lib/ChatComposer/ChatComposer.svelte'));
      const parts = [/dictationState/.test(t), /Escape/.test(t), /aria-live/.test(t)];
      return {
        status: grade(parts.filter(Boolean).length, 3),
        evidence: `tri-state: ${parts[0]}; Escape stops dictation: ${parts[1]}; live region: ${parts[2]}; IME guard kept: ${/isComposing/.test(t)}`
      };
    }
  },
  {
    id: 'CS-3',
    pack: 'Chat',
    title: 'Chat content props cannot be reached from HTML',
    probe: () => {
      const family = [
        'Chat',
        'ChatComposer',
        'ChatMessage',
        'ChatHeader',
        'ChatBubble',
        'ChatMessageList'
      ];
      const withSlot = family.filter((n) =>
        /<slot/.test(read(p(`src/wc/components/${n}.wc.svelte`)))
      );
      return {
        status: grade(withSlot.length, family.length),
        evidence: `${withSlot.length} of ${family.length} chat wrappers render a slot`
      };
    }
  },
  {
    id: 'CS-4',
    pack: 'Chat',
    title: 'The announcement policy is correct and undocumented',
    probe: () => {
      const impl = /role="log"/.test(read(p('src/lib/ChatMessageList/ChatMessageList.svelte')));
      const doc = /aria-live|role="log"/.test(read(p('docs/ChatMessageList.md')));
      return {
        status: grade([impl, doc].filter(Boolean).length, 2),
        evidence: `role=log implemented: ${impl}; documented: ${doc}`
      };
    }
  },
  {
    id: 'CS-5',
    pack: 'Chat',
    title: 'Scroll ownership',
    probe: () => ({
      status: NA,
      evidence: 'the finding was that the library is ahead here; no action'
    })
  },
  {
    id: 'CS-6',
    pack: 'Chat',
    title: 'The family reduced-motion work is the precedent to copy',
    probe: () => {
      // Only a component that actually animates can be unguarded. Counting the
      // whole family reported 6 of 11 and implied five components needed work;
      // five of them declare no animation or transition at all, so a guard
      // there would be dead CSS. A ledger that invents work is as bad as one
      // that loses it.
      const animating = libSvelte
        .filter((f) => /Chat|Thinking|ToolCall|TaskList/.test(basename(f)))
        .filter((f) => /animation:|transition:/.test(read(f)));
      const guarded = animating.filter((f) => /prefers-reduced-motion/.test(read(f)));
      const missing = animating
        .filter((f) => !/prefers-reduced-motion/.test(read(f)))
        .map((f) => basename(f));
      return {
        status: grade(guarded.length, animating.length),
        evidence: `${guarded.length} of ${animating.length} ANIMATING chat-family components guard motion; missing: ${missing.join(', ') || 'none'}`
      };
    }
  },

  {
    id: 'CW-1',
    pack: 'Chart wrappers',
    title: 'dismissOnOutsidePointerDown defeated by event retargeting',
    probe: () => {
      const g = gate('check-shadow-safety.js');
      return {
        status: g.clean ? CLOSED : OPEN,
        evidence: `retargeting is rule 2 of check-shadow-safety.js: ${g.note}`
      };
    }
  },
  {
    id: 'CW-2',
    pack: 'Chart wrappers',
    title: 'tooltipPortal moves the tooltip out of its own stylesheet',
    probe: () => {
      const t = read(p('src/lib/_chart/ChartTooltip.svelte'));
      const portals = /document\.body\.appendChild/.test(t);
      const aware = /ShadowRoot|getRootNode\(\)/.test(t);
      return {
        status: !portals || aware ? CLOSED : OPEN,
        evidence: `ChartTooltip portals to body: ${portals}; shadow-aware: ${aware}`
      };
    }
  },
  {
    id: 'CW-3',
    pack: 'Chart wrappers',
    title: 'SankeyChart is ready to wrap',
    probe: () => {
      const ok = existsSync(p('src/wc/components/SankeyChart.wc.svelte'));
      return { status: ok ? CLOSED : OPEN, evidence: `SankeyChart.wc.svelte exists: ${ok}` };
    }
  },
  {
    id: 'CW-4',
    pack: 'Chart wrappers',
    title: 'Four doc pages promise elements that do not exist',
    probe: () => {
      const gated = existsSync(p('scripts/check-docs-contract.js'));
      return { status: gated ? CLOSED : OPEN, evidence: `docs-contract gate present: ${gated}` };
    }
  },
  {
    id: 'CW-5',
    pack: 'Chart wrappers',
    title: 'The remaining chart wrappers',
    probe: () => {
      // The chart set is DERIVED from docs/CHART_INPUT_POLICY.md rather than
      // listed here. A list written here goes stale silently: the previous
      // version hardcoded five names, so it read "5 of 5" whatever the library
      // did, and could never become six -- a probe that cannot fail is not
      // measuring anything. The policy doc's treatment table names every chart
      // bound by the non-finite contract, split across two rows because the
      // treatment is forced by the chart's own shape (positional charts exclude
      // a non-finite value from the domain; share-of-whole charts count it as a
      // zero contribution). BarChart appears in BOTH rows -- grouped and
      // stacked differ -- so the set is the union, de-duplicated.
      const policyPath = p('docs/CHART_INPUT_POLICY.md');
      if (!existsSync(policyPath)) {
        return {
          status: OPEN,
          evidence: 'docs/CHART_INPUT_POLICY.md not found — cannot derive the chart set'
        };
      }
      const rows = read(policyPath)
        .split('\n')
        .filter((line) => /^\|\s*\*\*(gap-exclusion|zero-contribution)\*\*/.test(line));
      const want = [
        ...new Set(
          rows.flatMap((row) => [...row.matchAll(/`([A-Z][A-Za-z]*Chart)`/g)].map((m) => m[1]))
        )
      ].sort();
      // Fail loudly rather than report "0 of 0", which grade() would otherwise
      // be free to read as complete.
      if (want.length === 0) {
        return {
          status: OPEN,
          evidence:
            'CHART_INPUT_POLICY.md names no charts in its treatment table — the table shape changed and this probe can no longer see the set'
        };
      }
      const have = want.filter((n) => existsSync(p(`src/wc/components/${n}.wc.svelte`)));
      const missing = want.filter((n) => !have.includes(n));
      return {
        status: grade(have.length, want.length),
        evidence:
          `${have.length} of ${want.length} charts under the non-finite contract have a wrapper ` +
          `(set derived from docs/CHART_INPUT_POLICY.md, not hardcoded)` +
          `${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}`
      };
    }
  },
  {
    id: 'CW-6',
    pack: 'Chart wrappers',
    title: 'Make the chart-wrapper contract enforceable',
    probe: () => {
      // CW-6 names three checks. The first version of this probe grepped for
      // the literal phrase "chart-wrapper contract", which no gate would ever
      // contain -- it measured nothing and would have stayed false forever.
      // Ask for the three rules by the identifiers the gates actually emit.
      const scripts = walk(p('scripts'), (f) => /\.(js|ts|mjs)$/.test(f));
      const has = (re) => scripts.some((f) => re.test(read(f)));
      const checks = [
        has(/wrapper-never-imported/),
        has(/parameterized-snippet-bridged-to-slot/),
        has(/unregistered-element/)
      ];
      const names = ['every-wrapper-imported', 'no-parameterized-slot-bridge', 'docs-tag-resolves'];
      const missing = names.filter((_, i) => !checks[i]);
      return {
        status: grade(checks.filter(Boolean).length, 3),
        evidence: `${checks.filter(Boolean).length} of 3 checks present [${names.join(', ')}]${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}`
      };
    }
  }
];

const rows = ITEMS.map((item) => {
  const result = item.probe();
  return {
    id: item.id,
    pack: item.pack,
    title: item.title,
    status: result.status,
    evidence: result.evidence,
    manual: result.manual === true
  };
});

const tally = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
const actionable = rows.filter((r) => r.status === OPEN || r.status === PARTIAL);
const blocked = rows.filter((r) => r.status === BLOCKED);
const args = process.argv.slice(2);

if (args.includes('--json')) {
  console.log(JSON.stringify({ tally, actionable: actionable.length, items: rows }, null, 1));
  process.exit(0);
}

if (!args.includes('--summary')) {
  const show = args.includes('--open') ? actionable : rows;
  let pack = '';
  for (const r of show) {
    if (r.pack !== pack) {
      pack = r.pack;
      console.log(`\n  ${pack}`);
    }
    console.log(`  [${r.status.toUpperCase().padEnd(7)}] ${r.id.padEnd(6)} ${r.title}`);
    console.log(`              ${r.evidence}${r.manual ? '  (not mechanically derived)' : ''}`);
  }
  console.log('');
}

console.log(
  `  ${rows.length} items: ${tally[CLOSED] ?? 0} closed, ${tally[PARTIAL] ?? 0} partial, ` +
    `${tally[OPEN] ?? 0} open, ${tally[BLOCKED] ?? 0} awaiting a decision, ` +
    `${tally[NA] ?? 0} n/a  --  ${actionable.length} actionable`
);
if (blocked.length > 0) {
  console.log(`\n  ${blocked.length} item(s) need a person, not an agent:`);
  for (const r of blocked) {
    console.log(`    ${r.id}  ${r.title}`);
    console.log(`          ${r.evidence}`);
  }
}
