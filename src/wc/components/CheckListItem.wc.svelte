<svelte:options
  customElement={{
    tag: 'sui-check-list-item',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      checked: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      classes: { type: 'String' },
      testId: { type: 'String', attribute: 'test-id' },
      onclick: { type: 'Object' },
      checkboxLabel: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import CheckListItem from '$lib/CheckListItem/CheckListItem.svelte';
  let props = $props();
</script>

<CheckListItem {...props}>
  {#snippet checkboxLabel()}
    <!-- Mirrors CheckListItem.svelte's checkboxLabel fallback:
         <span class="text" class:checked>{text}</span> -->
    <slot name="checkbox-label">
      <span class="text" class:checked={props.checked}>{props.text}</span>
    </slot>
  {/snippet}
</CheckListItem>
