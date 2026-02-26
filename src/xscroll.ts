import { XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XScrollData extends XUIObjectData {
  _type: "scroll";
  _direction?: "vertical" | "horizontal" | "both";
  _grow?: boolean;
  _hide_scrollbar?: boolean;
  _max_height?: string;
  _max_width?: string;
}

type XScrollDirection = "vertical" | "horizontal" | "both";

export class XScroll extends XUIObject {
  static _xtype = "scroll";

  private __direction: XScrollDirection = "vertical";
  private __grow = false;
  private __hide_scrollbar = false;
  private __max_height?: string;
  private __max_width?: string;

  private static readonly managedStyles = new Set([
    "overflow",
    "overflow-x",
    "overflow-y",
    "min-height",
    "min-width",
    "flex",
    "max-height",
    "max-width",
  ]);

  constructor(data: XScrollData) {
    const defaults: any = {
      _type: XScroll._xtype,
      class: "xscroll",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.parse(data);
    this.applyLayout();
  }

  private normalizeDirection(value?: XScrollDirection): XScrollDirection {
    if (value === "horizontal" || value === "both") return value;
    return "vertical";
  }

  private normalizeBoolean(value?: boolean): boolean {
    return value === true || value === ("true" as any);
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
      if (XScroll.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private buildClassName(direction: XScrollDirection, hideScrollbar: boolean): string {
    const existing = String((this as any).class || "");
    const filtered = this
      .splitClasses(existing)
      .filter(
        (c) =>
          c !== "xscroll" &&
          c !== "xscroll--hide" &&
          c !== "xscroll--v" &&
          c !== "xscroll--h" &&
          c !== "xscroll--both"
      );

    const tokens = ["xscroll", ...filtered];
    if (direction === "horizontal") tokens.push("xscroll--h");
    else if (direction === "both") tokens.push("xscroll--both");
    else tokens.push("xscroll--v");
    if (hideScrollbar) tokens.push("xscroll--hide");

    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private applyLayout() {
    const direction = this.__direction || "vertical";

    const nextClass = this.buildClassName(direction, this.__hide_scrollbar);
    (this as any).class = nextClass;

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);

    styleParts.push("min-height:0");
    styleParts.push("min-width:0");

    if (direction === "horizontal") {
      styleParts.push("overflow-x:auto");
      styleParts.push("overflow-y:hidden");
    } else if (direction === "both") {
      styleParts.push("overflow:auto");
    } else {
      styleParts.push("overflow-y:auto");
      styleParts.push("overflow-x:hidden");
    }

    if (this.__grow) styleParts.push("flex:1 1 auto");
    if (this.__max_height) styleParts.push(`max-height:${this.__max_height}`);
    if (this.__max_width) styleParts.push(`max-width:${this.__max_width}`);

    const nextStyle = styleParts.join("; ");
    (this as any).style = nextStyle;
  }

  set _direction(value: XScrollDirection | undefined) {
    this.__direction = this.normalizeDirection(value);
    this.applyLayout();
  }

  get _direction() {
    return this.__direction;
  }

  set _grow(value: boolean | undefined) {
    this.__grow = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _grow() {
    return this.__grow;
  }

  set _hide_scrollbar(value: boolean | undefined) {
    this.__hide_scrollbar = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _hide_scrollbar() {
    return this.__hide_scrollbar;
  }

  set _max_height(value: string | undefined) {
    this.__max_height = value;
    this.applyLayout();
  }

  get _max_height() {
    return this.__max_height;
  }

  set _max_width(value: string | undefined) {
    this.__max_width = value;
    this.applyLayout();
  }

  get _max_width() {
    return this.__max_width;
  }
}
