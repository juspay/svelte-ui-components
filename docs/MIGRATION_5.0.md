# Migration to 5.0.0

Seven things break. Four are detectable by tooling, one is fixable by a
codemod, and two can only be handed to you with a compatibility shim and an
explanation — because whether they break _you_ depends on your layout, which
is not in this library's source.

```bash
npm run migrate -- ../your-app            # report only, writes nothing
npm run migrate -- ../your-app --apply    # also writes the version range
```

## Why this is a major

The changes below alter what an unchanged call site renders or does. Some of
them are corrections — a chart that silently drew nothing now draws correctly,
text that failed WCAG AA now passes — but a correction that changes output is
still a breaking change, and shipping one as a patch is how a consumer's build
breaks overnight.

This library has made that mistake once already. `3.5.1` removed the
deprecated event-prop spellings in a patch release; `4.0.0` is that same
content renumbered, and `docs/MIGRATION_4.0.md` exists because of it. The rule
that came out of it is the one applied here: **if an unchanged call site
renders differently, it is a major.**

## The seven

### 1. Custom elements now declare their own `display`

**Affects:** every consumer of the web-component build.

Each of the 98 wrappers under `src/wc/components` now carries

```css
:host {
  display: var(--sui-<name>-display, block);
}
```

with `inline-block` instead of `block` for eleven of them (Avatar,
ChatSuggestions, Checkbox, DateRangePicker, DeltaIndicator, Img,
KeyboardInput, Label, LoadingDots, Radio, ThemeSwitcher).

Before, none of them declared `display` at all, so the browser's implicit
`display: inline` for an unrecognised element applied. That was the actual
defect: a percentage-width child of an inline host has no width to resolve
against, so `width: 100%` inside these elements silently did nothing.

What it costs you:

```html
<p>Status: <sui-badge>Active</sui-badge></p>
```

used to flow inline and now breaks the line.

**To restore the old behaviour while you check**, generate a shim:

```bash
node --experimental-strip-types scripts/migrate/host-display-compat.ts --out legacy-display.css
```

It emits one rule per element — `sui-badge { --sui-badge-display: inline; }` —
read from each wrapper's own `:host` declaration, so it cannot drift from the
source. Drop it in, confirm nothing moved, then delete rules as you adopt the
new defaults. Keeping it forever re-introduces the width bug it papers over.

`npm run migrate` reports `host-display-inline` in two shapes: a `sui-*` element
that is a direct child of a text-flow tag (`p`, `span`, `li`, `td`, `label`,
`h1`–`h6`, `a`, `button`), and one that sits beside other inline-level content —
another `sui-*` element, a non-whitespace text node, or an inline HTML tag. The
second is the common one:

```svelte
<div class="toolbar"><sui-button /><sui-button /></div>
```

Two buttons on one line before, stacked after. It does not fire for a lone
element (nothing to sit beside) or under a parent whose inline `style` makes it
a flex or grid container, where a child's `display` does not move its siblings.

It still cannot see inline-ness that comes from a CSS class rather than an
inline `style`, or siblings separated by `{#if}`/`{#each}`. Treat the report as
a floor, not a total.

### 2. `InputButton`'s `mandatory` now actually makes the field required

**Affects:** any `<InputButton mandatory>` without an explicit `required`.

`mandatory` used to draw the asterisk and nothing else — the field looked
required and submitted empty. It now sets native `required` and
`aria-required` on the Input it wraps, matching what the asterisk claims.

A form that previously submitted with that field blank now fails client-side
validation and will not submit. This is the only change here that can break a
user-facing flow rather than a layout.

`required` wins where both are passed (`typeof required === 'boolean' ? required : mandatory`),
so the fix is explicit:

```svelte
<!-- keep the asterisk, keep the old submit behaviour -->
<InputButton mandatory required={false} />
```

Reported as `inputbutton-mandatory`. A `{...props}` spread is reported as
`indeterminate-spread` rather than guessed at.

### 3. Charts have a minimum width

**Affects:** `AreaChart`, `BarChart`, `LineChart`, `DualAxisBarChart`,
`FunnelChart`, `SankeyChart`.

`.chart-container` gained `min-width: var(--chart-min-width, 160px)`. A chart
in a flex or grid cell narrower than 160px now refuses to shrink, and overflows
instead.

```css
/* opt back out, per chart or globally */
.your-narrow-cell {
  --chart-min-width: 0;
}
```

PieChart's `legend-right` layout is unaffected — it carries its own
`min-width: 0` at higher specificity.

Reported as `chart-min-width`, but only when the narrow width is a literal
inline `width`/`flex-basis` in pixels. A width from a class, a percentage, or a
bound style is invisible to it. This one is largely on you to check.

### 4. The chart tooltip wrapper changed class

**Affects:** anyone passing `tooltipSnippet` to `PieChart` or `SankeyChart`
_and_ styling the wrapper.

```
.chart-tooltip-slot   →   .chart-tooltip.unstyled     (plus .portal with tooltipPortal)
```

Your selector stops matching. Silently — there is no error for a CSS rule that
selects nothing.

This is the one that is mechanically fixable:

```bash
node --experimental-strip-types scripts/migrate/chart-tooltip-selector.ts ../your-app          # report
node --experimental-strip-types scripts/migrate/chart-tooltip-selector.ts ../your-app --apply  # rewrite
```

It rewrites `.css` and `.svelte` selectors and the literal string argument of
`querySelector`/`querySelectorAll`/`closest`/`matches`. It deliberately does
not rewrite the name inside comments or log messages.

Prefer `[data-pw="chart-tooltip"]`, which `ChartTooltip` always sets and which
survives class churn.

### 5. `BrandLoader`'s text is dark by default

`--loader-text-color` went from `white` to `#333333`, and `.sub-text` gained a
colour where it had none.

This one deserves a blunt warning: BrandLoader's documented primary use is a
full-screen splash **over dark imagery**. If that is your use and you never set
the variable, your brand name just turned dark-on-dark.

```css
sui-brand-loader,
.your-splash {
  --loader-text-color: white;
  --loader-sub-text-color: rgba(255, 255, 255, 0.8);
}
```

The generated `legacy-palette.css` covers both halves, but by different means
and in different sections. `--loader-text-color` had a previous literal
(`white`) and is pinned to it. `--loader-sub-text-color` did not exist before —
`.sub-text` declared no `color` at all and inherited one — so there is no
literal to restore, only inheritance. That is emitted as an empty value:

```css
:root {
  --loader-sub-text-color: ;
}
```

which makes `color: ;` invalid at computed-value time, which resolves to
`unset`, which for an inherited property is `inherit`. It looks like a typo and
is not one.

### 6. Roughly 48 default colours darkened for contrast

A WCAG-AA pass changed the _fallback_ literal of about 48 CSS custom
properties across the library — the value you get when you never set the
property yourself. Anything you already override is untouched.

Two groups feel this: a design that was colour-matched to the old shades, and
any visual-snapshot suite that photographs this library's defaults.

```bash
node --experimental-strip-types scripts/migrate/legacy-palette.ts --out legacy-palette.css
```

generates `:root` rules pinning each changed property to its 4.27.x value, by
diffing `origin/release` against this release rather than from a hand-written
list. A property whose fallback differs between its own usage sites is reported
as ambiguous and deliberately **not** pinned, because one `:root` rule could
not reproduce it.

Several of the old values fail WCAG AA. That is why they changed. This file
exists to make the change reviewable, not permanent.

### 7. `sui-chat-composer`'s `recording` no longer reflects

`recording` widened from `Boolean` to accept
`boolean | 'idle' | 'recording' | 'busy'`, and lost `reflect: true`.

Setting the property still works, including with a boolean, and the bare
presence attribute still means `true`. What stops working is reading it back
off the DOM:

```js
el.recording = true;
el.getAttribute('recording'); // was "", now null
```

Read the property, not the attribute.

The sharper case is CSS, because it fails silently:

```css
sui-chat-composer[recording] {
  /* never matches now */
}
```

Reported as `chat-composer-recording-reflect`, for that selector and for a
`getAttribute`/`hasAttribute('recording')` call in a file that also names
`sui-chat-composer`. A presence attribute you set yourself still means `true`,
so only the reflected-by-the-property path is affected.

## What does _not_ break

Listed because they show up in the diff and look alarming:

- **Charts no longer render `NaN`.** A non-finite data value is now a gap or a
  zero contribution instead of invalid SVG and `NaN%` labels. See
  [Chart Input Policy](./CHART_INPUT_POLICY.md). Previously the chart drew
  nothing while its accessible names still announced correct numbers — there
  was no working behaviour to depend on.
- **`sui-stepper`'s `onstepclick` was removed.** It was a dead accessor: it
  took your function and dropped it, with no error and no callback. Removing it
  changes nothing that worked.
- **Toast and OverlayAnimation transitions became `|global`.** They now play on
  first render, where before they silently did not.
- **Ten custom elements were added** to the web-component bundle, including
  `sui-sankey-chart`, which was previously exported as a Svelte component but
  never registered as an element.
- **`ariaLabel`/`attributes` renames on Checkbox and Input** are 4.0.0's, not
  this release's. See [MIGRATION_4.0.md](./MIGRATION_4.0.md) and
  `scripts/migrate/rename-host-reserved-props.ts`.

## What the tooling will not tell you

Stated plainly, because a migration report that looks exhaustive and is not is
worse than no report:

| Change              | Detected                                         | Missed                                                      |
| ------------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| `:host` display     | text-flow parent, or beside inline siblings      | inline-ness from a CSS class; siblings split by `{#if}`     |
| chart `min-width`   | literal inline px width under 160                | class widths, `%`/`rem`/`vw`, bound styles, **flex-shrink** |
| `mandatory`         | explicit attribute; spreads flagged separately   | nothing                                                     |
| tooltip selector    | static selectors and literal query strings       | computed selectors, `getElementsByClassName`                |
| `recording` reflect | CSS attribute selector; same-file `getAttribute` | the tag name reached through an imported constant           |
| colours             | `var(--name, <literal>)` fallbacks               | colours written without custom-property indirection         |

The `min-width` row hides the worst of these. A chart in `flex: 1; min-width: 0`
inside a tight row is narrowed by the flex algorithm with no width literal
anywhere in your source — measured overflowing inside a 96px flex item, and
invisible to static analysis. If you put charts in flex rows, look at them.

The two layout changes (1 and 3) cannot be resolved from source at all: whether
they break you depends on the box your element lands in. Generate the shims,
look at your pages, and remove the shims as you confirm each one.
