<script lang="ts">
  import IconStack from '$lib/IconStack/IconStack.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>IconStack</h1>
</div>

<div class="demo-row">
  <IconStack
    icons={[
      { type: 'image', content: '/demo-media/placeholder-square.svg' },
      { type: 'image', content: '/demo-media/placeholder-square.svg' },
      { type: 'text', content: '+3' }
    ]}
  />
</div>
