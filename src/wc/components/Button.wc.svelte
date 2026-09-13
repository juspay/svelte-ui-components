<svelte:options
  customElement={{
    tag: 'sui-button',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      enable: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showProgressBar: { type: 'Boolean', reflect: true, attribute: 'show-progress-bar' },
      showLoader: { type: 'Boolean', reflect: true, attribute: 'show-loader' },
      loaderType: { type: 'String', reflect: true, attribute: 'loader-type' },
      type: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      buttonAriaLabel: { type: 'String', reflect: true, attribute: 'aria-label' },
      buttonAriaExpanded: { type: 'Boolean', attribute: 'aria-expanded' },
      ariaControls: { type: 'String', attribute: 'aria-controls' },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      onkeydown: { type: 'Object' },
      onkeyup: { type: 'Object' },
      onmousedown: { type: 'Object' },
      onmouseup: { type: 'Object' },
      onmouseleave: { type: 'Object' },
      ontouchstart: { type: 'Object' },
      ontouchend: { type: 'Object' },
      variant: { type: 'String', attribute: 'variant' },
      size: { type: 'String', attribute: 'size' },
      iconOnly: { type: 'Boolean', attribute: 'icon-only' },
      fullWidth: { type: 'Boolean', attribute: 'full-width' },
      href: { type: 'String', attribute: 'href' },
      target: { type: 'String', attribute: 'target' },
      rel: { type: 'String', attribute: 'rel' },
      loading: { type: 'Boolean', attribute: 'loading' },
      allowHtml: { type: 'Boolean', attribute: 'allow-html' },
      // Svelte derives the observed attribute by lowercasing the prop name, so
      // without this it listens for `ariahaspopup` and `aria-haspopup="menu"`
      // never arrives. The declared type is a string union widened with boolean;
      // 'Object' would JSON.parse the value and reject `menu` outright.
      ariaHaspopup: { type: 'String', attribute: 'aria-haspopup' },
      icon: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import { dispatchEvents } from '../dispatch';
  let { buttonAriaExpanded, buttonAriaLabel, ...props } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // Every callback prop this element declares (onclick, onkeydown, onkeyup,
  // onmousedown, onmouseup, onmouseleave, ontouchstart, ontouchend) collides with a
  // native HTMLElement handler, with no exception recorded for any 'sui-button:on*'
  // pair in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS -- so dispatchEvents
  // intentionally returns nothing for all eight. Each stays callback-only: the
  // consumer's own handler still runs exactly as before, but no synthetic event is
  // ever dispatched under a name a real, composed DOM event already bubbles out of
  // the shadow root under. Called anyway, rather than skipped: proves the collision
  // guard produces this no-op instead of assuming it.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!-- A property-assigned icon wins; the slot is the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. `children` is
     no longer a declared prop, so the default slot is its only path. -->
<Button {...props} {...dispatchers} ariaLabel={buttonAriaLabel} ariaExpanded={buttonAriaExpanded}>
  {#snippet icon()}
    {#if props.icon}{@render props.icon()}{:else}<slot name="icon"></slot>{/if}
  {/snippet}
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Button>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-button-display, block);
  }
</style>
