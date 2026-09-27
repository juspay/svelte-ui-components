// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import Accordion from './Accordion.svelte';

const body = createRawSnippet(() => ({ render: () => '<button class="inside">Inside</button>' }));
const trigger = createRawSnippet(() => ({ render: () => '<span>Toggle</span>' }));

const panel = (container: HTMLElement): HTMLElement | null => container.querySelector('.accordion');
const inside = (container: HTMLElement): HTMLElement | null => container.querySelector('.inside');
const toggle = async (container: HTMLElement): Promise<void> => {
  const node = container.querySelector('.accordion-trigger');
  if (node !== null) {
    await fireEvent.click(node);
  }
  await tick();
};

describe('Accordion collapsed panel', () => {
  it('is not inert while collapsed by default, as before', () => {
    const { container } = render(Accordion, { children: body, trigger });
    // Boolean(): jsdom has no HTMLElement.inert, so on a build that never touches the
    // property it reads undefined -- which is exactly "not inert".
    expect(Boolean(panel(container)?.inert)).toBe(false);
  });

  it('renders its children while collapsed by default, as before', () => {
    const { container } = render(Accordion, { children: body, trigger });
    expect(inside(container)).not.toBeNull();
  });
});

describe('Accordion lazy', () => {
  it('is inert while collapsed and not once expanded', async () => {
    const { container } = render(Accordion, { children: body, trigger, lazy: true });
    expect(panel(container)?.inert).toBe(true);
    await toggle(container);
    expect(panel(container)?.inert).toBe(false);
  });

  it('mounts children on first expand and keeps them after closing', async () => {
    const { container } = render(Accordion, { children: body, trigger, lazy: true });
    expect(inside(container)).toBeNull();
    await toggle(container);
    expect(inside(container)).not.toBeNull();
    await toggle(container);
    expect(inside(container)).not.toBeNull();
    expect(panel(container)?.inert).toBe(true);
  });

  it('mounts at once when it starts expanded', () => {
    const { container } = render(Accordion, { children: body, trigger, lazy: true, expand: true });
    expect(inside(container)).not.toBeNull();
  });

  it('mounts when a controlled expand opens it without the trigger', async () => {
    const { container, rerender } = render(Accordion, { children: body, lazy: true });
    expect(inside(container)).toBeNull();
    await rerender({ children: body, lazy: true, expand: true });
    expect(inside(container)).not.toBeNull();
  });
});
