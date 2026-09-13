<svelte:options
  customElement={{
    tag: 'sui-hitl',
    shadow: 'open',
    props: {
      confirmationId: { type: 'String', attribute: 'confirmation-id' },
      hITLTitle: { type: 'String', reflect: true, attribute: 'title' },
      description: { type: 'String' },
      sections: { type: 'Object' },
      functionArguments: { type: 'Object' },
      hiddenKeys: { type: 'Object' },
      confirmLabel: { type: 'String', attribute: 'confirm-label' },
      cancelLabel: { type: 'String', attribute: 'cancel-label' },
      countdownSeconds: { type: 'Number', attribute: 'countdown-seconds' },
      autoCancelSeconds: { type: 'Number', attribute: 'auto-cancel-seconds' },
      isMicMuted: { type: 'Boolean', attribute: 'is-mic-muted' },
      isHistoryMode: { type: 'Boolean', attribute: 'is-history-mode' },
      initialState: { type: 'Object' },
      approvedIcon: { type: 'Object' },
      rejectedIcon: { type: 'Object' },
      badgeLabel: { type: 'String', attribute: 'badge-label' },
      approvedLabel: { type: 'String', attribute: 'approved-label' },
      autoApprovedLabel: { type: 'String', attribute: 'auto-approved-label' },
      rejectedLabel: { type: 'String', attribute: 'rejected-label' },
      expiredLabel: { type: 'String', attribute: 'expired-label' },
      testId: { type: 'String', attribute: 'test-id' },
      confirmTestId: { type: 'String', attribute: 'confirm-test-id' },
      cancelTestId: { type: 'String', attribute: 'cancel-test-id' },
      completionTestId: { type: 'String', attribute: 'completion-test-id' },
      completionTextTestId: { type: 'String', attribute: 'completion-text-test-id' },
      actions: { type: 'Object' },
      classes: { type: 'String' },
      onconfirm: { type: 'Object' },
      onmictoggle: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import HITL from '$lib/HITL/HITL.svelte';
  import type { HITLProperties } from '$lib/HITL/properties';
  import { dispatchEvents } from '../dispatch';
  // `title` is mandatory on HITL, so the renamed element property is too -- the same
  // claim `Omit<HITLProperties, 'title'>` already makes about `confirmationId`.
  let {
    hITLTitle,
    ...props
  }: Omit<HITLProperties, 'title'> & {
    hITLTitle: HITLProperties['title'];
  } = $props();

  // Named hostEl, not host: svelte2tsx confuses a local variable named after a rune's
  // name minus its `$` with the rune itself (sveltejs/svelte#13715), reporting `$host`
  // as used before its declaration.
  const hostEl = $host();

  // Neither onconfirm nor onmictoggle collides with a native HTMLElement
  // handler, so both dispatch -- 'confirm' (detail: the HITLEvent argument) and
  // 'mictoggle' (no detail, onmictoggle takes no argument) -- for a consumer who
  // only calls addEventListener.
  // The capture is safe and the warning does not apply to this shape.
  // `dispatchEvents` never reads a callback here -- each wrapper it returns reads
  // `props[name]` at CALL time (src/wc/dispatch.ts), through this same reactive
  // proxy, so a consumer assigning `el.onfoo = fn` after mount is seen. Reading
  // the value eagerly is exactly what the helper is written not to do.
  // svelte-ignore state_referenced_locally
  const dispatchers = $derived(dispatchEvents(hostEl, props));
</script>

<!-- `children` is intentionally NOT declared above: it is a reserved custom-
     element prop name (declaring it breaks `element.children`, see
     scripts/wc-parity/prop-parity.ts's HOST_RESERVED_PROPS), and unlike
     Status.wc.svelte this component's `{#if children}` branch itself creates
     a wrapping element — unconditionally forwarding a `<slot>` snippet here
     would render that wrapper empty for every web-component consumer, the
     same tradeoff ChatHeader/StatCard's wrappers already opted out of. -->

<!--
  `approvedIcon`/`rejectedIcon` need no guard, unlike `children` above: both render
  inside `.completion-icon`, a `<span>` HITL.svelte already puts on the page
  unconditionally once a response completes, so supplying a snippet here never
  creates a wrapper element that would otherwise not exist. Each `<slot>` below
  carries the exact default SVG HITL.svelte itself falls back to, so an unfilled
  slot still shows the completion glyph instead of leaving `.completion-icon` empty.
-->
{#snippet approvedIconImpl()}
  {#if props.approvedIcon}{@render props.approvedIcon()}{:else}<slot name="approved-icon"
      ><svg viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
        <path
          d="M6 10.2l2.6 2.6L14 7.4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg></slot
    >{/if}
{/snippet}
{#snippet rejectedIconImpl()}
  {#if props.rejectedIcon}{@render props.rejectedIcon()}{:else}<slot name="rejected-icon"
      ><svg viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
        <path d="M6 10h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg></slot
    >{/if}
{/snippet}

<HITL
  {...props}
  {...dispatchers}
  title={hITLTitle}
  approvedIcon={approvedIconImpl}
  rejectedIcon={rejectedIconImpl}
/>

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-hitl-display, block);
  }
</style>
