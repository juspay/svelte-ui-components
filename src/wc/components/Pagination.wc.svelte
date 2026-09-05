<svelte:options
  customElement={{
    tag: 'sui-pagination',
    shadow: 'open',
    props: {
      totalPages: { type: 'Number', reflect: true, attribute: 'total-pages' },
      currentPage: { type: 'Number', reflect: true, attribute: 'current-page' },
      siblingCount: { type: 'Number', reflect: true, attribute: 'sibling-count' },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      hasMore: { type: 'Boolean', reflect: true, attribute: 'has-more' },
      prevButtonTestId: { type: 'String', attribute: 'prev-button-test-id' },
      nextButtonTestId: { type: 'String', attribute: 'next-button-test-id' },
      onchange: { type: 'Object' },
      onLoadMore: { type: 'Object' },
      onChange: { type: 'Object' },
      onloadmore: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Pagination from '$lib/Pagination/Pagination.svelte';
  let props = $props();
</script>

<Pagination {...props} />
