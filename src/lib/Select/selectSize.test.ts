import { describe, expect, it } from 'vitest';
import { SELECT_SIZES, selectSizeClass } from './selectSize';

describe('selectSizeClass', () => {
  it('maps sm and lg to their size class', () => {
    expect(selectSizeClass('sm')).toBe('size-sm');
    expect(selectSizeClass('lg')).toBe('size-lg');
  });

  // `md` is the default trigger geometry, so it must emit NO class — otherwise every
  // consumer who never passed `size` would start rendering a different class list than
  // before the prop existed, for no visual change.
  it('emits no class for md, so the default rendering is unchanged', () => {
    expect(selectSizeClass('md')).toBe('');
  });

  it('emits no class when no size is passed', () => {
    expect(selectSizeClass()).toBe('');
  });

  it('covers every documented size', () => {
    expect(SELECT_SIZES).toEqual(['sm', 'md', 'lg']);
  });

  // Guards the pairing between this resolver and the `.size-*` rules in Select.svelte:
  // a size added to the union without a matching stylesheet rule would resolve to a class
  // that styles nothing.
  it('resolves a class for every non-default size', () => {
    const withClass = SELECT_SIZES.filter((size) => selectSizeClass(size) !== '');
    expect(withClass).toEqual(['sm', 'lg']);
  });
});
