<script lang="ts">
  import { base } from '$app/paths';
  import IconStack from '$lib/IconStack/IconStack.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Data Display</span>
  <h1>IconStack</h1>
</div>

<div class="demo-row">
  <IconStack
    icons={[
      { type: 'image', content: `${base}/demo-media/placeholder-square.svg` },
      { type: 'image', content: `${base}/demo-media/placeholder-square.svg` },
      { type: 'text', content: '+3' }
    ]}
    testId="icon-stack-demo"
  />
</div>
