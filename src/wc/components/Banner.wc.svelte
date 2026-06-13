<svelte:options
  customElement={{
    tag: 'sui-banner',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      linkText: { type: 'String', reflect: true, attribute: 'link-text' },
      dismissible: { type: 'Boolean', reflect: true },
      visible: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      role: { type: 'String' },
      onclick: { type: 'Object' },
      ondismiss: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Banner from '$lib/Banner/Banner.svelte';
  let props = $props();
</script>

<Banner {...props}>
  {#snippet icon()}
    <slot name="icon"></slot>
  {/snippet}
  {#snippet title()}
    <slot name="title"></slot>
  {/snippet}
  {#snippet rightContent()}
    <slot name="right-content"></slot>
  {/snippet}
  {#snippet dismissIcon()}
    <slot name="dismiss-icon"></slot>
  {/snippet}
</Banner>
