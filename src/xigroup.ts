import { XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XInputGroupData extends XUIObjectData {
  _type: "igroup";
  _gap?: number;
  _align?: "start" | "center" | "end" | "stretch";
  _wrap?: boolean;
  _dense?: boolean;
  _merged?: boolean;
  class?: string;
}

type XInputGroupAlign = "start" | "center" | "end" | "stretch";

export class XInputGroup extends XUIObject {
  static _xtype = "igroup";

  private __gap = 8;
  private __align: XInputGroupAlign = "center";
  private __wrap = false;
  private __dense = false;
  private __merged = false;

  private static readonly managedStyles = new Set([
    "--xigroup-gap",
    "align-items",
    "flex-wrap",
    "display",
    "gap",
  ]);

  constructor(data: XInputGroupData) {
    const defaults: any = {
      _type: XInputGroup._xtype,
      class: "xigroup",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.parse(data);
    this.applyLayout();
  }

  private normalizeAlign(value?: XInputGroupAlign): XInputGroupAlign {
    if (value === "start" || value === "center" || value === "end" || value === "stretch") {
      return value;
    }
    return "center";
  }

  private normalizeGap(value?: number): number {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
    return 8;
  }

  private normalizeBoolean(value?: boolean): boolean {
    return value === true || value === ("true" as any);
  }

  private mapAlign(value: XInputGroupAlign): string {
    if (value === "start") return "flex-start";
    if (value === "end") return "flex-end";
    if (value === "center") return "center";
    return "stretch";
  }

  private stripManagedStyles(style: string): string {
    if (!style) return "";
    const parts = style
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);

    const kept: string[] = [];
    for (const part of parts) {
      const idx = part.indexOf(":");
      if (idx === -1) continue;
      const prop = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      if (!prop || !val) continue;
      if (XInputGroup.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private applyLayout() {
    this.addClass("xigroup");
    const allMods = ["xigroup--dense", "xigroup--merged"];
    const nextMods: string[] = [];
    if (this.__dense) nextMods.push("xigroup--dense");
    if (this.__merged) nextMods.push("xigroup--merged");
    this.replaceClass(allMods.join(" "), nextMods.join(" "));

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);
    styleParts.push("display:flex");
    styleParts.push(`gap:${this.__gap}px`);
    styleParts.push(`--xigroup-gap:${this.__gap}px`);
    styleParts.push(`align-items:${this.mapAlign(this.__align)}`);
    if (this.__wrap) styleParts.push("flex-wrap:wrap");

    const nextStyle = styleParts.join("; ");
    (this as any).style = nextStyle;
  }

  set _gap(value: number | undefined) {
    this.__gap = this.normalizeGap(value);
    this.applyLayout();
  }

  get _gap() {
    return this.__gap;
  }

  set _align(value: XInputGroupAlign | undefined) {
    this.__align = this.normalizeAlign(value);
    this.applyLayout();
  }

  get _align() {
    return this.__align;
  }

  set _wrap(value: boolean | undefined) {
    this.__wrap = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _wrap() {
    return this.__wrap;
  }

  set _dense(value: boolean | undefined) {
    this.__dense = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _dense() {
    return this.__dense;
  }

  set _merged(value: boolean | undefined) {
    this.__merged = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _merged() {
    return this.__merged;
  }
}
