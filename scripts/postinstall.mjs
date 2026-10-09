// Printed on install in a consumer's project. Kept in plain .mjs deliberately:
// this runs before anything is built and in whatever Node the consumer has, so
// it must not depend on TypeScript stripping, on a build step, or on any
// dependency at all.
//
// It never fails an install. Every path exits 0, and any unexpected error is
// swallowed — a dependency that breaks `npm install` over a advisory message
// would be far worse than a consumer missing the message.

const RESET = '[0m';
const BOLD = '[1m';
const DIM = '[2m';

const isSelfInstall = () => {
  // In a consumer install, INIT_CWD is the consumer's project root and cwd is
  // this package inside node_modules. Developing this repo makes them equal.
  const initCwd = process.env.INIT_CWD;
  return typeof initCwd !== 'string' || initCwd === process.cwd();
};

const isNonInteractive = () =>
  process.env.CI === 'true' ||
  process.env.CI === '1' ||
  process.env.npm_config_loglevel === 'silent' ||
  process.stdout.isTTY !== true;

const notice = () =>
  [
    '',
    `${BOLD}@juspay/svelte-ui-components — migration guidance${RESET}`,
    '',
    '  1. Library event props use lowercase (`onrowclick`, `onclick`).',
    '     Removed spellings on library tags must be renamed. Callback keys',
    '     on configuration objects keep their documented spelling.',
    '     Guide: docs/EVENT_CASING_MIGRATION.md in the repository.',
    '',
    '  2. sui-chat-bubble, sui-draggable and sui-resizable accept content',
    '     through light-DOM children. Their native `children` collection',
    '     is not a writable snippet property:',
    `       ${DIM}<sui-draggable><div>…</div></sui-draggable>${RESET}`,
    '',
    '  Preview event-prop renames and reported children assignments:',
    `    ${BOLD}npx sui-codemod --dry-run ./src${RESET}`,
    '  Apply the event-prop renames:',
    `    ${BOLD}npx sui-codemod ./src${RESET}`,
    '  Review reported content assignments and move them to light DOM.',
    ''
  ].join('\n');

try {
  if (!isSelfInstall() && !isNonInteractive()) {
    process.stdout.write(notice());
  }
} catch {
  // Advisory only; never interfere with the install.
}
