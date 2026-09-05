# SUI consumer migration codemod

Prepares a `@juspay/svelte-ui-components` consumer for 4.0.0 in one command:
rewrites every deprecated event-prop spelling to its lowercase name
(`legacy-pairs.ts`, generated from the `@deprecated` tags in the library's own
`properties.ts` files and pinned by a test). `--dry-run` prints the diff and
writes nothing.

Callback keys on config objects (`TableColumn.onToggle`,
`TablePaginationConfig.onPageChange`) are not component props, are not
deprecated, and are left alone.

Also reports the other breaking change in the 4.0.0 custom-element surface:
`children` is no longer a declared property on `sui-chat-bubble`,
`sui-draggable` or `sui-resizable`, so assigning it silently loses the content.
That check runs on every file, including in dry runs, reports rather than
rewrites (moving content into markup is a decision, not a rename), and only
fires in files that also mention one of the three elements. See
`wc-children.ts`.

This package is published, so consumers can run it without a checkout:

```sh
npx sui-codemod --dry-run ./src
```

Renaming is component-aware: `onclick` is renamed to `onClick` on a `<Toggle>`
imported from the library (through aliases, `import { Toggle as Switch }`,
namespace imports and `<svelte:component this={Toggle}>`), and left alone on
your own components and on native elements. Import specifiers are never
touched. Only `.svelte` files are rewritten; `.ts`/`.js` files are scanned for
`children` assignments.

## Usage

Run from a checkout of this repo (dependencies resolve here), pointing at the
consumer project. Requires Node >= 22.18 (runs TypeScript directly).

```sh
# preview
npm run codemod -- --dry-run ../consumer-app/src

# apply
npm run codemod -- ../consumer-app/src
```

Directories are walked recursively; `node_modules`, `.git`, `.svelte-kit`,
`dist`, `dist-wc`, `build`, `coverage`, `playwright-report` and `test-results`
are skipped.

## What it will not do (by design)

Anything it cannot prove safe is reported as a `WARN` with `file:line:column`
instead of being rewritten — silent wrong rewrites are worse than reported
skips:

- **Spread attributes.** `<Modal {...props} />` may carry a renamed prop
  inside `props`; the object is defined elsewhere, so it is warned about, not
  rewritten.
- **Unresolvable components.** `const Picked = Toggle;` then
  `<Picked onclick={...} />` — the tag does not resolve to an import, so a
  warning is emitted when it carries a renameable prop name.
- **Default imports** from the library cannot be resolved to a component.
- **A target already present.** `<Toggle onclick onClick>` is left as-is and
  reported; which handler wins is a decision.
- Props typed against library types in `<script>` (e.g. an object literal fed
  to a spread) are not rewritten — the spread warning covers the usage site.

Shorthand attributes are expanded when renamed (`{onclick}` →
`onClick={onclick}`), keeping the local identifier.

`legacy-pairs.ts` documents how the rename table is derived and pinned.
