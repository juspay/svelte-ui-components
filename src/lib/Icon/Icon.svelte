<script lang="ts">
  import Img from '../Img/Img.svelte';
  import Button from '../Button/Button.svelte';
  import type { IconProperties } from './properties';

  let {
    mask = false,
    size,
    color,
    label,
    icon,
    svg,
    text,
    onclick,
    onkeydown,
    classes,
    testId
  }: IconProperties = $props();

  // A decorative icon is not a control. Without a click handler it keeps no button
  // role and stays out of the tab order, rather than being a focusable no-op that
  // assistive technology announces as a button.
  const interactive = $derived(typeof onclick === 'function');
  const maskActionProperties = $derived(
    typeof label === 'string'
      ? { ariaLabel: label }
      : typeof text === 'string'
        ? { ariaLabel: text }
        : {}
  );

  function handleKeydown(event: KeyboardEvent): void {
    onkeydown?.(event);
    if (!interactive || (event.key !== 'Enter' && event.key !== ' ')) {
      return;
    }
    event.preventDefault();
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.click();
    }
  }
</script>

{#snippet maskShape()}
  <span
    class="icon-mask {interactive ? '' : (classes ?? '')}"
    style:--icon-url={`url("${icon ?? ''}")`}
    style:--icon-size={typeof size === 'number' ? `${size}px` : null}
    style:--icon-color={color ?? null}
    role={!interactive && label ? 'img' : null}
    aria-label={!interactive ? (label ?? null) : null}
    aria-hidden={interactive || !label ? true : null}
    data-pw={!interactive ? (testId ?? null) : null}
    testID={!interactive ? (testId ?? null) : null}
  ></span>
{/snippet}

{#if mask}
  {#if interactive}
    <span class="icon-mask-action {classes ?? ''}">
      <Button unstyled {...maskActionProperties} {onclick} {onkeydown} {testId}>
        {@render maskShape()}
      </Button>
    </span>
  {:else}
    {@render maskShape()}
  {/if}
{:else}
  <div
    class="icon-container {classes ?? ''}"
    {onclick}
    onkeydown={handleKeydown}
    role={interactive ? 'button' : null}
    tabindex={interactive ? 0 : null}
    data-pw={typeof testId === 'string' ? testId : null}
    testID={typeof testId === 'string' ? testId : null}
  >
    {#if typeof svg === 'string' && svg.length > 0}
      <!-- eslint-disable svelte/no-at-html-tags -->
      <span class="icon-svg">{@html svg}</span>
    {:else if icon}
      <!-- Inline the SVG so currentColor strokes/fills inherit the surrounding text
         colour; non-SVG URLs fall back to the plain <img> render automatically. -->
      <Img inlineSvg src={icon} alt="" fallback="" />
    {/if}
    {#if typeof text === 'string' && text.length > 0}
      <div class="icon-text">{text}</div>
    {/if}
  </div>
{/if}

<style>
  .icon-mask {
    display: inline-block;
    flex: 0 0 auto;
    width: var(--icon-size, 24px);
    height: var(--icon-size, 24px);
    background-color: var(--icon-color, currentColor);
    -webkit-mask-image: var(--icon-url);
    mask-image: var(--icon-url);
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
  }

  .icon-mask-action {
    display: inline-flex;
  }

  .icon-mask-action > :global(button) {
    display: inline-flex;
    padding: 0;
    border: 0;
    color: inherit;
    background: transparent;
    cursor: pointer;
  }

  .icon-container {
    display: flex;
    padding: var(--icon-container-paddding, 4px);
    flex-direction: var(--icon-container-direction, column);
    align-items: center;
    cursor: pointer;
  }
  /* Direct child only: the @html branch's svg lives inside .icon-svg and keeps
     its own 100% sizing rule below. */
  .icon-container > :global(img),
  .icon-container > :global(svg) {
    height: var(--icon-height, 20px);
    width: var(--icon-width, 20px);
    padding: var(--icon-padding, 4px);
  }

  .icon-svg {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-width, 20px);
    height: var(--icon-height, 20px);
    padding: var(--icon-padding, 4px);
    color: var(--icon-svg-color, currentColor);
  }

  .icon-svg :global(svg) {
    width: 100%;
    height: 100%;
  }

  .icon-text {
    display: flex;
    padding: var(--icon-text-padding, 4px);
    flex-direction: var(--icon-text-direction, column);
    font-size: var(--icon-text-font-size, 12px);
  }
</style>
