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
  /** When provided, renders a "Showing X–Y of Z items" summary. */
  totalItems?: number | null;
  /** Current page size (number of rows per page). Required for the summary computation. */
  pageSize?: number | null;
  /** When provided, renders a page-size selector with these options. */
  pageSizes?: number[] | null;
  /**
   * Cursor-mode hint: when true the next button is enabled even if
   * currentPage >= totalPages (i.e. total pages is unknown).
   */
  hasMore?: boolean;
  /** data-pw attribute for the previous-page control. */
  prevButtonTestId?: string | null;
  /** data-pw attribute for the next-page control. */
  nextButtonTestId?: string | null;
  /** Label noun used in the summary (default: 'items'). */
  selectedItemLabel?: string;
};

export type PaginationEventProperties = {
  onchange?: (page: number) => void;
  /** Fired when the user selects a new page size from the selector. */
  onPageSizeChange?: (size: number) => void;
};
