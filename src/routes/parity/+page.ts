// Client-only on purpose. A visual comparison is a browser artifact, and more
// practically `<svelte:boundary>` catches render failures on the client but not
// during SSR — so a single component throwing server-side takes the whole page
// to a 500 and there is nothing to compare. Rendering in the browser lets one
// side fail visibly in its own cell while the other 63 rows still render, which
// is the behaviour this harness needs: a component that throws on a fixture the
// other library renders is itself a parity difference worth seeing.
// prerender stays TRUE because the site ships on adapter-static, which rejects a
// route it cannot emit as a file. With ssr false it emits the shell and the
// client hydrates — an empty page in the build output is the correct artifact
// here, not a missing one.
export const ssr = false;
export const prerender = true;
