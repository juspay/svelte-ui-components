// Shared by both stacks. Svelte 5 exposes mount(); Svelte 4 instantiates the class.
import * as svelte from 'svelte';
import Shell from './Shell.svelte';

window.__events = [];
window.__errors = [];
window.addEventListener('error', (event) => window.__errors.push(String(event.message)));
window.addEventListener('unhandledrejection', (event) =>
  window.__errors.push(
    String(event.reason && event.reason.message ? event.reason.message : event.reason)
  )
);

const target = document.getElementById('app');
try {
  if (typeof svelte.mount === 'function') {
    svelte.mount(Shell, { target });
  } else {
    new Shell({ target });
  }
} catch (error) {
  window.__errors.push('MOUNT: ' + String(error && error.message));
}

const settle = async () => {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await Promise.all(
    [...document.images].map((image) =>
      image.complete ? null : new Promise((done) => (image.onload = image.onerror = done))
    )
  );
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  window.__ready = true;
};
settle();
