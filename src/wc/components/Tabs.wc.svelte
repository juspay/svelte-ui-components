<svelte:options
  customElement={{
    tag: 'sui-tabs',
    shadow: 'open',
    props: {
      items: { type: 'Object' },
      activeIndex: { type: 'Number', reflect: true, attribute: 'active-index' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      scrollLeftIcon: { type: 'Object' },
      scrollRightIcon: { type: 'Object' },
      classes: { type: 'String' },
      onchange: { type: 'Object' },
      activeKey: { type: 'String', attribute: 'active-key' },
      orientation: { type: 'String', attribute: 'orientation' },
      tab: { type: 'Object' },
      activationMode: { type: 'String', attribute: 'activation-mode' },
      loop: { type: 'Boolean', reflect: true },
      tabsDir: { type: 'String', attribute: 'dir' },
      onkeychange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Tabs from '$lib/Tabs/Tabs.svelte';
  import type { TabsProperties } from '$lib/Tabs/properties';
  import Img from '$lib/Img/Img.svelte';
  import { dispatchEvents } from '../dispatch';
  // Mirrors Tabs.svelte's own scrollLeftIcon/scrollRightIcon defaults, which pick
  // their glyph from `orientation` the same way.
  import chevronLeftSvg from '$lib/assets/chevron-left.svg?raw';
  import chevronRightSvg from '$lib/assets/chevron-right.svg?raw';
  import chevronUpSvg from '$lib/assets/chevron-up.svg?raw';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';

  // `dir` is an accessor on every HTMLElement, so declaring it as a prop would
  // replace the host's own. The ATTRIBUTE keeps its name, which is what a consumer
  // writes: `<sui-tabs dir="rtl">` still sets the host's direction and reaches this.
  let { tabsDir, ...props }: Omit<TabsProperties, 'dir'> & { tabsDir?: TabsProperties['dir'] } =
    $props();

  let isVertical = $derived(props.orientation === 'vertical');

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // onchange collides with HTMLElement's own onchange accessor with no exception
  // recorded for 'sui-tabs:onchange' in ../dispatch.ts's DISPATCH_COLLISION_EXCEPTIONS,
  // so it stays callback-only -- `tabs.onchange = fn` still runs `fn(index, label)`
  // exactly as before, but no synthetic 'change' is dispatched. onkeychange does not
  // collide, so it dispatches 'keychange' with detail: the callback's own key string
  // (Tabs/properties.ts's own onkeychange?.(key) shape) for a consumer who only calls
  // addEventListener.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<Tabs {...props} {...dispatchers} dir={tabsDir}>
  {#snippet scrollLeftIcon()}
    <!--
      A snippet declared here is always a function, so Tabs.svelte's own
      `{#if typeof scrollLeftIcon === 'function'} ... {:else}...{/if}` would always take
      the true branch and never show its default chevron. Native slot fallback content
      renders exactly when the host assigns nothing, restoring it.
    -->
    <slot name="scroll-left-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html isVertical ? chevronUpSvg : chevronLeftSvg}
    </slot>
  {/snippet}
  {#snippet scrollRightIcon()}
    <slot name="scroll-right-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html isVertical ? chevronDownSvg : chevronRightSvg}
    </slot>
  {/snippet}
  {#snippet tab({ label, index, active, icon, status })}
    <!--
      `tab` takes parameters, so a named <slot> cannot forward them the way a snippet
      call does -- there is no platform equivalent of passing arguments through a slot.
      The attribute-forwarding slot below was already inert before this fix (a named
      slot exposes attributes to a <slot> assigned via `slot="tab"`, not through
      `{@render}` params) and is left as-is; what this fix adds is fallback content that
      mirrors Tabs.svelte's own {:else} tab body (icon + label + status dot) using the
      same params this snippet already receives, so a host supplying neither the `tab`
      prop nor slotted content still sees the real default instead of nothing.
    -->
    <slot name="tab" {label} {index} {active}>
      {#if typeof icon === 'string' && icon.length > 0}
        <Img inlineSvg src={icon} alt="" fallback="" classes="tabs-item-icon" />
      {/if}
      <span class="tabs-item-label" data-text={label}>{label}</span>
      {#if status && status !== 'none'}
        <span class="tabs-item-status status-{status}" aria-hidden="true"></span>
      {/if}
    </slot>
  {/snippet}
</Tabs>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-tabs-display, block);
  }
</style>
