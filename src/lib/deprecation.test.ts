import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEPRECATION_REMOVAL_VERSION,
  resetDeprecationWarnings,
  warnDeprecatedProp
} from './deprecation.js';

describe('deprecated-prop warnings', () => {
  beforeEach(() => {
    // The suppression set is module-level, so without this a later case would
    // pass by inheriting an earlier case's suppression rather than earning it.
    resetDeprecationWarnings();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Unconditional, rather than at the end of the one case that stubs DEV.
    // A failing assertion there would throw before the cleanup line and leak
    // DEV=false into every later case in the same worker, which silences the
    // warnings they are asserting and reports the failure somewhere else.
    vi.unstubAllEnvs();
  });

  it('names the old spelling, the replacement, and the version that removes it', () => {
    warnDeprecatedProp('Status', 'onbuttonClick', 'onButtonClick');

    expect(console.warn).toHaveBeenCalledTimes(1);
    const message = vi.mocked(console.warn).mock.calls[0][0];
    expect(message).toContain('onbuttonClick');
    expect(message).toContain('onButtonClick');
    expect(message).toContain('<Status>');
    expect(message).toContain(DEPRECATION_REMOVAL_VERSION);
  });

  it('names 4.0.0 as the removal release, so moving it is a deliberate edit', () => {
    // Pinned separately from the message assertion above. That one would keep
    // passing against any value the constant held, including one changed by
    // accident; this one makes the migration's committed target visible in a
    // diff, which is the whole point of it not being a loose string any more.
    expect(DEPRECATION_REMOVAL_VERSION).toBe('4.0.0');
  });

  it('says both spellings work today, so the warning is not read as breakage', () => {
    warnDeprecatedProp('Toggle', 'onclick', 'onClick');

    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('both work today');
  });

  it('points at the codemod rather than leaving the consumer to grep', () => {
    warnDeprecatedProp('Table', 'onrowClick', 'onRowClick');

    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('sui-codemod --dry-run');
  });

  it('warns once per prop however many times it is rendered', () => {
    for (let i = 0; i < 500; i += 1) {
      warnDeprecatedProp('ListItem', 'onitemClick', 'onItemClick');
    }

    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('says nothing in a production build', () => {
    // The half that actually matters. A dev warning that also fires in
    // production would put 142 lines into a consumer's console during an
    // incident, and the guard is the only thing standing between those two
    // outcomes — so it is worth a test rather than a reading of the source.
    vi.stubEnv('DEV', false);

    warnDeprecatedProp('Banner', 'ondismiss', 'onDismiss');

    expect(console.warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('keys on the component too, so the same prop name on two components both warn', () => {
    // `onclick` is deprecated on many components. Deduplicating on the prop
    // alone would tell a consumer about the first one and silently hide the
    // rest, which is worse than not warning at all.
    warnDeprecatedProp('Avatar', 'onclick', 'onClick');
    warnDeprecatedProp('Pill', 'onclick', 'onClick');

    expect(console.warn).toHaveBeenCalledTimes(2);
  });
});
