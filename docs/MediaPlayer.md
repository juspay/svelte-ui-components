# MediaPlayer

An image or video player with a hover-revealed control overlay. For `type="image"` it
renders the source through `Img` (with optional `fallback`). For `type="video"` it
renders the video plus a centered play/pause control and a bottom-aligned mute/unmute
control that appear on hover — both reuse `Button`. Built-in icons are used for the
controls and can be replaced with snippet props. `playing` and `muted` are bindable. Set
`controls` to fall back to the browser's native video controls (the custom overlay is
then hidden). Unstyled by default — every dimension, the overlay color, and the control
appearance are CSS-variable driven.

## Usage

```svelte
<script>
  import { MediaPlayer } from '@juspay/svelte-ui-components';
</script>

<MediaPlayer type="image" src="/photo.jpg" alt="A photo" />

<MediaPlayer type="video" src="/clip.mp4" />

<!-- Swap a control icon with your own markup -->
<MediaPlayer type="video" src="/clip.mp4">
  {#snippet playIcon()}
    <img src="/icons/play.svg" alt="" />
  {/snippet}
</MediaPlayer>
```

## Props

| Prop       | Type                 | Required | Default | Description                                                                          |
| ---------- | --------------------- | -------- | ------- | ------------------------------------------------------------------------------------- |
| src        | `string`              | Yes      | `-`     | URL of the image or video to display.                                                 |
| type       | `'image'\|'video'`    | Yes      | `-`     | Whether the source is rendered as an image or a video with controls.                  |
| alt        | `string`              | No       | `''`    | Alternative text for the image (ignored for video).                                   |
| fallback   | `string`              | No       | `-`     | Fallback image URL used (via `Img`) if `src` fails to load. Image type only.          |
| autoplay   | `boolean`             | No       | `true`  | Whether the video begins playing automatically (video only).                          |
| loop       | `boolean`             | No       | `false` | Whether the video restarts when it ends (video only).                                 |
| controls   | `boolean`             | No       | `false` | Use the browser's native video controls and hide the custom overlay (video only).     |
| playing    | `boolean`             | No       | `true`  | Bindable, both directions: toggling playback (click/keyboard/native controls) updates `playing`, and a host setting `playing` itself calls `play()`/`pause()` on the video. |
| muted      | `boolean`             | No       | `true`  | Bindable. Reflects whether the video audio is muted.                                  |
| playIcon   | `Snippet`             | No       | `-`     | Custom play-control icon. Falls back to the built-in asset.                           |
| pauseIcon  | `Snippet`             | No       | `-`     | Custom pause-control icon. Falls back to the built-in asset.                          |
| muteIcon   | `Snippet`             | No       | `-`     | Custom muted-control icon. Falls back to the built-in asset.                          |
| unmuteIcon | `Snippet`             | No       | `-`     | Custom unmuted-control icon. Falls back to the built-in asset.                        |
| captionsSrc | `string`             | No       | `-`     | URL of a WebVTT captions file (video only). Omit entirely for no captions track — a track with no source is never rendered. |
| captionsLabel | `string`           | No       | `-`     | Label shown in the browser's caption menu. Only meaningful with `captionsSrc`.        |
| captionsSrcLang | `string`         | No       | `-`     | BCP 47 language tag for the captions track, e.g. `"en"`. Only meaningful with `captionsSrc`. |
| testId     | `string`              | No       | `-`     | `data-pw` on the root element.                                                        |
| classes    | `string`              | No       | `-`     | Class string on the root element.                                                     |

## Events

| Event          | Type                            | Description                                                       |
| -------------- | -------------------------------- | ------------------------------------------------------------------ |
| onplay         | `(event: Event) => void`        | Native `play` event, relayed after `playing` updates. Video only.  |
| onpause        | `(event: Event) => void`        | Native `pause` event, relayed after `playing` updates. Video only. |
| onvolumechange | `(muted: boolean) => void`      | Fires when the mute control is toggled.                            |

`onplay`/`onpause`/`onvolumechange` stay lowercase per `DESIGN_PRINCIPLES.md` — they
relay the video element's own native events (with `playing`/`muted` state already
applied), not synthesized ones.

## Accessibility

For video, the video element itself is a focusable (`tabindex="0"`) `role="button"` with
an `aria-label` that tracks play state ("Play video" / "Pause video"), so clicking or
pressing Enter/Space directly on the video toggles playback even before the overlay is
hovered/focused. Both overlay controls are real `Button` instances with their own
`ariaLabel`, so they carry `Button`'s own keyboard and focus handling.

## Type Reference

```ts
type MediaType = 'image' | 'video';
```

## CSS Variables

| Variable                                        | Default                | CSS Property              |
| ------------------------------------------------ | ----------------------- | -------------------------- |
| `--media-player-height`                          | `400px`                 | height                     |
| `--media-player-width`                           | `fit-content`            | width                       |
| `--media-player-border-radius`                   | `14px`                   | border-radius               |
| `--media-player-overflow`                        | `hidden`                 | overflow                   |
| `--media-player-background`                      | `transparent`            | background                 |
| `--media-player-media-height`                    | `100%`                   | height (image/video)        |
| `--media-player-media-width`                     | `fit-content`            | width (image/video)         |
| `--media-player-media-object-fit`                | `contain`                | object-fit                 |
| `--media-player-media-border-radius`             | `inherit`                | border-radius (image/video) |
| `--media-player-media-cursor`                    | `pointer`                | cursor (video only)        |
| `--media-player-overlay-z-index`                 | `20`                     | z-index                    |
| `--media-player-overlay-color`                   | `transparent`            | background-color            |
| `--media-player-overlay-hover-color`             | `#0000004d`              | background-color (hover)    |
| `--media-player-overlay-transition`              | `background-color 0.2s ease` | transition             |
| `--media-player-center-controls-visibility`      | `hidden`                 | visibility (pre-hover)      |
| `--media-player-bottom-controls-visibility`      | `hidden`                 | visibility (pre-hover)      |
| `--media-player-bottom-controls-justify`         | `flex-end`               | justify-content              |
| `--media-player-bottom-controls-padding`         | `12px`                   | padding                    |
| `--media-player-control-padding`                 | `0px`                    | Button padding              |
| `--media-player-control-border`                  | `none`                   | Button border                |
| `--media-player-control-border-radius`           | `50%`                    | Button border-radius         |
| `--media-player-control-background-color`        | `transparent`            | Button background            |
| `--media-player-control-color`                   | `#ffffff`                | Button text/icon color       |
| `--media-player-control-hover-background-color`  | (inherits background)    | Button hover background     |
| `--media-player-control-hover-color`              | (inherits color)         | Button hover text/icon color |
| `--media-player-center-control-size`             | `64px`                   | width/height (play/pause)   |
| `--media-player-bottom-control-size`              | `24px`                   | width/height (mute)          |
| `--media-player-control-icon-size`                | `100%`                   | icon width/height            |

## Web Component

Tag: `<sui-media-player>`

```html
<sui-media-player src="/clip.mp4" type="video"></sui-media-player>
```
