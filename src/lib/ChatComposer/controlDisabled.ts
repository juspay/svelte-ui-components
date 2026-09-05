/**
 * #526: `disabled` used to gate the textarea, the voice button and the send
 * button together — a caller mid-send with dictation running had no way to
 * freeze the send button without also freezing the mic. `textDisabled`,
 * `voiceDisabled` and `sendDisabled` let a caller override one control at a
 * time; leaving a specific flag at its `null` default falls back to the
 * shared `disabled`, so the single-prop behaviour is exactly what a caller
 * who never passes the new props keeps getting.
 */
export function resolveControlDisabled(specific: boolean | null, disabled: boolean): boolean {
  return specific ?? disabled;
}
