<script lang="ts">
  import type { BadgeProperties } from './properties';

  let {
    image,
    alt = '',
    value,
    mode = 'count',
    hidden = false,
    ariaLabel,
    testId,
    classes
  }: BadgeProperties = $props();

  let showImage = $derived(typeof image === 'string' && image.length > 0);
  let showBadge = $derived(!hidden);
  let isDot = $derived(mode === 'dot');

  let standaloneRole = $derived(isDot ? 'presentation' : 'status');
  let standaloneAriaLabel = $derived(
    isDot ? null : (ariaLabel ?? (typeof value === 'string' ? value : null))
  );
</script>

{#if showImage}
  <div class="badge-icon {classes ?? ''}" data-pw={typeof testId === 'string' ? testId : null}>
    <div class="badge-wrap">
      <img class="icon-img" src={image} {alt} />
      {#if showBadge}
        <div class="badge" class:badge-dot={isDot}>{isDot ? '' : (value ?? '')}</div>
      {/if}
    </div>
  </div>
{:else if showBadge}
  <div
    class="badge badge-standalone {classes ?? ''}"
    class:badge-dot={isDot}
    role={standaloneRole}
    aria-label={standaloneAriaLabel}
    data-pw={typeof testId === 'string' ? testId : null}
  >
    {isDot ? '' : (value ?? '')}
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    line-height: 1;
    color: var(--badge-color, #fff);
    background-color: var(--badge-background, #727272);
    font-size: var(--badge-font-size, 12px);
    font-family: var(--badge-font-family, inherit);
    padding: var(--badge-padding, 3px 8px);
    border-radius: var(--badge-border-radius, 100px);
    min-width: var(--badge-min-width, 18px);
    min-height: var(--badge-min-height, 18px);
    border: var(--badge-border, 1px solid #fff);
    top: var(--badge-top, 0);
    right: var(--badge-right, 0);
    bottom: var(--badge-bottom);
    left: var(--badge-left);
    z-index: 1;
  }

  .badge-dot {
    width: var(--badge-dot-size, 10px);
    height: var(--badge-dot-size, 10px);
    min-width: unset;
    min-height: unset;
    padding: 0;
  }

  .badge-standalone {
    position: var(--badge-standalone-position, static);
  }

  .icon-img {
    border-radius: var(--badge-img-border-radius, 6px);
    width: var(--badge-img-width, 64px);
    height: var(--badge-img-height, 64px);
    object-fit: var(--badge-object-fit, contain);
    box-shadow: var(--badge-img-icon-shadow, 0 0 0 0.5px #798fa54d);
    background-color: var(--badge-img-background-color);
  }
</style>
