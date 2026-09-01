<script lang="ts">
  import { base } from '$app/paths';
  import Img from '$lib/Img/Img.svelte';

  const markTransformed = (svg: string): string =>
    svg.replace('<svg', '<svg data-demo-transformed="true"');
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>Img</h1>
</div>

<div class="demo-row">
  <Img src="{base}/demo-media/sunset-beach-thumb.jpg" alt="Sample landscape" />
  <Img src="{base}/demo-media/sunset-beach-thumb.jpg" alt="Sample architecture" />
  <Img src="{base}/demo-media/sunset-beach-thumb.jpg" alt="Sample nature" />
</div>

<div class="demo-row">
  <Img
    src="{base}/demo-media/sunset-beach-thumb.jpg"
    alt="Test-targeted image"
    testId="sample-img"
  />
</div>
<p class="state-display">testId="sample-img" → data-pw="sample-img" on the &lt;img&gt; element</p>

<h3>SVG inlining</h3>
<div class="demo-row" data-pw="img-inline-svg-row">
  <Img
    src="{base}/demo-media/status-success.svg"
    alt="Success icon"
    inlineSvg
    testId="img-inline-svg"
  />
</div>
<p class="state-display">inlineSvg → the fetched markup renders as an inline &lt;svg&gt; host</p>

<h3>SVG inlining with transformSvg</h3>
<div class="demo-row" data-pw="img-inline-svg-transform-row">
  <Img
    src="{base}/demo-media/placeholder-square.svg"
    alt="Transformed placeholder"
    transformSvg={markTransformed}
    testId="img-inline-svg-transform"
  />
</div>
<p class="state-display">transformSvg rewrites the fetched markup before it is inlined</p>
