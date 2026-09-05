#!/usr/bin/env node
// The installed entry point. Kept apart from cli.ts on purpose: cli.ts imports
// the transform, which imports `svelte/compiler` at module load, so a consumer
// missing it would get a bare module-resolution stack before any code of ours
// ran. Resolving it first turns that into one line. Also the reason this does
// not reuse cli.ts's own "am I the entry point" check — the bin is reached
// through an npm symlink, whose path never matches the real module URL, so
// that check would silently run nothing.
const REQUIRED = ['svelte/compiler'];

const missing = REQUIRED.filter((specifier) => {
  try {
    import.meta.resolve(specifier);
    return false;
  } catch {
    return true;
  }
});

if (missing.length > 0) {
  console.error(
    `sui-codemod needs ${missing.join(' and ')} installed in this project ` +
      '(svelte is a peer dependency of @juspay/svelte-ui-components). ' +
      'Install it and run the command again.'
  );
  process.exitCode = 1;
} else {
  const { runCodemod } = await import('./cli.ts');
  const summary = runCodemod(process.argv.slice(2), (line) => {
    console.log(line);
  });
  process.exitCode = summary.exitCode;
}
