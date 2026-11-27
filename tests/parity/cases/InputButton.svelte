<script module>
  const typeInto = (text) => [
    ['click', 'input'],
    ['type', 'input', text]
  ];
  export const cases = [
    { name: 'default' },
    { name: 'with-label' },
    { name: 'mandatory' },
    { name: 'required-false-overrides-mandatory' },
    { name: 'right-button' },
    { name: 'right-button-click', actions: [['click', '.right-button button']] },
    {
      name: 'right-button-click-invalid-blocked',
      actions: [...typeInto('12'), ['click', '.right-button button', { force: true }]]
    },
    { name: 'right-button-enter-key', actions: [...typeInto('abcd'), ['key', 'Enter']] },
    {
      name: 'right-button-enter-key-invalid-blocked',
      actions: [...typeInto('12'), ['key', 'Enter']]
    },
    {
      name: 'right-button-disabled-while-in-progress',
      actions: typeInto('ab')
    },
    { name: 'right-button-enabled-when-valid', actions: typeInto('abcd') },
    { name: 'left-button' },
    { name: 'left-button-click', actions: [['click', '.left-button button']] },
    { name: 'both-buttons' },
    { name: 'bottom-button' },
    { name: 'bottom-button-click', actions: [['click', '.bottom-button button']] },
    {
      name: 'bottom-button-click-invalid-blocked',
      actions: [...typeInto('12'), ['click', '.bottom-button button', { force: true }]]
    },
    { name: 'all-three-buttons' },
    { name: 'icons-in-buttons' },
    { name: 'size-sm' },
    { name: 'size-md' },
    { name: 'size-lg' },
    { name: 'typed-text', actions: typeInto('hello') },
    { name: 'input-events', actions: [...typeInto('xy'), ['key', 'Tab']] },
    { name: 'focused', actions: [['focus', 'input']] },
    { name: 'validation-valid', actions: typeInto('abcd') },
    {
      name: 'validation-in-progress-focused',
      actions: typeInto('ab')
    },
    {
      name: 'validation-in-progress-blurred',
      actions: [...typeInto('ab'), ['blur', 'input']]
    },
    { name: 'validation-invalid', actions: typeInto('99') },
    {
      name: 'invalid-message-shows',
      actions: [...typeInto('99'), ['blur', 'input']]
    },
    { name: 'external-error' },
    {
      name: 'external-error-over-internal',
      actions: typeInto('99')
    },
    { name: 'info-message' },
    { name: 'info-and-error-message', actions: typeInto('99') },
    { name: 'tel-with-preset', actions: typeInto('9876543210') },
    {
      name: 'tel-preset-in-progress',
      actions: typeInto('98765')
    },
    { name: 'max-length', actions: typeInto('abcdefghij') },
    { name: 'placeholder' },
    { name: 'prefilled' },
    { name: 'disabled-input' },
    { name: 'disabled-right-button' },
    { name: 'readonly-input' },
    { name: 'long-label-wraps' },
    { name: 'classes' },
    { name: 'css-overrides' },
    { name: 'css-overrides-buttons' }
  ];
</script>

<script>
  import { InputButton, TEL_PRESET_IN_MOBILE } from 'sui-under-test';
  import { log, note, png } from './_kit.js';
  let { name } = $props();

  const initial = {
    prefilled: 'Existing value',
    'right-button-click': '',
    'disabled-input': 'Locked'
  };
  let value = $state(initial[name] ?? '');
  $effect(() => note('value', value));

  const lower = /^[a-z]{4,}$/;
  const lowerProgress = /^[a-z]{0,3}$/;
  const patterns = {
    validationPattern: lower,
    inProgressPattern: lowerProgress,
    onErrorMessage: 'Use at least 4 lowercase letters'
  };
  const inputEventProperties = {
    oninput: log('input.oninput'),
    onfocus: log('input.onfocus'),
    onfocusout: log('input.onfocusout'),
    onblur: log('input.onblur'),
    onpaste: log('input.onpaste'),
    onclick: log('input.onclick'),
    onkeydown: log('input.onkeydown'),
    onstatechange: log('input.onstatechange')
  };
  const rightEvents = {
    onclick: log('right.onclick'),
    onkeydown: log('right.onkeydown'),
    onkeyup: log('right.onkeyup'),
    onmousedown: log('right.onmousedown'),
    onmouseup: log('right.onmouseup'),
    onmouseleave: log('right.onmouseleave')
  };
  const leftEvents = {
    onclick: log('left.onclick'),
    onkeydown: log('left.onkeydown'),
    onkeyup: log('left.onkeyup'),
    onmousedown: log('left.onmousedown'),
    onmouseup: log('left.onmouseup'),
    onmouseleave: log('left.onmouseleave')
  };
  const bottomEvents = {
    onclick: log('bottom.onclick'),
    onkeydown: log('bottom.onkeydown'),
    onkeyup: log('bottom.onkeyup'),
    onmousedown: log('bottom.onmousedown'),
    onmouseup: log('bottom.onmouseup'),
    onmouseleave: log('bottom.onmouseleave')
  };
  const right = { text: 'Apply' };
  const left = { text: 'Back' };
  const bottom = { text: 'Continue' };
  const patternCases = new Set([
    'right-button-click-invalid-blocked',
    'right-button-enter-key',
    'right-button-enter-key-invalid-blocked',
    'right-button-disabled-while-in-progress',
    'right-button-enabled-when-valid',
    'bottom-button-click-invalid-blocked',
    'validation-valid',
    'validation-in-progress-focused',
    'validation-in-progress-blurred',
    'validation-invalid',
    'invalid-message-shows',
    'external-error-over-internal',
    'info-and-error-message'
  ]);
  const withPatterns = patternCases.has(name) ? patterns : {};
</script>

<div style="width: 360px; padding: 8px;">
  {#if name === 'default'}
    <InputButton bind:value inputProperties={{ placeholder: 'Enter' }} {inputEventProperties} />
  {:else if name === 'with-label'}
    <InputButton
      bind:value
      inputProperties={{ label: 'Coupon', placeholder: 'Code' }}
      {inputEventProperties}
    />
  {:else if name === 'mandatory'}
    <InputButton
      bind:value
      mandatory
      inputProperties={{ label: 'Coupon' }}
      {inputEventProperties}
    />
  {:else if name === 'required-false-overrides-mandatory'}
    <InputButton
      bind:value
      mandatory
      required={false}
      inputProperties={{ label: 'Coupon' }}
      {inputEventProperties}
    />
  {:else if name === 'right-button' || name === 'right-button-click'}
    <InputButton
      bind:value
      inputProperties={{ placeholder: 'Code' }}
      rightButtonProperties={right}
      rightButtonEventProperties={rightEvents}
      {inputEventProperties}
    />
  {:else if name === 'left-button' || name === 'left-button-click'}
    <InputButton
      bind:value
      inputProperties={{ placeholder: 'Code' }}
      leftButtonProperties={left}
      leftButtonEventProperties={leftEvents}
      {inputEventProperties}
    />
  {:else if name === 'both-buttons'}
    <InputButton
      bind:value
      inputProperties={{ placeholder: 'Code' }}
      leftButtonProperties={left}
      rightButtonProperties={right}
      leftButtonEventProperties={leftEvents}
      rightButtonEventProperties={rightEvents}
      {inputEventProperties}
    />
  {:else if name === 'bottom-button' || name === 'bottom-button-click'}
    <InputButton
      bind:value
      inputProperties={{ placeholder: 'Code' }}
      bottomButtonProperties={bottom}
      bottomButtonEventProperties={bottomEvents}
      {inputEventProperties}
    />
  {:else if name === 'bottom-button-click-invalid-blocked'}
    <InputButton
      bind:value
      inputProperties={{ placeholder: 'Code', ...withPatterns }}
      bottomButtonProperties={bottom}
      bottomButtonEventProperties={bottomEvents}
      {inputEventProperties}
    />
  {:else if name === 'all-three-buttons'}
    <InputButton
      bind:value
      inputProperties={{ label: 'Code', placeholder: 'Code' }}
      leftButtonProperties={left}
      rightButtonProperties={right}
      bottomButtonProperties={bottom}
      leftButtonEventProperties={leftEvents}
      rightButtonEventProperties={rightEvents}
      bottomButtonEventProperties={bottomEvents}
      {inputEventProperties}
    />
  {:else if name === 'icons-in-buttons'}
    <InputButton
      bind:value
      inputProperties={{ placeholder: 'Code' }}
      leftButtonProperties={{ text: '', iconOnly: true, ariaLabel: 'Left' }}
      rightButtonProperties={{ text: 'Go' }}
      {inputEventProperties}
    >
      {#snippet leftIcon()}<img src={png} alt="" width="20" height="20" />{/snippet}
      {#snippet rightIcon()}<img src={png} alt="" width="16" height="16" />{/snippet}
    </InputButton>
  {:else if name === 'size-sm'}
    <InputButton
      bind:value
      size="sm"
      inputProperties={{ placeholder: 'Small' }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'size-md'}
    <InputButton
      bind:value
      size="md"
      inputProperties={{ placeholder: 'Medium' }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'size-lg'}
    <InputButton
      bind:value
      size="lg"
      inputProperties={{ placeholder: 'Large' }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'typed-text' || name === 'input-events' || name === 'focused' || name === 'placeholder'}
    <InputButton
      bind:value
      inputProperties={{ label: 'Code', placeholder: 'Type a code' }}
      rightButtonProperties={right}
      rightButtonEventProperties={rightEvents}
      {inputEventProperties}
    />
  {:else if name === 'prefilled' || name === 'disabled-input' || name === 'readonly-input'}
    <InputButton
      bind:value
      inputProperties={{
        label: 'Code',
        disable: name === 'disabled-input',
        readonly: name === 'readonly-input'
      }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'disabled-right-button'}
    <InputButton
      bind:value
      inputProperties={{ placeholder: 'Code' }}
      rightButtonProperties={{ text: 'Apply', disabled: true }}
      rightButtonEventProperties={rightEvents}
      {inputEventProperties}
    />
  {:else if patternCases.has(name)}
    <InputButton
      bind:value
      inputProperties={{
        label: 'Code',
        placeholder: 'Code',
        infoMessage: name === 'info-and-error-message' ? 'Lowercase letters only' : undefined,
        ...withPatterns
      }}
      error={name === 'external-error-over-internal' ? 'Server says no' : undefined}
      rightButtonProperties={right}
      rightButtonEventProperties={rightEvents}
      {inputEventProperties}
    />
  {:else if name === 'external-error'}
    <InputButton
      bind:value
      error="Coupon expired"
      inputProperties={{ label: 'Coupon' }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'info-message'}
    <InputButton
      bind:value
      inputProperties={{ label: 'Coupon', infoMessage: 'Codes are case sensitive' }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'tel-with-preset' || name === 'tel-preset-in-progress'}
    <InputButton
      bind:value
      inputProperties={{
        label: 'Mobile',
        dataType: 'tel',
        maxLength: 10,
        validationPattern: TEL_PRESET_IN_MOBILE.valid,
        inProgressPattern: TEL_PRESET_IN_MOBILE.inProgress,
        onErrorMessage: 'Enter 10 digits'
      }}
      rightButtonProperties={{ text: 'Send OTP' }}
      rightButtonEventProperties={rightEvents}
      {inputEventProperties}
    />
  {:else if name === 'max-length'}
    <InputButton
      bind:value
      inputProperties={{ label: 'Code', maxLength: 6 }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'long-label-wraps'}
    <InputButton
      bind:value
      inputProperties={{
        label: 'A deliberately very long label that has to wrap onto several lines to prove layout',
        infoMessage: 'A long helper sentence that goes on and on until it wraps across more lines'
      }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'classes'}
    <InputButton
      bind:value
      classes="extra-class"
      inputProperties={{ placeholder: 'Code' }}
      rightButtonProperties={right}
      {inputEventProperties}
    />
  {:else if name === 'css-overrides'}
    <div
      style="--input-button-container-border: 2px solid #c2410c; --input-button-container-padding: 6px; --input-button-container-background: #fff7ed; --input-button-radius: 14px; --input-button-box-shadow: none; --input-label-msg-text-color: #c2410c; --inputbutton-mandatory-color: #0a7d33; --input-background: #ffedd5; --input-text-color: #7c2d12;"
    >
      <InputButton
        bind:value
        mandatory
        inputProperties={{ label: 'Styled', placeholder: 'Styled' }}
        rightButtonProperties={right}
        {inputEventProperties}
      />
    </div>
  {:else if name === 'css-overrides-buttons'}
    <div
      style="--right-button-color: #0a7d33; --right-button-text-color: #ffffff; --right-button-height: 40px; --right-button-border-radius: 20px; --left-button-color: #1d4ed8; --left-button-text-color: #ffffff; --left-button-height: 40px; --bottom-button-color: #7c2d12; --bottom-button-text-color: #ffffff; --bottom-button-height: 36px; --input-bottom-btn-padding: 20px 0 0 0;"
    >
      <InputButton
        bind:value
        inputProperties={{ placeholder: 'Code' }}
        leftButtonProperties={left}
        rightButtonProperties={right}
        bottomButtonProperties={bottom}
        {inputEventProperties}
      />
    </div>
  {/if}
</div>
