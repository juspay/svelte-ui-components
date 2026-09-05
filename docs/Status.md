# Status

A full-screen status display with a centered icon image, title text, description text, and an optional action Button. Uses backdrop-filter blur for visual effect. Ideal for order success/failure screens.

The `statusDescription` string is rendered with `{@html}`, so a caller can pass its own trusted markup. For a description that comes from an API, a user, or anywhere else the caller does not control, use the `descriptionSnippet` snippet instead — it renders the text escaped.

## Usage

```svelte
<script>
  import { Status } from '@juspay/svelte-ui-components';
</script>

<Status />
```

## Props

| Prop               | Type                                                    | Required | Default                          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------- | -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| statusIcon         | `string`                                                | No       | `'icons/order-success-icon.svg'` | URL of the status icon image displayed at the center (e.g., success checkmark, error cross). The default is unchanged and is a **relative** URL, resolved against the page rendering the component — the library ships no such file, so it points at something real only for an app serving that path at its own root, and resolves to `<route>/icons/order-success-icon.svg` anywhere deeper. When that request fails, a built-in inlined checkmark is rendered instead, so the default no longer shows a broken image. The fallback applies only to this default: an icon you pass yourself is never replaced, since answering a failed failure-icon with a success checkmark would be worse than showing nothing. |
| statusIconAlt      | `string`                                                | No       | `'status'`                       | Accessible name for the `statusIcon` image. Deliberately generic by default, because the same icon shape serves success and failure screens. Set it to what the screen means, or to `''` to mark the icon decorative when `statusText` already carries the meaning.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| statusText         | `string`                                                | No       | `''`                             | Main status title text (e.g., 'Order Successful', 'Payment Failed').                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| statusTextTag      | `'div' \| 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6'` | No       | `'div'`                          | Element `statusText` renders as. Set to a heading tag when `statusText` is a real page/section heading — only then does it pick up an app's semantic-tag typography (size, weight, colour) and join the document outline for assistive tech. The default `div` renders exactly as before.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| statusDescription  | `string`                                                | No       | `''`                             | Description text below the title. Supports HTML content (rendered via {@html}).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| buttonProperties   | `ButtonProperties`                                      | No       | `-`                              | Optional ButtonProperties object for an action button below the description (e.g., 'Try Again', 'Go Home').                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| classes            | `string`                                                | No       | `-`                              | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| icon               | `Snippet`                                               | No       | `-`                              | Custom media rendered in place of the `statusIcon` image. Takes priority over `statusIcon`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| descriptionSnippet | `Snippet`                                               | No       | `-`                              | Replaces the `statusDescription` string at render time and escapes its content. Takes priority over `statusDescription`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| children           | `Snippet`                                               | No       | `-`                              | Action area rendered below the description, outside `.status-description` and its padding.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| testId             | `string`                                                | No       | `-`                              | Value applied to the `data-pw` attribute on the root element for test selection.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Events

| Event         | Type         | Description                                                                |
| ------------- | ------------ | -------------------------------------------------------------------------- |
| onbuttonclick | `() => void` | Fires when the action button (configured via buttonProperties) is clicked. |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet            | Type      | Description                                                                                                                                       |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| icon               | `Snippet` | Media rendered in place of the default `statusIcon` image — e.g. a `LottiePlayer` for animated success/failure/in-progress states.                |
| descriptionSnippet | `Snippet` | Rich-markup or escaped-text override for the description area. When provided it takes full rendering priority over `statusDescription`.           |
| children           | `Snippet` | Action area below the description — buttons, links, a countdown. Rendered outside `.status-description`, alongside the `buttonProperties` button. |

### Rendering a description you do not control

`statusDescription` is interpolated with `{@html}`. That is the right tool when the
caller owns the markup, and the wrong one for a message that arrives from an API or a
user — such a string would be parsed as markup. `descriptionSnippet` renders the same
value through ordinary Svelte interpolation, which escapes it:

```svelte
<script>
  import { Status } from '@juspay/svelte-ui-components';

  // e.g. the `message` field of an API response
  let { message } = $props();
</script>

<Status statusText="Installation failed" statusDescription="">
  {#snippet descriptionSnippet()}{message}{/snippet}
</Status>
```

## CSS Variables

Override these custom properties to theme the component.

| Variable                          | Default                    | CSS Property     | Description                                                                                                                                                            |
| --------------------------------- | -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--status-min-height`             | `100vh`                    | min-height       | Minimum height of the `.background` container. Controls the overall height of the status screen.                                                                       |
| `--status-font-weight`            | `600`                      | font-weight      | Font weight of the status title text. Used with different fallbacks: `600` on status text and `400` on description.                                                    |
| `--status-description-font-color` | `#2f3841`                  | color            | Color of the description text. Used with different fallbacks: `#2f3841` on status text and `#436484cc` on the description paragraph.                                   |
| `--status-icon-color`             | `inherit`                  | color            | Color applied to `.status-image`, the container around the status icon (`icon` snippet or the default `<Img>`). Inline SVG content using `currentColor` picks this up. |
| `--order-font`                    | `inherit`                  | font-family      | Font family for the status text.                                                                                                                                       |
| `--order-font-size`               | `14px`                     | font-size        | Font size for the status text.                                                                                                                                         |
| `--status-panel-background`       | `rgba(255, 255, 255, 0.6)` | background-color | Background of the inner status panel, applied only where `backdrop-filter` is supported. Set to `transparent` when embedding the component inside an existing page.    |
| `--status-panel-backdrop-filter`  | `blur(60px)`               | backdrop-filter  | Backdrop filter on the inner status panel. Set to `none` alongside `--status-panel-background` to remove the frosted panel entirely.                                   |

### Dark theme

`--status-description-font-color` and `--status-panel-background` default to fixed
light-mode literals (a dark-on-light text color, a translucent white panel).
`--status-icon-color` defaults to `inherit`, which is not theme-neutral either —
with no ancestor setting `color`, it resolves to the browser's default black text
color. None of the three defaults adapts to a surrounding dark theme, and nothing
fails when they don't: an app that defines none of them gets light-themed status
text, icon, and panel inside a dark UI with no error, warning, or visual glitch to
flag it. **An app with a dark theme must define all three explicitly** — there is
no way for the component to detect the theme around it.

### Rendering statusText as a real heading

`statusText` renders inside a plain `<div class="status-text">` by default, so it
carries no heading semantics — it doesn't join the document outline, and an app
whose design system wires typography to semantic tags (`h1`–`h6`) rather than
setting `font-size` in component styles has no tag to target. `.status-text`
itself only sets `font-weight` and `color` — it never sets `font-size` — so
switching the tag via `statusTextTag` lets the surrounding app's own heading
styles size it, with no change to `Status`'s own CSS:

```svelte
<Status
  statusText="Payment Successful"
  statusTextTag="h1"
  statusDescription="Your order has been confirmed"
/>
```

Omit `statusTextTag` (or pass `'div'`) and rendering is byte-identical to before
this prop existed.

### Description text vs. action content

`.status-description` carries the component's own horizontal padding and bottom
margin, so anything rendered through `descriptionSnippet` inherits a text box's
geometry. That is right for the message and wrong for a control. Put buttons,
links and countdowns in `children`, which renders below the description and
outside that box:

```svelte
<Status statusText="Installation failed" statusDescription="">
  {#snippet descriptionSnippet()}{message}{/snippet}
  {#snippet children()}
    <Button text="Try again" onclick={retry} />
  {/snippet}
</Status>
```

### Embedding Status inside an existing page

Status is styled as a standalone result screen: `100vh` tall, with a translucent
frosted panel. Rendered inside a page that already has its own heading and
surrounding content, both are wrong — the height pushes siblings below the fold,
and the panel's light background does not survive a dark theme.

All three are variables, so an inline consumer neutralises them:

```svelte
<div
  style="
    --status-min-height: auto;
    --status-panel-background: transparent;
    --status-panel-backdrop-filter: none;
  "
>
  <Status statusText="Finishing installation" statusDescription="Almost there…" />
</div>
```

## Type Reference

Custom types used by this component's props and events:

### ButtonProperties

```typescript
type ButtonProperties = {
  text?: string;
  enable?: boolean;
  showProgressBar?: boolean;
  showLoader?: boolean;
  loaderType?: 'Circular' | 'ProgressBar';
  type?: 'submit' | 'reset' | 'button';
  testId?: string;
  icon?: Snippet;
  children?: Snippet;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  disabled?: boolean;
  classes?: string;
  onclick?: (event: MouseEvent) => void;
  onkeyup?: (event: KeyboardEvent) => void;
};
```

## Internal Dependencies

This component uses the following library components internally:

- Button (for the action button)
- Img (for the status icon)

## Web Component

Tag: `<sui-status>`

```html
<sui-status
  status-icon="/icon.svg"
  status-icon-alt="Payment confirmed"
  status-text="Success"
  status-description="Operation completed."
></sui-status>
```
