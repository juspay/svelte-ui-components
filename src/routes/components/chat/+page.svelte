<script lang="ts">
  import { onMount } from 'svelte';
  import Chat from '$lib/Chat/Chat.svelte';
  import Button from '$lib/Button/Button.svelte';
  import Resizable from '$lib/Resizable/Resizable.svelte';
  import ChatMessageList from '$lib/ChatMessageList/ChatMessageList.svelte';
  import ChatMessage from '$lib/ChatMessage/ChatMessage.svelte';
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';
  import ChatSuggestions from '$lib/ChatSuggestions/ChatSuggestions.svelte';
  import ThinkingIndicator from '$lib/ThinkingIndicator/ThinkingIndicator.svelte';
  import ToolCallLog from '$lib/ToolCallLog/ToolCallLog.svelte';
  import TaskList from '$lib/TaskList/TaskList.svelte';
  import { ChatController } from '$lib/Chat/controller.svelte';
  import type { ChatMessageData, ChatTransport } from '$lib/Chat/types';
  import type { ThinkingIndicatorTraceRow } from '$lib/ThinkingIndicator/properties';
  import type { ToolCallChip } from '$lib/ToolCallLog/properties';
  import type { TaskListRow, TaskStatus } from '$lib/TaskList/properties';
  import type { ChatSuggestion } from '$lib/ChatSuggestions/properties';

  type ChatOption = { label: string };

  function optionsOf(items: unknown[]): ChatOption[] {
    const options: ChatOption[] = [];
    for (const item of items) {
      if (typeof item === 'object' && item !== null && 'label' in item) {
        const { label } = item;
        if (typeof label === 'string') {
          options.push({ label });
        }
      }
    }
    return options;
  }

  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const mockTransport: ChatTransport = async ({ message, signal }, handlers) => {
    handlers.onToolStatus?.({ label: 'Searching the catalog…' });
    await delay(700);
    if (signal.aborted) {
      return;
    }
    handlers.onToolStatus?.(null);

    const reply = `Thanks for asking about "${message}". This reply streams in word by word, and you can stop, copy, or retry it.`;
    for (const word of reply.split(' ')) {
      if (signal.aborted) {
        return;
      }
      handlers.onText(`${word} `);
      await delay(45);
    }

    handlers.onAttachment?.({ label: 'Show similar' });
    handlers.onAttachment?.({ label: 'Something else' });
    handlers.onDone?.();
  };

  const chat = new ChatController({ transport: mockTransport, typewriter: true });
  let value = $state('');
  let attachments: File[] = $state([]);
  let recording = $state(false);
  let panelWidth = $state(420);
  let panelHeight = $state(600);

  // Expand toggle: swap to a larger preset (animated by Resizable's transition),
  // restoring the prior size on collapse.
  let expanded = $state(false);
  const expandedWidth = 640;
  const expandedHeight = 760;
  let liveWidth = $derived(expanded ? expandedWidth : panelWidth);
  let liveHeight = $derived(expanded ? expandedHeight : panelHeight);

  function setLiveWidth(value: number): void {
    if (!expanded) {
      panelWidth = value;
    }
  }

  function setLiveHeight(value: number): void {
    if (!expanded) {
      panelHeight = value;
    }
  }

  // ---- Full agent turn: ThinkingIndicator trace + ToolCallLog + TaskList,
  // composed straight into a ChatMessageList transcript, ending with follow-up
  // ChatSuggestions in their real spot — above the composer. Every stage is a
  // host-owned timer, exactly like the ThinkingIndicator / ToolCallLog / TaskList
  // showcase pages; nothing here is built into the components themselves.

  const TURN_USER_ID = 'turn-user';
  const TURN_ASSISTANT_ID = 'turn-assistant';
  const TURN_QUESTION = 'Can you put together a plan to fix our winter waffle-cone shortage?';
  const TURN_QUERY = 'winter waffle-cone shortage';
  const TURN_REPLY =
    'Joy Cone can restock 600 units by Friday — I priced two shipping options and flagged the cheaper one in the plan below.';

  const TURN_TRACE_ROWS: ThinkingIndicatorTraceRow[] = [
    {
      primary: 'Joy Cone wholesale pricing',
      secondary: 'joycone.com',
      href: 'https://example.com'
    },
    {
      primary: 'Regional distributor stock levels',
      secondary: 'scoopdata.io',
      href: 'https://example.com'
    },
    {
      primary: 'Shipping cost comparison',
      secondary: 'freightbay.io',
      href: 'https://example.com'
    }
  ];

  const TURN_TOOL_CHIPS: ToolCallChip[] = [
    { label: 'Read', meta: 'inventory.csv', mono: true },
    { label: 'Run', meta: 'reorder-calculator', mono: true },
    { label: 'Fetch', meta: 'supplier catalog', mono: true }
  ];

  const TURN_PLAN_TEMPLATE: Array<Omit<TaskListRow, 'status'>> = [
    { label: 'Reorder 600 units', secondary: 'Joy Cone' },
    { label: 'Notify the warehouse team' },
    { label: 'Update the storefront banner', secondary: 'homepage' }
  ];

  const FOLLOW_UP_SUGGESTIONS: ChatSuggestion[] = [
    'Draft the supplier email',
    'Show me the cost comparison',
    { label: 'Adjust the plan', value: 'Can you spread this reorder across two suppliers instead?' }
  ];

  const createInitialTurnMessages = (): ChatMessageData[] => [
    { id: TURN_USER_ID, role: 'sender', content: TURN_QUESTION },
    { id: TURN_ASSISTANT_ID, role: 'responder', content: '', streaming: true }
  ];

  const toPendingPlanRow = (row: Omit<TaskListRow, 'status'>): TaskListRow => {
    return { ...row, status: 'pending' };
  };

  let turnMessages = $state<ChatMessageData[]>(createInitialTurnMessages());
  let turnThinkingBusy = $state(true);
  let turnThinkingRows = $state<ThinkingIndicatorTraceRow[]>([]);
  let turnThinkingLabel = $derived(
    turnThinkingBusy ? 'Searching the web' : `Searched ${TURN_TRACE_ROWS.length * 2} sources`
  );
  let turnToolChips = $state<ToolCallChip[]>([]);
  let turnPlanRows = $state<TaskListRow[]>([]);
  let turnPlanVisible = $state(false);
  let turnFollowUpsVisible = $state(false);
  let turnComposerValue = $state('');
  let turnFollowUpCounter = 0;
  let turnTimers: ReturnType<typeof setTimeout>[] = [];

  const setAssistantContent = (content: string, streaming: boolean): void => {
    turnMessages = turnMessages.map((entry) =>
      entry.id === TURN_ASSISTANT_ID ? { ...entry, content, streaming } : entry
    );
  };

  const setPlanStatus = (index: number, status: TaskStatus): void => {
    const row = turnPlanRows[index];
    if (!row) {
      return;
    }
    turnPlanRows[index] = { ...row, status };
  };

  const runPlan = (): void => {
    let elapsed = 0;
    TURN_PLAN_TEMPLATE.forEach((_, index) => {
      elapsed += 550;
      turnTimers.push(setTimeout(() => setPlanStatus(index, 'running'), elapsed));
      elapsed += 550;
      turnTimers.push(
        setTimeout(() => {
          setPlanStatus(index, 'done');
          if (index === TURN_PLAN_TEMPLATE.length - 1) {
            turnFollowUpsVisible = true;
          }
        }, elapsed)
      );
    });
  };

  const runToolChips = (): void => {
    TURN_TOOL_CHIPS.forEach((chip, index) => {
      const isLast = index === TURN_TOOL_CHIPS.length - 1;
      turnTimers.push(
        setTimeout(
          () => {
            turnToolChips = [...turnToolChips, { ...chip, state: isLast ? 'running' : 'done' }];
          },
          (index + 1) * 450
        )
      );
    });
    turnTimers.push(
      setTimeout(
        () => {
          turnToolChips = turnToolChips.map((chip, index) =>
            index === TURN_TOOL_CHIPS.length - 1 ? { ...chip, state: 'done' } : chip
          );
          turnPlanRows = TURN_PLAN_TEMPLATE.map(toPendingPlanRow);
          turnPlanVisible = true;
          runPlan();
        },
        TURN_TOOL_CHIPS.length * 450 + 700
      )
    );
  };

  const streamReply = (): void => {
    const words = TURN_REPLY.split(' ');
    words.forEach((_, index) => {
      turnTimers.push(
        setTimeout(
          () => {
            const isLast = index === words.length - 1;
            setAssistantContent(words.slice(0, index + 1).join(' '), !isLast);
            if (isLast) {
              turnTimers.push(setTimeout(runToolChips, 500));
            }
          },
          (index + 1) * 45
        )
      );
    });
  };

  const handleTraceSettled = (): void => {
    turnTimers.push(setTimeout(streamReply, 350));
  };

  const appendFollowUpTurn = (text: string): void => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    turnFollowUpsVisible = false;
    turnFollowUpCounter += 1;
    turnMessages = [
      ...turnMessages,
      { id: `turn-follow-up-q${turnFollowUpCounter}`, role: 'sender', content: trimmed },
      {
        id: `turn-follow-up-r${turnFollowUpCounter}`,
        role: 'responder',
        content: "Got it — I'll start on that next."
      }
    ];
    turnComposerValue = '';
  };

  const handleFollowUpSelect = (value: string): void => {
    appendFollowUpTurn(value);
  };

  const handleTurnComposerSubmit = (value: string): void => {
    appendFollowUpTurn(value);
  };

  const replayTurn = (): void => {
    turnTimers.forEach(clearTimeout);
    turnTimers = [];
    turnMessages = createInitialTurnMessages();
    turnThinkingBusy = true;
    turnThinkingRows = [];
    turnToolChips = [];
    turnPlanRows = [];
    turnPlanVisible = false;
    turnFollowUpsVisible = false;
    turnComposerValue = '';
    turnFollowUpCounter = 0;

    turnTimers.push(
      setTimeout(() => {
        turnThinkingRows = TURN_TRACE_ROWS.slice(0, 2);
      }, 700)
    );
    turnTimers.push(
      setTimeout(() => {
        turnThinkingRows = TURN_TRACE_ROWS;
      }, 1300)
    );
    turnTimers.push(
      setTimeout(() => {
        turnThinkingBusy = false;
      }, 1900)
    );
  };

  onMount(() => {
    replayTurn();
    return () => turnTimers.forEach(clearTimeout);
  });
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>Chat</h1>
</div>

<div class="expand-control">
  <Button
    text={expanded ? 'Collapse panel' : 'Expand panel'}
    onclick={() => (expanded = !expanded)}
  />
</div>

<div class="chat-stage">
  <Resizable
    bind:width={() => liveWidth, setLiveWidth}
    bind:height={() => liveHeight, setLiveHeight}
    minWidth={340}
    maxWidth={640}
    minHeight={420}
    maxHeight={760}
    handles={['right', 'bottom', 'bottom-right']}
    classes="chat-theme chat-card"
  >
    <Chat
      messages={chat.messages}
      bind:value
      bind:attachments
      image="https://picsum.photos/64?random=7"
      title="Shopping Assistant"
      subtitle="Online"
      placeholder="Ask anything…"
      streaming={chat.isStreaming}
      {recording}
      toolStatus={chat.toolStatus}
      suggestions={['Recommend a gift', 'Track my order', 'Return policy?']}
      accept="image/*"
      multiple
      allowCopy
      onsend={(text) => chat.send(text)}
      onstop={() => chat.stop()}
      onretry={() => chat.retry()}
      onvoice={() => (recording = !recording)}
      onattach={() => {}}
      onfeedback={() => {}}
      onclose={() => {}}
    >
      {#snippet headerContent()}
        <div class="header-note">Powered by your own transport — fully decoupled</div>
      {/snippet}

      {#snippet messageAttachments(msg)}
        {@const options = optionsOf(msg.attachments ?? [])}
        {#if options.length > 0}
          <div class="message-options">
            {#each options as option (option.label)}
              <Button text={option.label} onclick={() => chat.send(option.label)} />
            {/each}
          </div>
        {/if}
      {/snippet}
    </Chat>
  </Resizable>
</div>

<p class="demo-note">
  Drag the right / bottom edge or corner to resize, or use the button above to expand the panel with
  an animated scale-up. {liveWidth} × {liveHeight}
</p>

<h2>Empty state — the empty snippet fills the blank transcript</h2>
<div class="chat-theme chat-card empty-frame">
  <Chat
    messages={[]}
    value=""
    title="Shopping Assistant"
    placeholder="Ask anything…"
    onsend={() => {}}
  >
    {#snippet empty()}
      <div class="empty-note">
        <p><strong>No messages yet.</strong></p>
        <p>Ask about an order, a product, or returns — or pick a suggestion below.</p>
      </div>
    {/snippet}
  </Chat>
</div>

<h2>Full agent turn — thinking trace, tool calls, and a work plan land in the transcript</h2>
<p class="demo-note">
  Composed entirely from existing pieces, none of it built into <code>Chat</code>:
  <code>ThinkingIndicator</code>'s own busy machine drives the search trace and settles into a
  collapsed row on its own timer, <code>ToolCallLog</code> records the tools that produced the
  reply, and a <code>TaskList</code> work plan appears once the turn is done. Follow-up
  <code>ChatSuggestions</code> then take their real spot — above the composer, not floating alone.
</p>
<div class="turn-controls">
  <Button text="Replay" onclick={replayTurn} testId="chat-turn-replay" />
</div>
<div class="chat-theme chat-card turn-frame">
  <ChatMessageList messages={turnMessages} testId="chat-turn-list">
    {#snippet message(msg)}
      {#if msg.id === TURN_ASSISTANT_ID}
        <div class="assistant-turn" data-pw="chat-turn-assistant-turn">
          <ThinkingIndicator
            label={turnThinkingLabel}
            kind="search"
            rows={turnThinkingRows}
            busy={turnThinkingBusy}
            query={TURN_QUERY}
            moreLabel="+{TURN_TRACE_ROWS.length} more"
            onsettled={handleTraceSettled}
            testId="chat-turn-trace"
          />
          <ChatMessage
            role={msg.role}
            content={msg.content}
            streaming={msg.streaming}
            testId="chat-turn-assistant-message"
          />
          {#if turnToolChips.length > 0}
            <ToolCallLog chips={turnToolChips} testId="chat-turn-tools" />
          {/if}
          {#if turnPlanVisible}
            <div class="plan-host">
              <p class="plan-label">Work plan</p>
              <TaskList rows={turnPlanRows} testId="chat-turn-plan" />
            </div>
          {/if}
        </div>
      {:else}
        <ChatMessage role={msg.role} content={msg.content} testId="chat-turn-message-{msg.id}" />
      {/if}
    {/snippet}
  </ChatMessageList>
  <div class="turn-footer">
    {#if turnFollowUpsVisible}
      <ChatSuggestions
        items={FOLLOW_UP_SUGGESTIONS}
        onselect={handleFollowUpSelect}
        testId="chat-turn-suggestions"
      />
    {/if}
    <ChatComposer
      bind:value={turnComposerValue}
      placeholder="Ask a follow-up…"
      onsubmit={handleTurnComposerSubmit}
      testId="chat-turn-composer"
    />
  </div>
</div>

<h2>Tool-status theming — backward compatible with the deprecated ChatToolStatus</h2>
<p class="demo-note">
  The built-in tool-status row is <code>ThinkingIndicator</code>'s <code>chip</code> variant
  internally now, not the deprecated <code>ChatToolStatus</code> component — but every
  <code>--chat-tool-status-*</code> variable still themes it (mapped onto the chip's own
  <code>--thinking-indicator-chip-*</code> variables), so an existing consumer's overrides keep
  working unchanged. The instance below overrides <code>--chat-tool-status-background</code>,
  <code>--chat-tool-status-color</code>, and <code>--chat-tool-status-border</code> the same way a pre-existing
  consumer already would; if the mapping works, the pill picks them up.
</p>
<div class="demo-row backcompat-demo" data-pw="chat-backcompat-demo">
  <Chat
    messages={[]}
    toolStatus={{ label: 'Verifying backward-compatible theming…' }}
    title="Backward-compat check"
    classes="backcompat-chat"
  />
</div>

<style>
  /* Deliberately overrides the OLD --chat-tool-status-* names, the same way a
     pre-existing consumer's theme CSS already would -- proves Chat's internal
     switch to ThinkingIndicator's chip variant stayed a backward-compatible
     drop-in rather than silently orphaning these variables. */
  .backcompat-demo {
    height: 260px;
    --chat-tool-status-background: rgb(20, 30, 200);
    --chat-tool-status-color: rgb(255, 255, 255);
    --chat-tool-status-border: 2px solid rgb(255, 200, 0);
  }

  .backcompat-demo :global(.backcompat-chat) {
    height: 100%;
    width: 100%;
  }

  /* Cascades into the child Resizable, which animates width/height on expand
     (and disables it while drag-resizing / under reduced motion). */
  .chat-stage {
    --resizable-transition:
      width 0.32s cubic-bezier(0.22, 1, 0.36, 1), height 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* Theme the reused Button to match the site's controls (vars inherit into it). */
  .expand-control {
    margin-bottom: 16px;
    --button-color: var(--doc-btn-bg);
    --button-text-color: var(--doc-text-primary);
    --button-hover-color: var(--doc-btn-hover-bg);
    --button-hover-text-color: var(--doc-text-primary);
    --button-border: 1px solid var(--doc-btn-border);
    --button-hover-border: 1px solid var(--doc-btn-border);
    --button-padding: 8px 16px;
    --button-font-size: 14px;
    --button-border-radius: var(--doc-radius);
  }

  .message-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    --button-color: transparent;
    --button-text-color: var(--doc-text-primary, #18181b);
    --button-hover-color: var(--doc-btn-hover-bg, #f4f4f5);
    --button-border: 1px solid var(--doc-btn-border, #e4e4e7);
    --button-hover-border: 1px solid var(--doc-btn-border, #e4e4e7);
    --button-padding: 5px 12px;
    --button-font-size: 12px;
    --button-border-radius: 999px;
  }

  .header-note {
    font-size: 11px;
    color: var(--doc-text-muted, #71717a);
    background: var(--doc-accent-bg, #eef2ff);
    border-radius: 999px;
    padding: 3px 10px;
    width: fit-content;
  }

  .empty-frame {
    max-width: 480px;
    height: 360px;
  }

  .empty-note {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--doc-text-secondary);
  }

  .turn-controls {
    margin: 0 0 14px;
  }

  .turn-frame {
    display: flex;
    flex-direction: column;
    height: 640px;
    max-width: 560px;
    background: var(--doc-demo-bg);
  }

  .assistant-turn {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-self: flex-start;
    max-width: 100%;
    --chat-message-max-width: 100%;
  }

  .plan-host {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--doc-input-bg);
    box-shadow: 0 0 0 1px var(--doc-border);
  }

  .plan-label {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--doc-text-muted);
  }

  .turn-footer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid var(--doc-border);
  }
</style>
