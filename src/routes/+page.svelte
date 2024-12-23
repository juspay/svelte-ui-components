<script lang="ts">
  import GridItem from '$lib/GridItem/GridItem.svelte';
  import Toggle from '$lib/Toggle/Toggle.svelte';

  function toggle(event: CustomEvent) {
    console.log(event.detail);
  }
</script>

<div class="container">
  <h1>Svelte UI Components</h1>

  <h3>Components</h3>

  <div class="components">
    <GridItem />
    <Toggle text="text" on:click={toggle} />
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap');

  .container {
    font-family: 'Nunito Sans', sans-serif;
  }

  .components {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    --toggle-text-order: 1;
    --toggle-switch-width: 40px;
    --toggle-switch-height: 20px;
    --toggle-ball-height: 18px;
    --toggle-ball-width: 18px;
  }
</style>
