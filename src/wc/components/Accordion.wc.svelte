<svelte:options
  customElement={{
    tag: 'sui-accordion',
    shadow: 'open',
    props: {
      expand: { type: 'Boolean', reflect: true },
      classes: { type: 'String' },
      triggerClasses: { type: 'String', attribute: 'trigger-classes' },
      testId: { type: 'String', attribute: 'test-id' },
      panelId: { type: 'String', attribute: 'panel-id' },
      trigger: { type: 'Object' },
      ontoggle: { type: 'Object' },
      disabled: { type: 'Boolean', reflect: true, attribute: 'disabled' }
    }
  }}
/>

<script lang="ts">
  import Accordion from '$lib/Accordion/Accordion.svelte';
  let props = $props();
</script>

<Accordion {...props}>
  {#snippet children()}
    <slot></slot>
  {/snippet}
</Accordion>
