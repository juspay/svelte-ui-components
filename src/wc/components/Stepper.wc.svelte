<svelte:options
  customElement={{
    tag: 'sui-stepper',
    shadow: 'open',
    props: {
      steps: { type: 'Object' },
      currentStepIndex: { type: 'Number', reflect: true, attribute: 'current-step-index' },
      orientation: { type: 'String', reflect: true },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      suppressRoleAndTabindex: { type: 'Boolean', attribute: 'suppress-role-and-tabindex' },
      suppressContainerTestId: { type: 'Boolean', attribute: 'suppress-container-test-id' },
      onhandlestepclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Stepper from '$lib/Stepper/Stepper.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onhandlestepclick does not collide with a native HTMLElement handler, so it
  // dispatches 'handlestepclick' with detail: the callback's own { selectedIndex } object
  // (Stepper/properties.ts's own onhandlestepclick?.(event) shape) for a consumer who only
  // calls addEventListener.
  //
  // `onstepclick` used to be declared here too and is now gone. It was
  // `onhandlestepclick`'s pre-v2 alias (docs/EVENT_CASING_MIGRATION.md,
  // scripts/migrate/casing.ts); 4.0.0 deleted it from StepperProperties, and this
  // wrapper went on declaring it. Because the component destructures only the
  // canonical name and this wrapper spreads `{...props}`, `el.onstepclick = fn`
  // returned an accessor, took the function and dropped it -- no error, no warning,
  // no callback. Every Svelte test still passed, because from the Svelte side the
  // prop simply did not exist. The reverse-direction spec in
  // scripts/wc-parity/prop-parity.test.ts ("declares nothing the wrapped component
  // cannot receive") is what now catches this class.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  No named slot, deliberately. The two `badge?: Snippet` declarations in
  Stepper/properties.ts belong to `Step` (an entry in the `steps` array) and to
  `StepProperties` (the inner Step component's own props) -- `StepperProperties` has no
  snippet prop at all. A badge is therefore per-step data, and a named slot cannot
  express it: slot names are collected statically by the compiler, so there is no
  spelling for "the badge of whichever step this is", and a single shared name would
  reach only the first step because the DOM assigns light-DOM children to the first
  matching slot only. Per-step badges stay Svelte-only.
-->
<Stepper {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-stepper-display, block);
  }
</style>
