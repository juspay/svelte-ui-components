<svelte:options
  customElement={{
    tag: 'sui-book',
    shadow: 'open',
    props: {
      pages: { type: 'Object' },
      currentPage: { type: 'Number', reflect: true },
      transition: { type: 'String', reflect: true },
      showNavigation: { type: 'Boolean', reflect: true },
      showPageIndicator: { type: 'Boolean', reflect: true },
      enableSwipe: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
      previousIcon: { type: 'Object' },
      nextIcon: { type: 'Object' },
      classes: { type: 'String' },
      onpagechange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Book from '$lib/Book/Book.svelte';
  let props = $props();
</script>

<Book {...props}>
  {#snippet previousIcon()}
    <slot name="previous-icon"></slot>
  {/snippet}
  {#snippet nextIcon()}
    <slot name="next-icon"></slot>
  {/snippet}
</Book>
