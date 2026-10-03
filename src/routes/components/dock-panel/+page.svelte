<script lang="ts">
  import { tick } from 'svelte';
  import Button from '$lib/Button/Button.svelte';
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';
  import ChatHeader from '$lib/ChatHeader/ChatHeader.svelte';
  import DockPanel from '$lib/DockPanel/DockPanel.svelte';
  import type { DockPanelState } from '$lib/DockPanel/properties';

  let assistantState: DockPanelState = $state('closed');
  let width = $state(380);
  let reservedWidth = $state(0);
  let draft = $state('');
  let reply = $state('The conversation stays mounted through every panel state.');
  let composer: ChatComposer | null = $state(null);
  let pageClicks = $state(0);
  let stageHeight = $state(540);

  const openDock = async (): Promise<void> => {
    assistantState = 'docked';
    await tick();
    composer?.focus({ preventScroll: true });
  };
  const submit = (text: string): void => {
    reply = `Received: ${text}`;
  };
</script>

<div class="page-header">
  <span class="category-badge">Layout &amp; Containers</span>
  <h1>DockPanel</h1>
</div>
<p class="demo-note">
  A persistent non-modal panel, with a pill composer handing its draft and focus to the dock.
</p>
<div class="demo-row">
  <Button text="Open dock" testId="open-dock" onclick={() => void openDock()} />
  <Button text="Expand panel" testId="expand-dock" onclick={() => (assistantState = 'expanded')} />
  <Button text="Close panel" testId="close-dock" onclick={() => (assistantState = 'closed')} />
  <Button text="Grow container" testId="grow-dock-stage" onclick={() => (stageHeight += 80)} />
</div>
<p data-pw="dock-state">{assistantState}</p>
<p data-pw="dock-reserved">{reservedWidth}</p>
<div class="stage chat-theme" style:height={`${stageHeight}px`} data-pw="dock-stage">
  <div class="example-page" style:margin-right={`${reservedWidth}px`} data-pw="underlying-page">
    <h2>The page stays here</h2>
    <p>This content stays mounted and laid out while the expanded panel covers it.</p>
    <Button text="Use the page" testId="underlying-action" onclick={() => (pageClicks += 1)} />
    <p data-pw="page-clicks">{pageClicks}</p>
  </div>
  <DockPanel
    bind:state={assistantState}
    bind:width
    bind:reservedWidth
    label="Assistant"
    testId="assistant-dock"
  >
    {#snippet header({ expand, collapse, close })}
      <ChatHeader
        title="Assistant"
        expanded={assistantState === 'expanded'}
        onexpandchange={(expanded) => (expanded ? expand() : collapse())}
        onclose={close}
      />
    {/snippet}
    {#snippet body()}
      <div class="conversation" data-pw="persistent-conversation">
        <p data-pw="persistent-reply">{reply}</p>
      </div>
    {/snippet}
    {#snippet footer()}
      {#if assistantState !== 'closed'}
        <ChatComposer
          bind:this={composer}
          bind:value={draft}
          placeholder="Ask AI"
          onsubmit={submit}
          inputTestId="panel-composer"
        />
      {/if}
    {/snippet}
  </DockPanel>
  {#if assistantState === 'closed'}
    <div class="pill" data-pw="assistant-pill">
      <ChatComposer
        variant="pill"
        bind:value={draft}
        placeholder="Ask AI"
        inputTestId="pill-composer"
        onsubmit={(text) => {
          submit(text);
          void openDock();
        }}
      >
        {#snippet trailing()}
          <Button
            text="Open"
            ariaLabel="Open assistant"
            testId="pill-open"
            onclick={() => void openDock()}
          />
        {/snippet}
      </ChatComposer>
    </div>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: var(--doc-demo-bg, #f8f8fa);
    --dock-panel-position: absolute;
    --dock-panel-footer-padding: 12px;
    --dock-panel-body-padding: 16px;
  }

  .example-page {
    box-sizing: border-box;
    padding: 24px;
  }

  .pill {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: min(420px, calc(100% - 32px));
  }

  .conversation {
    min-height: 100%;
  }
</style>
