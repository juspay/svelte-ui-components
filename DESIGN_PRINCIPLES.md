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

**Entry/exit motion is a third shape, and picking the wrong one is a lifecycle bug, not a
style bug.** The two-token convention above covers a value that's already on screen
changing state. It says nothing about a component *appearing and disappearing*, which is a
different problem: something has to decide when the DOM node itself is created and
destroyed, and that decision has consequences the token pair alone can't express. Three
shapes exist in this codebase, and the choice between them is determined by what else is
tied to the component's mount/unmount, not by preference:

- **No side effect beyond a completion callback** (most dropdown/panel/toast-style
  components): always render the node, drive visibility through a class or attribute, and
  let `@starting-style` supply the pre-first-paint values with
  `transition-behavior: allow-discrete` carrying `display` into the transition timeline.
  Baseline since August 2024, ~91% global support, and degrades to "no animation, correct
  end state" rather than breaking on anything older. This is the only shape with zero
  animation JavaScript, and the only one where `display: none` removes the closed state
  from the tab order and accessibility tree for free.
- **A real `onMount`/`onDestroy` side effect that something else's correctness depends on**
  (a reference-counted resource shared across components, a focus trap, dismissal
  ownership): keep Svelte's `in:`/`out:` transition directives. The outro-wait they
  provide — deferring real destruction until the exit animation finishes — is load-bearing
  for that cleanup timing, and `@starting-style` does not replace it without the component
  taking on its own open/closing/closed state machine in its place. Tokenize by reading
  the duration/easing from `getComputedStyle(node)` inside the transition function itself,
  the same way `svelte/transition`'s own `fly` already reads computed style once for the
  current opacity/transform.
- **A dynamically created/destroyed list item**, not a single boolean slot: plain CSS
  classes own the motion, and removal from the backing store is driven by a
  `transitionend` listener on whichever property finishes last, not a `setTimeout`
  guessing the duration.

Decide the shape before writing the CSS. `Modal`, `Sheet`, `CommandMenu`, `Menu`, and
`ContextMenu` all share a global scroll-lock reference count and a global dismissal-owner
stack (`lockBodyScroll`/`registerDismissible`), so all five keep their Svelte transition
directives. `Toast` has no side effect beyond `ontoasthide?.()`, so it takes the first
shape.

**A named tier sits between the element token and the root token, for the values that
recur.** The two-token convention above lets one root declaration retune every animated
element at once, or a single component override retune one element — nothing addressable
in between. Measured across `src/lib`: nine different literal duration values do the same
job ("something responds quickly") with no name behind any of them, and
`cubic-bezier(0.23, 1, 0.32, 1)` was independently hand-written in three separate
components before anyone noticed it was the same curve three times. The fix is one more
`var()` in the same chain, not a new mechanism:

```css
transition: transform
  var(--modal-content-transition-duration, var(--motion-duration, 60ms))
  var(--modal-content-transition-easing, var(--ease-smooth-out, var(--motion-easing, cubic-bezier(0.23, 1, 0.32, 1))));
```

(`--distance-overlay` is a length, not a duration — it resolves the *travel distance* through a separate chain, not shown here, the same way `Modal`/`Sheet`'s actual `tokenizedFly` calls keep a `distanceTokens` array distinct from `durationTokens`.)

Left unset, every level falls through to the innermost literal — adding the named tier to
an existing component's chain is a no-op until either the tier or the root token is
actually set. That's what makes it safe to add gradually.

Values here are not copied wholesale from any external source. This library measured what
its own shipped components already do, cross-checked those against transitions.dev's
published motion-token reference where the two agreed or usefully disagreed, and settled
every close call by rendering both candidates frame-by-frame and comparing them rather
than by picking the mathematically-nearest number:

```css
:root {
  /* durations */
  --duration-micro: 80ms;
  --duration-quick: 150ms;
  --duration-base: 200ms;      /* this library's own de facto value, 29+ call sites before
                                   this token existed. Kept as its own tier rather than
                                   rounded onto quick/fast — a frame-by-frame comparison at
                                   150/200/250ms showed a real, if subtle, difference at
                                   every step, not three names for one look. */
  --duration-fast: 250ms;
  --duration-medium: 350ms;
  --duration-slow: 400ms;
  --duration-very-slow: 500ms;

  /* easing */
  --ease-smooth-out: cubic-bezier(0.23, 1, 0.32, 1);  /* already the literal in
             ThinkingIndicator, ToolCallLog and TaskList. Frame-by-frame identical to
             cubic-bezier(0.22, 1, 0.36, 1), the one-component (ChatBubble) value and
             transitions.dev's own — kept as the three-component number, ChatBubble
             brought onto it instead, least total churn for a visually identical curve. */
  --ease-in-out: ease-in-out;
  --ease-out: ease-out;
  --ease-linear: linear;
  --ease-bounce: cubic-bezier(0.34, 1.36, 0.64, 1);
  --ease-bounce-strong: cubic-bezier(0.34, 3.85, 0.64, 1);

  /* distance — how far a translate-based entrance travels */
  --distance-micro: 4px;
  --distance-small: 6px;
  --distance-base: 8px;
  --distance-medium: 12px;
  --distance-large: 30px;
  --distance-overlay: 60px;    /* full-surface entrances (Modal/Sheet/Toast) only — see
                                   below. Chosen by rendering 24/40/60/80px and the
                                   then-current 400px side by side: below ~40px a surface
                                   this size reads as a rendering jiggle, not motion; 60px
                                   reads as a deliberate slide into place without reading
                                   as travel. */

  /* blur — entrance-only, net-new capability, zero usage in src/lib before this */
  --blur-small: 2px;
  --blur-medium: 3px;
  --blur-large: 8px;

  /* scale — two families, opposite directions, not interchangeable */
  --scale-enter-large: 0.96;   /* modal-class entrance, growing in from just under full size */
  --scale-enter-medium: 0.97;
  --scale-enter-small: 0.98;
  --scale-enter-tiny: 0.99;
  --scale-hover-small: 1.05;   /* hover emphasis, growing past 1 */
  --scale-hover-medium: 1.1;
  --scale-hover-large: 1.15;
}
```

None of the above is declared anywhere as an actual `:root` rule this library ships — same
as `--motion-duration`/`--motion-easing` today, these are names a fallback chain can
reference and a consumer can set, not values this package hands down. The block above is
the reference for what each name means and defaults to when nothing sets it, not a file to
import.

**Not every existing value moves onto this scale, and that is deliberate, not unfinished
work.** `ThinkingIndicator`, `ToolCallLog`, and `TaskList` already animate their entrances
at **9px** — more conservative than `--distance-base` itself — and stay there rather than
being nudged onto the named tier to make the numbers match; they were the evidence this
scale is right, not components waiting to be corrected by it. `ToolCallLog`/`TaskList`'s
row stagger (120ms, applied only within a newly-arrived batch — see `chipDelay`/
`rowDelay`'s `staggerBase` reset) stays its own literal rather than adopting a shared
`--duration-stagger` token: it is solving a different problem than a dense multi-element
reveal, and a synthetic test confirmed the existing batch-relative design is already
correct for how these components actually grow. The `_chart` family's `ease` easing
default stays un-named — it matches no curve on this scale, and a token for one keyword
used one way is not the kind of recurrence this section exists to name. A value earns a
place on the scale because two or more places already agree on it, not to make the scale
feel complete.

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
