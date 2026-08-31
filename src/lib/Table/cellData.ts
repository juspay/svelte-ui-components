import type { JSONValue } from 'type-decoder';
import type { InputDataType } from '$lib/types';
import type { IconStackItem } from '../IconStack/properties';
import type {
  TableActionGroupCellData,
  TableAvatarStackCellData,
  TableButtonCellCommonData,
  TableButtonCellData,
  TableCompareCellData,
  TableInputCellData,
  TableLinkCellData,
  TableMenuItemData,
  TablePopupMenuCellData,
  TableSelectCellData,
  TableTagArrayCellItem,
  TableTagCellData,
  TableTextButtonCellData,
  TableCellValue
} from './properties';

/**
 * Structural narrowing helpers for the built-in cell renderers. Each renderer
 * accepts an arbitrary `TableCellValue` and renders its structured shape only
 * when the value actually matches — scalar values fall back to plain text, so
 * mixed columns (e.g. compare rows next to plain rows) are well-defined.
 * Shapes are rebuilt field by field from the raw JSON rather than asserted.
 */

export const asJsonObject = (value: TableCellValue): { [key: string]: JSONValue } | null => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  return null;
};

/**
 * Accepts an icon URL only when its scheme is safe to place in an `<img src>`
 * — http(s), a `data:image/*` payload, or a scheme-less (relative) path. Cell
 * data is consumer-supplied JSON, so `javascript:`/`vbscript:`/non-image
 * `data:` URIs must never reach the DOM.
 */
export const asSafeIconUrl = (value: TableCellValue): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  const candidate = value.trim();
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(candidate);
  if (schemeMatch === null) {
    return candidate;
  }
  const scheme = schemeMatch[1].toLowerCase();
  if (scheme === 'http' || scheme === 'https') {
    return candidate;
  }
  // Image data URIs only, from an explicit subtype allowlist — a data: URI
  // continues with ';' (parameters like base64) or ',' (payload).
  if (scheme === 'data' && /^data:image\/(svg\+xml|png|jpeg|jpg|gif|webp)[;,]/i.test(candidate)) {
    return candidate;
  }
  return null;
};

export const asTagCellData = (value: TableCellValue): TableTagCellData | null => {
  const record = asJsonObject(value);
  if (record === null || typeof record.text !== 'string') {
    return null;
  }
  const tagData: TableTagCellData = { text: record.text };
  if (typeof record.classes === 'string') {
    tagData.classes = record.classes;
  }
  if (typeof record.dismissible === 'boolean') {
    tagData.dismissible = record.dismissible;
  }
  if (typeof record.testId === 'string') {
    tagData.testId = record.testId;
  }
  return tagData;
};

export const asTagArrayItems = (value: TableCellValue): TableTagArrayCellItem[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }
  const items: TableTagArrayCellItem[] = [];
  for (const rawItem of value) {
    const record = asJsonObject(rawItem);
    if (record === null || typeof record.text !== 'string') {
      return null;
    }
    const item: TableTagArrayCellItem = { text: record.text };
    if (typeof record.classes === 'string') {
      item.classes = record.classes;
    }
    if (typeof record.testId === 'string') {
      item.testId = record.testId;
    }
    items.push(item);
  }
  return items;
};

export const asAvatarStackData = (value: TableCellValue): TableAvatarStackCellData | null => {
  const record = asJsonObject(value);
  if (record === null || !Array.isArray(record.items)) {
    return null;
  }
  const items: Array<{ id: string; label?: string }> = [];
  for (const rawItem of record.items) {
    const itemRecord = asJsonObject(rawItem);
    if (itemRecord === null || typeof itemRecord.id !== 'string') {
      return null;
    }
    const item: { id: string; label?: string } = { id: itemRecord.id };
    if (typeof itemRecord.label === 'string') {
      item.label = itemRecord.label;
    }
    items.push(item);
  }
  const stackData: TableAvatarStackCellData = { items };
  if (typeof record.max === 'number') {
    stackData.max = record.max;
  }
  return stackData;
};

export const asCompareCellData = (value: TableCellValue): TableCompareCellData | null => {
  const record = asJsonObject(value);
  if (record === null) {
    return null;
  }
  const compareData: TableCompareCellData = {};
  if (typeof record.primary === 'string') {
    compareData.primary = record.primary;
  }
  if (typeof record.comparison === 'string') {
    compareData.comparison = record.comparison;
  }
  if (typeof record.trendPercent === 'number') {
    compareData.trendPercent = record.trendPercent;
  }
  if (typeof record.trendLabel === 'string') {
    compareData.trendLabel = record.trendLabel;
  }
  return compareData;
};

export const asLinkCellData = (value: TableCellValue): TableLinkCellData | null => {
  if (typeof value === 'string' && value.length > 0) {
    return { url: value };
  }
  const record = asJsonObject(value);
  if (record === null || typeof record.url !== 'string') {
    return null;
  }
  const linkData: TableLinkCellData = { url: record.url };
  if (typeof record.label === 'string') {
    linkData.label = record.label;
  }
  if (typeof record.copyable === 'boolean') {
    linkData.copyable = record.copyable;
  }
  return linkData;
};

export const asSelectCellData = (value: TableCellValue): TableSelectCellData | null => {
  const record = asJsonObject(value);
  if (record === null || !Array.isArray(record.options)) {
    return null;
  }
  const options: Array<{ id: string; label: string }> = [];
  for (const rawOption of record.options) {
    const optionRecord = asJsonObject(rawOption);
    if (
      optionRecord === null ||
      typeof optionRecord.id !== 'string' ||
      typeof optionRecord.label !== 'string'
    ) {
      return null;
    }
    options.push({ id: optionRecord.id, label: optionRecord.label });
  }
  const selectData: TableSelectCellData = { options };
  if (typeof record.selectedId === 'string') {
    selectData.selectedId = record.selectedId;
  }
  if (typeof record.placeholder === 'string') {
    selectData.placeholder = record.placeholder;
  }
  if (typeof record.disabled === 'boolean') {
    selectData.disabled = record.disabled;
  }
  if (typeof record.testId === 'string') {
    selectData.testId = record.testId;
  }
  if (typeof record.itemTestId === 'string') {
    selectData.itemTestId = record.itemTestId;
  }
  return selectData;
};

export const asInputCellData = (value: TableCellValue): TableInputCellData | null => {
  const record = asJsonObject(value);
  if (record === null) {
    return null;
  }
  const inputData: TableInputCellData = {};
  if (typeof record.value === 'string') {
    inputData.value = record.value;
  }
  if (typeof record.placeholder === 'string') {
    inputData.placeholder = record.placeholder;
  }
  if (typeof record.disabled === 'boolean') {
    inputData.disabled = record.disabled;
  }
  if (typeof record.testId === 'string') {
    inputData.testId = record.testId;
  }
  if (typeof record.ariaLabel === 'string') {
    inputData.ariaLabel = record.ariaLabel;
  }
  const inputIconUrl = asSafeIconUrl(record.iconUrl ?? null);
  if (inputIconUrl !== null) {
    inputData.iconUrl = inputIconUrl;
  }
  if (typeof record.dataType === 'string') {
    inputData.dataType = record.dataType;
  }
  if (typeof record.validationPattern === 'string') {
    inputData.validationPattern = record.validationPattern;
  }
  if (typeof record.onErrorMessage === 'string') {
    inputData.onErrorMessage = record.onErrorMessage;
  }
  return inputData;
};

/**
 * Narrows a free-form `dataType` string from cell data to the `Input`
 * component's `InputDataType` union, falling back to `'text'` for any
 * unrecognised value.
 */
export const asInputDataType = (value: string | null): InputDataType => {
  switch (value) {
    case 'tel':
    case 'password':
    case 'email':
    case 'number':
      return value;
    default:
      return 'text';
  }
};

export const asButtonCellData = (value: TableCellValue): TableButtonCellData | null => {
  const record = asJsonObject(value);
  if (record === null) {
    return null;
  }
  const buttonIconUrl = asSafeIconUrl(record.iconUrl ?? null);
  const buttonAriaLabel = typeof record.ariaLabel === 'string' ? record.ariaLabel : null;
  const common: TableButtonCellCommonData = {};
  if (typeof record.disabled === 'boolean') {
    common.disabled = record.disabled;
  }
  if (typeof record.classes === 'string') {
    common.classes = record.classes;
  }
  if (typeof record.testId === 'string') {
    common.testId = record.testId;
  }
  if (typeof record.text === 'string') {
    const textButton: TableTextButtonCellData = { text: record.text, ...common };
    if (buttonIconUrl !== null) {
      textButton.iconUrl = buttonIconUrl;
    }
    if (buttonAriaLabel !== null) {
      textButton.ariaLabel = buttonAriaLabel;
    }
    return textButton;
  }
  // Icon-only buttons require BOTH a safe icon and an accessible name — a
  // button with no visible text and no aria-label is a WCAG 4.1.2 failure,
  // so such data fails narrowing and the cell falls back to plain text.
  if (buttonIconUrl !== null && buttonAriaLabel !== null) {
    return { iconUrl: buttonIconUrl, ariaLabel: buttonAriaLabel, ...common };
  }
  return null;
};

const asMenuItemsData = (rawItems: JSONValue): TableMenuItemData[] | null => {
  if (!Array.isArray(rawItems)) {
    return null;
  }
  const menuItems: TableMenuItemData[] = [];
  for (const rawItem of rawItems) {
    const record = asJsonObject(rawItem);
    if (record === null || typeof record.id !== 'string') {
      return null;
    }
    const item: TableMenuItemData = { id: record.id };
    if (typeof record.label === 'string') {
      item.label = record.label;
    }
    if (typeof record.danger === 'boolean') {
      item.danger = record.danger;
    }
    if (typeof record.separator === 'boolean') {
      item.separator = record.separator;
    }
    menuItems.push(item);
  }
  return menuItems;
};

export const asActionGroupCellData = (value: TableCellValue): TableActionGroupCellData | null => {
  const record = asJsonObject(value);
  if (record === null) {
    return null;
  }
  const primaryButton = asButtonCellData(record.primaryButton ?? null);
  const menuItems = asMenuItemsData(record.menuItems ?? null);
  if (primaryButton === null && menuItems === null) {
    return null;
  }
  const actionData: TableActionGroupCellData = {};
  if (primaryButton !== null) {
    actionData.primaryButton = primaryButton;
  }
  if (menuItems !== null) {
    actionData.menuItems = menuItems;
  }
  return actionData;
};

export const asPopupMenuCellData = (value: TableCellValue): TablePopupMenuCellData | null => {
  const record = asJsonObject(value);
  if (record === null) {
    return null;
  }
  const items = asMenuItemsData(record.items ?? null);
  if (items === null || items.length === 0) {
    return null;
  }
  const popupData: TablePopupMenuCellData = { items };
  if (typeof record.ariaLabel === 'string') {
    popupData.ariaLabel = record.ariaLabel;
  }
  return popupData;
};

/** Fallback text rendering for a cell value that failed structural narrowing. */
export const cellValueToText = (value: TableCellValue): string => {
  if (value === null || typeof value === 'undefined' || value === '') {
    return '-';
  }
  if (typeof value === 'object') {
    return '-';
  }
  return String(value);
};

/**
 * First display character for an avatar chip. Falls back to the last
 * alphanumeric character of the id when the label is missing, so each chip
 * renders a distinct character instead of a row of identical placeholders.
 * Indexes by codepoint, not UTF-16 unit, so a non-BMP first character (emoji)
 * renders whole instead of as half a surrogate pair.
 */
export const avatarInitial = (item: { id: string; label?: string }): string => {
  if (item.label && Array.from(item.label).length > 0) {
    return Array.from(item.label)[0].toUpperCase();
  }
  const tail = item.id.replace(/[^A-Za-z0-9]/g, '').slice(-1);
  return tail.toUpperCase() || '#';
};

/** Visible initials chips plus the "+N" overflow count for an avatar stack. */
export const buildAvatarStack = (
  data: TableAvatarStackCellData
): { icons: IconStackItem[]; rest: number } => {
  const max = data.max ?? 4;
  const items = data.items ?? [];
  const visible = items.slice(0, max);
  return {
    icons: visible.map((item): IconStackItem => ({ type: 'text', content: avatarInitial(item) })),
    rest: items.length - visible.length
  };
};
