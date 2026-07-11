<script lang="ts">
  import Img from '../Img/Img.svelte';
  import type { IconProperties } from './properties';

  let { icon, svg, text, onclick, onkeydown, classes, testId }: IconProperties = $props();
</script>

<div
  class="icon-container {classes ?? ''}"
  {onclick}
  {onkeydown}
  role="button"
  tabindex="0"
  data-pw={typeof testId === 'string' ? testId : null}
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

<style>
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
