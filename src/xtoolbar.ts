import { XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XToolbarData extends XUIObjectData {
  _type?: "toolbar";
  _gap?: number;
  _align?: "start" | "center" | "end" | "stretch";
  _justify?: "start" | "center" | "end" | "space-between";
  _wrap?: boolean;
  _sticky?: boolean;
  _top?: number;
  _elevated?: boolean;
}

type XToolbarAlign = "start" | "center" | "end" | "stretch";
type XToolbarJustify = "start" | "center" | "end" | "space-between";

export class XToolbar extends XUIObject {
  static _xtype = "toolbar";

  private __gap = 8;
  private __align: XToolbarAlign = "center";
  private __justify: XToolbarJustify = "start";
  private __wrap = false;
  private __sticky = false;
  private __top = 0;
  private __elevated = false;

  private static readonly managedStyles = new Set([
    "--xtoolbar-gap",
    "align-items",
    "justify-content",
    "flex-wrap",
    "position",
    "top",
    "z-index",
  ]);

  constructor(data: XToolbarData) {
    const defaults: any = {
      _type: XToolbar._xtype,
      class: "xtoolbar",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.parse(data);
    this.applyLayout();
  }

  private normalizeAlign(value?: XToolbarAlign): XToolbarAlign {
    if (value === "start" || value === "center" || value === "end" || value === "stretch") {
      return value;
    }
    return "center";
    
  }

  private normalizeJustify(value?: XToolbarJustify): XToolbarJustify {
    if (value === "start" || value === "center" || value === "end" || value === "space-between") {
      return value;
    }
    return "start";
  }

  private normalizeGap(value?: number): number {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
    return 8;
  }

  private normalizeBoolean(value?: boolean): boolean {
    return value === true || value === ("true" as any);
  }

  private mapAlign(value: XToolbarAlign): string {
    if (value === "start") return "flex-start";
    if (value === "end") return "flex-end";
    if (value === "center") return "center";
    return "stretch";
  }

  private mapJustify(value: XToolbarJustify): string {
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
      if (XToolbar.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private buildClassName(elevated: boolean): string {
    const existing = String((this as any).class || "");
    const filtered = this
      .splitClasses(existing)
      .filter((c) => c !== "xtoolbar" && c !== "xtoolbar--elevated");

    const tokens = ["xtoolbar", ...filtered];
    if (elevated) tokens.push("xtoolbar--elevated");

    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private applyLayout() {
    const nextClass = this.buildClassName(this.__elevated);
    (this as any).class = nextClass;

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);

    styleParts.push(`--xtoolbar-gap:${this.__gap}px`);
    styleParts.push(`align-items:${this.mapAlign(this.__align)}`);
    styleParts.push(`justify-content:${this.mapJustify(this.__justify)}`);

    if (this.__wrap) styleParts.push("flex-wrap:wrap");
    if (this.__sticky) {
      styleParts.push("position:sticky");
      styleParts.push(`top:${this.__top}px`);
      styleParts.push("z-index:10");
    }

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

  set _align(value: XToolbarAlign | undefined) {
    this.__align = this.normalizeAlign(value);
    this.applyLayout();
  }

  get _align() {
    return this.__align;
  }

  set _justify(value: XToolbarJustify | undefined) {
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

  set _sticky(value: boolean | undefined) {
    this.__sticky = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _sticky() {
    return this.__sticky;
  }

  set _top(value: number | undefined) {
    this.__top = typeof value === "number" && Number.isFinite(value) ? value : 0;
    this.applyLayout();
  }

  get _top() {
    return this.__top;
  }

  set _elevated(value: boolean | undefined) {
    this.__elevated = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _elevated() {
    return this.__elevated;
  }
}
