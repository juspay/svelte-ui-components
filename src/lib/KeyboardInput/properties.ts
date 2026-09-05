export type KeyboardInputProperties = MandatoryKeyboardInputProperties &
  OptionalKeyboardInputProperties &
  KeyboardInputEventProperties;

export type MandatoryKeyboardInputProperties = {
  keys: string[] | string;
};

export type OptionalKeyboardInputProperties = {
  separator?: string;
  testId?: string;
  classes?: string;
  /**
   * When true, every key renders exactly as given — the built-in KEY_SYMBOLS
   * table (`space` → ␣, `tab` → ⇥, `cmd` → ⌘, …) is bypassed entirely.
   * Defaults to false, so existing consumers keep today's glyph substitution
   * unchanged. Use this when the word itself is the label that must appear
   * (e.g. a "Hold SPACE" caption or a physical-key caption reading "Tab"),
   * not the typographic symbol.
   */
  literal?: boolean;
};

export type KeyboardInputEventProperties = {
  onclick?: (event: MouseEvent) => void;
};
