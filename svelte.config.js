import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit@next').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter()
  },
  compilerOptions: {
    runes: true
  }
};

export default config;
