import type { Snippet } from 'svelte';

export type TypewriterTextProperties = OptionalTypewriterTextProperties &
  MandatoryTypewriterTextProperties;

export type MandatoryTypewriterTextProperties = {
  text: string;
};

/** A random delay in `[min, max]` milliseconds is picked per character in that class. Pass equal `min`/`max` for a fixed delay. */
export type TypewriterCharacterDelayRange = {
  min: number;
  max: number;
};

/**
 * Per-character-class pacing, in place of the flat `speed`. Reach for this when a
 * conversation needs to slow down for numbers (prices, OTPs, phone numbers) or add a
 * beat at punctuation, the way a person reading it aloud would. Any class you omit —
 * including `default` — falls back to `speed` for that character.
 */
export type TypewriterVariableDelay = {
  /** Digits (`0`–`9`). */
  digit?: TypewriterCharacterDelayRange;
  /** A space or newline — the natural word-boundary pause. */
  whitespace?: TypewriterCharacterDelayRange;
  /** Sentence punctuation: `,` `.` `?` `!`. */
  punctuation?: TypewriterCharacterDelayRange;
  /** Every other character (letters and anything not covered above). */
  default?: TypewriterCharacterDelayRange;
};

export type TypewriterProgress = {
  /** Characters revealed so far. */
  index: number;
  /** Length of `text` at the time of this update — compare against `index` for a percentage. */
  total: number;
  /** The text revealed so far — the same value driving what's on screen. */
  displayedText: string;
};

export type TypewriterCharacterContext = {
  /** The character being rendered. */
  character: string;
  /** Its position within the full `text` string. */
  index: number;
};

/**
 * Everything `resolveDelay` gets to decide the next character's pacing from — a
 * superset of `TypewriterCharacterContext` because pacing can depend on more than the
 * character alone (see `wordCount`).
 */
export type TypewriterDelayContext = TypewriterCharacterContext & {
  /**
   * Whitespace characters (space or newline) revealed so far — INCLUDING this one, if
   * `character` itself is whitespace. The component always updates this count before
   * calling `resolveDelay`, so a cadence that keys off word position (a cyclical
   * acceleration window, slowing down only for the first word of a sentence, etc.) can
   * rely on that ordering instead of inferring it through a side channel like
   * `onProgress`. Counts only whitespace, matching the `whitespace` class in
   * `TypewriterVariableDelay` — it is not a word index in any richer sense.
   */
  wordCount: number;
};

/**
 * Computes the delay before the NEXT character types, given the one that was just
 * revealed and enough state (`index`, `wordCount`) to vary that delay with position —
 * not just character class. Reach for this instead of `variableDelay` when the cadence
 * needs to depend on where typing currently is, not only on what the character is: e.g.
 * an accelerating window every N words, or a pause that only applies to the first
 * occurrence of a character class. `variableDelay` stays the right tool for a pure
 * per-class rule with no positional state.
 */
export type TypewriterDelayResolver = (context: TypewriterDelayContext) => number;

export type OptionalTypewriterTextProperties = {
  /** Milliseconds between characters. Ignored per character class covered by `variableDelay`. */
  speed?: number;
  /**
   * While `true`, text revealed so far stays and new text keeps typing as `text` grows.
   * The moment it turns `false`, all remaining text is shown at once.
   */
  isStreaming?: boolean;
  /**
   * Renders the revealed text as HTML — pass a markdown renderer to type rich text.
   * The component trusts the returned string, so sanitise inside the renderer if the
   * text can contain untrusted input. When omitted, the text renders as plain text.
   */
  renderText?: (text: string) => string;
  /**
   * Opt into per-character-class pacing (digits, whitespace, punctuation, everything
   * else) instead of the flat `speed`. Omit to keep the flat `speed` for every character.
   */
  variableDelay?: TypewriterVariableDelay;
  /**
   * Opt into a fully custom pacing function, called once per character in place of
   * `variableDelay`/`speed`. Needed when the cadence isn't a pure function of the
   * character's own class — e.g. an accelerating window that recurs every N words and,
   * while active, collapses whitespace/punctuation/default pacing to a single flat
   * range regardless of class, with only digits kept slow throughout. `variableDelay`
   * cannot express that fourth, position-driven case because it re-evaluates from
   * scratch per character with no notion of where typing currently is; `resolveDelay`
   * closes that gap by handing the resolver `index` and `wordCount` alongside the
   * character (see `TypewriterDelayContext` for the ordering guarantee on `wordCount`),
   * so state like a running cycle position can live in the resolver's own closure
   * instead of a side channel like swapping `variableDelay` from inside `onProgress`.
   * Takes priority over `variableDelay` when both are set. Omit to keep
   * `variableDelay`/`speed` resolution exactly as today.
   */
  resolveDelay?: TypewriterDelayResolver;
  /**
   * Called every time a character is revealed (and once more if `isStreaming` turns
   * `false` while text remains, since the rest appears at once) — scroll a container to
   * follow the reveal, or show how far along it is. Not called when omitted.
   */
  onProgress?: (progress: TypewriterProgress) => void;
  /**
   * Render each revealed character yourself — highlight a token, wrap a number — instead
   * of the plain text node. Ignored when `renderText` is set, since that renderer already
   * owns the full markup. Falls back to plain text per character when omitted.
   */
  renderCharacter?: Snippet<[TypewriterCharacterContext]>;
  testId?: string;
  classes?: string;
};
