import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  root: new URL('./.src/', import.meta.url).pathname,
  plugins: [svelte({ configFile: false })],
  resolve: { alias: { 'sui-under-test': '@juspay/svelte-ui-components' } },
  build: { outDir: new URL('./dist/', import.meta.url).pathname, emptyOutDir: true },
  logLevel: 'warn'
};
