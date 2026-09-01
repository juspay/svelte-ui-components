# polymorph → SUI consumer migration codemod

Mechanically migrates a consumer codebase from `polymorph-ui-components` to
`@juspay/svelte-ui-components`:

- rewrites import/export/dynamic-import specifiers (subpaths like `/wc` are
  preserved), in `.svelte`, `.ts` and `.js` files;
- renames the 28 casing-only synthetic event props (see `map.ts`) on library
  components in `.svelte` markup — component-aware: `onsort` is renamed on a
  `<Table>` imported from the library (through aliases,
  `import { Table as DataTable }`, namespace imports and
  `<svelte:component this={Table}>`), and left alone on your own components
  and on native elements.

## Usage

Run from a checkout of this repo (dependencies resolve here), pointing at the
consumer project. Requires Node >= 22.18 (runs TypeScript directly).

```sh
# preview
npm run codemod -- --dry-run ../consumer-app/src

# apply
npm run codemod -- ../consumer-app/src

# migrate in the other direction (SUI -> polymorph)
npm run codemod -- --reverse ../consumer-app/src
```

Directories are walked recursively; `node_modules`, `.git`, `.svelte-kit`,
`dist`, `dist-wc`, `build`, `coverage`, `playwright-report` and `test-results`
are skipped.

## What it will not do (by design)

Anything it cannot prove safe is reported as a `WARN` with `file:line:column`
instead of being rewritten — silent wrong rewrites are worse than reported
skips:

- **Spread attributes.** `<Table {...props} />` may carry a renamed prop
  inside `props`; the object is defined elsewhere, so it is warned about, not
  rewritten.
- **Unresolvable components.** `const Picked = Table;` then
  `<Picked onsort={...} />` — the tag does not resolve to an import, so a
  warning is emitted when it carries a renameable prop name.
- **Default imports** from the library cannot be resolved to a component.
- **Semantic renames** — same event, different word — are not casing pairs
  and need a human: Gallery `onclose`→`onDismiss`, `onchange`→`onIndexChange`;
  MediaUpload `onchange`→`onFilesChange`, `onerror`→`onRejected`.
- Props typed against library types in `<script>` (e.g. an object literal fed
  to a spread) are not rewritten — the spread warning covers the usage site.

Shorthand attributes are expanded when renamed (`{onsort}` →
`onSort={onsort}`), so a `--reverse` round trip restores the original names
but not the shorthand form.

`map.ts` documents how the pair list was derived and verified against both
libraries' sources.
