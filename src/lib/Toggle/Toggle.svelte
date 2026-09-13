<script lang="ts">
  import { describeField } from '../_field/description';
  import type { ToggleProperties } from './properties';

  let {
    checked = $bindable(false),
    text = '',
    disabled = false,
    testId,
    classes,
    id,
    ariaLabel,
    ariaLabelledby,
    onclick,
    name,
    value,
    required = false,
    form,
    errorMessage,
    infoMessage,
    invalid = false
  }: ToggleProperties = $props();

  // Stable across hydration so the hidden input stays named and text remains clickable.
  const generatedId = $props.id();

  /* The control and the text that explains it were never linked: a screen-reader
     user reaching this control heard its name and nothing about why it was
     rejected. `describeField` composes the reference from the messages that are
     actually rendered, so aria-describedby never points at an id that is not in
     the DOM -- which passes an attribute assertion and resolves to nothing in a
     real reader. */
  const field = $derived(
    describeField(generatedId, { error: errorMessage, info: infoMessage, invalid })
  );
  const inputId = $derived(id?.trim() || `toggle-${generatedId}`);

  const handleCheckboxClick = (e: MouseEvent): void => {
    if (e.target instanceof HTMLInputElement && typeof e.target.checked === 'boolean') {
      checked = e.target.checked;
    }
    onclick?.(checked);
  };
</script>

<div
  class="container {classes ?? ''}"
  class:disabled
  aria-disabled={disabled}
  data-pw={testId}
  testID={testId}
>
  <label class="text" for={inputId} hidden={text.length === 0}>{text}</label>
  <label class="switch">
    <input
      id={inputId}
      class="input-checkbox"
      type="checkbox"
      aria-describedby={field.describedBy}
      aria-invalid={field.ariaInvalid}
      {checked}
      {disabled}
      value={value ?? null}
      {required}
      name={typeof name === 'string' ? name : null}
      form={typeof form === 'string' ? form : null}
      data-state={checked ? 'checked' : 'unchecked'}
      data-disabled={disabled ? '' : null}
      aria-label={ariaLabel?.trim() || null}
      aria-labelledby={ariaLabelledby?.trim() || null}
      onclick={handleCheckboxClick}
    />
    <span class="slider round"></span>
  </label>
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
  .container {
    display: var(--toggle-container-display, flex);
    align-items: var(--toggle-container-align-items, center);
    gap: var(--toggle-container-gap, 8px);
  }

  .container.disabled {
    opacity: var(--toggle-disabled-opacity, 0.4);
    cursor: not-allowed;
    pointer-events: none;
  }

  .text {
    font-size: var(--toggle-text-font-size, 14px);
    font-weight: var(--toggle-text-font-weight, 400);
    color: var(--toggle-text-color, #4a4a4a);
    margin: var(--toggle-text-margin, 0px 8px 0px 0px);
    order: var(--toggle-text-order, 0);
  }

  .switch {
    position: relative;
    display: inline-block;
    width: var(--toggle-switch-width, 46px);
    height: var(--toggle-switch-height, 25px);
  }

  .switch .input-checkbox {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: var(--toggle-slider-top, 0);
    left: var(--toggle-slider-left, 0);
    right: var(--toggle-slider-right, 0);
    bottom: var(--toggle-slider-bottom, 0);
    background-color: var(--slider-unchecked-color, #ccc);
    -webkit-transition: var(
      --toggle-slider-transition,
      all var(--toggle-slider-transition-duration, var(--motion-duration, 0.4s))
        var(--toggle-slider-transition-easing, var(--motion-easing, ease))
    );
    transition: var(
      --toggle-slider-transition,
      all var(--toggle-slider-transition-duration, var(--motion-duration, 0.4s))
        var(--toggle-slider-transition-easing, var(--motion-easing, ease))
    );
  }

  .slider:before {
    position: absolute;
    content: '';
    height: var(--toggle-ball-height, 23px);
    width: var(--toggle-ball-width, 23px);
    left: var(--toggle-slider-before-left, 2px);
    bottom: var(--toggle-slider-before-bottom, 1px);
    top: var(--toggle-slider-before-top, 1px);
    background-color: var(--toggle-slider-before-background-color, white);
    -webkit-transition: var(
      --toggle-slider-transition,
      all var(--toggle-slider-transition-duration, var(--motion-duration, 0.4s))
        var(--toggle-slider-transition-easing, var(--motion-easing, ease))
    );
    transition: var(
      --toggle-slider-transition,
      all var(--toggle-slider-transition-duration, var(--motion-duration, 0.4s))
        var(--toggle-slider-transition-easing, var(--motion-easing, ease))
    );
  }

  .input-checkbox:checked + .slider {
    background-color: var(--slider-checked-color, #2196f3);
  }

  .input-checkbox:focus + .slider {
    box-shadow: var(--toggle-focus-ring, 0 0 0 3px rgba(33, 150, 243, 0.3));
  }

  .input-checkbox:checked + .slider:before {
    -webkit-transform: translateX(19px);
    -ms-transform: translateX(19px);
    transform: translateX(19px);
  }

  .slider.round {
    border-radius: var(--slider-border-radius, 23px);
  }

  .slider.round:before {
    border-radius: var(--slider-border-radius-before, 50%);
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
