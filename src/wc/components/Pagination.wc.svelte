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
      onchange: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Pagination from '$lib/Pagination/Pagination.svelte';
  let props = $props();
</script>

<Pagination {...props} />
