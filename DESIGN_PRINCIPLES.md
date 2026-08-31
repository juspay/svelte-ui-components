# Design Principles

What this library's architecture commits to, and why — written down for the first time
after a comparison against a fork of this codebase (`polymorph-ui-components`) showed
several of these were already true in practice but never stated, and one was true
inconsistently because it was never stated at all.

## 1. Theming is an API contract, not an afterthought

Every visual decision — color, spacing, radius, shadow — is a CSS custom property with a
fallback: `var(--button-color, #3a4550)`. Naming is `--{component}-{element}-{property}`.
The cascade is the customization mechanism: define a theme on an ancestor element and the
whole subtree inherits it, no per-component overrides required.

Measured directly across a sample of components: **~62% of style declarations already use
this pattern.** That's the baseline to hold new code to and gradually bring old code up
to — not a rewrite. A hardcoded color or size in a new `<style>` block should be treated
as a bug, the same as an unhandled `null`.

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

**Event props follow one rule, based on what the event actually is:**

- **A native DOM event forwarded as-is stays lowercase** — `onclick`, `onkeydown`,
  `onmousedown` — because that's Svelte 5's own idiom for real DOM event attributes.
  Renaming these to `onClick` would fight the framework, not follow a convention.
- **A synthesized event — one this component invents, with no native DOM equivalent —
  is camelCase starting right after `on`**: `onRowClick`, `onCenterTextClick`,
  `onSelectionChange`. This matches the wider Svelte-component ecosystem's convention for
  invented callback props.

This is deliberately *not* polymorph's rule (lowercase for everything, including
synthesized events). That's a real, coherent choice, but it trades away the native/synthetic
distinction that Svelte 5 itself draws, and it isn't obviously better — just different.
What actually needed fixing here wasn't the rule, it was that this codebase had never
picked one: native events were already consistently lowercase, but synthesized events
had drifted across three different styles over 580 commits, including accidental hybrids
like `onleftImageClick` that are neither convention.

`scripts/check-event-casing.js` enforces this going forward (`npm run lint:event-casing`,
wired into `npm run lint`). It grandfathers the violations that already existed when the
rule was written down — renaming any of them is a breaking prop-name change for real
consumers, not a lint fix, and needs its own deprecation path. Fixing one is: rename it,
remove it from `scripts/event-casing-baseline.json` in the same PR, and treat it as a
breaking change in the changelog.

## 4. Accessibility is baseline, not premium

ARIA roles, keyboard navigation, focus management, and semantic HTML belong in every
component, reasoned about per-state rather than bolted on — e.g. a clickable element only
takes `role="button"` and keyboard handling when it's actually given a click handler,
otherwise it stays a plain element.

## 5. Documentation is built for machines, not just humans

This library ships an MCP server (`mcp/`) exposing `list_components`-style tools over
`docs/*.md` — components are increasingly composed and themed *through* AI assistants, not
just read about by humans. `docs/_index.json` is the source of truth; keep it current when
a component is added, the same way you'd keep an export current.
