<script lang="ts">
  import RelativeTime from '$lib/RelativeTime/RelativeTime.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>RelativeTime</h1>
</div>

<div class="demo-row" style="align-items: center; gap: 24px;">
  <RelativeTime date={new Date(Date.now() - 30000)} tooltip />
  <RelativeTime date={new Date(Date.now() - 60000)} format="long" tooltip />
  <RelativeTime date={new Date(Date.now() - 3600000)} format="short" tooltip />
  <RelativeTime date={new Date(Date.now() - 86400000)} format="narrow" tooltip />
</div>

<h2>Future dates</h2>
<div class="demo-row" style="align-items: center; gap: 24px;">
  <RelativeTime date={new Date(Date.now() + 3600000)} tooltip />
  <RelativeTime date={new Date(Date.now() + 86400000)} format="short" tooltip />
</div>
