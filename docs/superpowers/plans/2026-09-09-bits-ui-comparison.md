# Bits UI comparison implementation plan

> **For agentic workers:** Use test-driven development for each behavior change and bounded subagent execution with independent review.

**Goal:** Produce a complete source comparison and ship compatible, tested usability improvements.

**Architecture:** Preserve existing Svelte and custom-element APIs. Borrow behavior contracts rather than upstream implementation code or styling. Each component family owns its source, wrapper, regression tests, and documentation.

**Tech Stack:** Svelte 5, TypeScript, pnpm, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-09-bits-ui-comparison-design.md`

## Global constraints

- No new runtime dependency or wholesale component replacement.
- Strict TypeScript; no `any` or new default exports.
- Existing defaults and controlled-state semantics remain compatible.
- Lowercase event props and CSS custom-property styling.
- Update every affected custom-element wrapper.
- No pushes or package releases.

## Task 1: Executable reference and full coverage inventory

- [x] Clone the reference and record its exact revision.
- [x] Install its frozen lockfile and build the package.
- [x] Run reference unit tests and initial browser tests.
- [x] Generate and serve the local reference documentation.
- [x] Run current unit, browser, type, and lint baselines.
- [ ] Read all preflighted, hashed comparison packets and validate receipts.
- [ ] Produce a matrix for every current export and every reference primitive.

## Task 2: Tabs activation and navigation

**Files:** `src/lib/Tabs/{Tabs.svelte,properties.ts}`, `src/wc/components/Tabs.wc.svelte`,
`src/lib/Tabs/Tabs.svelte.test.ts`, `src/routes/components/tabs/+page.svelte`, `docs/Tabs.md`.

**Interfaces:** Retain `items`, `activeIndex`, `activeKey`, `onchange`, and `onkeychange`.
Add per-object-item `disabled`, `activationMode?: 'automatic' | 'manual'`,
`loop?: boolean`, and `dir?: 'ltr' | 'rtl'`. Automatic activation and looping remain
true/default behavior. Direction defaults to the inherited direction when omitted.

- [ ] Test that manual ArrowRight moves focus but not selection; Enter selects.
- [ ] Test disabled items, empty/all-disabled lists, Home/End, and missing selection.
- [ ] Test loop=false edges, RTL, and existing controlled object behavior.
- [ ] Run tests and observe the missing behavior fail.
- [ ] Implement a single roving focus stop, independent from manual selection.
- [ ] Expose the props in the wrapper and document examples.
- [ ] Run the targeted tests, existing tabs browser tests, type and lint checks.

```sh
pnpm exec vitest run src/lib/Tabs/Tabs.svelte.test.ts
pnpm exec playwright test tests/tabs-keyboard-navigation.spec.ts --workers=2
```

## Task 3: Native form-control and accessible value contracts

**Files:** Component source, `properties.ts`, wrapper, unit tests, demo, and docs for
Checkbox, Radio, Toggle, and Slider. Components remain independent.

**Interfaces:** Add opt-in native form attributes where absent. Preserve current
callbacks and controlled behavior. Slider exposes `ariaValueText` for meaningful
non-numeric values and keeps the native range input. Do not claim custom elements
are form-associated merely because an inner shadow input has a name.

- [ ] Add component tests for named checked/unchecked and disabled FormData entries.
- [ ] Test required controls and external `form` association in light DOM.
- [ ] Test slider formatted accessibility text and finite bounded fill percentages.
- [ ] Observe each test fail before implementing its behavior.
- [ ] Implement forwarding, state consistency, documentation, and wrapper props.
- [ ] Validate existing controlled-checkbox, radio, toggle, and slider browser tests.

```sh
pnpm exec vitest run src/lib/Checkbox src/lib/Radio src/lib/Toggle src/lib/Slider
```

## Task 4: Verified findings in other families

- [ ] Independently check complete audit candidates against source and tests.
- [ ] Create bounded component-specific regression tests for confirmed defects.
- [ ] Fix compatible defects without altering unrelated APIs or redesigning components.
- [ ] Record optional absent features separately from bugs and shipped changes.

## Task 5: Review and complete validation

- [ ] Independently review changed source, wrappers, tests, and docs.
- [ ] Resolve confirmed defects and rerun affected regression tests.
- [ ] Run the complete checks below and record actual results, including skips.
- [ ] Complete the comparison matrix and setup/run documentation.

```sh
pnpm run test:unit --run
pnpm run check
pnpm run lint
pnpm run test:integration --workers=4
```
