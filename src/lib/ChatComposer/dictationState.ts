/**
 * Loom's composer models dictation as a tri-state
 * `'idle' | 'recording' | 'busy'` against this library's boolean `recording`.
 * The third state is not cosmetic -- while transcribing, the control must not
 * accept a new press, so "recording" and "busy" have to be states a consumer
 * can actually branch on, not one flag with two meanings.
 *
 * `recording` widens to accept the tri-state directly. The boolean is kept
 * working, unchanged, as an alias for one minor cycle: `true` reads as
 * 'recording' and `false` (the default) reads as 'idle' -- the only two
 * states a boolean caller could ever express -- so a caller who never touches
 * this keeps exactly today's behaviour.
 */
export type ChatComposerDictationState = 'idle' | 'recording' | 'busy';

export function normalizeDictationState(
  recording: boolean | ChatComposerDictationState
): ChatComposerDictationState {
  if (recording === true) {
    return 'recording';
  }
  if (recording === false) {
    return 'idle';
  }
  return recording;
}
