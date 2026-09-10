<script lang="ts">
  import type { PillProperties } from './properties';
  import { PILL_MANAGED_ATTRS, discardedAttrWarnings } from '../attrs-discard';
  import Button from '../Button/Button.svelte';
  import closeSvg from '$lib/assets/close.svg?raw';
  import { pillToneClass } from './pillTone';

  let {
    text,
    dismissible = false,
    disabled = false,
    tone,
    as,
    ariaExpanded,
    ariaPressed,
    testId,
    title,
    dismissIcon,
    dismissLabel,
    leadingIcon,
    onclick,
    ondismiss,
    classes,
    attrs
  }: PillProperties = $props();

  /*
   * The runtime half of the `attrs` deprecation (#576). The `@deprecated`
   * markers on the managed keys only reach someone reading TypeScript; a
   * plain-JS caller, or anyone driving this as a web component, has no types
   * and would otherwise still get silence.
   *
   * Dev builds only: this is an authoring aid, and warning on every production
   * render would be noise nobody asked for. `import.meta.env` is absent under
   * bundlers that do not define it, so the guard reads it defensively and stays
   * quiet there rather than throwing.
   *
   * Deliberately at init rather than in an `$effect`, which this repo bans:
   * once per mounted instance is what a consumer needs to act on, and it costs
   * nothing on subsequent updates.
   */
  if (import.meta.env?.DEV === true) {
    for (const message of discardedAttrWarnings('Pill', PILL_MANAGED_ATTRS, attrs)) {
      console.warn(message);
    }
  }

  let interactive = $derived(typeof onclick === 'function');

  // A <button> may not contain another button, and a dismissible pill is inherently two
  // controls. Rather than emit invalid markup, that combination degrades to the div root —
  // the same graceful-degradation rule Card applies to `as="a"` with no `href`.
  const isButtonRoot = $derived(as === 'button' && !dismissible);
  const rootTag = $derived(isButtonRoot ? 'button' : 'div');

  // The synthetic shim exists only because a <div> has no button semantics. A real button
  // already has them, and adding role/tabindex/keydown on top would duplicate the platform's
  // own activation — Enter would fire the handler twice.
  const needsInteractiveShim = $derived(interactive && !isButtonRoot);

  // aria-expanded / aria-pressed / aria-disabled describe a control's state, so they are
  // meaningless on a plain label and are emitted only once the pill actually is one.
  //
  // Note this is deliberately NOT gated on `onclick`: a button root is a real, focusable
  // control whether or not a handler was supplied, so `<Pill as="button" disabled />` alone
  // still has to announce that it is disabled. Gating on the handler left it reachable by
  // keyboard with nothing saying it was inert.
  const exposesControlState = $derived(isButtonRoot || needsInteractiveShim);

  function handleClick(event: MouseEvent): void {
    if (disabled) {
      return;
    }
    onclick?.(event);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.click();
      }
    }
  }

  function handleDismiss(event: MouseEvent): void {
    event.stopPropagation();
    if (disabled) {
      return;
    }
    ondismiss?.();
  }
</script>

<svelte:element
  this={rootTag}
  {...attrs ?? {}}
  class="pill {pillToneClass(tone)} {classes ?? ''}"
  class:disabled
  type={isButtonRoot ? 'button' : null}
  onclick={interactive ? handleClick : null}
  onkeydown={needsInteractiveShim ? handleKeydown : null}
  role={needsInteractiveShim ? 'button' : null}
  tabindex={needsInteractiveShim ? 0 : null}
  aria-disabled={exposesControlState && disabled ? true : null}
  aria-expanded={exposesControlState && typeof ariaExpanded === 'boolean' ? ariaExpanded : null}
  aria-pressed={exposesControlState && typeof ariaPressed === 'boolean' ? ariaPressed : null}
  data-pw={typeof testId === 'string' ? testId : null}
  title={title ?? null}
  testID={typeof testId === 'string' ? testId : null}
>
  {#if typeof leadingIcon === 'function'}
    <span class="pill-leading-icon">{@render leadingIcon()}</span>
  {/if}
  <span class="pill-text">{text}</span>
  {#if dismissible}
    <div class="pill-dismiss">
      <!-- A dismiss action is a bare icon, not a primary call to action. -->
      <Button
        variant="ghost"
        {disabled}
        onclick={handleDismiss}
        ariaLabel={dismissLabel?.trim() || 'Dismiss'}
        {...typeof testId === 'string' ? { testId: `${testId}-dismiss` } : {}}
      >
        {#if typeof dismissIcon === 'function'}
          {@render dismissIcon()}
        {:else}
          <!-- eslint-disable svelte/no-at-html-tags -->
          {@html closeSvg}
        {/if}
      </Button>
    </div>
  {/if}
</svelte:element>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    /* A pill is content-width by default. A caller stacking pills into a menu needs
       them to fill the column and align their labels left, which is a layout choice
       the call site owns — hence tokens rather than a variant. */
    width: var(--pill-width, auto);
    justify-content: var(--pill-justify-content, center);
    text-align: var(--pill-text-align, center);
    gap: var(--pill-gap, 4px);
    background-color: var(--pill-background, var(--_pill-tone-background, #e0e0e0));
    color: var(--pill-color, var(--_pill-tone-color, #333333));
    font-size: var(--pill-font-size, 13px);
    font-weight: var(--pill-font-weight, 500);
    font-family: var(--pill-font-family);
    letter-spacing: var(--pill-letter-spacing, normal);
    text-transform: var(--pill-text-transform, none);
    padding: var(--pill-padding, 6px 10px);
    border-radius: var(--pill-border-radius, 999px);
    border: var(--pill-border, none);
    /* Non-interactive by default: nothing is clickable, so nothing should look
       clickable. The pointer default below applies only once role="button" is
       actually present (see handleClick / `interactive`) — an explicit
       --pill-cursor still wins in both cases. */
    cursor: var(--pill-cursor, default);
    max-width: var(--pill-max-width);
    line-height: var(--pill-line-height, 1);
    flex-shrink: var(--pill-flex-shrink);
  }

  .pill[role='button'],
  button.pill {
    cursor: var(--pill-cursor, pointer);
  }

  .pill[role='button']:focus-visible,
  button.pill:focus-visible {
    outline: var(--pill-focus-outline, 2px solid currentColor);
    outline-offset: var(--pill-focus-outline-offset, 2px);
  }

  /* A button root arrives with user-agent styling a div never had: a default margin, the
     native control appearance, and its own font stack. Neutralise exactly those three and
     nothing else, so `as="button"` is a semantics change and not a visual one.

     Deliberately NOT `font: inherit` here: that shorthand also resets line-height, and this
     rule outranks .pill on specificity, so it would silently override
     `--pill-line-height` and make a button chip 5px taller than the identical div. Every
     other typographic property is already owned by .pill and needs no restatement. */
  button.pill {
    margin: 0;
    font-family: var(--pill-font-family, inherit);
    appearance: none;
    -webkit-appearance: none;
  }

  /* Tone defaults — an internal --_pill-tone-* layer, mirroring how Button's
     variant classes set --_btn-*: a plain --pill-background/--pill-color
     (explicit, or via `classes`) always wins over the tone's default. */
  .tone-accent {
    --_pill-tone-background: var(--pill-tone-accent-background, #d1ecf1);
    --_pill-tone-color: var(--pill-tone-accent-color, #0c5460);
  }
  .tone-ok {
    --_pill-tone-background: var(--pill-tone-ok-background, #d4edda);
    --_pill-tone-color: var(--pill-tone-ok-color, #155724);
  }
  .tone-warn {
    --_pill-tone-background: var(--pill-tone-warn-background, #fff3cd);
    --_pill-tone-color: var(--pill-tone-warn-color, #856404);
  }
  .tone-danger {
    --_pill-tone-background: var(--pill-tone-danger-background, #f8d7da);
    --_pill-tone-color: var(--pill-tone-danger-color, #721c24);
  }
  .tone-muted {
    --_pill-tone-background: var(--pill-tone-muted-background, #f1f1f1);
    --_pill-tone-color: var(--pill-tone-muted-color, #6b7280);
  }

  .pill:hover:not(.disabled) {
    background-color: var(
      --pill-hover-background,
      var(--pill-background, var(--_pill-tone-background, #d0d0d0))
    );
    color: var(--pill-hover-color, var(--pill-color, var(--_pill-tone-color, #333333)));
  }

  .pill.disabled {
    opacity: var(--pill-disabled-opacity, 0.4);
    cursor: var(--pill-disabled-cursor, not-allowed);
  }

  .pill-text {
    overflow: hidden;
    text-overflow: var(--pill-text-overflow, ellipsis);
    white-space: var(--pill-text-white-space, nowrap);
  }

  .pill-leading-icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  .pill-dismiss {
    --button-color: transparent;
    --button-border: none;
    --button-padding: 0;
    --button-text-color: var(--pill-dismiss-color, currentColor);
    --button-hover-color: transparent;
    --button-hover-text-color: var(
      --pill-dismiss-hover-color,
      var(--pill-dismiss-color, currentColor)
    );
    --cursor: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Consumer themes can set Button tokens on its container, beating inherited
     wrapper values. Pin the painting element too so the chip owns its enabled
     glyph; leave disabled colours and focus indicators to the consumer theme. */
  .pill-dismiss :global(.button-container),
  .pill-dismiss :global(.button-el) {
    --button-color: transparent;
    --button-background: none;
    --button-active-background: transparent;
    --button-border: none;
    --button-padding: 0;
    --button-text-color: var(--pill-dismiss-color, currentColor);
    --button-hover-color: transparent;
    --button-hover-border: none;
    --button-hover-text-color: var(
      --pill-dismiss-hover-color,
      var(--pill-dismiss-color, currentColor)
    );
  }

  .pill-dismiss :global(svg) {
    width: var(--pill-dismiss-size, 14px);
    height: var(--pill-dismiss-size, 14px);
  }
</style>
