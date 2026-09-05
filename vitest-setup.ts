// Registers a beforeEach/afterEach pair around every test that unmounts
// whatever a previous case rendered and waits for Svelte to flush -- without
// it, a second render() in the same file finds the previous test's markup
// still in `document.body` and every query that expects one match finds two.
import '@testing-library/svelte/vitest';
