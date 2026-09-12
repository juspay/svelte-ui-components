# SpeechSynthesis

Headless text-to-speech controller over the browser's `speechSynthesis` API — the symmetric counterpart to `SpeechToTextController`. It owns voice enumeration (including the async `voiceschanged` population), `speak()`/`stop()` with rate/pitch/volume/voice control, toggle-to-stop orchestration, and a self-hiding error toast. It renders nothing: pair it with a "read aloud" button of your own.

## Usage

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { SpeechSynthesisController } from '@juspay/svelte-ui-components';

  const tts = new SpeechSynthesisController({ lang: 'en-US' });

  // Without this the error-toast timer outlives the component.
  onDestroy(() => tts.destroy());
</script>

<button onclick={() => tts.speak('Here is the summary.')}>
  {tts.speaking ? 'Stop' : 'Read aloud'}
</button>
{#if tts.errorVisible}
  <p role="alert">{tts.errorMessage}</p>
{/if}
```

Call `initialize()` eagerly (e.g. in `onMount`) when you want support/voice detection before the first tap; otherwise `speak()` initializes lazily. Call `destroy()` on teardown.

## Reactive fields

| Field          | Type                              | Description                                                                  |
| -------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| `speaking`     | `boolean`                         | True between the confirmed start and end of an utterance.                    |
| `voices`       | `readonly SpeechSynthesisVoice[]` | Often empty until the platform's `voiceschanged` fires — see `initialize()`. |
| `errorMessage` | `string`                          | The current user-facing error.                                               |
| `errorVisible` | `boolean`                         | Toast visibility; auto-clears after `errorTimeoutMs` (default 4000ms).       |
| `supported`    | `boolean`                         | Whether a synthesis engine was found (set by `initialize`).                  |

## Methods

| Method                  | Description                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize()`          | Detects the API and starts tracking voices. Safe to call again.                                                                                  |
| `speak(text, options?)` | Speaks `text`. Calling this while already speaking stops instead of starting a new utterance — the same toggle-to-stop behavior as a mic button. |
| `stop()`                | Stops speaking and notifies.                                                                                                                     |
| `destroy()`             | Clears the toast timer and tears down the engine connection.                                                                                     |

## Options

| Option               | Type                                                                                      | Default                               | Description                                                                                                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lang`               | `string`                                                                                  | `''`                                  | Utterance language; overridable per `speak()` call.                                                                                                                                                                                                                                             |
| `rate`               | `number`                                                                                  | `1`                                   | Utterance rate; overridable per `speak()` call. Clamped to the Web Speech spec range `0.1`-`10`; a non-finite value falls back to `1`.                                                                                                                                                          |
| `pitch`              | `number`                                                                                  | `1`                                   | Utterance pitch; overridable per `speak()` call. Clamped to `0`-`2`; a non-finite value falls back to `1`.                                                                                                                                                                                      |
| `volume`             | `number`                                                                                  | `1`                                   | Utterance volume; overridable per `speak()` call. Clamped to `0`-`1`; a non-finite value falls back to `1`.                                                                                                                                                                                     |
| `selectVoice`        | `(voices: readonly SpeechSynthesisVoice[], lang: string) => SpeechSynthesisVoice \| null` | platform default among `lang` matches | Picks the voice for an utterance when neither the call nor the controller names one. There is no baked-in preferred-voice name list — supply your own hook if you need one. A throwing hook is reported via `onDiagnostic` and falls back to the built-in default instead of failing `speak()`. |
| `errorTimeoutMs`     | `number`                                                                                  | `4000`                                | Toast auto-hide delay. Floored at `0`; a non-finite value falls back to the default.                                                                                                                                                                                                            |
| `errorMessages`      | `Record<string, string>`                                                                  | built-in map                          | Per-synthesis-error-code copy, merged over the defaults (`not-allowed`, `network`, `synthesis-failed`, …).                                                                                                                                                                                      |
| `messages`           | `Partial<SpeechSynthesisMessages>`                                                        | built-in copy                         | Overrides for the non-code messages (`unsupported`, `fallback`).                                                                                                                                                                                                                                |
| `getSynthesisEngine` | `() => SpeechSynthesisEngineLike \| null`                                                 | reads `window`                        | Injectable engine source — the seam for tests, demos, and non-browser hosts.                                                                                                                                                                                                                    |
| `onSpeakingChange`   | `(speaking: boolean) => void`                                                             | `-`                                   | Fires on notified start/stop.                                                                                                                                                                                                                                                                   |
| `onError`            | `(message: string, code: string \| null) => void`                                         | `-`                                   | Fires whenever the toast is shown; `code` is the synthesis error code when there is one.                                                                                                                                                                                                        |
| `onDiagnostic`       | `(event: string, detail: Record<string, string \| number \| boolean \| null>) => void`    | `-`                                   | Non-fatal internals worth logging; wire to your telemetry.                                                                                                                                                                                                                                      |

## Notes

- The controller is UI-free by design: hosts keep their own toast markup and read-aloud button.
- `SpeechSynthesisEngineLike` (exported) is the reduced API surface the controller drives — implement it to fake the engine in tests. It takes a plain data request plus a callback bag rather than a live `SpeechSynthesisUtterance`, since the real utterance extends `EventTarget` and would otherwise force every fake to also implement `addEventListener`/`removeEventListener`/`dispatchEvent`.
- Voices are commonly empty on the very first call and populate asynchronously once the platform fires `voiceschanged`; `initialize()` wires that subscription for the lifetime of the controller, not just once. Against the real `speechSynthesis` singleton this is wired with `addEventListener`, so it is additive — one controller's subscription never overwrites another's.
- Each controller instance owns its own engine reference, voice list, and speaking state — nothing is shared at module scope, so multiple controllers on the same page never cross-talk.
- The default voice matcher compares the primary language subtag (the part of `lang` before the first `-`, e.g. `fil` in `fil-PH`), case-insensitively — not a fixed two-character prefix, so three-letter subtags (`fil`, `haw`, `yue`) match correctly.
