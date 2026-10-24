import type { FileInputProperties } from '../FileInput/properties';

/** Explicit native picker adoption; legacy FileInput keeps its required trigger. */
export type NativeFileInputProperties = Omit<
  FileInputProperties,
  'trigger' | 'native' | 'onerror' | 'activation'
> & {
  /** File validation error; avoids the HTMLElement.onerror event contract. */
  onfileerror?: FileInputProperties['onerror'];
};
