<script lang="ts">
  import { describeField } from '../_field/description';
  import { joinChoiceboxGroup, moveWithinChoiceboxGroup, selectExclusively } from './group';
  import type { ChoiceboxProperties } from './properties';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';

  let {
    children,
    selected = $bindable(false),
    mode = 'radio',
    disabled = false,
    showIndicator = true,
    testId,
    onclick,
    classes,
    errorMessage,
    infoMessage,
    invalid = false,
    name,
    value = 'on',
    required = false,
    form
  }: ChoiceboxProperties = $props();

  /* The card and the text that explains it were never linked: a screen-reader
     user reaching this control heard its name and nothing about why it was
     rejected. `describeField` composes the reference from the messages that are
     actually rendered, so aria-describedby never points at an id that is not in
     the DOM -- which passes an attribute assertion and resolves to nothing in a
     real reader. */
  const fieldUid = $props.id();
  const field = $derived(
    describeField(fieldUid, { error: errorMessage, info: infoMessage, invalid })
  );

  /* Grouping is opt-in through `name`, so every card written before this prop
     existed keeps behaving as an independent toggle. */
  const groupKey = $derived(
    mode === 'radio' && typeof name === 'string' && name !== '' ? name : null
  );

  let card: HTMLDivElement | null = $state(null);

  /* Registers the card with its group and re-registers whenever an input the
     group's single tab stop depends on changes. `selected` and `disabled` are
     read HERE rather than only inside the callbacks: a closure reading them
     later creates no dependency, and the tab stop has to move when a SIBLING's
     selection changes, which no per-instance `$derived` can observe. */
  function groupMembership(node: HTMLElement) {
    const key = groupKey;
    if (key === null) {
      return;
    }
    const selectedNow = selected;
    const disabledNow = disabled;
    return joinChoiceboxGroup(key, {
      element: node,
      isSelected: () => selectedNow,
      isDisabled: () => disabledNow,
      setSelected: (next: boolean) => {
        selected = next;
      },
      notify: (next: boolean) => onclick?.(next)
    });
  }

  function handleClick(): void {
    if (disabled) {
      return;
    }
    if (mode === 'radio' && selected) {
      return;
    }
    if (groupKey !== null && card !== null) {
      // The group owns the exclusivity a native radio gets from the browser:
      // selecting here deselects the siblings and tells each of them.
      selectExclusively(card);
      onclick?.(true);
      return;
    }
    selected = !selected;
    onclick?.(selected);
  }

  // The form control is `tabindex="-1"`, so the browser's own "focus the invalid
  // field" step would land on an element the user cannot see or reach. Focus the
  // card that carries the role instead.
  function handleInvalid(e: Event): void {
    e.preventDefault();
    card?.focus();
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
      return;
    }
    if (groupKey === null || disabled || card === null) {
      return;
    }
    // Both axes, because a group of cards may be laid out as a row or a column
    // and the user cannot tell which the author chose.
    const step =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? 'next'
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? 'previous'
          : e.key === 'Home'
            ? 'first'
            : e.key === 'End'
              ? 'last'
              : null;
    if (step === null) {
      return;
    }
    if (moveWithinChoiceboxGroup(card, step)) {
      e.preventDefault();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- `tabindex` is the ungrouped answer and the server-rendered baseline. A named
     radio group has ONE tab stop rather than one per card, which depends on
     every sibling's state and so is applied by `groupMembership` once the group
     exists on the client. -->
<div
  bind:this={card}
  class="choicebox {classes ?? ''}"
  class:selected
  class:disabled
  role={mode === 'radio' ? 'radio' : 'checkbox'}
  aria-checked={selected}
  aria-disabled={disabled}
  aria-required={required ? 'true' : null}
  aria-describedby={field.describedBy}
  aria-invalid={field.ariaInvalid}
  tabindex={disabled ? -1 : 0}
  onclick={handleClick}
  onkeydown={handleKeyDown}
  data-pw={testId}
  testID={testId}
  {@attach groupMembership}
>
  <input
    type={mode === 'radio' ? 'radio' : 'checkbox'}
    class="native-control"
    checked={selected}
    {disabled}
    {value}
    {required}
    name={typeof name === 'string' ? name : null}
    form={typeof form === 'string' ? form : null}
    oninvalid={handleInvalid}
    tabindex={-1}
    aria-hidden="true"
    data-pw={typeof testId === 'string' ? `${testId}-native-input` : null}
    testID={typeof testId === 'string' ? `${testId}-native-input` : null}
  />
  {#if typeof children === 'function'}
    {@render children()}
  {/if}
  {#if showIndicator}
    <span class="indicator {mode}" class:selected aria-hidden="true">
      {#if mode === 'checkbox' && selected}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <span class="indicator-icon">{@html checkmarkSvg}</span>
      {/if}
    </span>
  {/if}
</div>

{#if field.showsError}
  <div
    id={field.errorId}
    role="alert"
    class="field-error"
    data-pw={typeof testId === 'string' ? `${testId}-error-message` : null}
    testID={typeof testId === 'string' ? `${testId}-error-message` : null}
  >
    {errorMessage}
  </div>
{/if}
{#if field.showsInfo}
  <div
    id={field.infoId}
    class="field-info"
    data-pw={typeof testId === 'string' ? `${testId}-info-message` : null}
    testID={typeof testId === 'string' ? `${testId}-info-message` : null}
  >
    {infoMessage}
  </div>
{/if}

<style>
  .native-control {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    margin: 0;
    pointer-events: none;
  }

  .field-error {
    color: var(--field-error-color, #c5120a);
    font-size: var(--field-error-font-size, 12px);
    margin: var(--field-error-margin, 4px 0 0 0);
  }

  .field-info {
    color: var(--field-info-color, #6b7280);
    font-size: var(--field-info-font-size, 12px);
    margin: var(--field-info-margin, 4px 0 0 0);
  }

  .choicebox {
    display: var(--choicebox-display, flex);
    align-items: var(--choicebox-align-items, center);
    padding: var(--choicebox-padding, 16px);
    border: var(--choicebox-border, 2px solid #d0d0d0);
    border-radius: var(--choicebox-border-radius, var(--radius, 4px));
    background: var(--choicebox-background, #ffffff);
    gap: var(--choicebox-gap, 12px);
    cursor: var(--choicebox-cursor, pointer);
    font-family: var(--choicebox-font-family, inherit);
    transition: var(
      --choicebox-transition,
      border-color
        var(--choicebox-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--choicebox-transition-easing, var(--motion-easing, ease)),
      background
        var(--choicebox-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--choicebox-transition-easing, var(--motion-easing, ease))
    );
    -webkit-tap-highlight-color: transparent;
  }

  .choicebox:focus-visible {
    outline: none;
    box-shadow: var(--choicebox-focus-ring, 0 0 0 3px rgba(33, 150, 243, 0.3));
  }

  /* Exclude the selected state from hover: without :not(.selected) this rule
     (specificity 0,3,0) outranks .choicebox.selected (0,2,0), so hovering a
     selected card repaints it with the neutral hover border/fill until the
     cursor leaves. Excluding selected lets .choicebox.selected show through. */
  .choicebox:not(.disabled):not(.selected):hover {
    border-color: var(--choicebox-hover-border-color, #9e9e9e);
    background: var(--choicebox-hover-background, var(--choicebox-background, #ffffff));
  }

  .choicebox.selected {
    border-color: var(--choicebox-selected-border-color, #2196f3);
    background: var(--choicebox-selected-background, var(--choicebox-background, #ffffff));
  }

  .choicebox.disabled {
    opacity: var(--choicebox-disabled-opacity, 0.4);
    cursor: var(--choicebox-disabled-cursor, not-allowed);
  }

  .indicator {
    flex: 0 0 auto;
    order: var(--choicebox-indicator-order, 1);
    margin-inline-start: var(--choicebox-indicator-margin-inline-start, auto);
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--choicebox-indicator-size, 20px);
    height: var(--choicebox-indicator-size, 20px);
    border: var(--choicebox-indicator-border, 2px solid #757575);
    background: var(--choicebox-indicator-background, transparent);
    transition: var(
      --choicebox-indicator-transition,
      background
        var(
          --choicebox-indicator-transition-duration,
          var(--duration-base, var(--motion-duration, 0.2s))
        )
        var(--choicebox-indicator-transition-easing, var(--motion-easing, ease)),
      border-color
        var(
          --choicebox-indicator-transition-duration,
          var(--duration-base, var(--motion-duration, 0.2s))
        )
        var(--choicebox-indicator-transition-easing, var(--motion-easing, ease))
    );
  }

  .indicator.radio {
    border-radius: 50%;
  }

  .indicator.checkbox {
    border-radius: var(--choicebox-indicator-border-radius, var(--radius, 4px));
  }

  .indicator.selected {
    border: var(--choicebox-indicator-selected-border, 2px solid #2196f3);
    background: var(--choicebox-indicator-selected-background, #2196f3);
  }

  .indicator.radio.selected {
    box-shadow: inset 0 0 0 var(--choicebox-indicator-dot-inset, 4px)
      var(--choicebox-background, #ffffff);
  }

  .indicator-icon {
    display: flex;
    width: var(--choicebox-indicator-icon-size, 14px);
    height: var(--choicebox-indicator-icon-size, 14px);
    color: var(--choicebox-indicator-icon-color, #ffffff);
  }

  .indicator-icon :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
