import { afterEach, describe, expect, it } from 'vitest';
import { focusEntryPoint, focusTrapTabTarget, getActiveElement } from './focus';

const panel = (): HTMLDivElement => {
  const node = document.createElement('div');
  node.tabIndex = -1;
  document.body.append(node);
  return node;
};

afterEach(() => document.body.replaceChildren());

for (const shiftKey of [false, true]) {
  describe(`${shiftKey ? 'Shift+Tab' : 'Tab'} in a control-free panel`, () => {
    it('keeps the panel focused by the existing entry fallback', () => {
      const container = panel();
      focusEntryPoint(container);
      expect(document.activeElement).toBe(container);
      expect(
        focusTrapTabTarget({ container, activeElement: getActiveElement(container), shiftKey })
      ).toBe(container);
    });

    it('does not take focus from another panel or a background control', () => {
      const container = panel();
      const other = panel();
      const background = document.createElement('button');
      document.body.append(background);
      for (const active of [other, background]) {
        active.focus();
        expect(
          focusTrapTabTarget({ container, activeElement: getActiveElement(container), shiftKey })
        ).toBeNull();
        expect(document.activeElement).toBe(active);
      }
    });

    it('leaves a nested empty panel in control', () => {
      const outer = panel();
      const inner = panel();
      outer.append(inner);
      inner.focus();
      expect(focusTrapTabTarget({ container: outer, activeElement: inner, shiftKey })).toBeNull();
      expect(focusTrapTabTarget({ container: inner, activeElement: inner, shiftKey })).toBe(inner);
    });

    it('uses the active panel inside its shadow root rather than the shadow host', () => {
      const host = document.createElement('div');
      document.body.append(host);
      const shadow = host.attachShadow({ mode: 'open' });
      const container = document.createElement('div');
      container.tabIndex = -1;
      shadow.append(container);
      focusEntryPoint(container);
      expect(document.activeElement).toBe(host);
      expect(getActiveElement(container)).toBe(container);
      expect(
        focusTrapTabTarget({ container, activeElement: getActiveElement(container), shiftKey })
      ).toBe(container);
    });

    it('retains the focused fallback when every descendant is ineligible', () => {
      const container = panel();
      container.innerHTML =
        '<button hidden>Hidden</button><button disabled>Disabled</button><div inert><button>Inert</button></div>';
      focusEntryPoint(container);
      expect(
        focusTrapTabTarget({ container, activeElement: getActiveElement(container), shiftKey })
      ).toBe(container);
    });

    it('preserves ordinary one- and many-control boundaries', () => {
      for (const count of [1, 3]) {
        const container = panel();
        const controls = Array.from({ length: count }, () => document.createElement('button'));
        container.append(...controls);
        const edge = shiftKey ? controls[0] : controls[count - 1];
        const destination = shiftKey ? controls[count - 1] : controls[0];
        edge.focus();
        expect(focusTrapTabTarget({ container, activeElement: edge, shiftKey })).toBe(destination);
        if (count === 3) {
          controls[1].focus();
          expect(
            focusTrapTabTarget({ container, activeElement: controls[1], shiftKey })
          ).toBeNull();
        }
      }
    });

    it('preserves the null-container case', () => {
      expect(focusTrapTabTarget({ container: null, activeElement: null, shiftKey })).toBeNull();
    });
  });
}
