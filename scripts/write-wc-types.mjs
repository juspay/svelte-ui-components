import { readdir, writeFile } from 'node:fs/promises';

const dist = new URL('../dist-wc/', import.meta.url);
const modules = new URL('modules/', dist);
const declaration = "export { createRawSnippet } from 'svelte';\n";
const entries = (await readdir(modules, { withFileTypes: true })).filter(
  (item) => item.isFile() && item.name.endsWith('.js')
);
await Promise.all([
  writeFile(new URL('index.d.ts', dist), declaration),
  ...entries.map((entry) =>
    writeFile(new URL(entry.name.replace(/\.js$/, '.d.ts'), modules), declaration)
  )
]);
