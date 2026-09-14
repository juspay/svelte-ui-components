# Chart Input Policy

`LineChart` and `AreaChart` share one alignment and gap contract (see
[LineChart](./LineChart.md#sparse-series--gap-points) and
[AreaChart](./AreaChart.md#sparse-series--gap-points)), built on the same
`joinByX` primitive in `src/lib/_chart/geometry.ts`. This page is the single
place that states, for every input shape either chart's tests exercise, what
happens — so an unsupported or ambiguous shape reads as **explicit and
inspectable**, never as a plausible-looking but wrong chart.

The **non-finite** half of that contract binds every chart in the library, not
only those two: `BarChart`, `DualAxisBarChart`, `PieChart`, `SankeyChart` and
`FunnelChart` each honour it as well. They did not always, and the gap was not
visible from the outside — see
["Why a non-finite value is never just one bad point"](#why-a-non-finite-value-is-never-just-one-bad-point)
for what each chart used to do instead, which is the reason this page now
states the rule for all seven rather than for the two that happened to
implement it first.

## "Unknown", "absent", "zero" and "invalid" are not synonyms

These four words describe different data, and the charts render each one
differently. Conflating any two of them is the most common way a chart ends
up telling a misleading story:

| Word        | Meaning here                                                                                                                                         | How it is represented                                                    | How it renders                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **absent**  | This series has no sample at this x at all.                                                                                                          | The x simply does not appear in that series' `data` array.               | No point, no marker, no segment for that series at that column — not a 0.                          |
| **zero**    | This series was sampled at this x and the measured value is 0.                                                                                       | `{ x, y: 0 }`.                                                           | A real point at y = 0. Included in totals, hit-testing, and the tooltip.                           |
| **unknown** | A value that cannot be computed from the data given (e.g. a stacked column whose total is 0, so "percent of total" is mathematically indeterminate). | No dedicated sentinel — see the "Unknown totals" row of the table below. | Currently rendered as `0`, documented here as a known simplification, not a true "unknown" marker. |
| **invalid** | A value that was measured but is not a real number (`NaN`, `Infinity`, `-Infinity`).                                                                 | `{ x, y: NaN }` (or `±Infinity`).                                        | Treated as a **gap**: see the "Null / NaN / Infinity" row of the table below.                      |

Do not use `0` to mean "absent" (that fabricates a data point that was never
sampled) and do not use `NaN` to mean "zero" (that erases a real measurement).

## Input policy table

| Input shape                           | Example                                                                                                      | Behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empty**                             | `series = []`, or every series has `data: []`                                                                | `isEmpty` is `true`. With an `empty` snippet supplied, the chart renders that INSTEAD of the plot. **Without one it renders the ordinary frame** -- both axes, and the legend whenever `showLegend` is set and there is more than one series -- over an empty plot area. That is the behaviour of every chart in the family: each one gates only on `isEmpty && typeof empty === 'function'`, so there is no second, snippet-less empty state to fall into. An earlier version of this row promised "axes/legend omitted", which no chart has ever done; the measured behaviour is documented here instead of the intended one. Note the consequence when passing named-but-empty series: the legend lists them, so a two-series request with no data still shows two legend entries. |
| **All-zero**                          | Every point is `{ x, y: 0 }`                                                                                 | Rendered like any other data: a flat line/area at y = 0. The y-domain still runs `niceLinearDomain(min(0, …), max(…))`, so an all-zero series shows a visible flat line at the bottom of a chart that has _some_ positive headroom, not a chart squashed to a single pixel row.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Single point**                      | One series, one `{x, y}`                                                                                     | LineChart: renders a full-width flat horizontal line at that y (design-system contract — a single dot with no line reads as a rendering glitch). AreaChart: cannot fill an area from a single point (no width), so it renders a single dot marker instead (only when `showDots` is `false`; with `showDots` the normal dot already covers it).                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| **Sparse series**                     | `[{x:1,y:10},{x:2,y:NaN},{x:3,y:30}]`                                                                        | The line/area breaks around the gap and resumes at the next finite point. See the "Null / NaN / Infinity" row of the table below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Null / NaN / Infinity**             | `y: NaN`, `y: Infinity`, `y: null` (after a lossy transport round-trip — see below)                          | Any **non-finite** `y` (`Number.isFinite(y) === false`, which covers `NaN` and both `Infinity`s) marks a **gap**: no marker, no data label, excluded from hover/tooltip/hit-testing, and excluded from the auto-computed axis domain so one gap cannot poison the whole chart's scale (`Math.max(❨…, NaN)` degrading to `NaN` was exactly the AreaChart defect this contract fixes). A non-finite **x** cannot be placed in a column at all and is dropped from the join entirely — this is a different, more unusual case than a gap `y`, since it has no valid position at any axis tick.                                                                                                                                                                                           |
| **Negative values**                   | `y: -40`                                                                                                     | Supported directly. Non-stacked mode's y-domain is `niceLinearDomain(Math.min(0, …allY), Math.max(…allY))`, so the domain always includes 0 and extends below it when any value is negative — the chart never silently clips a negative value out of view. **Stacked/normalized mode clamps negative values to 0** (`Math.max(0, entry.point.y)`) when computing a column's total and stack height: a negative contribution to a stack or a percent-of-total does not have a well-defined visual meaning (a slice cannot have negative height), so it is treated as a 0 contribution rather than inverting the stack or producing a negative percentage.                                                                                                                              |
| **Reordered times**                   | `[{x:3,y:…},{x:1,y:…},{x:2,y:…}]`                                                                            | `joinByX` produces one row per distinct finite x, **sorted ascending**, regardless of input order — callers do not need to pre-sort. A duplicate x within one series resolves last-wins (the last matching point in array order), rather than privileging an arbitrary "first sample" when the array isn't time-ordered.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Unknown totals** (`stackNormalize`) | A stacked, normalized column where every series is absent or clamps to 0 at that x, so the column total is 0 | `columnTotalAtX` returns `0`; dividing by that would produce `NaN`/`Infinity`, so the normalized value is defined as `0` instead. This is a deliberate simplification, not a true "unknown" result: **a `0%` bar in a `stackNormalize` chart at a column whose real total is 0 looks identical to a column where every series is genuinely 0% of a nonzero total.** If that distinction matters for a given dataset, do not use `stackNormalize` for it — or check `columnTotalAtX`-equivalent totals yourself before rendering, since the chart does not surface "no total to normalize against" as a separate visual state.                                                                                                                                                         |

## Two ways to honour the contract, and why the choice is forced

"Treated as a gap" is the right rule for a chart whose marks have a position
on an axis. It is not available to a chart whose marks are shares of a whole.
A `LineChart` can simply not draw a point at x = 3; a `PieChart` cannot not
draw a slice, because the slice's neighbours are positioned by its angle, and
a `FunnelChart` stage is a fixed structural column with a category label above
it. Dropping either one would renumber everything after it.

So the contract has two shapes, and which one applies is decided by the chart,
not by the caller:

| Treatment             | Applies to                                                                | What a non-finite value does                                                                      |
| --------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **gap-exclusion**     | `LineChart`, `AreaChart`, `BarChart` (grouped/single), `DualAxisBarChart` | Excluded from the auto-computed domain. No marker, no label, no hit-testing. The mark is absent.  |
| **zero-contribution** | `BarChart` (stacked), `PieChart`, `SankeyChart`, `FunnelChart`            | Contributes 0 to the total. The mark is still present, at zero size, keeping its index and label. |

Both rules exist to enforce the same guarantee, which is the one that actually
matters: **one invalid value may only damage itself.** It may never change how
any other point in the chart is drawn.

## Why a non-finite value is never just one bad point

The reason this needs stating is that the failure it prevents is not local,
and is not loud. `Math.max(…, NaN)` is `NaN`, so a single bad value reaching
an extent poisons the scale that positions _every_ mark. `NaN === NaN` is
`false`, so the `if (min === max)` degenerate-domain guard never fires for it.
`NaN > max` is `false`, so a maximum-finding loop silently skips it — which
looks like a guard and is an accident, and does not hold for `Infinity`, which
passes that same comparison and poisons the maximum outright.

Nothing throws. Browsers silently drop an SVG path whose `d` contains `NaN`,
so the plot area simply empties while the axes, legend and focusable,
ARIA-labelled mark elements all remain. Worse, accessible names are computed
from the _raw_ values rather than the corrupted scale, so a bar with a
perfectly good value still announces "Jan: 42" to a screen reader and to any
test asserting on accessible text, while a sighted user sees nothing at all.
A CI suite and an accessibility audit can both pass over a chart that renders
nothing.

What each chart did before honouring the contract, all from one bad value:

| Chart              | Observable result                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `BarChart`         | Every bar's path invalid and unpainted; **zero** ticks on the value axis; category axis fine      |
| `DualAxisBarChart` | The same, via its own unguarded `axisDomain`                                                      |
| `PieChart`         | Every slice invisible, and **every** slice's percentage — not just the bad one's — reading `NaN%` |
| `SankeyChart`      | All nodes `y=NaN`, propagating two columns downstream of the bad link                             |
| `FunnelChart`      | `NaN`: one bar. `Infinity`: **all** bars collapsed to the 2px floor                               |

Note the last row. `NaN` and `Infinity` are not interchangeable, and a guard
written with `Number.isNaN` rather than `Number.isFinite` catches only half of
this table.

## NaN is not a JSON value

`Number.isFinite` is what both charts use to distinguish real values from
gaps, but the gap sentinel these charts consume — `NaN` — **cannot survive a
JSON round trip**:

```js
JSON.stringify({ x: 2, y: NaN }); // '{"x":2,"y":null}'
JSON.parse('{"x":2,"y":null}').y; // null, not NaN
```

`JSON.stringify` has no encoding for `NaN` (or `±Infinity`) and silently
substitutes `null`. A server that means "no reading at x=2" has to pick a
serializable representation, and **`null` on the wire is that
representation** — but `null` is not itself a value either chart understands
for `y` (`Number.isFinite(null)` is `false` in the sense that comparisons
would misbehave, but the component's types declare `y: number`, so a raw
`null` should never reach the component untransformed). The adapter between
"data over the wire" and "props passed to `LineChart`/`AreaChart`" is
responsible for converting the wire's missing-value marker back into the
in-memory gap sentinel before the chart ever sees it:

```ts
// Inbound adapter: JSON's null (or a genuinely absent field) becomes the
// in-memory gap sentinel these charts already know how to render.
function toGapAwarePoint(raw: { x: number; y: number | null }): { x: number; y: number } {
  return { x: raw.x, y: raw.y === null ? NaN : raw.y };
}
```

This conversion is **not currently built into either component** — it is
documented here as the caller's responsibility (and a known gap in this
package) because a chart cannot distinguish "the API told me this was
missing" from "the API sent a real, currently-unusual number" once the value
is already `null` on the wire; only the layer that knows the wire format can
make that call.

## Calendar / temporal axes

Both charts' x axis is a plain **numeric linear scale**
(`createLinearScale` in `src/lib/_chart/scales.ts`). Passing epoch
milliseconds as `x` works, and relative distance is preserved (`t2 - t1` in
data means the same thing in pixels as it does in time) — but
`computeLinearTicks`'s "nice round number" tick placement is **not
calendar-aware**: it lands ticks on values like `1_700_000_000_000` or a
rounded millisecond step, not on UTC midnight/week/month boundaries.
`xTickFormat` only changes how a tick's already-placed numeric position is
**labelled**; it cannot move that position onto a calendar boundary, and
neither chart silently replaces the time scale with array indices to work
around this.

`src/lib/_chart/temporal.ts` is an **optional temporal adapter** for exactly
this gap: `computeUtcTicks(domain, unit, maxTicks)` computes tick
_positions_ (still epoch-ms, still on the same linear scale) that land on
real UTC day/week/month boundaries, and `formatUtcTick(value, unit)` labels
those positions as UTC calendar dates. Both are pure and fully covered by
`src/lib/_chart/temporal.test.ts`.

**Current limitation, stated plainly:** neither `LineChart` nor `AreaChart`
accepts an explicit tick-position override today — `Axis.svelte` (shared by
every chart type in this package, not only these two) always derives its own
tick positions from `scale.ticks(tickCount, integerTicks)`, and `xTickFormat`
only relabels a tick position the axis already chose. Wiring a tick-position
override into `Axis.svelte` would change a contract every chart in the
package consumes, so it is deliberately left out of this fix rather than
risked here. Until that exists, `computeUtcTicks`/`formatUtcTick` are useful
for a caller's _own_ presentation around the chart — a custom axis overlay,
a legend of period boundaries, or bucketing source data onto calendar-aligned
x values before it reaches the chart — not for changing where `LineChart`/
`AreaChart` themselves draw their tick marks. This is the documented
limitation, not a silent one: the axis does not fall back to array indices,
it stays linear and epoch-based, and a caller who never imports
`temporal.ts` sees no change at all.
