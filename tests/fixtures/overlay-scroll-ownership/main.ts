import { mount } from 'svelte';
import { acquireScrollLock } from '$lib';
import OverlayOwnership from './OverlayOwnership.svelte';
const app = document.getElementById('app');
if (app === null) {
  throw new Error('Missing fixture mount');
}
const target =
  new URLSearchParams(location.search).get('shadow') === '1'
    ? app.attachShadow({ mode: 'open' })
    : app;
// A real shadow host installs the component stylesheet in its own tree.
if (target instanceof ShadowRoot) {
  for (const stylesheet of document.querySelectorAll('link[rel="stylesheet"], style')) {
    target.appendChild(stylesheet.cloneNode(true));
  }
}
mount(OverlayOwnership, { target });

// The public entry (src/lib/index.ts) is compiled by this fixture build, independently of
// the built WC bundle. `$lib` rather than the package name: the latter resolves to dist/,
// which a clean checkout has not built when `pnpm check` runs.
// The fixture controls only API acquisition/release; overlays use their public props.
let releasePublicHold = () => {};
window.addEventListener('public-scroll-lock-control', (event) => {
  if (!(event instanceof CustomEvent)) {
    return;
  }
  if (event.detail === 'acquire') {
    const owner = target.querySelector<HTMLElement>('[data-pw="scroll-root"]');
    if (owner === null) {
      throw new Error('Missing public scroll owner');
    }
    releasePublicHold = acquireScrollLock(owner);
  } else if (event.detail === 'release') {
    releasePublicHold();
  }
});
