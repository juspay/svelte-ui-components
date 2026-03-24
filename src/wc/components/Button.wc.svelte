<svelte:options
  customElement={{
    tag: 'sui-button',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      enable: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      showProgressBar: { type: 'Boolean', reflect: true, attribute: 'show-progress-bar' },
      showLoader: { type: 'Boolean', reflect: true, attribute: 'show-loader' },
      loaderType: { type: 'String', reflect: true, attribute: 'loader-type' },
      type: { type: 'String', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      ariaLabel: { type: 'String', reflect: true, attribute: 'aria-label' },
      ariaExpanded: { type: 'Boolean', attribute: 'aria-expanded' },
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
