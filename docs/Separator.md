# Separator

A visual divider between content — a thin line that runs either the full width of its container (`horizontal`) or the full height (`vertical`). Most separators are purely decorative (spacing between unrelated blocks) and stay out of the accessibility tree entirely; set `decorative={false}` for the rarer case where the line actually demarcates two meaningful sections (e.g. two groups inside a menu), and it takes `role="separator"` instead.

## Usage

```svelte
<script>
  import { Separator } from '@juspay/svelte-ui-components';
</script>

<p>Section one</p>
<Separator />
<p>Section two</p>
```

### Vertical, between side-by-side content

```svelte
<div style="display: flex; align-items: center; gap: 12px; height: 24px;">
  <span>Edit</span>
  <Separator orientation="vertical" />
  <span>Duplicate</span>
  <Separator orientation="vertical" />
  <span>Delete</span>
</div>
```

### Non-decorative, meaningful boundary

```svelte
<div role="menu">
  <div role="menuitem">Cut</div>
  <div role="menuitem">Copy</div>
  <Separator decorative={false} />
  <div role="menuitem">Delete</div>
</div>
```

## Props

| Prop        | Type                         | Required | Default        | Description                                                                                                                                                                                    |
| ----------- | ---------------------------- | -------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orientation | `'horizontal' \| 'vertical'` | No       | `'horizontal'` | Axis the dividing line runs across. `'horizontal'` renders a full-width line; `'vertical'` renders a full-height line.                                                                         |
| decorative  | `boolean`                    | No       | `true`         | Whether the separator is purely visual. `true` (default) hides it from assistive technology and gives it no ARIA role. `false` gives it `role="separator"` with a matching `aria-orientation`. |
| testId      | `string`                     | No       | `-`            | Value for the `data-pw` attribute on the separator element, used for Playwright selectors.                                                                                                     |
| classes     | `string`                     | No       | `-`            | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                         |

## Accessibility

Only a meaningful separator belongs in the accessibility tree. By default (`decorative={true}`) the element carries `aria-hidden="true"` and no `role` — a screen reader skips it entirely, exactly as it would a plain spacing gap. Set `decorative={false}` when the line actually separates two distinct semantic groups (for example, two clusters of menu items); the element then takes `role="separator"` and, when vertical, `aria-orientation="vertical"` (horizontal is the ARIA default for the role and is left implicit, matching how `Tabs` handles the same orientation elsewhere in this library).

`data-orientation` is always emitted (`"horizontal"` or `"vertical"`, regardless of `decorative`), so styling can target orientation directly: `.my-divider[data-orientation="vertical"] { ... }`.

## CSS Variables

Override these custom properties to theme the component.

| Variable                 | Default   | CSS Property | Description                                                                                      |
| ------------------------ | --------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `--separator-background` | `#e0e0e0` | background   | Color of the dividing line.                                                                      |
| `--separator-thickness`  | `1px`     | width/height | Thickness of the line — its `height` when horizontal, its `width` when vertical.                 |
| `--separator-length`     | `100%`    | width/height | Length of the line along its own axis — its `width` when horizontal, its `height` when vertical. |
| `--separator-margin`     | `0`       | margin       | Margin around the separator.                                                                     |

## Web Component

Tag: `<sui-separator>`

```html
<sui-separator></sui-separator> <sui-separator orientation="vertical"></sui-separator>
```

`decorative` defaults to `true`. Like any boolean custom-element attribute, its
presence — regardless of the string value, so `decorative="false"` still means
`true` — is what turns it on; there is no attribute spelling for "off" when
the default is already `true`. Set it via the JS property instead:

```js
document.querySelector('sui-separator').decorative = false;
```
