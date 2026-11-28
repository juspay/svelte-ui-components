import { copyFile, mkdir } from 'node:fs/promises';

// Keep the artifact consumed by local preview and Pages at the same path.
const output = new URL('../build/wc/', import.meta.url);
await mkdir(output, { recursive: true });
await Promise.all([
  copyFile(new URL('../dist-wc/index.js', import.meta.url), new URL('index.js', output)),
  copyFile(new URL('../dist-wc/demo/form.js', import.meta.url), new URL('form.js', output))
]);
