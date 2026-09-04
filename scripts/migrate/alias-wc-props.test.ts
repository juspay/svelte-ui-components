import { describe, expect, it } from 'vitest';
import { declareProps, isEventProp, lastPropertyEnd, planWrapperProps } from './alias-wc-props.ts';

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

  it('recognises both spellings of an event prop and nothing else', () => {
    // Both directions are real targets: DESIGN_PRINCIPLES keeps the lowercase
    // spelling for a native DOM event forwarded as-is, so `onfocus` is as much a
    // corrected name as `onRowSelect`.
    expect(isEventProp('onClick')).toBe(true);
    expect(isEventProp('onRowSelect')).toBe(true);
    expect(isEventProp('onfocus')).toBe(true);
    expect(isEventProp('onvolumechange')).toBe(true);

    // The whole point of not matching a bare /^on[A-Za-z]/: each of these would
    // otherwise be declared `{ type: 'Object' }` and silently mistyped.
    expect(isEventProp('once')).toBe(false);
    expect(isEventProp('onboarding')).toBe(false);
    expect(isEventProp('only')).toBe(false);
    expect(isEventProp('on')).toBe(false);
    expect(isEventProp('classes')).toBe(false);
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
