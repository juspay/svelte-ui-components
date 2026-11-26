<script module>
  const slider = '.slider';
  const sw = 'input[type="checkbox"]';
  export const cases = [
    { name: 'default' },
    { name: 'checked' },
    { name: 'with-text' },
    { name: 'with-text-checked' },
    { name: 'empty-text' },
    { name: 'long-text-wraps' },
    { name: 'click-slider-on', actions: [['click', slider]] },
    { name: 'click-slider-off', actions: [['click', slider]] },
    {
      name: 'click-slider-twice',
      actions: [
        ['click', slider],
        ['click', slider]
      ]
    },
    { name: 'click-text-label', actions: [['click', '.text']] },
    {
      name: 'keyboard-space',
      actions: [
        ['focus', sw],
        ['key', 'Space']
      ]
    },
    { name: 'focused', actions: [['focus', sw]] },
    { name: 'focused-checked', actions: [['focus', sw]] },
    { name: 'hover', actions: [['hover', slider]] },
    { name: 'disabled' },
    { name: 'disabled-checked' },
    { name: 'disabled-click-does-nothing', actions: [['click', slider, { force: true }]] },
    { name: 'disabled-with-text' },
    { name: 'input-role-switch' },
    { name: 'input-role-checkbox' },
    { name: 'aria-label' },
    { name: 'aria-labelledby' },
    { name: 'required' },
    { name: 'form-fields' },
    { name: 'info-message' },
    { name: 'error-message-invalid' },
    { name: 'error-message-hidden-when-valid' },
    { name: 'invalid-without-message' },
    { name: 'info-and-error' },
    { name: 'error-click-toggle', actions: [['click', slider]] },
    { name: 'custom-id' },
    { name: 'test-id' },
    { name: 'classes' },
    { name: 'inside-form-narrow' },
    { name: 'css-overrides' },
    { name: 'css-overrides-checked' },
    { name: 'css-overrides-layout' }
  ];
</script>

<script>
  import { Toggle } from 'sui-under-test';
  import { log, note } from './_kit.js';
  let { name } = $props();

  const startChecked = new Set([
    'checked',
    'with-text-checked',
    'click-slider-off',
    'focused-checked',
    'disabled-checked',
    'css-overrides-checked'
  ]);
  let checked = $state(startChecked.has(name));
  $effect(() => note('checked', checked));
  const onclick = log('onclick');
</script>

<div style="width: 360px; padding: 12px;">
  {#if name === 'default' || name === 'checked' || name === 'click-slider-on' || name === 'click-slider-off' || name === 'click-slider-twice' || name === 'focused' || name === 'focused-checked' || name === 'hover' || name === 'keyboard-space'}
    <Toggle bind:checked {onclick} testId="tg" />
  {:else if name === 'with-text' || name === 'with-text-checked' || name === 'click-text-label'}
    <Toggle bind:checked {onclick} text="Notifications" />
  {:else if name === 'empty-text'}
    <Toggle bind:checked {onclick} text="" />
  {:else if name === 'long-text-wraps'}
    <Toggle
      bind:checked
      {onclick}
      text="A deliberately long toggle label that has to wrap onto several lines inside its row"
    />
  {:else if name === 'disabled' || name === 'disabled-checked' || name === 'disabled-click-does-nothing'}
    <Toggle bind:checked {onclick} disabled />
  {:else if name === 'disabled-with-text'}
    <Toggle bind:checked {onclick} disabled text="Disabled option" />
  {:else if name === 'input-role-switch'}
    <Toggle bind:checked {onclick} inputRole="switch" text="Switch role" />
  {:else if name === 'input-role-checkbox'}
    <Toggle bind:checked {onclick} inputRole="checkbox" text="Checkbox role" />
  {:else if name === 'aria-label'}
    <Toggle bind:checked {onclick} ariaLabel="Dark mode" />
  {:else if name === 'aria-labelledby'}
    <span id="ext-label">External label</span>
    <Toggle bind:checked {onclick} ariaLabelledby="ext-label" />
  {:else if name === 'required'}
    <Toggle bind:checked {onclick} required text="Accept terms" />
  {:else if name === 'form-fields'}
    <form>
      <Toggle bind:checked {onclick} name="opt" value="yes" form="f1" text="Opt in" />
    </form>
  {:else if name === 'info-message'}
    <Toggle bind:checked {onclick} text="Beta" infoMessage="Enables experimental features" />
  {:else if name === 'error-message-invalid'}
    <Toggle bind:checked {onclick} text="Terms" invalid errorMessage="You must accept the terms" />
  {:else if name === 'error-message-hidden-when-valid'}
    <Toggle bind:checked {onclick} text="Terms" errorMessage="You must accept the terms" />
  {:else if name === 'invalid-without-message'}
    <Toggle bind:checked {onclick} text="Terms" invalid />
  {:else if name === 'info-and-error'}
    <Toggle
      bind:checked
      {onclick}
      text="Terms"
      invalid
      errorMessage="Required"
      infoMessage="Read the policy first"
    />
  {:else if name === 'error-click-toggle'}
    <Toggle bind:checked {onclick} text="Terms" invalid errorMessage="You must accept the terms" />
  {:else if name === 'custom-id'}
    <Toggle bind:checked {onclick} id="my-toggle" text="Custom id" />
  {:else if name === 'test-id'}
    <Toggle
      bind:checked
      {onclick}
      testId="tg"
      text="With test id"
      infoMessage="Info"
      invalid
      errorMessage="Err"
    />
  {:else if name === 'classes'}
    <Toggle bind:checked {onclick} classes="extra-class" text="Classes" />
  {:else if name === 'inside-form-narrow'}
    <div style="width: 120px"><Toggle bind:checked {onclick} text="Narrow container" /></div>
  {:else if name === 'css-overrides' || name === 'css-overrides-checked'}
    <div
      style="--slider-unchecked-color: #fdba74; --slider-checked-color: #15803d; --toggle-switch-width: 60px; --toggle-switch-height: 32px; --toggle-ball-width: 28px; --toggle-ball-height: 28px; --toggle-slider-before-left: 2px; --toggle-slider-before-top: 2px; --toggle-text-color: #7c2d12; --toggle-text-font-size: 16px; --toggle-slider-transition: none;"
    >
      <Toggle bind:checked {onclick} text="Styled" />
    </div>
  {:else if name === 'css-overrides-layout'}
    <div
      style="--toggle-container-gap: 24px; --toggle-text-order: 2; --toggle-text-margin: 0; --toggle-text-font-weight: 700; --slider-border-radius: 4px; --slider-border-radius-before: 2px; --toggle-focus-ring: 0 0 0 4px #fb923c; --toggle-slider-transition: none;"
    >
      <Toggle bind:checked {onclick} text="Reordered" />
    </div>
  {/if}
</div>
