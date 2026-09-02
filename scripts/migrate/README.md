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

One thing. With no `backIcon`, Toolbar's default back control changed from

```html
<div role="button"><img src="https://sdk.breeze.in/gallery/icons/back.svg" /></div>
```

to

```html
<button aria-label="Back"><svg /></button>
```

That is the whole breaking surface. Everything else in 3.0.0 is additive, so a
consumer that does not render that control needs only a version bump.

## What the script reports

| Reason                 | Meaning                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `default-back-control` | A Toolbar that really does render the changed control. Review the markup.  |
| `indeterminate-spread` | A Toolbar whose props are spread, so the guard cannot be read statically.  |
| `legacy-back-selector` | CSS selecting an `<img>` inside the back control, which is now an `<svg>`. |
| `BLOCKER`              | Svelte below the `^5.41.2` peer, or the library not being a dependency.    |

A usage is **not** reported when it passes `showBackButton={false}` or its own
`backIcon` — both keep their previous behaviour exactly. Only a literal `false`
counts as disabling; a bound expression could be either, and guessing would
produce a confidently wrong report, so those are surfaced rather than assumed.

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

Run against lighthouse (385 `.svelte` files, Svelte `^5.55.9`):

```
No blockers and no affected Toolbar usage across 385 .svelte files.
This project can take 3.x with a dependency bump alone.
```

Its single Toolbar usage passes `showBackButton={false}`, so the changed control
never renders there. That clean result was checked against a negative control:
removing the guard from the same real file flags it at the exact Toolbar line,
confirming the zero is a real absence rather than a detector that finds nothing.
