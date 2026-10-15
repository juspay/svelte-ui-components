import { afterEach, describe, expect, it } from 'vitest';
import { focusTrapTabTarget, getActiveElement, getFocusTrapBoundary } from './focus';

afterEach(() =>
  document.querySelectorAll('[data-composed-focus-fixture]').forEach((node) => node.remove())
);

describe('composed focus boundaries', () => {
  it('includes assigned controls in native slot order and resolves their active element', () => {
    const host = document.createElement('div');
    host.dataset.composedFocusFixture = '';
    const shadow = host.attachShadow({ mode: 'open' });
    const panel = document.createElement('div');
    panel.innerHTML = '<slot></slot>';
    shadow.append(panel);
    const first = document.createElement('button');
    const last = document.createElement('button');
    host.append(first, last);
    document.body.append(host);
    expect(getFocusTrapBoundary(panel)).toEqual({ first, last });
    last.focus();
    expect(getActiveElement(panel)).toBe(last);
    expect(focusTrapTabTarget({ container: panel, activeElement: last, shiftKey: false })).toBe(
      first
    );
  });

  it('traverses nested open shadow roots and excludes hidden/closed native content', () => {
    const panel = document.createElement('div');
    panel.dataset.composedFocusFixture = '';
    panel.innerHTML =
      '<details><summary>Details</summary><button>Closed content</button></details><dialog><button>Closed dialog</button></dialog><div hidden><button>Hidden</button></div>';
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const last = document.createElement('button');
    shadow.append(last);
    panel.append(host);
    document.body.append(panel);
    const summary = panel.querySelector('summary');
    expect(getFocusTrapBoundary(panel)).toEqual({ first: summary, last });
    last.focus();
    expect(getActiveElement(panel)).toBe(last);
  });
});
