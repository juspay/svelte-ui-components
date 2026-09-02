<script lang="ts">
  import type { StatusProperties } from './properties';
  import Button from '$lib/Button/Button.svelte';
  import Img from '$lib/Img/Img.svelte';

  /**
   * The documented default, kept as the default so this is not a breaking
   * change. It is a relative URL resolved against whatever page renders the
   * component, and the library ships no such file, so it only ever pointed at
   * something real for an app serving that exact path at its own root -- and
   * resolved to `<route>/icons/order-success-icon.svg` anywhere deeper.
   */
  const LEGACY_DEFAULT_STATUS_ICON = 'icons/order-success-icon.svg';

  /**
   * Stands in when the legacy default cannot be fetched, so an app that does
   * host that path keeps getting its own file and every other app stops
   * rendering a broken image.
   *
   * Carries no `role` or `aria-label` of its own. Both are in `Img`'s
   * allowlist, so a root declaring them would be copied onto the live host and
   * would outrank the label `Img` derives from `alt` -- pinning every default
   * icon to "Success", including on a failure screen.
   */
  const BUILTIN_STATUS_ICON =
    "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2048%2048'%3E%3Ccircle%20cx%3D'24'%20cy%3D'24'%20r%3D'22'%20fill%3D'%23e6f6ec'%20stroke%3D'%232e994c'%20stroke-width%3D'2'%2F%3E%3Cpath%20d%3D'M15%2024.5l6.5%206.5L33%2019.5'%20fill%3D'none'%20stroke%3D'%232e994c'%20stroke-width%3D'3.5'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%2F%3E%3C%2Fsvg%3E";

  let {
    statusIcon = LEGACY_DEFAULT_STATUS_ICON,
    statusIconAlt = 'status',
    statusText = '',
    statusTextTag = 'div',
    statusDescription = '',
    buttonProperties,
    classes,
    onbuttonClick,
    icon,
    descriptionSnippet,
    children,
    testId
  }: StatusProperties = $props();

  // Scoped to the untouched default on purpose. Applying it to a caller's own
  // icon would answer a failed failure-icon with a success checkmark.
  const statusIconFallback = $derived(
    statusIcon === LEGACY_DEFAULT_STATUS_ICON ? BUILTIN_STATUS_ICON : null
  );
</script>

<div
  class="background {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <div class="order-status">
    <div class="status-image">
      {#if icon}
        {@render icon()}
      {:else}
        <Img inlineSvg src={statusIcon} fallback={statusIconFallback} alt={statusIconAlt} />
      {/if}
    </div>
    <svelte:element
      this={statusTextTag}
      class="status-text"
      class:status-text-default={statusTextTag === 'div'}>{statusText}</svelte:element
    >
    <div class="status-description">
      {#if typeof descriptionSnippet === 'function'}
        {@render descriptionSnippet()}
      {:else}
        <!-- eslint-disable-next-line -->
        {@html statusDescription}
      {/if}
    </div>
    {#if typeof buttonProperties === 'object'}
      <Button {...buttonProperties} onclick={onbuttonClick} />
    {/if}
    {#if typeof children === 'function'}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  .status-text {
    margin-bottom: 8px;
  }

  /* The weight and colour defaults belong to the plain div only. When a consumer asks for a
     heading tag (statusTextTag h1-h6) the whole point is that the application's own heading
     typography applies, so those two declarations must not sit on the element and win. */
  .status-text-default {
    font-weight: var(--status-font-weight, 600);
    color: var(--status-description-font-color, #2f3841);
  }

  .status-description {
    font-weight: var(--status-font-weight, 400);
    color: var(--status-description-font-color, #436484cc);
    padding: 0px 42px;
    margin-bottom: 25px;
  }

  .status-image {
    color: var(--status-icon-color, inherit);
    display: flex;
    margin-bottom: 25px;
  }

  .background {
    min-height: var(--status-min-height, 100vh);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .order-status {
    flex-direction: column;
    display: flex;
    font-family: var(--order-font, inherit);
    font-size: var(--order-font-size, 14px);
    text-align: center;
  }
  @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
    .order-status {
      background-color: var(--status-panel-background, rgba(255, 255, 255, 0.6));
      -webkit-backdrop-filter: var(--status-panel-backdrop-filter, blur(60px));
      backdrop-filter: var(--status-panel-backdrop-filter, blur(60px));
    }
  }
</style>
