<script lang="ts">
  import ListItem from '$lib/ListItem/ListItem.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>ListItem</h1>
</div>

<div class="demo-row" style="flex-direction: column; max-width: 500px;">
  <ListItem label="John Doe" rightContentText="$120.00" />
  <ListItem label="Payment Received" rightContentText="Yesterday" />
  <ListItem label="Loading Item" showLoader />
</div>
