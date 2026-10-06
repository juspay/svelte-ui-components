/**
 * One upload demo's own result.
 *
 * The file demos shared a single `acceptedFiles`/`errorMessage` pair, so an upload into
 * one control reported its outcome beside a different one: the images-only control's
 * rejection appeared under the basic drop zone while the control a person had just used
 * showed nothing. Each demo creates its own feedback instead, and renders it directly
 * under the control that produced it.
 */
export type UploadFeedback = {
  readonly files: readonly File[];
  readonly error: string;
  readonly onfiles: (files: File[]) => void;
  readonly onerror: (message: string) => void;
};

export function createUploadFeedback(): UploadFeedback {
  let files = $state<File[]>([]);
  let error = $state('');
  let attemptOpen = false;

  // One selection can report both a rejection and an acceptance (a mixed drop), always in
  // that order and in one synchronous run. The first callback of a run starts a new attempt
  // and clears the last one; the second adds to it, so neither wipes the other.
  const beginAttempt = (): void => {
    if (attemptOpen) {
      return;
    }
    attemptOpen = true;
    files = [];
    error = '';
    queueMicrotask(() => {
      attemptOpen = false;
    });
  };

  return {
    get files() {
      return files;
    },
    get error() {
      return error;
    },
    onfiles: (accepted) => {
      beginAttempt();
      files = accepted;
    },
    onerror: (message) => {
      beginAttempt();
      error = message;
    }
  };
}
