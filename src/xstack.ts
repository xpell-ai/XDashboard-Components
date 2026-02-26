import { XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XStackData extends XUIObjectData {
  _type: "stack";
  _direction?: "vertical" | "horizontal";
  _gap?: number;
  _align?: "start" | "center" | "end" | "stretch";
  _justify?: "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";
  _wrap?: boolean;
  _grow?: boolean;
  _class?: string;
}

type XStackDirection = "vertical" | "horizontal";

type XStackAlign = "start" | "center" | "end" | "stretch";

type XStackJustify = "start" | "center" | "end" | "space-between" | "space-around" | "space-evenly";

export class XStack extends XUIObject {
  static _xtype = "stack";

  private __direction: XStackDirection = "vertical";
  private __gap?: number;
  private __align: XStackAlign = "stretch";
  private __justify: XStackJustify = "start";
  private __wrap = false;
  private __grow = false;

  private static readonly managedStyles = new Set([
    "--xstack-gap",
    "align-items",
    "justify-content",
    "flex-wrap",
    "flex",
  ]);

  constructor(data: XStackData) {
    const defaults: any = {
      _type: XStack._xtype,
      class: "xstack",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.parse(data);
    this.applyLayout();
  }

  private normalizeDirection(value?: XStackDirection): XStackDirection {
    return value === "horizontal" ? "horizontal" : "vertical";
  }

  private normalizeAlign(value?: XStackAlign): XStackAlign {
    if (value === "start" || value === "center" || value === "end" || value === "stretch") {
      return value;
    }
    return "stretch";
  }

  private normalizeJustify(value?: XStackJustify): XStackJustify {
    if (
      value === "start" ||
      value === "center" ||
      value === "end" ||
      value === "space-between" ||
      value === "space-around" ||
      value === "space-evenly"
    ) {
      return value;
    }
    return "start";
  }

  private normalizeGap(value?: number): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return undefined;
  }

  private normalizeBoolean(value?: boolean): boolean {
    return value === true || value === ("true" as any);
  }

  private mapAlign(value: XStackAlign): string {
    if (value === "start") return "flex-start";
    if (value === "end") return "flex-end";
    if (value === "center") return "center";
    return "stretch";
  }

  private mapJustify(value: XStackJustify): string {
    if (value === "start") return "flex-start";
    if (value === "end") return "flex-end";
    if (value === "center") return "center";
    return value;
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
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
      if (XStack.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private buildClassName(direction: XStackDirection): string {
    const existing = String((this as any).class || "");
    const extra = String((this as any)._class || "");

    const filtered = this
      .splitClasses(existing)
      .filter((c) => c !== "xstack" && c !== "xstack--v" && c !== "xstack--h");

    const tokens = [
      "xstack",
      direction === "horizontal" ? "xstack--h" : "xstack--v",
      ...filtered,
      ...this.splitClasses(extra),
    ];

    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private applyLayout() {
    const direction = this.__direction || "vertical";
    const align = this.__align || "stretch";
    const justify = this.__justify || "start";

    const nextClass = this.buildClassName(direction);
    (this as any).class = nextClass;

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);

    if (typeof this.__gap === "number") {
      styleParts.push(`--xstack-gap:${this.__gap}px`);
    }

    styleParts.push(`align-items:${this.mapAlign(align)}`);
    styleParts.push(`justify-content:${this.mapJustify(justify)}`);

    if (this.__wrap) styleParts.push("flex-wrap:wrap");
    if (this.__grow) styleParts.push("flex:1 1 auto");

    const nextStyle = styleParts.join("; ");
    (this as any).style = nextStyle;
  }

  set _direction(value: XStackDirection | undefined) {
    this.__direction = this.normalizeDirection(value);
    this.applyLayout();
  }

  get _direction() {
    return this.__direction;
  }

  set _gap(value: number | undefined) {
    this.__gap = this.normalizeGap(value);
    this.applyLayout();
  }

  get _gap() {
    return this.__gap;
  }

  set _align(value: XStackAlign | undefined) {
    this.__align = this.normalizeAlign(value);
    this.applyLayout();
  }

  get _align() {
    return this.__align;
  }

  set _justify(value: XStackJustify | undefined) {
    this.__justify = this.normalizeJustify(value);
    this.applyLayout();
  }

  get _justify() {
    return this.__justify;
  }

  set _wrap(value: boolean | undefined) {
    this.__wrap = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _wrap() {
    return this.__wrap;
  }

  set _grow(value: boolean | undefined) {
    this.__grow = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _grow() {
    return this.__grow;
  }
}
