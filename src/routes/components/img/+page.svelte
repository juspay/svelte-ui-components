<script lang="ts">
  import Img from '$lib/Img/Img.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>Img</h1>
</div>

<div class="demo-row">
  <Img src="https://picsum.photos/200/150?random=60" alt="Sample landscape" />
  <Img src="https://picsum.photos/200/150?random=61" alt="Sample architecture" />
  <Img src="https://picsum.photos/200/150?random=62" alt="Sample nature" />
</div>

<div class="demo-row">
  <Img
    src="https://picsum.photos/200/150?random=63"
    alt="Test-targeted image"
    testId="sample-img"
  />
</div>
<p class="state-display">testId="sample-img" → data-pw="sample-img" on the &lt;img&gt; element</p>
