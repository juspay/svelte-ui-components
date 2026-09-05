import { describe, expect, it } from 'vitest';
import {
  declareProps,
  isEventProp,
  lastPropertyEnd,
  libraryEventProps,
  planWrapperProps
} from './alias-wc-props.ts';

const root = process.cwd();

const wrapper = (props: string): string => `<svelte:options
  customElement={{
    tag: 'sui-demo',
    shadow: 'open',
    props: {
${props}
    }
  }}
/>

<script lang="ts">
  import Demo from '$lib/Demo/Demo.svelte';
  let props = $props();
</script>

<Demo {...props} />
`;

describe('phase 1 wrapper declarations', () => {
  it('has nothing left to do, because every declaration is already applied', () => {
    // The idempotence check, and the reason the transform is safe to keep in the
    // tree: it plans from the parity ratchet's `missing` list, which is empty
    // once the declarations exist, so a second --apply rewrites nothing.
    const { additions } = planWrapperProps(root);

    expect(additions).toEqual([]);
  });

  it('appends a declaration at the indentation the existing entries use', () => {
    const source = wrapper("      checked: { type: 'Boolean', reflect: true }");

    const next = declareProps(source, ['onClick']);

    expect(next).toContain("      checked: { type: 'Boolean', reflect: true },\n");
    expect(next).toContain("      onClick: { type: 'Object' }\n");
  });

  it('appends several declarations in one pass', () => {
    const source = wrapper("      classes: { type: 'String' }");

    const next = declareProps(source, ['onOpen', 'onClose']);

    expect(next).toContain("      onOpen: { type: 'Object' },\n      onClose: { type: 'Object' }");
  });

  it('leaves the source untouched when there is nothing to add', () => {
    const source = wrapper("      classes: { type: 'String' }");

    expect(declareProps(source, [])).toBe(source);
  });

  it('refuses a wrapper whose props object is empty rather than inventing formatting', () => {
    // An empty object gives the transform no entry to match indentation or
    // trailing-comma style against. Returning null makes that a reported skip
    // instead of a guess that happens to look plausible.
    const source = wrapper('');

    expect(lastPropertyEnd(source)).toBe(-1);
    expect(declareProps(source, ['onClick'])).toBeNull();
  });

  it('refuses a wrapper with no customElement options at all', () => {
    const source = '<script lang="ts">\n  let props = $props();\n</script>\n';

    expect(lastPropertyEnd(source)).toBe(-1);
  });

  it('recognises an event prop by the library declaring it, not by its spelling', () => {
    // With every event prop lowercase, spelling alone cannot tell `onclick`
    // from a future `once`; the library's own `properties.ts` declarations are
    // the authority. `libraryEventProps` reads them; here a fixed set stands in.
    const declared: ReadonlySet<string> = new Set(['onclick', 'onrowselect', 'onfocus', 'onClick']);
    expect(isEventProp('onclick', declared)).toBe(true);
    expect(isEventProp('onrowselect', declared)).toBe(true);
    expect(isEventProp('onClick', declared)).toBe(true);

    // Each of these would otherwise be declared `{ type: 'Object' }` and silently mistyped.
    expect(isEventProp('once', declared)).toBe(false);
    expect(isEventProp('onboarding', declared)).toBe(false);
    expect(isEventProp('on', declared)).toBe(false);
    expect(isEventProp('classes', declared)).toBe(false);
  });

  it('reads every event prop the library declares', () => {
    const declared = libraryEventProps(process.cwd());
    expect(declared.has('onclick')).toBe(true);
    expect(declared.has('onrowclick')).toBe(true);
    expect(declared.has('onErrorMessage')).toBe(false);
    expect(declared.has('once')).toBe(false);
  });

  it('declares every added prop as an Object, which is what a callback needs', () => {
    // A callback cannot survive an HTML attribute, so it takes no attribute
    // mapping and no reflection -- matching every function prop already declared
    // by hand in these wrappers.
    const next = declareProps(wrapper("      classes: { type: 'String' }"), ['onSend']);

    expect(next).toContain("onSend: { type: 'Object' }");
    expect(next).not.toContain("onSend: { type: 'Object', attribute");
    expect(next).not.toContain("onSend: { type: 'Object', reflect");
  });
});
