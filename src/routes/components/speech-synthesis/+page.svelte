<script lang="ts">
  import '../_capability-demo-controls.css';
  import { onMount } from 'svelte';
  import { SpeechSynthesisController } from '$lib';
  import type { SpeechSynthesisEngineLike, SpeechUtteranceCallbacks } from '$lib';

  let nativePending = $state(false);
  const native = new SpeechSynthesisController({
    lang: 'en-US',
    onSpeakingChange: (speaking) => {
      nativePending = false;
      nativeStatus = speaking ? 'Speaking' : 'Finished';
    },
    onError: () => {
      nativePending = false;
      nativeStatus = 'Speech failed';
    }
  });
  let text = $state('Hello. This is the Svelte UI speech example.');
  let voiceIndex = $state('');
  let nativeStatus = $state('Ready');
  let simulationActive = false;
  let callbacks: SpeechUtteranceCallbacks | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const simulatedVoice: SpeechSynthesisVoice = {
    name: 'Example voice',
    lang: 'en-US',
    voiceURI: 'example',
    default: true,
    localService: true
  };
  const engine: SpeechSynthesisEngineLike = {
    get speaking() {
      return simulationActive;
    },
    onvoiceschanged: null,
    getVoices: () => [simulatedVoice],
    speak: (_request, next) => {
      callbacks = next;
      simulationActive = true;
      next.onstart();
      timer = setTimeout(() => {
        simulationActive = false;
        next.onend();
        timer = null;
      }, 1500);
    },
    cancel: () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      simulationActive = false;
      callbacks = null;
    }
  };
  const simulated = new SpeechSynthesisController({ getSynthesisEngine: () => engine });
  const unavailable = new SpeechSynthesisController({ getSynthesisEngine: () => null });

  onMount(() => {
    native.initialize();
    simulated.initialize();
    unavailable.initialize();
    return () => {
      native.destroy();
      simulated.destroy();
      unavailable.destroy();
    };
  });

  function speakNative(): void {
    nativePending = true;
    nativeStatus = 'Speech requested';
    native.speak(text, {
      voice: voiceIndex === '' ? null : (native.voices[Number(voiceIndex)] ?? null)
    });
  }
  function failSimulation(): void {
    simulated.stop();
    simulated.speak('Example speech');
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    simulationActive = false;
    callbacks?.onerror('synthesis-failed');
    callbacks = null;
  }
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>SpeechSynthesis</h1>
</div>

<h2 class="demo-examples-heading">Examples</h2>
<h3>Browser speech</h3>
<p data-pw="speech-support">
  {native.supported
    ? 'Speech API available. Voices and audio output depend on your browser and device.'
    : 'Speech playback is unavailable in this browser.'}
</p>
<label for="speech-text">Text to read</label>
<textarea id="speech-text" bind:value={text} rows="3"></textarea>
<label for="speech-voice">Voice</label>
<select id="speech-voice" bind:value={voiceIndex}>
  <option value="">Browser default</option>
  {#each native.voices as voice, index (`${voice.voiceURI}-${index}`)}<option value={String(index)}
      >{voice.name} ({voice.lang})</option
    >{/each}
</select>
<div class="controls">
  <button
    type="button"
    class="capability-demo-button"
    onclick={speakNative}
    disabled={nativePending || native.speaking || text.trim() === ''}>Read aloud</button
  >
  <button
    type="button"
    class="capability-demo-button"
    onclick={() => {
      native.stop();
      nativePending = false;
      nativeStatus = 'Stopped';
    }}>Stop speech</button
  >
  <button
    type="button"
    class="capability-demo-button"
    onclick={() => native.initialize()}
    disabled={nativePending || native.speaking}>Refresh voices</button
  >
</div>
<p role="status" data-pw="speech-native-status">{native.speaking ? 'Speaking' : nativeStatus}</p>
{#if native.errorVisible}<p role="alert">{native.errorMessage}</p>{/if}

<h3>Simulated speech states</h3>
<p>
  This separate example demonstrates start, finish, stop and error feedback without producing audio.
</p>
<div class="controls">
  <button
    type="button"
    class="capability-demo-button"
    onclick={() => simulated.speak('Example speech')}
    disabled={simulated.speaking}>Start simulated speech</button
  >
  <button type="button" class="capability-demo-button" onclick={() => simulated.stop()}
    >Stop simulated speech</button
  >
  <button type="button" class="capability-demo-button" onclick={failSimulation}
    >Show simulated error</button
  >
  <button
    type="button"
    class="capability-demo-button"
    onclick={() => unavailable.speak('Unavailable')}>Try unavailable speech</button
  >
</div>
<p role="status" data-pw="speech-simulated-status">
  {simulated.speaking ? 'Simulated speech running' : 'Simulated speech stopped'}
</p>
{#if simulated.errorVisible}<p role="alert" data-pw="speech-simulated-error">
    {simulated.errorMessage}
  </p>{/if}
{#if unavailable.errorVisible}<p role="alert" data-pw="speech-unavailable-error">
    {unavailable.errorMessage}
  </p>{/if}

<style>
  label {
    display: block;
    margin-top: 16px;
    margin-bottom: 6px;
  }
  textarea {
    display: block;
    box-sizing: border-box;
    width: 100%;
    max-width: 560px;
    color: var(--doc-text-primary);
    background: var(--doc-demo-bg);
    border: 1px solid var(--doc-border);
    border-radius: 6px;
    padding: 10px;
  }
  select {
    max-width: 100%;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
  }
</style>
