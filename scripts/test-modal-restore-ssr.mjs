import { resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
const outIndex = process.argv.indexOf('--out');
if (outIndex < 0 || !process.argv[outIndex + 1]) {
  throw new Error('Pass --out to a fresh SSR evidence directory.');
}
const out = resolve(process.argv[outIndex + 1]);
if (existsSync(out)) {
  throw new Error('Preserve prior SSR evidence; pass a fresh --out directory.');
}
await build({
  configFile: false,
  plugins: [
    svelte({ configFile: false, preprocess: vitePreprocess(), compilerOptions: { runes: true } })
  ],
  resolve: { alias: { $lib: resolve('src/lib') } },
  ssr: { noExternal: true },
  build: {
    ssr: resolve('tests/fixtures/modal-restore-focus/ssr.ts'),
    outDir: out,
    emptyOutDir: true
  }
});
const { checkSSR } = await import(pathToFileURL(resolve(out, 'ssr.js')).href);
const result = checkSSR();
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
