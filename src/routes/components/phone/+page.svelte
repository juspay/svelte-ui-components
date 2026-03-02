<script lang="ts">
  import Phone from '$lib/Phone/Phone.svelte';
</script>

<div class="page-header">
  <span class="category-badge">Layout & Containers</span>
  <h1>Phone</h1>
</div>

<div class="demo-row" style="align-items: flex-start;">
  <div style="--phone-scale: 0.8;">
    <Phone variant="modern" showStatusBar showHomeBar>
      <div style="padding: 16px; text-align: center;">
        <h3>Modern</h3>
        <p>Phone mockup content</p>
      </div>
    </Phone>
  </div>

  <div style="--phone-scale: 0.8;">
    <Phone variant="classic" showStatusBar>
      <div style="padding: 16px; text-align: center;">
        <h3>Classic</h3>
        <p>Phone mockup content</p>
      </div>
    </Phone>
  </div>
</div>
