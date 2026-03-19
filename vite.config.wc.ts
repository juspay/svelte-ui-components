import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
      compilerOptions: {
        customElement: true,
        runes: true
      }
    })
  ],
  build: {
    outDir: 'dist-wc',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/wc/index.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  },
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib')
    }
  }
});
