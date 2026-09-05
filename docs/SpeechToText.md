# SpeechToText

Headless speech-to-text controller over the browser's non-standard `SpeechRecognition` API. It owns the whole lifecycle a mic button needs — support detection, a one-shot host permission hook, start-with-retry, interim/final transcript assembly, and a self-hiding error toast — and exposes reactive fields plus callbacks. It renders nothing: pair it with `ChatComposer`'s voice control (`recording`, `onvoice`), or any UI of your own.

## Usage

```svelte
<script lang="ts">
  import { ChatComposer, SpeechToTextController } from '@juspay/svelte-ui-components';

  let committed = $state('');
  const stt = new SpeechToTextController({
    seedTranscript: () => committed,
    onTranscript: (transcript) => {
      committed = transcript;
    }
  });
  let value = $derived(stt.listening ? stt.interimText : committed);
</script>

<ChatComposer
  bind:value
  recording={stt.listening}
  oninput={(typed) => {
    committed = typed;
  }}
  onvoice={() => stt.toggle()}
/>
{#if stt.errorVisible}
  <p role="alert">{stt.errorMessage}</p>
{/if}
```

Call `initialize()` eagerly (e.g. in `onMount`) when you want support detection before the first tap; otherwise `start()`/`toggle()` initialize lazily. Call `destroy()` on teardown.

## Reactive fields

| Field          | Type      | Description                                                                    |
| -------------- | --------- | ------------------------------------------------------------------------------ |
| `listening`    | `boolean` | True between the notified start and end of a listening session.                |
| `interimText`  | `string`  | Committed transcript plus the current interim guess — what a composer shows while listening. |
| `errorMessage` | `string`  | The current user-facing error.                                                 |
| `errorVisible` | `boolean` | Toast visibility; auto-clears after `errorTimeoutMs` (default 4000ms).         |
| `supported`    | `boolean` | Whether a recognition constructor was found (set by `initialize`).             |

## Methods

| Method         | Description                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `initialize()` | Detects the API and builds a wired instance. Safe to call again to rebuild after a failure.       |
| `start()`      | Starts listening; retries once through a re-init if the underlying `start()` throws.              |
| `stop()`       | Stops listening and notifies.                                                                     |
| `toggle()`     | The mic-button handler: stops when listening, otherwise runs the permission gate and starts.      |
| `destroy()`    | Clears the toast timer and aborts/tears down the recognition instance.                            |

## Options

| Option                      | Type                                                     | Default            | Description                                                                                             |
| --------------------------- | -------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| `lang`                      | `string`                                                 | `'en-US'`          | Recognition language.                                                                                    |
| `continuous`                | `boolean`                                                | `false`            | Keep listening across pauses.                                                                            |
| `interimResults`            | `boolean`                                                | `true`             | Emit interim guesses.                                                                                    |
| `errorTimeoutMs`            | `number`                                                 | `4000`             | Toast auto-hide delay.                                                                                   |
| `errorMessages`             | `Record<string, string>`                                 | built-in map       | Per-recognition-error-code copy, merged over the defaults (`not-allowed`, `no-speech`, `network`, …).    |
| `messages`                  | `Partial<SpeechToTextMessages>`                          | built-in copy      | Overrides for the non-code messages (unsupported, init failure, permission denial, …).                   |
| `getRecognitionConstructor` | `() => SpeechRecognitionConstructor \| null`             | reads `window`     | Injectable constructor source — the seam for tests, demos, and non-browser hosts.                        |
| `requestPermission`         | `() => Promise<SpeechPermissionResult> \| null`          | `-`                | Host permission hook (e.g. a native shell's mic bridge). Return `null` to mean "no bridge here". Asked at most once; a denial is remembered. |
| `seedTranscript`            | `() => string`                                           | `-`                | Text the transcript starts from when listening begins (e.g. the composer's current value).               |
| `onTranscript`              | `(transcript: string) => void`                           | `-`                | Fires with the accumulated transcript each time a final result lands.                                    |
| `onListeningChange`         | `(listening: boolean) => void`                           | `-`                | Fires on notified start/stop.                                                                            |
| `onerror`                   | `(message: string, code: string \| null) => void`        | `-`                | Fires whenever the toast is shown; `code` is the recognition error code when there is one.               |
| `onDiagnostic`              | `(event: string, detail: Record<string, string \| number \| boolean \| null>) => void` | `-` | Non-fatal internals worth logging; wire to your telemetry.                                               |

## Notes

- The controller is UI-free by design: hosts keep their own toast markup, recording ring, and composer wiring.
- `SpeechRecognitionLike` (exported) is the reduced API surface the controller drives — implement it to fake the engine in tests.
- The permission hook models a native-shell bridge: availability is re-checked per attempt (return `null` when absent), the request itself happens at most once, and a resolved denial short-circuits later attempts with `permissionPreviouslyDenied`.
