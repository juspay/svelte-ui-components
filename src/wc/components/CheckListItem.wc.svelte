<svelte:options
  customElement={{
    tag: 'sui-check-list-item',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      checked: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      classes: { type: 'String' },
      testId: { type: 'String' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import CheckListItem from '$lib/CheckListItem/CheckListItem.svelte';
  let props = $props();
</script>

<CheckListItem {...props}>
  {#snippet checkboxLabel()}
    <slot name="checkbox-label"></slot>
  {/snippet}
</CheckListItem>
