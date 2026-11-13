import { XUIObject } from "@xpell/ui";
import type { XUIObjectData, XpellSkill } from "@xpell/ui";
import { XSHELL_SKILL } from "./xshell.skill";

export interface XShellData extends XUIObjectData {
  _type: "xshell";
  _sidebar?: XUIObjectData;
  _scroll?: boolean;
  _children?: XUIObjectData[];
  class?: string;
}

export class XShell extends XUIObject {
  static _xtype = "xshell";
  static _skill: XpellSkill = XSHELL_SKILL;

  private __sidebar?: XUIObjectData;
  private __scroll = true;
  private __main_children: XUIObjectData[] = [];
  private readonly __main_id: string;

  constructor(data: XShellData) {
    const defaults: any = {
      _type: XShell._xtype,
      class: "xshell",
      _html_tag: "div",
    };

    const userChildren = Array.isArray((data as any)._children)
      ? [...((data as any)._children as XUIObjectData[])]
      : [];
    if (Array.isArray((data as any)._children)) (data as any)._children = [];

    super(data, defaults, true);
    this.__main_id = this._id + "_main";
    this.__main_children = userChildren;

    this.parse(data);
    this.applyProps();
    this.applyClassName();
    this.buildShell();
  }

  private normalizeBoolean(value: any, fallback: boolean): boolean {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return fallback;
  }

  private splitClasses(value: string): string[] {
    return value
      .split(/\s+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  private applyProps() {
    this.__sidebar =
      (this as any)._sidebar && typeof (this as any)._sidebar === "object"
        ? ((this as any)._sidebar as XUIObjectData)
        : undefined;
    this.__scroll = this.normalizeBoolean((this as any)._scroll, true);
  }

  private applyClassName() {
    const existing = this.splitClasses(String((this as any).class || "")).filter(
      (token) =>
        token !== "xshell" &&
        token !== "xshell--with-sidebar" &&
        token !== "xshell--single" &&
        token !== "xshell--main-scroll" &&
        token !== "xshell--body-flow"
    );
    const tokens = [
      "xshell",
      this.__sidebar ? "xshell--with-sidebar" : "xshell--single",
      this.__scroll ? "xshell--main-scroll" : "xshell--body-flow",
      ...existing,
    ];
    (this as any).class = Array.from(new Set(tokens)).join(" ");
  }

  private withClass(value: XUIObjectData, className: string): XUIObjectData {
    const existing = typeof (value as any).class === "string" ? (value as any).class : "";
    if (!existing.trim()) return { ...value, class: className };
    if (this.splitClasses(existing).includes(className)) return value;
    return { ...value, class: `${existing} ${className}` };
  }

  private buildShell() {
    const children: XUIObjectData[] = [];
    if (this.__sidebar) {
      children.push(this.withClass(this.__sidebar, "xshell__sidebar"));
    }

    children.push({
      _type: "view",
      _id: this.__main_id,
      class: "xshell__main",
      _children: this.__main_children,
    });

    children.forEach((child) => this.append(child));
  }
}
