import { getContext, hasContext, setContext } from 'svelte';

/**
 * What a `FileInput` tells the content rendered inside its `trigger` snippet.
 *
 * A drop region is one control. By default the region itself is that control
 * (`role="button"`, one Tab stop, Enter/Space/click open the chooser), so
 * anything interactive placed inside it is a second control for the same
 * action. `FileDropzoneTrigger` reads this to render as plain content when the
 * region owns activation, instead of nesting a native `<button>` in it.
 *
 * A getter, not a copied boolean, so a consumer flipping `activation` on a live
 * region is seen by content that is already mounted.
 */
export type FileInputOwner = {
  readonly regionOwnsActivation: boolean;
};

/** Exported only so a test can stand in for the region without mounting a full `FileInput`. */
export const FILE_INPUT_OWNER = Symbol('sui-file-input-owner');

export const provideFileInputOwner = (owner: FileInputOwner): void => {
  setContext(FILE_INPUT_OWNER, owner);
};

/** Null outside a `FileInput`, where nothing owns the action but the caller. */
export const useFileInputOwner = (): FileInputOwner | null =>
  hasContext(FILE_INPUT_OWNER) ? getContext<FileInputOwner>(FILE_INPUT_OWNER) : null;
