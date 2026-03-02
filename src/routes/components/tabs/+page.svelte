<script lang="ts">
  import Tabs from '$lib/Tabs/Tabs.svelte';

  let activeTab = $state(0);
  let activeOverflow = $state(0);

  const manyTabs = Array.from({ length: 20 }, (_, i) => `Tab ${i + 1}`);
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Tabs</h1>
</div>

<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Tabs
    items={['Overview', 'Details', 'Reviews', 'Settings']}
    activeIndex={activeTab}
    onchange={(index) => (activeTab = index)}
  />
  <p class="state-display">Active tab: {activeTab}</p>
</div>

<h3 style="margin: 24px 0 12px; font-size: 1.1rem; color: #374151;">Overflow (scrollable)</h3>
<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <Tabs
    items={manyTabs}
    activeIndex={activeOverflow}
    onchange={(index) => (activeOverflow = index)}
  />
  <p class="state-display">Active tab: {activeOverflow}</p>
</div>
