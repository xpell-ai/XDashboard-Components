import { XUIObject } from "@xpell/ui";
import type { XUIObjectData, XpellSkill } from "@xpell/ui";

export interface XSpacerData extends XUIObjectData {
  _type?: "spacer";
  _direction?: "vertical" | "horizontal";
}

type XSpacerDirection = "vertical" | "horizontal";

export class XSpacer extends XUIObject {
  static _xtype = "spacer";
  static _skill: XpellSkill = {
    _id: "spacer",
    _title: "XSpacer",
    _version: "1.0.0",
    _active: true,
    _type: "view-skill",
    _requires: ["xuiobject"],

    _description:
      "Dashboard spacing primitive for adding fixed vertical or horizontal empty space between UI elements.",

    _fields: {
      _direction: "Spacer direction: vertical or horizontal.",
      _size: "Spacer size in pixels. Defaults to 16.",
      class: "Optional CSS classes. xspacer is applied automatically."
    },

    _core_rules: [
      "Use spacer only for simple fixed spacing between elements.",
      "Use _direction:'vertical' for vertical gaps.",
      "Use _direction:'horizontal' for horizontal gaps.",
      "Prefer stack/grid _gap for normal layout spacing.",
      "Do not use spacer as a content container."
    ],

    _canonical_examples: [
      {
        _type: "spacer",
        _direction: "vertical",
        _size: 16
      }
    ]
  };
  private __size = 16;
  private __direction: XSpacerDirection = "vertical";

  private static readonly managedStyles = new Set(["width", "height", "min-width", "min-height"]);

  constructor(data: any) {
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



  set _direction(value: XSpacerDirection | undefined) {
    this.__direction = this.normalizeDirection(value);
    this.applyLayout();
  }

  get _direction() {
    return this.__direction;
  }
}
