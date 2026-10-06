# MediaPlayer

An image or video player with a hover-revealed control overlay. For `type="image"` it
renders the source through `Img` (with optional `fallback`). For `type="video"` it
renders the video plus a centered play/pause control and a bottom-aligned mute/unmute
control that appear on hover — both reuse `Button`. Built-in icons are used for the
controls and can be replaced with snippet props. `playing` and `muted` are bindable. Set
`controls` to fall back to the browser's native video controls (the custom overlay is
then hidden). Supply `captionsSrc` for a WebVTT captions track and add `captionsButton` for
a captions toggle in the overlay (the custom overlay replaces the browser's own captions
menu, so without it a supplied track cannot be shown). Unstyled by default — every dimension, the overlay color, and the control
appearance are CSS-variable driven.

## Usage

```svelte
<script>
  import { MediaPlayer } from '@juspay/svelte-ui-components';
</script>

<MediaPlayer type="image" src="/photo.jpg" alt="A photo" />

<MediaPlayer type="video" src="/clip.mp4" />

<!-- Captions: the track is loaded and shown through the overlay's Captions toggle -->
<MediaPlayer
  type="video"
  src="/clip.mp4"
  captionsSrc="/clip.en.vtt"
  captionsLabel="English"
  captionsSrcLang="en"
  captionsButton
  bind:captionsVisible
/>

<!-- Swap a control icon with your own markup -->
<MediaPlayer type="video" src="/clip.mp4">
  {#snippet playIcon()}
    <img src="/icons/play.svg" alt="" />
  {/snippet}
</MediaPlayer>
```

## Props

| Prop               | Type               | Required | Default | Description                                                                                                                                                                                      |
| ------------------ | ------------------ | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| src                | `string`           | Yes      | `-`     | URL of the image or video to display.                                                                                                                                                            |
| type               | `'image'\|'video'` | Yes      | `-`     | Whether the source is rendered as an image or a video with controls.                                                                                                                             |
| alt                | `string`           | No       | `''`    | Alternative text for the image (ignored for video).                                                                                                                                              |
| fallback           | `string`           | No       | `-`     | Fallback image URL used (via `Img`) if `src` fails to load. Image type only.                                                                                                                     |
| autoplay           | `boolean`          | No       | `true`  | Whether the video begins playing automatically (video only).                                                                                                                                     |
| loop               | `boolean`          | No       | `false` | Whether the video restarts when it ends (video only).                                                                                                                                            |
| controls           | `boolean`          | No       | `false` | Use the browser's native video controls and hide the custom overlay (video only).                                                                                                                |
| playing            | `boolean`          | No       | `true`  | Bindable, both directions: toggling playback (click/keyboard/native controls) updates `playing`, and a host setting `playing` itself calls `play()`/`pause()` on the video.                      |
| muted              | `boolean`          | No       | `true`  | Bindable. Reflects whether the video audio is muted.                                                                                                                                             |
| playIcon           | `Snippet`          | No       | `-`     | Custom play-control icon. Falls back to the built-in asset.                                                                                                                                      |
| pauseIcon          | `Snippet`          | No       | `-`     | Custom pause-control icon. Falls back to the built-in asset.                                                                                                                                     |
| muteIcon           | `Snippet`          | No       | `-`     | Custom muted-control icon. Falls back to the built-in asset.                                                                                                                                     |
| unmuteIcon         | `Snippet`          | No       | `-`     | Custom unmuted-control icon. Falls back to the built-in asset.                                                                                                                                   |
| captionsSrc        | `string`           | No       | `-`     | URL of a WebVTT captions file (video only). Omit entirely for no captions track — a track with no source is never rendered.                                                                      |
| captionsLabel      | `string`           | No       | `-`     | Label shown in the browser's caption menu. Only meaningful with `captionsSrc`.                                                                                                                   |
| captionsSrcLang    | `string`           | No       | `-`     | BCP 47 language tag for the captions track, e.g. `"en"`. Only meaningful with `captionsSrc`.                                                                                                     |
| captionsButton     | `boolean`          | No       | `false` | Opt-in captions toggle in the overlay's bottom row: a native `<button>` named "Captions" with `aria-pressed`. Video only, drawn only when `captionsSrc` is set and `controls` is off.            |
| captionsVisible    | `boolean`          | No       | `false` | Bindable, both directions: the toggle and the browser's own captions menu (under `controls`) report outward, and a host writing it shows or hides the track. Only meaningful with `captionsSrc`. |
| captionsIcon       | `Snippet`          | No       | `-`     | Custom captions-toggle icon while captions are hidden. Falls back to the built-in asset.                                                                                                         |
| captionsOnIcon     | `Snippet`          | No       | `-`     | Custom captions-toggle icon while captions are showing. Falls back to the built-in asset.                                                                                                        |
| seekBar            | `boolean`          | No       | `false` | Opt-in scrubber (a `Slider`) in the overlay's bottom row. Video only.                                                                                                                            |
| timeDisplay        | `boolean`          | No       | `false` | Opt-in elapsed/total clock, `m:ss` and `h:mm:ss` past an hour. Video only.                                                                                                                       |
| fullscreenButton   | `boolean`          | No       | `false` | Opt-in fullscreen toggle. Requests fullscreen on the container, not the `<video>`, so the overlay controls stay on screen. Video only.                                                           |
| fullscreenIcon     | `Snippet`          | No       | `-`     | Custom enter-fullscreen icon. Falls back to the built-in asset.                                                                                                                                  |
| exitFullscreenIcon | `Snippet`          | No       | `-`     | Custom exit-fullscreen icon. Falls back to the built-in asset.                                                                                                                                   |
| currentTime        | `number`           | No       | `0`     | Bindable, both directions: playback and scrubbing report outward, and a host writing it seeks the video (clamped to `duration`). An inward write does not fire `onseek`.                         |
| duration           | `number`           | No       | `0`     | Bindable, outward. The media's length once known; `0` until metadata loads.                                                                                                                      |
| testId             | `string`           | No       | `-`     | `data-pw` on the root element.                                                                                                                                                                   |
| classes            | `string`           | No       | `-`     | Class string on the root element.                                                                                                                                                                |

## Events

| Event              | Type                                              | Description                                                                                                                   |
| ------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| onplay             | `(event: Event) => void`                          | Native `play` event, relayed after `playing` updates. Video only.                                                             |
| onpause            | `(event: Event) => void`                          | Native `pause` event, relayed after `playing` updates. Video only.                                                            |
| onvolumechange     | `(muted: boolean) => void`                        | Fires when the mute control is toggled.                                                                                       |
| oncaptionschange   | `(visible: boolean) => void`                      | Fires when the viewer shows or hides captions (toggle or the browser's menu), never for a host's own `captionsVisible` write. |
| onseek             | `(currentTime: number) => void`                   | Fires only for a deliberate scrub via the seek bar, never for playback advancing or a host's own `currentTime` write.         |
| ontimeupdate       | `(currentTime: number, duration: number) => void` | Relays the video element's `timeupdate`.                                                                                      |
| onfullscreenchange | `(isFullscreen: boolean) => void`                 | Fires on entering or leaving fullscreen, including via Escape or browser chrome.                                              |

`onplay`/`onpause`/`onvolumechange` stay lowercase per `DESIGN_PRINCIPLES.md` — they
relay the video element's own native events (with `playing`/`muted` state already
applied), not synthesized ones.

## Accessibility

For video, the video element itself is a focusable (`tabindex="0"`) `role="button"` with
an `aria-label` that tracks play state ("Play video" / "Pause video"), so clicking or
pressing Enter/Space directly on the video toggles playback even before the overlay is
hovered/focused. Both overlay controls are real `Button` instances with their own
`ariaLabel`, so they carry `Button`'s own keyboard and focus handling.

The captions toggle (`captionsButton`) is a native `<button type="button">` named "Captions"
whose `aria-pressed` carries the state, so a screen reader announces "Captions, toggle button,
pressed" / "not pressed" rather than hearing the name change under it. It is a normal Tab stop
in the overlay's order (after mute, before fullscreen), operable with Enter and Space as well as
a pointer, and its icon swaps between an outline and a filled glyph so the state is not
conveyed by colour alone. Cues themselves are painted by the browser from the `<track>`.

The seek bar is a native range input, operable with arrow keys, Home and End, and carries
`aria-label="Seek"` — without a name it would announce only its numeric value, telling a
screen-reader user nothing about what it controls. The fullscreen control is a `Button`
whose `ariaLabel` tracks state ("Enter fullscreen" / "Exit fullscreen"). The clock is
plain text and is not announced as a live region: it changes every frame during playback,
which would flood a screen reader rather than inform it.

## Captions

`captionsSrc` adds one WebVTT `<track kind="captions">`; omit it and no `<track>` is rendered at all.
A track starts hidden, so something has to turn it on:

- **Custom overlay** (the default): add `captionsButton` for the Captions toggle, or bind
  `captionsVisible` and drive it from your own control. The overlay replaces the browser's controls
  and with them the browser's captions menu, so without one of these a supplied track cannot be shown.
- **Native `controls`**: the browser's own menu shows and hides the track. `captionsVisible` follows
  whatever that menu picks, so a bound value stays truthful.

```svelte
<MediaPlayer
  type="video"
  src="/clip.mp4"
  captionsSrc="/clip.en.vtt"
  captionsLabel="English"
  captionsSrcLang="en"
  captionsButton
  bind:captionsVisible
  oncaptionschange={(visible) => track('captions', visible)}
/>
```

Two layout facts the browser decides, not this component, and that decide whether captions are readable:

- **Captions are laid out inside the `<video>` element's own box.** By default that box is as wide as
  the media at the player's height (a 16:9 clip in a 400px tall player is 711px wide), and the player
  clips what overflows, so a narrower player cuts every caption line mid-word along with the picture.
  Size the player to the media, or set `--media-player-media-width: 100%` so the box fits the player.
- **Cues sit at the bottom by default, which is where the overlay's control row is.** Give the cues a
  `line` setting in the WebVTT file to keep them clear of it, e.g.
  `00:00:00.000 --> 00:00:02.000 line:-4` (four lines up from the bottom). The demo's captions file
  does this. Letterbox bars show the player's own background, so also set `--media-player-background`
  to something dark where the overlay's white controls sit.

Only one caption track is supported, so there is nothing to select between: the toggle shows or hides
it. Choosing among several languages is not offered by this component.

## Type Reference

```ts
type MediaType = 'image' | 'video';
```

## CSS Variables

| Variable                                        | Default                      | CSS Property                    |
| ----------------------------------------------- | ---------------------------- | ------------------------------- |
| `--media-player-height`                         | `400px`                      | height                          |
| `--media-player-width`                          | `fit-content`                | width                           |
| `--media-player-border-radius`                  | `14px`                       | border-radius                   |
| `--media-player-overflow`                       | `hidden`                     | overflow                        |
| `--media-player-background`                     | `transparent`                | background                      |
| `--media-player-media-height`                   | `100%`                       | height (image/video)            |
| `--media-player-media-width`                    | `fit-content`                | width (image/video)             |
| `--media-player-media-object-fit`               | `contain`                    | object-fit                      |
| `--media-player-media-border-radius`            | `inherit`                    | border-radius (image/video)     |
| `--media-player-media-cursor`                   | `pointer`                    | cursor (video only)             |
| `--media-player-overlay-z-index`                | `20`                         | z-index                         |
| `--media-player-overlay-color`                  | `transparent`                | background-color                |
| `--media-player-overlay-hover-color`            | `#0000004d`                  | background-color (hover)        |
| `--media-player-overlay-transition`             | `background-color 0.2s ease` | transition                      |
| `--media-player-center-controls-visibility`     | `hidden`                     | visibility (pre-hover)          |
| `--media-player-bottom-controls-visibility`     | `hidden`                     | visibility (pre-hover)          |
| `--media-player-bottom-controls-justify`        | `flex-end`                   | justify-content                 |
| `--media-player-bottom-controls-padding`        | `12px`                       | padding                         |
| `--media-player-bottom-controls-gap`            | `12px`                       | gap (bottom controls)           |
| `--media-player-control-padding`                | `0px`                        | Button padding                  |
| `--media-player-control-border`                 | `none`                       | Button border                   |
| `--media-player-control-border-radius`          | `50%`                        | Button border-radius            |
| `--media-player-control-background-color`       | `transparent`                | Button background               |
| `--media-player-control-color`                  | `#ffffff`                    | Button text/icon color          |
| `--media-player-control-hover-background-color` | (inherits background)        | Button hover background         |
| `--media-player-control-hover-color`            | (inherits color)             | Button hover text/icon color    |
| `--media-player-control-focus-outline`          | `2px solid currentColor`     | outline (captions toggle focus) |
| `--media-player-control-focus-outline-offset`   | `2px`                        | outline-offset (captions focus) |
| `--media-player-center-control-size`            | `64px`                       | width/height (play/pause)       |
| `--media-player-bottom-control-size`            | `24px`                       | width/height (mute)             |
| `--media-player-control-icon-size`              | `100%`                       | icon width/height               |
| `--media-player-transport-justify`              | `flex-start`                 | justify-content (transport row) |
| `--media-player-transport-gap`                  | `12px`                       | gap (transport row)             |
| `--media-player-seek-track-color`               | `#ffffff59`                  | seek bar track                  |
| `--media-player-seek-fill-color`                | `#ffffff`                    | seek bar fill                   |
| `--media-player-seek-thumb-color`               | `#ffffff`                    | seek bar thumb                  |
| `--media-player-time-font-family`               | `inherit`                    | font-family (clock)             |
| `--media-player-time-font-size`                 | `12px`                       | font-size (clock)               |
| `--media-player-time-color`                     | `#ffffff`                    | color (clock)                   |
| `--media-player-fullscreen-background`          | `#000000`                    | background while fullscreen     |

## Web Component

Tag: `<sui-media-player>`

```html
<sui-media-player src="/clip.mp4" type="video"></sui-media-player>
```

`captions-button` and `captions-visible` are the attribute forms of `captionsButton` and
`captionsVisible`; `captions-visible` reflects, so it tracks the viewer's choice. Like `onseek`,
`oncaptionschange` dispatches a same-named DOM custom event, `captionschange` (bubbles, composed),
with `detail` set to the new visibility:

```js
player.addEventListener('captionschange', (e) => console.log(e.detail)); // true | false
```

`onseek` also dispatches a same-named DOM custom event (bubbles, composed) for a consumer who
only calls `addEventListener` — `player.addEventListener('seek', (e) => console.log(e.detail))`,
with `detail` set to the same `currentTime` the property callback receives. `onplay`, `onpause`,
`onvolumechange`, `ontimeupdate`, and `onfullscreenchange` do not: all five are already
`HTMLElement`'s own native events, so `player.addEventListener('play', ...)` (and the other four)
register without error but are never called by this component — assign the properties instead
(`player.onplay = (event) => ...`, etc).

### Slots

The eight control glyphs are reachable from markup. Each renders inside the custom overlay, which
the component draws only while `controls` is absent — with native `controls` the browser draws
its own transport and none of these slots appear.

| Slot Name              | Maps to Snippet      | Description                                                                         |
| ---------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `play-icon`            | `playIcon`           | Transport button while paused. Defaults to the built-in play glyph.                 |
| `pause-icon`           | `pauseIcon`          | Transport button while playing. Defaults to the built-in pause glyph.               |
| `mute-icon`            | `muteIcon`           | Volume button while muted. Defaults to the built-in muted-speaker glyph.            |
| `unmute-icon`          | `unmuteIcon`         | Volume button while unmuted. Defaults to the built-in volume glyph.                 |
| `captions-icon`        | `captionsIcon`       | Captions toggle while captions are hidden. Defaults to the built-in outline glyph.  |
| `captions-on-icon`     | `captionsOnIcon`     | Captions toggle while captions are showing. Defaults to the built-in filled glyph.  |
| `fullscreen-icon`      | `fullscreenIcon`     | Fullscreen button while windowed. Defaults to the built-in enter-fullscreen glyph.  |
| `exit-fullscreen-icon` | `exitFullscreenIcon` | Fullscreen button while fullscreen. Defaults to the built-in exit-fullscreen glyph. |

A JavaScript-assigned property of the same name wins over slotted markup; the slot is the
fallback, and the slot's own fallback is the built-in glyph, so supplying neither still renders
the control.
