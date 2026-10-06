<svelte:options
  customElement={{
    tag: 'sui-menu',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      open: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      transformSvg: { type: 'Object' },
      triggerAriaLabel: { type: 'String', attribute: 'trigger-aria-label' },
      menuAriaLabel: { type: 'String', attribute: 'aria-label' },
      onselect: { type: 'Object' },
      onopen: { type: 'Object' },
      onclose: { type: 'Object' },
      trigger: { type: 'Object' },
      interactiveTrigger: { type: 'Boolean', attribute: 'interactive-trigger' },
      selectedValue: { type: 'String', attribute: 'selected-value' },
      placement: { type: 'String', attribute: 'placement' },
      usePortal: { type: 'Boolean', attribute: 'use-portal' }
    }
  }}
/>

<script lang="ts">
  import Menu from '$lib/Menu/Menu.svelte';
  import type { MenuProperties } from '$lib/Menu/properties';
  import { findInteractive } from '$lib/_interaction/focusable';
  import { dispatchEvents } from '../dispatch';
  // The element renames `ariaLabel` to `menuAriaLabel` because the platform already defines `ariaLabel` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    menuAriaLabel,
    ...props
  }: Omit<MenuProperties, 'ariaLabel'> & { menuAriaLabel?: MenuProperties['ariaLabel'] } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onselect and onclose both collide with native HTMLElement accessors
  // (HOST_EVENT_HANDLER_PROPS: 'select' and 'close' are genuine host events), so
  // dispatchEvents returns nothing for either -- they stay callback-only. onopen
  // does not collide, so it dispatches 'open' for a consumer who only calls
  // addEventListener. The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));

  /**
   * `interactive-trigger` with a slotted control: the single interactive owner is the
   * element the consumer put in the `trigger` slot. A snippet can spread Menu's wiring
   * onto its control, but slotted markup is static and receives nothing, so this does the
   * part that cannot be spread -- it puts `aria-haspopup`/`aria-expanded` on the slotted
   * control itself, which is where assistive technology looks, and restores whatever the
   * consumer had set when the menu is torn down. Click and arrow-key activation arrive by
   * bubbling through the slot to the element this is attached to.
   *
   * The slotted element is often not the control but its host -- a `<sui-button>` renders
   * the native `<button>` in its own shadow tree -- so the control is found through shadow
   * roots, and the host's tree is watched because that button appears a moment after the
   * element is connected, possibly after this runs.
   */
  const adoptSlottedTrigger = (node: HTMLElement, expanded: boolean) => {
    let adopted: HTMLElement | null = null;
    let previous: { haspopup: string | null; expanded: string | null } | null = null;
    let isExpanded = expanded;
    let watched: Element | null = null;
    const renderWatcher = new MutationObserver(() => apply());

    const watch = (slotted: Element | null) => {
      if (slotted === watched) {
        return;
      }
      renderWatcher.disconnect();
      watched = slotted;
      if (slotted === null) {
        return;
      }
      renderWatcher.observe(slotted, { childList: true, subtree: true });
      if (slotted.shadowRoot !== null) {
        renderWatcher.observe(slotted.shadowRoot, { childList: true, subtree: true });
      }
    };

    const release = () => {
      if (adopted === null || previous === null) {
        return;
      }
      for (const [name, value] of [
        ['aria-haspopup', previous.haspopup],
        ['aria-expanded', previous.expanded]
      ] as const) {
        if (value === null) {
          adopted.removeAttribute(name);
        } else {
          adopted.setAttribute(name, value);
        }
      }
      adopted = null;
      previous = null;
    };

    const apply = () => {
      const slotted =
        Array.from(hostEl.children).find((child) => child.getAttribute('slot') === 'trigger') ??
        null;
      watch(slotted);
      const control = slotted === null ? null : findInteractive(slotted, { includeRoot: true });
      if (control !== adopted) {
        release();
        if (control !== null) {
          adopted = control;
          previous = {
            haspopup: control.getAttribute('aria-haspopup'),
            expanded: control.getAttribute('aria-expanded')
          };
        }
      }
      adopted?.setAttribute('aria-haspopup', 'menu');
      adopted?.setAttribute('aria-expanded', String(isExpanded));
    };

    apply();
    node.addEventListener('slotchange', apply);
    return {
      update: (next: boolean) => {
        isExpanded = next;
        apply();
      },
      destroy: () => {
        node.removeEventListener('slotchange', apply);
        renderWatcher.disconnect();
        release();
      }
    };
  };
</script>

<!-- A property-assigned trigger wins; the slot is the fallback. The branch stays
     inside the body snippet so `<slot>` keeps its `$$props` scope. -->
<Menu {...props} {...dispatchers} ariaLabel={menuAriaLabel}>
  {#snippet trigger(triggerProps)}
    {#if props.trigger}
      {@render props.trigger(triggerProps)}
    {:else if props.interactiveTrigger}
      <!-- The slotted control is the interactive element; this span only carries its
           events to Menu. It has no role and no tabindex, so it is not a second stop
           and a keydown here is always one the control itself already received. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <span
        class="slotted-trigger"
        onclick={triggerProps.onclick}
        onkeydown={triggerProps.onkeydown}
        use:adoptSlottedTrigger={triggerProps.ariaExpanded}
      >
        <slot name="trigger"></slot>
      </span>
    {:else}
      <slot name="trigger"></slot>
    {/if}
  {/snippet}
</Menu>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-menu-display, block);
  }

  /* Present only to receive the slotted control's bubbling events; it must not
     become a box of its own and shift the control it wraps. */
  .slotted-trigger {
    display: contents;
  }
</style>
