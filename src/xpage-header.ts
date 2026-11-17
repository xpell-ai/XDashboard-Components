import { XUI, XUIObject } from "@xpell/ui";
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
  private __initializing = true;
  private __actions_dirty = true;

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
    this.__initializing = false;
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

    children.forEach((data) => {
      const child = this.ui_children.find((child) => child._id === data._id);
      if (child) {
        if (data._id === this.__actions_id && this.__actions_dirty) {
          // Recreate owned actions so edits include handlers, not only DOM fields.
          [...child.ui_children].forEach((action) => XUI.remove(action._id));
        }
        const nextIds = new Set((data._children ?? []).map((child) => child._id));
        child.ui_children.forEach((previous) => {
          if (!nextIds.has(previous._id)) XUI.remove(previous._id);
        });
        child.update(data);
      } else this.append(data);
    });
    if (!this.__actions.length) {
      const actions = this.ui_children.find((child) => child._id === this.__actions_id);
      if (actions) XUI.remove(actions._id);
    }
    this.__actions_dirty = false;
  }

  set _title(value: string | undefined) {
    this.__title = String(value ?? "");
    if (!this.__initializing) this.buildHeader();
  }

  get _title() { return this.__title; }

  set _subtitle(value: string | undefined) {
    this.__subtitle = String(value ?? "");
    if (!this.__initializing) this.buildHeader();
  }

  get _subtitle() { return this.__subtitle; }

  set _meta(value: string | undefined) {
    this.__meta = String(value ?? "");
    if (!this.__initializing) this.buildHeader();
  }

  get _meta() { return this.__meta; }

  set _actions(value: XUIObjectData[] | undefined) {
    this.__actions = Array.isArray(value) ? [...value] : [];
    this.__actions_dirty = true;
    if (!this.__initializing) this.buildHeader();
  }

  get _actions() { return this.__actions; }

  update(next: XUIObjectData) {
    if (!next) return;
    super.update({ ...next, class: next.class ?? (this as any).class });
    for (const field of ["_title", "_subtitle", "_meta", "_actions"] as const) {
      if (Object.prototype.hasOwnProperty.call(next, field)) {
        (this as any)[field] = (next as any)[field];
      }
    }
    this.buildHeader();
  }
}
