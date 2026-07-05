import type { JSONValue } from 'type-decoder';
import type { IconStackItem } from '../IconStack/properties';
import type {
  TableActionGroupCellData,
  TableAvatarStackCellData,
  TableButtonCellData,
  TableCompareCellData,
  TableInputCellData,
  TableLinkCellData,
  TableMenuItemData,
  TablePopupMenuCellData,
  TableSelectCellData,
  TableTagArrayCellItem,
  TableTagCellData,
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

export const asButtonCellData = (value: TableCellValue): TableButtonCellData | null => {
  const record = asJsonObject(value);
  if (record === null || typeof record.text !== 'string') {
    return null;
  }
  const buttonData: TableButtonCellData = { text: record.text };
  if (typeof record.disabled === 'boolean') {
    buttonData.disabled = record.disabled;
  }
  if (typeof record.classes === 'string') {
    buttonData.classes = record.classes;
  }
  if (typeof record.testId === 'string') {
    buttonData.testId = record.testId;
  }
  return buttonData;
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
