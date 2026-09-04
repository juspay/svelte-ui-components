<svelte:options
  customElement={{
    tag: 'sui-book',
    shadow: 'open',
    props: {
      pages: { type: 'Object' },
      currentPage: { type: 'Number', reflect: true, attribute: 'current-page' },
      transition: { type: 'String', reflect: true },
      showNavigation: { type: 'Boolean', reflect: true, attribute: 'show-navigation' },
      showPageIndicator: { type: 'Boolean', reflect: true, attribute: 'show-page-indicator' },
      enableSwipe: { type: 'Boolean', reflect: true, attribute: 'enable-swipe' },
      testId: { type: 'String', attribute: 'test-id' },
      previousIcon: { type: 'Object' },
      nextIcon: { type: 'Object' },
      classes: { type: 'String' },
      onpagechange: { type: 'Object' },
      onPageChange: { type: 'Object' }
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
