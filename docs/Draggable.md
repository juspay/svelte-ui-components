# Draggable

A wrapper that makes its content user-movable via pointer drag or arrow keys. It keeps
the rest of the library layout-agnostic: drop any content inside (a floating `Chat`
panel, a `Modal`, a card) and it becomes repositionable. Dragging updates the bindable
`x`/`y` offset (applied as a `transform: translate()`, so it never affects layout flow),
optionally constrained to a single `axis`, a `handle` sub-element, or the viewport edges.

Position only changes offset, never size — pair with `Resizable` for a panel that's both
movable and resizable.

## Usage

```svelte
<script>
  import { Draggable } from '@juspay/svelte-ui-components';

  let x = $state(0);
  let y = $state(0);
</script>

<Draggable bind:x bind:y bounds="viewport" handle=".drag-handle">
  <div class="drag-handle">⠿ Drag me</div>
  <p>Body content — clicks here don't start a drag.</p>
</Draggable>
```

## Props

| Prop      | Type                    | Required | Default          | Description                                                                 |
| --------- | ----------------------- | -------- | ---------------- | ----------------------------------------------------------------------------|
| x         | `number`                | No       | `0`               | Bindable. Horizontal offset in px.                                          |
| y         | `number`                | No       | `0`               | Bindable. Vertical offset in px.                                            |
| axis      | `'both'\|'x'\|'y'`      | No       | `'both'`          | Constrain dragging to one axis.                                             |
| handle    | `string`                | No       | `-`               | CSS selector; only pointer-downs inside a matching descendant start a drag. Unset: the whole element is draggable except native interactive elements (`input`, `button`, `a`, ...). |
| bounds    | `'viewport'\|null`      | No       | `null`            | Clamp dragging so the element's bounding box never leaves the viewport.     |
| disabled  | `boolean`               | No       | `false`           | Disable drag and keyboard movement.                                         |
| step      | `number`                | No       | `16`              | Pixels per arrow-key press (keyboard move).                                 |
| dragLabel | `string`                | No       | `'Drag to move'`  | Aria-label for the draggable element.                                       |
| children  | `Snippet`                | No       | `-`               | The content to make draggable.                                              |
| testId    | `string`                | No       | `-`               | `data-pw` on the root element.                                              |
| classes   | `string`                | No       | `-`               | Class string on the root element.                                          |

## Events

| Event       | Type                                | Description                              |
| ----------- | ------------------------------------ | ---------------------------------------- |
| onmovestart | `(position: { x, y }) => void`      | Fires when a drag/keyboard move begins.  |
| onmove      | `(position: { x, y }) => void`      | Fires continuously during a move.        |
| onmoveend   | `(position: { x, y }) => void`      | Fires when a pointer drag ends.          |

## Keyboard Interactions

The element itself is focusable. Focus it and move with the keyboard:

| Key                                              | Action                          |
| ------------------------------------------------- | -------------------------------- |
| `Arrow Left` / `Arrow Right`                      | Adjust `x` by `step` px (unless `axis="y"`). |
| `Arrow Up` / `Arrow Down`                         | Adjust `y` by `step` px (unless `axis="x"`). |

Movement is clamped by `bounds` the same way pointer dragging is.

## Accessibility

The root element is a focusable (`tabindex`) region with an `aria-label` (`dragLabel`,
default `'Drag to move'`) so assistive technology announces it as a movable control.
Hidden from interaction (`tabindex="-1"`) when `disabled`. When no `handle` is given,
pointer-downs on native interactive descendants (`input`, `textarea`, `select`,
`button`, `a`, `[contenteditable]`) never start a drag, so nested controls stay usable.

## Type Reference

```ts
type DragAxis = 'both' | 'x' | 'y';
type DragBounds = 'viewport' | null;
type DragPosition = { x: number; y: number };
```

## CSS Variables

| Variable                          | Default              | CSS Property | Description                       |
| ---------------------------------- | --------------------- | ------------- | ---------------------------------- |
| `--draggable-width`               | `fit-content`         | width         | Root element width.                |
| `--draggable-height`              | `fit-content`         | height        | Root element height.               |
| `--draggable-cursor`              | `grab`                | cursor        | Cursor when idle.                  |
| `--draggable-cursor-active`       | `grabbing`            | cursor        | Cursor while actively dragging.    |
| `--draggable-focus-outline`       | `2px solid #3b5bdb`   | outline       | Focus ring when keyboard-focused.  |
| `--draggable-focus-outline-offset`| `2px`                 | outline-offset| Focus ring offset.                 |

## Web Component

Tag: `<sui-draggable>`

```html
<sui-draggable x="0" y="0" bounds="viewport"></sui-draggable>
```

Set `.handle` and the drag callbacks via JavaScript.
