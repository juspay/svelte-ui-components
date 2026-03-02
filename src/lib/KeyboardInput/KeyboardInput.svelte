<script lang="ts">
  import type { KeyboardInputProperties } from './properties';

  let { keys, separator = '+', testId, onclick, classes }: KeyboardInputProperties = $props();

  const KEY_SYMBOLS: Record<string, string> = {
    cmd: '\u2318',
    command: '\u2318',
    ctrl: '\u2303',
    control: '\u2303',
    alt: '\u2325',
    option: '\u2325',
    shift: '\u21E7',
    enter: '\u21B5',
    backspace: '\u232B',
    delete: '\u2326',
    tab: '\u21E5',
    escape: 'Esc',
    esc: 'Esc',
    up: '\u2191',
    down: '\u2193',
    left: '\u2190',
    right: '\u2192',
    space: '\u2423'
  };

  let keyList = $derived(Array.isArray(keys) ? keys : keys.split(separator).map((k) => k.trim()));
  let interactive = $derived(typeof onclick === 'function');

  function getSymbol(key: string): string {
    return KEY_SYMBOLS[key.toLowerCase()] ?? key;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onclick?.(new MouseEvent('click'));
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<span
  class="keyboard-input {classes ?? ''}"
  data-pw={typeof testId === 'string' ? testId : null}
  onclick={interactive ? onclick : null}
  onkeydown={interactive ? handleKeydown : null}
  role={interactive ? 'button' : null}
  tabindex={interactive ? 0 : null}
>
  {#each keyList as key, i (i)}
    {#if i > 0}
      <span class="separator">{separator}</span>
    {/if}
    <kbd class="key">{getSymbol(key)}</kbd>
  {/each}
</span>

<style>
  .keyboard-input {
    display: inline-flex;
    align-items: center;
    gap: var(--keyboard-input-gap, 4px);
    font-family: var(--keyboard-input-font-family, inherit);
    font-size: var(--keyboard-input-font-size, 13px);
    vertical-align: baseline;
    cursor: var(--keyboard-input-cursor, default);
  }

  .separator {
    color: var(--keyboard-input-separator-color, #888888);
    font-size: var(--keyboard-input-separator-font-size, 0.85em);
    user-select: none;
  }

  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--keyboard-input-key-font-family, inherit);
    font-weight: var(--keyboard-input-key-font-weight, 500);
    color: var(--keyboard-input-key-color, #333333);
    background-color: var(--keyboard-input-key-background, #f5f5f5);
    border: var(--keyboard-input-key-border, 1px solid #d1d1d1);
    border-radius: var(--keyboard-input-key-border-radius, 4px);
    box-shadow: var(--keyboard-input-key-box-shadow, 0 1px 0 #c4c4c4);
    min-width: var(--keyboard-input-key-min-width, 1.6em);
    padding: var(--keyboard-input-key-padding, 2px 6px);
    text-align: center;
    white-space: nowrap;
    line-height: 1;
  }
</style>
