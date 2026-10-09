import { mount } from 'svelte';
import OwnedOverlayHost from './OwnedOverlayHost.svelte';

const host = document.getElementById('embedded-app');
if (host === null) {
  throw new Error('Owned-overlay host is missing');
}
const shadow = host.attachShadow({ mode: 'open' });
// A native Svelte app owns its stylesheet inside the embedding shadow root.
for (const stylesheet of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
  shadow.append(stylesheet.cloneNode(true));
}
const root = document.createElement('div');
shadow.append(root);
mount(OwnedOverlayHost, { target: root });

const style = document.createElement('style');
style.textContent = `
  body { margin: 0; font-family: sans-serif; }
  nav { position: absolute; top: 24px; left: 16px; width: 128px; }
  aside { position: absolute; top: 80px; left: 16px; width: 128px; height: 320px; overflow: auto; }
  aside div { height: 1200px; }
  #embedded-app { position: absolute; top: 80px; left: 160px; width: 360px; height: 420px;
    transform: translateZ(0); contain: paint; border: 1px solid #2563eb;
    --modal-width: 100%; --modal-height: 100%; --modal-fit-content-max-height: 90%;
    --modal-fit-content-max-width: 90%; --modal-max-height: 90%;
    --sheet-width: 280px; --sheet-max-width: 100%; --sheet-max-height: 100%; }
  [data-pw="host-spacer"] { height: 1800px; pointer-events: none; }
`;
document.head.append(style);
document.documentElement.style.setProperty('color-scheme', 'light');
