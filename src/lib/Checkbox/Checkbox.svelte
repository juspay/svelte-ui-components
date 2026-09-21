<script lang="ts">
  import { flushSync } from 'svelte';
  import { describeField } from '../_field/description';
  import type { CheckboxProperties } from './properties';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import minusSvg from '$lib/assets/minus.svg?raw';

  let {
    text = '',
    checked = $bindable(false),
    disabled = false,
    indeterminate = $bindable(false),
    testId,
    checkedIcon,
    indeterminateIcon,
    onclick,
    classes,
    ariaControls,
    ariaLabel,
    controlled = false,
    attributes,
    name,
    value,
    required = false,
    form,
    errorMessage,
    infoMessage,
    invalid = false
  }: CheckboxProperties = $props();

  /* The control and the text that explains it were never linked: a screen-reader
     user reaching this control heard its name and nothing about why it was
     rejected. `describeField` composes the reference from the messages that are
     actually rendered, so aria-describedby never points at an id that is not in
     the DOM -- which passes an attribute assertion and resolves to nothing in a
     real reader. */
  const fieldUid = $props.id();
  const field = $derived(
    describeField(fieldUid, { error: errorMessage, info: infoMessage, invalid })
  );

  // A mixed box submits nothing and satisfies nothing, so the control behind it is
  // unchecked while `indeterminate` holds — the native property, not a third state.
  const submitsChecked: boolean = $derived(indeterminate ? false : checked);
  const boxState: 'checked' | 'unchecked' | 'indeterminate' = $derived(
    indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'
  );

  let box: HTMLSpanElement | null = $state(null);
  // Release's own ref, kept: the native input is aria-hidden, tabindex="-1" and
  // pointer-events: none -- a form-submission mirror that never receives a real
  // click, so the browser never fires `change` on it either. handleClick
  // dispatches input/change manually through this ref.
  let nativeInputEl: HTMLInputElement | null = $state(null);

  // Visible text wins over `ariaLabel`, which is what `properties.ts` has always
  // promised and what WCAG 2.5.3 requires: a control showing "Accept terms" must
  // carry that text in its accessible name, so letting an explicit label replace
  // it outright would swap the name a speech-input user says for one they cannot
  // see. `ariaLabel` names the box only when there is no visible text to use —
  // the icon-only and label-in-a-table-header cases it exists for.
  //
  // A blank `ariaLabel` is treated as absent rather than as an empty name, since
  // `aria-label=""` leaves the box unnamed, which is the bug this fixes.
  const accessibleName: string | null = $derived(
    text.length > 0
      ? text
      : typeof ariaLabel === 'string' && ariaLabel.trim() !== ''
        ? ariaLabel
        : null
  );

  function handleClick(): void {
    if (disabled) {
      return;
    }
    // Controlled: the parent owns the state and is told what the click asked
    // for. Nothing is flipped locally, so a parent that declines the change
    // (a controlled table selection that rejects a row) keeps the box, the
    // native input and aria-checked all agreeing with the value it passed.
    // No `input`/`change` dispatch here either: the input's checked state
    // genuinely has not changed, so firing one would tell listeners (a
    // parent `<form>`, a consumer's own `onchange`) about a flip that did
    // not happen.
    if (controlled) {
      onclick?.(!checked);
      return;
    }
    // `flushSync` (rather than `await tick()`) applies the reactive
    // `input.checked` write before the dispatch below runs, without handing
    // control back to the event loop first. A keyboard repeat or a rapid
    // double click stays a single synchronous call stack from gesture to
    // dispatch: nothing can interleave a second `handleClick` in the middle
    // (the race an `await` gap would allow), a screen reader sees the
    // `input`/`change` pair land in the same tick as the key press it
    // expects them tied to, and there is no unmount gap for `nativeInputEl`
    // to go stale in.
    flushSync(() => {
      checked = !checked;
      if (indeterminate) {
        indeterminate = false;
      }
    });
    onclick?.(checked);
    // The box (role="checkbox") is the only element the user can actually
    // reach — the native input is aria-hidden, tabindex="-1" and
    // pointer-events: none, purely a form-submission mirror. Because it
    // never receives a real user click, the browser never fires a native
    // `change` on it either, so a parent `<form>` listener (or a consumer's
    // own `input.addEventListener('change', ...)`) never learns the value
    // moved. `input`/`change` are dispatched manually to restore that signal.
    // `composed: true` matters as much as `bubbles: true` here: native `input`/
    // `change` are composed, and this component ships inside a shadow root
    // (Checkbox.wc.svelte's `shadow: 'open'`) for every <sui-checkbox> consumer.
    // `bubbles` alone stops at the shadow boundary; without `composed` the event
    // never reaches a light-DOM `<form>`, silently defeating the whole point of
    // wiring `name`/`value` onto this input for every web-component consumer.
    nativeInputEl?.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    nativeInputEl?.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  // The form control is `tabindex="-1"`, so the browser's own "focus the invalid
  // field" step would land on an element the user cannot see or reach. Focus the
  // box that carries the role instead.
  function handleInvalid(e: Event): void {
    e.preventDefault();
    box?.focus();
  }

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- preventDefault stops the label's default activation from firing a synthesized
     click that re-toggles the native input AFTER handleClick has flipped the state,
     which left input.checked out of sync with the rendered box (and with
     :checked-based selectors/testing probes). State has one owner: handleClick. -->
<label
  class="container {classes ?? ''}"
  class:disabled
  onclick={(e: MouseEvent) => {
    e.preventDefault();
    handleClick();
  }}
  data-pw={testId}
  testID={testId}
>
  <input
    type="checkbox"
    class="native-checkbox"
    checked={submitsChecked}
    {indeterminate}
    {disabled}
    value={value ?? null}
    {required}
    name={typeof name === 'string' ? name : null}
    form={typeof form === 'string' ? form : null}
    oninvalid={handleInvalid}
    tabindex={-1}
    aria-hidden="true"
    onclick={(e: MouseEvent) => e.stopPropagation()}
    bind:this={nativeInputEl}
    data-pw={typeof testId === 'string' ? `${testId}-native-input` : null}
    testID={typeof testId === 'string' ? `${testId}-native-input` : null}
  />
  <span
    bind:this={box}
    class="box"
    class:checked
    class:indeterminate
    role="checkbox"
    aria-describedby={field.describedBy}
    aria-invalid={field.ariaInvalid}
    data-state={boxState}
    data-disabled={disabled ? '' : null}
    aria-required={required ? 'true' : null}
    tabindex={disabled ? -1 : 0}
    aria-checked={indeterminate ? 'mixed' : checked}
    aria-disabled={disabled}
    aria-controls={ariaControls ?? null}
    aria-label={accessibleName}
    onkeydown={handleKeyDown}
    data-pw={typeof testId === 'string' ? `${testId}-box` : null}
    testID={typeof testId === 'string' ? `${testId}-box` : null}
    {...attributes}
  >
    {#if checked && !indeterminate}
      {#if typeof checkedIcon === 'function'}
        {@render checkedIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        <span class="icon">{@html checkmarkSvg}</span>
      {/if}
    {/if}
    {#if indeterminate}
      {#if typeof indeterminateIcon === 'function'}
        {@render indeterminateIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        <span class="icon dash">{@html minusSvg}</span>
      {/if}
    {/if}
  </span>
  <span class="label" hidden={text.length === 0}>{text}</span>
</label>

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
  .container {
    display: var(--checkbox-container-display, inline-flex);
    align-items: var(--checkbox-container-align-items, center);
    gap: var(--checkbox-container-gap, 8px);
    cursor: var(--checkbox-container-cursor, pointer);
  }

  .container.disabled {
    opacity: var(--checkbox-disabled-opacity, 0.4);
    cursor: var(--checkbox-disabled-cursor, not-allowed);
  }

  .native-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--checkbox-size, 20px);
    height: var(--checkbox-size, 20px);
    border: var(--checkbox-border, 2px solid #757575);
    border-radius: var(--checkbox-border-radius, var(--radius, 4px));
    background-color: var(--checkbox-background, transparent);
    /* --checkbox-transition wraps the WHOLE value (matching Choicebox/Toggle's
       own "-transition" tokens), not just the duration -- a consumer filling it
       with e.g. "0.3s ease-in-out" replaces the entire expression cleanly. Putting
       it in only the duration slot with a separate -easing term appended after
       would make that same override produce an invalid transition (two
       timing-function components), dropping the whole declaration to its
       initial value instead of just using a different timing. */
    transition: var(
      --checkbox-transition,
      background-color
        var(--checkbox-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--checkbox-transition-easing, var(--motion-easing, ease)),
      border var(--checkbox-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--checkbox-transition-easing, var(--motion-easing, ease))
    );
    flex-shrink: 0;
  }

  .box:focus-visible {
    outline: none;
    box-shadow: var(--checkbox-focus-ring, 0 0 0 3px rgba(33, 150, 243, 0.3));
  }

  .container:not(.disabled) .box:hover {
    border-color: var(--checkbox-hover-border-color, #212121);
  }

  .box.checked {
    background-color: var(--checkbox-checked-background, #2196f3);
    border: var(--checkbox-checked-border, 2px solid #2196f3);
  }

  .box.indeterminate {
    background-color: var(--checkbox-indeterminate-background, #2196f3);
    border: var(--checkbox-indeterminate-border, 2px solid #2196f3);
  }

  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--checkbox-icon-size, 14px);
    height: var(--checkbox-icon-size, 14px);
    color: var(--checkbox-checkmark-color, white);
  }

  .icon :global(svg) {
    width: 100%;
    height: 100%;
  }

  .icon.dash {
    color: var(--checkbox-dash-color, white);
  }

  .label {
    font-size: var(--checkbox-label-font-size, 14px);
    font-weight: var(--checkbox-label-font-weight, 400);
    color: var(--checkbox-label-color, #212121);
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
</style>
