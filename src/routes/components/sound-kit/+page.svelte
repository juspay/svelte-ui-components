<script lang="ts">
  import { onMount } from 'svelte';
  import Toggle from '$lib/Toggle/Toggle.svelte';
  import Button from '$lib/Button/Button.svelte';
  import { createSoundKit } from '$lib/soundKit/soundKit';
  import type { SoundKit, SoundName } from '$lib/soundKit/properties';

  const recipes: { name: SoundName; label: string; description: string }[] = [
    { name: 'press', label: 'Press', description: 'noise crack + 680Hz sine body' },
    { name: 'tick', label: 'Tick', description: 'bandpassed 2100Hz square blip' },
    { name: 'release', label: 'Release', description: 'lowpassed noise puff' },
    { name: 'page', label: 'Page', description: '430→640Hz sine sweep' },
    { name: 'pulse', label: 'Pulse', description: 'lowpassed 330Hz sine thump' }
  ];

  let kit: SoundKit | null = null;
  let enabled = $state(false);
  let switchOn = $state(false);
  let sampleRoot: HTMLDivElement | null = $state(null);

  const playRecipe = (name: SoundName): void => {
    kit?.play(name);
  };

  const handleEnabledToggle = (checked: boolean): void => {
    kit?.setEnabled(checked);
    enabled = kit?.isEnabled() ?? checked;
  };

  const handleSwitchClick = (): void => {
    switchOn = !switchOn;
  };

  onMount(() => {
    // No autoplay — SoundKit only ever makes sound in direct response to a user gesture,
    // so nothing plays here; this just wires the kit up and scopes the click listener.
    const createdKit = createSoundKit();
    kit = createdKit;
    enabled = createdKit.isEnabled();
    if (sampleRoot) {
      createdKit.attachClicks(sampleRoot);
    }
    return () => {
      createdKit.dispose();
    };
  });
</script>

<div class="page-header">
  <span class="category-badge">Utilities</span>
  <h1>SoundKit</h1>
</div>

<p class="intro">
  A synthesized UI sound engine — five short Web Audio recipes with no audio files to ship. Sound is
  opt-in (off until the listener turns it on) and the choice is persisted to
  <code>localStorage</code>, so it stays off for silent visits and stays on once someone chooses it.
  <code>attachClicks</code>
  can also auto-map plain clicks on a scoped root: checkbox/radio/switch/tab semantics tick, links page-turn,
  buttons press — an ancestor carrying <code>data-sound</code> always overrides the guess, and
  <code>data-sound="off"</code>
  silences an element outright.
</p>

<h2>Enable sound</h2>
<div class="demo-row">
  <Toggle
    text="Sound effects"
    checked={enabled}
    onclick={handleEnabledToggle}
    testId="sound-kit-enable-toggle"
  />
  <span class="hint">Off by default; your choice is remembered for next time.</span>
</div>

<h2>Recipes — five short synthesized sounds</h2>
<div class="demo-row">
  <div class="recipe-row">
    {#each recipes as recipe (recipe.name)}
      <div class="recipe">
        <Button
          text={recipe.label}
          onclick={() => playRecipe(recipe.name)}
          testId="sound-kit-play-{recipe.name}"
        />
        <span class="recipe-description">{recipe.description}</span>
      </div>
    {/each}
  </div>
</div>

<h2>Semantic auto-mapping — <code>attachClicks</code> scoped to a wrapper</h2>
<p class="intro">
  These are ordinary controls with no click handlers of their own — the sounds below come entirely
  from <code>attachClicks</code> reading each element's role and tag. The muted chip carries
  <code>data-sound="off"</code>, so the override silences it even though a plain
  <code>&lt;button&gt;</code> would otherwise press.
</p>
<div class="demo-row">
  <div
    class="sample-controls"
    id="sound-kit-demo"
    bind:this={sampleRoot}
    data-pw="sound-kit-samples"
  >
    <label class="sample-control">
      <input type="checkbox" data-pw="sound-kit-sample-checkbox" />
      Checkbox <span class="sample-tag">tick</span>
    </label>
    <label class="sample-control">
      <input type="radio" name="sound-kit-demo-radio" data-pw="sound-kit-sample-radio" />
      Radio <span class="sample-tag">tick</span>
    </label>
    <button
      type="button"
      class="sample-control switch"
      role="switch"
      aria-checked={switchOn}
      onclick={handleSwitchClick}
      data-pw="sound-kit-sample-switch"
    >
      Switch <span class="sample-tag">tick</span>
    </button>
    <a class="sample-control" href="#sound-kit-demo" data-pw="sound-kit-sample-link">
      Link <span class="sample-tag">page</span>
    </a>
    <button type="button" class="sample-control" data-pw="sound-kit-sample-button">
      Button <span class="sample-tag">press</span>
    </button>
    <button
      type="button"
      class="sample-control muted"
      data-sound="off"
      data-pw="sound-kit-sample-muted"
    >
      Muted chip <span class="sample-tag">off</span>
    </button>
  </div>
</div>

<style>
  .intro {
    max-width: 620px;
    color: var(--doc-text-primary);
  }

  .hint {
    font-size: 0.8125rem;
    color: var(--doc-text-muted);
  }

  .recipe-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .recipe {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .recipe-description {
    font-size: 0.75rem;
    color: var(--doc-text-muted);
    text-align: center;
  }

  .sample-controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .sample-control {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    background: var(--doc-btn-bg);
    box-shadow: 0 0 0 1px var(--doc-btn-border);
    font-size: 0.8125rem;
    color: var(--doc-text-primary);
    text-decoration: none;
    border: none;
    cursor: pointer;
  }

  .sample-control.muted {
    opacity: 0.55;
  }

  .sample-tag {
    font-size: 0.6875rem;
    color: var(--doc-text-faint);
    font-family: ui-monospace, Menlo, monospace;
  }
</style>
