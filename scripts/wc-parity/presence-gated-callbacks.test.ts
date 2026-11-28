import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOST_EVENT_HANDLER_PROPS } from './host-event-handler-props.js';
import { DISPATCH_COLLISION_EXCEPTIONS } from './dispatch-collision-exceptions.js';
import { PRESENCE_GATED_CALLBACKS } from './presence-gated-callbacks.js';
import { readComponentImplementation, wrappedComponentPath } from './prop-parity.js';
import { REPO_SCAN_TIMEOUT_MS } from '../migrate/repo-scan-timeout.ts';

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

const WC = join(process.cwd(), 'src', 'wc', 'components');

function derivedRegistry(): ReadonlySet<string> {
  const derived = new Set<string>();
  for (const file of readdirSync(WC).filter((file) => file.endsWith('.wc.svelte'))) {
    const wrapper = readFileSync(join(WC, file), 'utf8');
    if (!wrapper.includes('dispatchEvents')) {
      continue;
    }
    const tagMatch = /tag:\s*'([^']+)'/.exec(wrapper);
    if (tagMatch === null) {
      continue;
    }
    const tag = tagMatch[1];
    const component = wrappedComponentPath(wrapper);
    if (component === null) {
      continue;
    }
    const implementation = readComponentImplementation(component);
    const props = new Set(
      [...implementation.source.matchAll(/typeof (on[a-zA-Z]+) === 'function'/g)]
        .map((match) => match.at(1) ?? '')
        .filter((prop) => !implementation.supplied.has(prop))
    );
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
  it(
    'lists every callback whose presence a component reads, and nothing else',
    () => {
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
    },
    REPO_SCAN_TIMEOUT_MS
  );

  it(
    're-derives a non-empty set, so a silent scan failure cannot pass this file',
    () => {
      // Both assertions above are satisfied by two empty sets. If the scan ever stops
      // finding files -- a moved directory, a renamed extension -- it would report
      // agreement while measuring nothing.
      expect(derivedRegistry().size).toBeGreaterThan(20);
    },
    REPO_SCAN_TIMEOUT_MS
  );
});
