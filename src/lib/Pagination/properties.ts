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
};

export type PaginationEventProperties = {
  onchange?: (page: number) => void;
};
