<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import Toast from '$lib/Toast/Toast.svelte';

  let showToast = $state(false);
  let showBottomToast = $state(false);
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

<div class="demo-row">
  <Button text="Show Bottom-Centered Toast" onclick={() => (showBottomToast = true)} />
  {#if showBottomToast}
    <Toast
      message="Anchored via --toast-bottom"
      type="info"
      classes="toast-bottom-center"
      onToastHide={() => (showBottomToast = false)}
    />
  {/if}
</div>

<style>
  /* Bottom-centered recipe: --toast-left/--toast-right pin the box, fit-content
     width + auto margin centers it horizontally, and --toast-top: auto hands
     vertical placement to --toast-bottom. There's no --toast-transform hook —
     the fly transition writes its own inline transform during enter/leave,
     which would fight a static transform mid-animation; this left/right +
     auto-margin + fit-content pattern composes cleanly with it instead. */
  :global(.toast-bottom-center) {
    --toast-left: 0;
    --toast-right: 0;
    --toast-width: fit-content;
    --toast-margin: 0 auto;
    --toast-top: auto;
    --toast-bottom: 24px;
  }
</style>
