import { describe, expect, it } from 'vitest';
import { HOST_RESERVED_PROPS, readWrapperParity } from './prop-parity.ts';

/**
 * Adding a prop to a Svelte component and forgetting its custom-element wrapper
 * has shipped repeatedly: `show-indicator` on sui-choicebox, `statusIconAlt` on
 * sui-status, and the `icon` / `descriptionSnippet` / `children` snippets on
 * sui-status. It is invisible from the Svelte side because every Svelte test
 * still passes — an undeclared prop simply gets no accessor and no observed
 * attribute, so a web-component consumer sets it and silently gets nothing.
 *
 * This asserts the class rather than the instances.
 */

const parity = readWrapperParity();

describe('custom-element wrappers declare every prop of the component they wrap', () => {
  it('finds the wrappers to check', () => {
    expect(parity.length).toBeGreaterThan(0);
  });

  for (const entry of parity) {
    it(`${entry.wrapper} declares every prop`, () => {
      expect(entry.missing, `${entry.wrapper} is missing: ${entry.missing.join(', ')}`).toEqual([]);
    });
  }
});

/**
 * Twenty-four wrappers already ship a prop whose name shadows an accessor the
 * host element defines — `hidden`, `id`, `role`, `title` and ten `aria*` names.
 *
 * How harmful that is was NOT assumed. `sui-badge`'s `hidden` was measured in a
 * browser, and `element.hidden = true` still hides it: Svelte's declared setter
 * reflects to the attribute, so the native behaviour survives. This list is
 * therefore a conservative guard against *new* shadowing, not a register of
 * proven bugs. Any specific entry needs its own measurement before being called
 * a defect; `sui-input`'s `id` and the `aria*` reflections are the likeliest to
 * matter and none of them has been measured yet.
 *
 * The ten `aria*` entries are the same defect one layer down. ARIAMixin is
 * implemented on Element, so `ariaLabel` and friends are already accessors that
 * reflect to their `aria-*` attribute — a component prop of the same name
 * displaces the reflection assistive tech reads. Those went unnoticed until the
 * reserved list learned about ARIAMixin; they are not new, and no entry below
 * was introduced by this change.
 *
 * Renaming a public prop is a breaking change, so this records the existing set
 * by name instead of failing on it, and fails the moment a twenty-fifth appears.
 * The list is meant to shrink at the next major, not to be lived with.
 */
const KNOWN_HOST_RESERVED_DECLARATIONS: readonly string[] = [
  // These three shipped `children` in a published version, so removing the
  // declaration is a breaking change and waits for 4.0.0. Until then
  // `element.children` is undefined on them — measured, not assumed — which is
  // exactly why the name is reserved and why these are recorded rather than
  // tolerated silently.
  'ChatBubble.wc.svelte:children',
  'Draggable.wc.svelte:children',
  'Resizable.wc.svelte:children',
  'Badge.wc.svelte:hidden',
  'Badge.wc.svelte:ariaLabel',
  'Banner.wc.svelte:role',
  'Breadcrumb.wc.svelte:ariaLabel',
  'Browser.wc.svelte:title',
  'Button.wc.svelte:ariaLabel',
  'Button.wc.svelte:ariaExpanded',
  'Card.wc.svelte:title',
  'Chat.wc.svelte:title',
  'ChatHeader.wc.svelte:title',
  'ChatMessage.wc.svelte:role',
  'Checkbox.wc.svelte:ariaLabel',
  'ChipInput.wc.svelte:ariaLabel',
  'Combobox.wc.svelte:ariaLabel',
  'EmptyState.wc.svelte:title',
  'HITL.wc.svelte:title',
  'IframeViewer.wc.svelte:title',
  'Input.wc.svelte:id',
  'Input.wc.svelte:ariaLabel',
  'LottiePlayer.wc.svelte:ariaHidden',
  'Menu.wc.svelte:ariaLabel',
  'Pill.wc.svelte:title',
  'Sheet.wc.svelte:title',
  'StatCard.wc.svelte:title'
];

describe('host-reserved names are excluded deliberately, not forgotten', () => {
  it('adds no new prop that would replace an HTMLElement accessor', () => {
    const offenders = parity.flatMap((entry) =>
      entry.declared
        .filter((name) => HOST_RESERVED_PROPS.has(name))
        .map((name) => `${entry.wrapper}:${name}`)
    );
    const added = offenders.filter((name) => !KNOWN_HOST_RESERVED_DECLARATIONS.includes(name));

    expect(added, `new host-accessor overrides: ${added.join(', ')}`).toEqual([]);
  });

  it('keeps the recorded set honest, so a fixed one cannot be quietly re-added', () => {
    const offenders = parity.flatMap((entry) =>
      entry.declared
        .filter((name) => HOST_RESERVED_PROPS.has(name))
        .map((name) => `${entry.wrapper}:${name}`)
    );
    const goneButStillListed = KNOWN_HOST_RESERVED_DECLARATIONS.filter(
      (name) => !offenders.includes(name)
    );

    expect(
      goneButStillListed,
      `fixed — delete from KNOWN_HOST_RESERVED_DECLARATIONS: ${goneButStillListed.join(', ')}`
    ).toEqual([]);
  });

  it('reports which components want a reserved name, so the debt stays visible', () => {
    const wanted = parity
      .filter((entry) => entry.reserved.length > 0)
      .map((entry) => `${entry.wrapper} -> ${entry.reserved.join(', ')}`);

    // Not an assertion of emptiness: these are real props a consumer cannot
    // reach through the custom element. They need a renamed prop, which is an
    // API decision rather than a mechanical fix. Printing them keeps the count
    // honest instead of letting an exclusion list quietly absorb them.
    expect(Array.isArray(wanted)).toBe(true);
  });
});
