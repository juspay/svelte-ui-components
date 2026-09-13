# The static gates, and what each one cannot see

`npm run lint` runs prettier, eslint, and six project-specific gates. Each exists
because a real defect shipped, and each prints what it does **not** check on a
passing run — because the most expensive mistake this repo has made repeatedly is
reading a green gate as a broader guarantee than it gives.

| Gate                     | Catches                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `check-event-casing.js`  | An event prop that is not lowercase, and deprecated aliases past their cycle |
| `check-shadow-safety.js` | Reads that stop at a shadow boundary and fail silently                       |
| `check-css-contract.js`  | A `var()` chain with no literal, and a colour with no dark value             |
| `check-docs-contract.js` | Docs promising an element, an event or an anchor that does not exist         |
| `check-wc-contract.js`   | Wrappers never imported, and snippets whose arguments a slot would drop      |
| `check-test-focus.js`    | `.only`, which disables every other test in its file while the suite passes  |

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
