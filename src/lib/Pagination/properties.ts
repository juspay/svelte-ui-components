export type PaginationProperties = MandatoryPaginationProperties &
  OptionalPaginationProperties &
  PaginationEventProperties;

export type MandatoryPaginationProperties = {
  totalPages: number;
};

export type OptionalPaginationProperties = {
  currentPage?: number;
  siblingCount?: number;
  disabled?: boolean;
  testId?: string;
  classes?: string;
  /**
   * Cursor-pagination hint. When `true`, the next button stays enabled even
   * when `currentPage >= totalPages` — use this when the total page count is
   * not known ahead of time (e.g. cursor-based APIs). `totalPages` takes
   * precedence when both are provided: the next button is enabled only if
   * `hasMore` is `true` OR `currentPage < totalPages`. In cursor mode the
   * next-button becomes a load-more CTA on the last known page (see onLoadMore).
   */
  hasMore?: boolean;
  /** `data-pw` test-id for the previous-page button. */
  prevButtonTestId?: string;
  /** `data-pw` test-id for the next-page button. */
  nextButtonTestId?: string;
};

export type PaginationEventProperties = {
  onchange?: (page: number) => void;
  /** Fired when the load-more CTA is clicked (cursor mode). */
  onLoadMore?: () => void;
};
