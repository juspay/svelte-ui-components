<svelte:options
  customElement={{
    tag: 'sui-icon',
    shadow: 'open',
    props: {
      icon: { type: 'String', reflect: true },
      svg: { type: 'String', reflect: true },
      text: { type: 'String', reflect: true },
      classes: { type: 'String' },
      onclick: { type: 'Object' },
      onkeydown: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' }
    }
  }}
/>

<script lang="ts">
  import Icon from '$lib/Icon/Icon.svelte';
  let props = $props();
</script>

<Icon {...props} />
