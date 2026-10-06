# Component contract fixtures

`form-association/` mounts the real Checkbox, Toggle and Select components inside
a native form. Its `fa-*` test ids belong to the tests, independently of the docs
demos. The change counter observes native events on the form, and submission
serializes the form's real `FormData`.

`embedded-fill/` mounts DateRangePicker and Calendar in 300px hosts that set, or leave unset, the
tokens a host uses to make them fill its container. Its `fill-*` test ids belong to
`tests/date-range-picker-embedded-fill.test.ts`, whose control hosts are kept out of the docs demo so
the visual baseline of that route does not move.

`table-paginator/` mounts one Table with the built-in paginator inside a plain host whose width
comes from the query string (`?width=288&variant=no-size&page=4`), so the width the paginator has
to live inside is the input rather than the docs layout's. It belongs to
`tests/table-paginator-narrow-host.spec.ts`.

`modal-viewport/` mounts one Modal whose size, alignment, transition mode, body, footer label,
portalling, ancestor custom properties and a consumer stylesheet (placed ahead of the library's, as an
app's is) come from the query string (`?align=top&tokens=--modal-medium-width:90%`).
`tests/modal-viewport-width.spec.ts` drives it, so its scenario matrix is not a docs demo that the
visual suite would have to baseline. It reports a count of overlay clicks in `fixture-overlay-clicks`.

`chat-message-list-scroll/` mounts eighteen ChatMessageList scenarios, each in its own 280px by 140px
host with rows wider and taller than the list: nothing set, `hideScrollbar` off and on, the overflow-x
and overscroll-behavior tokens, a one-class rule of the app's own that must keep winning over them, the
same rule inside a cascade layer (which an unlayered declaration beats unless the tokens hand the
property back), the rules an app wrote before the tokens beside the same list written with them, and
lists inside a scrolling container, to see whether a wheel scroll at the end chains outward. Its `cml-*`
test ids belong to `tests/chat-message-list-scroll-tokens.spec.ts`, which also injects `dist-wc/index.js`
to mount `<sui-chat-message-list>` (run `pnpm run build:wc` first), so the matrix stays out of the docs
demo and that route's visual baseline does not move.

`banner-right-margin/` mounts the real Banner in fixed-size rows (an 18px icon, a 120px body, a 60px
right-content slot), so every offset in `tests/banner-right-margin.spec.ts` is an exact number. Rows set
or leave unset `--banner-right-margin-left`, in left-to-right, right-to-left and vertical writing modes,
with and without right content; an app stylesheet before or after the library's, plain or in an `@layer`,
comes from the query string (`?css=.banner-right{margin-left:24px}&order=first`). Its `brm-*` test ids
belong to that spec, so the matrix stays out of the public `/components/banner` demo and its full-page
visual baseline.

`drp-footer-contrast/` opens one DateRangePicker (`?scenario=range|range-empty|single|compare|compare-empty`,
`&tokens=--drp-cancel-color:red`, `&theme=dark`) with the footer buttons enabled or disabled, in single
mode with Clear, or in the standalone compare panel. Ancestor custom properties come from the query
string, as an app sets them, and `theme=dark` turns the library's own dark theme on.
`tests/date-range-picker-footer-contrast.spec.ts` reads the rendered label and background colours
from it, so the scenario matrix stays off the public docs demo, whose visual baseline would move.

The functional Playwright configuration builds this small Vite app and starts its
preview server alongside the docs server. It uses the existing Svelte plugin and
a separate port derived from this checkout's fixture path. It never reuses an
existing server. Tests wait for `data-fixture-ready` before interacting.

`button-shrinkable/` mounts the real Button in parents of a fixed width, and
`tests/button-shrinkable.spec.ts` injects `dist-wc/index.js` into the same page to
mount `<sui-button>` too. It holds the scenario matrix, including default-button
twins that overflow on purpose and the `all: unset` and `img { max-width: 100% }`
setups, so none of it has to sit in the public `/components/button` demo, whose
full-page visual baseline would move with every scenario added there. Its `shrink-*`
test ids belong to that spec. The Playwright project runs Chromium only, so CI never
runs that spec in Firefox or WebKit, where a grid track sizes differently; the header
of the spec says how those two engines were measured.

Run the contract suite with:

```sh
pnpm exec playwright test tests/form-association.test.ts
```

Fixture output goes to `.playwright-fixtures/`, outside the Pages artifact
(`build/`) and published package directories. Fixtures are outside both
`src/routes` and the visual suite's discovery directory, `src/routes/components`.
The normal docs build and visual suite therefore never discover fixture pages.
Keep the docs demos: they remain consumer-facing examples with visual coverage.

To add another contract fixture, add a directory with an HTML entry and a Svelte
component, register its entry in the root `vite.config.fixtures.ts`, and navigate to it using
`fixtureBaseURL` from `tests/support/fixture-server.ts`.

`date-range-picker/` holds the DateRangePicker scenarios that exist to test it rather
than to document it: the control picker without `responsiveLayout`, pickers under a
`pointer-events: none` ancestor, seeded single-month calendars, a seeded picker with
`responsiveLayout` on (the typed-date and focus-after-a-flip tests), and a trigger pinned to
the bottom of the viewport. They stay out of the docs demo, which is a public page and a
full-page visual baseline. Run them with:

```sh
pnpm exec playwright test tests/date-range-picker-responsive.test.ts
```
