import { resolve } from 'node:path';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// A separate app: fixtures never enter SvelteKit's docs route manifest, the
// Pages artifact (build/), or the visual sweep of src/routes/components.
export default defineConfig({
  root: resolve(import.meta.dirname, 'tests/fixtures'),
  appType: 'mpa',
  plugins: [
    svelte({ configFile: false, preprocess: vitePreprocess(), compilerOptions: { runes: true } })
  ],
  resolve: { alias: { $lib: resolve(import.meta.dirname, 'src/lib') } },
  build: {
    outDir: resolve(import.meta.dirname, '.playwright-fixtures'),
    emptyOutDir: true,
    rolldownOptions: {
      input: [
        resolve(import.meta.dirname, 'tests/fixtures/owned-overlay-host/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/overlay-scroll-ownership/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/form-association/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/button-shrinkable/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/date-range-picker/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/embedded-fill/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/table-paginator/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/modal-viewport/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/chat-message-list-scroll/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/banner-right-margin/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/drp-footer-contrast/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/chat-message-min-width/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/scroller-scrollbar/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/img-max-size/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/chat-message-list-inner/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/chat-message-body-list/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/chat-hide-scrollbar/index.html'),
        resolve(import.meta.dirname, 'tests/fixtures/scroller-justify-content/index.html')
      ]
    }
  }
});
