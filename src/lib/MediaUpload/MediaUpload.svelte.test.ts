// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import MediaUpload from './MediaUpload.svelte';

/*
 * jsdom has no Element.animate, no CSS global and no matchMedia, so nothing
 * here can observe AnimatedNumber's roll itself -- that is AnimatedNumber's
 * own test file's job. What this asserts is the wiring: `animateCounter` left
 * unset must render the exact old `{items.length} / {maxLength}` text node
 * (proving the additive prop is byte-identical opt-out by default), and set
 * to `true` must swap in AnimatedNumber carrying only the count -- the `/`
 * separator and `maxLength` stay ordinary text outside it -- while add/remove,
 * validation and the drop tile stay untouched either way.
 */

function counterEl(container: HTMLElement): HTMLElement {
  const el = container.querySelector('.counter');
  if (!(el instanceof HTMLElement)) {
    throw new Error('no counter rendered');
  }
  return el;
}

/**
 * jsdom's `HTMLInputElement.files` is a read-only accessor on the prototype;
 * an own-property override on the instance shadows it for both the change
 * handler's `target.files` read and this helper's own assertions, and
 * `Array.from` only needs something array-like -- a plain array of `File`s
 * satisfies that without pulling in a `DataTransfer`/`FileList`, which jsdom
 * does not implement.
 */
function selectFiles(input: HTMLInputElement, files: File[]): void {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  fireEvent.change(input);
}

function pngFile(name: string): File {
  return new File(['x'], name, { type: 'image/png' });
}

describe('MediaUpload counter, animateCounter unset (default)', () => {
  it('renders the old plain-text counter, with no AnimatedNumber in the tree', () => {
    const { container } = render(MediaUpload, { maxLength: 3 });
    const counter = counterEl(container);

    expect(counter.textContent).toBe('0 / 3');
    // Byte-identical to pre-AnimatedNumber markup: a single text node, no
    // odometer structure and no extra wrapper element around the digits.
    expect(counter.childNodes).toHaveLength(1);
    expect(counter.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(counter.querySelector('.animated-number')).toBeNull();
  });

  it('still updates as a plain text node when a file is added', async () => {
    const { container } = render(MediaUpload, { maxLength: 3 });
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('no file input rendered');
    }

    selectFiles(input, [pngFile('a.png')]);
    await Promise.resolve();

    expect(counterEl(container).textContent).toBe('1 / 3');
    expect(counterEl(container).querySelector('.animated-number')).toBeNull();
  });
});

describe('MediaUpload counter, animateCounter on', () => {
  it('routes the whole "N / maxLength" through AnimatedNumber as one value', () => {
    const { container } = render(MediaUpload, { maxLength: 3, animateCounter: true });
    const counter = counterEl(container);
    const animated = counter.querySelector('.animated-number');

    expect(animated).not.toBeNull();
    expect(animated?.getAttribute('role')).toBe('img');
    // The whole counter is one value to assistive technology. The count alone
    // would read as a bare "0" to anyone navigating by graphic, since the rotor
    // announces only the role="img" element's own label and the " / 3" beside it
    // would never be reached.
    expect(animated?.getAttribute('aria-label')).toBe('0 / 3');

    // Nothing is left outside the odometer's subtree.
    const withoutAnimated = counter.cloneNode(true) as HTMLElement;
    withoutAnimated.querySelector('[role="img"]')?.remove();
    expect(withoutAnimated.textContent?.trim()).toBe('');

    // Two digit columns, for the "0" and the "3". The separator and the slash are
    // literal columns that never roll, so only the count actually animates.
    expect(animated?.querySelectorAll('.animated-number-digit')).toHaveLength(2);
  });

  it('rolls the count on add, leaving the maximum digits still', async () => {
    const { container } = render(MediaUpload, { maxLength: 3, animateCounter: true });
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('no file input rendered');
    }

    selectFiles(input, [pngFile('a.png'), pngFile('b.png')]);
    await Promise.resolve();

    const counter = counterEl(container);
    expect(counter.querySelector('.animated-number')?.getAttribute('aria-label')).toBe('2 / 3');
  });

  it('rolls the count back down on remove', async () => {
    const { container, getByRole } = render(MediaUpload, {
      maxLength: 3,
      animateCounter: true
    });
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('no file input rendered');
    }

    selectFiles(input, [pngFile('a.png'), pngFile('b.png')]);
    await Promise.resolve();
    expect(counterEl(container).querySelector('.animated-number')?.getAttribute('aria-label')).toBe(
      '2 / 3'
    );

    await fireEvent.click(getByRole('button', { name: 'Remove a.png' }));

    expect(counterEl(container).querySelector('.animated-number')?.getAttribute('aria-label')).toBe(
      '1 / 3'
    );
  });

  it('does not disturb validation, rejection or the drop tile', () => {
    const onerror = vi.fn();
    const { container } = render(MediaUpload, {
      maxLength: 1,
      animateCounter: true,
      accept: 'image/*',
      onerror
    });
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('no file input rendered');
    }

    selectFiles(input, [new File(['x'], 'a.txt', { type: 'text/plain' })]);

    expect(onerror).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.error')?.textContent).toContain('unsupported file type');
    expect(counterEl(container).querySelector('.animated-number')?.getAttribute('aria-label')).toBe(
      '0 / 1'
    );
  });
});

describe('MediaUpload showCounter=false', () => {
  it('renders no counter at all, with animateCounter on', () => {
    const { container } = render(MediaUpload, {
      showCounter: false,
      animateCounter: true,
      label: 'Attachments'
    });

    expect(container.querySelector('.counter')).toBeNull();
  });
});
