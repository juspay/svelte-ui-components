import { mount } from 'svelte';
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
