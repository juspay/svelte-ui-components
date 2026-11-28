/** Share an in-flight import and let later consumers retry after a rejection. */
export function cacheSuccessfulLoad<T>(load: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | null = null;
  return () => {
    cached ??= load().catch((error: unknown) => {
      cached = null;
      throw error;
    });
    return cached;
  };
}

export const loadMarkdownRenderer = cacheSuccessfulLoad(() => import('./markdown'));
export const loadEscapedMarkdownRenderer = cacheSuccessfulLoad(() => import('./render'));
