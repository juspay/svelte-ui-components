<script lang="ts">
  import type { BannerProperties } from './properties';

  export let properties: BannerProperties | null = null;
</script>

{#if properties !== null}
  <div class="banner" on:click on:keydown role="button" tabindex="0">
    {#if properties.icon !== null}
      <div class="banner-image">
        <img src={properties.icon} alt="" />
      </div>
    {/if}
    <div class="banner-text">
      {#if properties.linkText !== null}
        <div>{properties.text}<span class="link-text">{properties.linkText}</span></div>
      {:else}
        <div>{properties.text}</div>
      {/if}
    </div>
  </div>
{/if}

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
</style>
