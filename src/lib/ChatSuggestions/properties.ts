export type ChatSuggestion = string | { label: string; value?: string };

export type ChatSuggestionsProperties = OptionalChatSuggestionsProperties &
  ChatSuggestionsEventProperties &
  MandatoryChatSuggestionsProperties;

export type MandatoryChatSuggestionsProperties = {
  items: ChatSuggestion[];
};

export type OptionalChatSuggestionsProperties = {
  disabled?: boolean;
  testId?: string;
  classes?: string;
};

export type ChatSuggestionsEventProperties = {
  onselect?: (value: string, index: number) => void;
};
