<script lang="ts">
  import ChatMessageList from '$lib/ChatMessageList/ChatMessageList.svelte';
  import type { ChatMessageData } from '$lib/Chat/types';

  const messages: ChatMessageData[] = [
    { id: '1', role: 'sender', content: 'What can you help me with?' },
    {
      id: '2',
      role: 'responder',
      content: 'I can help you find products, track orders, and more.'
    },
    { id: '3', role: 'sender', content: 'Find me a blue jacket.' },
    { id: '4', role: 'responder', content: 'Searching now…', streaming: true }
  ];

  // Host apps render rich message bodies (metric cards, reports, media) inside
  // the bubble chrome. `content` stays populated as the text form for copy.
  const richMessages: ChatMessageData[] = [
    { id: 'r1', role: 'sender', content: 'How did sales do last week?' },
    {
      id: 'r2',
      role: 'responder',
      content: 'Sales last week: ₹4.2L across 312 orders, up 18% week over week.'
    },
    { id: 'r3', role: 'sender', content: 'Nice — and conversion?' },
    {
      id: 'r4',
      role: 'responder',
      content: 'Conversion rate held at 3.1%, best day Friday at 3.8%.'
    }
  ];

  let feedbackLog = $state('—');

  // pin-sender-turn demo: sending pins the question to the top; the reply streams
  // beneath it while pinHold keeps the reserved headroom, then releases.
  let pinMessages = $state<ChatMessageData[]>([
    { id: 'p1', role: 'sender', content: 'What can this list do?' },
    {
      id: 'p2',
      role: 'responder',
      content: 'Scroll policies! Send a message below and watch it pin to the top.'
    }
  ]);
  let pinDraft = $state('');
  let pinBusy = $state(false);
  let pinCounter = 0;

  const sendPinned = (): void => {
    const text = pinDraft.trim();
    if (text.length === 0 || pinBusy) {
      return;
    }
    pinDraft = '';
    pinCounter += 1;
    const replyId = `pr${pinCounter}`;
    pinMessages = [
      ...pinMessages,
      { id: `pq${pinCounter}`, role: 'sender', content: text },
      { id: replyId, role: 'responder', content: '', streaming: true }
    ];
    pinBusy = true;
    const reply =
      'Pinned! Your question stays at the top while this reply streams in below it — ' +
      'no yanking to the bottom mid-read. When the turn finishes, the reserved ' +
      'headroom collapses so a short answer leaves no blank gap.';
    const words = reply.split(' ');
    let wordIndex = 0;
    const timer = setInterval(() => {
      wordIndex += 1;
      pinMessages = pinMessages.map((message) =>
        message.id === replyId
          ? {
              ...message,
              content: words.slice(0, wordIndex).join(' '),
              streaming: wordIndex < words.length
            }
          : message
      );
      if (wordIndex >= words.length) {
        clearInterval(timer);
        pinBusy = false;
      }
    }, 90);
  };
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ChatMessageList</h1>
</div>

<div class="chat-theme chat-card list-frame">
  <ChatMessageList {messages} />
</div>

<h2>Custom message body — app markup inside the bubble chrome</h2>
<p class="demo-note">
  <code>messageBody</code> replaces only the bubble's text/html; role styling, autoscroll and the
  copy / feedback actions stay library-owned (hover a responder message). <code>content</code>
  keeps the text form so copy still works.
</p>
<div class="chat-theme chat-card list-frame">
  <ChatMessageList
    messages={richMessages}
    allowCopy={true}
    onfeedback={(value, message) => {
      feedbackLog = `${value} on ${message.id}`;
    }}
  >
    {#snippet messageBody(message)}
      {#if message.role === 'responder' && message.id === 'r2'}
        <div class="metric-row">
          <div class="metric">
            <span class="metric-value">₹4.2L</span>
            <span class="metric-label">Sales</span>
          </div>
          <div class="metric">
            <span class="metric-value">312</span>
            <span class="metric-label">Orders</span>
          </div>
          <div class="metric up">
            <span class="metric-value">+18%</span>
            <span class="metric-label">WoW</span>
          </div>
        </div>
        <p class="metric-caption">Sales last week, week over week.</p>
      {:else}
        {message.content}
      {/if}
    {/snippet}
  </ChatMessageList>
</div>
<p class="demo-note">last feedback: {feedbackLog}</p>

<h2>pin-sender-turn — the question pins to the top, the reply streams below</h2>
<p class="demo-note">
  <code>scrollPolicy="pin-sender-turn"</code> with <code>pinHold</code> driven by the demo's streaming
  state. Type and send; the new question scrolls to the top with reserved headroom instead of the reader
  being yanked to the bottom.
</p>
<div class="chat-theme chat-card list-frame pin-frame">
  <ChatMessageList
    messages={pinMessages}
    scrollPolicy="pin-sender-turn"
    pinHold={pinBusy}
    testId="pin-demo-list"
  />
  <form
    class="pin-composer"
    onsubmit={(event) => {
      event.preventDefault();
      sendPinned();
    }}
  >
    <input
      class="pin-input"
      placeholder="Ask something…"
      bind:value={pinDraft}
      data-pw="pin-demo-input"
    />
    <button type="submit" class="pin-send" disabled={pinBusy} data-pw="pin-demo-send">Send</button>
  </form>
</div>

<style>
  .list-frame {
    height: 360px;
    max-width: 480px;
    background: var(--doc-demo-bg);
  }

  .pin-frame {
    display: flex;
    flex-direction: column;
  }

  .pin-composer {
    display: flex;
    gap: 8px;
    padding: 10px;
    border-top: 1px solid var(--doc-border, #e5e7eb);
  }

  .pin-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--doc-border, #e5e7eb);
    border-radius: 8px;
    background: transparent;
    color: inherit;
  }

  .pin-send {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: var(--doc-accent, #6d28d9);
    color: #fff;
    cursor: pointer;
  }

  .pin-send:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .metric-row {
    display: flex;
    gap: 16px;
    padding: 10px 12px;
    border: 1px solid var(--doc-border, #e5e7eb);
    border-radius: 10px;
    background: var(--doc-demo-bg, #fafafa);
  }

  .metric {
    display: flex;
    flex-direction: column;
    min-width: 56px;
  }

  .metric-value {
    font-weight: 600;
  }

  .metric.up .metric-value {
    color: #16a34a;
  }

  .metric-label {
    font-size: 0.75rem;
    opacity: 0.7;
  }

  .metric-caption {
    margin: 8px 0 0;
    font-size: 0.8125rem;
    opacity: 0.8;
  }
</style>
