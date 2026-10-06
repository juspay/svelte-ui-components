<script lang="ts">
  import { onMount } from 'svelte';
  import ChatMessage from '$lib/ChatMessage/ChatMessage.svelte';
  import ChatMessageList from '$lib/ChatMessageList/ChatMessageList.svelte';
  import type { ChatMessageData } from '$lib/Chat/types';

  type Scenario = {
    id: string;
    // Custom properties set on an ancestor of the message, which is where an app sets them.
    hostStyle?: string;
    // Renders the message inside a ChatMessageList, which reads --chat-message-list-padding too.
    inList?: boolean;
  };

  const LISTS = '<ul><li>One</li><li>Two</li></ul><ol><li>First</li><li>Second</li></ol>';

  const scenarios: readonly Scenario[] = [
    { id: 'unset' },
    // The older names, which ChatMessageList's own padding token shares.
    { id: 'old-padding', hostStyle: '--chat-message-list-padding: 0' },
    { id: 'old-margin', hostStyle: '--chat-message-list-margin: 1em 0' },
    // The tokens this adds, read first.
    { id: 'new-padding', hostStyle: '--chat-message-body-list-padding: 2em' },
    { id: 'new-margin', hostStyle: '--chat-message-body-list-margin: 1em 0' },
    {
      id: 'new-wins',
      hostStyle:
        '--chat-message-list-padding: 0; --chat-message-list-margin: 0; ' +
        '--chat-message-body-list-padding: 1.4em; --chat-message-body-list-margin: 0.4em 0'
    },
    // The case that motivated them: a list with no padding of its own and lists in its messages that
    // keep their indent, then the same page with only the older name set.
    {
      id: 'in-list',
      inList: true,
      hostStyle: '--chat-message-list-padding: 0; --chat-message-body-list-padding: 1.4em'
    },
    { id: 'in-list-old', inList: true, hostStyle: '--chat-message-list-padding: 0' }
  ];

  const messages: ChatMessageData[] = [
    { id: 'message-0', role: 'assistant', content: 'Lists', html: LISTS }
  ];

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

<div class="cbl-grid">
  {#each scenarios as scenario (scenario.id)}
    <div class="cbl-host" style={scenario.hostStyle} data-pw={`cbl-${scenario.id}`}>
      {#if scenario.inList}
        <ChatMessageList
          {messages}
          jump={false}
          autoscroll={false}
          hideScrollbar
          testId={`cbl-${scenario.id}-list`}
        />
      {:else}
        <ChatMessage role="assistant" html={LISTS} testId={`cbl-${scenario.id}-message`} />
      {/if}
    </div>
  {/each}
</div>

<style>
  .cbl-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 16px;
    align-items: flex-start;
  }

  .cbl-host {
    width: 360px;
  }
</style>
