import { copyFile, mkdir } from 'node:fs/promises';

// Keep the artifact consumed by local preview and Pages at the same path.
const output = new URL('../build/wc/', import.meta.url);
await mkdir(output, { recursive: true });
await copyFile(new URL('../dist-wc/index.js', import.meta.url), new URL('index.js', output));
