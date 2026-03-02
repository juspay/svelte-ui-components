<script lang="ts">
  import Book from '$lib/Book/Book.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>Book</h1>
</div>

{#snippet bookPage1()}
  <div style="padding: 20px;">
    <h3>Chapter 1</h3>
    <p>Introduction to the library.</p>
  </div>
{/snippet}
{#snippet bookPage2()}
  <div style="padding: 20px;">
    <h3>Chapter 2</h3>
    <p>Getting started with components.</p>
  </div>
{/snippet}
{#snippet bookPage3()}
  <div style="padding: 20px;">
    <h3>Chapter 3</h3>
    <p>Advanced patterns and recipes.</p>
  </div>
{/snippet}

<div class="demo-row">
  <Book
    pages={[
      { content: bookPage1, title: 'Introduction' },
      { content: bookPage2, title: 'Getting Started' },
      { content: bookPage3, title: 'Advanced' }
    ]}
    showNavigation
    showPageIndicator
  />
</div>
