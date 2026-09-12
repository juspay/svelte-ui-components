<script lang="ts">
  import VoiceOrb from '$lib/VoiceOrb/VoiceOrb.svelte';
  import type { VoiceOrbVariant } from '$lib/VoiceOrb/properties';

  import { onDestroy } from 'svelte';

  let variant: VoiceOrbVariant = $state('idle');
  let started = $state(false);

  let audioContext: AudioContext | null = null;
  let toneGain: GainNode | null = null;
  let analyser: AnalyserNode | null = $state(null);
  let source = $state('none');
  let level = $state(0);
  let levelCalls = $state(0);

  const teardownAudio = (): void => {
    analyser = null;
    toneGain = null;
    source = 'none';
    void audioContext?.close();
    audioContext = null;
  };

  /*
   * The orb takes an AnalyserNode and nothing else -- the context, the source
   * and the permission prompt are all the page's business. This is what a
   * consumer writes.
   */
  const startTone = async (): Promise<void> => {
    teardownAudio();
    const context = new AudioContext();
    await context.resume();

    const oscillator = context.createOscillator();
    oscillator.frequency.value = 220;
    const gain = context.createGain();
    gain.gain.value = 0.6;
    const node = context.createAnalyser();
    node.fftSize = 2048;

    /* Routed to the destination through a silent gain: an analyser with no path
       to the destination is not guaranteed to be pulled, and a demo that beeps
       at you is a worse demo. */
    const mute = context.createGain();
    mute.gain.value = 0;

    oscillator.connect(gain).connect(node).connect(mute).connect(context.destination);
    oscillator.start();

    audioContext = context;
    toneGain = gain;
    analyser = node;
    source = 'tone';
    variant = 'listening';
  };

  const setToneLevel = (event: Event): void => {
    const input = event.currentTarget;
    if (toneGain !== null && input instanceof HTMLInputElement) {
      toneGain.gain.value = Number(input.value);
    }
  };

  const startMicrophone = async (): Promise<void> => {
    teardownAudio();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new AudioContext();
    await context.resume();
    const node = context.createAnalyser();
    node.fftSize = 2048;
    context.createMediaStreamSource(stream).connect(node);

    audioContext = context;
    analyser = node;
    source = 'microphone';
    variant = 'listening';
  };

  onDestroy(() => {
    teardownAudio();
  });

  const toggleVariant = (): void => {
    variant = variant === 'idle' ? 'listening' : 'idle';
  };
</script>

<h1>VoiceOrb</h1>
<p>
  An ambient particle sphere for voice and assistant surfaces. Pass an <code>AnalyserNode</code> and it
  reacts to real sound; without one it breathes on a timer.
</p>

<h2>Variants</h2>
<p>
  <code>idle</code> rotates steadily; <code>listening</code> breathes. With no
  <code>analyser</code>, that breathing rides a sine wave.
</p>
<div class="demo-row">
  <button class="orb-btn" data-pw="orb-toggle-variant" onclick={toggleVariant}>
    Switch to {variant === 'idle' ? 'listening' : 'idle'}
  </button>
  <span data-pw="orb-variant">{variant}</span>
  <span data-pw="orb-started">{started ? 'painted' : 'waiting'}</span>
</div>
<div class="demo-row">
  <VoiceOrb
    {variant}
    seed="sui-demo"
    height={320}
    testId="orb-main"
    onfirstframe={() => (started = true)}
  />
</div>

<h2>Seeded placement</h2>
<p>
  The same <code>seed</code> always produces the same orb, so one keyed to a session id looks like the
  same object across navigations. These two share a seed; the third does not.
</p>
<div class="orb-grid">
  <VoiceOrb seed="alpha" height={180} particleCount={400} radius={70} testId="orb-seed-a" />
  <VoiceOrb seed="alpha" height={180} particleCount={400} radius={70} testId="orb-seed-b" />
  <VoiceOrb seed="beta" height={180} particleCount={400} radius={70} testId="orb-seed-c" />
</div>

<h2>Non-interactive</h2>
<p>Set <code>interactive={false}</code> for an orb that ignores the pointer entirely.</p>
<div class="demo-row">
  <VoiceOrb
    seed="ambient"
    height={180}
    particleCount={400}
    radius={70}
    interactive={false}
    testId="orb-ambient"
  />
</div>

<h2>Audio-reactive</h2>
<p>
  Pass an <code>AnalyserNode</code> and <code>listening</code> is driven by the sound itself rather than
  a timer. The orb never opens a microphone: the context, the source and the permission prompt stay with
  the page.
</p>
<div class="demo-row">
  <button class="orb-btn" data-pw="tone-start" onclick={startTone}>Play a silent test tone</button>
  <button class="orb-btn" data-pw="mic-start" onclick={startMicrophone}>Use my microphone</button>
  <button class="orb-btn" data-pw="audio-stop" onclick={teardownAudio}>Stop</button>
  <span data-pw="audio-source">{source}</span>
  <span data-pw="orb-level">{level.toFixed(2)}</span>
  <span data-pw="orb-level-calls">{levelCalls}</span>
</div>
<div class="demo-row">
  <label class="orb-label">
    Tone level
    <input
      type="range"
      min="0"
      max="1"
      step="0.05"
      value="0.6"
      data-pw="tone-level"
      oninput={setToneLevel}
    />
  </label>
</div>
<div class="demo-row">
  <VoiceOrb
    {variant}
    {analyser}
    seed="reactive"
    height={280}
    testId="orb-reactive"
    onlevel={(value) => {
      level = value;
      levelCalls += 1;
    }}
  />
</div>

<h2>Held still</h2>
<p>
  <code>speedMultiplier={0}</code> holds the orb at its seeded position — a muted or paused voice surface,
  and the one arrangement whose pixels are identical on every frame.
</p>
<div class="orb-still">
  <VoiceOrb
    seed="pinned"
    height={220}
    particleCount={600}
    radius={90}
    speedMultiplier={0}
    interactive={false}
    testId="orb-pinned"
  />
</div>

<style>
  .orb-btn {
    padding: 4px 12px;
    /* The demo shell's tokens, not literals: a hardcoded light button renders
       as white-on-white once the theme switcher flips this page to dark. */
    border: 1px solid var(--doc-btn-border);
    border-radius: 4px;
    background: var(--doc-btn-bg);
    color: var(--doc-text-primary);
    cursor: pointer;
    font-size: 13px;
  }
  .orb-btn:hover {
    background: var(--doc-btn-hover-bg);
  }
  .orb-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .orb-still {
    max-width: 320px;
  }
  .orb-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
</style>
