# Writing a parity case file

One file per component: `tests/parity/cases/<Component>.svelte`. `cases/Control.svelte` shows the
file shape; read it first.

## What a case file is

The same file is compiled, unchanged, by two stacks: the latest published
`@juspay/svelte-ui-components` (the version pinned in `baseline/package.json`) and this repo's
`src/lib`, both on the same Svelte, Vite and plugin versions. The runner loads
`/?case=<File>:<name>`, runs the case's actions, takes a 420x800 viewport screenshot on each stack
and requires every pixel and every recorded event to be identical.

A failing case means the branch changes what a consumer sees or receives. If the change is
intended, say so in the pull request; the case passes again once the release that contains it is
the new baseline.

## Hard rules

- **Svelte 5 runes.** `let { name } = $props();`, `$state`, `$derived`, `onclick=`, snippets,
  `{@render}`. No TypeScript (`<script>` without `lang`).
- Start with `<script module>` exporting `cases`, then `<script>` with `let { name } = $props();`,
  then one `{#if name === '...'} ... {:else if ...} {/if}` chain.
- Import the library ONLY as `from 'sui-under-test'`, and only names the published version exports
  (check `node_modules/@juspay/svelte-ui-components/dist/index.d.ts` in `tests/parity/baseline`,
  or `src/lib/index.ts` at the release tag). Import helpers from `./_kit.js`.
- **No network and nothing non-deterministic.** Images: `png` and `svg` from `_kit.js` (data URIs).
  No `Date`, no `Math.random`, no remote URLs. If a component's default points at a remote image,
  always pass a data URI instead.
- Every case name is unique within the file, kebab-case, and has a branch in the `{#if}` chain.
- Never write to `window`, never import `svelte/internal`.
- Do not run `tests/parity/run.mjs` while someone else is writing cases: the runner rebuilds shared
  directories. Do not edit any file other than the case files you own.

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
click option when the target is disabled or covered. Prefer `data-pw` ids and roles that the
component renders; they are part of its contract.

Other flags: `expectDifferent: true` (only for controls), `allowBlank: true` (the case is meant to
render nothing visible), `knownDifference: '<why>'` (an accepted, explained difference), and
`knownVisualDifference: '<why>'` (an accepted screenshot difference that still requires exact
event parity). The run fails when the declared difference goes away. In CI, a visual-only case
must also match its reviewed candidate screenshot in `reviewed-visuals/<case-id>.png`; use
the case ID with punctuation replaced by underscores. Inspect the baseline, candidate and diff
in the Ubuntu parity artifact before copying its `images/<case-id>.after.png` to that directory.
Local parity checks events on every platform. Pass `--reviewed-visuals <dir>` to also check the
candidate against screenshots from the same renderer as the local run.

## What to record

- Wire **every** callback the component accepts to `log('<name>')`: `onclick={log('onclick')}`.
  `log` records the name and the argument (an event, or a value).
- For `$bindable` props, record the value after it changes: `$effect(() => note('value', value));`
  (import `note` from `./_kit.js`).
- For exported methods (`bind:this` then `.focus()`), call them from a small `<button id="t">`
  outside the component and click it with an action.

## What to cover (aim for breadth, 12 to 30 cases per component)

1. The component with only its required props.
2. Every prop: each boolean both ways, each enum value (`variant`, `size`, ...), absent versus a
   value for every optional prop, empty string versus text, long text that wraps or overflows.
3. Every `$bindable` prop and every snippet prop, filled and empty.
4. Every callback, with an action that triggers it (click, keyboard, typing, blur).
5. Interaction states: hover, focus, pressed, expanded and collapsed, checked and unchecked,
   valid, invalid and in progress, open and closed, disabled.
6. Styling: at least one case that overrides several of the component's CSS custom properties from
   an ancestor element.
7. Combinations a real consumer uses: V2 Nimble's usage of the component, where it exists.

Keep each case small and wrap it in a fixed-width `<div style="width: 360px">` only when the
component needs a width to lay out.
