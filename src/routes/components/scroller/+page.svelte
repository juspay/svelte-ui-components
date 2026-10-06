<script lang="ts">
  import Scroller from '$lib/Scroller/Scroller.svelte';

  // Drives the "content and size changes" demo: the scroll region has to become keyboard
  // reachable when the content starts to overflow, and stop being a Tab stop when it no
  // longer does.
  let dynamicContentWidth = $state(200);
  let dynamicFocusable = $state(false);
  let dynamicNarrow = $state(false);
  let fieldsetDisabled = $state(true);
  let legendEnabled = $state(false);
  const fieldsetAxes = ['horizontal', 'vertical'] as const;
</script>

<div class="page-header">
  <span class="category-badge">Navigation</span>
  <h1>Scroller</h1>
</div>

<div class="demo-row" style="max-width: 500px;">
  <Scroller
    direction="horizontal"
    showArrows
    showGradient
    dragToScroll
    testId="scroller-horizontal-default"
  >
    <div style="display: flex; gap: 12px; padding: 8px;">
      {#each Array(12) as _, i (i)}
        <div class="scroll-item">Item {i + 1}</div>
      {/each}
    </div>
  </Scroller>
</div>

<h2>Vertical</h2>
<div class="demo-row">
  <div style="--scroller-height: 200px;">
    <Scroller direction="vertical" showArrows showGradient testId="scroller-vertical-default">
      <div style="display: flex; flex-direction: column; gap: 12px; padding: 8px;">
        {#each Array(12) as _, i (i)}
          <div class="scroll-item">Row {i + 1}</div>
        {/each}
      </div>
    </Scroller>
  </div>
</div>

<h2>Keyboard access without arrows</h2>
<p>
  With <code>showArrows={'{false}'}</code> (or arrows hidden on touch) and content that holds nothing
  focusable, there is no other way to scroll with a keyboard. While the content overflows, the scroll
  region joins the Tab order as a named region with a visible focus ring, and the arrow keys scroll it.
  It leaves the Tab order again when the content fits.
</p>

<h3>Controls disabled by a fieldset</h3>
<p>
  A disabled fieldset removes its controls from the native Tab order. The overflowing region remains
  a keyboard route; the first legend can supply an enabled action instead.
</p>
<button
  type="button"
  data-pw="fieldset-enabled-toggle"
  onclick={() => (fieldsetDisabled = !fieldsetDisabled)}
>
  {fieldsetDisabled ? 'Enable descendants' : 'Disable descendants'}
</button>
<button
  type="button"
  data-pw="fieldset-legend-toggle"
  onclick={() => (legendEnabled = !legendEnabled)}
>
  {legendEnabled ? 'Remove legend action' : 'Add legend action'}
</button>
{#each fieldsetAxes as axis (axis)}
  <div class="demo-row" style="max-width: 500px;">
    <button type="button" data-pw={`fieldset-before-${axis}`}>Before region</button>
    <div style="width: 100%; --scroller-height: 180px;">
      <Scroller
        direction={axis}
        showArrows={false}
        ariaLabel={`${axis} fieldset content`}
        testId={`fieldset-scroller-${axis}`}
      >
        <fieldset disabled={fieldsetDisabled}>
          <legend>
            Fieldset content
            {#if legendEnabled}<button type="button" data-pw={`fieldset-legend-${axis}`}
                >Legend action</button
              >{/if}
          </legend>
          <div style={axis === 'horizontal' ? 'width: 1600px;' : 'height: 1600px;'}>
            Wide content <button type="button" data-pw={`fieldset-inside-${axis}`}
              >Inside control</button
            >
          </div>
        </fieldset>
      </Scroller>
    </div>
    <button type="button" data-pw={`fieldset-after-${axis}`}>After region</button>
  </div>
{/each}

<h3>Horizontal, overflowing, no focusable content</h3>
<div class="demo-row kbd-row" data-pw="scroller-kbd-horizontal">
  <button type="button" class="toggle-btn" data-pw="scroller-horizontal-before">Before</button>
  <div class="kbd-slot">
    <Scroller direction="horizontal" showArrows={false} testId="scroller-no-arrows-horizontal">
      <div class="wide-content">
        <span>Start of a 1600px line of text that cannot be focused</span>
        <span>End of the line</span>
      </div>
    </Scroller>
  </div>
  <button type="button" class="toggle-btn" data-pw="scroller-horizontal-after">After</button>
</div>

<h3>Vertical, overflowing, no focusable content</h3>
<div class="demo-row kbd-row" data-pw="scroller-kbd-vertical">
  <button type="button" class="toggle-btn" data-pw="scroller-vertical-before">Before</button>
  <div class="kbd-slot" style="--scroller-height: 140px;">
    <Scroller direction="vertical" showArrows={false} testId="scroller-no-arrows-vertical">
      <div class="tall-content">
        {#each Array(10) as _, i (i)}
          <p>Row {i + 1} of text that cannot be focused</p>
        {/each}
      </div>
    </Scroller>
  </div>
  <button type="button" class="toggle-btn" data-pw="scroller-vertical-after">After</button>
</div>

<h3>Arrows hidden on touch</h3>
<p>
  Arrows are on here, but a touch-capable device hides them (<code>hideArrowsOnTouch</code>), so the
  region itself is the keyboard route there. Where the arrows show, they are the route and the
  region adds no Tab stop.
</p>
<div class="demo-row kbd-row">
  <button type="button" class="toggle-btn" data-pw="scroller-touch-before">Before</button>
  <div class="kbd-slot">
    <Scroller direction="horizontal" showArrows testId="scroller-touch-arrows">
      <div class="wide-content">
        <span>Swipe on touch, scroll with the arrow keys from a keyboard</span>
      </div>
    </Scroller>
  </div>
  <button type="button" class="toggle-btn" data-pw="scroller-touch-after">After</button>
</div>

<h3>Named by the consumer</h3>
<div class="demo-row kbd-row">
  <button type="button" class="toggle-btn" data-pw="scroller-labelled-before">Before</button>
  <div class="kbd-slot">
    <Scroller
      direction="horizontal"
      showArrows={false}
      ariaLabel="Release timeline"
      testId="scroller-no-arrows-labelled"
    >
      <div class="wide-content">
        <span>Release timeline, v1 through v9, laid out on a single 1600px line</span>
      </div>
    </Scroller>
  </div>
  <button type="button" class="toggle-btn" data-pw="scroller-labelled-after">After</button>
</div>

<h3>No overflow, no extra Tab stop</h3>
<div class="demo-row kbd-row">
  <button type="button" class="toggle-btn" data-pw="scroller-fits-before">Before</button>
  <div class="kbd-slot">
    <Scroller direction="horizontal" showArrows={false} testId="scroller-no-arrows-fits">
      <div class="narrow-content">Everything fits</div>
    </Scroller>
  </div>
  <button type="button" class="toggle-btn" data-pw="scroller-fits-after">After</button>
</div>

<h3>Focusable content keeps its own Tab stops</h3>
<div class="demo-row kbd-row">
  <button type="button" class="toggle-btn" data-pw="scroller-nested-before">Before</button>
  <div class="kbd-slot">
    <Scroller direction="horizontal" showArrows={false} testId="scroller-no-arrows-nested">
      <div class="wide-content">
        <button type="button" data-pw="scroller-nested-first">First action</button>
        <span class="spacer"></span>
        <button type="button" data-pw="scroller-nested-last">Last action</button>
      </div>
    </Scroller>
  </div>
  <button type="button" class="toggle-btn" data-pw="scroller-nested-after">After</button>
</div>

<h3>Content and size changes</h3>
<div class="demo-row kbd-row">
  <button type="button" class="toggle-btn" data-pw="scroller-dynamic-before">Before</button>
  <div
    class="kbd-slot"
    style:max-width={dynamicNarrow ? '240px' : '500px'}
    data-pw="scroller-dynamic-slot"
  >
    <Scroller direction="horizontal" showArrows={false} testId="scroller-dynamic">
      <div class="dynamic-content" style:width="{dynamicContentWidth}px">
        <span>Dynamic content</span>
        {#if dynamicFocusable}
          <button type="button" data-pw="scroller-dynamic-inner">Inner action</button>
        {/if}
      </div>
    </Scroller>
  </div>
  <button type="button" class="toggle-btn" data-pw="scroller-dynamic-after">After</button>
</div>
<div class="demo-row">
  <button
    type="button"
    class="toggle-btn"
    data-pw="scroller-dynamic-grow"
    onclick={() => (dynamicContentWidth = 1600)}>Grow content to 1600px</button
  >
  <button
    type="button"
    class="toggle-btn"
    data-pw="scroller-dynamic-shrink"
    onclick={() => (dynamicContentWidth = 200)}>Shrink content to 200px</button
  >
  <button
    type="button"
    class="toggle-btn"
    data-pw="scroller-dynamic-medium"
    onclick={() => (dynamicContentWidth = 400)}>Set content to 400px</button
  >
  <button
    type="button"
    class="toggle-btn"
    data-pw="scroller-dynamic-narrow"
    onclick={() => (dynamicNarrow = !dynamicNarrow)}>Toggle narrow container</button
  >
  <button
    type="button"
    class="toggle-btn"
    data-pw="scroller-dynamic-focusable"
    onclick={() => (dynamicFocusable = !dynamicFocusable)}>Toggle focusable child</button
  >
</div>

<style>
  .kbd-row {
    flex-wrap: nowrap;
    align-items: center;
  }

  .kbd-slot {
    flex: 1;
    min-width: 0;
    max-width: 500px;
  }

  .wide-content {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 16px;
    width: 1600px;
    padding: 8px;
    box-sizing: border-box;
    background: var(--doc-accent-subtle-bg);
    border-radius: 8px;
  }

  .tall-content {
    padding: 8px;
  }

  .tall-content p {
    margin: 0 0 24px;
  }

  .narrow-content {
    width: 200px;
    padding: 8px;
  }

  .spacer {
    flex: 1;
  }

  .dynamic-content {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 8px;
    box-sizing: border-box;
    background: var(--doc-accent-subtle-bg);
    border-radius: 8px;
  }
</style>
