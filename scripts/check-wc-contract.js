#!/usr/bin/env node
/**
 * Two ways a custom-element wrapper can be wrong that compile, type-check and
 * pass every existing gate.
 *
 * 1. A wrapper file that nothing imports.
 *    `customElements.define` runs as a side effect of importing the module, so
 *    a wrapper that `src/wc/index.ts` never imports is simply not an element:
 *    the tag parses as an inert unknown element and renders nothing. This is
 *    not hypothetical -- `sui-attachment-chip-row`, `sui-hitl` and
 *    `sui-typewriter-text` shipped undefined for every consumer of the bundle,
 *    and nothing referenced those files, so no build error ever pointed at it.
 *    `prop-parity` cannot see it: the wrapper it checks is perfectly correct,
 *    it just never runs.
 *
 * 2. A parameterized snippet bridged to a `<slot>`.
 *    A `<slot>` projects markup. It cannot receive arguments. So wiring
 *    `{#snippet tooltipSnippet(ctx)}<slot name="tooltip"></slot>{/snippet}`
 *    compiles, renders, and silently drops `ctx` -- the consumer gets an empty
 *    tooltip shell and the values it exists to display are gone. The failure is
 *    invisible in source review because the markup looks exactly like the
 *    correct argument-less case next to it.
 *
 * Rule 2 is the one worth having. Both `PieChart.wc.svelte` and
 * `SankeyChart.wc.svelte` deliberately leave `tooltipSnippet` out of their
 * markup and say why in a comment; this is what stops the next wrapper from
 * quietly doing the obvious thing instead.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const WC_DIR = join(ROOT, 'src/wc/components');
const WC_INDEX = join(ROOT, 'src/wc/index.ts');

const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');
const wrappers = readdirSync(WC_DIR).filter((f) => f.endsWith('.wc.svelte'));
const indexText = read(WC_INDEX);

const errors = [];

// ---- Rule 1: every wrapper is imported, so its define() actually runs -------
const imported = new Set(
  Array.from(indexText.matchAll(/components\/([A-Za-z0-9]+)\.wc\.svelte/g)).map((m) => m[1])
);

for (const file of wrappers) {
  const name = basename(file, '.wc.svelte');
  if (imported.has(name)) {
    continue;
  }
  const tag = /tag:\s*'([a-z0-9-]+)'/.exec(read(join(WC_DIR, file)));
  errors.push({
    file: `src/wc/components/${file}`,
    rule: 'wrapper-never-imported',
    detail: `src/wc/index.ts never imports this file, so customElements.define never runs and <${tag === null ? '?' : tag[1]}> is not an element. The markup parses as an inert unknown element and renders nothing, with no error.`,
    fix: `add \`import './components/${name}.wc.svelte';\` to src/wc/index.ts`
  });
}

/**
 * Snippet props whose type carries parameters, per component. A `<slot>` cannot
 * deliver these, so bridging one is always wrong -- which is why the population
 * is read from the component's own `properties.ts` rather than listed here.
 */
const parameterized = (component) => {
  const text = read(join(ROOT, 'src/lib', component, 'properties.ts'));
  const out = new Map();
  for (const m of text.matchAll(/(\w+)\??\s*:\s*Snippet<\[([^\]]*)\]>/g)) {
    if (m[2].trim() !== '') {
      out.set(m[1], m[2].replace(/\s+/g, ' ').trim());
    }
  }
  return out;
};

/**
 * `{#snippet name(...)}` blocks containing a `<slot>`, with the parameter list
 * the wrapper declared for them.
 *
 * The parameter list is the whole signal. Three shapes look alike and only one
 * is wrong:
 *
 *   {#snippet trigger(p)}{#if props.trigger}{@render props.trigger(p)}{:else}<slot/>{/if}{/snippet}
 *     -- Menu. Forwards the arguments when a property is assigned; the slot is
 *        a fallback for consumers who only want static markup. Correct.
 *   {#snippet trigger({ openFilePicker })}<slot><button onclick={openFilePicker}/></slot>{/snippet}
 *     -- FileInput. The default slot content consumes the arguments. Correct.
 *   {#snippet toolbarSlot()}<slot name="toolbar-slot"/>{/snippet}
 *     -- Table. Empty parameter list against a parameterized type: the
 *        arguments have nowhere to go and are provably dropped.
 *
 * So flag only the third. Declaring no parameters for a snippet whose type has
 * them is the unambiguous case; a wrapper that names its parameters has at
 * least had the chance to use them, and deciding whether it really did would
 * need dataflow this file has no business attempting.
 */
const bridgedSnippets = (text) => {
  const found = [];
  for (const m of text.matchAll(/\{#snippet\s+(\w+)\s*\(([^)]*)\)/g)) {
    // Scan to this block's `{/snippet}`; nesting a snippet inside a snippet is
    // not a shape this repo uses, so a forward search is sufficient and a
    // balanced parser would be unfalsifiable machinery for no gain.
    const end = text.indexOf('{/snippet}', m.index);
    if (end === -1) {
      continue;
    }
    if (/<slot[\s/>]/.test(text.slice(m.index, end))) {
      found.push({
        name: m[1],
        params: m[2].trim(),
        line: text.slice(0, m.index).split('\n').length
      });
    }
  }
  return found;
};

/**
 * Does the `{#if}` opened at `from` have an `{:else}` of its OWN? A proximity
 * search finds an else belonging to a completely different block -- it reported
 * Tooltip as losing a default when Tooltip's gate has no else at all -- so this
 * tracks nesting depth and only accepts an else at depth 1.
 */
const hasOwnElse = (text, from) => {
  let depth = 0;
  const re = /\{#(if|each|snippet|await|key)|\{:else|\{\/(if|each|snippet|await|key)/g;
  re.lastIndex = from;
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    if (m[0].startsWith('{#')) {
      depth += 1;
    } else if (m[0].startsWith('{/')) {
      depth -= 1;
      if (depth <= 0) {
        return false;
      }
    } else if (m[0] === '{:else' && depth === 1) {
      return true;
    }
  }
  return false;
};

/**
 * A slot's fallback content, comments stripped. Empty string means a bare
 * `<slot></slot>`; null means there is no slot here at all. Detecting fallback
 * by looking for an HTML tag was wrong -- the correct wrappers write theirs as
 * `{@html closeSvg}`, a Svelte expression, and were all reported as defects.
 */
/**
 * Repeat a removal until the string stops changing.
 *
 * One pass is not enough when removing a match CREATES a new one, which comment
 * markers do: `<!-<!-- -->- -->` leaves `<!-- -->` behind after a single
 * `.replace(/<!--[\s\S]*?-->/g, '')`, because the surviving halves close up into
 * a fresh comment. Looping reduces it to nothing. Measured, not assumed -- and a
 * control on well-formed input shows the two forms agree byte for byte, so this
 * changes no verdict this gate has ever produced.
 *
 * CodeQL calls the single-pass form js/incomplete-multi-character-sanitization.
 * It is right about the pattern, though nothing here reaches an HTML sink: this
 * gate reads the repo's own `.svelte` sources at lint time to decide whether a
 * `<slot>` has fallback content, and emits a verdict rather than markup.
 */
const removeAll = (text, pattern) => {
  let current = text;
  let previous;
  do {
    previous = current;
    current = current.replace(pattern, '');
  } while (current !== previous);
  return current;
};

const slotFallback = (body) => {
  const open = /<slot\b[^>]*>/.exec(body);
  if (open === null) {
    return null;
  }
  const start = open.index + open[0].length;
  const close = body.indexOf('</slot>', start);
  return close === -1 ? '' : removeAll(body.slice(start, close), /<!--[\s\S]*?-->/g).trim();
};

/**
 * Wrapper snippets that may replace a component default with nothing, and why
 * that is accepted. An exemption that is merely absent is indistinguishable
 * from one nobody noticed, which is the failure this whole file exists to stop.
 */
const KNOWN_LOST_DEFAULTS = new Map([
  [
    'Table.wc.svelte:paginatorSlot',
    "Table's default here is a whole Pagination subtree rather than an icon, and gating the " +
      'snippet on assigned light-DOM content restored the default but stopped host content ' +
      'reaching the slot at all. Recorded as unfinished rather than shipped half working: ' +
      'through <sui-table> the built-in paginator cannot render.'
  ]
]);

// ---- Rule 2: no parameterized snippet bridged to a slot --------------------
for (const file of wrappers) {
  const text = read(join(WC_DIR, file));
  const bridged = bridgedSnippets(text);
  if (bridged.length === 0) {
    continue;
  }
  // Which component does this wrapper wrap? Its own import says so.
  const source = /from\s+'\$lib\/([A-Za-z0-9]+)\//.exec(text);
  if (source === null) {
    continue;
  }
  const params = parameterized(source[1]);
  for (const snippet of bridged) {
    // `has` rather than comparing the value: the repo bans the `undefined`
    // literal, and asking the map whether it holds the key is the clearer
    // question anyway.
    if (!params.has(snippet.name) || snippet.params !== '') {
      continue;
    }
    const args = params.get(snippet.name);
    errors.push({
      file: `src/wc/components/${file}`,
      line: snippet.line,
      rule: 'parameterized-snippet-bridged-to-slot',
      detail: `\`${snippet.name}\` is declared as Snippet<[${args}]> on ${source[1]}, so it is called WITH arguments. A <slot> projects markup and cannot receive them, but this wrapper declares it with an EMPTY parameter list and bridges it straight to a <slot>, which projects markup and cannot carry arguments. ${args} is dropped with nothing to catch it.`,
      fix:
        `if ${snippet.name} is useless without its arguments, drop the bridge and leave it a ` +
        'JS-property-only prop (see PieChart.wc.svelte tooltipSnippet, which renders nothing ' +
        `meaningful without its slice). If ${snippet.name} is still useful without them, name the ` +
        'parameters and render a property-assigned snippet WITH them, keeping the <slot> as the ' +
        'fallback (see Menu.wc.svelte trigger). Do NOT simply delete a working slot: that breaks ' +
        'every consumer whose markup targets it, at runtime, with no error and no type change.'
    });
  }
}

// ---- Rule 3: a wrapper snippet must not silently drop a component default --
for (const file of wrappers) {
  const text = read(join(WC_DIR, file));
  const source = /from\s+'\$lib\/([A-Za-z0-9]+)\//.exec(text);
  if (source === null) {
    continue;
  }
  const component = read(join(ROOT, 'src/lib', source[1], `${source[1]}.svelte`));
  // A $host() guard claims the snippet only when content was really slotted,
  // which is the other correct shape besides slot fallback content.
  const hostGuarded = /\$host\(\)\.querySelector/.test(text);
  for (const m of text.matchAll(/\{#snippet\s+(\w+)\s*\(/g)) {
    const name = m[1];
    const gate = component.indexOf(`{#if typeof ${name} === 'function'`);
    if (gate === -1 || !hasOwnElse(component, gate)) {
      continue;
    }
    const end = text.indexOf('{/snippet}', m.index);
    const fallback = slotFallback(end === -1 ? '' : text.slice(m.index, end));
    if (fallback === null || fallback.length > 0 || hostGuarded) {
      continue;
    }
    if (KNOWN_LOST_DEFAULTS.has(`${file}:${name}`)) {
      continue;
    }
    errors.push({
      file: `src/wc/components/${file}`,
      line: text.slice(0, m.index).split('\n').length,
      rule: 'component-default-replaced-by-empty-slot',
      detail: `${source[1]} renders its own fallback for \`${name}\` when the prop is absent, but this wrapper always supplies the snippet and fills it with a bare <slot> carrying no fallback content. The gate is therefore always true, and a consumer who slots nothing gets NOTHING where the component's default used to be.`,
      fix: `carry the default as the slot's fallback content (see Checkbox.wc.svelte), guard with $host().querySelector('[slot="…"]') (see PieChart.wc.svelte), or add a reasoned entry to KNOWN_LOST_DEFAULTS`
    });
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} custom-element contract violation(s):\n`);
  for (const e of errors) {
    console.error(`  ${e.file}${typeof e.line === 'number' ? `:${e.line}` : ''}  [${e.rule}]`);
    console.error(`    ${e.detail}`);
    console.error(`    fix: ${e.fix}\n`);
  }
  process.exit(1);
}

const bridgeCount = wrappers.reduce((n, f) => n + bridgedSnippets(read(join(WC_DIR, f))).length, 0);
console.log(`0 custom-element contract violations across ${wrappers.length} wrappers.`);
console.log(
  `  ${KNOWN_LOST_DEFAULTS.size} wrapper snippet(s) allowed to drop a component default, each with a stated reason.`
);
console.log(`  all ${wrappers.length} imported by src/wc/index.ts, so every define() runs.`);
console.log(
  `  ${bridgeCount} snippet-to-slot bridges, none dropping a parameterized snippet's arguments.`
);
console.log('  NOT checked — a pass here says nothing about these:');
for (const shape of [
  'whether a bridged slot name matches what the docs tell a consumer to write',
  'a snippet that NAMES its parameters and then ignores them (needs dataflow, not a regex)',
  'a wrapper snippet that overrides the component’s own {:else} default',
  'props declared on the wrapper but absent from the component (that is scripts/wc-parity)',
  'anything about how the element behaves once it is defined'
]) {
  console.log(`    - ${shape}`);
}
