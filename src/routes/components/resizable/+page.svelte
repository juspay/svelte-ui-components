<script lang="ts">
  import Resizable from '$lib/Resizable/Resizable.svelte';
  import Button from '$lib/Button/Button.svelte';

  let width = $state(280);
  let height = $state(180);
  let dockWidth = $state(380);
  let stageHeight = $state(180);
</script>

<div class="page-header">
  <span class="category-badge">Layout &amp; Containers</span>
  <h1>Resizable</h1>
</div>

<h2>CSS-owned height survives horizontal resize</h2>
<div class="dock-stage" style:height={`${stageHeight}px`} data-pw="resize-stage">
  <Resizable
    bind:width={dockWidth}
    handles={['left']}
    minWidth={300}
    maxWidth={600}
    classes="dock-resizable"
    testId="axis-dock"
  >
    <div class="box">{dockWidth}px wide, full container height</div>
  </Resizable>
</div>
<Button text="Grow container" testId="grow-resize-stage" onclick={() => (stageHeight += 80)} />

<div class="demo-row resize-stage">
  <Resizable
    bind:width
    bind:height
    minWidth={160}
    maxWidth={520}
    minHeight={120}
    maxHeight={400}
    handles={['right', 'bottom', 'bottom-right']}
  >
    <div class="box">
      Drag the right / bottom edge or corner.<br />
      {width} × {height}
    </div>
  </Resizable>
</div>

<style>
  .dock-stage {
    display: flex;
    justify-content: flex-end;
    max-width: 700px;
    --resizable-handle-color: #e4e4e7;
  }

  .dock-stage :global(.dock-resizable) {
    height: 100%;
  }

  .resize-stage {
    --resizable-handle-color: #e4e4e7;
  }

  .box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    padding: 16px;
    text-align: center;
    background: #ffffff;
    border: 1px solid #d4d4d8;
    border-radius: 12px;
    overflow: hidden;
    color: #3f3f46;
    font-size: 14px;
    line-height: 1.5;
  }
</style>
