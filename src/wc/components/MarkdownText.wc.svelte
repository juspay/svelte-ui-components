<svelte:options
  customElement={{
    tag: 'sui-markdown-text',
    shadow: 'open',
    props: {
      markdown: { type: 'String' },
      breaks: { type: 'Boolean' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      tableLabel: { type: 'String', attribute: 'table-label' }
    }
  }}
/>

<script lang="ts">
  import MarkdownText from '$lib/MarkdownText/MarkdownText.svelte';
  let props = $props();
</script>

<MarkdownText markdown="" {...props} />
