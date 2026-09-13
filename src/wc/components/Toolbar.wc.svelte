<svelte:options
  customElement={{
    tag: 'sui-toolbar',
    shadow: 'open',
    props: {
      showBackButton: { type: 'Boolean', reflect: true, attribute: 'show-back-button' },
      text: { type: 'String', reflect: true },
      backIcon: { type: 'String', attribute: 'back-icon' },
      backLabel: { type: 'String', attribute: 'back-label' },
      backHref: { type: 'String', attribute: 'back-href' },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      headingTestId: { type: 'String', attribute: 'heading-test-id' },
      onkeydown: { type: 'Object' },
      leftContent: { type: 'Object' },
      centerContent: { type: 'Object' },
      rightContent: { type: 'Object' },
      additionalContent: { type: 'Object' },
      onbackclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Toolbar from '$lib/Toolbar/Toolbar.svelte';
  import { dispatchEvents } from '../dispatch';

  let props = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onkeydown collides with HTMLElement's own onkeydown accessor with no
  // exception recorded for 'sui-toolbar:onkeydown' in
  // ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS, so it stays callback-only --
  // handleBackKeydown below keeps calling `props.onkeydown` directly, unchanged.
  // onbackclick does not collide, so it dispatches 'backclick' with no detail
  // (onbackclick?.() takes no argument) for a consumer who only calls
  // addEventListener. This wrapper's own leftContent snippet below reimplements
  // Toolbar.svelte's back-button markup (see its comment) rather than letting
  // Toolbar.svelte render its default, so `dispatchers.onbackclick` -- not
  // `props.onbackclick` -- is what the snippet and handleBackKeydown call: the
  // click/Space path Toolbar.svelte itself would have dispatched from never runs
  // here, since `leftContent` is always supplied.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));

  // Mirrors Toolbar.svelte's own handleBackKeydown: Space activates the anchor
  // variant of the back control the same way Enter does natively.
  function handleBackKeydown(event: KeyboardEvent): void {
    props.onkeydown?.(event);
    const hasBackHref = typeof props.backHref === 'string' && props.backHref.length > 0;
    if (hasBackHref && event.key === ' ') {
      event.preventDefault();
      dispatchers.onbackclick?.();
    }
  }
</script>

<Toolbar {...props} {...dispatchers}>
  {#snippet leftContent()}
    <!-- Mirrors Toolbar.svelte's leftContent fallback: the back button/link shown
         when showBackControl is true (showBackButton !== false && backIcon !== null
         && backIcon !== ''). -->
    <slot name="left-content">
      {#if props.showBackButton !== false && props.backIcon !== null && props.backIcon !== ''}
        <svelte:element
          this={typeof props.backHref === 'string' && props.backHref.length > 0 ? 'a' : 'button'}
          type={typeof props.backHref === 'string' && props.backHref.length > 0 ? null : 'button'}
          href={typeof props.backHref === 'string' && props.backHref.length > 0
            ? props.backHref
            : null}
          role={null}
          class="back"
          aria-label={typeof props.backLabel === 'string' && props.backLabel.trim().length > 0
            ? props.backLabel
            : 'Back'}
          onclick={dispatchers.onbackclick}
          onkeydown={handleBackKeydown}
        >
          {#if typeof props.backIcon === 'string'}
            <img src={props.backIcon} alt="" />
          {:else}
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
        </svelte:element>
      {/if}
    </slot>
  {/snippet}
  {#snippet centerContent()}
    <!-- Mirrors Toolbar.svelte's centerContent fallback: <div class="text">{text}</div>,
         shown when `text` is a non-empty string. The `.center-content` wrapper is
         already supplied unconditionally by Toolbar.svelte's function branch. -->
    <slot name="center-content">
      {#if typeof props.text === 'string' && props.text.length > 0}
        <div class="text" data-pw={props.headingTestId} testID={props.headingTestId}>
          {props.text}
        </div>
      {/if}
    </slot>
  {/snippet}
  {#snippet rightContent()}
    <slot name="right-content"></slot>
  {/snippet}
  {#snippet additionalContent()}
    <slot name="additional-content"></slot>
  {/snippet}
</Toolbar>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-toolbar-display, block);
  }
</style>
