import type { JSONValue } from 'type-decoder';
import type {
  AvatarColumnValue,
  ColumnDefinition,
  ColumnFilterValue,
  DataRow,
  NumberFormat,
  ProgressColumnValue,
  TagColumnValue,
  DataTableSortDirection
} from './properties';

/** Stable string id for a row, derived from its `idField`. */
export const rowIdOf = <T extends DataRow>(row: T, idField: keyof T & string): string =>
  String(row[idField]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTagColor = (value: unknown): value is NonNullable<TagColumnValue['color']> =>
  value === 'primary' ||
  value === 'success' ||
  value === 'warning' ||
  value === 'error' ||
  value === 'neutral';

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

export const decodeTagColumnValue = (value: JSONValue): TagColumnValue | null => {
  if (!isRecord(value) || typeof value.text !== 'string') {
    return null;
  }
  const color = isTagColor(value.color) ? value.color : undefined;
  return color ? { text: value.text, color } : { text: value.text };
};

export const decodeAvatarColumnValue = (value: JSONValue): AvatarColumnValue | null => {
  if (!isRecord(value) || typeof value.label !== 'string') {
    return null;
  }
  return {
    label: value.label,
    sublabel: optionalString(value.sublabel),
    imageUrl: optionalString(value.imageUrl)
  };
};

export const decodeProgressColumnValue = (value: JSONValue): ProgressColumnValue | null => {
  if (!isRecord(value) || typeof value.value !== 'number' || !Number.isFinite(value.value)) {
    return null;
  }
  return {
    value: value.value,
    max: typeof value.max === 'number' && Number.isFinite(value.max) ? value.max : undefined,
    showPercentage: typeof value.showPercentage === 'boolean' ? value.showPercentage : undefined
  };
};

/**
 * Comparable value for a cell.
 *
 * Resolution order:
 *  1. A column's `sortValueFormatter` always wins (fully custom sort logic).
 *  2. Otherwise a type-aware default is used so the object-valued column types
 *     (`tag`, `avatar`, `progress`) and `date` sort by something meaningful
 *     rather than `"[object Object]"` or a raw date string:
 *       - `date`     → epoch milliseconds
 *       - `tag`      → its `text`
 *       - `avatar`   → its `label`
 *       - `progress` → its numeric `value`
 *       - `number`   → coerced to a number
 *  3. Primitives fall through unchanged.
 */
const sortValue = <T extends DataRow>(
  column: ColumnDefinition<T>,
  row: T
): string | number | boolean | null => {
  const raw = row[column.field];
  if (column.sortValueFormatter) {
    return column.sortValueFormatter(raw, row);
  }
  if (raw === null || raw === undefined) {
    return null;
  }

  switch (column.type) {
    case 'date': {
      const date = raw instanceof Date ? raw : new Date(String(raw));
      return Number.isNaN(date.getTime()) ? String(raw) : date.getTime();
    }
    case 'tag':
      return decodeTagColumnValue(raw)?.text ?? String(raw);
    case 'avatar':
      return decodeAvatarColumnValue(raw)?.label ?? String(raw);
    case 'progress': {
      const decoded = decodeProgressColumnValue(raw);
      const value = decoded ? decoded.value : Number(raw);
      return Number.isNaN(value) ? null : value;
    }
    case 'number': {
      const num = typeof raw === 'number' ? raw : Number(raw);
      return Number.isNaN(num) ? null : num;
    }
    default:
      break;
  }

  if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'string') {
    return raw;
  }
  return String(raw);
};

/**
 * Client-side sort. Returns a new array; `none`/missing column → original order.
 * Nulls always sort last regardless of direction.
 */
export const applySort = <T extends DataRow>(
  data: T[],
  columns: ColumnDefinition<T>[],
  field: string | null,
  direction: DataTableSortDirection
): T[] => {
  if (!field || direction === 'none') {
    return data;
  }
  const column = columns.find((c) => c.field === field);
  if (!column) {
    return data;
  }
  const dir = direction === 'asc' ? 1 : -1;
  return [...data].sort((rowA, rowB) => {
    const a = sortValue(column, rowA);
    const b = sortValue(column, rowB);
    // Nulls always sort last, independent of direction.
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    if (typeof a === 'number' && typeof b === 'number') {
      return (a - b) * dir;
    }
    if (typeof a === 'boolean' && typeof b === 'boolean') {
      return (a === b ? 0 : a ? -1 : 1) * dir;
    }
    return String(a).localeCompare(String(b)) * dir;
  });
};

/**
 * Type-aware searchable text for a cell. Object-backed column types
 * (`tag`/`avatar`/`progress`) match on their visible text rather than
 * stringifying to `"[object Object]"`; primitives fall through unchanged.
 */
const searchableText = <T extends DataRow>(
  column: ColumnDefinition<T> | null,
  raw: JSONValue
): string => {
  if (raw == null) {
    return '';
  }
  const asObject = isRecord(raw);
  switch (column?.type) {
    case 'tag':
      return decodeTagColumnValue(raw)?.text ?? String(raw);
    case 'avatar': {
      const decoded = decodeAvatarColumnValue(raw);
      return decoded ? `${decoded.label} ${decoded.sublabel ?? ''}`.trim() : String(raw);
    }
    case 'progress':
      return String(decodeProgressColumnValue(raw)?.value ?? raw);
    default:
      break;
  }
  // Unknown object-valued columns (e.g. custom): serialise so they remain
  // searchable instead of collapsing to "[object Object]".
  if (asObject) {
    return JSON.stringify(raw);
  }
  return String(raw);
};

/** Whether a single row matches a free-text query across the given fields. */
const matchesSearch = <T extends DataRow>(
  row: T,
  query: string,
  fields: (keyof T & string)[],
  columnByField: Map<string, ColumnDefinition<T>>
): boolean => {
  const term = query.trim().toLowerCase();
  if (term === '') {
    return true;
  }
  return fields.some((field) =>
    searchableText(columnByField.get(field) ?? null, row[field])
      .toLowerCase()
      .includes(term)
  );
};

export const applySearch = <T extends DataRow>(
  data: T[],
  query: string,
  fields: (keyof T & string)[],
  columns: ColumnDefinition<T>[] = []
): T[] => {
  if (query.trim() === '') {
    return data;
  }
  const columnByField = new Map(columns.map((c) => [c.field, c]));
  return data.filter((row) => matchesSearch(row, query, fields, columnByField));
};

/** Whether a row passes a single column filter. */
const passesFilter = <T extends DataRow>(row: T, filter: ColumnFilterValue): boolean => {
  const raw = row[filter.field];

  if (filter.type === 'text') {
    const term = String(filter.value ?? '')
      .trim()
      .toLowerCase();
    if (term === '') return true;
    return raw !== null && raw !== undefined && String(raw).toLowerCase().includes(term);
  }

  if (filter.type === 'select') {
    const wanted = String(filter.value ?? '');
    if (wanted === '') return true;
    return String(raw) === wanted;
  }

  if (filter.type === 'multiselect') {
    const wanted = Array.isArray(filter.value) ? filter.value : [];
    if (wanted.length === 0) return true;
    return wanted.includes(String(raw));
  }

  if (filter.type === 'number') {
    const bounds =
      typeof filter.value === 'object' && filter.value !== null && !Array.isArray(filter.value)
        ? filter.value
        : { min: null, max: null };
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isNaN(num)) return false;
    if (bounds.min !== null && num < bounds.min) return false;
    if (bounds.max !== null && num > bounds.max) return false;
    return true;
  }

  return true;
};

/** True when a filter carries no active constraint (so it can be ignored). */
export const isFilterEmpty = (filter: ColumnFilterValue): boolean => {
  if (filter.type === 'multiselect') {
    return !Array.isArray(filter.value) || filter.value.length === 0;
  }
  if (filter.type === 'number') {
    const v = filter.value as { min: number | null; max: number | null };
    return !v || (v.min === null && v.max === null);
  }
  return String(filter.value ?? '').trim() === '';
};

export const applyFilters = <T extends DataRow>(data: T[], filters: ColumnFilterValue[]): T[] => {
  const active = filters.filter((f) => !isFilterEmpty(f));
  if (active.length === 0) {
    return data;
  }
  return data.filter((row) => active.every((filter) => passesFilter(row, filter)));
};

/** Slice the current page out of the full set (client-side pagination). */
export const paginate = <T>(data: T[], page: number, pageSize: number): T[] => {
  if (pageSize <= 0) {
    return data;
  }
  const start = (page - 1) * pageSize;
  return data.slice(start, start + pageSize);
};

export const totalPagesOf = (totalRows: number, pageSize: number): number =>
  pageSize > 0 ? Math.max(1, Math.ceil(totalRows / pageSize)) : 1;

/** Format a numeric value per a column's `format`/`precision`. */
export const formatNumber = (
  value: number,
  format: NumberFormat | undefined,
  precision: number | undefined
): string => {
  if (Number.isNaN(value)) {
    return '';
  }
  switch (format) {
    case 'currency':
      return value.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: precision ?? 2,
        maximumFractionDigits: precision ?? 2
      });
    case 'percentage':
      return `${value.toFixed(precision ?? 0)}%`;
    case 'decimal':
      return value.toFixed(precision ?? 2);
    case 'integer':
      return Math.round(value).toString();
    default:
      return String(value);
  }
};

/**
 * Resolve a cell's display string for the built-in text/number/date renderers.
 * Non-primitive/tagged column types are rendered by the component, not here.
 */
export const displayValue = <T extends DataRow>(
  column: ColumnDefinition<T>,
  row: T,
  index: number
): string => {
  const raw = row[column.field];
  if (column.formatValue) {
    return column.formatValue(raw, row, index);
  }
  if (raw === null || raw === undefined) {
    return '';
  }
  if (column.type === 'number' && (typeof raw === 'number' || !Number.isNaN(Number(raw)))) {
    return formatNumber(Number(raw), column.format, column.precision);
  }
  if (column.type === 'date') {
    const date = raw instanceof Date ? raw : new Date(String(raw));
    return Number.isNaN(date.getTime()) ? String(raw) : date.toLocaleDateString();
  }
  return String(raw);
};

/** Next direction in the asc → desc → none cycle. */
export const nextSortDirection = (current: DataTableSortDirection): DataTableSortDirection =>
  current === 'none' ? 'asc' : current === 'asc' ? 'desc' : 'none';

export const coerceCellValue = (raw: string, previous: JSONValue): JSONValue => {
  if (typeof previous === 'number') {
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  }
  if (typeof previous === 'boolean') {
    return raw === 'true';
  }
  return raw;
};
