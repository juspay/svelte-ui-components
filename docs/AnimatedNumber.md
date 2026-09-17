# AnimatedNumber

A per-digit odometer for numeric displays. Each digit is an overflow-clipped column holding the glyphs 0–9; changing `value` rewrites one inline `--_animated-number-digit` custom property per column and hands the browser exactly one interpolation per column, from which every glyph's position is recomputed (see [How the roll works](#how-the-roll-works)). It runs no timer of its own — no `requestAnimationFrame`, no `setInterval`, no `$effect` — so the browser's own animation engine owns the motion, and `prefers-reduced-motion` is honoured in CSS (see [Reduced motion](#reduced-motion)). Accepts either a raw `number`, formatted through `Intl.NumberFormat`, or an already-formatted `string`, diffed character by character — which is what lets a consumer's own formatter, or a pre-formatted prop like `StatCard.value`, roll to its new value instead of jumping. Use it for a dashboard metric, a live transaction counter, or any headline number that should visibly count to its new value. For a fill/percentage indicator rather than a numeric readout, use `Gauge` or `Progress` instead; for text that should reveal progressively rather than a number that rolls, use `TypewriterText`.

## Usage

### Numbers

A `number` value is formatted with `Intl.NumberFormat` (locale `'en-US'` by default) and decomposed into columns keyed by place value from the ones digit, so a magnitude change only adds a column instead of renumbering the ones already on screen.

```svelte
<script>
  import { AnimatedNumber } from '@juspay/svelte-ui-components';

  let total = $state(1482);
</script>

<AnimatedNumber value={total} />
<button onclick={() => (total += 137)}>+137</button>
<!-- 99 -> 100 is the interesting case: the two existing columns roll, and the
     new leading column mounts at rest instead of counting up from zero. -->
```

### Grouping by locale

`locale` changes more than the glyphs — it can move where the group separators fall. Pass an explicit `locale` per instance rather than relying on the runtime default (see [SSR](#ssr) for why the component itself defaults to a fixed `'en-US'`).

```svelte
<!-- en-IN groups 1,00,000 rather than 100,000 -- the separator positions move,
     not just the digits between them. -->
<AnimatedNumber value={1234567} locale="en-IN" />
```

### Format options

`format` is passed straight through to `Intl.NumberFormat` and only applies when `value` is a `number`.

```svelte
<AnimatedNumber value={99.99} format={{ style: 'currency', currency: 'USD' }} />
<AnimatedNumber value={0.42} format={{ style: 'percent' }} />
```

### Pre-formatted strings — the StatCard case

When `value` is a `string`, no `Intl.NumberFormat` call happens at all — the string is split into a left-anchored non-digit prefix, a right-keyed numeric body, and a right-anchored non-digit suffix, and each digit in the body animates on its own. This is what lets `StatCard`'s already-formatted `value` (or any other formatter you own) roll instead of jump, without ever surfacing the underlying number.

```svelte
<script>
  import { AnimatedNumber } from '@juspay/svelte-ui-components';

  // The same already-formatted string a StatCard.value prop would hold --
  // never the raw number behind it.
  let gmv = $state('₹1.23Cr');
</script>

<AnimatedNumber value={gmv} />
<button onclick={() => (gmv = '₹1.45Cr')}>next value</button>
<!-- ₹1.23Cr -> ₹1.45Cr rolls the two digits and leaves ₹, the decimal point
     and Cr untouched, because the prefix/suffix are anchored independently of
     the numeric body. ₹12.4Cr -> ₹98.7L is a genuinely different shape and
     degrades to a character swap -- see Limitations. -->
```

### Theming through the motion tokens

```svelte
<div class="slow"><AnimatedNumber value={total} /></div>
<div class="snappy"><AnimatedNumber value={total} /></div>

<style>
  /* Slows every tokenised component under this node, AnimatedNumber included. */
  .slow {
    --motion-duration: 2s;
  }
  /* Overrides only this component's own token, which wins over --motion-duration. */
  .snappy {
    --animated-number-digit-transition-duration: 120ms;
    --animated-number-digit-transition-easing: cubic-bezier(0.2, 0.9, 0.3, 1.3);
  }
</style>
```

## Props

| Prop      | Type                               | Required | Default   | Description                                                                                                                                                                                                                                                                        |
| --------- | ---------------------------------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| value     | `number \| string`                 | Yes      | `-`       | The value to display. A `number` is formatted through `Intl.NumberFormat` and decomposed semantically (digit vs. group separator vs. currency symbol). A `string` is taken as already-formatted and diffed against the previous string directly, with no formatting applied to it. |
| locale    | `string`                           | No       | `'en-US'` | BCP 47 locale used to format a numeric `value`. Pinned rather than left to the runtime default so the server-rendered markup and the first client frame stay byte-identical — see [SSR](#ssr).                                                                                     |
| format    | `Intl.NumberFormatOptions`         | No       | `-`       | `Intl.NumberFormat` options applied when `value` is a number. Has no effect on a string `value`.                                                                                                                                                                                   |
| live      | `'off' \| 'polite' \| 'assertive'` | No       | `'off'`   | Whether value changes are announced. Left `'off'`, the accessible name still updates, it just doesn't interrupt. See [Accessibility](#accessibility).                                                                                                                              |
| ariaLabel | `string`                           | No       | `-`       | Overrides the accessible name, which otherwise mirrors the visible text exactly.                                                                                                                                                                                                   |
| testId    | `string`                           | No       | `-`       | Value for the `data-pw` attribute on the root element, used for Playwright test selectors.                                                                                                                                                                                         |
| classes   | `string`                           | No       | `-`       | Extra CSS class names appended to the root element. Useful for theming — define classes with CSS variable overrides and pass them to create variant styles.                                                                                                                        |

## CSS Variables

Override these custom properties to theme the component. The two motion variables each fall back through a library-wide root token before the literal default, per `DESIGN_PRINCIPLES.md` §1 ("Theming is an API contract").

| Variable                                      | Default           | CSS Property                            | Description                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--animated-number-color`                     | `inherit`         | color                                   | Text color of the whole component.                                                                                                                                                                                                                                                                                                                           |
| `--animated-number-font-variant-numeric`      | `tabular-nums`    | font-variant-numeric                    | Numeric glyph variant. `tabular-nums` gives every digit the same advance width _if the loaded font implements the feature_ — see [Limitations](#limitations).                                                                                                                                                                                                |
| `--animated-number-row-height`                | `1.2em`           | height, line-height, roll distance      | Height of one digit row, which is also how far a glyph travels in one step.                                                                                                                                                                                                                                                                                  |
| `--animated-number-digit-width`               | `1ch`             | width                                   | Width of each digit column.                                                                                                                                                                                                                                                                                                                                  |
| `--animated-number-fade-height`               | `0.28em`          | mask-image, padding-block, margin-block | How much of the top and bottom edge fades out as a glyph leaves. Drawn in padding either side, given back to the line box by an equal negative margin, so it never eats into the glyph at rest or shifts the baseline.                                                                                                                                       |
| `--animated-number-digit-transition-duration` | `0.9s`            | roll duration                           | Duration of a column's roll. Full chain: `var(--animated-number-digit-transition-duration, var(--motion-duration, 0.9s))` — falls back through the shared `--motion-duration` token before the literal `0.9s`. Resolved in CSS and read back by the component, so the chain behaves exactly as it would on a `transition` even though the motion is not one. |
| `--animated-number-digit-transition-easing`   | spring `linear()` | roll easing                             | Easing curve of a column's roll. Full chain: `var(--animated-number-digit-transition-easing, var(--motion-easing, linear(…)))` — falls back through the shared `--motion-easing` token before a sampled spring curve. Any easing a CSS animation accepts works here.                                                                                         |

## Web Component

Tag: `<sui-animated-number>`

```html
<sui-animated-number value="1,482"></sui-animated-number>
```

**The `value` HTML attribute always takes the pre-formatted-string branch, never the numeric one.** An HTML attribute is always text, and this wrapper declares `value: { type: 'String' }` — there is no attribute encoding that could tell "this text is secretly a number" apart from "this is already formatted," so `<sui-animated-number value="1234567" locale="en-IN">` renders exactly those seven characters as static digit columns, with **no** locale-aware grouping added, `locale` and `format` notwithstanding. For real `Intl.NumberFormat` behaviour — grouping, currency, percent — set the `value` **property** in JavaScript with an actual number instead of the attribute:

```html
<sui-animated-number id="revenue" locale="en-IN"></sui-animated-number>

<script>
  const el = document.querySelector('#revenue');
  el.value = 1234567; // a real number -- full Intl.NumberFormat + locale grouping
  el.format = { style: 'currency', currency: 'INR' }; // object props are JS-only
</script>
```

`format` has no attribute encoding at all and must be set as a JS property, the same as `DeltaIndicator`'s own `format` function prop.

The `aria-label` HTML attribute works as usual (`<sui-animated-number aria-label="...">`), but its JS property is named `animatedNumberAriaLabel`, not `ariaLabel` — `HTMLElement` already defines an `ariaLabel` accessor of its own, so the component's prop is exposed under a different property name to avoid shadowing the platform's:

```js
document.querySelector('sui-animated-number').animatedNumberAriaLabel = 'Total revenue';
```

`testId` maps to the `test-id` attribute.

## Accessibility

Whenever there is a value to announce, the root carries `role="img"` with an `aria-label` that mirrors the visible text exactly — `plainText` is computed from the same `Intl.NumberFormat` parts (or the same string) that produce the glyphs, so the accessible name can never drift from what's on screen. Pass `ariaLabel` to override it with something more descriptive (e.g. `"Total revenue, 1,482 rupees"`). An empty value with no `ariaLabel` carries neither attribute, for the reason given under [Limitations](#limitations) — an image with no accessible name is worse than no image at all.

Every digit column and literal separator sits inside a single inner wrapper marked `aria-hidden="true"`. Assistive technology never sees the ten stacked glyphs per column, or the odometer structure at all — it only ever gets the one `aria-label` string, read as a static image, which is also why partial or mid-roll DOM states are never exposed to a screen reader.

An element with nothing to announce is not announced as anything: when the formatted value is empty and no `ariaLabel` is given, the root drops `role="img"` and renders as a plain span rather than putting an unnamed graphic in the accessibility tree, which WCAG 1.1.1 does not allow. An explicit `ariaLabel` still makes it an image, because then it does have something to say. `aria-live` is never gated this way — a live region has to be present before the change it announces, so an element that starts empty and fills in later still carries it.

`live` defaults to `'off'`, which means the `aria-live` attribute is omitted from the DOM entirely rather than set to the literal string `"off"`. The accessible name still updates on every `value` change — a screen reader will read the new value the next time it lands on the element — it just isn't interrupted into. Set `live="polite"` to have changes announced as they happen, but reserve it for values that change at a human pace (a total that ticks up every few seconds), not one driven every animation frame or every few hundred milliseconds: `polite` queues one announcement per change with **no coalescing**, so a rapidly changing value produces a growing backlog of stale announcements rather than one that lands on the current value. `'assertive'` exists for the rare case that genuinely warrants interruption; treat it the same way you would any other assertive live region — sparingly.

### Reduced motion

AnimatedNumber carries its own `@media (prefers-reduced-motion: reduce)` block, which collapses the
roll's resolved duration to `0s`. A reader who has asked their operating system for reduced motion
sees each digit change to its new value directly, with no roll, and no configuration required of the
consuming application.

That block is necessary rather than redundant. `DESIGN_PRINCIPLES.md` §1 notes that only an animation
with no natural end needs a guard of its own, because `--motion-duration: 0s` would strand it on a
keyframe meaning something else; a finite one has no such hazard. True — but that reasoning only stops
the motion if something actually assigns the token, and by design nothing in this library ever does.
`--motion-duration` exists as the middle rung of a fallback chain for a consumer to reach, so left to
the chain alone the preference would have had no effect at all.

The guard lives in CSS rather than in a `matchMedia` call for two reasons. The component's own
`<style>` is the only stylesheet that reaches inside the shadow root a custom-element consumer gets,
so a script-side check would not be themeable by one. And it keeps a single mechanism for both routes:
the component reads the resolved duration back off the computed style before deciding whether to
animate, so a zero from the media query and a zero from `--motion-duration` are the same zero. Nothing
starts, so nothing has to be stopped in a meaningful state — the digit is simply already correct.
Measured, with the preference set and no token wired: a column that otherwise interpolates across
eight distinct intermediate frames reports exactly one, with no animation object on the element at all.

The token chain still works and is still the way to change how fast motion runs, or to switch it off
for reasons other than the OS preference:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration: 0s;
  }
}
```

## SSR

`locale` defaults to a fixed `'en-US'` rather than the runtime's ambient default. `Intl.NumberFormat` called with an `undefined` locale resolves against whatever the executing environment reports, and that can differ between the process that prerenders a page and the browser that hydrates it — a mismatch there would make the server-rendered digits disagree with the first client render. Pinning the default keeps them byte-identical; passing an explicit `locale` is safe as long as it resolves the same way on the server and in the browser (a literal locale string is; deriving one from something like `navigator.language` at render time is not, since that API doesn't exist server-side).

The roll is gated behind a `mounted` flag that only flips to `true` inside `onMount`, which never runs during server rendering. Columns that exist on the first paint are therefore at rest rather than arriving: every digit paints at its final resting position, and nothing counts up from zero as the page loads or hydrates. A column that appears _later_, because the value grew a digit, mounts with the flag already set and does roll in — from `0`, which is what it implicitly was before it existed.

The server-rendered markup is also complete on its own. Every glyph's position is CSS arithmetic over `--_animated-number-digit`, which is inline in the markup, plus an animated correction that is zero at rest — so the prerendered HTML already shows the right digits with no script having run.

## How the roll works

Each column holds every glyph of the active numbering system at once, and each glyph resolves _its own_
position from a single scalar: `mod()` places it on the wheel relative to the digit on show, a
`round(down, …)` step re-centres that so a glyph is placed on whichever side it is nearer, and a
`clamp()` parks anything further than one box away at exactly one box away.

The scalar is `--_animated-number-digit + --_animated-number-delta`. On a change the digit jumps
straight to its new value and the delta is animated from `-delta` back to `0`, so their sum travels
from the old digit to the new one. Nothing has to remember where it started, and the delta always ends
at zero — it is a correction applied to a column that already holds the answer, not the position
itself.

**No glyph's position is ever animated directly**, and that distinction is the mechanism rather than an
implementation detail. Animating each glyph's own `transform` interpolates the resolved before and
after values, so a glyph parked a full box _above_ whose offset wrapped to a full box _below_ gets
tweened straight through the middle — a full-size unrelated digit sliding across the number mid-roll.
Moving one scalar and recomputing the offsets every frame cannot produce that, because every glyph's
position stays a continuous function of one moving value. The suite asserts it directly: across every
frame of a roll, the only glyphs inside a column's window are the one leaving and the one arriving, and
together they cover it exactly once.

How far a wheel turns is taken from the direction the **whole number** moved, not from the column's own
before-and-after. That is the single thing that makes `99 → 100` work: judged per column, each of those
nines sees a difference of `-9` and rolls nine positions backwards while its neighbour rolls one
forwards — the number visibly tearing itself apart. Given the shared direction, each nine steps forward
exactly one position, and `100 → 99` does the same in reverse.

Because the motion is one interpolated custom property rather than a `transition`, it needs
`@property` registration (for the delta to interpolate at all rather than jump at the halfway point),
`mod()`, `round()` and `linear()`. The component feature-detects all four and falls back to changing
instantly without them. The registration is done from script rather than by an `@property` rule in this
stylesheet because an `@property` inside a shadow root does not register — measured in both Chromium
and WebKit — which would have left `<sui-animated-number>` silently un-animated while the Svelte
component moved.

Overlapping rolls compose rather than replace each other, so a value that changes again mid-roll stays
continuous instead of snapping to the newest target.

The column clips to its own box and fades the last sliver at the top and bottom
(`--animated-number-fade-height`), so a glyph softens as it leaves rather than being cut mid-stroke.
One box is also exactly what a step of one digit travels, so the arriving glyph lands flush rather than
poking into the fade band where the mask is still opaque.

## Limitations

- **Shrinking the digit count disappears abruptly.** A column that is _entering_ has an implicit previous value of `0` to roll in from; one that is about to be removed has nowhere to roll out to, and Svelte removes it as soon as the value changes. Going from `100` to `99` (or from a wider string to a narrower one) drops the leading column outright rather than rolling it out; only growth (`99` → `100`) gets the roll-in treatment. The surviving columns still roll correctly in both directions.
- **The number's width changes in one step.** Adding or removing a column resizes the element immediately while the digits roll over 0.9s, so surrounding inline text reflows before the roll finishes. The reference implementation this is modelled on additionally animates the horizontal shift and the overall width; that is not ported here.
- **Locales with their own numerals are supported, on both paths.** The odometer's glyph set and its digit parsing are both derived from the numbering system `Intl.NumberFormat` resolves for `locale`, never hardcoded to `0`–`9` — and that includes the string path, which asks the same question rather than matching `\D` (ASCII-only, which used to swallow every non-Latin numeral into the prefix and render it as static text). Pass `locale="ar-EG"` a number or a string that locale formatted, and `١٢٣٤` rolls; the visible glyphs always match the accessible name.

  Which numbering system a locale resolves to is the engine's own ICU data, and engines disagree: measured on this repo's toolchain, `bn-BD` is `beng` in Node and Chromium but `latn` in WebKit, and `ne-NP` is `deva` in Node and WebKit but `latn` in Chromium. The component follows whatever `Intl` reports, so a pre-formatted string must come from the same locale it is rendered with — a Devanagari string handed to an engine that resolves that locale to Latin is, correctly, not digits. Right-to-left _layout_ is the browser's own bidi handling and is not specially managed here.

- **Copying the number gives the number.** Every column keeps all ten glyphs in the DOM so a roll has something to move through. At rest the nine that are not showing are `display: none` and marked `inert`, but they return for the duration of a roll, and they are real text nodes that a selection would otherwise sweep up. The glyph stack is therefore `user-select: none`, and the value is carried separately by a visually-hidden `.animated-number-plain` node, so selecting and copying a displayed `1,234` yields `1,234` — at rest and mid-roll.

  That node carries `aria-hidden` of its own. Being clipped rather than `display: none` is what keeps it in the text layer where selection can reach it, and that kept it in the accessibility tree too. Sitting inside the `role="img"` root is not enough: ARIA says a user agent SHOULD treat an `img`'s children as presentational, and Chromium does not. Measured before the guard was added, one counter exposed `image "99"`, `StaticText "99"` and `InlineTextBox "99"` — the number announced twice, and for an adopter like `Badge`, whose root is a `status` live region, twice on every change. `tests/animated-number-a11y.test.ts` reads the browser's own accessibility tree and asserts exactly one named node, because no DOM-level assertion can tell the two states apart.

- **Digit-column stability depends on the consumer's font.** The default `--animated-number-font-variant-numeric: tabular-nums` only produces equal-width digits if the loaded font actually implements the OpenType `tnum` feature. This library ships no font stack of its own, so a font without tabular figures will still render proportionally-spaced digits inside a fixed `--animated-number-digit-width` (`1ch`) box, which can visibly jitter or clip during a roll. Pick (or pin) a font with tabular figures at the call site.
- **Opting in can move the layout very slightly.** A digit column is a fixed-width, fixed-row-height box, where the plain text it replaces was neither, so a component that switches its flag on is not always pixel-identical. Measured at 16px: `Badge` grows 1.39px taller, because the default `--animated-number-row-height` of `1.2em` is taller than the badge's own line box — setting `--animated-number-row-height: 1em` restores the original height exactly. `DeltaIndicator` grows 3.31px wider, because `--animated-number-digit-width` reserves `1ch` per digit rather than each glyph's natural advance; that reservation is what stops the number jittering as its digits change, so it is inherent rather than a defect, and `--animated-number-digit-width` tunes it. Every other adopter measured identical in both dimensions. The flag being **off** is byte-identical to the previous markup either way, which each adopter's own test asserts.
- **A string value that changes shape, not just digits, degrades to a swap.** The string path diffs by character position (prefix / numeric body / suffix), with no semantic understanding of what the text means. `₹1.23Cr → ₹1.45Cr` rolls cleanly because the shape is identical. `₹12.4Cr → ₹98.7L` is a genuinely different shape — different suffix, different digit count — so the position-keyed columns just swap their content instead of animating a clean roll. Expect a clean roll only between values a human would agree "look the same shape."
