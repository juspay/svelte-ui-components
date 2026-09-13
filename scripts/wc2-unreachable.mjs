/**
 * Argument-less `Snippet` props left unreachable from a custom element's host page
 * ON PURPOSE, each with the shape that makes a named `<slot>` the wrong tool for it.
 *
 * A native `<slot>` name is collected statically by the compiler and the DOM assigns
 * light-DOM children to the FIRST matching slot in the shadow tree only (verified end
 * to end against Svelte 5.56.3: with three entries, site 0 received the slotted node
 * and sites 1 and 2 rendered nothing at all). So a snippet the component renders once
 * PER ARRAY ENTRY (`perItem`) cannot be given a slot: one shared name would reach only
 * the first entry and render every later one EMPTY, not defaulted, because the
 * generated per-site slot carries no fallback content. `notAComponentProp` is the
 * companion case: the `Snippet` type annotation belongs to an item type in
 * properties.ts (an array-entry shape), not to the wrapped component's own props at
 * all, so there is no single prop on the wrapped component to bridge in the first
 * place.
 *
 * This module is the single source of truth for that list. src/wc-content-slots.test.ts
 * re-derives each `why` from the component source, so a refactor that changes the shape
 * fails the test rather than quietly keeping a restriction that has expired.
 *
 * Plain ESM with JSDoc types rather than TypeScript, so it stays runnable by `node` with
 * no build step. Its `component` field is therefore a plain `string`, which is why its
 * consumer widens rather than narrows -- see readInsideEach in that test.
 */

/**
 * @typedef {{
 *   component: string,
 *   prop: string,
 *   shape: 'perItem' | 'notAComponentProp',
 *   why: string
 * }} UnreachableSnippetProp
 */

/** @type {ReadonlyArray<UnreachableSnippetProp>} */
export const WC2_UNREACHABLE = [
  {
    component: 'AttachmentChipRow',
    prop: 'removeIcon',
    shape: 'perItem',
    why: 'rendered in each of the images, videos and files loops, once per attachment'
  },
  {
    component: 'AttachmentChipRow',
    prop: 'fileIcon',
    shape: 'perItem',
    why: 'rendered once per file chip'
  },
  {
    component: 'Table',
    prop: 'headerTooltipIcon',
    shape: 'perItem',
    why: 'rendered once per header column, inside the {#each effectiveHeaders} loop'
  },
  {
    component: 'Breadcrumb',
    prop: 'separator',
    shape: 'perItem',
    why: 'rendered once per gap between crumbs; forwarded as a JS property instead'
  },
  {
    component: 'Book',
    prop: 'content',
    shape: 'notAComponentProp',
    why: 'a field of BookPage, an entry in the pages array, rendered once per page across the none/fade/slide transition modes -- fade and slide mount every page at once, so a shared slot name would reach only one page and leave the rest empty'
  },
  {
    component: 'Gallery',
    prop: 'editIcon',
    shape: 'perItem',
    why: 'rendered once per grid image'
  },
  {
    component: 'Gallery',
    prop: 'deleteIcon',
    shape: 'perItem',
    why: 'rendered once per grid image'
  },
  {
    component: 'MediaUpload',
    prop: 'removeIcon',
    shape: 'perItem',
    why: 'rendered once per attachment card'
  },
  {
    component: 'MediaUpload',
    prop: 'fileIcon',
    shape: 'perItem',
    why: 'rendered once per non-image card'
  },
  {
    component: 'Stepper',
    prop: 'badge',
    shape: 'notAComponentProp',
    why: 'a field of Step, an entry in the steps array, not a prop of Stepper'
  },
  {
    component: 'ThemeSwitcher',
    prop: 'icon',
    shape: 'notAComponentProp',
    why: 'a field of ThemeSwitcherOption, an entry in the options array'
  }
];
