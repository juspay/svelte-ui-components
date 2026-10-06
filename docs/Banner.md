# Banner

A notification banner with optional icon snippet, text content, inline link text, right content slot, and a dismissible close button. Supports click interaction with keyboard accessibility (Enter/Space triggers click, `role="button"` + `tabindex` added automatically when `onclick` is provided). Uses a `slide` transition when showing/hiding. The `visible` prop is bindable for two-way dismiss state control. Good for promotional messages, alerts, or announcements.

## Usage

```svelte
<script>
  import { Banner } from '@juspay/svelte-ui-components';
</script>

<Banner
  text="New version available"
  linkText="Update now"
  dismissible
  onclick={() => console.log('banner clicked')}
  ondismiss={() => console.log('dismissed')}
/>
```

### With Custom Icon

```svelte
<Banner text="Deployment successful">
  {#snippet icon()}
    <svg>...</svg>
  {/snippet}
</Banner>
```

### With Right Content

```svelte
<Banner text="Trial ends in 3 days">
  {#snippet rightContent()}
    <button>Upgrade</button>
  {/snippet}
</Banner>
```

### With Title Snippet

```svelte
<Banner text="Your cart was abandoned 2 hours ago.">
  {#snippet title()}
    <strong>Don't forget your items</strong>
  {/snippet}
</Banner>
```

### Pushing Right Content to the End

The banner is a flex row. By default the icon, text and right content sit together, centred (see `--banner-justify-content`), and the dismiss button follows them. Set `--banner-right-margin-left: auto` and the slot's left margin takes all the spare width in the row, so the icon and text pack at the start and the slot and the dismiss button sit at the end:

```css
/* app.css */
.banner-trailing {
  --banner-right-margin-left: auto;
}
```

```svelte
<Banner text="Trial ends in 3 days" classes="banner-trailing">
  {#snippet rightContent()}
    <button>Upgrade</button>
  {/snippet}
</Banner>
```

When it has an effect, and when it does not:

- It needs spare width. The default `--banner-width: 100%` is as wide as its container, so a banner wider than its content has spare width; one that is already full has none and does not move.
- An auto margin takes the spare width before `justify-content` distributes it, so with the slot present `--banner-justify-content` no longer moves the row.
- It acts on the slot only. A banner with no `rightContent` has no slot, so the token does nothing there and the dismiss button stays where it was.
- It is the physical left margin. In a right-to-left row it lies between the slot and the dismiss button, so `auto` keeps the slot against the text and sends the dismiss button to the end.
- A length (`24px`) is added to the gap between the text and the slot rather than pushing anything to the end.
- In a vertical writing mode (`writing-mode: vertical-rl` or `vertical-lr`) the row runs top to bottom and the left margin lies across it, so `auto` moves the slot to the right edge of the banner instead of to the end of the row. The dismiss button does not move.

How the token ranks against your own CSS:

- Your CSS wins. The declaration has no specificity, so a margin your CSS already sets on `.banner-right` keeps applying whichever stylesheet loads first, and with the token set, a rule of yours on the slot's left margin still beats it. A margin reset is such a rule: `* { margin: 0 }` or `:where(*) { margin: 0 }` loaded after the library's stylesheet ties the token at zero specificity and comes later, so the slot keeps a left margin of 0 and `auto` does nothing. `html * { margin: 0 }` does the same wherever it is loaded.
- To keep a reset and use the token, write the reset inside a cascade layer (`@layer reset { * { margin: 0 } }`), which an unlayered declaration beats whatever its specificity or position. A reset with no specificity (`*`, `:where(*)`) also works when it is loaded before the library's stylesheet.
- Unset, the token gives itself up (`revert-layer`), so the slot keeps the margin your own CSS gives `.banner-right`, and none otherwise; a rule of yours inside an `@layer` still applies. The layout is the one you had before the token existed, with one exception. An unlayered rule with no specificity (a selector made only of `*` and `:where(...)`, such as `*` or `:where(.banner-right)`) that sets a non-zero left margin on `.banner-right`, as `margin-left`, a `margin` shorthand or `margin-inline-start` in a left-to-right row, and is loaded before the library's stylesheet, no longer applies: `revert-layer` rolls the slot's left margin back past the whole unlayered level, which discards this rule with it, so the slot gets 0. Load that rule after the library's stylesheet, or give it a selector with specificity (`.banner-right { margin-left: 8px }`), and it applies as before.

### Consumer Theming via `classes` (error + compact variant)

No tone enum is needed — define the variant in your app's CSS and pass it through `classes`:

```css
/* app.css */
.banner-error {
  --banner-background: #fff0f0;
  --banner-color: #c0392b;
  --banner-border: 1px solid #e74c3c;
  --banner-border-radius: 6px;
}

.banner-compact {
  --banner-padding: 6px 12px;
}
```

```svelte
<Banner
  text="Payment failed. Please try again."
  classes="banner-error banner-compact"
  role="alert"
/>
```

## Props

| Prop               | Type             | Required | Default | Description                                                                                                                                                                                                                    |
| ------------------ | ---------------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| text               | `string`         | No       | `''`    | The main banner message text (or pass `children` instead).                                                                                                                                                                     |
| children           | `Snippet`        | No       | `-`     | The message as markup, rendered as the body in place of `text`/`linkText`. See the Snippets table below.                                                                                                                       |
| icon               | `Snippet`        | No       | `-`     | Svelte 5 Snippet for a custom icon displayed to the left of the text.                                                                                                                                                          |
| title              | `Snippet`        | No       | `-`     | Optional Snippet rendered above the main text inside a `banner-body` flex column. When omitted the layout is identical to today.                                                                                               |
| linkText           | `string`         | No       | `-`     | Optional link text appended inline after the main text, styled in a different color (blue by default).                                                                                                                         |
| dismissible        | `boolean`        | No       | `false` | Whether to show a close/dismiss button on the right side of the banner.                                                                                                                                                        |
| visible            | `boolean`        | No       | `true`  | Bindable. Controls whether the banner is visible. When `dismissible` is true, clicking the dismiss button sets this to `false`. Supports two-way binding via `bind:visible`.                                                   |
| role               | `string \| null` | No       | `null`  | ARIA role override. When provided, this value is used verbatim instead of the automatic `"button"` role that is added when `onclick` is present. Use `role="alert"` for error banners that should announce to screen readers.  |
| testId             | `string`         | No       | `-`     | Value for the `data-pw` attribute on the banner container. The dismiss button gets `{testId}-dismiss`. Used for Playwright selectors.                                                                                          |
| classes            | `string`         | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles (see example above).                                     |
| transitionDuration | `number \| null` | No       | `300`   | Duration (ms) of the show/hide `slide` transition. A CSS custom property can't reach a Svelte transition directive's parameters, so this prop is the motion-token equivalent — see `DESIGN_PRINCIPLES.md`'s motion convention. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet      | Type      | Description                                                                                                                              |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| icon         | `Snippet` | Custom icon content displayed to the left of the text. Rendered inside a flex container with configurable size via `--banner-icon-size`. |
| title        | `Snippet` | Optional heading rendered above the main text. Controlled via `--banner-title-font-weight` and `--banner-body-gap`.                      |
| children     | `Snippet` | The message as markup (a sentence with a link, or a sentence and a button), rendered as the body in place of `text`/`linkText`.          |
| rightContent | `Snippet` | Custom content on the right side of the banner, before the dismiss button.                                                               |
| dismissIcon  | `Snippet` | Custom icon for the dismiss button. Defaults to a built-in close (X) SVG.                                                                |

## Events

| Event     | Type                          | Description                                                                                                                                                           |
| --------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick   | `(event: MouseEvent) => void` | Fires when anywhere on the banner is clicked. When provided, the banner becomes interactive with `role="button"`, `tabindex="0"`, and keyboard support (Enter/Space). |
| ondismiss | `() => void`                  | Fires after the banner is dismissed (visible set to false). The click event is stopped from propagating to the banner's onclick handler.                              |

## CSS Variables

Override these custom properties to theme the component.

| Variable                            | Default              | CSS Property     | Description                                                                                                                    |
| ----------------------------------- | -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--banner-width`                    | `100%`               | width            | Width of the banner.                                                                                                           |
| `--banner-height`                   | `-`                  | height           | Height of the banner.                                                                                                          |
| `--banner-text-overflow`            | `hidden`             | overflow         | Overflow behaviour of the banner text.                                                                                         |
| `--banner-text-ellipsis`            | `ellipsis`           | text-overflow    | Text truncation style of the banner text.                                                                                      |
| `--banner-white-space`              | `nowrap`             | white-space      | Whether the banner text wraps.                                                                                                 |
| `--banner-right-flex-shrink`        | `0`                  | flex-shrink      | Whether the right-hand content may shrink (and wrap inside itself) when the row is narrow.                                     |
| `--banner-right-margin-left`        | `-`                  | margin-left      | Left margin of the right content slot. `auto` pushes the slot, and the dismiss button after it, to the end of the row.         |
| `--banner-padding`                  | `10px 12px`          | padding          | Inner padding of the banner.                                                                                                   |
| `--banner-gap`                      | `8px`                | gap              | Gap between banner content elements (icon, text, right content, dismiss).                                                      |
| `--banner-justify-content`          | `center`             | justify-content  | Horizontal alignment of banner content.                                                                                        |
| `--banner-background`               | `#f0f4f8`            | background-color | Background color of the banner.                                                                                                |
| `--banner-color`                    | `#4d6174`            | color            | Text color of the banner.                                                                                                      |
| `--banner-font-family`              | `inherit`            | font-family      | Font family of the banner text.                                                                                                |
| `--banner-font-size`                | `14px`               | font-size        | Font size of the banner text.                                                                                                  |
| `--banner-font-weight`              | `500`                | font-weight      | Font weight of the banner text.                                                                                                |
| `--banner-line-height`              | `1.3`                | line-height      | Line height of the banner text.                                                                                                |
| `--banner-border-bottom`            | `none`               | border-bottom    | Bottom border of the banner.                                                                                                   |
| `--banner-border`                   | `-`                  | border           | Full border shorthand. Overrides `--banner-border-bottom` when set.                                                            |
| `--banner-border-radius`            | `var(--radius, 4px)` | border-radius    | Corner radius of the banner. Use with `--banner-border` for card-style notifications.                                          |
| `--banner-cursor`                   | `pointer`            | cursor           | Cursor style when hovering the banner.                                                                                         |
| `--banner-position`                 | `sticky`             | position         | CSS position of the banner (sticky sticks to viewport on scroll).                                                              |
| `--banner-top`                      | `0`                  | top              | Top position of the banner.                                                                                                    |
| `--banner-z-index`                  | `100`                | z-index          | Z-index stacking order of the banner.                                                                                          |
| `--banner-icon-color`               | `currentColor`       | color            | Color of the icon container.                                                                                                   |
| `--banner-icon-size`                | `18px`               | width, height    | Width and height of SVGs inside the icon snippet.                                                                              |
| `--banner-body-gap`                 | `0`                  | gap              | Vertical gap between the title and text inside `banner-body`. Set to e.g. `4px` to add spacing when using the `title` snippet. |
| `--banner-title-font-weight`        | `inherit`            | font-weight      | Font weight of the title row. Inherits the banner's font-weight by default.                                                    |
| `--banner-link-color`               | `#1d4ed8`            | color            | Color of the inline link text.                                                                                                 |
| `--banner-link-gap`                 | `4px`                | margin-left      | Space between the main text and the link text.                                                                                 |
| `--banner-dismiss-border-radius`    | `4px`                | border-radius    | Border radius of the dismiss button.                                                                                           |
| `--banner-dismiss-color`            | `currentColor`       | color            | Color of the dismiss button icon.                                                                                              |
| `--banner-dismiss-hover-background` | `rgba(0, 0, 0, 0.1)` | background-color | Background color of the dismiss button on hover.                                                                               |
| `--banner-dismiss-size`             | `14px`               | width, height    | Width and height of the dismiss button icon SVG.                                                                               |

## Accessibility

- When `onclick` is provided, the banner gets `role="button"` and `tabindex="0"` for keyboard interaction.
- Use the `role` prop to override the automatic role (e.g. `role="alert"` for error banners that should be announced immediately by screen readers). Pass `role=""` to remove any role.
- Enter and Space keys trigger the banner's click handler.
- The dismiss button has `aria-label="Dismiss"`.
- Uses Svelte's `slide` transition for smooth show/hide animation.

## Internal Dependencies

This component uses the following library components internally:

- Button (for the dismiss button)

## Web Component

Tag: `<sui-banner>`

```html
<sui-banner text="Update available" dismissible>
  <svg slot="icon">...</svg>
  <a slot="right-content" href="/update">Update now</a>
</sui-banner>
```

> **Note:** `children` is exposed as `bodySnippet`, not `children` — every element already
> has a native, getter-only `children` accessor (`HTMLCollection`), so a same-named property
> here would collide with it instead of reaching this component. `bodySnippet` is the only
> way to render body markup through this prop; the default (unnamed) slot is not wired to
> it, so a host with no `bodySnippet` renders through `text`/`linkText` exactly as before
> this prop existed.

The `--banner-right-margin-left` token needs no attribute: custom properties cross the shadow root, so set it on the `<sui-banner>` element or an ancestor. The wrapper always renders the right-content wrapper, even when nothing is slotted, so `auto` also sends the dismiss button to the end of a `<sui-banner>` with no `right-content`.

### Web Component Events

`onclick` is a JS-property callback only (`banner.onclick = (event) => ...`) and does not
dispatch a DOM event: `click` is already `HTMLElement`'s own native event, so a real one already
bubbles out of the shadow root, and a second, synthetic one under the same name would
double-deliver it. `ondismiss` does not collide, so it is also available as a same-named DOM
custom event (bubbles, composed, no detail — the callback itself takes no arguments) for a
consumer who only calls `addEventListener`:

```js
const banner = document.querySelector('sui-banner');
banner.addEventListener('dismiss', () => banner.remove());
```

### Slots

| Slot Name       | Maps to Snippet | Description                                             |
| --------------- | --------------- | ------------------------------------------------------- |
| `icon`          | `icon`          | Icon content rendered at the start of the banner.       |
| `title`         | `title`         | Optional heading rendered above the main text.          |
| `right-content` | `rightContent`  | Content rendered on the right side.                     |
| `dismiss-icon`  | `dismissIcon`   | Custom dismiss/close icon; defaults to the close glyph. |
