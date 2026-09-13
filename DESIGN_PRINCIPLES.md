# Design Principles

What this library's architecture commits to, and why — written down for the first time
after an architecture review showed several of these were already true in practice but
never stated, and one was true inconsistently because it was never stated at all.

## 1. Theming is an API contract, not an afterthought

Every visual decision — color, spacing, radius, shadow — is a CSS custom property with a
fallback: `var(--button-color, #3a4550)`. Naming is `--{component}-{element}-{property}`.
The cascade is the customization mechanism: define a theme on an ancestor element and the
whole subtree inherits it, no per-component overrides required.

Measured directly across a sample of components: **~62% of style declarations already use
this pattern.** That's the baseline to hold new code to and gradually bring old code up
to — not a rewrite. A hardcoded color or size in a new `<style>` block should be treated
as a bug, the same as an unhandled `null`.

**A token can only reach a state the component actually paints.** The cascade cannot add a
declaration that does not exist: a `.toggle-button:hover` rule with no `:active` beside it
leaves nothing for `--theme-switcher-bg-pressed` to land in, so no consumer can supply a
pressed state through the token contract however carefully they arrange their own
stylesheet. It is invisible from the source, too — the component reads as fully tokenised,
because every rule it _does_ have is.

How far that goes depends on which build a consumer is on, and the distinction is worth
keeping straight. Through the custom elements the shadow boundary is the end of it: an
outside stylesheet cannot reach a rule that does not exist, and cannot add one. Importing
the Svelte components directly, styles are scoped rather than encapsulated, so a consumer
can still write the missing rule themselves — at the cost of reaching past the token API
into class names that are not part of it. Neither case makes the missing declaration
acceptable; the first leaves no way out at all, and the second only an unsupported one.

Measured on an embedded Shopify Admin surface (42 routes, 573 elements, five interaction
states each, states forced through CDP rather than inferred): every divergence from the host
closed by feeding tokens from the consumer's stylesheet except two, and both were a state no
rule painted. So enumerate the states when adding a component — rest, hover, focus-visible,
active, disabled — and give each one a rule and a token. A missing state is a missing API,
not a missing style.

**Motion follows the same rule, and needed the same fix twice.** The opening sentence
above lists color, spacing, radius, shadow — motion was left out, and the codebase mirrors
the omission: across `src/lib/*/*.svelte`, roughly a quarter of `transition`/`animation`
declarations read no custom property at all, so a consumer cannot slow them down, speed
them up, or turn them off. Where motion _is_ tokenised, it isn't tokenised consistently —
the same idea is expressed as three different shapes:

- **Duration only** — `--chart-transition-duration`. The easing curve is still a
  hardcoded keyword baked into the declaration.
- **Easing only** — `--task-list-ease`. The duration is still a hardcoded literal.
- **A whole shorthand** — `--toggle-slider-transition`, `--list-item-transition`. One
  token covers the entire `transition` value, so changing only the speed means also
  restating the properties and the curve, and a consumer who wants the shorthand's
  properties but a different curve has no way to touch just that.

None of those three shapes can express "make every animation in this theme 30% faster"
or "no motion at all" as a single change, because a consumer would first need to know,
per component, which shape that component happens to use. That is the same problem a
missing color token is — an inexpressible customization — for a different visual
property.

**The convention: two tokens per element, not one, each falling back through a
library-wide root token to the current literal.** Every element that transitions or
animates gets a duration token and an easing token —
`--{component}-{element}-transition-duration` / `--{component}-{element}-transition-easing`
for a CSS `transition`, or the `-animation-duration` / `-animation-easing` pair for an
`animation` — and each falls back to the matching root token, `--motion-duration` /
`--motion-easing`, before finally falling back to today's value:

```css
transition: transform var(--carousel-track-transition-duration, var(--motion-duration, 0.5s))
  var(--carousel-track-transition-easing, var(--motion-easing, ease-in-out));
```

Left unset, both `var()` calls resolve to their innermost fallback, so rendering is
byte-identical to today. Set `--motion-duration` once on `:root` and every component
built to this convention moves together — the one root-level token this task exists to
make possible, and the block a future `prefers-reduced-motion` rule can collapse to
instead of a per-component edit everywhere motion appears. Set a component- or
element-level token instead (`--carousel-track-transition-duration`) and only that
element changes, same as any other token in this library.

Two tokens rather than one shorthand, because duration and easing are independently
meaningful controls — a consumer speeding up the whole theme is not usually also
relitigating every curve, and vice versa — and a split pair composes with a root
fallback in a way a shorthand cannot: `var(--x-transition, all 0.2s ease)` has nowhere
for a lone `--motion-duration` override to plug into without also overriding every
property and curve the shorthand names.

**Existing tokens are not renamed.** `--chart-transition-duration`, `--task-list-ease`,
`--toggle-slider-transition`, and every other motion token already public keep working
exactly as they do today — renaming a public token is the breaking change this library
treats it as everywhere else. Where a component is brought onto this convention, the
existing name stays as the duration or easing half of the new pair
(`--chart-transition-duration` keeps meaning exactly what it means today), and the
_other_ half is the new addition — filling in the specific gap that component's shape
was missing, not replacing what was already there.

**An indefinite animation is guarded in the component, not by the root token.** The
token chain above makes "everything 30 percent faster" and "everything slower" one
declaration, and it was expected to make "no motion" one declaration too. It does not,
for animations that never end, and the reason is worth stating so the next person does
not try it:

- `--motion-duration: 0s` does not remove an animation, it collapses it onto its `0%`
  keyframe. For a spinner that is harmless. For `Progress`'s indeterminate bar, `0%` is
  `translateX(-100%)` — the bar leaves the track entirely and the component reads as
  finished. A guard that strands an element on a frame meaning something else is worse
  than the animation it removed.
- The resting state is component knowledge. Stopping `BrandLoader`'s dot row leaves two
  dots stacked at the same offset, so one has to be dropped; stopping `Shimmer`'s sweep
  should leave the skeleton underneath, not a highlight frozen across it. No root token
  can know any of that.
- A root-level rule cannot reach a custom element. Per §2 the shadow boundary is the end
  of it, so the only stylesheet that can silence motion inside `<sui-loader>` is the one
  the component itself carries.

So every component running an animation with no natural end carries its own
`@media (prefers-reduced-motion: reduce)` block, which stops the animation **and** names
the state it should hold. The root token still governs how fast motion runs; the
preference governs whether it runs at all. Watch the specificity: where the animation is
declared on a compound or `:nth-child()` selector, the guard has to match it, or it is
silently overridden and the component keeps animating.

## 2. Framework-agnosticism is a real target, not just a Svelte library

This library ships both a Svelte 5 package and a web-component build (`sui-*` custom
elements via `vite.config.wc.ts`) — usable from React, Vue, Angular, or plain HTML, no
Svelte runtime required by the host page. See the README's **Web Components** section for
the three ways to consume it (GitHub Pages, jsDelivr/unpkg, or the package's `./wc`
export). This only works because theming is CSS-only: the same `--button-color` behaves
identically regardless of host framework.

### Every custom element declares its own host display

A custom element defaults to `display: inline`. An inline box has no definite
width, so a component sizing itself with `width: 100%` resolves that percentage
against the wrong ancestor — and its layout then depends on the consumer's
surrounding markup rather than on the component. For a long time no wrapper in
this repo set a host display at all, which meant every `<sui-*>` element was
inline regardless of what it contained.

So each wrapper carries:

```css
:host {
  display: var(--sui-thing-display, block);
}
```

The value matches that component's own root element — `block` for the 86 whose
root is block-level, `inline-block` for the 11 whose root is a `span`, `label`,
`button` or `svg`. It is derived from the component rather than chosen per
wrapper, so a new wrapper has a right answer rather than a preference.

It is a token for the reason §1 gives and §2 sharpens: a consumer cannot reach
inside a shadow root to change it. A stylesheet cannot add a rule there, so
without the token the host's display would be the one visual decision in the
library that is not an API contract.

## 3. Predictability through uniformity — including in event naming

Every component: a `properties.ts` file alongside its `.svelte` file, a universal
`classes?: string` escape hatch on the root element, a universal `testId` → `data-pw`
hook for Playwright.

**Every event prop is `on` followed by the event name in lowercase.** `onclick`,
`oninput`, `onrowclick`, `onoverlayclick`, `oncentertextclick` — whether the browser
fires the event or the component invents it. One rule, with no judgement call about
which kind of event a prop carries.

The alternative — lowercase for forwarded DOM events, camelCase for invented ones —
is the rule this library used through 3.4, and it is a coherent choice: it mirrors the
native/synthetic distinction Svelte 5 itself draws. It was dropped because the
distinction is invisible at the call site. A consumer writing `<Table onrowclick>` has
no way to know whether the library considers that event native, and got it wrong often
enough that the codebase itself carried hybrids like `onleftImageClick` that were
neither convention. A single rule needs no such knowledge, and it matches the spelling
consumers of the forked library already write.

The earlier spellings were accepted as `@deprecated` aliases through 3.5.0: passing
`onRowClick` worked and warned once, in dev, naming its replacement. 3.5.1 removed them,
under a patch bump it should not have had; `npx sui-codemod ./src` rewrites a consumer's
call sites (see `docs/EVENT_CASING_MIGRATION.md`).

`scripts/check-event-casing.js` enforces the rule going forward (`npm run
lint:event-casing`, wired into `npm run lint`). There is no grandfathering list: an
event prop with an uppercase letter fails the build unless its declaration is tagged
`@deprecated`, which is what makes an alias legible as a temporary state rather than a
second convention. A callback key on a config object (`TableColumn.onToggle`) is not a
component prop and keeps its own spelling.

## 4. Accessibility is baseline, not premium

ARIA roles, keyboard navigation, focus management, and semantic HTML belong in every
component, reasoned about per-state rather than bolted on — e.g. a clickable element only
takes `role="button"` and keyboard handling when it's actually given a click handler,
otherwise it stays a plain element.

## 5. Documentation is built for machines, not just humans

This library ships an MCP server (`mcp/`) exposing `list_components`-style tools over
`docs/*.md` — components are increasingly composed and themed _through_ AI assistants, not
just read about by humans. `docs/_index.json` is the source of truth; keep it current when
a component is added, the same way you'd keep an export current.
