<script lang="ts">
  import Button from '../Button/Button.svelte';
  import LoadingDots from '../LoadingDots/LoadingDots.svelte';
  import copySvg from '$lib/assets/copy.svg?raw';
  import checkmarkSvg from '$lib/assets/checkmark.svg?raw';
  import retrySvg from '$lib/assets/retry.svg?raw';
  import thumbUpSvg from '$lib/assets/thumb-up.svg?raw';
  import thumbDownSvg from '$lib/assets/thumb-down.svg?raw';
  import { onDestroy, onMount } from 'svelte';
  import { partyOf } from '../Chat/roles';
  import type { ChatMessageProperties } from './properties';

  let {
    role,
    content = '',
    html,
    markdown,
    body,
    streaming = false,
    status,
    avatar,
    header,
    attachments,
    allowCopy = false,
    actions,
    copyLabel = 'Copy',
    retryLabel = 'Retry',
    feedbackUpLabel = 'Good response',
    feedbackDownLabel = 'Bad response',
    onretry: onretryLegacy,
    onRetry,
    onfeedback: onfeedbackLegacy,
    onFeedback,
    oncopy: oncopyLegacy,
    onCopy,
    testId,
    classes
  }: ChatMessageProperties = $props();

  // Event-casing phase 1: both spellings accepted, the correct one wins.
  const oncopy = $derived(onCopy ?? oncopyLegacy);
  const onfeedback = $derived(onFeedback ?? onfeedbackLegacy);
  const onretry = $derived(onRetry ?? onretryLegacy);

  let party = $derived(partyOf(role));

  let copied = $state(false);
  let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  onDestroy(() => {
    if (copyResetTimer !== null) {
      clearTimeout(copyResetTimer);
    }
  });

  let hasMarkdown = $derived(typeof markdown === 'string' && markdown.length > 0);

  /* The pipeline loads dynamically at mount (the LottiePlayer pattern) so
     `marked` — a peer dependency — is only pulled in at runtime, never during
     SSR, and rendering `markdown` degrades to the `html`/`content` fallback
     until the module resolves or when the peer is absent. */
  let renderMarkdownFn = $state<((source: string) => string) | null>(null);

  onMount(() => {
    void import('../MarkdownText/markdown')
      .then((module) => {
        renderMarkdownFn = module.renderMarkdown;
      })
      .catch(() => {
        renderMarkdownFn = null;
      });
  });

  let effectiveHtml = $derived(
    hasMarkdown && renderMarkdownFn !== null ? renderMarkdownFn(markdown ?? '') : html
  );
  let hasHtml = $derived(typeof effectiveHtml === 'string' && effectiveHtml.length > 0);
  let hasBody = $derived(typeof body === 'function');
  let hasContent = $derived(hasBody || hasHtml || content.length > 0);
  let showTyping = $derived(streaming && !hasContent);
  let showRetry = $derived(typeof onretry === 'function');
  let showFeedback = $derived(typeof onfeedback === 'function');
  let showActions = $derived(
    !streaming && (allowCopy || showRetry || showFeedback || typeof actions === 'function')
  );

  function htmlToText(source: string): string {
    if (typeof DOMParser === 'undefined') {
      return source;
    }
    return new DOMParser().parseFromString(source, 'text/html').body.textContent ?? '';
  }

  async function copy(): Promise<void> {
    const text =
      content.length > 0
        ? content
        : hasMarkdown
          ? (markdown ?? '')
          : typeof html === 'string'
            ? htmlToText(html)
            : '';
    if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
        if (copyResetTimer !== null) {
          clearTimeout(copyResetTimer);
        }
        copyResetTimer = setTimeout(() => {
          copied = false;
        }, 1500);
      } catch {
        copied = false;
      }
    }
    oncopy?.(text);
  }
</script>

<article
  class="chat-message party-{party} role-{role} {classes ?? ''}"
  class:streaming
  class:error={status === 'error'}
  aria-label={party === 'sender' ? 'Your message' : 'Message'}
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
>
  <div class="row">
    {#if typeof avatar === 'function'}
      <div class="avatar">{@render avatar()}</div>
    {/if}

    <div class="content">
      {#if typeof header === 'function'}
        <div class="header">{@render header()}</div>
      {/if}

      <div class="bubble">
        {#if hasBody}
          <div class="body">{@render body?.()}</div>
        {:else if hasHtml}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          <div class="body">{@html effectiveHtml}</div>
        {:else if content.length > 0}
          <div class="body text">{content}</div>
        {/if}

        {#if showTyping}
          <span class="typing"><LoadingDots /></span>
        {/if}
      </div>

      {#if typeof attachments === 'function'}
        <div class="message-attachments">{@render attachments()}</div>
      {/if}

      {#if showActions}
        <div class="actions">
          {#if allowCopy}
            <div class="action">
              <Button onclick={copy} ariaLabel={copyLabel}>
                {#if copied}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html checkmarkSvg}
                {:else}
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                  {@html copySvg}
                {/if}
              </Button>
            </div>
          {/if}
          {#if showRetry}
            <div class="action">
              <Button onclick={() => onretry?.()} ariaLabel={retryLabel}>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html retrySvg}
              </Button>
            </div>
          {/if}
          {#if showFeedback}
            <div class="action">
              <Button onclick={() => onfeedback?.('up')} ariaLabel={feedbackUpLabel}>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html thumbUpSvg}
              </Button>
            </div>
            <div class="action">
              <Button onclick={() => onfeedback?.('down')} ariaLabel={feedbackDownLabel}>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html thumbDownSvg}
              </Button>
            </div>
          {/if}
          {#if typeof actions === 'function'}
            {@render actions()}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</article>

<style>
  .chat-message {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    max-width: var(--chat-message-max-width, 82%);
    margin: var(--chat-message-margin, 0);
  }

  .chat-message.party-sender {
    align-self: flex-end;
    align-items: flex-end;
  }

  .chat-message.party-responder {
    align-self: flex-start;
    align-items: flex-start;
  }

  .row {
    display: flex;
    gap: var(--chat-message-gap, 10px);
    align-items: flex-end;
    width: 100%;
  }

  .chat-message.party-sender .row {
    flex-direction: row-reverse;
  }

  .avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: var(--chat-message-content-gap, 6px);
    min-width: 0;
  }

  .header {
    font-size: var(--chat-message-header-font-size, 0.75rem);
    color: var(--chat-message-header-color, #71717a);
  }

  .bubble {
    box-sizing: border-box;
    padding: var(--chat-message-bubble-padding, 9px 13px);
    border-radius: var(--chat-message-bubble-border-radius, 16px);
    font-size: var(--chat-message-font-size, 0.9375rem);
    line-height: var(--chat-message-line-height, 1.5);
    color: var(--chat-message-color, #27272a);
    background: var(--chat-message-background, #f4f4f5);
    border: var(--chat-message-border, none);
    box-shadow: var(--chat-message-box-shadow, none);
    word-wrap: break-word;
    overflow-wrap: anywhere;
  }

  .chat-message.party-sender .bubble {
    color: var(--chat-message-sender-color, #ffffff);
    background: var(--chat-message-sender-background, #18181b);
    border: var(--chat-message-sender-border, none);
    border-radius: var(
      --chat-message-sender-border-radius,
      var(--chat-message-bubble-border-radius, 16px)
    );
  }

  .chat-message.party-responder .bubble {
    color: var(--chat-message-responder-color, var(--chat-message-color, #27272a));
    background: var(--chat-message-responder-background, transparent);
    border: var(--chat-message-responder-border, none);
    padding: var(--chat-message-responder-padding, 2px 0);
  }

  .chat-message.error .bubble {
    color: var(--chat-message-error-color, #e0334b);
  }

  .text {
    white-space: pre-wrap;
  }

  .typing {
    display: inline-flex;
    align-items: center;
  }

  .message-attachments {
    display: flex;
    flex-direction: column;
    gap: var(--chat-message-attachments-gap, 8px);
    margin: var(--chat-message-attachments-margin, 4px 0 0 0);
  }

  .message-attachments:empty {
    display: none;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: var(--chat-message-actions-gap, 2px);
    opacity: var(--chat-message-actions-opacity, 0);
    transition: var(--chat-message-actions-transition, opacity 0.15s ease);
    --button-width: var(--chat-message-action-size, 28px);
    --button-height: var(--chat-message-action-size, 28px);
    --button-padding: var(--chat-message-action-padding, 6px);
    --button-border-radius: var(--chat-message-action-border-radius, 6px);
    --button-color: var(--chat-message-action-background-color, transparent);
    --button-text-color: var(--chat-message-action-color, #71717a);
    --button-content-gap: 0px;
    --button-hover-color: var(--chat-message-action-hover-background-color, #f4f4f5);
  }

  .chat-message:hover .actions,
  .chat-message:focus-within .actions {
    opacity: 1;
  }

  .action {
    display: flex;
  }

  .action :global(svg) {
    height: 100%;
    width: 100%;
  }

  @media (hover: none) {
    .actions {
      opacity: 1;
    }
  }

  .body :global(p) {
    margin: var(--chat-message-paragraph-margin, 0 0 0.5em 0);
  }

  .body :global(p:last-child) {
    margin-bottom: 0;
  }

  .body :global(a) {
    color: var(--chat-message-link-color, #6d28d9);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .body :global(code) {
    font-family: var(--chat-message-code-font-family, ui-monospace, monospace);
    font-size: 0.88em;
    background: var(--chat-message-code-background, rgba(0, 0, 0, 0.05));
    padding: 1px 5px;
    border-radius: 4px;
  }

  .body :global(pre) {
    background: var(--chat-message-pre-background, rgba(0, 0, 0, 0.05));
    padding: 10px 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0.5em 0;
  }

  .body :global(pre code) {
    background: transparent;
    padding: 0;
  }

  .body :global(ul),
  .body :global(ol) {
    margin: var(--chat-message-list-margin, 0.4em 0);
    padding-left: var(--chat-message-list-padding, 1.4em);
  }

  .body :global(li) {
    margin: 0.2em 0;
  }

  .body :global(h1),
  .body :global(h2),
  .body :global(h3),
  .body :global(h4),
  .body :global(h5),
  .body :global(h6) {
    margin: var(--chat-message-heading-margin, 0.8em 0 0.4em 0);
    line-height: 1.3;
  }

  .body :global(h1) {
    font-size: 1.35em;
  }

  .body :global(h2) {
    font-size: 1.2em;
  }

  .body :global(h3) {
    font-size: 1.1em;
  }

  .body :global(h4),
  .body :global(h5),
  .body :global(h6) {
    font-size: 1em;
  }

  .body :global(blockquote) {
    margin: 0.5em 0;
    padding: 2px 0 2px 12px;
    border-left: 3px solid var(--chat-message-blockquote-border-color, rgba(0, 0, 0, 0.15));
    opacity: var(--chat-message-blockquote-opacity, 0.85);
  }

  .body :global(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    margin: 0.5em 0;
  }

  .body :global(th),
  .body :global(td) {
    padding: 5px 10px;
    border: 1px solid var(--chat-message-table-border-color, rgba(0, 0, 0, 0.12));
    text-align: left;
  }

  .body :global(th) {
    background: var(--chat-message-table-header-background, rgba(0, 0, 0, 0.04));
  }

  .body :global(img) {
    max-width: 100%;
    border-radius: var(--chat-message-image-border-radius, 8px);
  }

  .body :global(hr) {
    border: none;
    border-top: 1px solid var(--chat-message-hr-color, rgba(0, 0, 0, 0.12));
    margin: 0.8em 0;
  }
</style>
