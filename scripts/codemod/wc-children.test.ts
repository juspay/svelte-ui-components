import { describe, expect, it } from 'vitest';
import { CHILDREN_BREAKING_TAGS, findChildrenAssignments } from './wc-children.ts';

describe('4.0.0 children-assignment detector', () => {
  it('flags an assignment in a file that uses an affected tag', () => {
    const source = [
      "const panel = document.querySelector('sui-draggable');",
      'panel.children = mySnippet;'
    ].join('\n');

    const found = findChildrenAssignments(source, 'app.ts');

    expect(found).toHaveLength(1);
    expect(found[0].line).toBe(2);
    expect(found[0].message).toContain('sui-draggable');
  });

  it('stays silent when no affected tag appears in the file', () => {
    // `element.children` is an ordinary DOM expression. Flagging it everywhere
    // would make the detector noise, so the tag has to be present too.
    const source = ['const list = document.querySelector(".menu");', 'list.children = [];'].join(
      '\n'
    );

    expect(findChildrenAssignments(source, 'unrelated.ts')).toEqual([]);
  });

  it('does not mistake a comparison for an assignment', () => {
    const source = [
      "const el = document.querySelector('sui-resizable');",
      'if (el.children === previous) return;',
      'const same = el.children == other;'
    ].join('\n');

    expect(findChildrenAssignments(source, 'compare.ts')).toEqual([]);
  });

  it('does not flag reading children, which is what the fix restores', () => {
    const source = [
      "const el = document.querySelector('sui-chat-bubble');",
      'const count = el.children.length;',
      'for (const child of el.children) use(child);'
    ].join('\n');

    expect(findChildrenAssignments(source, 'read.ts')).toEqual([]);
  });

  it('does not confuse childNodes for children', () => {
    const source = [
      "const el = document.querySelector('sui-draggable');",
      'el.childNodes = whatever;'
    ].join('\n');

    expect(findChildrenAssignments(source, 'nodes.ts')).toEqual([]);
  });

  it('finds assignments through an arbitrary receiver expression', () => {
    // A consumer reaches the element however they like; anchoring on the
    // property rather than the receiver is what gives this useful recall.
    const source = [
      '// mounts a sui-resizable',
      'this.$refs.panel.children = a;',
      'refs[0].children = b;',
      'getPanel().children = c;'
    ].join('\n');

    expect(findChildrenAssignments(source, 'receivers.ts')).toHaveLength(3);
  });

  it('names every affected tag it can see', () => {
    expect([...CHILDREN_BREAKING_TAGS].sort()).toEqual([
      'sui-chat-bubble',
      'sui-draggable',
      'sui-resizable'
    ]);
  });
});
