<script lang="ts">
  import Input from '$lib/Input/Input.svelte';
  import type { FieldConfig, SplitInputProperties } from './properties';

  let {
    values = $bindable([]),
    fields,
    length = 4,
    disabled = false,
    autoAdvance = false,
    separator,
    testId,
    classes,
    onchange,
    oninput,
    oncomplete
  }: SplitInputProperties = $props();

  let fieldCount = $derived(typeof fields !== 'undefined' ? fields.length : length);

  let fieldConfigs: FieldConfig[] = $derived(
    typeof fields !== 'undefined'
      ? fields
      : Array.from({ length: fieldCount }, () => ({
          dataType: 'tel' as const,
          maxLength: 1
        }))
  );

  let inputRefs: (ReturnType<typeof Input> | null)[] = $state(
    Array.from({ length: 20 }, () => null)
  );

  // ── Value helpers ───────────────────────────────────────────────

  function getFieldValue(index: number): string {
    return values.at(index) ?? '';
  }

  function commitValues() {
    const filled = values.filter((v) => v.length > 0);
    oninput?.([...values]);
    onchange?.([...values]);
    if (filled.length === fieldCount) {
      oncomplete?.([...values]);
    }
  }

  // ── Focus management ────────────────────────────────────────────

  function focusField(index: number) {
    if (index >= 0 && index < fieldCount) {
      inputRefs.at(index)?.focus();
    }
  }

  // ── Input handler ───────────────────────────────────────────────

  function handleFieldInput(index: number, inputValue: string) {
    const config = fieldConfigs.at(index);
    if (typeof config === 'undefined') {
      return;
    }
    const maxLen = config.maxLength ?? 1000;

    if (autoAdvance && maxLen === 1 && inputValue.length > 1) {
      const chars = inputValue.replace(/\s/g, '');
      for (let i = 0; i < fieldCount; i++) {
        values[i] = chars.charAt(i);
      }
      focusField(Math.min(chars.length, fieldCount) - 1);
    } else {
      values[index] = inputValue;
      if (autoAdvance && maxLen === 1 && inputValue.length > 0 && index < fieldCount - 1) {
        focusField(index + 1);
      }
    }
    commitValues();
  }

  // ── Keyboard handler ────────────────────────────────────────────

  function handleKeyDown(e: KeyboardEvent, index: number) {
    if (e.key === 'Backspace') {
      const current = getFieldValue(index);
      if (current.length === 0 && index > 0) {
        values[index - 1] = '';
        focusField(index - 1);
        commitValues();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusField(index - 1);
    } else if (e.key === 'ArrowRight' && index < fieldCount - 1) {
      focusField(index + 1);
    } else if (e.key === 'Tab') {
      if (e.shiftKey && index > 0) {
        e.preventDefault();
        focusField(index - 1);
      } else if (e.shiftKey === false && index < fieldCount - 1) {
        e.preventDefault();
        focusField(index + 1);
      }
    }
  }

  // ── Paste handler ───────────────────────────────────────────────

  function handlePaste(e: ClipboardEvent, index: number) {
    if (e.clipboardData === null) {
      return;
    }
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();

    if (autoAdvance) {
      const chars = pasted.replace(/\s/g, '');
      for (let i = index; i < fieldCount; i++) {
        const charIdx = i - index;
        if (charIdx >= chars.length) {
          break;
        }
        values[i] = chars.charAt(charIdx);
      }
      focusField(Math.min(index + chars.length, fieldCount) - 1);
    } else {
      values[index] = pasted;
    }
    commitValues();
  }

  // ── Exported methods ────────────────────────────────────────────

  export function clear() {
    for (let i = 0; i < fieldCount; i++) {
      values[i] = '';
    }
    oninput?.([...values]);
    onchange?.([...values]);
    focusField(0);
  }

  export function focus() {
    focusField(0);
  }
</script>

<div class="field-group {classes ?? ''}" data-pw={testId} testID={testId}>
  {#each fieldConfigs as config, index (index)}
    {#if typeof separator === 'string' && index > 0}
      <span class="field-group-separator">{separator}</span>
    {/if}
    <div class="field-group-item">
      <Input
        value={getFieldValue(index)}
        dataType={config.dataType ?? 'text'}
        maxLength={config.maxLength ?? 1000}
        min={config.min}
        max={config.max}
        placeholder={config.placeholder}
        validationPattern={config.validationPattern ?? null}
        validators={config.validators ?? []}
        autoComplete={config.autoComplete ?? 'on'}
        inputMode={config.inputMode}
        disable={disabled}
        actionInput={true}
        classes="field-group-input"
        onInput={(v) => handleFieldInput(index, v)}
        onKeyDown={(e) => handleKeyDown(e, index)}
        onPaste={(e) => handlePaste(e, index)}
        bind:this={inputRefs[index]}
      />
      {#if typeof config.label === 'string'}
        <span class="field-group-label">{config.label}</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .field-group {
    display: flex;
    align-items: flex-start;
    gap: var(--field-group-gap, 8px);
    width: var(--field-group-width, fit-content);
  }

  .field-group-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--field-group-label-gap, 3px);
    flex: 1;
    min-width: 0;
  }

  .field-group-item :global(.field-group-input) {
    --input-border: var(--field-group-border, 1px solid #d1d5db);
    --input-radius: var(--field-group-border-radius, 6px);
    --input-focus-border: var(--field-group-focus-border, 1px solid #3b82f6);
    --input-width: var(--field-group-input-width, 100%);
    --input-height: var(--field-group-input-height, 36px);
    --input-text-align: var(--field-group-text-align, center);
    --input-font-size: var(--field-group-font-size, 14px);
    --input-font-weight: var(--field-group-font-weight, 500);
    --input-font-family: var(--field-group-font-family);
    --input-padding: var(--field-group-input-padding, 0 6px);
    --input-margin: 0;
    --input-box-shadow: none;
  }

  .field-group-label {
    font-size: var(--field-group-label-font-size, 10px);
    font-weight: var(--field-group-label-font-weight, 500);
    color: var(--field-group-label-color, #9ca3af);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .field-group-separator {
    display: flex;
    align-items: center;
    height: var(--field-group-input-height, 36px);
    font-size: var(--field-group-separator-font-size, 16px);
    color: var(--field-group-separator-color, #9ca3af);
    flex-shrink: 0;
  }
</style>
