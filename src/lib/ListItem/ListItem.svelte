<script lang="ts">
  import Accordion from '$lib/Accordion/Accordion.svelte';
  import Loader from '$lib/Loader/Loader.svelte';
  import Img from '$lib/Img/Img.svelte';
  import type { ListItemProperties } from './properties';

  let {
    leftImageUrl,
    leftImageFallbackUrl,
    rightImageUrl,
    label,
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
    leftContent,
    centerContent,
    rightContent,
    bottomContent,
    onleftImageClick,
    onrightImageClick,
    oncenterTextClick,
    onitemClick,
    ontopSectionClick,
    onkeydown,
    classes,
    role: itemRole,
    ariaSelected,
    id
  }: ListItemProperties = $props();

  function handleLeftImageClick(event: MouseEvent): void {
    onleftImageClick?.(event);
  }

  function handleRightImageClick(event: MouseEvent): void {
    onrightImageClick?.(event);
  }

  function handleCenterTextClick(event: MouseEvent): void {
    oncenterTextClick?.(event);
  }

  function handleItemClick(event: MouseEvent): void {
    onitemClick?.(event);
  }

  function handleTopSectionClick(event: MouseEvent): void {
    ontopSectionClick?.(event);
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
      {onkeydown}
      role={itemRole ?? 'button'}
      tabindex={itemRole === 'option' ? -1 : 0}
      aria-selected={ariaSelected}
      {id}
      data-pw={testId}
    >
      <div
        class="top-section"
        class:prevent-focus={preventFocus}
        onclick={handleTopSectionClick}
        {onkeydown}
        role="button"
        tabindex="0"
        data-pw={topSectionTestId}
      >
        <div class="left-content">
          {#if typeof leftImageUrl === 'string' && leftImageUrl.length > 0}
            <div
              class:prevent-focus={preventFocus}
              onclick={handleLeftImageClick}
              {onkeydown}
              role="button"
              tabindex="0"
              data-pw={leftImageTestId}
            >
              <Img src={leftImageUrl} alt="" fallback={leftImageFallbackUrl} />
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
              {onkeydown}
              role="button"
              tabindex="0"
              data-pw={centerTextTestId}
            >
              <!-- eslint-disable-next-line -->
              {@html label}
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
              {onkeydown}
              role="button"
              tabindex="0"
              data-pw={rightImageTestId}
            >
              <div class="right-img-wrapper">
                <Img src={rightImageUrl} alt="" />
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
    font-family: var(--list-item-center-text-font-family);
  }

  .center-content {
    display: flex;
    flex: 1;
    min-width: 0;
  }

  .right-content {
    display: var(--list-item-right-content-display, flex);
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
    font-family: var(--list-item-right-content-text-font-family);
    justify-content: var(--list-item-right-content-text-justify-content);
  }

  .prevent-focus:focus {
    outline: none;
  }
</style>
