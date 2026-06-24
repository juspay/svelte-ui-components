<script lang="ts">
  import IframeViewer from '$lib/IframeViewer/IframeViewer.svelte';

  const demoDoc = `data:text/html,${encodeURIComponent(
    '<div style="font-family: sans-serif; padding: 24px; color: #1a1a1a;">' +
      '<h2>Embedded content</h2>' +
      '<p>This document is rendered inside an IframeViewer.</p>' +
      '</div>'
  )}`;
</script>

<div class="page-header">
  <span class="category-badge">Layout &amp; Containers</span>
  <h1>IframeViewer</h1>
</div>

<p class="intro">
  A security-conscious iframe embed. It renders an <code>&lt;iframe&gt;</code> for the given
  <code>src</code> and forwards <code>postMessage</code> events to <code>onMessage</code> only when
  the message origin is in <code>allowedOrigins</code> — an empty list (the default) processes nothing,
  so it is secure by default.
</p>

<div class="demo-row">
  <div class="frame-box">
    <IframeViewer src={demoDoc} title="Demo document" allow="fullscreen" />
  </div>
</div>

<style>
  .intro {
    max-width: 640px;
    color: #4b5563;
    line-height: 1.5;
  }

  .frame-box {
    width: min(600px, 100%);
    height: 320px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    overflow: hidden;
  }
</style>
