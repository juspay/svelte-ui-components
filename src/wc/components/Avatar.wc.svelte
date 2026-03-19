<svelte:options
  customElement={{
    tag: 'sui-avatar',
    shadow: 'open',
    props: {
      alt: { type: 'String', reflect: true },
      src: { type: 'String', reflect: true },
      name: { type: 'String', reflect: true },
      size: { type: 'String', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      onclick: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Avatar from '$lib/Avatar/Avatar.svelte';
  let props = $props();
</script>

<Avatar {...props} />
