# Resizable

A wrapper that makes its content user-resizable via drag handles on the edges/corners you choose. It keeps the rest of the library layout-agnostic: drop any content (a `Chat` panel, a `Modal`, an image, a card) inside and pick which `handles` to expose. Dragging updates the bindable `width`/`height` (clamped to min/max), so the size is observable and persistable. Each handle is a focusable WAI-ARIA splitter — arrow keys resize by `step`, with `role="separator"`, `aria-orientation`, and `aria-valuenow/min/max`.

Resize only changes size, never position — so the handle edges you pick should match how the element is anchored (a bottom-right floating panel resizes from its top-left; a left-docked panel from its right edge).

## Usage

```svelte
<script>
  import { Resizable } from '@juspay/svelte-ui-components';

  let width = $state(420);
  let height = $state(600);
</script>

<Resizable bind:width bind:height minWidth={320} maxWidth={680} handles={['right', 'bottom', 'bottom-right']}>
  <!-- any content; give it height: 100% to fill -->
  <Chat {messages} onsend={onsend} />
</Resizable>
```

## Props

| Prop        | Type           | Required | Default            | Description                                                                 |
| ----------- | -------------- | -------- | ------------------ | --------------------------------------------------------------------------- |
| width       | `number\|null` | No       | `null`             | Bindable. Width in px. `null` until first resize (adopts the rendered size).|
| height      | `number\|null` | No       | `null`             | Bindable. Height in px.                                                      |
| minWidth    | `number`       | No       | `0`                | Minimum width in px.                                                         |
| maxWidth    | `number`       | No       | `Infinity`         | Maximum width in px.                                                         |
| minHeight   | `number`       | No       | `0`                | Minimum height in px.                                                        |
| maxHeight   | `number`       | No       | `Infinity`         | Maximum height in px.                                                        |
| handles     | `ResizeEdge[]` | No       | `['bottom-right']` | Which handles to render: `top`, `right`, `bottom`, `left`, `top-left`, `top-right`, `bottom-left`, `bottom-right`. |
| step        | `number`       | No       | `16`               | Pixels per arrow-key press (keyboard resize).                               |
| disabled    | `boolean`      | No       | `false`            | Hide handles and disable resizing.                                          |
| handleLabel | `string`       | No       | `'Resize'`         | Aria-label for the handles.                                                  |
| children    | `Snippet`      | No       | `-`                | The content to make resizable.                                              |
| testId      | `string`       | No       | `-`                | `data-pw` on the root element.                                              |
| classes     | `string`       | No       | `-`                | Class string on the root element.                                          |

## Events

| Event         | Type                                       | Description                              |
| ------------- | ------------------------------------------ | ---------------------------------------- |
| onresize      | `(size: { width, height }) => void`        | Fires continuously during a resize.      |
| onresizestart | `(size: { width, height }) => void`        | Fires when a drag/keyboard resize begins.|
| onresizeend   | `(size: { width, height }) => void`        | Fires when a drag resize ends.           |

## Keyboard Interactions

Each handle is a focusable splitter. Focus one and resize with the keyboard:

| Key                          | Action                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| `Arrow Left` / `Arrow Right` | Adjust width by `step` px (on handles that control width).         |
| `Arrow Up` / `Arrow Down`    | Adjust height by `step` px (on handles that control height).       |

All changes are clamped to `minWidth`/`maxWidth` and `minHeight`/`maxHeight`.

## Accessibility

Handles follow the WAI-ARIA **window splitter** pattern: each is `role="separator"`, focusable (`tabindex`), with `aria-orientation` and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` reflecting the current/allowed size, and an `aria-label` (`handleLabel`, default `'Resize'`). Hidden entirely when `disabled`.

## Type Reference

```ts
type ResizeEdge = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type ResizeSize = { width: number; height: number };
```

## CSS Variables

| Variable                                  | Default              | CSS Property | Description                              |
| ----------------------------------------- | -------------------- | ------------ | ---------------------------------------- |
| `--resizable-max-width`                   | `none`               | max-width    | Caps the rendered width (e.g. to fit a container/viewport); the bound `width` is clamped to it visually. |
| `--resizable-max-height`                  | `none`               | max-height   | Caps the rendered height regardless of `height`. |
| `--resizable-transition`                  | `none`               | transition   | Transition for programmatic size changes (e.g. an expand/collapse animation). Automatically suppressed while the user is actively drag-resizing and under `prefers-reduced-motion: reduce`. |
| `--resizable-edge-size`                   | `8px`                | width/height | Hit-area thickness of edge handles.      |
| `--resizable-corner-size`                 | `14px`               | width/height | Hit-area size of corner handles.         |
| `--resizable-handle-color`                | `transparent`        | background   | Handle fill (set to make handles visible).|
| `--resizable-handle-z-index`              | `2`                  | z-index      | Stacking order of edge handles.          |
| `--resizable-corner-z-index`             | `3`                  | z-index      | Stacking order of corner handles.        |
| `--resizable-handle-focus-outline`        | `2px solid #3b5bdb`  | outline      | Focus ring on a keyboard-focused handle. |
| `--resizable-handle-focus-outline-offset` | `-2px`               | outline-offset | Focus ring offset.                     |

## Web Component

Tag: `<sui-resizable>`

```html
<sui-resizable width="420" height="600" min-width="320"></sui-resizable>
```

Set `.handles` and the resize callbacks via JavaScript.
