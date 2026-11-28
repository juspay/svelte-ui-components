<script context="module">
  export const cases = [
    { name: 'default' },
    { name: 'default-bound' },
    { name: 'right-only' },
    { name: 'right-null' },
    { name: 'left-only' },
    { name: 'left-and-right' },
    { name: 'left-icon-slot' },
    { name: 'left-icon-slot-text-and-icon' },
    { name: 'bottom-only' },
    { name: 'bottom-and-right' },
    { name: 'all-three-buttons' },
    { name: 'no-buttons' },
    { name: 'with-value-valid' },
    { name: 'with-value-invalid' },
    { name: 'label-present' },
    { name: 'label-empty' },
    {
      name: 'type-valid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234']
      ]
    },
    {
      name: 'type-in-progress',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12']
      ]
    },
    {
      name: 'type-in-progress-blur',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'type-invalid-blur',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'error-message',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc'],
        ['key', 'Tab']
      ]
    },
    { name: 'info-message' },
    {
      name: 'error-and-info-messages',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'click-right-valid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234'],
        ['click', '.right-button button']
      ]
    },
    {
      name: 'click-right-invalid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12'],
        ['click', '.right-button button', { force: true }]
      ]
    },
    {
      name: 'click-right-disabled-initial',
      actions: [['click', '.right-button button', { force: true }]]
    },
    {
      name: 'enter-valid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234'],
        ['press', 'input', 'Enter']
      ]
    },
    {
      name: 'enter-invalid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12'],
        ['press', 'input', 'Enter']
      ]
    },
    {
      name: 'enter-no-right-button',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234'],
        ['press', 'input', 'Enter']
      ]
    },
    { name: 'click-left', actions: [['click', '.left-button button']] },
    { name: 'click-left-with-icon', actions: [['click', '.left-button button']] },
    {
      name: 'click-bottom-valid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234'],
        ['click', '.bottom-button button']
      ]
    },
    {
      name: 'click-bottom-invalid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '12'],
        ['click', '.bottom-button button']
      ]
    },
    { name: 'click-input', actions: [['click', 'input']] },
    { name: 'focus-event', actions: [['focus', 'input']] },
    {
      name: 'blur-event',
      actions: [
        ['click', 'input'],
        ['blur', 'input']
      ]
    },
    { name: 'input-disabled' },
    {
      name: 'tel-default-validation-valid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '9876543210'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'tel-default-validation-invalid',
      actions: [
        ['click', 'input'],
        ['type', 'input', '1234567890'],
        ['key', 'Tab']
      ]
    },
    {
      name: 'email-input',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'a@b.co'],
        ['key', 'Tab']
      ]
    },
    { name: 'focus-on-mount' },
    { name: 'focus-method', actions: [['click', '#t']] },
    { name: 'long-label-and-placeholder' },
    { name: 'themed' },
    { name: 'themed-left-button' },
    { name: 'themed-bottom-button' },
    {
      name: 'invalid-outline-var',
      actions: [
        ['click', 'input'],
        ['type', 'input', 'abc'],
        ['key', 'Tab']
      ]
    },
    { name: 'style-props' },
    { name: 'focus-within-border', actions: [['click', 'input']] }
  ];
</script>

<script>
  import { InputButton, defaultInputProperties } from 'sui-v1-under-test';
  import { log, note, png } from './_kit.js';
  export let name;
  const ib = ({ input = {}, right = null, left = null, bottom = null }) => ({
    inputProperties: {
      ...defaultInputProperties,
      actionInput: true,
      focus: false,
      message: { onError: 'error', info: '' },
      validators: [],
      textTransformers: [],
      ...input
    },
    rightButtonProperties: right,
    leftButtonProperties: left,
    bottomButtonProperties: bottom
  });
  const variants = {
    'default-bound': () =>
      ib({
        input: {},
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        }
      }),
    'right-only': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'right-null': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: null,
        left: null,
        bottom: null
      }),
    'left-only': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: null,
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: null
      }),
    'left-and-right': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: null
      }),
    'left-icon-slot': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: null,
        left: {
          ...{
            text: 'Back',
            enable: true,
            showLoader: false,
            loaderType: null,
            type: 'button',
            testId: 'left'
          },
          text: ''
        },
        bottom: null
      }),
    'left-icon-slot-text-and-icon': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: null
      }),
    'bottom-only': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: null,
        left: null,
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'bottom-and-right': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'all-three-buttons': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'no-buttons': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: null,
        left: null,
        bottom: null
      }),
    'with-value-valid': () =>
      ib({
        input: {
          value: '1234',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'with-value-invalid': () =>
      ib({
        input: {
          value: 'abc',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'label-present': () =>
      ib({
        input: {
          label: 'Coupon code',
          name: 'coupon',
          placeholder: 'Enter code',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'label-empty': () =>
      ib({
        input: {
          label: '',
          placeholder: 'Enter code',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'type-valid': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'type-in-progress': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'type-in-progress-blur': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'type-invalid-blur': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'error-message': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'info-message': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: 'We sent you a code' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'error-and-info-messages': () =>
      ib({
        input: {
          label: 'Code',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Wrong code', info: 'Check your SMS' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'click-right-valid': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'click-right-invalid': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'click-right-disabled-initial': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'enter-valid': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'enter-invalid': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'enter-no-right-button': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: null,
        left: null,
        bottom: null
      }),
    'click-left': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: null
      }),
    'click-left-with-icon': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          ...{
            text: 'Back',
            enable: true,
            showLoader: false,
            loaderType: null,
            type: 'button',
            testId: 'left'
          },
          text: ''
        },
        bottom: null
      }),
    'click-bottom-valid': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'click-bottom-invalid': () =>
      ib({
        input: {
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'click-input': () =>
      ib({
        input: {
          placeholder: 'Click me',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'focus-event': () =>
      ib({
        input: {
          placeholder: 'Focus me',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'blur-event': () =>
      ib({
        input: {
          placeholder: 'Blur me',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'input-disabled': () =>
      ib({
        input: {
          disable: true,
          value: '1234',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'tel-default-validation-valid': () =>
      ib({
        input: {
          dataType: 'tel',
          maxLength: 10,
          placeholder: 'Mobile',
          message: { onError: 'Invalid number', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'tel-default-validation-invalid': () =>
      ib({
        input: {
          dataType: 'tel',
          maxLength: 10,
          placeholder: 'Mobile',
          message: { onError: 'Invalid number', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'email-input': () =>
      ib({
        input: {
          dataType: 'email',
          placeholder: 'Email',
          message: { onError: 'Invalid email', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'focus-on-mount': () =>
      ib({
        input: {
          focus: true,
          placeholder: 'Autofocus',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'focus-method': () =>
      ib({
        input: {
          placeholder: 'Focus from outside',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'long-label-and-placeholder': () =>
      ib({
        input: {
          label: 'A very long label that wraps onto more than one line inside the narrow column',
          placeholder: 'A long placeholder that is cut by the width',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    themed: () =>
      ib({
        input: {
          value: '1234',
          label: 'Themed',
          message: { onError: 'Enter 4 digits', info: 'Themed info' },
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'themed-left-button': () =>
      ib({
        input: {
          value: '1234',
          label: 'Themed',
          message: { onError: 'Enter 4 digits', info: 'Themed info' },
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'themed-bottom-button': () =>
      ib({
        input: {
          value: '1234',
          label: 'Themed',
          message: { onError: 'Enter 4 digits', info: 'Themed info' },
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      }),
    'invalid-outline-var': () =>
      ib({
        input: {
          placeholder: 'Enter 4 digits',
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/,
          message: { onError: 'Enter 4 digits', info: '' }
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'style-props': () =>
      ib({
        input: { value: '1234', validationPattern: /^\d{4}$/, inProgressPattern: /^\d{0,3}$/ },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: null,
        bottom: null
      }),
    'focus-within-border': () =>
      ib({
        input: {
          value: '1234',
          label: 'Themed',
          message: { onError: 'Enter 4 digits', info: 'Themed info' },
          validationPattern: /^\d{4}$/,
          inProgressPattern: /^\d{0,3}$/
        },
        right: {
          text: 'Go',
          enable: false,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'right'
        },
        left: {
          text: 'Back',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'left'
        },
        bottom: {
          text: 'Continue',
          enable: true,
          showLoader: false,
          loaderType: null,
          type: 'button',
          testId: 'bottom'
        }
      })
  };
  let props = variants[name] ? variants[name]() : undefined;
  let comp;
  $: note('value', props ? props.inputProperties.value : undefined);
</script>

{#if name === 'default'}
  <div style="width: 360px;">
    <InputButton
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'default-bound'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'right-only'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'right-null'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'left-only'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'left-and-right'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'left-icon-slot'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    >
      <img slot="left-icon" src={png} alt="" width="16" height="16" />
    </InputButton>
  </div>
{:else if name === 'left-icon-slot-text-and-icon'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    >
      <img slot="left-icon" src={png} alt="" width="16" height="16" />
    </InputButton>
  </div>
{:else if name === 'bottom-only'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'bottom-and-right'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'all-three-buttons'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'no-buttons'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'with-value-valid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'with-value-invalid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'label-present'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'label-empty'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'type-valid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'type-in-progress'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'type-in-progress-blur'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'type-invalid-blur'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'error-message'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'info-message'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'error-and-info-messages'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'click-right-valid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'click-right-invalid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'click-right-disabled-initial'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'enter-valid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'enter-invalid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'enter-no-right-button'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'click-left'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'click-left-with-icon'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    >
      <img slot="left-icon" src={png} alt="" width="16" height="16" />
    </InputButton>
  </div>
{:else if name === 'click-bottom-valid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'click-bottom-invalid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'click-input'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'focus-event'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'blur-event'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'input-disabled'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'tel-default-validation-valid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'tel-default-validation-invalid'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'email-input'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'focus-on-mount'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'focus-method'}
  <div style="width: 360px;">
    <button id="t" type="button" on:click={() => comp.focus()}>focus</button>
    <InputButton
      bind:this={comp}
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'long-label-and-placeholder'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'themed'}
  <div style="width: 360px;" class="themed">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'themed-left-button'}
  <div style="width: 360px;" class="left-theme">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'themed-bottom-button'}
  <div style="width: 360px;" class="bottom-theme">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'invalid-outline-var'}
  <div style="width: 360px;" class="invalid-theme">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{:else if name === 'style-props'}
  <div style="width: 360px;">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
      --input-button-radius="20px"
      --input-button-background="#f1f5f9"
      --input-button-border="1px solid #94a3b8"
      --input-button-box-shadow="none"
      --right-button-color="#0f766e"
      --right-button-text-color="#ffffff"
      --right-button-border-radius="16px"
      --right-button-height="40px"
    />
  </div>
{:else if name === 'focus-within-border'}
  <div style="width: 360px;" class="focus-theme">
    <InputButton
      bind:properties={props}
      on:input={log('input')}
      on:stateChange={log('stateChange')}
      on:leftButtonClick={log('leftButtonClick')}
      on:rightButtonClick={log('rightButtonClick')}
      on:bottomButtonClick={log('bottomButtonClick')}
      on:valueChange={log('valueChange')}
      on:focusout={log('focusout')}
      on:focus={log('focus')}
      on:inputClick={log('inputClick')}
    />
  </div>
{/if}

<style>
  .themed {
    --input-button-radius: 12px;
    --input-button-background: #fefce8;
    --input-button-border: 1px solid #ca8a04;
    --input-button-box-shadow: 0px 2px 6px #ca8a0466;
    --input-button-margin: 4px;
    --input-button-container-padding: 4px;
    --input-button-container-background: #fff7ed;
    --input-button-container-border: 1px dashed #9a3412;
    --input-font-size: 18px;
    --input-height: 60px;
    --input-label-msg-text-color: #854d0e;
    --input-label-msg-text-size: 14px;
    --input-info-msg-text-color: #1d4ed8;
    --input-info-msg-text-size: 14px;
    --right-button-color: #166534;
    --right-button-text-color: #f0fdf4;
    --right-button-border-radius: 8px;
    --right-button-height: 44px;
    --right-button-flex: 0.6;
    --right-button-min-width: 70px;
    --input-bottom-btn-padding: 16px 0px;
  }
  .left-theme {
    --left-button-color: #7c3aed;
    --left-button-text-color: #ffffff;
    --left-button-height: 40px;
    --left-button-width: 80px;
    --left-button-border-radius: 20px;
    --left-button-font-size: 12px;
    --left-button-padding: 0px 8px;
    --left-button-border: 2px solid #4c1d95;
  }
  .bottom-theme {
    --bottom-button-color: #be123c;
    --bottom-button-text-color: #fff1f2;
    --bottom-button-height: 40px;
    --bottom-button-border-radius: 20px;
    --bottom-button-font-size: 14px;
    --bottom-button-width: 60%;
  }
  .invalid-theme {
    --invalid-outline: 3px solid #7e22ce;
    --input-error-msg-text-color: #7e22ce;
    --input-btn-error-msg-margin: 4px 0px 0px 8px;
  }
  .focus-theme {
    --input-button-focus-border: 2px solid #2563eb;
  }
</style>
