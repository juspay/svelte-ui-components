<svelte:options
  customElement={{
    tag: 'sui-input',
    shadow: 'open',
    props: {
      value: { type: 'String', reflect: true },
      placeholder: { type: 'String', reflect: true },
      dataType: { type: 'String', reflect: true },
      label: { type: 'String', reflect: true },
      onErrorMessage: { type: 'String' },
      infoMessage: { type: 'String' },
      validators: { type: 'Object' },
      disable: { type: 'Boolean', reflect: true },
      validationPattern: { type: 'Object' },
      inProgressPattern: { type: 'Object' },
      addFocusColor: { type: 'Boolean' },
      maxLength: { type: 'Number', reflect: true },
      minLength: { type: 'Number', reflect: true },
      actionInput: { type: 'Boolean' },
      useTextArea: { type: 'Boolean', reflect: true },
      autoComplete: { type: 'String' },
      name: { type: 'String', reflect: true },
      textTransformers: { type: 'Object' },
      textViewPresentation: { type: 'Object' },
      testId: { type: 'String' },
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
