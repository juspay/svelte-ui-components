# Event-casing migration (to lowercase, completed in 3.5.1)

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

Through **3.5.0**, nothing immediately: every spelling the library had ever
accepted still worked, and passing a deprecated one warned once in dev, naming
its replacement. **3.5.1 removed them** — as a patch, which it should not have
been; see `docs/MIGRATION_4.0.md`. 4.0.0 is the same content under a correct
version number. From 3.5.1 on, an old spelling is an unknown prop — inert, and
silent unless you are on TypeScript, where the compiler catches it.

Run the codemod from the project root, before or as part of the upgrade:

```sh
npx sui-codemod --dry-run ./src   # preview
npx sui-codemod ./src             # apply
```

It rewrites the removed spellings on library components in `.svelte` files
(`scripts/codemod/legacy-pairs.ts` is its table — generated from the
`@deprecated` tags while they existed, and frozen at those 191 entries now that
they do not) and reports what
it cannot prove safe — spread attributes, unresolvable tags — as `WARN` lines
with `file:line:column` rather than guessing.

Two things the codemod deliberately leaves alone:

- **Callback keys on config objects.** `TableColumn.onToggle`,
  `TablePaginationConfig.onPageChange`, `ComboboxAction.onClick` are members of
  a data object a consumer builds, not props on a tag. They keep their
  camelCase spelling and were never deprecated, so 4.0.0 does not touch them.
- **Keys inside a spread.** `<Input {...inputEventProperties} />` hides its
  keys from a tag-level rewrite; the spread is reported so a person can look.

## How the library moved

**Phase 0 — a rule, and a check.** `scripts/check-event-casing.js` fails the
build on any event prop with an uppercase letter unless its declaration is
tagged `@deprecated`. There is no grandfathering list: the tag is what makes an
old spelling legible as a temporary state rather than a second convention.

**Phase 1 — every spelling accepted (the 3.x minor carrying this change).**
The number is deliberately not written here: semantic-release derives it from
the commit at merge time, so the CHANGELOG is the authority. An earlier draft
named 3.5.0 and was overtaken when a different feature released first.
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

**Phase 2 — removal (4.0.0). Done.** Every alias declaration, its resolver and
its warning are deleted; each component reads only its lowercase name.
`src/lib/deprecation.ts` went with them, and
`scripts/migrate/remove-wc-alias-props.ts` took 172 now-dead declarations off
the custom-element wrappers — an element that still declared a removed spelling
would expose a setter that silently reached nothing, which is worse than not
declaring it. `scripts/codemod/legacy-pairs.ts` stays, frozen, as the table a
consumer's codemod run still needs; `scripts/codemod/legacy-pairs.test.ts` now
asserts the derivation yields nothing, which is what proves the removal
complete. `docs/MIGRATION_4.0.md` is the consumer-facing guide.

Three components had a resolver carrying a fallback (`?? null`,
`?? (() => {})`) that the removal would have dropped along with it, leaving
`HITL`, `IframeViewer` and `Input` calling an undefined handler. The generator
reports those rather than guessing, and the defaults moved onto the
destructured prop by hand.

One component had to be corrected rather than merely stripped: `Chat` deprecated
its _lowercase_ `onscrollstate` in favour of `onScrollState`, inverting the rule.
It survived phase 0's gate because it borrows its type by indexed access and the
gate only recognised inline function types as events. The gate now understands
that shape, and 4.0.0 keeps `onscrollstate`.

## The one hand-wired component

`Step`'s `onclick` is declared in `Stepper/properties.ts` — the one directory
hosting two exported components — so the generator, which looks for a
component file matching the directory name, reported it as skipped through
phase 1 and its resolver line was written by hand. With phase 2 done there is
no resolver left to hand-write, and `src/lib/Stepper/Stepper.svelte.test.ts`
clicks a step under the one remaining spelling.

`Stepper` itself had two names for one event (`onstepclick` and
`onhandleStepClick`); both, and their camelCase twins, resolve to
`onhandlestepclick` — the forked library's spelling, so its consumers need no
change at all.
