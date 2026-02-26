import { XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XSpacerData extends XUIObjectData {
  _type?: "spacer";
  _size?: number;
  _direction?: "vertical" | "horizontal";
}

type XSpacerDirection = "vertical" | "horizontal";

export class XSpacer extends XUIObject {
  static _xtype = "spacer";

  private __size = 16;
  private __direction: XSpacerDirection = "vertical";

  private static readonly managedStyles = new Set(["width", "height", "min-width", "min-height"]);

  constructor(data: XSpacerData) {
    const defaults: any = {
      _type: XSpacer._xtype,
      class: "xspacer",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.parse(data);
    this.applyLayout();
  }

  private normalizeDirection(value?: XSpacerDirection): XSpacerDirection {
    return value === "horizontal" ? "horizontal" : "vertical";
  }

  private normalizeSize(value?: number): number {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
    return 16;
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
      if (XSpacer.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private applyLayout() {
    const size = this.__size;
    const direction = this.__direction;

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);

    if (direction === "horizontal") {
      styleParts.push(`width:${size}px`);
      styleParts.push(`min-width:${size}px`);
    } else {
      styleParts.push(`height:${size}px`);
      styleParts.push(`min-height:${size}px`);
    }

    const nextStyle = styleParts.join("; ");
    (this as any).style = nextStyle;
    if (this._dom_object) this._dom_object.setAttribute("style", nextStyle);
  }

  set _size(value: number | undefined) {
    this.__size = this.normalizeSize(value);
    this.applyLayout();
  }

  get _size() {
    return this.__size;
  }

  set _direction(value: XSpacerDirection | undefined) {
    this.__direction = this.normalizeDirection(value);
    this.applyLayout();
  }

  get _direction() {
    return this.__direction;
  }
}
