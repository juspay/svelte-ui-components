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
      input: resolve(import.meta.dirname, 'tests/fixtures/form-association/index.html')
    }
  }
});
