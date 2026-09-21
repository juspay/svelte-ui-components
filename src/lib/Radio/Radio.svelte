<script lang="ts">
  import { describeField } from '../_field/description';
  import type { RadioProperties } from './properties';

  let {
    name,
    value,
    selectedValue = $bindable(''),
    text = '',
    disabled = false,
    testId,
    onchange,
    classes,
    required = false,
    form,
    errorMessage,
    infoMessage,
    invalid = false
  }: RadioProperties = $props();

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

  let checked = $derived(selectedValue === value);

  function handleChange(): void {
    if (disabled) {
      return;
    }
    selectedValue = value;
    onchange?.(value);
  }
</script>

<label
  class="radio-container {classes ?? ''}"
  class:disabled
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <input
    type="radio"
    aria-describedby={field.describedBy}
    aria-invalid={field.ariaInvalid}
    class="radio-input"
    {name}
    {value}
    {checked}
    {disabled}
    {required}
    form={typeof form === 'string' ? form : null}
    data-state={checked ? 'checked' : 'unchecked'}
    data-disabled={disabled ? '' : null}
    onchange={handleChange}
  />
  <span class="radio-indicator" class:checked class:disabled>
    <span class="radio-dot" class:checked class:disabled></span>
  </span>
  {#if text.length > 0}
    <span class="radio-text" class:disabled>{text}</span>
  {/if}
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
  .radio-container {
    display: var(--radio-container-display, inline-flex);
    align-items: var(--radio-container-align-items, center);
    gap: var(--radio-container-gap, 8px);
    cursor: var(--radio-container-cursor, pointer);
    opacity: var(--radio-container-opacity, 1);
  }

  .radio-container.disabled {
    cursor: not-allowed;
  }

  .radio-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    margin: 0;
    pointer-events: none;
  }

  .radio-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--radio-size, 20px);
    height: var(--radio-size, 20px);
    border: var(--radio-border, 2px solid #9e9e9e);
    border-radius: var(--radio-border-radius, 50%);
    background-color: var(--radio-background, #ffffff);
    /* --radio-transition wraps the WHOLE value, not just the duration -- see the
       matching comment on Checkbox's .box rule for why appending a separate
       easing term after it (the prior shape here) breaks a consumer override
       that already includes its own timing function. */
    transition: var(
      --radio-transition,
      var(--radio-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--radio-transition-easing, var(--motion-easing, ease))
    );
    box-sizing: border-box;
    flex-shrink: 0;
  }

  .radio-indicator.checked {
    border: var(--radio-selected-border, 2px solid #2196f3);
    background-color: var(--radio-selected-background, #ffffff);
  }

  .radio-indicator.disabled {
    border: var(--radio-disabled-border, 2px solid #cccccc);
    background-color: var(--radio-disabled-background, #f5f5f5);
  }

  .radio-container:not(.disabled):hover .radio-indicator:not(.checked) {
    border: var(--radio-hover-border, 2px solid #2196f3);
  }

  .radio-input:focus-visible + .radio-indicator {
    box-shadow: var(--radio-focus-shadow, 0 0 0 3px rgba(33, 150, 243, 0.3));
  }

  .radio-dot {
    width: 0;
    height: 0;
    border-radius: var(--radio-dot-border-radius, 50%);
    background-color: var(--radio-dot-color, #2196f3);
    transition: var(
      --radio-transition,
      var(--radio-transition-duration, var(--duration-base, var(--motion-duration, 0.2s)))
        var(--radio-transition-easing, var(--motion-easing, ease))
    );
  }

  .radio-dot.checked {
    width: var(--radio-dot-size, 10px);
    height: var(--radio-dot-size, 10px);
  }

  .radio-dot.checked.disabled {
    background-color: var(--radio-disabled-dot-color, #cccccc);
  }

  .radio-text {
    font-size: var(--radio-text-font-size, 14px);
    font-weight: var(--radio-text-font-weight, 400);
    color: var(--radio-text-color, #333333);
  }

  .radio-text.disabled {
    color: var(--radio-disabled-text-color, #999999);
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
