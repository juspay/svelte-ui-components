<svelte:options
  customElement={{
    tag: 'sui-radio',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      checked: { type: 'Boolean', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Radio from '$lib/Radio/Radio.svelte';
  let props = $props();
</script>

<Radio {...props} />
