<script lang="ts">
  import type { CopyButtonProperties } from './properties';

  let {
    value,
    testId,
    classes,
    ariaLabel = 'Copy',
    copiedAriaLabel = 'Copied',
    timeoutMs = 2000
  }: CopyButtonProperties = $props();

  let copied = $state(false);

  const handleCopy = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, timeoutMs);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, timeoutMs);
    }
  };
</script>

<button
  type="button"
  class="copy-button {classes ?? ''}"
  aria-label={copied ? copiedAriaLabel : ariaLabel}
  data-pw={typeof testId === 'string' ? testId : null}
  onclick={handleCopy}
>
  {#if !copied}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  {/if}
</button>

<style>
  .copy-button {
    background: transparent;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    padding: var(--copy-button-padding, 4px);
    border-radius: var(--copy-button-border-radius, 4px);
    color: var(--copy-button-color, currentColor);
  }

  .copy-button:hover {
    background: var(--copy-button-hover-background, rgba(0, 0, 0, 0.05));
  }

  .copy-button svg {
    width: var(--copy-button-size, 16px);
    height: var(--copy-button-size, 16px);
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
