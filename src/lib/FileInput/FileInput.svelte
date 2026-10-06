<script lang="ts">
  import { describeField } from '../_field/description';
  import { provideFileInputOwner } from './context';
  import type { FileInputProperties } from './properties';

  let {
    trigger,
    activation = 'region',
    accept,
    multiple = false,
    maxSizeBytes,
    disabled = false,
    testId,
    classes,
    onfiles,
    onerror,
    errorMessage,
    infoMessage,
    invalid
  }: FileInputProperties = $props();

  /* The drop zone is a `role="button"` with no linked text, so a rejected
     file (wrong type, too large) had nowhere to be announced. It takes
     `aria-describedby` but deliberately not `aria-invalid`: ARIA does not
     support that attribute on `button`, and an unsupported attribute is not a
     harmless extra -- it is one a reader is entitled to ignore. The error text
     itself is the announcement, through `role="alert"`. */
  const fieldUid = $props.id();
  const field = $derived(
    describeField(fieldUid, { error: errorMessage, info: infoMessage, invalid })
  );

  /* One upload action, one interactive owner. Left alone, the region is that
     owner and `trigger` content is plain content inside it. A consumer who wants
     a real control inside (a Button with its own loading state, say) hands
     ownership to it instead, and the region stops being a second control: no
     role, no tab stop, no click or key handling -- only drag and drop. */
  const regionOwnsActivation = $derived(activation !== 'trigger');
  provideFileInputOwner({
    get regionOwnsActivation() {
      return regionOwnsActivation;
    }
  });

  let dragOver = $state(false);
  let inputEl: HTMLInputElement | null = $state(null);
  let pickerBusy = false;

  export const openFilePicker = (): void => {
    if (disabled || pickerBusy) {
      return;
    }
    // Idempotent within one click dispatch: if an inner trigger control wires
    // openFilePicker AND the wrapper's own onclick fires for the same user click,
    // the second call is a no-op (guarding against a double-open). Released on the
    // next microtask — after the whole click has finished bubbling — so a genuinely
    // separate later click still opens the picker.
    pickerBusy = true;
    inputEl?.click();
    queueMicrotask(() => {
      pickerBusy = false;
    });
  };

  function isAccepted(file: File): boolean {
    if (typeof accept !== 'string' || accept.length === 0) {
      return true;
    }
    const tokens = accept.split(',').map((token) => token.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    const fileMime = file.type.toLowerCase();

    return tokens.some((token) => {
      if (token.startsWith('.')) {
        return fileName.endsWith(token);
      }
      if (token.endsWith('/*')) {
        const baseType = token.slice(0, -2);
        return fileMime.startsWith(baseType + '/');
      }
      return fileMime === token;
    });
  }

  function processFiles(rawFiles: FileList | null): void {
    if (rawFiles === null || rawFiles.length === 0) {
      return;
    }

    const fileArray = Array.from(rawFiles);
    const rejected: string[] = [];
    const accepted: File[] = [];

    for (const file of fileArray) {
      if (!isAccepted(file)) {
        rejected.push(`"${file.name}" has an unsupported type.`);
        continue;
      }
      if (typeof maxSizeBytes === 'number' && file.size > maxSizeBytes) {
        const limitMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
        rejected.push(`"${file.name}" exceeds the ${limitMb} MB limit.`);
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length > 0) {
      onerror?.(rejected.join(' '));
    }
    if (accepted.length > 0) {
      onfiles?.(accepted);
    }
  }

  function handleInputChange(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    processFiles(target.files);
    target.value = '';
  }

  function handleDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!disabled) {
      dragOver = true;
    }
  }

  function handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
  }

  function handleDrop(event: DragEvent): void {
    event.preventDefault();
    dragOver = false;
    if (!disabled) {
      processFiles(event.dataTransfer?.files ?? null);
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  }

  function handleClick(event: MouseEvent): void {
    if (disabled) {
      return;
    }
    // openFilePicker() calls inputEl.click(), whose click bubbles back up to this
    // wrapper — ignore it so we don't re-enter openFilePicker in a loop. Consumers
    // whose trigger already wires openFilePicker on an inner control should NOT also
    // rely on this handler (it would double-open); clicking the trigger is enough.
    if (event.target === inputEl) {
      return;
    }
    openFilePicker();
  }
</script>

<!-- The role is a ternary Svelte cannot resolve, so it reads the element as a plain div. Whenever
     the tabindex renders, the role is "button" on the very same expression. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="file-input {classes ?? ''}"
  class:file-input-dragover={dragOver}
  class:file-input-disabled={disabled}
  class:file-input-passive={!regionOwnsActivation}
  data-pw={testId}
  testID={testId}
  role={regionOwnsActivation ? 'button' : null}
  tabindex={regionOwnsActivation ? (disabled ? -1 : 0) : null}
  aria-disabled={regionOwnsActivation ? disabled : null}
  aria-describedby={regionOwnsActivation ? field.describedBy : null}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  onkeydown={regionOwnsActivation ? handleKeyDown : null}
  onclick={regionOwnsActivation ? handleClick : null}
>
  <input
    bind:this={inputEl}
    type="file"
    class="file-input-hidden"
    {accept}
    {multiple}
    {disabled}
    data-pw={typeof testId === 'string' ? `${testId}-input` : null}
    testID={typeof testId === 'string' ? `${testId}-input` : null}
    onchange={handleInputChange}
    tabindex="-1"
    aria-hidden="true"
  />

  {@render trigger({ openFilePicker, dragOver, disabled, describedBy: field.describedBy })}
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
  .field-error {
    color: var(--file-input-error-color, #b3261e);
    font-size: var(--file-input-error-font-size, 12px);
    margin-top: var(--file-input-error-margin-top, 4px);
  }
  .field-info {
    color: var(--file-input-info-color, #5f6368);
    font-size: var(--file-input-info-font-size, 12px);
    margin-top: var(--file-input-info-margin-top, 4px);
  }

  .file-input {
    display: var(--file-input-display, inline-flex);
    flex-direction: var(--file-input-flex-direction, column);
    align-items: var(--file-input-align-items, center);
    justify-content: var(--file-input-justify-content, center);
    padding: var(--file-input-padding);
    border: var(--file-input-border);
    border-radius: var(--file-input-radius, var(--radius, 4px));
    background: var(--file-input-background);
    gap: var(--file-input-gap);
    text-align: var(--file-input-text-align, center);
    transition: var(--file-input-transition);
    cursor: pointer;
  }

  /* The region is not the control here, so it must not look like one. */
  .file-input-passive {
    cursor: auto;
  }

  /* The region is the one Tab stop of its upload action, so it is also the only thing that can
     show where focus is. With no fallback this resolved to `outline: none` -- invisible to a
     keyboard user, and only masked while a nested button supplied its own ring. `currentColor`
     is the library's convention for a ring that needs no colour literal (Card, Pill, StatCard):
     it follows the surrounding text colour, so it clears 3:1 on the light and the dark ground
     alike and stays visible in forced-colors mode. :focus-visible keeps it off pointer clicks. */
  .file-input:focus-visible {
    outline: var(--file-input-focus-outline, 2px solid currentColor);
    outline-offset: var(--file-input-focus-outline-offset, 2px);
  }

  .file-input-dragover {
    background: var(--file-input-dragover-background);
    border-color: var(--file-input-dragover-border-color);
  }

  .file-input-disabled {
    opacity: var(--file-input-disabled-opacity, 0.5);
    cursor: var(--file-input-disabled-cursor, not-allowed);
    pointer-events: none;
  }

  .file-input-hidden {
    display: none;
  }
</style>
