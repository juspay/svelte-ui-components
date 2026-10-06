<script lang="ts">
  import { onMount } from 'svelte';
  import ChatMessageList from '$lib/ChatMessageList/ChatMessageList.svelte';
  import type { ChatMessageData } from '$lib/Chat/types';

  type Scenario = {
    id: string;
    // Custom properties set on an ancestor of the list, which is where an app sets them.
    hostStyle?: string;
    // A class on that ancestor, for the rules of the app's own that reach the inner column.
    hostClass?: string;
  };

  const CENTRE =
    '--chat-message-list-inner-width: 100%; --chat-message-list-inner-max-width: 240px; ' +
    '--chat-message-list-inner-margin-inline: auto';
  const ALL_TOKENS =
    '--chat-message-list-inner-padding-bottom: 36px; --chat-message-list-inner-padding-inline: 20px; ' +
    CENTRE;

  const scenarios: readonly Scenario[] = [
    { id: 'unset' },
    { id: 'padding-bottom', hostStyle: '--chat-message-list-inner-padding-bottom: 36px' },
    { id: 'padding-inline', hostStyle: '--chat-message-list-inner-padding-inline: 20px' },
    { id: 'max-width', hostStyle: '--chat-message-list-inner-max-width: 240px' },
    // An auto margin turns the column's stretch off, so without a width it shrinks to its content.
    {
      id: 'no-width',
      hostStyle:
        '--chat-message-list-inner-max-width: 240px; --chat-message-list-inner-margin-inline: auto'
    },
    { id: 'centred', hostStyle: CENTRE },
    { id: 'all', hostStyle: ALL_TOKENS },
    // Rules of the app's own, at the specificity of two classes, with the tokens unset and set:
    // they must keep winning over the tokens' declarations.
    { id: 'consumer-rule', hostClass: 'cmi-consumer-rule' },
    { id: 'consumer-rule-token', hostClass: 'cmi-consumer-rule', hostStyle: ALL_TOKENS },
    // The same rule inside a cascade layer, as a Tailwind v4 utility is. An unlayered declaration
    // beats a layered one whatever the specificity, so with the tokens unset the column must hand
    // the properties back; set tokens still win.
    { id: 'layered-rule', hostClass: 'cmi-layered-rule' },
    { id: 'layered-rule-token', hostClass: 'cmi-layered-rule', hostStyle: ALL_TOKENS }
  ];

  const messages: ChatMessageData[] = Array.from({ length: 8 }, (_, index) => ({
    id: `message-${index}`,
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${index}`
  }));

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

{#snippet row(message: ChatMessageData)}
  <div class="cmi-row" data-pw="cmi-row">{message.content}</div>
{/snippet}

<div class="cmi-grid">
  {#each scenarios as scenario (scenario.id)}
    <div
      class={['cmi-host', scenario.hostClass]}
      style={scenario.hostStyle}
      data-pw={`cmi-${scenario.id}`}
    >
      <ChatMessageList
        {messages}
        message={row}
        jump={false}
        autoscroll={false}
        hideScrollbar
        testId={`cmi-${scenario.id}-list`}
      />
    </div>
  {/each}
</div>

<style>
  .cmi-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
    align-items: flex-start;
  }

  /* The reset an app has, so padding and a width add up the way they do there. */
  .cmi-host,
  .cmi-host :global(*) {
    box-sizing: border-box;
  }

  /* The list's own padding is out of the way, so every offset is a number of the column's. */
  .cmi-host {
    --chat-message-list-padding: 0;

    display: flex;
    flex-direction: column;
    width: 400px;
    height: 200px;
  }

  .cmi-row {
    flex: none;
    box-sizing: border-box;
    width: 100%;
    height: 30px;
  }

  /* Two classes: a library rule that was not written with zero specificity would beat it. */
  :global(.cmi-consumer-rule .inner) {
    padding-bottom: 12px;
    padding-inline: 5px;
    max-width: 300px;
    margin-inline: 10px;
  }

  @layer cmi-app {
    :global(.cmi-layered-rule .inner) {
      padding-bottom: 12px;
      padding-inline: 5px;
      max-width: 300px;
      margin-inline: 10px;
    }
  }
</style>
