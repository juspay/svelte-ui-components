import { HOST_EVENT_HANDLER_PROPS } from '../../scripts/wc-parity/host-event-handler-props';
import {
  CALLBACK_PROP_PATTERN,
  DISPATCH_COLLISION_EXCEPTIONS
} from '../../scripts/wc-parity/dispatch-collision-exceptions';
import { PRESENCE_GATED_CALLBACKS } from '../../scripts/wc-parity/presence-gated-callbacks';

/**
 * A declared callback prop dispatches `hostEl.dispatchEvent(new CustomEvent(...))`
 * under its own name (the prop name with a leading "on" stripped) so that a consumer who
 * only calls `addEventListener` -- and never touches the JS property -- still sees
 * something. It does this IF AND ONLY IF that lowercase name is absent from
 * `HOST_EVENT_HANDLER_PROPS`: declaring e.g. `onclick` makes Svelte install an own
 * accessor on the element's prototype that permanently shadows `HTMLElement.prototype`'s
 * inherited one (`define_property` in svelte/internal/client/dom/elements/custom-element.js
 * runs once per declared prop at class-definition time, regardless of whether any
 * instance ever sets it), and if the element ALSO dispatched a synthetic `click` while a
 * real composed click already bubbles out of the shadow root, a single
 * `addEventListener('click', ...)` registration would receive both -- ordinary DOM
 * double-delivery, not a Svelte-specific quirk. So a colliding name stays callback-only.
 *
 * Calling the consumer's own callback is untouched by any of this: the wrapper below
 * still calls it, with its original arguments, whether or not the event also dispatches.
 */

/**
 * CALLBACK_PROP_PATTERN and DISPATCH_COLLISION_EXCEPTIONS live in
 * scripts/wc-parity/dispatch-collision-exceptions.ts, not here, because
 * scripts/wc-parity/prop-parity.ts's gate needs to read the exact same
 * constants to cross-check what wrappers declare -- and that program's tsconfig
 * carries no DOM lib, which this file's own `HTMLElement`/`CustomEvent` usage would
 * violate if the gate imported this module directly. See that file's header for
 * the full reasoning (the same one host-event-handler-props.ts already documents).
 */

/**
 * Names a 2- or 3-argument callback's own arguments, so `detail` bundles them under
 * the names the *component* gave them (properties.ts) rather than a per-wrapper guess.
 * Keyed by `<tag>:<prop>`, same reasoning as DISPATCH_COLLISION_EXCEPTIONS above. A
 * callback with 2 or 3 arguments and no entry here falls back to a positional array
 * (see eventDetail) instead of inventing names nobody wrote down.
 */
const CALLBACK_ARGUMENT_NAMES: Readonly<Record<string, readonly string[]>> = {
  // ToolCallLog.svelte: onchipclick?.(index, chip) -- properties.ts's own parameter names.
  'sui-tool-call-log:onchipclick': ['index', 'chip'],
  // Gallery.svelte: onimageclick?.(index, event), oneditclick?.(index, event),
  // ondeleteclick?.(index, event) -- properties.ts's own parameter names.
  'sui-gallery:onimageclick': ['index', 'event'],
  'sui-gallery:oneditclick': ['index', 'event'],
  'sui-gallery:ondeleteclick': ['index', 'event'],
  // Chat.svelte: onsend?.(value, attachments), onsuggestion?.(value, index),
  // onfeedback?.(value, message) -- properties.ts's own parameter names.
  'sui-chat:onsend': ['value', 'attachments'],
  'sui-chat:onsuggestion': ['value', 'index'],
  'sui-chat:onfeedback': ['value', 'message'],
  // ChatMessageList.svelte: onfeedback?.(value, message) -- properties.ts's own
  // parameter names.
  'sui-chat-message-list:onfeedback': ['value', 'message'],
  // ChipInput.svelte: onedit?.(value, previousValue) -- properties.ts's own
  // parameter names.
  'sui-chip-input:onedit': ['value', 'previousValue'],
  // Table.svelte: onrowclick?.(rowIndex, rowData, originalIndex), onsort?.(columnIndex,
  // direction) -- properties.ts's own parameter names.
  'sui-table:onrowclick': ['rowIndex', 'rowData', 'originalIndex'],
  'sui-table:onsort': ['columnIndex', 'direction']
};

type Dispatcher = (...args: readonly unknown[]) => void;

/**
 * Every prop name Svelte declared for this element, set or not. `$props()` only
 * enumerates keys a consumer actually assigned (an unset declared prop is absent from
 * `Object.keys`, confirmed empirically), but Svelte's custom-element layer installs a
 * get/set pair for every declared prop directly on the generated class's prototype at
 * class-definition time (`define_property`).
 *
 * That prototype is not always `hostEl`'s IMMEDIATE prototype, though: a wrapper that
 * passes `extend` (see form-associated.ts, used by Checkbox and other form controls)
 * registers a subclass one level below it, so the declared props sit one prototype
 * level further up than `Object.getPrototypeOf(hostEl)` -- confirmed empirically
 * (`sui-checkbox`'s own `onclick` accessor showed up only at that second level, not
 * the first). So this walks the whole chain, stopping at `HTMLElement.prototype`:
 * every declared prop lives strictly below it, and the native accessors it and its
 * own ancestors carry (`onclick`, `onabort`, ...) are exactly what must NOT be
 * swept in here, since they were never declared by Svelte and every own name at
 * or above that point belongs to the platform, not to this element.
 *
 * Exported for one reason: it is the only part of this file a test can observe
 * for an element whose ONLY callback collides. Radio is that case -- `onchange`
 * is its single callback, and a colliding name is correctly never dispatched, so
 * "no event fired" is equally what a completely unwired element produces. The
 * behavioural assertion cannot tell those apart, and a test that cannot fail is
 * the defect this repo keeps finding. Asserting that the walk SEES `onchange`
 * through the subclass `extend` inserts is the assertion with teeth: it is
 * exactly what a shallow one-level walk got wrong, and it fails if that
 * regresses.
 */
export function declaredCallbackPropNames(hostEl: HTMLElement): readonly string[] {
  const names = new Set<string>();
  let proto: unknown = Object.getPrototypeOf(hostEl);
  while (typeof proto === 'object' && proto !== null && proto !== HTMLElement.prototype) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (CALLBACK_PROP_PATTERN.test(name)) {
        names.add(name);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }
  return Array.from(names);
}

/**
 * `detail` carries the callback's own argument(s), unchanged: none for a 0-argument
 * callback (LottiePlayer's existing events carry none, so a key that is always present
 * but always empty would be a visible change for them), the bare value for one argument,
 * and a plain object -- named via CALLBACK_ARGUMENT_NAMES -- for two or three.
 */
function eventDetail(tag: string, propName: string, args: readonly unknown[]): CustomEventInit {
  if (args.length === 0) {
    return { bubbles: true, composed: true };
  }
  if (args.length === 1) {
    return { bubbles: true, composed: true, detail: args[0] };
  }
  const names = CALLBACK_ARGUMENT_NAMES[`${tag}:${propName}`];
  if (!Array.isArray(names) || names.length !== args.length) {
    return { bubbles: true, composed: true, detail: args };
  }
  const detail: Record<string, unknown> = {};
  names.forEach((argName, index) => {
    detail[argName] = args[index];
  });
  return { bubbles: true, composed: true, detail };
}

/**
 * Wraps every declared, non-colliding callback prop so that dispatching a DOM event
 * does not depend on the consumer having set a callback at all -- `addEventListener` is
 * the whole point, and a listener-only consumer never sets the property. The returned
 * record holds ONLY the wrapped keys (not a copy of the rest of `props`), so a wrapper
 * spreads it AFTER `{...props}` in the template --
 * `<Component {...props} {...dispatchEvents(hostEl, props)} />` -- the same "plain
 * props spread, then the handled ones win" shape LottiePlayer.wc.svelte already used
 * for `oncomplete`/`onerror` before this helper existed. Spreading `props` itself stays
 * untouched and reactive; only the small, stable set of wrapper functions is added.
 *
 * Each wrapper function reads `props[name]` at CALL time, not here at wrap time, so it
 * always forwards to whatever the consumer currently has assigned (including "nothing")
 * -- the consumer's own callback still fires, with its original arguments, exactly as
 * before. A prop the consumer never set does not make one appear: `props[name]` is
 * simply not a function, so the `typeof` check below skips the call, and only the
 * dispatch happens.
 */
export function dispatchEvents(
  hostEl: HTMLElement,
  props: Readonly<Record<string, unknown>>
): Readonly<Record<string, Dispatcher>> {
  const tag = hostEl.tagName.toLowerCase();
  const dispatchers: Record<string, Dispatcher> = {};
  for (const name of declaredCallbackPropNames(hostEl)) {
    const collides = HOST_EVENT_HANDLER_PROPS.has(name);
    if (collides && !DISPATCH_COLLISION_EXCEPTIONS.has(`${tag}:${name}`)) {
      // Stays callback-only: dispatching a same-named event here is the exact
      // double-delivery / shadowed-accessor risk HOST_EVENT_HANDLER_PROPS records.
      continue;
    }
    // A prop whose PRESENCE the component reads gets a dispatcher only once the
    // consumer has actually assigned the callback. An unconditional one is still a
    // function, and `typeof <prop> === 'function'` inside the component would read it
    // as "the consumer wired this" -- switching on controls nobody asked for and
    // replacing built-in behaviour that nothing was there to replace. See
    // presence-gated-callbacks.ts for the full list and what each one decides.
    //
    // This read is why callers must wrap the call in `$derived` (every wrapper does):
    // `props` is a reactive proxy, so re-running on assignment is what makes a
    // late-assigned callback appear here rather than being missed for good.
    if (PRESENCE_GATED_CALLBACKS.has(`${tag}:${name}`) && typeof props[name] !== 'function') {
      continue;
    }
    const eventName = name.slice(2);
    dispatchers[name] = (...args: readonly unknown[]): void => {
      const original = props[name];
      if (typeof original === 'function') {
        Reflect.apply(original, null, args);
      }
      hostEl.dispatchEvent(new CustomEvent(eventName, eventDetail(tag, name, args)));
    };
  }
  return dispatchers;
}
