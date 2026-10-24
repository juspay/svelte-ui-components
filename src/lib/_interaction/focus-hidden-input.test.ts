import { afterEach, describe, expect, it } from 'vitest';
import {
  focusEntryPoint,
  focusTrapTabTarget,
  getActiveElement,
  getFocusTrapBoundary
} from './focus';

const panel = (markup: string): HTMLDivElement => {
  const node = document.createElement('div');
  node.tabIndex = -1;
  node.innerHTML = markup;
  document.body.append(node);
  return node;
};

afterEach(() => document.body.replaceChildren());

for (const type of ['hidden', 'HIDDEN', 'HiDdEn']) {
  for (const tabindex of ['', ' tabindex="0"', ' tabindex="2"', ' tabindex="-1"']) {
    describe(`hidden input type=${type}${tabindex}`, () => {
      it('enters the first safe control and uses safe controls for both Tab edges', () => {
        const container = panel(
          `<input type="${type}"${tabindex} name="tokenId" value="controlled-token"><button id="cancel">Cancel</button><button id="revoke">Revoke</button><input type="${type}"${tabindex}>`
        );
        const cancel = container.querySelector('#cancel');
        const revoke = container.querySelector('#revoke');
        expect(getFocusTrapBoundary(container)).toEqual({ first: cancel, last: revoke });
        focusEntryPoint(container);
        expect(document.activeElement).toBe(cancel);
        expect(focusTrapTabTarget({ container, activeElement: revoke, shiftKey: false })).toBe(
          cancel
        );
        expect(focusTrapTabTarget({ container, activeElement: cancel, shiftKey: true })).toBe(
          revoke
        );
        expect(container.querySelector('input[name="tokenId"]')?.getAttribute('value')).toBe(
          'controlled-token'
        );
      });

      it('uses the existing control-free panel fallback when only hidden inputs remain', () => {
        const container = panel(`<input type="${type}"${tabindex}>`);
        expect(getFocusTrapBoundary(container)).toEqual({ first: null, last: null });
        focusEntryPoint(container);
        expect(document.activeElement).toBe(container);
        for (const shiftKey of [false, true]) {
          expect(
            focusTrapTabTarget({ container, activeElement: getActiveElement(container), shiftKey })
          ).toBe(container);
        }
      });
    });
  }
}

it.each([
  '<input id="eligible">',
  '<input id="eligible" type="text">',
  '<input id="eligible" type=" hidden ">',
  '<input id="eligible" type="unrecognized">',
  '<button id="eligible" type="hidden">Ordinary button</button>'
])('preserves an ordinary candidate: %s', (markup) => {
  const container = panel(markup);
  const eligible = container.querySelector('#eligible');
  expect(getFocusTrapBoundary(container)).toEqual({ first: eligible, last: eligible });
  focusEntryPoint(container);
  expect(document.activeElement).toBe(eligible);
});

it('re-evaluates an input after its semantic type changes', () => {
  const container = panel('<input type="hidden"><button>Cancel</button>');
  const input = container.querySelector('input');
  const cancel = container.querySelector('button');
  expect(getFocusTrapBoundary(container).first).toBe(cancel);
  input?.setAttribute('type', 'text');
  expect(getFocusTrapBoundary(container).first).toBe(input);
  input?.setAttribute('type', 'HIDDEN');
  expect(getFocusTrapBoundary(container).first).toBe(cancel);
});

it('uses safe controls inside a shadow root without changing shadow-aware ownership', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const container = panel('<input type="hidden"><button>Cancel</button>');
  shadow.append(container);
  const cancel = container.querySelector('button');
  focusEntryPoint(container);
  expect(document.activeElement).toBe(host);
  expect(getActiveElement(container)).toBe(cancel);
  expect(
    focusTrapTabTarget({ container, activeElement: getActiveElement(container), shiftKey: true })
  ).toBe(cancel);
});
