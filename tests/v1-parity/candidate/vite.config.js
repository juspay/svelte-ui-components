import { svelte } from '@sveltejs/vite-plugin-svelte';

// V1_PARITY_TARGET=dist checks the packaged output (what a consumer installs) instead of the source.
const target =
  process.env.V1_PARITY_TARGET === 'dist'
    ? '../../../dist/v1/index.js'
    : '../../../src/lib/v1/index.ts';

export default {
  root: new URL('./.src/', import.meta.url).pathname,
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { 'sui-v1-under-test': new URL(target, import.meta.url).pathname } },
  build: { outDir: new URL('./dist/', import.meta.url).pathname, emptyOutDir: true },
  logLevel: 'warn'
};
