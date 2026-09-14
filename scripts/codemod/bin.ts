#!/usr/bin/env node
// The installed entry point. Kept apart from cli.ts on purpose: cli.ts imports
// the transform, which imports `svelte/compiler` at module load, so a consumer
// missing it would get a bare module-resolution stack before any code of ours
// ran. Resolving it first turns that into one line. Also the reason this does
// not reuse cli.ts's own "am I the entry point" check — the bin is reached
// through an npm symlink, whose path never matches the real module URL, so
// that check would silently run nothing.
//
// This same check also gates the `migrate` subcommand (migrate-audit.ts):
// it imports `analyzeStylesheet`/`analyzeSvelte` from `../migrate/analyze.ts`,
// which imports `svelte/compiler` at module load too — unconditionally, for
// both functions, since that import sits above the split between them. This
// check runs, and can fail, before `cli.ts` is even imported, so it covers
// that path regardless of how `cli.ts` itself reaches migrate-audit.ts —
// which it now does with a dynamic `import()` inside `run` (see that
// function's doc comment in cli.ts), specifically so the classic prop-rename
// command below does not pay this same resolution cost, or fail the same
// way, for a dependency only the audit needs.
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
  const { run } = await import('./cli.ts');
  const summary = await run(process.argv.slice(2), (line) => {
    console.log(line);
  });
  process.exitCode = summary.exitCode;
}
