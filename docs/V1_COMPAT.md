# The `v1` entry: 1.34.1 on Svelte 5

`@juspay/svelte-ui-components/v1` is the 1.34.1 library, running on Svelte 5. It exists for
consumers still written against 1.x: one `properties` object per component, the exported
`default*Properties` values, `on:event` listeners that read `event.detail`, and named slots.

Moving such a consumer to the current API means rewriting every call site. Moving it to `v1`
means changing one import path and upgrading Svelte.

```diff
- import { Button, defaultButtonProperties } from '@juspay/svelte-ui-components';
+ import { Button, defaultButtonProperties } from '@juspay/svelte-ui-components/v1';
```

Nothing else at the call site changes. The two entries can be used side by side, so a consumer
can move one component at a time from `v1` to the current API.

## What it promises

Every case in `tests/v1-parity` renders the same pixels and emits the same events, in the same
order and with the same payloads, as the published 1.34.1 on Svelte 4. "The same" means exactly:
every pixel of a 420x800 viewport, with no tolerance.

| Measured on the last full run            |                            |
| ---------------------------------------- | -------------------------- |
| Components covered                       | all 25 that 1.34.1 exports |
| Cases                                    | 706                        |
| Identical in every pixel and every event | 699                        |
| Known differences, explained below       | 7                          |
| Failures                                 | 0                          |

The check compiles the same case files on both stacks, so the comparison is of the components,
not of two different test pages. It runs a control that must differ by one pixel, and fails a case
that rendered nothing unless the case says it is meant to be blank, so a green run cannot come from
a comparator or a page that measured nothing.

## What it does not promise

- **New fixes and features.** `v1` is frozen at 1.34.1. It is changed only to keep it identical to
  1.34.1, or for security.
- **Other browsers.** The pixel check runs in Chromium. The components are the same code on every
  engine, but only Chromium's output was compared.
- **States no case renders.** Coverage is listed per component in `tests/v1-parity/cases`.
- **Instantiating with `new`.** Svelte 5 components are functions. Code that calls
  `new Button({ target })` must use `mount(Button, { target })` instead.

## Known differences

### An image with no source

1.34.1 drew an empty grey frame for an `<img>` whose source was an empty string. `v1` draws
Chrome's broken-image icon in the same frame. Images with a source are not affected.

Svelte 5 builds a component's markup in a template that belongs to a separate, inert document,
and moves it into the page when the component mounts. Chrome can mark an image with no source as
broken during that move. Svelte 4 built nodes in the page's own document, so the image never moved.
Six orderings of creating, inserting and adopting the image were tested directly in Chrome. The
result depends on Chrome's internal timing, which component code cannot control.

Cases: `Icon:default`, `Icon:text-only`, `Badge:image-empty-src`.

### An accordion inside an accordion

1.34.1 measures an accordion's height once, while any accordion inside it is still animating open.
How much of the inner one it counts depends on machine speed: the same page stored 54, 59 and
64 px across runs. `v1` pauses the inner animation for that measurement and stores the settled
height, 64 px, every time. That is also what 1.34.1 stores on a slow device. The inner accordion
skips its own 0.2 s opening animation as a result.

Case: `Accordion:nested-toggle`.

### A parent changing a bound `InputButton` in code

When the parent assigns a new value to the object it binds to `InputButton`, for example to prefill
a phone number, the parent's reactive statements run one more time than on 1.34.1, and the
`stateChange` event arrives one step earlier relative to them. What is rendered is identical, and
changes the user makes by typing match exactly.

Svelte 4 pushed a bound prop back down to a child at most once per update cycle, and the number
of times a parent re-ran followed from that. Svelte 5 has no such cycle, so the count cannot be
reproduced without replacing its scheduler. This matters only to a parent whose reactive
statements have side effects that must run a fixed number of times.

Cases: `ParentUpdates:inputbutton-bound-mutate-on-mount`,
`ParentUpdates:inputbutton-bound-replace-on-mount`, `ParentUpdates:inputbutton-bound-mutate-from-button`.

## What had to change to keep it identical

The components are the 1.34.1 sources, compiled by Svelte 5 in legacy (non-runes) mode. Svelte 5
runs legacy components differently from Svelte 4 in a few observable ways. `src/lib/v1/compat.ts`
restores the Svelte 4 behaviour; each item below was found by the parity check.

| Svelte 4 behaviour                                                                                         | What Svelte 5 does instead                                                             | Restored by                           |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------- |
| An event dispatched while a component initialises reaches no listener                                      | Delivers it                                                                            | `createLegacyEventDispatcher`         |
| `bind:` calls the binding once after creation, so a bound object makes both sides re-run their `$:` blocks | No such call                                                                           | `withRawProps` and `replayBoundProps` |
| A phone `Input` announces its new validation state before the parent's `$:` blocks see the new value       | Parent first                                                                           | `Input.svelte`, `announceStateNow`    |
| A bound object reassigned by a child's `$:` block notifies the parent twice                                | Once                                                                                   | `createRoundTripGate`                 |
| `{null}` and `{undefined}` print as words                                                                  | Print nothing                                                                          | `legacyText`, `legacyHtml`            |
| An empty `src` leaves the attribute off; an unchanged URL is not rewritten                                 | Writes `src=""`                                                                        | `legacySrc`                           |
| `Accordion` measures its content from a `$:` block and `afterUpdate`                                       | The same code never settles and hangs the page                                         | `Accordion.svelte`                    |
| A parent update that removes a branch never reaches the child inside it                                    | The child sees the new props first, so `undefined.length` throws and aborts the update | null guards in 8 templates            |

Every other line of `src/lib/v1` is as 1.34.1 shipped it, apart from formatting that does not
change the output (expanding `<div />` to `<div></div>`) and imports made relative. To see
everything that changed in one component:

```sh
git diff --no-index <(git show v1.34.1:src/lib/Input/Input.svelte) src/lib/v1/Input/Input.svelte
```

## Your own components on Svelte 5

`v1` keeps the library's components behaving as they did. It cannot do that for a consumer's own
components, which Svelte 5 also compiles. Two differences showed up when Nimble v2 was moved over;
both happen with or without this library, and with the old 1.34.1 installed they fail the same way.

- **Props are read live.** Svelte 4 handed a component its props once per update cycle, so its
  `onMount` saw the values it was created with. Svelte 5 reads the parent's current value. Nimble's
  address form checks `address === null` in `onMount` to decide whether to prefill the recipient.
  A child `Input` reports its state on mount, the form passes that up, and the page sets `address`,
  all before the form's own `onMount` runs. On Svelte 5 the check therefore fails and the recipient
  stays empty. The fix is to read the value the component was created with:

  ```svelte
  <script>
    export let address = null;
    const addressAtCreation = address;
    onMount(() => {
      if (addressAtCreation === null) {
        // prefill
      }
    });
  </script>
  ```

- **Events dispatched during initialisation are delivered.** Svelte 4 attached `on:` listeners
  after a component initialised, so a `dispatch` from its script body or the first run of a `$:`
  block reached nobody. Svelte 5 delivers it.

Run the app's own end-to-end and visual suites after upgrading Svelte; the library's parity check
does not cover these.

## Running the check

```sh
pnpm run test:v1-parity                          # every case, about 8 minutes
pnpm run test:v1-parity -- --filter Input,Modal  # some components
pnpm run test:v1-parity -- --target dist         # the packaged output, after `pnpm run package`
pnpm run test:v1-parity -- --aa baseline         # one stack against itself, to find flaky cases
```

The first run installs the baseline stack (Svelte 4 and the published 1.34.1) into
`tests/v1-parity/baseline` from its own lockfile. Results, with a before, after and difference
image for every case, are written to `tests/v1-parity/.report`. A case that fails under parallel
load is run again on its own; if it then passes it is reported as flaky, and the run still fails.

`tests/v1-parity/AUTHORING.md` explains how to write a case.
