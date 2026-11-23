<script lang="ts">
  import Draggable from '#lib/Draggable/Draggable.svelte';

  let x = $state(0);
  let y = $state(0);
</script>

<div class="page-header">
  <span class="category-badge">Layout &amp; Containers</span>
  <h1>Draggable</h1>
</div>

<div class="demo-row drag-stage">
  <Draggable bind:x bind:y bounds="viewport" handle=".drag-handle" testId="draggable-demo">
    <div class="box">
      <div class="drag-handle">⠿ Drag me</div>
      <p>{x}, {y}</p>
    </div>
  </Draggable>
</div>

<style>
  .drag-stage {
    position: relative;
    height: 260px;
  }

  .box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 160px;
    box-sizing: border-box;
    padding: 16px;
    text-align: center;
    background: var(--doc-input-bg);
    border: 1px solid var(--doc-btn-border);
    border-radius: 12px;
    color: var(--doc-text-primary);
    font-size: 14px;
    line-height: 1.5;
  }

  .drag-handle {
    cursor: grab;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    background: var(--doc-code-bg);
  }
</style>
