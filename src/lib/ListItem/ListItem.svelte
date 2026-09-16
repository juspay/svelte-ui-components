<script lang="ts">
  import Accordion from '$lib/Accordion/Accordion.svelte';
  import Loader from '$lib/Loader/Loader.svelte';
  import Img from '$lib/Img/Img.svelte';
  import type { ListItemProperties } from './properties';
  import { resolveLabelHtml } from './label';

  let {
    leftImageUrl,
    leftImageFallbackUrl,
    rightImageUrl,
    label,
    sanitize,
    useAccordion = false,
    rightContentText,
    testId,
    topSectionTestId,
    rightImageTestId,
    leftImageTestId,
    centerTextTestId,
    showLoader = false,
    showRightContentLoader = false,
    expand = $bindable(false),
    preventFocus = false,
    suppressRoleAndTabindex = false,
    leftContent,
    centerContent,
    rightContent,
    bottomContent,
    onleftimageclick,
    onrightimageclick,
    oncentertextclick,
    onitemclick,
    ontopsectionclick,
    onkeydown,
    classes,
    transformSvg,
    role: itemRole,
    ariaSelected,
    id
  }: ListItemProperties = $props();

  // DESIGN_PRINCIPLES.md principle 4: a region only takes role="button" + a tab stop when
  // it was actually given its own click handler -- otherwise a single list item nests up to
  // four buttons inside a button and puts five tab stops where the consumer wired one
  // handler. Each of the four sub-regions is checked against its own handler prop here. The
  // root is intentionally NOT re-gated the same way: its role/tabindex stay governed by the
  // pre-existing `itemRole`/`suppressRoleAndTabindex` contract (see below), unconditional on
  // onitemclick, matching the library's documented default ("ListItem renders synthetic
  // button roles and tab stops by default").
  let topSectionInteractive = $derived(
    !suppressRoleAndTabindex && typeof ontopsectionclick === 'function'
  );
  let leftImageInteractive = $derived(
    !suppressRoleAndTabindex && typeof onleftimageclick === 'function'
  );
  let centerTextInteractive = $derived(
    !suppressRoleAndTabindex && typeof oncentertextclick === 'function'
  );
  let rightImageInteractive = $derived(
    !suppressRoleAndTabindex && typeof onrightimageclick === 'function'
  );
  let itemInteractive = $derived(!suppressRoleAndTabindex && itemRole !== 'option');

  // Escaped plain text by default; markup only through a consumer-supplied
  // sanitizer -- see ListItemSanitizeOptions in properties.ts and
  // docs/ListItem.md "Rendering markup in the label" for the full contract.
  let labelHtml = $derived(typeof label === 'string' ? resolveLabelHtml(label, sanitize) : '');

  function handleLeftImageClick(event: MouseEvent): void {
    onleftimageclick?.(event);
  }

  function handleRightImageClick(event: MouseEvent): void {
    onrightimageclick?.(event);
  }

  function handleCenterTextClick(event: MouseEvent): void {
    oncentertextclick?.(event);
  }

  function handleItemClick(event: MouseEvent): void {
    onitemclick?.(event);
  }

  function handleTopSectionClick(event: MouseEvent): void {
    ontopsectionclick?.(event);
  }

  // A region with role="button" needs Enter/Space to do what a click does (divs get no
  // free keyboard activation the way a native <button> would). Re-dispatching a real click
  // on the element itself -- rather than calling its handler directly -- keeps one
  // activation path and lets that click bubble through nested zones exactly like a pointer
  // click already does. The `event.target === event.currentTarget` guard matters only
  // because zones can nest (a consumer-supplied root handler alongside a sub-region
  // handler): without it, the same keydown bubbling from a focused, activated sub-region up
  // through an also-interactive ancestor would synthesize a second click at every ancestor
  // it passes through.
  function activateOnEnterOrSpace(interactive: boolean, event: KeyboardEvent): void {
    onkeydown?.(event);
    if (!interactive || event.target !== event.currentTarget) {
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.click();
    }
  }

  function handleItemKeydown(event: KeyboardEvent): void {
    activateOnEnterOrSpace(itemInteractive, event);
  }

  function handleTopSectionKeydown(event: KeyboardEvent): void {
    activateOnEnterOrSpace(topSectionInteractive, event);
  }

  function handleLeftImageKeydown(event: KeyboardEvent): void {
    activateOnEnterOrSpace(leftImageInteractive, event);
  }

  function handleCenterTextKeydown(event: KeyboardEvent): void {
    activateOnEnterOrSpace(centerTextInteractive, event);
  }

  function handleRightImageKeydown(event: KeyboardEvent): void {
    activateOnEnterOrSpace(rightImageInteractive, event);
  }
</script>

{#if (typeof leftImageUrl === 'string' && leftImageUrl.length > 0) || (typeof rightImageUrl === 'string' && rightImageUrl.length > 0) || (typeof label === 'string' && label.length > 0) || typeof leftContent === 'function' || typeof centerContent === 'function' || typeof rightContent === 'function' || typeof bottomContent === 'function'}
  <div class="item-container {classes ?? ''}">
    {#if showLoader}
      <div class="item-loader"></div>
    {/if}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      class="item"
      class:prevent-focus={preventFocus}
      onclick={handleItemClick}
      onkeydown={handleItemKeydown}
      role={suppressRoleAndTabindex ? null : (itemRole ?? 'button')}
      tabindex={suppressRoleAndTabindex ? null : itemRole === 'option' ? -1 : 0}
      aria-selected={suppressRoleAndTabindex ? null : ariaSelected}
      {id}
      data-pw={testId}
      testID={testId}
    >
      <div
        class="top-section"
        class:prevent-focus={preventFocus}
        onclick={handleTopSectionClick}
        onkeydown={handleTopSectionKeydown}
        role={topSectionInteractive ? 'button' : null}
        tabindex={topSectionInteractive ? 0 : null}
        data-pw={topSectionTestId}
        testID={topSectionTestId}
      >
        <div class="left-content">
          {#if typeof leftImageUrl === 'string' && leftImageUrl.length > 0}
            <div
              class:prevent-focus={preventFocus}
              onclick={handleLeftImageClick}
              onkeydown={handleLeftImageKeydown}
              role={leftImageInteractive ? 'button' : null}
              tabindex={leftImageInteractive ? 0 : null}
              data-pw={leftImageTestId}
              testID={leftImageTestId}
            >
              <Img src={leftImageUrl} alt="" fallback={leftImageFallbackUrl} {transformSvg} />
            </div>
          {/if}
          {#if typeof leftContent === 'function'}
            {@render leftContent?.()}
          {/if}
        </div>
        <div class="center-content">
          {#if typeof label === 'string' && label.length > 0}
            <div
              class="center-text"
              class:prevent-focus={preventFocus}
              onclick={handleCenterTextClick}
              onkeydown={handleCenterTextKeydown}
              role={centerTextInteractive ? 'button' : null}
              tabindex={centerTextInteractive ? 0 : null}
              data-pw={centerTextTestId}
              testID={centerTextTestId}
            >
              <!-- labelHtml is escaped by default; markup only reaches here through a
                   consumer-supplied sanitizer -- see ListItemSanitizeOptions.htmlSanitizer
                   in properties.ts. -->
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html labelHtml}
            </div>
          {/if}
          {#if typeof centerContent === 'function'}
            {@render centerContent?.()}
          {/if}
        </div>
        <div class="right-content">
          {#if typeof rightContent === 'function'}
            {@render rightContent?.()}
          {/if}
          {#if typeof rightImageUrl === 'string' && rightImageUrl.length > 0}
            <div
              class:prevent-focus={preventFocus}
              onclick={handleRightImageClick}
              onkeydown={handleRightImageKeydown}
              role={rightImageInteractive ? 'button' : null}
              tabindex={rightImageInteractive ? 0 : null}
              data-pw={rightImageTestId}
              testID={rightImageTestId}
            >
              <div class="right-img-wrapper">
                <Img src={rightImageUrl} alt="" {transformSvg} />
              </div>
            </div>
          {/if}
          {#if showRightContentLoader}
            <div class="right-content-loader">
              <Loader />
            </div>
          {/if}
          {#if typeof rightContentText === 'string' && rightContentText.length > 0}
            <span class="right-content-text">{rightContentText}</span>
          {/if}
        </div>
      </div>
      <div class="bottom-section">
        {#if typeof bottomContent === 'function' && useAccordion}
          <Accordion {expand}>
            {@render bottomContent()}
          </Accordion>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .item-container {
    position: relative;
    --loader-foreground: var(--list-item-loader-foreground, #86898d);
    --loader-background: var(--list-item-loader-background, #ffffff);
    --loader-foreground-end: var(--list-item-loader-foreground-end, #ffffff);
  }

  .item-loader {
    position: absolute;
    height: 100%;
    width: 100%;
    background: var(--list-item-loader-background-color, #00000030);
    z-index: 20;
    animation: fill-loader ease-in-out var(--list-item-loader-duration, 8s);
  }

  @keyframes fill-loader {
    0% {
      width: 0;
    }

    100% {
      width: 100%;
    }
  }

  /* Same hazard as Button's progress-bar loader (see its comment for the full
     reasoning): this bar's width is a real elapsed-time signal over
     `--list-item-loader-duration`, not decoration, so a bare `animation: none`
     would freeze it at the base rule's `width: 100%` and read as "finished"
     for the entire duration instead of "still loading". Discrete steps keep
     the width an honest (if coarser) lower bound on elapsed time -- it can
     only under-report, never claim to be further along than it is -- while
     dropping the continuous slide prefers-reduced-motion targets. Lives in
     the component's own <style> because that is the only stylesheet that
     reaches inside the shadow root a custom-element consumer gets. */
  @media (prefers-reduced-motion: reduce) {
    .item-loader {
      /* A LITERAL step count, deliberately not a token. `steps()` is invalid
         below 1, and an invalid value does not degrade to a safer stepped
         default: the whole declaration is dropped and the property falls back to
         the base rule's easing, restoring the continuous slide this block exists
         to remove. A consumer passing 0 to "just freeze it" would silently
         switch the guard off for every user who asked for reduced motion, and a
         guard that fails OPEN without saying so is worse than no guard. */
      animation-timing-function: steps(5, jump-end);
    }
  }

  .item {
    display: flex;
    flex-direction: column;
    background-color: var(--list-item-background-color, transparent);
    -webkit-tap-highlight-color: transparent;
    cursor: var(--list-item-cursor, pointer);
    -moz-box-shadow: var(--list-item-box-shadow, none);
    -webkit-box-shadow: var(--list-item-box-shadow, none);
    box-shadow: var(--list-item-box-shadow, none);
    width: var(--list-item-box-width);
    border-radius: var(--list-item-border-radius, 0px);
    margin: var(--list-item-margin);
    padding: var(--list-item-padding);
    border: var(--list-item-border);
    transition: var(--list-item-transition);
  }

  .item:hover {
    background-color: var(--list-item-hover-background-color, var(--list-item-background-color));
    border: var(--list-item-hover-border, var(--list-item-border));
  }

  .top-section {
    display: flex;
    flex-direction: row;
    align-items: var(--list-item-top-section-align-items);
    gap: var(--list-item-top-section-gap);
    margin-bottom: 0;
  }

  .left-content {
    display: var(--list-item-left-content-display, flex);
    --image-height: var(--list-item-left-image-height, 24px);
    --image-width: var(--list-item-left-image-width, 24px);
    --image-padding: var(--list-item-left-image-padding, 0px);
    --image-border-radius: var(--list-item-left-image-border-radius, 0px);
    --image-margin: var(--list-item-left-image-margin, 0px);
    --image-filter: var(--list-item-left-image-filter, none);
    --image-background: var(--list-item-left-image-background);
    --image-border: var(--list-item-left-image-border);
    --image-transition: var(--list-item-transition);
    --image-object-fit: var(--list-item-left-image-object-fit);
    --image-hover-background: var(
      --list-item-left-image-hover-background,
      var(--list-item-left-image-background)
    );
    --image-hover-border: var(
      --list-item-left-image-hover-border,
      var(--list-item-left-image-border)
    );
  }

  .center-text {
    display: flex;
    flex-direction: column;
    justify-content: var(--list-item-center-text-justify-content, flex-start);
    padding: var(--list-item-center-text-padding, 0px 20px);
    color: var(--list-item-center-text-color, #2f3841);
    font-size: var(--list-item-center-text-font-size, 12px);
    font-weight: var(--list-item-center-text-font-weight, 300);
    align-items: var(--list-item-center-text-vertical-align);
    margin: var(--list-item-center-text-margin);
    border: var(--list-item-center-text-border);
    cursor: var(--list-item-center-text-cursor, pointer);
    font-family: var(--list-item-center-text-font-family, inherit);
  }

  .center-content {
    display: flex;
    flex: 1;
    min-width: 0;
  }

  .right-content {
    display: var(--list-item-right-content-display, flex);
    flex: var(--list-item-right-content-flex);
  }

  .right-content-loader {
    margin: var(--list-item-right-content-loader-margin);
  }

  .bottom-section {
    flex-direction: row;
    margin-top: 0;
  }

  .right-img-wrapper {
    --image-height: var(--list-item-right-image-height, 18px);
    --image-width: var(--list-item-right-image-width, 18px);
    --image-padding: var(--list-item-right-image-padding, 0px);
    --image-border-radius: var(--list-item-right-image-border-radius, 0px);
    --image-margin: var(--list-item-right-image-margin, 0px);
    --image-filter: var(--list-item-right-image-filter);
    --image-background: var(--list-item-right-image-background);
    --image-border: var(--list-item-right-image-border);
    --image-transition: var(--list-item-transition);
    --image-hover-background: var(
      --list-item-right-image-hover-background,
      var(--list-item-right-image-background)
    );
    --image-hover-border: var(
      --list-item-right-image-hover-border,
      var(--list-item-right-image-border)
    );
  }

  .right-content-text {
    color: var(--list-item-right-content-text-color, #2f3841);
    font-size: var(--list-item-right-content-text-font-size, 12px);
    font-weight: var(--list-item-right-content-text-font-weight, 300);
    display: var(--list-item-right-content-display, flex);
    align-items: var(--list-item-right-content-text-vertical-align);
    padding: var(--list-item-right-content-text-padding, 0px);
    margin: var(--list-item-right-content-text-margin, 0px);
    border: var(--list-item-right-content-text-border);
    cursor: var(--list-item-right-content-text-cursor, pointer);
    font-family: var(--list-item-right-content-text-font-family, inherit);
    justify-content: var(--list-item-right-content-text-justify-content);
  }

  .prevent-focus:focus {
    outline: none;
  }

  /* preventFocus does not touch tabindex (see the root's tabindex expression
     above -- itemRole/suppressRoleAndTabindex govern that, unconditional on
     this prop), so every element carrying .prevent-focus stays a real,
     keyboard-Tab-reachable stop by default. docs/ListItem.md documents the
     prop as removing the outline "for non-keyboard navigation contexts" --
     :focus-visible is that exact distinction already built into the
     platform: it does not match a mouse/touch-triggered focus (the case the
     prop exists for) but does match a real keyboard Tab, so this restores
     WCAG 2.4.7 visibility for the one case preventFocus was never meant to
     hide it from. */
  .prevent-focus:focus-visible {
    outline: var(--list-item-focus-outline, 2px solid #2563eb);
    outline-offset: var(--list-item-focus-outline-offset, -2px);
  }
  /* The loader is not the only motion in this file, and this block sits at the
     END on purpose: `.item` is declared after the guard above, so an override
     placed there would lose the same-specificity tie on source order -- the
     cascade trap BrandLoader's own guard had to account for.
     `--image-transition` is not a transition on this element at all; it is a
     custom property handed DOWN to the Img child, and a custom property is the
     only thing that crosses that boundary. Setting `transition: none` here would
     never reach the image, so the property itself is neutralised. */
  @media (prefers-reduced-motion: reduce) {
    .item {
      transition: none;
    }

    .left-content,
    .right-img-wrapper {
      --image-transition: none;
    }
  }
</style>
