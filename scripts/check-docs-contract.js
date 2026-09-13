#!/usr/bin/env node
/**
 * Two promises a doc page can make that no build step can keep.
 *
 * 1. A `<sui-*>` tag that is not a registered element.
 *    `docs/` is what the MCP server serves to consumers, so a tag here is an
 *    instruction. An unregistered tag parses as an inert unknown element: no
 *    error, no console warning, just a blank space where the component was.
 *    Four chart pages shipped a full "Web Component" section -- markup,
 *    property assignments, the lot -- for elements that were never written,
 *    and the only way to discover it was to paste the example and see nothing.
 *
 * 2. An `addEventListener` example for an event nothing dispatches.
 *    85 of the 91 wrappers dispatch no DOM event at all; a consumer is meant to
 *    assign `el.onclose = fn`. `addEventListener('close', ...)` on such an
 *    element registers happily and never fires -- the worst shape of wrong,
 *    because it looks like it worked.
 *
 * A page is allowed to SHOW the non-working call as long as it says, on that
 * line, that it does not work. That is how the DateRangePicker, FileInput,
 * FunnelChart, Select and ThemeSwitcher pages document the limitation today,
 * and this rule is what stops the next page from dropping the caveat.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DOCS = join(ROOT, 'docs');
const WC_DIR = join(ROOT, 'src/wc/components');
const WC_INDEX = join(ROOT, 'src/wc/index.ts');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (entry.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * A tag is live only if its wrapper declares it AND `src/wc/index.ts` imports
 * that wrapper. Both halves have failed here before: the repo once held
 * wrappers that existed and were never imported, leaving `sui-hitl` and
 * `sui-typewriter-text` undefined for every consumer.
 */
const indexText = readFileSync(WC_INDEX, 'utf8');
const imported = new Set(
  Array.from(indexText.matchAll(/components\/([A-Za-z0-9]+)\.wc\.svelte/g)).map((m) => m[1])
);

const liveTags = new Set();
const declaredButNotImported = new Map();
for (const entry of readdirSync(WC_DIR)) {
  if (!entry.endsWith('.wc.svelte')) {
    continue;
  }
  const name = basename(entry, '.wc.svelte');
  const tag = /tag:\s*'([a-z0-9-]+)'/.exec(readFileSync(join(WC_DIR, entry), 'utf8'));
  if (tag === null) {
    continue;
  }
  if (imported.has(name)) {
    liveTags.add(tag[1]);
  } else {
    declaredButNotImported.set(tag[1], entry);
  }
}

/** Language that turns an example into a statement of what does NOT work. */
const DISCLAIMED =
  /not a DOM event|not DOM events|never called|never runs|never fires|does not dispatch|do not dispatch|no matching DOM event|registers without error/i;

/**
 * Naming a tag in order to say it does not exist is the opposite of promising
 * it, so it must not trip the rule -- otherwise the only way to pass would be
 * to stay silent about the gap, which is the failure this file exists to stop.
 * The negation has to name that exact tag, so a page cannot buy an unrelated
 * live example out of the check with one disclaimer elsewhere on the page.
 */
const tagDisclaimed = (window, tag) =>
  new RegExp(`(there is no|is not a registered|no)\\s+\`?<?${tag}>?\`?`, 'i').test(window);

/**
 * A missing wrapper file is itself the answer -- an element with no wrapper
 * dispatches nothing -- so an unreadable path is a false, not an error.
 */
const dispatchesEvent = (wrapperPath, event) => {
  try {
    const text = readFileSync(wrapperPath, 'utf8');
    return /dispatchEvent/.test(text) && new RegExp(`['"\`]${event}['"\`]`).test(text);
  } catch {
    return false;
  }
};

/**
 * GitHub's heading-slug convention, matching the renderer override in
 * src/routes/components/+layout.svelte. `marked` ships no heading ids of its
 * own, so before that override EVERY `](#a-heading)` link in docs/ pointed at
 * nothing -- and SvelteKit's prerenderer fails the build on a missing id. That
 * surfaced four separate times in one day, each time reading as an author being
 * careless, when in fact every one of those links was the correct slug.
 */
const slugify = (text) =>
  text
    .replace(/<[^>]+>/g, '')
    .replace(/`/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    // One hyphen per whitespace CHARACTER; GitHub does not collapse runs. See the
    // matching note in src/routes/components/+layout.svelte.
    .replace(/\s/g, '-');

/** kebab-case route slug for a doc page, e.g. ChatComposer -> chat-composer. */
const routeSlug = (component) => component.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

const errors = [];
let tagUses = 0;
let listenerUses = 0;
let disclaimedListeners = 0;
let disclaimedTags = 0;
let anchorUses = 0;
let crossDocUses = 0;

for (const file of walk(DOCS)) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');

  lines.forEach((line, i) => {
    for (const m of line.matchAll(/<(sui-[a-z0-9-]+)/g)) {
      tagUses += 1;
      const tag = m[1];
      if (liveTags.has(tag)) {
        continue;
      }
      const tagWindow = lines.slice(Math.max(0, i - 4), i + 5).join('\n');
      if (tagDisclaimed(tagWindow, tag)) {
        disclaimedTags += 1;
        continue;
      }
      const why = declaredButNotImported.has(tag)
        ? `its wrapper ${declaredButNotImported.get(tag)} exists but src/wc/index.ts never imports it, so the element is never defined`
        : 'no wrapper in src/wc/components declares that tag';
      errors.push({
        file: rel,
        line: i + 1,
        rule: 'unregistered-element',
        detail: `<${tag}> is not a registered custom element: ${why}. The markup parses as an inert unknown element, so a consumer following this page sees nothing render and gets no error.`,
        fix: `either register ${tag}, or replace this section with a statement that the component is Svelte-only`
      });
    }

    for (const m of line.matchAll(/addEventListener\(\s*['"]([a-zA-Z0-9:-]+)['"]/g)) {
      listenerUses += 1;
      const event = m[1];
      // The caveat may sit on this line or in the sentence that introduces the
      // block, so look at a small window rather than the single line.
      const window = lines.slice(Math.max(0, i - 6), i + 7).join('\n');
      if (DISCLAIMED.test(window)) {
        disclaimedListeners += 1;
        continue;
      }
      const comp = basename(file, '.md');
      if (dispatchesEvent(join(WC_DIR, `${comp}.wc.svelte`), event)) {
        continue;
      }
      errors.push({
        file: rel,
        line: i + 1,
        rule: 'undispatched-event',
        detail: `this page shows addEventListener('${event}') but ${comp}.wc.svelte never dispatches '${event}'. The listener registers without error and is never called, so the example looks correct and silently does nothing.`,
        fix: `dispatch '${event}' from the wrapper, or say on this line that it is a callback prop and not a DOM event`
      });
    }
  });
}

// ---- Rule 3: an in-page anchor must have somewhere to land ----------------
for (const file of walk(DOCS)) {
  const rel = relative(ROOT, file);
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  // Ids the rendered page will carry: every heading in this doc (the renderer
  // emits them), plus any hand-written id in the doc or in the demo page, which
  // renders on the SAME route as the doc.
  const available = new Set(
    lines.filter((l) => /^#{1,6}\s/.test(l)).map((l) => slugify(l.replace(/^#{1,6}\s+/, '')))
  );
  for (const m of text.matchAll(/id="([^"]+)"/g)) {
    available.add(m[1]);
  }
  const demo = join(
    ROOT,
    'src/routes/components',
    routeSlug(basename(file, '.md')),
    '+page.svelte'
  );
  try {
    for (const m of readFileSync(demo, 'utf8').matchAll(/id="([^"]+)"/g)) {
      available.add(m[1]);
    }
  } catch {
    // No demo page for this component; the doc's own headings are all there is.
  }

  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\]\(#([^)]+)\)/g)) {
      anchorUses += 1;
      if (available.has(m[1])) {
        continue;
      }
      errors.push({
        file: rel,
        line: i + 1,
        rule: 'anchor-with-no-target',
        detail: `this page links to #${m[1]}, and no heading in it slugifies to that, nor does any element on /components/${routeSlug(basename(file, '.md'))} carry that id. SvelteKit's prerenderer FAILS THE BUILD on a missing anchor target, so this breaks the build for everyone, not just this page.`,
        fix: `match the link to a heading in this file (headings become their GitHub slug), or add id="${m[1]}" to the demo page`
      });
    }
  });
}

// ---- Rule 4: a link to ANOTHER doc must resolve, here as well as on GitHub ----
//
// `](./PieChart.md#keyboard-access)` is correct markdown on GitHub and through the
// MCP server, and by itself it is wrong in the docs app: the browser resolves it
// against the current route and asks for `/components/PieChart.md`. The layout's
// renderer now rewrites these (a doc with a demo route becomes that route, one
// without becomes its GitHub URL), so what is left to check is that the target
// exists at all -- and that an anchor into a ROUTED doc lands on something, since
// that link is crawled and a missing id fails the build.
//
// Eight of these shipped before anything checked them, and the first one the
// prerenderer reached took `npm run build` down with a 404 that named a file
// nobody had deleted.
{
  const docFiles = walk(DOCS);
  const docNames = new Set(docFiles.map((f) => basename(f, '.md')));
  const headingsOf = (name) => {
    const target = docFiles.find((f) => basename(f, '.md') === name);
    // `find` yields undefined for a miss, and this repo's lint bans naming that
    // literal -- so narrow on the type instead.
    if (typeof target !== 'string') {
      return new Set();
    }
    const text = readFileSync(target, 'utf8');
    const ids = new Set(
      text
        .split('\n')
        .filter((l) => /^#{1,6}\s/.test(l))
        .map((l) => slugify(l.replace(/^#{1,6}\s+/, '')))
    );
    for (const m of text.matchAll(/id="([^"]+)"/g)) {
      ids.add(m[1]);
    }
    try {
      const demo = join(ROOT, 'src/routes/components', routeSlug(name), '+page.svelte');
      for (const m of readFileSync(demo, 'utf8').matchAll(/id="([^"]+)"/g)) {
        ids.add(m[1]);
      }
    } catch {
      // No demo page: the target doc's own headings are all a link can land on.
    }
    return ids;
  };
  const isRouted = (name) => {
    try {
      readFileSync(join(ROOT, 'src/routes/components', routeSlug(name), '+page.svelte'), 'utf8');
      return true;
    } catch {
      return false;
    }
  };

  for (const file of docFiles) {
    const rel = relative(ROOT, file);
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(/\]\((?:\.\/)?([A-Za-z0-9_.-]+)\.md(#[^)]*)?\)/g)) {
          crossDocUses += 1;
          const [, name, hash] = m;
          if (!docNames.has(name)) {
            errors.push({
              file: rel,
              line: i + 1,
              rule: 'cross-doc-link-missing-file',
              detail: `this page links to ${name}.md, and docs/${name}.md does not exist.`,
              fix: `correct the filename, or write the link as a full URL if the target lives outside docs/`
            });
            continue;
          }
          if (typeof hash !== 'string' || !isRouted(name)) {
            continue;
          }
          const anchor = hash.slice(1);
          if (!headingsOf(name).has(anchor)) {
            errors.push({
              file: rel,
              line: i + 1,
              rule: 'cross-doc-anchor-with-no-target',
              detail: `this page links to ${name}.md#${anchor}. That renders as /components/${routeSlug(name)}#${anchor}, and no heading in docs/${name}.md slugifies to it. The prerenderer FAILS THE BUILD on a missing anchor.`,
              fix: `match the anchor to a heading in docs/${name}.md (headings become their GitHub slug)`
            });
          }
        }
      });
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} doc-contract violation(s):\n`);
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  [${e.rule}]`);
    console.error(`    ${e.detail}`);
    console.error(`    fix: ${e.fix}\n`);
  }
  process.exit(1);
}

console.log(`0 doc-contract violations across ${walk(DOCS).length} reference pages.`);
console.log(
  `  ${tagUses} <sui-*> tag uses: ${tagUses - disclaimedTags} resolving to one of ${liveTags.size} ` +
    `registered elements, ${disclaimedTags} named explicitly as NOT existing.`
);
console.log(
  `  ${listenerUses} addEventListener examples: ${listenerUses - disclaimedListeners} backed by a real dispatch, ` +
    `${disclaimedListeners} shown explicitly as NOT working.`
);
console.log(`  ${anchorUses} in-page anchor link(s), every one resolving to a real target.`);
console.log(
  `  ${crossDocUses} link(s) to another doc, every one naming a file that exists (and landing on a real anchor where the target has a route).`
);
console.log('  NOT checked — a pass here says nothing about these:');
for (const shape of [
  'whether a registered element actually renders anything useful (that is the browser suite)',
  'attribute names and types in the example matching the wrapper’s declared props',
  'property-assignment examples (`el.foo = ...`) naming a prop that exists',
  'events dispatched by the inner component rather than the wrapper',
  'an anchor into a doc with NO route (nothing crawls it, so nothing can prove it)'
]) {
  console.log(`    - ${shape}`);
}
