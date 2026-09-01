# Visual regression testing

Every component demo route is screenshotted and compared against a committed
baseline. This catches the class of change the functional Playwright suite
cannot see: a shifted border-radius, a colour that no longer resolves, a layout
that collapses. Those assertions pass a DOM check and still ship a broken
component.

## Running it

```bash
pnpm run test:visual           # compare against committed baselines
pnpm run test:visual:update    # regenerate baselines after an intended change
```

Both require Docker. There is no host-native mode, and that is a deliberate
constraint rather than an oversight — see below.

## Why it only runs in a container

A screenshot comparison is valid only if the renderer that produced the baseline
and the renderer checking it are the same. They are not the same across macOS
and Linux (different font stacks and glyph rasterisation), between a bare
`ubuntu-latest` runner and the Playwright image (different font packages and
freetype builds), or between two Playwright versions (each bundles its own
Chromium).

Any of those shifts antialiasing along every glyph edge, which with an exact
comparison fails every route at once while nothing about the components changed.
The usual workaround is a pixel tolerance, which then hides the small real
regressions the suite exists to catch.

So the renderer is pinned instead: `mcr.microsoft.com/playwright:v1.60.0-noble`,
used by `scripts/visual-test.sh` locally and by the `container:` block in
`.github/workflows/visual.yml`. A baseline regenerated on a laptop is the same
measurement CI takes, which is what makes `maxDiffPixelRatio: 0` sustainable.

**Three places pin the version and must move together:**

| File                           | What it pins               |
| ------------------------------ | -------------------------- |
| `package.json`                 | `@playwright/test` version |
| `scripts/visual-test.sh`       | `IMAGE`                    |
| `.github/workflows/visual.yml` | `container.image`          |

The script fails fast if the image and `node_modules` disagree, so a partial
bump is caught before it produces 94 bogus diffs.

## What is compared

`main.content` on each `/components/<slug>` route — the demo area only.

The rendered `docs/*.md` block that the demo layout appends below every demo is
hidden first. Those pixels are documentation, not component rendering; including
them would mean every prose edit failed this suite.

Routes are discovered from `src/routes/components/` at run time rather than
hand-listed, so **a new component demo without a baseline fails the suite**.
That is intentional: an opt-in list is how visual coverage silently rots.

### What is NOT compared

Each route is captured **in its at-rest state**. Anything that only appears
after interaction — an open Modal, a fired Toast, an expanded Menu, a hovered
Tooltip — is not covered, because nothing clicks the demo's buttons first. The
components' _triggers_ are compared; their overlay states are not.

This is a real coverage gap, not an oversight, and worth knowing before treating
a green run as "the UI is unchanged". Extending coverage means adding
interaction steps per route, which is a larger piece of work than baselining the
default render.

## How determinism is achieved

Four separate causes of instability had to be handled. Each was found by
inspecting a failing diff, not by guessing.

**Off-origin requests are stubbed.** The BrandLoader demo points at
`https://picsum.photos/64/64?random=41`, which returns _a different photograph
on every request_ — its baseline could never reproduce. `i.pravatar.cc` behaves
the same way elsewhere. All off-origin images are now served as a fixed local
stub and other off-origin requests are refused, which also removes a network
dependency: without it the suite fails whenever a third-party image host is slow.

**The clock is manual.** `page.clock.install()` pins `Date.now()` _and_ makes
timers fire only when the test advances them, then the test advances a fixed
amount. Pinning only the date (`setFixedTime`) was not enough: the Chat and
ThinkingIndicator demos append content on an interval, which grew the element
between successive screenshots so the comparison never stabilised. Two demos run
a timer _cascade_ rather than a one-shot timer and need enough fake time to
reach their terminal state — `chat` and `tool-call-log`, both listed in
`SETTLE_OVERRIDES`.

**The viewport is sized to each page.** Capturing a demo taller than the
viewport made Playwright scroll the element to stitch the shot, and scrolling is
itself an input: content that renders lazily on scroll changed height
mid-capture. A fixed tall viewport was not enough — 11 of the demos exceed
4000px, the tallest at 12209px, so exactly those kept scrolling and exactly
those stayed flaky. Each test now grows the viewport to its own page height
first, looping until the height stops changing, since growing the viewport can
itself reveal more content.

**CSS animations are removed via a stylesheet.** `animation: none` on every
element and pseudo-element. Playwright's `animations: 'disabled'` alone left
ThinkingIndicator oscillating between two heights. Tagging animating elements
with a marker class did not work either — Svelte rewrites the class attribute on
re-render and dropped the marker. A stylesheet rule cannot be overwritten that
way. `animation: none` renders each element from its base CSS rather than a
keyframe, so entry animations settle rather than freezing mid-transition; the
Modal and Toast baselines were checked by eye to confirm this.

Images are also awaited explicitly, since a late-arriving image changes both the
pixels and — before it has intrinsic size — the element's height.

### Masked regions

Two routes contain genuinely non-deterministic pixels and have that region
masked; the rest of the route is still compared. Masking a region is always
preferable to skipping a route.

| Route           | Masked      | Why                                                                             |
| --------------- | ----------- | ------------------------------------------------------------------------------- |
| `lottie-player` | `.demo-row` | Lottie drives frames from rAF in JS; `animations: 'disabled'` cannot pin those. |
| `media-player`  | `.demo-row` | Renders a real `<video>`; the decoded frame depends on decoder timing.          |

## When a diff appears

CI uploads a `visual-report` artifact on failure containing expected/actual/diff
PNG triplets. Look at the diff before doing anything else.

- **Unintended change** → fix the component. The baseline is correct.
- **Intended change** → run `pnpm run test:visual:update` and commit the changed
  PNGs _in the same commit as the code that changed them_, so review sees the
  rendering change next to its cause.

Never regenerate baselines to turn a red suite green without looking at the
diff. That converts the tool into a rubber stamp.

### Excluded routes

Two routes are **not** baselined. They are declared as skipped tests rather than
omitted, so they still appear in the report with their reason attached.

| Route                | Why                                             |
| -------------------- | ----------------------------------------------- |
| `thinking-indicator` | animated dots plus a per-second elapsed counter |
| `task-list`          | one of the tallest demos, with staged reveals   |

Both pass reliably when run alone and fail intermittently inside the full suite
at any worker count — load sensitivity in how much settles before capture,
rather than anything in the components themselves. Everything that stabilised
the other 92 was tried on them: manual clock, longer settles, per-route viewport
fitting, stripped animations, stubbed network.

They are excluded deliberately, and the tradeoff is worth stating plainly: a
gate that fails at random on unrelated PRs gets switched off within a week, and
then you have neither the coverage nor the gate. Two documented holes in a
suite people trust beats 94 routes in one they don't. Closing them is real
remaining work, not a settled matter.

**Do not use `test.skip(condition, reason)` inside the describe body to add to
this list.** That form applies to the whole enclosing describe: it skipped all
94 routes while the job still exited 0, which is a gate that reports success
without checking anything.

## Cost

92 baselines, ~11MB total. `main.content` stretches to the viewport, so a short
demo's PNG is mostly empty — which compresses well, but means a baseline refresh
is a visible diff in review.
