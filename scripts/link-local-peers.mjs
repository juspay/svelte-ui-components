import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  unlinkSync
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Opt in with an ignored .local-peer-consumer.json containing
// { "consumer": "../your-app" }. Resolve again after each package build so a
// consumer upgrade cannot leave dist pointing at an obsolete pnpm store entry.
const root = fileURLToPath(new URL('../', import.meta.url));
const configPath = join(root, '.local-peer-consumer.json');
if (existsSync(configPath)) {
  const { consumer } = JSON.parse(readFileSync(configPath, 'utf8'));
  if (typeof consumer !== 'string' || consumer.length === 0) {
    throw new Error('.local-peer-consumer.json must specify a consumer directory');
  }
  const consumerRequire = createRequire(resolve(root, consumer, 'package.json'));
  const target = realpathSync(dirname(consumerRequire.resolve('svelte/package.json')));
  const link = join(root, 'dist/node_modules/svelte');
  mkdirSync(dirname(link), { recursive: true });
  const existing = lstatSync(link, { throwIfNoEntry: false });
  if (existing) {
    if (!existing.isSymbolicLink()) {
      throw new Error(`Refusing to replace a non-symlink at ${link}`);
    }
    unlinkSync(link);
  }
  try {
    symlinkSync(target, link, 'dir');
  } catch (error) {
    // Windows refuses a directory symlink without elevation; a junction needs none
    // and still links the target rather than copying it.
    if (process.platform !== 'win32') {
      throw error;
    }
    symlinkSync(target, link, 'junction');
  }
  console.log('Restored dist/node_modules/svelte from the local consumer');
}
