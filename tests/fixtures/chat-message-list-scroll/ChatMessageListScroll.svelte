<script lang="ts">
  import { onMount } from 'svelte';
  import ChatMessageList from '$lib/ChatMessageList/ChatMessageList.svelte';
  import type { ChatMessageData } from '$lib/Chat/types';

  type Scenario = {
    id: string;
    // Custom properties set on an ancestor of the list, which is where an app sets them.
    hostStyle?: string;
    hideScrollbar?: boolean;
    classes?: string;
    // Wraps the host in a scroll container, so a scroll that reaches the end of the list has
    // somewhere to chain to.
    chained?: boolean;
    // The list as an app gets it by default: ChatMessage bubbles, autoscroll and the jump button.
    plain?: boolean;
  };

  const scenarios: readonly Scenario[] = [
    { id: 'base' },
    { id: 'default', plain: true },
    { id: 'hide-false', hideScrollbar: false },
    { id: 'hide', hideScrollbar: true },
    { id: 'x-hidden', hostStyle: '--chat-message-list-overflow-x: hidden' },
    { id: 'x-auto', hostStyle: '--chat-message-list-overflow-x: auto' },
    { id: 'overscroll-none', hostStyle: '--chat-message-list-overscroll-behavior: none' },
    { id: 'overscroll-contain', hostStyle: '--chat-message-list-overscroll-behavior: contain' },
    // Rules of the app's own, at the specificity of a single class and with the tokens unset
    // (or set to something else): they must keep winning over the tokens' declarations.
    { id: 'consumer-rule', classes: 'cml-consumer-rule' },
    {
      id: 'consumer-rule-token',
      classes: 'cml-consumer-rule',
      hostStyle:
        '--chat-message-list-overflow-x: auto; --chat-message-list-overscroll-behavior: auto'
    },
    // The same rule written inside a cascade layer, as a Tailwind v4 utility is. An unlayered
    // declaration beats a layered one whatever the specificity, so the list must not declare
    // overflow-x or overscroll-behavior unlayered when the tokens are unset; set tokens still win.
    { id: 'layered-rule', classes: 'cml-layered-rule' },
    {
      id: 'layered-rule-token',
      classes: 'cml-layered-rule',
      hostStyle:
        '--chat-message-list-overflow-x: auto; --chat-message-list-overscroll-behavior: auto'
    },
    // A rule heavy enough to beat the list's own overflow-y, which leaves overflow-x to whatever the
    // list gives it: this is where a fallback of `auto` instead of `visible` would show.
    { id: 'consumer-y-visible', classes: 'cml-y-visible' },
    // The workaround an app wrote before the tokens existed, and the same list written with them.
    { id: 'workaround', classes: 'cml-workaround' },
    {
      id: 'adopted',
      hideScrollbar: true,
      hostStyle:
        '--chat-message-list-overflow-x: hidden; --chat-message-list-overscroll-behavior: none'
    },
    { id: 'chain-base', chained: true },
    {
      id: 'chain-none',
      chained: true,
      hostStyle: '--chat-message-list-overscroll-behavior: none'
    },
    {
      id: 'chain-contain',
      chained: true,
      hostStyle: '--chat-message-list-overscroll-behavior: contain'
    }
  ];

  const messages: ChatMessageData[] = Array.from({ length: 10 }, (_, index) => ({
    id: `message-${index}`,
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${index}`
  }));

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<!-- Every row is wider than the list, so each list overflows both ways. -->
{#snippet row(message: ChatMessageData)}
  <div class="cml-row" data-pw="cml-row">{message.content}</div>
{/snippet}

{#snippet list(scenario: Scenario)}
  <div class="cml-host" style={scenario.hostStyle} data-pw={`cml-${scenario.id}`}>
    {#if scenario.plain}
      <ChatMessageList
        {messages}
        testId={`cml-${scenario.id}-list`}
        classes={scenario.classes}
        hideScrollbar={scenario.hideScrollbar}
      />
    {:else}
      <ChatMessageList
        {messages}
        message={row}
        jump={false}
        autoscroll={false}
        testId={`cml-${scenario.id}-list`}
        classes={scenario.classes}
        hideScrollbar={scenario.hideScrollbar}
      />
    {/if}
  </div>
{/snippet}

<div class="cml-grid">
  {#each scenarios as scenario (scenario.id)}
    {#if scenario.chained}
      <div class="cml-outer" data-pw={`cml-${scenario.id}-outer`}>
        {@render list(scenario)}
        <div class="cml-after">Content after the list</div>
      </div>
    {:else}
      {@render list(scenario)}
    {/if}
  {/each}
</div>

<style>
  .cml-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
    align-items: flex-start;
  }

  .cml-host {
    display: flex;
    flex-direction: column;
    width: 280px;
    height: 140px;
  }

  .cml-outer {
    width: 280px;
    height: 120px;
    overflow-y: auto;
  }

  .cml-after {
    height: 400px;
  }

  .cml-row {
    flex: none;
    box-sizing: border-box;
    width: 460px;
    height: 36px;
  }

  /* One class, so a library rule that was not written with zero specificity would beat it. */
  :global(.cml-consumer-rule) {
    overflow-x: hidden;
    overscroll-behavior: none;
  }

  /* The rule of the app's own again, inside a cascade layer. */
  @layer cml-app {
    :global(.cml-layered-rule) {
      overflow-x: hidden;
      overscroll-behavior: none;
    }
  }

  /* Four classes of specificity, enough to beat the list's own overflow-y. */
  .cml-host :global(.chat-message-list.cml-y-visible) {
    overflow-y: visible;
  }

  /* What an app wrote before the tokens: the shorthand, the overscroll value and a
     zero-width vertical scrollbar. */
  :global(.cml-workaround) {
    overflow: hidden auto;
    overscroll-behavior: none;
  }

  :global(.cml-workaround)::-webkit-scrollbar {
    width: 0;
  }
</style>
