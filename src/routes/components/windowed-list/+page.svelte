<script lang="ts">
  import WindowedList from '#lib/WindowedList/WindowedList.svelte';

  const activities = [
    'Draft created',
    'Notes attached',
    'Review requested',
    'Review started',
    'Changes submitted',
    'Approval recorded'
  ];
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>WindowedList</h1>
  <p class="page-description">Show recent activity and reveal earlier rows on demand.</p>
</div>

<h2 class="demo-examples-heading">Activity history</h2>
<div class="demo-section">
  <WindowedList items={activities} getKey={(item) => item} initialCount={3} step={2}>
    {#snippet row({ item })}
      <p>{item}</p>
    {/snippet}
  </WindowedList>
</div>
