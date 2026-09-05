import { describe, expect, it } from 'vitest';
import { canonicalEventName, deriveEventName } from './casing.ts';

describe('deriveEventName', () => {
  it('lowercases everything after `on`, native or invented alike', () => {
    expect(deriveEventName('onClick')).toEqual({ kind: 'rename', target: 'onclick' });
    expect(deriveEventName('onRowClick')).toEqual({ kind: 'rename', target: 'onrowclick' });
    expect(deriveEventName('onheaderLeftImageClick')).toEqual({
      kind: 'rename',
      target: 'onheaderleftimageclick'
    });
    expect(deriveEventName('onInput')).toEqual({ kind: 'rename', target: 'oninput' });
  });

  it('leaves an already-lowercase name alone', () => {
    expect(deriveEventName('onclick')).toEqual({ kind: 'ok', target: 'onclick' });
    expect(deriveEventName('onoverlayclick')).toEqual({ kind: 'ok', target: 'onoverlayclick' });
  });

  it('rejects a name that is not an event prop', () => {
    expect(deriveEventName('click')).toEqual({ kind: 'unresolved', candidates: [] });
    expect(deriveEventName('on')).toEqual({ kind: 'unresolved', candidates: [] });
  });

  it('uses the fork name where a shared component had renamed the event', () => {
    expect(canonicalEventName('Stepper', 'onStepClick')).toBe('onhandlestepclick');
    expect(canonicalEventName('Stepper', 'onstepclick')).toBe('onhandlestepclick');
    expect(canonicalEventName('Gallery', 'onDismiss')).toBe('onclose');
    expect(canonicalEventName('MediaUpload', 'onRejected')).toBe('onerror');
    expect(deriveEventName('onstepclick', 'Stepper')).toEqual({
      kind: 'rename',
      target: 'onhandlestepclick'
    });
  });

  it('does not apply an override to a different component', () => {
    expect(canonicalEventName('Toggle', 'onDismiss')).toBe('ondismiss');
  });
});
