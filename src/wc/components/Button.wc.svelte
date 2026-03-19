<svelte:options
  customElement={{
    tag: 'sui-button',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      enable: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showProgressBar: { type: 'Boolean', reflect: true },
      showLoader: { type: 'Boolean', reflect: true },
      loaderType: { type: 'String', reflect: true },
      type: { type: 'String', reflect: true },
      testId: { type: 'String' },
      ariaLabel: { type: 'String', reflect: true },
      ariaExpanded: { type: 'Boolean' },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      onkeyup: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  let props = $props();
</script>

<Button {...props}>
  {#snippet icon()}
    <slot name="icon"></slot>
  {/snippet}
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Button>
