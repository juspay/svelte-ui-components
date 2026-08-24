<svelte:options
  customElement={{
    tag: 'sui-hitl',
    shadow: 'open',
    props: {
      confirmationId: { type: 'String', attribute: 'confirmation-id' },
      title: { type: 'String', reflect: true },
      description: { type: 'String' },
      sections: { type: 'Object' },
      functionArguments: { type: 'Object' },
      hiddenKeys: { type: 'Object' },
      onConfirm: { type: 'Object' },
      confirmLabel: { type: 'String', attribute: 'confirm-label' },
      cancelLabel: { type: 'String', attribute: 'cancel-label' },
      countdownSeconds: { type: 'Number', attribute: 'countdown-seconds' },
      autoCancelSeconds: { type: 'Number', attribute: 'auto-cancel-seconds' },
      isMicMuted: { type: 'Boolean', attribute: 'is-mic-muted' },
      onMicToggle: { type: 'Object' },
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
      classes: { type: 'String' }
    }
  }}
/>

<script lang="ts">
  import HITL from '$lib/HITL/HITL.svelte';
  let props = $props();
</script>

<HITL {...props} />
