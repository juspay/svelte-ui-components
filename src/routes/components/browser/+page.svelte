<script lang="ts">
  import Browser from '$lib/Browser/Browser.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>Browser</h1>
</div>

<div class="demo-row">
  <Browser url="https://example.com" title="Example Page" showAddressBar showTabBar>
    <div style="padding: 20px; background: #f9f9f9; min-height: 100px;">
      <p>Browser window content</p>
    </div>
  </Browser>
</div>
