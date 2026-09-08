# Card

A generic container component with an optional title/description header and a content body. Designed as a building block for dashboards, settings panels, product listings, and any grouped content. All visual properties are controlled via CSS custom properties — it looks correct with zero consumer overrides and is fully theme-agnostic. When `onclick` is provided the root element becomes an accessible button (`role="button"`, `tabindex="0"`, Enter/Space keyboard support) without any API change for existing consumers that omit the prop. When `href` is provided instead (or alongside `onclick`), the root renders as a native `<a>` with the same styling — see "Anchor Card (Link)" below.

## Usage

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';
</script>

<Card title="Order Summary" description="Review your items before checkout.">
  <p>3 items in your cart</p>
</Card>
```

### Content-Only Card

```svelte
<Card>
  <p>A simple card with no header.</p>
</Card>
```

### Themed Card

```svelte
<div class="dark-card">
  <Card title="Dashboard" description="Weekly metrics">
    <p>Revenue: $12,340</p>
  </Card>
</div>

<style>
  .dark-card {
    --card-background: #1a1a2e;
    --card-border: 1px solid #2a2a3c;
    --card-title-color: #e5e7eb;
    --card-description-color: #9ca3af;
  }
</style>
```

### Sized Card

```svelte
<div class="gateway-card">
  <Card title="Payment Gateway">
    <p>Configure your payment settings.</p>
  </Card>
</div>

<style>
  .gateway-card {
    --card-width: 600px;
    --card-min-width: 600px;
    --card-max-width: 600px;
    --card-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  }
</style>
```

### Clickable Card

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';

  function handleCardClick(event: MouseEvent) {
    console.log('card clicked', event);
  }
</script>

<div class="clickable-card">
  <Card onclick={handleCardClick} testId="platform-card">
    <p>Click anywhere on this card.</p>
  </Card>
</div>

<style>
  .clickable-card {
    --card-background: #f9fafb;
    --card-border: 1px solid #e5e7eb;
    --card-border-radius: 12px;
    --card-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
</style>
```

### Anchor Card (Link)

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';
</script>

<div class="clickable-card">
  <Card href="/integrations/shopify" title="Shopify" description="Connected" testId="shopify-card">
    <p>View integration details.</p>
  </Card>
</div>

<!-- External link: rel defaults to "noopener noreferrer" because target="_blank" -->
<div class="clickable-card">
  <Card href="https://shopify.com" target="_blank" title="Shopify docs">
    <p>Opens in a new tab.</p>
  </Card>
</div>
```

With `href` set, the root renders as a native `<a>` instead of a `<div>` — all existing styling (including `.card-interactive`'s cursor/focus-ring) is preserved unchanged, but focus and Enter-activation come from the browser's native anchor behavior rather than the synthetic `role="button"`/`tabindex`/keydown shim used for a clickable `<div>` (that shim is skipped entirely when `href` is set, since it would be redundant). `onclick` still fires if also provided, e.g. for click tracking alongside navigation.

### Custom Layout (Consumer Recipe)

The Card component intentionally omits named layout slots to keep its API minimal. For multi-zone flex-row layouts (metric tiles, integration rows, list items), place the layout entirely inside the `children` snippet — the consumer controls the structure and the Card provides the container, shadow, and click semantics.

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';
</script>

<!-- Metric tile: icon left, label+value center, badge right -->
<div class="metric-card">
  <Card testId="revenue-card">
    {#snippet children()}
      <div
        class="card-row"
        style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; gap:12px;"
      >
        <span>📊</span>
        <div style="flex:1;">
          <p style="margin:0;">Total Revenue</p>
          <strong>$48,320</strong>
        </div>
        <span class="badge">+12.4%</span>
      </div>
    {/snippet}
  </Card>
</div>

<!-- Integration row: clickable card with full-card onclick -->
<div class="integration-card">
  <Card onclick={handleCardClick} testId="shopify-card">
    {#snippet children()}
      <div
        class="card-row"
        style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; gap:12px;"
      >
        <span>🛒</span>
        <div style="flex:1;">
          <p style="margin:0;">Shopify</p>
          <small>Connected</small>
        </div>
        <span>›</span>
      </div>
    {/snippet}
  </Card>
</div>

<style>
  .metric-card {
    --card-background: #ffffff;
    --card-border: 1px solid #e5e7eb;
    --card-width: 100%;
  }

  .integration-card {
    --card-background: #f9fafb;
    --card-border: 1px solid #e5e7eb;
    --card-width: 100%;
  }
</style>
```

This pattern gives full layout control to the consumer (any number of zones, any flex/grid arrangement) without baking structural presets into the library.

### Attribute Passthrough and Custom Root Tag

`attrs` spreads arbitrary `data-*`/`aria-*` attributes onto the card root — for a
consumer that already keys state off attribute-selector CSS (`[data-state="waiting"]`,
`[data-density="compact"]`) elsewhere in their app, instead of encoding the same state as
a second `classes` modifier. `as` overrides the rendered tag independent of `href`, for a
card that needs the root element itself to carry real `<figure>` semantics instead of a
`<div>`.

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';
</script>

<!-- data-state drives a CSS rule the app already writes for other components -->
<Card testId="session-card" attrs={{ 'data-state': 'waiting' }}>
  <p>Waiting for input…</p>
</Card>

<!-- Card's root IS the <figure> — no wrapper element needed for the tag itself -->
<Card as="figure" title="Aurora">
  <div class="stage">…</div>
</Card>
```

`attrs` is applied before Card's own `class`/`style`/`data-pw`/`testID`/`role`/`tabindex`/
`href`/`target`/`rel`/`onclick`/`onkeydown` attributes, so it can only add attributes Card
does not already manage — it cannot be used to override the click/keyboard/anchor behavior
those props control. Those managed names are marked `@deprecated` on the `attrs` type, so
an editor strikes one through and explains which prop to use instead — `classes` for
`class`, `cssVars` for `style`, `testId` for `data-pw`/`testID`, the named `href`/`target`/
`rel`/`onclick` props for those — rather than the entry vanishing at spread time with
nothing saying so.

Deprecated, not rejected: `attrs` is still `Record<string, string>` and still accepts every
key it ever accepted, so no existing code stops compiling. Rejecting `class` outright is a
breaking change, and [#576](https://github.com/juspay/svelte-ui-components/issues/576) asks
for it in a major. `CardStrictAttrs` is that rejecting type, shipped now so it can be opted
into per object:

```svelte
<script lang="ts">
  import type { CardStrictAttrs } from '@juspay/svelte-ui-components';

  // Compile error: 'class' is managed by Card. Without the annotation this
  // object compiles, exactly as it always has, and `class` is discarded.
  const attrs: CardStrictAttrs = { 'data-state': 'waiting', class: 'mine' };
</script>
```

`CardStrictAttrs` also types native attributes properly — `onfocus` is a function, not a
string — and rejects managed keys reached through a predeclared variable, not just an
inline literal. It intentionally differs from `PillStrictAttrs`: Card writes no `aria-*`
state, so `aria-pressed` is usable on Card and rejected on Pill, and Pill writes no `style`.
Forbidding a key a component never touches would be a fake restriction.

`as`, when omitted, keeps Card's existing tag resolution exactly:
`<a>` when `href` is set, `<div>` otherwise. Setting `as` to anything other than `'a'`
suppresses `href`/`target`/`rel` and the synthetic `role="button"`/`tabindex`/keydown shim
applies instead when `onclick` is provided — the same interactive behavior a plain `<div>`
gets today. Both props are omitted by default, so existing consumers are unaffected.

**`as="figure"` does not give you a place to put a caption.** The HTML spec requires
`<figcaption>` to be a _direct_ child of `<figure>` — first or last, nothing else. Card
always wraps `children` in an inner `.card-content` div (and `title`/`headerRight` in
`.card-header`, `footer` in a `<footer>` element), so anything passed through those slots,
`<figcaption>` included, lands one level too deep. A `<figcaption>` inside `children` or
`footer` renders visually but is not exposed as the figure's accessible caption by any
browser or assistive technology — it is just a mislabeled paragraph. Do not try to caption
Card's own `as="figure"` root with a `<figcaption>` in the current version.

This is a limit on captioning _Card's_ root, not a ban on the element. A `<figure>` you
nest inside a Card can carry its own `<figcaption>` as a direct child, and that caption is
valid and correctly exposed — it captions the inner figure, which is a different element
from the Card root.

If you need a real captioned figure today, build it outside Card instead of trying to make
Card's root serve as the `<figure>`:

```svelte
<figure>
  <Card testId="aurora-card">
    <div class="stage">…</div>
  </Card>
  <figcaption>Aurora backdrop, 40% opacity</figcaption>
</figure>
```

Here `<figcaption>` is a direct child of the outer `<figure>` — valid markup, correctly
announced as a caption — at the cost of the one extra wrapper element `as="figure"` was
meant to avoid. `as="figure"` itself remains useful on its own for cases that want the
`<figure>` tag/semantics without a caption (e.g. a self-contained media block referenced
elsewhere via `aria-describedby`). A first-class caption slot on Card (rendering
`<figcaption>` as a direct child of the root) would resolve this properly; it is not
implemented today and is not part of this change.

### Card with Header Right Slot

```svelte
<script>
  import { Card, Button } from '@juspay/svelte-ui-components';
</script>

<Card title="Recent Orders" description="Last 7 days">
  {#snippet headerRight()}
    <Button text="View All" />
  {/snippet}
  <p>12 orders placed</p>
</Card>
```

### Rich-Markup Title and Description via Snippets

`title` and `description` are plain strings, so they cannot carry markup or an
attribute. When the title needs an inline icon, formatted text, or a test hook on
the element itself, use `titleSnippet` / `descriptionSnippet` instead — each
renders inside the same `.card-title` / `.card-description` container, so the
card keeps its normal header typography and spacing.

```svelte
<script>
  import { Card } from '@juspay/svelte-ui-components';
</script>

<Card>
  {#snippet titleSnippet()}
    <h3 data-pw="settings-card-heading">Editing window</h3>
  {/snippet}
  {#snippet descriptionSnippet()}
    <p data-pw="settings-card-description">
      Counts from when the order is created. <a href="/docs">Learn more</a>
    </p>
  {/snippet}
  <p>Card body content.</p>
</Card>
```

Providing `titleSnippet` renders the header row even when `title` is omitted, so
there is no need to pass a placeholder `title=""`. A snippet always takes
priority over the matching string prop — only one of the two is rendered.

### Stretch and Scrollable Card

```svelte
<div style="height: 300px; display: flex;">
  <Card title="Activity Log" stretch scrollable>
    {#snippet children()}
      {#each events as event}
        <p>{event.message}</p>
      {/each}
    {/snippet}
    {#snippet footer()}
      <span>End of log</span>
    {/snippet}
  </Card>
</div>
```

## Props

| Prop               | Type                               | Required | Default | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ---------------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children           | `Snippet`                          | No       | `-`     | Main content body of the card. Rendered inside the `.card-content` container.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| title              | `string`                           | No       | `-`     | Header title text. When provided, renders the `.card-header` section.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| description        | `string`                           | No       | `-`     | Header subtitle/description text displayed below the title. Only rendered if `title` is also provided.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| titleSnippet       | `Snippet`                          | No       | `-`     | Rich-markup override for the title. Rendered inside the same `.card-title` container and takes priority over `title`. Providing it renders the header row even when `title` is omitted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| descriptionSnippet | `Snippet`                          | No       | `-`     | Rich-markup override for the description. Rendered inside the same `.card-description` container and takes priority over `description`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| classes            | `string`                           | No       | `-`     | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| testId             | `string`                           | No       | `-`     | Value for the `data-pw` attribute on the root element. Used for Playwright test selectors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| onclick            | `(event: MouseEvent) => void`      | No       | `-`     | Click handler. When provided (and `href` is not), the card root becomes an interactive `<div>`: `role="button"`, `tabindex="0"`, and Enter/Space keydown trigger the handler. When `href` is also set, `onclick` still fires but the shim is skipped in favor of native anchor semantics. Omit both to keep a plain `<div>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| href               | `string`                           | No       | `-`     | Renders the card root as a native `<a href="...">` instead of a `<div>`, styled identically. Natively focusable and Enter-activated, so the `role="button"`/`tabindex`/keydown shim used for `onclick`-only cards is skipped. Omit to keep a `<div>` root.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| target             | `string`                           | No       | `-`     | Anchor `target` (e.g. `_blank`). Only applied when `href` is set.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| rel                | `string`                           | No       | `-`     | Anchor `rel`. Only applied when `href` is set. Defaults to `noopener noreferrer` when `target="_blank"` and `rel` is not explicitly provided.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| headerRight        | `Snippet`                          | No       | `-`     | Snippet rendered at the top-right of the header row alongside the title/description. When omitted the header row is unchanged (title block takes full width).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| footer             | `Snippet`                          | No       | `-`     | Snippet rendered in a `<footer>` element below the content area. When omitted no footer element is rendered.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| stretch            | `boolean`                          | No       | `false` | When true, the card root gets `height: 100%` and becomes a flex column so the content area grows to fill remaining space. Useful in equal-height grid/flex layouts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| scrollable         | `boolean`                          | No       | `false` | When true, the content area becomes vertically scrollable (max-height via `--card-content-max-height`, default 400px). The region also gains `role="region"` and `tabindex="0"` for keyboard accessibility.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| cssVars            | `Record<string, string \| number>` | No       | `-`     | Per-instance CSS custom properties applied as inline `style` on the card root (e.g. `{ '--bottom-sections-count': 3 }`). Feeds a dynamic value into a recipe class whose selectors/media queries read that variable — something a static `classes` string cannot express. Omit to render no `style` attribute.                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| attrs              | `Record<string, string>`           | No       | `-`     | Arbitrary attributes (e.g. `data-*`, `aria-*`) spread onto the card root, for attribute-selector CSS. Applied before Card's own class/style/data-pw/testID/role/tabindex/href/target/rel/onclick/onkeydown, so it can only add attributes Card does not already manage. Omit to render no extra attributes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| as                 | `'div' \| 'a' \| 'figure'`         | No       | `-`     | Overrides the root element's tag independent of `href` — e.g. `'figure'` for a real `<figure>` root tag. Omit to keep today's rule: `<a>` when `href` is set, `<div>` otherwise. A value other than `'a'` suppresses `href`/`target`/`rel` and applies the same interactive shim a plain `<div>` gets when `onclick` is provided. `as="a"` without `href` gets that same shim too — there is nothing to navigate to, so it behaves like an interactive `<div>` rendered as an `<a>` tag rather than a broken anchor. **Does not provide a caption slot** — `children`/`footer` are wrapped in inner elements, so a `<figcaption>` placed there is not a direct child of the figure and is not exposed as its caption; see "Attribute Passthrough and Custom Root Tag" above. |

## Events

| Event   | Type                          | Description                                                                                                                                                                                                                                                                                                    |
| ------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick | `(event: MouseEvent) => void` | Fires when the card is clicked. When provided and `href` is not set, the card also gains `role="button"`, `tabindex="0"`, and keyboard support (Enter/Space). With `href` set, `onclick` still fires but that shim is skipped — the native `<a>` already provides focus/keyboard activation. No-op if omitted. |

## CSS Variables

Override these custom properties to theme the component.

| Variable                          | Default                  | CSS Property    | Description                                                                                                                                  |
| --------------------------------- | ------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--card-background`               | `inherit`                | background      | Background color of the card.                                                                                                                |
| `--card-border`                   | `1px solid currentColor` | border          | Border of the card. Inherits text color by default.                                                                                          |
| `--card-border-radius`            | `var(--radius, 4px)`     | border-radius   | Corner radius of the card. Falls back to the shared `--radius` token, then `4px`.                                                            |
| `--card-overflow`                 | `hidden`                 | overflow        | Overflow behavior of the card content.                                                                                                       |
| `--card-box-shadow`               | `none`                   | box-shadow      | Box shadow of the card. Set to a shadow value (e.g. `0 2px 8px rgba(0,0,0,0.1)`) or `none`.                                                  |
| `--card-width`                    | `auto`                   | width           | Width of the card. Set to a fixed value (e.g. `600px`) or leave as `auto` for natural sizing.                                                |
| `--card-min-width`                | `0`                      | min-width       | Minimum width constraint.                                                                                                                    |
| `--card-max-width`                | `none`                   | max-width       | Maximum width constraint.                                                                                                                    |
| `--card-height`                   | `auto`                   | height          | Height of the card. Set to `100%` for equal-height/stretch layouts (e.g. cards in a stretched grid row); leave as `auto` for natural sizing. |
| `--card-max-height`               | `none`                   | max-height      | Maximum height constraint. Use with `overflow: auto` for scrollable card bodies.                                                             |
| `--card-margin`                   | `0`                      | margin          | Outer margin of the card. Useful for stacked card layouts.                                                                                   |
| `--card-cursor`                   | `inherit`                | cursor          | Cursor on the card root. Defaults to `pointer` when `onclick` is provided.                                                                   |
| `--card-focus-outline`            | `2px solid currentColor` | outline         | Focus ring shown on the card when interactive and focused via keyboard.                                                                      |
| `--card-focus-outline-offset`     | `2px`                    | outline-offset  | Offset of the focus ring from the card edge.                                                                                                 |
| `--card-header-padding`           | `16px 16px 0`            | padding         | Padding of the header section.                                                                                                               |
| `--card-header-border-bottom`     | `none`                   | border-bottom   | Optional border below the header.                                                                                                            |
| `--card-title-font-size`          | `16px`                   | font-size       | Font size of the title text.                                                                                                                 |
| `--card-title-font-weight`        | `600`                    | font-weight     | Font weight of the title text.                                                                                                               |
| `--card-title-color`              | `inherit`                | color           | Color of the title text. Inherits from parent by default.                                                                                    |
| `--card-description-font-size`    | `14px`                   | font-size       | Font size of the description text.                                                                                                           |
| `--card-description-color`        | `inherit`                | color           | Color of the description text. Inherits from parent by default.                                                                              |
| `--card-description-opacity`      | `0.6`                    | opacity         | Opacity of the description text for visual hierarchy.                                                                                        |
| `--card-description-margin-top`   | `4px`                    | margin-top      | Space between the title and description.                                                                                                     |
| `--card-content-padding`          | `16px`                   | padding         | Padding of the content body.                                                                                                                 |
| `--card-stretch-height`           | `100%`                   | height          | Height of the card root when `stretch=true`. Set to a fixed value or `100%` for full-height layouts.                                         |
| `--card-content-flex`             | `1`                      | flex            | Flex grow/shrink/basis shorthand for the content area when `stretch=true`, allowing it to fill remaining height.                             |
| `--card-header-align-items`       | `flex-start`             | align-items     | Vertical alignment of the header row when `headerRight` is provided (`.card-header-split` flex container).                                   |
| `--card-header-gap`               | `8px`                    | gap             | Gap between the header main section and the `headerRight` slot when both are present.                                                        |
| `--card-header-right-align-items` | `center`                 | align-items     | Vertical alignment of the `headerRight` slot container.                                                                                      |
| `--card-content-max-height`       | `400px`                  | max-height      | Maximum height of the scrollable content area when `scrollable=true`.                                                                        |
| `--card-content-scrollbar-width`  | `thin`                   | scrollbar-width | Scrollbar width for the scrollable content area when `scrollable=true`. Accepts any CSS `scrollbar-width` value (`thin`, `auto`, `none`).    |
| `--card-footer-padding`           | `12px 16px`              | padding         | Padding of the footer element.                                                                                                               |
| `--card-footer-border-top`        | `none`                   | border-top      | Optional top border for the footer. Set to a border value (e.g. `1px solid #e5e7eb`) to visually separate the footer.                        |
| `--card-footer-background`        | `inherit`                | background      | Background color of the footer element. Inherits from the card by default.                                                                   |
| `--radius`                        | `4px`                    | border-radius   | Shared corner-radius token read by several components. Only takes effect on Card when `--card-border-radius` is unset.                       |

## Web Component

Tag: `<sui-card>`

Reflected boolean attributes: `stretch`, `scrollable`.

`as="figure"` sets the root tag as a reflected `as` attribute; `attrs` is object-valued (set as a property, e.g. `el.attrs = { 'data-state': 'waiting' }`) like `cssVars`.

```html
<sui-card title="Order Summary" description="Review your items">
  <p>3 items in your cart</p>
</sui-card>

<!-- stretch + scrollable -->
<sui-card title="Activity Log" stretch scrollable>
  <p>Event 1</p>
  <p>Event 2</p>
</sui-card>
```
