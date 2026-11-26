<script module>
  const typeInto = (text) => [
    ['click', 'input'],
    ['type', 'input', text]
  ];
  export const cases = [
    { name: 'default' },
    { name: 'label', actions: [] },
    { name: 'placeholder' },
    { name: 'prefilled' },
    { name: 'label-info-message' },
    { name: 'label-suffix' },
    { name: 'mandatory' },
    { name: 'required-wins-over-mandatory' },
    { name: 'focused', actions: [['focus', 'input']] },
    { name: 'focused-add-focus-color', actions: [['focus', 'input']] },
    { name: 'hover', actions: [['hover', 'input']] },
    { name: 'typed-text', actions: typeInto('Hello there') },
    { name: 'typed-then-blur', actions: [...typeInto('abc'), ['blur', 'input']] },
    {
      name: 'key-events',
      actions: [
        ['click', 'input'],
        ['key', 'a'],
        ['key', 'Backspace'],
        ['key', 'Tab']
      ]
    },
    { name: 'max-length-typed', actions: typeInto('abcdefghijkl') },
    { name: 'max-length-show-count', actions: typeInto('abcde') },
    { name: 'show-count-default', actions: typeInto('count me') },
    { name: 'min-length' },
    { name: 'pattern-valid', actions: typeInto('abcd') },
    { name: 'pattern-in-progress-focused', actions: typeInto('ab') },
    { name: 'pattern-in-progress-blurred', actions: [...typeInto('ab'), ['blur', 'input']] },
    { name: 'pattern-invalid', actions: typeInto('12') },
    { name: 'invalid-message-hidden-until-invalid' },
    { name: 'custom-validator-invalid', actions: [...typeInto('bad'), ['blur', 'input']] },
    { name: 'custom-validator-valid', actions: typeInto('good') },
    { name: 'force-error' },
    { name: 'force-error-with-message' },
    { name: 'email-valid', actions: typeInto('a@b.co') },
    { name: 'email-invalid', actions: [...typeInto('not-an-email'), ['blur', 'input']] },
    { name: 'tel-typed', actions: typeInto('98765 43210') },
    { name: 'tel-letters-stripped', actions: typeInto('9a8b7c') },
    { name: 'tel-max-length', actions: typeInto('12345678901234') },
    { name: 'tel-in-mobile-preset', actions: typeInto('9876543210') },
    { name: 'tel-in-mobile-preset-invalid', actions: [...typeInto('12345'), ['blur', 'input']] },
    { name: 'tel-text-presentation', actions: typeInto('9876543210') },
    { name: 'number', actions: typeInto('42') },
    { name: 'number-min-max' },
    { name: 'password', actions: typeInto('secret1') },
    { name: 'search' },
    { name: 'url', actions: typeInto('https://example.com') },
    { name: 'date' },
    { name: 'time' },
    { name: 'disabled' },
    { name: 'disabled-with-value' },
    { name: 'readonly' },
    { name: 'readonly-typing-ignored', actions: typeInto('nope') },
    { name: 'action-input-hides-messages', allowBlank: true },
    { name: 'text-area' },
    {
      name: 'text-area-typed',
      actions: [
        ['click', 'textarea'],
        ['type', 'textarea', 'line one']
      ]
    },
    { name: 'text-area-rows' },
    { name: 'text-area-resize-both' },
    {
      name: 'text-area-auto-resize',
      actions: [
        ['click', 'textarea'],
        [
          'type',
          'textarea',
          'a b c d e f g h i j k l m n o p q r s t u v w x y z a b c d e f g h i j k l m n o p q r s t u v w x y z a b c d e f g h i j k l m n o p'
        ]
      ]
    },
    { name: 'text-area-count' },
    { name: 'left-icon' },
    { name: 'right-icon' },
    {
      name: 'icons-clickable',
      actions: [
        ['click', '.input-icon-left'],
        ['click', '.input-icon-right']
      ]
    },
    { name: 'native-mode', actions: typeInto('free text') },
    { name: 'unstyled' },
    { name: 'autofocus' },
    { name: 'long-label-wraps' },
    { name: 'long-value-overflows' },
    { name: 'text-transform-tel', actions: typeInto('1 2 3') },
    { name: 'classes' },
    { name: 'css-overrides' }
  ];
</script>

<script>
  import { Input, TEL_PRESET_IN_MOBILE } from 'sui-under-test';
  import { log, note, png } from './_kit.js';
  let { name } = $props();

  const prefilled = {
    prefilled: 'Hello world',
    'disabled-with-value': 'Locked value',
    readonly: 'Read only value',
    'readonly-typing-ignored': 'Read only value',
    'long-value-overflows':
      'A very long value that definitely cannot fit inside this fixed width field at all',
    'pattern-invalid': '',
    'invalid-message-hidden-until-invalid': 'zz',
    'text-area-rows': 'one\ntwo\nthree',
    'text-area-count': 'some text',
    'force-error': 'wrong',
    'force-error-with-message': 'wrong',
    'min-length': 'ab'
  };
  let value = $state(prefilled[name] ?? '');
  $effect(() => note('value', value));
  let element = $state(null);
  $effect(() => note('element-bound', element !== null));

  const handlers = {
    oninput: log('oninput'),
    onfocus: log('onfocus'),
    onfocusout: log('onfocusout'),
    onblur: log('onblur'),
    onpaste: log('onpaste'),
    onclick: log('onclick'),
    onkeydown: log('onkeydown'),
    onstatechange: log('onstatechange')
  };
  const lower = /^[a-z]{4,}$/;
  const lowerProgress = /^[a-z]{0,3}$/;
  const mustBeGood = (v) => (v === 'good' ? 'Valid' : v.length === 0 ? 'InProgress' : 'Invalid');
</script>

<div style="width: 360px; padding: 8px;">
  {#if name === 'default'}
    <Input bind:value bind:element testId="in" {...handlers} />
  {:else if name === 'label'}
    <Input bind:value bind:element label="Full name" {...handlers} />
  {:else if name === 'placeholder'}
    <Input bind:value bind:element placeholder="Type here" {...handlers} />
  {:else if name === 'prefilled'}
    <Input bind:value bind:element label="Name" {...handlers} />
  {:else if name === 'label-info-message'}
    <Input bind:value bind:element label="Email" infoMessage="We never share this" {...handlers} />
  {:else if name === 'label-suffix'}
    <Input bind:value bind:element label="Nickname" {...handlers}>
      {#snippet labelSuffix()}<span style="font-size: 11px; color: #777">optional</span>{/snippet}
    </Input>
  {:else if name === 'mandatory'}
    <Input bind:value bind:element label="Name" mandatory {...handlers} />
  {:else if name === 'required-wins-over-mandatory'}
    <Input bind:value bind:element label="Name" mandatory required={false} {...handlers} />
  {:else if name === 'focused'}
    <Input bind:value bind:element label="Name" {...handlers} />
  {:else if name === 'focused-add-focus-color'}
    <Input bind:value bind:element label="Name" addFocusColor {...handlers} />
  {:else if name === 'hover'}
    <Input bind:value bind:element label="Name" {...handlers} />
  {:else if name === 'typed-text'}
    <Input bind:value bind:element label="Name" {...handlers} />
  {:else if name === 'typed-then-blur'}
    <Input bind:value bind:element label="Name" {...handlers} />
  {:else if name === 'key-events'}
    <Input bind:value bind:element label="Name" {...handlers} />
  {:else if name === 'max-length-typed'}
    <Input bind:value bind:element label="Code" maxLength={5} {...handlers} />
  {:else if name === 'max-length-show-count'}
    <Input bind:value bind:element label="Code" maxLength={8} showCount {...handlers} />
  {:else if name === 'show-count-default'}
    <Input bind:value bind:element label="Code" showCount {...handlers} />
  {:else if name === 'min-length'}
    <Input bind:value bind:element label="Code" minLength={4} {...handlers} />
  {:else if name === 'pattern-valid' || name === 'pattern-in-progress-focused' || name === 'pattern-in-progress-blurred' || name === 'pattern-invalid'}
    <Input
      bind:value
      bind:element
      label="Handle"
      validationPattern={lower}
      inProgressPattern={lowerProgress}
      onErrorMessage="Use at least 4 lowercase letters"
      infoMessage="Lowercase only"
      {...handlers}
    />
  {:else if name === 'invalid-message-hidden-until-invalid'}
    <Input
      bind:value
      bind:element
      label="Handle"
      validationPattern={lower}
      inProgressPattern={lowerProgress}
      onErrorMessage="Use at least 4 lowercase letters"
      {...handlers}
    />
  {:else if name === 'custom-validator-invalid' || name === 'custom-validator-valid'}
    <Input
      bind:value
      bind:element
      label="Magic word"
      validators={[mustBeGood]}
      onErrorMessage="Wrong word"
      {...handlers}
    />
  {:else if name === 'force-error'}
    <Input bind:value bind:element label="Name" forceError {...handlers} />
  {:else if name === 'force-error-with-message'}
    <Input
      bind:value
      bind:element
      label="Name"
      forceError
      onErrorMessage="Already taken"
      {...handlers}
    />
  {:else if name === 'email-valid' || name === 'email-invalid'}
    <Input
      bind:value
      bind:element
      label="Email"
      dataType="email"
      onErrorMessage="Enter a valid email"
      {...handlers}
    />
  {:else if name === 'tel-typed' || name === 'tel-letters-stripped'}
    <Input
      bind:value
      bind:element
      label="Phone"
      dataType="tel"
      onErrorMessage="Enter a valid phone"
      {...handlers}
    />
  {:else if name === 'tel-max-length'}
    <Input bind:value bind:element label="Phone" dataType="tel" maxLength={10} {...handlers} />
  {:else if name === 'tel-in-mobile-preset' || name === 'tel-in-mobile-preset-invalid'}
    <Input
      bind:value
      bind:element
      label="Mobile"
      dataType="tel"
      maxLength={10}
      validationPattern={TEL_PRESET_IN_MOBILE.valid}
      inProgressPattern={TEL_PRESET_IN_MOBILE.inProgress}
      onErrorMessage="Enter a 10 digit mobile number"
      {...handlers}
    />
  {:else if name === 'tel-text-presentation'}
    <Input
      bind:value
      bind:element
      label="Phone"
      dataType="tel"
      maxLength={10}
      textViewPresentation={[(t) => (t.length > 5 ? `${t.slice(0, 5)} ${t.slice(5)}` : t)]}
      {...handlers}
    />
  {:else if name === 'text-transform-tel'}
    <Input
      bind:value
      bind:element
      label="Phone"
      dataType="tel"
      textTransformers={[(t) => t.replaceAll('1', '9')]}
      {...handlers}
    />
  {:else if name === 'number'}
    <Input bind:value bind:element label="Age" dataType="number" {...handlers} />
  {:else if name === 'number-min-max'}
    <Input bind:value bind:element label="Age" dataType="number" min={1} max={10} {...handlers} />
  {:else if name === 'password'}
    <Input bind:value bind:element label="Password" dataType="password" {...handlers} />
  {:else if name === 'search'}
    <Input bind:value bind:element dataType="search" placeholder="Search" {...handlers} />
  {:else if name === 'url'}
    <Input bind:value bind:element label="Website" dataType="url" {...handlers} />
  {:else if name === 'date'}
    <Input bind:value bind:element label="Date" dataType="date" {...handlers} />
  {:else if name === 'time'}
    <Input bind:value bind:element label="Time" dataType="time" {...handlers} />
  {:else if name === 'disabled' || name === 'disabled-with-value'}
    <Input bind:value bind:element label="Name" placeholder="Disabled" disable {...handlers} />
  {:else if name === 'readonly' || name === 'readonly-typing-ignored'}
    <Input bind:value bind:element label="Name" readonly {...handlers} />
  {:else if name === 'action-input-hides-messages'}
    <Input
      bind:value
      bind:element
      label="Hidden label"
      actionInput
      forceError
      onErrorMessage="Should not show"
      infoMessage="Should not show either"
      {...handlers}
    />
  {:else if name === 'text-area'}
    <Input bind:value bind:element label="Notes" useTextArea placeholder="Notes" {...handlers} />
  {:else if name === 'text-area-typed'}
    <Input bind:value bind:element label="Notes" useTextArea {...handlers} />
  {:else if name === 'text-area-rows'}
    <Input bind:value bind:element label="Notes" useTextArea rows={5} {...handlers} />
  {:else if name === 'text-area-resize-both'}
    <Input bind:value bind:element label="Notes" useTextArea resize="both" {...handlers} />
  {:else if name === 'text-area-auto-resize'}
    <Input
      bind:value
      bind:element
      label="Notes"
      useTextArea
      autoResize
      minRows={2}
      maxRows={4}
      {...handlers}
    />
  {:else if name === 'text-area-count'}
    <Input
      bind:value
      bind:element
      label="Notes"
      useTextArea
      showCount
      maxLength={50}
      {...handlers}
    />
  {:else if name === 'left-icon'}
    <Input bind:value bind:element placeholder="Search" {...handlers}>
      {#snippet leftIcon()}<img src={png} alt="" width="16" height="16" />{/snippet}
    </Input>
  {:else if name === 'right-icon'}
    <Input bind:value bind:element placeholder="Clear me" {...handlers}>
      {#snippet rightIcon()}<img src={png} alt="" width="16" height="16" />{/snippet}
    </Input>
  {:else if name === 'icons-clickable'}
    <Input
      bind:value
      bind:element
      placeholder="Icons"
      onlefticonclick={log('onlefticonclick')}
      onrighticonclick={log('onrighticonclick')}
      leftIconLabel="Search now"
      rightIconLabel="Clear now"
      {...handlers}
    >
      {#snippet leftIcon()}<img src={png} alt="" width="16" height="16" />{/snippet}
      {#snippet rightIcon()}<img src={png} alt="" width="16" height="16" />{/snippet}
    </Input>
  {:else if name === 'native-mode'}
    <Input bind:value bind:element native label="Native" {...handlers} />
  {:else if name === 'unstyled'}
    <Input bind:value bind:element unstyled {...handlers} />
  {:else if name === 'autofocus'}
    <Input bind:value bind:element label="Focused on mount" autofocus {...handlers} />
  {:else if name === 'long-label-wraps'}
    <Input
      bind:value
      bind:element
      label="A deliberately very long label that has to wrap onto several lines to prove layout"
      infoMessage="An equally long helper sentence that goes on and on until it wraps across lines"
      {...handlers}
    />
  {:else if name === 'long-value-overflows'}
    <Input bind:value bind:element label="Name" {...handlers} />
  {:else if name === 'classes'}
    <Input bind:value bind:element label="Name" classes="extra-class" {...handlers} />
  {:else if name === 'css-overrides'}
    <div
      style="--input-background: #fff7ed; --input-border: 2px solid #c2410c; --input-radius: 12px; --input-padding: 8px 20px; --input-font-size: 14px; --input-text-color: #7c2d12; --input-label-msg-text-color: #c2410c; --input-label-msg-text-size: 14px; --input-box-shadow: none; --input-mandatory-color: #0a7d33; --input-info-msg-text-color: #1d4ed8;"
    >
      <Input
        bind:value
        bind:element
        label="Styled"
        mandatory
        infoMessage="Styled helper"
        placeholder="Styled"
        {...handlers}
      />
    </div>
  {/if}
</div>
