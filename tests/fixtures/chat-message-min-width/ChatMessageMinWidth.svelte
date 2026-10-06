<script lang="ts">
  import { onMount } from 'svelte';
  import ChatMessage from '$lib/ChatMessage/ChatMessage.svelte';

  const contexts = ['row', 'column', 'grid', 'block'] as const;

  // Each case is a parent of a fixed 240px width holding one message. `wide` carries a
  // 400px child that cannot wrap, so the message's content-based minimum is wider than the
  // parent; `short` is two letters, narrower than any token below. The max-width token is
  // lifted from `wide` and `code` so the 82% cap does not clamp the automatic minimum before
  // the min-width token is read, and `wide-capped` and `code-capped` keep the default to show
  // where unset and 0 agree and where they do not.
  const cases = [
    { content: 'wide', state: 'unset', tokens: '--chat-message-max-width: none;' },
    {
      content: 'wide',
      state: 'auto',
      tokens: '--chat-message-max-width: none; --chat-message-min-width: auto;'
    },
    {
      content: 'wide',
      state: 'zero',
      tokens: '--chat-message-max-width: none; --chat-message-min-width: 0;'
    },
    { content: 'wide-capped', state: 'unset', tokens: '' },
    { content: 'wide-capped', state: 'zero', tokens: '--chat-message-min-width: 0;' },
    {
      content: 'wide',
      state: 'floor',
      tokens: '--chat-message-max-width: none; --chat-message-min-width: 120px;'
    },
    { content: 'code', state: 'unset', tokens: '--chat-message-max-width: none;' },
    {
      content: 'code',
      state: 'zero',
      tokens: '--chat-message-max-width: none; --chat-message-min-width: 0;'
    },
    { content: 'code-capped', state: 'unset', tokens: '' },
    { content: 'code-capped', state: 'zero', tokens: '--chat-message-min-width: 0;' },
    { content: 'short', state: 'unset', tokens: '' },
    { content: 'short', state: 'auto', tokens: '--chat-message-min-width: auto;' },
    { content: 'short', state: 'floor', tokens: '--chat-message-min-width: 120px;' },
    { content: 'short', state: 'over', tokens: '--chat-message-min-width: 320px;' }
  ] as const;

  const twins = [
    { content: 'wide', className: '' },
    { content: 'wide-capped', className: 'twin-capped' }
  ] as const;

  // A real message body that is wider than any parent here: a code block is a scroll container,
  // yet its text still sets the message's content-based minimum.
  const codeHtml = `<pre data-pw="mw-code">${'0123456789'.repeat(40)}</pre>`;

  // An app's stylesheet is linked ahead of the library's, so an app rule that targets the same
  // selector loses any tie to it. Placing the rule first in the head reproduces that order.
  const consumerCss = new URLSearchParams(window.location.search).get('css');
  if (consumerCss !== null) {
    const consumerSheet = document.createElement('style');
    consumerSheet.textContent = consumerCss;
    document.head.prepend(consumerSheet);
  }

  onMount(() => {
    document.documentElement.dataset.fixtureReady = 'true';
  });
</script>

{#snippet wideBody()}
  <div class="wide-child">A child that cannot shrink below 400px.</div>
{/snippet}

<h1>ChatMessage min-width</h1>

{#each contexts as context (context)}
  {#each cases as scenario (`${scenario.content}-${scenario.state}`)}
    <div
      class="parent parent-{context}"
      style={scenario.tokens}
      data-pw="mw-parent-{context}-{scenario.content}-{scenario.state}"
    >
      {#if scenario.content === 'code' || scenario.content === 'code-capped'}
        <ChatMessage
          role="responder"
          html={codeHtml}
          testId="mw-message-{context}-{scenario.content}-{scenario.state}"
        />
      {:else if scenario.content === 'short'}
        <ChatMessage
          role="sender"
          content="Ok"
          testId="mw-message-{context}-{scenario.content}-{scenario.state}"
        />
      {:else}
        <ChatMessage
          role="responder"
          content="A child that cannot shrink below 400px."
          body={wideBody}
          testId="mw-message-{context}-{scenario.content}-{scenario.state}"
        />
      {/if}
    </div>
  {/each}

  <!-- A twin has the message's root box rules and no min-width rule of any kind, so what it
       resolves to in this parent is what the message resolved to before the token existed. -->
  {#each twins as twin (twin.content)}
    <div class="parent parent-{context}" data-pw="mw-twin-parent-{context}-{twin.content}">
      <div class="twin {twin.className}" data-pw="mw-twin-{context}-{twin.content}">
        <div class="wide-child">A child that cannot shrink below 400px.</div>
      </div>
    </div>
  {/each}
{/each}

<style>
  .parent {
    box-sizing: border-box;
    width: 240px;
    margin-bottom: 12px;
    outline: 1px dashed #999;
  }

  .parent-row {
    display: flex;
  }

  .parent-column {
    display: flex;
    flex-direction: column;
  }

  .parent-grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  .parent-block {
    display: block;
  }

  .twin {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-self: flex-start;
    align-items: flex-start;
  }

  .twin-capped {
    max-width: 82%;
  }

  .wide-child {
    flex: none;
    box-sizing: border-box;
    width: 400px;
    height: 20px;
    background: #ccd;
  }
</style>
