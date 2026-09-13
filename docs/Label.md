# Label

A form label that renders a real `<label>` element. Pass `for` with the id of the control it names, and the native label/control association takes over: clicking anywhere on the label text focuses (and, for a checkbox/radio, activates) that control, with no click handler of your own required. An optional `required` marker shows a visual asterisk while also announcing "required" to assistive technology, rather than relying on the asterisk glyph alone.

## Usage

```svelte
<script>
  import { Label, Input } from '@juspay/svelte-ui-components';
</script>

<Label for="email">Email address</Label>
<input id="email" type="email" />
```

### Required field

```svelte
<Label for="name" required>Full name</Label>
<input id="name" required />
```

### Wrapping the control (implicit association)

```svelte
<Label>
  <input type="checkbox" />
  Subscribe to updates
</Label>
```

## Props

| Prop     | Type      | Required | Default | Description                                                                                                                                                                                                                                               |
| -------- | --------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| for      | `string`  | No       | `-`     | Id of the form control this label names, rendered as the real `for` attribute. Omit it when the label wraps its control directly instead (implicit association), or names no control at all.                                                              |
| required | `boolean` | No       | `false` | Shows a visual asterisk after the label content. The asterisk itself is `aria-hidden` — a visually-hidden `"required"` string is rendered alongside it so screen readers announce the requirement instead of reading (or silently skipping) a bare glyph. |
| children | `Snippet` | No       | `-`     | The label's text/content.                                                                                                                                                                                                                                 |
| testId   | `string`  | No       | `-`     | Value for the `data-pw` attribute on the label element, used for Playwright selectors.                                                                                                                                                                    |
| classes  | `string`  | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                    |

## Accessibility

The root element is a real `<label>`, not a styled `<span>` or `<div>` — that's what gives it the browser's native label behavior for free: a click anywhere on it focuses the associated control, and for a checkbox or radio also toggles it, exactly as clicking the control itself would. Set `for` to the control's `id` for an explicit association, or wrap the control directly inside the label for an implicit one; either is a real native association, not something reimplemented in JavaScript.

`required` renders two things, not one: a visible `*` marked `aria-hidden="true"` (so it isn't read as the literal word "asterisk" or silently dropped, depending on the screen reader), and a visually-hidden `"required"` string next to it that assistive technology does read. A sighted user sees the familiar asterisk; a screen-reader user hears "required" spoken as part of the label's accessible name — the marker is announced, not only shown.

## CSS Variables

Override these custom properties to theme the component.

| Variable                     | Default       | CSS Property | Description                                            |
| ---------------------------- | ------------- | ------------ | ------------------------------------------------------ |
| `--label-display`            | `inline-flex` | display      | Display mode of the label root.                        |
| `--label-align-items`        | `center`      | align-items  | Cross-axis alignment of the label content and marker.  |
| `--label-gap`                | `4px`         | gap          | Gap between the label content and the required marker. |
| `--label-font-size`          | `14px`        | font-size    | Font size of the label text.                           |
| `--label-font-weight`        | `500`         | font-weight  | Font weight of the label text.                         |
| `--label-color`              | `#333`        | color        | Text color of the label.                               |
| `--label-font-family`        | `inherit`     | font-family  | Font family of the label text.                         |
| `--label-cursor`             | `pointer`     | cursor       | Cursor shown when hovering the label.                  |
| `--label-required-color`     | `#d32f2f`     | color        | Color of the visible required asterisk.                |
| `--label-required-font-size` | `inherit`     | font-size    | Font size of the visible required asterisk.            |

## Web Component

Tag: `<sui-label>`

```html
<sui-label>Email address</sui-label> <sui-label required>Full name</sui-label>
```

### `for` does not cross the shadow boundary

`for` is accepted and reflected, but through `<sui-label>` it cannot associate
anything. A `<label for>` resolves its control **within its own tree**, and the
real `<label>` lives inside this element's shadow root while the control it
names sits outside it. The id never resolves, no association is formed, and
nothing reports an error — clicking the label does not focus the control and a
screen reader announces the control unlabelled.

```html
<!-- Does nothing. #email is in the document; the <label> is in a shadow root. -->
<sui-label for="email">Email address</sui-label>
<input id="email" />
```

Wrapping does not rescue it either: light-DOM children are slotted, so they are
children of the host rather than descendants of the shadow `<label>`, and
implicit association also requires one tree.

**Use the control's own labelling instead.** `<sui-input>`, `<sui-toggle>`,
`<sui-checkbox>` and `<sui-radio>` each expose a built-in label or an
`input-aria-label` attribute, and both ends of those live inside one shadow
root, so they associate correctly:

```html
<sui-input input-aria-label="Email address" type="email"></sui-input>
<sui-toggle text="Dark mode"></sui-toggle>
```

`<sui-label>` remains useful for text that labels nothing programmatically —
a section heading above a group, or a caption — and for the Svelte build, where
`for` works normally because the label and control share a tree.

The same rule governs every ARIA IDREF (`aria-describedby`, `aria-labelledby`,
`aria-controls`, `aria-activedescendant`): they resolve in one tree and fail
silently across a shadow boundary. The library's own `describeField` contract is
unaffected because both of its ends are inside the same shadow root.
