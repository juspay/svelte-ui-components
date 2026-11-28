import { readFile } from 'node:fs/promises';
import type { Connect } from 'vite';
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

// SvelteKit preview serves its own client output. The deployed static site
// serves build/ directly, where the full build stages the same bundle.
function serveWcDemoBundle(name: 'index' | 'form', file: string): Connect.NextHandleFunction {
  const bundle = new URL(file, import.meta.url);
  return async (request, response, next) => {
    const pathname = request.url?.split('?').at(0);
    if (
      pathname !== `${base}/wc/${name}.js` ||
      (request.method !== 'GET' && request.method !== 'HEAD')
    ) {
      next();
      return;
    }
    try {
      const body = await readFile(bundle);
      response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      response.setHeader('Content-Length', body.byteLength);
      response.end(request.method === 'HEAD' ? null : body);
    } catch (error) {
      next(error);
    }
  };
}

export default defineConfig({
  plugins: [
    {
      name: 'sui-wc-demo-bundle',
      configureServer(server) {
        server.middlewares.use(serveWcDemoBundle('index', './dist-wc/index.js'));
        server.middlewares.use(serveWcDemoBundle('form', './dist-wc/demo/form.js'));
      },
      configurePreviewServer(server) {
        server.middlewares.use(serveWcDemoBundle('index', './build/wc/index.js'));
        server.middlewares.use(serveWcDemoBundle('form', './build/wc/form.js'));
      }
    },
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
