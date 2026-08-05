<script lang="ts">
  import Loader from '../Loader/Loader.svelte';
  import type { ButtonProperties } from './properties';

  let {
    text,
    variant = 'primary',
    size = 'md',
    iconOnly = false,
    fullWidth = false,
    href,
    target,
    rel,
    loading = false,
    allowHtml = false,
    enable = true,
    disabled = false,
    showLoader = false,
    loaderType,
    showProgressBar = $bindable(false),
    type = 'button',
    testId,
    ariaLabel,
    ariaExpanded,
    ariaSelected,
    role,
    onclick,
    onkeydown = () => {},
    onkeyup = () => {},
    onmousedown,
    onmouseup,
    onmouseleave,
    ontouchstart,
    ontouchend,
    icon,
    children,
    classes,
    style
  }: ButtonProperties = $props();

  // `loading` and the legacy Circular loaderType both render the spinner and disable the button.
  let showCircularLoader = $derived(loading || (showLoader && loaderType === 'Circular'));
  // The legacy ProgressBar loader stays clickable until the first click starts the bar, then
  // it disables (the documented flow). So it must NOT count toward "disabled" before it starts.
  let isProgressBarLoader = $derived(showLoader && loaderType === 'ProgressBar');
  let isBusy = $derived(showCircularLoader || showProgressBar);
  let isDisabled = $derived(disabled || !enable || showCircularLoader || showProgressBar);
  let resolvedRel = $derived(rel ?? (target === '_blank' ? 'noopener noreferrer' : null));

  function handleButtonClick(event: MouseEvent): void {
    if (isDisabled) {
      // Anchors have no native disabled state — block navigation/handler explicitly.
      if (href) {
        event.preventDefault();
      }
      return;
    }
    onclick?.(event);
    if (isProgressBarLoader) {
      showProgressBar = true;
    }
  }
</script>

<div
  class="button-container variant-{variant} size-{size} {classes ?? ''}"
  class:icon-only={iconOnly}
  class:full-width={fullWidth}
  style={style ?? null}
>
  {#if showProgressBar}
    <div class="button-progress-bar"></div>
  {/if}
  <svelte:element
    this={href ? 'a' : 'button'}
    class="button-el"
    class:disabled={isDisabled}
    onclick={handleButtonClick}
    {onkeydown}
    {onkeyup}
    {onmousedown}
    {onmouseup}
    {onmouseleave}
    {ontouchstart}
    {ontouchend}
    data-pw={testId}
    testID={testId}
    role={role ?? null}
    aria-label={ariaLabel ?? null}
    aria-expanded={ariaExpanded ?? null}
    aria-selected={ariaSelected ?? null}
    aria-busy={isBusy || null}
    type={href ? null : type}
    disabled={href ? null : isDisabled}
    href={href ? (isDisabled ? null : href) : null}
    target={href ? target : null}
    rel={href ? resolvedRel : null}
    aria-disabled={href && isDisabled ? 'true' : null}
    tabindex={href && isDisabled ? -1 : null}
  >
    {#if showCircularLoader}
      <div class="button-loader"><Loader /></div>
    {/if}
    {#if typeof icon === 'function'}
      <div class="button-icon">{@render icon()}</div>
    {/if}
    {#if typeof text === 'string' && text.length > 0}
      {#if allowHtml}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div class="button-text">{@html text}</div>
      {:else}
        <div class="button-text">{text}</div>
      {/if}
    {/if}
    {#if typeof children === 'function'}
      {@render children()}
    {/if}
  </svelte:element>
</div>

<style>
  .button-container {
    position: relative;
    width: var(--button-width, fit-content);
  }

  /* ---- Variant defaults (set the internal --_btn-* layer; explicit --button-* always wins) ---- */
  .variant-primary {
    --_btn-color: #3a4550;
    --_btn-text-color: #ffffff;
    --_btn-border: none;
  }

  .variant-secondary {
    --_btn-color: transparent;
    --_btn-text-color: #3a4550;
    --_btn-border: 1px solid #cbd5e1;
    --_btn-hover-color: #f1f5f9;
    --_btn-hover-text-color: #3a4550;
    --_btn-hover-border: 1px solid #cbd5e1;
  }

  .variant-ghost {
    --_btn-color: transparent;
    --_btn-text-color: #3a4550;
    --_btn-border: none;
    --_btn-hover-color: #f1f5f9;
    --_btn-hover-text-color: #3a4550;
    --_btn-hover-border: none;
  }

  .variant-destructive {
    --_btn-color: #e7000b;
    --_btn-text-color: #ffffff;
    --_btn-border: none;
    --_btn-hover-color: #c10007;
    --_btn-hover-text-color: #ffffff;
    --_btn-hover-border: none;
  }

  /* Transparent chassis for gradient marketing CTAs — deliberately no background
     of its own. Pair with a --button-background gradient (and usually a matching
     --button-hover-color, since --_btn-hover-color sits before --button-background
     in the hover fallback chain and would otherwise flatten the gradient to
     transparent on hover). Geometry (padding/font-size) is intentionally left to
     the size preset, not this variant. */
  .variant-brand {
    --_btn-color: transparent;
    --_btn-text-color: #ffffff;
    --_btn-border: none;
    --_btn-hover-color: transparent;
    --_btn-hover-text-color: #ffffff;
    --_btn-hover-border: none;
  }

  /* ---- Size defaults (md reproduces the legacy 16px padding / 14px font) ---- */
  .size-sm {
    --_btn-padding: 8px 12px;
    --_btn-font-size: 13px;
  }

  .size-md {
    --_btn-padding: 16px;
    --_btn-font-size: 14px;
  }

  .size-lg {
    --_btn-padding: 20px 28px;
    --_btn-font-size: 16px;
  }

  .icon-only {
    --_btn-padding: 8px;
  }

  .icon-only.size-sm {
    --_btn-padding: 6px;
  }

  .icon-only.size-lg {
    --_btn-padding: 12px;
  }

  .full-width {
    --button-width: 100%;
  }

  .button-el {
    max-height: var(--button-max-height);
    max-width: var(--button-max-width);
    min-width: var(--button-min-width);
    font-family: var(--button-font-family);
    font-weight: var(--button-font-weight, 500);
    font-size: var(--button-font-size, var(--_btn-font-size, 14px));
    background-color: var(--button-color, var(--_btn-color, #3a4550));
    /* Image layer, deliberately not the `background` shorthand — the shorthand
       would reset a consumer's own background-image/position/size layers
       whenever the hook is unset. Gradients go here; solids stay on --button-color. */
    background-image: var(--button-background, none);
    color: var(--button-text-color, var(--_btn-text-color, white));
    height: var(--button-height, fit-content);
    padding: var(--button-padding, var(--_btn-padding, 16px));
    margin: var(--button-margin);
    border-radius: var(--button-border-radius, var(--radius, 6px));
    width: var(--button-width, fit-content);
    cursor: var(--cursor, pointer);
    opacity: var(--opacity, 1);
    border: var(--button-border, var(--_btn-border, none));
    box-sizing: border-box;
    text-decoration: none;
    display: flex;
    justify-content: var(--button-justify-content, center);
    align-items: center;
    flex-direction: var(--button-content-flex-direction, row);
    gap: var(--button-content-gap, 16px);
    visibility: var(--button-visibility, visible);
    box-shadow: var(--button-box-shadow, none);
    transition: var(--button-transition, none);

    /* A button label should never soft-wrap onto a second line as the label text
       changes (e.g. "Select" -> "Select (1)") — that jitters the layout around it.
       Consumers that genuinely want multi-line buttons opt back in via the var. */
    white-space: var(--button-white-space, nowrap);
  }

  .button-el.disabled,
  .button-el:disabled {
    cursor: var(--disabled-cursor, not-allowed);
    opacity: var(--disabled-opacity, 0.4);
    color: var(--disabled-text-color, var(--button-text-color, var(--_btn-text-color, white)));
    font-size: var(--disabled-font-size);
    font-weight: var(--disabled-font-weight);
    /* Preserve the variant border when disabled so secondary (bordered) stays distinct from ghost. */
    border: var(--disabled-border, var(--button-border, var(--_btn-border, none)));
    background: var(
      --disabled-background-color,
      var(--button-background, var(--button-color, var(--_btn-color, #3a4550)))
    );
    box-shadow: var(
      --button-disabled-box-shadow,
      var(--disabled-box-shadow, var(--button-box-shadow, none))
    );
  }

  .button-loader {
    order: var(--button-loader-order, 1);
  }

  .button-icon {
    order: var(--button-icon-order, 2);
    display: var(--button-icon-display);
  }

  .button-text {
    order: var(--button-text-order, 3);
    display: var(--button-text-display);

    /* With nowrap as the default, a label longer than the button's box would
       otherwise bleed past it — truncate with an ellipsis instead. Full labels
       stay available via the button's accessible name / title at the call site. */
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .button-el:hover:not(.disabled) {
    background: var(
      --button-hover-color,
      var(
        --_btn-hover-color,
        var(--button-background, var(--button-color, var(--_btn-color, #3a4550)))
      )
    );
    color: var(
      --button-hover-text-color,
      var(--_btn-hover-text-color, var(--button-text-color, var(--_btn-text-color, white)))
    );
    border: var(
      --button-hover-border,
      var(--_btn-hover-border, var(--button-border, var(--_btn-border, none)))
    );
    transform: var(--button-hover-transform);
    box-shadow: var(--button-hover-box-shadow, var(--button-box-shadow, none));
  }

  .button-el:active:not(.disabled) {
    transform: var(--button-active-transform);
    background: var(
      --button-active-background,
      var(--button-background, var(--button-color, var(--_btn-color, #3a4550)))
    );
    box-shadow: var(--button-active-box-shadow, var(--button-box-shadow, none));
  }

  .button-el:focus-visible {
    box-shadow: var(--button-focus-visible-box-shadow, var(--button-box-shadow, none));
  }

  .button-progress-bar {
    position: absolute;
    height: 100%;
    width: 100%;
    background: var(--button-progress-loader-background-color, #00000030);
    animation: fill-loader var(--button-progress-loader-duration, 8s) forwards;
    z-index: 2;
  }

  @keyframes fill-loader {
    0% {
      width: 0;
    }

    100% {
      width: 100%;
    }
  }
</style>
