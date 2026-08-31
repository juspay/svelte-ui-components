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
    scrollPolicy = 'near-bottom',
    pinHold = false,
    jump = true,
    message,
    messageBody,
    messageAttachments,
    empty,
    jumpLabel = 'Jump to latest',
    jumpIcon,
    allowCopy = false,
    onscrollstate,
    onretry,
    onfeedback,
    testId,
    classes
  }: ChatMessageListProperties = $props();

  let listEl: HTMLElement | null = $state(null);
  let innerEl: HTMLElement | null = $state(null);
  let atBottom = $state(true);
  let scrollable = $state(false);
  let pinActive = false;
  // Set when a turn without pinHold has asked for its reservation back, but the reply is not yet
  // tall enough to hold the pinned position without it. Cleared by tryReleasePin.
  let pinReleasePending = false;
  // The scroll offset the pin put the sender message at, so a later release can restore it.
  let pinnedScrollTop = 0;

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

  function reportScrollState(node: HTMLElement): void {
    atBottom = isNearBottom(node);
    scrollable = node.scrollHeight - node.clientHeight > NEAR_BOTTOM_THRESHOLD;
    onscrollstate?.({ atBottom, scrollable });
  }

  function handleScroll(event: Event & { currentTarget: HTMLElement }): void {
    reportScrollState(event.currentTarget);
  }

  export function scrollToBottom(): void {
    if (listEl !== null) {
      listEl.scrollTop = listEl.scrollHeight;
      reportScrollState(listEl);
    }
  }

  function lastSenderId(): string | null {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (partyOf(messages[index].role) === 'sender') {
        return messages[index].id;
      }
    }
    return null;
  }

  /**
   * pin-sender-turn: reserve headroom below the newest sender message and scroll it
   * to the top of the viewport, so the reply streams in beneath the question. The
   * reservation is released when `pinHold` turns false (the host says the turn is
   * over), collapsing the blank space a short reply would otherwise leave.
   *
   * Hosts often append the sender message TOGETHER with a streaming reply
   * placeholder, so the pin targets the last sender message's row, not the last
   * row. Rows map to messages by index — a custom `message` snippet must render
   * exactly one root element per message for this policy.
   */
  function pinLatestSenderMessage(): void {
    if (listEl === null || innerEl === null) {
      return;
    }
    let senderIndex = -1;
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (partyOf(messages[index].role) === 'sender') {
        senderIndex = index;
        break;
      }
    }
    if (senderIndex === -1) {
      return;
    }
    const rows = Array.from(innerEl.children).filter((child) => !child.classList.contains('jump'));
    const target = rows.length === messages.length ? rows[senderIndex] : rows[rows.length - 1];
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const innerRect = innerEl.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const rowOffsetInContent = targetRect.top - innerRect.top;
    innerEl.style.minHeight = `${Math.ceil(rowOffsetInContent + listEl.clientHeight)}px`;
    pinActive = true;
    const listRect = listEl.getBoundingClientRect();
    const paddingTop = Number.parseFloat(getComputedStyle(listEl).paddingTop) || 0;
    // This is a layout correction, not a reader-initiated scroll, so it must land instantly.
    // .chat-message-list sets scroll-behavior: smooth, under which `scrollTop = x` starts an
    // ANIMATION: scrollTop still reads its old value on the next line, and anything that shrinks
    // the scrollable range before the animation finishes clamps it partway. Releasing the
    // reservation does exactly that, which is how the pin was being lost.
    pinnedScrollTop = listEl.scrollTop + (targetRect.top - listRect.top - paddingTop);
    listEl.scrollTo({ top: pinnedScrollTop, behavior: 'instant' });
    reportScrollState(listEl);
  }

  function releasePin(): void {
    if (innerEl !== null) {
      innerEl.style.minHeight = '';
    }
    pinActive = false;
    pinReleasePending = false;
    if (listEl !== null) {
      reportScrollState(listEl);
    }
  }

  /**
   * Give the reserved headroom back only once the turn's own content can hold the pinned position.
   *
   * The reservation is what makes the sender message able to sit at the top at all. Clearing it
   * while the reply is still shorter than the frame shrinks the scrollable range below the pinned
   * offset, the browser clamps, and the question slides back down -- on short answers, which is
   * where pinning matters most. So measure rather than assume: lift the reservation, check whether
   * the natural content still reaches the pinned offset, and put it straight back if it does not.
   * Reply growth re-runs this through the resize observer, so the reservation disappears by itself
   * the moment it stops being load-bearing.
   */
  function tryReleasePin(): void {
    if (!pinReleasePending || listEl === null || innerEl === null) {
      return;
    }
    const reserved = innerEl.style.minHeight;
    // Lifting the reservation to measure also shrinks the scrollable range, and the browser
    // clamps scrollTop to the smaller maximum the moment it does. Putting the reservation back
    // does NOT undo that clamp, so the probe would silently destroy the very position it is
    // checking. Restore the offset explicitly on both paths.
    innerEl.style.minHeight = '';
    const naturalMaxScroll = listEl.scrollHeight - listEl.clientHeight;
    if (naturalMaxScroll >= pinnedScrollTop) {
      listEl.scrollTo({ top: pinnedScrollTop, behavior: 'instant' });
      pinActive = false;
      pinReleasePending = false;
      reportScrollState(listEl);
      return;
    }
    innerEl.style.minHeight = reserved;
    listEl.scrollTo({ top: pinnedScrollTop, behavior: 'instant' });
  }

  const pinToBottom: Action<HTMLElement, string> = (node) => {
    let previousCount = messages.length;
    let previousSenderId = lastSenderId();
    function scroll(): void {
      const newMessage = messages.length > previousCount;
      previousCount = messages.length;
      if (scrollPolicy === 'pin-sender-turn') {
        // Only a NEW sender message moves the viewport; streaming reply content
        // grows below the pinned question without yanking the reader. Hosts often
        // append the sender message together with a reply placeholder, so the
        // trigger is the last SENDER id changing, not the last row's role.
        const senderId = lastSenderId();
        if (newMessage && senderId !== null && senderId !== previousSenderId) {
          queueMicrotask(() => {
            pinLatestSenderMessage();
            // A host opts into reserved reply headroom with pinHold. Without it the reservation
            // is still doing work until the reply itself can hold the pin, so mark it for release
            // and let tryReleasePin decide when that is actually true.
            if (!pinHold) {
              pinReleasePending = true;
              tryReleasePin();
            }
          });
        }
        previousSenderId = senderId;
        return;
      }
      if (autoscroll && (atBottom || newMessage)) {
        queueMicrotask(() => {
          node.scrollTop = node.scrollHeight;
        });
      }
    }
    scroll();
    return { update: scroll };
  };

  /**
   * A stateful `message`/`messageBody` snippet can grow without changing
   * `messages.length` or the last message's `content.length`, so the scroll-key
   * driven action never re-runs. Observing the inner wrapper's size keeps the
   * near-bottom stick (and the reported scroll state) honest for custom bodies.
   */
  const followContentGrowth: Action<HTMLElement> = (node) => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (listEl === null) {
        return;
      }
      if (scrollPolicy === 'near-bottom' && autoscroll && atBottom) {
        listEl.scrollTop = listEl.scrollHeight;
      }
      tryReleasePin();
      reportScrollState(listEl);
    });
    observer.observe(node);
    return {
      destroy(): void {
        observer.disconnect();
      }
    };
  };

  const releaseOnHoldEnd: Action<HTMLElement, boolean> = () => {
    let previousHold = pinHold;
    function check(): void {
      if (previousHold && !pinHold && pinActive) {
        releasePin();
      }
      previousHold = pinHold;
    }
    check();
    return { update: check };
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
  use:releaseOnHoldEnd={pinHold}
>
  <div class="inner" bind:this={innerEl} use:followContentGrowth>
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
        {#snippet bodyFor()}
          {@render messageBody?.(msg)}
        {/snippet}
        <ChatMessage
          role={msg.role}
          content={msg.content}
          html={msg.html}
          body={typeof messageBody === 'function' ? bodyFor : null}
          streaming={msg.streaming}
          status={msg.status}
          allowCopy={allowCopy && partyOf(msg.role) === 'responder'}
          attachments={typeof messageAttachments === 'function' ? attachmentsFor : null}
          onretry={retryFor(msg)}
          onfeedback={feedbackFor(msg)}
        />
      {/if}
    {/each}

    {#if showJump && jump}
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
</div>

<style>
  .chat-message-list {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    overflow-y: auto;
    padding: var(--chat-message-list-padding, 0.75rem 1.5rem);
    scroll-behavior: var(--chat-message-list-scroll-behavior, smooth);
  }

  /* The inner wrapper is what the pin-sender-turn policy reserves height on; it
     carries the column layout so the reservation becomes scrollable headroom. */
  .inner {
    display: flex;
    flex-direction: column;
    gap: var(--chat-message-list-gap, 1rem);
    flex: 1 0 auto;
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
