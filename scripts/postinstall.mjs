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
    `${BOLD}@juspay/svelte-ui-components — one breaking change is coming in 4.0.0${RESET}`,
    '',
    '  Nothing has changed yet. In 4.0.0, `children` stops being a settable',
    '  property on sui-chat-bubble, sui-draggable and sui-resizable, and',
    '  assigning it will silently lose the content.',
    '',
    '  Move to light-DOM children ahead of time:',
    `    ${DIM}el.children = snippet;${RESET}                        // before`,
    `    ${DIM}<sui-draggable><div>…</div></sui-draggable>${RESET}    // after`,
    '',
    '  That change is what restores `element.children` on those three:',
    '  declaring the prop leaves it undefined today.',
    '',
    `  Find affected call sites now (reports only, writes nothing):`,
    `    ${BOLD}npx sui-codemod --dry-run ./src${RESET}`,
    '',
    `  ${DIM}Nothing else in the custom-element surface breaks.${RESET}`,
    ''
  ].join('\n');

try {
  if (!isSelfInstall() && !isNonInteractive()) {
    process.stdout.write(notice());
  }
} catch {
  // Advisory only; never interfere with the install.
}
