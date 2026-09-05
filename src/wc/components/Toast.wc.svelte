<svelte:options
  customElement={{
    tag: 'sui-toast',
    shadow: 'open',
    props: {
      duration: { type: 'Number', reflect: true },
      leftIcon: { type: 'String', reflect: true, attribute: 'left-icon' },
      message: { type: 'String', reflect: true },
      subtext: { type: 'String', reflect: true },
      rightIcon: { type: 'String', reflect: true, attribute: 'right-icon' },
      type: { type: 'String', reflect: true },
      direction: { type: 'String', reflect: true },
      overlapPage: { type: 'Boolean', reflect: true, attribute: 'overlap-page' },
      inAnimationOffset: { type: 'Number', attribute: 'in-animation-offset' },
      inAnimationDuration: { type: 'Number', attribute: 'in-animation-duration' },
      outAnimationOffset: { type: 'Number', attribute: 'out-animation-offset' },
      outAnimationDuration: { type: 'Number', attribute: 'out-animation-duration' },
      testId: { type: 'String', attribute: 'test-id' },
      messageTestId: { type: 'String', attribute: 'message-test-id' },
      subTextTestId: { type: 'String', attribute: 'sub-text-test-id' },
      closeIconTestId: { type: 'String', attribute: 'close-icon-test-id' },
      classes: { type: 'String' },
      onToastHide: { type: 'Object' },
      bottomContent: { type: 'Object' },
      ontoasthide: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Toast from '$lib/Toast/Toast.svelte';
  let props = $props();
</script>

<Toast {...props}>
  {#snippet bottomContent()}
    <slot name="bottom-content"></slot>
  {/snippet}
</Toast>
