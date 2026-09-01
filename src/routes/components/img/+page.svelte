<script lang="ts">
  import Img from '$lib/Img/Img.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>Img</h1>
</div>

<div class="demo-row">
  <Img src="/demo-media/sunset-beach-thumb.jpg" alt="Sample landscape" />
  <Img src="/demo-media/sunset-beach-thumb.jpg" alt="Sample architecture" />
  <Img src="/demo-media/sunset-beach-thumb.jpg" alt="Sample nature" />
</div>

<div class="demo-row">
  <Img src="/demo-media/sunset-beach-thumb.jpg" alt="Test-targeted image" testId="sample-img" />
</div>
<p class="state-display">testId="sample-img" → data-pw="sample-img" on the &lt;img&gt; element</p>
