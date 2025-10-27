<script lang="ts">
  import type { BannerProperties } from './properties';

  let { icon, text, linkText, rightContent, onclick, onkeydown }: BannerProperties = $props();
</script>

<div class="banner" {onclick} {onkeydown} role="button" tabindex="0">
  {#if icon}
    <div class="banner-image">
      <img src={icon} alt="" />
    </div>
  {/if}
  <div class="banner-text">
    {#if linkText}
      <div>{text}<span class="link-text">{linkText}</span></div>
    {:else}
      <div>{text}</div>
    {/if}
  </div>
  {#if rightContent}
    <div class="right-content">
      {@render rightContent()}
    </div>
  {/if}
</div>

<style>
  .banner {
    position: var(--banner-position, sticky);
    top: var(--banner-top, 0px);
    display: var(--banner-display, flex);
    align-items: var(--banner-align-items, center);
    background-color: var(--banner-bg-color, #637c9529);
    width: var(--banner-width, 100%);
    height: var(--banner-height, 37px);
    padding: var(--banner-padding, 10px 12px, 10px, 12px);
    gap: var(--banner-gap, 8px);
    justify-content: var(--banner-justify-content, center);
    cursor: var(--banner-cursor, pointer);
  }

  .banner-image {
    color: var(--banner-img-color, #637c95);
    width: var(--banner-img-width, 18px);
    height: var(--banner-img-height, 11.69px);
    margin-bottom: var(--banner-img-margin-bottom, 6px);
    align-items: var(--banner-image-align-items, center);
  }

  .banner-text {
    flex: var(--banner-text-flex);
    order: var(--banner-text-order);
    size: var(--banner-text-size, 14px);
    font-family: var(--banner-font-family, Euclid Circular A);
    font-style: var(--banner-font-style, normal);
    color: var(--banner-text-color, #637c95);
    font-size: var(--banner-font-size, 14px);
    line-height: var(--banner-line-height, 17.75px);
    font-weight: var(--banner-font-weight, 500);
    overflow: var(--banner-overflow, hidden);
    text-overflow: var(--banner-text-overflow, ellipsis);
    white-space: var(--banner-text-white-space, nowrap);
    align-items: var(--banner-text-align-items, center);
  }

  .link-text {
    color: var(--banner-linktext-color, #0099ff);
  }

  .right-content {
    order: var(--banner-right-content-order);
    display: var(--banner-right-content-display, flex);
  }
</style>
