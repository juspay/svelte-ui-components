# Pill

A small rounded label used for categorization, tagging, or filtering. Supports an optional dismiss button that lets users remove the pill. Text is automatically truncated with an ellipsis when it exceeds the maximum width.

## Usage

```svelte
<script>
  import { Pill } from '@juspay/svelte-ui-components';
</script>

<Pill text={'...'} />
```

> **4.0.0 — the default cursor changed for non-interactive pills.** `--pill-cursor` used to
> default to `pointer` unconditionally, so a purely informational pill (no `onclick`) looked
> clickable. It now defaults to `default`, with `pointer` restored automatically once the pill
> is actually interactive (an `onclick` is supplied, which also sets `role="button"`).
> Consumers relying on the old implicit pointer cursor on a non-interactive pill should set
> `--pill-cursor: pointer` explicitly to keep it. An explicit `--pill-cursor` still wins in
> both cases, and every interactive pill (any pill with `onclick`) is unaffected.

### Theming with Classes

Define variant classes in your app's CSS that set Pill CSS variables, then pass them via the `classes` prop:

```css
/* app.css */
.pill-success {
  --pill-background: #d4edda;
  --pill-color: #155724;
  --pill-hover-background: #c3e6cb;
}

.pill-warning {
  --pill-background: #fff3cd;
  --pill-color: #856404;
  --pill-hover-background: #ffeeba;
}

.pill-error {
  --pill-background: #f8d7da;
  --pill-color: #721c24;
  --pill-hover-background: #f1b0b7;
}

.pill-info {
  --pill-background: #d1ecf1;
  --pill-color: #0c5460;
  --pill-hover-background: #bee5eb;
}
```

```svelte
<Pill text="Active" classes="pill-success" />
<Pill text="Pending" classes="pill-warning" />
<Pill text="Failed" classes="pill-error" />
<Pill text="New" classes="pill-info" />
```

### Theming with `tone`

For the common case of a semantic status chip, `tone` does the same job as the classes
above without a `classes` recipe per call site — set the five `--pill-tone-*` variables
once per theme, then pass `tone` at each call site:

```css
/* app.css */
:root {
  --pill-tone-ok-background: #d4edda;
  --pill-tone-ok-color: #155724;
  --pill-tone-danger-background: #f8d7da;
  --pill-tone-danger-color: #721c24;
}
```

```svelte
<Pill text="Active" tone="ok" />
<Pill text="Failed" tone="danger" />
```

`tone` and `classes` compose: `classes` still owns geometry (padding, font-size, shape),
`tone` owns the semantic color pair. An explicit `--pill-background` / `--pill-color` (set
directly, or via `classes`) always wins over the tone default, so a one-off recolor doesn't
need to fork the tone.

### Dark Theme

Every fallback baked into Pill is a light value (`--pill-background` falls back to `#e0e0e0`,
`--pill-color` to `#333333`, and each `tone` to a pastel pair), so a pill dropped onto a dark
page keeps its light chip until you override the variables.

Theme the **tone** variables at the theme root. These are always safe to set globally — each one
only reaches the pills carrying that tone:

```css
/* app.css */
[data-theme='dark'] {
  --pill-tone-accent-background: #11262e;
  --pill-tone-accent-color: #7dd3fc;
  --pill-tone-ok-background: #10281a;
  --pill-tone-ok-color: #6ee7a8;
  --pill-tone-warn-background: #2e2410;
  --pill-tone-warn-color: #fcd34d;
  --pill-tone-danger-background: #2d1416;
  --pill-tone-danger-color: #fca5a5;
  --pill-tone-muted-background: #252535;
  --pill-tone-muted-color: #9ca3af;
}
```

Those pairs all clear WCAG AA for normal text (5.9:1 at the lowest, `muted`; the rest sit
between 9:1 and 10.6:1). Reusing the light defaults on a dark ground is what fails — `#155724`
on `#252535` is 1.74:1, well under the 4.5:1 floor.

For pills that carry **no** tone, set the base pair — but scope it to the containers those pills
live in, rather than the theme root:

```css
/* app.css — the filter bar and tag row hold untoned pills */
[data-theme='dark'] .filter-bar,
[data-theme='dark'] .tag-row {
  --pill-background: #252535;
  --pill-color: #d1d5db;
  --pill-hover-background: #2f2f45;
  --pill-hover-color: #e5e7eb;
  --pill-dismiss-color: #9ca3af;
  --pill-dismiss-hover-color: #e5e7eb;
}
```

**The scoping is the whole point, and skipping it is easy to do: a global `--pill-background` /
`--pill-color` silently disables `tone`.** Pill resolves colour as
`var(--pill-background, var(--_pill-tone-background, …))`, so an explicit value wins and the tone
layer is never consulted — every `tone="ok"` and `tone="danger"` chip renders in the same neutral
grey as an untoned one, with no error and no visual hint that the prop stopped working. Measured
on a real `tone="ok"` pill:

| | background | color |
| --- | --- | --- |
| tone alone | `#d4edda` | `#155724` |
| tone + a global `--pill-background`/`--pill-color` | `#252535` | `#d1d5db` |

This library's own demo site had exactly that bug: all five tones rendered byte-identical in dark
mode. If you have no convenient container to scope to, exclude the tone classes instead —
`[data-theme='dark'] .pill:not(.tone-accent, .tone-ok, .tone-warn, .tone-danger, .tone-muted)` —
though that couples your stylesheet to Pill's internal class names, so prefer your own containers
where you have them.

The `pill-success` / `pill-warning` / `pill-error` / `pill-info` class recipes in **Theming with
Classes** above are light-only by design: they are example CSS you own once you paste them into
your app, not something Pill ships. If you use them and support a dark theme, give them dark
counterparts the same way — or prefer `tone`, which exists precisely so the colour pair lives in
one themeable place instead of being repeated per call site.

### Interactive Chips (`as="button"`)

By default Pill's root is a `<div>`, and supplying an `onclick` bolts a synthetic
`role="button"` / `tabindex="0"` / keydown shim onto it. That is enough for a plain click
target, but it cannot express a chip that is a real control — a disclosure chip that owns
`aria-expanded`, or a toggle chip that owns `aria-pressed`.

`as="button"` renders a real `<button type="button">` root instead, so focus, activation and
announcement come from the platform rather than an imitation of it:

```svelte
<script>
  import { Pill } from '@juspay/svelte-ui-components';

  let open = $state(false);
  let pinned = $state(false);
</script>

<!-- Disclosure chip -->
<Pill text="Details" as="button" ariaExpanded={open} onclick={() => (open = !open)} />

<!-- Toggle chip -->
<Pill text="Pinned" as="button" ariaPressed={pinned} onclick={() => (pinned = !pinned)} />
```

With a button root Pill emits no `role` and no `tabindex` — adding them on top of native
semantics would duplicate the platform's own activation. `ariaExpanded` and `ariaPressed` are
applied only when the pill is actually interactive (a button root, or a `div` with `onclick`),
since both attributes are meaningless on a plain label.

`disabled` still uses `aria-disabled` rather than the native `disabled` attribute, matching the
`div` root. A natively disabled button drops out of the tab order entirely, so a keyboard user
never reaches it and never learns it is disabled; `aria-disabled` keeps it discoverable while
the click and dismiss handlers stay inert. A button root emits it whether or not an `onclick`
was supplied — it is a real, focusable control either way — whereas a `div` root emits it only
when an `onclick` makes it one.

**`as="button"` and `dismissible` cannot be combined.** A `<button>` may not contain another
button, and a dismissible pill is inherently two controls. Rather than emit invalid markup,
that combination falls back to the `div` root and its shim — the same graceful-degradation rule
`Card` applies to `as="a"` with no `href`. If you need both, render the dismiss control as a
sibling of the pill rather than inside it.

Opting in changes semantics only, not appearance: a button root is neutralised back to the same
computed font, padding, margin, border and height as the equivalent `div`.

### Attribute Passthrough

`attrs` spreads arbitrary `data-*`/`aria-*` attributes onto the pill root — for a consumer
that already keys state off attribute-selector CSS (`[data-state="waiting"]`,
`[data-density="compact"]`) elsewhere in their app, instead of wrapping Pill in an extra
element just to hold the attribute and then styling that wrapper not to disturb layout.

```svelte
<script>
  import { Pill } from '@juspay/svelte-ui-components';
</script>

<!-- data-state drives a CSS rule the app already writes for other components -->
<Pill text="Syncing" attrs={{ 'data-state': 'waiting' }} />
```

`attrs` is applied before Pill's own `class`/`onclick`/`onkeydown`/`role`/`tabindex`/
`aria-disabled`/`data-pw`/`title`/`testID` attributes, so it can only add attributes Pill does
not already manage — it cannot be used to override the click/keyboard/dismiss behavior those
props control. Omitted by default, so existing consumers are unaffected.

## Props

| Prop         | Type      | Required | Default   | Description                                                                                                                                                              |
| ------------ | --------- | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| text         | `string`  | Yes      | `-`       | The label text displayed inside the pill. Long text is truncated with an ellipsis when it exceeds the maximum width.                                                     |
| tone         | `'accent' \| 'ok' \| 'warn' \| 'danger' \| 'muted'` | No | `-` | Semantic tone for a status/category chip. Sets the background/text color from the matching `--pill-tone-{tone}-background` / `--pill-tone-{tone}-color` variables (each with a built-in default). An explicit `--pill-background` / `--pill-color` (set directly, or via `classes`) always wins over the tone default. Omitted by default, which renders exactly as before this prop existed. |
| as           | `'div' \| 'button'` | No | `'div'` | Root element. `'div'` renders exactly as before this prop existed. `'button'` renders a real `<button type="button">`, giving a chip native focus, keyboard activation and announcement instead of the `role="button"`/`tabindex`/keydown shim. Falls back to `'div'` when combined with `dismissible`, since a button may not contain another button. |
| ariaExpanded | `boolean` | No       | `-`       | Expanded state of a disclosure chip, rendered as `aria-expanded`. Applied only when the pill is interactive (a button root, or a div with `onclick`). Web component attribute: `aria-expanded`. |
| ariaPressed  | `boolean` | No       | `-`       | Pressed state of a toggle chip, rendered as `aria-pressed`. Applied only when the pill is interactive. Web component attribute: `aria-pressed`.                          |
| dismissible  | `boolean` | No       | `false`   | When true, shows a small X button after the text that triggers the ondismiss event when clicked. Forces the `div` root — see `as`.                                       |
| dismissLabel | `string`  | No       | `Dismiss` | Accessible name of the dismiss button. Pass a translated string for localised products; blank values fall back to the default. Web component attribute: `dismiss-label`. |
| disabled     | `boolean` | No       | `false`   | When true, the pill appears dimmed (opacity 0.4), shows a not-allowed cursor, and ignores all click and dismiss interactions.                                            |
| testId       | `string`  | No       | `-`       | Value for the data-pw attribute, used for end-to-end testing selectors. The dismiss button receives `{testId}-dismiss`.                                                  |
| title        | `string`  | No       | `-`       | Native HTML tooltip text applied to the pill root. Omitted when not provided.                                                                                            |
| classes      | `string`  | No       | `-`       | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.   |
| attrs        | `Record<string, string>` | No | `-` | Arbitrary attributes (e.g. `data-*`, `aria-*`) spread onto the pill root, for attribute-selector CSS. Applied before Pill's own class/onclick/onkeydown/role/tabindex/aria-disabled/data-pw/title/testID, so it can only add attributes Pill does not already manage. Omit to render no extra attributes. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet     | Type      | Description                                                                                                                                                                                                                                                             |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| leadingIcon | `Snippet` | Content rendered immediately before the text label inside a `<span class="pill-leading-icon">` wrapper. Compose with an icon or small image. Leave accessibility attributes (e.g. `aria-hidden`, `aria-label`) on the icon itself — the wrapper is presentational only. |
| dismissIcon | `Snippet` | Custom icon for the dismiss/close button.                                                                                                                                                                                                                               |

## Events

| Event     | Type                          | Description                                                                                                                                                                          |
| --------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| onclick   | `(event: MouseEvent) => void` | Fires when the pill body is clicked. Does NOT fire when the pill is disabled.                                                                                                        |
| ondismiss | `() => void`                  | Fires when the dismiss button (X) is clicked. Only available when dismissible is true. Does NOT fire when the pill is disabled. The click event does not propagate to the pill body. |

## CSS Variables

Override these custom properties to theme the component.

The dismiss action uses a ghost Button. Its enabled background stays transparent
at rest, hover and press, and the glyph reads `--pill-dismiss-color` and
`--pill-dismiss-hover-color` even under consumer Button-container theme rules.
Consumer disabled colours and keyboard focus indicators remain available.
Keyboard activation of the dismiss button does not activate the pill body.

| Variable                     | Default                                   | CSS Property     | Description                                                               |
| ---------------------------- | ----------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `--pill-background`          | `#e0e0e0`                                 | background-color | Background color of the pill.                                             |
| `--pill-color`               | `#333333`                                 | color            | Text color of the pill label.                                             |
| `--pill-font-size`           | `13px`                                    | font-size        | Font size of the pill text.                                               |
| `--pill-font-weight`         | `500`                                     | font-weight      | Font weight of the pill text.                                             |
| `--pill-font-family`         | `-`                                       | font-family      | Font family of the pill text.                                             |
| `--pill-line-height`         | `1`                                       | line-height      | Line height of the pill text.                                             |
| `--pill-padding`             | `6px 10px`                                | padding          | Inner padding of the pill.                                                |
| `--pill-border-radius`       | `999px`                                   | border-radius    | Corner rounding of the pill (999px creates a fully rounded shape).        |
| `--pill-border`              | `none`                                    | border           | Border style of the pill.                                                 |
| `--pill-gap`                 | `4px`                                     | gap              | Spacing between the text and the dismiss button.                          |
| `--pill-cursor`              | `pointer` when interactive (an `onclick` is supplied), `default` otherwise | cursor | Cursor style when hovering over the pill. A non-interactive pill (no `onclick`) no longer implies it's clickable. |
| `--pill-letter-spacing`      | `normal`                                  | letter-spacing   | Letter spacing of the pill text.                                          |
| `--pill-text-transform`      | `none`                                    | text-transform   | Text transform of the pill text (e.g. `uppercase` for a badge look).      |
| `--pill-width`               | `auto`                                    | width            | Chip width. Set to `100%` to fill a column.                               |
| `--pill-justify-content`     | `center`                                  | justify-content  | Content alignment inside the pill.                                        |
| `--pill-text-align`          | `center`                                  | text-align       | Label alignment.                                                          |
| `--pill-max-width`           | `-`                                       | max-width        | Maximum width of the pill. Text is truncated with ellipsis when exceeded. |
| `--pill-flex-shrink`         | `-`                                       | flex-shrink      | Flex shrink behavior of the pill.                                         |
| `--pill-text-overflow`       | `ellipsis`                                | text-overflow    | How overflowing text is displayed (e.g., ellipsis or clip).               |
| `--pill-text-white-space`    | `nowrap`                                  | white-space      | Whether the pill's text wraps.                                            |
| `--pill-hover-background`    | `var(--pill-background, #d0d0d0)`         | background-color | Background color when hovering over the pill.                             |
| `--pill-hover-color`         | `var(--pill-color, #333333)`              | color            | Text color when hovering over the pill.                                   |
| `--pill-disabled-opacity`    | `0.4`                                     | opacity          | Opacity of the pill when disabled.                                        |
| `--pill-disabled-cursor`     | `not-allowed`                             | cursor           | Cursor style when the pill is disabled.                                   |
| `--pill-dismiss-size`        | `14px`                                    | width, height    | Size of the dismiss button icon (X).                                      |
| `--pill-dismiss-color`       | `currentColor`                            | color            | Color of the dismiss button icon.                                         |
| `--pill-dismiss-hover-color` | `var(--pill-dismiss-color, currentColor)` | color            | Color of the dismiss button icon on hover.                                |
| `--pill-tone-accent-background` | `#d1ecf1`                             | background-color | `tone="accent"` background. Ignored unless `tone` is set; overridden by `--pill-background`. |
| `--pill-tone-accent-color`      | `#0c5460`                             | color            | `tone="accent"` text color. Ignored unless `tone` is set; overridden by `--pill-color`. |
| `--pill-tone-ok-background`     | `#d4edda`                             | background-color | `tone="ok"` background. Ignored unless `tone` is set; overridden by `--pill-background`. |
| `--pill-tone-ok-color`          | `#155724`                             | color            | `tone="ok"` text color. Ignored unless `tone` is set; overridden by `--pill-color`. |
| `--pill-tone-warn-background`   | `#fff3cd`                             | background-color | `tone="warn"` background. Ignored unless `tone` is set; overridden by `--pill-background`. |
| `--pill-tone-warn-color`        | `#856404`                             | color            | `tone="warn"` text color. Ignored unless `tone` is set; overridden by `--pill-color`. |
| `--pill-tone-danger-background` | `#f8d7da`                             | background-color | `tone="danger"` background. Ignored unless `tone` is set; overridden by `--pill-background`. |
| `--pill-tone-danger-color`      | `#721c24`                             | color            | `tone="danger"` text color. Ignored unless `tone` is set; overridden by `--pill-color`. |
| `--pill-tone-muted-background`  | `#f1f1f1`                             | background-color | `tone="muted"` background. Ignored unless `tone` is set; overridden by `--pill-background`. |
| `--pill-tone-muted-color`       | `#6b7280`                             | color            | `tone="muted"` text color. Ignored unless `tone` is set; overridden by `--pill-color`. |
| `--pill-focus-outline`          | `2px solid currentColor`              | outline          | Focus ring shown on the pill when interactive (`role="button"`) and focused via keyboard. |
| `--pill-focus-outline-offset`   | `2px`                                 | outline-offset   | Offset of the focus ring from the pill edge.                              |

## Internal Dependencies

This component uses the following library components internally:

- Button (for the pill container and dismiss action)

## Web Component

Tag: `<sui-pill>`

```html
<sui-pill text="Active" dismissible></sui-pill>
```

`attrs` is object-valued (set as a property, e.g. `el.attrs = { 'data-state': 'waiting' }`),
like Card's.

### Slots

| Slot Name      | Maps to Snippet | Description                                                              |
| -------------- | --------------- | ------------------------------------------------------------------------ |
| `leading-icon` | `leadingIcon`   | Content rendered before the text label (icon, image, or inline element). |
| `dismiss-icon` | `dismissIcon`   | Custom icon for the dismiss/close button; defaults to the close glyph.   |
