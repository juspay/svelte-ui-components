<script lang="ts">
  import { base } from '$app/paths';
  import Icon from '$lib/Icon/Icon.svelte';

  const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
  const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
  const checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
</script>

<div class="page-header">
  <span class="category-badge">Media</span>
  <h1>Icon</h1>
</div>

<div class="demo-row" style="align-items: center;">
  <Icon icon="{base}/demo-media/placeholder-square.svg" text="Home" />
  <Icon icon="{base}/demo-media/placeholder-square.svg" text="Settings" />
  <Icon icon="{base}/demo-media/placeholder-square.svg" text="Profile" />
</div>

<div class="demo-row" style="align-items: center;">
  <Icon svg={starSvg} text="Star" />
  <Icon svg={heartSvg} text="Heart" />
  <Icon svg={checkSvg} text="Check" />
</div>
