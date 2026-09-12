# Bits UI comparison and compatible improvements

## Goal

Use https://github.com/huntabyte/bits-ui as a locally executable reference for the
library's behavior, accessibility, component composition and developer experience.
Inventory every existing component and every reference primitive. Preserve the
current visual identity and public contracts while closing verified usability gaps.

## Reference and architecture

The reference is Bits UI 2.19.1, commit
`013ff881062c975e064010afeb126d9a772f7ec2`. It is MIT-licensed, headless, Svelte-only,
and built around compound components, reactive state objects, shared interaction
layers, and explicit prop/snippet contracts. It is not a replacement theme or a
reference implementation for this library's charts, chat, media, and device frames.

The current library remains the implementation. No Bits UI runtime dependency is
introduced. Native browser behavior is retained where already used. New APIs are
additive, and existing defaults remain unchanged. Component-specific public types
stay in their existing `properties.ts` modules; genuinely shared types belong in
`src/lib/types.ts`. Web-component wrappers must expose every new public prop.

## Workstreams

1. Clone, install using the reference lockfile, build, run reference tests, and serve
   its actual documentation locally. Record the revision and reproducible commands.
2. Read complete source packets covering every current component family and every
   reference primitive. Keep file hashes, range coverage, and explicit deferred work.
   Distinguish source evidence, executed tests, and visual observations.
3. Implement compatible improvements in existing components, selected from concrete
   behavior/API gaps. Start with configurable tab activation/navigation and native
   form-control integration. Broader findings must be independently checked before
   implementation. New compound-component families and incompatible state-model
   replacements remain explicitly identified design decisions, not silent rewrites.
4. Add regression tests, examples, and API documentation together. Run the complete
   current unit, browser, type, lint, package, and web-component checks. Independently
   review the changes and fix confirmed regressions.
5. Deliver a component-by-component matrix with existing strengths, reference value,
   implemented improvements, and remaining feature differences. Do not claim that a
   source read proves visual parity, or that all optional reference APIs are shipped.

## Compatibility and quality constraints

- Svelte 5 and the existing pnpm lockfile remain unchanged unless evidence requires it.
- No new runtime dependency or wholesale component replacement.
- Strict TypeScript; no `any`, new default exports, type predicates, or type assertions
  in production code. Follow the existing lint restrictions on `$effect` and `undefined`.
- Lowercase event prop names, existing CSS custom-property conventions, `classes`,
  and `testId` remain the public contract.
- Existing defaults and controlled-state semantics remain compatible.
- New behavior requires an observed failing regression test before implementation.
- No edits to other worktrees or their servers. No push, publication of a package,
  or pull-request creation without separate authorization.

## Validation

Establish pre-change baselines before editing. Exercise keyboard focus, disabled
items, controlled and uncontrolled state, right-to-left navigation, real FormData,
constraint validation, and shadow-root behavior for the changed surfaces. Use the
checkout-derived Playwright port and retain exact test output. UI claims need browser
observations; accessibility claims must name the semantics or keyboard path tested.

## Delivery boundary

This is an improvement pass across the current library, not a promise to clone every
Bits UI component API. The final matrix must account for all components and explicitly
identify optional missing primitives, incompatible designs, and unverified behavior.
