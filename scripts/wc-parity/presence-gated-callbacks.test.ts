import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOST_EVENT_HANDLER_PROPS } from './host-event-handler-props.js';
import { DISPATCH_COLLISION_EXCEPTIONS } from './dispatch-collision-exceptions.js';
import { PRESENCE_GATED_CALLBACKS } from './presence-gated-callbacks.js';

/**
 * Keeps PRESENCE_GATED_CALLBACKS honest by re-deriving it from source.
 *
 * The registry decides whether a component is told a callback exists (see
 * src/wc/dispatch.ts). A missing entry is not a lint nit: it silently switches on a
 * control the consumer never wired, or replaces built-in behaviour with nothing. A
 * stale entry is the opposite -- an event that should fire and does not. Both are
 * invisible at runtime, so neither may be discovered by a person reading the list.
 *
 * This asserts set equality in both directions, which is what makes the list a
 * measurement rather than a note. It re-derives with the same two exclusions
 * dispatchEvents applies, so the two cannot disagree about which props even get a
 * dispatcher.
 */

const LIB = join(process.cwd(), 'src', 'lib');
const WC = join(process.cwd(), 'src', 'wc', 'components');

const svelteFilesUnder = (dir: string): readonly string[] =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return svelteFilesUnder(full);
    }
    return entry.endsWith('.svelte') ? [full] : [];
  });

/** Every `typeof onX === 'function'` in src/lib, keyed by component name. */
function presenceChecksByComponent(): ReadonlyMap<string, ReadonlySet<string>> {
  const found = new Map<string, Set<string>>();
  for (const file of svelteFilesUnder(LIB)) {
    const source = readFileSync(file, 'utf8');
    const component = file.slice(file.lastIndexOf('/') + 1, -'.svelte'.length);
    for (const match of source.matchAll(/typeof (on[a-zA-Z]+) === 'function'/g)) {
      if (!found.has(component)) {
        found.set(component, new Set());
      }
      found.get(component)?.add(match[1]);
    }
  }
  return found;
}

function derivedRegistry(): ReadonlySet<string> {
  const checks = presenceChecksByComponent();
  const derived = new Set<string>();
  for (const [component, props] of checks) {
    let wrapper: string;
    try {
      wrapper = readFileSync(join(WC, `${component}.wc.svelte`), 'utf8');
    } catch {
      // No custom element for this component, so nothing is ever dispatched for it.
      continue;
    }
    if (!wrapper.includes('dispatchEvents')) {
      continue;
    }
    const tagMatch = /tag:\s*'([^']+)'/.exec(wrapper);
    if (tagMatch === null) {
      continue;
    }
    const tag = tagMatch[1];
    for (const prop of props) {
      // Only a prop the wrapper actually declares reaches dispatchEvents at all.
      if (new RegExp(`^\\s*${prop}\\s*:\\s*\\{`, 'm').test(wrapper) === false) {
        continue;
      }
      // A colliding name is already callback-only, so its presence never changed.
      if (
        HOST_EVENT_HANDLER_PROPS.has(prop) &&
        !DISPATCH_COLLISION_EXCEPTIONS.has(`${tag}:${prop}`)
      ) {
        continue;
      }
      derived.add(`${tag}:${prop}`);
    }
  }
  return derived;
}

describe('PRESENCE_GATED_CALLBACKS', () => {
  it('lists every callback whose presence a component reads, and nothing else', () => {
    const derived = derivedRegistry();
    const missing = [...derived].filter((key) => !PRESENCE_GATED_CALLBACKS.has(key)).sort();
    const stale = [...PRESENCE_GATED_CALLBACKS].filter((key) => !derived.has(key)).sort();

    expect(
      missing,
      "a component reads this callback's presence but dispatch.ts still passes an " +
        'unconditional dispatcher for it, so the check is permanently true -- add it to ' +
        'PRESENCE_GATED_CALLBACKS'
    ).toEqual([]);
    expect(
      stale,
      'listed as presence-gated, but no component reads its presence any more -- remove it ' +
        'so the event fires for listener-only consumers again'
    ).toEqual([]);
  });

  it('re-derives a non-empty set, so a silent scan failure cannot pass this file', () => {
    // Both assertions above are satisfied by two empty sets. If the scan ever stops
    // finding files -- a moved directory, a renamed extension -- it would report
    // agreement while measuring nothing.
    expect(derivedRegistry().size).toBeGreaterThan(20);
  });
});
