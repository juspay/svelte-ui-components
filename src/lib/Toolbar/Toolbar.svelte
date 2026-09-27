<script lang="ts">
  import type { ToolbarProperties } from './properties';

  let {
    showBackButton = true,
    text,
    title,
    headingLevel,
    subtitle,
    rootTag,
    variant = 'chrome',
    backIcon,
    backLabel = 'Back',
    backHref,
    leftContent,
    centerContent,
    rightContent,
    additionalContent,
    classes,
    onbackclick,
    onkeydown,
    testId,
    headingTestId
  }: ToolbarProperties = $props();

  // Same validation `Sheet`'s `headingLevel` already applies: through a web
  // component, an untyped attribute reaches this as anything, and a getter
  // can throw, so an unusable level degrades to the plain-tag fallback rather
  // than emitting an invalid `<h7>`/`<h0>`/`<hNaN>`.
  const headingTag = $derived(
    typeof headingLevel === 'number' &&
      Number.isInteger(headingLevel) &&
      headingLevel >= 1 &&
      headingLevel <= 6
      ? `h${headingLevel}`
      : null
  );

  // `backIcon={null}` (or '') has always meant "render no back control at all", and consumers
  // rely on it; only the DEFAULT changes, from a CDN image to the inline icon.
  const showBackControl = $derived(showBackButton && backIcon !== null && backIcon !== '');
  // The icon is decorative, so the label is the button's only accessible name — an empty or
  // whitespace-only value must not strip it.
  const backAccessibleName = $derived(backLabel.trim().length > 0 ? backLabel : 'Back');
  // A real link only when a non-empty href is actually given — same emptiness check the
  // rest of the component already applies to backIcon, so `backHref=""` behaves like "unset"
  // rather than rendering a same-page anchor.
  const hasBackHref = $derived(typeof backHref === 'string' && backHref.length > 0);

  // A native <a> does not fire `click` on Space — only Enter — so the keyboard activation the
  // old <button> gave for free would silently regress when backHref swaps the tag. Enter already
  // reaches `onbackclick` through the anchor's native click, so only Space needs help here; the
  // consumer's own `onkeydown` still runs unconditionally, same as it always has.
  const handleBackKeydown = (event: KeyboardEvent): void => {
    onkeydown?.(event);
    if (hasBackHref && event.key === ' ') {
      event.preventDefault();
      onbackclick?.();
    }
  };
</script>

<svelte:element
  this={rootTag ?? 'div'}
  class="toolbar {classes ?? ''}"
  data-variant={variant === 'page-header' ? 'page-header' : null}
  data-pw={testId}
  testID={testId}
>
  <div
    class="content"
    data-pw={typeof testId === 'string' ? `${testId}-content` : null}
    testID={typeof testId === 'string' ? `${testId}-content` : null}
  >
    {#if typeof leftContent === 'function'}
      {@render leftContent()}
    {:else if showBackControl}
      <svelte:element
        this={hasBackHref ? 'a' : 'button'}
        type={hasBackHref ? null : 'button'}
        href={hasBackHref ? backHref : null}
        role={null}
        class="back"
        aria-label={backAccessibleName}
        onclick={onbackclick}
        onkeydown={handleBackKeydown}
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
      </svelte:element>
    {/if}
    {#if typeof centerContent === 'function'}
      <div class="center-content">
        {@render centerContent()}
      </div>
    {:else if typeof title === 'string' && title.length > 0}
      <div class="titles" data-pw={headingTestId} testID={headingTestId}>
        {#if headingTag !== null}
          <svelte:element this={headingTag}>{title}</svelte:element>
        {:else}
          <span>{title}</span>
        {/if}
        {#if typeof subtitle === 'string' && subtitle.length > 0}
          <p class="subtitle">{subtitle}</p>
        {/if}
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
</svelte:element>

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

  /* In the page's flow rather than pinned over it: only the fallbacks change,
     so a consumer's own --toolbar-* values still win. */
  /* Literal values, not the chrome's variables with other fallbacks: an app
     that themes its bars at :root (--toolbar-background: white,
     --toolbar-position: fixed) would otherwise paint and pin every page
     header too. These six properties ARE the variant; everything else still
     reads the shared variables. */
  .toolbar[data-variant='page-header'] {
    position: static;
    width: 100%;
    background: transparent;
    box-shadow: none;
    z-index: auto;
  }

  .toolbar[data-variant='page-header'] > .content {
    flex-wrap: wrap;
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
    background: var(--toolbar-back-button-background, none);
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
    color: var(--toolbar-text-color, inherit);
    flex: var(--toolbar-text-flex, 1);
  }

  /* `title`/`subtitle`'s heading tag is deliberately unstyled here: a consumer's
     own global heading rules (size, weight, tracking) already reach it the
     same way they reach any other heading on the page, and a component-level
     font-size/font-weight here — even with an `inherit` fallback — would
     outrank a bare `h1`/`h2` element selector by specificity and silently
     break that inheritance for every consumer that has one. Only layout and
     the subtitle's own (independent) presentation get hooks. Both rules are written down the
     structure they live in (.content > .titles > .subtitle), so a `titles` or `subtitle`
     class a consumer passes through `classes`, which lands on the root, cannot match them,
     and the variant is a data attribute rather than a class for the same reason: a class
     directive would strip a consumer's own `page-header` class (the one the docs recipe
     uses) from `classes`. */
  .content > .titles {
    display: grid;
    gap: var(--toolbar-titles-gap, 2px);
    min-width: var(--toolbar-titles-min-width, 0);
    flex: var(--toolbar-titles-flex, 1);
  }

  .titles > .subtitle {
    color: var(--toolbar-subtitle-color, inherit);
    text-wrap: var(--toolbar-subtitle-text-wrap, pretty);
  }
</style>
