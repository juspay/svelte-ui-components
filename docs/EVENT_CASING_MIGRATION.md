# Event-casing migration (to lowercase, completing in 4.0.0)

`DESIGN_PRINCIPLES.md` §3 states the rule: **every event prop is `on` followed
by the event name in lowercase** — `onclick`, `oninput`, `onrowclick`,
`onoverlayclick` — whether the browser fires the event or the component
invents it. This document is what it took to get there, and what a consumer
has to do.

## Why the rule changed

Through 3.4 the rule was split: a forwarded DOM event kept Svelte's lowercase
spelling, an invented event was camelCase (`onRowClick`). That distinction is
real inside the library and invisible at the call site — a consumer writing
`<Table onrowclick>` has no way to know which kind of event that is. The
codebase itself never managed it either: 142 props had drifted across three
styles over 580 commits, including hybrids like `onleftImageClick` that were
neither convention.

One rule needs no such knowledge, and it is the spelling consumers of the
forked library already write, which makes this library a drop-in for them.

## What a consumer does

Nothing, immediately: every spelling this library has ever accepted still
works. Passing a deprecated one warns once, in dev, naming its replacement.

Before upgrading to 4.0.0, run the codemod from the project root:

```sh
npx sui-codemod --dry-run ./src   # preview
npx sui-codemod ./src             # apply
```

It rewrites the deprecated spellings on library components in `.svelte` files
(`scripts/codemod/legacy-pairs.ts` is its table, generated from the
`@deprecated` tags in the library's own `properties.ts` files) and reports what
it cannot prove safe — spread attributes, unresolvable tags — as `WARN` lines
with `file:line:column` rather than guessing.

Two things the codemod deliberately leaves alone:

- **Callback keys on config objects.** `TableColumn.onToggle`,
  `TablePaginationConfig.onPageChange`, `ComboboxAction.onClick` are members of
  a data object a consumer builds, not props on a tag. They keep their
  camelCase spelling and are not deprecated.
- **Keys inside a spread.** `<Input {...inputEventProperties} />` hides its
  keys from a tag-level rewrite; the spread is reported so a person can look.

## How the library moved

**Phase 0 — a rule, and a check.** `scripts/check-event-casing.js` fails the
build on any event prop with an uppercase letter unless its declaration is
tagged `@deprecated`. There is no grandfathering list: the tag is what makes an
old spelling legible as a temporary state rather than a second convention.

**Phase 1 — every spelling accepted (3.5.0).**
`scripts/migrate/lowercase-event-props.ts` rewrote all 94 `properties.ts`
files and their components: each event prop's lowercase name is the
declaration, every earlier spelling is a one-line `@deprecated` alias beside
it, and the component resolves them to one value through
`resolveDeprecatedProp`, lowercase winning. 191 aliases across 57 components.

The same value is read once at mount from a generated `$effect.pre`, so a
consumer who passes a deprecated spelling is told even if the event never
fires — a `$derived` alone would stay silent until the handler ran.

`scripts/migrate/alias-wc-props.ts` did the custom-element half: a wrapper only
forwards what `customElement.props` declares, so 46 lowercase declarations
across 18 wrappers were added, or the new spelling would have been unreachable
through `<sui-*>`.

The library's own call sites moved with it —
`scripts/migrate/rename-internal-usages.ts` for `src/`, and
`scripts/migrate/rename-doc-usages.ts` for `docs/` and `README.md`. Both have
tests that fail if a deprecated spelling reappears, because an internal one
warns in a consumer's console for code the consumer did not write, and a
documented one is an instruction to use something 4.0.0 removes.

**Phase 2 — removal (4.0.0).** Every alias declaration, its resolver and its
warning are deleted; each component reads only its lowercase name.
`src/lib/deprecation.ts` goes with them. `scripts/codemod/legacy-pairs.ts`
stays, frozen, as the table a consumer's codemod run still needs.

## The one hand-wired component

`Step`'s `onclick` is declared in `Stepper/properties.ts` — the one directory
hosting two exported components — so the generator, which looks for a
component file matching the directory name, reports it as skipped. `Step.svelte`
carries the same resolver line, written by hand;
`src/lib/Stepper/Stepper.svelte.test.ts` clicks a step under both spellings so
the wiring cannot silently rot.

`Stepper` itself had two names for one event (`onstepclick` and
`onhandleStepClick`); both, and their camelCase twins, resolve to
`onhandlestepclick` — the forked library's spelling, so its consumers need no
change at all.
