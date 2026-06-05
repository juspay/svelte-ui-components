<script lang="ts">
  import type { CopyButtonProperties, CopyButtonStatus } from './properties';
  import copySvg from '$lib/assets/copy.svg?raw';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';

  let {
    textToCopy = '',
    copiedLabel = 'Copied',
    failedLabel = 'Copy failed',
    ariaLabel = 'Copy to clipboard',
    feedbackDuration = 2000,
    disabled = false,
    icon,
    copiedIcon,
    testId,
    classes,
    onCopy
  }: CopyButtonProperties = $props();

  let status: CopyButtonStatus = $state('idle');
  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  const writeToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Clipboard API can reject in insecure contexts or when permission is denied;
      // fall through to the legacy execCommand path below.
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const succeeded = document.execCommand('copy');
      document.body.removeChild(textarea);
      return succeeded;
    } catch {
      return false;
    }
  };

  const handleClick = async (): Promise<void> => {
    const success = await writeToClipboard(textToCopy);
    status = success ? 'copied' : 'failed';
    onCopy?.(textToCopy, success);
    if (resetTimer) {
      clearTimeout(resetTimer);
    }
    resetTimer = setTimeout(() => {
      status = 'idle';
    }, feedbackDuration);
  };
</script>

<button
  type="button"
  class="copy-button {classes ?? ''}"
  class:copied={status === 'copied'}
  class:failed={status === 'failed'}
  aria-label={ariaLabel}
  {disabled}
  data-pw={typeof testId === 'string' ? testId : null}
  onclick={handleClick}
>
  <span class="copy-button-icon">
    {#if status === 'copied'}
      {#if copiedIcon}
        {@render copiedIcon()}
      {:else}
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html checkmarkSvg}
      {/if}
    {:else if icon}
      {@render icon()}
    {:else}
      <!-- eslint-disable svelte/no-at-html-tags -->
      {@html copySvg}
    {/if}
  </span>
</button>
<span class="copy-button-status" aria-live="polite">
  {status === 'copied' ? copiedLabel : status === 'failed' ? failedLabel : ''}
</span>

<style>
  .copy-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--copy-button-padding, 4px);
    border: var(--copy-button-border, none);
    border-radius: var(--copy-button-border-radius, 6px);
    background: var(--copy-button-background, transparent);
    color: var(--copy-button-color, currentColor);
    cursor: pointer;
    transition:
      background-color var(--copy-button-transition-duration, 0.15s) ease,
      color var(--copy-button-transition-duration, 0.15s) ease;
    font-family: inherit;
  }

  .copy-button:hover:not(:disabled) {
    background: var(--copy-button-hover-background, rgba(0, 0, 0, 0.06));
  }

  .copy-button:disabled {
    cursor: not-allowed;
    opacity: var(--copy-button-disabled-opacity, 0.5);
  }

  .copy-button.copied {
    color: var(--copy-button-copied-color, currentColor);
  }

  .copy-button.failed {
    color: var(--copy-button-failed-color, currentColor);
  }

  .copy-button-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--copy-button-icon-size, 16px);
    height: var(--copy-button-icon-size, 16px);
  }

  .copy-button-icon :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Visually hidden live region announcing the copy result to screen readers. */
  .copy-button-status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
