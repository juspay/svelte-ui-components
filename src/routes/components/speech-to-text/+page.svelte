<script lang="ts">
  import { onDestroy } from 'svelte';
  import ChatComposer from '$lib/ChatComposer/ChatComposer.svelte';
  import { SpeechToTextController } from '$lib/SpeechToText/controller.svelte';
  import type {
    SpeechRecognitionErrorEvent,
    SpeechRecognitionResultEvent
  } from '$lib/SpeechToText/types';

  // A deterministic stand-in for the browser API so the demo (and any headless
  // environment) exercises the full lifecycle without a microphone or network.
  class SimulatedRecognition {
    continuous = false;
    interimResults = true;
    lang = 'en-US';
    onstart: () => void = () => {};
    onresult: (event: SpeechRecognitionResultEvent) => void = () => {};
    onerror: (event: SpeechRecognitionErrorEvent) => void = () => {};
    onend: () => void = () => {};
    private timers: ReturnType<typeof setTimeout>[] = [];

    start(): void {
      const emit = (delay: number, transcript: string, isFinal: boolean): void => {
        this.timers.push(
          setTimeout(() => {
            this.onresult({ resultIndex: 0, results: [{ 0: { transcript }, isFinal }] });
          }, delay)
        );
      };
      this.timers.push(setTimeout(() => this.onstart(), 100));
      emit(500, 'show me', false);
      emit(1000, 'show me refund', false);
      emit(1600, 'show me refund trends for last month', true);
      this.timers.push(
        setTimeout(() => {
          this.onend();
        }, 2100)
      );
    }

    stop(): void {
      this.clearTimers();
      this.onend();
    }

    abort(): void {
      this.clearTimers();
    }

    private clearTimers(): void {
      for (const timer of this.timers) {
        clearTimeout(timer);
      }
      this.timers = [];
    }
  }

  let committed = $state('');
  const simulated = new SpeechToTextController({
    getRecognitionConstructor: () => SimulatedRecognition,
    seedTranscript: () => committed,
    onTranscript: (transcript) => {
      committed = transcript;
    },
    onListeningChange: (listening) => {
      if (!listening && simulated.interimText.length > committed.length) {
        committed = simulated.interimText;
      }
    }
  });
  let simulatedValue = $derived(simulated.listening ? simulated.interimText : committed);

  let browserCommitted = $state('');
  const browserEngine = new SpeechToTextController({
    seedTranscript: () => browserCommitted,
    onTranscript: (transcript) => {
      browserCommitted = transcript;
    }
  });
  let browserValue = $derived(
    browserEngine.listening ? browserEngine.interimText : browserCommitted
  );

  // A host permission bridge that always denies: the first tap consumes the single
  // proactive request, the second shows the remembered-denial message.
  const denied = new SpeechToTextController({
    getRecognitionConstructor: () => SimulatedRecognition,
    requestPermission: () =>
      Promise.resolve({ granted: false, error: 'Microphone permission denied by the host shell.' })
  });

  onDestroy(() => {
    simulated.destroy();
    browserEngine.destroy();
    denied.destroy();
  });
</script>

<div class="page-header">
  <span class="category-badge">Chat</span>
  <h1>SpeechToText</h1>
</div>

<p>
  Headless controller for the browser's SpeechRecognition API: support detection, a one-shot host
  permission hook, start-with-retry, interim/final transcript assembly, and a self-hiding error
  toast. It renders nothing — pair it with ChatComposer's voice control.
</p>

<h2>Simulated engine — works everywhere</h2>
<div class="demo-row">
  <div class="composer-host">
    <ChatComposer
      bind:value={simulatedValue}
      placeholder="Tap the mic — a scripted transcript streams in"
      recording={simulated.listening}
      oninput={(value) => {
        committed = value;
      }}
      onvoice={() => simulated.toggle()}
      onsubmit={() => {
        committed = '';
      }}
    />
    <p class="state-line">
      listening: <code>{simulated.listening}</code> · interim:
      <code>{simulated.interimText || '—'}</code>
    </p>
  </div>
</div>

<h2>Browser engine</h2>
<div class="demo-row">
  <div class="composer-host">
    <ChatComposer
      bind:value={browserValue}
      placeholder="Uses the real microphone where the browser supports it"
      recording={browserEngine.listening}
      oninput={(value) => {
        browserCommitted = value;
      }}
      onvoice={() => browserEngine.toggle()}
      onsubmit={() => {
        browserCommitted = '';
      }}
    />
    {#if browserEngine.errorVisible}
      <p class="state-line error" role="alert">{browserEngine.errorMessage}</p>
    {/if}
  </div>
</div>

<h2>Host permission bridge — denial is remembered</h2>
<div class="demo-row">
  <div class="composer-host">
    <ChatComposer
      value=""
      placeholder="First tap asks the host once; the second reports the remembered denial"
      recording={denied.listening}
      onvoice={() => denied.toggle()}
    />
    {#if denied.errorVisible}
      <p class="state-line error" role="alert">{denied.errorMessage}</p>
    {/if}
  </div>
</div>

<style>
  .composer-host {
    width: min(36rem, 100%);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .state-line {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.75;
  }

  .state-line.error {
    color: #dc2626;
    opacity: 1;
  }
</style>
