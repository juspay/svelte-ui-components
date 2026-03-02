<script lang="ts">
  import Status from '$lib/Status/Status.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>Status</h1>
</div>

<div class="demo-row">
  <Status
    statusIcon="https://picsum.photos/48/48?random=20"
    statusText="Payment Successful"
    statusDescription="Your order has been confirmed"
  />
</div>
