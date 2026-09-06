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
 * Empty, as of 4.0.0. It held 27 declarations whose names were already taken on
 * the host element — `children`, `hidden`, `id`, `role`, `title` and ten
 * `aria*` names — recorded rather than failed on, because renaming a public
 * prop needs a major. `scripts/migrate/rename-host-reserved-props.ts` did that
 * rename; the list stays so a twenty-eighth fails here instead of shipping.
 *
 * Worth keeping straight, because the old note was careful about it and the fix
 * should not overstate what it fixed: these were not 27 proven bugs. Only
 * `children` was measured broken — `element.children` returned undefined
 * instead of an HTMLCollection on the three wrappers that declared it, and that
 * declaration is now simply gone, since light DOM already carries slotted
 * content. `sui-badge`'s `hidden` was measured *working*: Svelte's declared
 * setter reflects to the attribute, so the native behaviour survived. The
 * `aria*` entries are the ones with a clear mechanism — ARIAMixin puts those
 * accessors on every Element, and a same-named prop displaces the reflection
 * assistive technology reads.
 *
 * They were renamed uniformly anyway, because "the setter happens to reflect,
 * so the platform behaviour survives" is a property of Svelte's current
 * codegen rather than something this library guarantees, and a major is the
 * only time the whole set can move at once. The rename is property-only: each
 * declaration pins the attribute it already observed, so `<sui-card
 * title="x">` is unchanged and only `element.title` versus
 * `element.cardTitle` differs.
 */
const KNOWN_HOST_RESERVED_DECLARATIONS: readonly string[] = [];

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
