# Consumer migration to 3.x

Audits a consuming project against `@juspay/svelte-ui-components` 3.x, reports
exactly what stands in the way, and applies the dependency bump when nothing
does.

```bash
npm run migrate -- ../lighthouse            # report only
npm run migrate -- ../lighthouse --apply    # also write the version range
```

Nothing is written without `--apply`.

## What 3.0.0 actually breaks

Five things this script can find, and it should not be read as an exhaustive
list of everything PR 598 changed — only of what `analyzeSvelte` /
`analyzeStylesheet` below know how to look for:

1. **Toolbar's default back control.** With no `backIcon`, it changed from
   `<div role="button"><img /></div>` to `<button aria-label="Back"><svg /></button>`.
2. **InputButton's `mandatory` prop.** It used to draw only a decorative
   asterisk; it now also sets native `required`/`aria-required`
   (`typeof required === 'boolean' ? required : mandatory` — `required` wins
   whenever it is passed at all).
3. **PieChart/SankeyChart's custom-tooltip class.** `.chart-tooltip-slot` was
   replaced by `.chart-tooltip.unstyled` (plus `.portal` when `tooltipPortal`
   is set).
4. **Every `sui-*` wrapper's `:host` display default.** Each one now declares
   `display: block` or `display: inline-block` where the browser's implicit
   default for an unknown element — `inline` — used to apply.
5. **`.chart-container`'s new `min-width: 160px` floor**, which a narrow
   flex/grid parent that used to shrink the chart to fit will now overflow.

Everything else in 3.0.0 is additive, so a consumer that avoids all five needs
only a version bump.

## What the script reports

| Reason                        | Meaning                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-back-control`        | A Toolbar that really does render the changed control. Review the markup.                                                                               |
| `indeterminate-spread`        | A Toolbar or InputButton whose props are spread, so the relevant guard cannot be read statically.                                                       |
| `legacy-back-selector`        | CSS selecting an `<img>` inside the back control, which is now an `<svg>`.                                                                              |
| `inputbutton-mandatory`       | An InputButton passing `mandatory` without an explicit `required` — see point 2 above.                                                                  |
| `chart-tooltip-slot-selector` | CSS (a `.css` file or a `<style>` block) selecting `.chart-tooltip-slot` — see point 3 above.                                                           |
| `host-display-inline`         | A `sui-*` element found as the direct child of a text-flow element (`p`, `span`, `li`, `td`, `label`, `h1`–`h6`, `a`, `button`) — see the limits below. |
| `chart-min-width`             | A chart rendered inside a parent with an inline `width`/`flex-basis` literal under 160px — see the limits below.                                        |
| `BLOCKER`                     | Svelte below the `^5.41.2` peer, or the library not being a dependency.                                                                                 |

A Toolbar usage is **not** reported when it passes `showBackButton={false}` or
its own `backIcon` — both keep their previous behaviour exactly. Only a literal
`false` counts as disabling; a bound expression could be either, and guessing
would produce a confidently wrong report, so those are surfaced rather than
assumed. The same holds for InputButton: `mandatory={false}` is not reported,
and an explicit `required` (of either value) is left alone since it already
wins over `mandatory`.

### Known limits: `host-display-inline` and `chart-min-width`

Both of these ask a question static analysis cannot fully answer.

- **`host-display-inline`** would need to know the _computed_ layout context
  of every `sui-*` usage — whether some ancestor's CSS makes an implicit
  `inline` matter at all. That is not recoverable from source, so this only
  reports the one shape that reliably signals it: the element sitting directly
  inside a known text-flow tag. A `sui-*` element inside a `<div>` that itself
  sits inline via CSS, or one whose surrounding layout depends on a class
  defined elsewhere, is not reported — a false negative, not a false positive.
- **`chart-min-width`** would need the parent's _computed_ width, which is
  runtime information. This instead flags the one thing that IS visible
  statically: an inline `width` or `flex-basis` literal (in px) below 160.
  A narrow width coming from a CSS class, a percentage, `rem`/`em`/`vw` units,
  a bound `style` attribute, or a `style:width` directive is invisible to it
  and will not be reported.

Both detectors, and `inputbutton-mandatory`'s and `host-display-inline`'s
recognition of the raw `sui-*` custom-element spelling, depend on
`readWcComponents` reading `src/wc/components/*.wc.svelte` from this
library's own checkout at scan time — never a hardcoded list of tag names, so
it cannot drift as components are added, renamed, or reassigned a display
default.

## Design notes

**It reads the manifest, never `node_modules`.** An installed tree can be stale
relative to what the project declares — a checkout here reported Svelte 4.2.8
and library 1.34.0 while its own `package.json` asked for Svelte 5 and 2.19.2.
Reading the wrong one produces a confident, wrong answer about which framework a
project is on.

**It refuses to `--apply` while a blocker stands.** Bumping past an unsatisfied
peer produces a tree that cannot install or build, which is worse than refusing.

**`package.json` is rewritten as text**, not reserialised, so the file's own
formatting survives the edit.

## Verified against a real consumer

Run against lighthouse (385 `.svelte` files, Svelte `^5.55.9`), before the four
newer reasons existed:

```
No blockers and no affected Toolbar usage across 385 .svelte files.
This project can take 3.x with a dependency bump alone.
```

Its single Toolbar usage passes `showBackButton={false}`, so the changed control
never renders there. That clean result was checked against a negative control:
removing the guard from the same real file flags it at the exact Toolbar line,
confirming the zero is a real absence rather than a detector that finds nothing.

The wording of that summary line has since changed to be reason-agnostic and to
report `.css` files scanned alongside `.svelte` files (see `run()` in `cli.ts`);
this pass did not re-run against that checkout, so this section still documents
only the original Toolbar-only run. Every new detector added since is instead
proven with a unit test whose input MUST be flagged — see `analyze.test.ts` and
`cli.test.ts` — including a regression test that runs `readWcComponents` against
this library's own real `src/wc/components`, not a fixture.
