<script lang="ts">
  import { onMount } from 'svelte';
  import HITL from '$lib/HITL/HITL.svelte';
  import type { HITLEvent } from '$lib/HITL/properties';

  const query = new URLSearchParams(window.location.search);
  const initialSeconds = Number(query.get('seconds') ?? 30);
  let seconds = $state(initialSeconds);
  const offset = Number(query.get('offset') ?? initialSeconds * 1000);
  const history = query.get('history') === 'true';
  const relative = query.get('relative') === 'true';
  let disabled = $state(query.get('disabled') === 'true');
  let mounted = $state(true);
  let expiry = $state<number | null>(null);
  let events = $state<HITLEvent[]>([]);
  let title = $state('Confirm the fixture action');
  const micMode = query.get('mic');
  let micMuted = $state(false);
  let micToggles = $state(0);
  let initialMutePending = $state(false);
  let releaseInitialMute = $state<(() => void) | null>(null);
  const toggleMic = async (): Promise<void> => {
    micToggles += 1;
    if (micToggles === 1) {
      initialMutePending = true;
      await new Promise<void>((resolve) => {
        releaseInitialMute = resolve;
      });
      initialMutePending = false;
      if (micMode === 'reject') {
        throw new Error('Fixture initial mute failed');
      }
    }
    micMuted = !micMuted;
  };
  onMount(() => {
    expiry = Date.now() + offset;
    document.documentElement.dataset.hydrated = 'true';
  });
</script>

<h1>HITL server deadline</h1>
<button data-pw="toggle-disabled" onclick={() => (disabled = !disabled)}>Toggle disabled</button>
<button data-pw="unmount" onclick={() => (mounted = false)}>Unmount card</button>
<button data-pw="release-mic" onclick={() => releaseInitialMute?.()}>Finish initial mute</button>
<button data-pw="extend-deadline" onclick={() => (expiry = Date.now() + 20_000)}>
  Extend deadline
</button>
<button data-pw="shorten-deadline" onclick={() => (expiry = Date.now() + 2000)}>
  Shorten deadline
</button>
<button data-pw="clear-deadline" onclick={() => (expiry = Number.NaN)}>Clear deadline</button>
<button data-pw="disable-countdown" onclick={() => (seconds = 0)}>Disable countdown</button>
<button
  data-pw="rerender"
  onclick={() => {
    title += ' updated';
    seconds = 90;
  }}>Update presentation and duration</button
>
{#if expiry !== null && mounted}
  <HITL
    confirmationId="deadline-fixture"
    {title}
    countdownSeconds={seconds}
    {...relative ? {} : { expiresAt: expiry }}
    confirmDisabled={disabled}
    isMicMuted={micMuted}
    onmictoggle={micMode === null ? null : toggleMic}
    isHistoryMode={history}
    actions={[{ label: 'Pause for instructions', onSelect: () => {} }]}
    onconfirm={(event) => {
      events = [...events, event];
    }}
    testId="deadline-card"
  />
{/if}
<p data-pw="deadline-events">{events.length}:{events.at(-1)?.action ?? 'none'}</p>
<p data-pw="mic-state">{micMuted ? 'muted' : 'unmuted'}:{micToggles}</p>
<p data-pw="mic-pending">{initialMutePending ? 'pending' : 'done'}</p>
