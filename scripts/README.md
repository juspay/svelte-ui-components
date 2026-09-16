# The static gates, and what each one cannot see

`npm run lint` runs prettier, eslint, and seven project-specific gates. Each exists
because a real defect shipped, and each prints what it does **not** check on a
passing run — because the most expensive mistake this repo has made repeatedly is
reading a green gate as a broader guarantee than it gives.

| Gate                     | Catches                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `check-event-casing.js`  | An event prop that is not lowercase, and deprecated aliases past their cycle            |
| `check-shadow-safety.js` | Reads that stop at a shadow boundary and fail silently                                  |
| `check-css-contract.js`  | A `var()` chain with no literal, and a colour with no dark value                        |
| `check-docs-contract.js` | Docs promising an element, an event or an anchor that does not exist                    |
| `check-wc-contract.js`   | Wrappers never imported, and snippets whose arguments a slot would drop                 |
| `check-test-focus.js`    | `.only`, which disables every other test in its file while the suite passes             |
| `check-focus-visible.js` | `outline: none` on a focusable element with no visible replacement anywhere in the file |

## What each was written for

**`check-shadow-safety.js`** — `document.activeElement` inside a shadow root
returns the HOST, so a comparison against an inner node is permanently false.
Gallery's focus trap silently stopped holding this way. Its second rule covers
`contains(event.target)` in a document-level listener, where the target is
retargeted to the host: four popovers closed on the click that opened them, and
`<sui-tool-call-log>`'s popover was unusable from the day it shipped.

Both rules needed their scope corrected after meeting real code. Rule 2 matched
one spelling and missed a defect hidden behind `const target = event.target;`.
Rule 3 matched a shape rather than a hazard and flagged a correct guard on an
element-level listener, where nothing is retargeted. **If a gate flags something
you believe is correct, say so rather than complying** — that has been right
twice.

**`check-css-contract.js`** — `var(--x)` with no fallback makes the whole
declaration invalid at computed-value time, and an invalid declaration on an
inherited property falls back to the INHERITED value, not the stylesheet's. Input
handed its text colour to whatever the page was inheriting: 27 instances at
1.47:1.

**`check-docs-contract.js`** — `docs/` is what the MCP server serves, so a tag
there is an instruction. Four chart pages shipped complete "Web Component"
sections for elements that were never written. Its third rule covers in-page
anchors, after `marked` turned out to emit no heading ids at all, which broke the
build four separate times in one day; the renderer now emits GitHub-convention
slugs, so a link resolves as its author wrote it.

**`check-wc-contract.js`** — `customElements.define` runs as an import side
effect, so a wrapper `src/wc/index.ts` never imports is simply not an element;
three shipped undefined for every consumer. Its other rules cover a `<slot>`
silently dropping a snippet's arguments, and a wrapper replacing a component's
own default with an empty slot.

**`check-focus-visible.js`** — Tabs implements full roving-focus logic in
script (`focusedKey`, `focusedIndex`, a shared `getActiveElement`) and then
strips the focus outline (`outline: none`) at line 634 without replacing it
anywhere in the file. Focus genuinely moves; a sighted keyboard user simply
cannot see where it went — a real WCAG 2.4.7 failure that shipped behind a
green suite, because the walkthrough specs assert `document.activeElement`
and pass correctly regardless of whether anything is visible on screen. A
sweep of the rest of `src/lib` for the same defect class found eleven more
genuine offenders (ChatBubble, Input, CommandMenu, Gallery, ChatComposer,
ListItem, DateRangePicker ×2, Book, Menu, SplitButton, Modal), now all fixed.

This gate parses every `<style>` block and `.css` file in `src/lib` with a
small brace-matching rule parser (it recurses into `@media`/`@supports`/
`@container`, skips `@keyframes` bodies, and strips comments first — an
early version was fooled by its own documentation comments naming a class
that a nearby rule also happened to select). An `outline: none`/`0` on a
selector is accepted only if it is compensated: by the same rule (self), by
another rule sharing a selector token (cross-rule), or by a small, explicit
allowlist for the one remaining legitimate shape — an ancestor
`:focus-within` on a differently-named wrapper class. That allowlist does not
just trust its own justification text: each entry names the ancestor token
and the gate re-verifies, on every run, that the token still resolves to a
rule with a real compensating declaration. An earlier version trusted a bare
justification string instead, and a negative control that broke the ancestor
rule's selector still passed — the allowlist re-verification exists because
of that finding, not in spite of it.

## The one browser-based gate

`check-contrast.mjs` (`pnpm run check:contrast`) is not part of `npm run lint`
and never will be by accident: it needs a real Chromium and a fresh
`build && preview`, so it lives beside the other browser suites
(`test:integration`, `test:visual`, `test:walkthrough`) rather than in the
static chain above.

It hydrates every demo route in both themes and checks rendered text against
its composited ancestor background for WCAG 1.4.3. Two prior claims about this
same audit disagreed ("51 dark and 18 light actionable" vs "20 light, 13
classes") before this existed, which is why it measures the tree as it stands
rather than trusting any remembered count. Full rationale — the hydration
signal, why motion is killed rather than outlasted, why a stale server once
made a negative control falsely green, and what "indeterminate" and "exempt"
mean here — is in the file's own header comment; read it before trusting a
green run as more than the header says it checks.
