import { _xd, XUIObject } from "@xpell/ui";
import type { XObjectData } from "@xpell/ui";
import {
  normalizeDashboardImageSlot,
  type XDashboardImageSlotValue,
} from "./imageSlots";

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
};

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
