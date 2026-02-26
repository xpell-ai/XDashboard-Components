import { XUIObject } from "@xpell/ui";
import type { XUIObjectData } from "@xpell/ui";

export interface XDividerData extends XUIObjectData {
  _type: "divider";
  _orientation?: "horizontal" | "vertical";
  _thickness?: number;
  _length?: string;
  _inset?: number;
  _muted?: boolean;
}

type XDividerOrientation = "horizontal" | "vertical";

export class XDivider extends XUIObject {
  static _xtype = "divider";

  private __orientation: XDividerOrientation = "horizontal";
  private __thickness = 1;
  private __length?: string;
  private __inset?: number;
  private __muted = false;

  private static readonly managedStyles = new Set([
    "--xdivider-thickness",
    "--xdivider-length",
    "--xdivider-inset",
  ]);

  constructor(data: XDividerData) {
    const defaults: any = {
      _type: XDivider._xtype,
      class: "xdivider",
      _html_tag: "div",
    };

    super(data, defaults, true);
    this.parse(data);
    this.applyLayout();
  }

  private normalizeOrientation(value?: XDividerOrientation): XDividerOrientation {
    return value === "vertical" ? "vertical" : "horizontal";
  }

  private normalizeThickness(value?: number): number {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
    return 1;
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
      if (XDivider.managedStyles.has(prop)) continue;
      kept.push(`${prop}:${val}`);
    }

    return kept.join("; ");
  }

  private buildClassName(orientation: XDividerOrientation, muted: boolean): string {
    const existing = String((this as any).class || "");
    const filtered = this
      .splitClasses(existing)
      .filter(
        (c) =>
          c !== "xdivider" &&
          c !== "xdivider--h" &&
          c !== "xdivider--v" &&
          c !== "xdivider--muted"
      );

    const tokens = [
      "xdivider",
      orientation === "vertical" ? "xdivider--v" : "xdivider--h",
      ...filtered,
    ];
    if (muted) tokens.push("xdivider--muted");

    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private applyLayout() {
    const orientation = this.__orientation;

    const nextClass = this.buildClassName(orientation, this.__muted);
    (this as any).class = nextClass;

    const baseStyle = this.stripManagedStyles(String((this as any).style || ""));
    const styleParts: string[] = [];
    if (baseStyle) styleParts.push(baseStyle);

    styleParts.push(`--xdivider-thickness:${this.__thickness}px`);
    if (this.__length) styleParts.push(`--xdivider-length:${this.__length}`);
    if (typeof this.__inset === "number") {
      styleParts.push(`--xdivider-inset:${this.__inset}px`);
    }

    const nextStyle = styleParts.join("; ");
    (this as any).style = nextStyle;
  }

  set _orientation(value: XDividerOrientation | undefined) {
    this.__orientation = this.normalizeOrientation(value);
    this.applyLayout();
  }

  get _orientation() {
    return this.__orientation;
  }

  set _thickness(value: number | undefined) {
    this.__thickness = this.normalizeThickness(value);
    this.applyLayout();
  }

  get _thickness() {
    return this.__thickness;
  }

  set _length(value: string | undefined) {
    this.__length = value;
    this.applyLayout();
  }

  get _length() {
    return this.__length;
  }

  set _inset(value: number | undefined) {
    this.__inset = value;
    this.applyLayout();
  }

  get _inset() {
    return this.__inset;
  }

  set _muted(value: boolean | undefined) {
    this.__muted = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _muted() {
    return this.__muted;
  }
}
