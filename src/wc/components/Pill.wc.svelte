<svelte:options
  customElement={{
    tag: 'sui-pill',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      dismissible: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      tone: { type: 'String', attribute: 'tone' },
      testId: { type: 'String', attribute: 'test-id' },
      pillTitle: { type: 'String', reflect: true, attribute: 'title' },
      leadingIcon: { type: 'Object' },
      dismissIcon: { type: 'Object' },
      dismissLabel: { type: 'String', attribute: 'dismiss-label' },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      ondismiss: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Pill from '$lib/Pill/Pill.svelte';
  import type { PillProperties } from '$lib/Pill/properties';
  import closeSvg from '$lib/assets/close.svg?raw';
  // The element renames `title` to `pillTitle` because the platform already defines `title` on every
  // HTMLElement. The rest still carries the component's own props -- saying so is what
  // a destructured `$props()` no longer infers on its own.
  let {
    pillTitle,
    ...props
  }: Omit<PillProperties, 'title'> & { pillTitle?: PillProperties['title'] } = $props();
</script>

<Pill {...props} title={pillTitle}>
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
