<svelte:options
  customElement={{
    tag: 'sui-snippet',
    shadow: 'open',
    props: {
      text: { type: 'String', reflect: true },
      prompt: { type: 'String', reflect: true },
      showCopyButton: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      classes: { type: 'String' },
      oncopy: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Snippet from '$lib/Snippet/Snippet.svelte';
  let props = $props();
</script>

<Snippet {...props}>
  {#snippet copyIcon()}
    <slot name="copy-icon"></slot>
  {/snippet}
</Snippet>
