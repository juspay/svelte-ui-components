import { resolve } from 'node:path';
import { FUNCTIONAL, playwrightPort } from '../../scripts/pw-port';

// Use the fixture app's path as a separate port namespace. PW_PORT belongs to
// the docs server; ignoring it here prevents both servers binding the same port.
export const fixturePort = playwrightPort(FUNCTIONAL, {
  path: resolve(import.meta.dirname, '../fixtures'),
  override: ''
});
export const fixtureBaseURL = `http://localhost:${fixturePort}`;
