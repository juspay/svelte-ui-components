import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const virtualEntry = 'virtual:wc-entry:';
const wrapperImports = [
  ...readFileSync(new URL('./src/wc/index.ts', import.meta.url), 'utf8').matchAll(
    /^import '(\.\/components\/[^']+\.wc\.svelte)';$/gm
  )
];
const wrappers = new Map(
  wrapperImports.map((match) => {
    const wrapper = resolve(import.meta.dirname, 'src/wc', match.at(1) ?? '');
    const tag = /\btag:\s*'sui-([^']+)'/.exec(readFileSync(wrapper, 'utf8'))?.at(1);
    if (typeof tag !== 'string') {
      throw new Error(`Missing custom-element tag in ${wrapper}`);
    }
    return [tag, wrapper];
  })
);
if (wrappers.size !== wrapperImports.length || wrappers.size === 0) {
  throw new Error('Web-component entries must have distinct tags.');
}

const aggregate = resolve(import.meta.dirname, 'src/wc/index.ts');

export default defineConfig(({ mode }) => {
  const modules = mode === 'wc-modules';
  const form = mode === 'wc-form';
  return {
    plugins: [
      svelte({
        preprocess: vitePreprocess(),
        compilerOptions: { customElement: true, runes: true }
      }),
      {
        name: 'sui-wc-module-entries',
        enforce: 'pre',
        resolveId(id) {
          // Vite may pass library inputs as absolute paths.
          const offset = id.lastIndexOf(virtualEntry);
          return offset >= 0 && wrappers.has(id.slice(offset + virtualEntry.length))
            ? '\0' + id.slice(offset)
            : null;
        },
        load(id) {
          if (!id.startsWith('\0' + virtualEntry)) {
            return null;
          }
          const wrapper = wrappers.get(id.slice(virtualEntry.length + 1));
          if (typeof wrapper !== 'string') {
            return null;
          }
          return `import ${JSON.stringify(wrapper)}; export { createRawSnippet } from 'svelte';`;
        }
      }
    ],
    build: {
      outDir: form ? 'dist-wc/demo' : modules ? 'dist-wc/modules' : 'dist-wc',
      emptyOutDir: true,
      lib: {
        entry: modules
          ? {
              index: aggregate,
              ...Object.fromEntries([...wrappers.keys()].map((tag) => [tag, virtualEntry + tag]))
            }
          : form
            ? { form: resolve(import.meta.dirname, 'src/wc/form-demo.ts') }
            : aggregate,
        formats: ['es'],
        fileName: (_format, name) => `${name}.js`
      },
      rolldownOptions: {
        output: {
          codeSplitting: modules,
          chunkFileNames: 'chunks/[name]-[hash].js'
        }
      }
    }
  };
});
