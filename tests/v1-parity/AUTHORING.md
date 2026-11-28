# Writing a v1 parity case file

One file per component: `tests/v1-parity/cases/<Component>.svelte`. `cases/Button.svelte` is the
reference; read it first.

## What a case file is

The same file is compiled, unchanged, by two stacks: the published library 1.34.1 on Svelte 4.2.8,
and this repo's `src/lib/v1` on Svelte 5. The runner loads `/?case=<File>:<name>`, runs the case's
actions, takes a 420x800 viewport screenshot on each stack and requires every pixel and every
recorded event to be identical.

## Hard rules

- **Svelte 4 syntax only.** `export let`, `$:`, `on:event`, `bind:`, `<slot>`, `slot="name"`,
  `<svelte:fragment slot="x">`. No runes, no `{#snippet}`, no `{@render}`, no `onclick=` on
  components, no TypeScript (`<script>` without `lang`).
- Start with `<script context="module">` exporting `cases`, then a plain `<script>` with
  `export let name;`, then one `{#if name === '...'} ... {:else if ...} {/if}` chain.
- Import the library ONLY as `from 'sui-v1-under-test'`, and only names 1.34.1 exports (listed in
  `src/lib/v1/index.ts`). Import helpers from `./_kit.js`.
- **No network and nothing non-deterministic.** Images: `png` and `svg` from `_kit.js` (data URIs).
  No `Date`, no `Math.random`, no remote URLs. If a component's default points at a remote image,
  always pass a data URI instead.
- Every case name is unique within the file, kebab-case, and has a branch in the `{#if}` chain.
- Never write to `window`, never import `svelte/internal`.
- Do not run `tests/v1-parity/run.mjs`. Other authors are writing files at the same time and the
  runner rebuilds shared directories. Do not edit any file other than the case files you own.

## Case entries

```js
export const cases = [
  { name: 'default' },
  { name: 'hover', actions: [['hover', 'button']] },
  {
    name: 'typed',
    actions: [
      ['click', 'input'],
      ['type', 'input', '98765'],
      ['key', 'Tab']
    ]
  }
];
```

Actions run in order with Playwright, on the first element matching the CSS selector:
`['click', sel, options?]`, `['hover', sel]`, `['focus', sel]`, `['blur', sel]`,
`['fill', sel, text]`, `['type', sel, text]`, `['press', sel, key]`, `['key', key]`,
`['wait', ms]`, `['mouse', x, y]` (click at viewport coordinates). Use `{ force: true }` as the
click option when the target is disabled or covered. Selectors must match in BOTH stacks, so use
the classes and `data-pw` ids the 1.34.1 markup renders.

## What to record

- Wire **every** event the component can emit to `log('<eventName>')`, in every case:
  `on:click={log('click')}`. `log` records the event name and its `detail`.
- For two-way bindings, record the value after it changes:
  `$: note('checked', checked);` (import `note` from `./_kit.js`).
- For instance methods (`bind:this` then `.focus()`), call them from a small `<button id="t">`
  outside the component and click it with an action.

## What to cover (aim for breadth, 12 to 30 cases per component)

1. The component with no props at all (pure defaults), where 1.34.1 allows it.
2. Every field of the `properties` object: each boolean both ways, each enum value, `null` versus
   a value for every nullable field, empty string versus text, long text that wraps or overflows.
3. Every top-level prop and every `bind:`.
4. Every slot, filled and empty.
5. Every event, with an action that triggers it (click, keyboard, typing, blur).
6. Interaction states: hover, focus, pressed, expanded and collapsed, checked and unchecked,
   valid, invalid and in-progress, open and closed.
7. Styling: at least one case that overrides several of the component's CSS variables from an
   ancestor class, and one that passes them as style props (`--name="value"` on the component).
8. Combinations a real checkout uses: a `properties` object built by spreading the exported
   `default*Properties`, `bind:properties`, and reading values back out of the bound object.

Keep each case small and wrap it in a fixed-width `<div style="width: 360px">` only when the
component needs a width to lay out.
