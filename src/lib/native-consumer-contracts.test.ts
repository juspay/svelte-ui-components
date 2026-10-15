import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import Img from './Img/Img.svelte';
import Button from './Button/Button.svelte';
import Input from './Input/Input.svelte';
import IframeViewer from './IframeViewer/IframeViewer.svelte';
import Avatar from './Avatar/Avatar.svelte';
import NativeBindings from './NativeBindings.test.svelte';
import Icon from './Icon/Icon.svelte';

describe('native consumer contracts', () => {
  it('keeps noninteractive empty-alt avatars decorative and named avatars discoverable', async () => {
    const view = render(Avatar, { alt: '', name: 'Demo person' });
    expect(view.queryByRole('img')).toBeNull();
    expect(view.container.querySelector('.avatar')?.getAttribute('aria-hidden')).toBe('true');
    await view.rerender({ alt: 'Demo profile', name: 'Demo person' });
    expect(view.getByRole('img', { name: 'Demo profile' })).toBeTruthy();
  });

  it('distinguishes decorative and named mask icons and keeps their native dimensions', async () => {
    const view = render(Icon, { icon: '/sample.svg', mask: true, size: 18, testId: 'mask' });
    const mask = view.container.querySelector('span')!;
    expect(mask.getAttribute('aria-hidden')).toBe('true');
    expect(mask.style.getPropertyValue('--icon-size')).toBe('18px');
    await view.rerender({ icon: '/sample.svg', mask: true, size: 18, label: 'Saved address' });
    expect(view.getByRole('img', { name: 'Saved address' })).toBe(mask);
    expect(mask.hasAttribute('aria-hidden')).toBe(false);
  });

  it.each([false, true])(
    'keeps native text fields unbounded unless a limit is supplied (textarea=%s)',
    async (useTextArea) => {
      const view = render(Input, { native: true, value: '', useTextArea });
      const field = view.container.querySelector('input,textarea')!;
      expect(field.hasAttribute('maxlength')).toBe(false);
      await view.rerender({ native: true, value: '', useTextArea, maxLength: 24 });
      expect(field.getAttribute('maxlength')).toBe('24');
    }
  );

  it('mounts every native element binding from an uninitialized consumer reference', async () => {
    const view = render(NativeBindings);
    await tick();
    expect(view.getByTestId('bound-ref-count').textContent).toBe('10');
  });

  it('keeps formatted telephone fields in control of country-code normalization', async () => {
    const { container } = render(Input, { value: '', dataType: 'tel', maxLength: 10 });
    const field = container.querySelector('input')!;
    expect(field.hasAttribute('maxlength')).toBe(false);
    await fireEvent.input(field, { target: { value: '919876543210' } });
    expect(field.value).toBe('9876543210');
  });

  it('preserves raw telephone input and paste ownership in native mode', async () => {
    const oninput = vi.fn();
    const onpaste = vi.fn();
    const formatter = vi.fn((value: string) => value.replace(/\D/g, ''));
    const { container } = render(Input, {
      value: '',
      native: true,
      dataType: 'tel',
      maxLength: 10,
      textTransformers: [formatter],
      oninput,
      onpaste
    });
    const field = container.querySelector('input')!;
    await fireEvent.input(field, { target: { value: '+91 9876543210' } });
    expect(field.value).toBe('+91 9876543210');
    expect(oninput.mock.calls[0][0]).toBe('+91 9876543210');
    expect(formatter).not.toHaveBeenCalled();
    expect(field.getAttribute('maxlength')).toBe('10');
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    await fireEvent(field, paste);
    expect(paste.defaultPrevented).toBe(false);
    expect(onpaste).toHaveBeenCalledOnce();
  });

  it('keeps image loading, intrinsic size, responsive selection, and load notification', async () => {
    const onload = vi.fn();
    const { container } = render(Img, {
      src: '/logo.png',
      alt: 'Store logo',
      onload,
      nativeAttrs: {
        loading: 'lazy',
        width: 42,
        height: 42,
        decoding: 'async',
        fetchpriority: 'low',
        srcset: '/logo.png 1x, /logo-2x.png 2x',
        sizes: '42px'
      }
    });
    const image = container.querySelector('img')!;
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('width')).toBe('42');
    expect(image.getAttribute('height')).toBe('42');
    expect(image.getAttribute('decoding')).toBe('async');
    expect(image.getAttribute('fetchpriority')).toBe('low');
    expect(image.getAttribute('srcset')).toContain('/logo-2x.png 2x');
    expect(image.getAttribute('sizes')).toBe('42px');
    await fireEvent.load(image);
    expect(onload).toHaveBeenCalledOnce();
  });

  it('retains image fallback ownership and allows a new source after a failure', async () => {
    const onerror = vi.fn();
    const view = render(Img, {
      src: '/missing.png',
      alt: '',
      fallback: '/fallback.png',
      onerror
    });
    const image = view.container.querySelector('img')!;
    await fireEvent.error(image);
    expect(image.getAttribute('src')).toBe('/fallback.png');
    expect(onerror).not.toHaveBeenCalled();
    await fireEvent.error(image);
    expect(onerror).toHaveBeenCalledOnce();
    await view.rerender({ src: '/replacement.png' });
    expect(image.getAttribute('src')).toBe('/replacement.png');
  });

  it('puts button description and form metadata on the control, keeping disabled links inert', async () => {
    const onclick = vi.fn();
    const { container } = render(Button, {
      href: '/integrations',
      text: 'Explore',
      disabled: true,
      onclick,
      elementClasses: 'commerce-explore',
      nativeAttrs: { 'aria-describedby': 'product-help', id: 'explore', tabindex: 0 }
    });
    const link = container.querySelector('a')!;
    expect(link.getAttribute('aria-describedby')).toBe('product-help');
    expect(link.id).toBe('explore');
    expect(link.classList.contains('commerce-explore')).toBe(true);
    expect(link.getAttribute('href')).toBeNull();
    expect(link.getAttribute('tabindex')).toBe('-1');
    await fireEvent.click(link);
    expect(onclick).not.toHaveBeenCalled();
  });

  it('retains native phone constraints and combines external hints with library errors', async () => {
    const view = render(Input, {
      value: '123',
      dataType: 'tel',
      label: 'Indian mobile number',
      id: 'phone',
      required: true,
      forceError: true,
      onErrorMessage: 'Enter ten digits.',
      nativeAttrs: {
        dir: 'ltr',
        pattern: '[6-9][0-9]{9}',
        maxlength: 10,
        'aria-describedby': 'phone-hint'
      }
    });
    await tick();
    const field = view.container.querySelector('input')!;
    expect(field.getAttribute('dir')).toBe('ltr');
    expect(field.getAttribute('maxlength')).toBe('10');
    expect(field.validity.patternMismatch).toBe(true);
    expect(field.checkValidity()).toBe(false);
    expect(field.getAttribute('aria-describedby')?.split(' ')).toContain('phone-hint');
    expect(field.getAttribute('aria-describedby')?.split(' ').length).toBeGreaterThan(1);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(view.container.querySelector('label')?.htmlFor).toBe(field.id);
  });

  it('forwards frame load/recovery state without changing frame permissions', async () => {
    const onload = vi.fn();
    const onerror = vi.fn();
    const { container } = render(IframeViewer, {
      src: 'https://example.test/app',
      title: 'Application',
      allow: 'microphone; autoplay',
      onload,
      onerror,
      nativeAttrs: { 'aria-busy': true, 'data-pw': 'application-frame' }
    });
    const frame = container.querySelector('iframe')!;
    expect(frame.getAttribute('allow')).toBe('microphone; autoplay');
    expect(frame.hasAttribute('sandbox')).toBe(false);
    expect(frame.getAttribute('aria-busy')).toBe('true');
    expect(frame.getAttribute('data-pw')).toBe('application-frame');
    await fireEvent.load(frame);
    await fireEvent.error(frame);
    expect(onload).toHaveBeenCalledOnce();
    expect(onerror).toHaveBeenCalledOnce();
  });

  it('recovers an avatar when a later upload supplies a different source', async () => {
    const view = render(Avatar, { src: '/failed.png', alt: 'Profile', name: 'Sam Merchant' });
    await fireEvent.error(view.container.querySelector('img')!);
    expect(view.container.querySelector('img')).toBeNull();
    expect(view.container.textContent).toContain('SM');
    await view.rerender({ src: '/uploaded.png' });
    expect(view.container.querySelector('img')?.getAttribute('src')).toBe('/uploaded.png');
  });
});
