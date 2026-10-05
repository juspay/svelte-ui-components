# Button

An action button with a built-in variant and size system: five visual styles (`primary`, `secondary`, `ghost`, `destructive`, `brand`), three sizes (`sm`/`md`/`lg`), plus `iconOnly`, `fullWidth` and `shrinkable` affordances. It can render as a styled link via `href`, exposes a `loading` state (spinner + `aria-busy`), and supports icon/children snippets. Every visual property remains overridable through `--button-*` CSS variables, so an explicit override or a `classes` recipe always wins over the variant default.

## Usage

```svelte
<script>
  import { Button } from '@juspay/svelte-ui-components';
</script>

<Button text="Submit" onclick={(e) => console.log('clicked', e)} />
```

### Variants

```svelte
<Button text="Primary" variant="primary" />
<Button text="Secondary" variant="secondary" />
<Button text="Ghost" variant="ghost" />
<Button text="Destructive" variant="destructive" />
<Button text="Get Started" variant="brand" classes="btn-brand-gradient" />
```

### Brand variant (gradient CTAs)

`brand` is a transparent chassis — white text, no border, no background of its own — designed to be paired with a `--button-background` gradient via `classes`. Used alone (no `--button-background` set) it renders fully transparent, so always pair it with a background recipe:

```svelte
<Button text="Get Started" variant="brand" classes="btn-brand-gradient" />

<style>
  :global(.btn-brand-gradient) {
    --button-background: linear-gradient(135deg, #ff7a45, #8f41fc);
    /* Also set --button-hover-color: the brand variant's internal hover default is
       `transparent`, and it sits before --button-background in the hover fallback
       chain — without an explicit --button-hover-color the gradient would flatten
       to transparent on hover. */
    --button-hover-color: linear-gradient(135deg, #ff7a45, #8f41fc);
    --button-transition: background 0.2s ease, transform 0.15s ease;
    --button-hover-transform: translateY(-2px);
  }
</style>
```

### Sizes

```svelte
<Button text="Small" size="sm" />
<Button text="Medium" size="md" />
<Button text="Large" size="lg" />
```

### Icon only

Pair `iconOnly` with `ariaLabel` so the button has an accessible name.

```svelte
<Button iconOnly ariaLabel="Add">
  {#snippet icon()}
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  {/snippet}
</Button>
```

> Use `stroke="currentColor"` (or `fill="currentColor"`) in the icon so it inherits the button's text color across variants.

### Full width

```svelte
<Button text="Continue" fullWidth />
```

### Fitting a constrained container

A button is as wide as its label, and the label does not wrap. Inside a parent narrower than the label (a flex row, a grid cell or a plain block) it therefore cannot give width back: a long label overflows the parent instead of shrinking. `shrinkable` opts in to a button that can be narrower than its label: a label that does not fit is truncated with an ellipsis inside the width the parent offers.

```svelte
<div class="cell">
  <Button text={account.email} shrinkable />
</div>
```

A label that fits keeps its natural width and its place in the parent. A short label looks exactly as it does without the prop in a flex, grid, block or stretch parent, whatever `justify-items`, `justify-self` or auto margins the parent and the root use. A grid cell can be a `1fr`, `auto`, `minmax(0, 1fr)` or fixed-width track.

In a flex row shared with other buttons, each shrinkable button starts from an equal share of the row. A short label narrower than that share keeps its natural width and the long label gives up the rest ("Save" beside a long label). A label wider than the share is cut to it: "Save changes" beside a long label in a 240px row with an 8px gap is cut to 116px with an ellipsis, and so is the long label. When the row is too narrow for every label, each shrinkable button gives up width, short ones included. Give a button that must stay readable `flex-shrink: 0` through `classes`:

```svelte
<div class="toolbar">
  <Button text="Save" shrinkable classes="keep-size" />
  <Button text="Cancel" shrinkable />
</div>

<style>
  .toolbar {
    display: flex;
    gap: 8px;
  }

  :global(.keep-size) {
    flex-shrink: 0;
  }
</style>
```

Wrapping does not need `shrinkable`. A label with break opportunities wraps to the width of its parent on any button once `--button-white-space: normal` is set through `classes`:

```svelte
<Button text={product.name} classes="wrapping-button" />

<style>
  :global(.wrapping-button) {
    --button-white-space: normal;
  }
</style>
```

What `shrinkable` changes there is a single word wider than the parent. Without the prop the button is as wide as that word and overflows; with it the button stays inside the parent and the word is clipped with an ellipsis. An ancestor `overflow-wrap: anywhere` (the property is inherited and the button never resets it) breaks the word onto further lines instead.

What `shrinkable` sets, and what it leaves alone:

- The outer container gets `min-width: 0`, `width: 100%` and `max-width: var(--button-width, max-content)`: as wide as the label and never wider than the parent. The inner button gets `max-width: var(--button-max-width, 100%)`, and an `icon` snippet gets `flex-shrink: 0`. No new CSS variable is added: `--button-max-width` keeps its meaning, so `--button-max-width: 120px` still caps the button at 120px.
- Without `shrinkable`, `--button-max-width` and `--button-min-width` reach only the inner button, and a percentage resolves against the container, which is as wide as the label unless `fullWidth` or `--button-width` sizes it. That is why `--button-max-width: 100%` alone does not make a content-sized button fit a flex, grid or block parent.
- With `shrinkable` the container's `width` and `max-width` come from those rules, so a `max-width` set on the root through `classes` no longer applies. Use `--button-max-width` for that, or `--button-width` for a fixed width, which is capped at the parent. For the same reason `flex-grow` or `flex: 1` on the root does not widen it past its label; `fullWidth` makes the button fill its flex cell.
- A horizontal margin on the root is added to the container's `width: 100%`. In a block or grid parent the margin box therefore runs past the parent by the margin: with `margin: 0 8px` in a 240px parent the container is 240px wide and starts 8px in, so its right edge is at 248px. A flex row is not affected, because margins take part in flex shrinking. Put the spacing on the parent (`gap` or `padding`) instead.
- Firefox only: inside a parent with a vertical `writing-mode` (measured with `vertical-rl`) the transparent container spans the parent's width, because `width` and `max-width` are physical properties, while the visible button keeps its own size. The container can take pointer events beside the button. Chromium and WebKit are unaffected.
- `shrinkable` lets the button give up width; it cannot make its ancestors do the same. Every flex or grid item between the button and the box it has to fit must also be able to shrink (`min-width: 0`).
- It has no effect on the buttons a [Modal](./Modal.md) renders from `footer.primaryButton` and `footer.secondaryButton`. They sit in a footer row sized to its labels (`width: fit-content`), inside wrappers that are `flex: none` by default, so the labels keep their natural width and run past the panel's edge. Render the button in `footerSnippet` instead, in a Modal whose width is bounded (for example a `size` with its `--modal-*-width` token set). The default `fit-content` panel grows to its content, so there is nothing for the label to give back.
- Only the `text` label is truncated. The element in the `icon` snippet keeps its size, an `img` under an `img { max-width: 100% }` reset included. Custom content passed as `children` is left as it is: the button box fits the parent and wider content spills out of it, so give that content its own `min-width: 0; overflow: hidden; text-overflow: ellipsis`.
- With `iconOnly` it changes nothing while the square fits. In a narrower parent the padding gives way first and the icon keeps its size, so the button stops being square. The button never gets narrower than its own padding, so an icon wider than that spills out of a parent narrower than the icon. Leave `shrinkable` off an icon-only button that has to stay square.
- A root a consumer has reset to `display: inline` (for example with `all: unset`) ignores the container's `min-width`, `width` and `max-width`, and a percentage on the inner button resolves against the parent. In a block parent `--button-max-width: 100%` alone then caps the button, and `shrinkable` does the same. In a flex parent the root is blockified, so the rules above apply.
- A button that does not set `shrinkable` is unchanged: the prop adds a class and three rules that apply only to that class.

### Loading

`loading` shows the spinner, sets `aria-busy`, and disables the button (preferred over the legacy `showLoader`/`loaderType` pair).

```svelte
<Button text={saving ? 'Saving…' : 'Save'} loading={saving} onclick={save} />
```

### As a link

With `href` the button renders as a styled `<a>`. A disabled link is rendered inert via `aria-disabled` and `tabindex="-1"`.

```svelte
<Button text="Open docs" href="/docs" target="_blank" variant="secondary" />
```

### With Icon

```svelte
<Button text="Download" onclick={handleDownload}>
  {#snippet icon()}
    <svg>...</svg>
  {/snippet}
</Button>
```

### With Children (Custom Content)

```svelte
<Button onclick={handleClick}>
  {#snippet children()}
    <span>Custom content with <strong>formatting</strong></span>
  {/snippet}
</Button>
```

## Props

| Prop            | Type                                                              | Required | Default     | Description                                                                                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| text            | `string`                                                          | No       | `-`         | The button label text. Rendered as plain text by default; set `allowHtml` to render as HTML.                                                                                                                                                               |
| variant         | `'primary' \| 'secondary' \| 'ghost' \| 'destructive' \| 'brand'` | No       | `'primary'` | Visual style. Maps to the `--button-*` variables; an explicit `--button-color`/`classes` override wins over the variant default. `brand` is a transparent chassis meant to pair with a `--button-background` gradient.                                     |
| size            | `'sm' \| 'md' \| 'lg'`                                            | No       | `'md'`      | Size preset controlling padding, height, and font size.                                                                                                                                                                                                    |
| iconOnly        | `boolean`                                                         | No       | `false`     | Square padding for an icon-only button. Pair with `ariaLabel`.                                                                                                                                                                                             |
| fullWidth       | `boolean`                                                         | No       | `false`     | Stretch the button to the full width of its container.                                                                                                                                                                                                     |
| shrinkable      | `boolean`                                                         | No       | `false`     | Let the button be narrower than its label: it hugs a label that fits and truncates one that does not, instead of overflowing its parent. See [Fitting a constrained container](#fitting-a-constrained-container).                                          |
| href            | `string`                                                          | No       | `-`         | Render the button as a styled `<a>`. `type` is ignored; a disabled link is made inert via `aria-disabled`/`tabindex="-1"`.                                                                                                                                 |
| target          | `string`                                                          | No       | `-`         | Anchor target (only with `href`), e.g. `_blank`.                                                                                                                                                                                                           |
| rel             | `string`                                                          | No       | `-`         | Anchor rel (only with `href`). Defaults to `noopener noreferrer` when `target="_blank"`.                                                                                                                                                                   |
| loading         | `boolean`                                                         | No       | `false`     | Loading state: shows the spinner, sets `aria-busy`, and disables the button. Preferred over `showLoader`/`loaderType`.                                                                                                                                     |
| allowHtml       | `boolean`                                                         | No       | `false`     | Render `text` as raw HTML. Only enable for trusted, non-user-derived markup.                                                                                                                                                                               |
| enable          | `boolean`                                                         | No       | `true`      | **Deprecated** — use `disabled`. When false the button is disabled. Retained for backward compatibility.                                                                                                                                                   |
| disabled        | `boolean`                                                         | No       | `false`     | Whether the button is disabled. When true, the button appears dimmed (opacity 0.4) and ignores clicks.                                                                                                                                                     |
| showProgressBar | `boolean`                                                         | No       | `false`     | **Deprecated.** Bindable. When true, a horizontal progress bar overlay animates across the button. Set automatically when `showLoader=true` and `loaderType='ProgressBar'` after first click.                                                              |
| showLoader      | `boolean`                                                         | No       | `false`     | **Deprecated** — prefer `loading`. Whether to show a loading indicator. Combined with `loaderType` to determine the visual style.                                                                                                                          |
| loaderType      | `'Circular' \| 'ProgressBar'`                                     | No       | `-`         | **Deprecated** — used with `showLoader`. `'Circular'` shows a spinning ring inside the button; `'ProgressBar'` shows a horizontal fill animation across the button.                                                                                        |
| type            | `'submit' \| 'reset' \| 'button'`                                 | No       | `'button'`  | The HTML button `type` attribute.                                                                                                                                                                                                                          |
| testId          | `string`                                                          | No       | `-`         | Value for the `data-pw` attribute, used for end-to-end testing selectors.                                                                                                                                                                                  |
| ariaLabel       | `string`                                                          | No       | `-`         | Accessible label for the button. Used when the button has only an icon and no visible text.                                                                                                                                                                |
| ariaExpanded    | `boolean`                                                         | No       | `-`         | Sets `aria-expanded` on the button element. Use when the button controls an expandable region (dropdown, accordion, etc.).                                                                                                                                 |
| ariaControls    | `string`                                                          | No       | `-`         | Id of the region this button governs. Pair with `ariaExpanded` on a disclosure button.                                                                                                                                                                     |
| ariaSelected    | `boolean`                                                         | No       | `-`         | Sets `aria-selected` on the button element. Use when the button represents a selectable option (e.g., inside an autocomplete dropdown or tab-like pattern).                                                                                                |
| ariaPressed     | `boolean`                                                         | No       | `-`         | Sets `aria-pressed` — for a toggle button (e.g. a chip that stays selected). Prefer it over `ariaSelected` on a plain button, where `aria-selected` has no meaning.                                                                                        |
| ariaHaspopup    | `'menu' \| 'listbox' \| 'tree' \| 'grid' \| 'dialog' \| boolean`  | No       | `-`         | Native `aria-haspopup`. Needed when the button is the trigger for a menu, listbox or dialog — `Menu` hands exactly this to its `trigger` snippet.                                                                                                          |
| ariaBusy        | `boolean`                                                         | No       | `-`         | Native `aria-busy`, for a control that stays usable while related data loads. Deliberately separate from `loading` (which also renders the spinner and disables the button) — a trigger whose _contents_ are still loading must stay clickable.            |
| title           | `string`                                                          | No       | `-`         | Native `title`, rendered as the browser's own hover tooltip. Distinct from `ariaLabel`, which names the control for assistive tech without any visible affordance — an icon-only button generally wants both.                                              |
| statusText      | `string`                                                          | No       | `-`         | Opt-in sr-only `role="status"` polite live region beside the button (never around it), e.g. "Copied" after a copy click. Pass `""` to keep it mounted before its first announcement.                                                                       |
| statusTestId    | `string`                                                          | No       | `-`         | Value for the `data-pw` attribute on the `statusText` region.                                                                                                                                                                                              |
| style           | `string`                                                          | No       | `-`         | Inline style applied to the outer `.button-container`. Use for per-instance dynamic values a static class can't express (e.g. a CSS custom property driven by runtime state, `--offset: {n}px`). Prefer `classes`/`--button-*` tokens for anything static. |
| role            | `string`                                                          | No       | `-`         | Overrides the default ARIA role of the button element. Use `'option'` when the button represents a selectable item in a listbox pattern, or `'tab'` for tab-like navigation.                                                                               |
| classes         | `string`                                                          | No       | `-`         | CSS class string applied to the component's top-level element. Useful for theming — define classes with CSS variable overrides (e.g., `.btn-primary { --button-color: #0070f3; }`) and pass them to create variant styles.                                 |

## Snippets

Svelte 5 Snippet props — pass content blocks to the component.

| Snippet  | Type      | Description                                                                                                                                                  |
| -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| icon     | `Snippet` | A Svelte 5 Snippet for rendering custom icon content (e.g., an SVG) next to the button text. Rendered inside a flex container with configurable order.       |
| children | `Snippet` | A Svelte 5 Snippet for rendering arbitrary content inside the button. Use this instead of `text` when you need full control over the button's inner content. |

## Events

| Event        | Type                             | Description                                                                                                                                                                                  |
| ------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| onclick      | `(event: MouseEvent) => void`    | Fires when the button is clicked. Does NOT fire when `showProgressBar` is active (clicks are silently ignored during progress).                                                              |
| onkeydown    | `(event: KeyboardEvent) => void` | Fires when a key is pressed down while the button has focus. Use together with `onkeyup` to implement keyboard hold-and-release interactions. Defaults to a no-op `() => {}` (always fires). |
| onkeyup      | `(event: KeyboardEvent) => void` | Fires when a key is released while the button has focus. Defaults to a no-op `() => {}` (always fires).                                                                                      |
| onmousedown  | `(event: MouseEvent) => void`    | Fires when a mouse button is pressed down on the button. Use together with `onmouseup`/`onmouseleave` to implement hold-and-release interactions.                                            |
| onmouseup    | `(event: MouseEvent) => void`    | Fires when a mouse button is released over the button. Use together with `onmousedown` to detect the end of a hold gesture.                                                                  |
| onmouseleave | `(event: MouseEvent) => void`    | Fires when the pointer leaves the button area. Use together with `onmousedown` to cancel a hold gesture if the pointer drifts off the button.                                                |
| ontouchstart | `(event: TouchEvent) => void`    | Fires when a touch point is placed on the button. Use together with `ontouchend` to implement hold-and-release interactions on touch devices.                                                |
| ontouchend   | `(event: TouchEvent) => void`    | Fires when a touch point is removed from the button. Use together with `ontouchstart` to detect the end of a touch hold gesture.                                                             |

## CSS Variables

Override these custom properties to theme the component.

| Variable                                    | Default                                           | CSS Property       | Description                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--button-width`                            | `fit-content`                                     | width              | Width of the button container and button element.                                                                                                                                                                                                                                                                                                                                                                    |
| `--button-max-height`                       | `-`                                               | max-height         | Maximum height of the button.                                                                                                                                                                                                                                                                                                                                                                                        |
| `--button-text-decoration`                  | `none`                                            | text-decoration    | Text decoration of the button's text.                                                                                                                                                                                                                                                                                                                                                                                |
| `--button-disabled-text-decoration`         | `var(--button-text-decoration, none)`             | text-decoration    | Text decoration when the button is disabled. Falls back to `--button-text-decoration`.                                                                                                                                                                                                                                                                                                                               |
| `--button-line-height`                      | `normal`                                          | line-height        | Line height of the button's text.                                                                                                                                                                                                                                                                                                                                                                                    |
| `--button-white-space`                      | `nowrap`                                          | white-space        | Whether the button's text wraps. Set to `normal` to opt into multi-line buttons.                                                                                                                                                                                                                                                                                                                                     |
| `--button-max-width`                        | `-`                                               | max-width          | Maximum width of the inner button, not of the outer container. A percentage resolves against the container, which is as wide as the label unless `fullWidth` or `--button-width` sizes it. With `shrinkable` the default is `100%`.                                                                                                                                                                                  |
| `--button-min-width`                        | `-`                                               | min-width          | Minimum width of the inner button, not of the outer container.                                                                                                                                                                                                                                                                                                                                                       |
| `--button-font-family`                      | `-`                                               | font-family        | Font family for the button text.                                                                                                                                                                                                                                                                                                                                                                                     |
| `--button-font-weight`                      | `500`                                             | font-weight        | Font weight of the button text.                                                                                                                                                                                                                                                                                                                                                                                      |
| `--button-font-size`                        | `14px`                                            | font-size          | Font size of the button text.                                                                                                                                                                                                                                                                                                                                                                                        |
| `--button-background`                       | `none`                                            | background-image   | Rest-state image layer painted over `--button-color` — takes any `background-image` value (a gradient, `url(…)`, or comma-separated layers). Deliberately a longhand, so the hook never resets other background layers a consumer may set; solid colors keep using `--button-color`. Also the fallback for hover/active/disabled backgrounds when those aren't set explicitly, so a gradient persists across states. |
| `--button-color`                            | `#3a4550`                                         | background-color   | **Background color** of the button (note: name is misleading — this controls background, not text color).                                                                                                                                                                                                                                                                                                            |
| `--button-text-color`                       | `white`                                           | color              | Text/icon color of the button label.                                                                                                                                                                                                                                                                                                                                                                                 |
| `--button-height`                           | `fit-content`                                     | height             | Height of the button.                                                                                                                                                                                                                                                                                                                                                                                                |
| `--button-padding`                          | `16px`                                            | padding            | Inner padding of the button.                                                                                                                                                                                                                                                                                                                                                                                         |
| `--button-margin`                           | `-`                                               | margin             | Outer margin of the button.                                                                                                                                                                                                                                                                                                                                                                                          |
| `--button-border-radius`                    | `var(--radius, 6px)`                              | border-radius      | Corner rounding of the button.                                                                                                                                                                                                                                                                                                                                                                                       |
| `--cursor`                                  | `pointer`                                         | cursor             | Cursor style on hover.                                                                                                                                                                                                                                                                                                                                                                                               |
| `--opacity`                                 | `1`                                               | opacity            | Opacity of the button.                                                                                                                                                                                                                                                                                                                                                                                               |
| `--button-border`                           | `none`                                            | border             | Border style of the button.                                                                                                                                                                                                                                                                                                                                                                                          |
| `--button-justify-content`                  | `center`                                          | justify-content    | Horizontal alignment of content inside the button (flex justify-content).                                                                                                                                                                                                                                                                                                                                            |
| `--button-content-flex-direction`           | `row`                                             | flex-direction     | Layout direction of icon/text inside the button (row or column).                                                                                                                                                                                                                                                                                                                                                     |
| `--button-content-gap`                      | `16px`                                            | gap                | Gap between icon and text inside the button.                                                                                                                                                                                                                                                                                                                                                                         |
| `--button-visibility`                       | `visible`                                         | visibility         | Controls button visibility (visible/hidden).                                                                                                                                                                                                                                                                                                                                                                         |
| `--button-box-shadow`                       | `none`                                            | box-shadow         | Box shadow of the button.                                                                                                                                                                                                                                                                                                                                                                                            |
| `--button-transition`                       | `none`                                            | transition         | CSS transition of the button element, e.g. `background 0.2s ease`. Unset by default so existing consumers keep today's instant state changes; set this to animate hover/active background changes (most useful with `--button-background` gradients).                                                                                                                                                                |
| `--disabled-cursor`                         | `not-allowed`                                     | cursor             | Cursor shown when the button is disabled.                                                                                                                                                                                                                                                                                                                                                                            |
| `--disabled-opacity`                        | `0.4`                                             | opacity            | Opacity when the button is disabled.                                                                                                                                                                                                                                                                                                                                                                                 |
| `--disabled-text-color`                     | `-`                                               | color              | Text color when the button is disabled.                                                                                                                                                                                                                                                                                                                                                                              |
| `--disabled-font-size`                      | `-`                                               | font-size          | Font size when the button is disabled.                                                                                                                                                                                                                                                                                                                                                                               |
| `--disabled-font-weight`                    | `-`                                               | font-weight        | Font weight when the button is disabled.                                                                                                                                                                                                                                                                                                                                                                             |
| `--disabled-border`                         | `-`                                               | border             | Border when the button is disabled.                                                                                                                                                                                                                                                                                                                                                                                  |
| `--disabled-background-color`               | `-`                                               | background         | Background color when the button is disabled.                                                                                                                                                                                                                                                                                                                                                                        |
| `--button-disabled-box-shadow`              | inherits `--button-box-shadow`                    | box-shadow         | Box shadow when the button is disabled. **Deprecated** — use `--disabled-box-shadow` instead (both names are supported for backward compatibility).                                                                                                                                                                                                                                                                  |
| `--disabled-box-shadow`                     | inherits `--button-box-shadow`                    | box-shadow         | Box shadow when the button is disabled. Set to `none` to drop the resting shadow on disabled buttons. Preferred name (supersedes `--button-disabled-box-shadow`).                                                                                                                                                                                                                                                    |
| `--button-loader-order`                     | `1`                                               | order              | Flex order of the circular loader relative to icon/text.                                                                                                                                                                                                                                                                                                                                                             |
| `--button-icon-order`                       | `2`                                               | order              | Flex order of the icon relative to loader/text.                                                                                                                                                                                                                                                                                                                                                                      |
| `--button-icon-display`                     | `-`                                               | display            | Display property of the icon container.                                                                                                                                                                                                                                                                                                                                                                              |
| `--button-text-order`                       | `3`                                               | order              | Flex order of the text relative to loader/icon.                                                                                                                                                                                                                                                                                                                                                                      |
| `--button-text-display`                     | `-`                                               | display            | Display property of the text container.                                                                                                                                                                                                                                                                                                                                                                              |
| `--button-hover-color`                      | inherits `--button-background` → `--button-color` | background         | Background color on hover.                                                                                                                                                                                                                                                                                                                                                                                           |
| `--button-hover-text-color`                 | inherits `--button-text-color`                    | color              | Text color on hover.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `--button-hover-border`                     | inherits `--button-border`                        | border             | Border style on hover.                                                                                                                                                                                                                                                                                                                                                                                               |
| `--button-hover-transform`                  | `-`                                               | transform          | CSS transform applied on hover (e.g., `scale(1.05)`). Allows hover scale effects without `:global()`.                                                                                                                                                                                                                                                                                                                |
| `--button-active-transform`                 | `-`                                               | transform          | CSS transform applied on active/pressed state (e.g., `scale(0.95)`). Allows press-down effects without `:global()`.                                                                                                                                                                                                                                                                                                  |
| `--button-hover-box-shadow`                 | inherits `--button-box-shadow`                    | box-shadow         | Box shadow on hover. Allows raise-on-hover effects without `:global()`.                                                                                                                                                                                                                                                                                                                                              |
| `--button-active-background`                | inherits `--button-background` → `--button-color` | background         | Background color on active/pressed state (e.g., a darker pressed shade).                                                                                                                                                                                                                                                                                                                                             |
| `--button-active-box-shadow`                | inherits `--button-box-shadow`                    | box-shadow         | Box shadow on active/pressed state.                                                                                                                                                                                                                                                                                                                                                                                  |
| `--button-focus-visible-box-shadow`         | inherits `--button-box-shadow`                    | box-shadow         | Box shadow on keyboard focus (`:focus-visible`), e.g. a focus ring, without `:global()`.                                                                                                                                                                                                                                                                                                                             |
| `--button-progress-loader-background-color` | `#00000030`                                       | background         | Background color of the progress bar overlay.                                                                                                                                                                                                                                                                                                                                                                        |
| `--button-progress-loader-duration`         | `8s`                                              | animation-duration | Duration of the progress bar fill animation.                                                                                                                                                                                                                                                                                                                                                                         |

## Type Reference

Custom types used by this component's props and events:

### ButtonVariant

```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'brand';
```

### ButtonSize

```typescript
type ButtonSize = 'sm' | 'md' | 'lg';
```

### LoaderType

```typescript
type LoaderType = 'Circular' | 'ProgressBar';
```

> **Note:** the `variant`/`size` presets only set internal default values — they never override an explicit `--button-*` variable or a `classes` recipe. This is what keeps existing consumers (e.g. apps that already drive `--button-color` through their own utility classes) rendering unchanged.

## Internal Dependencies

This component uses the following library components internally:

- Loader (for the circular spinner mode)

## Web Component

Tag: `<sui-button>`

```html
<sui-button text="Submit"></sui-button>

<!-- With icon slot -->
<sui-button text="Download">
  <svg slot="icon">...</svg>
</sui-button>

<!-- With custom content -->
<sui-button>
  <span>Custom <strong>content</strong></span>
</sui-button>

<!-- A long label that truncates inside a constrained parent -->
<sui-button text="A very long button label" shrinkable></sui-button>
```

`shrinkable` is a boolean attribute, and assigning `el.shrinkable = true` works too (the element keeps the `shrinkable` attribute in step with the property). In a custom-element consumer the `<sui-button>` host, not the inner container, is the flex or grid item, so the host also gets `min-width: 0` and `max-width: 100%` while `shrinkable` is set. As with the Svelte component, only the `text` label is truncated; slotted content has to manage its own overflow.

### Slots

| Slot Name   | Maps to Snippet | Description                                                  |
| ----------- | --------------- | ------------------------------------------------------------ |
| _(default)_ | `children`      | Custom content rendered inside the button (replaces `text`). |
| `icon`      | `icon`          | Icon content rendered next to the button text.               |

### Web Component Events

Every callback prop this element declares — `onclick`, `onkeydown`, `onkeyup`, `onmousedown`,
`onmouseup`, `onmouseleave`, `ontouchstart`, `ontouchend` — is a JS-property callback only and
none dispatches a DOM event: each name is already a native `HTMLElement` event, so the real one
already bubbles out of the shadow root on its own, and a second, synthetic one under the same
name would double-deliver it to a `button.addEventListener(...)` listener.

## Accessibility

Under `prefers-reduced-motion: reduce` the continuous fill becomes **five discrete jumps** rather than being removed outright: a bare "stop" would freeze the bar at its base `width: 100%` and read as finished for the whole duration it is actually still counting. Stepping holds each interval's PRIOR value, so the bar can under-report elapsed time but never overstate it. The step count is deliberately **not** a token — `steps()` is invalid below 1, and an invalid value drops the whole declaration and restores the continuous slide, so a tunable here would let a consumer switch the guard off by accident.
