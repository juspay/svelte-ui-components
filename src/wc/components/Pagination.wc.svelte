<svelte:options
  customElement={{
    tag: 'sui-pagination',
    shadow: 'open',
    props: {
      totalPages: { type: 'Number', reflect: true },
      currentPage: { type: 'Number', reflect: true },
      siblingCount: { type: 'Number', reflect: true },
      disabled: { type: 'Boolean', reflect: true },
      testId: { type: 'String' },
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
