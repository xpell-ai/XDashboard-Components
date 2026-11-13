import { _xd, XUIObject } from "@xpell/ui";
import type { XObjectData } from "@xpell/ui";
import {
  normalizeDashboardImageSlot,
  type XDashboardImageSlotValue,
} from "./imageSlots";
import {
  buildDashboardRootClassName,
  splitDashboardClassNames,
  type XDashboardSemanticClassField,
} from "./xsemantic";

export type XCollectionRowsValue = any[] | string | undefined;

export type XCollectionItemMap = {
  _title?: any;
  _subtitle?: any;
  _image?: any;
  _image_alt?: any;
  _description?: any;
  _meta?: any;
  _badge?: any;
  _actions?: XObjectData[];
  _styles?: XCollectionTemplateStyles;
};

export type XCollectionValueFormat =
  | "text"
  | "number"
  | "date"
  | "time"
  | "datetime"
  | "relative-datetime";

export type XCollectionValueTemplate = {
  _field?: string;
  _value?: any;
  _format?: XCollectionValueFormat;
  _fallback?: any;
  _prefix?: string;
  _suffix?: string;
};

export type XCollectionTemplateStyle = {
  _style?: Record<string, string | number | null | undefined> | null;
};

export type XCollectionTemplateStyles = Record<
  string,
  XCollectionTemplateStyle | undefined
>;

function isCollectionStyleObject(
  value: unknown
): value is Record<string, string | number | null | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeCollectionBoolean(
  value: any,
  fallback = false
): boolean {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

export function normalizeCollectionNumber(value: any, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : fallback;
}

export function normalizeCollectionDataKey(value: any): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export const splitCollectionClassNames = splitDashboardClassNames;

export function buildCollectionRootClassName(
  baseClass: string,
  existingClass: string,
  source: Record<string, any>,
  fields: Array<"_variant" | "_density" | "_elevation">,
  extraClasses: string[] = []
): string {
  return buildDashboardRootClassName(
    baseClass,
    existingClass,
    source,
    fields as XDashboardSemanticClassField[],
    extraClasses
  );
}

export function readCollectionXDataValue(
  key?: string
): { hasValue: boolean; value: any } {
  if (!key || !_xd) return { hasValue: false, value: undefined };

  if (
    typeof (_xd as any).has === "function" &&
    typeof (_xd as any).get === "function" &&
    (_xd as any).has(key)
  ) {
    return { hasValue: true, value: (_xd as any).get(key) };
  }

  if (typeof (_xd as any).get === "function") {
    const value = (_xd as any).get(key);
    if (value !== undefined) return { hasValue: true, value };
  }

  return { hasValue: false, value: undefined };
}

export function normalizeCollectionRows(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  if (Array.isArray((value as any).records)) return (value as any).records;
  if (Array.isArray((value as any)._records)) return (value as any)._records;
  if (Array.isArray((value as any)._records?._data)) return (value as any)._records._data;
  if (Array.isArray((value as any).items)) return (value as any).items;
  if (Array.isArray((value as any)._items)) return (value as any)._items;
  if (Array.isArray((value as any).rows)) return (value as any).rows;
  if (Array.isArray((value as any)._rows)) return (value as any)._rows;
  if (Array.isArray((value as any).data)) return (value as any).data;
  if (Array.isArray((value as any)._data)) return (value as any)._data;

  return [];
}

export function resolveCollectionItems(items: XCollectionRowsValue): any[] {
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    const current = readCollectionXDataValue(items.trim());
    if (!current.hasValue) return [];
    return normalizeCollectionRows(current.value);
  }
  return [];
}

export function readCollectionRowPath(row: any, path: string): any {
  if (!path) return row;

  return path.split(".").reduce((current, key) => {
    if (current == null) return undefined;
    return current[key];
  }, row);
}

export function firstCollectionRowValue(row: any, paths: string[]): any {
  for (const path of paths) {
    const value = readCollectionRowPath(row, path);
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
}

export function resolveCollectionTemplateValue(
  value: string,
  row: any,
  rowIndex: number
): any {
  if (value === "$row_index") return rowIndex;
  if (value === "$row") return row;
  if (!value.startsWith("$row.")) return value;
  return readCollectionRowPath(row, value.slice("$row.".length));
}

function isCollectionValueTemplate(value: any): value is XCollectionValueTemplate {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (typeof value._type === "string" && value._type.trim()) return false;
  return (
    typeof value._field === "string" ||
    Object.prototype.hasOwnProperty.call(value, "_value") ||
    typeof value._format === "string"
  );
}

function parseCollectionDate(value: any): Date | undefined {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }
  if (typeof value !== "string" || !value.trim()) return undefined;
  const raw = value.trim();
  // Keep unzoned values local; timezone-bearing strings must use Date's parser.
  const localDateTime = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/u
  );
  if (localDateTime) {
    const date = new Date(
      Number(localDateTime[1]),
      Number(localDateTime[2]) - 1,
      Number(localDateTime[3]),
      localDateTime[4] ? Number(localDateTime[4]) : 0,
      localDateTime[5] ? Number(localDateTime[5]) : 0,
      localDateTime[6] ? Number(localDateTime[6]) : 0
    );
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function sameCollectionDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

function collectionDayLabel(date: Date): string {
  const today = new Date();
  if (sameCollectionDay(date, today)) return "Today";

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameCollectionDay(date, yesterday)) return "Yesterday";

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (sameCollectionDay(date, tomorrow)) return "Tomorrow";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export function formatCollectionValue(
  value: any,
  format?: XCollectionValueFormat | string
): string {
  if (value === undefined || value === null) return "";
  const normalizedFormat =
    typeof format === "string" ? format.trim().toLowerCase() : "";
  if (!normalizedFormat || normalizedFormat === "text") return collectionTextValue(value);

  if (normalizedFormat === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return collectionTextValue(value);
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2)));
  }

  if (
    normalizedFormat === "date" ||
    normalizedFormat === "time" ||
    normalizedFormat === "datetime" ||
    normalizedFormat === "relative-datetime"
  ) {
    const date = parseCollectionDate(value);
    if (!date) return collectionTextValue(value);
    if (normalizedFormat === "date") return collectionDayLabel(date);
    const time = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    if (normalizedFormat === "time") return time;
    return `${collectionDayLabel(date)}, ${time}`;
  }

  return collectionTextValue(value);
}

function resolveCollectionValueTemplate(
  value: XCollectionValueTemplate,
  row: any,
  rowIndex: number
): string {
  const rawValue = typeof value._field === "string"
    ? value._field.startsWith("$row") || value._field === "$row_index"
      ? resolveCollectionTemplateValue(value._field, row, rowIndex)
      : readCollectionRowPath(row, value._field)
    : Object.prototype.hasOwnProperty.call(value, "_value")
      ? resolveCollectionTemplates(value._value, row, rowIndex)
      : undefined;
  const fallback = rawValue === undefined || rawValue === null || rawValue === ""
    ? resolveCollectionTemplates(value._fallback, row, rowIndex)
    : rawValue;
  const text = formatCollectionValue(fallback, value._format);
  if (!text) return "";
  return `${value._prefix ?? ""}${text}${value._suffix ?? ""}`;
}

export function resolveCollectionTemplates(
  value: any,
  row: any,
  rowIndex: number
): any {
  if (typeof value === "string") {
    return resolveCollectionTemplateValue(value, row, rowIndex);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveCollectionTemplates(item, row, rowIndex));
  }

  if (!value || typeof value !== "object") return value;
  if (isCollectionValueTemplate(value)) {
    return resolveCollectionValueTemplate(value, row, rowIndex);
  }

  const next: Record<string, any> = {};
  Object.keys(value).forEach((key) => {
    next[key] = resolveCollectionTemplates(value[key], row, rowIndex);
  });
  return next;
}

export function resolveCollectionField(
  fieldValue: any,
  row: any,
  rowIndex: number,
  fallbackPaths: string[]
): any {
  const resolved = resolveCollectionTemplates(fieldValue, row, rowIndex);
  if (resolved !== undefined && resolved !== null && String(resolved).trim() !== "") {
    return resolved;
  }
  return firstCollectionRowValue(row, fallbackPaths);
}

export function collectionTextValue(value: any): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export function collectionRowKey(
  row: any,
  rowIndex: number,
  rowKey?: string
): string {
  if (rowKey && row && row[rowKey] != null) {
    return String(row[rowKey]);
  }
  return String(rowIndex);
}

export function safeCollectionIdSegment(value: string): string {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function cloneCollectionAction(action: XObjectData): XObjectData {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(action);
    } catch {
      // Persisted action objects should be JSON-compatible.
    }
  }
  return JSON.parse(JSON.stringify(action));
}

export function collectionTemplateSurfaceStyle(
  styles: XCollectionTemplateStyles | undefined,
  surface: string
): Record<string, string | number | null | undefined> | undefined {
  const style = styles?.[surface]?._style;
  if (!isCollectionStyleObject(style)) return undefined;
  const next = { ...style };
  return Object.keys(next).length ? next : undefined;
}

export function applyCollectionTemplateStyle<
  T extends XObjectData | XUIObject | undefined
>(
  value: T,
  styles: XCollectionTemplateStyles | undefined,
  surface: string
): T {
  if (!value) return value;

  const templateStyle = collectionTemplateSurfaceStyle(styles, surface);
  if (!templateStyle) return value;

  const existingStyle = isCollectionStyleObject((value as any)._style)
    ? { ...((value as any)._style as Record<string, string | number | null | undefined>) }
    : {};
  const mergedStyle = {
    ...templateStyle,
    ...existingStyle,
  };

  if (value instanceof XUIObject) {
    (value as any)._style = mergedStyle;
    return value;
  }

  return {
    ...(value as XObjectData),
    _style: mergedStyle,
  } as unknown as T;
}

export function buildCollectionActions(
  itemActions: XObjectData[] | undefined,
  fallbackActions: XObjectData[] | undefined,
  row: any,
  rowIndex: number,
  itemId: string
): XObjectData[] {
  const actions = Array.isArray(itemActions) ? itemActions : fallbackActions;

  if (!Array.isArray(actions)) return [];

  return actions.map((action, actionIndex) => {
    const cloned = resolveCollectionTemplates(
      cloneCollectionAction(action),
      row,
      rowIndex
    ) as XObjectData;

    (cloned as any)._row = row;
    (cloned as any)._row_index = rowIndex;
    (cloned as any)._context = {
      row,
      row_index: rowIndex,
    };

    if (!(cloned as any)._id) {
      (cloned as any)._id = `${itemId}_action_${actionIndex}`;
    }

    return cloned;
  });
}

export function buildCollectionBadge(
  value: any,
  row: any,
  rowIndex: number,
  itemId: string
): XObjectData | undefined {
  const resolved = resolveCollectionTemplates(value, row, rowIndex);
  if (resolved === undefined || resolved === null || resolved === "") return undefined;

  if (typeof resolved === "object") {
    return {
      _type: "badge",
      _id: `${itemId}_badge`,
      ...(resolved as Record<string, any>),
    } as XObjectData;
  }

  const text = collectionTextValue(resolved);
  if (!text) return undefined;

  return {
    _type: "badge",
    _id: `${itemId}_badge`,
    _text: text,
    _size: "sm",
    _pill: true,
  } as XObjectData;
}

export function buildCollectionImage(
  value: any,
  alt: string,
  itemId: string,
  className: string,
  slot = "_image"
): XObjectData | XUIObject | undefined {
  const image = normalizeDashboardImageSlot(value as XDashboardImageSlotValue, {
    parent_id: itemId,
    slot,
    class: className,
    alt,
  });

  if (!image) return undefined;
  if (!(image as any).class) (image as any).class = className;
  return image;
}
