import { describe, it, expect } from 'vitest';
import { normalizeDictationState } from './dictationState';

describe('normalizeDictationState', () => {
  it('reads legacy `true` as recording (boolean alias, backward compat)', () => {
    expect(normalizeDictationState(true)).toBe('recording');
  });

  it('reads legacy `false` as idle -- the default a caller who never touches this keeps', () => {
    expect(normalizeDictationState(false)).toBe('idle');
  });

  it('passes each tri-state value through unchanged', () => {
    expect(normalizeDictationState('idle')).toBe('idle');
    expect(normalizeDictationState('recording')).toBe('recording');
    expect(normalizeDictationState('busy')).toBe('busy');
  });
});
