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

## 2. Framework-agnosticism is a real target, not just a Svelte library

This library ships both a Svelte 5 package and a web-component build (`sui-*` custom
elements via `vite.config.wc.ts`) — usable from React, Vue, Angular, or plain HTML, no
Svelte runtime required by the host page. See the README's **Web Components** section for
the three ways to consume it (GitHub Pages, jsDelivr/unpkg, or the package's `./wc`
export). This only works because theming is CSS-only: the same `--button-color` behaves
identically regardless of host framework.

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

The earlier spellings all remain accepted as `@deprecated` aliases: passing `onRowClick`
still works and warns once, in dev, naming its replacement. 4.0.0 removes them; `npx
sui-codemod ./src` rewrites a consumer's call sites (see `docs/EVENT_CASING_MIGRATION.md`).

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
