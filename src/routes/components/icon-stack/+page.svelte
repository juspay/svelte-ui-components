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
      { type: 'image', content: 'https://picsum.photos/32/32?random=30' },
      { type: 'image', content: 'https://picsum.photos/32/32?random=31' },
      { type: 'text', content: '+3' }
    ]}
  />
</div>
