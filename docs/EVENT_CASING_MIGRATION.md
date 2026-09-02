# Event-casing migration plan (targeting 4.0.0)

`DESIGN_PRINCIPLES.md` states the rule: a native DOM event forwarded as-is keeps
Svelte 5's own lowercase spelling (`onclick`), and every synthesized event is
camelCase from the character after `on` (`onRowClick`).

`scripts/event-casing-baseline.json` grandfathers the props that already
broke that rule when the check was introduced. The check stops the count
growing; it has never fixed the existing set. Renaming any of them is a
breaking prop-name change for real consumers, which is why they were baselined
rather than cleaned up as a drive-by.

This document is the plan for clearing them. **Nothing here has been renamed.**

## Six of the 100 are not violations

The checker classifies a prop as a native-event forward by **name**. That is
wrong for six props whose names happen to collide with a DOM event but which
hand back domain data:

| Component         | Prop                              | What it actually passes                         |
| ----------------- | --------------------------------- | ----------------------------------------------- |
| Combobox          | `onClick`                         | not a `MouseEvent` forward                      |
| Table             | `onInput`, `onSelect`, `onToggle` | `(rowIndex, checked/selectedId, originalIndex)` |
| ThinkingIndicator | `onToggle`                        | `() => void`                                    |
| TypewriterText    | `onProgress`                      | `TypewriterProgress`, not a `ProgressEvent`     |

These are already correctly camelCased. Lowercasing them on a name match would
rename six _correct_ props into wrong ones. The classification has to read the
signature — `Input.onBlur?: (event: FocusEvent) => void` is a real forward and
`Table.onToggle?: (rowIndex: number, …)` is not — which is what
`forwardsDomEvent` in `scripts/migrate/casing.ts` does.

Fixing the classification also makes the check **stricter**, because a prop
whose name matches a DOM event but whose signature does not was previously
excused entirely. That surfaced **48 real violations the old checker never
reported** — `Accordion.ontoggle`, `Checkbox.onclick`, `Img.onerror`,
`Slider.oninput` and so on, all synthetic events written in lowercase.

**The baseline therefore goes 100 → 142**: six false positives out, 48
previously-invisible violations in. That is done in this change, and the
checker still reports `0 new`.

## Every one of the 142 has a mechanically derivable name

`scripts/migrate/casing.ts` derives the correct spelling for all of them, and
`casing.test.ts` asserts it against the real baseline file: **142 violations, 0
unresolved**, and no derived target collides with a prop that already exists on
the same component. That
test is also the guard going forward — a newly added violation whose name
cannot be derived fails it, which is what keeps the eventual rename mechanical.

They fall into three shapes.

### A — native events wrongly camelCased (7 props)

These genuinely forward a DOM event — their signatures take `FocusEvent`,
`MouseEvent`, `KeyboardEvent` and so on — so the rule wants the lowercase
spelling. All seven are on `Input`.

| Component         | Today        | Becomes      |
| ----------------- | ------------ | ------------ |
| Combobox          | `onClick`    | `onclick`    |
| Input             | `onBlur`     | `onblur`     |
| Input             | `onClick`    | `onclick`    |
| Input             | `onFocus`    | `onfocus`    |
| Input             | `onFocusout` | `onfocusout` |
| Input             | `onInput`    | `oninput`    |
| Input             | `onKeyDown`  | `onkeydown`  |
| Input             | `onPaste`    | `onpaste`    |
| Table             | `onInput`    | `oninput`    |
| Table             | `onSelect`   | `onselect`   |
| Table             | `onToggle`   | `ontoggle`   |
| ThinkingIndicator | `onToggle`   | `ontoggle`   |
| TypewriterText    | `onProgress` | `onprogress` |

### B — synthetic events, partially camelCased (13 props)

Lowercase, then switching to camelCase partway through — the exact bug the rule
was written to catch. The word boundaries survive, so only the first letter is
wrong.

| Component | Today                     | Becomes                   |
| --------- | ------------------------- | ------------------------- |
| ListItem  | `oncenterTextClick`       | `onCenterTextClick`       |
| ListItem  | `onitemClick`             | `onItemClick`             |
| ListItem  | `onleftImageClick`        | `onLeftImageClick`        |
| ListItem  | `onrightImageClick`       | `onRightImageClick`       |
| ListItem  | `ontopSectionClick`       | `onTopSectionClick`       |
| Modal     | `onheaderLeftImageClick`  | `onHeaderLeftImageClick`  |
| Modal     | `onheaderRightImageClick` | `onHeaderRightImageClick` |
| Modal     | `onoverlayClick`          | `onOverlayClick`          |
| Modal     | `onprimaryButtonClick`    | `onPrimaryButtonClick`    |
| Modal     | `onsecondaryButtonClick`  | `onSecondaryButtonClick`  |
| Status    | `onbuttonClick`           | `onButtonClick`           |
| Stepper   | `onhandleStepClick`       | `onHandleStepClick`       |
| Toolbar   | `onbackClick`             | `onBackClick`             |

### C — synthetic events, entirely lowercase (the large majority)

The word boundaries are no longer in the name: nothing in `onbarclick` says
where `bar` ends. They are recovered by segmenting against a closed domain
vocabulary rather than by hand, and **every one segments exactly one way** —
`onbarclick` → `onBarClick`, `onopenrichfile` → `onOpenRichFile`,
`onafterclose` → `onAfterClose`.

A general English dictionary is deliberately not used: it would find spurious
splits, and the extra recall buys nothing on a corpus this size. Where a body
ever segments more than one way, every candidate is reported rather than one
being silently chosen — a wrong split would put a wrong prop name into the
public API.

Run `node scripts/migrate/casing-report.ts` to print the full derived map.

## The phases

The constraint that shapes everything: 11 consumers across 3 incompatible
Svelte generations. A rename that lands without an alias breaks all of them at
once, and a major bump without a mechanical path means 11 teams hand-editing
the same prop names.

**Phase 0 — fix the checker, no rename. Done in this PR.**
Classify by signature rather than by name. Six false positives leave the
baseline, 48 previously-unreported violations enter it, and the count becomes 142. Nothing consumer-visible changes: no prop is renamed, and the check still
reports `0 new`.

**Phase 1 — additive aliases, no break (a 3.x minor).**
Each prop gains its correct spelling _alongside_ the old one, both wired to the
same handler. Consumers on the old name keep working untouched; new code uses
the correct name immediately. All 142 can land together, because none of the
target names needs a decision.

**Phase 2 — deprecation warning, dev only.**
Using an old spelling logs once per prop, naming its replacement. Dev builds
only: a production warning is noise a consumer cannot act on mid-incident.

**Phase 3 — remove the old spellings in 4.0.0.**
Only after every alias has shipped in a released 3.x and the codemod entries
exist. `event-casing-baseline.json` is deleted in the same change, because the
check then has nothing left to grandfather.

## Consumers migrate mechanically

`scripts/codemod/` already does component-aware prop renaming — it resolves
import aliases, namespace imports and `svelte:component`, and warns with
`file:line:column` rather than guessing when a spread could hide a prop. Its
rename map is data, so these 100 pairs are added to it rather than a second
tool being written.

`scripts/migrate/` then reports them the way it reports the 3.0.0 Toolbar
change, so a consumer runs one command and sees everything standing between it
and the next major.

## Why not simply do the rename now

Every one of these is a published prop name, and the library is at 3.0.0. The
earliest honest window for removal is 4.0.0, and getting there without
stranding consumers means the aliases have to ship, and be released, well
before the removal. The rename itself is a small change; the sequencing is the
work.
