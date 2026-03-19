# Phone

A realistic phone device frame that wraps any content to showcase mobile UIs, app screenshots, or responsive designs. Supports modern (notch/dynamic island) and classic (home button) variants with decorative side buttons, status bar, and home indicator. Scale and rotation are controlled via `--phone-scale` and `--phone-rotation` CSS custom properties.

## Usage

```svelte
<script>
  import { Phone } from '@juspay/svelte-ui-components';
</script>

<Phone>
  <div>Your mobile content here</div>
</Phone>
```

## Props

| Prop          | Type                    | Required | Default    | Description                                                                                                                                                            |
| ------------- | ----------------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| variant       | `'modern' \| 'classic'` | No       | `'modern'` | The phone style. 'modern' renders a notch/dynamic island at the top (iPhone-style). 'classic' renders a home button at the bottom.                                     |
| showStatusBar | `boolean`               | No       | `true`     | Whether to show a simplified status bar at the top of the screen with time, signal, and battery indicators.                                                            |
| showHomeBar   | `boolean`               | No       | `true`     | Whether to show the bottom home indicator bar. Only visible when variant is 'modern'.                                                                                  |
| testId        | `string`                | No       | `-`        | Value for the data-pw attribute, used for end-to-end testing selectors.                                                                                                |
| classes       | `string`                | No       | `-`        | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                                                                  |
| -------- | --------- | -------------------------------------------------------------------------------------------- |
| children | `Snippet` | The screen content rendered inside the phone display area. Fills the available screen space. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                           | Default                                                  | CSS Property  | Description                                                                     |
| ---------------------------------- | -------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `--phone-scale`                    | `1`                                                      | transform     | Uniform scale factor for the entire phone wrapper.                              |
| `--phone-rotation`                 | `0deg`                                                   | rotate        | Rotation angle applied to the phone wrapper.                                    |
| `--phone-frame-width`              | `375px`                                                  | width         | Base width of the phone frame in portrait mode.                                 |
| `--phone-frame-border-radius`      | `50px`                                                   | border-radius | Corner rounding of the outer phone frame.                                       |
| `--phone-frame-padding`            | `12px`                                                   | padding       | Thickness of the bezel (space between frame edge and screen).                   |
| `--phone-frame-shadow`             | `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.1)` | box-shadow    | Drop shadow around the device frame.                                            |
| `--phone-screen-border-radius`     | `38px`                                                   | border-radius | Corner rounding of the inner screen area.                                       |
| `--phone-screen-background`        | `#000`                                                   | background    | Background color of the screen area (visible when no content fills the screen). |
| `--phone-screen-aspect-ratio`      | `9/19.5` (modern) or `9/16` (classic)                    | aspect-ratio  | Aspect ratio of the screen area. Defaults depend on the variant.                |
| `--phone-status-bar-height`        | `44px`                                                   | height        | Height of the status bar at the top of the screen.                              |
| `--phone-status-bar-color`         | `#fff`                                                   | color         | Text/icon color used in the status bar.                                         |
| `--phone-status-bar-font-size`     | `14px`                                                   | font-size     | Font size of status bar text (time display).                                    |
| `--phone-status-bar-background`    | `transparent`                                            | background    | Background color of the status bar.                                             |
| `--phone-notch-width`              | `120px`                                                  | width         | Width of the notch/dynamic island element (modern variant only).                |
| `--phone-notch-height`             | `32px`                                                   | height        | Height of the notch/dynamic island element (modern variant only).               |
| `--phone-notch-border-radius`      | `20px`                                                   | border-radius | Corner rounding of the notch/dynamic island (modern variant only).              |
| `--phone-notch-background`         | `var(--phone-frame-color, black)`                        | background    | Background color of the notch/dynamic island (modern variant only).             |
| `--phone-home-bar-width`           | `134px`                                                  | width         | Width of the bottom home indicator bar (modern variant only).                   |
| `--phone-home-bar-height`          | `5px`                                                    | height        | Height of the bottom home indicator bar (modern variant only).                  |
| `--phone-home-bar-color`           | `#fff`                                                   | background    | Color of the home indicator bar (modern variant only).                          |
| `--phone-home-bar-radius`          | `3px`                                                    | border-radius | Corner rounding of the home indicator bar (modern variant only).                |
| `--phone-home-button-size`         | `50px`                                                   | width, height | Diameter of the classic home button circle (classic variant only).              |
| `--phone-home-button-border-color` | `#555`                                                   | border-color  | Border color of the classic home button circle (classic variant only).          |
| `--phone-side-button-color`        | `var(--phone-frame-color, black)`                        | background    | Color of the decorative side buttons (volume and power).                        |
| `--phone-frame-color`              | `black`                                                  | background    | Background color of the phone frame/bezel.                                      |
| `--phone-content-overflow`         | `hidden`                                                 | overflow      | Overflow behavior of the content area inside the screen.                        |

## Web Component

Tag: `<sui-phone>`

```html
<sui-phone variant="iphone-14" color="black">
  <div>Screen content</div>
</sui-phone>
```

### Slots

| Slot Name   | Maps to Snippet | Description                               |
| ----------- | --------------- | ----------------------------------------- |
| _(default)_ | `children`      | Content rendered inside the phone screen. |
