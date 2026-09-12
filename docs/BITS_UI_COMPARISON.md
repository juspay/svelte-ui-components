# Bits UI comparison

A capability comparison between this library and [Bits UI](https://github.com/huntabyte/bits-ui),
run against commit `013ff881062c975e064010afeb126d9a772f7ec2` (version 2.19.1, MIT).

## What the two libraries are

Bits UI is **headless**: it ships behavior, state and ARIA with no styling, as compound
components (`Select.Root` / `Select.Trigger` / `Select.Content`) whose logic lives in
`*.svelte.ts` state classes. This library ships **styled** components with a single-element
API, a CSS custom property theme contract, and a web-component build.

So Bits UI is a reference for behavior, not for structure. Nothing here adopts its
compound-component model, its runtime, or its dependencies (`@floating-ui`, `runed`,
`tabbable`, `svelte-toolbelt`). No dependency was added and no public API changed
incompatibly.

Its 43 primitives are also a narrower set: charts, chat, media players, device frames and
the Table have no counterpart there, so their absence from the reference is not a gap in
either direction.

## Reproducing the local setup

```sh
git clone https://github.com/huntabyte/bits-ui.git
cd bits-ui && pnpm install --frozen-lockfile
pnpm build:packages                       # builds the package
pnpm -F bits-ui test                      # 127 unit tests
pnpm -F tests exec playwright install     # chromium + webkit
pnpm -F tests test:browser                # component tests, chromium and webkit
pnpm -F docs build:content && pnpm -F docs build:search
pnpm -F docs exec vite dev                # the documentation site
```

The documentation site's `build:demos` step needs a writable `TMPDIR` and runs `tsx`; on a
sandboxed temp directory it fails to open its IPC socket. Running the script under plain
`node` works, and the site itself does not need that step to serve.

## How the comparison was done

Every source file on both sides was partitioned into 45 hash-pinned packets of at most
80KB, and each packet was read in full by a separate reviewer with no ability to read
outside it. All 45 returned a complete coverage receipt naming the exact byte hash they
read. That covers all 96 exported components plus every Bits UI primitive and its shared
internals.

A receipt proves the source was read. It does not prove a finding is correct, so every
change below was reproduced as a failing test before it was written.

## What changed

Twelve components changed and four were added. Every existing default is unchanged, every new prop is optional,
and the custom-element wrappers expose all of them.

**Tabs.** Arrow keys, `Home` and `End` now skip disabled items, and the list keeps one
logical tab stop: the focused tab while you are inside it, the selected tab otherwise, and
the first enabled tab when nothing is selected — so a list with no selection is still
reachable by `Tab` without inventing a selection. `activationMode="manual"` moves focus
without selecting, which is the WAI-ARIA APG recommendation when showing a panel is
expensive. `loop` and `dir` make wrapping and horizontal arrow direction explicit;
direction is otherwise inherited from the document.

**Checkbox, Radio, Toggle, Slider.** Optional `name`, `value`, `required` and `form` let
these take part in native form submission. Submitted values follow the visible state:
unchecked, mixed and disabled controls submit nothing. A required checkbox redirects
invalid-validation focus to the visible box, because the control carrying `required` is
deliberately not a tab stop. Slider gains `ariaValueText`, and clamps only the painted
fill — a value outside its own range is still reported as given, and an empty, reversed or
non-finite range paints nothing instead of `NaN`.

**GridItem and Icon.** Both carried `role="button"` and `tabindex="0"` with no activation
of their own: a keyboard user could focus them and nothing happened. Both now handle
`Enter` and `Space`, and Icon drops the role and the tab stop entirely when it has no click
handler rather than announcing a button that does nothing.

**ThemeSwitcher.** Segment buttons carry `aria-pressed`, so the selected theme is reported
rather than shown only by the sliding indicator.

**Calendar, Select, ColorPicker, DateRangePicker.** A second pass closed four keyboard and
focus gaps: arrow keys that stepped onto disabled days and a grid with no reachable tab
stop; a listbox with no `Home` or `End`; a saturation panel claiming `role="slider"` with
no keyboard handling and a popover with no Escape; and a panel declaring `aria-modal`
while letting `Tab` walk straight out of it.

**Four new primitives.** `Separator`, `Label`, `AspectRatio` and `RatingGroup` were on the
missing list and are now built, in this library's own style rather than ported.

**Toggle.** `checked` is bindable, so `bind:checked` reports the switch back to its parent
as it already did on Checkbox, Radio and Slider.

**TypewriterText.** The optional `markdown` mode reuses `renderMarkdown` for every
revealed prefix and ignores custom renderers while enabled. Raw HTML is escaped and
unsafe link/image protocols are stripped. The optional parser loads lazily, with escaped
source during loading or failure. Plain text stays the default; `renderText` remains a
trusted HTML callback whose output the caller must sanitize. The Svelte and custom-element
APIs expose `markdownOptions` for stricter policies without changing the shared allow-lists.

## Verification

| Suite                 | Before                | After                 |
| --------------------- | --------------------- | --------------------- |
| Unit tests            | 919                   | 1185                  |
| Browser tests         | 630 passed, 1 skipped | 684 passed, 1 skipped |
| `svelte-check` errors | 0                     | 0                     |

One pre-existing browser test, `tests/typewriter-text-reduced-motion.test.ts`, measures
mutation counts against a 50ms budget and flaked once on a loaded machine. It passes in
isolation and is unrelated to these changes.

## Component matrix

"Reference counterpart" names the Bits UI primitive covering similar ground, not an
equivalent implementation. A dash means Bits UI has nothing in that area.

| Component           | Reference counterpart           | This pass                                                                               |
| ------------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| Accordion           | Accordion, Collapsible          | Reviewed, no change                                                                     |
| AreaChart           | —                               | Reviewed, no change                                                                     |
| AspectRatio         | AspectRatio                     | Added                                                                                   |
| AttachmentChipRow   | —                               | Reviewed, no change                                                                     |
| Avatar              | Avatar                          | Reviewed, no change                                                                     |
| Badge               | —                               | Reviewed, no change                                                                     |
| Banner              | —                               | Reviewed, no change                                                                     |
| BarChart            | —                               | Reviewed, no change                                                                     |
| Book                | —                               | Reviewed, no change                                                                     |
| BrandLoader         | —                               | Reviewed, no change                                                                     |
| Breadcrumb          | —                               | Reviewed, no change                                                                     |
| Browser             | —                               | Reviewed, no change                                                                     |
| Button              | Button                          | Reviewed, no change                                                                     |
| Calendar            | Calendar, RangeCalendar         | Arrow keys skip disabled days; one reachable tab stop                                   |
| Card                | —                               | Reviewed, no change                                                                     |
| Carousel            | —                               | Reviewed, no change                                                                     |
| Chat                | —                               | Reviewed, no change                                                                     |
| ChatBubble          | —                               | Reviewed, no change                                                                     |
| ChatComposer        | —                               | Reviewed, no change                                                                     |
| ChatHeader          | —                               | Reviewed, no change                                                                     |
| ChatMessage         | —                               | Reviewed, no change                                                                     |
| ChatMessageList     | —                               | Reviewed, no change                                                                     |
| ChatSuggestions     | —                               | Reviewed, no change                                                                     |
| ChatToolStatus      | —                               | Reviewed, no change                                                                     |
| CheckListItem       | —                               | Reviewed, no change                                                                     |
| Checkbox            | Checkbox                        | Native form participation, required focus redirect, data-state hooks                    |
| ChipInput           | —                               | Reviewed, no change                                                                     |
| Choicebox           | RadioGroup, ToggleGroup         | Reviewed, no change                                                                     |
| ColorPicker         | —                               | Keyboard control for the saturation panel; Escape closes the popover                    |
| Combobox            | Combobox                        | Reviewed, no change                                                                     |
| CommandMenu         | Command                         | Reviewed, no change                                                                     |
| ContextMenu         | ContextMenu                     | Reviewed, no change                                                                     |
| DateRangePicker     | DateRangePicker, DateRangeField | Main panel traps focus, matching its compare panel                                      |
| DeltaIndicator      | —                               | Reviewed, no change                                                                     |
| Draggable           | —                               | Reviewed, no change                                                                     |
| DualAxisBarChart    | —                               | Reviewed, no change                                                                     |
| EmptyState          | —                               | Reviewed, no change                                                                     |
| FileDropzoneTrigger | —                               | Reviewed, no change                                                                     |
| FileInput           | —                               | Reviewed, no change                                                                     |
| FunnelChart         | —                               | Reviewed, no change                                                                     |
| Gallery             | —                               | Reviewed, no change                                                                     |
| Gauge               | Meter                           | Reviewed, no change                                                                     |
| GridItem            | —                               | Enter and Space activation                                                              |
| HITL                | —                               | Reviewed, no change                                                                     |
| Icon                | —                               | Enter and Space activation, role only when interactive                                  |
| IconStack           | —                               | Reviewed, no change                                                                     |
| IframeViewer        | —                               | Reviewed, no change                                                                     |
| Img                 | —                               | Reviewed, no change                                                                     |
| Input               | —                               | Reviewed, no change                                                                     |
| InputButton         | —                               | Reviewed, no change                                                                     |
| KeyValue            | —                               | Reviewed, no change                                                                     |
| KeyboardInput       | —                               | Reviewed, no change                                                                     |
| Label               | Label                           | Added                                                                                   |
| LineChart           | —                               | Reviewed, no change                                                                     |
| ListItem            | —                               | Reviewed, no change                                                                     |
| Loader              | —                               | Reviewed, no change                                                                     |
| LoadingDots         | —                               | Reviewed, no change                                                                     |
| LottiePlayer        | —                               | Reviewed, no change                                                                     |
| MarkdownText        | —                               | Reviewed, no change                                                                     |
| MediaPlayer         | —                               | Reviewed, no change                                                                     |
| MediaUpload         | —                               | Reviewed, no change                                                                     |
| Menu                | DropdownMenu, Menubar           | Reviewed, no change                                                                     |
| Modal               | Dialog, AlertDialog             | Reviewed, no change                                                                     |
| ModalAnimation      | —                               | Reviewed, no change                                                                     |
| OverlayAnimation    | —                               | Reviewed, no change                                                                     |
| Pagination          | Pagination                      | Reviewed, no change                                                                     |
| Phone               | —                               | Reviewed, no change                                                                     |
| PieChart            | —                               | Reviewed, no change                                                                     |
| Pill                | —                               | Reviewed, no change                                                                     |
| Progress            | Progress                        | Reviewed, no change                                                                     |
| ProportionBar       | —                               | Reviewed, no change                                                                     |
| Radio               | RadioGroup                      | required and form association, data-state hooks                                         |
| RatingGroup         | RatingGroup                     | Added                                                                                   |
| RelativeTime        | —                               | Reviewed, no change                                                                     |
| Resizable           | —                               | Reviewed, no change                                                                     |
| SankeyChart         | —                               | Reviewed, no change                                                                     |
| Scroller            | ScrollArea                      | Reviewed, no change                                                                     |
| Select              | Select                          | Home and End jump to the first and last selectable row                                  |
| Separator           | Separator                       | Added                                                                                   |
| Sheet               | Dialog                          | Reviewed, no change                                                                     |
| Shimmer             | —                               | Reviewed, no change                                                                     |
| Slider              | Slider                          | Native form participation, ariaValueText, clamped fill                                  |
| Snippet             | —                               | Reviewed, no change                                                                     |
| SplitButton         | DropdownMenu (composed)         | Reviewed, no change                                                                     |
| SplitInput          | PinInput                        | Reviewed, no change                                                                     |
| StatCard            | —                               | Reviewed, no change                                                                     |
| Status              | —                               | Reviewed, no change                                                                     |
| Step                | —                               | Reviewed, no change                                                                     |
| Stepper             | —                               | Reviewed, no change                                                                     |
| Table               | —                               | Reviewed, no change                                                                     |
| Tabs                | Tabs                            | Manual activation, disabled items, loop, direction, roving tab stop, data-state hooks   |
| TaskList            | —                               | Reviewed, no change                                                                     |
| ThemeSwitcher       | ToggleGroup                     | aria-pressed on segment buttons                                                         |
| ThinkingIndicator   | —                               | Reviewed, no change                                                                     |
| Toast               | —                               | Reviewed, no change                                                                     |
| Toggle              | Switch, Toggle                  | Native form participation, bindable checked, data-state hooks                           |
| ToolCallLog         | —                               | Reviewed, no change                                                                     |
| Toolbar             | Toolbar                         | Reviewed, no change                                                                     |
| Tooltip             | Tooltip, LinkPreview, Popover   | Reviewed, no change                                                                     |
| TypewriterText      | —                               | Optional safe Markdown on every streamed prefix; trusted HTML callback remains explicit |

## Reference capabilities this library does not have

These are real differences, deliberately not built in this pass. They are feature
decisions, not defects.

- **Compound components.** Bits UI exposes each part (`Trigger`, `Content`, `Item`) as its
  own component with a `child` snippet that hands the caller the computed props. This
  library's single-element API with a `classes` escape hatch is a different, intentional
  trade-off.
- **Shared interaction layers.** `FocusScope`, `DismissibleLayer`, `EscapeLayer`,
  `ScrollLock`, `PresenceManager`, `RovingFocusGroup` and a pointer-trajectory `GraceArea`
  are reused across its primitives. A first step in that direction is taken here:
  `src/lib/_interaction/focus.ts` now holds the focus-trap logic that Modal, Sheet and
  DateRangePicker each carried a copy of, plus the shadow-aware active-element lookup
  Modal had kept to itself, and `src/lib/_interaction/dismissal.ts` gives Escape and
  outside presses a single owner across all five overlays. Ownership there is an
  explicit registration order rather than DOM nesting, because nesting is the wrong
  signal: a portaled dropdown is a sibling of the modal it visually sits inside. Still
  per-component and unshared: presence and exit animation, roving focus, and the
  floating-position maths.
- **Floating positioning.** Bits UI delegates to `@floating-ui`; Select, Menu and Tooltip
  here each carry their own positioning maths.
- **Primitives with no counterpart here:** `Meter`, `NavigationMenu`, `Menubar`,
  `PinInput` as a standalone, `LinkPreview`, `ScrollArea`, and a global `BitsConfig`
  for cascading defaults. `Separator`, `Label`, `AspectRatio` and `RatingGroup` were
  in this list and have since been added.
- **Date handling.** Bits UI builds on `@internationalized/date` with segmented date
  fields, locale placeholders for 75 locales, and a `readonly` calendar state distinct from
  `disabled`.

## Candidates raised but not acted on

Every candidate below came from the review and was checked against the source. These were
rejected or deferred rather than silently dropped.

- **FileDropzoneTrigger compact mode does not wire `onclick`.** Not a defect: its
  `properties.ts` documents compact mode as relying on FileInput's own whole-area click
  handling.
- **`validateInput` does not validate `number`, `time`, `date`, `search` or `url`.** Already
  documented as deliberate in `src/lib/types.ts`.
- **Fixed in later passes**, each reproduced as a failing test first: Calendar arrow keys
  landing on disabled days, and a grid with no reachable tab stop; DateRangePicker's main
  panel declaring `aria-modal` without trapping focus, unlike its own compare panel;
  ColorPicker's saturation panel exposing `role="slider"` with no keyboard handling, its
  popover having no Escape close, and its external-value sync sitting in a derived that
  nothing read; Select's missing `Home`/`End` and its unclamped vertical placement;
  Snippet's swallowed clipboard failures; ListItem's nested button roles.
- **Confirmed independently by a consumer-side audit of this library and fixed here:**
  Modal read `lockScroll` again at teardown rather than remembering what it had acquired,
  so a prop change while open either stranded the shared reference-counted scroll lock or
  released a hold another component still needed; and Sheet took focus into its panel and
  never gave it back.
- **Reviewed and deliberately not changed:** `Img` fetches any cross-origin URL for
  `inlineSvg`. That is the component's purpose and its sanitisation is thorough, so an
  origin allowlist is a policy decision for consumers rather than a defect to fix here.
- **Still open:** Select has no arrow wraparound; Calendar's month navigation is not
  bounded by `minDate`/`maxDate`; ListItem renders its `label` through `{@html}`.

## Anti-goals

This pass did not restyle anything, did not change any default, and did not port Bits UI
code. The comparison is a source read plus executed tests. It is not a visual parity
claim: no screenshot comparison was made between the two libraries.
