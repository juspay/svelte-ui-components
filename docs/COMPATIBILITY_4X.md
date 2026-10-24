# Native component adoption and 4.x compatibility

The native-rendering additions require no migration for consumers already using the
released 4.x contracts. Existing exports, named discriminator types, legacy callback
signatures and default styled rendering remain available. New rendering modes are opt-in.
This statement concerns this feature PR; it does not reverse changes in earlier releases.

## Existing consumer code stays valid

- `MediaType` and `MediaPlayerProperties['type']` retain `'image' | 'video'`. Existing
  exhaustive maps and switches do not acquire an unhandled audio case.
- `PillRootTag` and `PillProperties['as']` retain their existing `div`/`button` choices.
- `FileInputProperties.trigger` remains required, so wrappers can read and forward its
  snippet without adding undefined checks. The released `<sui-file-input>` stays
  non-form-associated and does not appear as a new control in `form.elements`.
- `Img.onerror` remains `() => void`, is called with zero arguments, and runs only after
  the existing fallback chain is exhausted. Consumers can still invoke it without an event.
- Omitting `native`, `unstyled`, loader variants, segmented progress and modal
  `containFocus` retains the existing mode. The old Modal remains exported; native
  Dialog is an additional component, not a replacement.

## New capabilities have explicit adoption contracts

| Capability                 | Contract for new code                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Audio media                | `audioOnly` opts into native audio; `type` stays image/video                                                        |
| Inline pill root           | `inline` opts into span; `as` stays div/button                                                                      |
| Native file picker         | `NativeFileInput` / `<sui-native-file-input>` opt in without weakening FileInput or changing legacy form membership |
| Native image failure event | `onimageerror(event)`; available on Svelte and the custom element                                                   |

The components and their custom-element wrappers accept these explicit opt-ins.
Both named types and component-inferred props preserve existing discriminator and
required-trigger contracts. They are not widened or weakened to describe new modes.
Existing consumers do not need to rename imports or adopt these new types.

`onimageerror` follows the same fallback policy as `onerror`. When both are supplied,
the legacy callback runs with no arguments and the new callback receives the original
Event. For `<sui-img>`, the legacy `onerror` property remains callback-only; the new
`onimageerror` callback also emits the `imageerror` custom event through the regular
callback/dispatch bridge.

## Verification

The consumer compile fixture in `src/lib/compatibility-4x.test.ts` exercises exhaustive
maps, required-trigger access and zero-argument error callbacks. Separate checks exercise
the opt-in contracts and source props. After declaration emit, `scripts/check-4x-consumer.mjs` checks
actual package exports and component-inferred props as a mandatory part of
`npm run package` (and therefore build/prepublish). It fails if declarations are
missing; the check is not skipped in a clean CI checkout. Runtime tests verify both image callback signatures and
fallback recovery. The existing styled component, form, focus and browser suites remain
required; a passing compile check alone does not establish runtime or visual parity.

Harbour adopts the new native features explicitly. Its temporary registry patch must be
replaced by a containing library release when that release exists; other 4.x consumers
do not need this patch or Harbour's adoption changes merely to keep existing usage working.
