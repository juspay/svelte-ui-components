<script lang="ts">
  import HITL from '$lib/HITL/HITL.svelte';
  import type { HITLEvent } from '$lib/HITL/properties';

  let lastEvent = $state<HITLEvent | null>(null);
  let liveKey = $state(0);

  const record = (event: HITLEvent): void => {
    lastEvent = event;
  };

  // Simulated voice-session mic for the mic-integration variety below.
  let micMuted = $state(true);
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>HITL</h1>
</div>

<h2>Live — 10s countdown auto-approves, interacting pauses siblings</h2>
<div class="demo-row">
  <button
    class="toggle-btn"
    onclick={() => {
      liveKey += 1;
      lastEvent = null;
    }}>Reset card</button
  >
  {#key liveKey}
    <HITL
      confirmationId="demo-live"
      title="Create discount"
      description="The assistant wants to run this action."
      functionArguments={{
        discountName: 'Festive 10',
        discountPercent: 10,
        appliesTo: '*',
        channels: ['online store', 'POS'],
        stackable: false
      }}
      onConfirm={record}
      testId="demo-confirmation"
    />
  {/key}
  <p class="state-display">Last event: {lastEvent ? JSON.stringify(lastEvent) : '—'}</p>
</div>

<h2>Explicit sections, no countdown, 90s auto-cancel</h2>
<div class="demo-row">
  <HITL
    confirmationId="demo-sections"
    title="Meta Ads audit report"
    countdownSeconds={0}
    autoCancelSeconds={90}
    sections={[
      { label: 'ACCOUNT', value: 'Acme Store' },
      { label: 'PLATFORM', value: 'Meta Ads (Facebook + Instagram)' },
      { label: 'TIME', value: 'Jul 1 - Jul 31, 2026' }
    ]}
    onConfirm={() => {}}
  />
</div>

<h2>History — approved</h2>
<div class="demo-row">
  <HITL
    confirmationId="demo-history-approved"
    title="Send campaign"
    isHistoryMode={true}
    initialState={{ approved: true }}
  />
</div>

<h2>History — rejected and expired</h2>
<div class="demo-row">
  <HITL
    confirmationId="demo-history-rejected"
    title="Delete products"
    isHistoryMode={true}
    initialState={{ approved: false }}
  />
  <HITL
    confirmationId="demo-history-expired"
    title="Refund order"
    isHistoryMode={true}
    initialState={{ status: 'EXPIRED' }}
  />
</div>

<h2>Manual only — no timers, custom labels and badge</h2>
<div class="demo-row">
  <HITL
    confirmationId="demo-manual"
    title="Publish storefront banner"
    description="Nothing happens until you decide — no countdown, no auto-cancel."
    countdownSeconds={0}
    badgeLabel="Needs your call"
    confirmLabel="Publish now"
    cancelLabel="Not yet"
    sections={[
      { label: 'BANNER', value: 'Monsoon sale — 20% off sitewide' },
      { label: 'PLACEMENT', value: 'Home page hero' }
    ]}
    onConfirm={record}
  />
</div>

<h2>Generic arguments with hiddenKeys — secrets never render</h2>
<div class="demo-row">
  <HITL
    confirmationId="demo-hidden"
    title="Connect analytics account"
    countdownSeconds={0}
    functionArguments={{
      account: 'acme-analytics',
      region: 'ap-south-1',
      apiKey: 'sk-live-abcdef123456',
      refreshToken: 'rt-987654'
    }}
    hiddenKeys={['apiKey', 'refreshToken']}
    onConfirm={record}
  />
</div>

<h2>Voice flow — mic muted while the card is open</h2>
<p class="demo-note">
  Simulated mic state: <strong>{micMuted ? 'muted' : 'live'}</strong>. HITL only reports mic state
  through <code>isMicMuted</code>/<code>onMicToggle</code> — it renders no toggle affordance of its own,
  so this page supplies one below. The card still auto-mutes on open and restores the mic on a decision,
  via the same handler.
</p>
<div class="demo-row">
  <button class="toggle-btn" onclick={() => (micMuted = !micMuted)}>
    {micMuted ? 'Unmute mic' : 'Mute mic'}
  </button>
  <HITL
    confirmationId="demo-mic"
    title="Start voice checkout"
    countdownSeconds={0}
    isMicMuted={micMuted}
    onMicToggle={() => {
      micMuted = !micMuted;
    }}
    onConfirm={(event) => {
      record(event);
      micMuted = false;
    }}
  />
</div>

<style>
  /* Button's secondary variant hardcodes its resting text ink (#3a4550,
     near-black) with no dark counterpart. HITL's Cancel button uses that
     variant, so on the dark hitl-background card surface its label nearly
     disappears. HITL has no prop to theme just the cancel action, so this
     reaches its internal wrapper div (stable across every HITL instance on
     this page) rather than the button's own class. The Confirm button is
     untouched — it never adopts this override, so its own dark-bg/white-text
     pairing keeps working in both themes. */
  :global(.hitl .cancel-button) {
    --button-text-color: var(--doc-text-primary);
  }
</style>
