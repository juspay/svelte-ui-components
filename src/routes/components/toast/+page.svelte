<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Toast from '$lib/Toast/Toast.svelte';

  let showToast = $state(false);
</script>

<div class="page-header">
  <span class="category-badge">Feedback & Status</span>
  <h1>Toast</h1>
</div>

<div class="demo-row">
  <Button text="Show Toast" onclick={() => (showToast = true)} />
  {#if showToast}
    <Toast
      message="Operation completed successfully!"
      type="success"
      onToastHide={() => (showToast = false)}
    />
  {/if}
</div>
