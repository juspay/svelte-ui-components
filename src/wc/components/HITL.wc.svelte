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
  // `title` is mandatory on HITL, so the renamed element property is too -- the same
  // claim `Omit<HITLProperties, 'title'>` already makes about `confirmationId`.
  let {
    hITLTitle,
    ...props
  }: Omit<HITLProperties, 'title'> & {
    hITLTitle: HITLProperties['title'];
  } = $props();
</script>

<!-- `children` is intentionally NOT declared above: it is a reserved custom-
     element prop name (declaring it breaks `element.children`, see
     scripts/wc-parity/prop-parity.ts's HOST_RESERVED_PROPS), and unlike
     Status.wc.svelte this component's `{#if children}` branch itself creates
     a wrapping element — unconditionally forwarding a `<slot>` snippet here
     would render that wrapper empty for every web-component consumer, the
     same tradeoff ChatHeader/StatCard's wrappers already opted out of. -->
<HITL {...props} title={hITLTitle} />
