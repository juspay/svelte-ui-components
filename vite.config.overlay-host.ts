import { resolve } from 'node:path';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(import.meta.dirname, 'tests/fixtures/owned-overlay-host'),
  plugins: [
    svelte({ configFile: false, preprocess: vitePreprocess(), compilerOptions: { runes: true } })
  ],
  resolve: { alias: { $lib: resolve(import.meta.dirname, 'src/lib') } },
  build: { outDir: resolve(import.meta.dirname, '.overlay-host-fixture'), emptyOutDir: true }
});
