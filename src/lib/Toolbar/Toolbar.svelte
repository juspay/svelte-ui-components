<script lang="ts">
  import type { ToolbarProperties } from './properties';

  let {
    showBackButton = true,
    text,
    backIcon,
    backLabel = 'Back',
    leftContent,
    centerContent,
    rightContent,
    additionalContent,
    classes,
    onbackClick,
    onkeydown,
    testId,
    headingTestId
  }: ToolbarProperties = $props();

  // `backIcon={null}` (or '') has always meant "render no back control at all", and consumers
  // rely on it; only the DEFAULT changes, from a CDN image to the inline icon.
  const showBackControl = $derived(showBackButton && backIcon !== null && backIcon !== '');
  // The icon is decorative, so the label is the button's only accessible name — an empty or
  // whitespace-only value must not strip it.
  const backAccessibleName = $derived(backLabel.trim().length > 0 ? backLabel : 'Back');
</script>

<div class="toolbar {classes ?? ''}" data-pw={testId} testID={testId}>
  <div
    class="content"
    data-pw={typeof testId === 'string' ? `${testId}-content` : null}
    testID={typeof testId === 'string' ? `${testId}-content` : null}
  >
    {#if typeof leftContent === 'function'}
      {@render leftContent()}
    {:else if showBackControl}
      <button
        type="button"
        class="back"
        aria-label={backAccessibleName}
        onclick={onbackClick}
        {onkeydown}
      >
        {#if typeof backIcon === 'string'}
          <img src={backIcon} alt="" />
        {:else}
          <!-- Inline so the component ships no network dependency; currentColor so it follows the
               consumer's text colour in both themes without a filter. -->
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <path
              d="M10 3 5 8l5 5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        {/if}
      </button>
    {/if}
    {#if typeof centerContent === 'function'}
      <div class="center-content">
        {@render centerContent()}
      </div>
    {:else if typeof text === 'string' && text.length > 0}
      <div class="text" data-pw={headingTestId} testID={headingTestId}>
        {text}
      </div>
    {/if}
    {#if typeof rightContent === 'function'}
      <div class="right-content">
        {@render rightContent()}
      </div>
    {/if}
  </div>
  <div class="additional-content" class:hidden={!(typeof additionalContent === 'function')}>
    {#if typeof additionalContent === 'function'}
      {@render additionalContent()}
    {/if}
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    flex-direction: column;
    padding: var(--toolbar-padding, 0px);
    height: var(--toolbar-height, fit-content);
    width: var(--toolbar-width, 100vw);
    position: var(--toolbar-position, fixed);
    top: var(--toolbar-top, 0);
    left: var(--toolbar-left, 0);
    right: var(--toolbar-right, 0);
    background: var(--toolbar-background, #ffffff);
    box-shadow: var(--toolbar-box-shadow, 0px 2px 12px #55687c1a);
    z-index: var(--toolbar-z-index, 10);
    border-radius: var(--toolbar-border-radius, 0px);
  }

  .content {
    display: flex;
    flex-direction: row;
    align-items: var(--toolbar-content-align-items, center);
    padding: var(--toolbar-content-padding, 0px);
    justify-content: var(--toolbar-justify-content, normal);
    visibility: var(--toolbar-content-visibility, visible);

    /* Content-row geometry: lets a fixed-height toolbar keep its row vertically
       centered (height 100%) and clamp/center the row on wide viewports —
       previously only reachable by piercing the component's internal DOM. All
       defaults reproduce the previous rendering exactly. */
    width: var(--toolbar-content-width, auto);
    height: var(--toolbar-content-height, auto);
    min-height: var(--toolbar-content-min-height, auto);
    max-width: var(--toolbar-content-max-width, none);
    margin: var(--toolbar-content-margin, 0);

    /* Row wrapping and gaps. An in-flow page header lets its action side drop to its own
       line on a narrow viewport; the fixed bar never wraps, which is the default. */
    flex-wrap: var(--toolbar-content-flex-wrap, nowrap);
    row-gap: var(--toolbar-content-row-gap, 0);
    column-gap: var(--toolbar-content-column-gap, 0);
  }

  .additional-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: var(--toolbar-additional-content-padding, 0px);
    height: var(--toolbar-additional-content-height, fit-content);
    justify-content: var(--toolbar-justify-additional-content, normal);
    visibility: var(--toolbar-additional-content-visibility, visible);
  }

  .hidden {
    display: none;
  }

  .back {
    /* A native button so Enter/Space and the accessible name come for free; the reset keeps
       the box identical to the div it replaces. */
    appearance: none;
    background: none;
    border: 0;
    margin: 0;
    box-sizing: content-box;
    color: var(--toolbar-back-icon-color, inherit);
    height: var(--toolbar-back-button-height, 20px);
    width: var(--toolbar-back-button-width, 20px);
    padding: var(--toolbar-back-button-padding, 20px 14px);
    cursor: var(--toolbar-back-button-cursor, pointer);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .back:focus-visible {
    outline: var(--toolbar-back-button-focus-outline, 2px solid currentColor);
    outline-offset: var(--toolbar-back-button-focus-outline-offset, -2px);
  }

  .back img,
  .back svg {
    height: var(--toolbar-back-image-height, 16px);
    width: var(--toolbar-back-image-width, 16px);
    flex: none;
  }

  .center-content {
    display: flex;
    /* `1 1 auto` rather than the default `1` (`1 1 0%`) lets a title region grow from its
       CONTENT width, so a row deficit is shared with the action side instead of collapsing
       the title to nothing. `min-width: 0` is what actually permits the shrink. */
    flex: var(--toolbar-center-flex, 1);
    min-width: var(--toolbar-center-min-width, auto);
  }

  /* The action region as a flex ITEM of the row. Its inner layout stays the consumer's —
     the snippet's own markup — so there is no gap/justify/align token here. Every default
     below is the property's initial value, i.e. what a bare div already rendered. */
  .right-content {
    display: var(--toolbar-right-display, block);
    flex-shrink: var(--toolbar-right-flex-shrink, 1);
    min-width: var(--toolbar-right-min-width, auto);
    max-width: var(--toolbar-right-max-width, none);
    width: var(--toolbar-right-width, auto);
  }

  .text {
    font-size: var(--toolbar-text-font-size, 18px);
    font-weight: var(--toolbar-text-font-weight, normal);
    padding: var(--toolbar-text-padding, 0px);
    margin: var(--toolbar-text-margin, 0px);
    color: var(--toolbar-text-color);
    flex: var(--toolbar-text-flex, 1);
  }
</style>
