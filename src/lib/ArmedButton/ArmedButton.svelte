<script lang="ts">
  import Button from '../Button/Button.svelte';
  import { onDestroy, type Snippet } from 'svelte';
  import type { ArmedButtonProperties } from './properties';

  // Arm-then-confirm for a destructive action: first click arms, second
  // within the window commits, and the arm lapses on its own. No component
  // here models a two-stage confirmation any other way -- a consumer that
  // needs one reaches for this instead of hand-rolling a boolean and a timer,
  // which is exactly how a shared boolean across several rows previously left
  // one control armed forever after a single mis-click.
  //
  // STYLING IS BY CUSTOM PROPERTY, NOT BY CLASS. `classes` lands on this
  // component's own root, same as every other component here; the button
  // underneath is a separate scope a consumer's own selector cannot reach
  // directly, so every one of its properties is bridged through an
  // --armed-btn-* hook instead.
  //
  // The contract that must survive any future change here: disarm happens
  // BEFORE `onconfirm` is awaited, not after. A version that awaits first is
  // a different component with different behaviour under a slow confirm --
  // it would stay visually "armed" for the duration of the call, which reads
  // as still-awaiting-a-second-click rather than as committed.

  let {
    onconfirm,
    label,
    confirmLabel = 'sure?',
    armedMs = 3000,
    disabled = false,
    title,
    icon,
    classes
  }: ArmedButtonProperties = $props();

  let armed = $state(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function disarm(): void {
    armed = false;
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = null;
  }

  // Teardown matters here: an armed row that unmounts -- the list refreshes,
  // the session ends -- must not leave a timer holding a reference to it.
  onDestroy(() => {
    if (timer !== null) {
      clearTimeout(timer);
    }
  });

  async function click(): Promise<void> {
    if (timer !== null) {
      clearTimeout(timer);
    }
    if (!armed) {
      armed = true;
      timer = setTimeout(disarm, armedMs);
      return;
    }
    disarm();
    await onconfirm();
  }

  // Button's `text`/`icon` are plain optionals, not nullable -- omitting the
  // key entirely (via spread) is how a Svelte prop stays genuinely unset,
  // rather than assigning it a value that means "unset".
  const labelProps = $derived.by((): { text?: string; icon?: Snippet } => {
    if (armed) {
      return { text: confirmLabel };
    }
    if (typeof icon === 'function') {
      return { icon };
    }
    return { text: label };
  });
</script>

<span
  class="armed-button {classes ?? ''}"
  data-armed={armed}
  role="presentation"
  onfocusout={disarm}
>
  <Button
    {...labelProps}
    {disabled}
    title={title ?? (armed ? `click again to ${label.toLowerCase()}` : label)}
    ariaLabel={armed ? `confirm: ${label}` : label}
    onclick={click}
  />
</span>

<style>
  /* Every default below is a plain, generic small-button look, independent
     of any consumer's own tokens -- exactly the two-layer fallback this
     library uses throughout: override via --armed-btn-* if a consumer sets
     it, sane default otherwise. */
  .armed-button {
    --button-color: var(--armed-btn-bg, #f0f0f0);
    --button-hover-color: var(--armed-btn-hover-bg, var(--armed-btn-bg, #f0f0f0));
    --button-text-color: var(--armed-btn-color, #4d4d4d);
    --button-hover-text-color: var(--armed-btn-hover-color, #1a1a1a);
    --button-border: var(--armed-btn-border, 1px solid #d0d0d0);
    --button-border-radius: var(--armed-btn-radius, 7px);
    --button-height: var(--armed-btn-height, 26px);
    --button-width: var(--armed-btn-width, auto);
    --button-padding: var(--armed-btn-padding, 0 8px);
    --button-content-gap: var(--armed-btn-gap, 4px);
    --button-font-size: var(--armed-btn-font-size, 12px);
    --button-font-weight: var(--armed-btn-font-weight, 400);
    --button-font-family: var(--armed-btn-font-family, inherit);
    --button-justify-content: center;
    --button-transition:
      background var(--armed-btn-duration, 150ms) ease, color var(--armed-btn-duration, 150ms) ease;

    --disabled-opacity: var(--armed-btn-disabled-opacity, 0.5);
    --disabled-cursor: not-allowed;

    display: var(--armed-btn-display, inline-flex);
    margin-left: var(--armed-btn-margin-left, 0);
    flex-shrink: var(--armed-btn-flex-shrink, 1);
    font-variant-ligatures: var(--armed-btn-font-ligatures, normal);
  }

  /* Armed has its own geometry as well as its own colour: an icon-only
     control is a square at rest and has to grow to fit "sure?" once armed. */
  .armed-button[data-armed='true'] {
    --button-color: var(--armed-btn-armed-bg, #dc2626);
    --button-hover-color: var(--armed-btn-armed-bg, #dc2626);
    --button-text-color: var(--armed-btn-armed-color, #ffffff);
    --button-hover-text-color: var(--armed-btn-armed-color, #ffffff);
    --button-border: 1px solid var(--armed-btn-armed-border, #dc2626);
    --button-width: var(--armed-btn-armed-width, auto);
    --button-padding: var(--armed-btn-armed-padding, 0 8px);
    --button-font-weight: var(--armed-btn-armed-weight, 600);
  }

  @media (prefers-reduced-motion: reduce) {
    .armed-button {
      --button-transition: none;
    }
  }
</style>
