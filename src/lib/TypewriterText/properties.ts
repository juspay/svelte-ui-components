export type TypewriterTextProperties = OptionalTypewriterTextProperties &
  MandatoryTypewriterTextProperties;

export type MandatoryTypewriterTextProperties = {
  text: string;
};

export type OptionalTypewriterTextProperties = {
  /** Milliseconds between characters. */
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
  testId?: string;
  classes?: string;
};
