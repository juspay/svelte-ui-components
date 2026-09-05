import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
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
      'scripts/codemod/**/*.{test,spec}.{js,ts}',
      'scripts/migrate/**/*.{test,spec}.{js,ts}',
      'scripts/wc-parity/**/*.{test,spec}.{js,ts}'
    ]
  }
});
