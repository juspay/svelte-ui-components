# LottiePlayer

A lightweight Lottie animation player that dynamically loads `lottie-web` and renders animations from a URL or inline JSON data. Supports SVG, canvas, and HTML renderers, imperative play/pause/stop control via `bind:this`, configurable loop and autoplay, and optional callbacks for completion and load errors. The `lottie-web` package is an optional peer dependency — include it in your project's dependencies when using this component.

## Usage

```svelte
<script>
  import { LottiePlayer } from '@juspay/svelte-ui-components';
</script>

<LottiePlayer src="/animations/confetti.json" />
```

### With Imperative Control (bind:this)

```svelte
<script>
  import { LottiePlayer } from '@juspay/svelte-ui-components';

  let player;
</script>

<LottiePlayer bind:this={player} src="/animations/loader.json" autoplay={false} loop={false} />

<button onclick={() => player.play()}>Play</button>
<button onclick={() => player.pause()}>Pause</button>
<button onclick={() => player.stop()}>Stop</button>
```

### From Inline Animation Data

```svelte
<script>
  import { LottiePlayer } from '@juspay/svelte-ui-components';
  import animationData from './my-animation.json';
</script>

<LottiePlayer {animationData} loop={false} oncomplete={() => console.log('done')} />
```

### Canvas Renderer

```svelte
<LottiePlayer src="/animations/chart.json" renderer="canvas" />
```

## Props

| Prop          | Type                          | Required | Default | Description                                                                                            |
| ------------- | ----------------------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------ |
| src           | `string`                      | No       | `-`     | URL or path to the Lottie animation JSON file. Ignored when `animationData` is provided.               |
| animationData | `Record<string, unknown>`     | No       | `-`     | Inline animation data object. Takes precedence over `src` when both are provided.                      |
| autoplay      | `boolean`                     | No       | `true`  | Whether the animation starts playing automatically on mount.                                           |
| loop          | `boolean`                     | No       | `true`  | Whether the animation loops continuously.                                                              |
| speed         | `number`                      | No       | `1`     | Playback speed multiplier. `2` is double speed, `0.5` is half speed.                                   |
| renderer      | `'svg' \| 'canvas' \| 'html'` | No       | `'svg'` | Rendering backend. SVG is recommended for most use cases.                                              |
| ariaHidden    | `boolean`                     | No       | `true`  | Whether the player element is hidden from assistive technology. Keep `true` for decorative animations. |
| testId        | `string`                      | No       | `-`     | Value for the `data-pw` attribute on the container element.                                            |
| classes       | `string`                      | No       | `-`     | CSS class string applied to the container element for theming via CSS variable overrides.              |

## Methods (via bind:this)

| Method    | Signature    | Description                                         |
| --------- | ------------ | --------------------------------------------------- |
| `play()`  | `() => void` | Starts or resumes playback of the animation.        |
| `pause()` | `() => void` | Pauses playback at the current frame.               |
| `stop()`  | `() => void` | Stops playback and resets the animation to frame 0. |

## Events

| Event        | Type         | Description                                                                      |
| ------------ | ------------ | -------------------------------------------------------------------------------- |
| `oncomplete` | `() => void` | Fired when the animation completes one full cycle (only fires when not looping). |
| `onerror`    | `() => void` | Fired when the animation data fails to load.                                     |

## Web Component

The component is also available as a standard web component (`<sui-lottie-player>`). Import it from the web component build:

```html
<script type="module" src="path/to/sui-lottie-player.js"></script>

<sui-lottie-player src="/animations/confetti.json" autoplay loop></sui-lottie-player>
```

### Web Component Props

All props from the [Props table](#props) above are available as attributes or properties, with the following notes:

- Boolean attributes follow HTML conventions: presence means `true`, absence means `false`.
- `animationData` must be set as a JavaScript property (not an HTML attribute) since it is an object.
- `ariaHidden` maps to the `aria-hidden` HTML attribute.

```js
const player = document.querySelector('sui-lottie-player');
player.animationData = {
  /* inline lottie JSON */
};
```

### Web Component Events

The web component dispatches DOM custom events that bubble and are composed (cross shadow-DOM boundaries):

| Event      | Description                                                                |
| ---------- | -------------------------------------------------------------------------- |
| `complete` | Fired when the animation completes one full cycle (only when not looping). |
| `error`    | Fired when the animation data fails to load.                               |

```js
const player = document.querySelector('sui-lottie-player');
player.addEventListener('complete', () => console.log('animation done'));
player.addEventListener('error', () => console.error('animation failed to load'));
```

### Web Component Limitations

- Imperative `play()`, `pause()`, and `stop()` methods are not available on the web component element. Use `autoplay` and `loop` attributes for declarative control instead.

## CSS Variables

Override these custom properties to theme the component.

| Variable                        | Default        | CSS Property  | Description                                             |
| ------------------------------- | -------------- | ------------- | ------------------------------------------------------- |
| `--lottie-player-display`       | `inline-block` | display       | Display mode of the player container.                   |
| `--lottie-player-width`         | `100%`         | width         | Width of the player container.                          |
| `--lottie-player-height`        | `100%`         | height        | Height of the player container.                         |
| `--lottie-player-background`    | `transparent`  | background    | Background color or image behind the animation.         |
| `--lottie-player-border-radius` | `0px`          | border-radius | Corner rounding of the player container.                |
| `--lottie-player-overflow`      | `hidden`       | overflow      | Overflow handling — use `hidden` to clip the animation. |
