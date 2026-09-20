# Component contract fixtures

`form-association/` mounts the real Checkbox, Toggle and Select components inside
a native form. Its `fa-*` test ids belong to the tests, independently of the docs
demos. The change counter observes native events on the form, and submission
serializes the form's real `FormData`.

The functional Playwright configuration builds this small Vite app and starts its
preview server alongside the docs server. It uses the existing Svelte plugin and
a separate port derived from this checkout's fixture path. It never reuses an
existing server. Tests wait for `data-fixture-ready` before interacting.

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
