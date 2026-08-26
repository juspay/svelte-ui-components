# SoundKit

A synthesized UI sound engine — five short Web Audio recipes (`press`, `tick`, `release`,
`page`, `pulse`) built from oscillators, noise buffers, and filters, so there are no audio
files to ship or load. It is a plain TypeScript module, not a component: `createSoundKit()`
returns a small object of functions, and the AudioContext it needs is created lazily on the
first `play()` call — nothing touches `window`, `document`, or `localStorage` at import time
or at `createSoundKit()` time, so it is safe to call during SSR.

Sound is opt-in: the enabled flag defaults to `false` and is persisted to `localStorage`, so a
listener's choice survives reloads without ever making noise on a first, silent visit.
`attachClicks` can also auto-map ordinary clicks to sounds by listening on a scoped root —
checkbox/switch/radio/tab semantics tick, links page-turn, buttons press — with a per-element
`data-sound` attribute available to override or silence the guess.

## Usage

```ts
import { createSoundKit } from '@juspay/svelte-ui-components';

const soundKit = createSoundKit();

// Wire semantic click-to-sound mapping across (part of) the page.
soundKit.attachClicks();

// Let the listener turn sound on — this is the only thing that starts the AudioContext.
soundKit.setEnabled(true);

// Play a specific recipe directly, e.g. on a custom event a plain click can't see.
soundKit.play('release');

// Tear down when the owning view unmounts.
soundKit.dispose();
```

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { createSoundKit } from '@juspay/svelte-ui-components';
  import type { SoundKit } from '@juspay/svelte-ui-components';

  let soundKit: SoundKit | null = null;

  onMount(() => {
    const kit = createSoundKit();
    soundKit = kit;
    kit.attachClicks();
    return () => kit.dispose();
  });
</script>
```

## `SoundKitOptions`

| Option       | Type     | Default               | Description                                            |
| ------------ | -------- | --------------------- | ------------------------------------------------------ |
| `storageKey` | `string` | `'sui-sound-enabled'` | localStorage key the enabled flag is persisted under.  |
| `masterGain` | `number` | `0.32`                | Gain on the shared master bus, before the destination. |

## `SoundKit`

The object `createSoundKit(options?)` returns.

| Member         | Type                                       | Description                                                                                     |
| -------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `play`         | `(name: SoundName) => void`                | Plays one recipe. A no-op while disabled, during SSR, or if Web Audio is unavailable.           |
| `attachClicks` | `(root?: Document \| HTMLElement) => void` | Installs one capture-phase click listener on `root` (default `document`). Re-scopes on re-call. |
| `detachClicks` | `() => void`                               | Removes the listener installed by `attachClicks`, if any.                                       |
| `setEnabled`   | `(enabled: boolean) => void`               | Sets the enabled flag and persists it.                                                          |
| `isEnabled`    | `() => boolean`                            | Reads the enabled flag, resolving it from storage on first call.                                |
| `toggle`       | `() => boolean`                            | Flips the enabled flag, persists it, and returns the new value.                                 |
| `dispose`      | `() => void`                               | `detachClicks` plus closes the AudioContext, if one was ever created.                           |

### `SoundName`

`'press' | 'tick' | 'release' | 'page' | 'pulse'`

| Name      | Recipe                                                        | ~Duration |
| --------- | ------------------------------------------------------------- | --------- |
| `press`   | Highpassed noise crack layered under a 680Hz sine body.       | 30ms      |
| `tick`    | A 2100Hz square oscillator through a narrow 2600Hz bandpass.  | 12ms      |
| `release` | A soft 1600Hz-lowpassed noise puff — the un-press.            | 30ms      |
| `page`    | A 430→640Hz sine frequency sweep with a gentle gain envelope. | 120ms     |
| `pulse`   | A 2200Hz-lowpassed 330Hz sine thump.                          | 80ms      |

## Semantic click mapping

`attachClicks` installs a single capture-phase `click` listener. For each click it walks up
from the target with `closest()` in this order:

| Priority | Match                                                                                                   | Sound    |
| -------- | ------------------------------------------------------------------------------------------------------- | -------- |
| 1        | Nearest ancestor carrying `data-sound` (see the override table below)                                   | —        |
| 2        | `input[type="checkbox"]`, `input[type="radio"]`, `[role="switch"]`, `[role="checkbox"]`, `[role="tab"]` | `tick`   |
| 3        | `<a>`                                                                                                   | `page`   |
| 4        | `<button>`, `[role="button"]`, `<summary>`                                                              | `press`  |
| —        | Nothing matched                                                                                         | (silent) |

`release` and `pulse` are never inferred from a click — call `soundKit.play('release')` /
`soundKit.play('pulse')` directly for state transitions a click alone can't describe (a sheet
closing, a status heartbeat).

### `data-sound` override

| Value                                                     | Effect                                                    |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `"press"` / `"tick"` / `"release"` / `"page"` / `"pulse"` | Forces that recipe regardless of the element's semantics. |
| `"off"`                                                   | Silences the element outright — the click plays nothing.  |

`data-sound` is read from the nearest ancestor of the click target, so it can be set on a
wrapper around several plain children rather than on every interactive element individually.

## CSS Variables

None — SoundKit is audio-only and renders no DOM of its own.

## Web component

None — SoundKit is a plain TypeScript module export (`createSoundKit`), not a component, so
there is no custom element wrapper.

## Accessibility

SoundKit never plays on its own: the enabled flag defaults to `false`, `play()` no-ops while
disabled, and nothing runs at import or `createSoundKit()` time — every sound is the direct
result of a call made after a user gesture (a click through `attachClicks`, or an explicit
`play()` from a host event handler), so it never behaves like autoplaying media. It carries no
visual state and makes no accessibility-tree changes of its own; the elements `attachClicks`
listens on keep whatever roles, `aria-*` attributes, and focus behavior they already have.
