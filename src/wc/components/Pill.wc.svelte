<svelte:options
  customElement={{
    tag: 'sui-pill',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      dismissible: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      tone: { type: 'String', attribute: 'tone' },
      as: { type: 'String', reflect: true, attribute: 'as' },
      pillAriaExpanded: { type: 'Boolean', attribute: 'aria-expanded' },
      pillAriaPressed: { type: 'Boolean', attribute: 'aria-pressed' },
      testId: { type: 'String', attribute: 'test-id' },
      pillTitle: { type: 'String', reflect: true, attribute: 'title' },
      leadingIcon: { type: 'Object' },
      dismissIcon: { type: 'Object' },
      dismissLabel: { type: 'String', attribute: 'dismiss-label' },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      ondismiss: { type: 'Object' },
      attrs: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Pill from '$lib/Pill/Pill.svelte';
  import type { PillProperties } from '$lib/Pill/properties';
  import closeSvg from '$lib/assets/close.svg?raw';
  import { dispatchEvents } from '../dispatch';
  // The element renames `title` to `pillTitle` because the platform already defines `title` on every
  // HTMLElement, and `ariaExpanded`/`ariaPressed` for the same reason -- ARIAMixin reflects both as
  // accessors on Element, so declaring them here would replace the platform's own. The attributes
  // are unchanged: `<sui-pill as="button" aria-expanded="true">` works as written. The rest still
  // carries the component's own props -- saying so is what a destructured `$props()` no longer
  // infers on its own.
  let {
    pillTitle,
    pillAriaExpanded,
    pillAriaPressed,
    ...props
  }: Omit<PillProperties, 'title' | 'ariaExpanded' | 'ariaPressed'> & {
    pillTitle?: PillProperties['title'];
    pillAriaExpanded?: PillProperties['ariaExpanded'];
    pillAriaPressed?: PillProperties['ariaPressed'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onclick collides with HTMLElement's own onclick accessor
  // (HOST_EVENT_HANDLER_PROPS), so dispatchEvents returns nothing for it -- it
  // stays callback-only. ondismiss does not collide, so it dispatches 'dismiss'
  // for a consumer who only calls addEventListener. The capture is safe and the
  // warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Pill
  {...props}
  {...dispatchers}
  title={pillTitle}
  ariaExpanded={pillAriaExpanded}
  ariaPressed={pillAriaPressed}
>
  {#snippet leadingIcon()}
    <slot name="leading-icon"></slot>
  {/snippet}
  {#snippet dismissIcon()}
    <slot name="dismiss-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html closeSvg}
    </slot>
  {/snippet}
</Pill>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-pill-display, block);
  }
</style>
