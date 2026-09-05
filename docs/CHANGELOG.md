# Changelog

All notable changes to this project will be documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/juspay/svelte-ui-components/compare/HEAD..3.3.2)

Preserve Pill dismiss contrast and keyboard activation across interaction states,
with a configurable dismiss label for localised products. Name Toggle inputs with
blank-safe IDs and semantic labels. Keep native web-component host accessors
untouched by exposing input-scoped id, aria-label and aria-labelledby aliases for
the shadow checkbox, and document the mapping between the two distributions.

Include source controls, accessibility checks and actual runtime before/after proof.
Full functional and unit suites pass locally. The Pill and Toggle visual baselines
are regenerated in the pinned Playwright container for the added demo sections and
re-verified with a clean compare run in the same image.

- feat(components): keep Pill dismissal legible and label Toggle inputs ([5b453b7](https://github.com/juspay/svelte-ui-components/commit/5b453b70ec41e8f39d96fb898567d725117cf7fa))

## [3.3.2](https://github.com/juspay/svelte-ui-components/compare/3.3.2..3.3.1) - 5 September 2026

3.2.0 shipped with no `## [3.2.0]` heading -- its content sat under
`## [Unreleased]` -- and no mention of #506 at all. The immediate cause was a
release race: #505 and #506 merged fourteen seconds apart, both runs computed
3.2.0, and the one that generated the changelog was building from 0f53508,
which contains #505 and not #506.

Regenerating fixes the heading. It does not fix the omission, and chasing that
turned up something larger: docs/templates/changelog.hbs iterated
`{{#each sections}}`, which is not a field auto-changelog provides. The commit
loop nested inside it had the right field names and had simply never executed,
so no released version in this changelog has ever listed a commit. Every
section from 1.0.0 onward was empty. The `{{#if summary}}` above it worked,
which is why the file never looked obviously broken -- the pending release's
prose showed under Unreleased and was overwritten by the next one.

Removing the dead wrapper is the fix; the inner loop is unchanged. Two further
rendering faults in the same template are corrected: `- ` and the subject sat
on separate source lines, which Markdown reads as an empty list item followed
by a paragraph, and the H1 had the intro paragraph glued to it.

`chore(release)` commits are filtered, which matters for more than one bullet:
`releaseSummary` takes its prose from the newest commit in a release, and that
is always the bodiless `chore(release)` commit, so every section rendered
without a summary. Dropping them restores the writeups. The flag has to be
passed as `--ignore-commit-pattern` on the command line; auto-changelog reads
it from argv only and accepts the same key in .auto-changelog silently without
ever applying it. Both camelCase and kebab-case were tried before the flag
moved.

An earlier version of this change ran `prettier --write` on the generated file,
because its output stops being prettier-clean once sections carry prose.
Measured before shipping it: prettier does not merely reformat this file, it
corrupts it. Prose containing `DESIGN_PRINCIPLES` and `corrects _to_` on nearby
lines is read as markdown emphasis spanning both, and rewritten to
`DESIGN*PRINCIPLES` and `corrects \_to*`. It is not idempotent either, so a
release would have mangled a little more each time -- and the mangling lands in
commit prose nobody would think to re-read.

docs/CHANGELOG.md goes in .prettierignore instead, which is where a generated
file belongs. The release step now says explicitly that it is not formatted,
so the next person to notice the file is unformatted does not re-add the step.

Rebased onto 3.3.0; the conflict was the generated file itself and was resolved
by regenerating rather than merging lines. 265+ sections now carry the commits
and summaries they should always have had, including 3.2.1, 3.2.2 and 3.2.3.

lint 0 errors.

- fix(changelog): render every release's commits and summary, starting with 3.2.0 ([41b1330](https://github.com/juspay/svelte-ui-components/commit/41b1330be1ad771f5bbf47ee36ef0e906af1bc3a))

## [3.3.1](https://github.com/juspay/svelte-ui-components/compare/3.3.1..3.3.0) - 4 September 2026

`table` carried `display: block` and `overflow-x: auto` but no intrinsic
width, so the block box was exactly its container's width and there was
nothing to overflow with. A six-column reply compressed to fit instead of
scrolling: measured at a 480px container, scrollWidth 480 against
clientWidth 480.

The scroll container is a wrapper rather than the table itself, because
`display: block` is what makes `overflow-x` apply to a `&lt;table&gt;` and it
also strips the element's table semantics -- assistive technology loses
row and column navigation on exactly the content that most needs it.
Table.svelte reaches the same shape with `.table-scroll`. Each table is
now wrapped in `.markdown-table-wrapper`, which scrolls and is bounded by
`max-width: 100%`, while the table keeps `display: table` and takes
`width: max-content` with `min-width: 100%` to overflow it.

`tabindex="0"` on the wrapper is the other half. A box with
`overflow-x: auto` cannot be scrolled with arrow keys unless it can hold
focus, so without it the new scrolling was mouse-only. BarChart and Book
both pair a scrollable region with a tabindex.

Width alone does not fix the compression, which is the part worth
recording. The container sets `overflow-wrap: anywhere` so an unbroken
string in a model reply cannot force the message wide. Inside a table
that makes every character a break opportunity, so `max-content` resolves
to `min-content` and the table collapses exactly as before. Cells opt back
out with `overflow-wrap: normal`. Either half alone measures 480 against
480.

`tableLabel` names the region. Supplying it adds `role="region"` and
`aria-label`; without it the wrapper stays keyboard-scrollable and
announces no landmark, since a region the user cannot identify is worse
than no region. Declared on the custom element as `table-label`.

Cells keep `white-space: normal`, so a table that does fit still wraps
inside its cells rather than being forced onto one line.

A tab stop with no visible ring is a keyboard user's dead end, so the
wrapper draws a `:focus-visible` outline, themed by
`--markdown-text-focus-outline-color` with the same default Table uses
for its focusable rows.

Five demo-page tests, on two new demo sections since the existing
two-column table cannot overflow anything: the wrapper overflows while
the table keeps `display: table`; the wrapper is focusable and ArrowRight
really scrolls it; the focused wrapper shows an outline; every body row
shares the header's column edges, not just the first; and the region is
named only when a label is passed. Six unit tests pin the string the
post-processor emits: one wrapper per table, role and label only when
labelled, an escaped label, several tables, inline mode, and no table.

- fix(MarkdownText): scroll a wide table in a focusable wrapper, not the table ([5cb4df4](https://github.com/juspay/svelte-ui-components/commit/5cb4df477ae1600b2cfe8a9dd77ad6d507b90a17))

## [3.3.0](https://github.com/juspay/svelte-ui-components/compare/3.3.0..3.2.3) - 4 September 2026

Phase 2 of docs/EVENT_CASING_MIGRATION.md. Phase 1 gave every grandfathered
event prop its correct spelling alongside the old one; this tells a consumer
which of the two they are using, once, and what to run to move.

Dev-only, because a production warning is noise a consumer cannot act on
mid-incident and 142 of them would bury real output. `import.meta.env.DEV` is
the guard specifically because the bundler statically replaces it, so the call
is removed from a production build rather than merely skipped at runtime.

Once per component-and-prop rather than per render: a deprecated prop on a list
row would otherwise warn a thousand times, and the key includes the component
because `onclick` is deprecated on many of them -- deduplicating on the prop
alone would report the first and silently hide the rest.

Rebased onto 3.2.0. Review responses follow.

## The removal version is a constant, and it is a commitment

`DEPRECATION_REMOVAL_VERSION` replaces the literal in the message. The reviewer
called this cosmetic; it had stopped being cosmetic. The string was written
while #506 was expected to cut 4.0.0. #506 shipped inside 3.2.0 as a minor, so
this warning was briefly promising consumers a removal version that nothing was
committed to. 4.0.0 is now the agreed target, one place names it, and a test
pins the value so moving it is a deliberate edit visible in a diff rather than
a silent one.

## Not exporting it from src/lib/index.ts is the mark of an internal module

The review reads the absence as an oversight, on the grounds that a
library-wide helper consumers cannot import is either internal or a mistake.
It is internal, and this codebase already says so this way: src/lib/utils.ts
exports ten functions and the barrel re-exports three, leaving getStorageItem,
hexToRgb, rgbToHsv and four more reachable only from inside src/lib. Selective
re-export is the existing convention for exactly this, not an accident.

Components call warnDeprecatedProp themselves when handed a deprecated
spelling; a consumer has no call for it. Exporting it would add public API that
4.0.0 then has to carry. The module now states this rather than leaving the
reader to infer it, which is the ambiguity the finding actually named.

## The env stub can no longer leak

vi.unstubAllEnvs() moves into afterEach. It sat after the assertion in the
production-silence case, so a failure there would throw before the cleanup ran
and leave DEV=false set for every later case in the same worker -- silencing
the warnings they assert and surfacing the failure somewhere it did not happen.

7 unit tests here, all passing. The suite reports 49 failures in
scripts/wc-parity/prop-parity.test.ts; those are inherited from the release tip
this is rebased onto and are fixed by #512, not by anything in this branch --
prop-parity is the only failing file. lint 0 errors.

- feat(events): warn once, in dev only, when a deprecated prop spelling is used ([5107b4b](https://github.com/juspay/svelte-ui-components/commit/5107b4bfcda2d2638c5ac4ad5ab459d973b01cf6))

## [3.2.3](https://github.com/juspay/svelte-ui-components/compare/3.2.3..3.2.2) - 4 September 2026

Phase 1 of the event-casing migration (#505) gave 56 components a second
spelling for each grandfathered event prop, both wired to the same handler.
It stopped at the Svelte layer. A custom element only forwards what
`customElement.props` declares, so not one corrected spelling was reachable
through a web component: `&lt;sui-toggle onClick={fn}&gt;` set an expando the
component never read.

That is the MAJOR Yama raised on #505 an hour before it merged. It is correct,
and it shipped in 3.2.0 -- verified against the published tarball rather than
the source, where sui-toggle registers `onclick` and nothing else.

126 declarations were missing across 49 wrappers: 119 camelCase synthesized
events and 7 native ones on sui-input. Both directions are real targets.
DESIGN_PRINCIPLES keeps Svelte's lowercase spelling for a native DOM event
forwarded as-is, so Input's `onFocus(event: FocusEvent)` corrects *to*
`onfocus`, while Toggle's `onclick(checked: boolean)` corrects to `onClick`.
The generator discriminates on the signature and had both right.

Generated by scripts/migrate/alias-wc-props.ts, committed rather than run once
and discarded, for the reason its sibling gives: 126 declarations across 49
files is not a diff anyone reviews by eye, and the transform is the only honest
description of what was done to them. Re-running it is a no-op, and a test
pins that.

`isEventProp` deliberately does not match a bare /^on[A-Za-z]/. That would also
take a prop named `once` and declare it a callback. No such prop exists today,
which is exactly why the guard belongs here rather than after one appears.
NATIVE_EVENTS is exported from casing.ts so the rule is stated once.

The risk worth recording: no wrapper had ever declared both spellings of the
same event before this, and Svelte derives an observed attribute by lowercasing
the prop name, so `onclick` and `onClick` both resolve to the `onclick`
attribute and `$$g_p` returns whichever key comes first. Reasoning says that is
harmless because a function cannot arrive through an attribute anyway. The last
time this library reasoned about a custom-element prop instead of measuring it
-- `children` -- the reasoning was wrong, so tests/wc-event-casing-parity.spec.ts
measures it in a browser: both spellings are real accessors, each one reaches
the component, the legacy one still fires, and the corrected one wins when both
are set, matching the component's own `$derived(onClick ?? onclickLegacy)`.

Unit 400 passed (was 343 passed / 49 failed on release) - integration 437
passed - lint 0 errors - check 832 files 0 errors.

- fix(wc): declare the corrected event spellings on every custom-element wrapper ([f952bfe](https://github.com/juspay/svelte-ui-components/commit/f952bfe7e28734c7495a62c76004df1023bb1b6d))

## [3.2.2](https://github.com/juspay/svelte-ui-components/compare/3.2.2..3.2.1) - 4 September 2026

Principle 1 says every visual decision is a custom property with a fallback.
It does not say what happens when there is no declaration at all, and that
turns out to be the one gap in the theming contract a consumer cannot work
around: the cascade can override a rule, but it cannot invent one.

Found by 515. `.toggle-button` had a :hover rule and no :active rule, so
--theme-switcher-bg-pressed had nowhere to land and no arrangement of the
consumer's stylesheet could have produced a pressed state. The component read
as fully tokenised the whole time, because every rule it did have was.

The measurement is what makes it worth stating rather than asserting: across
42 routes and 573 elements in five interaction states on an embedded Shopify
Admin surface, every divergence from the host closed by feeding tokens from
the consumer's side except two, and both were a state no rule painted.

No change to behaviour, tests or the public API.

- docs(principles): a token can only reach a state the component paints ([c5770bd](https://github.com/juspay/svelte-ui-components/commit/c5770bd3d1e2d5a8cd88a79758dd3e997c521eaf))

## [3.2.1](https://github.com/juspay/svelte-ui-components/compare/3.2.1..3.2.0) - 4 September 2026

The toggle button had a :hover rule and no :active rule at all, so pressing
it was visually identical to hovering it and the control gave no confirmation
that the press had registered. Found by measuring every interactive control in
five interaction states on a Shopify-embedded surface: this was the last one
with no pressed state, and it was unreachable from the consumer side because a
token cannot feed a state the component never paints.

--theme-switcher-bg-pressed follows the existing bg / bg-hover naming and ships
a literal fallback like every other token in this file, so consumers that set
nothing keep a working default. It is deliberately not called -bg-active: here
"active" already means the SELECTED segment (--theme-switcher-icon-color-active,
--theme-switcher-segment-active-bg), so that spelling would be ambiguous.

.segment-button is left alone. It paints selection through a sliding indicator
behind a transparent button, so a pressed background there is a separate design
question rather than the same one-line fix.

Verified by the new spec, which asserts all three states resolve to distinct
colours — a pressed state equal to hover is the same defect wearing a new
token. Negative control: with the rule removed the spec fails reporting the
hover colour where the pressed colour was expected.

- fix(ThemeSwitcher): add a pressed state to the toggle button ([0b331e2](https://github.com/juspay/svelte-ui-components/commit/0b331e27520982e6117758957833ed549c6ad987))

## [3.2.0](https://github.com/juspay/svelte-ui-components/compare/3.2.0..3.1.6) - 4 September 2026

Adding a prop to a Svelte component and forgetting its custom-element wrapper
has shipped repeatedly, and it is invisible from the Svelte side: every Svelte
test still passes, because an undeclared prop simply gets no accessor and no
observed attribute. A web-component consumer sets it and silently gets nothing.

This closes the class rather than the three reported instances.

- 185 props declared across the wrappers, taken from the components they wrap.
- Three wrappers existed on disk that src/wc/index.ts never imported, so
customElements.define never ran and sui-hitl, sui-attachment-chip-row and
sui-typewriter-text did not exist for any consumer. Nothing referenced those
files, which is why no build error ever pointed at it.
- scripts/wc-parity/ compares each wrapper against its component and fails the
build on a gap, so the next one cannot ship the same way.

Four defects found by measuring rather than reading, each verified in a browser:

- `aria-haspopup="menu"` never reached sui-button. Svelte derives the observed
attribute by lowercasing, so it was listening for `ariahaspopup`.
- `spellcheck="false"` arrived as `true`. Svelte's boolean conversion is
presence-based, and the prop is a tri-state a presence check cannot express.
- LottiePlayer's `oncomplete`/`onerror` were assignable but never called: the
wrapper's own handlers sit after {...props} and did not forward.
- A slot-backed snippet declared in the component body also sits after
{...props} and wins, so `element.icon = fn` was declared but unreachable —
the same defect one layer up. The branch now lives inside the snippet,
because hoisting a &lt;slot&gt; out of the component body compiles it against a
`$$props` binding that is not in scope and renders nothing at all.

`children` is now host-reserved. Declaring it does not merely shadow
`Element.children`, it leaves `element.children` returning undefined, so
`el.children.length` throws. Thirteen declarations added on this branch and
never published are removed. The three that DID ship — sui-chat-bubble,
sui-draggable, sui-resizable — keep theirs, because removing a published
property is breaking; they are recorded in the ratchet and wait for 4.0.0.
sui-status gains default-slot forwarding, which is additive and closes the
review finding on #503 without spending a major.

Pages concurrency moves from the workflow to the build job. At workflow scope
cancel-in-progress cancels the whole run including deploy, so a second push to
the same ref could kill a deployment mid-flight — the half-published site the
deploy group exists to prevent.

Consumers get advance notice of the 4.0.0 `children` removal: a codemod rule
that reports `.children =` assignments without rewriting them, the codemod
published so `npx sui-codemod --dry-run ./src` works without a checkout, a
README section, and a dev-only install notice. Nothing in this release breaks.

423 integration tests, 387 unit, check:wc 0 errors, lint clean.

- feat(wc): expose every component prop on its custom element, and register three ([97576f4](https://github.com/juspay/svelte-ui-components/commit/97576f4260b4ce3d976482b6d22b04c99ec2e73a))
- feat(events): accept the corrected spelling for every event prop ([0f53508](https://github.com/juspay/svelte-ui-components/commit/0f535083ad74c0e71da4f2d1318c04bc058d38b2))

## [3.1.6](https://github.com/juspay/svelte-ui-components/compare/3.1.6..3.1.5) - 3 September 2026

Closing the last two open review threads from the chat-primitive PRs (#458
to #461), found by a transcript audit: 23 threads there were never answered,
and 21 are already fixed in code on release.

speech-to-text demo: `bind:value` wrote the user's keystrokes into a
$derived override that is discarded as soon as `committed` or `listening`
changes. Nothing was actually lost, because the `oninput` handler already
puts the text into `committed`, but that made a two-way binding whose
correctness depended entirely on a sibling handler. The binding is now
one-way for both composers, so the derived is display state and `oninput` is
the only write path, which is what it was already doing.

ChatBubble: `--button-content-gap: 0px` had no explanation. Button uses that
gap to space an icon from its label; the launcher renders an icon alone in a
circle, where the gap pushes the glyph off-centre. The reset belongs here
rather than in Button, whose default is right for a labelled button, and
docs/ChatBubble.md already records it as a pill-launcher caveat.

svelte-check exit 0; prettier and eslint clean on both files; chat-bubble and
speech-to-text visual baselines pass unchanged.

- fix(demo,ChatBubble): stop binding to a derived, and say why the gap is reset ([2051f11](https://github.com/juspay/svelte-ui-components/commit/2051f11db0e9f089069ab9ad93d2600c11f78348))

## [3.1.5](https://github.com/juspay/svelte-ui-components/compare/3.1.5..3.1.4) - 3 September 2026

`statusIcon` defaults to `icons/order-success-icon.svg`. That is a relative URL
resolved against whatever page renders the component, and the library ships no
such file, so it pointed at something real only for an app serving that exact
path at its own root, and resolved to `&lt;route&gt;/icons/order-success-icon.svg`
anywhere deeper -- on the demo, at /components/status, it requested
/components/icons/order-success-icon.svg and 404ed. Every card relying on the
default rendered a broken image, which is how this surfaced: it was visible in
the regenerated visual baseline.

The default itself is unchanged, so this is not a breaking change. An app that
does host that path keeps getting its own file. A built-in inlined SVG stands
in only when the fetch fails.

The fallback is scoped to the untouched default and is deliberately not applied
to an icon the caller supplied: answering a failed failure-icon with a success
checkmark would be worse than showing nothing.

The built-in icon carries no `role` or `aria-label` of its own. Both are in
`Img`'s root allowlist, so an icon declaring them has them copied onto the live
host, where they outrank the label `Img` derives from `alt` -- pinning every
default icon's accessible name to "Success", including on a failure screen. An
earlier version of this change had exactly that bug.

Also adds `statusIconAlt`, additive and defaulting to the previous hardcoded
`'status'`. The generic name is deliberate, since the same icon shape serves
success and failure screens, but a caller can now say what the screen means or
pass `''` to mark the icon decorative when `statusText` already carries it.

Cost worth naming: a page rendering the default still makes one failing request
per Status before falling back. Removing that means changing the default, which
is the breaking change this avoids.

Verified: 3 specs cover the fallback painting a real icon, the caller's icon
being fetched and not replaced, and the accessible name coming from
`statusIconAlt`. 405/405 functional, 286/286 unit, lint and check clean, and
the status visual baseline matches without regeneration.

Review follow-ups:

- docs/Status.md still advertised the built-in icon as the prop default. That
was true of the first version of this change and stopped being true when the
default was left alone, so the table documented a contract the component no
longer had. The Default column reads `'icons/order-success-icon.svg'` again,
with the fallback explained in the description.
- The caller-icon test never forced the caller's URL to fail, which is the only
state where the scoping matters -- and it asserted the icon was visible, which
the built-in fallback would also satisfy, since both render as an &lt;svg&gt;. It
now aborts the request and asserts the absence of an inlined &lt;svg&gt;: a failed
caller icon stays a plain &lt;img&gt;. Checked against a negative control: making
the fallback unconditional fails exactly this test.
- statusIconAlt was only asserted at its default, so the prop could have stopped
being forwarded without the test noticing. Two demo cases now pass a
distinctive name and an empty string, with specs for each.

Second review round:

- statusIconAlt was added to Status.svelte but omitted from the `sui-status`
wrapper, so web-component consumers had no accessor or observed attribute.
This is the same recurring wrapper-parity gap documented by the existing
choicebox show-indicator spec. Added `status-icon-alt` as a reflected String
prop and a bundle-level test covering both a named and decorative icon.
Verified with a negative control: removing the wrapper declaration fails both
tests.
- The new custom-element test queried the shadow root in a bare evaluate right
after appending and flaked under a combined run. Uses Playwright locators now,
which pierce open shadow roots and auto-wait for the first render.

- fix(status): stand in for the default icon when its file is absent ([d96be5a](https://github.com/juspay/svelte-ui-components/commit/d96be5acd0fed1c0d499b33d77dad47b6807e921))
- fix(visual): allow 12 pixels on task-list only, for one unstable arc edge ([3233a9b](https://github.com/juspay/svelte-ui-components/commit/3233a9b86b99c34f08c35e54e28f591db0b9548c))

## [3.1.4](https://github.com/juspay/svelte-ui-components/compare/3.1.4..3.1.3) - 3 September 2026

Both routes were excluded as "unstable under suite load", which was true when
written but was never re-tested after the viewport work. Retested by emptying
EXCLUDED, generating baselines for both, and running the full suite repeatedly.

task-list is stable and is now baselined. Its stated reason -- "one of the
tallest demos with staged reveals" -- was the fitting problem: the demo grew
past the viewport, the old loop ran out of attempts, and the capture stitched
mid-scroll. That was fixed when growth that tracks the viewport started being
detected, and this route has simply been excluded ever since on a reason that
no longer applies. Two consecutive full-suite runs: 93 passed, 1 skipped, 0
failed, with task-list green in both at ~800ms.

thinking-indicator stays out, now with the measurement instead of an
impression. Within a single test's own retries the captured height walks
2029 -&gt; 2035 -&gt; 2121 -&gt; 2150 -&gt; 2059px. The animated dots are pinned by the
stylesheet; the per-second elapsed counter is not, because it retimes the
layout on a real timer the manual clock does not drive. Its reason in EXCLUDED
now says that, so the next person deciding whether to re-test it can tell what
would have to change first.

Baselined coverage goes from 92 routes to 93.

- chore(visual): baseline task-list, and measure why the other stays out ([9aa8526](https://github.com/juspay/svelte-ui-components/commit/9aa8526487d2510547ccc8e5353b1dddd885ec59))

## [3.1.3](https://github.com/juspay/svelte-ui-components/compare/3.1.3..3.1.2) - 2 September 2026

The 2 September sweep of review threads on the merged component-reuse PRs
answered all 107 unresolved threads against release 3.1.0; fifteen were
genuinely open. This lands all of them.

Accessibility: Carousel marks the active dot aria-current; ListItem drops
aria-selected together with role/tabindex under suppressRoleAndTabindex;
Input gates aria-invalid on !actionInput exactly as the visible error state
already is; Accordion gives the trigger an id and makes the panel a region
labelled by it.

Behaviour: Status applies its weight/colour defaults only to the plain div
so a heading statusTextTag takes the application's typography;
TypewriterText resyncs revealedWordCount after a bulk reveal;
lockBodyScroll/unlockBodyScroll restore the host's prior inline overflow
instead of clearing it.

Web components: sui-status exposes status-text-tag; sui-chip-input exposes
editable (attribute) and onedit (property).

Docs: browser-resolvable bundle URL in the ChipInput and DateRangePicker
pages; the 2.136.0 ChipInput test-id rename recorded as a migration note;
Combobox notes that aria-label names the listbox, shows inputProperties.label
for the input, and lists allow-create; the Pill spec comment describes the
regression guard it actually is.

Every behavioural change is pinned by a demo-route Playwright test; two demo
pages gained a case for that purpose. check:wc stays red on four untouched
files (pre-existing, not run by CI).

The /components/input visual baseline is regenerated in the pinned Playwright
container for the new demo section (980x4362 -&gt; 980x4561; only that page changed).

Review follow-ups: the actionInput demo field is named through ariaLabel so it
keeps an accessible name with its label hidden, and the Carousel test asserts
exactly one aria-current dot across the strip after navigation.

Yama's review of 959c3ca3e: the Accordion trigger id is derived from the
per-instance uid rather than effectivePanelId, so a panelId assigned after
mount moves the panel's id without renaming the trigger (pinned by a
demo-route test that assigns panelId late and asserts the trigger id and
aria-labelledby hold); Carousel's dot expressions use strict equality;
docs/Accordion.md records the region/aria-labelledby wiring and that an
icon-only trigger snippet needs text or an aria-label on the icon for its
accessible name. The /components/accordion visual baseline is regenerated in
the pinned container for the new demo section (980x800 -&gt; 980x1029).

- fix(a11y): close the fifteen open review findings from the component-reuse PRs ([69c035e](https://github.com/juspay/svelte-ui-components/commit/69c035e9e4d600f69f5f63357490bc9b649f0985))

## [3.1.2](https://github.com/juspay/svelte-ui-components/compare/3.1.2..3.1.1) - 2 September 2026

`lint` ran `prettier --check src && eslint src`, so `scripts/` and `tests/`
were never checked at all. That gap was reported on #495 and is the reason a
banned `undefined` reached review on #500 instead of failing locally. Extending
the script to `src scripts tests` surfaced 31 real violations of rules this
repo already enforces everywhere else.

Lint coverage:

- analyze.ts asserted `value as UnknownRecord`, which `consistent-type-assertions`
bans outside test files. Type predicates are banned too, so there is no way to
tell the compiler a narrowed `object` is keyed by string. `asRecord` now copies
the own enumerable keys instead. The copy is shallow, so nested nodes keep
their identity and the AST walk is unchanged -- verified against lighthouse
below.
- `undefined` is banned repo-wide; signatures.ts returned `string | undefined`,
casing.ts took `string | undefined`, and map.test.ts (added last change) used
it in four places. readSignature returns `string | null`; forwardsDomEvent and
deriveEventName take `unknown`, which is what their bodies already narrowed.
- check-event-casing.js was missing `curly` braces in four places and was not
Prettier-formatted.
- tests/ had six unformatted files, six more `undefined` comparisons, an
unnecessary escape, and an unused locator.

Three findings from #495, all still open:

- transformModuleSpecifiers matched with a context-anchored regex, reasoning
that a specifier only follows `from`, `import`, `import(` or `require(`. True,
but those words appear just as readily in a comment or inside a quoted string,
and the regex rewrote those too: a fixture with the package named in a line
comment, a block comment, a string literal and one real import rewrote all
four. It now parses with TypeScript, which is already a devDependency and
already type-checks this directory, and replaces only the literal's interior
so the quote style survives. Static, re-export, dynamic, `require` and
`import()`-in-type-position are all covered by tests.
- cli.test.ts kept `dir` and `lines` as module-level mutable state. Each test
now builds its own project, cleaned up through `onTestFinished` so removal
happens whether the test passes or throws. (The reported reason -- that
afterEach would not run on a throw -- is not accurate; vitest runs it either
way. The shared mutable state was worth removing on its own.)
- Both script tsconfigs included `./*.ts`, so a nested file would have escaped
`check:codemod` / `check:migrate`. Now `./**/*.ts`.

Verified: 288/288 unit, 136/136 across scripts/ (was 133), lint and check clean
under the widened scope. The migrate CLI re-run against lighthouse reports 385
.svelte files, 0 blockers, 0 findings -- identical to before the asRecord
rewrite. Checked against a control, since a zero from a broken detector looks
the same: a fixture with `showBackButton={false}`, `showBackButton="{false}"`,
a bound guard and a bare Toolbar flags exactly the last two.

---

Review on this PR found four more, including a regression this PR introduced.

- `import X = require('x')` stopped being rewritten. Its specifier hangs off an
ExternalModuleReference rather than a call expression, and the regex being
replaced had matched it by accident through the bare `require(` context. The
parser walk did not look for it, so switching to a parser silently dropped
syntax that used to work. Handled now, with a test.

- asRecord could be fed dependencies through `__proto__`. `JSON.parse` makes it
an ordinary own key, and assigning it re-points the copy's prototype instead
of adding a field, so a manifest declaring neither svelte nor the library
still answered for `dependencies` through the chain -- reported as satisfying
the peer when nothing was declared. Copied with `defineProperty` now, which
creates an own data property instead of invoking the setter.

- readSignature interpolated the prop name into a regex unescaped, the same
hole already fixed in map.test.ts. Escaped.

- Documented why `Reflect.get` and `defineProperty` are used rather than plain
indexing and assignment, and that only string keys are copied.

Verified after: 290/290 unit, 138/138 across scripts/, lint and check clean.
lighthouse unchanged at 385 files / 0 findings, and the four-case control still
flags exactly the bound and bare Toolbars.

- fix(codemod): lint scripts and tests, and parse module specifiers ([96f8e9f](https://github.com/juspay/svelte-ui-components/commit/96f8e9fc401b32fa845e8f82775415ac17e81105))

## [3.1.1](https://github.com/juspay/svelte-ui-components/compare/3.1.1..3.1.0) - 2 September 2026

Review comments that arrived on #494-#499 after I reported each PR done, and
were never addressed before merge. All verified against the merged code before
anything was changed; three turned out not to hold and are left alone.

Fixed:

1. The codemod rewrote Stepper consumers onto a deprecated prop (#495, MAJOR).
`StepperProperties` marks `onhandleStepClick` "@deprecated Use onstepclick
instead", and the map targeted it. The cause is in the map's derivation
rule: pairs were accepted when lower(sui) === lower(poly), which is
deprecation-blind, so an alias whose lowercase spelling matches the fork's
outranks the canonical prop and wins the pair. A consumer running the
codemod landed on the one spelling of that event scheduled for removal.
Stepper is the only affected pair of the 28. The target is now `onstepclick`,
with `onhandleStepClick` still recognised as a source in the to-poly
direction so a SUI consumer on either spelling converts.

map.ts had no test at all, which is how this got through. map.test.ts now
asserts no target is @deprecated, every target is really declared, and a
pair may only differ by more than case in order to step over a deprecated
alias. It fails on the old map.

2. Two visual-suite stabilisers gave up silently (#496, MAJOR). This one found
a real bug underneath it:

- fitViewportToContent returned after 4 attempts whether or not the height
had settled. Two demos never settle, because the shell is min-height:100vh
and they add their own full-height element -- every pixel the viewport
gains comes back as content. Measured: `table` is 36388px at every
viewport, `brand-loader` grows 1x the viewport gain, `status` grows 3x.
The loop was running out of attempts and capturing at whatever size the
budget left, which is why brand-loader kept flaking. status was the
clearest symptom: its baseline had inflated to 60209px, ~92% stretched
empty space. Growth that tracks the viewport is now detected and the page
pinned to the default viewport. Anything moving for a third reason throws
instead of being captured mid-scroll.

Both baselines are regenerated. status drops to 2609px, 84% smaller, with
all seven demo variants still in frame (checked by eye, not by size).

- waitForImages snapshotted document.images once, so an image appended while
the first batch settled was never awaited. It rescans each round.

3. docs/Img.md claimed child elements are "inlined as-is" (#498). True before
that PR, false after it -- sanitizeInlinedSubtree was added precisely
because the root allowlist alone was bypassable, and the sentence describing
the old behaviour was left behind. Documentation understating a security
boundary is worth more than the minor it was filed as: a reader deciding
whether to inline a third-party SVG would have concluded it is not safe. Now
states what is actually stripped.

4. The ci.yml comment still asserted the "11 consecutive green runs" figure
(#494). That was withdrawn during review of #494 itself, when the first run
with the gate enabled caught a failing spec -- but only the PR body was
corrected, and the workflow is the copy that outlives the PR. The field was
backwards too: continue-on-error rewrites the step's `conclusion` to
success, so `outcome` is what survives it.

5. scripts/visual-test.sh documented `--update` in its own usage block (#496).
`playwright test --update` exits with "unknown option". package.json already
used --update-snapshots, so only the path through the script's header was
broken.

6. Nothing enforced the container/package lockstep in CI (#496). visual.yml
only asked for it in a comment. It now checks that the image ships the
browser Playwright expects and names the three files to update. Deliberately
a check and not `playwright install`, which was the suggested fix: installing
inside the container shadows the image's pinned browser, so CI would
silently rasterise differently from every laptop -- the exact drift these
pinned baselines exist to catch.

Not changed, having checked:

- The image tag version parse handles the tag shape it was reported to break
on: %%-* strips from the first hyphen, so v1.60.0-jammy-amd64 yields 1.60.0.
- Route discovery was reported to miss demos against a 97-directory tree with a
SKIP_SLUGS filter. There are 94 directories and no such constant; the filter
is EXCLUDED, which emits visible skipped tests. 92 baselined + 2 excluded
accounts for all 94. Deriving the list from _nav.ts instead would weaken the
guarantee, since a demo on disk but missing from the nav would go
unscreenshotted.
- A workflow-level env for the pnpm version is per-workflow, so it cannot
deduplicate a version pinned in both ci.yml and visual.yml, and would make
visual.yml diverge from ci.yml. The fix that would collapse both is a
packageManager field, which changes local resolution for everyone and is not
a review-sweep edit.

Also carries the five findings from #499 that opened this PR: semver range
intersection for the peer check, AST-literal detection for showBackButton
(JSON.stringify matched "computed":false on any MemberExpression, so a bound
guard read as disabled and its affected usage went unreported), the CSS
selector line offset, JSON.stringify on --target, and file-URL entrypoint
detection for Windows.

Verified: 97/97 in scripts/codemod (was 96, and map.ts had no test file),
36/36 in scripts/migrate, 285/285 unit, lint and check clean. Visual suite run
in the pinned container twice end to end.

---

Second round: seven review comments on this PR itself, all verified.

7. isFalseLiteral read only the bare ExpressionTag shape (MAJOR). Svelte types
an attribute value as `true | ExpressionTag | Array&lt;Text | ExpressionTag&gt;`,
and quoting a single expression -- showBackButton="{false}" -- produces the
one-element array. So a Toolbar whose control genuinely never renders was
reported as affected. This one errs the safe way, unlike the false negative
it replaced: it over-reports rather than under-reports. Test written first
and watched fail.

8. The viewport-relative heuristic could misclassify legitimate growth, on code
added earlier in this same PR. `height - previousHeight &gt;= viewportGain - 1`
treats any growth past the viewport gain as viewport-relative, so a page
that reveals a large section when given room would be pinned to the default
viewport and lose everything below the fold.

The suggested fix was an allowlist of the two known routes. Not taken: that
hardcodes the answer, so a future viewport-relative demo regresses silently
to the old behaviour. The classification is now confirmed rather than
inferred -- shrink the viewport and check the content follows it down.
Content sized against the viewport shrinks with it; content that was merely
revealed does not. Pinned routes are logged, which was the good half of the
suggestion.

Verified: the full suite pins exactly 2 routes and leaves the other 90
alone. A single delta could not have told those apart.

9. The entrypoint guard used `undefined`, which the repo's ESLint config bans.
It only escaped because `lint` covers `src` alone -- the same gap reported
on #495 and still open.

10. The --target injection test asserted the manifest was uncorrupted but never
that the apply happened, so a refusal would have satisfied every assertion
in it. Now asserts exitCode and applied.

11. waitForImages re-added listeners to an image still pending on the next
round. Watches are memoised in a WeakMap.

12. docBlockFor interpolated a prop name into a regex unescaped. Every current
name is a plain identifier, and the first test in the file asserts each one
resolves, so a miss would already fail loudly -- escaped anyway.

Kept, with evidence: `intersects(..., { loose: true })` was reported as
possibly accepting prereleases unexpectedly. Measured across 18 ranges, loose
changes the answer for exactly one -- ^05.41.2, where strict parsing throws and
would report a blocker that does not exist. Both prerelease examples named in
the review resolve identically either way. The mode is safer, not looser; now
documented and pinned by a test.

Final: 286/286 unit, 134/134 across scripts/, lint and check clean, visual 92
passed / 2 skipped / 0 failed in the pinned container.

- fix(review): resolve the findings left open on merged PRs ([78883b5](https://github.com/juspay/svelte-ui-components/commit/78883b54367b7db047226fe6674f1c2089809db8))

## [3.1.0](https://github.com/juspay/svelte-ui-components/compare/3.1.0..3.0.0) - 2 September 2026

Three related pieces of the same job: getting a consumer from where it is onto
the next major without hand-editing.

CONSUMER MIGRATION SCRIPT (scripts/migrate)

Audits a project against 3.x, reports what blocks the upgrade, and applies the
dependency bump when nothing does. Reports by default; nothing is written
without --apply.

3.0.0's breaking surface is one thing: with no backIcon, Toolbar's default back
control moved from &lt;div role="button"&gt;&lt;img&gt;&lt;/div&gt; to &lt;button aria-label&gt;&lt;svg&gt;.
Usages passing showBackButton={false} or their own backIcon are unaffected. Only
a literal false counts as disabling -- a bound expression could be either, and a
spread hides the props -- so both are surfaced for review rather than assumed.

Reads the manifest, never node_modules: an installed tree can be stale relative
to what a project declares. A checkout here reported svelte 4.2.8 and library
1.34.0 while its own package.json asked for svelte ^5.55.9 and 2.19.2, and
trusting the former would have produced a confident, wrong answer about which
framework the project is on. Refuses to --apply while a blocker stands, since
bumping past an unsatisfied peer produces a tree that cannot install.

Verified against lighthouse: 385 .svelte files, no blockers, no affected usage
-- its one Toolbar passes showBackButton={false}. Checked against a negative
control: removing that guard from the same real file flags it at the exact
Toolbar line, so the zero is a real absence, not a detector that finds nothing.

EVENT-CASING CHECKER FIX

The checker decided a prop forwards a native DOM event by matching its NAME.
That is wrong for props whose names collide with a DOM event but which hand
back domain data: TypewriterText's onProgress passes a TypewriterProgress,
Table's onToggle passes (rowIndex, checked, originalIndex), ThinkingIndicator's
onToggle takes nothing. Six such props were baselined as violations, and
lowercasing them would have renamed correct props into wrong ones.

Classification now reads the declared type. Verified no prop declares its DOM
event type on a line other than its own, so the line-based test is sound.

The stricter rule also removes an unintended excuse: a prop whose name matched
a DOM event was previously never checked at all. That surfaced 48 real
violations the old checker never reported -- Accordion.ontoggle,
Checkbox.onclick, Img.onerror, Slider.oninput and so on. The baseline goes
100 -&gt; 142: six false positives out, 48 previously-invisible violations in.
No prop is renamed and the check still reports 0 new.

RENAME MAP FOR 4.0.0 (scripts/migrate/casing.ts, docs/EVENT_CASING_MIGRATION.md)

All 142 have a mechanically derivable target; none needs a human to pick a
name. The hard-looking group is the synthetic events written entirely in
lowercase, where the word boundaries are no longer in the name -- but
segmenting against a closed domain vocabulary resolves every one of them
exactly one way: onbarclick -&gt; onBarClick, onopenrichfile -&gt; onOpenRichFile,
onafterclose -&gt; onAfterClose. Where a body ever segments two ways, every
candidate is reported rather than one being silently chosen.

casing.test.ts asserts this against the real baseline: 142 resolved, 0
unresolved, and no derived target collides with an existing prop on its
component. That test is the guard -- a future violation whose name cannot be
derived fails it, which is what keeps the eventual rename mechanical.

The plan sequences the rest: additive aliases for all 142 (a 3.x minor), a
dev-only deprecation warning, then removal in 4.0.0 once the aliases have
shipped. Consumers migrate through the existing scripts/codemod transform,
whose rename map is data.

vitest 29/29 in scripts/migrate, full unit suite green, lint and check clean.

- feat(migrate): add consumer migration script for the 3.x upgrade ([a453ea7](https://github.com/juspay/svelte-ui-components/commit/a453ea770cebffc06b6d31b7239df3745a36f095))
- feat(migrate): consumer migration script, casing rename map, and checker fix ([48281df](https://github.com/juspay/svelte-ui-components/commit/48281df1fa5908a6dbf4dfc80908d9d827b5f294))

## [3.0.0](https://github.com/juspay/svelte-ui-components/compare/3.0.0..2.136.12) - 2 September 2026

Toolbar was the only component in the library whose default rendering made a
network request: `backIcon` defaulted to
`https://sdk.breeze.in/gallery/icons/back.svg`. A default that fetches will
hang or 404 offline, cannot follow `currentColor`, and pins a first-party
component to a CDN path nobody in this repo controls. Twelve other components
already inline their SVGs; this brings Toolbar in line.

The control itself was a `&lt;div role="button" tabindex="0"&gt;`, so Enter and
Space did nothing unless the consumer wired `onkeydown` themselves, and the
only accessible name was the image's alt text. It is now a native `&lt;button&gt;`
with `aria-label` from the new `backLabel` prop (default 'Back'; an empty or
whitespace-only value falls back to the default so the name is never
stripped). Keyboard activation and the name come for free; the icon is
decorative. `box-sizing: content-box` keeps the outer box identical to the
div it replaces regardless of the UA button stylesheet.

What does NOT change:
- `backIcon={null}` (or '') still renders no back control at all — a contract
the existing test pins and consumers rely on.
- A consumer-supplied `backIcon` URL still renders as an `&lt;img&gt;`.
- Every existing token keeps its value.
- The title's typography tokens are untouched: `--toolbar-text-font-size` /
`-weight` with their 18px/normal defaults are the correct library pattern
and overridable per consumer.

New: `backLabel` prop (also `back-label` on the web component),
`--toolbar-back-icon-color` (default inherit), and a keyboard-only focus ring
via `--toolbar-back-button-focus-outline` / `-offset`. `playwright-report/`
and `playwright-report-visual/` are now gitignored beside `test-results/`.

Tests: the "unconfigured toolbar" test now asserts a `&lt;button&gt;` carrying an
inline `svg` with `stroke="currentColor"`, no `img`, and `aria-label="Back"`;
new tests cover a consumer-supplied image, Enter/Space activation, the
empty-label fallback and the 48x60 box. Negative control: restoring the old
`&lt;div&gt;` markup fails exactly the tag and activation assertions and nothing
else. The container-pinned visual baseline for the toolbar demo route is
regenerated (1,577 px: the chevron glyphs and the two new demo instances;
91 other baselines unchanged, 92/92 after).

BREAKING CHANGE: with no `backIcon`, Toolbar renders
`&lt;button aria-label="Back"&gt;&lt;svg/&gt;&lt;/button&gt;` instead of
`&lt;div role="button"&gt;&lt;img src="https://sdk.breeze.in/..."/&gt;&lt;/div&gt;`. Consumers
that selected `.back img`, asserted the old `src`, or themed the image must
size the icon with the unchanged `--toolbar-back-image-height`/`-width`
tokens (they now apply to the `svg` too), colour it with
`--toolbar-back-icon-color`, or pass their own `backIcon` URL to keep an
image. `backIcon={null}` still renders no control. See docs/Toolbar.md.

- **BREAKING:** feat(toolbar)!: render the default back control as a button with an inline icon ([83c406d](https://github.com/juspay/svelte-ui-components/commit/83c406d81dd20432927b1cf728eed4fb2a7fe88c))
- test(visual): add container-pinned visual regression suite for the demo routes ([6e28399](https://github.com/juspay/svelte-ui-components/commit/6e2839941280ebd91c07cb753424c6033908223a))

## [2.136.12](https://github.com/juspay/svelte-ui-components/compare/2.136.12..2.136.11) - 2 September 2026

Mechanical migration path for consumers moving between
polymorph-ui-components and @juspay/svelte-ui-components:

- scripts/codemod/map.ts: 28 casing-only event-prop pairs across 9
components (Gallery 4, Input 8, ListItem 5, MediaUpload 1, Modal 5,
Stepper 1, Table 2, Toast 1, Toolbar 1), derived by parsing the
$props() destructure of every component exported by both libraries
and cross-checked against properties.ts/.d.ts on each side.
- scripts/codemod/transform.ts: svelte/compiler (modern AST) based
rewrite of prop names on library components only — resolves import
aliases, namespace imports and &lt;svelte:component this={X}&gt;; expands
shorthand attributes; rewrites import/export/dynamic-import
specifiers incl. subpaths. Spreads, unresolvable tags, default
imports and already-present target names are warned about with
file:line:column instead of being rewritten.
- scripts/codemod/cli.ts: recursive runner with --dry-run diff,
--reverse direction and a summary report; npm run codemod.
- vitest coverage for every pair, both directions, alias/namespace
resolution, negative cases, round-trip idempotency, spread warnings
and the CLI; wired into npm run test:unit. Strict typecheck wired
into npm run check via check:codemod.

- feat(codemod): add polymorph consumer migration codemod ([a9939e6](https://github.com/juspay/svelte-ui-components/commit/a9939e6244051f85c3649cd0e7232ae27c8401fa))
- ci: make the Playwright suite an actual merge gate ([e8ca5fb](https://github.com/juspay/svelte-ui-components/commit/e8ca5fbbb3ef0f79ab8688bd8d573158ee80ab76))

## [2.136.11](https://github.com/juspay/svelte-ui-components/compare/2.136.11..2.136.10) - 2 September 2026

Img's inlineSvg path fetches remote markup and adopts it into the live
document. Two ways that let a fetched file run script in the host page.

Root attributes were copied wholesale, so a payload could plant onload/onclick,
clobber the data-pw test hook, set an id (DOM clobbering) or override sizing
via inline style. Root attributes now face an allowlist -- geometry, paint,
and a11y metadata, the set real icon pipelines actually emit and that this
repo's own assets carry.

Descendants were adopted wholesale too, which left the same vector open one
element deeper: an event-handler content attribute becomes a live handler the
moment its element is adopted, so &lt;image onerror&gt; inside the payload runs
exactly like onerror on the root would. Guarding only the root would have
looked like a fix while the hole stayed open -- verified by a test that fires
a child handler for real rather than only asserting an attribute is absent.
Descendants are now stripped of scripting elements, on* handlers, and
javascript: URLs before adoption. A denylist there rather than an allowlist,
because descendants legitimately carry the whole SVG geometry and paint
vocabulary and enumerating it would break real artwork.

transformSvg's contract is preserved: when a transform is present the raw
payload is parsed separately, and root attribute names absent from it were
added by the caller's hook and pass through. Fetched names always face the
allowlist, so an attacker's onload can never ride a transform. If the raw
payload does not parse alone, nothing is attributable to the caller and the
allowlist applies to everything.

Separately: showIndicator shipped on Choicebox in #428 but never reached
&lt;sui-choicebox&gt;, so web-component consumers could not use it. Added following
the wrapper pattern used by the file's other booleans.

Verified: tests fail for the right reasons before the fix (onload/onclick/
data-pw landing on the host; child onerror surviving), 17 passed after across
the new specs plus the existing Img/Choicebox/icon-slot suites. lint and check
both exit 0.

- fix(Img): sanitize fetched SVG before adoption; expose show-indicator on sui-choicebox ([0d2f92d](https://github.com/juspay/svelte-ui-components/commit/0d2f92d9930a5bb2b50c22583100062bebeea6ff))

## [2.136.10](https://github.com/juspay/svelte-ui-components/compare/2.136.10..2.136.9) - 2 September 2026

A library-wide audit of docs/*.md against current source found substantial
drift accumulated across many merges. File coverage was already 100%
(every component has a doc) -- the problem was accuracy, not existence.

Audited all 95 components; 44 needed corrections. Every finding was
re-derived directly from source rather than trusted from the audit script,
which had several false-positive classes (see below).

Real defects fixed -- docs that actively misinformed:

- Card, Checkbox: both documented a border-radius default that did not
match the code (8px and 3px documented; both actually resolve to 4px via
var(--x-border-radius, var(--radius, 4px))). Corrected, and the shared
--radius fallback token is now documented on both.
- Tabs: `items` was typed `string[]` in the docs. It is actually
`string[] | TabItem[]` -- an entire vertical-nav mode with per-item
icons, status dots, section labels and key-based selection existed in
source and was absent from the docs. Added the TabItem type, the
`activeKey`/`orientation` props, the `onkeychange` event, 3 missing
fields on the `tab` snippet signature, and 17 CSS variables.
- InputButton: the `inputProperties` row inlined a stale snapshot of
OptionalInputProperties missing ~15 props Input has since grown.
Replaced with a pointer to Input's own docs so it cannot drift again.
- DateRangePicker: documented --drp-trigger-hover-border-color; source has
--drp-trigger-hover-border. Corrected.
- FunnelChart: properties.ts documented `maxHeight` as defaulting to
Infinity, but FunnelChart.svelte destructures DEFAULT_CHART_MAX_HEIGHT
(420), matching LineChart, DualAxisBarChart and SankeyChart. Fixed the
stale JSDoc.

Largest gaps closed:

- Table: 11 undocumented top-level props (columns, rows, sortMode,
pagination, toolbarSlot, rowNumberColumn, rowNumberLabel,
summaryRowIndex, headerTooltipIcon, headerTooltipPosition, usePortal --
the last not mentioned anywhere), their supporting types (including the
TableCellValue / TableColumnType / TableBuiltinCellTestIdSuffixes /
TableColumnFilterConfig aliases the declarations build on), and ~58 CSS
variables across new Built-in Cells / Row Numbers / Bulk Toolbar /
Inline Search sections.
- MediaUpload and Gallery: both had a prose CSS Variables section ("see
the .svelte file's style block") instead of the table every other
component doc uses. Replaced with real tables -- 70 and 67 rows
respectively, every variable and default read from source.
- HITL: 4 undocumented testId-override props plus ~29 --hitl-* variables.
- Modal: 8 rows covering a complete disabled-state footer-button theming
surface that existed in code and was entirely undocumented.
- Select: showSelectAll, selectAllLabel, usePortal (all undocumented),
an incomplete optionIndicator snippet signature, and 5 CSS variables.
- Sheet: dismissOnOutsideClick, plus the 4 anchor-position variables that
enable its floating-panel mode.
- Menu: selectedValue, which the new --menu-item-selected-* rows describe
but which had no Props row of its own.
- Smaller prop/variable additions across Accordion, AreaChart,
AttachmentChipRow, Banner, BarChart, BrandLoader, Button, Calendar,
ChatComposer, ChatMessage, ChatMessageList, ChatSuggestions, Choicebox,
CommandMenu, DeltaIndicator, DualAxisBarChart, FileDropzoneTrigger,
FunnelChart, Gauge, GridItem, Icon, IconStack, Input, LineChart, Loader,
PieChart, Pill, SankeyChart, Toast, Toolbar and Tooltip.

51 components were verified clean and deliberately left untouched.
Notable false positives caught before editing anything -- the audit's
aggregate counts were unreliable and each was checked against source:
StatCard's 9 and ToolCallLog's 6 "stale props" (both docs match source
exactly), Stepper's 28 "stale vars" (defined in its sibling Step.svelte),
ThinkingIndicator's 5 "stale props" and 17 "undocumented vars" (this
repo's combined-cell table convention, already documented), props
documented under `## Snippets` rather than the Props table, nested-type
fields mistaken for top-level props, and shared design tokens (--radius,
--chart-*) that are cross-cutting rather than per-component.

Coverage: tests/docs-accuracy-batch{1..7}.test.ts, 33 tests asserting the
newly-documented behaviors are real rather than merely described --
Table's usePortal/rowNumberColumn/toolbarSlot, Tabs' TabItem mode,
Input's readonly/spellcheck, Select's showSelectAll/usePortal, Sheet's
dismissOnOutsideClick, Accordion's disabled trigger, and the themeability
of MediaUpload's, Gallery's, Choicebox's, Modal's, Menu's, PieChart's and
Pill's newly-tabulated variables. Demo instances were added where a prop
had no reachable demo to test against.

Two demo/test corrections worth calling out, both from review:

- The Button demo set ariaHaspopup="menu" on a button with no popup and no
activation handler, teaching an accessibility contract the page did not
honour. Replaced with a real Menu whose `trigger` snippet spreads the
wiring onto a Button -- the pattern docs/Button.md already recommends --
and the assertion moved there, now also covering aria-expanded.
- A SankeyChart height assertion compared Number(getAttribute('height'))
against a cap; a missing attribute yields Number(null) === 0, so it
would have passed vacuously. Added a not-null assertion first.

Verified: pnpm run check (0 errors, same pre-existing warnings), pnpm run
lint (clean, 0 new event-casing violations), and the full Playwright suite
(383 tests) passing serially. Every new test also recorded as a real video,
each decoded with ffprobe (valid VP8, real frame counts, clean ffmpeg
decode) and frame-inspected.

- docs: correct prop and CSS-variable tables across 44 component docs ([0b80c88](https://github.com/juspay/svelte-ui-components/commit/0b80c887062e4f7e58589cd5bdfa7ed1ef0286a4))
- fix(SplitInput): resolve overtyped digit independently of caret position ([189e161](https://github.com/juspay/svelte-ui-components/commit/189e1619d7b1256cfaa9816c1e5c96f26017c7c7))

## [2.136.9](https://github.com/juspay/svelte-ui-components/compare/2.136.9..2.136.8) - 1 September 2026

Yama's review of the documentation-accuracy PR surfaced a real,
pre-existing accessibility gap: Accordion's built-in trigger had
role="button" and aria-expanded but no aria-controls. The trigger and
collapsible panel are sibling elements, so aria-expanded announced a
state without identifying WHICH region it governed -- a screen-reader
user could hear "expanded" but had no linked destination to reach.

Added automatic trigger/panel wiring:
- Each Accordion generates a per-instance panel id via $props.id().
- The built-in trigger now has aria-controls={effectivePanelId}.
- The accordion panel itself carries id={effectivePanelId}.
- panelId lets callers supply the id if something external must reference
the panel too; otherwise the generated id avoids collisions between
multiple accordions on a page.

Web-component parity: added panel-id -&gt; panelId to Accordion.wc.svelte
and docs/Accordion.md's HTML-attribute table. The Svelte docs now explain
both the generated default and why this linkage matters for accessibility.

Added a trigger-based docs demo and tests/accordion-aria-controls.test.ts:
1. aria-controls resolves to the panel's actual id -- not merely a
present-but-dangling attribute.
2. aria-expanded tracks the panel's real .expanded state.
3. two instances generate distinct ids.
4. explicit panelId reaches both the panel and trigger reference.

Verified: pnpm run check (0 errors), pnpm run lint (clean), full serial
Playwright suite 354/354 passing. Real video proof combines all 4 tests:
valid VP8, 160 decoded frames (exact parity with all source clips), clean
ffmpeg decode, frame-extracted and visually inspected.

- fix(Accordion): link trigger to its panel with aria-controls ([ae2d588](https://github.com/juspay/svelte-ui-components/commit/ae2d5889ff53f17ace5b54df951993145e5dcd98))
- ci(release): publish to npm before pushing any release metadata ([fb5a124](https://github.com/juspay/svelte-ui-components/commit/fb5a124baa071377eab5a18b1b028ad3e613d903))

## [2.136.8](https://github.com/juspay/svelte-ui-components/compare/2.136.8..2.136.7) - 1 September 2026

docs/Combobox.md documented a bind:inputElement prop and built a usage
example on it. Combobox.svelte never declares that prop -- confirmed via
svelte-check against the exact documented example:

error TS2353: Object literal may only specify known properties, and
'inputElement' does not exist in type 'MandatoryComboboxProperties &
OptionalComboboxProperties & ComboboxEventProperties'.
error: Cannot use 'bind:' with this property. It is declared as
non-bindable inside the component.

A consumer who copy-pasted the documented example would get a compile
error, not a working focus-management hook.

The real, already-implemented mechanism is bind:this on the component
instance plus the exported getInputRef() method -- the same pattern
Input itself documents under a "## Methods" section. Combobox had no
such section at all. Fixed docs/Combobox.md:
- Removed the fictional inputElement prop row from the Props table.
- Added a Methods section documenting getInputRef(), matching Input.md's
established format exactly.
- Rewrote the "Accessing the Input Element" example to the real,
working pattern.

Added a demo section (testId="combobox-input-ref-demo") and
tests/combobox-input-ref.test.ts, which exercises the corrected
example verbatim: click a button wired to
comboboxRef.getInputRef()?.focus(), assert the real &lt;input&gt; receives
focus. Verified with a real Playwright video recording (VP8, 37 real
decoded frames, clean ffmpeg decode pass, frame-extracted and visually
confirmed) showing the click producing a focused input with a visible
focus ring.

- docs(Combobox): fix inputElement docs to describe the real getInputRef() API ([f5eafb8](https://github.com/juspay/svelte-ui-components/commit/f5eafb84d8fb68a110f734d85cb009be42f29a6c))

## [2.136.7](https://github.com/juspay/svelte-ui-components/compare/2.136.7..2.136.6) - 1 September 2026

`release` has been failing `pnpm lint` since ff24661d6, which blocks the
release job at step 6 -- before the version bump, before the tag, and before
`npm publish`. No release can complete until this passes, which is why npm
is still serving 2.136.1 while the repo carries tags up to 2.136.6.

prettier wants the element on one line; it was split across seven:

&lt;Combobox {...rest} bind:value bind:inputValue bind:open bind:highlightedIndex bind:selected /&gt;

Formatting only -- `prettier --write` on the single file, no semantic change.

Verified: `pnpm lint` exits 0 on this tree and 1 on `release` (ce60499,
clean checkout), and `tests/wc-custom-elements.spec.ts` -- the spec that
covers these wrappers -- passes 5/5 on a private PW_PORT.

- feat: add showIndicator prop and enhance indicator styling ([f6a8947](https://github.com/juspay/svelte-ui-components/commit/f6a8947b3bcb5026ad5e73772de0a3fe42170e00))
- fix(wc): restore prettier formatting on the Combobox wrapper ([3463cb5](https://github.com/juspay/svelte-ui-components/commit/3463cb5fc8137534fc89b3f8b836c9cfeeec15c7))

## [2.136.6](https://github.com/juspay/svelte-ui-components/compare/2.136.6..2.136.5) - 1 September 2026

line-height: 1 was the only literal left in Pill's style block — every
other typographic property (--pill-font-size, --pill-font-weight,
--pill-font-family) is already hookable, which makes this an oversight
rather than a deliberate contract.

line-height: var(--pill-line-height, 1);

Backward compatible by construction: the fallback is the current
literal, so every existing consumer renders unchanged.

A consuming app that needs a non-default line-height today has no way
to reach this property short of a compound selector that outranks the
library's scoped rule by load order alone — fragile, since it silently
breaks if bundling order ever changes. A custom property has no such
dependency. This is the ninth such hook this programme has contributed.

- docs/Pill.md: added --pill-line-height to the CSS Variables table.
- src/routes/components/pill/+page.svelte: demo pair (default vs.
--pill-line-height: 1.4) with testIds for the new test.
- tests/pill-line-height.spec.ts: asserts the default (line-height: 1 at
13px font-size, used value 13px) is unchanged when unset, and that an
explicit override applies (1.4 * 13px = 18.2px).

- feat(MarkdownText,ChatMessage): add sanitized markdown rendering ([be6fd57](https://github.com/juspay/svelte-ui-components/commit/be6fd57f60170c6d27ffe814288bbdd294a13cb4))
- feat(wc): expose ChipInput, ColorPicker, Combobox and SplitInput as custom elements ([ff24661](https://github.com/juspay/svelte-ui-components/commit/ff24661d61290dde69f7d34399ced12e7c4d63ba))
- fix(Input): give helper text its own color, bring error text to AA contrast ([ad30c04](https://github.com/juspay/svelte-ui-components/commit/ad30c04183b75656b4861a66d081ce44fc1263f6))
- feat(Pill): add --pill-line-height CSS hook ([1e00cd9](https://github.com/juspay/svelte-ui-components/commit/1e00cd9335cead785c929abf4ae9ccdb8e2c5461))
- ci(release): migrate npm publish to OIDC trusted publishing ([b982270](https://github.com/juspay/svelte-ui-components/commit/b9822705ef3f2d92bb19c49969875be8bea1fd9c))

## [2.136.5](https://github.com/juspay/svelte-ui-components/compare/2.136.5..2.136.4) - 1 September 2026

The GitHub Pages build has been red on release since 4c099e611 (#483). That
PR replaced 17 picsum.photos references with local assets under
static/demo-media, but wrote eight of the pages with root-relative paths.
Pages builds with BASE_PATH=/svelte-ui-components, and SvelteKit's prerender
crawler rejects any link that does not begin with paths.base:

Error: 404 /demo-media/placeholder-square.svg does not begin with `base`
(linked from /svelte-ui-components/components/badge)

The five pages that already imported `base` were fine; these eight were not.
Same convention as gallery and media-player: import base, interpolate it.

Verified by running the workflow's own command, not by inspection:
BASE_PATH=/svelte-ui-components pnpm build exits 1 on release and 0 here,
and the emitted build/components/badge.html now carries
src="../demo-media/placeholder-square.svg", which resolves under the base.

- fix(Carousel): restore the properties-bag contract and announce slide changes ([996511f](https://github.com/juspay/svelte-ui-components/commit/996511f9a435472d3a0dc088c2e800393f9c02fe))
- fix(demo): prefix demo-media asset paths with base so Pages prerenders ([031da8a](https://github.com/juspay/svelte-ui-components/commit/031da8a4c5236c116976909e03a0163f4968ce2a))

## [2.136.4](https://github.com/juspay/svelte-ui-components/compare/2.136.4..2.136.3) - 1 September 2026

Follow-up to a component-redundancy audit across the library. Most findings
were false alarms or already well-documented, but four small, independent
items were worth closing:

- fix(Carousel): Carousel.svelte rendered each slide as
&lt;view.component properties={view.properties} /&gt; -- passing the whole
properties object under a single `properties` prop key instead of
spreading it. Every real component in this library takes individual
named props (title, description, ...), not a single properties bag, so
no normal component could actually receive its properties this way;
Carousel was only usable with a purpose-built wrapper. Found while
building a demo page (Carousel had none, despite existing since before
this component set was audited): Card's title/description silently
rendered empty until this fix. Now spreads correctly.
- Carousel demo page + _nav.ts entry (both previously missing -- the
component existed and was documented in docs/Carousel.md, but was
undiscoverable on the actual docs site).
- docs: cross-reference notes on Select/Combobox and Carousel/Book -- two
pairs that solve similar-looking problems with a real but previously
undocumented distinction (browse-a-list vs type-to-search; auto-play vs
manual pagination). Every other near-pair in the library already does
this (ChipInput/SplitInput, DateRangePicker/Calendar, Resizable/Draggable)
-- these two were the gaps.
- chore(SoundKit): renamed src/lib/soundKit/soundKit.ts -&gt;
src/lib/SoundKit/SoundKit.ts to match every other module's Name/Name.ext
convention. Pure rename + import-path updates -- no public export name
changed (createSoundKit, SoundKit type are unaffected).

No test coverage existed for Carousel at all. Added tests/carousel.test.ts:
one asserting a slide's spread properties actually render (the exact
regression this PR fixes), one asserting dot navigation renders the
newly-active slide's own spread properties. Added testId/dotTestId/
dotsWrapperTestId to the demo page's two instances so the tests have
stable hooks.

Rebased onto latest release (was several releases behind -- this branch
predated ci.yml existing on release at all, which is why CI never ran a
single check on it; confirmed no runs of any kind for this branch prior to
rebasing). Resolved one real conflict in _nav.ts (both this branch and
release's intervening history added entries to the same category).

Verified: pnpm run check (0 errors, same pre-existing warnings only),
pnpm run lint (clean, 0 new event-casing violations), and both Carousel
tests pass -- confirmed via real Playwright video recordings, each decoded
with ffprobe (valid VP8, real non-zero frame counts) and visually
inspected frame by frame, including fixing a video-capture-only issue (the
dot-click test's recording ended before the slide's 0.5s CSS transition
visually settled; added a deliberate wait so the video actually shows the
navigated state, not just the passing assertion).

Yama's follow-up review raised 2 more real findings, both verified against
source before fixing:

- tests/carousel.test.ts: the dot-click test asserted the destination
slide's text via toBeVisible(), which does not account for ancestor
overflow:hidden clipping. Every slide stays mounted inside .slidesDiv
the whole time (.carousel just clips + transforms which one shows) --
confirmed empirically that 'New Arrivals' reports visible=true even
before ever clicking the dot, so the assertion could pass regardless of
whether navigation actually worked. Rewrote to assert the dot's
active-dot class instead (confirmed via the same diagnostic: it
reliably tracks activeSlideIndex, moving from dot 1 to dot 2 exactly on
click), then the content check on top of that as a secondary signal.
- docs/Carousel.md: opened by calling Carousel an "auto-playing
slideshow" that "auto-plays", but autoplay defaults to false --
misleading for anyone rendering &lt;Carousel /&gt; without enabling it.
Reworded to describe autoplay as opt-in.

Yama's second follow-up review raised one real MAJOR finding plus two MINOR
ones, all pre-existing (not introduced by this PR, but in a file it already
touches), all verified against source before fixing:

- MAJOR: dots are role="button" + tabindex="0" -- assistive tech and
keyboard users are told these are activatable buttons -- but only
onclick was wired to moveSlideToIndex; the only onkeydown was a bare
passthrough of the consumer's own prop. Enter/Space did nothing by
default, breaking the role's own promise. Now the dot's onkeydown
handles Enter/Space internally (calling moveSlideToIndex), then still
invokes the consumer's onkeydown afterward -- existing consumers who
relied on that prop firing are unaffected.
- MINOR: docs/Carousel.md claimed dots use role="none"; the actual
markup is role="button" and has been since before this PR. Corrected,
and rewrote the accessibility section now that Enter/Space genuinely
works instead of requiring a consumer workaround.
- MINOR: the four touch/mouse listeners added to carouselDiv in onMount
were never removed; onDestroy only cleared the autoplay interval.
Added the matching removeEventListener calls.

Also addressed a SUGGESTION carried over from the previous round:
tests/carousel.test.ts's navigation tests now wait on
slidesDiv.getAnimations()[...].finished (confirmed empirically that the
CSS transition is tracked) instead of a fixed waitForTimeout. Added a
third test: pressing Enter on a focused dot navigates to that slide, the
direct regression guard for the accessibility fix.

On the review's separate semver claim (spreading view.properties instead
of nesting it under a single prop is a "breaking runtime contract" needing
a major bump): this is a fix: for behavior that made Carousel unusable
with any real component in this library's own set (none accept a single
properties-bag prop), had no demo page until this PR, and has no internal
precedent of anything consuming the old shape on purpose. Fixed as a
semver-appropriate patch, not treated as a breaking change to something
that was never usable as intended.

Yama's third review pass raised 2 more real, concrete findings, verified
against source before fixing:

- MAJOR: keyboard focus on a dot had no visible indicator at all -- a
natural gap from the previous round's fix (dots became keyboard-
activatable, but nothing showed which one was focused before
activating). Added :focus-visible styling, CSS-variable-driven to match
the rest of this component's theming (--dot-focus-outline,
--dot-focus-outline-offset). Verified empirically that .focus() actually
applies it (outlineStyle: solid), then added the assertion to the
existing keyboard test rather than a new one.
- MINOR: docs/Carousel.md's Props table never listed testId,
dotsWrapperTestId, or dotTestId, despite them being real, pre-existing
props (this PR is just the first thing to actually use them, in the
demo and tests). Added rows for all three, plus the two new focus CSS
variables, plus a line in the Accessibility section.

That same review pass repeated the semver objection from the previous
round (spreading view.properties treated as a breaking change needing a
major bump) without engaging the reasoning already given twice, and added
a test-architecture suggestion (mount Carousel in isolation instead of via
the demo page) that doesn't match this repo's actual, consistent testing
convention -- every Playwright test in this codebase navigates a demo
page and selects by data-pw; there is no component-isolation testing
precedent anywhere in the project to be consistent with. Not implementing
either; both addressed with reasoning in the PR reply rather than
re-litigated indefinitely with an automated reviewer.

Verified: pnpm run check (0 errors), pnpm run lint (clean), all 3
Carousel tests pass.

- fix(Carousel): spread slide properties, plus doc cross-references and a naming fix ([2fd59e1](https://github.com/juspay/svelte-ui-components/commit/2fd59e16bc8baa0f43ab1b03a9c7d3098cf3c314))

## [2.136.3](https://github.com/juspay/svelte-ui-components/compare/2.136.3..2.136.2) - 1 September 2026

BrandLoader's full-screen loader sizes itself from --loader-width and
--loader-height, defaulting to 100vw/100vh. The unrelated Loader
component -- a small inline spinner -- independently reads the exact
same two variable names, but defaults them to 20px. Nothing about
either component's naming suggests the collision: a consumer who sets
--loader-width in a scope that contains both a BrandLoader and a
Loader silently resizes both, and there was previously no way to
target just one of them.

The fix adds --brand-loader-width and --brand-loader-height as the
namespaced, collision-free override point, falling back to the legacy
shared name and finally to the original literal default:
var(--brand-loader-width, var(--loader-width, 100vw)). Existing
consumers who already override --loader-width keep working completely
unchanged; new or updated consumers get a name that can't collide with
Loader. Only these two variables are touched -- BrandLoader's other
~30 --loader-* variables (background color, text sizing, the bouncing
dots, backdrop blur, etc.) are unique to this component and were left
alone, since renaming them would be a much larger, unnecessarily
breaking migration with no collision to justify it. Loader.svelte
itself needs no change and was not touched; docs/Loader.md is also
left as-is since its own --loader-width/--loader-height documentation
is still accurate for that component.

The demo route gains three constrained instances alongside the
existing full-screen one, proving the legacy name still works, the
namespaced name works, and the namespaced name wins when both are set
on the same instance. Three new Playwright specs assert the rendered
pixel dimensions for each case.

- fix(BrandLoader): namespace its CSS vars ([4ed5432](https://github.com/juspay/svelte-ui-components/commit/4ed5432ad78b1b002eaef585b7424ea63c505120))
- docs(BarChart): document and test the already-shipped valueLabel override ([6a750a7](https://github.com/juspay/svelte-ui-components/commit/6a750a7499b7fa17e377dea01996b9ba2908762a))

## [2.136.2](https://github.com/juspay/svelte-ui-components/compare/2.136.2..2.136.1) - 1 September 2026

Checkbox&lt;-&gt;Toggle, ListItem&lt;-&gt;CheckListItem, StatCard&lt;-&gt;KeyValue,
Gauge&lt;-&gt;Progress, Loader&lt;-&gt;LoadingDots. Each pair has a real, verifiable
distinction that wasn't written down anywhere: Checkbox's indeterminate
state has no Toggle equivalent; ListItem has no selection concept vs.
CheckListItem's checkbox semantics; StatCard is metric+delta dashboard
framing vs. KeyValue's plain field grid; Progress has an indeterminate
mode Gauge lacks; LoadingDots is built to sit inline in text/buttons vs.
Loader's standalone ring shape. Same treatment as the Select/Combobox and
Carousel/Book pairs in #477.

- docs: cross-reference the five remaining low-severity audit pairs ([79aec19](https://github.com/juspay/svelte-ui-components/commit/79aec19e9eec89c9f00af6e9ac0611ec0be4cbb5))

## [2.136.1](https://github.com/juspay/svelte-ui-components/compare/2.136.1..2.136.0) - 1 September 2026

Every demo route that showed an image pulled it from picsum.photos, so the
page's load event waited on a third-party host over the public internet. That
is not cosmetic: Playwright navigates with waitUntil: 'load', and five specs
across /components/status and /components/chat failed a full suite run at the
30s timeout with picsum as the only request still outstanding when load never
fired. The same tests take ~1.3s when picsum answers quickly and ~20s when it
is slow, so the suite's pass rate tracked a stranger's CDN.

Replaces all 17 references across eight demo routes with local assets under
static/demo-media -- two new SVG placeholders plus the avatar and photo
already vendored there. The eight specs that navigate to the two affected
routes pass 45/45 with three repeats each.

Note this does NOT make the demo pages fully offline: +layout.svelte still
loads Nunito Sans from fonts.googleapis.com, which also blocks load. That is
left alone here because vendoring a variable font is a separate change, but
it is the same failure mode and the same fix applies if it starts costing
runs. Instrumenting the observed failures showed picsum, not fonts, as the
blocking request, so this addresses what actually broke.

- fix(demo): serve demo-page media locally instead of from picsum.photos ([4c099e6](https://github.com/juspay/svelte-ui-components/commit/4c099e611b531421989c76c3d5d75d9a50033867))

## [2.136.0](https://github.com/juspay/svelte-ui-components/compare/2.136.0..2.135.0) - 1 September 2026

An audit of 124 sites where Lighthouse hand-rolls markup this library already
provides found the adoption blocked, over and over, by small missing hooks
rather than by missing components. This adds them, plus the fixes that adopting
them surfaced.

New APIs
--------
ChipInput      editable in-place edit, onedit, per-chip test ids
Stepper/Step   muted status, per-step testId, suppressRoleAndTabindex,
suppressContainerTestId, border/label/wrap hooks, growable
separator, Step usable on its own outside a Stepper
StatCard       per-row subtitle, value variants, row sub-element ordering,
opt-in line break for additionalContent, per-row typography
Table          single-page footer suppression, count-only footer, an
independent pagination range test id, tag-array cell testId
TypewriterText variable pacing, resolveDelay, progress callback, per-character
render hook
Status         semantic heading tag and themed colour tokens
Chat           scroll policy, pin hold, jump controls and scroll-state
forwarding to its message list

Fixes found while adopting them
-------------------------------
Modal, Sheet and CommandMenu now share a reference-counted body scroll lock, so
closing a nested surface no longer releases a lock another open surface still
needs. Modal keeps honouring its public lockScroll prop: lock and unlock are
guarded symmetrically, so &lt;Modal lockScroll={false}&gt; does not lock and the count
stays balanced.

The muted Stepper status shipped illegible -- white numerals on a pale circle at
1.53:1 and a label at 2.10:1. Now 5.01:1 and 7.79:1, asserted as a contrast
RATIO so a future palette change cannot quietly undo it.

ChipInput tracked the chip being edited by slot index. An index is only a
position: if the parent reorders or removes entries mid-edit, the same index
points at a different chip and Enter lands on the wrong one. It now holds the
chip by value -- unique by construction, and already what the {#each} keys on --
and resolves the index at commit time. Disabling mid-edit is safe without an
$effect: the field stops rendering and commitEdit refuses, so nothing in flight
can write behind a disabled control.

ChatMessageList: pin-sender-turn lost the pin whenever the reply was shorter
than the frame, which is when pinning matters most. Three faults, only visible
by instrumenting. scroll-behavior: smooth makes `scrollTop = x` an ANIMATION --
the pin asked for 333px against a 357px maximum and read back 0. releasePin()
then shrank the range to 80 mid-animation and the browser clamped the
half-finished scroll to exactly that. And probing "is it safe to release?" by
clearing min-height to measure ALSO shrinks the range, so the probe destroyed
the position it was checking. The pin now scrolls instantly, keeps its
reservation until the reply can hold the offset alone, and restores the offset
around the probe. Measured: 253-265px below the top before, 12px after -- the
row's own margin, matching the pinHold demo.

Deliberately not renamed
------------------------
The event-casing check that arrived with release flags onedit, onProgress and
onscrollstate. All three ship in 2.132.0, so renaming them is a breaking change
for every consumer already on that release; they read as new only because the
baseline predates their release. They are baselined with that reasoning rather
than silenced, and Chat's onscrollstate is doubly so -- it is typed as
ChatMessageListProperties['onscrollstate'] and forwarded by shorthand, so
renaming one side desynchronises the forward. Fixing the names is a deprecation
with a release note, not a drive-by inside a migration PR.

Verification
------------
Authoritative suite 318 passed, 1 failed, on a private port with
reuseExistingServer:false and workers:1 on a fresh build of the committed tree.
The one failure, chat-scroll-policy-passthrough, is pre-existing flake: isolated
with three repeats it fails 1-of-3 both with the pin fix and with it reverted.

pnpm lint exits 0; event casing reports 100 known, 0 new. The two svelte-check
errors (node:path / node:url in tests/media-upload.test.ts) are present
identically on release and untouched here.

Proof of testing: six videos, one per API, recorded against this branch's own
build of the real demo routes, on branch proof/bz-5721-component-reuse. Each
clip asserts while it records, so a broken demo fails the recording instead of
producing a video of an empty state.

- feat(components): the APIs Lighthouse's component-reuse audit found missing ([1786266](https://github.com/juspay/svelte-ui-components/commit/17862661ef8e36150210f4173dfbd98b9bef3e76))

## [2.135.0](https://github.com/juspay/svelte-ui-components/compare/2.135.0..2.134.1) - 1 September 2026

ChatToolStatus and ThinkingIndicator were near-duplicates: same job (a
live tool-status line), different visual treatment (solid bordered pill
vs a borderless shimmering row) and no shared code. Rather than pick one
arbitrarily, ThinkingIndicator gains a `chip` variant that reproduces
ChatToolStatus's exact pill look under its own --thinking-indicator-chip-*
tokens, with a static (non-shimmering) label by default so it's a safe
drop-in — pass `busy` to opt into shimmer.

Chat.svelte now renders &lt;ThinkingIndicator variant="chip"&gt; for its
built-in toolStatus row instead of &lt;ChatToolStatus&gt;. ChatToolStatus
itself is untouched and still exported — deprecating a public export
outright is its own breaking-change decision on a published package, so
its docs page now just points at the replacement.

Yama's review on this branch raised 3 MAJOR + 7 MINOR findings, each
verified against source before acting:

- MAJOR, real: the chip variant's root had no aria-live region. The
deprecated ChatToolStatus it replaces inside Chat had aria-live="polite",
so screen-reader users lost the "Searching the catalog..." announcement
entirely. Restored aria-live="polite" aria-atomic="true" on the chip root.
- MAJOR, false positive: the claimed loss of an icon snippet prop confuses
two different same-named declarations. ChatToolStatusProperties.icon
belongs to the deprecated standalone &lt;ChatToolStatus&gt; component; Chat's
own toolStatus prop is typed via the unrelated ChatToolStatus type in
Chat/types.ts ({ tool?, label, state? }), which has never had an icon
field — confirmed unchanged by this PR via git diff against release.
Nothing regressed; no code change made.
- MINOR: showElapsed silently no-ops on chip (no elapsedWatcher mounted)
but was only documented as a bare exception. Documented chip alongside
bare in both the JSDoc and docs/ThinkingIndicator.md, matching actual
behavior rather than adding a new UI element under review pressure.
- MINOR: .chip-label's shimmer wasn't covered by the reduced-motion query,
unlike .status-label. Added the same animation-none + static-color
treatment.
- MINOR: no test coverage existed for the chip variant at all. Added
tests/thinking-indicator-chip-variant.test.ts (static default, busy
shimmer, aria-live on both) against two newly-testId'd demo rows.
- MINOR: docs/Chat.md's CSS variable section contradicted its own table —
claimed all --chat-tool-status-* vars only apply to the deprecated
component directly, while the table lists --chat-tool-status-justify as
Chat's own tool-status row alignment. Chat.svelte's .tool-status rule
does read that var directly (verified) — documented it as the one
Chat-level exception.
- MINOR: docs/ToolCallLog.md overclaimed ThinkingIndicator as always
single-line and as itself "disappearing" when settled. Reworded to
describe specifically Chat's chip usage, which Chat clears — not a
general ThinkingIndicator behavior.

This PR's own testing claims were initially unbacked by anything checkable
on the PR itself. Pulling the actual CI job log (not trusting the local
run) surfaced two pre-existing, repo-wide CI gaps, both fixed here since
they're the only way to back the above with something real:

- ci.yml never had a `playwright install` step, so every Playwright spec
in the suite -- not just this PR's -- failed on every run with
"browserType.launch: Executable doesn't exist". The old ~130-failing
baseline comment was never a real regression count under that
condition. Added the install step.
- playwright.config.ts had no `reporter` configured, so CI's "Upload
Playwright report" step had nothing to upload -- confirmed 0 artifacts
on every past run of this PR, and playwright-report/ absent after a
full local run too. Added the html reporter alongside list, so local
console output is unchanged.

Verified: pixel-for-pixel against ChatToolStatus in the live demo site in
both light and dark theme; a full Chat send cycle with no console errors;
pnpm run check (0 errors, same 3 pre-existing warnings); pnpm run lint
(clean); pnpm run build succeeds end to end; the new chip-variant
Playwright suite (3/3) alongside the pre-existing unit suite (128/128);
and, with both CI gaps fixed, a real playwright-report/index.html now
generated locally on a full run -- the actual artifact this PR's CI run
will attach.

Rebased onto latest release (was several releases behind, including this
repo's own PR #473 which is where ci.yml first landed on release) to
resolve real merge conflicts -- worth noting since the DIRTY mergeable
state turned out to be why CI/Yama had stopped triggering on this branch
at all after ci.yml was first added here: GitHub couldn't compute a merge
preview to resolve which workflow files should run. Confirmed once
rebased: both fired immediately for the first time since that point.

Added video: 'on' so CI's report artifact carries an actual playable
recording of every test, not just a pass/fail line -- verified locally:
real, valid WebM files (confirmed via `file`), and the html reporter
copies them into playwright-report/data/ automatically, so the existing
artifact upload is self-contained.

Yama's own follow-up review then flagged a real, verified breaking-change
regression: Chat's built-in tool-status row reads a completely different
CSS variable set than the deprecated ChatToolStatus it replaced
(--thinking-indicator-chip-* vs --chat-tool-status-*, confirmed no overlap),
so a consumer's existing theming overrides would silently stop applying.
Fixed by mapping every --thinking-indicator-chip-* variable the chip uses
onto its --chat-tool-status-* equivalent, scoped to Chat's own .tool-status
wrapper only -- old overrides keep working exactly as before, defaults
match ChatToolStatus byte for byte. Added a dedicated demo instance +
Playwright test proving it (overrides the OLD variable names, asserts the
computed style picked them up).

Every test's video recording was independently verified, not just asserted
green: decoded with ffprobe (valid VP8, real non-zero frame counts), and
visually inspected via extracted frames -- including confirming the
backward-compat fix's pill actually renders with the overridden blue
background and gold border, not its own defaults.

- feat(ThinkingIndicator): add chip variant, retire ChatToolStatus internally ([0c9a9b3](https://github.com/juspay/svelte-ui-components/commit/0c9a9b39ff0d5f3ba3cbf8b657eb0adab38a318e))

## [2.134.1](https://github.com/juspay/svelte-ui-components/compare/2.134.1..2.134.0) - 1 September 2026

Two findings from a cross-surface UI audit, both of which make a control
correct on screen and absent from the accessibility tree.

Input rendered its validation message as a plain &lt;div class="error-message"&gt;
with no id, no role, and nothing tying it to the field it described. Every
audited form surface scored zero error nodes carrying role="alert" or sitting
in an aria-live region, so a screen-reader user submitted, heard nothing, and
was left on a form that had not moved. The field now carries aria-invalid while
it is in error and points at the message through aria-describedby, and the
message is a role="alert" live region so it is spoken as it appears. Both
attributes stay absent while the field is valid -- otherwise a healthy form
announces every field as broken.

ChipInput draws no label of its own and exposed no way to supply one:
ChipInputProperties had placeholder, disabled, testId and classes, so a caption
rendered beside it could not reach the control and the draft field arrived
unnamed however the page read visually. It now accepts ariaLabel and forwards
it to the Input it wraps.

Both are verified by reverting the source and confirming the new specs fail on
the right assertions, then restoring to a byte-identical tree.

- fix(a11y): announce Input validation errors and let ChipInput be named ([c492919](https://github.com/juspay/svelte-ui-components/commit/c4929198984e9bc4adecee699a4545aebec76683))

## [2.134.0](https://github.com/juspay/svelte-ui-components/compare/2.134.0..2.133.1) - 31 August 2026

Comparison against polymorph-ui-components (a fork of this codebase) surfaced
a gap list of components/props/infrastructure it had that SUI didn't. This
closes Phase 1 of that list.

New components (the 4 polymorph had that SUI didn't; built to SUI's own
conventions -- properties.ts split, classes/testId, CSS-variable theming,
composing existing components like Button/Img/Icon/Shimmer per
GUIDELINES.md #4/#6 -- not ported byte-for-byte):
- Draggable: pointer/keyboard-draggable wrapper (axis constraint,
handle-scoped drag start, viewport bounds clamping, arrow-key movement)
- MediaPlayer: image/video player with hover-revealed play/pause and
mute/unmute controls, bindable playing/muted, snippet-overridable icons,
native-controls fallback
- MediaUpload: drag-and-drop file picker with per-file validation (type,
size, count), lazy thumbnails via FileReader, bindable files
- Gallery: grid/list gallery with a full keyboard-accessible lightbox
(focus trap, focus restoration, arrow/Home/End/Escape navigation),
optional per-item edit/delete actions

Modal gained its last 2 Phase 0 gap-list props: lockScroll (default true,
preserves prior unconditional scroll-lock behavior) and autoDismissAfter
(fires onclose after N ms, timer cleared on unmount).

Event names deliberately diverge from polymorph in a few places per
DESIGN_PRINCIPLES.md's casing rule (native DOM events stay lowercase,
synthesized events are camelCase) -- e.g. Draggable's onMoveStart/onMove/
onMoveEnd (not onDragStart/onDrag/onDragEnd, which would collide with the
native HTML5 drag-and-drop API), Gallery's onDismiss (not onClose, which
would collide with native &lt;dialog&gt;'s close event despite no &lt;dialog&gt;
being involved).

Infrastructure:
- DESIGN_PRINCIPLES.md written down (5 principles checked against actual
codebase behavior) plus scripts/check-event-casing.js enforcing the
casing rule, wired into `npm run lint`, with a 97-violation baseline
grandfathering pre-existing prop names (renaming any is a breaking
change, not a lint fix)
- .github/workflows/ci.yml: lint/svelte-check/vitest now actually run on
pull_request (previously only Yama's AI review and the Pages build ran);
Playwright stays continue-on-error pending a real flakiness-vs-regression
triage of its current baseline; workflow-level `contents: read`
permissions added per a CodeQL finding
- The wc custom-element build (dist-wc) is now actually shipped through
npm (added to `files`, new "./wc" export with a generated
dist-wc/index.d.ts for TypeScript consumers) and documented in
README.md -- it worked and was GitHub-Pages-deployed already, but
wasn't reachable via `import '@juspay/svelte-ui-components/wc'`

Docs: ROADMAP.md regenerated against docs/_index.json (was last updated
before 27 components shipped in BZ-49010 alone; 44/54 tracked items are
now available, was 14/54) plus fixes to its component count and a
TaskList indexing note; README's web-components runtime claim reworded
for clarity (bundled into the build, not "no runtime" as it read before).

Review-fix rounds (CodeRabbit/Yama/CodeQL findings on this PR, each
verified against source before fixing, not taken at face value):
- ROADMAP's "shipped since" count corrected (37 -&gt; 36; the higher count
was matching backticked non-component tokens in the intro prose)
- FileDropzoneTrigger and KeyValue were missing their .wc.svelte wrapper
despite README claiming full custom-element coverage -- added both
- MediaPlayer: overlay controls got a :focus-within fallback (were
hover-only, so visibility:hidden removed them from the tab order for
keyboard users); role="button"/tabindex/handlers scoped to !controls so
they stop fighting native browser controls' own keyboard operability;
the playing bindable is now genuinely bidirectional (a host setting it
externally calls play()/pause(), not just video state writing back to
it); the captions &lt;track&gt; now only renders when real captionsSrc data
is supplied instead of always rendering an empty, non-functional one

Verified throughout: pnpm run check (0 errors), pnpm run lint (clean,
including the event-casing checker), and each new/changed component's
own Playwright suite passing (Draggable 4/4, MediaPlayer 11/11 after the
review-fix round, MediaUpload 5/5, Gallery 6/6, Modal's 2 new-prop cases
plus both pre-existing Modal test files unmodified); `pnpm run build`
succeeds end to end and produces a working dist-wc with types.

## [2.133.1](https://github.com/juspay/svelte-ui-components/compare/2.133.1..2.133.0) - 31 August 2026

Three components could not be given an accessible name by any caller. Found
while auditing a consuming app, where they accounted for ~84 unnamed-control and
unlabelled-field findings that no app-side change could close.

Input — &lt;label for={name}&gt;, but the field never had an id

The label was emitted as `&lt;label class="label" for={name}&gt;` while the rendered
&lt;input&gt;/&lt;textarea&gt; carried only `name={name}` and no id anywhere. `for` resolves
against an id, never a name, so the association could not complete for ANY
caller, however they called it. Every labelled field reported as unlabelled to
assistive tech and was unreachable via getByLabel.

Now an `effectiveId` is derived from `name` and applied to the label's `for` and
to both rendered field variants. Existing callers that already pass `label` +
`name` become correctly labelled with no change on their part. A new optional
`id` prop wins over the derived value, for callers whose `name` repeats across
rows or who pass no name at all. Backwards compatible. The fallback is `null`
rather than `undefined` to satisfy the repo's no-restricted-syntax rule; Svelte
treats the two identically for id/for attribute binding.

Checkbox — no way to pass a name

There was no `ariaLabel` prop and no rest-prop spread, so an icon-only or
externally-labelled checkbox simply could not be named. Adds `ariaLabel`, applied
to the `role="checkbox"` element — the tabbable control that already receives
`aria-controls`, so it follows the existing precedent rather than inventing a
placement. Not a rest spread: with three rendered elements (label, native input,
box) an arbitrary attribute has no unambiguous home.

Menu — ariaLabel named the dropdown, not the trigger

`ariaLabel` lands on the dropdown, which is `use:portalToBody` and therefore
mounted at &lt;body&gt;. The element the user tabs to is the trigger wrapper, which
carries role="button" and tabindex="0" and had no aria-label at all. Callers
passing ariaLabel got a silent no-op on the control and a name on a portaled
container.

Adds `triggerAriaLabel` on the focusable trigger. The existing `ariaLabel` and
its placement are untouched, so nothing that relies on the dropdown's name
changes. It applies only to the non-interactive branch; with
`interactiveTrigger` the snippet's own control owns its name.

Custom-element wrappers

Checkbox.wc.svelte, Input.wc.svelte and Menu.wc.svelte whitelist their
custom-element props explicitly, so all three new props would have been invisible
to &lt;sui-checkbox&gt;/&lt;sui-input&gt;/&lt;sui-menu&gt; consumers. Each wrapper now forwards its
prop, and the three property.ts files and docs/{Checkbox,Input,Menu}.md document
them. `pnpm run check:wc` still reports exactly the 3 pre-existing LottiePlayer
errors and nothing new.

Review also flagged three parity gaps that pre-date this change: Input.ariaLabel,
Menu.ariaLabel and Checkbox.ariaControls exist on the Svelte components but were
never exposed on the custom elements (origin/release exposes none of the three).
Added alongside the new props, since the convention is that every camelCase prop
gets an explicit kebab-case attribute and leaving three behind would keep the
wrappers out of lock-step for the next reader.

Verification

tests/input-label-association.test.ts asserts the field carries an id, that a
label points at that exact id, that the accessible-name path resolves, and that
clicking the label moves focus. Negative-controlled: reverting ONLY the id
emission -- keeping the prop and the derived value, so the control isolates the
exact mechanism rather than the whole change -- fails with "the field must carry
an id for a label to reference", Received: null. The file was then restored and
confirmed byte-identical.

Review round

- effectiveId no longer falls back to the raw `name`. Inputs that legitimately
share a name (radio groups, repeated rows) collided on a single id, which
pointed every later label at the first field. It now appends a per-instance
suffix from Svelte's own $props.id(), so callers need do nothing and an
explicit `id` still wins.
- A visible label now always wins the accessible name. Emitting aria-label
alongside a rendered &lt;label&gt; replaced the visible text for assistive tech,
which is a WCAG 2.5.3 (Label in Name) hazard rather than a documentation gap.
Input gates aria-label on a single `hasVisibleLabel` derived that the &lt;label&gt;
block itself renders from, so the two cannot drift; Checkbox applies ariaLabel
only when `text` is empty. Both keep working for the icon-only and
externally-labelled cases the props were added for.

Verification

svelte-check 654 files, 0 errors. prettier + eslint clean. check:wc reports 3
LottiePlayer errors and exits 1 — pristine origin/release reports the identical
3 and the identical exit, so this adds none.

Full suite run twice in ONE worktree, same invocation, swapping only the file
contents: origin/release content 15 failed / 198 passed, this branch 15 failed /
198 passed. The nine table failures are identical in both arms and pre-exist on
release. The status-* difference (4 vs 6) sits inside the run-to-run variance
measured on unchanged code — /components/status takes ~21s to load against a 30s
goto timeout because of a 404 on order-success-icon.svg that occurs 49 times on
release and 48 here, so which of those tests trips the limit is a coin flip.

The remaining difference is the point: with the fix reverted but the new spec
still present, tests/input-label-association.test.ts fails both of its cases; with
the fix, both pass. That is the negative control, and it is the only test whose
result actually tracks the change.

An earlier draft of this message credited the change with fixing
"row checkboxes expose DataGrid-parity aria-labels". That was wrong and is
withdrawn: Table.svelte does not use the library Checkbox at all — it renders its
own &lt;span role="checkbox"&gt; and imports only checkmark.svg.

- fix(a11y): let callers actually name Input, Checkbox and Menu triggers ([55cb6d9](https://github.com/juspay/svelte-ui-components/commit/55cb6d95ae7acb9095f7de2daf89032446a1a633))

## [2.133.0](https://github.com/juspay/svelte-ui-components/compare/2.133.0..2.132.0) - 31 August 2026

Toolbar is authored as a fixed chrome bar — position:fixed, 100vw, a drop shadow,
a back arrow. Lighthouse separately hand-rolled an in-flow page title block used
by 76 call sites. Structurally they are the same component: left/centre/right
regions over an optional second row.

This adds no props. The first revision of this change added subheading,
headingLevel, subheadingLevel, headingClasses and subheadingClasses, and that was
wrong on three counts:

- Toolbar's own docs already reject it. "String props that carry presentational
structure are rejected in favour of Snippets" — a title with a subline is
centerContent, and has been all along.
- A class name is inert in the web-component build. sui-toolbar is shadow:'open',
so a class passed as heading-classes lands inside the shadow root where the
consumer's stylesheet cannot reach it, with nothing reporting the failure.
- It swapped the default back icon for an inline glyph, changing the rendering
of every existing consumer that never asked for it. Reverted; backIcon still
defaults to the same URL and still renders the same &lt;img&gt;.

What is left is CSS variables only, on the three region elements:

--toolbar-content-align-items / -min-height / -flex-wrap / -row-gap / -column-gap
--toolbar-center-flex / -min-width
--toolbar-right-display / -flex-shrink / -min-width / -max-width / -width

Every default is the value the component already rendered, so an existing consumer
is untouched — the markup, the props and the TypeScript are byte-identical to
release. The action region's INNER layout is deliberately not tokenised: that is
the consumer's own snippet markup, which it can style directly.

Also makes the Playwright port configurable (PW_PORT, default 43199). The fixed
port plus reuseExistingServer made this checkout's suite bind to a sibling
worktree's preview server and assert against the wrong build — it reported
failures naming properties that are correct here, then 45+ ERR_CONNECTION_REFUSED.

Tests: 5 new Toolbar cases covering an unconfigured toolbar (DOM, default back
image, 18px title, and every new declaration resolving to its previous value),
the tokens producing the page-header shape, and the consumer's own markup keeping
its tags and type scale. Full suite: 201 passed; the 15 failures are pre-existing
Status/Table cases failing on a missing static asset that is not in the repo.

- feat(toolbar): expose row-layout variables so it can serve an in-flow page header ([6bb210c](https://github.com/juspay/svelte-ui-components/commit/6bb210cfc8932873b4debe0de4ea55eca4f607b2))

## [2.132.0](https://github.com/juspay/svelte-ui-components/compare/2.132.0..2.131.0) - 30 August 2026

Status could not be adopted by an inline consumer. Three separate reasons, all
found while migrating Lighthouse's own local Status -- four onboarding and
webhook screens -- onto this one. Each fix is additive and defaults to the
previous behaviour.

1. descriptionSnippet

`statusDescription` is interpolated with `{@html}`. That is right for a caller
passing its own trusted markup, and wrong for a message that arrives from an
API, a user, or anywhere the caller does not control -- and there was no other
option, so such a caller either accepted the sink or did not use the component.
One of the four call sites assigns `stepMessage = action.message` straight from
an API response. The snippet renders through ordinary Svelte interpolation,
which escapes.

2. children

`.status-description` carries the component's own horizontal padding and bottom
margin, so anything rendered through descriptionSnippet inherits a text box's
geometry. That is right for the message and wrong for a control. There was
nowhere else to put one: `buttonProperties` takes props, not content. `children`
renders below the description, outside that box, where the button already does.

3. --status-panel-background and --status-panel-backdrop-filter

Status is styled as a standalone result screen: 100vh tall, with a translucent
white frosted panel. `min-height` was already variable-backed; the panel was
not, sitting behind an @supports block on an inner element that `classes` cannot
reach. Rendered inside a page with its own heading and following content, the
height pushes siblings below the fold and the white panel does not survive a
dark theme -- and neither could be overridden from outside.

All three mirror EmptyState, which already carries a description string beside a
descriptionSnippet override and a `children` action area. The shapes are the
library's own, not new conventions.

Verified, with a negative control per behaviour:

- 9 specs across four files. The description pair hands two demo instances the
SAME string: one asserts the {@html} path still parses it as markup, the
other that the snippet path renders it as text. Either alone would pass
against a broken implementation.
- Disabling the snippet branch fails exactly the escape assertion, line 29,
and only that one.
- Reverting the panel variables to their literals fails exactly the neutralise
assertion -- rgba(255,255,255,0.6) received where rgba(0,0,0,0) was expected
-- while "defaults keep the full-screen panel exactly as it was" STAYS
GREEN. That is the backwards-compatibility proof: the defaults render
identically to the code they replaced.
- The children test asserts containment, not presence: content must be inside
.order-status and NOT inside .status-description. Asserting only that it
appears would pass with it nested in the wrong parent, which is the entire
bug being fixed.
- Both controls restored byte-identical and re-run green.
- svelte-check 651 files, 0 errors. prettier --check and eslint clean.

Measured against the real consumer, by computed style rather than screenshot --
the route transitions on a timer, and the same build captured twice differs by
1.273%, so a pixel diff cannot separate the change from the route's own noise.
After adoption: min-height 0px, panel background rgba(0,0,0,0), backdrop-filter
none, and the message colour rgb(82,82,82) -- byte-identical to what the
pre-migration markup inherited.

The web-component wrapper is unchanged: snippets do not cross the custom-element
boundary, which is why the existing `icon` snippet is absent there too.

docs/Status.md gains a Snippets section -- which also documents the pre-existing
`icon` snippet, previously undocumented -- the two new CSS variables, the
`testId` prop, and worked examples for the untrusted description, the
description-vs-action split, and inline embedding.

- feat(status): add descriptionSnippet, children, and panel CSS variables ([7b15192](https://github.com/juspay/svelte-ui-components/commit/7b151928aebc621c392394dfa0299c3837f74ddf))

## [2.131.0](https://github.com/juspay/svelte-ui-components/compare/2.131.0..2.130.1) - 27 August 2026

One shared motion language (320ms fade-up entrances staggered 120ms batch-relative,
cubic-bezier(0.23,1,0.32,1), tokens with literal fallbacks, reduced-motion blocks,
host-driven state everywhere), composed from the library's own primitives.

- ThinkingIndicator absorbs the reasoning trace as a first-class capability (the
separate ThinkingTrace of earlier revisions is merged away — it never shipped):
optional rows/kind (steps / reasoning / search / coding), a host-driven busy
machine (auto-open, once-only onsettled, post-settle auto-collapse a user toggle
permanently overrides), search query chip (Pill) + moreLabel, selectable coding
rows with diff stats, trace body inert while collapsed. Composed from Accordion +
Button + Loader + Pill. Review alignment fixes on the released shapes too: label
fully flush left (the avatar slot only renders when an avatar is given or the
label is live), chevron hugs the label at --thinking-indicator-arrow-gap, elapsed
counter sits with the cluster instead of margin-left:auto, Button's 16px default
content gap overridden via --thinking-indicator-header-gap. Fixed a latent
elapsed-reset bug on {#if} branch swaps and added the missing reduced-motion block.
- ToolCallLog: persistent chip log of a turn's tool calls; detail popovers now
portal to document.body with Menu's positioning (they escape clipping ancestors —
a dedicated demo section proves it), spinner is the library Loader, and the docs
record why chips stay real &lt;button&gt;s (Pill's root is non-interactive).
- TaskList: per-row status machine (pending / running / failed+retry / done);
spinner is the library Loader, retry is the library Button in its compact form.
- SoundKit (module): five synthesized Web Audio recipes, opt-in + persisted,
capture-phase semantic click mapping with data-sound overrides. SSR-safe.
- In-situ examples everywhere the pieces are actually used: Chat carries a full
agent turn (trace -&gt; reply -&gt; tool log -&gt; work plan, suggestions above the
composer), ChatMessage shows the settled turn in history, ChatSuggestions and
ChatBubble gained in-context placements, chat-compositions proves the
recommendation-card (Card + Gauge) pattern; Gauge % and secondary-Button inks
fixed for dark; the HITL page audited and repaired for dark.
- Docs-site demo shell themes every new piece in both themes (demo.css dark token
sets; pages use the site's --doc-* tokens); docs/_index.json entries updated;
sui-thinking-indicator web component registered (it never was).

- feat(chat): ship the agent-chat UX pack — trace-capable ThinkingIndicator, ToolCallLog, TaskList, SoundKit ([dc5d719](https://github.com/juspay/svelte-ui-components/commit/dc5d71947d72e0bf710f40c38fc6ca7e3794e178))

## [2.130.1](https://github.com/juspay/svelte-ui-components/compare/2.130.1..2.130.0) - 27 August 2026

v2.7.1's bundled neurolink has no litellm entry in DEFAULT_TIMEOUTS.providers,
so every litellm review died at the 30s global fallback regardless of the
configured 15m timeout; v3.0.4 carries the fix (input-compatible action
interface — v4's breaking pr/branch/config/vcs-token interface is a separate
migration).

v3.0.4 also rejects the legacy flat mcpServers config shape at startup
('Legacy mcpServers config detected'), which is exactly how both prior runs of
this PR's own review failed. Migrated yama.config.yaml accordingly:
- mcpServers.github -&gt; mcpServers.servers.github as a full definition (http
transport to the hosted GitHub MCP, Bearer ${YAMA_GITHUB_TOKEN} — the
non-reserved env name the action forwards specifically for MCP config —
roles/modes, and a blockedTools denylist of repo-mutating tools).
- Dropped mcpServers.jira: Jira support was removed end-to-end in v3.
- Pinned ai.explore.temperature: 0.1 explicitly, since v3 no longer defaults it.

- ci(yama): bump the review action to v3.0.4 and migrate the config to its schema ([7c5d525](https://github.com/juspay/svelte-ui-components/commit/7c5d525ebc2c18ec95a5b3385f761e5d89bd30b7))

## [2.130.0](https://github.com/juspay/svelte-ui-components/compare/2.130.0..2.129.1) - 26 August 2026

Two seams that let a host app move its hand-rolled message list onto the
library without losing its rendering or its scroll behaviour:

1. body/messageBody snippet — ChatMessage gains an opt-in body snippet that
replaces the rendered text/html while keeping the whole message chrome
(role styling, avatar, header, attachments, copy/retry/feedback actions).
ChatMessageList threads it per message as messageBody(message); Chat passes
it through. The existing message snippet replaces the entire ChatMessage,
forfeiting the chrome, and messageAttachments only appends below the
bubble — neither serves rich bubble bodies.

2. pin-sender-turn scroll policy — the conversational-AI pattern: a new sender
message pins to the TOP of the viewport with headroom reserved below
(min-height on a new inner wrapper) so the reply streams in beneath the
question instead of yanking the reader to the bottom. The trigger is the
last SENDER id changing, because hosts append the question together with a
streaming reply placeholder. pinHold keeps the reservation while the host's
turn is busy (streaming, tool runs, confirmations — host semantics the
library cannot know); flipping it false collapses the headroom so short
replies leave no blank gap. scrollToBottom() is exported as an instance
method, onscrollstate reports {atBottom, scrollable} for hosts with their
own jump affordance, and jump={false} hides the built-in button. A
ResizeObserver on the inner wrapper keeps the near-bottom stick honest when
a stateful custom body grows without changing message count or content
length (review finding). Custom message snippets must render one root
element per message for row↔message mapping.

Docs rows for all touched components (body documented as Snippet | null per
review), wc wrappers expose the new props, and the demo gains two live
sections: a metric card inside a responder bubble with working feedback, and a
pin-sender-turn conversation with a streamed reply.

- feat: messageBody snippet and a pin-sender-turn scroll policy for host chat adoptions ([529f1f0](https://github.com/juspay/svelte-ui-components/commit/529f1f0af278f72dc6a8776ddd9daf7ed6fee105))

## [2.129.1](https://github.com/juspay/svelte-ui-components/compare/2.129.1..2.129.0) - 26 August 2026

Three follow-ups to the inline table search shipped in #456, none of which
change what the component does in the happy path.

- The inline Input had both `bind:value={searchTerm}` and
`onInput={updateSearch}`, so `searchTerm` had two write paths. Only
`updateSearch` performs the side effects (page reset, `onSearchChange`),
which meant a write through the binding could move the term without them.
The prop is now one-way and `onInput` is the single entry point, matching
how the toolbar variant already works.

- Collapsing the search unmounted the focused input with no focus restore,
dropping keyboard users to the document. `expandInlineSearch` already
focuses the input on the way in; `clearSearch` now mirrors it on the way
out, but only when it was actually collapsing an expanded inline search.

- Escape now closes the inline search, which is the expected exit for an
expand-in-place control. It was previously reachable only via the close
button or by blurring while already empty.

`collapseInlineSearchIfEmpty` also gains an expanded guard: collapsing can
fire blur on the unmounting input, which re-entered `clearSearch` and sent a
second `onSearchChange('')` on the server-search path.

- fix(table): restore focus, handle Escape, and single-source the inline search value ([75b9e26](https://github.com/juspay/svelte-ui-components/commit/75b9e2646b176f800a770cf30bfbc63060459fd7))

## [2.129.0](https://github.com/juspay/svelte-ui-components/compare/2.129.0..2.128.1) - 26 August 2026

--chat-bubble-width / --chat-bubble-height now override each axis
independently, both defaulting through --chat-bubble-size so existing
consumers are byte-identical. Setting --chat-bubble-width: fit-content
lets an icon-plus-label snippet render as a pill launcher (Button's own
default width is fit-content; the launcher was pinning both axes to one
size token). Demo gains a bottom-left pill-launcher variant; docs gain
the two token rows and a pill recipe.

- feat(ChatBubble): decouple launcher width/height tokens for pill launchers ([11de1fe](https://github.com/juspay/svelte-ui-components/commit/11de1fed2eaff0a59774ce1c7a86e8273475dc63))

## [2.128.1](https://github.com/juspay/svelte-ui-components/compare/2.128.1..2.128.0) - 26 August 2026

The demo site deploys under BASE_PATH=/svelte-ui-components; the chat demo
pages referenced their media root-relative (/demo-media/…), which the
prerender crawl rejects with '404 … does not begin with base', failing the
Deploy to GitHub Pages workflow on release since the chat-primitives merge.
Every reference now goes through {base} from $app/paths. Verified locally:
BASE_PATH=/svelte-ui-components pnpm build prerenders clean.

- fix: prefix demo media with the Pages base path so the static build prerenders ([ad93de9](https://github.com/juspay/svelte-ui-components/commit/ad93de99cebc1331cfeffd4a41ee36a85de722a8))

## [2.128.0](https://github.com/juspay/svelte-ui-components/compare/2.128.0..2.127.0) - 25 August 2026

Ports the speech-to-text lifecycle that apps hand-roll around the non-standard
SpeechRecognition API into a reusable runes controller: support detection, a
one-shot host permission hook (native-shell mic bridges), start-with-retry
through a re-init, interim/final transcript assembly seeded from the composer
value, and a self-hiding error toast with per-error-code copy. Renders nothing;
pairs with ChatComposer voice control. The recognition constructor is
injectable, so tests and demos run the full lifecycle without a microphone.

- feat: add SpeechToTextController — a headless speech-to-text engine for chat composers ([e34dbb4](https://github.com/juspay/svelte-ui-components/commit/e34dbb49cf4d8277ceeeb5b11a67194b9d31cfac))

## [2.127.0](https://github.com/juspay/svelte-ui-components/compare/2.127.0..2.126.0) - 25 August 2026

- ChatSuggestion items accept label/value/icon/hint objects alongside plain strings
- layout='scroll' renders through Scroller; direction='vertical' stacks full-width chips
- maxVisible, loading (shimmer chips), icon snippet, chipClasses passthrough
- Pill: --pill-width, --pill-justify-content, --pill-text-align tokens (defaults unchanged)

- feat: add four chat primitives — ThinkingIndicator, TypewriterText, AttachmentChipRow, HITL ([aa5f30a](https://github.com/juspay/svelte-ui-components/commit/aa5f30ab8efff95bbebd73d8318f853f9455e142))
- feat(ChatSuggestions): structured suggestions, scroll/vertical layouts, loading state, chip theming hooks ([4e2cef4](https://github.com/juspay/svelte-ui-components/commit/4e2cef4bd35ce68a8f0eddba6a2c0da4311b1a9b))

## [2.126.0](https://github.com/juspay/svelte-ui-components/compare/2.126.0..2.125.0) - 24 August 2026

## [2.125.0](https://github.com/juspay/svelte-ui-components/compare/2.125.0..2.124.0) - 21 August 2026

Two series that share a value put their markers on identical coordinates, and
SVG has no z-index — whichever is written last is the one you see. Markers were
painted inside the per-series loop, in array order, so the LAST series hid the
first. A chart passed [primary, comparison] therefore lost the primary series'
marker wherever the two periods happened to agree, most visibly at the first
bucket, and it reads as a missing data point rather than an overlap.

Consumers cannot fix this from outside: reordering the series array corrects the
markers and reverses the legend, which is derived from the same array.

Moves the marker circles out of the per-series loop into their own pass that
walks the series in reverse, after every line is drawn. Two consequences, both
intended:

- where markers coincide, the FIRST series is now on top, which is the one a
reader is looking at;
- markers now sit above every line rather than only above the lines of earlier
series, so one series' line can no longer cover another's points.

Legend order is untouched — it is derived from `series`, not from this loop.

Verified against a real two-series comparison chart with one deliberately
coinciding bucket. Before: DOM order [current, comparison] at all 7 buckets,
topmost = comparison. After: [comparison, current], topmost = current, legend
still reads Today then Yesterday.

Fixes #446

- feat: add chat components ([a18c497](https://github.com/juspay/svelte-ui-components/commit/a18c4976aa885efd2c006dff7ca06fedd2c9f537))
- fix(LineChart): paint point markers back-to-front so the first series wins an overlap ([207eb8e](https://github.com/juspay/svelte-ui-components/commit/207eb8ed4c101d538bc6b522cc205b63cc69ece3))

## [2.124.0](https://github.com/juspay/svelte-ui-components/compare/2.124.0..2.123.0) - 19 August 2026

Follow-up to #453. Migrating the last Lighthouse call sites onto these components
surfaced five more gaps and one defect in what #453 shipped. Each addition defaults
to the value the component already computes, so no existing consumer moves.

Input
- `maxLength` accepts null. It defaults to 1000 and was rendered as a native
maxlength unconditionally, so migrating an UNCAPPED textarea onto Input silently
truncated it at 1000 characters — a chat composer or a JSON paste box loses data
with no error. Every numeric use of the value is either tel-only normalisation or
the character counter, so those read through a resolved fallback of 1000 and are
unchanged.
- New --input-min-height and --input-max-height. A textarea that grows with its
content needs a ceiling before it can scroll, and one used as a paste target needs
a floor; neither was reachable. Both default to the CSS initial value (auto/none).
- New --input-line-height. This one was unreachable by ANY means: the UA stylesheet
sets line-height on the input/textarea itself, and a declaration on the element
beats a value inherited from a styled container, so a consumer could not restore
the type ramp of the raw textarea it was replacing. Defaulting to `normal` — what
these fields already compute today — makes it byte-identical for everyone else.

Button
- New `ariaBusy`. aria-busy was derivable only from `loading`, which also renders the
spinner and disables the control, so "my contents are still loading but I am still
clickable" was unreachable. That is exactly what a menu/filter trigger needs while
its options load.
- New `title`, the browser's own hover tooltip. Distinct from `ariaLabel`, which names
the control for assistive tech with no visible affordance; an icon-only button
generally wants both, and #453 left a consumer unable to keep its tooltip.

Menu
- Fixes a defect in #453's `interactiveTrigger`. That flag hands the snippet Menu's
keydown handler, which claims Enter and Space — but the snippet now owns a REAL
&lt;button&gt;, which already synthesises a click from both, and that click is wired to
the same toggle. The two cancel: the menu opens and immediately closes. An
interactive trigger now gets a handler that deliberately ignores Enter and Space
and adds only the arrow keys, which no native button implements. The inert-trigger
path is untouched.

Eleven new Playwright tests, five of which exist purely to prove nothing changed for
consumers that do not opt in: a field that sets neither height var still computes
min-height auto and max-height none, one that sets no line-height still computes
normal, one that leaves maxLength alone still renders maxlength="1000", and a button
that passes neither new prop emits no title and no aria-busy. Three more cover the
Enter / Space / ArrowDown behaviour of an interactive trigger directly.

Verified in the BUILT package, not just the dev server: the suite runs against Vite,
which serves src/lib, so it can pass in full while `npm pack` produces a tarball
containing none of the changes. dist/ and the tarball were checked for each addition
before the package was consumed downstream.

Nine Table tests fail in the full suite. They fail identically on unmodified
origin/release under the same conditions (21 passed / 9 failed either way), so they
are pre-existing and not introduced here.

Addresses three findings from the automated review, each verified against the code and
each with a negative control proving the new test fails without the fix:

- autoResize derived its ceiling from maxRows alone, so a field capped by
--input-max-height computed Infinity: the inline height grew past the CSS clamp and
overflowY was set to 'hidden'. The box stopped at the right size but its overflow
became unreachable instead of scrollable. It now takes the lower of the two ceilings.
- close() focused the wrapper div. Under interactiveTrigger that wrapper deliberately
carries no tabindex, so the call was a no-op and focus fell to &lt;body&gt; after Escape or
selecting an item — a keyboard user was left stranded. It now focuses the control the
snippet rendered. This is a defect in what #453 shipped, not in the additions here.
- Three new demo sections had been nested inside the paste demo's row, inheriting its
400px constraint.

- feat(Input, Button, Menu): finish the capability gaps the first pass left open ([1aec3c4](https://github.com/juspay/svelte-ui-components/commit/1aec3c45ba6e6ecf4421639aba1db3ba588df3c9))

## [2.123.0](https://github.com/juspay/svelte-ui-components/compare/2.123.0..2.122.0) - 19 August 2026

Five consumers in the Lighthouse dashboard hand-roll a native &lt;input&gt;, &lt;textarea&gt;
or &lt;button&gt; because the library cannot express what they need. Each is a small
additive gap rather than a design disagreement, so this closes all five and lets
those call sites move onto the components.

Input
- InputDataType gains 'time', 'date', 'search' and 'url'. Input already renders
&lt;input type={dataType}&gt;, so the union was the only thing standing in the way —
a scheduling field had to hand-roll &lt;input type="time"&gt; purely to name a type
the component would have rendered anyway. validateInput() switches on dataType
with no default branch and 'number' has always fallen through it unvalidated;
these four fall through identically and keep `value` a plain string with no
parallel checked/files model. Deliberately NOT added: checkbox and radio, which
are driven by `checked`, and file, which rejects scripted value writes — those
need new props, not a wider union.
- New `spellcheck` prop, defaulting to null so the attribute is absent and every
existing field keeps the browser default. A JSON paste box wants it off.
- New `readonly` prop. Deliberately distinct from `disable`: a disabled element
cannot take focus, so it cannot carry a select-all-to-copy affordance, which is
exactly what the consumer needing this does.
- onPaste now fires for non-tel fields. It was only ever invoked from inside the
tel-specific digit-normalisation branch, so a useTextArea consumer could not
observe a paste at all — a chat composer that intercepts pasted images had no
way to migrate without silently losing that feature. The tel path is untouched.

Menu + Button
- Menu's `trigger` snippet now receives Menu's interaction wiring, and a new
`interactiveTrigger` prop stops Menu making its own wrapper interactive.
Menu wraps the trigger in a role="button" tabindex="0" div, which is right for
inert content and wrong when the snippet renders a real control: the result is
two focusable elements for one conceptual trigger, both announcing as a button,
with interactive content nested inside interactive content. A consumer with a
real Button as its trigger could not produce an accessible result at all.
Defaults to false, so every existing menu behaves exactly as before.
- Button gains `ariaHaspopup`, without which the wiring Menu hands over cannot
land on it. Found by writing the Menu test: the first version of the render-prop
passed kebab-case aria attributes, which a component destructuring named props
silently drops — the shape has to match the library's own camelCase convention.
- The trigger is written as two branches rather than conditional attributes so
role and tabindex stay statically paired; a dynamic pair trips Svelte's
a11y_no_noninteractive_tabindex check.

Verified against a baseline captured before any edit: svelte-check 0 errors and
the same 4 pre-existing warnings, prettier/eslint clean, 128 unit tests passing,
and the package builds. Eight new Playwright tests cover the additions, and three
of them exist specifically to prove nothing changed for consumers that do not opt
in — a field without the new props emits no spellcheck or readonly attribute and
stays editable, and a menu without interactiveTrigger keeps role="button"
tabindex="0" on its wrapper.

Nine Table tests fail in the full suite. They fail identically on unmodified
origin/release when run back-to-back under the same conditions, so they are
pre-existing and not introduced here.

- feat(Input, Menu, Button): close the capability gaps forcing hand-rolled controls ([1e9e278](https://github.com/juspay/svelte-ui-components/commit/1e9e2780e8eeccbe643c0d91477fc62a7dff8aec))

## [2.122.0](https://github.com/juspay/svelte-ui-components/compare/2.122.0..2.121.0) - 17 August 2026

Card's title and description are plain strings, so a consumer whose heading
carries markup — or a test hook like data-pw / use:testAttributes that a suite
already selects on — cannot use the card's own header at all. The workaround is
to hand-roll a heading in the card body, which loses the header typography and
leaves the header row unrendered.

Mirrors the pattern EmptyState already ships. Each snippet renders inside the
same .card-title / .card-description container, so the header keeps its normal
typography and spacing, and a snippet takes priority over the matching string
prop.

One deliberate difference from EmptyState: Card's `title` is optional, so
supplying titleSnippet alone renders the header row and no placeholder title=""
is needed.

Backward compatible. The header gate only gains an OR on titleSnippet, and the
string branches are untouched, so a consumer passing no snippet renders exactly
as before — covered by a regression test. `description` alone still does not
open the header, matching today's behaviour.

Found while migrating a consumer app: 28 Card call sites could not adopt the
title prop purely because their heading carried a Playwright hook.

Tests: 3 Playwright cases (header renders from titleSnippet with no title prop;
snippet content lands inside .card-title/.card-description and keeps its hook;
string path unchanged). Full suite green — 128 unit, lint and svelte-check clean.

- feat(Card): add titleSnippet and descriptionSnippet ([f6b2cbf](https://github.com/juspay/svelte-ui-components/commit/f6b2cbf49ac6cad1edb42b43a34c880e98abdab6))

## [2.121.0](https://github.com/juspay/svelte-ui-components/compare/2.121.0..2.120.3) - 15 August 2026

2.120.3 made these six slots inline their SVG, so a currentColor asset finally
resolves against the host document instead of painting UA black. That was
necessary but NOT sufficient, and the gap is worth stating plainly because it
blocked a consumer migration.

None of the six exposed a COLOUR hook. Each sizes its icon
(--select-left-icon-size, --file-dropzone-trigger-icon-size, ...) and gives it no
independent colour, so an inlined icon inherits the component's text colour and
lands on exactly its label's value. A muted-icon/strong-label hierarchy - which is
a deliberate, common design - became inexpressible, and any consumer migrating an
icon to currentColor had to accept the flattening. In the Lighthouse dashboard
that is 9 icons that cannot move: migrating map-pin-location would repaint the pin
from #a0a0a0 to the trigger's #333.

Each slot now reads a colour token:

--select-left-icon-color
--select-option-icon-color
--tabs-item-icon-color
--file-dropzone-trigger-icon-color      (both sizes share one, deliberately -
same icon at two scales)
--command-menu-item-icon-color          (mirrors the existing
--command-menu-search-icon-color)
--status-icon-color
--table-cell-icon-color

EVERY ONE DEFAULTS TO `inherit`

That is the whole compatibility story: a component that sets none behaves exactly
as it does today, because inheriting the text colour IS the current behaviour.
This adds a hook, it does not change a pixel. Setting the fallback to a concrete
hex would have made the exception the default, which is the trap where a
route-specific value leaks into every consumer.

TESTS

tests/icon-slot-color-token.spec.ts, three cases covering the contract:

- default: the untinted demo icon still tracks --select-color (#2563eb)
- override: with --select-color #111827 and --select-left-icon-color #9ca3af the
icon takes the grey AND the trigger keeps the near-black. Asserting only the
icon would still pass if the token had recoloured everything, which is the
failure this is for
- inlining: the element's own computed `stroke` is the token colour, not just a
wrapper's `color`. A plain &lt;img&gt; would report the right wrapper colour while
rendering UA black, so this is what distinguishes a real fix from a fake one

With inlineSvg the testId lands on the &lt;svg&gt; ITSELF rather than a wrapper, so the
assertions target the element directly - noted in the spec, because a descendant
`.locator('svg')` silently finds nothing and looks like a broken feature.

PRE-EXISTING FAILURES, NOT FROM THIS CHANGE

tests/table-builtin-cells.test.ts has 7 failures. They reproduce identically on
clean release with this branch stashed - the table demo does not render, every
assertion is "element(s) not found", and none of them concern colour. Verified by
control run rather than assumed. Left for whoever owns that demo.

Demo: the Select page gains a "Tinting the icon independently of the label"
section showing the muted-icon/dark-label pairing and naming all seven tokens.

- feat(Select,Tabs,FileDropzoneTrigger,CommandMenu,Status,Table): per-icon colour tokens ([7e9a5fc](https://github.com/juspay/svelte-ui-components/commit/7e9a5fc0744aa5ac5d34f989ac9e2229118a39f8))

## [2.120.3](https://github.com/juspay/svelte-ui-components/compare/2.120.3..2.120.2) - 15 August 2026

Every icon slot in the library rendered through a plain &lt;Img src&gt;, which produces
an &lt;img&gt;. An &lt;img&gt; renders its source as an ISOLATED document, so currentColor
inside the SVG resolves against that document's own root rather than against the
surrounding component - it paints UA black regardless of the theme. Consumers
wanting a themed icon therefore had to ship one asset per colour, or bake a hex
and accept it being wrong in dark mode.

All of these now pass inlineSvg, matching what Toast already did:

Select                leftIcon, and the per-option icon
Tabs                  tabItem.icon
FileDropzoneTrigger   icon (both the sm and default sizes)
CommandMenu           item.icon
Status                statusIcon
Table/BuiltinCell     iconSrc, in the icon-label cell

WHERE THE LINE IS DRAWN

Icon slots inline. Image slots do not, and the four left alone are all content
images rather than glyphs:

ListItem      leftImageUrl / rightImageUrl
BuiltinCell   data.imageUrl, the image-two-line thumbnail
Avatar        src

Avatar is the clearest case: it passes onerror={handleImageError}, and the inline
branch has no equivalent, so inlining would silently drop its fallback. The others
are photographs and product thumbnails - an SVG logo in a ListItem should not
start inheriting the row's text colour.

SAFE BY CONSTRUCTION

No opt-out is needed. Img only takes the inline path when the source is actually
an SVG, and retreats if the markup will not parse:

shouldInline = (inlineSvg || typeof transformSvg === 'function')
&& isSvgSource(currentSrc)      // .svg path or data:image/svg+xml
&& failedInlineSrc !== currentSrc

A PNG or JPEG icon is untouched. Layout is unchanged too: Img's style block
targets `img, svg` identically, so --image-width/--image-height and the rest apply
either way, and both branches carry the same class and test-id attributes - so
.select-left-icon, .tabs-item-icon and the rest still land on the element.

DEMO AND TEST

The Select demo's globe icon now draws with currentColor instead of a baked #555,
and its row sets --select-color, so the page shows the icon following the trigger
colour rather than just asserting it.

tests/select-lefticon-inline-svg.test.ts checks the leading icon is an &lt;svg&gt; whose
parsed content is present, and that its stroke equals the trigger's computed
colour. Negative control run: removing inlineSvg fails it with Expected "svg",
Received "img", so it cannot pass vacuously. The other five components take the
identical one-line change, so they are not re-tested individually. The non-SVG
path is not re-tested either - isSvgSource() and the parse-failure fallback both
predate this change.

VERIFIED

Full suite: 164 passed, 9 failed. All 9 are pre-existing Table failures - the
identical 9 fail on a clean release with these changes stashed. prettier and
eslint clean; svelte-check 0 errors (4 warnings, all pre-existing, other files).

WHY NOW

Icons in the Lighthouse dashboard's currentColor migration are blocked on exactly
this: they are used at both an inline call site and a library icon prop, so
migrating the asset today would fix one and break the other. Select unblocks
map-pin-location; FileDropzoneTrigger unblocks upload-blue across 14 call sites;
Table/BuiltinCell unblocks the marketing-channel icons. Tracked in
juspay/lighthouse under BZ-5354.

## [2.120.2](https://github.com/juspay/svelte-ui-components/compare/2.120.2..2.120.1) - 12 August 2026

- Replace restricted DateRangePicker `$effect` usage with a panel-scoped Svelte action.
- Remove unused eslint-disable comments from Table cell data tests.

- fix(DateRangePicker): flip the panel above the trigger when it does not fit below ([d3ccc90](https://github.com/juspay/svelte-ui-components/commit/d3ccc90bbb58ab89bcb8054a912c164933486720))

## [2.120.1](https://github.com/juspay/svelte-ui-components/compare/2.120.1..2.120.0) - 7 August 2026

Progress rendered as a bare div with no ARIA at all -- a screen reader
had no way to know the .container element was a progress indicator,
let alone read its current completion. This wires up the standard
WAI-ARIA progressbar pattern: role="progressbar" plus aria-valuenow,
aria-valuemin, aria-valuemax, and aria-busy on the root element, along
with an accessible name via a new ariaLabel prop.

The value attributes are expressed as a normalized 0-100 percentage
rather than the raw value/max domain, matching the convention Gauge
already ships in this repo -- assistive technology hears a plain "45%"
regardless of whether the underlying task is 45 of 100 bytes or 4.5 of
10 minutes. aria-valuenow is rounded to 2 decimal places rather than
the nearest whole number, so it stays effectively in step with the
bar's raw fractional width instead of drifting from what's visually
shown by a full percentage point on repeating-decimal values (e.g.
value=1/max=3 renders a 33.333...% bar but previously announced a
flat "33"). Full raw precision isn't used instead, because
(value / max) * 100 can land on binary floating-point noise like
55.00000000000001 -- 2-decimal rounding clears that while keeping the
announced value far closer to the true width than whole-number
rounding. The separate showLabel text keeps whole-number rounding,
since that's the right precision for a human-readable label.

Indeterminate mode (value &lt; 0) needed its own handling that Gauge
doesn't: per the WAI-ARIA progressbar spec, aria-valuenow is omitted
entirely when progress isn't currently determinable, so assistive
technology doesn't read a stale or misleading number. aria-valuetext
is set to "indeterminate" instead, and aria-busy is now set to "true"
so the busy state is exposed through the dedicated ARIA property built
for it, not just prose in aria-valuetext. aria-valuemin and
aria-valuemax are kept in both modes -- the 0-100 scale itself isn't
unknown while indeterminate, only the current position within it is.

Adds the ariaLabel prop this component previously left as a disclosed
follow-up. It mirrors Gauge's exact fallback pattern --
aria-label={ariaLabel ?? labelText} -- falling back to the same
percentage text showLabel displays, or "Loading" while indeterminate
(matching the aria-label LoadingDots already uses for its own loading
state), so assistive technology always announces a name even when the
consumer doesn't set one explicitly. Documented in docs/Progress.md
and demonstrated in the component's demo route.

Playwright specs cover: role/value/label attributes on the determinate
demo including the custom ariaLabel, aria-valuenow tracking the
visible label across value changes for whole-number percentages, the
2-decimal precision divergence on a repeating-decimal value/max pair,
the indeterminate instance's aria-valuenow omission alongside
aria-busy and the "Loading" label fallback, and all three demo
instances being discoverable via the progressbar role query.

Also fixes a CodeRabbit follow-up: value={0} max={0} made
(value / max) * 100 evaluate to NaN, and the old min/max clamps
preserved it as-is, landing "NaN" in aria-valuenow (not a valid ARIA
value), a "NaN%" bar width, and a "NaN%" visible label. percentage now
derives from a hasValidRange guard -- value and max both finite, and
max &gt; 0 -- and falls back to 0 for an invalid range, so the bar renders
as an ordinary empty 0% progress bar instead of propagating NaN. The
guard is kept independent of isIndeterminate on purpose: a negative
value (e.g. -1) still activates the indeterminate animation on its own
even paired with an invalid max, since indeterminate mode never reads
percentage in the markup. Documented the invalid-range contract on the
max/ariaLabel JSDoc in properties.ts, and corrected docs/Progress.md,
which previously claimed the normalized ARIA value held for every raw
value/max domain. Added Playwright coverage for value=0/max=0, a
negative max, a non-finite max, a non-finite value, and a negative
value paired with an invalid max (still correctly indeterminate).

- fix(Progress): progressbar ARIA ([db0d86c](https://github.com/juspay/svelte-ui-components/commit/db0d86c26c0fddba21ef5a3b2801d8b4823a1e4f))

## [2.120.0](https://github.com/juspay/svelte-ui-components/compare/2.120.0..2.119.0) - 6 August 2026

The `classes` prop lands on `.container`, which exposed only
--input-button-container-margin. With no width token, a consumer that
needs the control to fill its parent had no choice but to reach the
element through a Svelte `:global()` escape hatch.

Defaults to `auto`, the current computed value, so no existing consumer
renders differently.

- feat(InputButton): expose --input-button-container-width ([62242b1](https://github.com/juspay/svelte-ui-components/commit/62242b191ff98f346c9b90c015e756aa8624d51d))

## [2.119.0](https://github.com/juspay/svelte-ui-components/compare/2.119.0..2.118.1) - 6 August 2026

Card's only interactive mode was onclick, which renders a &lt;div&gt; with
a role="button"/tabindex/keydown shim. That covers action-style
clicks, but card-styled navigation links (integration tiles, "view
details" cards) are a distinct and common case -- forcing them
through onclick means giving up native anchor semantics: no
ctrl/cmd-click to open in a new tab, no "open in new tab" from the
context menu, no crawlable href, and no real focus/Enter-activation
without the synthetic shim.

href/target/rel are added mirroring Button.svelte's existing anchor
pattern exactly. When href is set, the root renders as &lt;a&gt; instead of
&lt;div&gt; via svelte:element, keeping every existing class and style
untouched. resolvedRel defaults to "noopener noreferrer" when
target="_blank" and rel is not explicitly provided, same fallback
Button already uses. The role="button"/tabindex/onkeydown shim is
now skipped when href is set, since a native &lt;a&gt; already provides
focus and Enter-activation and the shim would be redundant; onclick
still fires either way, so click tracking alongside navigation keeps
working. href is omitted by default, so existing onclick-only and
plain cards see zero behavior change.

.card had no explicit display or text-decoration, so its layout
depended entirely on each tag's browser default: block for &lt;div&gt;,
inline for &lt;a&gt;. An inline box ignores width/height/min-width/
max-width/margin outright, so --card-width/--card-height silently
stopped applying the moment a card became anchor-rendered, and the
anchor also picked up the browser's default underline. Both are now
pinned explicitly on .card (display: block; text-decoration: none;),
so the div and anchor render paths compute an identical box; .card
already had color: inherit, which was already sufficient to override
the browser's default link color since normal author-origin rules
beat normal user-agent-origin rules regardless of specificity, so no
further change was needed there. .card-stretch's own display: flex
still wins for stretch=true cards, unaffected, since it is declared
after .card in source order at equal specificity.

resolvedRel also compared target with a case-sensitive === '_blank',
but the HTML spec treats target values as ASCII case-insensitive, so
target="_BLANK" opens a new browsing context identically but was
silently skipping the noopener/noreferrer default. The comparison
now lowercases target first, preserving explicit rel overrides and
still omitting rel for any non-blank target.

A new demo section (Anchor / Div Layout Parity) and Playwright spec
(card-anchor-div-layout-parity.spec.ts) pin this down: two cards with
identical sizing overrides and identical content, one div-rendered
and one anchor-rendered, must produce pixel-identical bounding
boxes, compute display: block, and have no underline.

- feat(Card): anchor rendering mode ([fe085a0](https://github.com/juspay/svelte-ui-components/commit/fe085a099169bca05c098e4a9ab7a8c49b23b2ad))

## [2.118.1](https://github.com/juspay/svelte-ui-components/compare/2.118.1..2.118.0) - 5 August 2026

The token passthrough added for the chip colours covered only half the problem.
ChipInput re-declares --pill-* on the pill element to expose its own
--chip-input-pill-* API, and a declaration on the element beats an inherited one
whatever the property is — so font size, weight, padding, border radius, border,
gap and dismiss size were still overriding the consuming app's Pill theme with
the library's own values.

An app whose Pill is a 14px chip with a 16px radius still got a 13px chip with a
999px radius. Restoring only the colours left exactly the same bug somewhere less
obvious, which is why it went unnoticed.

Every token carrying the chip's appearance now falls back to the surrounding
cascade, captured on the root under distinct names for the same reason as before:
reading a token in the declaration that sets it is a custom-property cycle and
computes to invalid. Precedence is unchanged — explicit --chip-input-pill-*, then
the app's own theme, then the library default.

Tokens the component owns structurally stay fixed: the draft field's inline
padding, margin and shadow keep it sitting among the chips rather than describing
how it looks, and an app that themes Input globally must not disturb that. The
demo sets deliberately hostile --input-* values so a spec asserts they are
ignored.

- fix(ChipInput): let a consuming app's Pill size and shape reach the chips too ([14e301c](https://github.com/juspay/svelte-ui-components/commit/14e301cb2ecf7475d4ef9d6dd44a7500ec51f32e))

## [2.118.0](https://github.com/juspay/svelte-ui-components/compare/2.118.0..2.117.1) - 5 August 2026

The dot indicators had two gaps: their colors were hardcoded hex
(#c4c4c4 / #000000) with no CSS variable hook, unlike every other
visual property on this component, and they were not focusable even
though docs/Carousel.md already documented onkeydown as firing "while
a dot indicator has focus" -- a claim tabindex never actually made
true.

--carousel-dot-color and --carousel-dot-active-color replace the
hardcoded values, defaulting to the same colors so unset behavior is
unchanged. tabindex="0" makes the dots reachable by keyboard, and
role changes from "none" to "button" to match -- svelte-check flags
a nonnegative tabindex on a noninteractive role as invalid, and the
dot already behaves like one (it has an onclick). aria-label gives
each dot the accessible name role="button" now requires.

onkeydown remains a raw passthrough: the library still does not
trigger navigation on Enter/Space itself, only makes the element
reachable. Documented as a known boundary in the new Accessibility
section rather than silently expanded, since wiring default
activation would change how the existing public onkeydown prop
composes with internal behavior for any consumer already using it.

- feat(Carousel): dot-nav theming + keyboard access ([ecb7a51](https://github.com/juspay/svelte-ui-components/commit/ecb7a516ae3f0a9a93db0dd382d3e913ace9b1cb))

## [2.117.1](https://github.com/juspay/svelte-ui-components/compare/2.117.1..2.117.0) - 5 August 2026

Selecting a tab bumps its font-weight from --tabs-item-font-weight
(400) to --tabs-active-font-weight (600). That weight jump resizes
the tab's own box, which reflows every tab after it in the bar and
makes the whole row visibly shift on each selection change -- not
just an indicator timing issue, the tabs themselves move. This is
most noticeable in the horizontal overflow layout, where a shift can
even change which tabs are clipped by the scroll fade, but it also
throws off vertical nav rails.

The fix reserves each label's active-state width up front using a
hidden ::after ghost: the label span now carries its own text via a
data-text attribute, and a ::after pseudo-element renders
attr(data-text) at the active font-weight with height:0 and
visibility:hidden. Because the parent label is display:inline-block
and shrink-to-fit, the invisible bold ghost -- wider than the
currently-visible lighter-weight text -- pre-sizes the box to the
active width. Toggling the visible text's own weight on activation
never changes the rendered box size. The ghost weight reads
var(--tabs-active-font-weight, 600) rather than a hardcoded value, so
a consumer overriding that variable keeps a self-consistent,
reflow-free reservation without any extra work.

This only touches the default (non-tab-snippet) label render path.
The tab snippet hands rendering entirely to the consumer, so the
library has no visibility into what markup or text needs its width
reserved there -- same boundary already drawn for Carousel's
keyboard handling in a prior PR.

Three new Playwright specs assert bounding-box equality across
activation for a horizontal sibling tab (proving no reflow beyond
the activated tab), the activated horizontal tab itself (proving no
self-resize), and a vertical nav item's label (proving the technique
holds in both orientations).

- fix(Tabs): reserve active-state width ([a0483bc](https://github.com/juspay/svelte-ui-components/commit/a0483bc228bb651178aedec23487c4f2f59585af))

## [2.117.0](https://github.com/juspay/svelte-ui-components/compare/2.117.0..2.116.1) - 5 August 2026

A cross-repo audit of Harbour's marketing site found eight call sites
(gradient CTAs like BuddyButton, TalkToBuddy, EnterpriseCta,
EnterpriseHero, EnterprisePricing, UseCases, and a contact-us submit
button) that all hand-roll the same shape: a transparent chassis
(white text, no border, no background of its own) so a
--button-background gradient shows through untouched. Today that
shape requires overriding --button-color/--button-text-color/
--button-border individually on every call site.

variant="brand" packages it as a single preset, following the exact
pattern of the existing primary/secondary/ghost/destructive variants
-- it only sets the internal --_btn-* layer, which any explicit
--button-* override or classes recipe still wins over. No existing
variant's CSS block is touched, so unset behavior for every current
consumer is unchanged.

The variant's hover default is also transparent, matching its rest
state, which surfaces a pre-existing subtlety in the hover fallback
chain: --_btn-hover-color sits ahead of --button-background, so a
--button-background gradient without a matching --button-hover-color
will flatten to transparent on hover. Docs and the demo route both
show the two set together to steer consumers around it.

- feat(Button): add brand variant ([ac9cb0f](https://github.com/juspay/svelte-ui-components/commit/ac9cb0f5ca89122ee5531124ee693b826416c825))

## [2.116.1](https://github.com/juspay/svelte-ui-components/compare/2.116.1..2.116.0) - 5 August 2026

ChipInput re-declares --pill-* and --input-* on its pill and draft-input
elements to expose its own --chip-input-* API. A declaration on the element
beats an inherited one, so that mapping swallowed any --pill-background,
--pill-color or --input-border a consuming app had set app-wide and fell through
to the library's hardcoded light-mode hexes. An app theming Pill for a dark
surface got light-grey chips with dark text, at wrong contrast, with no way to
fix it short of defining --chip-input-* overrides at every call site.

The mappings now fall back to the surrounding cascade's value instead of a raw
hex. The captures live on the ChipInput root, where --pill-*/--input-* have not
yet been re-declared: reading them in the same declaration that sets them would
be a custom-property cycle and would compute to invalid.

Precedence is unchanged for existing consumers and now has a middle rung:
explicit --chip-input-* override &gt; inherited app theme &gt; library default.

Found while migrating a consumer app onto this component: the swap moved
631,175 pixels against an 8px noise floor, and this was one of the two causes.

- fix(ChipInput): let a consuming app's Pill and Input theme reach the chips ([ce626f7](https://github.com/juspay/svelte-ui-components/commit/ce626f74e7f69644efaedf5d58e8ff785c1c8bc2))

## [2.116.0](https://github.com/juspay/svelte-ui-components/compare/2.116.0..2.115.0) - 5 August 2026

ModalAnimation picks its entry transition purely from align (fly for
top/bottom, fade for center), with no way to get a centered dialog that
slides in like a bottom sheet. entryAnimation ('fade' | 'slide-up' |
'slide-down') overrides that per-align default, reusing the exact fly
distance/duration bottom/top alignment already use. Left unset, behavior
is unchanged.

overlayFadeIn (threaded to a new fadeIn prop on OverlayAnimation, which
previously only faded out) softens the backdrop's instant appearance to
match a slide-up entrance. Default false preserves current behavior.

- feat(Modal): add entryAnimation and overlayFadeIn props for centered slide-up dialogs ([7a0a964](https://github.com/juspay/svelte-ui-components/commit/7a0a964b5069480c5c1de698db8ba90f79b3b05b))

## [2.115.0](https://github.com/juspay/svelte-ui-components/compare/2.115.0..2.114.1) - 5 August 2026

The .toast rule already exposed --toast-top, --toast-left, and
--toast-right as theming hooks, but no --toast-bottom — so consumers
had no way to anchor a toast to the bottom edge of its container
without resorting to !important overrides or wrapper-level CSS.

Add `bottom: var(--toast-bottom, auto)` alongside the existing
position hooks. Default is `auto`, matching the current behavior
exactly (the property was previously unset, which computes to auto),
so this is a zero-default-change addition.

This also unlocks bottom-centered placement entirely through existing
+ this one new hook: --toast-left: 0; --toast-right: 0;
--toast-width: fit-content; --toast-margin: 0 auto; --toast-top: auto;
--toast-bottom: &lt;offset&gt;. That recipe is deliberately NOT a transform
hook (e.g. --toast-transform) — the component's `fly` transition
writes an inline `transform` on the element during enter/leave, which
would fight a statically-applied transform mid-animation and snap on
completion. The left/right + fit-content + auto-margin recipe composes
cleanly with `fly` instead, so it's the one demonstrated in the new
demo section on the Toast page.

--toast-width and --toast-margin hooks already existed and needed no
changes.

- feat(Toast): add --toast-bottom CSS hook ([2bd864b](https://github.com/juspay/svelte-ui-components/commit/2bd864b2e5036b83ded8a9840dc35ef31e3c9e42))

## [2.114.1](https://github.com/juspay/svelte-ui-components/compare/2.114.1..2.114.0) - 4 August 2026

Modal wrapped ANY non-empty header.leftImage in role="button" with tabindex="0"
and click/keydown handlers, whether or not onheaderLeftImageClick was passed.

Consumers pass a decorative brand or source logo in that slot far more often
than a back button, so assistive tech announced a focusable "button" that did
nothing when activated, and keyboard users got a dead tab stop on every such
modal. That is worse than leaving the image unannounced, because it promises an
action the control does not have.

The wrapper is now interactive only when onheaderLeftImageClick is a function.
The two branches are written out explicitly rather than computed into the
attributes so the role/tabindex pairing stays statically checkable by
svelte-check, and so no 'undefined' attribute values are needed (the repo lint
config bans them). The image markup is shared via a snippet, and the narrowed
src is captured in a {@const} because a snippet is its own scope.

Backward compatible: the only behavioural difference is for call sites that pass
leftImage WITHOUT a handler, where the control did nothing anyway. Sites that do
pass a handler are untouched -- verified by the new spec's back-button case,
which passes both before and after the change.

Adds tests/modal-left-image-interactivity.spec.ts covering both states, plus the
two demo modals it drives. Negative control performed: with the fix reverted the
decorative case fails on the role="button" assertion and the back-button case
still passes.

- fix(Modal): only treat header.leftImage as a control when a click handler is supplied ([aadd6b6](https://github.com/juspay/svelte-ui-components/commit/aadd6b62e8cf784987b5746e959403a517c6366b))

## [2.114.0](https://github.com/juspay/svelte-ui-components/compare/2.114.0..2.113.0) - 3 August 2026

The header's left/right image wrappers render as role="button"
tabindex="0" divs with no text content, so screen readers announced
a bare "button" with no name — every consumer whose header renders
a close/back icon inherited this gap.

Add buttonAriaLabel to the header config (mirrors the existing
buttonTestId placement, applies to the right image) and a top-level
leftImageAriaLabel (mirrors the existing leftImageTestId placement,
applies to the left image). Both are optional and render as
aria-label; omitting them preserves current (nameless) behavior.

- feat(Modal): accessible-name passthrough for header image buttons ([f9cd7dc](https://github.com/juspay/svelte-ui-components/commit/f9cd7dcebd774c4f08f1699f7b86159938d561b9))

## [2.113.0](https://github.com/juspay/svelte-ui-components/compare/2.113.0..2.112.0) - 3 August 2026

Ports lighthouse's app-side FileDropzoneTrigger (PR #6700, 9 files / 14
call sites) into the library so it is authored once and imported, not
hand-rolled per consumer. Composes with FileInput's existing trigger
snippet: onclick wires to openFilePicker. Drops the mutedCaption boolean
in favor of --file-dropzone-trigger-caption-color, a pure-appearance
concern exposed as a themeable CSS variable instead of a prop.

- feat(FileDropzoneTrigger): add shared trigger visuals for FileInput dropzones ([9e27683](https://github.com/juspay/svelte-ui-components/commit/9e27683931b31b4c488919a9d167884b0d9ffa59))

## [2.112.0](https://github.com/juspay/svelte-ui-components/compare/2.112.0..2.111.4) - 3 August 2026

Closes the API gap flagged by Yama's review on lighthouse PR #6699: the
consumer had no way to set the iframe's credentialless attribute or send
outbound postMessage without a DOM-query escape hatch reaching past the
component's own state.

credentialless is spread onto the &lt;iframe&gt; in the same {#if src} render
statement that sets src, so it is present before the iframe's first
load — no dependency on effect-scheduling order (the MAJOR finding Yama
raised: the app-side workaround set it via a parent $effect + DOM query
AFTER the iframe already existed).

postMessage is exported from the component instance and reached via
bind:this, following FileInput's export const openFilePicker precedent
exactly. Not bridged onto the sui-iframe-viewer custom element, matching
FileInput.wc.svelte's precedent of keeping exported instance methods
Svelte-only.

- feat(IframeViewer): add credentialless prop and postMessage accessor ([a285e01](https://github.com/juspay/svelte-ui-components/commit/a285e01c662fc8329a8b085ff136b722bf894197))

## [2.111.4](https://github.com/juspay/svelte-ui-components/compare/2.111.4..2.111.3) - 1 August 2026

WebOTP / Android-SMS autofill drops the entire code into the first field as
one input event. Input's dataType='tel' sanitizer truncated an overflowing
value to its LAST maxLength digits before onInput fired, so with single-char
fields the distribute branch never ran and a 6-digit code landed as one wrong
digit. Single-char autoAdvance fields now widen the inner Input maxLength to
the code length and SplitInput enforces one-char-per-field itself: whole codes
distribute from field 0 (digit-sanitized for tel — separators like 123-456
never land in a field), partial strings no longer clear fields beyond them,
and overtyping a filled field keeps the newest digit and advances. FieldConfig
gains testId passthrough to the inner Input (data-pw/testID per field).

New spec pins the contract; 3 of its 4 tests fail against the previous
component (negative control).

- fix(SplitInput): distribute whole-code autofill into single-char fields ([3396b71](https://github.com/juspay/svelte-ui-components/commit/3396b711563dd9c8c6a9bd60c3192caa205c24a4))

## [2.111.3](https://github.com/juspay/svelte-ui-components/compare/2.111.3..2.111.2) - 30 July 2026

The tablist roves tabindex (active tab 0, all others -1) but the keydown
handler only covered Enter/Space, so a keyboard user who focused the active
tab could never reach any other tab. Orientation-aware ArrowRight/ArrowLeft
(ArrowDown/ArrowUp when vertical) now move selection with wrap-around and
activation-follows-focus, Home/End jump to the ends, and DOM focus follows
onto the newly active tab after the tabindex re-roves. The tablist also
exposes aria-orientation when vertical.

## [2.111.2](https://github.com/juspay/svelte-ui-components/compare/2.111.2..2.111.1) - 27 July 2026

The start/end date boxes were read-only display text. They are now real inputs:
typed text is parsed on blur and Enter, committed when the picker would accept
that date, and reverted otherwise.

Addresses three review findings:

- The live invalid-border feedback and the commit rule were separate
expressions, so a date that crossed the other boundary typed cleanly with no
invalid styling and then silently reverted on commit, with no cue as to why.
Both now share one predicate, isTypedDateAcceptable, so they cannot disagree.

- maxRangeDays was enforced only while a range was mid-selection:
rangeConstrainedDisabledDates applies its span check when draftStart is set
and draftEnd is still null. Once both boundaries exist that guard goes quiet,
so retyping either one could commit a range longer than the calendar grid
would ever have allowed. The shared predicate now checks the span itself.

- buildDateFromParts used new Date(year, ...), which maps years 0-99 onto
1900-1999, so the four-digit literal "0050-01-01" resolved to 1950. Dates are
now built with setFullYear, which has no such remapping. daysInMonth goes
through the same helper, so leap-year validation is correct for those years.

Verification: 8 Playwright cases (6 pre-existing plus one per new finding) and
7 timeUtils unit cases. Each new test was negative-controlled by disabling only
its own fix: reverting the shared predicate fails the boundary-border test,
removing just the span check fails the maxRangeDays test, and restoring
new Date(year,...) fails the year test with 'expected 1950 to be 50'.

A demo combining showDateInputs with maxRangeDays was added, since no existing
fixture exercised both together.

## [2.111.1](https://github.com/juspay/svelte-ui-components/compare/2.111.1..2.111.0) - 25 July 2026

Playwright reads data-pw; Appium resolves elements by the native accessibility
identifier and never sees data-pw. Components accepted a single testId but only
emitted data-pw, so consumers had to hand-roll a Svelte action that set both --
and swapping such an action for the library's testId prop silently dropped
native-test coverage.

All 186 emissions now render both attributes, including the imperatively built
Tooltip portal bubble and the static chart/overlay ids. A shipped module
augmentation declares the attribute on svelte/elements so it type-checks; the
key is lower case because Svelte normalises DOM attribute names, as does
setAttribute.

Declaring the attribute rather than spreading an object is deliberate: a spread
makes Svelte skip its static a11y analysis for that element, which turned six
existing svelte-ignore comments into dead code and would have silently disabled
real a11y warnings across the component set.

- fix: emit a native testID alongside data-pw for every testId ([b543c3c](https://github.com/juspay/svelte-ui-components/commit/b543c3c7f6d89f3e7dc4e2cfa09bcf93d17918fb))

## [2.111.0](https://github.com/juspay/svelte-ui-components/compare/2.111.0..2.110.0) - 17 July 2026

- feat(StatCard): design-system trend states and inline comparison denominator — neutral '—' glyph, change:null renders N/A, comparisonValue renders '/ &lt;value&gt;' ([b7578a9](https://github.com/juspay/svelte-ui-components/commit/b7578a903be36b3e97ca117e87602ad06ab592e1))

## [2.110.0](https://github.com/juspay/svelte-ui-components/compare/2.110.0..2.109.0) - 17 July 2026

- feat(LineChart): per-series dash + single-point flat-line rendering (design-system contracts) ([60d2784](https://github.com/juspay/svelte-ui-components/commit/60d27842135d6efc487aea961950bdde375efd8f))

## [2.109.0](https://github.com/juspay/svelte-ui-components/compare/2.109.0..2.108.1) - 17 July 2026

- feat(Table): summaryRowIndex — DataGrid-parity summary/period-total row highlight via --table-summary-row-background ([7575890](https://github.com/juspay/svelte-ui-components/commit/7575890ce65677999b9e932bb3ca330ad6cef31b))

## [2.108.1](https://github.com/juspay/svelte-ui-components/compare/2.108.1..2.108.0) - 17 July 2026

- docs(LineChart): document the yIntegerTicks prop ([865d5c0](https://github.com/juspay/svelte-ui-components/commit/865d5c0e0bf6a214b31db45316198f424aadd503))

## [2.108.0](https://github.com/juspay/svelte-ui-components/compare/2.108.0..2.107.1) - 16 July 2026

Count-style series (orders, items) with small domains rendered
fractional Y ticks — a [0, 2] domain picked step 0.5, showing
0, 0.5, 1, 1.5, 2 for discrete counts. The integer-tick machinery
already exists (computeLinearTicks integer mode, Axis integerTicks)
and the X axis uses it for categories; the Y axis just never wired
it and exposed no prop. yIntegerTicks (default false, no behaviour
change for existing consumers) mirrors the X-axis pattern.
yTickFormat cannot fix this — it only changes label text, not tick
placement, so rounded labels would duplicate (0, 1, 1, 2, 2).

- feat(LineChart): add yIntegerTicks to snap Y-axis ticks to whole numbers ([ca2b41d](https://github.com/juspay/svelte-ui-components/commit/ca2b41d2836c9d09140b7547a7eb0620c115c2c3))

## [2.107.1](https://github.com/juspay/svelte-ui-components/compare/2.107.1..2.107.0) - 16 July 2026

Link widths were sized at the source column px-per-value scale while target
nodes were laid out at their own column scale (every column stretched to fill
the full plot height). Incoming ribbon stacks therefore overran target bars by
15-27px on real payment-funnel data and painted past the deepest node row.

Node heights and link widths now share one global scale set by the tightest
column (d3-sankey ky): equal values render equally tall in every column,
columns are value-true instead of stretched, and each node is inflated to fit
its minLinkWidth-clamped stacks so no ribbon can leave its bar. Regression
tests assert per-link flush containment and cross-column height equality.

- fix(SankeyChart): single global px-per-value scale so ribbons stay flush inside node bars ([5acac8b](https://github.com/juspay/svelte-ui-components/commit/5acac8b5380b07e6ac22f1cc871a4dcd60a69b85))

## [2.107.0](https://github.com/juspay/svelte-ui-components/compare/2.107.0..2.106.2) - 16 July 2026

- marginX: fixed horizontal inset between the svg edges and the plot,
overriding the auto layout's tick-label padding — edge-to-edge funnels
had ~28/72px of dead space beside the first/last bars.
- Grouped/single bars now round only their value end (design-system bar
spec): vertical bars round the top (bottom when negative), horizontal
bars the right (left when negative), floating range bars both ends. The
old all-corner rect rounding let a track/backdrop bar behind the value
bar peek through the notches at its baseline corners.

- feat(BarChart): marginX inset override + value-end-only bar rounding ([f600eda](https://github.com/juspay/svelte-ui-components/commit/f600edade0d572ee8af803cd600f7ec1db7489a7))

## [2.106.2](https://github.com/juspay/svelte-ui-components/compare/2.106.2..2.106.1) - 16 July 2026

The nice-step ladder could overshoot the requested tick count (range 14 at
count 6 picks step 2 → 7 ticks), so axes rendered more ticks than the
design-system spec's "max 6". When the built ticks exceed the count, the
step now escalates until they fit: category (integer) axes step through
whole numbers — any integer stride is a valid category step, so 15 daily
categories at max 6 land on the natural every-3rd-day stride — while
numeric axes climb the 1-2-5-10 ladder so tick values stay round.

- fix(charts): computeLinearTicks honors the requested count as a hard maximum ([6c28bef](https://github.com/juspay/svelte-ui-components/commit/6c28bef5258d44534c1125dae22d5089c867acf2))

## [2.106.1](https://github.com/juspay/svelte-ui-components/compare/2.106.1..2.106.0) - 16 July 2026

A non-finite y (NaN — a missing value in a sparse series) used to poison the
whole SVG path: the browser drops every command after the first NaN, visually
cutting the line mid-chart. linePath/areaPath now split points into finite
runs and emit one subpath per run, so the line gaps over missing points and
resumes. Gap points render no marker, halo, crosshair, data label, or tooltip
row, and are excluded from auto-computed domains.

Also caps x-axis ticks at 6 per the design-system line-chart spec ("Max no.
of tiks should be 6" — Akshay, spec sticky note); y was already capped at 6.

- fix(LineChart): gap-resilient paths for sparse series + 6-tick x-axis cap ([4376152](https://github.com/juspay/svelte-ui-components/commit/43761522f9fa50add602b877808ad20efe38cc78))

## [2.106.0](https://github.com/juspay/svelte-ui-components/compare/2.106.0..2.105.0) - 16 July 2026

--sankey-plot-background (default transparent) fills a rect spanning exactly
the plot — first column's bars to last column's bars, header row excluded —
matching the funnel design's subtle backdrop panel. Non-breaking: transparent
default renders nothing.

- feat(SankeyChart): tokenized plot backdrop panel ([21f67d5](https://github.com/juspay/svelte-ui-components/commit/21f67d5c6e6ec5d2447d6024e18db9ee9be75cec))

## [2.105.0](https://github.com/juspay/svelte-ui-components/compare/2.105.0..2.104.0) - 16 July 2026

- lastColumnLabelSide prop ('right' default): 'left' renders sink labels
inside the plot over the incoming ribbons (mirror of firstColumnLabelSide
'right') and frees the reserved right gutter for plot width
- marginX prop (default 40): configurable horizontal inset so funnels can run
edge-to-edge; the vertical margin stays fixed for column headers
- column headers now clamp to the svg canvas (measured at the rendered font)
so an edge header can never paint past the boundary at tight margins —
a no-op at the default margins

All defaults preserve current rendering exactly.

- feat(SankeyChart): edge-to-edge layout — last-column label side, horizontal margin, header clamp ([ee4da01](https://github.com/juspay/svelte-ui-components/commit/ee4da01867a1fc7c91155d5292b4fb3bdf01453d))

## [2.104.0](https://github.com/juspay/svelte-ui-components/compare/2.104.0..2.103.0) - 16 July 2026

- --sankey-label-font-weight / --sankey-col-label-font-weight tokens
(default 400), wired into both the CSS and the canvas text-measurement
engine so truncation budgets and gutters stay honest at bolder weights
- --sankey-label-halo-color / --sankey-label-halo-width tokens: a
Highcharts-style paint-order stroke outline so node labels stay legible
over dense link ribbons (off by default)
- firstColumnLabelSide prop ('left' default): 'right' renders first-column
labels like every other column and frees the reserved left gutter
- label de-collision line height now derives from the tokened font size
instead of a hardcoded 16px

All defaults preserve current rendering exactly.

- feat(SankeyChart): tokenize label typography and first-column label side ([1f8857c](https://github.com/juspay/svelte-ui-components/commit/1f8857c822b2811cdf7b72080dff263df5fece3e))

## [2.103.0](https://github.com/juspay/svelte-ui-components/compare/2.103.0..2.102.0) - 15 July 2026

Exposes CSS-variable hooks (all defaulting to the current values, so existing
consumers are unchanged) for the StatCard's layout so a theme can drive the look
from :root instead of reaching into the DOM:
- --statcard-{header,subtitle,rows,value-row}-order — reorder the card's direct
flex children (e.g. render the subtitle/caption above the value).
- --statcard-breakdown-item-flex-direction / -align-items / -flex-wrap and
--statcard-breakdown-value-line-order — value-then-label inline sub-lines.
- --statcard-breakdown-heading-text-transform — sentence-case captions vs the
uppercase grid-label default.

- feat: StatCard layout tokens — flex-child order, breakdown item direction, heading text-transform ([221bb2f](https://github.com/juspay/svelte-ui-components/commit/221bb2f575d386399ed936e54d3e1c040fa0e6bc))

## [2.102.0](https://github.com/juspay/svelte-ui-components/compare/2.102.0..2.101.0) - 15 July 2026

`valueFormat(value)` receives only the value, so a caller can't label one bar
differently from the rest (e.g. a funnel baseline that should show its raw count
while the other steps show a percentage). Add an optional `valueLabel` to
BarChartDataPoint; when set, getDisplayValue returns it verbatim, otherwise the
existing normalized/range/valueFormat path is unchanged. Backward-compatible.

- feat: BarChartDataPoint.valueLabel — per-bar value-label override ([633e5a3](https://github.com/juspay/svelte-ui-components/commit/633e5a3170acf76535aeb8fc8ecca26f1d3c9b28))

## [2.101.0](https://github.com/juspay/svelte-ui-components/compare/2.101.0..2.100.2) - 15 July 2026

Exposes each rendered bar's geometry (rect x/y/width/height, series/point
indices, value, category label, and the value-label anchor) on the
renderOverlay context, in inner post-margin coordinates. This lets a consumer
anchor an overlay annotation — e.g. a small icon above the first funnel step's
count — to a specific bar without re-deriving the band scale from innerWidth.

Falls back to the bar's top-centre for labelX/labelY when value labels are
hidden. Adds the BarChartBarPosition type (exported via properties).

- feat: BarChartRenderContext.bars — per-bar geometry for overlay annotations ([01f8d32](https://github.com/juspay/svelte-ui-components/commit/01f8d326a90b2edb19d5b7d793a5be083efb8ad4))

## [2.100.2](https://github.com/juspay/svelte-ui-components/compare/2.100.2..2.100.1) - 15 July 2026

The FileInput wrapper is role="button" and opened the native picker on
keyboard (Enter/Space) and drag-drop, but not on a plain click — so a
non-button trigger (e.g. a Card drop zone) couldn't open it without the
consumer wiring openFilePicker onto an inner control. Add onclick to the
wrapper so clicking anywhere in the drop zone opens the picker.

openFilePicker is made idempotent within a single click dispatch (a
microtask-released busy flag) so a trigger that ALSO wires openFilePicker on
an inner button plus this wrapper's onclick can't double-open; a target guard
ignores the hidden input's own bubbled click to avoid re-entrancy. Verified:
card trigger and inner-button trigger each open the picker exactly once.

- fix(fileinput): open the picker on click of the whole drop zone ([ef294a9](https://github.com/juspay/svelte-ui-components/commit/ef294a9fb6be4348fb0d554d5f5e8caf708194fb))

## [2.100.1](https://github.com/juspay/svelte-ui-components/compare/2.100.1..2.100.0) - 15 July 2026

The trend-arrow change put two &lt;path&gt; elements on one line, exceeding the print
width; the release lint step (prettier --check) failed and blocked publish.
Reflow via prettier --write. No behavioural change.

- fix: DeltaIndicator renders the trend-line arrow, not a filled triangle ([85bcdb7](https://github.com/juspay/svelte-ui-components/commit/85bcdb79245349a5a8e38ae2613b8d23df1975bc))
- style: wrap DeltaIndicator trend-arrow svg to satisfy prettier ([2207603](https://github.com/juspay/svelte-ui-components/commit/2207603ada136754ea4640227a6fca3d81f94608))

## [2.100.0](https://github.com/juspay/svelte-ui-components/compare/2.100.0..2.99.0) - 14 July 2026

Adds three additive, backward-compatible Tabs capabilities for vertical
nav/menu rails (the classic horizontal tab bar is unchanged):

- orientation='vertical' — column layout, leading-edge sliding indicator,
up/down scroll arrows and top/bottom fade masks.
- status='default' — neutral blue "has activity / configured" dot beside
the existing pending/error/success dots.
- TabItem.sectionLabel — optional group header rendered above an item.

orientation defaults to 'horizontal', so every existing call site is
unaffected. Demo extended with a vertical rail exercising all three.

- feat(tabs): vertical orientation, blue default status dot, section labels ([71baf05](https://github.com/juspay/svelte-ui-components/commit/71baf05228c9e0f8092845c9b815caa2e6c3c393))

## [2.99.0](https://github.com/juspay/svelte-ui-components/compare/2.99.0..2.98.2) - 14 July 2026

The overlay backdrop reads its colour from `--background-color`, a very
generic token name that collides with app-level `--background-color`
values (frequently set to transparent), silently overriding the modal
backdrop so a showOverlay modal renders no visible dim.

Add a modal-specific `--modal-overlay-background-color` and read it first,
falling back to the legacy `--background-color`, then the `#00000066`
default. Fully backward-compatible: consumers already setting
`--background-color` are unaffected; new consumers can theme the backdrop
without the generic-token collision. Docs table updated.

- feat(modal): add --modal-overlay-background-color overlay token ([ebe23e0](https://github.com/juspay/svelte-ui-components/commit/ebe23e0a0e6129b02f228fe6ab5a4a8b192e360d))

## [2.98.2](https://github.com/juspay/svelte-ui-components/compare/2.98.2..2.98.1) - 14 July 2026

PieChart: the centre-snippet foreignObject was innerR*1.3 (~2/3 of the inner-hole
diameter), so a currency total like "₹31.24k" was clipped on both sides and a
two-word caption ("Total Sales") wrapped. Widen the box to innerR*1.9 — every
edge stays inside the hole at the text mid-line while giving the centre label the
room it needs. Realistic abbreviated values (k / L / Cr) now render in full.

StatCard: breakdown items laid out label, value and the change indicator as three
stacked column children, so the delta rendered on its own line beneath the
number. Wrap value + delta in a flex line (.statcard-breakdown-value-line) so the
delta sits next to the value; the label stays the caption above.

- fix: donut centre label fits the hole; StatCard breakdown delta sits inline ([d01ef4a](https://github.com/juspay/svelte-ui-components/commit/d01ef4a28d5349cf40bca360724cc5c88660be9a))

## [2.98.1](https://github.com/juspay/svelte-ui-components/compare/2.98.1..2.98.0) - 14 July 2026

BZ-4623: the built-in paginator's page-size Select sits at the very bottom of
.table-container (overflow: hidden) and opens downward, so its options were
clipped behind the footer. It is internal chrome consumers cannot reach, so give
it usePortal unconditionally (consistent with the in-cell selects) — it now
portals to document.body with fixed, collision-aware positioning and escapes the
container's clip. No consumer change required beyond consuming this version.

BZ-4620: the image-two-line-text cell rendered an empty grey box when a row had
no imageUrl. Render the first letter of text1 (uppercased), centered, in the
placeholder — so line-item tables show product-name initials like the rest of
the app, for every image-cell consumer at once.

## [2.98.0](https://github.com/juspay/svelte-ui-components/compare/2.98.0..2.97.2) - 14 July 2026

Add the capabilities that force Lighthouse (and any consumer) to hand-roll raw
&lt;button&gt;/dropdown/accordion instead of using these components:

- Accordion: `disabled` prop — suppresses toggle + Enter/Space, drops the trigger
from the tab order, emits aria-disabled, adds a `disabled` trigger class + a
not-allowed cursor. `expand` still honoured, so a locked accordion can be shown
open/closed under controlled state.
- Button: `style` prop on the outer .button-container — for per-instance dynamic
values a static class can't express (e.g. a runtime-driven CSS custom property).
- Select: per-option `icon` on SelectItem — renders an &lt;Img&gt; before each option
label (icon pickers); sized via --select-option-icon-size. Inline + vertically
centred so icon-less lists are unaffected.
- Tabs: per-tab `icon` + `status` ('none'|'pending'|'error'|'success') on TabItem —
leading icon + trailing status dot in the default layout, and both forwarded to
the `tab` snippet. Themeable via --tabs-item-{icon-size,status-*-color}.

svelte-check, lint, and build all pass.

- feat: fill component gaps blocking Lighthouse migration ([a1c1f15](https://github.com/juspay/svelte-ui-components/commit/a1c1f15c2466ba776925a00267b418cec9e421cb))

## [2.97.2](https://github.com/juspay/svelte-ui-components/compare/2.97.2..2.97.1) - 14 July 2026

The component's own `.choicebox:not(.disabled):hover` rule (specificity 0,3,0)
outranked `.choicebox.selected` (0,2,0), so hovering a selected card repainted
it with the neutral hover border/fill until the cursor left. Exclude the
selected state from the hover rule (`:not(.selected)`) so the selected look
shows through on hover — no token juggling, correct by default for every
consumer. Adds a regression test that fails on the old rule (border drifts off
the selected blue on hover) and passes now.

- fix(choicebox): keep the selected look while hovering a selected card ([1585c28](https://github.com/juspay/svelte-ui-components/commit/1585c28983d843541d39a505a9e5f9e0246b6428))

## [2.97.1](https://github.com/juspay/svelte-ui-components/compare/2.97.1..2.97.0) - 14 July 2026

First-column (source) labels anchor `end` into the left margin, but were
budgeted only the bare 40px margin. Any real source label ("SESSIONS",
"Source A", "START") truncated to a few characters — and once the room fell
below an ellipsis, vanished entirely — at every width, not just narrow ones.
This is what made the User-Journey funnel look distorted/squeezed.

Mirror the existing sink gutter: reserve a capped (25%) left gutter sized from
the source-node labels, shift the diagram right by it, and budget the
first-column label at gutter+margin. Adds a discriminating regression test that
fails on the old code (renders "SES…") and passes now.

- fix(sankey): reserve a left gutter so first-column source labels render in full ([f6d3164](https://github.com/juspay/svelte-ui-components/commit/f6d31649ecee4619ac48c9d90c379ae0d4fa95a3))

## [2.97.0](https://github.com/juspay/svelte-ui-components/compare/2.97.0..2.96.2) - 14 July 2026

- Add testId prop + data-pw emission to 7 components missing it (BrandLoader,
GridItem, Icon, IconStack, InputButton, Status, Animations)
- Add data-pw to internal sub-elements across ~20 components (Table checkboxes,
BuiltinCell trends/thumbs/icons, Select indicators, BarChart bar-values,
Axis tick-labels, ChartTooltip, Legend, StatCard, Checkbox, Tooltip, etc.)
- Add data-checked/data-inside data attributes for state-based filtering
without CSS classes (Select indicators, BarChart bar-values)
- Add testId to all column definitions in table demo page
- Convert all 24 test files from .locator('.classname') to getByTestId()/
getByRole()/evaluate() — zero .locator() calls remain
- Add data-pw="page-body" to app.html body element
- Add testId?: string to TableTagArrayCellItem type

## [2.96.2](https://github.com/juspay/svelte-ui-components/compare/2.96.2..2.96.1) - 14 July 2026

Adds a usePortal prop to Table, passed through BuiltinCell to the in-cell &lt;Select&gt; (type:'select' columns) and &lt;Menu&gt; (type:'action-group' / 'popup-menu' columns). When set, those dropdowns portal to document.body and position fixed (via the Select/Menu usePortal shipped in 2.96.1), so a table's own scroll/overflow container can no longer clip them. Defaults to false (in-flow, unchanged). Demo + Playwright spec verify the in-cell dropdown escapes an overflow:hidden frame, and a control confirms the default table keeps its dropdown in-flow.

- fix(Table): thread usePortal to in-cell Select/Menu so they escape the table's overflow ([4f8d5c3](https://github.com/juspay/svelte-ui-components/commit/4f8d5c37f0ffc2b4a07f140d600ce7ba75f15b11))

## [2.96.1](https://github.com/juspay/svelte-ui-components/compare/2.96.1..2.96.0) - 13 July 2026

Like Select, the menu panel rendered in-flow (position: absolute inside .menu-container), so any ancestor with overflow: hidden or a scroll container (e.g. a table cell) clipped it. Add an opt-in usePortal prop that relocates the panel to document.body and positions it fixed at the resolved placement corner — mirroring the chart-tooltip portal pattern — repositioning on scroll/resize. The four corner cases (and auto) are computed in JS since the CSS corner anchoring is meaningless once the node leaves .menu-container. Defaults to false, preserving in-flow behaviour, the existing pixel-exact placement tests, and any consumer CSS targeting .menu-dropdown via an ancestor selector. Placement math is a pure, unit-tested helper; a Playwright spec proves the panel escapes an overflow:hidden box.

- fix(Select): add usePortal so the dropdown escapes overflow-clipping ancestors ([f649f2b](https://github.com/juspay/svelte-ui-components/commit/f649f2bdb71e172a7d182ede25fff4e124b01196))
- fix(Menu): add usePortal so the dropdown escapes overflow-clipping ancestors ([af4b7a5](https://github.com/juspay/svelte-ui-components/commit/af4b7a596a9d1f729abc783faf3987686d69d0f3))

## [2.96.0](https://github.com/juspay/svelte-ui-components/compare/2.96.0..2.95.1) - 12 July 2026

The inline hex value input hardcoded a 38px height and never transformed the
hex text, so a consumer embedding the picker as a compact boxed config field
could not shrink the control or show uppercase hex to match a native-input
look. Expose two ColorPicker CSS variables with backward-compatible defaults:
--color-picker-input-height (38px) and --color-picker-value-text-transform
(none). The latter is threaded through a new --input-text-transform variable
on Input, because a bare text-transform on the field wrapper does not reach
the form-control's own text.

- feat(ColorPicker): expose --color-picker-input-height and hex text-transform ([eeaa993](https://github.com/juspay/svelte-ui-components/commit/eeaa993d27a464cffad247371774a3e0732f3297))

## [2.95.1](https://github.com/juspay/svelte-ui-components/compare/2.95.1..2.95.0) - 12 July 2026

- refactor(Table): keep sort chevron asset color-agnostic like every other icon — currentColor-only SVG, two-tone state painting via component CSS, one shared pair asset ([3d3e58c](https://github.com/juspay/svelte-ui-components/commit/3d3e58ccb1b83c05da0009519e676c3181fd5ca1))

## [2.95.0](https://github.com/juspay/svelte-ui-components/compare/2.95.0..2.94.0) - 12 July 2026

- feat(Table): two-tone sort chevron states from the design system — solid pair assets + active/inactive/hover color vars ([13c6d33](https://github.com/juspay/svelte-ui-components/commit/13c6d33352a48f38bb32eea5336a771920fecadd))

## [2.94.0](https://github.com/juspay/svelte-ui-components/compare/2.94.0..2.93.0) - 11 July 2026

- feat(Table): icon-capable button cells — TableButtonCellData.iconUrl + ariaLabel, icon-only ghost rendering ([1f4a91d](https://github.com/juspay/svelte-ui-components/commit/1f4a91d3dfdd531de3a9292989aef2cd3101eb92))

## [2.93.0](https://github.com/juspay/svelte-ui-components/compare/2.93.0..2.92.0) - 11 July 2026

- feat(Table): JSON-safe leading icon for input cells via TableInputCellData.iconUrl ([b8e75a3](https://github.com/juspay/svelte-ui-components/commit/b8e75a3e4acb05e4b3161a55fe46b37ccf99b444))

## [2.92.0](https://github.com/juspay/svelte-ui-components/compare/2.92.0..2.91.1) - 11 July 2026

- feat(Table): opt-in column highlight via TableColumn.highlighted ([8f023b9](https://github.com/juspay/svelte-ui-components/commit/8f023b985cfd4e0f47a88bc16635e16231d6f4c7))

## [2.91.1](https://github.com/juspay/svelte-ui-components/compare/2.91.1..2.91.0) - 11 July 2026

A toast is a transient status overlay positioned above page content, and
it frequently lands over drawer/footer CTAs. Until now its whole box was
a hit target for its entire duration, so clicks aimed at the controls
beneath it silently died — surfaced as flaky/broken e2e flows (a
save-success toast covering a drawer's 'Add products' button swallowed
the click that should have opened the product picker) and the same dead
clicks for real users.

The root now defaults to pointer-events: none via the new
--toast-pointer-events token; the close button re-enables its own hit
area (pointer-events: auto), and consumers rendering actionable
bottomContent can opt the whole toast back in with
--toast-pointer-events: auto.

Verified: 94/94 unit tests, svelte-check 0 errors; live demo probe —
the toast computes pointer-events: none and elementFromPoint at the
toast's own center resolves to the button beneath it.

- fix(Toast): click-through by default — stop swallowing clicks meant for content beneath ([19be794](https://github.com/juspay/svelte-ui-components/commit/19be79458611201955e9e7b99f62a698b82498f1))

## [2.91.0](https://github.com/juspay/svelte-ui-components/compare/2.91.0..2.90.1) - 11 July 2026

column.align lands on the td as text-align, which flex layouts ignore —
an aligned column's builtin cells (compare, two-line-text, text-tag,
icon-label, image-two-line-text, tag-array, avatar-stack) stayed pinned
left: column-flex builtins stretch children, row-flex builtins pack to
flex-start. BuiltinCell now mirrors the column alignment as a modifier
class (builtin-align-end / builtin-align-center) that column-flex
containers translate into align-items and row-flex containers into
justify-content — the same idiom the header already uses for its
justify-content mapping.

The table body also gains a first-class horizontal scroller
(.table-scroll) inside a scrim shell (.table-scroll-shell): on narrow
viewports columns clip behind the scroll with no visual hint that more
exist. A scroll/resize-tracked action toggles scrollable-left/right
classes that fade tokened edge scrims in (--table-scroll-scrim-width,
--table-scroll-scrim-color); pointer-events: none keeps cells under the
fade clickable and z-index 2 paints above sticky headers. Scrims sit on
the shell (table-height inside a vertical scroller), so isTableScrollable
consumers keep their exact scroll behavior; the paginator footer stays
outside the shell and never gets tinted.

Verified on this base: 94/94 unit tests, svelte-check 0 errors, demo
probe — aligned compare cell reports align-items: flex-end with the
trend pill flush to the primary line (0px right gap), and the scrim
shell carries scrollable-left+scrollable-right with both edge scrims at
opacity 1 mid-scroll.

- feat(Table): align-aware builtin cells and horizontal-scroll edge scrims ([2e402ab](https://github.com/juspay/svelte-ui-components/commit/2e402abb83080c64ca1a217a3d150378e48bf311))

## [2.90.1](https://github.com/juspay/svelte-ui-components/compare/2.90.1..2.90.0) - 10 July 2026

Tooltip action: the renderless use:tooltip bubble was centred with a bare
translate(-50%) and no edge handling — triggers near a viewport edge spilled
the bubble off-screen (or shrank it into a skinny text column against the
right edge), and there was no flip when the preferred side had no room. The
bubble is now measured after mounting, clamped to the viewport (8px margin),
flipped to the opposite side when needed, and its arrow stays anchored over
the trigger in bubble-local pixels.

PieChart: crowded pies rendered every slice label unconditionally at its
mid-angle — stacked unreadable text that ran past the chart box. Labels now
measure (canvas-backed shared helper), truncate to the room the chart has,
gate inside-labels on wedge arc length, and de-collide with larger slices
winning; dropped text stays on the tooltip and aria-label.

SankeyChart: swap the per-character width estimates for the shared
measureText helper — the estimator both over-reserved the right label gutter
(dead canvas) and under-budgeted some labels; reservations and truncation are
now exact on the client (SSR keeps the heuristic fallback).

Demos: crowded 24-slice pie, all-zero pie, edge-clamp tooltip triggers.
Specs (negative-controlled: 4 defect tests fail on the unfixed components):
pie-label-engine (3), tooltip-action-clamping (3); full suite 118/118.

- fix(Tooltip,PieChart,SankeyChart): action viewport clamping, pie label engine, measured widths ([a513907](https://github.com/juspay/svelte-ui-components/commit/a51390772527a78768d104620ebd92edf49ce77a))

## [2.90.0](https://github.com/juspay/svelte-ui-components/compare/2.90.0..2.89.2) - 10 July 2026

The dropdown has always been hard-anchored to the trigger's bottom-left
corner; consumers whose trigger sits in a table's trailing actions column
(the row-actions pattern) had to tunnel right-anchoring in from outside,
and nothing guarded against the panel overflowing the viewport or being
opened from the last visible row.

placement adds the four fixed corners plus 'auto'. The default stays
'bottom-left' and keeps flowing through the --menu-dropdown-top /
--menu-dropdown-left consumer tokens, so existing consumers render
byte-identically. 'auto' renders the panel hidden for one tick, measures
it against the viewport, and picks the corner that fits: right-anchored
when the panel would overflow the right edge, flipped above the trigger
when there is no room below but enough above (8px viewport margin).

Covered by tests/menu-placement.test.ts against the component demo page:
default unchanged, bottom-right anchoring, corner-pinned auto flip,
auto stay-at-default with viewport room, and an omitted-placement
regression guard for existing consumers.

- feat(Menu): add placement prop with viewport-aware auto anchoring ([c0a0ad3](https://github.com/juspay/svelte-ui-components/commit/c0a0ad3ede2453ebc5abac5c3fba06ba349a2932))

## [2.89.2](https://github.com/juspay/svelte-ui-components/compare/2.89.2..2.89.1) - 10 July 2026

SankeyChart: replace the flat 7.2px/char label estimate with per-character-class
width estimation, budget middle-column labels for dataLabelOffsetX, de-collide
labels per column (smaller-value node yields; full text stays on the hover
title), and render labels in a second pass so bars can never over-paint them.

Modal: cap .modal-content at the viewport for every size class via the new
--modal-max-height token (calc(100dvh - 32px) default) and let .slot-content
shrink (min-height: 0, tokened) so internal scroll engages — a size height var
overridden to fit-content no longer grows past the screen and pushes the
footer and bottom rounding off.

Tabs: hold the edge fade fully transparent for --tabs-fade-solid (8px default)
before ramping to opaque, so a clipped tab label cannot linger as a faint
glyph fragment beside the scroll arrows.

Each fix ships a demo section and a Playwright spec, verified as a negative
control against the unfixed components (4 defect tests fail) and green after
(6/6; full suite 112/112).

- fix(SankeyChart,Modal,Tabs): label collision engine, modal viewport cap, fade solid zone ([c772a07](https://github.com/juspay/svelte-ui-components/commit/c772a07c8a17373323387ea2ac3cd0d55f636e33))

## [2.89.1](https://github.com/juspay/svelte-ui-components/compare/2.89.1..2.89.0) - 9 July 2026

- feat(Table,Tooltip): opt-in header tooltip icons, row-number label, and configurable cell alignment/width ([86e0731](https://github.com/juspay/svelte-ui-components/commit/86e073189befe0f82d98437b0687e555d7777bed))
- fix(ci): run lint on release pull requests ([dc5b89b](https://github.com/juspay/svelte-ui-components/commit/dc5b89b6ffccdfb48df96b3dc72a2a96b210e9c0))

## [2.89.0](https://github.com/juspay/svelte-ui-components/compare/2.89.0..2.88.0) - 8 July 2026

The 2.88.0 originalIndex work covered the cell callbacks (onMenuAction/
onToggle/onSelect/onInput/onButtonClick/onPrimaryAction + the cell snippet)
but not the two other row-resolving callbacks: onRowClick and the checkbox
selection getRowId. Both still handed consumers only the sorted DISPLAY
index, so a consumer indexing its own pre-sort rows array (or resolving a
row id positionally) acted on the wrong row once the table was sorted —
the same class of bug, just on the row-click and selection paths.

Append originalIndex (the row's index in the consumer-supplied rows,
pre-sort/pre-filter) as a trailing arg to both, resolved via the existing
reference-keyed originalIndexByRow map. getRowId previously received the
sorted stableIndex, which mis-addressed the consumer's array under sort;
it now also gets the true originalIndex. Backward compatible (appended
arg). The reference-preservation the map relies on is already proven by
src/lib/Table/original-index.test.ts (both new callbacks use that map).

Verified: pnpm lint clean (prettier + eslint), svelte-check 533 files 0
errors, vitest 94 passed, build and build:wc green.

- feat(Table): pass sort-stable originalIndex to onRowClick and getRowId ([8778e12](https://github.com/juspay/svelte-ui-components/commit/8778e1286f03d2a40a20f54072c4ca20b1959671))

## [2.88.0](https://github.com/juspay/svelte-ui-components/compare/2.88.0..2.87.0) - 8 July 2026

Release run 28921069486 for 2d6899e (the originalIndex minor) failed at
'pnpm lint' — 'prettier --check src' rejected src/lib/Table/Table.svelte
because appending {originalIndex} pushed the &lt;BuiltinCell&gt; self-closing tag
past prettier's printWidth. Reflow the attributes onto separate lines. Pure
formatting, zero behavior change.

Typed feat deliberately: the release workflow derives the version bump from
the tip commit alone (release.yml: git log -1), and the unreleased content
on release is the originalIndex feature — this commit carries its minor bump
(2.87.0 -&gt; 2.88.0). A fix/chore tip would wrongly cut a patch.

Verified: pnpm lint clean (prettier + eslint), svelte-check 533 files 0
errors, vitest 94 passed, Playwright 106 passed, build and build:wc green.

- feat(Table): pass sort-stable originalIndex to cell callbacks ([2d6899e](https://github.com/juspay/svelte-ui-components/commit/2d6899ea43994fee2d0bd4e004dc4be83281b335))
- feat(Table): prettier-reflow BuiltinCell tag to unblock the originalIndex release ([ba947fa](https://github.com/juspay/svelte-ui-components/commit/ba947fa1dc1601e9f51a39f11861a3eb0e2aef0a))

## [2.87.0](https://github.com/juspay/svelte-ui-components/compare/2.87.0..2.86.0) - 7 July 2026

Brings BarChart, LineChart, AreaChart, FunnelChart, and DualAxisBarChart
up to Highcharts conventions for label rendering, tooltip positioning,
and interaction, while preserving current visual designs. All changes
are additive to the public API.

Shared _chart primitives:
- measure.ts: cached text measurement (measureText)
- labels.ts: Highcharts-style label placement chain (outside -&gt; inside
with contrast+outline -&gt; hidden), collision detection, truncation
- geometry.ts: computeAutoLayout for measured margins from tick-label
widths, plus stacked-value helpers
- tooltipPosition.ts: anchored tooltip positioning with flip-then-clamp
behavior at viewport/container edges
- scales.ts: integer tick mode for category axes (prevents fractional
tick steps from producing duplicate/misaligned labels)
- interactions.ts: shared pointer helpers (pointerPositionIn,
dismissOnOutsidePointerDown) used by all five charts
- Axis.svelte: auto tick rotation (-45deg) and thinning under crowding
- ChartTooltip.svelte: v2 with portal-mode support (tooltipPortal prop)
- Legend.svelte: toggleable legend items with aria-pressed

Per-chart behavior:
- BarChart: overlap-safe value labels (outside/inside flip), auto
layout, interactive legend with rescale, pointer/keyboard/touch
interactions, tooltip clamping
- LineChart: shared tooltip mode across series, hover halo, category
tick formatting via integer ticks, interactive legend (hidden series
excluded from axis domain calculation so scales rescale)
- AreaChart: auto layout, point label placement (respects
stackNormalize so labels don't show raw values next to a
percent-scaled chart), minHeight/maxHeight clamping
- FunnelChart: dynamic label-area sizing, fitted category/value labels
with a full -&gt; compact -&gt; hidden crop chain, theme-aware connector
color, cursor-follow tooltip (documented exception for extent-type
charts)
- DualAxisBarChart: sign-dependent bar rounding, shared tooltip anchor
computation across dual axes, keyboard-focusable category hit areas
with aria-labels that include series values (not just category name)

Dark/light mode: all new chart tokens resolve through CSS light-dark()
with override support; no light-dark()/var() in SVG presentation
attributes (kept to style= where required).

Deliberate improved-defaults (documented in each component's props
table): hideLegendBelow defaults to 360 (legend sheds on narrow
charts); LineChart sharedTooltip defaults on for multi-series;
AreaChart now clamps height at 420px for LineChart parity.

Also repairs three stale test/demo contracts that pre-dated this
branch: the tooltip demo page now exposes the tooltip-container test
hook its spec expects, the delayed-tooltip spec scrolls its
below-the-fold trigger into view before raw mouse moves, and the
date-range-picker toggle spec locates the trigger by stable class
instead of an accessible name that flips while open.

Testing: 92 Vitest unit tests across the shared _chart primitives
plus a Playwright functional suite (tests/chart-behaviors.spec.ts)
covering interactive legend rescale, label flip, tooltip clamping,
axis crowding/thinning, shared-tooltip hover, keyboard activation,
and touch tap/dismiss. Full suite green: 92/92 functional tests.

- feat(charts): Highcharts-grade label, tooltip, and interaction alignment ([a5dcc0f](https://github.com/juspay/svelte-ui-components/commit/a5dcc0f9ac690dd10a5705a731555db68fa439c3))

## [2.86.0](https://github.com/juspay/svelte-ui-components/compare/2.86.0..2.85.0) - 7 July 2026

Sheet only supported an edge-to-edge slide-in panel (top/bottom always
0), a coupled overlay (no dimming meant no click-to-dismiss either, since
pointer-events:none blocks the click that would trigger it), and a naive
scroll lock that unconditionally clears document.body.style.overflow on
close — breaking if a second Sheet is still open. All three blocked a
consumer's floating account-menu panel from being expressed with Sheet
at all, forcing a hand-rolled backdrop+panel instead.

- Add --sheet-top/-right/-bottom/-left, all defaulting to the previous
hardcoded values (0/0/0/0 for left+right, 0/0 left+right for top+bottom)
so an unconfigured Sheet renders unchanged. Overriding one turns the
edge-to-edge panel into a floating anchored one (e.g. --sheet-bottom:
auto sizes the panel to its content instead of stretching to the
viewport edge).
- Add `dismissOnOutsideClick`, independent of `showOverlay`'s visual
tint, defaulting to mirror `showOverlay` (so behavior is unchanged
unless set explicitly). Set it `true` alongside `showOverlay={false}`
for a fully transparent but still click-dismissible overlay.
- Make the scroll lock reference-counted at module scope: only the
first open sets `overflow: hidden`, only the last close clears it.

- feat(Sheet): anchor position tokens, dismissible invisible overlay, ref-counted scroll lock ([5986d04](https://github.com/juspay/svelte-ui-components/commit/5986d044952d6f7b9845a9383710788bdf050eee))

## [2.85.0](https://github.com/juspay/svelte-ui-components/compare/2.85.0..2.84.1) - 7 July 2026

statusIcon only accepted an image src, so a consumer needing an
animated status (e.g. LottiePlayer for success/failure/in-progress)
had no way to express it — the component always rendered a static
&lt;Img&gt;.

Add an optional `icon` snippet that, when provided, renders instead of
the default image. statusIcon is now optional (it already had a
runtime default; the type just hadn't caught up) since it becomes
irrelevant once `icon` is supplied.

- feat(Status): add an icon snippet slot for custom media ([d94ff2a](https://github.com/juspay/svelte-ui-components/commit/d94ff2a23c73f212b5333fe60120a82ec7387ff7))

## [2.84.1](https://github.com/juspay/svelte-ui-components/compare/2.84.1..2.84.0) - 7 July 2026

Clicking the label fired handleClick (flipping the Svelte state) and then the
label's default activation dispatched a synthesized click that re-toggled the
hidden native input afterwards — its propagation was stopped but not its
default. The rendered box then showed checked while input.checked was false,
breaking form values, :checked-based CSS, and test-state probes.

preventDefault on the label click makes handleClick the single owner of the
state; the native input's checked property now always follows the rendered
box. Adds regression tests covering pointer and keyboard toggling.

- fix(Checkbox): keep the native input's checked state in sync on label clicks ([ee2b616](https://github.com/juspay/svelte-ui-components/commit/ee2b61666be2643d750d9de01e5a4a4f6c579542))

## [2.84.0](https://github.com/juspay/svelte-ui-components/compare/2.84.0..2.83.0) - 7 July 2026

The .content row only exposed padding/justify-content/visibility, so a
consumer needing a fixed-height toolbar with a vertically-centered or
width-clamped content row had no way to do it short of selecting the
library's internal .content class by name from a theme sheet.

Add --toolbar-content-width/-height/-max-width/-margin, all defaulting
to the previous implicit values (auto/auto/none/0) so existing toolbars
render pixel-identical.

- feat(Toolbar): expose content-row geometry tokens ([a990e9d](https://github.com/juspay/svelte-ui-components/commit/a990e9d753584a9273c9a628218cffa4ea580e6a))

## [2.83.0](https://github.com/juspay/svelte-ui-components/compare/2.83.0..2.82.0) - 7 July 2026

The pulse variant animated opacity only, so consumers replacing hand-rolled
breathing loaders (scale + opacity) had no token to express the size
component. --loading-dots-pulse-min-scale drives the keyframe's resting
scale; the default of 1 keeps every existing consumer pixel-identical.

- feat(LoadingDots): add --loading-dots-pulse-min-scale token for breathing pulses ([2f81f62](https://github.com/juspay/svelte-ui-components/commit/2f81f629ca40306e382630bf428080a187caa745))

## [2.82.0](https://github.com/juspay/svelte-ui-components/compare/2.82.0..2.81.3) - 7 July 2026

OTP consumers need autocomplete="one-time-code" (WebOTP / SMS autofill) and
inputmode="numeric" (numeric keypad on mobile web) on the segmented fields.
FieldConfig's Pick excluded autoComplete and Input had no inputMode prop at
all, so exactly the use case SplitInput targets still required hand-rolled
segmented inputs.

- Input: new optional inputMode prop rendered as the native inputmode
attribute on both the input and textarea elements (no default — attribute
omitted when unset).
- SplitInput: FieldConfig gains autoComplete and inputMode; both pass through
to the per-field Input (autoComplete keeps the existing 'on' default).
- Demo: SMS-OTP example on /components/split-input; Playwright tests assert
the rendered attributes and that unconfigured fields keep prior defaults.

- feat(SplitInput): pass autoComplete and inputMode through FieldConfig ([142a4ff](https://github.com/juspay/svelte-ui-components/commit/142a4fff56dd3955be35f2b7616d9356962412b3))

## [2.81.3](https://github.com/juspay/svelte-ui-components/compare/2.81.3..2.81.2) - 7 July 2026

In horizontal orientation the Y axis carries category text, but the left
margin was a fixed 50px — any label wider than 40px (e.g. 'Submitted
Address' at ~97px in an 11px font) bled past the SVG edge and was clipped
by the page, unreadable on mobile.

The gutter now measures every category label via an offscreen canvas in
the axis tick font (CSS-var theming honoured) and grows to fit the widest
one. It never shrinks below the legacy 50px, so charts whose labels
already fit keep their exact current layout, and it caps at 45% of the
chart width so a pathological label cannot crush the plot. SSR and
canvas-less environments keep the legacy fixed gutter. Vertical
orientation and hidden-axis (28px) paths are untouched.

- fix(BarChart): size the horizontal category-axis gutter to the widest label ([26d2456](https://github.com/juspay/svelte-ui-components/commit/26d24563ee04e0b6098e41e61eb3a22f01823d06))

## [2.81.2](https://github.com/juspay/svelte-ui-components/compare/2.81.2..2.81.1) - 6 July 2026

## [2.81.1](https://github.com/juspay/svelte-ui-components/compare/2.81.1..2.81.0) - 5 July 2026

The legacy DataGrid select cells passed SelectProperties.itemTestId
through to the library Select, which stamps every option with
data-pw="{itemTestId}-{id}" (e.g. pp-PERCENTAGE in Lighthouse's Token
Advance grid). TableSelectCellData had no itemTestId field, so migrated
consumers silently lost per-option test ids — masked until the
downstream spec's earlier assertions were repaired.

TableSelectCellData.itemTestId -&gt; asSelectCellData pass-through -&gt;
BuiltinCell forwards to Select. Demo select cell wires
itemTestId='demo-tier-option'; regression test asserts both options
carry the prefixed data-pw. Suite: table-interactive-cells 10/10,
svelte-check 0 errors, lint clean.

- fix(Table): forward itemTestId through select cells so options keep their data-pw contract ([8c2faa8](https://github.com/juspay/svelte-ui-components/commit/8c2faa85b710aba33a0d2358cfc6a00fa566b971))

## [2.81.0](https://github.com/juspay/svelte-ui-components/compare/2.81.0..2.80.10) - 5 July 2026

Release run 28739242928's predecessor (28739242926) for the keyed-column
train (47204c1) failed at 'pnpm lint', and the prettier failure
short-circuited two eslint errors that would fail the next run too. All
three are fixed here with no behavior change:

- table demo page: prettier-format one over-long line
- Table.svelte: selectableRowIds narrows via flatMap instead of a type
predicate ('rowId is string') and an explicit 'undefined' comparison,
both banned by no-restricted-syntax
- BuiltinCell.svelte: the input cell's dataType narrows through a new
asInputDataType helper in cellData.ts instead of an 'as' assertion
(consistent-type-assertions)

Typed feat deliberately: the release workflow derives the version bump
from the tip commit alone, and the unreleased content on release is the
keyed-column feature train — this commit carries its minor bump.

Verified: pnpm lint clean, svelte-check 518 files 0 errors, vitest 51/51,
Playwright 23/23 on the two affected table suites, build and build:wc
green.

- feat(Table): cut the keyed-column minor release — lint fixes for the absorption train ([19a521f](https://github.com/juspay/svelte-ui-components/commit/19a521f1354a43165fcb36eea6e329d71093d02b))

## [2.80.10](https://github.com/juspay/svelte-ui-components/compare/2.80.10..2.80.9) - 4 July 2026

- fix: prevent date picker clipping and restore month navigation ([7a42f64](https://github.com/juspay/svelte-ui-components/commit/7a42f649087c22c6a76ba2ad10ab5c217637fcee))

## [2.80.9](https://github.com/juspay/svelte-ui-components/compare/2.80.9..2.80.8) - 3 July 2026

The Release and Publish workflow fails lint on release HEAD: the clamp
added in #354 used $effect (banned by no-restricted-syntax) and a type
assertion (banned by consistent-type-assertions). Replace the $effect
with a mount action on the inline bubble and the assertion with
instanceof narrowing.

Also fix the clamp's blind spot: a left/right tooltip whose own side
overflows the viewport (e.g. a right-tooltip on a trigger near the right
screen edge) cannot be rescued by cross-axis shifting — flip it to the
opposite side instead, in both the inline and portal paths.

- fix(tooltip): make viewport clamp lint-compliant and flip on main-axis overflow ([0eed291](https://github.com/juspay/svelte-ui-components/commit/0eed2911594f4aa9a3050305cdcecc4b78d1bbd9))

## [2.80.8](https://github.com/juspay/svelte-ui-components/compare/2.80.8..2.80.7) - 3 July 2026

## [2.80.7](https://github.com/juspay/svelte-ui-components/compare/2.80.7..2.80.6) - 3 July 2026

SankeyChart: final-column labels render to the right of their node, but the
layout spanned the full inner width, leaving only the 40px margin — real
funnel labels ("PARTIALLY_FAILED (1,234)") ran past the svg edge and
clipped. Reserve a capped right gutter sized from the sink-node labels, lay
the diagram out in the remaining width, and budget final-column truncation
against the actual gutter instead of colWidth.

Button: white-space: var(--button-white-space, nowrap) on .button-el — a
label growing from "Select" to "Select (1)" used to soft-wrap to two lines
and jitter the surrounding layout; consumers wanting multi-line buttons opt
back in via the var.

Menu: new selectedValue prop — opening focuses the selected option instead
of always parking the focus highlight on item 0 (which made the first
option look permanently selected in listbox uses), the matching item gets a
stylable menu-item-selected class (--menu-item-selected-background-color /
-color), and listbox aria-selected reflects the real selection instead of
transient focus.

- fix(sankey,button,menu): QA-blocker fixes from the Breeze dashboard triage ([1f83c5e](https://github.com/juspay/svelte-ui-components/commit/1f83c5e70f97aea94694d595c9d238ad1c240460))

## [2.80.6](https://github.com/juspay/svelte-ui-components/compare/2.80.6..2.80.5) - 2 July 2026

- fix(components): StatCard tooltip icon affordance + checkbox alignment, chart max-height defaults, bar chart edge margins, delta color inherit ([bb2b660](https://github.com/juspay/svelte-ui-components/commit/bb2b6605def6e4481400e3abbdae8dc787afa989))
- fix(modal,toast): inline header/toast icon SVGs so currentColor inherits ([ab41494](https://github.com/juspay/svelte-ui-components/commit/ab4149470b304725a8dac719e07e3cb632bcdcc2))
- fix(menu,icon): inline SVG item/URL icons so currentColor inherits text colour ([447d221](https://github.com/juspay/svelte-ui-components/commit/447d221bb43cb5d3bbb49a6d2e70d2083077f6e7))
- style(modal): prettier formatting for inline header Img tags ([12f36d1](https://github.com/juspay/svelte-ui-components/commit/12f36d11d20402f145cbb4381dbfe5492b2fa44b))
- fix(table): sort separator-formatted numeric strings by value, not lexicographically ([83308fb](https://github.com/juspay/svelte-ui-components/commit/83308fb225994bdeb919a5dd3a62492aebbbf6ab))

## [2.80.5](https://github.com/juspay/svelte-ui-components/compare/2.80.5..2.80.4) - 1 July 2026

- ChartTooltip: measure the tooltip and its positioned container and flip the tooltip to the left of the cursor (and clamp vertically) when it would overflow, so it is no longer clipped by an overflow:hidden edge — fixes the donut tooltip clipping on narrow/mobile widths (BZ-4294).
- BarChart: skip the horizontal value label when its sub-band is thinner than the ~11px label, so cramped multi-series charts hide labels instead of overlapping them into an unreadable cluster; consumers restore labels via more chart height / minBandWidth (BZ-4294).

## [2.80.4](https://github.com/juspay/svelte-ui-components/compare/2.80.4..2.80.3) - 1 July 2026

- Combobox.svelte: exactMatch undefined -&gt; null (repo no-restricted-syntax rule was failing the release build)
- src/routes/components/{combobox,select}/+page.svelte: prettier drift that broke prettier --check src on release
- ChartTooltip/Legend swatch: border-radius 2px -&gt; var(--chart-swatch-radius, 2px) (overridable, 2px default = no visual change)

- feat(Combobox): add multi-select, create, action & limit (reuse, no new component) ([510d2b2](https://github.com/juspay/svelte-ui-components/commit/510d2b2a6b48e4488c7c31e9e4b2bf42e8024fbe))
- feat(Input): add textarea ergonomics (rows, auto-resize, resize, counter) ([8dfe166](https://github.com/juspay/svelte-ui-components/commit/8dfe166abde2d28910d724f9b5d2a06e492cfe09))
- docs(Input): demo horizontal and both resize options ([3a84a48](https://github.com/juspay/svelte-ui-components/commit/3a84a4841fe8248edd83f66771b40e2bb2f6930b))

## [2.80.3](https://github.com/juspay/svelte-ui-components/compare/2.80.3..2.80.2) - 30 June 2026

Wraps two over-length lines (an SVG path and a paragraph) flagged by 'prettier --check src'. Formatting only — no behaviour change. Restores a green 'pnpm run lint' on release.

- feat(Button): add variant, size, icon-only, link & loading API ([f999dc3](https://github.com/juspay/svelte-ui-components/commit/f999dc3b804380c77ecc56ab7e3f6b89ba989659))
- fix(DualAxisBarChart): add minBarHeight, margin, and tooltipPortal props ([8717450](https://github.com/juspay/svelte-ui-components/commit/87174509f5c68757dabc57a0adc57f48ebd31991))
- fix(Button): address PR review feedback ([e9b94cc](https://github.com/juspay/svelte-ui-components/commit/e9b94cce52937e68149f61b282f0c4fcba521f19))
- chore: prettier-format button demo page ([dc36907](https://github.com/juspay/svelte-ui-components/commit/dc36907fd4663870fd49cedb8412654d6e23a404))

## [2.80.2](https://github.com/juspay/svelte-ui-components/compare/2.80.2..2.80.1) - 29 June 2026

The Release-and-Publish workflow has failed on every release-branch push since
the KeyValue component landed, because `pnpm lint` errors on two files:
prettier formatting on KeyValue.svelte + key-value/+page.svelte, and a
no-restricted-syntax eslint error on `value === undefined` in isEmptyValue.
Apply prettier and replace the null/undefined check with the idiomatic
`value == null` (behaviourally identical). This unblocks publishing 2.80.2
(which carries the StatCard subtitle fix from #341).

- feat(KeyValue): add read-only label/value detail grid component ([979b26d](https://github.com/juspay/svelte-ui-components/commit/979b26d9c75587dde01b591dcf0ed463753c2fb7))
- fix(StatCard): render subtitle alongside rows ([f31cc1d](https://github.com/juspay/svelte-ui-components/commit/f31cc1da39b63753680156f5d586bb4df054dbf3))
- fix(KeyValue): satisfy lint to unblock the release pipeline ([71c8250](https://github.com/juspay/svelte-ui-components/commit/71c82503f084afde0e4ae0b70882b1842b3632af))

## [2.80.1](https://github.com/juspay/svelte-ui-components/compare/2.80.1..2.80.0) - 29 June 2026

## [2.80.0](https://github.com/juspay/svelte-ui-components/compare/2.80.0..2.79.0) - 28 June 2026

- feat: add rowsDirection to StatCard for horizontal section layout ([26316fb](https://github.com/juspay/svelte-ui-components/commit/26316fb9fff33264e557155a6cf9e883bef4d0b5))

## [2.79.0](https://github.com/juspay/svelte-ui-components/compare/2.79.0..2.78.0) - 28 June 2026

- feat: extend StatCard with rows/breakdown/checkbox/slots; add ProportionBar component ([6e02b08](https://github.com/juspay/svelte-ui-components/commit/6e02b080d421eae8e77c78d64972355f5d6ac816))

## [2.78.0](https://github.com/juspay/svelte-ui-components/compare/2.78.0..2.77.0) - 28 June 2026

- feat: add carousel test ids ([4c9ca57](https://github.com/juspay/svelte-ui-components/commit/4c9ca576daa67b7cc701c7c49ca4605859b87a28))

## [2.77.0](https://github.com/juspay/svelte-ui-components/compare/2.77.0..2.76.1) - 28 June 2026

- feat: add showSelectAll to Select (multi-select select-all with indeterminate) ([d834f8b](https://github.com/juspay/svelte-ui-components/commit/d834f8b540a3dcd2fd30178ead52c53594282bc0))

## [2.76.1](https://github.com/juspay/svelte-ui-components/compare/2.76.1..2.76.0) - 25 June 2026

- fix: input field width in input button component ([faeee72](https://github.com/juspay/svelte-ui-components/commit/faeee72e1ab71bc7a30a411021f44dd739f33e53))

## [2.76.0](https://github.com/juspay/svelte-ui-components/compare/2.76.0..2.75.0) - 25 June 2026

New components:
- DeltaIndicator: directional trend badge (arrow + colored %), invertColors for lower-is-better metrics, custom format, neutral threshold (clamped non-negative)
- DualAxisBarChart: two independent Y-axes sharing a categorical X-axis; per-series axis (0/1) and render type (column/line)
- FunnelChart: pure-SVG horizontal funnel with trapezoidal drop-off connectors, hover expansion, value+percentage labels

Chart extensions (all backward-compatible):
- BarChart/LineChart/PieChart: onChartReady hook + shared ChartHighlightAPI (declarative highlightedIndex + imperative highlight(index|null)), so an external orchestrator (e.g. voice-narration sync) can drive point/slice highlighting without a charting-library instance on the DOM
- BarChart: normaliseToFirstPoint, topN + overflowLabel, hideBarGraphics
- LineChart: xAxisCategories (string-category X-axis), showArea + areaGradient
- PieChart: changePercentage delta badge rendered via DeltaIndicator, changeInvertColors
- SankeyChart: minLinkWidth, dataLabelOffsetX, disableDimOnHover

Also:
- Fix GitHub Pages prerender failure: breadcrumb demo links now use the $app/paths base, so adapter-static prerender succeeds under BASE_PATH
- Address review feedback: advance Sankey node spacing by the clamped (minLinkWidth) height; guard DualAxis data/categories length mismatch in both bar and line geometry; treat all-zero FunnelChart data as empty; gate PieChart tooltip on hover (not programmatic highlight); kebab-case custom-element attributes on DeltaIndicator

Demos added under /components for each; check + lint + build clean.

- feat: add chart-system — DeltaIndicator, DualAxisBarChart, FunnelChart + chart highlight hook ([40f5449](https://github.com/juspay/svelte-ui-components/commit/40f5449d257d81f6ccc22bb9d43f9a7a0882a923))

## [2.75.0](https://github.com/juspay/svelte-ui-components/compare/2.75.0..2.74.0) - 24 June 2026

- feat(IframeViewer): add iframe embed with origin-allowlisted postMessage ([eb40be5](https://github.com/juspay/svelte-ui-components/commit/eb40be506ff17eace2d81de1ebb618012fb637dc))

## [2.74.0](https://github.com/juspay/svelte-ui-components/compare/2.74.0..2.73.2) - 22 June 2026

The Modal content area (.slot-content) had no padding and exposed no
variable to control it, unlike the header (--modal-header-padding) and
footer (--modal-footer-padding). Consumers had to reach into the internal
.slot-content class to inset the body.

Add padding: var(--modal-content-padding, 0) so the body padding is
controllable via a token, mirroring header/footer. Defaults to 0, so
existing modals are unaffected; consumers opt in by setting the variable.

- feat(Modal): add --modal-content-padding token for slot-content body padding ([7e57778](https://github.com/juspay/svelte-ui-components/commit/7e57778cea78325d496b8e3414a174c7a25ec7f1))

## [2.73.2](https://github.com/juspay/svelte-ui-components/compare/2.73.2..2.73.1) - 22 June 2026

handlePreset set draftStart/draftEnd from the preset's getValue() (which
carries the correct time-of-day for intraday presets such as 'Last 30
minutes' / 'Last 12 Hours') but never updated startTimeDisplay/endTimeDisplay.
On Apply, applyTimeDisplay folds the stale display strings back onto the draft
dates, overwriting the preset's time with the previous value (often 12:00 AM),
so the committed range starts at midnight instead of the preset's window.

Reseed startTimeDisplay/endTimeDisplay from the preset's start/end when
showTimeSelection is active, mirroring openPicker's seeding logic.

- fix(DateRangePicker): reseed time inputs when a preset is selected ([9e9eb68](https://github.com/juspay/svelte-ui-components/commit/9e9eb6885f297ef327429fae9f6e7cff38faf3e3))

## [2.73.1](https://github.com/juspay/svelte-ui-components/compare/2.73.1..2.73.0) - 21 June 2026

The inline time-selection commits landed with two prettier --check violations
(a long-line `&lt;/span&gt;` wrap in DateRangePicker.svelte and a paragraph re-wrap in
the demo page), which failed the "Release and Publish" CI lint step and blocked
the 2.74.0 release. Apply `prettier --write`; `pnpm lint` is now clean.

- feat(DateRangePicker): add inline time-selection layout ([b68570e](https://github.com/juspay/svelte-ui-components/commit/b68570eaa7f694169989dfd866dca55248eba4f1))
- feat(DateRangePicker): expose timeSelectionLayout on the web component + document it ([81518e7](https://github.com/juspay/svelte-ui-components/commit/81518e7f26e0a48ff69acb5663ed1d294fd16883))
- style(DateRangePicker): fix prettier formatting to unblock release ([7bcc066](https://github.com/juspay/svelte-ui-components/commit/7bcc066726907ee331aba155a973d9ed973debd7))

## [2.73.0](https://github.com/juspay/svelte-ui-components/compare/2.73.0..2.72.0) - 18 June 2026

- feat(StatCard): add StatCard component with delta auto-inference and CSS-var theming ([3dd8f12](https://github.com/juspay/svelte-ui-components/commit/3dd8f12a2ee214d4812d7f613d5f6e5984c4cb36))

## [2.72.0](https://github.com/juspay/svelte-ui-components/compare/2.72.0..2.71.0) - 18 June 2026

- feat(AreaChart): gradientFill ([48ef662](https://github.com/juspay/svelte-ui-components/commit/48ef662226996696119b1b7982b62e3de3209dc6))
- build(deps): bump hono from 4.12.23 to 4.12.25 in /mcp ([3b95bd4](https://github.com/juspay/svelte-ui-components/commit/3b95bd45ab7f4b8faf4be2f1f14720b832c07ecd))

## [2.71.0](https://github.com/juspay/svelte-ui-components/compare/2.71.0..2.70.0) - 18 June 2026

- feat(DateRangePicker): add presetToggle to deselect the active preset ([e354bdc](https://github.com/juspay/svelte-ui-components/commit/e354bdc79966170c49240b8902a4937a8d2b141f))

## [2.70.0](https://github.com/juspay/svelte-ui-components/compare/2.70.0..2.69.3) - 18 June 2026

- feat(LottiePlayer): add Lottie animation player component ([b0003e4](https://github.com/juspay/svelte-ui-components/commit/b0003e434934df39a7374585d2d4b092f799d330))

## [2.69.3](https://github.com/juspay/svelte-ui-components/compare/2.69.3..2.69.2) - 18 June 2026

Since the trigger button became a toggle (it now both opens and closes the
panel), its static ariaLabel "Open date picker" misled screen-reader users —
they heard "Open date picker" even when the click would close the panel.

Make the label track the open state: "Close date picker" while open, "Open
date picker" while closed. Follow-up to the accessibility review on #320.

- fix(DateRangePicker): reflect open/closed state in the trigger aria-label ([0553ae8](https://github.com/juspay/svelte-ui-components/commit/0553ae8b116a8c00bfd543a14483a5e60470c160))

## [2.69.2](https://github.com/juspay/svelte-ui-components/compare/2.69.2..2.69.1) - 18 June 2026

The day grid used `grid-template-columns: repeat(7, 1fr)` while each cell is a
fixed 36px. Inside the 280px calendar that makes every column 40px, so the 36px
cells sat centred with a ~4px gap on each side. The range-start / in-range /
range-end backgrounds therefore never touched and the selected range rendered as
a row of disconnected boxes instead of one continuous pill (reported repeatedly,
most recently BZ-3893 / BZ-3742).

Size the columns to the cell instead and centre the grid (and the day-name header
to match) so adjacent day backgrounds are flush and the range reads as a single
continuous highlight again. Cell size stays configurable via --calendar-cell-size.

## [2.69.1](https://github.com/juspay/svelte-ui-components/compare/2.69.1..2.69.0) - 18 June 2026

The trigger's onclick only ever opened the panel, so clicking it a second time
re-ran the open path onto an already-open picker — the second click felt dead and
the only way to dismiss was to click elsewhere on the page (reported as BZ-3892).

Route the trigger through a togglePicker() that closes when already open and opens
otherwise. The outside-click handler is unaffected: on the closing click isOpen is
already false by the time it runs, so it no-ops.

## [2.69.0](https://github.com/juspay/svelte-ui-components/compare/2.69.0..2.68.0) - 18 June 2026

- feat(DateRangePicker): built-in date inputs + time-of-day selection ([8476b71](https://github.com/juspay/svelte-ui-components/commit/8476b7143816c4e87570904537bac13c5700dcb0))

## [2.68.0](https://github.com/juspay/svelte-ui-components/compare/2.68.0..2.67.0) - 18 June 2026

Footer primary/secondary buttons previously had no disabled-state escape hatches, so a disabled footer button fell back to its own --button-color as the disabled background (e.g. a disabled primary action stayed solid blue, only faded by the Button default opacity). Wire the library Button's --disabled-background-color / --disabled-text-color / --disabled-border / --disabled-opacity on .footer-primary-button and .footer-secondary-button to new --modal-footer-{primary,secondary}-button-disabled-* tokens. Defaults preserve current behaviour (button colour bg, button text, 0.4 opacity), so this is purely additive; consumers can now theme a clear disabled state (e.g. a grey bg).

- feat(Modal): expose disabled-state vars for footer buttons ([c2c7a09](https://github.com/juspay/svelte-ui-components/commit/c2c7a095e7fec1d618f364930fc27b69aa47bb07))

## [2.67.0](https://github.com/juspay/svelte-ui-components/compare/2.67.0..2.66.0) - 18 June 2026

The default multi-select indicator was a unicode glyph that rendered as a
tiny, unstyled square inconsistent with the design system. Replace it with a
presentational checkbox box (bordered square that fills accent-blue with a
checkmark when selected), reusing the bundled checkmark.svg and new themeable
--select-option-indicator-* CSS variables (size, border, border-radius,
background, checked-background, checked-border-color, check-size, check-color).

The box is presentational only — the option row owns selection and
aria-selected — so no focusable role=checkbox is nested inside role=option and
the click still toggles via the option. The optionIndicator snippet continues
to fully override the indicator (e.g. to restore the legacy glyph).

- feat(Select): render multi-select option indicator as a design-system checkbox box ([ee07a2e](https://github.com/juspay/svelte-ui-components/commit/ee07a2ea9b3cb6deefc7645b6a3c6972c242a1d5))

## [2.66.0](https://github.com/juspay/svelte-ui-components/compare/2.66.0..2.65.0) - 18 June 2026

Mirrors the existing --button-max-width hook (no fallback, so unset leaves
min-width at its initial value — fully backward-compatible). Lets consumers
set a button minimum width through the documented CSS-var API instead of
piercing the rendered &lt;button&gt; with a scoped :global(button){min-width}
override.

- feat(Button): add --button-min-width CSS variable ([d0b6ac6](https://github.com/juspay/svelte-ui-components/commit/d0b6ac68d5eee270086ea1768cd58dcbab925be3))

## [2.65.0](https://github.com/juspay/svelte-ui-components/compare/2.65.0..2.64.1) - 18 June 2026

## [2.64.1](https://github.com/juspay/svelte-ui-components/compare/2.64.1..2.64.0) - 17 June 2026

Completes the same-day fix (#310): that change made an explicit in-session click
match by label, but openPicker() still reset selectedPresetLabel to null on every
open and handleApply() cleared activePresetLabel, so re-opening the picker fell back
to isSameDay() matching and re-highlighted every preset sharing the committed day
(e.g. Today / Last 30 minutes / Last 12 Hours) at once.

Track a committedPresetLabel (seeded from initialPresetLabel, updated on each Apply,
cleared on Clear) and re-seed selectedPresetLabel from it when the picker opens. The
active highlight is now driven by label across the whole open/apply lifecycle instead
of date matching, so:
- initialPresetLabel highlights only the seeded preset on first open;
- re-opening after applying a preset re-highlights only that preset;
- a direct calendar click still clears it, reverting to date-based matching for
custom ranges (unchanged).

Adds a Playwright regression test (proven to fail on the prior behaviour) covering
both the re-open and initialPresetLabel cases.

- fix(DateRangePicker): keep the committed preset highlighted across the open cycle ([81b2753](https://github.com/juspay/svelte-ui-components/commit/81b2753cf8b7f550bcb27b867e67af0a3071c098))

## [2.64.0](https://github.com/juspay/svelte-ui-components/compare/2.64.0..2.63.1) - 17 June 2026

Add a presetCheckmark prop (default false). When enabled, the active preset in the
sidebar shows a trailing checkmark (reusing assets/checkmark.svg, currentColor) in
addition to its highlighted background — restoring the selection affordance some
consumers had before migrating to this component. Opt-in so existing layouts are
unchanged; the tick slot and size/colour/gap are themeable via --drp-preset-check-*.
Includes a demo section and a Playwright test.

- feat(DateRangePicker): opt-in checkmark on the active preset ([9907a55](https://github.com/juspay/svelte-ui-components/commit/9907a55380ffb9e6dee9610c701788c7e9474156))

## [2.63.1](https://github.com/juspay/svelte-ui-components/compare/2.63.1..2.63.0) - 17 June 2026

Add a same-day-presets demo (Today / Today morning / Today evening — all on the
same calendar day) and a Playwright test asserting that picking one preset
highlights exactly one. Reproduces the regression fixed in this branch: without
the label-based isPresetActive() match all three presets were aria-selected at
once (test fails with 'Received: 3'); with the fix only the chosen preset is.

- test(DateRangePicker): regression test for same-day preset highlight ([9bff71f](https://github.com/juspay/svelte-ui-components/commit/9bff71fa978761fda88d0178523e44ef9a424d53))
- fix(DateRangePicker): match active preset by label, not same calendar day ([c05242e](https://github.com/juspay/svelte-ui-components/commit/c05242e554e8ab81e37b2636a3caf9e9f2e0ca8f))

## [2.63.0](https://github.com/juspay/svelte-ui-components/compare/2.63.0..2.62.1) - 17 June 2026

- feat(Tooltip): add usePortal prop and tooltip action; fix DOM leak, CSS scoping, double-show race ([a6d9153](https://github.com/juspay/svelte-ui-components/commit/a6d9153e799f175a893b4bc8df56632dd48552ee))

## [2.62.1](https://github.com/juspay/svelte-ui-components/compare/2.62.1..2.62.0) - 17 June 2026

- fix: address unaddressed review comments across merged PRs ([c18226d](https://github.com/juspay/svelte-ui-components/commit/c18226dc4d8b66df38277bf34f3ee85f70863454))

## [2.62.0](https://github.com/juspay/svelte-ui-components/compare/2.62.0..2.61.0) - 17 June 2026

- feat(Stepper): vertical mode + rich per-step status ([8d32c00](https://github.com/juspay/svelte-ui-components/commit/8d32c008eb41f225e4fd9d6c8a1e28fbb6da03dd))

## [2.61.0](https://github.com/juspay/svelte-ui-components/compare/2.61.0..2.60.0) - 16 June 2026

- feat(PieChart): semiCircle + legendShowValues ([93a8c47](https://github.com/juspay/svelte-ui-components/commit/93a8c47c2ff93b29296995bdd56ab901924dc117))

## [2.60.0](https://github.com/juspay/svelte-ui-components/compare/2.60.0..2.59.0) - 16 June 2026

- Props table: add `itemTestId` (per-option data-pw fallback prefix) and `dropdownAlign`
('left'|'right' anchor for the dropdown panel) — both were already implemented in
Select.svelte/properties.ts but were absent from the docs.
- Snippets table: add `triggerSummary` (compact multi-select trigger summary snippet)
with an accompanying usage example.
- Type Reference: extend `SelectItem` to show the optional `testId` field; add
`SelectHierarchy` union type entry.
- wc wrapper: expose `itemTestId` as `item-test-id` HTML attribute so Web Component
consumers get the same per-option data-pw hook that Svelte consumers already have.
- Complements PR #263 (leftIcon/hierarchy) whose props were already present.
Enables the Lighthouse DataGrid migration to fold off its project-owned Dropdown
and use the library Select with full test-id parity.

- feat(Select): document itemTestId/dropdownAlign/triggerSummary + expose itemTestId in wc wrapper ([9f97377](https://github.com/juspay/svelte-ui-components/commit/9f97377dd82b2731e9dde12020328d618df0e84e))

## [2.59.0](https://github.com/juspay/svelte-ui-components/compare/2.59.0..2.58.0) - 16 June 2026

- feat(BarChart): stackNormalize + rounded stacked segments + horizontal scroll ([08dfcfe](https://github.com/juspay/svelte-ui-components/commit/08dfcfe67fbc56060244d60a7e01f231833007c3))

## [2.58.0](https://github.com/juspay/svelte-ui-components/compare/2.58.0..2.57.0) - 16 June 2026

- feat(SankeyChart): enriched link tooltip context ([f0a0321](https://github.com/juspay/svelte-ui-components/commit/f0a03219ec88e3abcf481151f80defa9b7f9e6f7))

## [2.57.0](https://github.com/juspay/svelte-ui-components/compare/2.57.0..2.56.0) - 16 June 2026

- feat(Input): leftIcon/rightIcon snippets + click handlers + mandatory + forceError ([931937a](https://github.com/juspay/svelte-ui-components/commit/931937a64d59f829be5f8a845abe0143b96d484e))

## [2.56.0](https://github.com/juspay/svelte-ui-components/compare/2.56.0..2.55.0) - 16 June 2026

- feat(Select): add leftIcon prop for a leading trigger icon ([c01d2c1](https://github.com/juspay/svelte-ui-components/commit/c01d2c111a86beacb0ec19209a40c200c9fdc8dc))

## [2.55.0](https://github.com/juspay/svelte-ui-components/compare/2.55.0..2.54.0) - 16 June 2026

- feat(Card): add cssVars prop for per-instance CSS variable injection ([f7811e4](https://github.com/juspay/svelte-ui-components/commit/f7811e4b415560853c0c91ada9e64db50a4e3e8d))

## [2.54.0](https://github.com/juspay/svelte-ui-components/compare/2.54.0..2.53.0) - 16 June 2026

- feat(Badge): standalone count-bubble (image optional) ([73bc82b](https://github.com/juspay/svelte-ui-components/commit/73bc82b83de7e50e75c649036796065f02c8bb02))

## [2.53.0](https://github.com/juspay/svelte-ui-components/compare/2.53.0..2.52.0) - 16 June 2026

- Add mandatory?: boolean — renders red asterisk next to label; marker uses aria-label="required" for screen-reader accessibility
- Add size?: InputButtonSize ('sm'|'md'|'lg') — 36/44/54px height presets via CSS vars (--inputbutton-{sm|md|lg}-{height|padding}); all overridable
- Add error?: string — external error message prop with precedence over internal onErrorMessage; external error &gt; internal validation &gt; info
- Fix inputRef type: SvelteComponent → ReturnType&lt;typeof Input&gt;
- Fix null/undefined guards on onErrorMessage and infoMessage
- Replace invalid/valid class template with class:invalid directive
- Replace hardcoded font-weight:500 with --input-button-font-weight CSS var
- Add mandatory, size, error to InputButton.wc.svelte customElement props (web-component consumers can now set them as HTML attributes)
- Add JSDoc to InputButtonSize type and the three new props in properties.ts
- Update docs: Props table (mandatory/size/error), CSS Variables table (9 new vars), InputButtonSize type reference, external error precedence note

- feat(InputButton): mandatory, size, external error ([c3bfb7d](https://github.com/juspay/svelte-ui-components/commit/c3bfb7df53e19dd5c807ae4491e6b699eb9055d3))

## [2.52.0](https://github.com/juspay/svelte-ui-components/compare/2.52.0..2.51.0) - 16 June 2026

- feat(Modal): backdrop-filter var + usePortal ([d3f1086](https://github.com/juspay/svelte-ui-components/commit/d3f108654db2dde3bd5726f003bce2e784d050f1))

## [2.51.0](https://github.com/juspay/svelte-ui-components/compare/2.51.0..2.50.0) - 16 June 2026

- feat(Button): add pointer-event props for hold-and-release interactions ([4254fcc](https://github.com/juspay/svelte-ui-components/commit/4254fcce25277e15af81d0639a679be8b30a0601))

## [2.50.0](https://github.com/juspay/svelte-ui-components/compare/2.50.0..2.49.0) - 16 June 2026

Include the missing type definition for the testId field already used in
Loader.svelte. Backward-compatible — optional prop with no default required.

- feat(Loader): use canonical typeof string guard for data-pw testId ([f3f8042](https://github.com/juspay/svelte-ui-components/commit/f3f8042b8cc202648b2a929bdc535fa96953b232))
- feat(Loader): add testId optional prop to LoaderProperties type ([dabc8d6](https://github.com/juspay/svelte-ui-components/commit/dabc8d64861e332a922de19a050a3935ae4e1cc4))

## [2.49.0](https://github.com/juspay/svelte-ui-components/compare/2.49.0..2.48.0) - 16 June 2026

Convert internal `function openFilePicker()` declaration to
`export const openFilePicker = (): void =&gt; { ... }` so callers can
invoke it via `bind:this` on the component instance in Svelte 5.
Logic is unchanged (guard on disabled, then inputEl?.click()).
Fully backward-compatible — no props added or removed.

- feat(FileInput): export openFilePicker as callable imperative method ([86e9dbb](https://github.com/juspay/svelte-ui-components/commit/86e9dbb4a0242773a264a0575f1334372a903f3d))

## [2.48.0](https://github.com/juspay/svelte-ui-components/compare/2.48.0..2.47.0) - 16 June 2026

- feat(Tabs): --tabs-item-border CSS variable ([5ebcc57](https://github.com/juspay/svelte-ui-components/commit/5ebcc572339458e86486a35ed8b9f8e27ef60a8a))

## [2.47.0](https://github.com/juspay/svelte-ui-components/compare/2.47.0..2.46.0) - 16 June 2026

Move display:flex + justify-content:center + align-items:center from .order-status to .background,
which now owns the min-height (--status-min-height, 100vh). Without height on the flex container
the centering directives had no visible effect. Backward-compatible: default 100vh preserved.

- feat(Status): fix vertical centering by making .background the flex layout container ([30be191](https://github.com/juspay/svelte-ui-components/commit/30be19173e089194467d5875b814c48b3b3c3ff3))

## [2.46.0](https://github.com/juspay/svelte-ui-components/compare/2.46.0..2.45.1) - 16 June 2026

- Add optional `labelFormatter?: (value: number) =&gt; string` to OptionalSliderProperties; used via $derived displayValue with String(value) fallback — zero breaking change
- Add `--slider-thumb-opacity` CSS var (default 1) to both ::-webkit-slider-thumb and ::-moz-range-thumb with opacity transition alongside existing transform transition
- Add `--slider-thumb-hover-opacity` CSS var on hover pseudo-selectors with nested fallback `var(--slider-thumb-hover-opacity, var(--slider-thumb-opacity, 1))` enabling hide-until-hover thumb pattern

- feat(Slider): add labelFormatter prop and thumb opacity CSS vars ([96153b8](https://github.com/juspay/svelte-ui-components/commit/96153b8d5b2be8f9aad5a48be283f6a4359a3032))

## [2.45.1](https://github.com/juspay/svelte-ui-components/compare/2.45.1..2.45.0) - 16 June 2026

- fix(Select): close multi-select searchable dropdown on trigger click ([9a4ad94](https://github.com/juspay/svelte-ui-components/commit/9a4ad942036073eacf7ca041db858d03d78a54db))

## [2.45.0](https://github.com/juspay/svelte-ui-components/compare/2.45.0..2.44.0) - 16 June 2026

- Add headerRight snippet prop: renders at top-right of header row via
flex split (.card-header-split); base block flow unchanged when omitted
- Add footer snippet prop: rendered in &lt;footer class="card-footer"&gt; below
content area; element absent when omitted (semantic HTML)
- Add stretch boolean prop: card root becomes flex column with
height: var(--card-stretch-height, 100%) so content fills parent
- Add scrollable boolean prop: content area gets overflow-y:auto with
max-height: var(--card-content-max-height, 400px); card root switches
to overflow:visible to prevent clipping; content div gains
role="region", aria-label="Scrollable card content", tabindex="0"
for keyboard accessibility
- Fix: arrow function for handleKeydown (was function declaration)
- Fix: scrollbar-width hard-coded to keyword 'thin' (CSS var removed
since scrollbar-width is keyword-only; pixel values are silently
ignored by all browsers)
- Add Card.wc.svelte: reflect stretch and scrollable Boolean props in
customElement config so &lt;sui-card stretch scrollable&gt; attributes parse
- Update docs/Card.md: new prop rows, new CSS variable rows, usage
examples for headerRight+footer and stretch+scrollable patterns

- feat(Card): headerRight, footer, stretch, scrollable ([f01e98d](https://github.com/juspay/svelte-ui-components/commit/f01e98ddf19453911b559f3c187caea072eace78))

## [2.44.0](https://github.com/juspay/svelte-ui-components/compare/2.44.0..2.43.0) - 16 June 2026

The aria-controls attribute was bound to the native &lt;input type="checkbox"&gt;
which carries aria-hidden="true". ARIA attributes on aria-hidden elements are
stripped from the accessibility tree and are never exposed to assistive
technology. Moved aria-controls to the &lt;span role="checkbox"&gt; element, which
is the actual interactive node that screen readers interact with.

- feat(Checkbox): move aria-controls from aria-hidden input to span[role=checkbox] ([591b432](https://github.com/juspay/svelte-ui-components/commit/591b432fde23d9b23ffa3ed8851d1a82aa9e988f))

## [2.43.0](https://github.com/juspay/svelte-ui-components/compare/2.43.0..2.42.0) - 16 June 2026

Add compareTrigger snippet prop and openCompare bindable prop that together
render an independent compare-period trigger button and panel adjacent to the
main DRP trigger. The standalone panel includes a focus-trap (tab-cycle) for
a11y parity with the main dialog. When compareTrigger is provided, the
compareCalendar snippet moves into the standalone panel so the same snippet
is never rendered in two places simultaneously (Svelte 5 runtime constraint).

Tighten .drp-trigger global selector to .drp-trigger-wrapper .drp-trigger to
avoid colliding with the new .drp-compare-trigger class on the compare button.
Document the selector specificity change for consumers who override .drp-trigger.

Review fixes applied:
- docs: add compareTrigger/openCompare props, snippets, CSS vars, specificity note
- a11y: add Tab focus-trap on .drp-compare-panel (role=dialog + aria-modal)

- feat(DateRangePicker): compare standalone trigger ([f1ee96e](https://github.com/juspay/svelte-ui-components/commit/f1ee96ed40221dbe18767b40c4a1b12c4a589eed))

## [2.42.0](https://github.com/juspay/svelte-ui-components/compare/2.42.0..2.41.0) - 16 June 2026

- feat(Select): onOpen/onClose callbacks + ghost variant ([10da22c](https://github.com/juspay/svelte-ui-components/commit/10da22c8af3848c258a15c51b015cbd6aa7ec2d9))
- feat(Toggle): disabled prop ([975f842](https://github.com/juspay/svelte-ui-components/commit/975f842553eedfc92fa735dac6559f2240fcef65))

## [2.41.0](https://github.com/juspay/svelte-ui-components/compare/2.41.0..2.40.0) - 16 June 2026

Adds two optional Snippet props — titleSnippet and descriptionSnippet — to
EmptyState so callers can render arbitrary markup (icons, links, emphasis)
in place of the plain string title/description props, without breaking
backward-compatibility.

- titleSnippet takes full rendering priority over title; the mandatory title
prop is preserved for BC (JSDoc notes it is still required but unused when
the snippet is provided).
- descriptionSnippet takes priority over description; JSDoc notes the mutual
exclusion so consumers are not surprised.
- Both props land in OptionalEmptyStateProperties — zero mandatory-prop demotions.
- docs/EmptyState.md updated: new rows in Props table and Snippets table,
plus a Rich-Markup usage section with two code examples.

- feat(EmptyState): add titleSnippet and descriptionSnippet snippet props ([5f78709](https://github.com/juspay/svelte-ui-components/commit/5f78709808b7c2f6b696a68bd8a598f215d80356))

## [2.40.0](https://github.com/juspay/svelte-ui-components/compare/2.40.0..2.39.0) - 16 June 2026

- feat(Gauge): fix NaN/Infinity on max=0, add max+labelFormatter props ([c2786ae](https://github.com/juspay/svelte-ui-components/commit/c2786ae585ed55850b7fd1aec2d5b20d7976917a))

## [2.39.0](https://github.com/juspay/svelte-ui-components/compare/2.39.0..2.38.0) - 16 June 2026

- Add `trigger` snippet prop (Snippet&lt;[{ expanded: boolean }]&gt;) that renders
a keyboard-accessible toggle header with role="button", tabindex="0",
aria-expanded={expand}, onclick and onkeydown (Enter/Space) handlers
- Remove the two svelte-ignore a11y comments; replace with proper semantics
- Add `triggerClasses?: string` — CSS class string scoped to the trigger div
- Add `ontoggle?: (expanded: boolean) =&gt; void` event prop called on toggle
- Add `testId?: string` — written to data-pw on the accordion content wrapper
- Add `--accordion-trigger-cursor` CSS var (default: pointer)
- Add `--accordion-transition` CSS var (default: 0.2s ease-out)
- Expose `triggerClasses` and `testId` in Accordion.wc.svelte customElement
props block with kebab-case HTML attribute mappings
- Update docs/Accordion.md: document all four new props, trigger snippet
parameter shape, ontoggle event, two new CSS vars, and WC attribute table
- Export AccordionProperties types from src/lib/index.ts
- Type split: AccordionProperties = OptionalAccordionProperties & AccordionEventProperties

- feat(Accordion): trigger snippet, triggerClasses, ontoggle, testId + a11y ([ba9fd5e](https://github.com/juspay/svelte-ui-components/commit/ba9fd5e4f65b56a332c877e71e62affc7ff6ad89))

## [2.38.0](https://github.com/juspay/svelte-ui-components/compare/2.38.0..2.37.0) - 16 June 2026

Fixes all blockers/majors from gate review:

- C2-1 (blocker): single-select toggle was broken — capture wasSelected
before selectedIds.clear() so clicking an already-selected row
correctly deselects it instead of re-selecting.
- C2-1+C2-3 (major): selectableRowIds and per-row rowId resolution now
map over filteredTableData but look up originalIndex via
sortedTableData.indexOf(row), keeping positional default IDs stable
across search-filter changes (row '0' stays row '0' even when the
visible set shrinks).
- C2-2 (blocker): remove broken JSDoc recipe that showed
onCellChange?.(…) inside a Snippet body as if Table forwards it.
Svelte 5 snippets run in consumer scope — Table never calls this
callback internally. New docs clarify that consumers must close over
their own handler; onCellChange remains valid as a top-level prop
for the parent-component API channel. Renamed internal destructured
binding to _onCellChange to satisfy the unused-var lint rule.
- C2-3 (minor): add :focus-visible ring to .table-search-input to
restore keyboard focus visibility stripped by outline:none.
- C2-1 (minor): make TableCheckboxSelectionConfig.enabled optional
(defaults to true when config object is present). All internal
guards updated from checkboxSelection?.enabled to
!!checkboxSelection && checkboxSelection.enabled !== false, and
isCheckboxMode derived updated accordingly. Backward-compatible —
existing consumers passing enabled:true are unaffected.

- feat(Table): fix single-select toggle, stable selection IDs, correct onCellChange docs, focus ring, optional enabled ([1ec8a0c](https://github.com/juspay/svelte-ui-components/commit/1ec8a0cb7197e1dd3454d958a8dd6f2237b0066b))

## [2.37.0](https://github.com/juspay/svelte-ui-components/compare/2.37.0..2.36.0) - 16 June 2026

- feat(Toast): Fix the auto-dismiss timer to RESTART when the message/props change ([70899ab](https://github.com/juspay/svelte-ui-components/commit/70899ab8d47f5b1c2adaec1aa2de6594f53a681e))

## [2.36.0](https://github.com/juspay/svelte-ui-components/compare/2.36.0..2.35.0) - 16 June 2026

Expose --button-hover-box-shadow, --button-active-background,
--button-active-box-shadow, --button-focus-visible-box-shadow and
--button-disabled-box-shadow so consumers can theme per-state box-shadow
and the active/pressed background through the classes prop, instead of
reaching the inner &lt;button&gt; element via :global(.x button:hover) etc.

Previously only the resting --button-box-shadow was themable; the
hover/active/focus-visible/disabled states had no box-shadow hook and
:active had no background hook, so any state shadow or pressed shade
forced a descendant element selector. This completes the state coverage
the way --button-hover-color / --button-active-transform already do.

Every new variable falls back to --button-box-shadow (or --button-color
for the active background) so the resting value carries into each state
by default — rendering is unchanged unless a consumer opts in.

- feat(Button): add state box-shadow and active-background CSS variables ([bf02b1a](https://github.com/juspay/svelte-ui-components/commit/bf02b1a37ef04c670fb67b50d9627579a83cbca6))

## [2.35.0](https://github.com/juspay/svelte-ui-components/compare/2.35.0..2.34.0) - 16 June 2026

Expose --empty-state-actions-display, -flex-direction, -align-items,
-justify-content, -gap and -margin-top so consumers can lay out the
actions area (e.g. stack buttons vertically and center them) via the
classes prop, instead of reaching the internal .empty-state-actions
class through a descendant :global() override.

The actions container previously had only a hardcoded margin-top:16px,
so any layout change (a column of centered buttons, a gap between
actions) required overriding the library-internal class. Defaults
reproduce the current rendering exactly (display:block with the flex
properties inert, margin-top:16px), so this is fully backward-compatible.

- feat(EmptyState): add CSS variables for actions container layout ([a6cb4d9](https://github.com/juspay/svelte-ui-components/commit/a6cb4d9d1b2b38bee943a8d083ee17b7e9f9bd78))

## [2.34.0](https://github.com/juspay/svelte-ui-components/compare/2.34.0..2.33.0) - 16 June 2026

Expose --select-dropdown-left, --select-dropdown-right,
--select-dropdown-min-width, --select-dropdown-max-width and
--select-dropdown-width so consumers can theme the dropdown panel's
horizontal placement and width via the classes prop, without reaching
the internal .select-dropdown class through :global().

Every other dropdown property (gap, background, border, radius,
shadow, max-height, z-index) already had a CSS-var hook, but the
horizontal sizing was hardcoded to left:0/right:0 — pinning the panel
to the trigger width and clipping long option labels. Both alignment
branches now consume the variables: the default left-aligned rule and
the dropdownAlign="right" preset, so right-anchored menus are themable
through the public path too.

Defaults reproduce the current rendering exactly (left-aligned:
left:0; right:0; min-width:auto; max-width:none; width:auto —
right-aligned preset: right:0; min-width:100%; max-width:none;
width:max-content), so this is fully backward-compatible.

- feat(Select): add CSS variables for dropdown horizontal sizing ([f28d021](https://github.com/juspay/svelte-ui-components/commit/f28d0216e68625bacff8f85a6bff3de82f1c8be0))

## [2.33.0](https://github.com/juspay/svelte-ui-components/compare/2.33.0..2.32.1) - 15 June 2026

Three additive, backward-compatible capabilities (existing consumers unaffected
when the new props are unset):

- clearable + onclear: in single mode, render a Clear button that resets value to
null and fires onclear (new CSS vars --drp-clear-*).
- initialPresetLabel: highlight a preset and show its label in the trigger on
mount without firing onapply (resolved once via untrack()).
- group field on DateRangePreset: render a divider (and optional group label)
between preset groups; flat arrays render unchanged (new --drp-preset-divider-*).

Updates properties.ts, the WC wrapper (clearable, initial-preset-label), the demo
page, and docs. pnpm check and pnpm build pass.

- feat(DateRangePicker): add clearable, initialPresetLabel, and preset groups ([0142ab9](https://github.com/juspay/svelte-ui-components/commit/0142ab9ed48e9629b2bbde05619d36fbcb1497ea))

## [2.32.1](https://github.com/juspay/svelte-ui-components/compare/2.32.1..2.32.0) - 15 June 2026

Wire the @juspay/yama AI code-review GitHub Action (pinned to v2.7.1) into
this repo. On PRs targeting release it reads the diff via the hosted GitHub
MCP server and posts inline review comments plus a verdict.

- .github/workflows/yama-review.yml: provider-aware review workflow (LiteLLM
provider, private-large model). Fork PRs and runs with missing secrets are
skipped cleanly so the check never deadlocks merges.
- yama.config.yaml: review focus areas and blocking criteria.

Requires repo secrets YAMA_GITHUB_TOKEN, LITELLM_BASE_URL and LITELLM_API_KEY
(added separately); until set, the review is skipped and the check stays green.

- ci(yama): add Yama AI PR review workflow ([9356d24](https://github.com/juspay/svelte-ui-components/commit/9356d24ea1d641b187ae5b97344d2ff7a74d351a))

## [2.32.0](https://github.com/juspay/svelte-ui-components/compare/2.32.0..2.31.0) - 15 June 2026

- AreaChart, BarChart, LineChart, PieChart, and SankeyChart components added to the library
- Each chart component includes properties for customization and is documented in the docs folder
- Updated index.ts to export the new chart components
- Updated the components navigation to include links to the new chart components
- Updated MCP documentation to include the new chart components and their properties

- feat: expose chart components ([7a87c7d](https://github.com/juspay/svelte-ui-components/commit/7a87c7d1ba1153ec650799f53249dd8b24238da2))

## [2.31.0](https://github.com/juspay/svelte-ui-components/compare/2.31.0..2.30.0) - 15 June 2026

- feat(Select): add triggerSummary snippet for compact multi-select trigger ([9e2ba79](https://github.com/juspay/svelte-ui-components/commit/9e2ba79f04278d38cb5f7d261c6ae14779aff9a3))

## [2.30.0](https://github.com/juspay/svelte-ui-components/compare/2.30.0..2.29.0) - 15 June 2026

Add an additive `presetLabel: string | null` field to the onapply,
onapplysingle, and onapplycompare event payloads so consumers can tell
which preset was selected (null for a custom calendar pick). Backward
compatible — existing consumers ignore the new field.

Also fix the release lint failure introduced with maxRangeDays: the
`limit === undefined` branch in rangeConstrainedDisabledDates tripped the
no-restricted-syntax `undefined` ban. maxRangeDays is typed `number | null`,
so the redundant undefined check is removed (`limit === null` suffices).

- feat(DateRangePicker): report selected preset label in apply events ([c19fce0](https://github.com/juspay/svelte-ui-components/commit/c19fce05055e50f78707bf27b316c6f3c5c7aa39))
- feat(Select): add dropdownAlign prop to right-anchor the dropdown panel ([f814601](https://github.com/juspay/svelte-ui-components/commit/f81460147df77572326f95279175c9cb2c6f4ac2))
- feat(DateRangePicker): add maxRangeDays to cap selectable range span ([3ddda22](https://github.com/juspay/svelte-ui-components/commit/3ddda22a472a4f2e5cd04fa98df46cd33d0faeba))

## [2.29.0](https://github.com/juspay/svelte-ui-components/compare/2.29.0..2.28.3) - 15 June 2026

Adds SelectItem.testId and an itemTestId fallback prop so each option emits a data-pw attribute (item.testId, else itemTestId-{id}, else testId-{id}). This lets consumers target individual options in e2e tests without a downstream patch. Also removes a now-unused svelte-ignore on the option element. Incidental: re-applies prettier/eslint formatting to 3 demo pages (banner/modal/table) that had regressed and were failing the lint publish-gate.

- feat(Select): add itemTestId prop + per-option data-pw test hook ([d08cd5d](https://github.com/juspay/svelte-ui-components/commit/d08cd5d9aed247201e5006b0b91bd6410a03db8f))

## [2.28.3](https://github.com/juspay/svelte-ui-components/compare/2.28.3..2.28.2) - 14 June 2026

- feat(DateRangePicker): add compound date-range picker with slim snippet API ([1d4a7fe](https://github.com/juspay/svelte-ui-components/commit/1d4a7fe281840d952371b8afca0250ae32c060e0))
- feat: add FileInput component with drag-and-drop, validation, and snippet-driven API ([b36a5ab](https://github.com/juspay/svelte-ui-components/commit/b36a5ab99bfd5b347f67c387b9e8c5094dbcd1e5))
- feat: add Breadcrumb component with snippet-based API ([e463412](https://github.com/juspay/svelte-ui-components/commit/e463412c5e5bc7b395aef31c10bd4092bef3c2c9))
- feat(Select): string[] normalization, optionIndicator + bottomContent snippets, bindable open ([a5cbfad](https://github.com/juspay/svelte-ui-components/commit/a5cbfadc8fd3387924f84cd87cbc40448c9f1ec1))
- refactor(Pagination): slim to cursor/load-more primitive (hasMore + onLoadMore only) ([31866f7](https://github.com/juspay/svelte-ui-components/commit/31866f795c4c2a51d96561ccdf17b36088ee50f4))
- feat(banner): border-radius/border vars, title snippet, role escape hatch ([f284679](https://github.com/juspay/svelte-ui-components/commit/f284679d9429e93a3e1387460e652d0c34f11b52))
- feat(table): add paginatorSlot, getRowTestId/getCellTestId callbacks, and footer CSS vars ([75e7725](https://github.com/juspay/svelte-ui-components/commit/75e7725daf03982269c353c60b2508889a92a94a))
- feat: animate Tabs underline indicator (slide between tabs) ([ebdd56f](https://github.com/juspay/svelte-ui-components/commit/ebdd56fb0c843cb8523035d361e3a950b441e846))
- feat(Pill): add leadingIcon snippet slot and expose leading-icon WC slot ([f703573](https://github.com/juspay/svelte-ui-components/commit/f70357362ced528dc040a355eb4d6acf6c570358))
- feat(EmptyState): make description optional and add testId prop ([f795025](https://github.com/juspay/svelte-ui-components/commit/f795025dcdaaec4c5a77cdccd8d41c7ea63a2f1d))
- feat: add hasMore + prevButtonTestId + nextButtonTestId to Pagination ([328c9af](https://github.com/juspay/svelte-ui-components/commit/328c9afaae7f7bc6cfd14144a3438e384ebdcc32))
- feat(Sheet): add onafteropen + onafterclose lifecycle callbacks ([bbe65dd](https://github.com/juspay/svelte-ui-components/commit/bbe65ddf7fabcc4942c8745fc19043d477711afa))
- feat(modal): falsy-guard fixes, redundant-guard removal, expose --modal-header-align-items ([f1f5037](https://github.com/juspay/svelte-ui-components/commit/f1f5037c0203ec8db929d8999032acb385bce3de))
- fix: resolve prettier/eslint lint failures blocking the release publish pipeline ([c5ddd5f](https://github.com/juspay/svelte-ui-components/commit/c5ddd5f34d7a50282f6fbbe5671f84e02bec4c2b))

## [2.28.2](https://github.com/juspay/svelte-ui-components/compare/2.28.2..2.28.1) - 13 June 2026

- fix: Tooltip label color no longer relies on inheritance ([755dd59](https://github.com/juspay/svelte-ui-components/commit/755dd5973402c171bdf5b47b6b6a0f064800cd03))

## [2.28.1](https://github.com/juspay/svelte-ui-components/compare/2.28.1..2.28.0) - 13 June 2026

- fix: make Table default sort icon visible at rest ([e720522](https://github.com/juspay/svelte-ui-components/commit/e720522c8fd8793bc4a7fc9fdcacd40cff4e4089))

## [2.28.0](https://github.com/juspay/svelte-ui-components/compare/2.28.0..2.27.0) - 13 June 2026

- feat(Card): add onclick, CSS vars (width/shadow/height), and consumer recipe for custom layouts ([13306cc](https://github.com/juspay/svelte-ui-components/commit/13306cc5aebad22b3fb9825b50747661e6894cda))

## [2.27.0](https://github.com/juspay/svelte-ui-components/compare/2.27.0..2.26.0) - 13 June 2026

- feat(Toolbar): add testId + headingTestId props ([0d9b68c](https://github.com/juspay/svelte-ui-components/commit/0d9b68cb1ce750cd1dfa733dd4509751021c3c2a))

## [2.26.0](https://github.com/juspay/svelte-ui-components/compare/2.26.0..2.25.0) - 13 June 2026

- feat(Img): add testId prop (slim split from #218) ([afe1f7e](https://github.com/juspay/svelte-ui-components/commit/afe1f7e9f177f4d48df04afbdbc22d08784e0d24))

## [2.25.0](https://github.com/juspay/svelte-ui-components/compare/2.25.0..2.24.0) - 13 June 2026

- feat(Tooltip): add icon and content snippets ([38adfa8](https://github.com/juspay/svelte-ui-components/commit/38adfa8a06ce61bc478235e475b6ba2cf21f5af2))

## [2.24.0](https://github.com/juspay/svelte-ui-components/compare/2.24.0..2.23.1) - 13 June 2026

- feat: add opt-in SVG inlining and transform hook to Img ([2861b96](https://github.com/juspay/svelte-ui-components/commit/2861b96404110385609dbf16b9c0f0ca161638a5))

## [2.23.1](https://github.com/juspay/svelte-ui-components/compare/2.23.1..2.23.0) - 8 June 2026

- fix: use effect for Validation State ([e93bf4f](https://github.com/juspay/svelte-ui-components/commit/e93bf4fc4aab691f60be2e6be9bdada614d7b82f))

## [2.23.0](https://github.com/juspay/svelte-ui-components/compare/2.23.0..2.22.1) - 8 June 2026

Add six missing themeable CSS vars that Lighthouse callsites rely on:
--card-box-shadow (none), --card-width (auto), --card-min-width (0),
--card-max-width (none), --card-max-height (none), --card-margin (0).
All have sensible fallbacks so the card looks correct with zero consumer
overrides.

The card already had onclick/a11y support (role=button, tabindex=0,
Enter/Space handlers) — this PR surfaces that in the docs and demo.

Add Card to docs/_index.json so it appears in the MCP registry
(list_components was omitting it despite the export existing in index.ts).
Update Card.md with the complete prop/event/CSS-var table including the
six new vars, testId, and onclick.

Expand the demo page at /components/card with three new sections:
sized cards (--card-width/--card-box-shadow/--card-margin), clickable
cards (onclick with tab/keyboard demo), and the existing basic section.

Unblocks Lighthouse BZ-3383 CUSTOM-mode Card migration (27 callsites).

- refactor: upgrade all packages & drop deperecated fixes ([0f3bf58](https://github.com/juspay/svelte-ui-components/commit/0f3bf588461af9d5aaf7a41b827581a3e55d4b66))
- refactor: bump mcp package versions & update node engine ([a1acd8b](https://github.com/juspay/svelte-ui-components/commit/a1acd8b19e40effb2c316e8cf400d19891052b03))

## [2.22.1](https://github.com/juspay/svelte-ui-components/compare/2.22.1..2.22.0) - 4 June 2026

Per @sinha-sahil review — activeIndex must not advance when items.at(index)
returns undefined. Guard now runs first, mutation only after.

- fix(Tabs): reorder string-branch guard before activeIndex mutation ([d42ed75](https://github.com/juspay/svelte-ui-components/commit/d42ed753df173c7dad058119732fb9d18a9bdbff))

## [2.22.0](https://github.com/juspay/svelte-ui-components/compare/2.22.0..2.21.0) - 4 June 2026

Adds exactly three additive features and nothing else:
- testId prop → data-pw on the root for Playwright test selection
- onclick prop → full interactive-div pattern: role="button", tabindex=0,
Enter+Space keydown with preventDefault on Space, all interactive
attributes conditionally null when onclick is omitted (zero behaviour
change for existing consumers)
- --card-cursor, --card-focus-outline, --card-focus-outline-offset CSS
variables with sensible defaults; .card-interactive gates the cursor switch

Header layout props (headerLeading/headerAction/headerSubtext) are
intentionally excluded per GUIDELINES §9 — variants and layout stay in
consumer CSS (classes prop + CSS vars).

- feat: add testId, onclick (interactive-div), and focus CSS vars to Card (slim follow-up to #210) ([40a9d1e](https://github.com/juspay/svelte-ui-components/commit/40a9d1eb1a480984b8f68cf7f7375152911c38c6))

## [2.21.0](https://github.com/juspay/svelte-ui-components/compare/2.21.0..2.20.2) - 3 June 2026

Exposes an optional testId that renders data-pw on the root .empty-state element,
matching the convention used by Banner, Divider, and other library components.
Lets consumers target the empty state in Playwright/automation without wrapping
it in an extra structural div.

- feat: add testId prop to EmptyState ([0276943](https://github.com/juspay/svelte-ui-components/commit/027694391e599661815c5908be5587f5ea833faa))

## [2.20.2](https://github.com/juspay/svelte-ui-components/compare/2.20.2..2.20.1) - 3 June 2026

- svelte never runs derived if the state is not used

- fix: resolve onstatechange input callback not triggered ([f30f72b](https://github.com/juspay/svelte-ui-components/commit/f30f72bcfb37870dd357addc1eb993be335ccf5c))

## [2.20.1](https://github.com/juspay/svelte-ui-components/compare/2.20.1..2.20.0) - 2 June 2026

- Add default background and text color for disable button state

- fix(Button): improve default styles for disabled state ([7b04c2b](https://github.com/juspay/svelte-ui-components/commit/7b04c2b72b997439e107e523703dd1a0682b5c4d))

## [2.20.0](https://github.com/juspay/svelte-ui-components/compare/2.20.0..2.19.2) - 31 May 2026

Adds --banner-white-space, --banner-text-overflow, and --banner-text-ellipsis so
callers can opt the banner text out of the default single-line truncation
(white-space:nowrap; overflow:hidden; text-overflow:ellipsis). Defaults are
unchanged, so existing banners are unaffected; multi-line/inline banner usages
(e.g. card-context hints) can now set --banner-white-space: normal.

- feat: expose text-wrap CSS vars on Banner ([1bd3870](https://github.com/juspay/svelte-ui-components/commit/1bd3870cc846341f2b964ea46123121fe4bda69c))

## [2.19.2](https://github.com/juspay/svelte-ui-components/compare/2.19.2..2.19.1) - 5 May 2026

- fixed jagged border rendering in badge
- default fonts now inherit
- added flex config to toolbar text

- fix: update badge & toolbar defaults ([157331a](https://github.com/juspay/svelte-ui-components/commit/157331af72a8959dd2b9e2d579a62a86c58749e9))

## [2.19.1](https://github.com/juspay/svelte-ui-components/compare/2.19.1..2.19.0) - 4 May 2026

- fading gradient overlay on edges of scroller are removed on mobile

- fix: preventing fading gradient on edge of scroller on mobile ([53b30f9](https://github.com/juspay/svelte-ui-components/commit/53b30f9cbb8191bfa140cb6f859b74c38d05c8ae))

## [2.19.0](https://github.com/juspay/svelte-ui-components/compare/2.19.0..2.18.2) - 1 May 2026

- exposed padding, margin, color on toolbar text

- feat: exposed color, constraints on toolbar text ([6753485](https://github.com/juspay/svelte-ui-components/commit/6753485c39982da2647764b00bccdaac35c0c00a))

## [2.18.2](https://github.com/juspay/svelte-ui-components/compare/2.18.2..2.18.1) - 1 May 2026

- centered back icon in toolbar

- fix: default toolbar back icon alignment ([401c2c7](https://github.com/juspay/svelte-ui-components/commit/401c2c744cfd869f9213105e0584c433d82f55f7))

## [2.18.1](https://github.com/juspay/svelte-ui-components/compare/2.18.1..2.18.0) - 1 May 2026

- by default toolbar additional display is none
- exposed css var for customising text font size

- fix: toolbar additional content display ([34ffa11](https://github.com/juspay/svelte-ui-components/commit/34ffa11f9eb27972151f9383f93a6f6b8fdb653f))

## [2.18.0](https://github.com/juspay/svelte-ui-components/compare/2.18.0..2.17.0) - 17 April 2026

## [2.17.0](https://github.com/juspay/svelte-ui-components/compare/2.17.0..2.16.0) - 17 April 2026

- Added `--disabled-text-color`, `--disabled-font-size`, and `--disabled-font-weight` CSS variables to the Button component to allow deeper customization of the disabled state.
- Updated `Button.md` documentation to include the newly added variables.

## [2.16.0](https://github.com/juspay/svelte-ui-components/compare/2.16.0..2.15.0) - 14 April 2026

- Add ColorPicker with saturation/brightness panel, hue Slider, and HEX/RGB/HSL input modes using Button, Input, Slider,
SplitInput
- Add SplitInput for segmented inputs (OTP, RGB, IP) with auto-advance, paste, keyboard nav; validation delegated to Input via
FieldConfig (Pick&lt;OptionalInputProperties&gt;)
- Add Combobox with filtered dropdown, keyboard navigation, custom item rendering, and WAI-ARIA combobox pattern
- Add min/max props to Input, --slider-track CSS variable to Slider
- Replace inputElement bindable prop with getInputRef() method in Input and Combobox
- Replace AutoCompleteType with HTMLInputAttributes['autocomplete'], remove dead type
- Move color math (hex/rgb/hsv/hsl) to shared utils.ts and types.ts
- Fix guideline violations: falsy DOM checks, missing CSS fallbacks, undefined→null for aria props, unused svelte-ignore
- Add/update docs for ColorPicker, SplitInput, Combobox, Input, Slider, _index.json

## [2.15.0](https://github.com/juspay/svelte-ui-components/compare/2.15.0..2.14.1) - 5 April 2026

- feat: add Card, EmptyState components and inline SVG support for Icon ([2f60cad](https://github.com/juspay/svelte-ui-components/commit/2f60cad1439255da42678e4095ad58b5d3f9dcb5))

## [2.14.1](https://github.com/juspay/svelte-ui-components/compare/2.14.1..2.14.0) - 24 March 2026

- tabs components now supports passing snippets as a property
- updated documentation for tabs & wc & example

## [2.14.0](https://github.com/juspay/svelte-ui-components/compare/2.14.0..2.13.2) - 24 March 2026

## [2.13.2](https://github.com/juspay/svelte-ui-components/compare/2.13.2..2.13.1) - 24 March 2026

Fix 34 verified documentation issues found by automated review of all 53
component docs against source code. Key fixes:

- ModalAnimation: fix 3 prop types from `unknown` to actual types, add children snippet
- OverlayAnimation: add missing children snippet documentation
- Tabs: remove false bindable claim on activeIndex (no $bindable() in source)
- Book: remove nonexistent children snippet claim, fix CSS var property mappings
- Modal: fix ButtonProperties type ref (text optional, 5 missing fields, resolve LoaderType),
fix header default, clarify onclose behavior, fill 15 empty CSS descriptions
- InputButton/Status: fix same ButtonProperties type issues, add missing type fields
- ListItem: fix 10 right-image CSS property mappings to use --image-* intermediate vars,
fix box-shadow property, clarify bottomContent requires useAccordion
- Toast: fix 4 CSS var defaults missing closing parenthesis
- Step: fix stepIndex/label as required, add 2 missing CSS vars
- GridItem/Slider/Toggle/Toast: fix Required/Optional contradictions
- Img: fix onerror description (doesn't fire when fallback exists)
- Browser: fix --browser-lock-color CSS property from fill to color
- ContextMenu: add missing --context-menu-max-height CSS var
- BrandLoader: fix usage example to include required props
- Table: remove stale columnWidths prop reference
- Accordion: add missing children snippet section

## [2.13.1](https://github.com/juspay/svelte-ui-components/compare/2.13.1..2.13.0) - 19 March 2026

Web component wrappers:
- Rewrite Select wrapper — was using old API (allItems, selectedItem, onselect) instead of current (items, value, onchange)
- Rewrite Radio wrapper — was using phantom checked/onclick, now uses name/value/selectedValue/onchange
- Rewrite Choicebox wrapper — remove ghost text/description props and icon snippet, add children snippet
- Rewrite Phone wrapper — remove 4 phantom props (color, shadow, orientation, scale)
- Fix RelativeTime wrapper — rename interval→updateInterval, showTooltip→tooltip, add format
- Fix LoadingDots wrapper — remove ghost size/duration props, add dots
- Fix Stepper wrapper — remove ghost testId/onclick, add onhandleStepClick
- Fix Gauge wrapper — remove ghost size/strokeWidth props
- Fix Menu wrapper — remove ghost position/maxHeight props
- Fix ThemeSwitcher wrapper — add missing options, mode, storageKey props
- Add missing snippet slots to 7 wrappers (Book, Browser, Calendar, Checkbox, CommandMenu, Pill, Tabs)
- Add missing props to 4 wrappers (CheckListItem, Shimmer, Img, KeyboardInput)
Docs:
- Fix 8 WC examples using phantom/invalid attributes (Radio, Phone, LoadingDots, Gauge, Menu, KeyboardInput, Modal, Avatar)
- Add missing Slots tables to 6 WC sections (Book, Calendar, Checkbox, CommandMenu, Pill, Tabs)
- Rebuild MCP server with corrected docs

## [2.13.0](https://github.com/juspay/svelte-ui-components/compare/2.13.0..2.12.0) - 19 March 2026

Web Components:
- Add 50 &lt;sui-*&gt; custom elements compiled via separate Vite build (vite.config.wc.ts)
- Each wrapper maps Svelte 5 Snippet props to Shadow DOM &lt;slot&gt; elements
- Explicit prop declarations for HTML attribute reflection on all wrappers
- CDN delivery via GitHub Pages (latest) and jsDelivr release assets (versioned)
- Separate tsconfig.wc.json and check:wc script for WC-specific type checking
Build & CI:
- Add build:wc script (not chained to main build — CI only)
- Update pages.yml to include dist-wc/index.js in GitHub Pages deployment
- Update release.yml to attach WC bundle as release asset with CDN usage in release notes
- Remove WC exports from package.json (CDN-only, not shipped via npm)
Tooling:
- Add tsconfig.wc.json with vite/client types for ?raw import support
- Exclude src/wc/ from main tsconfig and eslint (separate compilation context)
- Fix 8 pre-existing unused CSS warnings in table demo page
Docs — full audit and sync of all 50 component markdown files:
- Rewrite Select.md and ThemeSwitcher.md from scratch (APIs had completely changed)
- Fix wrong/missing props in 12 components (Choicebox, CheckListItem, Calendar, KeyboardInput, LoadingDots, Phone, Menu, Loader, Tabs, Gauge, Book, Checkbox)
- Fix wrong required flags in 7 components (Badge, BrandLoader, IconStack, Status, Stepper, Toast, Toggle)
- Fix wrong/missing CSS variable defaults across 15 components
- Remove 24 ghost CSS variables from Pagination and 17 from Choicebox
- Add 17 missing Step sub-component CSS variables to Stepper
- Add missing snippets to 7 components (CommandMenu, Pill, Browser, Book, Checkbox, Tabs, Calendar)
- Add missing events (Img onerror) and Internal Dependencies sections to 8 components
- Fix broken CSS variable defaults (missing closing parens) in Img, InputButton, ListItem, BrandLoader
- Add Web Component section to all 50 docs with tag names, HTML usage, and slot tables
- Rebuild MCP server with updated docs

## [2.12.0](https://github.com/juspay/svelte-ui-components/compare/2.12.0..2.11.0) - 16 March 2026

- modernized defaults: row separators, rounded corners, 100% width, clean header styling (replaces beige/grid borders)
- added cell snippet for custom rendering (Pills, links, badges), empty state snippet, row click (onRowClick), and sort event (onSort)
- added stickyHeader prop, sortable/sortableColumns controls, testId, and caption for accessibility
- replaced inline SVG sort icons with asset imports, raw &lt;button&gt; with Button component per guidelines
- fixed inverted sort indicators, duplicate-header keying bug, wasteful sort state, incorrect role="grid"
- removed columnWidths prop in favor of CSS nth-child pattern; removed negative margins
- updated docs, demo page, and rebuilt MCP server

## [2.11.0](https://github.com/juspay/svelte-ui-components/compare/2.11.0..2.10.0) - 2 March 2026

- added new components: Avatar, Book, Browser,
Calendar, Checkbox, Choicebox, CommandMenu,
ContextMenu, Gauge, KeyboardInput, LoadingDots,
Menu, Pagination, Phone, Pill, Progress, Radio,
RelativeTime, Scroller, Sheet, Shimmer, Slider,
Snippet, SplitButton, Tabs, ThemeSwitcher,
Tooltip
- refactored existing components with classes prop, testId support, and improved accessibility
- added interactive demo pages for all components under /components route
- added GitHub Pages workflow for automated deployment from main and release branches
- rewrote README with comprehensive component catalog, theming guide, and usage examples
- added SVG icon assets used by new components
- updated documentation for all new and existing components

## [2.10.0](https://github.com/juspay/svelte-ui-components/compare/2.10.0..2.9.0) - 17 February 2026

- added mcp to the project for seamless llm based integration
- added docs for all components
- added roadmap for future development
- added keywords and details to package.json for better discoverability

## [2.9.0](https://github.com/juspay/svelte-ui-components/compare/2.9.0..2.8.0) - 21 January 2026

## [2.8.0](https://github.com/juspay/svelte-ui-components/compare/2.8.0..2.7.0) - 7 January 2026

- feat: Support HTML content in button text ([f4cd0b1](https://github.com/juspay/svelte-ui-components/commit/f4cd0b19ca26194fe6d9f2e9668cb94fd190ccbe))

## [2.7.0](https://github.com/juspay/svelte-ui-components/compare/2.7.0..2.6.0) - 26 December 2025

## [2.6.0](https://github.com/juspay/svelte-ui-components/compare/2.6.0..2.5.0) - 26 December 2025

## [2.5.0](https://github.com/juspay/svelte-ui-components/compare/2.5.0..2.4.0) - 23 December 2025

## [2.4.0](https://github.com/juspay/svelte-ui-components/compare/2.4.0..2.3.0) - 23 December 2025

- Added textViewTransformers in Input to let input value be transformed post validation for display transformation
- Added rightIcon support in InputButton
- Added onFocus event in Input
- Exposed css in Button and InputButton components

- feat: add textViewTransformers in Input and rightIcon in InputButton ([284ca62](https://github.com/juspay/svelte-ui-components/commit/284ca623a565eda20ff2b0db9ea45475cd110085))

## [2.3.0](https://github.com/juspay/svelte-ui-components/compare/2.3.0..2.2.4) - 25 November 2025

- feat: expose additional CSS variables in Toast component ([8feffab](https://github.com/juspay/svelte-ui-components/commit/8feffab164439b96fe2451e1bfe5d1564af44382))

## [2.2.4](https://github.com/juspay/svelte-ui-components/compare/2.2.4..2.2.3) - 11 November 2025

- split all props into mandatory, optioanl & event based types
- helps usage of $derived with $state based runes in props

## [2.2.3](https://github.com/juspay/svelte-ui-components/compare/2.2.3..2.2.2) - 10 November 2025

- fixed props imported for toast
- removed effect and used onMount instead
- fixed duration for toast show

## [2.2.2](https://github.com/juspay/svelte-ui-components/compare/2.2.2..2.2.1) - 10 November 2025

- removed redundant checks on props in Img

## [2.2.1](https://github.com/juspay/svelte-ui-components/compare/2.2.1..2.2.0) - 5 November 2025

- dropped generic constraints from Carousel component

## [2.2.0](https://github.com/juspay/svelte-ui-components/compare/2.2.0..2.1.0) - 5 November 2025

- updated typings for carousel component

## [2.1.0](https://github.com/juspay/svelte-ui-components/compare/2.1.0..2.0.0) - 4 November 2025

- added better error indication for Input & Input Button
- exported Optional params for Input separately
- added sample integration for Input & InputButton in base page

## [2.0.0](https://github.com/juspay/svelte-ui-components/compare/2.0.0..1.34.2) - 27 October 2025

- Performing major bump for sv5 migration
- updated workflow for gh releases & breaking change detection
- BREAKING CHANGE

## [1.34.2](https://github.com/juspay/svelte-ui-components/compare/1.34.2..1.34.1) - 27 October 2025

- migrated all components to runes (sv5) syntax
- updated props for all components
- default props are not prebuilt; no need to explictly pass default props

## [1.34.1](https://github.com/juspay/svelte-ui-components/compare/1.34.1..v1.34.1) - 6 August 2025

This workflow triggers on merges to the `release` branch and performs the following actions:
- Determines the semantic version bump (major, minor, patch) based on conventional commit messages.
- Updates the package version.
- Generates a `CHANGELOG.md` using `auto-changelog`.
- Builds the package.
- Commits changes, pushes a new git tag, and creates a GitHub Release.
- Publishes the new version to the NPM registry.

- ci: Automate release and publishing process ([4225408](https://github.com/juspay/svelte-ui-components/commit/422540846ea55556249d10f0db46cbbfaddcd22b))

## [v1.34.1](https://github.com/juspay/svelte-ui-components/compare/v1.34.1..1.34.0) - 6 August 2025

This workflow triggers on merges to the `release` branch and performs the following actions:
- Determines the semantic version bump (major, minor, patch) based on conventional commit messages.
- Updates the package version.
- Generates a `CHANGELOG.md` using `auto-changelog`.
- Builds the package.
- Commits changes, pushes a new git tag, and creates a GitHub Release.
- Publishes the new version to the NPM registry.

- ci: Automate release and publishing process ([ef662f3](https://github.com/juspay/svelte-ui-components/commit/ef662f327a3b51f1600a34040320c97d876a2577))
- Build(deps-dev): bump vite from 4.5.13 to 4.5.14 ([1ee024c](https://github.com/juspay/svelte-ui-components/commit/1ee024c729db4867634498a5dc8effb047cc5bef))
- feat: Expose CSS variables for Brand Loader ([8067db5](https://github.com/juspay/svelte-ui-components/commit/8067db5ac140434bb06d91fe9171bd51a182a45b))

## [1.34.0](https://github.com/juspay/svelte-ui-components/compare/1.34.0..1.33.0) - 22 May 2025

- published version 1.34.0

## [1.33.0](https://github.com/juspay/svelte-ui-components/compare/1.33.0..1.32.0) - 4 May 2025

- released version 1.33.0 to npm

- Build(deps-dev): bump @sveltejs/kit from 1.30.4 to 2.20.6 ([4330b26](https://github.com/juspay/svelte-ui-components/commit/4330b26526fa1ef476cc0fc5289f2e5611c7900c))

## [1.32.0](https://github.com/juspay/svelte-ui-components/compare/1.32.0..1.31.0) - 28 April 2025

- published package to version 1.32.0

- chore: release: 1.31.0 ([8ebb5fc](https://github.com/juspay/svelte-ui-components/commit/8ebb5fcdab45dd09e6b35f6e3bf43e2f59691655))

## [1.31.0](https://github.com/juspay/svelte-ui-components/compare/1.31.0..1.30.0) - 24 April 2025

- publishing 1.31.0

- Build(deps-dev): bump vite from 4.5.11 to 4.5.13 ([b2ca76f](https://github.com/juspay/svelte-ui-components/commit/b2ca76f85031f3ac1d36640c615f41c50c6bf6ca))
- chore: release: 1.31.0 ([67569fd](https://github.com/juspay/svelte-ui-components/commit/67569fd80493c08ba952437db427bbc858906e2a))
- chore: released version 1.30.0 ([25dba34](https://github.com/juspay/svelte-ui-components/commit/25dba34e0011367dcfe8e0c779bc9310f72b1ff6))

## [1.30.0](https://github.com/juspay/svelte-ui-components/compare/1.30.0..1.29.0) - 21 April 2025

- published version 1.30.0

- chore: released version 1.30.0 ([a63e726](https://github.com/juspay/svelte-ui-components/commit/a63e72620c9cddf952aa3aabaa467b9dc4804b39))
- chore: released version 1.29.0 ([1150d7c](https://github.com/juspay/svelte-ui-components/commit/1150d7c260dcf249fd58443fee687246b43a8f05))

## [1.29.0](https://github.com/juspay/svelte-ui-components/compare/1.29.0..1.28.3) - 3 April 2025

- released version 1.29.0

- Build(deps-dev): bump vite from 4.5.9 to 4.5.11 ([68dfe96](https://github.com/juspay/svelte-ui-components/commit/68dfe96d98e17ea46b6e15200f0722dced05cd3f))
- chore: released version 1.29.0 ([e7eb834](https://github.com/juspay/svelte-ui-components/commit/e7eb83425a42f2fe97ac5c8c0abfcf8ecd627aa5))

## [1.28.3](https://github.com/juspay/svelte-ui-components/compare/1.28.3..1.27.0) - 3 April 2025

- added vars to customisation height, width, top, bottom and left
- added vars to customise BrandLoader bg & dimensions
- published changes to version 1.28.3

## [1.27.0](https://github.com/juspay/svelte-ui-components/compare/1.27.0..1.26.0) - 26 March 2025

- published version 1.27.0

- VERSION: 1.27.0: release version 1.27.0 ([957c348](https://github.com/juspay/svelte-ui-components/commit/957c3482e7b82cdf830c9c0580ab02bc507646d5))

## [1.26.0](https://github.com/juspay/svelte-ui-components/compare/1.26.0..1.24.0) - 17 March 2025

- releasing changes on 1.26.0

- VERSION: 1.26.0: Releasing version 1.26.0 ([d31c571](https://github.com/juspay/svelte-ui-components/commit/d31c5711a0740c571fff0f553dd9417f2d7ac75d))
- Build(deps-dev): bump vite from 4.5.3 to 4.5.5 ([0c85503](https://github.com/juspay/svelte-ui-components/commit/0c855030abfcc45c3bf3445ea1723e1966f05c82))
- Build(deps): bump micromatch from 4.0.5 to 4.0.8 ([41f9768](https://github.com/juspay/svelte-ui-components/commit/41f9768bd10622da1c5bf6b46971b6e88fd29515))
- Build(deps): bump braces from 3.0.2 to 3.0.3 ([44a7a47](https://github.com/juspay/svelte-ui-components/commit/44a7a47efe584897e433b803da4834155428131c))
- Build(deps): bump nanoid from 3.3.7 to 3.3.8 ([ce0733a](https://github.com/juspay/svelte-ui-components/commit/ce0733af58c355d418a60bf38d85c2caad17f473))
- Build(deps): bump cross-spawn from 7.0.3 to 7.0.6 ([c68a344](https://github.com/juspay/svelte-ui-components/commit/c68a344d8fb5347465e148f9f574d642a44eb95a))
- Build(deps): bump rollup from 3.29.4 to 3.29.5 ([64a648a](https://github.com/juspay/svelte-ui-components/commit/64a648aed89ba394a60b37bf4dfdfe4e82b5e0c5))

## [1.24.0](https://github.com/juspay/svelte-ui-components/compare/1.24.0..1.23.0) - 3 March 2025

- release 1.24.0

## [1.23.0](https://github.com/juspay/svelte-ui-components/compare/1.23.0..1.22.0) - 7 February 2025

- released version 1.23.0

- feat: added css variables for icon and text display for button ([b7596b0](https://github.com/juspay/svelte-ui-components/commit/b7596b0ef12a005682e6eb1a5791e621ddf78e40))

## [1.22.0](https://github.com/juspay/svelte-ui-components/compare/1.22.0..1.21.0) - 26 December 2024

- published version 1.22.0

## [1.21.0](https://github.com/juspay/svelte-ui-components/compare/1.21.0..1.20.0) - 23 December 2024

- published version 1.21.0

- VERSION: 1.21.0 ([a191afe](https://github.com/juspay/svelte-ui-components/commit/a191afe5bc664c60905613490038094f4bc23c5a))

## [1.20.0](https://github.com/juspay/svelte-ui-components/compare/1.20.0..1.17.0) - 23 December 2024

- published version 1.20.0

- VERSION: 1.20.0 ([2b3234c](https://github.com/juspay/svelte-ui-components/commit/2b3234c62cb8462ecaa40b1b8d1cc7347553cac2))

## [1.17.0](https://github.com/juspay/svelte-ui-components/compare/1.17.0..1.12.0) - 11 October 2024

- release new version & exposed grid item

## [1.12.0](https://github.com/juspay/svelte-ui-components/compare/1.12.0..1.11.0) - 23 September 2024

- published version 1.12.0

- - Disable button text if text is empty or null ([4e1202b](https://github.com/juspay/svelte-ui-components/commit/4e1202b7dce14139bd23108f1774f4a7fb1094db))

## [1.11.0](https://github.com/juspay/svelte-ui-components/compare/1.11.0..1.10.0) - 29 August 2024

- publishing version 1.11.0

## [1.10.0](https://github.com/juspay/svelte-ui-components/compare/1.10.0..1.9.0) - 19 June 2024

- releasing version 1.10.0
- added formatting changes

- BZ:6027: feat: Added support in select component to choose whether to show selected item or not ([1fe8bb6](https://github.com/juspay/svelte-ui-components/commit/1fe8bb6bb3d6ad5f81745c99ebb43e26c0955b09))

## [1.9.0](https://github.com/juspay/svelte-ui-components/compare/1.9.0..1.8.0) - 3 June 2024

- Releasing version 1.9.0
- Updated publish script to force push publish script changes
- Formatted Select.svelte with formatter

## [1.8.0](https://github.com/juspay/svelte-ui-components/compare/1.8.0..1.7.0) - 28 May 2024

- releasing version 1.8.0

## [1.7.0](https://github.com/juspay/svelte-ui-components/compare/1.7.0..1.6.0) - 17 May 2024

- release version 1.7.0

- Build(deps-dev): bump vite from 4.5.2 to 4.5.3 ([34e0404](https://github.com/juspay/svelte-ui-components/commit/34e0404c7dac3432a93ff205fc84a2621e1433aa))

## [1.6.0](https://github.com/juspay/svelte-ui-components/compare/1.6.0..1.5.0) - 8 May 2024

Bumps [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite) from 4.5.2 to 4.5.3.
- [Release notes](https://github.com/vitejs/vite/releases)
- [Changelog](https://github.com/vitejs/vite/blob/v4.5.3/packages/vite/CHANGELOG.md)
- [Commits](https://github.com/vitejs/vite/commits/v4.5.3/packages/vite)

---
updated-dependencies:
- dependency-name: vite
dependency-type: direct:development
...

Signed-off-by: dependabot[bot] &lt;support@github.com&gt;

- Build(deps-dev): bump vite from 4.5.2 to 4.5.3 ([7576ab3](https://github.com/juspay/svelte-ui-components/commit/7576ab32d33d4179b87c51d5b802ef35151370b5))
- Add css variable for left and right content visibility for list item component ([c084fb2](https://github.com/juspay/svelte-ui-components/commit/c084fb2fa0702a095214c7c2b609743cddde53a1))

## [1.5.0](https://github.com/juspay/svelte-ui-components/compare/1.5.0..1.4.0) - 1 March 2024

- publishing out version 1.5.0

## [1.4.0](https://github.com/juspay/svelte-ui-components/compare/1.4.0..1.3.0) - 1 March 2024

- releasing version 1.4.0 to npm

- Build(deps-dev): bump vite from 4.5.0 to 4.5.2 ([e45d359](https://github.com/juspay/svelte-ui-components/commit/e45d359f62b979ca47113a705e5a656c16b6e0fd))

## [1.3.0](https://github.com/juspay/svelte-ui-components/compare/1.3.0..1.2.0) - 14 January 2024

- releasing version 1.3.0 with support for fallback images in list item left icon

## [1.2.0](https://github.com/juspay/svelte-ui-components/compare/1.2.0..1.1.0) - 15 December 2023

- releasing version 1.2.0

## [1.1.0](https://github.com/juspay/svelte-ui-components/compare/1.1.0..1.0.0) - 13 December 2023

- releasing version: 1.1.0

## 1.0.0 - 17 November 2023

- added publish script for building & pushing the package to npmjs
