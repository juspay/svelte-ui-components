import { mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Checkbox from './Checkbox.svelte';

/**
 * Checkbox.wc.svelte mounts this exact component with `shadow: 'open'` for every
 * `<sui-checkbox>` consumer. This test reproduces that same boundary directly with
 * Svelte's own `mount()` -- an event dispatched inside an open shadow root needing
 * `composed: true` to reach a light-DOM ancestor -- so the mechanism is covered in
 * jsdom without a browser. The generated `<sui-checkbox>` element itself is covered
 * in real browsers by tests/checkbox-wc-change-composed.spec.ts.
 */
describe('Checkbox — change/input events cross an open shadow root boundary', () => {
  let lightHost: HTMLDivElement | null = null;
  let componentInstance: unknown = null;

  afterEach(() => {
    if (componentInstance) {
      unmount(componentInstance);
      componentInstance = null;
    }
    lightHost?.remove();
    lightHost = null;
  });

  it('reaches a change listener on the light-DOM shadow host', async () => {
    lightHost = document.createElement('div');
    document.body.append(lightHost);
    // `shadow: 'open'` is what Checkbox.wc.svelte declares for <sui-checkbox>.
    const shadowRoot = lightHost.attachShadow({ mode: 'open' });
    const shadowMountPoint = document.createElement('div');
    shadowRoot.append(shadowMountPoint);

    let changeCount = 0;
    // Attached on the shadow HOST, in the light DOM -- exactly where a consumer's
    // own <form> sits relative to <sui-checkbox>'s shadow root.
    lightHost.addEventListener('change', () => {
      changeCount += 1;
    });

    componentInstance = mount(Checkbox, {
      target: shadowMountPoint,
      props: { name: 'agree', text: 'Agree to terms' }
    });

    const label = shadowMountPoint.querySelector('label.container');
    expect(label).toBeInstanceOf(HTMLLabelElement);
    // handleClick uses `flushSync` rather than `await tick()`, so the
    // `input`/`change` dispatch lands synchronously within this call --
    // nothing to await.
    label?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(changeCount).toBe(1);
  });

  it('reports the dispatched input event as composed when observed from outside the shadow root', async () => {
    lightHost = document.createElement('div');
    document.body.append(lightHost);
    const shadowRoot = lightHost.attachShadow({ mode: 'open' });
    const shadowMountPoint = document.createElement('div');
    shadowRoot.append(shadowMountPoint);

    const seenComposed: boolean[] = [];
    // document is further outside than the immediate shadow host -- the same
    // vantage point a delegated, document-level listener uses.
    document.addEventListener('input', (event) => seenComposed.push(event.composed));

    componentInstance = mount(Checkbox, {
      target: shadowMountPoint,
      props: { name: 'agree', text: 'Agree to terms' }
    });

    const label = shadowMountPoint.querySelector('label.container');
    label?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(seenComposed).toEqual([true]);
  });
});
