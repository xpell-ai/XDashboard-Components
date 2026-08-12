import { XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export type XDashboardImageSlotValue =
  | string
  | XUIObject
  | XUIObjectData
  | null
  | undefined;

export type XDashboardImageSlotOptions = {
  parent_id: string;
  slot: string;
  class?: string;
  alt?: string;
};

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function childId(parent_id: string, slot: string): string {
  const normalizedSlot =
    slot
      .replace(/^_+/, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_") || "image";
  return `${parent_id}_${normalizedSlot}`;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeDashboardImageSlot(
  value: XDashboardImageSlotValue,
  options: XDashboardImageSlotOptions
): XUIObject | XUIObjectData | undefined {
  const id = childId(options.parent_id, options.slot);
  const alt = options.alt ?? "";

  if (value === null || value === undefined) return undefined;

  if (value instanceof XUIObject) return value;

  if (typeof value === "string") {
    const src = optionalText(value);
    if (!src) return undefined;
    return {
      _type: "image",
      _id: id,
      ...(options.class ? { class: options.class } : {}),
      src,
      alt,
    };
  }

  if (!isObject(value)) return undefined;

  const next: XUIObjectData = { ...(value as XUIObjectData) };
  if (!optionalText((next as any)._type)) (next as any)._type = "image";
  if (!optionalText((next as any)._id)) (next as any)._id = id;
  if (options.class && !optionalText((next as any).class)) (next as any).class = options.class;
  if ((next as any)._type === "image" && !optionalText((next as any).alt)) {
    (next as any).alt = alt;
  }

  return next;
}
