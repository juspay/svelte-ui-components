// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FileDropzoneTrigger from '../FileDropzoneTrigger/FileDropzoneTrigger.svelte';
import { FILE_INPUT_OWNER } from './context';
import FileInput from './FileInput.svelte';
import type { FileInputSnippetProps } from './properties';

/*
 * One upload action, one interactive owner. Before this, the demos put a native
 * <button> inside the drop region (itself role="button" with a Tab stop), so each
 * action was two Tab stops and read twice by a screen reader. These assert the
 * ownership contract at the DOM level; the real-browser Tab sequence, accessible
 * names and file-chooser counts are tests/a11y-file-input.spec.ts.
 */

const plainContent = createRawSnippet<[FileInputSnippetProps]>(() => ({
  render: () => '<span data-testid="content">Upload</span>'
}));

const TABBABLE = 'button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]';

function region(container: HTMLElement): HTMLElement {
  const el = container.querySelector('.file-input');
  if (!(el instanceof HTMLElement)) {
    throw new Error('no file-input region rendered');
  }
  return el;
}

function hiddenInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[type="file"]');
  if (!(el instanceof HTMLInputElement)) {
    throw new Error('no file input rendered');
  }
  return el;
}

/** Tabbable descendants a person could land on, excluding the hidden native input. */
function tabbableInside(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el.getAttribute('tabindex') !== '-1' && el.getAttribute('aria-hidden') !== 'true'
  );
}

/** jsdom's `files` is a read-only prototype accessor; an own property shadows it. */
function selectFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  fireEvent.change(input);
}

const png = (name: string, size = 1): File =>
  new File([new Uint8Array(size)], name, { type: 'image/png' });
const text = (name: string): File => new File(['x'], name, { type: 'text/plain' });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FileInput owns the action by default (activation="region")', () => {
  it('is one role="button" Tab stop with nothing interactive inside it', () => {
    const { container } = render(FileInput, { trigger: plainContent });
    const root = region(container);

    expect(root.getAttribute('role')).toBe('button');
    expect(root.getAttribute('tabindex')).toBe('0');
    expect(root.getAttribute('aria-disabled')).toBe('false');
    expect(tabbableInside(root)).toEqual([]);
    // The native input is the file carrier, not a second control.
    const input = hiddenInput(container);
    expect(input.getAttribute('aria-hidden')).toBe('true');
    expect(input.getAttribute('tabindex')).toBe('-1');
  });

  it('opens the chooser exactly once for a click, Enter and Space', async () => {
    const { container } = render(FileInput, { trigger: plainContent });
    const root = region(container);
    const open = vi.spyOn(hiddenInput(container), 'click');

    await fireEvent.click(root);
    await tick();
    expect(open).toHaveBeenCalledTimes(1);

    await fireEvent.keyDown(root, { key: 'Enter' });
    await tick();
    expect(open).toHaveBeenCalledTimes(2);

    await fireEvent.keyDown(root, { key: ' ' });
    await tick();
    expect(open).toHaveBeenCalledTimes(3);
  });

  it('opens on a click that lands on the content inside the region', async () => {
    const { container, getByTestId } = render(FileInput, { trigger: plainContent });
    const open = vi.spyOn(hiddenInput(container), 'click');

    await fireEvent.click(getByTestId('content'));

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('stays inert when disabled: not focusable, not clickable, native input disabled', async () => {
    const { container } = render(FileInput, { trigger: plainContent, disabled: true });
    const root = region(container);
    const open = vi.spyOn(hiddenInput(container), 'click');

    expect(root.getAttribute('tabindex')).toBe('-1');
    expect(root.getAttribute('aria-disabled')).toBe('true');
    expect(hiddenInput(container).disabled).toBe(true);
    await fireEvent.click(root);
    await fireEvent.keyDown(root, { key: 'Enter' });
    expect(open).not.toHaveBeenCalled();
  });

  it('hands the snippet the ids of the messages it renders as describedBy', () => {
    let received: string | null = 'unset';
    const spy = createRawSnippet<[FileInputSnippetProps]>((props) => ({
      render: () => {
        received = props().describedBy;
        return '<span>Upload</span>';
      }
    }));
    const { container } = render(FileInput, {
      trigger: spy,
      errorMessage: 'Too big',
      infoMessage: 'PNG only'
    });
    const root = region(container);

    expect(received).toBe(root.getAttribute('aria-describedby'));
    const ids = (received ?? '').split(' ');
    expect(ids).toHaveLength(2);
    for (const id of ids) {
      expect(container.ownerDocument.getElementById(id)).not.toBeNull();
    }
  });
});

describe('FileInput with activation="trigger" hands the action to the control inside', () => {
  const ownBtn = createRawSnippet<[FileInputSnippetProps]>((props) => ({
    render: () => '<button type="button">Pick</button>',
    setup: (node) => {
      const handler = (): void => props().openFilePicker();
      node.addEventListener('click', handler);
      return () => node.removeEventListener('click', handler);
    }
  }));

  it('turns the region into a passive drop target: no role, no tab stop, no aria', () => {
    const { container } = render(FileInput, {
      trigger: ownBtn,
      activation: 'trigger',
      errorMessage: 'Bad'
    });
    const root = region(container);

    for (const attr of ['role', 'tabindex', 'aria-disabled', 'aria-describedby']) {
      expect(root.hasAttribute(attr), `${attr} must be absent`).toBe(false);
    }
    // Exactly one control remains: the supplied button.
    expect(tabbableInside(root).map((el) => el.tagName)).toEqual(['BUTTON']);
  });

  it('does not act on a click or key aimed at the region itself, but the control opens it once', async () => {
    const { container, getByRole } = render(FileInput, {
      trigger: ownBtn,
      activation: 'trigger'
    });
    const root = region(container);
    const open = vi.spyOn(hiddenInput(container), 'click');

    await fireEvent.click(root);
    await fireEvent.keyDown(root, { key: 'Enter' });
    expect(open).not.toHaveBeenCalled();

    await fireEvent.click(getByRole('button', { name: 'Pick' }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('still accepts a drop, so only the opening of the chooser moved', async () => {
    const onfiles = vi.fn();
    const { container } = render(FileInput, {
      trigger: ownBtn,
      activation: 'trigger',
      onfiles
    });

    await fireEvent.drop(region(container), { dataTransfer: { files: [png('dropped.png')] } });

    expect(onfiles).toHaveBeenCalledTimes(1);
    expect(onfiles.mock.calls[0]?.[0].map((file: File) => file.name)).toEqual(['dropped.png']);
  });
});

describe('FileInput validation and events are unchanged', () => {
  it('rejects a wrong type and an oversize file by message, and accepts the rest', () => {
    const onfiles = vi.fn();
    const onerror = vi.fn();
    const { container } = render(FileInput, {
      trigger: plainContent,
      accept: 'image/*',
      maxSizeBytes: 1024,
      onfiles,
      onerror
    });

    selectFiles(hiddenInput(container), [text('notes.txt')]);
    expect(onerror).toHaveBeenLastCalledWith('"notes.txt" has an unsupported type.');
    expect(onfiles).not.toHaveBeenCalled();

    selectFiles(hiddenInput(container), [png('big.png', 2048)]);
    expect(onerror).toHaveBeenLastCalledWith('"big.png" exceeds the 0.0 MB limit.');
    expect(onfiles).not.toHaveBeenCalled();

    selectFiles(hiddenInput(container), [png('ok.png', 10)]);
    expect(onfiles).toHaveBeenCalledTimes(1);
    expect(onerror).toHaveBeenCalledTimes(2);
  });

  it('reports a mixed selection as the rejection first, then the acceptance', () => {
    const onfiles = vi.fn();
    const onerror = vi.fn();
    const { container } = render(FileInput, {
      trigger: plainContent,
      accept: 'image/*',
      onfiles,
      onerror
    });

    selectFiles(hiddenInput(container), [png('ok.png'), text('bad.txt')]);

    expect(onerror).toHaveBeenCalledTimes(1);
    expect(onfiles).toHaveBeenCalledTimes(1);
    // Callers that clear on the first callback of a selection rely on this order.
    expect(onerror.mock.invocationCallOrder[0]).toBeLessThan(
      onfiles.mock.invocationCallOrder[0] ?? 0
    );
  });

  it('forwards accept and multiple to the native input', () => {
    const { container } = render(FileInput, {
      trigger: plainContent,
      accept: '.csv',
      multiple: true
    });

    expect(hiddenInput(container).getAttribute('accept')).toBe('.csv');
    expect(hiddenInput(container).multiple).toBe(true);
  });
});

describe('FileDropzoneTrigger renders one interactive control, never two', () => {
  const icon = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>';
  const props = { icon, heading: 'Update logo', caption: '.webp' };
  const within = (regionOwnsActivation: boolean) =>
    new Map([[FILE_INPUT_OWNER, { regionOwnsActivation }]]);

  it('is plain content inside a region that owns activation, even with a stale onclick', async () => {
    const onclick = vi.fn();
    const { container } = render(FileDropzoneTrigger, {
      props: { ...props, onclick, testId: 'trigger' },
      context: within(true)
    });

    expect(container.querySelector('button')).toBeNull();
    const surface = container.querySelector('.file-dropzone-trigger-surface');
    expect(surface).not.toBeNull();
    expect(surface?.textContent).toContain('Update logo');
    expect(surface?.textContent).toContain('.webp');
    expect(surface?.getAttribute('data-pw')).toBe('trigger');
    expect(surface?.hasAttribute('tabindex')).toBe(false);
    await fireEvent.click(surface as Element);
    // The region opens the picker; the trigger does not call the handler itself.
    expect(onclick).not.toHaveBeenCalled();
  });

  it('is a real button that owns the action when the region has handed it over', async () => {
    const onclick = vi.fn();
    const { container, getByRole } = render(FileDropzoneTrigger, {
      props: { ...props, onclick, testId: 'trigger' },
      context: within(false)
    });

    expect(container.querySelectorAll('button')).toHaveLength(1);
    await fireEvent.click(getByRole('button', { name: /Update logo/ }));
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it('is a button standalone when given onclick, plain content when not', () => {
    const withHandler = render(FileDropzoneTrigger, { props: { ...props, onclick: vi.fn() } });
    expect(withHandler.container.querySelectorAll('button')).toHaveLength(1);
    withHandler.unmount();

    const without = render(FileDropzoneTrigger, { props });
    expect(without.container.querySelector('button')).toBeNull();
    expect(without.container.querySelector('.file-dropzone-trigger-surface')).not.toBeNull();
  });

  it('never renders a button in the compact layout', () => {
    const { container } = render(FileDropzoneTrigger, {
      props: { icon, heading: 'Choose image', compact: true, onclick: vi.fn() },
      context: within(false)
    });

    expect(container.querySelector('button')).toBeNull();
    expect(container.textContent).toContain('Choose image');
  });
});
