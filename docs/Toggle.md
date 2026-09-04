# Toggle

A labeled on/off switch with sliding ball animation. The `checked` prop controls the toggle state and the `onclick` event returns the new boolean state after toggling. The text label can be positioned relative to the switch using CSS order. The checkbox itself is visually hidden, so the label association is what makes the text clickable and gives the control a name: `text` renders as a `<label for>` bound to the input's `id`, and a consumer can bind its own label the same way through `id`, or name a text-less switch with `ariaLabel`. Strictly two-state — for tri-state selection (checked/unchecked/indeterminate, e.g. a "select all" row with mixed children), use `Checkbox` instead.

## Usage

```svelte
<script>
  import { Toggle } from '@juspay/svelte-ui-components';
</script>

<Toggle />
```

## Props

| Prop           | Type      | Required | Default   | Description                                                                                                                                                            |
| -------------- | --------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| checked        | `boolean` | No       | `false`   | The current on/off state of the toggle switch.                                                                                                                         |
| text           | `string`  | No       | `''`      | Label text displayed next to the toggle switch.                                                                                                                        |
| disabled       | `boolean` | No       | `false`   | When true, prevents interaction and applies reduced opacity to indicate the disabled state.                                                                            |
| testId         | `string`  | No       | `-`       | Value for the `data-pw` attribute on the container element, used for Playwright test targeting.                                                                        |
| classes        | `string`  | No       | `-`       | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles. |
| id             | `string`  | No       | generated | Native `id` of the checkbox input. Point your own `<label for>` at it; when omitted an id is generated so the built-in `text` is a real label.                         |
| ariaLabel      | `string`  | No       | `-`       | Names the switch for assistive technology when it has no visible text.                                                                                                 |
| ariaLabelledby | `string`  | No       | `-`       | References a label in the same DOM root as the checkbox.                                                                                                               |

## Events

| Event   | Type                         | Description                                                                                            |
| ------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| onclick | `(checked: boolean) => void` | Fires after the toggle state changes. Receives the new boolean checked value (true = on, false = off). |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                  | Default           | CSS Property       | Description                                                  |
| ----------------------------------------- | ----------------- | ------------------ | ------------------------------------------------------------ |
| `--toggle-container-display`              | `flex`            | display            | Display mode of the toggle container.                        |
| `--toggle-container-align-items`          | `center`          | align-items        | Vertical alignment of switch and label.                      |
| `--toggle-container-gap`                  | `8px`             | gap                | Gap between the switch and label text.                       |
| `--toggle-disabled-opacity`               | `0.4`             | opacity            | Opacity of the toggle when in the disabled state.            |
| `--toggle-text-font-size`                 | `14px`            | font-size          | Font size of the label text.                                 |
| `--toggle-text-font-weight`               | `400`             | font-weight        | Font weight of the label text.                               |
| `--toggle-text-color`                     | `#4a4a4a`         | color              | Color of the label text.                                     |
| `--toggle-text-margin`                    | `0px 8px 0px 0px` | margin             | Margin around the label text.                                |
| `--toggle-text-order`                     | `0`               | order              | Flex order of the label (0 = before switch, higher = after). |
| `--toggle-switch-width`                   | `46px`            | width              | Width of the toggle switch track.                            |
| `--toggle-switch-height`                  | `25px`            | height             | Height of the toggle switch track.                           |
| `--toggle-slider-top`                     | `0`               | top                | Top position of the slider track.                            |
| `--toggle-slider-left`                    | `0`               | left               | Left position of the slider track.                           |
| `--toggle-slider-right`                   | `0`               | right              | Right position of the slider track.                          |
| `--toggle-slider-bottom`                  | `0`               | bottom             | Bottom position of the slider track.                         |
| `--slider-unchecked-color`                | `#ccc`            | background-color   | Background color of the track when unchecked (off).          |
| `--toggle-slider-transition`              | `0.4s`            | -webkit-transition | Transition duration for the sliding animation.               |
| `--toggle-ball-height`                    | `23px`            | height             | Height of the sliding ball/thumb.                            |
| `--toggle-ball-width`                     | `23px`            | width              | Width of the sliding ball/thumb.                             |
| `--toggle-slider-before-left`             | `2px`             | left               | Left position of the ball when unchecked.                    |
| `--toggle-slider-before-bottom`           | `1px`             | bottom             | Bottom position of the ball.                                 |
| `--toggle-slider-before-top`              | `1px`             | top                | Top position of the ball.                                    |
| `--toggle-slider-before-background-color` | `white`           | background-color   | Background color of the ball/thumb.                          |
| `--slider-checked-color`                  | `#2196f3`         | background-color   | Background color of the track when checked (on).             |
| `--slider-border-radius`                  | `23px`            | border-radius      | Corner rounding of the slider track.                         |
| `--slider-border-radius-before`           | `50%`             | border-radius      | Corner rounding of the ball/thumb.                           |

## Web Component

Tag: `<sui-toggle>`

```html
<sui-toggle text="Dark mode" checked></sui-toggle>
```

### Shadow-root label scope

The Svelte component supports an external `<label for={id}>` in the same document.
The web component's checkbox lives inside its shadow root: a light-DOM `<label for>`
cannot activate it, and a light-DOM `aria-labelledby` id cannot name it. For
`<sui-toggle>`, use `text` for a clickable built-in label or `input-aria-label` for a
text-less accessible name. `input-aria-labelledby` is only usable for a label placed
inside that same shadow root; it does not bridge the host document.

The web component exposes `inputId` (`input-id`), `inputAriaLabel`
(`input-aria-label`) and `inputAriaLabelledby` (`input-aria-labelledby`) for the
internal checkbox. Its native `id`, `aria-label` and `aria-labelledby` keep their
host-element meaning; they do not name or identify the shadow input. The Svelte
component continues to use `id`, `ariaLabel` and `ariaLabelledby`.
Blank or whitespace-only input ids fall back to an instance-unique generated id.
Empty or whitespace-only ARIA names/references are omitted so the built-in text
remains the fallback accessible name.

```html
<sui-toggle text="Order notifications"></sui-toggle>
<sui-toggle input-aria-label="Order notifications"></sui-toggle>
```

### Prop names across the two distributions

The three labelling props are deliberately named differently on `<sui-toggle>`,
because `id` and `aria-label` are native accessors of every custom element and a
same-named component prop would replace them; `aria-labelledby` follows the same
`input-*` convention for consistency. Everything else keeps the Svelte name.

| Svelte `<Toggle>` prop                                        | `<sui-toggle>` property | `<sui-toggle>` attribute                            | Reaches                          |
| ------------------------------------------------------------- | ----------------------- | --------------------------------------------------- | -------------------------------- |
| `id`                                                          | `inputId`               | `input-id`                                          | the shadow checkbox `id`         |
| `ariaLabel`                                                   | `inputAriaLabel`        | `input-aria-label`                                  | the shadow checkbox `aria-label` |
| `ariaLabelledby`                                              | `inputAriaLabelledby`   | `input-aria-labelledby`                             | the shadow checkbox reference    |
| `text`, `checked`, `disabled`, `classes`, `testId`, `onClick` | same name               | `text`, `checked`, `disabled`, `classes`, `test-id` | unchanged                        |

Host `id`, `aria-label` and `aria-labelledby` on `<sui-toggle>` stay on the host
element, exactly as they do on any other custom element.
