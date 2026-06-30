<script lang="ts">
  import Input from '$lib/Input/Input.svelte';

  let inputValue = $state('');
  let notes = $state('');
  let autoGrow = $state('');
  let bio = $state('');
  let resizable = $state('');
  let resizableX = $state('');
  let resizableBoth = $state('');
</script>

<div class="page-header">
  <span class="category-badge">Form Controls</span>
  <h1>Input</h1>
</div>

<h3>Basic</h3>
<div class="demo-row" style="max-width: 400px;">
  <Input bind:value={inputValue} placeholder="Enter your name" label="Name" />
</div>

<h3>Multi-line (useTextArea)</h3>
<p>
  Set <code>useTextArea</code> to render a <code>&lt;textarea&gt;</code> instead of an
  <code>&lt;input&gt;</code>. Use <code>rows</code> for the initial height.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input bind:value={notes} useTextArea label="Notes" placeholder="Add your notes" rows={4} />
</div>

<h3>Auto-resize</h3>
<p>
  With <code>autoResize</code> the textarea grows with its content between <code>minRows</code> and
  <code>maxRows</code> (then scrolls).
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={autoGrow}
    useTextArea
    autoResize
    minRows={2}
    maxRows={8}
    label="Description"
    placeholder="Keep typing — the field grows…"
  />
</div>

<h3>Character counter</h3>
<p>Pass <code>showCount</code> with a <code>maxLength</code> to show a live counter.</p>
<div class="demo-row" style="max-width: 400px;">
  <Input
    bind:value={bio}
    useTextArea
    showCount
    maxLength={140}
    label="Bio"
    placeholder="Max 140 characters"
    rows={3}
  />
</div>

<h3>Manual resize</h3>
<p>
  Control the resize handle with <code>resize</code> (default <code>'none'</code>) —
  <code>'vertical'</code>, <code>'horizontal'</code>, or <code>'both'</code>. Drag the corner/edge
  of each field below.
</p>
<div class="demo-row" style="max-width: 400px;">
  <Input bind:value={resizable} useTextArea resize="vertical" label="Vertical" rows={3} />
</div>
<div class="demo-row resize-narrow">
  <Input bind:value={resizableX} useTextArea resize="horizontal" label="Horizontal" rows={3} />
</div>
<div class="demo-row resize-narrow">
  <Input bind:value={resizableBoth} useTextArea resize="both" label="Both" rows={3} />
</div>

<style>
  /* Start narrower so horizontal/both resizing has room to grow as well as shrink. */
  .resize-narrow :global(.input-container) {
    --input-width: 240px;
  }
</style>
