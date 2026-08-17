<script lang="ts">
  import type { CardProperties } from './properties';

  let {
    children,
    title,
    description,
    titleSnippet,
    descriptionSnippet,
    classes,
    testId,
    onclick,
    href,
    target,
    rel,
    headerRight,
    footer,
    stretch = false,
    scrollable = false,
    cssVars
  }: CardProperties = $props();

  const isAnchor = $derived(typeof href === 'string' && href.length > 0);
  const isInteractive = $derived(isAnchor || typeof onclick === 'function');
  // HTML target values are ASCII case-insensitive (e.g. "_BLANK" opens a new
  // context identically to "_blank"), so the comparison must normalize case
  // to keep the noopener/noreferrer default from being silently skipped.
  const resolvedRel = $derived(
    rel ?? (target?.toLowerCase() === '_blank' ? 'noopener noreferrer' : null)
  );

  const styleAttr = $derived(
    cssVars
      ? Object.entries(cssVars)
          .map(([name, value]) => `${name}: ${value}`)
          .join('; ')
      : null
  );

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.key === ' ') {
        event.preventDefault();
      }
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.click();
      }
    }
  };
</script>

<svelte:element
  this={isAnchor ? 'a' : 'div'}
  class="card {classes ?? ''}"
  class:card-interactive={isInteractive}
  class:card-stretch={stretch}
  class:card-has-scroll={scrollable}
  style={styleAttr}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  role={!isAnchor && isInteractive ? 'button' : null}
  tabindex={!isAnchor && isInteractive ? 0 : null}
  href={isAnchor ? href : null}
  target={isAnchor ? target : null}
  rel={isAnchor ? resolvedRel : null}
  onclick={onclick ?? null}
  onkeydown={!isAnchor && isInteractive ? handleKeydown : null}
>
  {#if (typeof title === 'string' && title.length > 0) || typeof titleSnippet === 'function' || typeof headerRight === 'function'}
    <div class="card-header" class:card-header-split={typeof headerRight === 'function'}>
      <div class="card-header-main">
        {#if typeof titleSnippet === 'function'}
          <div class="card-title">{@render titleSnippet()}</div>
        {:else if typeof title === 'string' && title.length > 0}
          <div class="card-title">{title}</div>
        {/if}
        {#if typeof descriptionSnippet === 'function'}
          <div class="card-description">{@render descriptionSnippet()}</div>
        {:else if typeof description === 'string' && description.length > 0}
          <div class="card-description">{description}</div>
        {/if}
      </div>
      {#if typeof headerRight === 'function'}
        <div class="card-header-right">
          {@render headerRight()}
        </div>
      {/if}
    </div>
  {/if}
  {#if typeof children === 'function'}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="card-content"
      class:card-content-scrollable={scrollable}
      role={scrollable ? 'region' : null}
      aria-label={scrollable ? 'Scrollable card content' : null}
      tabindex={scrollable ? 0 : null}
    >
      {@render children()}
    </div>
  {/if}
  {#if typeof footer === 'function'}
    <footer class="card-footer">
      {@render footer()}
    </footer>
  {/if}
</svelte:element>

<style>
  .card {
    /* Explicit so the root's layout doesn't depend on the browser default for
       whichever tag svelte:element renders -- a <div> defaults to block and an
       <a> defaults to inline, and an inline box ignores width/height entirely.
       Pinning both here keeps anchor-mode cards byte-identical to div cards. */
    display: block;
    text-decoration: none;
    background: var(--card-background, inherit);
    border: var(--card-border, 1px solid currentColor);
    border-radius: var(--card-border-radius, var(--radius, 4px));
    overflow: var(--card-overflow, hidden);
    color: inherit;
    cursor: var(--card-cursor, inherit);
    box-shadow: var(--card-box-shadow, none);
    width: var(--card-width, auto);
    min-width: var(--card-min-width, 0);
    max-width: var(--card-max-width, none);
    height: var(--card-height, auto);
    max-height: var(--card-max-height, none);
    margin: var(--card-margin, 0);
  }

  .card-interactive {
    cursor: var(--card-cursor, pointer);
  }

  .card-interactive:focus-visible {
    outline: var(--card-focus-outline, 2px solid currentColor);
    outline-offset: var(--card-focus-outline-offset, 2px);
  }

  /* stretch: fill parent height */
  .card-stretch {
    height: var(--card-stretch-height, 100%);
    display: flex;
    flex-direction: column;
  }

  /* when stretch is on, content area should grow to fill remaining space */
  .card-stretch .card-content {
    flex: var(--card-content-flex, 1);
  }

  /* when scrollable=true the child sets overflow-y:auto, so the card must not clip it */
  .card-has-scroll {
    overflow: visible;
  }

  /* header row layout — base block flow; flex only applied when headerRight is present */
  .card-header {
    padding: var(--card-header-padding, 16px 16px 0);
    border-bottom: var(--card-header-border-bottom, none);
  }

  /* flex layout activated only when headerRight snippet is provided */
  .card-header-split {
    display: flex;
    align-items: var(--card-header-align-items, flex-start);
    justify-content: space-between;
    gap: var(--card-header-gap, 8px);
  }

  .card-header-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .card-header-right {
    display: flex;
    align-items: var(--card-header-right-align-items, center);
    flex-shrink: 0;
  }

  .card-title {
    font-size: var(--card-title-font-size, 16px);
    font-weight: var(--card-title-font-weight, 600);
    color: var(--card-title-color, inherit);
  }

  .card-description {
    font-size: var(--card-description-font-size, 14px);
    color: var(--card-description-color, inherit);
    opacity: var(--card-description-opacity, 0.6);
    margin-top: var(--card-description-margin-top, 4px);
  }

  .card-content {
    padding: var(--card-content-padding, 16px);
  }

  /* scrollable content area */
  .card-content-scrollable {
    overflow-y: auto;
    max-height: var(--card-content-max-height, 400px);
    scrollbar-width: var(--card-content-scrollbar-width, thin);
  }

  /* footer */
  .card-footer {
    padding: var(--card-footer-padding, 12px 16px);
    border-top: var(--card-footer-border-top, none);
    background: var(--card-footer-background, inherit);
  }
</style>
