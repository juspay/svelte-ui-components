<script lang="ts">
  import Button from '../Button/Button.svelte';
  import ChatMessage from '../ChatMessage/ChatMessage.svelte';
  import chevronDownSvg from '$lib/assets/chevron-down.svg?raw';
  import { partyOf } from '../Chat/roles';
  import type { Action } from 'svelte/action';
  import type { ChatMessageData } from '../Chat/types';
  import type { ChatMessageFeedback } from '../ChatMessage/properties';
  import type { ChatMessageListProperties } from './properties';

  const NEAR_BOTTOM_THRESHOLD = 80;

  let {
    messages,
    autoscroll = true,
    message,
    messageAttachments,
    empty,
    jumpLabel = 'Jump to latest',
    jumpIcon,
    allowCopy = false,
    onretry,
    onfeedback,
    testId,
    classes
  }: ChatMessageListProperties = $props();

  let listEl: HTMLElement | null = $state(null);
  let atBottom = $state(true);

  let scrollKey = $derived(`${messages.length}:${messages.at(-1)?.content.length ?? 0}`);
  let showJump = $derived(!atBottom && messages.length > 0);
  let lastResponderId = $derived.by(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const candidate = messages.at(i);
      if (candidate && partyOf(candidate.role) === 'responder') {
        return candidate.id;
      }
    }
    return null;
  });

  function retryFor(msg: ChatMessageData): (() => void) | null {
    if (
      typeof onretry === 'function' &&
      partyOf(msg.role) === 'responder' &&
      msg.id === lastResponderId
    ) {
      return onretry;
    }
    return null;
  }

  function feedbackFor(msg: ChatMessageData): ((value: ChatMessageFeedback) => void) | null {
    if (typeof onfeedback === 'function' && partyOf(msg.role) === 'responder') {
      return (value) => onfeedback?.(value, msg);
    }
    return null;
  }

  function isNearBottom(node: HTMLElement): boolean {
    return node.scrollHeight - node.scrollTop - node.clientHeight < NEAR_BOTTOM_THRESHOLD;
  }

  function handleScroll(event: Event & { currentTarget: HTMLElement }): void {
    atBottom = isNearBottom(event.currentTarget);
  }

  function scrollToBottom(): void {
    if (listEl !== null) {
      listEl.scrollTop = listEl.scrollHeight;
      atBottom = true;
    }
  }

  const pinToBottom: Action<HTMLElement, string> = (node) => {
    let previousCount = messages.length;
    function scroll(): void {
      const newMessage = messages.length > previousCount;
      previousCount = messages.length;
      if (autoscroll && (atBottom || newMessage)) {
        queueMicrotask(() => {
          node.scrollTop = node.scrollHeight;
        });
      }
    }
    scroll();
    return { update: scroll };
  };
</script>

<div
  class="chat-message-list {classes ?? ''}"
  role="log"
  aria-live="polite"
  data-pw={typeof testId === 'string' ? testId : null}
  testID={typeof testId === 'string' ? testId : null}
  bind:this={listEl}
  onscroll={handleScroll}
  use:pinToBottom={scrollKey}
>
  {#if messages.length === 0 && typeof empty === 'function'}
    {@render empty()}
  {/if}

  {#each messages as msg (msg.id)}
    {#if typeof message === 'function'}
      {@render message(msg)}
    {:else}
      {#snippet attachmentsFor()}
        {@render messageAttachments?.(msg)}
      {/snippet}
      <ChatMessage
        role={msg.role}
        content={msg.content}
        html={msg.html}
        streaming={msg.streaming}
        status={msg.status}
        allowCopy={allowCopy && partyOf(msg.role) === 'responder'}
        attachments={typeof messageAttachments === 'function' ? attachmentsFor : null}
        onretry={retryFor(msg)}
        onfeedback={feedbackFor(msg)}
      />
    {/if}
  {/each}

  {#if showJump}
    <div class="jump">
      <Button onclick={scrollToBottom} ariaLabel={jumpLabel}>
        {#if typeof jumpIcon === 'function'}
          {@render jumpIcon()}
        {:else}
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html chevronDownSvg}
        {/if}
      </Button>
    </div>
  {/if}
</div>

<style>
  .chat-message-list {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--chat-message-list-gap, 1rem);
    flex: 1;
    width: 100%;
    overflow-y: auto;
    padding: var(--chat-message-list-padding, 0.75rem 1.5rem);
    scroll-behavior: var(--chat-message-list-scroll-behavior, smooth);
  }

  .jump {
    position: sticky;
    bottom: var(--chat-message-list-jump-bottom, 8px);
    align-self: center;
    margin-top: var(--chat-message-list-jump-margin-top, 4px);
    --button-width: var(--chat-message-list-jump-size, 36px);
    --button-height: var(--chat-message-list-jump-size, 36px);
    --button-padding: var(--chat-message-list-jump-padding, 8px);
    --button-border-radius: var(--chat-message-list-jump-border-radius, 50%);
    --button-color: var(--chat-message-list-jump-background-color, #ffffff);
    --button-text-color: var(--chat-message-list-jump-color, #52525b);
    --button-border: var(--chat-message-list-jump-border, 1px solid #e4e4e7);
    --button-box-shadow: var(--chat-message-list-jump-box-shadow, 0 4px 12px rgba(0, 0, 0, 0.12));
    --button-content-gap: 0px;
    --button-hover-color: var(--chat-message-list-jump-hover-background-color, #f4f4f5);
  }

  .jump :global(svg) {
    height: 100%;
    width: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .chat-message-list {
      scroll-behavior: auto;
    }
  }
</style>
