import { XUI, XUIObject } from "@xpell/ui";
import type { XUIObjectData, XObjectData } from "@xpell/ui";

export interface XBadgeData extends XUIObjectData {
  _type: "badge";
  _text?: string;
  _variant?: "default" | "success" | "warn" | "error" | "info";
  _size?: "sm" | "md";
  _pill?: boolean;
  _dot?: boolean;
  _title?: string;
  class?: string;
}

type XBadgeVariant = "default" | "success" | "warn" | "error" | "info";
type XBadgeSize = "sm" | "md";

export class XBadge extends XUIObject {
  static _xtype = "badge";

  private __text = "";
  private __variant: XBadgeVariant = "default";
  private __size: XBadgeSize = "md";
  private __pill = true;
  private __dot = false;
  private __title?: string;

  private __dot_id: string;
  private __text_id: string;

  constructor(data: XBadgeData) {
    const defaults: any = {
      _type: XBadge._xtype,
      class: "xbadge",
      _html_tag: "span",
    };

    super(data, defaults, true);
    this.__dot_id = this._id + "_dot";
    this.__text_id = this._id + "_text";
    this.parse(data);
    this.applyProps();
    this.buildSkeleton();
    this.applyLayout();
    this.applyText();
  }

  private normalizeVariant(value?: XBadgeVariant): XBadgeVariant {
    if (value === "success" || value === "warn" || value === "error" || value === "info") {
      return value;
    }
    return "default";
  }

  private normalizeSize(value?: XBadgeSize): XBadgeSize {
    return value === "sm" ? "sm" : "md";
  }

  private normalizeBoolean(value?: boolean): boolean {
    return value === true || value === ("true" as any);
  }

  private applyProps() {
    this.__text = (this as any)._text ? String((this as any)._text) : "";
    this.__variant = this.normalizeVariant((this as any)._variant);
    this.__size = this.normalizeSize((this as any)._size);
    if ((this as any)._pill === undefined) this.__pill = true;
    else this.__pill = this.normalizeBoolean((this as any)._pill);
    this.__dot = this.normalizeBoolean((this as any)._dot);
    this.__title = (this as any)._title ? String((this as any)._title) : undefined;
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private buildClassName(): string {
    const existing = String((this as any).class || "");
    const remove = new Set([
      "xbadge",
      "xbadge--default",
      "xbadge--success",
      "xbadge--warn",
      "xbadge--error",
      "xbadge--info",
      "xbadge--sm",
      "xbadge--md",
      "xbadge--pill",
      "xbadge--dot",
    ]);
    const filtered = this
      .splitClasses(existing)
      .filter((c) => !remove.has(c));

    const tokens = [
      "xbadge",
      `xbadge--${this.__variant}`,
      `xbadge--${this.__size}`,
      ...filtered,
    ];
    if (this.__pill) tokens.push("xbadge--pill");
    if (this.__dot) tokens.push("xbadge--dot");

    return Array.from(new Set(tokens.filter(Boolean))).join(" ");
  }

  private buildSkeleton() {
    const dot: XObjectData = {
      _type: "label",
      _id: this.__dot_id,
      class: "xbadge__dot",
    };

    const text: XObjectData = {
      _type: "label",
      _id: this.__text_id,
      class: "xbadge__text",
    };

    this.append(dot);
    this.append(text);
  }

  private applyText() {
    const textObj = XUI.getObject(this.__text_id) as any;
    if (textObj) textObj._text = this.__text;
  }

  private applyLayout() {
    const nextClass = this.buildClassName();
    (this as any).class = nextClass;
    if (this._dom_object) this._dom_object.className = nextClass;

    if (this.__title) {
      if (this._dom_object) this._dom_object.setAttribute("title", this.__title);
    } else {
      if (this._dom_object) this._dom_object.removeAttribute("title");
    }
  }

  set _text(text: string) {
    this.setText(String(text ?? ""));
  }

  get _text(): string {
    return this.__text;
  }

  setText(text: string) {
    this.__text = text;
    this.applyText();
  }

  setVariant(variant: XBadgeVariant) {
    this.__variant = this.normalizeVariant(variant);
    this.applyLayout();
  }

  setDot(enabled: boolean) {
    this.__dot = this.normalizeBoolean(enabled);
    this.applyLayout();
  }

  setPill(enabled: boolean) {
    this.__pill = this.normalizeBoolean(enabled);
    this.applyLayout();
  }

  set _variant(value: XBadgeVariant | undefined) {
    this.__variant = this.normalizeVariant(value);
    this.applyLayout();
  }

  get _variant() {
    return this.__variant;
  }

  set _size(value: XBadgeSize | undefined) {
    this.__size = this.normalizeSize(value);
    this.applyLayout();
  }

  get _size() {
    return this.__size;
  }

  set _pill(value: boolean | undefined) {
    this.__pill = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _pill() {
    return this.__pill;
  }

  set _dot(value: boolean | undefined) {
    this.__dot = this.normalizeBoolean(value);
    this.applyLayout();
  }

  get _dot() {
    return this.__dot;
  }

  set _title(value: string | undefined) {
    this.__title = value;
    this.applyLayout();
  }

  get _title() {
    return this.__title;
  }
}
