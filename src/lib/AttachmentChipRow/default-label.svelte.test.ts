import { render } from '@testing-library/svelte';
import { beforeAll, expect, it, vi } from 'vitest';
import AttachmentChipRow from './AttachmentChipRow.svelte';

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
});

it('preserves the default attachment strip name when the caller does not author a context', () => {
  const { getByRole } = render(AttachmentChipRow, {
    files: [{ id: 'notes', filename: 'notes.txt' }]
  });
  expect(getByRole('region', { name: 'Pending attachments' })).toBeTruthy();
});
