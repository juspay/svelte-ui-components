<script lang="ts">
  import Book from '#lib/Book/Book.svelte';
  import Button from '#lib/Button/Button.svelte';
  import Gallery from '#lib/Gallery/Gallery.svelte';
  import Pagination from '#lib/Pagination/Pagination.svelte';
  import Table from '#lib/Table/Table.svelte';
  import Tabs from '#lib/Tabs/Tabs.svelte';

  const images = [
    {
      src: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2252%22%3E%3Crect width=%2280%22 height=%2252%22 fill=%22%2342749c%22/%3E%3C/svg%3E',
      alt: 'Draft photo'
    }
  ];
  const tabs = Array.from({ length: 10 }, (_, index) => `Section ${index + 1}`);
  const columns = [{ id: 'name', label: 'Name' }];
  const rows = [{ name: 'First row' }, { name: 'Second row' }];

  let submitCount = $state(0);
  let submittedValue = $state('');
  let page = $state(2);
  let loaded = $state(0);
  let previews = $state(0);

  function save(event: SubmitEvent): void {
    event.preventDefault();
    if (event.currentTarget instanceof HTMLFormElement) {
      submitCount += 1;
      submittedValue = String(new FormData(event.currentTarget).get('draft') ?? '');
    }
  }
</script>

{#snippet firstPage()}
  <p>First book page</p>
{/snippet}

{#snippet secondPage()}
  <p>Second book page</p>
{/snippet}

<main>
  <h1>Controls inside a form</h1>
  <form onsubmit={save}>
    <label>Draft <input name="draft" value="Keep this draft" /></label>
    <p data-pw="submissions" role="status">Submissions: {submitCount}</p>
    <p data-pw="submitted-draft">{submittedValue}</p>
    <section>
      <h2>Pagination</h2>
      <Pagination totalPages={3} bind:currentPage={page} testId="numbered-pages" />
      <p data-pw="current-page">Page: {page}</p>
      <Pagination totalPages={1} hasMore testId="cursor-pages" onloadmore={() => (loaded += 1)} />
      <p data-pw="loaded">Loaded: {loaded}</p>
    </section>
    <section class="book-fixture">
      <h2>Book</h2>
      <Book
        pages={[{ content: firstPage }, { content: secondPage }]}
        transition="none"
        showPageIndicator
      />
    </section>
    <section>
      <h2>Gallery</h2>
      <Gallery {images} enableLightbox={false} onimageclick={() => (previews += 1)} />
      <p data-pw="previews">Previews: {previews}</p>
    </section>
    <section class="tabs-fixture">
      <h2>Tabs</h2>
      <Tabs items={tabs} testId="tabs" />
    </section>
    <section>
      <h2>Table</h2>
      <Table
        {columns}
        {rows}
        testId="table"
        pagination={{ pageSize: 1, hidePageSizeSelector: true }}
      />
    </section>
    <Button type="submit" text="Save draft" />
  </form>
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    max-width: 420px;
    padding: 14px;
  }

  section {
    margin-block: 24px;
  }

  h1 {
    font-size: 24px;
  }

  h2 {
    font-size: 19px;
  }

  .book-fixture {
    --book-height: 85px;
  }

  .tabs-fixture {
    max-width: 240px;
  }
</style>
