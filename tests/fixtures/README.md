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
