<svelte:options
  customElement={{
    tag: 'sui-theme-switcher',
    shadow: 'open',
    props: {
      options: { type: 'Object' },
      value: { type: 'String', reflect: true },
      mode: { type: 'String', reflect: true },
      storageKey: { type: 'String', reflect: true, attribute: 'storage-key' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import ThemeSwitcher from '$lib/ThemeSwitcher/ThemeSwitcher.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchange is this element's ONLY callback prop, and it collides with
  // HTMLElement's own onchange accessor with no exception recorded for
  // 'sui-theme-switcher:onchange' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so
  // dispatchEvents intentionally returns nothing for it. It stays callback-only:
  // `themeSwitcher.onchange = fn` still runs `fn(value)` exactly as before, but no
  // synthetic 'change' event is ever dispatched. Called anyway, on every wrapper, rather
  // than special-cased away: proves the collision guard produces this no-op instead of
  // assuming it.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!--
  No named slot, deliberately. The `icon?: Snippet` in ThemeSwitcher/properties.ts is a
  field of `ThemeSwitcherOption`, not of `ThemeSwitcherProperties`: it is per-option data
  carried in the `options` array, and the component reads it as `option.icon`. A named
  slot cannot express it -- slot names are collected statically by the compiler, so
  `slot="icon-{option.value}"` has no spelling here, and one shared name would reach only
  the first option because the DOM assigns light-DOM children to the first matching slot
  only. Omitting `icon` already yields a built-in sun/moon/monitor glyph per option, so
  the gap is a customisation one, not a blank control. Per-option icons stay Svelte-only.
-->
<ThemeSwitcher {...props} {...dispatchers} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (inline-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-theme-switcher-display, inline-block);
  }
</style>
