<script lang="ts">
  import Draggable from '$lib/Draggable/Draggable.svelte';

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
    background: #ffffff;
    border: 1px solid #d4d4d8;
    border-radius: 12px;
    color: #3f3f46;
    font-size: 14px;
    line-height: 1.5;
  }

  .drag-handle {
    cursor: grab;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 6px;
    background: #f4f4f5;
  }
</style>
