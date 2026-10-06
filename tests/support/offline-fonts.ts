import type { Page } from '@playwright/test';

/**
 * The demo layout links a render-blocking stylesheet from fonts.googleapis.com.
 * `page.goto` resolves on the `load` event, which waits for it, so a spec that
 * has nothing to do with typography inherits the speed (and reachability) of a
 * third-party host: measured here, one font request took 46.7s and stalled a
 * navigation for 49s, past the 30s test timeout, in a different test each run.
 *
 * Aborting those requests makes such a spec depend only on the build under
 * test. It is for specs that assert network behaviour or colours; a spec about
 * text metrics or glyph shapes must not use it, since it falls back to the
 * system font.
 *
 * An aborted request produces no response, so it does not show up in a
 * `page.on('response')` log and cannot be mistaken for a failure of the code
 * under test.
 */
export const blockExternalFonts = async (page: Page): Promise<void> => {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
};
