import { XUIObject } from "@xpell/ui";
import type { XUIObjectData, XpellSkill } from "@xpell/ui";
import { XPAGE_SKILL } from "./xpage.skill";

export type XPageWidth = "full" | "contained" | "readable";
export type XPageDensity = "compact" | "comfortable" | "spacious";

export interface XPageData extends XUIObjectData {
  _type: "xpage";
  _width?: XPageWidth;
  _density?: XPageDensity;
  _children?: XUIObjectData[];
  class?: string;
}

export class XPage extends XUIObject {
  static _xtype = "xpage";
  static _skill: XpellSkill = XPAGE_SKILL;

  private __width: XPageWidth = "contained";
  private __density?: XPageDensity;

  constructor(data: XPageData) {
    const defaults: any = {
      _type: XPage._xtype,
      class: "xpage",
      _html_tag: "main",
    };

    super(data, defaults, true);
    this.parse(data);
    this.applyProps();
    this.applyClassName();
  }

  private normalizeWidth(value: any): XPageWidth {
    if (value === "full" || value === "readable") return value;
    return "contained";
  }

  private normalizeDensity(value: any): XPageDensity | undefined {
    if (value === "compact" || value === "comfortable" || value === "spacious") return value;
    return undefined;
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private applyProps() {
    this.__width = this.normalizeWidth((this as any)._width);
    this.__density = this.normalizeDensity((this as any)._density);
  }

  private applyClassName() {
    const existing = this.splitClasses(String((this as any).class || "")).filter(
      (token) =>
        token !== "xpage" &&
        !token.startsWith("xpage--width-") &&
        !token.startsWith("xpage--density-")
    );
    const tokens = [
      "xpage",
      `xpage--width-${this.__width}`,
      ...(this.__density ? [`xpage--density-${this.__density}`] : []),
      ...existing,
    ];
    (this as any).class = Array.from(new Set(tokens)).join(" ");
  }

  set _width(value: XPageWidth | undefined) {
    this.__width = this.normalizeWidth(value);
    this.applyClassName();
  }

  get _width() {
    return this.__width;
  }
}
