<script lang="ts">
  import type { BadgeProperties } from './properties';

  export let properties: BadgeProperties | null = null;
</script>

{#if properties !== null}
  <div class="badge-icon">
    <div class="badge-wrap">
      <img class="icon-img" src={properties.image} alt="" />
      <div class="badge">{properties.value}</div>
    </div>
  </div>
{/if}

<style>
  .badge-wrap {
    position: relative;
    display: inline-block;
    margin: var(--badge-wrap-margin, 0px 12px 10px 0px);
    padding: var(--badge-wrap-padding, 8px 8px 8px 8px);
  }

  .badge {
    position: absolute;
    color: var(--badge-color, #fff);
    background-color: var(--badge-background, #727272);
    font-size: var(--badge-font-size, 12px);
    font-family: var(--badge-font-family, Euclid Circular A);
    padding: var(--badge-padding, 2px 7.5px);
    border-radius: var(--badge-border-radius, 100px);
    min-width: var(--badge-min-width, 7px);
    min-height: var(--badge-min-height, 7px);
    border: var(--badge-border, 0.6px solid #fff);
    top: var(--badge-top, 0);
    right: var(--badge-right, 0);
    bottom: var(--badge-bottom);
    left: var(--badge-left);
  }

  .icon-img {
    border-radius: var(--badge-img-border-radius, 6px);
    width: var(--badge-img-width, 64px);
    height: var(--badge-img-height, 64px);
    object-fit: contain;
    box-shadow: var(--badge-img-icon-shadow, 0 0 0 0.5px #798fa54d);
  }
</style>
