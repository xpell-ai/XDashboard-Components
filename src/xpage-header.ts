import { XUIObject } from "@xpell/ui";
import type { XUIObjectData, XpellSkill } from "@xpell/ui";
import { XPAGE_HEADER_SKILL } from "./xpage-header.skill";

export type XPageHeaderDensity = "compact" | "comfortable" | "spacious";

export interface XPageHeaderData extends XUIObjectData {
  _type: "xpage-header";
  _title?: string;
  _subtitle?: string;
  _meta?: string;
  _actions?: XUIObjectData[];
  _density?: XPageHeaderDensity;
  class?: string;
}

export class XPageHeader extends XUIObject {
  static _xtype = "xpage-header";
  static _skill: XpellSkill = XPAGE_HEADER_SKILL;

  private __title = "";
  private __subtitle = "";
  private __meta = "";
  private __actions: XUIObjectData[] = [];
  private __density?: XPageHeaderDensity;

  private readonly __title_id: string;
  private readonly __subtitle_id: string;
  private readonly __meta_id: string;
  private readonly __actions_id: string;

  constructor(data: XPageHeaderData) {
    const defaults: any = {
      _type: XPageHeader._xtype,
      class: "xpage-header",
      _html_tag: "header",
    };

    super(data, defaults, true);
    this.__title_id = this._id + "_title";
    this.__subtitle_id = this._id + "_subtitle";
    this.__meta_id = this._id + "_meta";
    this.__actions_id = this._id + "_actions";

    this.parse(data);
    this.applyProps();
    this.applyClassName();
    this.buildHeader();
  }

  private normalizeDensity(value: any): XPageHeaderDensity | undefined {
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
    this.__title = (this as any)._title ? String((this as any)._title) : "";
    this.__subtitle = (this as any)._subtitle ? String((this as any)._subtitle) : "";
    this.__meta = (this as any)._meta ? String((this as any)._meta) : "";
    this.__actions = Array.isArray((this as any)._actions)
      ? (this as any)._actions
      : [];
    this.__density = this.normalizeDensity((this as any)._density);
  }

  private applyClassName() {
    const existing = this.splitClasses(String((this as any).class || "")).filter(
      (token) => token !== "xpage-header" && !token.startsWith("xpage-header--density-")
    );
    const tokens = [
      "xpage-header",
      ...(this.__density ? [`xpage-header--density-${this.__density}`] : []),
      ...existing,
    ];
    (this as any).class = Array.from(new Set(tokens)).join(" ");
  }

  private buildHeader() {
    const headingChildren: XUIObjectData[] = [];
    if (this.__title.trim()) {
      headingChildren.push({
        _type: "label",
        _id: this.__title_id,
        _html_tag: "h1",
        class: "xpage-header__title",
        _text: this.__title.trim(),
      });
    }
    if (this.__subtitle.trim()) {
      headingChildren.push({
        _type: "label",
        _id: this.__subtitle_id,
        _html_tag: "p",
        class: "xpage-header__subtitle",
        _text: this.__subtitle.trim(),
      });
    }
    if (this.__meta.trim()) {
      headingChildren.push({
        _type: "label",
        _id: this.__meta_id,
        _html_tag: "p",
        class: "xpage-header__meta",
        _text: this.__meta.trim(),
      });
    }

    const children: XUIObjectData[] = [
      {
        _type: "view",
        _id: this._id + "_heading",
        class: "xpage-header__heading",
        _children: headingChildren,
      },
    ];

    if (this.__actions.length) {
      children.push({
        _type: "toolbar",
        _id: this.__actions_id,
        class: "xpage-header__actions",
        _variant: "plain",
        _density: this.__density ?? "comfortable",
        _wrap: true,
        _children: this.__actions,
      });
    }

    children.forEach((child) => this.append(child));
  }
}
