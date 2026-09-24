# ThinkingOrb

A small canvas animation, built from dots, for the moment a chat UI is waiting on an AI or agent turn. It ships nine different animations; pick one per feature or step so a reader can tell "searching the web" apart from "writing code" at a glance.

```svelte
<script lang="ts">
  import { ThinkingOrb } from '@juspay/svelte-ui-components';
</script>

<ThinkingOrb state="searching" size={64} />
```

## Props

| Prop           | Type                                    | Default     | Description                                                                                                                                |
| -------------- | --------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `state`        | `OrbState` (9 values, see States below) | `'working'` | Which animation to show.                                                                                                                   |
| `size`         | `64 \| 32 \| 20`                        | `64`        | How big the canvas is, in CSS pixels. Only these three sizes have real artwork; anything else falls back to `64`.                          |
| `speed`        | `number`                                | `1`         | Multiplies how fast the animation's own clock advances.                                                                                    |
| `paused`       | `boolean`                               | `false`     | Stops the animation and leaves the last-drawn frame on screen.                                                                             |
| `color`        | `Rgb`                                   | —           | The dot and line colour. Omitted, reads `--sui-thinking-orb-color`, then the inherited text colour, then a mid-grey fallback. See Theming. |
| `dots`         | `number`                                | `1`         | Scales how many dots (or strands, or nodes) the state draws. Anything below `0.1` is treated as `0.1`.                                     |
| `dotSize`      | `number`                                | `1`         | Scales the size of every dot.                                                                                                              |
| `gravity`      | `boolean \| GravityOptions`             | `false`     | Dots near the pointer get pulled toward it, inside this instance's own canvas. See Interactivity.                                          |
| `ariaLabel`    | `string`                                | —           | Replaces the default per-state label. See Accessibility.                                                                                   |
| `classes`      | `string`                                | —           | CSS class string applied to the canvas.                                                                                                    |
| `testId`       | `string`                                | —           | Value for `data-pw`, for test selectors.                                                                                                   |
| `onfirstframe` | `() => void`                            | —           | Called once, right after the first frame is actually painted — not at mount.                                                               |

## States

| `state`      | What it shows                                                                              |
| ------------ | ------------------------------------------------------------------------------------------ |
| `working`    | Dots travel in short trails along six differently tilted loops around a centre             |
| `searching`  | A bright band sweeps around a speckled sphere, top to bottom, lighting the dots it crosses |
| `solving`    | Horizontal bands turn a quarter out of place in sequence, pause, then straighten back      |
| `listening`  | A wave of brightness rises through a stack of rings, swelling each as it reaches it        |
| `connecting` | Scattered nodes link to their nearest neighbours; small dots travel along the links        |
| `weaving`    | Three spiral strands wrap the sphere end to end, swinging past each other as it turns      |
| `composing`  | A broad, soft-edged ribbon of dots ripples like fabric as it turns                         |
| `breathing`  | A ring of dots swells and settles on a slow, unresting cycle                               |
| `shaping`    | A ring of dots reshapes itself smoothly from round to a triangle to a square and back      |

## Theming

| Variable                   | Default               | What it sets    |
| -------------------------- | --------------------- | --------------- |
| `--sui-thinking-orb-color` | the inherited `color` | The dot colour. |

**You do not have to set this.** The orb draws in the text colour it inherits by default, following your theme with no configuration. Set the variable to give the orb a different colour from the surrounding text. If neither the variable nor the inherited colour is a colour the canvas can parse, the orb falls back to a mid-grey — the same fallback chain `VoiceOrb` uses.

Dark/light is detected automatically from this repo's own `data-theme` attribute (set by `ThemeSwitcher`) — there is no `theme` prop.

## Interactivity

`gravity` pulls nearby dots toward the pointer, entirely inside this instance's own canvas:

```svelte
<ThinkingOrb state="connecting" gravity />
<!-- or tune it -->
<ThinkingOrb state="connecting" gravity={{ radius: 60, strength: 10 }} />
```

This is decoration, deliberately with no keyboard equivalent — it accomplishes nothing beyond visual feedback, so there is no functionality a keyboard user is locked out of.

## Accessibility

The canvas is `role="img"` with a default `aria-label` per `state`: the state name capitalised plus `"…"`, with no exceptions — `"Searching…"`, `"Breathing…"`, and so on. This differs from `VoiceOrb`, which keeps its canvas out of the accessibility tree entirely: `VoiceOrb`'s `idle`/`listening` variants have no fixed meaning on their own, while `ThinkingOrb`'s nine states always mean the same thing — the system is in that phase of processing — so a sensible default label is honest out of the box. Pass `ariaLabel` to use different wording.

`prefers-reduced-motion` stops the animation and leaves it holding a single fixed instant, rather than freezing wherever it happened to be mid-motion.

## Web component

```html
<sui-thinking-orb state="searching" size="64"></sui-thinking-orb>
```

Kebab-case attributes for the scalars (`dot-size`, `test-id`). An attribute value no preset knows — `size="48"`, or a misspelled `state` — falls back to the default (`64` / `working`) rather than failing to draw. `color` and `gravity` are object-typed: assign them as JS properties, or pass JSON in the attribute (as `gravity="true"` below). `onfirstframe` is a function, so assign it as a property or listen for the `firstframe` event.

**`gravity` needs a real value, not a bare attribute.** It is declared as an object-typed custom-element prop, so `<sui-thinking-orb gravity>` with no value does **not** turn it on — the attribute's string is parsed as JSON, and an empty string is not valid JSON. Give it a real value instead, either as an attribute or as a property:

```html
<sui-thinking-orb state="connecting" gravity="true"></sui-thinking-orb>
```

```js
el.gravity = true;
// or, tuned:
el.gravity = { radius: 60, strength: 10 };
```

For a custom label, set the `aria-label` attribute on `<sui-thinking-orb>`; the wrapper forwards it to the canvas. As a JS property it is `orbAriaLabel`, not `ariaLabel`, because every `HTMLElement` already defines `ariaLabel` and a property of that name would shadow the browser's own reflection.
