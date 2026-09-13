import { describe, expect, it } from 'vitest';
import { describeField } from './description';

describe('describeField', () => {
  it('references nothing when there is no message', () => {
    const field = describeField('email-1', {});
    expect(field.describedBy).toBeNull();
    expect(field.ariaInvalid).toBeNull();
    expect(field.showsError).toBe(false);
    expect(field.showsInfo).toBe(false);
  });

  it('references only the messages that are actually rendered', () => {
    // The whole point: an id in aria-describedby pointing at an element that is
    // not in the DOM passes an attribute assertion and resolves to nothing.
    expect(describeField('e', { error: 'Bad' }).describedBy).toBe('e-error');
    expect(describeField('e', { info: 'Help' }).describedBy).toBe('e-info');
    expect(describeField('e', { error: 'Bad', info: 'Help' }).describedBy).toBe('e-error e-info');
  });

  it('treats null and empty strings as absent, not as a message', () => {
    expect(describeField('e', { error: null, info: '' }).describedBy).toBeNull();
    expect(describeField('e', { error: '' }).ariaInvalid).toBeNull();
  });

  it('marks invalid without a message when the consumer forces it', () => {
    const field = describeField('e', { invalid: true });
    expect(field.ariaInvalid).toBe('true');
    // Nothing to point at, so it points at nothing rather than at a missing id.
    expect(field.describedBy).toBeNull();
  });

  it('derives ids from the control id so two controls cannot collide', () => {
    expect(describeField('a', { error: 'x' }).errorId).toBe('a-error');
    expect(describeField('b', { error: 'x' }).errorId).toBe('b-error');
  });

  it('does not set aria-invalid merely because helper text exists', () => {
    expect(describeField('e', { info: 'Enter 1-100' }).ariaInvalid).toBeNull();
  });
});
