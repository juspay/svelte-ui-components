<svelte:options
  customElement={{
    tag: 'sui-input',
    shadow: 'open',
    props: {
      value: { type: 'String', reflect: true },
      placeholder: { type: 'String', reflect: true },
      dataType: { type: 'String', reflect: true, attribute: 'data-type' },
      label: { type: 'String', reflect: true },
      onErrorMessage: { type: 'String', attribute: 'on-error-message' },
      infoMessage: { type: 'String', attribute: 'info-message' },
      validators: { type: 'Object' },
      disable: { type: 'Boolean', reflect: true },
      validationPattern: { type: 'Object' },
      inProgressPattern: { type: 'Object' },
      addFocusColor: { type: 'Boolean', attribute: 'add-focus-color' },
      maxLength: { type: 'Number', reflect: true, attribute: 'max-length' },
      minLength: { type: 'Number', reflect: true, attribute: 'min-length' },
      actionInput: { type: 'Boolean', attribute: 'action-input' },
      useTextArea: { type: 'Boolean', reflect: true, attribute: 'use-text-area' },
      autoComplete: { type: 'String', attribute: 'auto-complete' },
      name: { type: 'String', reflect: true },
      textTransformers: { type: 'Object' },
      textViewPresentation: { type: 'Object' },
      testId: { type: 'String', attribute: 'test-id' },
      classes: { type: 'String' },
      onInput: { type: 'Object' },
      onFocus: { type: 'Object' },
      onFocusout: { type: 'Object' },
      onPaste: { type: 'Object' },
      onClick: { type: 'Object' },
      onStateChange: { type: 'Object' },
      onKeyDown: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Input from '$lib/Input/Input.svelte';
  let props = $props();
</script>

<Input {...props} />
