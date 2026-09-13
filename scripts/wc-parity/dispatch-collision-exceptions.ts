/**
 * The DOM-free half of the dispatch contract (src/wc/dispatch.ts): which
 * declared props are "callback shaped", and the one escape hatch that lets a
 * colliding name dispatch anyway. Lives here, not in dispatch.ts, for the same
 * reason host-event-handler-props.ts does: src/wc/dispatch.ts is typed against
 * `lib.dom` (it constructs `CustomEvent`s and calls `hostEl.dispatchEvent`), while
 * scripts/wc-parity/prop-parity.ts -- the gate that cross-checks this file's
 * contents against what wrappers actually declare -- is compiled under
 * scripts/wc-parity/tsconfig.json, which carries no DOM lib at all. Neither
 * constant below references a DOM type, so both tsconfig.wc.json and
 * scripts/wc-parity/tsconfig.json check this file without conflict -- the exact
 * shape host-event-handler-props.ts's own header explains at length.
 */

/**
 * Every existing `on*` custom-element prop in this library is spelled with no
 * uppercase letters after the "on" (verified by grep across every `.wc.svelte`
 * file), so this is what tells a callback-shaped prop apart from an ordinary
 * declared prop such as `data` or `classes`, without a per-wrapper list to keep in
 * sync by hand. Shared verbatim between dispatch.ts (which walks a live prototype
 * chain for names matching this) and prop-parity.ts's gate (which filters a
 * wrapper's SOURCE-declared prop names by the same pattern) -- duplicating the
 * regex in both places would let the two silently drift apart.
 */
export const CALLBACK_PROP_PATTERN = /^on[a-z][a-z0-9]*$/;

/**
 * Colliding prop names allowed to dispatch anyway, each with the reason -- the
 * same "recorded and explained, not silently permitted" shape as
 * `KNOWN_LOST_DEFAULTS` in check-wc-contract.js and
 * `KNOWN_HOST_EVENT_HANDLER_DECLARATIONS` in prop-parity.test.ts. Keyed by
 * `<tag>:<prop>` (the custom-element tag, not the wrapper's filename) because
 * dispatch.ts can only read the tag off `hostEl` at runtime, and
 * prop-parity.test.ts's gate cross-checks it against the tags
 * `readCustomElementDeclaration` reads out of source.
 *
 * This is the ONLY place a colliding name is let through `dispatchEvents` --
 * there is no other branch in dispatch.ts that lets one dispatch. Which makes
 * this map's contents, checked in prop-parity.test.ts against
 * `KNOWN_DISPATCH_COLLISION_EXCEPTIONS`, equivalent to the whole "no wrapper
 * dispatches a colliding name except a reviewed one" half of the
 * callback-dispatch rule: growing this map without updating that reviewed
 * list is what the gate catches, not a per-wrapper re-derivation of the same
 * fact.
 */
export const DISPATCH_COLLISION_EXCEPTIONS: ReadonlyMap<string, string> = new Map([
  [
    'sui-lottie-player:onerror',
    "LottiePlayer.wc.svelte dispatched 'error' before the callback-dispatch rule " +
      "existed. 'error' collides with HTMLElement's own onerror accessor, but " +
      'silencing it now would be an existing consumer losing an event they ' +
      'already listen for, not a fix -- so it stays a named, reasoned ' +
      'exception rather than a silent one.'
  ]
]);
