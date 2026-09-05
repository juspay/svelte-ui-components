import { describe, it, expect } from 'vitest';
import { resolveControlDisabled } from './controlDisabled';

describe('resolveControlDisabled', () => {
  it('falls back to the shared `disabled` when the specific flag is null (backward compat default)', () => {
    expect(resolveControlDisabled(null, true)).toBe(true);
    expect(resolveControlDisabled(null, false)).toBe(false);
  });

  it('an explicit false overrides a true `disabled` — independent per-control disable', () => {
    expect(resolveControlDisabled(false, true)).toBe(false);
  });

  it('an explicit true overrides a false `disabled`', () => {
    expect(resolveControlDisabled(true, false)).toBe(true);
  });
});
