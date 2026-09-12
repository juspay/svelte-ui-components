# VoiceOrb

An ambient particle sphere for voice and assistant surfaces. A thousand points on a rotating sphere, drawn to a canvas, with a `listening` state that breathes.

**Reactive if you give it something to react to.** Pass an `AnalyserNode` and `listening` is driven by the sound itself — see **Audio-reactive** below. Without one it breathes on a timer and is purely decorative: it says "the microphone is open", never "this is what it hears".

The orb never opens a microphone itself. Permission, the `AudioContext` and the choice of source stay with the application.

```svelte
<script lang="ts">
  import { VoiceOrb } from '@juspay/svelte-ui-components';

  let listening = $state(false);
</script>

<VoiceOrb variant={listening ? 'listening' : 'idle'} seed={sessionId} />
```

## Props

| Prop              | Type                      | Default  | Description                                                                                  |
| ----------------- | ------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `variant`         | `'idle' \| 'listening'`   | `'idle'` | `idle` rotates steadily; `listening` reacts to `analyser`, or rides a sine wave without one. |
| `speedMultiplier` | `number`                  | `1`      | Multiplies the rotation rate. `0` freezes the orb without unmounting it.                     |
| `seed`            | `string \| number`        | —        | Fixes particle placement. A number and the equivalent numeric string (e.g. `42` and `"42"`) resolve to the same seed; any other string is hashed as text. Omitted, every mount differs. |
| `height`          | `number`                  | `400`    | Rendered height in pixels. Width always fills the container.                                 |
| `particleCount`   | `number`                  | `1000`   | Points on the sphere.                                                                        |
| `radius`          | `number`                  | `140`    | Sphere radius in pixels, before perspective projection.                                      |
| `interactive`     | `boolean`                 | `true`   | Whether pointer movement pushes particles aside.                                             |
| `repelRadius`     | `number`                  | `200`    | How far the pointer repulsion reaches, in pixels.                                            |
| `analyser`        | `AnalyserNode \| null`    | —        | Drives `listening` from real sound. See below. Ignored while `idle`.                         |
| `sensitivity`     | `number`                  | `1`      | Multiplies the measured level. Above `1` for a quiet speaker.                                |
| `persistKey`      | `string`                  | —        | Persists rotation across mounts under this `localStorage` key prefix.                        |
| `classes`         | `string`                  | —        | CSS class string applied to the root.                                                        |
| `testId`          | `string`                  | —        | Value for `data-pw`, for test selectors.                                                     |
| `onfirstframe`    | `() => void`              | —        | Fires once, on the first painted frame.                                                      |
| `onlevel`         | `(level: number) => void` | —        | The smoothed audio level, 0..1, as it changes. See below.                                    |

## Audio-reactive

Pass an `AnalyserNode` and `variant='listening'` is driven by the sound itself — amplitude moves
both the rotation speed and the size of the sphere — instead of breathing on a timer.

**The orb never opens a microphone.** It does not call `getUserMedia`, does not create an
`AudioContext`, and never closes one. Permission prompts, context lifecycle and the choice of source
need application context that a component does not have, and one that grabbed a microphone because
it was mounted would be a worse component. You own the node; the orb reads it.

```svelte
<script lang="ts">
  import { VoiceOrb } from '@juspay/svelte-ui-components';

  let analyser: AnalyserNode | null = $state(null);

  const listen = async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = new AudioContext();
    const node = context.createAnalyser();
    node.fftSize = 2048;
    context.createMediaStreamSource(stream).connect(node);
    analyser = node;
  };
</script>

<button onclick={listen}>Start listening</button>
<VoiceOrb variant={analyser ? 'listening' : 'idle'} {analyser} />
```

Any source works, not just a microphone — an `<audio>` element through
`createMediaElementSource`, or a synthesised tone. The demo page uses an oscillator routed to the
destination through a zero gain, which keeps the graph alive without making a sound.

**What the level does.** The orb measures RMS over one buffer of byte time-domain data, then
smooths it with a fast attack (60ms) and a slower release (320ms) — speech is a burst followed by a
gap, and symmetric smoothing either chatters through every syllable or lags the onset that makes
the orb feel connected to the voice. Silence draws the sphere at 0.82 scale and full level at 1.0;
it never exceeds 1, so a shout cannot clip the sphere against the canvas edge.

`speedMultiplier` still applies on top, so `speedMultiplier={0}` freezes an audio-driven orb the
same way it freezes any other.

**Reading the level yourself.** `onlevel` hands you the same smoothed 0..1 envelope the orb is
drawing with, so a caption, a meter or a mute warning stays in step with the sphere rather than
measuring the analyser a second time and drifting.

```svelte
<VoiceOrb {analyser} variant="listening" onlevel={(level) => (meter = level)} />
```

It is rate-limited by change rather than by time: it fires when the level moves by at least `0.01`,
so silence is silent instead of 60 calls a second, and it fires once more on the way back to `0`
when the audio stops so a meter cannot stick at the last value it saw. In the loud case it is still
a per-frame callback — drive a DOM write or a cheap store from it, not an expensive re-render.

**Degradation is deliberate.** No analyser means `listening` falls back to the sine wave, so a
consumer who does not own an `AudioContext` keeps the animation. Closing the context under a mounted
orb is safe too: the read is guarded and the orb returns to the sine wave rather than freezing —
an exception thrown inside the animation callback would otherwise kill the loop permanently.

## Theming

| Variable                   | Default               | What it sets                   |
| -------------------------- | --------------------- | ------------------------------ |
| `--sui-orb-particle-color` | the inherited `color` | Particle and connector colour. |

**You do not have to set this.** The orb draws in the text colour it inherits, so it is legible on
whatever ground you put it on and follows your theme with no configuration. Set the variable only to
make the orb a different colour from the surrounding text:

```css
.assistant-panel {
  --sui-orb-particle-color: #6d5cff;
}
```

Any CSS colour your canvas accepts works — hex, `rebeccapurple`, `oklch(...)`, `color(display-p3 ...)`
— because the value is normalised by the canvas rather than parsed by this component. A colour syntax
the canvas does not recognise falls through to the inherited colour, and then to a mid-grey, rather
than leaving the orb undrawn.

The colour is re-read each frame, so switching themes recolours an orb that is already running. The
read is cached against the resolved strings, so it re-parses only when the page actually changes.

## `seed` — the same orb twice

Particle placement comes from a seeded PRNG, so a given seed always produces the same sphere:

```svelte
<!-- looks like the same object on every navigation -->
<VoiceOrb seed={user.sessionId} />
```

Without a seed each mount is randomised, which is usually what a one-off decorative orb wants.

A number and the numeric string that names it resolve to the same seed —
`seed={42}` and `seed="42"` paint the same orb. This matters because a custom
element attribute can only ever be a string; without it, `<sui-voice-orb
seed="42">` and the Svelte `seed={42}` it is meant to be the markup spelling
of would paint two different orbs. Anything else — `seed="alpha"`, a session
id — is still hashed as text, unchanged.

## `persistKey` — resuming rotation

By default the orb starts from zero rotation on every mount, so navigating away and back snaps it. Give it a key and it resumes:

```svelte
<VoiceOrb persistKey="assistant-orb" seed={sessionId} />
```

**Opt-in, and namespaced by you, on purpose.** Writing to a consumer's `localStorage` uninvited is not a component's decision, and a fixed key would make two orbs on one page overwrite each other's rotation. Storage failures are swallowed — a blocked or full store means rotation resumes from zero, which is cosmetic.

## Accessibility

The canvas is `aria-hidden`, because it carries no information a screen reader could use. **The orb is not a status indicator.** If it is showing that the microphone is live, that state must also be announced somewhere a screen reader can reach it — a live region, or the label on the control that toggles it.

`touch-action: none` on the canvas is what lets pointer repulsion work on touch; it means a drag starting on the orb will not scroll the page. Set `interactive={false}` where that matters.

**`prefers-reduced-motion` stops the decorative motion, not the audio-driven kind.** Idle rotation and the no-`analyser` sine breathing exist only to look alive, so both freeze under the OS setting — the orb still paints, just without the continuous animation the setting exists to suppress. Motion driven by a real `analyser`, though, is left running: it reports what the microphone is doing right now, and freezing it would take away the only feedback a caller gave the user that the app is listening. That is state, not decoration, the same distinction that keeps `onlevel` firing regardless of the preference. Being canvas-drawn, none of this is reachable by a CSS media query — the check happens inside the render loop itself.

```svelte
<!-- Rotates steadily, unless the OS asks for reduced motion. -->
<VoiceOrb variant="idle" />

<!-- Breathes on real sound either way; the sine fallback freezes without an analyser. -->
<VoiceOrb variant="listening" {analyser} />
```

## Web component

```html
<sui-voice-orb variant="listening" seed="abc" height="320" particle-count="600"></sui-voice-orb>
```

Kebab-case attributes for the scalars; `analyser`, `onfirstframe` and `onlevel` are assigned as JS properties.

`seed` stays declared as a string attribute here — an HTML attribute can only ever be one — but
`<sui-voice-orb seed="42">` and the Svelte `seed={42}` it is the markup spelling of now paint the
same orb: see the numeric-string parity note under **`seed`** above.
