# Changelog All notable changes to this project will be documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/juspay/svelte-ui-components/compare/HEAD..2.133.0)

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

## [2.133.0](https://github.com/juspay/svelte-ui-components/compare/2.133.0..2.132.0) - 31 August 2026

## [2.132.0](https://github.com/juspay/svelte-ui-components/compare/2.132.0..2.131.0) - 30 August 2026

## [2.131.0](https://github.com/juspay/svelte-ui-components/compare/2.131.0..2.130.1) - 27 August 2026

## [2.130.1](https://github.com/juspay/svelte-ui-components/compare/2.130.1..2.130.0) - 27 August 2026

## [2.130.0](https://github.com/juspay/svelte-ui-components/compare/2.130.0..2.129.1) - 26 August 2026

## [2.129.1](https://github.com/juspay/svelte-ui-components/compare/2.129.1..2.129.0) - 26 August 2026

## [2.129.0](https://github.com/juspay/svelte-ui-components/compare/2.129.0..2.128.1) - 26 August 2026

## [2.128.1](https://github.com/juspay/svelte-ui-components/compare/2.128.1..2.128.0) - 26 August 2026

## [2.128.0](https://github.com/juspay/svelte-ui-components/compare/2.128.0..2.127.0) - 25 August 2026

## [2.127.0](https://github.com/juspay/svelte-ui-components/compare/2.127.0..2.126.0) - 25 August 2026

## [2.126.0](https://github.com/juspay/svelte-ui-components/compare/2.126.0..2.125.0) - 24 August 2026

## [2.125.0](https://github.com/juspay/svelte-ui-components/compare/2.125.0..2.124.0) - 21 August 2026

## [2.124.0](https://github.com/juspay/svelte-ui-components/compare/2.124.0..2.123.0) - 19 August 2026

## [2.123.0](https://github.com/juspay/svelte-ui-components/compare/2.123.0..2.122.0) - 19 August 2026

## [2.122.0](https://github.com/juspay/svelte-ui-components/compare/2.122.0..2.121.0) - 17 August 2026

## [2.121.0](https://github.com/juspay/svelte-ui-components/compare/2.121.0..2.120.3) - 15 August 2026

## [2.120.3](https://github.com/juspay/svelte-ui-components/compare/2.120.3..2.120.2) - 15 August 2026

## [2.120.2](https://github.com/juspay/svelte-ui-components/compare/2.120.2..2.120.1) - 12 August 2026

## [2.120.1](https://github.com/juspay/svelte-ui-components/compare/2.120.1..2.120.0) - 7 August 2026

## [2.120.0](https://github.com/juspay/svelte-ui-components/compare/2.120.0..2.119.0) - 6 August 2026

## [2.119.0](https://github.com/juspay/svelte-ui-components/compare/2.119.0..2.118.1) - 6 August 2026

## [2.118.1](https://github.com/juspay/svelte-ui-components/compare/2.118.1..2.118.0) - 5 August 2026

## [2.118.0](https://github.com/juspay/svelte-ui-components/compare/2.118.0..2.117.1) - 5 August 2026

## [2.117.1](https://github.com/juspay/svelte-ui-components/compare/2.117.1..2.117.0) - 5 August 2026

## [2.117.0](https://github.com/juspay/svelte-ui-components/compare/2.117.0..2.116.1) - 5 August 2026

## [2.116.1](https://github.com/juspay/svelte-ui-components/compare/2.116.1..2.116.0) - 5 August 2026

## [2.116.0](https://github.com/juspay/svelte-ui-components/compare/2.116.0..2.115.0) - 5 August 2026

## [2.115.0](https://github.com/juspay/svelte-ui-components/compare/2.115.0..2.114.1) - 5 August 2026

## [2.114.1](https://github.com/juspay/svelte-ui-components/compare/2.114.1..2.114.0) - 4 August 2026

## [2.114.0](https://github.com/juspay/svelte-ui-components/compare/2.114.0..2.113.0) - 3 August 2026

## [2.113.0](https://github.com/juspay/svelte-ui-components/compare/2.113.0..2.112.0) - 3 August 2026

## [2.112.0](https://github.com/juspay/svelte-ui-components/compare/2.112.0..2.111.4) - 3 August 2026

## [2.111.4](https://github.com/juspay/svelte-ui-components/compare/2.111.4..2.111.3) - 1 August 2026

## [2.111.3](https://github.com/juspay/svelte-ui-components/compare/2.111.3..2.111.2) - 30 July 2026

## [2.111.2](https://github.com/juspay/svelte-ui-components/compare/2.111.2..2.111.1) - 27 July 2026

## [2.111.1](https://github.com/juspay/svelte-ui-components/compare/2.111.1..2.111.0) - 25 July 2026

## [2.111.0](https://github.com/juspay/svelte-ui-components/compare/2.111.0..2.110.0) - 17 July 2026

## [2.110.0](https://github.com/juspay/svelte-ui-components/compare/2.110.0..2.109.0) - 17 July 2026

## [2.109.0](https://github.com/juspay/svelte-ui-components/compare/2.109.0..2.108.1) - 17 July 2026

## [2.108.1](https://github.com/juspay/svelte-ui-components/compare/2.108.1..2.108.0) - 17 July 2026

## [2.108.0](https://github.com/juspay/svelte-ui-components/compare/2.108.0..2.107.1) - 16 July 2026

## [2.107.1](https://github.com/juspay/svelte-ui-components/compare/2.107.1..2.107.0) - 16 July 2026

## [2.107.0](https://github.com/juspay/svelte-ui-components/compare/2.107.0..2.106.2) - 16 July 2026

## [2.106.2](https://github.com/juspay/svelte-ui-components/compare/2.106.2..2.106.1) - 16 July 2026

## [2.106.1](https://github.com/juspay/svelte-ui-components/compare/2.106.1..2.106.0) - 16 July 2026

## [2.106.0](https://github.com/juspay/svelte-ui-components/compare/2.106.0..2.105.0) - 16 July 2026

## [2.105.0](https://github.com/juspay/svelte-ui-components/compare/2.105.0..2.104.0) - 16 July 2026

## [2.104.0](https://github.com/juspay/svelte-ui-components/compare/2.104.0..2.103.0) - 16 July 2026

## [2.103.0](https://github.com/juspay/svelte-ui-components/compare/2.103.0..2.102.0) - 15 July 2026

## [2.102.0](https://github.com/juspay/svelte-ui-components/compare/2.102.0..2.101.0) - 15 July 2026

## [2.101.0](https://github.com/juspay/svelte-ui-components/compare/2.101.0..2.100.2) - 15 July 2026

## [2.100.2](https://github.com/juspay/svelte-ui-components/compare/2.100.2..2.100.1) - 15 July 2026

## [2.100.1](https://github.com/juspay/svelte-ui-components/compare/2.100.1..2.100.0) - 15 July 2026

## [2.100.0](https://github.com/juspay/svelte-ui-components/compare/2.100.0..2.99.0) - 14 July 2026

## [2.99.0](https://github.com/juspay/svelte-ui-components/compare/2.99.0..2.98.2) - 14 July 2026

## [2.98.2](https://github.com/juspay/svelte-ui-components/compare/2.98.2..2.98.1) - 14 July 2026

## [2.98.1](https://github.com/juspay/svelte-ui-components/compare/2.98.1..2.98.0) - 14 July 2026

## [2.98.0](https://github.com/juspay/svelte-ui-components/compare/2.98.0..2.97.2) - 14 July 2026

## [2.97.2](https://github.com/juspay/svelte-ui-components/compare/2.97.2..2.97.1) - 14 July 2026

## [2.97.1](https://github.com/juspay/svelte-ui-components/compare/2.97.1..2.97.0) - 14 July 2026

## [2.97.0](https://github.com/juspay/svelte-ui-components/compare/2.97.0..2.96.2) - 14 July 2026

## [2.96.2](https://github.com/juspay/svelte-ui-components/compare/2.96.2..2.96.1) - 14 July 2026

## [2.96.1](https://github.com/juspay/svelte-ui-components/compare/2.96.1..2.96.0) - 13 July 2026

## [2.96.0](https://github.com/juspay/svelte-ui-components/compare/2.96.0..2.95.1) - 12 July 2026

## [2.95.1](https://github.com/juspay/svelte-ui-components/compare/2.95.1..2.95.0) - 12 July 2026

## [2.95.0](https://github.com/juspay/svelte-ui-components/compare/2.95.0..2.94.0) - 12 July 2026

## [2.94.0](https://github.com/juspay/svelte-ui-components/compare/2.94.0..2.93.0) - 11 July 2026

## [2.93.0](https://github.com/juspay/svelte-ui-components/compare/2.93.0..2.92.0) - 11 July 2026

## [2.92.0](https://github.com/juspay/svelte-ui-components/compare/2.92.0..2.91.1) - 11 July 2026

## [2.91.1](https://github.com/juspay/svelte-ui-components/compare/2.91.1..2.91.0) - 11 July 2026

## [2.91.0](https://github.com/juspay/svelte-ui-components/compare/2.91.0..2.90.1) - 11 July 2026

## [2.90.1](https://github.com/juspay/svelte-ui-components/compare/2.90.1..2.90.0) - 10 July 2026

## [2.90.0](https://github.com/juspay/svelte-ui-components/compare/2.90.0..2.89.2) - 10 July 2026

## [2.89.2](https://github.com/juspay/svelte-ui-components/compare/2.89.2..2.89.1) - 10 July 2026

## [2.89.1](https://github.com/juspay/svelte-ui-components/compare/2.89.1..2.89.0) - 9 July 2026

## [2.89.0](https://github.com/juspay/svelte-ui-components/compare/2.89.0..2.88.0) - 8 July 2026

## [2.88.0](https://github.com/juspay/svelte-ui-components/compare/2.88.0..2.87.0) - 8 July 2026

## [2.87.0](https://github.com/juspay/svelte-ui-components/compare/2.87.0..2.86.0) - 7 July 2026

## [2.86.0](https://github.com/juspay/svelte-ui-components/compare/2.86.0..2.85.0) - 7 July 2026

## [2.85.0](https://github.com/juspay/svelte-ui-components/compare/2.85.0..2.84.1) - 7 July 2026

## [2.84.1](https://github.com/juspay/svelte-ui-components/compare/2.84.1..2.84.0) - 7 July 2026

## [2.84.0](https://github.com/juspay/svelte-ui-components/compare/2.84.0..2.83.0) - 7 July 2026

## [2.83.0](https://github.com/juspay/svelte-ui-components/compare/2.83.0..2.82.0) - 7 July 2026

## [2.82.0](https://github.com/juspay/svelte-ui-components/compare/2.82.0..2.81.3) - 7 July 2026

## [2.81.3](https://github.com/juspay/svelte-ui-components/compare/2.81.3..2.81.2) - 7 July 2026

## [2.81.2](https://github.com/juspay/svelte-ui-components/compare/2.81.2..2.81.1) - 6 July 2026

## [2.81.1](https://github.com/juspay/svelte-ui-components/compare/2.81.1..2.81.0) - 5 July 2026

## [2.81.0](https://github.com/juspay/svelte-ui-components/compare/2.81.0..2.80.10) - 5 July 2026

## [2.80.10](https://github.com/juspay/svelte-ui-components/compare/2.80.10..2.80.9) - 4 July 2026

## [2.80.9](https://github.com/juspay/svelte-ui-components/compare/2.80.9..2.80.8) - 3 July 2026

## [2.80.8](https://github.com/juspay/svelte-ui-components/compare/2.80.8..2.80.7) - 3 July 2026

## [2.80.7](https://github.com/juspay/svelte-ui-components/compare/2.80.7..2.80.6) - 3 July 2026

## [2.80.6](https://github.com/juspay/svelte-ui-components/compare/2.80.6..2.80.5) - 2 July 2026

## [2.80.5](https://github.com/juspay/svelte-ui-components/compare/2.80.5..2.80.4) - 1 July 2026

## [2.80.4](https://github.com/juspay/svelte-ui-components/compare/2.80.4..2.80.3) - 1 July 2026

## [2.80.3](https://github.com/juspay/svelte-ui-components/compare/2.80.3..2.80.2) - 30 June 2026

## [2.80.2](https://github.com/juspay/svelte-ui-components/compare/2.80.2..2.80.1) - 29 June 2026

## [2.80.1](https://github.com/juspay/svelte-ui-components/compare/2.80.1..2.80.0) - 29 June 2026

## [2.80.0](https://github.com/juspay/svelte-ui-components/compare/2.80.0..2.79.0) - 28 June 2026

## [2.79.0](https://github.com/juspay/svelte-ui-components/compare/2.79.0..2.78.0) - 28 June 2026

## [2.78.0](https://github.com/juspay/svelte-ui-components/compare/2.78.0..2.77.0) - 28 June 2026

## [2.77.0](https://github.com/juspay/svelte-ui-components/compare/2.77.0..2.76.1) - 28 June 2026

## [2.76.1](https://github.com/juspay/svelte-ui-components/compare/2.76.1..2.76.0) - 25 June 2026

## [2.76.0](https://github.com/juspay/svelte-ui-components/compare/2.76.0..2.75.0) - 25 June 2026

## [2.75.0](https://github.com/juspay/svelte-ui-components/compare/2.75.0..2.74.0) - 24 June 2026

## [2.74.0](https://github.com/juspay/svelte-ui-components/compare/2.74.0..2.73.2) - 22 June 2026

## [2.73.2](https://github.com/juspay/svelte-ui-components/compare/2.73.2..2.73.1) - 22 June 2026

## [2.73.1](https://github.com/juspay/svelte-ui-components/compare/2.73.1..2.73.0) - 21 June 2026

## [2.73.0](https://github.com/juspay/svelte-ui-components/compare/2.73.0..2.72.0) - 18 June 2026

## [2.72.0](https://github.com/juspay/svelte-ui-components/compare/2.72.0..2.71.0) - 18 June 2026

## [2.71.0](https://github.com/juspay/svelte-ui-components/compare/2.71.0..2.70.0) - 18 June 2026

## [2.70.0](https://github.com/juspay/svelte-ui-components/compare/2.70.0..2.69.3) - 18 June 2026

## [2.69.3](https://github.com/juspay/svelte-ui-components/compare/2.69.3..2.69.2) - 18 June 2026

## [2.69.2](https://github.com/juspay/svelte-ui-components/compare/2.69.2..2.69.1) - 18 June 2026

## [2.69.1](https://github.com/juspay/svelte-ui-components/compare/2.69.1..2.69.0) - 18 June 2026

## [2.69.0](https://github.com/juspay/svelte-ui-components/compare/2.69.0..2.68.0) - 18 June 2026

## [2.68.0](https://github.com/juspay/svelte-ui-components/compare/2.68.0..2.67.0) - 18 June 2026

## [2.67.0](https://github.com/juspay/svelte-ui-components/compare/2.67.0..2.66.0) - 18 June 2026

## [2.66.0](https://github.com/juspay/svelte-ui-components/compare/2.66.0..2.65.0) - 18 June 2026

## [2.65.0](https://github.com/juspay/svelte-ui-components/compare/2.65.0..2.64.1) - 18 June 2026

## [2.64.1](https://github.com/juspay/svelte-ui-components/compare/2.64.1..2.64.0) - 17 June 2026

## [2.64.0](https://github.com/juspay/svelte-ui-components/compare/2.64.0..2.63.1) - 17 June 2026

## [2.63.1](https://github.com/juspay/svelte-ui-components/compare/2.63.1..2.63.0) - 17 June 2026

## [2.63.0](https://github.com/juspay/svelte-ui-components/compare/2.63.0..2.62.1) - 17 June 2026

## [2.62.1](https://github.com/juspay/svelte-ui-components/compare/2.62.1..2.62.0) - 17 June 2026

## [2.62.0](https://github.com/juspay/svelte-ui-components/compare/2.62.0..2.61.0) - 17 June 2026

## [2.61.0](https://github.com/juspay/svelte-ui-components/compare/2.61.0..2.60.0) - 16 June 2026

## [2.60.0](https://github.com/juspay/svelte-ui-components/compare/2.60.0..2.59.0) - 16 June 2026

## [2.59.0](https://github.com/juspay/svelte-ui-components/compare/2.59.0..2.58.0) - 16 June 2026

## [2.58.0](https://github.com/juspay/svelte-ui-components/compare/2.58.0..2.57.0) - 16 June 2026

## [2.57.0](https://github.com/juspay/svelte-ui-components/compare/2.57.0..2.56.0) - 16 June 2026

## [2.56.0](https://github.com/juspay/svelte-ui-components/compare/2.56.0..2.55.0) - 16 June 2026

## [2.55.0](https://github.com/juspay/svelte-ui-components/compare/2.55.0..2.54.0) - 16 June 2026

## [2.54.0](https://github.com/juspay/svelte-ui-components/compare/2.54.0..2.53.0) - 16 June 2026

## [2.53.0](https://github.com/juspay/svelte-ui-components/compare/2.53.0..2.52.0) - 16 June 2026

## [2.52.0](https://github.com/juspay/svelte-ui-components/compare/2.52.0..2.51.0) - 16 June 2026

## [2.51.0](https://github.com/juspay/svelte-ui-components/compare/2.51.0..2.50.0) - 16 June 2026

## [2.50.0](https://github.com/juspay/svelte-ui-components/compare/2.50.0..2.49.0) - 16 June 2026

## [2.49.0](https://github.com/juspay/svelte-ui-components/compare/2.49.0..2.48.0) - 16 June 2026

## [2.48.0](https://github.com/juspay/svelte-ui-components/compare/2.48.0..2.47.0) - 16 June 2026

## [2.47.0](https://github.com/juspay/svelte-ui-components/compare/2.47.0..2.46.0) - 16 June 2026

## [2.46.0](https://github.com/juspay/svelte-ui-components/compare/2.46.0..2.45.1) - 16 June 2026

## [2.45.1](https://github.com/juspay/svelte-ui-components/compare/2.45.1..2.45.0) - 16 June 2026

## [2.45.0](https://github.com/juspay/svelte-ui-components/compare/2.45.0..2.44.0) - 16 June 2026

## [2.44.0](https://github.com/juspay/svelte-ui-components/compare/2.44.0..2.43.0) - 16 June 2026

## [2.43.0](https://github.com/juspay/svelte-ui-components/compare/2.43.0..2.42.0) - 16 June 2026

## [2.42.0](https://github.com/juspay/svelte-ui-components/compare/2.42.0..2.41.0) - 16 June 2026

## [2.41.0](https://github.com/juspay/svelte-ui-components/compare/2.41.0..2.40.0) - 16 June 2026

## [2.40.0](https://github.com/juspay/svelte-ui-components/compare/2.40.0..2.39.0) - 16 June 2026

## [2.39.0](https://github.com/juspay/svelte-ui-components/compare/2.39.0..2.38.0) - 16 June 2026

## [2.38.0](https://github.com/juspay/svelte-ui-components/compare/2.38.0..2.37.0) - 16 June 2026

## [2.37.0](https://github.com/juspay/svelte-ui-components/compare/2.37.0..2.36.0) - 16 June 2026

## [2.36.0](https://github.com/juspay/svelte-ui-components/compare/2.36.0..2.35.0) - 16 June 2026

## [2.35.0](https://github.com/juspay/svelte-ui-components/compare/2.35.0..2.34.0) - 16 June 2026

## [2.34.0](https://github.com/juspay/svelte-ui-components/compare/2.34.0..2.33.0) - 16 June 2026

## [2.33.0](https://github.com/juspay/svelte-ui-components/compare/2.33.0..2.32.1) - 15 June 2026

## [2.32.1](https://github.com/juspay/svelte-ui-components/compare/2.32.1..2.32.0) - 15 June 2026

## [2.32.0](https://github.com/juspay/svelte-ui-components/compare/2.32.0..2.31.0) - 15 June 2026

## [2.31.0](https://github.com/juspay/svelte-ui-components/compare/2.31.0..2.30.0) - 15 June 2026

## [2.30.0](https://github.com/juspay/svelte-ui-components/compare/2.30.0..2.29.0) - 15 June 2026

## [2.29.0](https://github.com/juspay/svelte-ui-components/compare/2.29.0..2.28.3) - 15 June 2026

## [2.28.3](https://github.com/juspay/svelte-ui-components/compare/2.28.3..2.28.2) - 14 June 2026

## [2.28.2](https://github.com/juspay/svelte-ui-components/compare/2.28.2..2.28.1) - 13 June 2026

## [2.28.1](https://github.com/juspay/svelte-ui-components/compare/2.28.1..2.28.0) - 13 June 2026

## [2.28.0](https://github.com/juspay/svelte-ui-components/compare/2.28.0..2.27.0) - 13 June 2026

## [2.27.0](https://github.com/juspay/svelte-ui-components/compare/2.27.0..2.26.0) - 13 June 2026

## [2.26.0](https://github.com/juspay/svelte-ui-components/compare/2.26.0..2.25.0) - 13 June 2026

## [2.25.0](https://github.com/juspay/svelte-ui-components/compare/2.25.0..2.24.0) - 13 June 2026

## [2.24.0](https://github.com/juspay/svelte-ui-components/compare/2.24.0..2.23.1) - 13 June 2026

## [2.23.1](https://github.com/juspay/svelte-ui-components/compare/2.23.1..2.23.0) - 8 June 2026

## [2.23.0](https://github.com/juspay/svelte-ui-components/compare/2.23.0..2.22.1) - 8 June 2026

## [2.22.1](https://github.com/juspay/svelte-ui-components/compare/2.22.1..2.22.0) - 4 June 2026

## [2.22.0](https://github.com/juspay/svelte-ui-components/compare/2.22.0..2.21.0) - 4 June 2026

## [2.21.0](https://github.com/juspay/svelte-ui-components/compare/2.21.0..2.20.2) - 3 June 2026

## [2.20.2](https://github.com/juspay/svelte-ui-components/compare/2.20.2..2.20.1) - 3 June 2026

## [2.20.1](https://github.com/juspay/svelte-ui-components/compare/2.20.1..2.20.0) - 2 June 2026

## [2.20.0](https://github.com/juspay/svelte-ui-components/compare/2.20.0..2.19.2) - 31 May 2026

## [2.19.2](https://github.com/juspay/svelte-ui-components/compare/2.19.2..2.19.1) - 5 May 2026

## [2.19.1](https://github.com/juspay/svelte-ui-components/compare/2.19.1..2.19.0) - 4 May 2026

## [2.19.0](https://github.com/juspay/svelte-ui-components/compare/2.19.0..2.18.2) - 1 May 2026

## [2.18.2](https://github.com/juspay/svelte-ui-components/compare/2.18.2..2.18.1) - 1 May 2026

## [2.18.1](https://github.com/juspay/svelte-ui-components/compare/2.18.1..2.18.0) - 1 May 2026

## [2.18.0](https://github.com/juspay/svelte-ui-components/compare/2.18.0..2.17.0) - 17 April 2026

## [2.17.0](https://github.com/juspay/svelte-ui-components/compare/2.17.0..2.16.0) - 17 April 2026

## [2.16.0](https://github.com/juspay/svelte-ui-components/compare/2.16.0..2.15.0) - 14 April 2026

## [2.15.0](https://github.com/juspay/svelte-ui-components/compare/2.15.0..2.14.1) - 5 April 2026

## [2.14.1](https://github.com/juspay/svelte-ui-components/compare/2.14.1..2.14.0) - 24 March 2026

## [2.14.0](https://github.com/juspay/svelte-ui-components/compare/2.14.0..2.13.2) - 24 March 2026

## [2.13.2](https://github.com/juspay/svelte-ui-components/compare/2.13.2..2.13.1) - 24 March 2026

## [2.13.1](https://github.com/juspay/svelte-ui-components/compare/2.13.1..2.13.0) - 19 March 2026

## [2.13.0](https://github.com/juspay/svelte-ui-components/compare/2.13.0..2.12.0) - 19 March 2026

## [2.12.0](https://github.com/juspay/svelte-ui-components/compare/2.12.0..2.11.0) - 16 March 2026

## [2.11.0](https://github.com/juspay/svelte-ui-components/compare/2.11.0..2.10.0) - 2 March 2026

## [2.10.0](https://github.com/juspay/svelte-ui-components/compare/2.10.0..2.9.0) - 17 February 2026

## [2.9.0](https://github.com/juspay/svelte-ui-components/compare/2.9.0..2.8.0) - 21 January 2026

## [2.8.0](https://github.com/juspay/svelte-ui-components/compare/2.8.0..2.7.0) - 7 January 2026

## [2.7.0](https://github.com/juspay/svelte-ui-components/compare/2.7.0..2.6.0) - 26 December 2025

## [2.6.0](https://github.com/juspay/svelte-ui-components/compare/2.6.0..2.5.0) - 26 December 2025

## [2.5.0](https://github.com/juspay/svelte-ui-components/compare/2.5.0..2.4.0) - 23 December 2025

## [2.4.0](https://github.com/juspay/svelte-ui-components/compare/2.4.0..2.3.0) - 23 December 2025

## [2.3.0](https://github.com/juspay/svelte-ui-components/compare/2.3.0..2.2.4) - 25 November 2025

## [2.2.4](https://github.com/juspay/svelte-ui-components/compare/2.2.4..2.2.3) - 11 November 2025

## [2.2.3](https://github.com/juspay/svelte-ui-components/compare/2.2.3..2.2.2) - 10 November 2025

## [2.2.2](https://github.com/juspay/svelte-ui-components/compare/2.2.2..2.2.1) - 10 November 2025

## [2.2.1](https://github.com/juspay/svelte-ui-components/compare/2.2.1..2.2.0) - 5 November 2025

## [2.2.0](https://github.com/juspay/svelte-ui-components/compare/2.2.0..2.1.0) - 5 November 2025

## [2.1.0](https://github.com/juspay/svelte-ui-components/compare/2.1.0..2.0.0) - 4 November 2025

## [2.0.0](https://github.com/juspay/svelte-ui-components/compare/2.0.0..1.34.2) - 27 October 2025

## [1.34.2](https://github.com/juspay/svelte-ui-components/compare/1.34.2..1.34.1) - 27 October 2025

## [1.34.1](https://github.com/juspay/svelte-ui-components/compare/1.34.1..v1.34.1) - 6 August 2025

## [v1.34.1](https://github.com/juspay/svelte-ui-components/compare/v1.34.1..1.34.0) - 6 August 2025

## [1.34.0](https://github.com/juspay/svelte-ui-components/compare/1.34.0..1.33.0) - 22 May 2025

- published version 1.34.0

## [1.33.0](https://github.com/juspay/svelte-ui-components/compare/1.33.0..1.32.0) - 4 May 2025

- released version 1.33.0 to npm

## [1.32.0](https://github.com/juspay/svelte-ui-components/compare/1.32.0..1.31.0) - 28 April 2025

- published package to version 1.32.0

## [1.31.0](https://github.com/juspay/svelte-ui-components/compare/1.31.0..1.30.0) - 24 April 2025

- publishing 1.31.0

## [1.30.0](https://github.com/juspay/svelte-ui-components/compare/1.30.0..1.29.0) - 21 April 2025

- published version 1.30.0

## [1.29.0](https://github.com/juspay/svelte-ui-components/compare/1.29.0..1.28.3) - 3 April 2025

- released version 1.29.0

## [1.28.3](https://github.com/juspay/svelte-ui-components/compare/1.28.3..1.27.0) - 3 April 2025

- added vars to customisation height, width, top, bottom and left
- added vars to customise BrandLoader bg & dimensions
- published changes to version 1.28.3

## [1.27.0](https://github.com/juspay/svelte-ui-components/compare/1.27.0..1.26.0) - 26 March 2025

- published version 1.27.0

## [1.26.0](https://github.com/juspay/svelte-ui-components/compare/1.26.0..1.24.0) - 17 March 2025

- releasing changes on 1.26.0

## [1.24.0](https://github.com/juspay/svelte-ui-components/compare/1.24.0..1.23.0) - 3 March 2025

- release 1.24.0

## [1.23.0](https://github.com/juspay/svelte-ui-components/compare/1.23.0..1.22.0) - 7 February 2025

- released version 1.23.0

## [1.22.0](https://github.com/juspay/svelte-ui-components/compare/1.22.0..1.21.0) - 26 December 2024

- published version 1.22.0

## [1.21.0](https://github.com/juspay/svelte-ui-components/compare/1.21.0..1.20.0) - 23 December 2024

- published version 1.21.0

## [1.20.0](https://github.com/juspay/svelte-ui-components/compare/1.20.0..1.17.0) - 23 December 2024

- published version 1.20.0

## [1.17.0](https://github.com/juspay/svelte-ui-components/compare/1.17.0..1.12.0) - 11 October 2024

- release new version & exposed grid item

## [1.12.0](https://github.com/juspay/svelte-ui-components/compare/1.12.0..1.11.0) - 23 September 2024

- published version 1.12.0

## [1.11.0](https://github.com/juspay/svelte-ui-components/compare/1.11.0..1.10.0) - 29 August 2024

- publishing version 1.11.0

## [1.10.0](https://github.com/juspay/svelte-ui-components/compare/1.10.0..1.9.0) - 19 June 2024

- releasing version 1.10.0
- added formatting changes

## [1.9.0](https://github.com/juspay/svelte-ui-components/compare/1.9.0..1.8.0) - 3 June 2024

- Releasing version 1.9.0
- Updated publish script to force push publish script changes
- Formatted Select.svelte with formatter

## [1.8.0](https://github.com/juspay/svelte-ui-components/compare/1.8.0..1.7.0) - 28 May 2024

- releasing version 1.8.0

## [1.7.0](https://github.com/juspay/svelte-ui-components/compare/1.7.0..1.6.0) - 17 May 2024

- release version 1.7.0

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

## [1.5.0](https://github.com/juspay/svelte-ui-components/compare/1.5.0..1.4.0) - 1 March 2024

- publishing out version 1.5.0

## [1.4.0](https://github.com/juspay/svelte-ui-components/compare/1.4.0..1.3.0) - 1 March 2024

- releasing version 1.4.0 to npm

## [1.3.0](https://github.com/juspay/svelte-ui-components/compare/1.3.0..1.2.0) - 14 January 2024

- releasing version 1.3.0 with support for fallback images in list item left icon

## [1.2.0](https://github.com/juspay/svelte-ui-components/compare/1.2.0..1.1.0) - 15 December 2023

- releasing version 1.2.0

## [1.1.0](https://github.com/juspay/svelte-ui-components/compare/1.1.0..1.0.0) - 13 December 2023

- releasing version: 1.1.0

##
1.0.0 - 17 November 2023

- added publish script for building & pushing the package to npmjs
