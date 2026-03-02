<script lang="ts">
  import Pill from '$lib/Pill/Pill.svelte';
  import Button from '$lib/Button/Button.svelte';

  let pillItems = $state(['Svelte', 'React', 'Vue', 'Angular']);
</script>

<div class="page-header">
  <span class="category-badge">Buttons & Actions</span>
  <h1>Pill</h1>
</div>

<div class="demo-row">
  {#each pillItems as item (item)}
    <Pill
      text={item}
      dismissible
      ondismiss={() => (pillItems = pillItems.filter((p) => p !== item))}
    />
  {/each}
  {#if pillItems.length === 0}
    <Button
      text="Reset Pills"
      onclick={() => (pillItems = ['Svelte', 'React', 'Vue', 'Angular'])}
    />
  {/if}
</div>
