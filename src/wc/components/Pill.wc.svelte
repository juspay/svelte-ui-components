<svelte:options
  customElement={{
    tag: 'sui-pill',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      dismissible: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      title: { type: 'String', reflect: true },
      leadingIcon: { type: 'Object' },
      dismissIcon: { type: 'Object' },
      dismissLabel: { type: 'String', attribute: 'dismiss-label' },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      ondismiss: { type: 'Object' },
      onDismiss: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Pill from '$lib/Pill/Pill.svelte';
  import closeSvg from '$lib/assets/close.svg?raw';
  let props = $props();
</script>

<Pill {...props}>
  {#snippet leadingIcon()}
    <slot name="leading-icon"></slot>
  {/snippet}
  {#snippet dismissIcon()}
    <slot name="dismiss-icon">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html closeSvg}
    </slot>
  {/snippet}
</Pill>
