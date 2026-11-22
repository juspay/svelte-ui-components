import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { compilerOptions } from './svelte.compiler.js';

// SvelteKit types `base` as '' or a leading-slash path; the environment variable is a plain
// string, so it is checked rather than asserted.
const isBasePath = (path: string): path is '' | `/${string}` => path === '' || path.startsWith('/');
const base = process.env.BASE_PATH ?? '';
if (!isBasePath(base)) {
  throw new Error(`BASE_PATH must be empty or start with "/", got "${base}"`);
}

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      compilerOptions,
      adapter: adapter(),
      paths: { base }
    })
  ],
  // Vitest always resolves through Vite's SSR pipeline, which by default
  // picks the same server-oriented compiled output a real SSR request would
  // get rather than the client one `mount()` -- and so `@testing-library/
  // svelte`'s `render()` -- needs. Forcing the browser condition only while
  // vitest itself is running, never for `vite build`/`vite dev`, fixes that
  // without touching how the library is actually built. Spread in rather than
  // set to a fallback value, since this repo's lint bans the `undefined`
  // keyword that the natural fallback would otherwise be.
  ...(process.env.VITEST ? { resolve: { conditions: ['browser'] } } : {}),
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'scripts/*.{test,spec}.{js,ts}',
      'scripts/codemod/**/*.{test,spec}.{js,ts}',
      'scripts/migrate/**/*.{test,spec}.{js,ts}',
      'scripts/release/**/*.{test,spec}.{js,ts}',
      'scripts/wc-parity/**/*.{test,spec}.{js,ts}'
    ]
  }
});
