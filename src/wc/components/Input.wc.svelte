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
      inputMode: { type: 'String', attribute: 'input-mode' },
      name: { type: 'String', reflect: true },
      id: { type: 'String' },
      ariaLabel: { type: 'String', attribute: 'aria-label' },
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
      onKeyDown: { type: 'Object' },
      leftIcon: { type: 'Object' },
      rightIcon: { type: 'Object' },
      onLeftIconClick: { type: 'Object' },
      onRightIconClick: { type: 'Object' },
      leftIconLabel: { type: 'String', attribute: 'left-icon-label' },
      rightIconLabel: { type: 'String', attribute: 'right-icon-label' },
      mandatory: { type: 'Boolean', reflect: true },
      forceError: { type: 'Boolean', reflect: true, attribute: 'force-error' },
      readonly: { type: 'Boolean', attribute: 'readonly' },
      // Not 'Boolean': Svelte's boolean conversion is presence-based, mapping any
      // non-null attribute value to true, so `spellcheck="false"` — the only
      // spelling that turns spell checking off — arrived as true. The prop is a
      // tri-state (`boolean | null`, default null = "leave the browser alone"),
      // which a presence-based boolean cannot express at all.
      spellcheck: { type: 'String', attribute: 'spellcheck' },
      min: { type: 'Number', attribute: 'min' },
      max: { type: 'Number', attribute: 'max' },
      onBlur: { type: 'Object' },
      ariaAutocomplete: { type: 'String', attribute: 'aria-autocomplete' },
      ariaControls: { type: 'String', attribute: 'aria-controls' },
      ariaActivedescendant: { type: 'String', attribute: 'aria-activedescendant' },
      rows: { type: 'Number', attribute: 'rows' },
      autoResize: { type: 'Boolean', attribute: 'auto-resize' },
      minRows: { type: 'Number', attribute: 'min-rows' },
      maxRows: { type: 'Number', attribute: 'max-rows' },
      resize: { type: 'String', attribute: 'resize' },
      showCount: { type: 'Boolean', attribute: 'show-count' },
      onfocus: { type: 'Object' },
      onfocusout: { type: 'Object' },
      onblur: { type: 'Object' },
      oninput: { type: 'Object' },
      onpaste: { type: 'Object' },
      onclick: { type: 'Object' },
      onkeydown: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
  import Input from '$lib/Input/Input.svelte';
  let props = $props();

  // Restores the tri-state the attribute string flattens: absent stays null so
  // the browser default is untouched, "false" is honoured, and a bare
  // `spellcheck` (empty value, the HTML boolean-attribute idiom) reads as true.
  const asSpellcheck = (value: unknown): boolean | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    const text = String(value).trim().toLowerCase();
    if (text === 'false') {
      return false;
    }
    if (text === '' || text === 'true' || text === 'spellcheck') {
      return true;
    }
    return null;
  };
</script>

<Input {...props} spellcheck={asSpellcheck(props.spellcheck)} />
