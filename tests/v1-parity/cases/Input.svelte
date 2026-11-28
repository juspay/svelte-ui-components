<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'default-bound' },
    { name: 'type-text' },
    { name: 'type-tel' },
    { name: 'type-password' },
    { name: 'type-email' },
    { name: 'type-number' },
    {
      name: 'typed-text',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'Hello world'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'typed-tel',
      actions: [
        ['click', 'input'],
        ['type', 'input', '9876543210'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'typed-password',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'secret12'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'typed-email',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'a@b.co'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'typed-number',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12345'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'email-invalid-blur',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'not-an-email'],
        ['key', 'Tab']
      ]
    },
    { name: 'pattern-valid' },
    { name: 'pattern-in-progress' },
    { name: 'pattern-in-progress-focused', actions: [['click', 'input']] },
    { name: 'pattern-invalid' },
    {
      name: 'pattern-typed-in-progress',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12']
      ]
    },
    {
      name: 'pattern-typed-in-progress-blur',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'pattern-typed-invalid-blur',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'pattern-typed-valid-blur',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234'],
        ['key', 'Tab']
      ]
    },
    { name: 'password-pattern-invalid' },
    { name: 'password-pattern-valid' },
    {
      name: 'error-and-info-messages',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc'],
        ['key', 'Tab']
      ]
    },
    { name: 'error-hidden-until-invalid' },
    { name: 'info-message' },
    { name: 'info-and-error-valid' },
    { name: 'label-present' },
    { name: 'label-empty' },
    { name: 'label-null' },
    { name: 'label-long-narrow' },
    { name: 'disabled' },
    { name: 'disabled-click', actions: [['click', 'input', { force: true }]] },
    { name: 'textarea' },
    {
      name: 'textarea-typed',
      actions: [
        ['click', 'textarea'],
        ['type', 'textarea', 'First line of text and a second part'],
        ['key', 'Tab']
      ]
    },
    { name: 'textarea-disabled' },
    {
      name: 'textarea-pattern-invalid',
      actions: [
        ['click', 'textarea'],
        ['type', 'textarea', 'zz'],
        ['key', 'Tab']
      ]
    },
    { name: 'action-input' },
    { name: 'action-input-label-and-messages' },
    {
      name: 'max-length',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234567890'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'min-length-blur',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'min-length-ok',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12345'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'tel-max-length',
      actions: [
        ['click', 'input'],
        ['type', 'input', '987654321012'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'tel-max-length-full-ignore',
      actions: [
        ['click', 'input'],
        ['type', 'input', '123456'],
        ['type', 'input', '789']
      ]
    },
    {
      name: 'tel-non-numeric',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc']
      ]
    },
    {
      name: 'tel-strips-non-digits',
      actions: [
        ['click', 'input'],
        ['type', 'input', '98-76 54x32']
      ]
    },
    {
      name: 'tel-transformer',
      actions: [
        ['click', 'input'],
        ['type', 'input', '+919876543210']
      ]
    },
    {
      name: 'text-transformer-ignored',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc']
      ]
    },
    {
      name: 'validator-invalid',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'has x inside'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'validator-in-progress',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'ab']
      ]
    },
    {
      name: 'validator-valid',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abcdef'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'validator-with-pattern',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc'],
        ['key', 'Tab']
      ]
    },
    { name: 'focus-true' },
    { name: 'focus-false' },
    { name: 'add-focus-color-true', actions: [['click', 'input']] },
    { name: 'add-focus-color-false', actions: [['click', 'input']] },
    { name: 'add-focus-color-textarea', actions: [['click', 'textarea']] },
    {
      name: 'tel-no-pattern-valid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '9876543210'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'tel-no-pattern-starts-1',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234567890'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'tel-no-pattern-short',
      actions: [
        ['click', 'input'],
        ['type', 'input', '98765'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'tel-no-pattern-short-focused',
      actions: [
        ['click', 'input'],
        ['type', 'input', '98765']
      ]
    },
    {
      name: 'tel-no-pattern-too-long-prefix',
      actions: [
        ['click', 'input'],
        ['type', 'input', '5555555555'],
        ['key', 'Tab']
      ]
    },
    { name: 'autocomplete-and-name' },
    { name: 'placeholder' },
    { name: 'placeholder-colored' },
    { name: 'click-event', actions: [['click', 'input']] },
    { name: 'focus-event', actions: [['focus', 'input']] },
    {
      name: 'blur-event',
      actions: [
        ['click', 'input'],
        ['blur', 'input']
      ]
    },
    { name: 'focus-method', actions: [['click', '#t']] },
    { name: 'themed' },
    { name: 'style-props' },
    {
      name: 'message-style-vars',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc'],
        ['key', 'Tab']
      ]
    },
    { name: 'textarea-height-var' }
  ];
</script>

<script>
  import { Input, defaultInputProperties } from 'sui-v1-under-test';
  import { log, note } from './_kit.js';
  export let name;
  const p = (o = {}) => ({
    ...defaultInputProperties,
    focus: false,
    message: { onError: 'error', info: '' },
    validators: [],
    textTransformers: [],
    ...o
  });
  const variants = {
    'default-bound': () => p(),
    'type-text': () => p({ value: 'Hello', placeholder: 'Enter text', label: 'Text field' }),
    'type-tel': () => p({ dataType: 'tel', value: '9876543210', maxLength: 10, label: 'Phone' }),
    'type-password': () => p({ dataType: 'password', value: 'secret12', label: 'Password' }),
    'type-email': () => p({ dataType: 'email', value: 'a@b.co', label: 'Email' }),
    'type-number': () => p({ dataType: 'number', value: '12345', label: 'Number' }),
    'typed-text': () => p({ placeholder: 'Enter text' }),
    'typed-tel': () => p({ dataType: 'tel', maxLength: 10, placeholder: 'Phone' }),
    'typed-password': () => p({ dataType: 'password', placeholder: 'Password' }),
    'typed-email': () => p({ dataType: 'email', placeholder: 'Email' }),
    'typed-number': () => p({ dataType: 'number', placeholder: 'Number' }),
    'email-invalid-blur': () =>
      p({ dataType: 'email', message: { onError: 'Enter a valid email', info: '' } }),
    'pattern-valid': () =>
      p({ value: '1234', validationPattern: /^\d{4}$/, inProgressPattern: /^\d{0,3}$/ }),
    'pattern-in-progress': () =>
      p({ value: '12', validationPattern: /^\d{4}$/, inProgressPattern: /^\d{0,3}$/ }),
    'pattern-in-progress-focused': () =>
      p({ value: '12', validationPattern: /^\d{4}$/, inProgressPattern: /^\d{0,3}$/ }),
    'pattern-invalid': () =>
      p({
        value: 'abc',
        validationPattern: /^\d{4}$/,
        inProgressPattern: /^\d{0,3}$/,
        message: { onError: 'Digits only', info: '' }
      }),
    'pattern-typed-in-progress': () =>
      p({
        validationPattern: /^\d{4}$/,
        inProgressPattern: /^\d{0,3}$/,
        message: { onError: 'Enter 4 digits', info: '' }
      }),
    'pattern-typed-in-progress-blur': () =>
      p({
        validationPattern: /^\d{4}$/,
        inProgressPattern: /^\d{0,3}$/,
        message: { onError: 'Enter 4 digits', info: '' }
      }),
    'pattern-typed-invalid-blur': () =>
      p({
        validationPattern: /^\d{4}$/,
        inProgressPattern: /^\d{0,3}$/,
        message: { onError: 'Enter 4 digits', info: '' }
      }),
    'pattern-typed-valid-blur': () =>
      p({
        validationPattern: /^\d{4}$/,
        inProgressPattern: /^\d{0,3}$/,
        message: { onError: 'Enter 4 digits', info: '' }
      }),
    'password-pattern-invalid': () =>
      p({
        dataType: 'password',
        value: 'abc',
        validationPattern: /^\d{4}$/,
        inProgressPattern: /^\d{0,3}$/,
        message: { onError: 'Wrong password', info: '' }
      }),
    'password-pattern-valid': () =>
      p({
        dataType: 'password',
        value: '1234',
        validationPattern: /^\d{4}$/,
        message: { onError: 'Wrong password', info: '' }
      }),
    'error-and-info-messages': () =>
      p({
        validationPattern: /^\d{4}$/,
        inProgressPattern: /^\d{0,3}$/,
        message: { onError: 'Bad value', info: 'Helper text' },
        label: 'Code'
      }),
    'error-hidden-until-invalid': () =>
      p({
        validationPattern: /^\d{4}$/,
        inProgressPattern: /^\d{0,3}$/,
        message: { onError: 'Bad value', info: '' }
      }),
    'info-message': () => p({ message: { onError: '', info: 'We never share your details' } }),
    'info-and-error-valid': () =>
      p({
        value: '1234',
        validationPattern: /^\d{4}$/,
        message: { onError: 'Bad value', info: 'Looks good' }
      }),
    'label-present': () => p({ label: 'Full name', placeholder: 'Jane Doe', name: 'fullname' }),
    'label-empty': () => p({ label: '', placeholder: 'No label' }),
    'label-null': () => p({ label: null, placeholder: 'Null label' }),
    'label-long-narrow': () =>
      p({
        label: 'A very long label that should wrap onto several lines in a narrow container',
        placeholder: 'Narrow'
      }),
    disabled: () => p({ disable: true, value: 'Locked value', label: 'Disabled' }),
    'disabled-click': () => p({ disable: true, value: 'Locked value' }),
    textarea: () =>
      p({
        useTextArea: true,
        value: 'Multi line\nvalue here',
        label: 'Notes',
        placeholder: 'Notes'
      }),
    'textarea-typed': () => p({ useTextArea: true, placeholder: 'Notes' }),
    'textarea-disabled': () => p({ useTextArea: true, disable: true, value: 'Disabled area' }),
    'textarea-pattern-invalid': () =>
      p({
        useTextArea: true,
        validationPattern: /^\d+$/,
        message: { onError: 'Numbers only', info: '' }
      }),
    'action-input': () => p({ actionInput: true, value: 'Action', placeholder: 'Action input' }),
    'action-input-label-and-messages': () =>
      p({
        actionInput: true,
        label: 'Hidden label',
        value: 'zz',
        validationPattern: /^\d+$/,
        message: { onError: 'Hidden error', info: 'Hidden info' }
      }),
    'max-length': () => p({ maxLength: 5 }),
    'min-length-blur': () =>
      p({
        minLength: 5,
        validationPattern: /^.{5,}$/,
        message: { onError: 'Too short', info: '' }
      }),
    'min-length-ok': () =>
      p({
        minLength: 5,
        validationPattern: /^.{5,}$/,
        message: { onError: 'Too short', info: '' }
      }),
    'tel-max-length': () => p({ dataType: 'tel', maxLength: 10 }),
    'tel-max-length-full-ignore': () => p({ dataType: 'tel', maxLength: 6 }),
    'tel-non-numeric': () => p({ dataType: 'tel', maxLength: 10, value: '98' }),
    'tel-strips-non-digits': () => p({ dataType: 'tel', maxLength: 10 }),
    'tel-transformer': () =>
      p({ dataType: 'tel', maxLength: 10, textTransformers: [(t) => t.replace(/^\+91/, '')] }),
    'text-transformer-ignored': () => p({ textTransformers: [(t) => t.toUpperCase()] }),
    'validator-invalid': () =>
      p({
        validators: [(v) => (v.includes('x') ? 'Invalid' : 'Valid')],
        message: { onError: 'No x allowed', info: '' }
      }),
    'validator-in-progress': () =>
      p({ validators: [(v) => (v.length < 3 ? 'InProgress' : 'Valid')] }),
    'validator-valid': () => p({ validators: [(v) => (v.length >= 3 ? 'Valid' : 'InProgress')] }),
    'validator-with-pattern': () =>
      p({
        validationPattern: /^\d+$/,
        validators: [(v, s) => (s === 'Valid' ? 'Valid' : 'InProgress')],
        message: { onError: 'Digits only', info: '' }
      }),
    'focus-true': () => p({ focus: true, placeholder: 'Focused on mount' }),
    'focus-false': () => p({ focus: false, placeholder: 'Not focused' }),
    'add-focus-color-true': () => p({ addFocusColor: true }),
    'add-focus-color-false': () => p({ addFocusColor: false }),
    'add-focus-color-textarea': () => p({ addFocusColor: true, useTextArea: true }),
    'tel-no-pattern-valid': () =>
      p({ dataType: 'tel', maxLength: 10, message: { onError: 'Enter a valid number', info: '' } }),
    'tel-no-pattern-starts-1': () =>
      p({ dataType: 'tel', maxLength: 10, message: { onError: 'Enter a valid number', info: '' } }),
    'tel-no-pattern-short': () =>
      p({ dataType: 'tel', maxLength: 10, message: { onError: 'Enter a valid number', info: '' } }),
    'tel-no-pattern-short-focused': () =>
      p({ dataType: 'tel', maxLength: 10, message: { onError: 'Enter a valid number', info: '' } }),
    'tel-no-pattern-too-long-prefix': () =>
      p({ dataType: 'tel', maxLength: 10, message: { onError: 'Enter a valid number', info: '' } }),
    'autocomplete-and-name': () =>
      p({
        autoComplete: 'tel',
        name: 'mobile',
        label: 'Mobile',
        dataType: 'tel',
        placeholder: 'Mobile',
        testId: 'mobile-input'
      }),
    placeholder: () => p({ placeholder: 'A placeholder that is fairly long' }),
    'placeholder-colored': () => p({ placeholder: 'Colored placeholder' }),
    'click-event': () => p({ placeholder: 'Click me' }),
    'focus-event': () => p({ placeholder: 'Focus me' }),
    'blur-event': () => p({ placeholder: 'Blur me' }),
    'focus-method': () => p({ placeholder: 'Focus from outside' }),
    themed: () =>
      p({
        label: 'Themed',
        value: 'Themed value',
        message: { onError: 'error', info: 'Themed info' }
      }),
    'style-props': () => p({ value: 'Styled', label: 'Styled' }),
    'message-style-vars': () =>
      p({
        validationPattern: /^\d+$/,
        label: 'Styled label',
        message: { onError: 'Styled error', info: 'Styled info' }
      }),
    'textarea-height-var': () => p({ useTextArea: true, value: 'Tall area' })
  };
  let props = variants[name] ? variants[name]() : p();
  let comp;
  $: note('value', props.value);
</script>

{#if name === 'default'}
  <div style="width: 360px;">
    <Input
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'default-bound'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'type-text'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'type-tel'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'type-password'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'type-email'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'type-number'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'typed-text'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'typed-tel'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'typed-password'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'typed-email'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'typed-number'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'email-invalid-blur'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'pattern-valid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'pattern-in-progress'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'pattern-in-progress-focused'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'pattern-invalid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'pattern-typed-in-progress'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'pattern-typed-in-progress-blur'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'pattern-typed-invalid-blur'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'pattern-typed-valid-blur'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'password-pattern-invalid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'password-pattern-valid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'error-and-info-messages'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'error-hidden-until-invalid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'info-message'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'info-and-error-valid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'label-present'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'label-empty'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'label-null'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'label-long-narrow'}
  <div style="width: 140px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'disabled'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'disabled-click'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'textarea'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'textarea-typed'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'textarea-disabled'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'textarea-pattern-invalid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'action-input'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'action-input-label-and-messages'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'max-length'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'min-length-blur'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'min-length-ok'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-max-length'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-max-length-full-ignore'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-non-numeric'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-strips-non-digits'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-transformer'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'text-transformer-ignored'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'validator-invalid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'validator-in-progress'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'validator-valid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'validator-with-pattern'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'focus-true'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'focus-false'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'add-focus-color-true'}
  <div style="width: 360px;" class="focus-theme">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'add-focus-color-false'}
  <div style="width: 360px;" class="focus-theme">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'add-focus-color-textarea'}
  <div style="width: 360px;" class="focus-theme">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-no-pattern-valid'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-no-pattern-starts-1'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-no-pattern-short'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-no-pattern-short-focused'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'tel-no-pattern-too-long-prefix'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'autocomplete-and-name'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'placeholder'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'placeholder-colored'}
  <div style="width: 360px;" class="msg-theme">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'click-event'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'focus-event'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'blur-event'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'focus-method'}
  <div style="width: 360px;">
    <button id="t" type="button" on:click={() => comp.focus()}>focus</button>
    <Input
      bind:this={comp}
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'themed'}
  <div style="width: 360px;" class="themed">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'style-props'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
      --input-width="100%"
      --input-height="56px"
      --input-radius="12px"
      --input-background="#fef3c7"
      --input-text-color="#7c2d12"
      --input-padding="8px 12px"
      --input-box-shadow="none"
      --input-border="2px solid #7c2d12"
    />
  </div>
{:else if name === 'message-style-vars'}
  <div style="width: 360px;" class="msg-theme">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
    />
  </div>
{:else if name === 'textarea-height-var'}
  <div style="width: 360px;">
    <Input
      bind:properties={props}
      on:input={log('input')}
      on:valueChange={log('valueChange')}
      on:stateChange={log('stateChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:click={log('click')}
      --input-height="120px"
      --input-width="100%"
    />
  </div>
{/if}

<style>
  .themed {
    --input-width: 100%;
    --input-height: 52px;
    --input-radius: 16px;
    --input-padding: 10px 14px;
    --input-font-size: 18px;
    --input-font-weight: 700;
    --input-font-family: serif;
    --input-text-color: #14532d;
    --input-background: #ecfccb;
    --input-box-shadow: 0px 0px 0px 2px #65a30d;
    --input-label-msg-text-color: #365314;
    --input-label-msg-text-size: 14px;
    --input-info-msg-text-color: #1d4ed8;
    --input-container-margin: 8px;
    --input-container-padding: 4px;
    --input-margin: 0px 0px 4px 0px;
    --input-text-align: center;
  }
  .msg-theme {
    --input-width: 100%;
    --input-error-msg-text-color: #7e22ce;
    --input-error-msg-text-size: 16px;
    --input-error-msg-text-weight: 700;
    --input-error-msg-margin: 4px 0px 0px 6px;
    --input-info-msg-text-color: #0f766e;
    --input-info-msg-margin: 4px 0px 0px 6px;
    --input-label-msg-margin: 0px 0px 12px 0px;
    --input-placeholder-color: #be123c;
  }
  .focus-theme {
    --input-focus-border: 3px solid #dc2626;
  }
</style>
