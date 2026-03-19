<svelte:options
  customElement={{
    tag: 'sui-toast',
    shadow: 'open',
    props: {
      duration: { type: 'Number', reflect: true },
      leftIcon: { type: 'String', reflect: true },
      message: { type: 'String', reflect: true },
      subtext: { type: 'String', reflect: true },
      rightIcon: { type: 'String', reflect: true },
      type: { type: 'String', reflect: true },
      direction: { type: 'String', reflect: true },
      overlapPage: { type: 'Boolean', reflect: true },
      inAnimationOffset: { type: 'Number' },
      inAnimationDuration: { type: 'Number' },
      outAnimationOffset: { type: 'Number' },
      outAnimationDuration: { type: 'Number' },
      testId: { type: 'String' },
      messageTestId: { type: 'String' },
      subTextTestId: { type: 'String' },
      closeIconTestId: { type: 'String' },
      classes: { type: 'String' },
      onToastHide: { type: 'Object' }
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
