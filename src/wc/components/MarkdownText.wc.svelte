<svelte:options
  customElement={{
    tag: 'sui-markdown-text',
    shadow: 'open',
    props: {
      markdown: { type: 'String' },
      breaks: { type: 'Boolean' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      tableLabel: { type: 'String', attribute: 'table-label' },
      tableWrapperClass: { type: 'String', attribute: 'table-wrapper-class' },
      sanitize: { type: 'Object' },
      unwrapFence: { type: 'Boolean', attribute: 'unwrap-fence' }
    }
  }}
/>

<script lang="ts">
  import MarkdownText from '$lib/MarkdownText/MarkdownText.svelte';
  let props = $props();
</script>

<MarkdownText markdown="" {...props} />

<style>
  /* A custom element defaults to `display: inline`, which has no definite
     width for a percentage to resolve against -- so a component sizing itself
     with `width: 100%` resolved against the wrong ancestor, and layout depended
     on the consumer's surrounding markup rather than on the component. The value
     matches this component's own root element (block-level), and is a token so a
     consumer can change it without reaching inside the shadow root -- which they
     could not do, since a stylesheet cannot add a rule there. */
  :host {
    display: var(--sui-markdown-text-display, block);
  }
</style>
