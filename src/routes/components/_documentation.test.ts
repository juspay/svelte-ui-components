import { describe, expect, it } from 'vitest';
import { documentationName } from './_documentation';

describe('example documentation identity', () => {
  it('resolves a spaced navigation label to its real component document', () => {
    expect(documentationName('Color Picker', new Set(['ColorPicker']))).toBe('ColorPicker');
  });

  it('prefers an exact document name when both identities exist', () => {
    expect(documentationName('Color Picker', new Set(['Color Picker', 'ColorPicker']))).toBe(
      'Color Picker'
    );
  });

  it('does not invent documentation for a composition-only example', () => {
    expect(documentationName('Chat compositions', new Set(['Chat', 'ChatMessage']))).toBeNull();
  });
});
