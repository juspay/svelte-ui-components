<script lang="ts">
  import ThinkingOrb from '$lib/ThinkingOrb/ThinkingOrb.svelte';
  import type { OrbState } from '$lib/ThinkingOrb/properties';

  const STATES: Array<{ state: OrbState; blurb: string }> = [
    { state: 'working', blurb: 'dots trail along six tilted loops around a centre' },
    { state: 'searching', blurb: 'a bright band sweeps around a speckled sphere' },
    { state: 'solving', blurb: 'bands turn out of place in turn, then straighten back' },
    { state: 'listening', blurb: 'a wave of brightness rises through stacked rings' },
    { state: 'connecting', blurb: 'nodes link to their nearest neighbours' },
    { state: 'weaving', blurb: 'three spiral strands swing past each other end to end' },
    { state: 'composing', blurb: 'a soft-edged ribbon ripples like fabric' },
    { state: 'breathing', blurb: 'a ring swells and settles on a slow cycle' },
    { state: 'shaping', blurb: 'a ring reshapes from round to a triangle to a square' }
  ];

  let gravityEnabled = $state(false);

  const STILL_STATES: readonly OrbState[] = ['working', 'connecting', 'shaping'];
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>ThinkingOrb</h1>
</div>
<p>
  A small canvas dot animation for the moment an AI or agent turn is in progress. It plays one of
  nine states, each a distinct piece of motion, so a chat UI can show which phase is actually
  running — searching, connecting, listening, and so on.
</p>

<h2>All nine states</h2>
<label class="demo-toggle">
  <input
    id="thinking-orb-gravity"
    type="checkbox"
    data-pw="thinking-orb-gravity-toggle"
    bind:checked={gravityEnabled}
  />
  Pointer attraction (<code>gravity</code>)
</label>
<div class="orb-grid">
  {#each STATES as { state, blurb } (state)}
    <div class="orb-card">
      <ThinkingOrb {state} size={64} gravity={gravityEnabled} testId="thinking-orb-{state}" />
      <div class="orb-text">
        <span class="orb-title">{state}</span>
        <span class="orb-sub">{blurb}</span>
      </div>
    </div>
  {/each}
</div>

<h2>Paused</h2>
<p>
  <code>paused</code> stops an orb on whatever frame it's showing, though it still redraws that
  frame when the theme changes. These three also set <code>speed={'{0}'}</code>, which holds them at
  the very start of their animation so the same three shapes appear on every load — short trails of
  dots, dots joined by lines, and a ring before it starts to change shape.
</p>
<div class="orb-still">
  {#each STILL_STATES as state (state)}
    <ThinkingOrb {state} size={64} paused speed={0} testId="thinking-orb-still-{state}" />
  {/each}
</div>

<style>
  .demo-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: var(--doc-text-primary);
  }

  .orb-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
  }

  .orb-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
    background: var(--doc-demo-bg);
    border: 1px solid var(--doc-border-light);
  }

  .orb-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .orb-title {
    text-transform: capitalize;
    color: var(--doc-text-primary);
  }

  .orb-sub {
    font-size: 12px;
    color: var(--doc-text-muted);
  }

  .orb-still {
    display: flex;
    gap: 24px;
    padding: 16px;
    border-radius: 8px;
    background: var(--doc-demo-bg);
    border: 1px solid var(--doc-border-light);
  }
</style>
